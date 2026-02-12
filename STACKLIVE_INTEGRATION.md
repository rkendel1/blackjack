# StackLive Platform Integration

This document explains the changes made to `rollup.config.js` to ensure compatibility with the StackLive platform.

## Overview

The blackjack repository has been configured to work seamlessly when integrated into the StackLive platform. Two custom Rollup plugins have been added to match the StackLive platform's build configuration.

## Web Components in This Repository

The following web components are exported and ready for use in the StackLive platform:

1. **sl-arvr-scene** - AR/VR scene container with WebXR support
2. **sl-arvr-avatar** - 3D avatar component for AR/VR experiences
3. **sl-arvr-filter** - Visual filter/effect component for AR/VR
4. **sl-arvr-spatial** - Spatial object placement component
5. **sl-messaging** - iMessage-style messaging component with video calls
6. **sl-tictactoe** - Interactive Tic-Tac-Toe game component

All components use the `sl-` prefix as required by the StackLive platform conventions.

## Changes Made

### 1. guardCustomElementsDefine() Plugin

**Purpose:** Prevents "already registered" errors when web components are loaded multiple times (e.g., during hot reload or when scripts are loaded more than once).

**Implementation:**
```javascript
function guardCustomElementsDefine() {
  return {
    name: 'guard-custom-elements-define',
    renderChunk(code, chunk, options) {
      // Transforms: customElements.define("element-name", ...)
      // Into: customElements.get("element-name") || customElements.define("element-name", ...)
      let modifiedCode = code.replace(
        /customElements\.define\(["']([^"']+)["']/g,
        (match, elementName) => {
          return `customElements.get("${elementName}")||customElements.define("${elementName}"`;
        }
      );
      return { code: modifiedCode, map: null };
    }
  };
}
```

**How it works:**
- Uses the `renderChunk` hook which runs AFTER minification
- Transforms `customElements.define("sl-messaging", ...)` 
- Into `customElements.get("sl-messaging")||customElements.define("sl-messaging", ...)`
- The `||` operator short-circuits: if `customElements.get()` returns a truthy value (the already-registered element), it skips the `define()` call
- If `customElements.get()` returns `undefined` (element not registered), it proceeds to call `define()`

**Benefits:**
- Safe to load the bundle multiple times
- Compatible with hot module replacement
- Works in both development and production builds
- Survives minification by terser

### 2. injectProcessEnvPolyfill() Plugin

**Purpose:** Provides browser compatibility for code that references `process.env` (common in React and Node.js libraries).

**Implementation:**
```javascript
function injectProcessEnvPolyfill() {
  return {
    name: 'inject-process-env-polyfill',
    generateBundle(options, bundle) {
      const componentsNeedingPolyfill = [
        // Add component names here if they encounter process.env errors
      ];
      
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        const needsPolyfill = componentsNeedingPolyfill.some(name => 
          fileName.includes(name) || fileName.endsWith(name)
        );
        
        if (chunk.type === 'chunk' && chunk.code && needsPolyfill) {
          const polyfill = `// Browser polyfill for process.env
if (typeof process === 'undefined') {
  window.process = { env: { NODE_ENV: 'production' } };
}

`;
          chunk.code = polyfill + chunk.code;
          console.log(`✓ Injected process.env polyfill into ${fileName}`);
        }
      }
    }
  };
}
```

**Current status:**
- Plugin is installed and ready to use
- Currently, no components in this repository need the polyfill (no React dependencies)
- The `componentsNeedingPolyfill` array is empty
- If future components need it, simply add their file names to the array

**How to enable for a component:**
```javascript
const componentsNeedingPolyfill = [
  'MyReactComponent.js',  // Example
];
```

## Plugin Ordering

The plugins are positioned in the Rollup configuration to ensure correct operation:

1. **alias** - Resolves `$lib` path aliases
2. **rawPlugin** - Handles `?raw` imports
3. **url** - Handles asset files
4. **guardCustomElementsDefine** ← Added here (before Svelte compilation)
5. **injectProcessEnvPolyfill** ← Added here (before Svelte compilation)
6. **svelte** (for .wc.svelte files) - Compiles web components
7. **svelte** (for .svelte files) - Compiles regular components
8. **css** - Extracts CSS
9. **resolve** - Resolves node_modules
10. **commonjs** - Converts CommonJS to ES6
11. **typescript** - Compiles TypeScript
12. **terser** (production only) - Minifies code

The `guardCustomElementsDefine` plugin uses `renderChunk` which runs AFTER terser, ensuring guards survive minification.

## Verification

### Production Build
```bash
npm run build
# Verify guards in bundle
grep -o 'customElements.get("[^"]*")||customElements.define' public/build/bundle.js
```

Expected output:
```
customElements.get("sl-arvr-scene")||customElements.define
customElements.get("sl-arvr-avatar")||customElements.define
customElements.get("sl-arvr-filter")||customElements.define
customElements.get("sl-arvr-spatial")||customElements.define
customElements.get("sl-messaging")||customElements.define
customElements.get("sl-tictactoe")||customElements.define
```

### Development Build
```bash
ROLLUP_WATCH=1 npm run build
# Same verification
```

## Compatibility Notes

### Backward Compatibility
- ✅ All existing functionality preserved
- ✅ Build process unchanged for regular use
- ✅ No breaking changes to existing code
- ✅ Web components work exactly as before
- ✅ Both development and production builds function correctly

### StackLive Platform Compatibility
- ✅ Matches StackLive rollup.config.js plugin structure
- ✅ Uses identical guard implementation approach
- ✅ Uses identical polyfill implementation approach
- ✅ Ready to be dropped into StackLive platform
- ✅ All 6 web components will work without "already registered" errors

## Future Considerations

### Adding New Web Components
1. Create component file with `.wc.svelte` extension
2. Add `<svelte:options customElement="sl-component-name" />` at the top
3. Export from `src/lib/Components/webcomponents/index.ts`
4. Build will automatically include the guard protection

### Adding React Components
If you need to add React-based components in the future:
1. Install React dependencies
2. Create the component
3. Add the output filename to `componentsNeedingPolyfill` array in `rollup.config.js`
4. The polyfill will be automatically injected

## Testing

### Manual Testing
1. Load the bundle in a browser
2. Load it again (simulating reload)
3. Verify no "already defined" errors in console
4. Verify all web components render correctly

### Integration Testing
When integrating into StackLive platform:
1. Copy this repository into StackLive components directory
2. Build the StackLive platform
3. Verify all 6 components load without errors
4. Test hot reload functionality
5. Verify components work in both development and production modes

## Summary

The changes ensure that this repository's web components can be seamlessly integrated into the StackLive platform while maintaining full backward compatibility. The implementation follows StackLive's architectural patterns and best practices.
