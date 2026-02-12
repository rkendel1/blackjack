/**
 * Abuse Prevention Manager
 * Implements rate limiting and spam protection
 */

interface RateLimitEntry {
	count: number;
	firstAttempt: number;
	blocked: boolean;
}

export class AbusePreventionManager {
	private sessionCreationLimits = new Map<string, RateLimitEntry>();
	private queueJoinLimits = new Map<string, RateLimitEntry>();
	private activeSessions = new Map<string, Set<string>>();

	// Configuration
	private readonly MAX_SESSION_CREATIONS_PER_HOUR = 10;
	private readonly MAX_QUEUE_JOINS_PER_MINUTE = 5;
	private readonly MAX_CONCURRENT_SESSIONS = 3;
	private readonly RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
	private readonly QUEUE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
	private readonly BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

	/**
	 * Check if user can create a session
	 */
	canCreateSession(userId: string): { allowed: boolean; reason?: string } {
		// Check concurrent sessions
		const userSessions = this.activeSessions.get(userId);
		if (userSessions && userSessions.size >= this.MAX_CONCURRENT_SESSIONS) {
			return {
				allowed: false,
				reason: `Maximum ${this.MAX_CONCURRENT_SESSIONS} concurrent sessions reached`
			};
		}

		// Check rate limit
		const limit = this.sessionCreationLimits.get(userId);
		if (limit) {
			// Check if blocked
			if (limit.blocked && Date.now() - limit.firstAttempt < this.BLOCK_DURATION_MS) {
				return {
					allowed: false,
					reason: 'Temporarily blocked due to excessive session creation'
				};
			}

			// Check if within window
			if (Date.now() - limit.firstAttempt < this.RATE_LIMIT_WINDOW_MS) {
				if (limit.count >= this.MAX_SESSION_CREATIONS_PER_HOUR) {
					// Block user
					limit.blocked = true;
					return {
						allowed: false,
						reason: `Rate limit exceeded: ${this.MAX_SESSION_CREATIONS_PER_HOUR} sessions per hour`
					};
				}
			} else {
				// Reset window
				this.sessionCreationLimits.delete(userId);
			}
		}

		return { allowed: true };
	}

	/**
	 * Record session creation
	 */
	recordSessionCreation(userId: string, sessionId: string): void {
		const limit = this.sessionCreationLimits.get(userId) || {
			count: 0,
			firstAttempt: Date.now(),
			blocked: false
		};

		limit.count++;
		this.sessionCreationLimits.set(userId, limit);

		// Track active session
		const sessions = this.activeSessions.get(userId) || new Set();
		sessions.add(sessionId);
		this.activeSessions.set(userId, sessions);

		console.log('[AbuseP revention] Session created by', userId, '- Count:', limit.count);
	}

	/**
	 * Record session end
	 */
	recordSessionEnd(userId: string, sessionId: string): void {
		const sessions = this.activeSessions.get(userId);
		if (sessions) {
			sessions.delete(sessionId);
			if (sessions.size === 0) {
				this.activeSessions.delete(userId);
			}
		}
	}

	/**
	 * Check if user can join matchmaking queue
	 */
	canJoinQueue(userId: string): { allowed: boolean; reason?: string } {
		const limit = this.queueJoinLimits.get(userId);
		if (limit) {
			// Check if blocked
			if (limit.blocked && Date.now() - limit.firstAttempt < this.BLOCK_DURATION_MS) {
				return {
					allowed: false,
					reason: 'Temporarily blocked due to queue spam'
				};
			}

			// Check if within window
			if (Date.now() - limit.firstAttempt < this.QUEUE_LIMIT_WINDOW_MS) {
				if (limit.count >= this.MAX_QUEUE_JOINS_PER_MINUTE) {
					// Block user
					limit.blocked = true;
					return {
						allowed: false,
						reason: `Rate limit exceeded: ${this.MAX_QUEUE_JOINS_PER_MINUTE} queue joins per minute`
					};
				}
			} else {
				// Reset window
				this.queueJoinLimits.delete(userId);
			}
		}

		return { allowed: true };
	}

	/**
	 * Record queue join
	 */
	recordQueueJoin(userId: string): void {
		const limit = this.queueJoinLimits.get(userId) || {
			count: 0,
			firstAttempt: Date.now(),
			blocked: false
		};

		limit.count++;
		this.queueJoinLimits.set(userId, limit);

		console.log('[AbusePrevention] Queue join by', userId, '- Count:', limit.count);
	}

	/**
	 * Clean up expired entries
	 */
	cleanup(): void {
		const now = Date.now();

		// Clean session limits
		for (const [userId, limit] of this.sessionCreationLimits.entries()) {
			if (now - limit.firstAttempt > this.RATE_LIMIT_WINDOW_MS + this.BLOCK_DURATION_MS) {
				this.sessionCreationLimits.delete(userId);
			}
		}

		// Clean queue limits
		for (const [userId, limit] of this.queueJoinLimits.entries()) {
			if (now - limit.firstAttempt > this.QUEUE_LIMIT_WINDOW_MS + this.BLOCK_DURATION_MS) {
				this.queueJoinLimits.delete(userId);
			}
		}

		console.log('[AbusePrevention] Cleanup completed');
	}

	/**
	 * Get user stats
	 */
	getUserStats(userId: string) {
		return {
			sessionCreations: this.sessionCreationLimits.get(userId),
			queueJoins: this.queueJoinLimits.get(userId),
			activeSessions: this.activeSessions.get(userId)?.size || 0
		};
	}
}
