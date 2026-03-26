# PR #300453: Update action for the title bar

Added title bar UI for updates.
Added setting to control the new UI - when enabled, other update UI (status bar, notifications, gear glyph) are disabled.
Added detection for case when updates are disable by policy.
Added flag to Idle state to indicate if we came from explicit Checking state with no updates available.
New UI will show tooltip automatically under certain conditions.
Tooltip is shared between status bar and title bar controls.

Fixes #298768 
Fixes #295781 
Fixes #293891