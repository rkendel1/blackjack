# TicTacToe Multiplayer Guide

## Overview

The TicTacToe game includes a fully-featured multiplayer mode that allows two players to play together in real-time using session-based invites and StackLive multiplayer infrastructure.

## Features

### ✅ Session Management
- **Host creates session**: The first player creates a new multiplayer session
- **Guest joins via link**: Second player joins using a unique invite URL
- **Session ID tracking**: Each game session has a unique identifier
- **Automatic role assignment**: Host plays as X, Guest plays as O

### ✅ Invite System
- **One-click invite link**: Host can copy invite link to clipboard
- **URL-based joining**: Guest joins by opening the invite URL
- **No registration required**: Players can join immediately with just the link

### ✅ Real-time Gameplay
- **Turn-based mechanics**: Players alternate turns automatically
- **State synchronization**: Game board syncs in real-time between players
- **Move validation**: Invalid moves are rejected
- **Winner detection**: Automatic win/draw detection

### ✅ Connection Management
- **Status tracking**: Shows connection status for all participants
- **Participant list**: Displays all connected players
- **Leave functionality**: Players can leave the game at any time

## How to Play Multiplayer

### For the Host (Player 1)

1. **Navigate to multiplayer mode**
   - Go to `/tictactoe-multiplayer`
   - Or click "Play Multiplayer" from single-player mode

2. **Create session**
   - Session is created automatically
   - You are assigned the X symbol (goes first)

3. **Invite a friend**
   - Click the "📋 Copy Invite Link" button
   - Share the link with your friend via chat, email, etc.

4. **Wait for player 2**
   - The UI shows "Waiting for 1/2 players..."
   - Once your friend joins, it shows "Waiting for 2/2 players..."

5. **Start the game**
   - Click "Start Game" when both players are ready
   - You go first (as X)

6. **Play your turn**
   - Click any empty cell when it's your turn
   - Wait for your opponent to make their move

### For the Guest (Player 2)

1. **Open the invite link**
   - Paste the link in your browser
   - Example: `http://yoursite.com/tictactoe-multiplayer?session=abc123xyz`

2. **Join automatically**
   - Session joins automatically
   - You are assigned the O symbol

3. **Wait for host to start**
   - The host will start the game
   - You go second (as O)

4. **Play your turn**
   - Wait for X to move first
   - Click any empty cell when it's your turn

## Technical Implementation

### Architecture

```
┌─────────────────────────────────────────────────┐
│         Multiplayer TicTacToe System            │
├─────────────────────────────────────────────────┤
│                                                 │
│  Host (Player X)              Guest (Player O)  │
│  ┌──────────────┐            ┌──────────────┐  │
│  │ TicTacToe    │            │ TicTacToe    │  │
│  │ Engine       │◄───sync───►│ (State Only) │  │
│  └──────────────┘            └──────────────┘  │
│         │                            │         │
│         ▼                            ▼         │
│  ┌──────────────┐            ┌──────────────┐  │
│  │ GameState    │            │ Input        │  │
│  │ SyncManager  │            │ Messages     │  │
│  └──────────────┘            └──────────────┘  │
│         │                            │         │
│         └────────────┬───────────────┘         │
│                      ▼                         │
│            ┌──────────────────┐                │
│            │  StackLive       │                │
│            │  Multiplayer     │                │
│            │  Runtime         │                │
│            └──────────────────┘                │
│                      │                         │
│            ┌─────────┴─────────┐               │
│            ▼                   ▼               │
│      ┌──────────┐        ┌──────────┐          │
│      │ WebRTC   │        │ Convex   │          │
│      │ P2P      │        │ Backend  │          │
│      └──────────┘        └──────────┘          │
└─────────────────────────────────────────────────┘
```

### Key Components

1. **MultiplayerTicTacToe** (`src/lib/multiplayer/games/MultiplayerTicTacToe.ts`)
   - Main multiplayer game logic
   - Integrates TicTacToe engine with multiplayer runtime
   - Manages host/guest modes
   - Handles move synchronization

2. **TicTacToeEngine** (`src/lib/games/tictactoe/engine/TicTacToeEngine.ts`)
   - Core game logic (single player + multiplayer)
   - Move validation
   - Win condition checking
   - Minimax AI for single player

3. **GameStateSyncManager** (`src/lib/multiplayer/GameStateSyncManager.ts`)
   - Synchronizes game state between players
   - Handles actions and snapshots
   - Manages frame-based updates

