# StackLive Web Components

## Overview

StackLive provides drop-in web components that bring real-time collaborative experiences to any web application. These components are built using Svelte's custom element support and can be used with any framework or vanilla JavaScript.

## Quick Start

Try the standalone example: [webcomponents-example.html](/webcomponents-example.html)

Or view the demo pages:
- [Web Components Demo](/webcomponents-demo) - Component showcase and documentation
- [Room Demo](/room-demo) - Persistent work room with messaging and presence
- [Messaging Demo](/messaging) - Full messaging app with video calls
- [AR/VR Demo](/arvr-demo) - Interactive AR/VR control panel

## Components

### Public Embeds

#### 1. `<sl-messaging>`

A full-featured iMessage-style messaging embed with text chat, media sharing, and video calls.

##### Attributes

- `embedId` (string): Unique embed identifier. Default: 'messaging-app'
- `sessionId` (string): Session identifier for multiplayer sync. Leave empty to create new session.
- `enableVideo` ('true' | 'false'): Enable video call features. Default: 'true'
- `enableAudio` ('true' | 'false'): Enable audio call features. Default: 'true'

##### Events

- `ready`: Fired when the component is initialized and connected
  - `detail`: `{ embedId: string, sessionId: string }`

##### Example

```html
<!-- Create a new messaging session -->
<sl-messaging
  embedId="my-chat-app"
  enableVideo="true"
  enableAudio="true"
></sl-messaging>

<!-- Join an existing session -->
<sl-messaging
  embedId="my-chat-app"
  sessionId="session-abc-123"
  enableVideo="true"
  enableAudio="true"
></sl-messaging>

<script>
  const messaging = document.querySelector('sl-messaging');
  
  // Listen for ready event
  messaging.addEventListener('ready', (e) => {
    console.log('Messaging ready:', e.detail);
    console.log('Session ID:', e.detail.sessionId);
  });
</script>
```

##### Features

- 📥 Inbox with conversation list
- 💬 Real-time text messaging
- 📷 Photo and video sharing
- ❤️ Message reactions
- 📹 FaceTime-style video calls
- 🔄 Cross-device sync via StackLive Runtime

---

#### 2. `<sl-room>`

A persistent collaborative work room with ambient presence, messaging, shouts, smoke signals, and role-based membership.

##### Attributes

- `embedId` (string): Unique room identifier. Default: 'room'
- `sessionId` (string): Session identifier to join existing room. Leave empty to create new room.
- `roomName` (string): Display name for the room. Default: 'Work Room'
- `enableVideo` ('true' | 'false'): Enable video streaming. Default: 'false'
- `enableAudio` ('true' | 'false'): Enable audio streaming. Default: 'false'
- `maxMembers` (string): Maximum number of members allowed. Default: '50'
- `defaultRole` (string): Default role for joining participants ('host' | 'member' | 'guest'). Default: 'member'

##### Methods

- `sendMessage(text: string)`: Send a text message to the room
- `sendShout(text: string)`: Send a broadcast shout to all members
- `sendSmokeSignal(message: string)`: Send an ephemeral notification
- `getRoomInfo()`: Get current room state and statistics
  - Returns: `{ roomName: string, sessionId: string, memberCount: number, maxMembers: number, isHost: boolean }`

##### Events

- `ready`: Fired when the room is initialized and connected
  - `detail`: `{ embedId: string, sessionId: string, roomName: string }`

##### Example

```html
<!-- Create a new room -->
<sl-room
  embedId="my-team-room"
  roomName="Project Planning"
  maxMembers="25"
  defaultRole="member"
></sl-room>

<!-- Join an existing room -->
<sl-room
  embedId="my-team-room"
  sessionId="session-abc-123"
  roomName="Project Planning"
></sl-room>

<script>
  const room = document.querySelector('sl-room');
  
  // Listen for ready event
  room.addEventListener('ready', (e) => {
    console.log('Room ready:', e.detail);
    console.log('Session ID:', e.detail.sessionId);
  });
  
  // Send a message
  room.sendMessage('Hello everyone!');
  
  // Send a shout (broadcast)
  room.sendShout('Meeting starts in 5 minutes!');
  
  // Send smoke signal (ephemeral notification)
  room.sendSmokeSignal('👍 Good idea!');
  
  // Get room info
  const info = room.getRoomInfo();
  console.log(`Room has ${info.memberCount} members`);
</script>
```

