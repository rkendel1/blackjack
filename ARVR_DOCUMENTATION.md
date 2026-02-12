# StackLive AR/VR Capability Documentation

## Overview

The StackLive AR/VR capability brings immersive augmented and virtual reality experiences to StackLive embeds. This enables:

- **Live 3D Avatars**: Real-time avatar rendering with customizations and expressions
- **AR Filters**: Real-time face, body, and environment filters
- **Spatial Interactions**: Collaborative AR/VR object placement and manipulation
- **Gesture Detection**: Hand, face, and body pose detection
- **Cross-Device Support**: Works across web, mobile, and native platforms
- **Persistent Memory**: Integration with mem0 for remembering avatars, filters, and session state

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ StackLive AR/VR Runtime                                     │
│  - ARVRManager (WebXR session management)                   │
│  - AvatarManager (3D avatar loading & customization)        │
│  - FilterManager (AR filter application)                    │
│  - GestureDetector (Pose & gesture detection)               │
│  - SpatialInteractionManager (Collaborative AR/VR)          │
└─────────────────────────────────────────────────────────────┘
                │
      ┌─────────┴─────────┐
      ▼                   ▼
WebXR API           StackLive Multiplayer
(AR/VR Sessions)    (Sync & Communication)
```

## Core Components

### 1. ARVRManager
Manages AR/VR sessions using WebXR API.

**Features:**
- WebXR session initialization (AR and VR modes)
- Session state management
- Feature toggles (avatars, filters, spatial, gestures)
- Event-driven architecture

**Usage:**
```typescript
import { ARVRManager } from '$lib/multiplayer';

const arvrManager = new ARVRManager();

// Check WebXR support
const supported = await arvrManager.isWebXRSupported();

// Start AR session
const started = await arvrManager.startSession({
  mode: 'immersive-ar',
  requiredFeatures: ['local-floor'],
  optionalFeatures: ['hand-tracking', 'dom-overlay']
});

// Enable features
arvrManager.setAvatarEnabled(true);
arvrManager.setFiltersEnabled(true);
arvrManager.setSpatialEnabled(true);

// End session
await arvrManager.endSession();
```

### 2. AvatarManager
Handles 3D avatar loading, customization, and transformation.

**Features:**
- Avatar model loading (glTF/USDZ)
- Customization (hair, clothing, accessories, skin tone, body type)
- Expression control (smile, surprised, angry, etc.)
- Transform management (position, rotation, scale)

**Usage:**
```typescript
import { AvatarManager } from '$lib/multiplayer';

const avatarManager = new AvatarManager();

// Load an avatar
const avatar = await avatarManager.loadAvatar(
  'user123',
  '/models/avatar.glb',
  {
    hair: { style: 'short', color: '#000000' },
    clothing: { outfit: 'casual' },
    skinTone: '#f0d5a8',
    bodyType: 'average'
  }
);

// Update customization
avatarManager.updateCustomization('user123', {
  hair: { style: 'long', color: '#ff0000' }
});

// Set expression
avatarManager.setExpression('user123', 'smile', 0.8);

// Update transform
avatarManager.updateTransform('user123', {
  position: [0, 1.6, -2],
  rotation: [0, 0, 0, 1],
  scale: [1, 1, 1]
});
```

### 3. FilterManager
Manages AR filter application and parameters.

**Features:**
- Pre-built filter presets (beauty, fun, artistic, seasonal)
- Custom filter support
- Real-time parameter adjustment
- Intensity control

**Filter Types:**
- **Face filters**: Applied to detected faces
- **Body filters**: Applied to full body detection
- **Environment filters**: Applied to the entire scene
- **Object filters**: Applied to specific detected objects

**Usage:**
```typescript
import { FilterManager } from '$lib/multiplayer';

const filterManager = new FilterManager();

// Get available filters
const presets = filterManager.getFilterPresets('face', 'beauty');

// Apply a filter
const filter = filterManager.applyFilter('user123', 'beauty-smooth', 'session123');

// Update filter intensity
filterManager.updateFilterIntensity('user123', 0.7);

// Update filter parameters
filterManager.updateFilterParameters('user123', {
  smoothness: 0.8,
  brightness: 0.2
});

