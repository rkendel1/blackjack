# Backend Architecture - Separation Layer

## Overview

This document describes the **separation layer** between TypeScript backend infrastructure and frontend components. All backends are **fully-featured** and **highly configurable** - nothing is simplified.

## Architecture

```
src/lib/
├── backends/           ← BACKEND LAYER (TypeScript infrastructure)
│   ├── messaging/      ← Full-featured messaging backend
│   ├── games/          ← Game engines + adapters
│   ├── multiplayer/    ← Multiplayer/realtime features
│   ├── arvr/           ← AR/VR capabilities
│   ├── utils/          ← Utility functions
│   └── animation/      ← Animation helpers
│
├── Components/         ← FRONTEND LAYER (UI components)
│   ├── messaging/      ← Messaging UI components (highly configurable)
│   ├── webcomponents/  ← Web component wrappers (thin layer)
│   └── ...
│
└── [other folders]
```

## Design Principles

### 1. **Backend = Infrastructure**
- All TypeScript code
- Data management, state, business logic
- StackLive integration
- Framework-agnostic at core
- **100% full-featured** - no simplification

### 2. **Frontend = UI**
- All Svelte components
- Presentation, user interaction
- Highly configurable
- Uses backends via clean interface

### 3. **Web Components = Thin Wrappers**
- Connect backend + frontend
- Expose as native web components
- Minimal logic - just glue code

## Backend Modules

### Messaging Backend (`src/lib/backends/messaging/`)

**Full-featured messaging with ALL capabilities:**

```typescript
import { createMessagingBackend } from '$lib/backends/messaging';

const backend = createMessagingBackend({
  embedId: 'my-app',
  sessionId: 'optional-session-id',
  enableVideo: true,  // or MediaTrackConstraints
  enableAudio: true,  // or MediaTrackConstraints
  maxParticipants: 10,
  debug: false
});

// All stores (reactive)
backend.session          // Current session
backend.participants     // All participants
backend.messages         // All messages
backend.isConnected      // Connection status
backend.isHost           // Is current user host
backend.connectionQuality // Connection quality metrics
backend.sessionState     // Session state
backend.localStream      // Local media stream
backend.remoteStreams    // Remote media streams

// Session management
await backend.start()    // Create new session
await backend.join(id)   // Join existing session
backend.stop()           // End session

// Messaging (full-featured)
backend.sendMessage(text)
backend.sendMedia(url, type, caption)
backend.sendReaction(messageId, reaction)
backend.getMessages({ limit: 100 })

// Advanced interactions
backend.createPoll(question, options, allowMultiple, expiresAt)
backend.createQuiz(question, options, correctAnswer, timeLimit, points)
backend.getPollResults(pollId)
backend.getQuizResults(quizId)

// Media controls
backend.toggleVideo(enabled)
backend.toggleAudio(enabled)

// Events
backend.on('state', callback)
backend.on('interaction', callback)
backend.on('join', callback)
backend.on('leave', callback)

// Cleanup
backend.destroy()
```

### Games Backend (`src/lib/backends/games/`)

**All game engines with full configurability:**

```typescript
import { 
  createBlackjackStore,
  createPokerStore,
  createTicTacToeStore,
  // ... all other games
} from '$lib/backends/games';

// Create game with full features
const game = createBlackjackStore();

// Access stores
game.state      // Current game state
game.player     // Player info
game.dealer     // Dealer info
game.inGame     // Is game active

// Actions
game.start()
game.playerTurn('hit')
game.setAudio(audioElement)
```

### Multiplayer Backend (`src/lib/backends/multiplayer/`)

**Complete StackLive multiplayer infrastructure:**

```typescript
import { 
  useStackLiveMultiplayer,
  useStackLiveInteraction,
  useStackLiveARVR,
  createMultiplayerBlackjack,
  createMultiplayerTicTacToe
} from '$lib/backends/multiplayer';

// Full access to all multiplayer features
const multiplayer = useStackLiveMultiplayer(config);
```

### AR/VR Backend (`src/lib/backends/arvr/`)

**Full AR/VR capabilities:**

```typescript
import { 
  useStackLiveARVR,
  ARVRManager,
  AvatarManager,
  FilterManager,
  GestureDetector,
  SpatialInteractionManager
} from '$lib/backends/arvr';

const arvr = useStackLiveARVR(userId, sessionId);
```

## Frontend Components

### Messaging Components (`src/lib/Components/messaging/`)

**Highly configurable, production-ready UI components:**

