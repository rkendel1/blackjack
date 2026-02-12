# StackLive Platform Drop-In Guide

This guide explains how to integrate the blackjack repository components into the StackLive platform.

## Quick Start

### Option 1: Use the Drop-In Configuration

Copy `rollup.config.stacklive.js` to your StackLive platform and rename it:

```bash
# In your StackLive platform directory
cp /path/to/blackjack/rollup.config.stacklive.js ./rollup.config.js
```

This configuration is ready to use and includes:
- ✅ guardCustomElementsDefine() plugin
- ✅ injectProcessEnvPolyfill() plugin  
- ✅ All 6 blackjack components configured
- ✅ Proper output structure for StackLive
- ✅ Component metadata export

### Option 2: Merge with Existing Configuration

If you already have a StackLive rollup.config.js, add the blackjack components to your existing component list:

```javascript
// Add to your existing COMPONENTS array:
const COMPONENTS = [
  // ... your existing components ...
  
  // Blackjack AR/VR Components
  { name: 'arvr-scene', file: 'ARVRScene.wc.svelte', tag: 'sl-arvr-scene' },
  { name: 'arvr-avatar', file: 'ARVRAvatar.wc.svelte', tag: 'sl-arvr-avatar' },
  { name: 'arvr-filter', file: 'ARVRFilter.wc.svelte', tag: 'sl-arvr-filter' },
  { name: 'arvr-spatial', file: 'ARVRSpatial.wc.svelte', tag: 'sl-arvr-spatial' },
  
  // Blackjack Communication Components
  { name: 'messaging', file: 'MessagingEmbed.wc.svelte', tag: 'sl-messaging' },
  
  // Blackjack Game Components
  { name: 'tictactoe', file: 'TicTacToeEmbed.wc.svelte', tag: 'sl-tictactoe' }
];
```

## Component Details

### AR/VR Components

#### sl-arvr-scene
```html
<sl-arvr-scene 
  userId="user123"
  sessionId="session456"
  mode="ar"
  avatarEnabled="true"
  filtersEnabled="true"
  spatialEnabled="true"
  gestureEnabled="true"
  width="800"
  height="600">
</sl-arvr-scene>
```

**Methods:**
- `startAR()` - Start AR session
- `startVR()` - Start VR session  
- `endSession()` - End current session
- `loadAvatar(url)` - Load 3D avatar
- `applyFilter(filterName)` - Apply visual filter
- `placeObject(object)` - Place spatial object

#### sl-arvr-avatar
```html
<sl-arvr-avatar
  userId="user123"
  modelUrl="/models/avatar.glb"
  skinTone="medium"
  bodyType="average"
  width="400"
  height="400"
  showInfo="true">
</sl-arvr-avatar>
```

#### sl-arvr-filter
```html
<sl-arvr-filter
  filterType="color"
  filterName="vintage"
  intensity="0.8"
  thumbnailUrl="/filters/vintage.png">
</sl-arvr-filter>
```

#### sl-arvr-spatial
```html
<sl-arvr-spatial
  objectId="obj123"
  objectType="model"
  position="0,1,0"
  rotation="0,0,0"
  scale="1,1,1"
  color="#ff0000"
  interactive="true">
</sl-arvr-spatial>
```

### Communication Components

#### sl-messaging
```html
<sl-messaging
  embedId="embed123"
  sessionId="session456"
  enableVideo="true"
  enableAudio="true">
</sl-messaging>
```

**Features:**
- iMessage-style UI
- Real-time text messaging
- Video/audio calls
- Media sharing (images, files)
- Message reactions
- Typing indicators
- Read receipts

### Game Components

#### sl-tictactoe
```html
<sl-tictactoe
  sessionId="session456"
  enableBot="true"
  botDifficulty="hard"
  mode="multiplayer">
</sl-tictactoe>
```

**Modes:**
- `singleplayer` - Play against AI bot
- `multiplayer` - Play against another player via StackLive
- `local` - Two players on same device

**Bot Difficulty:**
- `easy` - Random moves
- `medium` - Strategic moves
- `hard` - Minimax algorithm (unbeatable)

## Directory Structure

When integrating into StackLive, ensure this directory structure:

```
stacklive-platform/
├── rollup.config.js (use rollup.config.stacklive.js)
├── src/
│   └── lib/
│       └── Components/
│           └── webcomponents/
│               ├── ARVRScene.wc.svelte
│               ├── ARVRAvatar.wc.svelte
│               ├── ARVRFilter.wc.svelte
│               ├── ARVRSpatial.wc.svelte
│               ├── MessagingEmbed.wc.svelte
│               ├── TicTacToeEmbed.wc.svelte
│               └── index.ts
└── dist/
    └── components/
        ├── arvr-scene.js
        ├── arvr-avatar.js
        ├── arvr-filter.js
        ├── arvr-spatial.js
        ├── messaging.js
        └── tictactoe.js
```

## Building Components

```bash
# Build all components
npm run build

# Or with custom config
rollup -c rollup.config.stacklive.js

# Watch mode
rollup -c rollup.config.stacklive.js -w
```

## Output

After building, you'll have:

