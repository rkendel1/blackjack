/**
 * useStackLiveInteraction
 * Universal realtime embed interaction hook
 * Provides bi-directional communication for embeds (games, classrooms, polls, etc.)
 */

import { writable, derived } from 'svelte/store';
import { StackLiveMultiplayerRuntime } from './StackLiveMultiplayerRuntime';
import { InteractionManager } from './InteractionManager';
import { MediaStreamManager, type MediaStreamConfig } from './MediaStreamManager';
import type {
	Session,
	Participant,
	ConnectionQuality,
	SessionState,
	SessionType,
	InteractionType,
	PollMessage,
	QuizMessage,
	PollResponse,
	QuizResponse,
	SnapMessage,
	ChatMessage,
	MediaMessage
} from './types';

export interface StackLiveInteractionConfig {
	embedId?: string; // Unique identifier for the embed
	type?: SessionType; // Type of session (game, class, quiz, poll, etc.)
	sessionId?: string; // Join existing session (for participants/viewers)
	maxParticipants?: number;
	video?: boolean | MediaTrackConstraints;
	audio?: boolean | MediaTrackConstraints;
	debug?: boolean;
}

export interface StackLiveInteractionSession {
	// Session state stores
	session: ReturnType<typeof writable<Session | null>>;
	participants: ReturnType<typeof writable<Participant[]>>;
	connectionQuality: ReturnType<typeof writable<ConnectionQuality>>;
	sessionState: ReturnType<typeof writable<SessionState>>;
	isHost: ReturnType<typeof writable<boolean>>;
	isConnected: ReturnType<typeof writable<boolean>>;
	localStream: ReturnType<typeof writable<MediaStream | null>>;
	remoteStreams: ReturnType<typeof writable<Map<string, MediaStream>>>;

	// Session lifecycle
	start: () => Promise<Session | null>;
	connect: (options?: { role?: 'viewer' | 'player' | 'presenter' }) => Promise<boolean>;
	stop: () => void;

	// Communication
	send: (message: {
		type: 'state' | 'poll' | 'quiz' | 'reaction' | 'snap' | 'input' | 'chat' | 'media';
		payload: unknown;
		mediaUrl?: string;
		mediaType?: string;
	}) => void;
	on: (
		event: 'state' | 'interaction' | 'videoFrame' | 'audioFrame' | 'join' | 'leave' | 'reconnect',
		callback: (data: unknown) => void
	) => void;

	// Interaction helpers
	createPoll: (
		question: string,
		options: string[],
		allowMultiple?: boolean,
		expiresAt?: number
	) => PollMessage;
	createQuiz: (
		question: string,
		options: string[],
		correctAnswer?: number,
		timeLimit?: number,
		points?: number
	) => QuizMessage;
	getPollResults: (pollId: string) => PollResponse[];
	getQuizResults: (quizId: string) => QuizResponse[];
	getMessages: (options?: { limit?: number }) => (ChatMessage | MediaMessage)[];

	// Media controls
	toggleVideo: (enabled: boolean) => void;
	toggleAudio: (enabled: boolean) => void;

	// User info
	getLocalUserId: () => string;

	// Cleanup
	destroy: () => void;
}