##### Features

- 💬 **Chat Tab** - Real-time messaging with all room members
- 👥 **Members Tab** - Ambient presence showing all members with online/offline status
- 🔊 **Shouts Tab** - Broadcast messages that stand out from regular chat
- 💨 **Smoke Signals** - Quick ephemeral notifications (auto-disappear in 5 seconds)
- 🎭 **Role-based Membership** - Host, member, and guest roles with different permissions
- ⚡ **Quick Actions** - Floating buttons for instant reactions (👋, 👍, 🎉)
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

---

### AR/VR Components

#### 3. `<sl-arvr-scene>`

The main AR/VR scene component that provides a full immersive experience with camera integration, WebXR support, and real-time rendering.

#### Attributes

- `userId` (string): Unique user identifier. Auto-generated if not provided.
- `sessionId` (string): Session identifier for multiplayer sync. Auto-generated if not provided.
- `mode` ('ar' | 'vr' | 'inline'): Rendering mode. Default: 'inline'
  - `ar`: Augmented reality mode (requires WebXR)
  - `vr`: Virtual reality mode (requires WebXR)
  - `inline`: Standard canvas rendering (fallback mode)
- `avatarEnabled` ('true' | 'false'): Enable avatar features. Default: 'true'
- `filtersEnabled` ('true' | 'false'): Enable AR filters. Default: 'true'
- `spatialEnabled` ('true' | 'false'): Enable spatial interactions. Default: 'true'
- `gestureEnabled` ('true' | 'false'): Enable gesture detection. Default: 'true'
- `width` (string): Component width. Default: '100%'
- `height` (string): Component height. Default: '600px'

#### Methods

- `startAR()`: Start an AR session
- `startVR()`: Start a VR session
- `endSession()`: End the current AR/VR session
- `loadAvatar(modelUrl, customizations)`: Load a 3D avatar
- `applyFilter(filterId)`: Apply an AR filter
- `placeObject(objectId, position)`: Place a spatial object

#### Events

- `ready`: Fired when the component is initialized
  - `detail`: `{ userId: string, sessionId: string }`

#### Example

```html
<sl-arvr-scene
  userId="user-123"
  sessionId="session-456"
  mode="inline"
  avatarEnabled="true"
  filtersEnabled="true"
  spatialEnabled="true"
  width="100%"
  height="600px"
></sl-arvr-scene>

<script>
  const scene = document.querySelector('sl-arvr-scene');
  
  // Listen for ready event
  scene.addEventListener('ready', (e) => {
    console.log('Scene ready:', e.detail);
  });
  
  // Start AR session
  await scene.startAR();
  
  // Load avatar
  await scene.loadAvatar('/models/avatar.glb', {
    bodyType: 'average',
    skinTone: '#f0d5a8'
  });
  
  // Apply filter
  scene.applyFilter('beauty-smooth');
  
  // Place object in space
  scene.placeObject('cube-1', [0, 0, -2]);
</script>
```

---

#### 4. `<sl-arvr-avatar>`

A component for displaying 3D avatars with customization options.

#### Attributes

- `userId` (string): User identifier for the avatar. Default: ''
- `modelUrl` (string): URL to the avatar 3D model (glTF/USDZ). Default: '/models/default-avatar.glb'
- `skinTone` (string): Avatar skin tone (CSS color). Default: '#f0d5a8'
- `bodyType` (string): Avatar body type ('average', 'athletic', 'slim'). Default: 'average'
- `width` (string): Component width. Default: '300px'
- `height` (string): Component height. Default: '400px'
- `showInfo` ('true' | 'false'): Show avatar information overlay. Default: 'true'

#### Events

- `rendered`: Fired when the avatar is rendered
  - `detail`: `{ userId: string, modelUrl: string }`

#### Example

```html
<sl-arvr-avatar
  userId="user-123"
  skinTone="#f0d5a8"
  bodyType="average"
  width="300px"
  height="400px"
  showInfo="true"
></sl-arvr-avatar>

<script>
  const avatar = document.querySelector('sl-arvr-avatar');
  
  avatar.addEventListener('rendered', (e) => {
    console.log('Avatar rendered:', e.detail);
  });
</script>
```