// Remove filter
filterManager.removeFilter('user123');
```

### 4. GestureDetector
Detects gestures and poses from video streams.

**Features:**
- Hand gesture detection (wave, thumbs up, peace, etc.)
- Face expression detection (smile, surprised, wink, etc.)
- Body pose detection (standing, sitting, reaching, etc.)
- Landmark tracking (21 hand, 468 face, 33 body landmarks)

**Note:** Current implementation is a stub. For production, integrate with MediaPipe, TensorFlow.js, or similar ML libraries.

**Usage:**
```typescript
import { GestureDetector } from '$lib/multiplayer';

const detector = new GestureDetector('user123', 'session123');

// Start detection
await detector.startDetection(videoElement, {
  detectHands: true,
  detectFace: true,
  detectBody: true,
  fps: 10
});

// Listen for gestures
detector.on('gestureDetected', (gesture) => {
  console.log('Detected:', gesture.gesture, 'Confidence:', gesture.confidence);
});

// Stop detection
detector.stopDetection();
```

### 5. SpatialInteractionManager
Manages spatial interactions in AR/VR environments.

**Features:**
- Object placement in 3D space
- Object transformation (move, rotate, scale)
- Collaborative interactions (grab, point, draw)
- Object state synchronization

**Usage:**
```typescript
import { SpatialInteractionManager } from '$lib/multiplayer';

const spatialManager = new SpatialInteractionManager('user123', 'session123');

// Place an object
const interaction = spatialManager.placeObject(
  'object1',
  [0, 0, -2], // position
  [0, 0, 0, 1], // rotation (quaternion)
  [1, 1, 1] // scale
);

// Move object
spatialManager.moveObject('object1', [1, 0, -2]);

// Rotate object
spatialManager.rotateObject('object1', [0, 0.707, 0, 0.707]);

// Point at location
spatialManager.point(
  [0, 1.6, 0], // ray origin (user's head)
  [0, 0, -1] // ray direction
);

// Draw in space
spatialManager.draw([
  [0, 0, 0],
  [1, 0, 0],
  [1, 1, 0]
]);
```

## Svelte Integration

### useStackLiveARVR Hook
The main hook for integrating AR/VR into Svelte components.

**Usage:**
```svelte
<script lang="ts">
  import { useStackLiveARVR } from '$lib/multiplayer';
  
  const userId = 'user123';
  const sessionId = 'session456';
  
  const arvr = useStackLiveARVR(userId, sessionId);
  
  async function startAR() {
    const started = await arvr.startARSession();
    if (started) {
      arvr.setAvatarEnabled(true);
      arvr.setFiltersEnabled(true);
    }
  }
  
  async function loadMyAvatar() {
    await arvr.loadAvatar('/models/avatar.glb', {
      bodyType: 'average',
      skinTone: '#f0d5a8'
    });
  }
  
  function applyFilter() {
    arvr.applyFilter('beauty-smooth');
  }
</script>

