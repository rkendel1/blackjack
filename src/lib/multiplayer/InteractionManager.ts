/**
 * InteractionManager
 * Manages interactive messages (polls, quizzes, reactions, snaps)
 */

import type {
	InteractionType,
	PollMessage,
	PollResponse,
	QuizMessage,
	QuizResponse,
	SnapMessage
} from './types';

export class InteractionManager {
	private interactionCallbacks: Map<InteractionType, ((payload: unknown) => void)[]> = new Map();
	private pollResponses: Map<string, PollResponse[]> = new Map();
	private quizResponses: Map<string, QuizResponse[]> = new Map();
	private snapMessages: Map<string, SnapMessage[]> = new Map();
	private debugMode: boolean;

	constructor(debug = false) {
		this.debugMode = debug;
	}

	/**
	 * Register callback for interaction events
	 */
	on(type: InteractionType, callback: (payload: unknown) => void): void {
		if (!this.interactionCallbacks.has(type)) {
			this.interactionCallbacks.set(type, []);
		}
		this.interactionCallbacks.get(type)!.push(callback);
	}

	/**
	 * Remove callback for interaction events
	 */
	off(type: InteractionType, callback: (payload: unknown) => void): void {
		const callbacks = this.interactionCallbacks.get(type);
		if (callbacks) {
			const index = callbacks.indexOf(callback);
			if (index > -1) {
				callbacks.splice(index, 1);
			}
		}
	}

	/**
	 * Handle incoming interaction message
	 */
	handleInteraction(type: InteractionType, payload: unknown, fromUserId: string): void {
		this.log(`Handling ${type} interaction from user ${fromUserId}`, payload);

		// Store responses based on type
		if (type === 'poll') {
			this.handlePollResponse(payload as PollResponse);
		} else if (type === 'quiz') {
			this.handleQuizResponse(payload as QuizResponse);
		} else if (type === 'snap') {
			this.handleSnapMessage(payload as SnapMessage);
		}

		// Notify registered callbacks
		const callbacks = this.interactionCallbacks.get(type);
		if (callbacks) {
			callbacks.forEach((cb) => cb(payload));
		}
	}

	/**
	 * Create and broadcast a poll
	 */
	createPoll(question: string, options: string[], allowMultiple = false, expiresAt?: number): PollMessage {
		const poll: PollMessage = {
			id: this.generateId(),
			question,
			options,
			allowMultiple,
			expiresAt
		};

		this.pollResponses.set(poll.id, []);
		this.log('Poll created', poll);
		return poll;
	}

	/**
	 * Create and broadcast a quiz
	 */
	createQuiz(
		question: string,
		options: string[],
		correctAnswer?: number,
		timeLimit?: number,
		points?: number
	): QuizMessage {
		const quiz: QuizMessage = {
			id: this.generateId(),
			question,
			options,
			correctAnswer,
			timeLimit,
			points
		};

		this.quizResponses.set(quiz.id, []);
		this.log('Quiz created', quiz);
		return quiz;
	}

	/**
	 * Handle poll response
	 */
	private handlePollResponse(response: PollResponse): void {
		const responses = this.pollResponses.get(response.pollId);
		if (responses) {
			// Remove existing response from same user
			const existingIndex = responses.findIndex((r) => r.userId === response.userId);
			if (existingIndex > -1) {
				responses.splice(existingIndex, 1);
			}
			responses.push(response);
		}
	}

	/**
	 * Handle quiz response
	 */
	private handleQuizResponse(response: QuizResponse): void {
		const responses = this.quizResponses.get(response.quizId);
		if (responses) {
			// Only allow one response per user per quiz
			const existingIndex = responses.findIndex((r) => r.userId === response.userId);
			if (existingIndex === -1) {
				responses.push(response);
			}
		}
	}

	/**
	 * Handle snap message
	 */
	private handleSnapMessage(snap: SnapMessage): void {
		const sessionSnaps = this.snapMessages.get(snap.id) || [];
		sessionSnaps.push(snap);
		this.snapMessages.set(snap.id, sessionSnaps);
	}

	/**
	 * Get poll results
	 */
	getPollResults(pollId: string): PollResponse[] {
		return this.pollResponses.get(pollId) || [];
	}

	/**
	 * Get quiz results
	 */
	getQuizResults(quizId: string): QuizResponse[] {
		return this.quizResponses.get(quizId) || [];
	}

	/**
	 * Get snap messages
	 */
	getSnapMessages(sessionId: string): SnapMessage[] {
		return this.snapMessages.get(sessionId) || [];
	}

	/**
	 * Clear interaction data for a session
	 */
	clearSession(sessionId: string): void {
		this.pollResponses.clear();
		this.quizResponses.clear();
		this.snapMessages.delete(sessionId);
	}

	/**
	 * Generate unique ID
	 */
	private generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
	}

	/**
	 * Debug logging
	 */
	private log(message: string, data?: unknown): void {
		if (this.debugMode) {
			console.log(`[InteractionManager] ${message}`, data);
		}
	}
}
