# Bug Analysis: Issue #305345

## Understanding the Bug
The issue is limited to starting a brand-new remote agent-host session from the Sessions app. A user picks model A on the new-session page, sends the first message, and the session UI flips to model B even though the user never changed it. Existing sessions do not show the same behavior, which points to the untitled-to-real session handoff rather than to ordinary message sending.

The issue comments also narrow the scope further:
- It is intermittent at first, which is consistent with picker state being recomputed from persisted/session-type defaults.
- It is specific to new sessions.
- It later stabilizes after newer Insiders builds, which suggests the bug lives in recently changed session-start plumbing.

## Git History Analysis
The incremental time-window search did not find a broader cluster of related commits in the immediate ancestry window.

### Time Window Used
- Initial: 24 hours
- Final: 168 hours (expanded 2 times)

Within that window, the only ancestor commit surfaced was:
- `9a11a08c75a` - `Fix remote agent host session issues in Sessions app (#306560)`

That commit touched the same remote session area:
- `src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.ts`
- `src/vs/workbench/contrib/chat/test/browser/agentSessions/agentHostChatContribution.test.ts`

To get more context, I followed file history and blame on the exact handoff code in `src/vs/workbench/contrib/chat/common/chatService/chatServiceImpl.ts`. The relevant block was introduced and then extended by these earlier commits:
- `f4602885bdb` - `Move untitled session mapping much earlier in request process`
- `630597864f3` - `Refactor session handling in ChatService to capture session options before loading remote sessions (#301557)`
- `ea64ce82683` - `Try storing all chat session options in a map`

Those changes explain the current behavior: the untitled remote session is replaced with a real session before the first request is processed, and only the contributed-session options are explicitly carried forward.

## Root Cause
The bug is in the untitled-to-real remote-session conversion path in `src/vs/workbench/contrib/chat/common/chatService/chatServiceImpl.ts`.

When `sendRequest` sees a non-local untitled session, it:
1. Captures `initialSessionOptions` from the untitled resource.
2. Creates a real session resource with `createNewChatSessionItem(...)`.
3. Loads a brand-new `ChatModel` for that real resource.
4. Copies `initialSessionOptions` onto `model.contributedChatSession`.
5. Returns `newSessionResource` so the widget swaps to the new model.

What it does **not** copy is the selected model from the old input model into the new input model.

That omission matters because remote agent-host sessions use custom, session-targeted models. Once the widget is rebound to the real session, the picker state can be reinitialized from session-type-specific defaults or persisted storage for that session type. If the newly created model has no selected model in its `inputModel.state`, the picker is free to drift to whichever model the new session resolves as its default, producing exactly the behavior described in the issue.

The evidence that this is a UI state handoff bug, not a backend session-creation bug, is in `src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.ts` and its tests:
- `AgentHostSessionHandler` already passes `request.userSelectedModelId` into `_createAndSubscribe(...)`.
- Existing tests in `src/vs/workbench/contrib/chat/test/browser/agentSessions/agentHostChatContribution.test.ts` already verify that `createSession(...)` receives the selected model.

So the first request can be created with the right model, while the visible picker still flips afterward because the replacement `ChatModel` never inherited that selection.

One more important detail: `loadRemoteSession(...)` may already seed the new model with partial input state such as `permissionLevel`. Because of that, the fix should **merge** the selected-model state onto the new model, not only copy state when the new model is completely empty.

## Proposed Fix

### Option A: Targeted Fix (Recommended)
**Affected Files:**
- `src/vs/workbench/contrib/chat/common/chatService/chatServiceImpl.ts`
- `src/vs/workbench/contrib/chat/test/common/chatService/chatService.test.ts`

**Changes Required:**
In the untitled non-local session conversion block inside `sendRequest(...)`, capture the selected model from the outgoing request/input state before loading the real session, then explicitly seed the new model's `inputModel` with that same selected model after `loadRemoteSession(...)` succeeds.

Use the submitted model as the authoritative source when available:
- Prefer `options.userSelectedModelId` and look up its metadata through `languageModelsService`.
- Fall back to `oldModel.inputModel.state.get()?.selectedModel` if the identifier cannot be resolved.

After the new model is loaded, merge the selected model into `newModel.inputModel` with `setState({ selectedModel: ... })`.

This keeps the current `initialSessionOptions` behavior intact while ensuring the model picker on the real session starts from the user's explicit choice instead of from a fresh default.

**Code Sketch:**
```ts
// Before replacing the untitled model
const previousSelectedModel = (() => {
	const identifier = options?.userSelectedModelId;
	const metadata = identifier ? this.languageModelsService.lookupLanguageModel(identifier) : undefined;
	if (identifier && metadata) {
		return { identifier, metadata };
	}

	return model.inputModel.state.get()?.selectedModel;
})();

const newItem = await this.chatSessionService.createNewChatSessionItem(
	getChatSessionType(sessionResource),
	{ prompt: requestText, command: commandPart?.text, initialSessionOptions },
	CancellationToken.None,
);

if (newItem) {
	model = (await this.loadRemoteSession(newItem.resource, model.initialLocation, CancellationToken.None))?.object as ChatModel | undefined;
	if (!model) {
		throw new Error(`Failed to load session for resource: ${newItem.resource}`);
	}

	this.chatSessionService.registerSessionResourceAlias(sessionResource, newItem.resource);

	model.setContributedChatSession({
		chatSessionResource: newItem.resource,
		initialSessionOptions,
	});

	if (previousSelectedModel) {
		model.inputModel.setState({ selectedModel: previousSelectedModel });
	}

	sessionResource = newItem.resource;
	newSessionResource = newItem.resource;
}
```

**Test Coverage:**
Extend `src/vs/workbench/contrib/chat/test/common/chatService/chatService.test.ts` alongside the existing `initialSessionOptions` test:
- Create an untitled remote session.
- Seed it with a selected model.
- Send the first request so the session is converted to a real resource.
- Assert that the new model's `inputModel.state.get()?.selectedModel?.identifier` still matches the originally selected model.
- Keep the existing `initialSessionOptions` assertions so the test covers both state transfers together.

### Option B: Broader UI-State Transfer
An alternative is to do the handoff at the widget layer, mirroring the existing `chatMoveActions.ts` pattern that copies input view state when swapping to another model/view. That would likely work too, but it is broader than necessary and less targeted than fixing the actual session replacement path in `ChatServiceImpl`.

## Confidence Level: High

## Reasoning
This explanation matches the observed symptom pattern:
- Only new remote sessions are affected.
- Existing sessions behave correctly because they already have a real `ChatModel` with history/input state.
- The backend session handler already honors `userSelectedModelId`, so the missing piece is the model-picker state on the replacement `ChatModel`.

It also matches the current code shape exactly:
- The service already carries `initialSessionOptions` across the swap.
- It does not carry `selectedModel`.
- The input model merge API already exists and is designed for this kind of state restoration.

The smallest defensible fix is therefore to explicitly propagate the selected model during the untitled-to-real session conversion and add a regression test on that exact path.