<div>
  <h2>AR/VR Session</h2>
  
  <p>Active: {$arvr.sessionState.active ? 'Yes' : 'No'}</p>
  <p>Mode: {$arvr.sessionState.mode || 'None'}</p>
  
  <button on:click={startAR}>Start AR</button>
  <button on:click={loadMyAvatar}>Load Avatar</button>
  <button on:click={applyFilter}>Apply Filter</button>
  
  {#if $arvr.sessionState.avatarEnabled}
    <div>Avatars Enabled - {$arvr.avatars.size} active</div>
  {/if}
  
  {#if $arvr.lastGesture}
    <div>Last Gesture: {$arvr.lastGesture.gesture}</div>
  {/if}
</div>
```

### ARVRControlPanel Component
A complete UI for controlling AR/VR features.

**Usage:**
```svelte
<script lang="ts">
  import { ARVRControlPanel } from '$lib/Components/ARVRControlPanel.svelte';
  
  let videoElement: HTMLVideoElement;
</script>

<video bind:this={videoElement} autoplay playsinline></video>

<ARVRControlPanel 
  userId="user123" 
  sessionId="session456"
  {videoElement}
/>
```

### AvatarEmbed Component
Displays a 3D avatar with customization info.

**Usage:**
```svelte
<script lang="ts">
  import { AvatarEmbed } from '$lib/Components/AvatarEmbed.svelte';
  import type { AvatarMessage } from '$lib/multiplayer/types';
  
  const avatar: AvatarMessage = {
    id: 'avatar1',
    userId: 'user123',
    avatarModel: '/models/avatar.glb',
    customizations: {
      bodyType: 'average',
      skinTone: '#f0d5a8'
    },
    timestamp: Date.now()
  };
</script>

<AvatarEmbed {avatar} width={300} height={400} />
```

### FilterSelector Component
UI for selecting and applying AR filters.

**Usage:**
```svelte
<script lang="ts">
  import { FilterSelector } from '$lib/Components/FilterSelector.svelte';
  
  const presets = [
    { id: 'beauty-smooth', name: 'Beauty', type: 'face', category: 'beauty' },
    { id: 'fun-bunny', name: 'Bunny Ears', type: 'face', category: 'fun' }
  ];
  
  let selectedFilterId = null;
  
  function handleFilterSelect(filterId: string) {
    console.log('Filter selected:', filterId);
  }
</script>

<FilterSelector 
  {presets} 
  {selectedFilterId}
  onFilterSelect={handleFilterSelect}
/>
```

## Database Schema

The AR/VR capability extends the Convex schema with the following tables:

### avatars
Stores user avatar data.

**Fields:**
- `userId`: User ID
- `sessionId`: Optional session ID
- `avatarModel`: URL to glTF/USDZ model
- `customizations`: JSON stringified customization data
- `transform`: JSON stringified transform (position, rotation, scale)
- `lastUsed`: Timestamp of last use
- `createdAt`: Creation timestamp

### filters
Stores AR filter configurations.

**Fields:**
- `filterId`: Unique filter ID
- `name`: Filter name
- `type`: Filter type (face, body, environment, object)
- `category`: Filter category (beauty, fun, artistic, seasonal, brand)
- `assetUrl`: URL to filter assets
- `thumbnailUrl`: URL to filter thumbnail
- `parameters`: JSON stringified filter parameters
- `deviceCompatibility`: JSON stringified device compatibility list
- `createdAt`: Creation timestamp

### spatial_interactions
Stores spatial interaction history.

**Fields:**
- `sessionId`: Session ID
- `userId`: User ID
- `interactionType`: Type of interaction (place, move, rotate, scale, grab, point, draw)
- `objectId`: Optional object ID
- `spatialData`: JSON stringified spatial data
- `timestamp`: Interaction timestamp
- `expiresAt`: Optional expiration timestamp

### gesture_data
Stores gesture detection data.

**Fields:**
- `sessionId`: Session ID
- `userId`: User ID
- `gestureType`: Gesture type (hand, face, body, pose)
- `gesture`: Recognized gesture name
- `landmarks`: JSON stringified landmark data
- `confidence`: Detection confidence (0-1)
- `timestamp`: Detection timestamp

### arvr_sessions
Tracks AR/VR session state.

**Fields:**
- `sessionId`: Session ID
- `mode`: AR or VR mode
- `active`: Session active status
- `avatarEnabled`: Avatars feature enabled
- `filtersEnabled`: Filters feature enabled
- `spatialEnabled`: Spatial interactions enabled
- `gestureDetectionEnabled`: Gesture detection enabled
- `participants`: JSON stringified participant IDs
- `startedAt`: Session start timestamp
- `endedAt`: Optional session end timestamp

## Message Protocol

AR/VR extends the StackLive message protocol with new message types:

### Avatar Messages
```typescript
{
  type: 'avatar',
  payload: {
    id: string,
    userId: string,
    sessionId?: string,
    avatarModel: string,
    customizations: { /* ... */ },
    transform?: { /* ... */ },
    timestamp: number
  }
}
```

### Filter Messages
```typescript
{
  type: 'filter',
  payload: {
    id: string,
    userId: string,
    sessionId?: string,
    filterType: 'face' | 'body' | 'environment' | 'object',
    filterName: string,
    parameters?: { /* ... */ },
    intensity?: number,
    enabled: boolean,
    timestamp: number
  }
}
```

### Gesture Messages
```typescript
{
  type: 'gesture',
  payload: {
    id: string,
    userId: string,
    sessionId?: string,
    gestureType: 'hand' | 'face' | 'body' | 'pose',
    gesture?: string,
    landmarks?: Array<{x, y, z?, visibility?}>,
    confidence?: number,
    timestamp: number
  }
}
```

### Spatial Messages
```typescript
{
  type: 'spatial',
  payload: {
    id: string,
    userId: string,
    sessionId?: string,
    interactionType: 'place' | 'move' | 'rotate' | 'scale' | 'grab' | 'point' | 'draw',
    objectId?: string,
    position?: [number, number, number],
    rotation?: [number, number, number, number],
    scale?: [number, number, number],
    timestamp: number
  }
}
```

## Integration with Existing StackLive

AR/VR capabilities integrate seamlessly with existing StackLive features:

### With Messaging Embed
```svelte
<script lang="ts">
  import { MessagingEmbed } from '$lib/Components/messaging/MessagingEmbed.svelte';
  import { ARVRControlPanel } from '$lib/Components/ARVRControlPanel.svelte';
  import { useStackLiveInteraction } from '$lib/multiplayer';
  
  const interaction = useStackLiveInteraction({
    sessionId: 'session123',
    userId: 'user123',
    mode: 'participant',
    video: true,
    audio: true
  });
  
  let videoElement: HTMLVideoElement;
</script>

<MessagingEmbed sessionId="session123" userId="user123" />

{#if $interaction.localStream}
  <video bind:this={videoElement} srcObject={$interaction.localStream} autoplay playsinline></video>
  
  <ARVRControlPanel 
    userId="user123" 
    sessionId="session123"
    {videoElement}
  />
{/if}
```

### With Multiplayer Games
AR/VR can enhance multiplayer games with spatial interactions:

```typescript
import { useStackLiveMultiplayer, useStackLiveARVR } from '$lib/multiplayer';

// Standard multiplayer setup
const multiplayer = useStackLiveMultiplayer({
  gameId: 'blackjack',
  mode: 'host-authoritative',
  maxPlayers: 4
});

// Add AR/VR capabilities
const arvr = useStackLiveARVR('user123', $multiplayer.session?.id);

// Enable spatial interactions for card placement
arvr.setSpatialEnabled(true);

// Place a card in AR space
arvr.placeObject('card-ace-spades', [0, 0.8, -1.5]);
```

## Browser Compatibility

### WebXR Support
- Chrome 79+ (Android)
- Edge 79+ (Windows Mixed Reality)
- Firefox Reality (VR headsets)
- Safari (limited, iOS 13+ for AR Quick Look)

### Fallback Modes
When WebXR is not available:
- Avatars render as 2D on canvas
- Filters use Canvas 2D API for basic effects
- Gesture detection works with standard webcam
- Spatial interactions use 2D coordinates

## Future Enhancements

### Planned Features
1. **MediaPipe Integration**: Replace stub gesture detection with real ML models
2. **Three.js Integration**: Full 3D avatar rendering
3. **Spatial Audio**: Web Audio API integration for positional audio
4. **Screen Sharing in AR**: Overlay shared screens in AR space
5. **Collaborative Whiteboards**: Draw and annotate in shared AR space
6. **Avatar Marketplace**: Browse and purchase avatar models
7. **Custom Filter SDK**: Create and share custom AR filters

### mem0 Integration
Future versions will integrate with mem0 for:
- Persistent avatar preferences
- Filter usage history
- Gesture shortcuts
- Spatial layout memory
- Cross-session continuity

## Examples

### Basic AR Session
```svelte
<script lang="ts">
  import { useStackLiveARVR } from '$lib/multiplayer';
  
  const arvr = useStackLiveARVR('user123');
  
  async function init() {
    // Check support
    const supported = await arvr.isWebXRSupported();
    if (!supported) {
      alert('WebXR not supported');
      return;
    }
    
    // Start AR session
    await arvr.startARSession();
    
    // Enable features
    arvr.setAvatarEnabled(true);
    arvr.setFiltersEnabled(true);
    arvr.setSpatialEnabled(true);
    
    // Load avatar
    await arvr.loadAvatar('/models/avatar.glb');
    
    // Apply filter
    arvr.applyFilter('beauty-smooth');
    
    // Place object
    arvr.placeObject('cube1', [0, 0, -2]);
  }
</script>

<button on:click={init}>Start AR Experience</button>
```

## Troubleshooting

### WebXR Not Working
- Check if device supports WebXR
- Ensure HTTPS connection (required for WebXR)
- Check browser compatibility
- Look for browser permission prompts

### Gesture Detection Not Working
- Ensure video element is provided
- Check camera permissions
- Verify video stream is active
- Check console for ML model loading errors

### Performance Issues
- Reduce gesture detection FPS
- Disable unused features
- Limit number of active avatars
- Optimize 3D models (reduce polygon count)

## License

Part of the StackLive Realtime Multiplayer Platform.
