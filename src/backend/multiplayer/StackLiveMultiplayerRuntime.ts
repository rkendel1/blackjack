/**
 * StackLive Multiplayer Runtime (SMR)
 * Core runtime engine for multiplayer functionality
 */

import { PeerConnectionManager } from './PeerConnectionManager';
import { SessionManager } from './SessionManager';
import { LatencyManager } from './LatencyManager';
import { MatchmakingManager } from './MatchmakingManager';
import { AbusePreventionManager } from './AbusePreventionManager';
import { URLJoinManager } from './URLJoinManager';
import { MockSignalingAdapter, type SignalingAdapter } from './SignalingAdapter';
import type {
	MultiplayerConfig,
	Session,
	StackLiveMessage,
	LifecycleEvent,
	LifecycleEventType,
	ConnectionQuality,
	RTCConfig,
	SessionConfig,
	Participant,
	User
} from './types';

export class StackLiveMultiplayerRuntime {
	private config: MultiplayerConfig;
	private peerManager: PeerConnectionManager;
	private sessionManager: SessionManager;
	private latencyManager: LatencyManager;
	private matchmakingManager: MatchmakingManager;
	private abusePreventionManager: AbusePreventionManager;
	private urlJoinManager: URLJoinManager;
	private signalingAdapter: SignalingAdapter;
	private userId: string;
	private user: User;
	private eventCallbacks: Map<LifecycleEventType, ((data?: unknown) => void)[]> = new Map();
	private inputCallback?: (input: unknown) => void;
	private stateSyncCallback?: (state: unknown) => void;
	private debugMode: boolean;
	private cleanupInterval?: number;

	constructor(config: MultiplayerConfig, userId?: string, user?: User) {
		this.config = {
			mode: 'host-authoritative',
			matchmaking: false,
			spectators: false,
			screenShare: false,
			maxPlayers: 4,
			debug: false,
			...config
		};

		this.debugMode = this.config.debug ?? false;
		this.userId = userId ?? this.generateUserId();
		this.user = user ?? {
			id: this.userId,
			name: `Player-${this.userId.substring(0, 8)}`
		};

		// Initialize managers
		const rtcConfig: RTCConfig = {
			iceServers: [
				{ urls: 'stun:stun.l.google.com:19302' },
				{ urls: 'stun:stun1.l.google.com:19302' }
			]
		};

		this.peerManager = new PeerConnectionManager(rtcConfig);
		this.sessionManager = new SessionManager();
		this.latencyManager = new LatencyManager();
		this.matchmakingManager = new MatchmakingManager();
		this.abusePreventionManager = new AbusePreventionManager();
		this.urlJoinManager = new URLJoinManager();
		this.signalingAdapter = new MockSignalingAdapter();

		this.setupEventHandlers();
		this.log('Multiplayer runtime initialized', this.config);
	}

	/**
	 * Create a new multiplayer session as host
	 */
	async createSession(): Promise<Session> {
		this.log('Creating session...');

		const sessionConfig: SessionConfig = {
			gameId: this.config.gameId,
			embedId: this.config.embedId,
			type: this.config.type,
			mode: this.config.mode ?? 'host-authoritative',
			maxPlayers: this.config.maxPlayers ?? 4,
			allowSpectators: this.config.spectators ?? false,
			visibility: 'public',
			matchmaking: this.config.matchmaking,
			screenShare: this.config.screenShare,
			video: this.config.video,
			audio: this.config.audio
		};

		const session = this.sessionManager.createSession(sessionConfig, this.userId);

		// Initialize peer connection
		await this.peerManager.createPeerConnection();
		this.peerManager.createDataChannel('game-data');

		this.emitEvent('gameStart', { session });
		return session;
	}

	/**
	 * Join an existing session
	 */
	async joinSession(sessionId: string): Promise<Participant | null> {
		this.log('Joining session:', sessionId);

		const participant = this.sessionManager.joinSession(sessionId, this.userId);
		if (!participant) {
			this.log('Failed to join session');
			return null;
		}

		// Initialize peer connection
		await this.peerManager.createPeerConnection();

		this.emitEvent('playerJoined', { participant });
		return participant;
	}

	/**
	 * Send input to other players
	 */
	sendInput(payload: unknown): void {
		const message: StackLiveMessage = {
			type: 'input',
			frame: Date.now(),
			payload
		};

		this.peerManager.sendMessage(message);
		this.log('Sent input:', payload);
	}

	/**
	 * Send state synchronization
	 */
	sendState(payload: unknown): void {
		const message: StackLiveMessage = {
			type: 'state',
			payload
		};

		this.peerManager.sendMessage(message);
		this.log('Sent state:', payload);
	}

	/**
	 * Request state sync from host
	 */
	requestStateSync(): void {
		const message: StackLiveMessage = {
			type: 'sync-request'
		};

		this.peerManager.sendMessage(message);
		this.log('Requested state sync');
	}

