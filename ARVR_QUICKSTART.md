# AR/VR Capability - Quick Reference

## 🚀 Quick Start

```bash
# Navigate to the AR/VR demo
http://localhost:5173/arvr-demo
```

## 📦 Installation

All AR/VR components are already integrated into the StackLive platform. No additional installation required.

## 🎯 Basic Usage

### 1. Import the Hook

```typescript
import { useStackLiveARVR } from '$lib/multiplayer';

const arvr = useStackLiveARVR(userId, sessionId);
```

### 2. Start an AR Session

```typescript
// Check WebXR support
const supported = await arvr.isWebXRSupported();

// Start AR session
if (supported) {
  await arvr.startARSession();
}
```

### 3. Load an Avatar

```typescript
await arvr.loadAvatar('/models/avatar.glb', {
  bodyType: 'average',
  skinTone: '#f0d5a8',
  hair: { style: 'short', color: '#000000' }
});
```

### 4. Apply a Filter

```typescript
arvr.applyFilter('beauty-smooth');
```

### 5. Enable Gesture Detection

```typescript
await arvr.startGestureDetection(videoElement, {
  detectHands: true,
  detectFace: true,
  detectBody: true
});
```

## 🧩 Component Usage

### ARVRControlPanel

Complete UI for controlling all AR/VR features:

```svelte
<script lang="ts">
  import { ARVRControlPanel } from '$lib/Components/ARVRControlPanel.svelte';
  let videoElement: HTMLVideoElement;
</script>

<video bind:this={videoElement} autoplay playsinline></video>
<ARVRControlPanel userId="user123" sessionId="session456" {videoElement} />
```

### AvatarEmbed

Display a 3D avatar:

```svelte
<script lang="ts">
  import { AvatarEmbed } from '$lib/Components/AvatarEmbed.svelte';
</script>

<AvatarEmbed {avatar} width={300} height={400} />
```

### FilterSelector

UI for selecting AR filters:

```svelte
<script lang="ts">
  import { FilterSelector } from '$lib/Components/FilterSelector.svelte';
</script>

<FilterSelector 
  {presets} 
  {selectedFilterId}
  onFilterSelect={handleFilterSelect}
/>
```

## 🎨 Available Features

| Feature | Status | Description |
|---------|--------|-------------|
| WebXR Sessions | ✅ Ready | AR/VR session management |
| 3D Avatars | ✅ Ready | Avatar loading and customization |
| AR Filters | ✅ Ready | Face, body, environment filters |
| Gesture Detection | 🔄 Stub | Ready for MediaPipe integration |
| Spatial Interactions | ✅ Ready | Object placement and manipulation |
| Spatial Audio | 📋 Planned | Positional audio in AR/VR |
| 3D Rendering | 📋 Planned | Three.js integration |

## 🔧 Core Managers

### ARVRManager
- WebXR session management
- Feature toggles
- Event handling

### AvatarManager
- Avatar model loading
- Customization management
- Expression control

### FilterManager
- Filter preset management
- Real-time parameter adjustment
- Custom filter support

### GestureDetector
- Hand gesture detection
- Face expression detection
- Body pose detection

### SpatialInteractionManager
- Object placement
- Spatial transformations
- Collaborative interactions

## 📊 Database Schema

New tables added to Convex schema:

- `avatars` - User avatar data
- `filters` - AR filter configurations
- `spatial_interactions` - Spatial interaction history
- `gesture_data` - Gesture detection data
- `arvr_sessions` - AR/VR session state

## 🌐 Browser Support

### WebXR Support
- ✅ Chrome 79+ (Android)
- ✅ Edge 79+ (Windows Mixed Reality)
- ✅ Firefox Reality (VR headsets)
- ⚠️ Safari (limited, iOS 13+ for AR Quick Look)

### Fallback Rendering
When WebXR is not available:
- 2D avatar rendering on canvas
- Canvas 2D API for basic filters
- Standard webcam for gesture detection
- 2D coordinates for spatial interactions

## 📝 Example Integration

Complete example combining AR/VR with messaging:

```svelte
<script lang="ts">
  import { useStackLiveInteraction, useStackLiveARVR } from '$lib/multiplayer';
  import { MessagingEmbed } from '$lib/Components/messaging/MessagingEmbed.svelte';
  import { ARVRControlPanel } from '$lib/Components/ARVRControlPanel.svelte';

  const userId = 'user123';
  const sessionId = 'session456';

  const interaction = useStackLiveInteraction({
    sessionId,
    userId,
    mode: 'participant',
    video: true,
    audio: true
  });

  const arvr = useStackLiveARVR(userId, sessionId);

  let videoElement: HTMLVideoElement;

  async function enableAR() {
    await arvr.startARSession();
    arvr.setAvatarEnabled(true);
    arvr.setFiltersEnabled(true);
    await arvr.loadAvatar('/models/avatar.glb');
  }
</script>

<MessagingEmbed {sessionId} {userId} />

{#if $interaction.localStream}
  <video bind:this={videoElement} srcObject={$interaction.localStream} autoplay playsinline />
  <ARVRControlPanel {userId} {sessionId} {videoElement} />
  <button on:click={enableAR}>Enable AR Experience</button>
{/if}
```

## 🚀 Future Enhancements

### Planned for v2.0
- [ ] MediaPipe integration for real gesture detection
- [ ] Three.js for full 3D avatar rendering
- [ ] WebGL-based AR filter effects
- [ ] Spatial audio with Web Audio API
- [ ] mem0 integration for persistent preferences
- [ ] Avatar marketplace
- [ ] Custom filter SDK

## 📚 Documentation

For complete documentation, see [ARVR_DOCUMENTATION.md](./ARVR_DOCUMENTATION.md)

## 🐛 Troubleshooting

### WebXR Not Working
1. Check if browser supports WebXR
2. Ensure HTTPS connection (required for WebXR)
3. Check browser compatibility
4. Look for browser permission prompts

### Gesture Detection Not Working
1. Ensure video element is provided and active
2. Check camera permissions
3. Verify video stream is playing
4. Note: Current implementation is a stub for demo purposes

### Performance Issues
1. Reduce gesture detection FPS
2. Disable unused features
3. Limit number of active avatars
4. Optimize 3D models (when using real models)

## 📄 License

Part of the StackLive Realtime Multiplayer Platform

---

**Built with ❤️ for immersive experiences**
