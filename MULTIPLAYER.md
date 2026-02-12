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
- 🎭 Interactive embeds (polls, quizzes, live classrooms)
- 📹 Video/audio broadcasting
- 🔄 Bi-directional real-time communication

## 🏗 Architecture

```
┌───────────────────────────────────────────────────────────┐
│ StackLive Realtime Interaction Runtime (SRIR)            │
│  - Session Manager (embeds, games, classes, polls)       │
│  - Interaction Manager (polls, quizzes, reactions)       │
│  - Media Stream Manager (video/audio)                    │
│  - Authority Engine                                      │
│  - State Sync Adapter                                    │
│  - Reconnect Manager                                     │
│  - Latency Manager                                       │
│  - Presence Manager                                      │
└───────────────────────────────────────────────────────────┘
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
   - Participant roles (host, player, spectator, viewer, presenter)
   - Session types (game, class, quiz, poll, dashboard, collaborative)
   - Authority modes (host-authoritative, deterministic-lockstep, mesh)
   - Interactive message types (polls, quizzes, reactions, snaps)
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
   - Support for embed-based sessions (optional gameId)

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

7. **Realtime Interaction Runtime** (`useStackLiveInteraction.ts`) ✨ NEW
   - Universal hook for embeds (games, classrooms, polls, etc.)
   - Bi-directional communication
   - Publisher/host and participant/viewer modes
   - Interactive message handling (polls, quizzes, reactions, snaps)
   - Video/audio streaming support
   - Session lifecycle management

8. **Interaction Manager** (`InteractionManager.ts`) ✨ NEW
   - Poll creation and response handling
   - Quiz creation and scoring
   - Reaction broadcasting
   - Snap message handling
   - Results aggregation

9. **Media Stream Manager** (`MediaStreamManager.ts`) ✨ NEW
   - Local video/audio initialization
   - Remote stream management
   - Track enable/disable (video/audio toggle)
   - Multi-stream support for multiple participants

10. **Lobby UI Component** (`MultiplayerLobby.svelte`)
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

#### `useStackLiveInteraction(config)` ✨ NEW

Universal realtime embed interaction hook for bi-directional communication.

**Configuration:**
```typescript
interface StackLiveInteractionConfig {
  embedId?: string;           // Unique identifier for the embed
  type?: SessionType;         // 'game' | 'class' | 'quiz' | 'poll' | 'dashboard'
  sessionId?: string;         // Join existing session (for participants/viewers)
  maxParticipants?: number;   // Max participants (default: 10)
  video?: boolean;            // Enable video streaming
  audio?: boolean;            // Enable audio streaming
  debug?: boolean;            // Debug mode
}
```

**Publisher/Host Usage:**
```typescript
import { useStackLiveInteraction } from '@/lib/multiplayer';

const session = useStackLiveInteraction({
  embedId: "math-101",
  type: "class",
  video: true,
  audio: true,
  maxParticipants: 30,
});

// Start a session
await session.start();

// Create a poll
const poll = session.createPoll("Best move?", ["Option A", "Option B", "Option C"]);

// Create a quiz
const quiz = session.createQuiz("2+2=?", ["3", "4", "5"], 1); // correct answer index: 1

// Send state updates
session.send({ type: "state", payload: gameState });

// Handle interactions
session.on("interaction", (msg) => {
  console.log("Received interaction:", msg);
});

// Stop session
session.stop();
```

**Participant/Viewer Usage:**
```typescript
const viewer = useStackLiveInteraction({ 
  sessionId: "session-xyz" 
});

// Join the session
await viewer.connect({ role: "viewer" });

// Receive state updates
viewer.on("state", (state) => {
  console.log("State update:", state);
});

// Submit poll answer
viewer.send({ 
  type: "poll", 
  payload: { pollId: "poll-123", answers: [1] } 
});

// Submit quiz answer
viewer.send({ 
  type: "quiz", 
  payload: { quizId: "quiz-456", answer: 1 } 
});

