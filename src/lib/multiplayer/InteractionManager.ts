/**
 * InteractionManager
 * Manages interactive messages (polls, quizzes, reactions, snaps, chat, media)
 */

import type {
	InteractionType,
	PollMessage,
	PollResponse,
	QuizMessage,
	QuizResponse,
	SnapMessage,
	ChatMessage,
	MediaMessage
} from './types';

export class InteractionManager {
	private interactionCallbacks: Map<InteractionType, ((payload: unknown) => void)[]> = new Map();
	private pollResponses: Map<string, PollResponse[]> = new Map();
	private quizResponses: Map<string, QuizResponse[]> = new Map();
	private snapMessages: Map<string, SnapMessage[]> = new Map();
	private chatMessages: Map<string, ChatMessage[]> = new Map();
	private mediaMessages: Map<string, MediaMessage[]> = new Map();
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

		// Store responses based on type with validation
		if (type === 'poll' && this.isPollResponse(payload)) {
			this.handlePollResponse(payload);
		} else if (type === 'quiz' && this.isQuizResponse(payload)) {
			this.handleQuizResponse(payload);
		} else if (type === 'snap' && this.isSnapMessage(payload)) {
			this.handleSnapMessage(payload);
		} else if (type === 'chat' && this.isChatMessage(payload)) {
			this.handleChatMessage(payload);
		} else if (type === 'media' && this.isMediaMessage(payload)) {
			this.handleMediaMessage(payload);
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
	 * Handle chat message
	 */
	private handleChatMessage(chat: ChatMessage): void {
		const sessionChats = this.chatMessages.get(chat.sessionId) || [];
		sessionChats.push(chat);
		this.chatMessages.set(chat.sessionId, sessionChats);
	}

	/**
	 * Handle media message
	 */
	private handleMediaMessage(media: MediaMessage): void {
		const sessionMedia = this.mediaMessages.get(media.sessionId) || [];
		sessionMedia.push(media);
		this.mediaMessages.set(media.sessionId, sessionMedia);
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
	 * Get chat messages
	 */
	getChatMessages(sessionId: string): ChatMessage[] {
		return this.chatMessages.get(sessionId) || [];
	}

	/**
	 * Get media messages
	 */
	getMediaMessages(sessionId: string): MediaMessage[] {
		return this.mediaMessages.get(sessionId) || [];
	}

	/**
	 * Get all messages (chat + media) for a session
	 */
	getMessages(sessionId: string, options?: { limit?: number }): (ChatMessage | MediaMessage)[] {
		const chats = this.getChatMessages(sessionId);
		const media = this.getMediaMessages(sessionId);
		const allMessages = [...chats, ...media].sort((a, b) => a.timestamp - b.timestamp);
		
		if (options?.limit) {
			return allMessages.slice(-options.limit);
		}
		return allMessages;
	}

	/**
	 * Clear interaction data for a session
	 */
	clearSession(sessionId: string): void {
		this.pollResponses.clear();
		this.quizResponses.clear();
		this.snapMessages.delete(sessionId);
		this.chatMessages.delete(sessionId);
		this.mediaMessages.delete(sessionId);
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

	/**
	 * Type guards for runtime validation
	 */
	private isPollResponse(payload: unknown): payload is PollResponse {
		return (
			typeof payload === 'object' &&
			payload !== null &&
			'pollId' in payload &&
			'userId' in payload &&
			'answers' in payload
		);
	}

	private isQuizResponse(payload: unknown): payload is QuizResponse {
		return (
			typeof payload === 'object' &&
			payload !== null &&
			'quizId' in payload &&
			'userId' in payload &&
			'answer' in payload
		);
	}

	private isSnapMessage(payload: unknown): payload is SnapMessage {
		return (
			typeof payload === 'object' &&
			payload !== null &&
			'id' in payload &&
			'type' in payload &&
			'data' in payload
		);
	}

	private isChatMessage(payload: unknown): payload is ChatMessage {
		return (
			typeof payload === 'object' &&
			payload !== null &&
			'sessionId' in payload &&
			'fromUserId' in payload &&
			'payload' in payload &&
			typeof (payload as ChatMessage).payload === 'string'
		);
	}

	private isMediaMessage(payload: unknown): payload is MediaMessage {
		return (
			typeof payload === 'object' &&
			payload !== null &&
			'sessionId' in payload &&
			'fromUserId' in payload &&
			'mediaUrl' in payload &&
			'mediaType' in payload
		);
	}
}
