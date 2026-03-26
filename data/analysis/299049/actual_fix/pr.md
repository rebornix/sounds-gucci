# PR #300604: Fix clipped items in AI Customization tree

## Summary
- replace the extra group-header top margin with padding so spacing stays within the layout flow
- remove vertical margins from customization list items and MCP server items so the final row is no longer clipped

## Testing
- npm run compile-check-ts-native

Fixes #299049