4. **useStackLiveMultiplayer** (`src/lib/multiplayer/useStackLiveMultiplayer.ts`)
   - Session creation and joining
   - Participant management
   - Message routing
   - Connection handling

### Session Flow

```
Host creates session
    ↓
StackLive assigns session ID
    ↓
Host copies invite link with session ID
    ↓
Guest opens link with ?session=<id>
    ↓
Guest auto-joins session
    ↓
Host sees 2/2 players
    ↓
Host starts game
    ↓
Game begins (X goes first)
    ↓
Host makes move (as X)
    ↓
State syncs to Guest
    ↓
Guest makes move (as O)
    ↓
Guest sends input to Host
    ↓
Host validates and applies move
    ↓
State syncs to Guest
    ↓
... continue until win/draw ...
```

### Host-Authoritative Model

The multiplayer implementation uses a **host-authoritative** model:

- **Host** runs the TicTacToe engine
- **Host** validates all moves
- **Host** broadcasts state updates
- **Guest** sends move requests to host
- **Guest** receives and displays state from host

This prevents cheating and ensures game integrity.

## Code Examples

### Creating a Multiplayer Game

```typescript
// Host creates new session
const game = createMultiplayerTicTacToe();

// Guest joins existing session
const sessionId = new URLSearchParams(window.location.search).get('session');
const game = createMultiplayerTicTacToe(sessionId);
```

### Making a Move

```svelte
<script>
  const { makeMove, isMyTurn, board } = game;

  function handleCellClick(position: number) {
    if ($board[position] === null && $isMyTurn) {
      makeMove(position);
    }
  }
</script>

<button on:click={() => handleCellClick(0)}>
  {$board[0] || ''}
</button>
```

### Copying Invite Link

```svelte
<script>
  const { session } = game;

  function copyInviteLink() {
    const url = `${window.location.origin}/tictactoe-multiplayer?session=${$session.sessionId}`;
    navigator.clipboard.writeText(url);
  }
</script>

<button on:click={copyInviteLink}>
  📋 Copy Invite Link
</button>
```

## API Reference

### Stores

| Store | Type | Description |
|-------|------|-------------|
| `session` | `StackLiveSession \| null` | Current session data |
| `sessionState` | `SessionState` | Session state (waiting/active/ended) |
| `isHost` | `boolean` | True if current player is host |
| `board` | `(Player \| null)[]` | 9-element game board |
| `status` | `GameStatus` | Game status (playing/won/draw) |
| `winner` | `Player \| null` | Winning player (X or O) |
| `winningLine` | `number[] \| null` | Positions of winning line |
| `isMyTurn` | `boolean` | True if it's current player's turn |
| `gameStarted` | `boolean` | True if game has started |
| `mySymbol` | `Player \| null` | Current player's symbol (X or O) |

### Actions

| Action | Parameters | Description |
|--------|------------|-------------|
| `startGame()` | None | Start the game (host only) |
| `makeMove(position)` | `position: number` | Make a move at position 0-8 |
| `resetGame()` | None | Reset the game (host only) |
| `leave()` | None | Leave the game session |

## Troubleshooting

### Guest Can't Join

**Problem**: Guest clicks invite link but can't connect

**Solutions**:
- Check if session ID is in URL (`?session=...`)
- Verify StackLive/Convex backend is running
- Check browser console for errors
- Ensure both players have internet connection

### Moves Not Syncing

**Problem**: One player makes a move but other doesn't see it

**Solutions**:
- Check connection status in the players list
- Verify both players show "connected" status
- Refresh both browser pages
- Check if host's engine is running properly

### Can't Copy Invite Link

**Problem**: Copy button doesn't work

**Solutions**:
- Browser may block clipboard access
- Use HTTPS (required for clipboard API)
- Manually copy URL from address bar and add `?session=<id>`

## Future Enhancements

Potential improvements for the multiplayer system:

- [ ] Spectator mode for watching games
- [ ] Game history/replay system
- [ ] Chat between players
- [ ] Rematch functionality
- [ ] Tournament bracket system
- [ ] ELO rating system
- [ ] Ranked matchmaking
- [ ] Time controls (timed turns)

## See Also

- [MULTIPLAYER.md](./MULTIPLAYER.md) - General multiplayer documentation
- [STACKLIVE_INTEGRATION.md](./STACKLIVE_INTEGRATION.md) - StackLive integration guide
- Single-player TicTacToe: `/tictactoe`
- Multiplayer TicTacToe: `/tictactoe-multiplayer`