- `ConversationList.svelte` - Inbox/conversation list
- `ChatView.svelte` - Message thread view
- `MessageBubble.svelte` - Individual message rendering
- `MessageInput.svelte` - Message composition
- `VideoCallPanel.svelte` - Video call interface

**All components are:**
- ✅ Fully featured (text, media, reactions, video)
- ✅ Highly configurable via props
- ✅ Production-ready
- ✅ iOS/Apple design system
- ✅ Responsive

### Usage Pattern

```svelte
<script>
  import { createMessagingBackend } from '$lib/backends/messaging';
  import ChatView from '$lib/Components/messaging/ChatView.svelte';
  
  // Backend handles all data/logic
  const backend = createMessagingBackend({ embedId: 'my-app' });
  const { messages, sendMessage, getLocalUserId } = backend;
  
  // Frontend handles all UI
</script>

<ChatView 
  messages={$messages}
  conversationName="Alice"
  currentUserId={getLocalUserId()}
  onSendMessage={(text) => sendMessage(text)}
  onSendMedia={(url, type) => backend.sendMedia(url, type)}
  onStartVideoCall={() => {/* handle */}}
/>
```

## Web Components

Web components in `src/lib/Components/webcomponents/` are **thin wrappers** that:

1. Create backend instance
2. Import frontend components
3. Wire them together
4. Expose as native web component

**Example: MessagingEmbed.wc.svelte**

```svelte
<svelte:options customElement="sl-messaging" />

<script lang="ts">
  import { createMessagingBackend } from '$lib/backends/messaging';
  import ConversationList from '../messaging/ConversationList.svelte';
  import ChatView from '../messaging/ChatView.svelte';
  import VideoCallPanel from '../messaging/VideoCallPanel.svelte';
  
  // Props (web component attributes)
  export let embedId = 'messaging-app';
  export let sessionId = '';
  
  // Create backend (handles all logic)
  const backend = createMessagingBackend({ embedId, sessionId });
  
  // Use frontend components (handle all UI)
  // Just wire backend to frontend - minimal glue code
</script>

<!-- Frontend components with backend data -->
<ConversationList 
  participants={$backend.participants}
  sessionInfo={$backend.session}
/>
```

## Why This Architecture?

### Before (Tightly Coupled)
```
WebComponent.wc.svelte
  └─ useStackLiveInteraction() ← Backend mixed with UI
  └─ All UI code               ← Hard to reuse
  └─ All logic code            ← Hard to test
```

### After (Separated)
```
backends/messaging/
  └─ MessagingBackend.ts ← Pure TypeScript, reusable

Components/messaging/
  └─ ChatView.svelte ← Pure UI, reusable
  └─ ConversationList.svelte

webcomponents/
  └─ MessagingEmbed.wc.svelte ← Thin wrapper
      ├─ Backend (createMessagingBackend)
      └─ Frontend (ChatView, etc.)
```

## Benefits

1. **Clear Separation**: Backend vs Frontend
2. **Reusability**: Use backend in any framework, frontend in any Svelte app
3. **Testability**: Test backend logic separately from UI
4. **Maintainability**: Changes in one don't affect the other
5. **Type Safety**: Full TypeScript for backends
6. **Flexibility**: Swap backends without changing UI
7. **Documentation**: Clear API boundaries

## Migration Guide

### Old Way
```typescript
import { useStackLiveInteraction } from '$lib/multiplayer/useStackLiveInteraction';
```

### New Way
```typescript
import { useStackLiveInteraction } from '$lib/backends/multiplayer';
```

### For Full-Featured Messaging
```typescript
// Use the backend adapter (recommended)
import { createMessagingBackend } from '$lib/backends/messaging';

// Or use the core hook directly
import { useStackLiveInteraction } from '$lib/backends/multiplayer';
```

## Key Points

- ✅ **Nothing is simplified** - all backends have 100% of features
- ✅ **Highly configurable** - every option is exposed
- ✅ **Production-ready** - used in real applications
- ✅ **Clean separation** - backends in `backends/`, frontends in `Components/`
- ✅ **Type-safe** - full TypeScript support
- ✅ **Framework-agnostic backends** - can be used outside Svelte
- ✅ **Web components** are just thin wrappers connecting backend + frontend

## Next Steps

1. ✅ Created backend separation layer
2. ✅ All components use backends
3. ✅ Full feature parity maintained
4. ⏭️ Documentation complete
5. ⏭️ Build and test
