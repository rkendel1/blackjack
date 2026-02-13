# Backend Separation - Quick Examples

## Overview

All components now have **complete separation** between backend (TypeScript infrastructure) and frontend (UI components). Nothing is simplified - all features are fully available.

## Architecture

```
┌─────────────────────────────────────────────────┐
│           BACKEND (TypeScript)                  │
│         src/lib/backends/                       │
│                                                 │
│  • Messaging      (Full StackLive features)    │
│  • Games          (All game engines)           │
│  • Multiplayer    (WebRTC, sessions, peers)    │
│  • AR/VR          (Avatars, filters, gestures) │
│  • Utils          (Helper functions)           │
│  • Animation      (Animation utilities)        │
└─────────────────────────────────────────────────┘
                     ↕️
              Clean Interface
                     ↕️
┌─────────────────────────────────────────────────┐
│          FRONTEND (Svelte Components)           │
│        src/lib/Components/                      │
│                                                 │
│  • messaging/     (ChatView, ConversationList) │
│  • webcomponents/ (Thin wrappers)              │
└─────────────────────────────────────────────────┘
```

## Example 1: Full-Featured Messaging

### In a Svelte App

```svelte
<script lang="ts">
  import { createMessagingBackend } from '$lib/backends/messaging';
  import ChatView from '$lib/Components/messaging/ChatView.svelte';
  import ConversationList from '$lib/Components/messaging/ConversationList.svelte';
  
  // Backend: All the data, logic, WebRTC, session management
  const backend = createMessagingBackend({
    embedId: 'my-chat-app',
    sessionId: 'optional-join-session',
    enableVideo: true,           // Full WebRTC video
    enableAudio: true,           // Full WebRTC audio
    maxParticipants: 20,         // Configure max users
    debug: true
  });
  
  // Destructure ALL features (nothing hidden or simplified)
  const { 
    session,              // Session info
    participants,         // All participants
    messages,             // All messages
    isConnected,          // Connection status
    isHost,               // Am I the host?
    connectionQuality,    // Network quality metrics
    localStream,          // My video/audio stream
    remoteStreams,        // Other users' streams
    sendMessage,          // Send text message
    sendMedia,            // Send image/video/audio
    sendReaction,         // React to messages (👍, ❤️, etc.)
    createPoll,           // Create interactive polls
    createQuiz,           // Create quizzes with points
    toggleVideo,          // Turn video on/off
    toggleAudio,          // Turn audio on/off
    start,                // Start new session
    join,                 // Join existing session
    destroy               // Cleanup
  } = backend;
  
  // Start or join session
  onMount(async () => {
    if (sessionId) {
      await join(sessionId);
    } else {
      await start();
    }
  });
  
  // Frontend: All the UI, highly configurable
  let currentView = 'inbox';
</script>

{#if currentView === 'inbox'}
  <ConversationList 
    participants={$participants}
    sessionInfo={$session}
    onSelectConversation={(id) => currentView = 'chat'}
  />
{:else}
  <ChatView 
    messages={$messages}
    conversationName="Alice"
    currentUserId={getLocalUserId()}
    onSendMessage={(text) => sendMessage(text)}
    onSendMedia={(url, type) => sendMedia(url, type)}
    onStartVideoCall={() => currentView = 'video'}
  />
{/if}
```

### As a Web Component (Drop-in for any site)

```html
<!-- Just drop this into ANY website -->
<script type="module" src="/build/bundle.js"></script>

<sl-messaging 
  embedId="my-app"
  sessionId="abc123"
  enableVideo="true"
  enableAudio="true"
  maxParticipants="50">
</sl-messaging>
```

The web component internally uses the same backend + frontend separation!

## Example 2: Game with Full Features

```svelte
<script lang="ts">
  import { createBlackjackStore } from '$lib/backends/games';
  import BlackjackTable from '$lib/Components/BlackjackTable.svelte';
  
  // Backend: Game engine, rules, state management
  const game = createBlackjackStore();
  
  // Frontend: Card animations, table UI
  const { state, player, dealer, start, playerTurn } = game;
</script>

<BlackjackTable 
  player={$player}
  dealer={$dealer}
  onHit={() => playerTurn('draw')}
  onStand={() => playerTurn('stop')}
/>
```

## Example 3: Multiplayer with Full WebRTC

```svelte
<script lang="ts">
  import { useStackLiveMultiplayer } from '$lib/backends/multiplayer';
  
  // Backend: Full StackLive infrastructure
  const multiplayer = useStackLiveMultiplayer({
    embedId: 'my-game',
    maxPlayers: 4,
    video: { width: 1280, height: 720 },  // Full MediaTrackConstraints
    audio: { echoCancellation: true },     // Advanced audio config
    iceServers: [/* custom TURN servers */]  // Custom WebRTC config
  });
  
  // Access ALL features
  const {
    session,
    peers,
    localStream,
    remoteStreams,
    sendGameState,
    onGameState,
    latency,
    connectionQuality
  } = multiplayer;
</script>
```

## Example 4: AR/VR with Full Features

```svelte
<script lang="ts">
  import { useStackLiveARVR } from '$lib/backends/arvr';
  
  // Backend: Full AR/VR capabilities
  const arvr = useStackLiveARVR('user-123', 'session-456');
  
  const {
    avatars,          // Multiplayer avatars
    filters,          // Face filters
    lastGesture,      // Gesture recognition
    spatialObjects,   // 3D objects in space
    applyFilter,      // Apply AR filter
    placeObject,      // Place 3D object
    detectGesture     // Detect hand gestures
  } = arvr;
</script>
```

## Key Benefits

### For Developers

✅ **Clear Separation**: Backend logic vs UI presentation  
✅ **Reusable**: Use backend in any framework  
✅ **Type-Safe**: Full TypeScript support  
✅ **Testable**: Test backend independently  
✅ **Documented**: Clear API boundaries  

### For Users

✅ **Fully Featured**: Nothing simplified or removed  
✅ **Highly Configurable**: Every option exposed  
✅ **Production Ready**: Used in real apps  
✅ **Drop-in Ready**: Web components work anywhere  

## Migration from Old Code

### Before (Tightly Coupled)
```typescript
import { useStackLiveInteraction } from '$lib/multiplayer/useStackLiveInteraction';
```

### After (Separated Backend)
```typescript
import { useStackLiveInteraction } from '$lib/backends/multiplayer';
// or use the higher-level adapter:
import { createMessagingBackend } from '$lib/backends/messaging';
```

### Before (Directly in Component)
```svelte
<script>
  import { useStackLiveInteraction } from '$lib/multiplayer/...';
  
  const interaction = useStackLiveInteraction(config);
  // Logic mixed with UI
</script>
```

### After (Clean Separation)
```svelte
<script>
  import { createMessagingBackend } from '$lib/backends/messaging';
  import ChatView from '$lib/Components/messaging/ChatView.svelte';
  
  // Backend handles logic
  const backend = createMessagingBackend(config);
  
  // Frontend handles UI
</script>

<ChatView {/* props from backend */} />
```

## What's NOT Changed

- ❌ No features removed
- ❌ No simplification
- ❌ No functionality reduced
- ✅ Same power, better organization
- ✅ Same configurability, clearer interface
- ✅ Same production quality, easier to use

## See Also

- `BACKEND_ARCHITECTURE.md` - Complete architecture documentation
- `src/lib/backends/` - All backend code
- `src/lib/Components/` - All frontend code
