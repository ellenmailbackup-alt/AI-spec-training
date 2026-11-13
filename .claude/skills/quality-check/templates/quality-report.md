# Code Quality Report

## Architecture Violations
- [file:line] Description of violation (which rule it breaks)

## Large Files (>500 lines)
| File | Lines | Issue |
|------|-------|-------|
| path/to/file.ts | 1234 | Description |

## Dynamic Imports
- [file:line] `await import("...")` — should be static top-level import

## Error Handling Issues
- [file:line] Generic error message: "Failed to X" — needs entity/operation context

## Duplicate Patterns
- [pattern] Found in [N] locations: [file1, file2, ...]

## Transaction Placement
- [file:line] `db.transaction()` found outside *Service.ts

## Recommendations
1. **[HIGH]** Action to take — expected impact
2. **[MEDIUM]** Action to take — expected impact
3. **[LOW]** Action to take — expected impact
