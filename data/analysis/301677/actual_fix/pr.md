# PR #301740: Reapply  #301598 with fixes

Fixes #301677

Fix: We need to pass the cancellation token as the last param for main thread <-> ext host or else it doesn't get revived, so any callers checking it would fail

Tested with old and new sessions