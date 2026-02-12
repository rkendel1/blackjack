/**
 * Convex Client Integration
 * Client-side Convex integration utilities
 */

import type { SignalingAdapter } from '../SignalingAdapter';
import type { Session, Participant, SignalingMessage } from '../types';
import * as mutations from './mutations';
import * as queries from './queries';
import * as actions from './actions';
import * as subscriptions from './subscriptions';

/**
 * Convex Client Configuration
 */
export interface ConvexClientConfig {
	url: string; // Convex deployment URL
	apiKey?: string;
	debug?: boolean;
}

/**
 * Convex Signaling Adapter Implementation
 * Connects to Convex backend for signaling
 */
export class ConvexSignalingClient implements SignalingAdapter {
	private config: ConvexClientConfig;
	private subscriptions = new Map<string, () => void>();

	constructor(config: ConvexClientConfig) {
		this.config = config;
		console.log('[ConvexClient] Initialized with URL:', config.url);
	}

	/**
	 * Create a session in Convex
	 */
	async createSession(session: Session): Promise<void> {
		// In actual implementation:
		// await this.convex.mutation(api.mutations.createSession, {
		//   sessionId: session.id,
		//   gameId: session.gameId,
		//   ...
		// });

		await mutations.createSession({
			sessionId: session.id,
			gameId: session.gameId,
			hostId: session.hostId,
			hostName: session.participants.find((p) => p.role === 'host')?.user?.name || 'Host',
			mode: session.mode,
			maxPlayers: session.config.maxPlayers,
			allowSpectators: session.config.allowSpectators,
			visibility: session.config.visibility,
			matchmaking: session.config.matchmaking || false
		});
	}

	/**
	 * Get a session from Convex
	 */
	async getSession(sessionId: string): Promise<Session | null> {
		// In actual implementation:
		// const sessionDoc = await this.convex.query(api.queries.getSessionWithParticipants, {
		//   sessionId
		// });
		// return this.convertToSession(sessionDoc);

		const sessionDoc = await queries.getSessionWithParticipants({ sessionId });
		return null; // Mock implementation
	}

	/**
	 * Update a session in Convex
	 */
	async updateSession(session: Session): Promise<void> {
		// In actual implementation:
		// await this.convex.mutation(api.mutations.updateSessionStatus, {
		//   sessionId: session.id,
		//   status: session.status
		// });

		await mutations.updateSessionStatus({
			sessionId: session.id,
			status: session.status
		});
	}

	/**
	 * Delete a session from Convex
	 */
	async deleteSession(sessionId: string): Promise<void> {
		// In actual implementation:
		// await this.convex.mutation(api.mutations.endSession, {
		//   sessionId
		// });

		await mutations.endSession({ sessionId });
	}

	/**
	 * Send a signaling message through Convex
	 */
	async sendSignal(message: SignalingMessage): Promise<void> {
		// In actual implementation:
		// await this.convex.mutation(api.mutations.sendSignalingMessage, {
		//   sessionId: message.sessionId,
		//   from: message.from,
		//   to: message.to,
		//   type: message.type,
		//   payload: message.payload
		// });

		await mutations.sendSignalingMessage({
			sessionId: message.sessionId,
			from: message.from,
			to: message.to,
			type: message.type,
			payload: message.payload
		});
	}

	/**
	 * Subscribe to signaling messages from Convex
	 */
	subscribeToSignals(
		sessionId: string,
		userId: string,
		callback: (message: SignalingMessage) => void
	): () => void {
		// In actual implementation:
		// const unsubscribe = subscriptions.subscribeToSignaling(
		//   { sessionId, userId },
		//   (messages) => {
		//     messages.forEach(msg => {
		//       const signal: SignalingMessage = {
		//         sessionId: msg.sessionId,
		//         from: msg.from,
		//         to: msg.to,
		//         type: msg.type,
		//         payload: JSON.parse(msg.payload)
		//       };
		//       callback(signal);
		//       // Mark as delivered
		//       this.convex.mutation(api.mutations.markMessageDelivered, {
		//         messageId: msg._id
		//       });
		//     });
		//   }
		// );

		const key = `${sessionId}-${userId}`;
		const unsubscribe = subscriptions.subscribeToSignaling(
			{ sessionId, userId },
			(messages) => {
				// Process messages and call callback
			}
		);

		this.subscriptions.set(key, unsubscribe);

		return () => {
			const unsub = this.subscriptions.get(key);
			if (unsub) {
				unsub();
				this.subscriptions.delete(key);
			}
		};
	}

	/**
	 * Add a participant to a session
	 */
	async addParticipant(sessionId: string, participant: Participant): Promise<void> {
		// In actual implementation:
		// await this.convex.mutation(api.mutations.joinSession, {
		//   sessionId,
		//   userId: participant.userId,
		//   userName: participant.user?.name || 'Player',
		//   userAvatar: participant.user?.avatar,
		//   role: participant.role
		// });

		await mutations.joinSession({
			sessionId,
			userId: participant.userId,
			userName: participant.user?.name || 'Player',
			userAvatar: participant.user?.avatar,
			role: participant.role
		});
	}

	/**
	 * Remove a participant from a session
	 */
	async removeParticipant(sessionId: string, userId: string): Promise<void> {
		// In actual implementation:
		// await this.convex.mutation(api.mutations.leaveSession, {
		//   sessionId,
		//   userId
		// });

		await mutations.leaveSession({ sessionId, userId });
	}

	/**
	 * Cleanup and disconnect
	 */
	disconnect(): void {
		// Unsubscribe from all subscriptions
		this.subscriptions.forEach((unsubscribe) => unsubscribe());
		this.subscriptions.clear();

		console.log('[ConvexClient] Disconnected');
	}
}

/**
 * Create Convex client instance
 */
export function createConvexClient(config: ConvexClientConfig): ConvexSignalingClient {
	return new ConvexSignalingClient(config);
}

/**
 * Helper: Convert Convex session document to Session type
 */
function convertSessionDoc(doc: any): Session | null {
	if (!doc) return null;

	return {
		id: doc.sessionId,
		gameId: doc.gameId,
		hostId: doc.hostId,
		mode: doc.mode,
		status: doc.status,
		config: {
			gameId: doc.gameId,
			mode: doc.mode,
			maxPlayers: doc.maxPlayers,
			allowSpectators: doc.allowSpectators,
			visibility: doc.visibility,
			matchmaking: doc.matchmaking
		},
		participants: doc.participants || [],
		createdAt: doc.createdAt,
		expiresAt: doc.expiresAt
	};
}

/**
 * Export all Convex functionality
 */
export const convex = {
	mutations,
	queries,
	actions,
	subscriptions,
	createClient: createConvexClient
};
