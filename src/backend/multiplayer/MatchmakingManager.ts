/**
 * Matchmaking Manager
 * Handles player queues and automatic session creation
 */

import type { Session, SessionConfig, User } from './types';

interface MatchmakingQueueEntry {
	userId: string;
	gameId: string;
	user: User;
	timestamp: number;
	region?: string;
	skillRating?: number;
}

export class MatchmakingManager {
	private queue = new Map<string, MatchmakingQueueEntry[]>();
	private matchFoundCallbacks = new Map<
		string,
		(session: Session, participants: string[]) => void
	>();

	/**
	 * Join matchmaking queue
	 */
	joinQueue(entry: MatchmakingQueueEntry): void {
		const queueKey = this.getQueueKey(entry.gameId, entry.region);
		const queue = this.queue.get(queueKey) || [];

		// Check if already in queue
		if (queue.some((e) => e.userId === entry.userId)) {
			console.log('[Matchmaking] User already in queue:', entry.userId);
			return;
		}

		queue.push(entry);
		this.queue.set(queueKey, queue);

		console.log('[Matchmaking] User joined queue:', entry.userId, 'Queue size:', queue.length);

		// Try to find a match
		this.tryMatchmaking(queueKey);
	}

	/**
	 * Leave matchmaking queue
	 */
	leaveQueue(userId: string, gameId: string, region?: string): void {
		const queueKey = this.getQueueKey(gameId, region);
		const queue = this.queue.get(queueKey) || [];

		const filtered = queue.filter((e) => e.userId !== userId);
		this.queue.set(queueKey, filtered);

		console.log('[Matchmaking] User left queue:', userId);
	}

	/**
	 * Register callback for when a match is found
	 */
	onMatchFound(userId: string, callback: (session: Session, participants: string[]) => void): void {
		this.matchFoundCallbacks.set(userId, callback);
	}

	/**
	 * Try to create matches from the queue
	 */
	private tryMatchmaking(queueKey: string): void {
		const queue = this.queue.get(queueKey) || [];

		// Simple 2-player matchmaking for now
		const minPlayers = 2;
		const maxPlayers = 4;

		if (queue.length >= minPlayers) {
			// Sort by skill rating if available
			queue.sort((a, b) => {
				if (a.skillRating && b.skillRating) {
					return Math.abs(a.skillRating - b.skillRating);
				}
				return 0;
			});

			// Take the first batch of players
			const playersToMatch = queue.slice(0, maxPlayers);
			const remainingQueue = queue.slice(maxPlayers);

			this.queue.set(queueKey, remainingQueue);

			// Create a session for matched players
			this.createMatchedSession(playersToMatch);
		}
	}

	/**
	 * Create a session for matched players
	 */
	private createMatchedSession(players: MatchmakingQueueEntry[]): void {
		if (players.length === 0) return;

		const gameId = players[0].gameId;
		const sessionId = `match-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

		const sessionConfig: SessionConfig = {
			gameId,
			mode: 'host-authoritative',
			maxPlayers: 4,
			allowSpectators: true,
			visibility: 'public',
			matchmaking: true
		};

		const session: Session = {
			id: sessionId,
			gameId,
			hostId: players[0].userId,
			mode: sessionConfig.mode,
			status: 'WAITING_FOR_PLAYERS',
			config: sessionConfig,
			participants: players.map((p, index) => ({
				id: `participant-${Date.now()}-${index}`,
				userId: p.userId,
				role: index === 0 ? 'host' : 'player',
				connectionStatus: 'connecting',
				user: p.user
			})),
			createdAt: Date.now()
		};

		console.log('[Matchmaking] Match created:', sessionId, 'Players:', players.length);

		// Notify all matched players
		const participantIds = players.map((p) => p.userId);
		players.forEach((player) => {
			const callback = this.matchFoundCallbacks.get(player.userId);
			if (callback) {
				callback(session, participantIds);
			}
		});
	}

	/**
	 * Get queue key for grouping
	 */
	private getQueueKey(gameId: string, region?: string): string {
		return region ? `${gameId}-${region}` : gameId;
	}

	/**
	 * Get current queue size
	 */
	getQueueSize(gameId: string, region?: string): number {
		const queueKey = this.getQueueKey(gameId, region);
		return this.queue.get(queueKey)?.length || 0;
	}

	/**
	 * Get queue position for a user
	 */
	getQueuePosition(userId: string, gameId: string, region?: string): number {
		const queueKey = this.getQueueKey(gameId, region);
		const queue = this.queue.get(queueKey) || [];
		return queue.findIndex((e) => e.userId === userId) + 1; // 1-indexed
	}
}
