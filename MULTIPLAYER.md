# StackLive Realtime Multiplayer Platform (SRMP)

A production-grade, WebRTC-based multiplayer infrastructure for real-time card games and interactive experiences.

## 🎯 Overview

The StackLive Realtime Multiplayer Platform is a first-class platform capability that enables:
- 🎮 Embedded multiplayer games
- 📊 Collaborative dashboards
- 🧑‍🤝‍🧑 Social experiences
- 📱 Multi-device QR linking
- 🎥 Screen sync & spectator mode
- 🧩 Real-time state synchronization

## 🏗 Architecture

```
┌──────────────────────────────────────┐
│ StackLive Multiplayer Runtime (SMR)  │
│  - Session Manager                   │
│  - Authority Engine                  │
│  - State Sync Adapter                │
│  - Reconnect Manager                 │
│  - Latency Manager                   │
│  - Presence Manager                  │
└──────────────────────────────────────┘
               │
     ┌─────────┴─────────┐
     ▼                   ▼
WebRTC P2P        Future: Convex
(Data Channels)   (Signaling Server)
```

## 🚀 Features

### ✅ Implemented

1. **Core Runtime Types** (`types.ts`)
   - Session lifecycle states (IDLE, CREATING, WAITING_FOR_PLAYERS, etc.)
   - Participant roles (host, player, spectator)
   - Authority modes (host-authoritative, deterministic-lockstep, mesh)
   - Message protocol definitions

2. **WebRTC Connection Manager** (`PeerConnectionManager.ts`)
   - Peer-to-peer data channel setup
   - ICE candidate handling
   - Connection state monitoring
   - Automatic reconnection attempts
   - Message serialization/deserialization

3. **Session Management** (`SessionManager.ts`)
   - Session creation and lifecycle
   - Participant join/leave handling
   - State machine with validation
   - Session expiration tracking
   - Host migration capabilities

4. **Latency Monitoring** (`LatencyManager.ts`)
   - Real-time ping measurement
   - Average RTT calculation
   - Jitter detection
   - Connection quality metrics
   - Automatic quality classification

5. **Multiplayer Runtime** (`StackLiveMultiplayerRuntime.ts`)
   - Unified API for all multiplayer features
   - Event-driven architecture
   - Input/state synchronization
   - Debug mode with logging
   - Lifecycle event callbacks

6. **Svelte Integration** (`useStackLiveMultiplayer.ts`)
   - Reactive stores for session state
   - Automatic UI updates
   - Simple developer API
   - Connection quality monitoring

7. **Lobby UI Component** (`MultiplayerLobby.svelte`)
   - Session creation interface
   - Join existing sessions
   - Participant list with status
   - Connection quality display
   - Share invite links

### 🔜 Planned Features

1. **Convex Signaling Server**
   - WebRTC offer/answer exchange
   - ICE candidate relay
   - Session discovery
   - Matchmaking queues

2. **Matchmaking System**
   - Player skill ratings
   - Region-based matching
   - Queue management
   - Auto-session creation

3. **Game Integration**
   - Blackjack multiplayer
   - Poker multiplayer
   - War multiplayer
   - Generic game adapter

4. **Advanced Features**
   - Screen sharing
   - Multi-device linking
   - Spectator mode
   - Replay system

## 📋 Usage

### Basic Example

```typescript
import { useStackLiveMultiplayer } from '$lib/multiplayer';

const mp = useStackLiveMultiplayer({
  gameId: 'blackjack',
  mode: 'host-authoritative',
  maxPlayers: 4,
  spectators: true,
  debug: true
});

// Create a session
const session = await mp.createSession();

// Send game input
mp.sendInput({ action: 'hit' });

// Listen for inputs from other players
mp.onInput((input) => {
  console.log('Received input:', input);
});

// Send state updates (host only)
mp.sendState(gameState);

// Listen for state updates
mp.onStateSync((state) => {
  console.log('Synced state:', state);
});
```

### Svelte Component Example

```svelte
<script lang="ts">
  import MultiplayerLobby from '$lib/Components/MultiplayerLobby.svelte';
</script>

<MultiplayerLobby 
  gameId="blackjack" 
  maxPlayers={4} 
  allowSpectators={true} 
/>
```

## 🔐 Authority Model

**Default: Host-Authoritative**

- Host owns canonical game state
- Guests send inputs only
- Host validates and broadcasts state
- Prevents cheating and desync
- Easier recovery and spectator support

## 📡 Data Channel Protocol

Universal message protocol:

```typescript
type StackLiveMessage =
  | { type: 'input'; frame: number; payload: any }
  | { type: 'state'; payload: any }
  | { type: 'sync-request' }
  | { type: 'sync-response'; payload: any }
  | { type: 'presence'; user: User }
  | { type: 'ping'; ts: number }
  | { type: 'pong'; ts: number }
  | { type: 'lobby-update'; players: Participant[] };
```

## 🔄 Session Lifecycle

```
IDLE
  ↓
CREATING
  ↓
WAITING_FOR_PLAYERS
  ↓
CONNECTING
  ↓
SYNCING
  ↓
IN_GAME
  ↓ (if needed)
PAUSED / RECONNECTING
  ↓
ENDED
```

## 🌐 WebRTC Configuration

Currently using public STUN servers:
- stun:stun.l.google.com:19302
- stun:stun1.l.google.com:19302

**Note:** For production deployment, TURN servers should be added for NAT traversal.

## 📊 Connection Quality Metrics

The system continuously monitors:
- **Latency**: Round-trip time (RTT)
- **Jitter**: Variation in latency
- **Packet Loss**: Estimated based on jitter
- **Quality**: Classified as excellent/good/fair/poor

## 🧪 Testing

Visit `/multiplayer` route to access the demo page with:
- Interactive lobby creation
- Session joining
- Real-time connection monitoring
- Architecture visualization
- Implementation status

## 📚 API Reference

### Core Classes

#### `StackLiveMultiplayerRuntime`

Main runtime class for multiplayer functionality.

**Methods:**
- `createSession()` - Create a new multiplayer session
- `joinSession(sessionId)` - Join an existing session
- `leaveSession()` - Leave the current session
- `sendInput(payload)` - Send input to other players
- `sendState(payload)` - Send state update (host only)
- `requestStateSync()` - Request state from host
- `getLatency()` - Get current latency
- `getConnectionQuality()` - Get connection metrics
- `on(eventType, callback)` - Listen to lifecycle events

#### `useStackLiveMultiplayer(config)`

Svelte store adapter for reactive multiplayer state.

**Returns:**
- Stores: `session`, `participants`, `connectionQuality`, `sessionState`, `isHost`
- Actions: `createSession`, `joinSession`, `leaveSession`, `sendInput`, `sendState`

## 🛠 Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Type check
npm run check
```

## 📝 License

MIT License - See LICENSE.txt for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests.

---

**Status:** Core infrastructure complete, ready for game integration and Convex signaling implementation.
