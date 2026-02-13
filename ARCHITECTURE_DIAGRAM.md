# Architecture Diagram - Backend Separation Layer

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      YOUR APPLICATION                            │
│   (Svelte App, React App, Vue App, Plain HTML/JS, etc.)        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Import or Embed
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    WEB COMPONENTS LAYER                          │
│              (Thin wrappers - minimal logic)                     │
│                                                                  │
│  <sl-messaging>  <sl-tictactoe>  <sl-arvr-scene>  <sl-room>   │
│                                                                  │
│  Just connect Backend ←→ Frontend                               │
└────────────────┬────────────────────────────────┬────────────────┘
                 │                                │
        Imports Backend                  Imports Frontend
                 │                                │
                 ↓                                ↓
┌────────────────────────────────┐  ┌────────────────────────────┐
│      BACKEND LAYER             │  │     FRONTEND LAYER         │
│   src/lib/backends/            │  │  src/lib/Components/       │
│                                │  │                            │
│  📦 messaging/                 │  │  🎨 messaging/             │
│     • MessagingBackend.ts      │  │     • ChatView.svelte      │
│     • Full StackLive           │  │     • ConversationList     │
│     • WebRTC, sessions         │  │     • MessageBubble        │
│     • Polls, quizzes           │  │     • MessageInput         │
│     • Video/audio              │  │     • VideoCallPanel       │
│                                │  │                            │
│  📦 games/                     │  │  🎨 game UI components     │
│     • All game engines         │  │     • BlackjackTable       │
│     • Game adapters            │  │     • Card components      │
│     • State management         │  │     • Game controls        │
│                                │  │                            │
│  📦 multiplayer/               │  │  🎨 multiplayer UI         │
│     • StackLiveRuntime         │  │     • PlayerList           │
│     • SessionManager           │  │     • GameLobby            │
│     • PeerConnections          │  │     • StatusIndicators     │
│     • MediaStreamManager       │  │                            │
│                                │  │                            │
│  📦 arvr/                      │  │  🎨 AR/VR UI               │
│     • ARVRManager              │  │     • ARVRAvatar           │
│     • AvatarManager            │  │     • ARVRFilter           │
│     • FilterManager            │  │     • ARVRSpatial          │
│     • GestureDetector          │  │                            │
│                                │  │                            │
│  📦 utils/                     │  │                            │
│     • Browser utilities        │  │                            │
│                                │  │                            │
│  📦 animation/                 │  │                            │
│     • Animation helpers        │  │                            │
│                                │  │                            │
│  100% TypeScript               │  │  100% Svelte               │
│  Framework-agnostic core       │  │  Highly configurable       │
│  All features exposed          │  │  Production-ready          │
└────────────────────────────────┘  └────────────────────────────┘
```

## Data Flow Example: Sending a Message

```
USER ACTION                    FRONTEND                    BACKEND                    NETWORK
    │                             │                           │                          │
    │ 1. Clicks "Send"            │                           │                          │
    ├──────────────────────────→  │                           │                          │
    │                             │                           │                          │
    │                             │ 2. Calls onSendMessage()  │                          │
    │                             ├─────────────────────────→ │                          │
    │                             │                           │                          │
    │                             │                           │ 3. sendMessage(text)     │
    │                             │                           │   • Creates message obj  │
    │                             │                           │   • Validates data       │
    │                             │                           │   • Updates local store  │
    │                             │                           │                          │
    │                             │                           │ 4. Sends via WebRTC      │
    │                             │                           ├────────────────────────→ │
    │                             │                           │                          │
    │                             │ 5. Updates messages store │                          │
    │                             │ ←─────────────────────────┤                          │
    │                             │   (Svelte reactivity)     │                          │
    │                             │                           │                          │
    │                             │ 6. Re-renders UI          │                          │
    │                             │   MessageBubble appears   │                          │
    │ ←──────────────────────────┤                           │                          │
    │ Message visible!            │                           │                          │
```

## Component Interaction: Messaging Example

```
MessagingEmbed.wc.svelte (Web Component)
│
├─ Imports Backend
│  └─ createMessagingBackend({ config })
│     └─ Returns: { session, participants, messages, sendMessage, ... }
│
├─ Imports Frontend Components
│  ├─ ConversationList.svelte
│  ├─ ChatView.svelte
│  └─ VideoCallPanel.svelte
│
└─ Wires Them Together
   ├─ Pass backend.participants → ConversationList
   ├─ Pass backend.messages → ChatView
   ├─ Pass backend.sendMessage → ChatView.onSendMessage
   └─ Pass backend.localStream → VideoCallPanel
```

## Why This Architecture Works

### Before: Tightly Coupled ❌
```
Component.svelte
├─ import useStackLiveInteraction from 'multiplayer/...'
├─ UI Code (100 lines)
├─ Backend Logic (200 lines)
├─ More UI (50 lines)
└─ More Backend (100 lines)
     ↓
  Hard to test
  Hard to reuse
  Mixed concerns
```

### After: Separated ✅
```
MessagingBackend.ts                    ChatView.svelte
├─ Pure TypeScript                     ├─ Pure Svelte
├─ Business logic                      ├─ UI presentation
├─ State management                    ├─ User interaction
├─ Network/WebRTC                      ├─ Visual design
└─ Framework agnostic                  └─ Highly configurable
     ↓                                      ↓
  Easy to test                          Easy to style
  Works anywhere                        Easy to customize
  Clean interface                       Reusable
```

## Type Safety Across Layers

```typescript
// Backend defines the contract
interface MessagingBackend {
  session: Writable<Session | null>;
  participants: Writable<Participant[]>;
  sendMessage: (text: string) => void;
  // ... all other features
}

// Frontend consumes with full type safety
<script lang="ts">
  import type { MessagingBackend } from '$lib/backends/messaging';
  
  export let backend: MessagingBackend;
  // TypeScript ensures we use the right types!
</script>
```

## Configuration Flow

```
User Config (Web Component Attributes)
  embedId="my-app"
  sessionId="abc123"
  enableVideo="true"
  maxParticipants="50"
         ↓
Web Component Wrapper
  Parses string → proper types
  enableVideo="true" → true (boolean)
  maxParticipants="50" → 50 (number)
         ↓
Backend Configuration
  createMessagingBackend({
    embedId: 'my-app',
    sessionId: 'abc123',
    enableVideo: true,
    maxParticipants: 50
  })
         ↓
Full StackLive Infrastructure
  • Creates WebRTC connections
  • Manages sessions
  • Handles media streams
  • Syncs state
         ↓
Reactive Stores
  • session$
  • participants$
  • messages$
         ↓
Frontend Components
  • ConversationList
  • ChatView
  • VideoCallPanel
         ↓
Beautiful UI!
```

## Key Principles

1. **Single Responsibility**
   - Backend = Data, logic, infrastructure
   - Frontend = Presentation, interaction, design

2. **Open/Closed**
   - Backends expose full API (open for extension)
   - Core logic is encapsulated (closed for modification)

3. **Dependency Inversion**
   - Components depend on backend interfaces
   - Not on concrete implementations

4. **Interface Segregation**
   - Each backend exposes only what it needs
   - Clean, focused APIs

5. **DRY (Don't Repeat Yourself)**
   - Backend logic in one place
   - Frontend components reusable
   - Web components are thin wrappers

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Separation** | Mixed | Clean layers |
| **Reusability** | Limited | High |
| **Testability** | Hard | Easy |
| **Type Safety** | Partial | Complete |
| **Documentation** | Scattered | Clear |
| **Maintainability** | Complex | Simple |
| **Features** | All | All (nothing lost!) |

