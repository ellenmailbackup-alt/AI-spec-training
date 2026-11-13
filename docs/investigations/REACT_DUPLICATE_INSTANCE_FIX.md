# React Duplicate Instance Fix

**Date:** November 2, 2025  
**Issue:** Invalid React hook calls causing "Cannot read properties of null" errors

## Problem Description

The application was experiencing React hook errors in the browser console:

```
Warning: Invalid hook call. Hooks can only be called inside of the body of a function component.
TypeError: Cannot read properties of null (reading 'useState')
TypeError: Cannot read properties of null (reading 'useRef')
TypeError: Cannot read properties of null (reading 'useContext')
```

These errors prevented the application from loading properly, with components like `TooltipProvider`, `Toaster`, and `QueryClientProvider` failing to render.

## Root Cause

The issue was caused by **multiple React instances** being loaded simultaneously in the browser. This occurred due to:

1. **Vite's module graph conflicts**: The `nanoid()` function in `server/vite.ts` generates unique module graph IDs on every request, causing Vite to pre-bundle dependencies multiple times.

2. **Hardcoded version parameter**: The `client/index.html` file had a hardcoded version parameter on the main script tag:
   ```html
   <script type="module" src="/src/main.tsx?v=20251102-storefront-fix"></script>
   ```

3. **Conflicting bundle versions**: When Vite appended its own `nanoid()` version to dependency bundles, the hardcoded version in `index.html` conflicted with it, resulting in the browser loading multiple versions:
   - `chunk-QCHXOAYK.js?v=fa99bd7f` (React - new)
   - `@tanstack_react-query.js?v=86b9964c` (old cached version)
   - Multiple other version hashes

This caused React to be instantiated multiple times, breaking the Rules of Hooks.

## Solution

### Primary Fix
Remove the hardcoded version parameter from `client/index.html`:

```diff
- <script type="module" src="/src/main.tsx?v=20251102-storefront-fix"></script>
+ <script type="module" src="/src/main.tsx"></script>
```

This allows Vite's built-in versioning system (via `nanoid()` in `server/vite.ts`) to handle cache-busting without conflicts.

### Supporting Actions
1. **Clear Vite's dependency cache**:
   ```bash
   rm -rf node_modules/.vite
   ```

2. **Prevent npm lock file conflicts**:
   Created `.npmrc` with:
   ```
   package-lock=false
   ```
   
   This prevents `package-lock.json` from being generated, which can conflict with Replit's package management system.

3. **Restart the development server** to rebuild dependencies with a clean state.

## Verification

After applying the fix, the browser console should show:
- ✅ Clean Vite connection messages
- ✅ Successful app initialization
- ✅ No React hook errors
- ✅ Consistent version hashes across all dependency bundles

## Prevention

To avoid this issue in the future:

1. **Never hardcode version parameters** in `index.html` when using Vite's development server
2. **Let Vite handle cache-busting** through its built-in mechanisms
3. **Keep `.npmrc` with `package-lock=false`** to prevent npm/Replit package manager conflicts
4. **Note that `server/vite.ts` is protected** and should not be edited - it's configured correctly for the Replit environment

## Technical Details

### Why Multiple React Instances Break Hooks

React hooks rely on a single, global React instance to maintain their internal state. When multiple copies of React are loaded:

1. Components import from one React instance
2. Hooks call methods on a different React instance
3. The second instance has no component context, returning `null`
4. Hook calls fail with "Cannot read properties of null"

### Vite's Pre-bundling Process

Vite pre-bundles dependencies for performance:
- Creates optimized bundles in `node_modules/.vite/deps/`
- Appends version hashes for cache invalidation
- Maintains a dependency graph to track what needs rebundling

When version parameters conflict, Vite creates multiple dependency graphs, leading to duplicate React instances in the browser.

## Related Files

- `client/index.html` - Main HTML entry point (DO NOT add version parameters)
- `server/vite.ts` - Vite server configuration (protected, handles versioning via `nanoid()`)
- `.npmrc` - npm configuration to prevent lock file generation
- `node_modules/.vite/` - Vite's dependency cache directory

## References

- [React: Invalid Hook Call Warning](https://reactjs.org/link/invalid-hook-call)
- [Vite: Dependency Pre-Bundling](https://vitejs.dev/guide/dep-pre-bundling.html)