	/**
	 * Leave the current session
	 */
	leaveSession(): void {
		this.log('Leaving session...');

		this.sessionManager.leaveSession(this.userId);
		this.peerManager.closePeerConnection();
		this.latencyManager.stopMeasurement();

		this.emitEvent('gameEnd');
	}

	/**
	 * Get current latency
	 */
	getLatency(): number {
		return this.latencyManager.getLatency();
	}

	/**
	 * Get connection quality metrics
	 */
	getConnectionQuality(): ConnectionQuality {
		return this.latencyManager.getConnectionQuality();
	}

	/**
	 * Register callback for lifecycle events
	 */
	on(eventType: LifecycleEventType, callback: (data?: unknown) => void): void {
		if (!this.eventCallbacks.has(eventType)) {
			this.eventCallbacks.set(eventType, []);
		}
		this.eventCallbacks.get(eventType)!.push(callback);
	}

	/**
	 * Register callback for input events
	 */
	onInput(callback: (input: unknown) => void): void {
		this.inputCallback = callback;
	}

	/**
	 * Register callback for state sync events
	 */
	onStateSync(callback: (state: unknown) => void): void {
		this.stateSyncCallback = callback;
	}

	/**
	 * Get current session
	 */
	getSession(): Session | null {
		return this.sessionManager.getSession();
	}

	/**
	 * Check if user is host
	 */
	isHost(): boolean {
		const session = this.sessionManager.getSession();
		return session?.hostId === this.userId;
	}

	/**
	 * Get local user ID
	 */
	getLocalUserId(): string {
		return this.userId;
	}

	/**
	 * Get local user information
	 */
	getLocalUser(): User {
		return this.user;
	}

	/**
	 * Setup event handlers for internal managers
	 */
	private setupEventHandlers(): void {
		// Handle incoming messages
		this.peerManager.onMessage((message) => {
			this.handleMessage(message);
		});

		// Handle connection state changes
		this.peerManager.onConnectionStateChange((state) => {
			this.log('Connection state:', state);

			if (state === 'connected') {
				this.sessionManager.updateParticipantStatus(this.userId, 'connected');
				this.latencyManager.startMeasurement();
			} else if (state === 'disconnected' || state === 'failed') {
				this.sessionManager.updateParticipantStatus(this.userId, 'disconnected');
				this.emitEvent('connectionLost');
			}
		});

		// Handle session state changes
		this.sessionManager.onStateChange((state) => {
			this.log('Session state:', state);
			this.emitEvent('stateChanged', { state });
		});

		// Handle ping requests
		this.latencyManager.onPing(() => {
			const message: StackLiveMessage = {
				type: 'ping',
				ts: Date.now()
			};
			this.peerManager.sendMessage(message);
		});
	}

	/**
	 * Handle incoming messages
	 */
	private handleMessage(message: StackLiveMessage): void {
		this.log('Received message:', message);

		switch (message.type) {
			case 'input':
				if (this.inputCallback) {
					this.inputCallback(message.payload);
				}
				break;

			case 'state':
			case 'sync-response':
				if (this.stateSyncCallback) {
					this.stateSyncCallback(message.payload);
				}
				break;

			case 'sync-request':
				// Host should respond with current state
				if (this.isHost() && this.stateSyncCallback) {
					// State will be sent by the game implementation
					this.emitEvent('stateChanged', { syncRequested: true });
				}
				break;

			case 'ping':
				// Respond with pong
				const pongMessage: StackLiveMessage = {
					type: 'pong',
					ts: message.ts
				};
				this.peerManager.sendMessage(pongMessage);
				break;

			case 'pong':
				this.latencyManager.handlePong(message.ts);
				break;

			case 'lobby-update':
				this.emitEvent('playerJoined', { players: message.players });
				break;

			case 'presence':
				this.emitEvent('playerJoined', { user: message.user });
				break;
		}
	}

	/**
	 * Emit a lifecycle event
	 */
	private emitEvent(type: LifecycleEventType, data?: unknown): void {
		const event: LifecycleEvent = {
			type,
			data,
			timestamp: Date.now()
		};

		const callbacks = this.eventCallbacks.get(type);
		if (callbacks) {
			callbacks.forEach((callback) => callback(data));
		}

		this.log('Event emitted:', event);
	}

	/**
	 * Log debug messages
	 */
	private log(...args: unknown[]): void {
		if (this.debugMode) {
			console.log('[SMR]', ...args);
		}
	}

	/**
	 * Generate a unique user ID
	 */
	private generateUserId(): string {
		return `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
	}

	/**
	 * Cleanup and destroy the runtime
	 */
	destroy(): void {
		this.log('Destroying runtime...');

		this.leaveSession();
		this.eventCallbacks.clear();
		this.inputCallback = undefined;
		this.stateSyncCallback = undefined;
	}
}
