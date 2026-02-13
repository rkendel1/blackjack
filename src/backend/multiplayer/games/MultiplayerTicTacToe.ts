/**
 * Multiplayer Tic Tac Toe Game
 * Integrates TicTacToe engine with multiplayer runtime
 */

import { TicTacToeEngine } from '$lib/games/tictactoe/engine/TicTacToeEngine';
import type { TicTacToeState, TicTacToeMove, Player } from '$lib/games/tictactoe/engine/types';
import { useStackLiveMultiplayer } from '../useStackLiveMultiplayer';
import { GameStateSyncManager, GameSyncMessageAdapter } from '../GameStateSyncManager';
import type { MultiplayerConfig } from '../types';
import { writable, derived, get } from 'svelte/store';

export function createMultiplayerTicTacToe(sessionId?: string) {
  const config: MultiplayerConfig = {
    gameId: 'tictactoe',
    mode: 'host-authoritative',
    maxPlayers: 2,
    spectators: true,
    debug: true,
  };

  const mp = useStackLiveMultiplayer(config);
  let engine: TicTacToeEngine | null = null;
  let syncManager: GameStateSyncManager | null = null;

  // Game state stores
  const gameState = writable<TicTacToeState | null>(null);
  const myPlayerId = writable<string>('');
  const mySymbol = writable<Player | null>(null);
  const isMyTurn = writable<boolean>(false);
  const gameStarted = writable<boolean>(false);
  const playerSymbols = writable<Map<string, Player>>(new Map());

  // Derived stores
  const board = derived(gameState, ($state) => $state?.board || Array(9).fill(null));
  const currentPlayer = derived(gameState, ($state) => $state?.currentPlayer || null);
  const status = derived(gameState, ($state) => $state?.status || 'playing');
  const winner = derived(gameState, ($state) => $state?.winner || null);
  const winningLine = derived(gameState, ($state) => $state?.winningLine || null);

  /**
   * Initialize game
   */
  async function initialize() {
    if (sessionId) {
      // Join existing session
      const success = await mp.joinSession(sessionId);
      if (success) {
        setupGuestMode();
      }
    } else {
      // Create new session
      const session = await mp.createSession();
      if (session) {
        setupHostMode();
      }
    }
  }

  /**
   * Setup host mode
   */
  function setupHostMode() {
    engine = new TicTacToeEngine({ startingPlayer: 'X' });
    syncManager = new GameStateSyncManager(true);

    const currentSession = get(mp.session);
    if (currentSession) {
      myPlayerId.set(currentSession.hostId);
      mySymbol.set('X'); // Host is always X
      
      // Update player symbols map
      playerSymbols.update((map) => {
        map.set(currentSession.hostId, 'X');
        return map;
      });
    }

    // Send state updates to guests
    syncManager.onStateUpdate((state) => {
      mp.sendState(state);
    });

    // Handle guest actions
    mp.onInput((input: any) => {
      if (!engine || !syncManager) return;

      const action = GameSyncMessageAdapter.messageToAction({
        type: 'input',
        frame: input.sequenceNumber || 0,
        payload: input,
      });

      if (action) {
        handleGuestAction(action);
      }
    });

    console.log('[MP TicTacToe] Host mode initialized');
  }

  /**
   * Setup guest mode
   */
  function setupGuestMode() {
    syncManager = new GameStateSyncManager(false);

    const currentSession = get(mp.session);
    if (currentSession) {
      const participants = currentSession.participants.filter((p) => p.role === 'player');
      const myParticipant = participants.find((p) => p.userId !== currentSession.hostId);
      
      if (myParticipant) {
        myPlayerId.set(myParticipant.userId);
        mySymbol.set('O'); // Guest is always O
        
        // Update player symbols map
        playerSymbols.update((map) => {
          map.set(currentSession.hostId, 'X');
          map.set(myParticipant.userId, 'O');
          return map;
        });
      }
    }

    // Receive state updates from host
    mp.onStateSync((state: any) => {
      const snapshot = GameSyncMessageAdapter.messageToSnapshot({
        type: 'state',
        payload: state,
      });

      if (snapshot && syncManager) {
        syncManager.applySnapshot(snapshot);
        gameState.set(snapshot.state as TicTacToeState);
        checkMyTurn();
      }
    });

    // Request initial state
    mp.requestStateSync();

    console.log('[MP TicTacToe] Guest mode initialized');
  }

  /**
   * Handle action from guest player
   */
  function handleGuestAction(action: any) {
    if (!engine) return;

    console.log('[MP TicTacToe] Guest action:', action.type, action.payload);

    // Convert action to game move
    const move: TicTacToeMove = action.payload;

    // Apply move to engine
    engine.applyMove(move);

    // Update state
    const newState = engine.getState();
    gameState.set(newState);

    if (syncManager) {
      syncManager.setState(newState);
    }

    checkMyTurn();
  }

  /**
   * Start a new game
   */
  function startGame() {
    if (!engine || !get(mp.isHost)) {
      console.warn('[MP TicTacToe] Only host can start game');
      return;
    }

    // Reset the engine
    engine.reset();
    const newState = engine.getState();
    gameState.set(newState);

    if (syncManager) {
      syncManager.setState(newState);
    }

    gameStarted.set(true);
    checkMyTurn();
    console.log('[MP TicTacToe] Game started');
  }

  /**
   * Make a move
   */
  function makeMove(position: number) {
    const currentMySymbol = get(mySymbol);
    const currentPlayerId = get(myPlayerId);

    if (!currentMySymbol) {
      console.warn('[MP TicTacToe] Player symbol not set');
      return;
    }

    const move: TicTacToeMove = {
      type: 'place',
      player: currentMySymbol,
      position,
    };

    if (get(mp.isHost)) {
      // Host can act directly
      if (!engine) return;

      const success = engine.applyMove(move);
      if (!success) {
        console.warn('[MP TicTacToe] Invalid move');
        return;
      }

      const newState = engine.getState();
      gameState.set(newState);

      if (syncManager) {
        syncManager.setState(newState);
      }

      checkMyTurn();
    } else {
      // Guest sends action to host
      if (!syncManager) return;

      const action = syncManager.createAction('place', move, currentPlayerId);
      const message = GameSyncMessageAdapter.actionToMessage(action);
      if (message.type === 'input') {
        mp.sendInput(message.payload);
      }
    }

    console.log('[MP TicTacToe] Move made at position', position);
  }

  /**
   * Check if it's my turn
   */
  function checkMyTurn() {
    const currentState = get(gameState);
    const currentMySymbol = get(mySymbol);

    if (!currentState || !currentMySymbol) {
      isMyTurn.set(false);
      return;
    }

    // Check if current player matches my symbol
    const myTurn = currentState.currentPlayer === currentMySymbol && currentState.status === 'playing';
    isMyTurn.set(myTurn);
  }

  /**
   * Reset game
   */
  function resetGame() {
    if (!get(mp.isHost)) {
      console.warn('[MP TicTacToe] Only host can reset game');
      return;
    }

    if (!engine) return;

    engine.reset();
    const newState = engine.getState();
    gameState.set(newState);

    if (syncManager) {
      syncManager.setState(newState);
    }

    checkMyTurn();
    console.log('[MP TicTacToe] Game reset');
  }

  /**
   * Leave game
   */
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

  // Auto-initialize
  initialize();

  return {
    // Multiplayer stores
    ...mp,

    // Game state stores
    gameState,
    board,
    currentPlayer,
    status,
    winner,
    winningLine,
    isMyTurn,
    gameStarted,
    myPlayerId,
    mySymbol,
    playerSymbols,

    // Actions
    startGame,
    makeMove,
    resetGame,
    leave,
  };
}