---

#### 5. `<sl-arvr-filter>`

A component representing an AR filter that can be applied to faces, bodies, or environments.

#### Attributes

- `filterType` ('face' | 'body' | 'environment' | 'object'): Type of filter. Default: 'face'
- `filterName` (string): Name of the filter. Default: 'beauty'
- `intensity` (string): Filter intensity (0.0 - 1.0). Default: '0.5'
- `thumbnailUrl` (string): Optional thumbnail image URL. Default: ''

#### Events

- `filter-loaded`: Fired when the filter component is loaded
  - `detail`: `{ filterType: string, filterName: string, intensity: number }`
- `filter-selected`: Fired when the filter is clicked
  - `detail`: `{ filterType: string, filterName: string, intensity: number }`

#### Example

```html
<sl-arvr-filter
  filterType="face"
  filterName="beauty"
  intensity="0.7"
></sl-arvr-filter>

<script>
  const filter = document.querySelector('sl-arvr-filter');
  
  filter.addEventListener('filter-selected', (e) => {
    console.log('Filter selected:', e.detail);
    // Apply filter to scene
  });
</script>
```

---

#### 6. `<sl-arvr-spatial>`

A component for interactive 3D objects that can be placed and manipulated in AR/VR space.

#### Attributes

- `objectId` (string): Unique identifier for the object. Default: ''
- `objectType` (string): Type of object ('cube', 'sphere', 'cylinder'). Default: 'cube'
- `position` (string): Object position as "x,y,z". Default: '0,0,-2'
- `rotation` (string): Object rotation as quaternion "x,y,z,w". Default: '0,0,0,1'
- `scale` (string): Object scale as "x,y,z". Default: '1,1,1'
- `color` (string): Object color (CSS color). Default: '#4299e1'
- `interactive` ('true' | 'false'): Enable drag interaction. Default: 'true'

#### Events

- `object-placed`: Fired when the object is first placed
  - `detail`: `{ objectId: string, objectType: string, position: [number, number, number], rotation: [number, number, number, number], scale: [number, number, number] }`
- `object-moved`: Fired when the object is moved (drag interaction)
  - `detail`: `{ objectId: string, position: [number, number, number] }`

#### Example

```html
<sl-arvr-spatial
  objectId="cube-1"
  objectType="cube"
  position="0,0,-2"
  color="#4299e1"
  interactive="true"
></sl-arvr-spatial>

<script>
  const spatial = document.querySelector('sl-arvr-spatial');
  
  spatial.addEventListener('object-placed', (e) => {
    console.log('Object placed:', e.detail);
  });
  
  spatial.addEventListener('object-moved', (e) => {
    console.log('Object moved to:', e.detail.position);
  });
</script>
```

---

## Installation

### Svelte 4 Projects

Import the web components module in your page or layout:

```svelte
<script>
  import '$lib/Components/webcomponents';
</script>
```

### Vanilla JavaScript / HTML

For static HTML or other frameworks, you'll need to build and bundle the components first. The components will be available after the module loads:

```html
<!DOCTYPE html>
<html>
<head>
  <title>AR/VR Demo</title>
</head>
<body>
  <sl-arvr-scene
    userId="demo-user"
    mode="inline"
    width="100%"
    height="600px"
  ></sl-arvr-scene>

  <script type="module">
    import '$lib/Components/webcomponents';
    
    const scene = document.querySelector('sl-arvr-scene');
    scene.addEventListener('ready', () => {
      console.log('AR/VR scene ready!');
    });
  </script>
</body>
</html>
```

---

## Features

### ✅ Native Web Components

Built using Svelte's custom element support, these components work with any framework or vanilla JavaScript.

### ✅ WebXR Support

Full AR/VR capabilities when WebXR is available on the device. Automatically falls back to 2D canvas rendering on unsupported devices.

### ✅ Camera Integration

Real-time camera access for AR experiences with automatic permission handling.

### ✅ Gesture Detection

Hand, face, and body gesture detection (requires integration with MediaPipe or TensorFlow.js in production).

### ✅ Spatial Interactions

Place, move, rotate, and scale 3D objects in AR/VR space with interactive controls.

### ✅ Multi-User Sync

