# Bug Analysis: Issue #290642

## Understanding the Bug

**Issue**: Running chat not marked as 'in-progress' if currently viewed

**Symptoms**: 
- When a chat session is running and currently being viewed, it doesn't show as "in-progress" in the Agent Status indicator
- This can cause filters to be incorrectly cleared when they shouldn't be
- Users expect running sessions to be counted as "in-progress" regardless of whether they're currently viewing them

**Background**:
Commit `87e6108688849dc201fcd2b50e4e36cd62a6a53e` intentionally excluded sessions with open widgets from the active/unread counts to fix issue #289831 (preventing UI jitter where the title control would increase and shrink with each chat interaction). However, this created a new problem where the filter-clearing logic would incorrectly determine that there are no active sessions when the only active session is currently open.

## Git History Analysis

### Time Window Used
- Initial: 24 hours - Not sufficient
- Expanded to file-specific history to find relevant context
- Found the problematic commit: `87e6108688849dc201fcd2b50e4e36cd62a6a53e` (Jan 24, 2026)

### Relevant Commits

1. **Commit `87e6108688849dc201fcd2b50e4e36cd62a6a53e`** (Jan 24, 2026)
   - Title: "Agents control: every chat interaction shows 1-progress, 1-unread (fix #289831)"
   - Changed: `agentTitleBarStatusWidget.ts`
   - Added: `!this.chatWidgetService.getWidgetBySessionResource(s.resource)` filter to exclude open widgets from counts
   - This was intentional to prevent UI jitter but created the current bug

2. **Commit `b58c8d223a1`** (Jan 27, 2026 - after the issue was reported)
   - Title: "always show active sessions but prevent double-counting as unread"
   - An earlier attempt to fix issue #290642
   - Removed the widget filter from activeSessions but tried a different approach

## Root Cause

The `_getSessionStats()` method filters out sessions with open widgets when calculating `activeSessions` and `unreadSessions`:

```typescript
const activeSessions = filteredSessions.filter(s => 
    isSessionInProgressStatus(s.status) && 
    !s.isArchived() && 
    !this.chatWidgetService.getWidgetBySessionResource(s.resource)  // <-- This exclusion
);
```

The problem occurs in `_clearFilterIfCategoryEmpty()` which uses these filtered counts to determine if a filter should be cleared:

```typescript
private _clearFilterIfCategoryEmpty(hasUnreadSessions: boolean, hasActiveSessions: boolean): void {
    const { isFilteredToUnread, isFilteredToInProgress } = this._getCurrentFilterState();
    
    // Restore user's filter if filtered category is now empty
    if ((isFilteredToUnread && !hasUnreadSessions) || (isFilteredToInProgress && !hasActiveSessions)) {
        this._restoreUserFilter();
    }
}
```

**The Issue**: If a user is viewing an active session:
1. The session is excluded from the `activeSessions` count (due to the widget filter)
2. `hasActiveSessions` becomes `false`
3. `_clearFilterIfCategoryEmpty` sees no active sessions and clears the "in-progress" filter
4. This is incorrect behavior - there IS an active session, the user is just viewing it!

## Proposed Fix

### Affected Files
- `src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts`

### Changes Required

The fix needs to separate two concerns:
1. **Display counts**: Should exclude open widgets to prevent UI jitter (existing behavior is correct)
2. **Filter management**: Should include ALL sessions to correctly determine if filters should be cleared

**Solution**: Modify `_getSessionStats()` to return both filtered and unfiltered counts, then use the appropriate count in each context.

### Code Changes

**In `_getSessionStats()` method (lines 318-351):**

Add additional return values that include ALL sessions (not excluding open widgets) for use in filter management:

```typescript
private _getSessionStats(): {
    activeSessions: IAgentSession[];
    unreadSessions: IAgentSession[];
    attentionNeededSessions: IAgentSession[];
    hasActiveSessions: boolean;
    hasUnreadSessions: boolean;
    hasAttentionNeeded: boolean;
    // New: counts including open widgets for filter management
    hasActiveSessionsIncludingOpen: boolean;
    hasUnreadSessionsIncludingOpen: boolean;
} {
    const sessions = this.agentSessionsService.model.sessions;

    // Get excluded providers from current filter to respect session type filters
    const currentFilter = this._getStoredFilter();
    const excludedProviders = currentFilter?.providers ?? [];

    // Filter sessions by provider type first (respects session type filters)
    const filteredSessions = excludedProviders.length > 0
        ? sessions.filter(s => !excludedProviders.includes(s.providerType))
        : sessions;

    // For display: exclude open widgets to prevent UI jitter
    const activeSessions = filteredSessions.filter(s => 
        isSessionInProgressStatus(s.status) && 
        !s.isArchived() && 
        !this.chatWidgetService.getWidgetBySessionResource(s.resource)
    );
    const unreadSessions = filteredSessions.filter(s => 
        !s.isRead() && 
        !this.chatWidgetService.getWidgetBySessionResource(s.resource)
    );
    const attentionNeededSessions = filteredSessions.filter(s => 
        s.status === AgentSessionStatus.NeedsInput && 
        !this.chatWidgetService.getWidgetBySessionResource(s.resource)
    );

    // For filter management: include ALL sessions (even open ones)
    const allActiveSessions = filteredSessions.filter(s => 
        isSessionInProgressStatus(s.status) && 
        !s.isArchived()
    );
    const allUnreadSessions = filteredSessions.filter(s => !s.isRead());

    return {
        activeSessions,
        unreadSessions,
        attentionNeededSessions,
        hasActiveSessions: activeSessions.length > 0,
        hasUnreadSessions: unreadSessions.length > 0,
        hasAttentionNeeded: attentionNeededSessions.length > 0,
        // New: for filter management
        hasActiveSessionsIncludingOpen: allActiveSessions.length > 0,
        hasUnreadSessionsIncludingOpen: allUnreadSessions.length > 0,
    };
}
```

**In `_renderBadgeOnlyMode()` method (around line 697):**

Update the call to `_clearFilterIfCategoryEmpty` to use the new inclusive counts:

```typescript
const { 
    activeSessions, 
    unreadSessions, 
    attentionNeededSessions, 
    hasActiveSessionsIncludingOpen,
    hasUnreadSessionsIncludingOpen
} = this._getSessionStats();

// Use inclusive counts for filter management to avoid clearing filters incorrectly
this._clearFilterIfCategoryEmpty(hasUnreadSessionsIncludingOpen, hasActiveSessionsIncludingOpen);
```

**Note**: Keep using the filtered `activeSessions`, `unreadSessions`, etc. for all display purposes. Only the filter-clearing logic needs the inclusive counts.

## Confidence Level: High

## Reasoning

This fix addresses the root cause by:

1. **Preserving the fix for issue #289831**: Display counts still exclude open widgets, preventing UI jitter
2. **Fixing issue #290642**: Filter management now sees all active sessions, including those currently open
3. **Minimal change**: The fix is surgical - it only affects the filter-clearing logic, not the display logic
4. **Logical correctness**: A running session should prevent the "in-progress" filter from being cleared, regardless of whether it's currently being viewed

The fix aligns with the comment in the issue (line 58-59) which stated:
> `_clearFilterIfCategoryEmpty` needs to check for session existence INCLUDING the sessions ignored due to them being open

This approach gives us the best of both worlds:
- No UI jitter (sessions being viewed don't show in the badge count)
- Correct filter behavior (sessions being viewed are still considered when deciding if filters should be cleared)