export function useStackLiveInteraction(
	config: StackLiveInteractionConfig
): StackLiveInteractionSession {
	let runtime: StackLiveMultiplayerRuntime | null = null;
	let interactionManager: InteractionManager | null = null;
	let mediaManager: MediaStreamManager | null = null;
	let qualityCheckInterval: ReturnType<typeof setInterval> | null = null;

	// Reactive stores
	const session = writable<Session | null>(null);
	const participants = writable<Participant[]>([]);
	const connectionQuality = writable<ConnectionQuality>({
		latency: 0,
		jitter: 0,
		packetLoss: 0,
		quality: 'excellent'
	});
	const sessionState = writable<SessionState>('IDLE');
	const isHost = writable<boolean>(false);
	const isConnected = writable<boolean>(false);
	const localStream = writable<MediaStream | null>(null);
	const remoteStreams = writable<Map<string, MediaStream>>(new Map());

	/**
	 * Initialize managers
	 */
	function initialize(): void {
		if (interactionManager || mediaManager) {
			return;
		}

		interactionManager = new InteractionManager(config.debug);
		mediaManager = new MediaStreamManager(config.debug);

		// Setup media stream callbacks
		mediaManager.onRemoteStream((userId, stream) => {
			remoteStreams.update((streams) => {
				const newStreams = new Map(streams);
				newStreams.set(userId, stream);
				return newStreams;
			});
		});
	}

	/**
	 * Start a new session as host/publisher
	 */
	async function start(): Promise<Session | null> {
		initialize();

		// Initialize runtime
		runtime = new StackLiveMultiplayerRuntime(
			{
				embedId: config.embedId,
				type: config.type,
				maxPlayers: config.maxParticipants ?? 10,
				video: !!config.video,
				audio: !!config.audio,
				debug: config.debug
			}
		);

		// Setup event listeners
		setupEventListeners();

		// Initialize media if needed
		if (config.video || config.audio) {
			if (mediaManager) {
				const stream = await mediaManager.initializeLocalStream({
					video: config.video,
					audio: config.audio
				});
				localStream.set(stream);
			}
		}

		// Create session
		try {
			const newSession = await runtime.createSession();
			session.set(newSession);
			isHost.set(true);
			sessionState.set(newSession.status);
			participants.set(newSession.participants);
			isConnected.set(true);
			return newSession;
		} catch (error) {
			console.error('Failed to start session:', error);
			return null;
		}
	}

	/**
	 * Connect to existing session as participant/viewer
	 */
	async function connect(options?: {
		role?: 'viewer' | 'player' | 'presenter';
	}): Promise<boolean> {
		if (!config.sessionId) {
			console.error('Session ID required to connect');
			return false;
		}

		initialize();

		// Initialize runtime
		runtime = new StackLiveMultiplayerRuntime(
			{
				embedId: config.embedId,
				type: config.type,
				maxPlayers: config.maxParticipants ?? 10,
				video: !!config.video,
				audio: !!config.audio,
				debug: config.debug
			}
		);

		// Setup event listeners
		setupEventListeners();

		// Initialize media if needed
		if (config.video || config.audio) {
			if (mediaManager) {
				const stream = await mediaManager.initializeLocalStream({
					video: config.video,
					audio: config.audio
				});
				localStream.set(stream);
			}
		}

		// Join session
		try {
			const participant = await runtime.joinSession(config.sessionId);
			if (participant) {
				updateSession();
				isHost.set(false);
				isConnected.set(true);
				return true;
			}
			return false;
		} catch (error) {
			console.error('Failed to connect to session:', error);
			return false;
		}
	}

	/**
	 * Setup event listeners
	 */
	function setupEventListeners(): void {
		if (!runtime) return;

		runtime.on('playerJoined', () => updateSession());
		runtime.on('playerLeft', () => updateSession());
		runtime.on('connectionLost', () => isConnected.set(false));
		runtime.on('reconnected', () => isConnected.set(true));
		runtime.on('gameStart', () => updateSession());
		runtime.on('gameEnd', () => {
			session.set(null);
			participants.set([]);
			sessionState.set('ENDED');
		});

		// Handle state sync messages
		runtime.onStateSync((state) => {
			// Notify state listeners
		});

		// Update connection quality periodically
		if (qualityCheckInterval) {
			clearInterval(qualityCheckInterval);
		}
		qualityCheckInterval = setInterval(() => {
			if (runtime) {
				connectionQuality.set(runtime.getConnectionQuality());
			}
		}, 2000);
	}

	/**
	 * Stop session
	 */
	function stop(): void {
		if (runtime) {
			runtime.leaveSession();
		}
		if (mediaManager) {
			mediaManager.destroy();
		}
		session.set(null);
		participants.set([]);
		sessionState.set('ENDED');
		isHost.set(false);
		isConnected.set(false);
		localStream.set(null);
		remoteStreams.set(new Map());
	}

	/**
	 * Send message
	 */
	function send(message: {
		type: 'state' | 'poll' | 'quiz' | 'reaction' | 'snap' | 'input' | 'chat' | 'media';
		payload: unknown;
		mediaUrl?: string;
		mediaType?: string;
	}): void {
		if (!runtime) return;

		if (message.type === 'state') {
			runtime.sendState(message.payload);
		} else if (message.type === 'chat') {
			// Handle chat message
			const currentSession = runtime.getSession();
			const chatMessage: ChatMessage = {
				id: generateId(),
				sessionId: currentSession?.id || '',
				fromUserId: runtime.getLocalUserId(),
				payload: message.payload as string,
				timestamp: Date.now()
			};
			interactionManager?.handleInteraction('chat', chatMessage, chatMessage.fromUserId);
			runtime.sendInput({
				type: 'interaction',
				interactionType: 'chat',
				payload: chatMessage
			});
		} else if (message.type === 'media') {
			// Validate media URL
			if (!message.mediaUrl || !isValidUrl(message.mediaUrl)) {
				console.error('Invalid media URL provided');
				return;
			}
			
			// Handle media message
			const currentSession = runtime.getSession();
			const mediaMessage: MediaMessage = {
				id: generateId(),
				sessionId: currentSession?.id || '',
				fromUserId: runtime.getLocalUserId(),
				payload: message.payload as { caption?: string; [key: string]: unknown },
				mediaUrl: message.mediaUrl,
				mediaType: message.mediaType || '',
				timestamp: Date.now()
			};
			interactionManager?.handleInteraction('media', mediaMessage, mediaMessage.fromUserId);
			runtime.sendInput({
				type: 'interaction',
				interactionType: 'media',
				payload: mediaMessage
			});
		} else {
			runtime.sendInput({
				type: 'interaction',
				interactionType: message.type as InteractionType,
				payload: message.payload
			});
		}
	}

	/**
	 * Register event listeners
	 */
	function on(
		event: 'state' | 'interaction' | 'videoFrame' | 'audioFrame' | 'join' | 'leave' | 'reconnect',
		callback: (data: unknown) => void
	): void {
		if (event === 'state') {
			runtime?.onStateSync(callback);
		} else if (event === 'interaction') {
			interactionManager?.on('poll', callback);
			interactionManager?.on('quiz', callback);
			interactionManager?.on('reaction', callback);
			interactionManager?.on('snap', callback);
			interactionManager?.on('chat', callback);
			interactionManager?.on('media', callback);
		} else if (event === 'join') {
			runtime?.on('playerJoined', callback);
		} else if (event === 'leave') {
			runtime?.on('playerLeft', callback);
		} else if (event === 'reconnect') {
			runtime?.on('reconnected', callback);
		}
	}

	/**
	 * Create poll
	 */
	function createPoll(
		question: string,
		options: string[],
		allowMultiple = false,
		expiresAt?: number
	): PollMessage {
		if (!interactionManager) {
			throw new Error('Interaction manager not initialized. Call start() or connect() first.');
		}
		const poll = interactionManager.createPoll(question, options, allowMultiple, expiresAt);
		send({ type: 'poll', payload: poll });
		return poll;
	}

	/**
	 * Create quiz
	 */
	function createQuiz(
		question: string,
		options: string[],
		correctAnswer?: number,
		timeLimit?: number,
		points?: number
	): QuizMessage {
		if (!interactionManager) {
			throw new Error('Interaction manager not initialized. Call start() or connect() first.');
		}
		const quiz = interactionManager.createQuiz(question, options, correctAnswer, timeLimit, points);
		send({ type: 'quiz', payload: quiz });
		return quiz;
	}

	/**
	 * Get poll results
	 */
	function getPollResults(pollId: string): PollResponse[] {
		return interactionManager?.getPollResults(pollId) || [];
	}

	/**
	 * Get quiz results
	 */
	function getQuizResults(quizId: string): QuizResponse[] {
		return interactionManager?.getQuizResults(quizId) || [];
	}

	/**
	 * Get messages (chat + media)
	 */
	function getMessages(options?: { limit?: number }): (ChatMessage | MediaMessage)[] {
		const currentSession = runtime?.getSession();
		if (!currentSession || !interactionManager) {
			return [];
		}
		
		// Validate limit parameter
		let validatedOptions = options;
		if (options?.limit !== undefined) {
			const limit = Math.floor(options.limit);
			if (limit < 0 || limit > 1000) {
				console.warn('Message limit must be between 0 and 1000, using default');
				validatedOptions = undefined;
			} else {
				validatedOptions = { limit };
			}
		}
		
		return interactionManager.getMessages(currentSession.id, validatedOptions);
	}

	/**
	 * Toggle video
	 */
	function toggleVideo(enabled: boolean): void {
		mediaManager?.toggleVideo(enabled);
	}

	/**
	 * Toggle audio
	 */
	function toggleAudio(enabled: boolean): void {
		mediaManager?.toggleAudio(enabled);
	}

	/**
	 * Update session data
	 */
	function updateSession(): void {
		if (runtime) {
			const currentSession = runtime.getSession();
			if (currentSession) {
				session.set(currentSession);
				participants.set(currentSession.participants);
				sessionState.set(currentSession.status);
				isHost.set(runtime.isHost());
			}
		}
	}

	/**
	 * Generate unique ID using crypto.randomUUID if available, otherwise fallback
	 * Note: Fallback method uses timestamp + random for uniqueness but is not cryptographically secure
	 */
	function generateId(): string {
		// Use crypto.randomUUID if available (browser/Node.js 15+)
		if (typeof crypto !== 'undefined' && crypto.randomUUID) {
			return crypto.randomUUID();
		}
		
		// Fallback: Use timestamp + multiple random components for better uniqueness
		// This is not cryptographically secure but provides reasonable uniqueness for non-critical contexts
		const timestamp = Date.now().toString(36);
		const random1 = Math.random().toString(36).substring(2, 11);
		const random2 = Math.random().toString(36).substring(2, 11);
		const random3 = Math.random().toString(36).substring(2, 11);
		return `${timestamp}-${random1}-${random2}-${random3}`;
	}

	/**
	 * Validate URL format
	 */
	function isValidUrl(url: string): boolean {
		try {
			const parsedUrl = new URL(url);
			// Only allow http and https protocols
			return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
		} catch {
			return false;
		}
	}

	/**
	 * Get local user ID
	 */
	function getLocalUserId(): string {
		return runtime?.getLocalUserId() || '';
	}

	/**
	 * Cleanup
	 */
	function destroy(): void {
		// Clear interval
		if (qualityCheckInterval) {
			clearInterval(qualityCheckInterval);
			qualityCheckInterval = null;
		}

		if (runtime) {
			runtime.destroy();
			runtime = null;
		}
		if (interactionManager) {
			interactionManager = null;
		}
		if (mediaManager) {
			mediaManager.destroy();
			mediaManager = null;
		}
	}

	return {
		// Stores
		session,
		participants,
		connectionQuality,
		sessionState,
		isHost,
		isConnected,
		localStream,
		remoteStreams,

		// Actions
		start,
		connect,
		stop,
		send,
		on,

		// Interaction helpers
		createPoll,
		createQuiz,
		getPollResults,
		getQuizResults,
		getMessages,

		// Media controls
		toggleVideo,
		toggleAudio,

		// User info
		getLocalUserId,

		// Cleanup
		destroy
	};
}