Built-in support for real-time multiplayer synchronization via StackLive runtime.

### ✅ Event-Driven

All interactions emit custom events for easy integration with your application logic.

### ✅ Customizable

Extensive attribute API for customizing appearance and behavior.

---

## Browser Support

### Full WebXR Support

- **Chrome 79+** (Android) - AR mode with hand tracking
- **Edge 79+** (Windows Mixed Reality) - VR mode
- **Firefox Reality** - VR headset support

### Limited Support

- **Safari** (iOS 13+) - Limited AR via AR Quick Look
- **Fallback** - Canvas 2D rendering on all browsers

---

## Integration with StackLive

These web components integrate seamlessly with the StackLive runtime for real-time multiplayer experiences:

```javascript
import { useStackLiveARVR } from '$lib/multiplayer';

// Initialize StackLive AR/VR
const arvr = useStackLiveARVR('user-123', 'session-456');

// The web components automatically connect to the same session
```

---

## Advanced Usage

### Combining Components

```html
<div class="arvr-experience">
  <!-- Main scene -->
  <sl-arvr-scene
    id="main-scene"
    userId="user-1"
    sessionId="collab-session"
    mode="inline"
  ></sl-arvr-scene>

  <!-- Avatar gallery -->
  <div class="avatar-selector">
    <sl-arvr-avatar userId="user-1" skinTone="#f0d5a8"></sl-arvr-avatar>
    <sl-arvr-avatar userId="user-2" skinTone="#8d5524"></sl-arvr-avatar>
    <sl-arvr-avatar userId="user-3" skinTone="#c58c85"></sl-arvr-avatar>
  </div>

  <!-- Filter palette -->
  <div class="filter-palette">
    <sl-arvr-filter filterType="face" filterName="beauty"></sl-arvr-filter>
    <sl-arvr-filter filterType="face" filterName="bunny"></sl-arvr-filter>
    <sl-arvr-filter filterType="environment" filterName="vintage"></sl-arvr-filter>
  </div>

  <!-- Spatial objects -->
  <div class="object-toolbar">
    <sl-arvr-spatial objectType="cube" color="#4299e1"></sl-arvr-spatial>
    <sl-arvr-spatial objectType="sphere" color="#10b981"></sl-arvr-spatial>
    <sl-arvr-spatial objectType="cylinder" color="#f59e0b"></sl-arvr-spatial>
  </div>
</div>

<script>
  const scene = document.getElementById('main-scene');
  const filters = document.querySelectorAll('sl-arvr-filter');
  const spatials = document.querySelectorAll('sl-arvr-spatial');

  // Apply selected filter to scene
  filters.forEach(filter => {
    filter.addEventListener('filter-selected', (e) => {
      scene.applyFilter(e.detail.filterName);
    });
  });

  // Place selected object in scene
  spatials.forEach(spatial => {
    spatial.addEventListener('object-placed', (e) => {
      const pos = e.detail.position;
      scene.placeObject(e.detail.objectId, pos);
    });
  });
</script>
```

---

## Troubleshooting

### Camera Access Issues

Ensure your page is served over HTTPS (required for `getUserMedia`):

```
Camera requires HTTPS connection (or localhost)
```

### WebXR Not Available

Check browser compatibility and feature detection:

```javascript
const scene = document.querySelector('sl-arvr-scene');

scene.addEventListener('ready', async () => {
  // Component will automatically fall back to canvas rendering
  console.log('Scene ready, mode:', scene.getAttribute('mode'));
});
```

### Performance Issues

- Reduce gesture detection FPS in the scene component
- Disable unused features (avatars, filters, spatial, gestures)
- Limit the number of active spatial objects

---

## Demo Pages

- **Web Components Demo**: `/webcomponents-demo` - Full showcase of all components
- **AR/VR Control Panel**: `/arvr-demo` - Interactive control panel with StackLive integration

---

## Documentation

- [ARVR_DOCUMENTATION.md](https://github.com/rkendel1/blackjack/blob/main/ARVR_DOCUMENTATION.md) - Complete AR/VR capability documentation
- [MULTIPLAYER.md](https://github.com/rkendel1/blackjack/blob/main/MULTIPLAYER.md) - StackLive multiplayer platform docs

---

## License

Part of the StackLive Realtime Multiplayer Platform.
