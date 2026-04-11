# Bug Analysis: Issue #299224

## Understanding the Bug
On macOS, sandboxed `run_in_terminal` commands can still fail when the agent tries to use temporary storage. The issue thread shows that this is specific to macOS, where writes that look like "tmp" usage do not line up cleanly with the sandbox's writable path list. By the parent commit, the sandbox service already tries to steer commands away from the system temp directory by setting `TMPDIR` and `CLAUDE_TMPDIR`, but the remaining implementation is still brittle.

## Git History Analysis
The initial 24-hour window before the parent commit only surfaced the parent merge commit, so I expanded to the recent file history of `src/vs/workbench/contrib/terminalContrib/chatAgentTools/common/terminalSandboxService.ts`.

Relevant commits in the bounded 7-day window:

- `8a3bfca4c68` - rewrote the sandbox integration to generate a JSON settings file and manage writable paths directly in `TerminalSandboxService`.
- `a76935c6b35` - added workspace folders to the default `allowWrite` list.
- `b978bf74b28` - moved sandbox temp handling away from the platform temp dir into a VS Code-managed temp location, set `TMPDIR` and `CLAUDE_TMPDIR`, and added cleanup on shutdown.

These commits show that temp handling was already being reworked, but the pre-fix state still gives each sandbox a single shared temp root and relies on prompt-level guidance to keep commands off `/tmp`.

### Time Window Used
- Initial: 24 hours
- Final: 7 days (expanded twice)

## Root Cause
The sandbox service points commands at a shared managed temp root instead of an isolated sandbox-scoped temp directory, so macOS temp usage is still fragile and the writable temp scope is broader than the exact path each sandbox instance should use.

## Proposed Fix

### Option A: Targeted Fix (Recommended)
Create a dedicated per-sandbox temp subdirectory and use that exact directory everywhere the sandbox refers to writable temporary storage.

**Affected Files:**
- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/common/terminalSandboxService.ts`
- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/test/browser/terminalSandboxService.test.ts`

**Changes Required:**
1. Keep the existing managed temp root under the product data folder, but derive a sandbox-specific child directory from it using the already-generated sandbox settings id.
2. Create that child directory during `_initTempDir()` and point both `TMPDIR` and `CLAUDE_TMPDIR` at the scoped child directory rather than the shared root.
3. Add only the scoped temp directory to `allowWrite`, so sandboxed commands get writable temp storage without broad access to the entire managed tmp root.
4. Clean up only that sandbox-specific temp directory on shutdown.
5. Extend `terminalSandboxService.test.ts` to verify the temp dir is scoped per sandbox instance, used in `wrapCommand()`, included in `allowWrite`, and deleted on shutdown.

**Code Sketch:**
```ts
private _getSandboxTempRoot(remoteEnv: IRemoteAgentEnvironment | null): URI | undefined {
	if (remoteEnv?.userHome) {
		return URI.joinPath(
			remoteEnv.userHome,
			this._productService.serverDataFolderName ?? this._productService.dataFolderName,
			TerminalSandboxService._sandboxTempDirName
		);
	}

	const nativeEnv = this._environmentService as IEnvironmentService & { userHome?: URI };
	if (nativeEnv.userHome) {
		return URI.joinPath(nativeEnv.userHome, this._productService.dataFolderName, TerminalSandboxService._sandboxTempDirName);
	}

	return undefined;
}

private _getSandboxTempDirPath(remoteEnv: IRemoteAgentEnvironment | null): URI | undefined {
	const root = this._getSandboxTempRoot(remoteEnv);
	return root && this._sandboxSettingsId ? URI.joinPath(root, this._sandboxSettingsId) : undefined;
}
```

This keeps the sandbox writable temp area explicit and isolated instead of depending on a shared tmp directory or on `/tmp` semantics.

### Option B: Compatibility Fallback (Optional)
If macOS tools still hard-code `/tmp` in practice, add a narrow compatibility layer in `TerminalSandboxService` that maps known macOS temp aliases to the sandbox-scoped temp directory. I would treat this as a fallback only, because broadly allowing `/tmp` weakens the sandbox more than necessary.

## Confidence Level: Medium

## Reasoning
The parent commit already contains prompt guidance telling the model to avoid `/tmp`, plus explicit `TMPDIR` and `CLAUDE_TMPDIR` handling. That means the remaining fix should not rely on even more prompt text; it should make the writable temp path itself correct and tightly scoped. A per-sandbox temp directory addresses the underlying need for writable temporary storage, avoids reopening the full macOS `/tmp` surface, and fits the current implementation pattern and recent history in `TerminalSandboxService`.