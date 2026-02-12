import { h as get_store_value, c as create_ssr_component, a as subscribe, v as validate_component, e as escape, b as each } from "../../../chunks/ssr.js";
/* empty css                     */
import { B as BlackjackEngine, D as Deck, H as Hand } from "../../../chunks/Hand.js";
import { u as useStackLiveMultiplayer } from "../../../chunks/useStackLiveMultiplayer.js";
import { d as derived, w as writable } from "../../../chunks/index.js";
import { p as page } from "../../../chunks/stores.js";
import { C as CardsDefinitions } from "../../../chunks/CardsDefinitions.js";
class GameStateSyncManager {
  isHost;
  localState = null;
  sequenceNumber = 0;
  actionQueue = [];
  onStateUpdateCallback;
  onActionCallback;
  currentTurn;
  turnCallbacks = [];
  // Snapshot configuration
  snapshotInterval = 5e3;
  // Send full snapshot every 5 seconds
  lastSnapshotTime = 0;
  snapshotTimer;
  constructor(isHost) {
    this.isHost = isHost;
    if (isHost) {
      this.startSnapshotTimer();
    }
  }
  /**
   * Set local game state (host only)
   */
  setState(state) {
    if (!this.isHost) {
      console.warn("[GameSync] Only host can set state directly");
      return;
    }
    this.localState = state;
    this.sequenceNumber++;
  }
  /**
   * Get current game state
   */
  getState() {
    return this.localState;
  }
  /**
   * Apply an action to the game
   */
  applyAction(action) {
    if (action.sequenceNumber <= this.sequenceNumber) {
      console.warn("[GameSync] Received old action, ignoring");
      return;
    }
    this.sequenceNumber = action.sequenceNumber;
    this.actionQueue.push(action);
    if (this.onActionCallback) {
      this.onActionCallback(action);
    }
    console.log("[GameSync] Applied action:", action.type, "seq:", action.sequenceNumber);
  }
  /**
   * Create an action from local player
   */
  createAction(type, payload, playerId) {
    this.sequenceNumber++;
    const action = {
      type,
      payload,
      playerId,
      timestamp: Date.now(),
      sequenceNumber: this.sequenceNumber
    };
    if (this.isHost) {
      this.actionQueue.push(action);
    }
    return action;
  }
  /**
   * Create a state snapshot (host only)
   */
  createSnapshot() {
    if (!this.isHost || !this.localState) {
      return null;
    }
    return {
      state: this.localState,
      timestamp: Date.now(),
      sequenceNumber: this.sequenceNumber
    };
  }
  /**
   * Apply a state snapshot (guest only)
   */
  applySnapshot(snapshot) {
    if (this.isHost) {
      console.warn("[GameSync] Host should not apply snapshots");
      return;
    }
    if (snapshot.sequenceNumber <= this.sequenceNumber) {
      console.warn("[GameSync] Received old snapshot, ignoring");
      return;
    }
    this.localState = snapshot.state;
    this.sequenceNumber = snapshot.sequenceNumber;
    this.lastSnapshotTime = snapshot.timestamp;
    this.actionQueue = [];
    if (this.onStateUpdateCallback) {
      this.onStateUpdateCallback(snapshot.state);
    }
    console.log("[GameSync] Applied snapshot, seq:", snapshot.sequenceNumber);
  }
  /**
   * Check if snapshot should be sent
   */
  shouldSendSnapshot() {
    if (!this.isHost) return false;
    const timeSinceLastSnapshot = Date.now() - this.lastSnapshotTime;
    return timeSinceLastSnapshot >= this.snapshotInterval;
  }
  /**
   * Start periodic snapshot timer (host only)
   */
  startSnapshotTimer() {
    if (!this.isHost) return;
    this.snapshotTimer = window.setInterval(() => {
      if (this.shouldSendSnapshot() && this.onStateUpdateCallback) {
        const snapshot = this.createSnapshot();
        if (snapshot) {
          this.lastSnapshotTime = Date.now();
          this.onStateUpdateCallback(snapshot.state);
        }
      }
    }, this.snapshotInterval);
  }
  /**
   * Set current turn
   */
  setCurrentTurn(turn) {
    this.currentTurn = turn;
    this.turnCallbacks.forEach((callback) => callback(turn));
    console.log("[GameSync] Turn updated:", turn.currentPlayer, "turn", turn.turnNumber);
  }
  /**
   * Get current turn
   */
  getCurrentTurn() {
    return this.currentTurn;
  }
  /**
   * Check if it's a specific player's turn
   */
  isPlayerTurn(playerId) {
    return this.currentTurn?.currentPlayer === playerId;
  }
  /**
   * Register callback for state updates
   */
  onStateUpdate(callback) {
    this.onStateUpdateCallback = callback;
  }
  /**
   * Register callback for actions
   */
  onAction(callback) {
    this.onActionCallback = callback;
  }
  /**
   * Register callback for turn changes
   */
  onTurnChange(callback) {
    this.turnCallbacks.push(callback);
  }
  /**
   * Get action history
   */
  getActionHistory() {
    return [...this.actionQueue];
  }
  /**
   * Clear action history
   */
  clearActionHistory() {
    this.actionQueue = [];
  }
  /**
   * Cleanup
   */
  destroy() {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
    }
    this.turnCallbacks = [];
    this.onStateUpdateCallback = void 0;
    this.onActionCallback = void 0;
  }
}
class GameSyncMessageAdapter {
  /**
   * Create a StackLive message from an action
   */
  static actionToMessage(action) {
    return {
      type: "input",
      frame: action.sequenceNumber,
      payload: {
        actionType: action.type,
        actionPayload: action.payload,
        playerId: action.playerId,
        timestamp: action.timestamp
      }
    };
  }
  /**
   * Parse an action from a StackLive message
   */
  static messageToAction(message) {
    if (message.type !== "input") return null;
    const payload = message.payload;
    return {
      type: payload.actionType,
      payload: payload.actionPayload,
      playerId: payload.playerId,
      timestamp: payload.timestamp,
      sequenceNumber: message.frame
    };
  }
  /**
   * Create a StackLive message from a snapshot
   */
  static snapshotToMessage(snapshot) {
    return {
      type: "state",
      payload: {
        state: snapshot.state,
        timestamp: snapshot.timestamp,
        sequenceNumber: snapshot.sequenceNumber
      }
    };
  }
  /**
   * Parse a snapshot from a StackLive message
   */
  static messageToSnapshot(message) {
    if (message.type !== "state" && message.type !== "sync-response") return null;
    const payload = message.payload;
    return {
      state: payload.state,
      timestamp: payload.timestamp || Date.now(),
      sequenceNumber: payload.sequenceNumber || 0
    };
  }
  /**
   * Create a turn update message
   */
  static turnToMessage(turn) {
    return {
      type: "input",
      frame: turn.turnNumber,
      payload: {
        actionType: "turn_change",
        actionPayload: turn,
        playerId: turn.currentPlayer,
        timestamp: Date.now()
      }
    };
  }
}
function createMultiplayerBlackjack(sessionId) {
  const config = {
    gameId: "blackjack",
    mode: "host-authoritative",
    maxPlayers: 4,
    spectators: true,
    debug: true
  };
  const mp = useStackLiveMultiplayer(config);
  let engine = null;
  let syncManager = null;
  const gameState = writable(null);
  const myPlayerId = writable("");
  const isMyTurn = writable(false);
  const gameStarted = writable(false);
  const player = derived(gameState, ($state) => $state?.player || null);
  const dealer = derived(gameState, ($state) => $state?.dealer || null);
  const winner = derived(gameState, ($state) => $state?.winner || null);
  const turn = derived(gameState, ($state) => $state?.turn || null);
  async function initialize() {
    if (sessionId) {
      const success = await mp.joinSession(sessionId);
      if (success) {
        setupGuestMode();
      }
    } else {
      const session = await mp.createSession();
      if (session) {
        setupHostMode();
      }
    }
  }
  function setupHostMode() {
    engine = new BlackjackEngine();
    syncManager = new GameStateSyncManager(true);
    const currentSession = get_store_value(mp.session);
    if (currentSession) {
      myPlayerId.set(currentSession.hostId);
    }
    syncManager.onStateUpdate((state) => {
      mp.sendState(state);
    });
    mp.onInput((input) => {
      if (!engine || !syncManager) return;
      const action = GameSyncMessageAdapter.messageToAction({
        type: "input",
        frame: input.sequenceNumber || 0,
        payload: input
      });
      if (action) {
        handleGuestAction(action);
      }
    });
    console.log("[MP Blackjack] Host mode initialized");
  }
  function setupGuestMode() {
    syncManager = new GameStateSyncManager(false);
    const currentSession = get_store_value(mp.session);
    if (currentSession) {
      const myParticipant = currentSession.participants.find(
        (p) => p.role === "player" && !p.user
      );
      if (myParticipant) {
        myPlayerId.set(myParticipant.userId);
      }
    }
    mp.onStateSync((state) => {
      const snapshot = GameSyncMessageAdapter.messageToSnapshot({
        type: "state",
        payload: state
      });
      if (snapshot && syncManager) {
        syncManager.applySnapshot(snapshot);
        gameState.set(snapshot.state);
        checkMyTurn();
      }
    });
    mp.requestStateSync();
    console.log("[MP Blackjack] Guest mode initialized");
  }
  function handleGuestAction(action) {
    if (!engine) return;
    console.log("[MP Blackjack] Guest action:", action.type, action.payload);
    const move = action.payload;
    engine.applyMove(move);
    const newState = engine.getState();
    gameState.set(newState);
    if (syncManager) {
      syncManager.setState(newState);
    }
    checkTurnChange(newState);
  }
  function startGame() {
    if (!engine || !get_store_value(mp.isHost)) {
      console.warn("[MP Blackjack] Only host can start game");
      return;
    }
    engine.applyMove({ type: "start" });
    const newState = engine.getState();
    gameState.set(newState);
    if (syncManager) {
      syncManager.setState(newState);
    }
    gameStarted.set(true);
    console.log("[MP Blackjack] Game started");
  }
  function hit() {
    const currentPlayerId = get_store_value(myPlayerId);
    if (get_store_value(mp.isHost)) {
      if (!engine) return;
      engine.applyMove({ type: "hit" });
      const newState = engine.getState();
      gameState.set(newState);
      if (syncManager) {
        syncManager.setState(newState);
      }
      checkTurnChange(newState);
    } else {
      if (!syncManager) return;
      const action = syncManager.createAction("hit", { type: "hit" }, currentPlayerId);
      const message = GameSyncMessageAdapter.actionToMessage(action);
      {
        mp.sendInput(message.payload);
      }
    }
    console.log("[MP Blackjack] Hit");
  }
  function stand() {
    const currentPlayerId = get_store_value(myPlayerId);
    if (get_store_value(mp.isHost)) {
      if (!engine) return;
      engine.applyMove({ type: "stand" });
      const newState = engine.getState();
      gameState.set(newState);
      if (syncManager) {
        syncManager.setState(newState);
      }
      checkTurnChange(newState);
    } else {
      if (!syncManager) return;
      const action = syncManager.createAction("stand", { type: "stand" }, currentPlayerId);
      const message = GameSyncMessageAdapter.actionToMessage(action);
      {
        mp.sendInput(message.payload);
      }
    }
    console.log("[MP Blackjack] Stand");
  }
  function checkTurnChange(state) {
    if (!syncManager) return;
    const currentTurn = state.turn;
    if (currentTurn) {
      syncManager.setCurrentTurn({
        currentPlayer: currentTurn === "Player" ? get_store_value(myPlayerId) : "dealer",
        turnNumber: Date.now()
      });
    }
    checkMyTurn();
  }
  function checkMyTurn() {
    const currentState = get_store_value(gameState);
    const currentPlayerId = get_store_value(myPlayerId);
    if (!currentState || !currentPlayerId) {
      isMyTurn.set(false);
      return;
    }
    const myTurn = currentState.turn === "Player";
    isMyTurn.set(myTurn);
  }
  function leave() {
    mp.leaveSession();
    if (syncManager) {
      syncManager.destroy();
      syncManager = null;
    }
    engine = null;
    gameState.set(null);
    gameStarted.set(false);
  }
  initialize();
  return {
    // Multiplayer stores
    ...mp,
    // Game state stores
    gameState,
    player,
    dealer,
    winner,
    turn,
    isMyTurn,
    gameStarted,
    myPlayerId,
    // Actions
    startGame,
    hit,
    stand,
    leave
  };
}
const css = {
  code: ".game-container.svelte-zwyw8b.svelte-zwyw8b{display:flex;height:100dvh;width:100dvw;background:radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00)}.loading.svelte-zwyw8b.svelte-zwyw8b{display:flex;align-items:center;justify-content:center;width:100%;color:white;font-size:1.5rem}.mp-info.svelte-zwyw8b.svelte-zwyw8b{width:300px;background:rgba(0, 0, 0, 0.6);padding:1.5rem;color:white;overflow-y:auto}.info-header.svelte-zwyw8b.svelte-zwyw8b{display:flex;align-items:center;gap:1rem;margin-bottom:1rem}.info-header.svelte-zwyw8b h3.svelte-zwyw8b{margin:0;flex:1}.badge.svelte-zwyw8b.svelte-zwyw8b{padding:0.25rem 0.75rem;border-radius:12px;font-size:0.75rem;font-weight:bold}.badge.host.svelte-zwyw8b.svelte-zwyw8b{background:#4caf50}.badge.guest.svelte-zwyw8b.svelte-zwyw8b{background:#2196f3}.session-details.svelte-zwyw8b.svelte-zwyw8b{background:rgba(255, 255, 255, 0.1);padding:1rem;border-radius:8px;margin-bottom:1rem}.session-details.svelte-zwyw8b p.svelte-zwyw8b{margin:0.5rem 0;font-size:0.9rem}.start-btn.svelte-zwyw8b.svelte-zwyw8b,.share-btn.svelte-zwyw8b.svelte-zwyw8b,.leave-btn.svelte-zwyw8b.svelte-zwyw8b{width:100%;padding:0.75rem;margin:0.5rem 0;border:none;border-radius:8px;font-size:1rem;cursor:pointer;transition:all 0.2s}.start-btn.svelte-zwyw8b.svelte-zwyw8b{background:#4caf50;color:white}.start-btn.svelte-zwyw8b.svelte-zwyw8b:hover{background:#45a049}.share-btn.svelte-zwyw8b.svelte-zwyw8b{background:#2196f3;color:white}.share-btn.svelte-zwyw8b.svelte-zwyw8b:hover{background:#0b7dda}.leave-btn.svelte-zwyw8b.svelte-zwyw8b{background:#f44336;color:white}.leave-btn.svelte-zwyw8b.svelte-zwyw8b:hover{background:#da190b}.players-list.svelte-zwyw8b.svelte-zwyw8b{margin-top:1.5rem}.players-list.svelte-zwyw8b h4.svelte-zwyw8b{margin:0 0 0.75rem 0}.player-item.svelte-zwyw8b.svelte-zwyw8b{display:flex;justify-content:space-between;align-items:center;padding:0.5rem;background:rgba(255, 255, 255, 0.1);border-radius:4px;margin:0.5rem 0}.status.svelte-zwyw8b.svelte-zwyw8b{font-size:0.75rem;padding:0.25rem 0.5rem;border-radius:8px}.status.connected.svelte-zwyw8b.svelte-zwyw8b{background:#4caf50}.status.connecting.svelte-zwyw8b.svelte-zwyw8b{background:#ff9800}.status.disconnected.svelte-zwyw8b.svelte-zwyw8b{background:#f44336}.game-board.svelte-zwyw8b.svelte-zwyw8b{flex:1;display:flex;position:relative}.game-area.svelte-zwyw8b.svelte-zwyw8b{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:space-around;padding:2rem}.dealer-area.svelte-zwyw8b.svelte-zwyw8b,.player-area.svelte-zwyw8b.svelte-zwyw8b{text-align:center}.dealer-area.svelte-zwyw8b h3.svelte-zwyw8b,.player-area.svelte-zwyw8b h3.svelte-zwyw8b{color:goldenrod;margin-bottom:1rem}.game-status.svelte-zwyw8b.svelte-zwyw8b{text-align:center;color:white}.result.svelte-zwyw8b.svelte-zwyw8b{font-size:2rem;color:goldenrod;margin:1rem 0}.your-turn.svelte-zwyw8b.svelte-zwyw8b{font-size:1.5rem;color:#4caf50;font-weight:bold;margin:1rem 0}.waiting.svelte-zwyw8b.svelte-zwyw8b{font-size:1.2rem;color:#999;margin:1rem 0}.waiting-start.svelte-zwyw8b.svelte-zwyw8b{text-align:center;color:white}.waiting-start.svelte-zwyw8b h2.svelte-zwyw8b{color:goldenrod}.actions.svelte-zwyw8b.svelte-zwyw8b{display:flex;gap:1rem;justify-content:center;margin-top:1rem}.actions.svelte-zwyw8b button.svelte-zwyw8b{padding:1rem 2rem;font-size:1.2rem;background:goldenrod;color:#001a00;border:none;border-radius:8px;cursor:pointer;font-weight:bold;transition:all 0.2s}.actions.svelte-zwyw8b button.svelte-zwyw8b:hover{background:#daa520;transform:scale(1.05)}.actions.svelte-zwyw8b button.svelte-zwyw8b:active{transform:scale(0.95)}.game-status.svelte-zwyw8b button.svelte-zwyw8b{padding:0.75rem 1.5rem;background:#4caf50;color:white;border:none;border-radius:8px;font-size:1rem;cursor:pointer;margin-top:1rem}.game-status.svelte-zwyw8b button.svelte-zwyw8b:hover{background:#45a049}@media(max-width: 768px){.game-container.svelte-zwyw8b.svelte-zwyw8b{flex-direction:column}.mp-info.svelte-zwyw8b.svelte-zwyw8b{width:100%;max-height:200px}.game-area.svelte-zwyw8b.svelte-zwyw8b{padding:1rem}}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import \\"../global.css\\";\\nimport audioPath from \\"$lib/assets/draw.mp3\\";\\nimport { createMultiplayerBlackjack } from \\"$lib/multiplayer/games/MultiplayerBlackjack\\";\\nimport { onMount } from \\"svelte\\";\\nimport { page } from \\"$app/stores\\";\\nimport CardsDefinitions from \\"$lib/Components/CardsDefinitions.svelte\\";\\nimport Deck from \\"$lib/Components/Deck.svelte\\";\\nimport Hand from \\"$lib/Components/Hand.svelte\\";\\nconst sessionId = $page.url.searchParams.get(\\"session\\") || void 0;\\nconst game = createMultiplayerBlackjack(sessionId);\\nconst {\\n  session,\\n  participants,\\n  isHost,\\n  sessionState,\\n  playerCount,\\n  connectionQuality,\\n  gameState,\\n  player,\\n  dealer,\\n  winner,\\n  isMyTurn,\\n  gameStarted,\\n  startGame,\\n  hit,\\n  stand,\\n  leave\\n} = game;\\nlet drawSound;\\nonMount(() => {\\n  drawSound = new Audio(audioPath);\\n});\\nfunction playSound() {\\n  if (drawSound) {\\n    drawSound.play().catch(() => {\\n    });\\n  }\\n}\\nfunction handleHit() {\\n  playSound();\\n  hit();\\n}\\nfunction handleStand() {\\n  stand();\\n}\\nfunction copySessionLink() {\\n  if ($session) {\\n    const link = \`\${window.location.origin}/blackjack-multiplayer?session=\${$session.id}\`;\\n    navigator.clipboard.writeText(link);\\n    alert(\\"Session link copied to clipboard!\\");\\n  }\\n}\\n<\/script>\\n\\n<CardsDefinitions />\\n\\n<div class=\\"game-container\\">\\n\\t{#if !$session}\\n\\t\\t<div class=\\"loading\\">\\n\\t\\t\\t<p>Connecting to multiplayer session...</p>\\n\\t\\t</div>\\n\\t{:else}\\n\\t\\t<!-- Multiplayer Info Panel -->\\n\\t\\t<div class=\\"mp-info\\">\\n\\t\\t\\t<div class=\\"info-header\\">\\n\\t\\t\\t\\t<h3>Multiplayer Blackjack</h3>\\n\\t\\t\\t\\t{#if $isHost}\\n\\t\\t\\t\\t\\t<span class=\\"badge host\\">Host</span>\\n\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t<span class=\\"badge guest\\">Guest</span>\\n\\t\\t\\t\\t{/if}\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<div class=\\"session-details\\">\\n\\t\\t\\t\\t<p><strong>Session:</strong> {$session.id.substring(0, 12)}...</p>\\n\\t\\t\\t\\t<p><strong>Status:</strong> {$sessionState}</p>\\n\\t\\t\\t\\t<p><strong>Players:</strong> {$playerCount}/4</p>\\n\\t\\t\\t\\t<p><strong>Latency:</strong> {$connectionQuality.latency}ms</p>\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t{#if $isHost && !$gameStarted}\\n\\t\\t\\t\\t<button class=\\"start-btn\\" on:click={startGame}>Start Game</button>\\n\\t\\t\\t{/if}\\n\\n\\t\\t\\t{#if $isHost}\\n\\t\\t\\t\\t<button class=\\"share-btn\\" on:click={copySessionLink}>📋 Copy Invite Link</button>\\n\\t\\t\\t{/if}\\n\\n\\t\\t\\t<button class=\\"leave-btn\\" on:click={leave}>Leave Session</button>\\n\\n\\t\\t\\t<div class=\\"players-list\\">\\n\\t\\t\\t\\t<h4>Players</h4>\\n\\t\\t\\t\\t{#each $participants as participant}\\n\\t\\t\\t\\t\\t<div class=\\"player-item\\">\\n\\t\\t\\t\\t\\t\\t<span>{participant.userId.substring(0, 8)}</span>\\n\\t\\t\\t\\t\\t\\t<span class=\\"status {participant.connectionStatus}\\">\\n\\t\\t\\t\\t\\t\\t\\t{participant.connectionStatus}\\n\\t\\t\\t\\t\\t\\t</span>\\n\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t{/each}\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\n\\t\\t<!-- Game Board -->\\n\\t\\t<section class=\\"game-board\\">\\n\\t\\t\\t<Deck />\\n\\t\\t\\t<div class=\\"game-area\\">\\n\\t\\t\\t\\t{#if $gameState}\\n\\t\\t\\t\\t\\t<div class=\\"dealer-area\\">\\n\\t\\t\\t\\t\\t\\t<h3>Dealer</h3>\\n\\t\\t\\t\\t\\t\\t<Hand hand={$dealer?.hand || []} score={$dealer?.score || 0} />\\n\\t\\t\\t\\t\\t</div>\\n\\n\\t\\t\\t\\t\\t<div class=\\"game-status\\">\\n\\t\\t\\t\\t\\t\\t{#if $winner}\\n\\t\\t\\t\\t\\t\\t\\t<h2 class=\\"result\\">\\n\\t\\t\\t\\t\\t\\t\\t\\t{$winner === 'Player' ? '🎉 Player Wins!' : ''}\\n\\t\\t\\t\\t\\t\\t\\t\\t{$winner === 'Dealer' ? '😞 Dealer Wins' : ''}\\n\\t\\t\\t\\t\\t\\t\\t\\t{$winner === 'Draw' ? '🤝 Draw' : ''}\\n\\t\\t\\t\\t\\t\\t\\t</h2>\\n\\t\\t\\t\\t\\t\\t\\t{#if $isHost}\\n\\t\\t\\t\\t\\t\\t\\t\\t<button on:click={startGame}>New Game</button>\\n\\t\\t\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t\\t\\t{:else if $isMyTurn}\\n\\t\\t\\t\\t\\t\\t\\t<p class=\\"your-turn\\">Your Turn!</p>\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"actions\\">\\n\\t\\t\\t\\t\\t\\t\\t\\t<button on:click={handleHit}>Hit</button>\\n\\t\\t\\t\\t\\t\\t\\t\\t<button on:click={handleStand}>Stand</button>\\n\\t\\t\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t\\t\\t<p class=\\"waiting\\">Waiting for {$isHost ? 'dealer' : 'host'}...</p>\\n\\t\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t\\t</div>\\n\\n\\t\\t\\t\\t\\t<div class=\\"player-area\\">\\n\\t\\t\\t\\t\\t\\t<h3>Your Hand</h3>\\n\\t\\t\\t\\t\\t\\t<Hand hand={$player?.hand || []} score={$player?.score || 0} />\\n\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t{:else if !$gameStarted}\\n\\t\\t\\t\\t\\t<div class=\\"waiting-start\\">\\n\\t\\t\\t\\t\\t\\t<h2>Waiting for host to start the game...</h2>\\n\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t{/if}\\n\\t\\t\\t</div>\\n\\t\\t</section>\\n\\t{/if}\\n</div>\\n\\n<style>\\n\\t.game-container {\\n\\t\\tdisplay: flex;\\n\\t\\theight: 100dvh;\\n\\t\\twidth: 100dvw;\\n\\t\\tbackground: radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);\\n\\t}\\n\\n\\t.loading {\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\twidth: 100%;\\n\\t\\tcolor: white;\\n\\t\\tfont-size: 1.5rem;\\n\\t}\\n\\n\\t.mp-info {\\n\\t\\twidth: 300px;\\n\\t\\tbackground: rgba(0, 0, 0, 0.6);\\n\\t\\tpadding: 1.5rem;\\n\\t\\tcolor: white;\\n\\t\\toverflow-y: auto;\\n\\t}\\n\\n\\t.info-header {\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tgap: 1rem;\\n\\t\\tmargin-bottom: 1rem;\\n\\t}\\n\\n\\t.info-header h3 {\\n\\t\\tmargin: 0;\\n\\t\\tflex: 1;\\n\\t}\\n\\n\\t.badge {\\n\\t\\tpadding: 0.25rem 0.75rem;\\n\\t\\tborder-radius: 12px;\\n\\t\\tfont-size: 0.75rem;\\n\\t\\tfont-weight: bold;\\n\\t}\\n\\n\\t.badge.host {\\n\\t\\tbackground: #4caf50;\\n\\t}\\n\\n\\t.badge.guest {\\n\\t\\tbackground: #2196f3;\\n\\t}\\n\\n\\t.session-details {\\n\\t\\tbackground: rgba(255, 255, 255, 0.1);\\n\\t\\tpadding: 1rem;\\n\\t\\tborder-radius: 8px;\\n\\t\\tmargin-bottom: 1rem;\\n\\t}\\n\\n\\t.session-details p {\\n\\t\\tmargin: 0.5rem 0;\\n\\t\\tfont-size: 0.9rem;\\n\\t}\\n\\n\\t.start-btn,\\n\\t.share-btn,\\n\\t.leave-btn {\\n\\t\\twidth: 100%;\\n\\t\\tpadding: 0.75rem;\\n\\t\\tmargin: 0.5rem 0;\\n\\t\\tborder: none;\\n\\t\\tborder-radius: 8px;\\n\\t\\tfont-size: 1rem;\\n\\t\\tcursor: pointer;\\n\\t\\ttransition: all 0.2s;\\n\\t}\\n\\n\\t.start-btn {\\n\\t\\tbackground: #4caf50;\\n\\t\\tcolor: white;\\n\\t}\\n\\n\\t.start-btn:hover {\\n\\t\\tbackground: #45a049;\\n\\t}\\n\\n\\t.share-btn {\\n\\t\\tbackground: #2196f3;\\n\\t\\tcolor: white;\\n\\t}\\n\\n\\t.share-btn:hover {\\n\\t\\tbackground: #0b7dda;\\n\\t}\\n\\n\\t.leave-btn {\\n\\t\\tbackground: #f44336;\\n\\t\\tcolor: white;\\n\\t}\\n\\n\\t.leave-btn:hover {\\n\\t\\tbackground: #da190b;\\n\\t}\\n\\n\\t.players-list {\\n\\t\\tmargin-top: 1.5rem;\\n\\t}\\n\\n\\t.players-list h4 {\\n\\t\\tmargin: 0 0 0.75rem 0;\\n\\t}\\n\\n\\t.player-item {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: space-between;\\n\\t\\talign-items: center;\\n\\t\\tpadding: 0.5rem;\\n\\t\\tbackground: rgba(255, 255, 255, 0.1);\\n\\t\\tborder-radius: 4px;\\n\\t\\tmargin: 0.5rem 0;\\n\\t}\\n\\n\\t.status {\\n\\t\\tfont-size: 0.75rem;\\n\\t\\tpadding: 0.25rem 0.5rem;\\n\\t\\tborder-radius: 8px;\\n\\t}\\n\\n\\t.status.connected {\\n\\t\\tbackground: #4caf50;\\n\\t}\\n\\n\\t.status.connecting {\\n\\t\\tbackground: #ff9800;\\n\\t}\\n\\n\\t.status.disconnected {\\n\\t\\tbackground: #f44336;\\n\\t}\\n\\n\\t.game-board {\\n\\t\\tflex: 1;\\n\\t\\tdisplay: flex;\\n\\t\\tposition: relative;\\n\\t}\\n\\n\\t.game-area {\\n\\t\\tflex: 1;\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: space-around;\\n\\t\\tpadding: 2rem;\\n\\t}\\n\\n\\t.dealer-area,\\n\\t.player-area {\\n\\t\\ttext-align: center;\\n\\t}\\n\\n\\t.dealer-area h3,\\n\\t.player-area h3 {\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin-bottom: 1rem;\\n\\t}\\n\\n\\t.game-status {\\n\\t\\ttext-align: center;\\n\\t\\tcolor: white;\\n\\t}\\n\\n\\t.result {\\n\\t\\tfont-size: 2rem;\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin: 1rem 0;\\n\\t}\\n\\n\\t.your-turn {\\n\\t\\tfont-size: 1.5rem;\\n\\t\\tcolor: #4caf50;\\n\\t\\tfont-weight: bold;\\n\\t\\tmargin: 1rem 0;\\n\\t}\\n\\n\\t.waiting {\\n\\t\\tfont-size: 1.2rem;\\n\\t\\tcolor: #999;\\n\\t\\tmargin: 1rem 0;\\n\\t}\\n\\n\\t.waiting-start {\\n\\t\\ttext-align: center;\\n\\t\\tcolor: white;\\n\\t}\\n\\n\\t.waiting-start h2 {\\n\\t\\tcolor: goldenrod;\\n\\t}\\n\\n\\t.actions {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 1rem;\\n\\t\\tjustify-content: center;\\n\\t\\tmargin-top: 1rem;\\n\\t}\\n\\n\\t.actions button {\\n\\t\\tpadding: 1rem 2rem;\\n\\t\\tfont-size: 1.2rem;\\n\\t\\tbackground: goldenrod;\\n\\t\\tcolor: #001a00;\\n\\t\\tborder: none;\\n\\t\\tborder-radius: 8px;\\n\\t\\tcursor: pointer;\\n\\t\\tfont-weight: bold;\\n\\t\\ttransition: all 0.2s;\\n\\t}\\n\\n\\t.actions button:hover {\\n\\t\\tbackground: #daa520;\\n\\t\\ttransform: scale(1.05);\\n\\t}\\n\\n\\t.actions button:active {\\n\\t\\ttransform: scale(0.95);\\n\\t}\\n\\n\\t.game-status button {\\n\\t\\tpadding: 0.75rem 1.5rem;\\n\\t\\tbackground: #4caf50;\\n\\t\\tcolor: white;\\n\\t\\tborder: none;\\n\\t\\tborder-radius: 8px;\\n\\t\\tfont-size: 1rem;\\n\\t\\tcursor: pointer;\\n\\t\\tmargin-top: 1rem;\\n\\t}\\n\\n\\t.game-status button:hover {\\n\\t\\tbackground: #45a049;\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\t.game-container {\\n\\t\\t\\tflex-direction: column;\\n\\t\\t}\\n\\n\\t\\t.mp-info {\\n\\t\\t\\twidth: 100%;\\n\\t\\t\\tmax-height: 200px;\\n\\t\\t}\\n\\n\\t\\t.game-area {\\n\\t\\t\\tpadding: 1rem;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"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"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $session, $$unsubscribe_session;
  let $page, $$unsubscribe_page;
  let $isHost, $$unsubscribe_isHost;
  let $sessionState, $$unsubscribe_sessionState;
  let $playerCount, $$unsubscribe_playerCount;
  let $connectionQuality, $$unsubscribe_connectionQuality;
  let $gameStarted, $$unsubscribe_gameStarted;
  let $participants, $$unsubscribe_participants;
  let $gameState, $$unsubscribe_gameState;
  let $dealer, $$unsubscribe_dealer;
  let $winner, $$unsubscribe_winner;
  let $isMyTurn, $$unsubscribe_isMyTurn;
  let $player, $$unsubscribe_player;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  const sessionId = $page.url.searchParams.get("session") || void 0;
  const game = createMultiplayerBlackjack(sessionId);
  const { session, participants, isHost, sessionState, playerCount, connectionQuality, gameState, player, dealer, winner, isMyTurn, gameStarted } = game;
  $$unsubscribe_session = subscribe(session, (value) => $session = value);
  $$unsubscribe_participants = subscribe(participants, (value) => $participants = value);
  $$unsubscribe_isHost = subscribe(isHost, (value) => $isHost = value);
  $$unsubscribe_sessionState = subscribe(sessionState, (value) => $sessionState = value);
  $$unsubscribe_playerCount = subscribe(playerCount, (value) => $playerCount = value);
  $$unsubscribe_connectionQuality = subscribe(connectionQuality, (value) => $connectionQuality = value);
  $$unsubscribe_gameState = subscribe(gameState, (value) => $gameState = value);
  $$unsubscribe_player = subscribe(player, (value) => $player = value);
  $$unsubscribe_dealer = subscribe(dealer, (value) => $dealer = value);
  $$unsubscribe_winner = subscribe(winner, (value) => $winner = value);
  $$unsubscribe_isMyTurn = subscribe(isMyTurn, (value) => $isMyTurn = value);
  $$unsubscribe_gameStarted = subscribe(gameStarted, (value) => $gameStarted = value);
  $$result.css.add(css);
  $$unsubscribe_session();
  $$unsubscribe_page();
  $$unsubscribe_isHost();
  $$unsubscribe_sessionState();
  $$unsubscribe_playerCount();
  $$unsubscribe_connectionQuality();
  $$unsubscribe_gameStarted();
  $$unsubscribe_participants();
  $$unsubscribe_gameState();
  $$unsubscribe_dealer();
  $$unsubscribe_winner();
  $$unsubscribe_isMyTurn();
  $$unsubscribe_player();
  return `${validate_component(CardsDefinitions, "CardsDefinitions").$$render($$result, {}, {}, {})} <div class="game-container svelte-zwyw8b">${!$session ? `<div class="loading svelte-zwyw8b" data-svelte-h="svelte-igx78y"><p>Connecting to multiplayer session...</p></div>` : ` <div class="mp-info svelte-zwyw8b"><div class="info-header svelte-zwyw8b"><h3 class="svelte-zwyw8b" data-svelte-h="svelte-slwd7q">Multiplayer Blackjack</h3> ${$isHost ? `<span class="badge host svelte-zwyw8b" data-svelte-h="svelte-1gu9rre">Host</span>` : `<span class="badge guest svelte-zwyw8b" data-svelte-h="svelte-ikyi8e">Guest</span>`}</div> <div class="session-details svelte-zwyw8b"><p class="svelte-zwyw8b"><strong data-svelte-h="svelte-1xfir02">Session:</strong> ${escape($session.id.substring(0, 12))}...</p> <p class="svelte-zwyw8b"><strong data-svelte-h="svelte-1ftu2mm">Status:</strong> ${escape($sessionState)}</p> <p class="svelte-zwyw8b"><strong data-svelte-h="svelte-8r1ktg">Players:</strong> ${escape($playerCount)}/4</p> <p class="svelte-zwyw8b"><strong data-svelte-h="svelte-m0swlo">Latency:</strong> ${escape($connectionQuality.latency)}ms</p></div> ${$isHost && !$gameStarted ? `<button class="start-btn svelte-zwyw8b" data-svelte-h="svelte-egykyo">Start Game</button>` : ``} ${$isHost ? `<button class="share-btn svelte-zwyw8b" data-svelte-h="svelte-3hpbjo">📋 Copy Invite Link</button>` : ``} <button class="leave-btn svelte-zwyw8b" data-svelte-h="svelte-1pqw3m9">Leave Session</button> <div class="players-list svelte-zwyw8b"><h4 class="svelte-zwyw8b" data-svelte-h="svelte-eidhe8">Players</h4> ${each($participants, (participant) => {
    return `<div class="player-item svelte-zwyw8b"><span>${escape(participant.userId.substring(0, 8))}</span> <span class="${"status " + escape(participant.connectionStatus, true) + " svelte-zwyw8b"}">${escape(participant.connectionStatus)}</span> </div>`;
  })}</div></div>  <section class="game-board svelte-zwyw8b">${validate_component(Deck, "Deck").$$render($$result, {}, {}, {})} <div class="game-area svelte-zwyw8b">${$gameState ? `<div class="dealer-area svelte-zwyw8b"><h3 class="svelte-zwyw8b" data-svelte-h="svelte-10lu7k5">Dealer</h3> ${validate_component(Hand, "Hand").$$render(
    $$result,
    {
      hand: $dealer?.hand || [],
      score: $dealer?.score || 0
    },
    {},
    {}
  )}</div> <div class="game-status svelte-zwyw8b">${$winner ? `<h2 class="result svelte-zwyw8b">${escape($winner === "Player" ? "🎉 Player Wins!" : "")} ${escape($winner === "Dealer" ? "😞 Dealer Wins" : "")} ${escape($winner === "Draw" ? "🤝 Draw" : "")}</h2> ${$isHost ? `<button class="svelte-zwyw8b" data-svelte-h="svelte-tonn7c">New Game</button>` : ``}` : `${$isMyTurn ? `<p class="your-turn svelte-zwyw8b" data-svelte-h="svelte-ax19md">Your Turn!</p> <div class="actions svelte-zwyw8b"><button class="svelte-zwyw8b" data-svelte-h="svelte-1pcxzpa">Hit</button> <button class="svelte-zwyw8b" data-svelte-h="svelte-1acrvms">Stand</button></div>` : `<p class="waiting svelte-zwyw8b">Waiting for ${escape($isHost ? "dealer" : "host")}...</p>`}`}</div> <div class="player-area svelte-zwyw8b"><h3 class="svelte-zwyw8b" data-svelte-h="svelte-xf15pi">Your Hand</h3> ${validate_component(Hand, "Hand").$$render(
    $$result,
    {
      hand: $player?.hand || [],
      score: $player?.score || 0
    },
    {},
    {}
  )}</div>` : `${!$gameStarted ? `<div class="waiting-start svelte-zwyw8b" data-svelte-h="svelte-12igxcn"><h2 class="svelte-zwyw8b">Waiting for host to start the game...</h2></div>` : ``}`}</div></section>`} </div>`;
});
export {
  Page as default
};
