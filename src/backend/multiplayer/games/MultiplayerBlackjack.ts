/**
 * Multiplayer Blackjack Game
 * Integrates Blackjack engine with multiplayer runtime
 */

import { BlackjackEngine } from '../../games/blackjack/engine';
import type { BlackjackState, BlackjackMove } from '../../games/blackjack/engine';
import { useStackLiveMultiplayer } from '../useStackLiveMultiplayer';
import { GameStateSyncManager, GameSyncMessageAdapter } from '../GameStateSyncManager';
import type { MultiplayerConfig } from '../types';
import { writable, derived, get } from 'svelte/store';

export function createMultiplayerBlackjack(sessionId?: string) {
	const config: MultiplayerConfig = {
		gameId: 'blackjack',
		mode: 'host-authoritative',
		maxPlayers: 4,
		spectators: true,
		debug: true
	};

	const mp = useStackLiveMultiplayer(config);
	let engine: BlackjackEngine | null = null;
	let syncManager: GameStateSyncManager | null = null;

	// Game state stores
	const gameState = writable<BlackjackState | null>(null);
	const myPlayerId = writable<string>('');
	const isMyTurn = writable<boolean>(false);
	const gameStarted = writable<boolean>(false);

	// Derived stores
	const player = derived(gameState, ($state) => $state?.player || null);
	const dealer = derived(gameState, ($state) => $state?.dealer || null);
	const winner = derived(gameState, ($state) => $state?.winner || null);
	const turn = derived(gameState, ($state) => $state?.turn || null);

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
		engine = new BlackjackEngine();
		syncManager = new GameStateSyncManager(true);

		const currentSession = get(mp.session);
		if (currentSession) {
			myPlayerId.set(currentSession.hostId);
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
				payload: input
			});

			if (action) {
				handleGuestAction(action);
			}
		});

		console.log('[MP Blackjack] Host mode initialized');
	}

	/**
	 * Setup guest mode
	 */
	function setupGuestMode() {
		syncManager = new GameStateSyncManager(false);

		const currentSession = get(mp.session);
		if (currentSession) {
			const myParticipant = currentSession.participants.find(
				(p) => p.role === 'player' && !p.user
			);
			if (myParticipant) {
				myPlayerId.set(myParticipant.userId);
			}
		}

		// Receive state updates from host
		mp.onStateSync((state: any) => {
			const snapshot = GameSyncMessageAdapter.messageToSnapshot({
				type: 'state',
				payload: state
			});

			if (snapshot && syncManager) {
				syncManager.applySnapshot(snapshot);
				gameState.set(snapshot.state as BlackjackState);
				checkMyTurn();
			}
		});

		// Request initial state
		mp.requestStateSync();

		console.log('[MP Blackjack] Guest mode initialized');
	}

	/**
	 * Handle action from guest player
	 */
	function handleGuestAction(action: any) {
		if (!engine) return;

		console.log('[MP Blackjack] Guest action:', action.type, action.payload);

		// Convert action to game move
		const move: BlackjackMove = action.payload;

		// Apply move to engine
		engine.applyMove(move);

		// Update state
		const newState = engine.getState();
		gameState.set(newState);

		if (syncManager) {
			syncManager.setState(newState);
		}

		checkTurnChange(newState);
	}

	/**
	 * Start a new game
	 */
	function startGame() {
		if (!engine || !get(mp.isHost)) {
			console.warn('[MP Blackjack] Only host can start game');
			return;
		}

		engine.applyMove({ type: 'start' });
		const newState = engine.getState();
		gameState.set(newState);

		if (syncManager) {
			syncManager.setState(newState);
		}

		gameStarted.set(true);
		console.log('[MP Blackjack] Game started');
	}

	/**
	 * Player hits (draws a card)
	 */
	function hit() {
		const currentPlayerId = get(myPlayerId);

		if (get(mp.isHost)) {
			// Host can act directly
			if (!engine) return;

			engine.applyMove({ type: 'hit' });
			const newState = engine.getState();
			gameState.set(newState);

			if (syncManager) {
				syncManager.setState(newState);
			}

			checkTurnChange(newState);
		} else {
			// Guest sends action to host
			if (!syncManager) return;

			const action = syncManager.createAction('hit', { type: 'hit' }, currentPlayerId);
			const message = GameSyncMessageAdapter.actionToMessage(action);
			if (message.type === 'input') {
				mp.sendInput(message.payload);
			}
		}

		console.log('[MP Blackjack] Hit');
	}

	/**
	 * Player stands
	 */
	function stand() {
		const currentPlayerId = get(myPlayerId);

		if (get(mp.isHost)) {
			// Host can act directly
			if (!engine) return;

			engine.applyMove({ type: 'stand' });
			const newState = engine.getState();
			gameState.set(newState);

			if (syncManager) {
				syncManager.setState(newState);
			}

			checkTurnChange(newState);
		} else {
			// Guest sends action to host
			if (!syncManager) return;

			const action = syncManager.createAction('stand', { type: 'stand' }, currentPlayerId);
			const message = GameSyncMessageAdapter.actionToMessage(action);
			if (message.type === 'input') {
				mp.sendInput(message.payload);
			}
		}

		console.log('[MP Blackjack] Stand');
	}

	/**
	 * Check if turn changed
	 */
	function checkTurnChange(state: BlackjackState) {
		if (!syncManager) return;

		const currentTurn = state.turn;
		if (currentTurn) {
			syncManager.setCurrentTurn({
				currentPlayer: currentTurn === 'Player' ? get(myPlayerId) : 'dealer',
				turnNumber: Date.now()
			});
		}

		checkMyTurn();
	}

	/**
	 * Check if it's my turn
	 */
	function checkMyTurn() {
		const currentState = get(gameState);
		const currentPlayerId = get(myPlayerId);

		if (!currentState || !currentPlayerId) {
			isMyTurn.set(false);
			return;
		}

		// In blackjack, it's always the player's turn until they stand
		const myTurn = currentState.turn === 'Player';
		isMyTurn.set(myTurn);
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
