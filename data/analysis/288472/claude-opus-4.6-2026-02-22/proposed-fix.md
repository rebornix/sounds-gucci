# Bug Analysis: Issue #288400

## Understanding the Bug

The issue reports that the chat empty view experience is "odd" when running VS Code in OOTB (Out Of The Box) mode. Specifically:

1. The OOTB welcome view is not showing when it should
2. The chat input border is visible/looks wrong in this state

The reporter (bpasero) instructs to "Test with `--transient`" — a temporary profile with no persisted state and no marketplace extensions. In this fresh state, the user should see the full OOTB welcome view (contributed via `chatViewsWelcome` extension point), but instead sees an odd empty chat view.

## Git History Analysis

### Time Window Used
- Initial: 24 hours
- Final: 24 hours (no expansion needed)

### Relevant Commits

**`05e134a0f59` — "Agent sessions: explore a prominent button to create new sessions (fix #288001)"** (Jan 16, 2026, 21:09)
- Same day as the issue was filed
- Added a "New Session" button to the sessions control (side-by-side mode)
- Modified `chatViewPane.ts` and `chatViewPane.css`
- This commit changed the sessions UI which interacts with the welcome/empty view state

## Root Cause

The bug is in `ChatViewPane.shouldShowWelcome()` which does not account for the OOTB (fresh/uninstalled) state. Here's the problematic flow:

1. With `--transient`, VS Code starts fresh — no persisted sessions, no extensions
2. Initially, no agents are registered → `shouldShowWelcome()` returns `true` → VP-level welcome shows
3. The built-in setup agent registers → `onDidChangeAgents()` fires
4. Since there's no persisted/transferred session, `showModel(undefined)` is called
5. `showModel` calls `this.chatService.startSession()` — creating a new empty session
6. Now the widget has a `viewModel` (even though the session has no messages)
7. `shouldShowWelcome()` now returns `false` because:
   ```typescript
   // viewModel exists → !viewModel = false → entire OR branch is false
   const shouldShow = !hasCoreAgent && (!hasDefaultAgent || !this._widget?.viewModel && noPersistedSessions);
   ```
8. The VP welcome hides → `.chat-view-welcome-visible` class is removed
9. The interactive session is shown with an empty chat view (no messages)
10. The sessions control also becomes visible (because `!isShowingWelcome.get()` is true, `isEmpty()` is true, and `!sessionsViewerLimited` is true with default config)
11. Result: user sees an empty sessions panel, empty chat widget with welcome text, and a visible chat input border — the "odd" experience

The "chat input border?" part is a secondary symptom — when the VP welcome properly shows, the interactive session is hidden via `display: none` (from `.chat-view-welcome-visible` CSS), and the input border wouldn't be visible at all.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/widgetHosts/viewPane/chatViewPane.ts`

**Changes Required:**
Modify `shouldShowWelcome()` to return `true` in the OOTB state when the chat widget is empty (no messages). This keeps the VP welcome visible until the user actually starts using Chat.

**Code Sketch:**
```typescript
override shouldShowWelcome(): boolean {
    const noPersistedSessions = !this.chatService.hasSessions();
    const hasCoreAgent = this.chatAgentService.getAgents().some(agent => agent.isCore && agent.locations.includes(ChatAgentLocation.Chat));
    const hasDefaultAgent = this.chatAgentService.getDefaultAgent(ChatAgentLocation.Chat) !== undefined;

    // In OOTB state (not yet installed), keep showing welcome when chat is empty
    const isOotbEmpty = !this.chatEntitlementService.sentiment.installed
        && (!this._widget || this._widget.isEmpty());

    const shouldShow = !hasCoreAgent && (
        !hasDefaultAgent ||
        (!this._widget?.viewModel && noPersistedSessions) ||
        isOotbEmpty
    );

    this.logService.trace(`ChatViewPane#shouldShowWelcome() = ${shouldShow}: hasCoreAgent=${hasCoreAgent} hasDefaultAgent=${hasDefaultAgent} || noViewModel=${!this._widget?.viewModel} && noPersistedSessions=${noPersistedSessions} || isOotbEmpty=${isOotbEmpty}`);

    return !!shouldShow;
}
```

The key addition is the `isOotbEmpty` condition: when `sentiment.installed` is `false` (OOTB/fresh state) AND the widget is empty (no messages), the welcome keeps showing even if a viewModel and default agent exist. Once the user sends a message, `isEmpty()` returns `false` and the welcome naturally hides.

This also indirectly fixes the sessions control visibility issue — when `shouldShowWelcome()` returns `true`, the `ChatViewWelcomeController.isShowingWelcome` will be `true` (assuming matching `chatViewsWelcome` descriptors exist), and the sessions control visibility check (`!this.welcomeController?.isShowingWelcome.get()`) will return `false`, hiding the sessions control.

### Option B: Alternative - Don't auto-start session in OOTB

Instead of modifying `shouldShowWelcome()`, prevent the session auto-start in `onDidChangeAgents()` when in OOTB state:

```typescript
private onDidChangeAgents(): void {
    if (this.chatAgentService.getDefaultAgent(ChatAgentLocation.Chat)) {
        if (!this._widget?.viewModel && !this.restoringSession) {
            const sessionResource = this.getTransferredOrPersistedSessionInfo();

            // Don't auto-start a session in OOTB state — let welcome keep showing
            if (!sessionResource && !this.chatEntitlementService.sentiment.installed) {
                this._onDidChangeViewWelcomeState.fire();
                return;
            }

            this.restoringSession = (sessionResource ? ... : Promise.resolve(undefined)).then(async modelRef => {
                ...
            });
        }
    }
    this._onDidChangeViewWelcomeState.fire();
}
```

**Trade-off:** This approach prevents the session from being created at all in OOTB, which is simpler but might cause issues later when the user transitions from OOTB to installed state (the session needs to be created at some point).

## Confidence Level: Medium

## Reasoning

The root cause is clearly the `shouldShowWelcome()` method not considering the OOTB state. The method was originally designed to show welcome when there's no default agent OR when there's no viewModel and no persisted sessions. But the auto-session-start in `onDidChangeAgents()` creates a viewModel even in OOTB mode, causing the welcome to hide prematurely.

The fix validates against the symptom: if `shouldShowWelcome()` returns `true` in OOTB with empty chat, then:
- The VP welcome shows (assuming `chatViewsWelcome` descriptors match the OOTB context)
- The interactive session is hidden (`display: none` from `.chat-view-welcome-visible`)
- The chat input and its border are NOT visible (inside the hidden interactive session)
- The sessions control is hidden (because `isShowingWelcome.get()` is true)

All three symptoms (missing welcome, odd empty view, border) are resolved.

The exact implementation might differ slightly (e.g., using `noPersistedSessions` instead of `isEmpty()`, or combining with the empty state check differently), but the approach of adding an OOTB condition to `shouldShowWelcome()` should be the right direction. The PR changes only 1 file (`fileCount: 1`), consistent with a change to `chatViewPane.ts`.
