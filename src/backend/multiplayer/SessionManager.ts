/**
 * Session Manager
 * Manages session lifecycle and state transitions
 */

import type { Session, SessionConfig, SessionState, Participant, ParticipantRole } from './types';

export class SessionManager {
	private session: Session | null = null;
	private stateChangeCallbacks: ((state: SessionState) => void)[] = [];

	/**
	 * Create a new session
	 */
	createSession(config: SessionConfig, hostId: string): Session {
		const now = Date.now();
		const sessionId = this.generateSessionId();

		this.session = {
			id: sessionId,
			gameId: config.gameId,
			embedId: config.embedId,
			type: config.type,
			hostId,
			mode: config.mode,
			status: 'CREATING',
			config,
			participants: [
				{
					id: this.generateParticipantId(),
					userId: hostId,
					role: 'host',
					connectionStatus: 'disconnected'
				}
			],
			createdAt: now,
			expiresAt: now + 3600000 // 1 hour from now
		};

		this.updateState('WAITING_FOR_PLAYERS');
		return this.session;
	}

	/**
	 * Join an existing session
	 */
	joinSession(sessionId: string, userId: string, role: ParticipantRole = 'player'): Participant | null {
		if (!this.session || this.session.id !== sessionId) {
			return null;
		}

		// Check if already in session
		const existing = this.session.participants.find((p) => p.userId === userId);
		if (existing) {
			return existing;
		}

		// Check max players
		const playerCount = this.session.participants.filter((p) => p.role === 'player').length;
		if (role === 'player' && playerCount >= this.session.config.maxPlayers) {
			return null;
		}

		// Check spectators allowed
		if (role === 'spectator' && !this.session.config.allowSpectators) {
			return null;
		}

		const participant: Participant = {
			id: this.generateParticipantId(),
			userId,
			role,
			connectionStatus: 'connecting'
		};

		this.session.participants.push(participant);
		return participant;
	}

	/**
	 * Remove a participant from the session
	 */
	leaveSession(userId: string): boolean {
		if (!this.session) {
			return false;
		}

		const index = this.session.participants.findIndex((p) => p.userId === userId);
		if (index === -1) {
			return false;
		}

		const participant = this.session.participants[index];
		this.session.participants.splice(index, 1);

		// If host left, end session
		if (participant.role === 'host') {
			this.updateState('ENDED');
			return true;
		}

		// If no players left, end session
		const hasPlayers = this.session.participants.some((p) => p.role !== 'spectator');
		if (!hasPlayers) {
			this.updateState('ENDED');
		}

		return true;
	}

	/**
	 * Update participant connection status
	 */
	updateParticipantStatus(userId: string, status: Participant['connectionStatus']): void {
		if (!this.session) {
			return;
		}

		const participant = this.session.participants.find((p) => p.userId === userId);
		if (participant) {
			participant.connectionStatus = status;
		}
	}

	/**
	 * Update session state
	 */
	updateState(newState: SessionState): void {
		if (!this.session) {
			return;
		}

		const oldState = this.session.status;
		this.session.status = newState;

		// Validate state transition
		if (!this.isValidTransition(oldState, newState)) {
			console.warn(`Invalid state transition: ${oldState} -> ${newState}`);
		}

		// Notify listeners
		this.stateChangeCallbacks.forEach((callback) => callback(newState));
	}

	/**
	 * Validate state transitions
	 */
	private isValidTransition(from: SessionState, to: SessionState): boolean {
		const validTransitions: Record<SessionState, SessionState[]> = {
			IDLE: ['CREATING'],
			CREATING: ['WAITING_FOR_PLAYERS', 'ENDED'],
			WAITING_FOR_PLAYERS: ['CONNECTING', 'ENDED'],
			CONNECTING: ['SYNCING', 'RECONNECTING', 'ENDED'],
			SYNCING: ['IN_GAME', 'ENDED'],
			IN_GAME: ['PAUSED', 'RECONNECTING', 'ENDED'],
			PAUSED: ['IN_GAME', 'ENDED'],
			RECONNECTING: ['SYNCING', 'IN_GAME', 'ENDED'],
			ENDED: ['IDLE']
		};

		return validTransitions[from]?.includes(to) ?? false;
	}

	/**
	 * Get current session
	 */
	getSession(): Session | null {
		return this.session;
	}

	/**
	 * Get session state
	 */
	getState(): SessionState {
		return this.session?.status ?? 'IDLE';
	}

	/**
	 * Check if session is active
	 */
	isActive(): boolean {
		return this.session !== null && this.session.status !== 'ENDED';
	}

	/**
	 * Check if session is expired
	 */
	isExpired(): boolean {
		if (!this.session || !this.session.expiresAt) {
			return false;
		}
		return Date.now() > this.session.expiresAt;
	}

	/**
	 * End the session
	 */
	endSession(): void {
		this.updateState('ENDED');
		this.session = null;
	}

	/**
	 * Register callback for state changes
	 */
	onStateChange(callback: (state: SessionState) => void): void {
		this.stateChangeCallbacks.push(callback);
	}

	/**
	 * Generate a unique session ID
	 */
	private generateSessionId(): string {
		return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
	}

	/**
	 * Generate a unique participant ID
	 */
	private generateParticipantId(): string {
		return `participant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
	}
}