```
dist/components/
├── arvr-scene.js      (~200 KB) - AR/VR scene with WebXR
├── arvr-avatar.js     (~50 KB)  - 3D avatar rendering
├── arvr-filter.js     (~30 KB)  - Visual filters
├── arvr-spatial.js    (~40 KB)  - Spatial objects
├── messaging.js       (~180 KB) - Full messaging system with video
├── tictactoe.js       (~90 KB)  - Game with AI and multiplayer
└── chunks/            - Shared code chunks
```

## Loading Components in StackLive

### Individual Loading
```html
<script type="module" src="/dist/components/messaging.js"></script>
<sl-messaging sessionId="abc123"></sl-messaging>
```

### Dynamic Loading
```javascript
// Load component on demand
async function loadComponent(name) {
  await import(`/dist/components/${name}.js`);
}

// Usage
await loadComponent('messaging');
document.body.innerHTML = '<sl-messaging sessionId="abc123"></sl-messaging>';
```

### Bulk Loading
```html
<!-- Load all blackjack components -->
<script type="module">
  const components = [
    'arvr-scene', 'arvr-avatar', 'arvr-filter', 'arvr-spatial',
    'messaging', 'tictactoe'
  ];
  
  await Promise.all(
    components.map(c => import(`/dist/components/${c}.js`))
  );
</script>
```

## Dependencies

The blackjack components require:

### Runtime Dependencies
- **Svelte 4.x** - Component framework
- **StackLive Multiplayer** (optional) - For multiplayer features
  - WebRTC for real-time communication
  - Convex for data persistence

### Build Dependencies  
- **rollup** - Module bundler
- **rollup-plugin-svelte** - Svelte compiler
- **@rollup/plugin-node-resolve** - Dependency resolution
- **@rollup/plugin-commonjs** - CommonJS support

### Optional Dependencies
- **@types/webxr** - For AR/VR type definitions
- **three.js** - For advanced 3D rendering (if extending AR/VR components)

## Configuration Options

### guardCustomElementsDefine Plugin

Prevents duplicate registration errors:

```javascript
// Transforms:
customElements.define("sl-messaging", ...)

// Into:
customElements.get("sl-messaging") || customElements.define("sl-messaging", ...)
```

**Benefits:**
- Safe hot reload
- Multiple script loads
- No "already defined" errors

### injectProcessEnvPolyfill Plugin

Adds browser compatibility for Node.js code:

```javascript
const componentsNeedingPolyfill = [
  'messaging.js',  // If it uses React or Node.js libraries
];
```

Currently, no blackjack components need this polyfill, but it's configured and ready.

## Integration Checklist

- [ ] Copy web component files to `src/lib/Components/webcomponents/`
- [ ] Copy `rollup.config.stacklive.js` to StackLive platform
- [ ] Install dependencies: `npm install`
- [ ] Build components: `npm run build` or `rollup -c rollup.config.stacklive.js`
- [ ] Verify output in `dist/components/`
- [ ] Test each component in browser
- [ ] Verify no "already registered" errors
- [ ] Test hot reload functionality
- [ ] Integration test with StackLive multiplayer
- [ ] Deploy to production

## Testing

### Component Registration Test
```javascript
// Test that components can be loaded multiple times
for (let i = 0; i < 3; i++) {
  await import('/dist/components/messaging.js');
}
// Should NOT throw "already defined" error
```

### Component Functionality Test
```javascript
// Create component
const messaging = document.createElement('sl-messaging');
messaging.setAttribute('sessionId', 'test123');
document.body.appendChild(messaging);

// Verify it renders
setTimeout(() => {
  console.log('Component rendered:', messaging.shadowRoot !== null);
}, 1000);
```

## Troubleshooting

### "CustomElement already defined" Error
✅ **Fixed** - The guardCustomElementsDefine plugin prevents this

### "process is not defined" Error  
Add the component to `componentsNeedingPolyfill` array in rollup.config.stacklive.js

### Components Not Loading
- Check file paths in `generateComponentInputs()`
- Verify `src/lib/Components/webcomponents/` exists
- Check browser console for errors

### Build Errors
- Ensure Svelte 4.x is installed
- Check that all `.wc.svelte` files have `<svelte:options customElement="..." />`
- Verify TypeScript configuration if using TS

## Performance Optimization

### Code Splitting
The configuration already splits components into separate files. Load only what you need:

```javascript
// Only load messaging component
await import('/dist/components/messaging.js');
```

### Lazy Loading
```javascript
// Load component when needed
button.addEventListener('click', async () => {
  await import('/dist/components/tictactoe.js');
  showGame();
});
```

### Preloading
```html
<!-- Preload critical components -->
<link rel="modulepreload" href="/dist/components/messaging.js">
```

## Support

For issues or questions:
1. Check the main documentation in `STACKLIVE_INTEGRATION.md`
2. Review component source code in `src/lib/Components/webcomponents/`
3. Check StackLive platform documentation
4. Open an issue in the blackjack repository

## Version Compatibility

- **Svelte:** 4.2.19+
- **Rollup:** 4.x
- **Node.js:** 18.x or higher
- **Browsers:** Modern browsers with ES6+ and Web Components support
  - Chrome 67+
  - Firefox 63+
  - Safari 13.1+
  - Edge 79+

## Summary

The `rollup.config.stacklive.js` file provides a complete, drop-in configuration for integrating all blackjack web components into the StackLive platform. Simply copy the config and component files, build, and you're ready to use all 6 components with full protection against registration errors and browser compatibility issues.