// Send reaction
viewer.send({ type: "reaction", payload: "👍" });
```

**Returns:**
- **Stores:** 
  - `session` - Current session data
  - `participants` - List of participants
  - `connectionQuality` - Connection metrics
  - `sessionState` - Session lifecycle state
  - `isHost` - Whether user is host
  - `isConnected` - Connection status
  - `localStream` - Local media stream
  - `remoteStreams` - Map of remote media streams

- **Actions:**
  - `start()` - Start new session as host
  - `connect(options)` - Join existing session
  - `stop()` - Stop/leave session
  - `send(message)` - Send messages (state, poll, quiz, reaction, snap)
  - `on(event, callback)` - Register event listeners

- **Interaction Helpers:**
  - `createPoll(question, options, allowMultiple?, expiresAt?)` - Create poll
  - `createQuiz(question, options, correctAnswer?, timeLimit?, points?)` - Create quiz
  - `getPollResults(pollId)` - Get poll responses
  - `getQuizResults(quizId)` - Get quiz responses

- **Media Controls:**
  - `toggleVideo(enabled)` - Enable/disable video
  - `toggleAudio(enabled)` - Enable/disable audio

#### `InteractionManager` ✨ NEW

Manages interactive messages (polls, quizzes, reactions, snaps).

**Methods:**
- `on(type, callback)` - Listen to interaction events
- `handleInteraction(type, payload, fromUserId)` - Process incoming interaction
- `createPoll(...)` - Create and broadcast poll
- `createQuiz(...)` - Create and broadcast quiz
- `getPollResults(pollId)` - Get poll results
- `getQuizResults(quizId)` - Get quiz results

#### `MediaStreamManager` ✨ NEW

Manages video and audio streams for realtime interactions.

**Methods:**
- `initializeLocalStream(config)` - Initialize camera/microphone
- `getLocalStream()` - Get local media stream
- `addRemoteStream(userId, stream)` - Add remote participant stream
- `removeRemoteStream(userId)` - Remove remote stream
- `getRemoteStream(userId)` - Get stream for specific user
- `getAllRemoteStreams()` - Get all remote streams
- `toggleVideo(enabled)` - Enable/disable video track
- `toggleAudio(enabled)` - Enable/disable audio track
- `stopLocalStream()` - Stop local stream
- `destroy()` - Cleanup all streams

## 🎓 Example Use Cases

### 1. Interactive Classroom

```typescript
// Teacher/Host embed
const teacher = useStackLiveInteraction({
  embedId: "math-101",
  type: "class",
  video: true,
  audio: true,
  maxParticipants: 30,
});

await teacher.start();

// Run a quiz
const quiz = teacher.createQuiz(
  "What is 2+2?", 
  ["3", "4", "5"], 
  1, // correct answer index
  30, // 30 second time limit
  10  // 10 points
);

// Handle student answers
teacher.on("interaction", (msg) => {
  if (msg.type === "quiz") {
    const results = teacher.getQuizResults(quiz.id);
    console.log(`${results.length} students answered`);
  }
});

// Student/Viewer embed
const student = useStackLiveInteraction({ 
  sessionId: "session-xyz" 
});

await student.connect({ role: "viewer" });

// Submit quiz answer
student.send({ 
  type: "quiz", 
  payload: { quizId: quiz.id, answer: 1 } 
});
```

### 2. Live Poll

```typescript
// Host creates poll
const poll = useStackLiveInteraction({
  embedId: "team-standup",
  type: "poll",
});

await poll.start();

const question = poll.createPoll(
  "What should we work on next?",
  ["Feature A", "Feature B", "Bug fixes"],
  true // allow multiple selections
);

// Participants respond
const participant = useStackLiveInteraction({ 
  sessionId: "poll-session-123" 
});

await participant.connect({ role: "viewer" });

participant.send({ 
  type: "poll", 
  payload: { pollId: question.id, answers: [0, 2] } // votes for options 0 and 2
});

// Host views results
const results = poll.getPollResults(question.id);
console.log(`Total responses: ${results.length}`);
```

### 3. Multiplayer Game with Live Chat

```typescript
// Game host
const game = useStackLiveInteraction({
  embedId: "tic-tac-toe",
  type: "game",
  maxParticipants: 2,
});

await game.start();

// Broadcast game state
game.send({ 
  type: "state", 
  payload: { board: [...], turn: "player1" } 
});

// Send reactions
game.send({ type: "reaction", payload: "🎉" });

// Players join
const player = useStackLiveInteraction({ 
  sessionId: "game-xyz" 
});

await player.connect({ role: "player" });

// Receive game state
player.on("state", (state) => {
  renderBoard(state.board);
});

// Send game input
player.send({ 
  type: "input", 
  payload: { move: [0, 0] } 
});
```

### 4. Collaborative Dashboard

```typescript
const dashboard = useStackLiveInteraction({
  embedId: "analytics-dashboard",
  type: "collaborative",
  maxParticipants: 50,
});

await dashboard.start();

// Broadcast data updates
setInterval(() => {
  dashboard.send({ 
    type: "state", 
    payload: { metrics: getLatestMetrics() } 
  });
}, 5000);

// Create interactive poll for team decisions
dashboard.createPoll(
  "Should we launch this feature?",
  ["Yes", "No", "Need more data"]
);

// Viewers see live updates
const viewer = useStackLiveInteraction({ 
  sessionId: "dashboard-session" 
});

await viewer.connect({ role: "viewer" });

viewer.on("state", (metrics) => {
  updateCharts(metrics);
});
```

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

**Status:** Core infrastructure complete with realtime interaction runtime. Ready for game integration, Convex signaling implementation, and production deployment.

**New in v2.0:**
- ✨ Universal realtime embed interaction layer (`useStackLiveInteraction`)
- 📊 Interactive components (polls, quizzes, reactions, snaps)
- 📹 Video/audio streaming support
- 🔄 Bi-directional real-time communication
- 🎯 Support for multiple session types (games, classes, polls, dashboards)
