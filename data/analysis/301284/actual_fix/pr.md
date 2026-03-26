# PR #301289: fix: serialize concurrent marketplace repo clones via SequencerByKey

Adding a new plugin marketplace could trigger concurrent `ensureRepository` calls for the same repo. Both would see the directory missing, both would attempt `git clone`, and the second would fail with `fatal: could not create work tree dir '...': File exists`.

- **`AgentPluginRepositoryService`**: add `_cloneSequencer: SequencerByKey<string>` and wrap `ensureRepository` body in `_cloneSequencer.queue(marketplace.canonicalId, ...)`. Concurrent calls for the same canonical ID are serialized — the second waits for the first, then finds the directory already exists and returns early.
- **Test**: add a test that fires two concurrent `ensureRepository` calls for the same marketplace and asserts `_git.cloneRepository` is invoked exactly once.

<!-- START COPILOT CODING AGENT TIPS -->
---

📍 Connect Copilot coding agent with [Jira](https://gh.io/cca-jira-docs), [Azure Boards](https://gh.io/cca-azure-boards-docs) or [Linear](https://gh.io/cca-linear-docs) to delegate work to Copilot in one click without leaving your project management tool.