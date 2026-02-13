/**
 * Signaling Adapter for StackLive Multiplayer
 * Provides abstraction for signaling server communication
 * Currently mock implementation - ready for Convex integration
 */

import type { SignalingMessage, Session, Participant } from './types';

export interface SignalingAdapter {
	// Session operations
	createSession(session: Session): Promise<void>;
	getSession(sessionId: string): Promise<Session | null>;
	updateSession(session: Session): Promise<void>;
	deleteSession(sessionId: string): Promise<void>;

	// Signaling operations
	sendSignal(message: SignalingMessage): Promise<void>;
	subscribeToSignals(
		sessionId: string,
		userId: string,
		callback: (message: SignalingMessage) => void
	): () => void;

	// Participant operations
	addParticipant(sessionId: string, participant: Participant): Promise<void>;
	removeParticipant(sessionId: string, userId: string): Promise<void>;
}

/**
 * Mock Signaling Adapter
 * In-memory implementation for development/testing
 * Replace with ConvexSignalingAdapter for production
 */
export class MockSignalingAdapter implements SignalingAdapter {
	private sessions = new Map<string, Session>();
	private signals = new Map<string, SignalingMessage[]>();
	private subscribers = new Map<string, ((message: SignalingMessage) => void)[]>();

	async createSession(session: Session): Promise<void> {
		this.sessions.set(session.id, session);
		this.signals.set(session.id, []);
		console.log('[MockSignaling] Session created:', session.id);
	}

	async getSession(sessionId: string): Promise<Session | null> {
		return this.sessions.get(sessionId) || null;
	}

	async updateSession(session: Session): Promise<void> {
		this.sessions.set(session.id, session);
		console.log('[MockSignaling] Session updated:', session.id);
	}

	async deleteSession(sessionId: string): Promise<void> {
		this.sessions.delete(sessionId);
		this.signals.delete(sessionId);
		this.subscribers.delete(sessionId);
		console.log('[MockSignaling] Session deleted:', sessionId);
	}

	async sendSignal(message: SignalingMessage): Promise<void> {
		const signals = this.signals.get(message.sessionId) || [];
		signals.push(message);
		this.signals.set(message.sessionId, signals);

		// Notify subscribers
		const callbacks = this.subscribers.get(message.sessionId) || [];
		callbacks.forEach((callback) => {
			// Only send to the intended recipient
			if (callback) {
				callback(message);
			}
		});

		console.log('[MockSignaling] Signal sent:', message.type, 'from', message.from, 'to', message.to);
	}

	subscribeToSignals(
		sessionId: string,
		userId: string,
		callback: (message: SignalingMessage) => void
	): () => void {
		const callbacks = this.subscribers.get(sessionId) || [];
		const wrappedCallback = (message: SignalingMessage) => {
			// Only deliver messages intended for this user
			if (message.to === userId) {
				callback(message);
			}
		};

		callbacks.push(wrappedCallback);
		this.subscribers.set(sessionId, callbacks);

		console.log('[MockSignaling] Subscribed to signals:', sessionId, userId);

		// Return unsubscribe function
		return () => {
			const idx = callbacks.indexOf(wrappedCallback);
			if (idx > -1) {
				callbacks.splice(idx, 1);
			}
			console.log('[MockSignaling] Unsubscribed from signals:', sessionId, userId);
		};
	}

	async addParticipant(sessionId: string, participant: Participant): Promise<void> {
		const session = this.sessions.get(sessionId);
		if (session) {
			session.participants.push(participant);
			await this.updateSession(session);
		}
	}

	async removeParticipant(sessionId: string, userId: string): Promise<void> {
		const session = this.sessions.get(sessionId);
		if (session) {
			session.participants = session.participants.filter((p) => p.userId !== userId);
			await this.updateSession(session);
		}
	}

	// Helper methods for development
	getAllSessions(): Session[] {
		return Array.from(this.sessions.values());
	}

	getPublicSessions(): Session[] {
		return this.getAllSessions().filter((s) => s.config.visibility === 'public');
	}
}

/**
 * Future: Convex Signaling Adapter
 * This would integrate with Convex for production signaling
 */
export class ConvexSignalingAdapter implements SignalingAdapter {
	// TODO: Implement Convex integration
	// - Use Convex mutations for createSession, updateSession, etc.
	// - Use Convex queries for getSession
	// - Use Convex subscriptions for real-time signaling

	async createSession(session: Session): Promise<void> {
		throw new Error('ConvexSignalingAdapter not implemented yet');
	}

	async getSession(sessionId: string): Promise<Session | null> {
		throw new Error('ConvexSignalingAdapter not implemented yet');
	}

	async updateSession(session: Session): Promise<void> {
		throw new Error('ConvexSignalingAdapter not implemented yet');
	}

	async deleteSession(sessionId: string): Promise<void> {
		throw new Error('ConvexSignalingAdapter not implemented yet');
	}

	async sendSignal(message: SignalingMessage): Promise<void> {
		throw new Error('ConvexSignalingAdapter not implemented yet');
	}

	subscribeToSignals(
		sessionId: string,
		userId: string,
		callback: (message: SignalingMessage) => void
	): () => void {
		throw new Error('ConvexSignalingAdapter not implemented yet');
	}

	async addParticipant(sessionId: string, participant: Participant): Promise<void> {
		throw new Error('ConvexSignalingAdapter not implemented yet');
	}

	async removeParticipant(sessionId: string, userId: string): Promise<void> {
		throw new Error('ConvexSignalingAdapter not implemented yet');
	}
}
