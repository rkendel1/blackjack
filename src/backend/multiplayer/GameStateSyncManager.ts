/**
 * Game State Synchronization System
 * Handles syncing game state between host and guests
 */

import type { StackLiveMessage } from './types';

export interface GameAction {
	type: string;
	payload: unknown;
	playerId: string;
	timestamp: number;
	sequenceNumber: number;
}

export interface GameStateSnapshot {
	state: unknown;
	timestamp: number;
	sequenceNumber: number;
}

export interface TurnInfo {
	currentPlayer: string;
	turnNumber: number;
	timeRemaining?: number;
}

export class GameStateSyncManager {
	private isHost: boolean;
	private localState: unknown = null;
	private sequenceNumber = 0;
	private actionQueue: GameAction[] = [];
	private onStateUpdateCallback?: (state: unknown) => void;
	private onActionCallback?: (action: GameAction) => void;
	private currentTurn?: TurnInfo;
	private turnCallbacks: ((turn: TurnInfo) => void)[] = [];

	// Snapshot configuration
	private snapshotInterval = 5000; // Send full snapshot every 5 seconds
	private lastSnapshotTime = 0;
	private snapshotTimer?: number;

	constructor(isHost: boolean) {
		this.isHost = isHost;

		if (isHost) {
			this.startSnapshotTimer();
		}
	}

	/**
	 * Set local game state (host only)
	 */
	setState(state: unknown): void {
		if (!this.isHost) {
			console.warn('[GameSync] Only host can set state directly');
			return;
		}

		this.localState = state;
		this.sequenceNumber++;
	}

	/**
	 * Get current game state
	 */
	getState(): unknown {
		return this.localState;
	}

	/**
	 * Apply an action to the game
	 */
	applyAction(action: GameAction): void {
		// Validate sequence number
		if (action.sequenceNumber <= this.sequenceNumber) {
			console.warn('[GameSync] Received old action, ignoring');
			return;
		}

		this.sequenceNumber = action.sequenceNumber;
		this.actionQueue.push(action);

		// Notify callback
		if (this.onActionCallback) {
			this.onActionCallback(action);
		}

		console.log('[GameSync] Applied action:', action.type, 'seq:', action.sequenceNumber);
	}

	/**
	 * Create an action from local player
	 */
	createAction(type: string, payload: unknown, playerId: string): GameAction {
		this.sequenceNumber++;

		const action: GameAction = {
			type,
			payload,
			playerId,
			timestamp: Date.now(),
			sequenceNumber: this.sequenceNumber
		};

		// If host, apply immediately
		if (this.isHost) {
			this.actionQueue.push(action);
		}

		return action;
	}

	/**
	 * Create a state snapshot (host only)
	 */
	createSnapshot(): GameStateSnapshot | null {
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
	applySnapshot(snapshot: GameStateSnapshot): void {
		if (this.isHost) {
			console.warn('[GameSync] Host should not apply snapshots');
			return;
		}

		// Only apply if newer
		if (snapshot.sequenceNumber <= this.sequenceNumber) {
			console.warn('[GameSync] Received old snapshot, ignoring');
			return;
		}

		this.localState = snapshot.state;
		this.sequenceNumber = snapshot.sequenceNumber;
		this.lastSnapshotTime = snapshot.timestamp;

		// Clear old actions
		this.actionQueue = [];

		// Notify callback
		if (this.onStateUpdateCallback) {
			this.onStateUpdateCallback(snapshot.state);
		}

		console.log('[GameSync] Applied snapshot, seq:', snapshot.sequenceNumber);
	}

	/**
	 * Check if snapshot should be sent
	 */
	shouldSendSnapshot(): boolean {
		if (!this.isHost) return false;

		const timeSinceLastSnapshot = Date.now() - this.lastSnapshotTime;
		return timeSinceLastSnapshot >= this.snapshotInterval;
	}

	/**
	 * Start periodic snapshot timer (host only)
	 */
	private startSnapshotTimer(): void {
		if (!this.isHost) return;

		this.snapshotTimer = window.setInterval(() => {
			if (this.shouldSendSnapshot() && this.onStateUpdateCallback) {
				const snapshot = this.createSnapshot();
				if (snapshot) {
					this.lastSnapshotTime = Date.now();
					// Trigger callback to send snapshot
					this.onStateUpdateCallback(snapshot.state);
				}
			}
		}, this.snapshotInterval);
	}

	/**
	 * Set current turn
	 */
	setCurrentTurn(turn: TurnInfo): void {
		this.currentTurn = turn;

		// Notify turn callbacks
		this.turnCallbacks.forEach((callback) => callback(turn));

		console.log('[GameSync] Turn updated:', turn.currentPlayer, 'turn', turn.turnNumber);
	}

	/**
	 * Get current turn
	 */
	getCurrentTurn(): TurnInfo | undefined {
		return this.currentTurn;
	}

	/**
	 * Check if it's a specific player's turn
	 */
	isPlayerTurn(playerId: string): boolean {
		return this.currentTurn?.currentPlayer === playerId;
	}

	/**
	 * Register callback for state updates
	 */
	onStateUpdate(callback: (state: unknown) => void): void {
		this.onStateUpdateCallback = callback;
	}

	/**
	 * Register callback for actions
	 */
	onAction(callback: (action: GameAction) => void): void {
		this.onActionCallback = callback;
	}

	/**
	 * Register callback for turn changes
	 */
	onTurnChange(callback: (turn: TurnInfo) => void): void {
		this.turnCallbacks.push(callback);
	}

	/**
	 * Get action history
	 */
	getActionHistory(): GameAction[] {
		return [...this.actionQueue];
	}

	/**
	 * Clear action history
	 */
	clearActionHistory(): void {
		this.actionQueue = [];
	}

	/**
	 * Cleanup
	 */
	destroy(): void {
		if (this.snapshotTimer) {
			clearInterval(this.snapshotTimer);
		}

		this.turnCallbacks = [];
		this.onStateUpdateCallback = undefined;
		this.onActionCallback = undefined;
	}
}

/**
 * Convert messages to/from game sync format
 */
export class GameSyncMessageAdapter {
	/**
	 * Create a StackLive message from an action
	 */
	static actionToMessage(action: GameAction): StackLiveMessage {
		return {
			type: 'input',
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
	static messageToAction(message: StackLiveMessage): GameAction | null {
		if (message.type !== 'input') return null;

		const payload = message.payload as any;

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
	static snapshotToMessage(snapshot: GameStateSnapshot): StackLiveMessage {
		return {
			type: 'state',
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
	static messageToSnapshot(message: StackLiveMessage): GameStateSnapshot | null {
		if (message.type !== 'state' && message.type !== 'sync-response') return null;

		const payload = message.payload as any;

		return {
			state: payload.state,
			timestamp: payload.timestamp || Date.now(),
			sequenceNumber: payload.sequenceNumber || 0
		};
	}

	/**
	 * Create a turn update message
	 */
	static turnToMessage(turn: TurnInfo): StackLiveMessage {
		return {
			type: 'input',
			frame: turn.turnNumber,
			payload: {
				actionType: 'turn_change',
				actionPayload: turn,
				playerId: turn.currentPlayer,
				timestamp: Date.now()
			}
		};
	}
}
