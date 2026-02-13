/**
 * Svelte Store Adapter for StackLive Multiplayer Runtime
 * Provides a reactive Svelte interface to the multiplayer runtime
 */

import { writable, derived, get } from 'svelte/store';
import { StackLiveMultiplayerRuntime } from './StackLiveMultiplayerRuntime';
import type {
	MultiplayerConfig,
	Session,
	Participant,
	ConnectionQuality,
	SessionState
} from './types';

export function useStackLiveMultiplayer(config: MultiplayerConfig) {
	let runtime: StackLiveMultiplayerRuntime | null = null;

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

	// Derived stores
	const playerCount = derived(participants, ($participants) =>
		$participants.filter((p) => p.role === 'player').length
	);

	const spectatorCount = derived(participants, ($participants) =>
		$participants.filter((p) => p.role === 'spectator').length
	);

	/**
	 * Initialize the multiplayer runtime
	 */
	function initialize(userId?: string): void {
		if (runtime) {
			runtime.destroy();
		}

		runtime = new StackLiveMultiplayerRuntime(config, userId);

		// Setup event listeners
		runtime.on('playerJoined', (data) => {
			updateSession();
		});

		runtime.on('playerLeft', (data) => {
			updateSession();
		});

		runtime.on('connectionLost', () => {
			isConnected.set(false);
		});

		runtime.on('reconnected', () => {
			isConnected.set(true);
		});

		runtime.on('gameStart', () => {
			updateSession();
		});

		runtime.on('gameEnd', () => {
			session.set(null);
			participants.set([]);
			sessionState.set('ENDED');
		});

		runtime.on('stateChanged', (data) => {
			updateSession();
		});

		// Start periodic connection quality updates
		setInterval(() => {
			if (runtime) {
				connectionQuality.set(runtime.getConnectionQuality());
			}
		}, 2000);
	}

	/**
	 * Create a new session
	 */
	async function createSession(): Promise<Session | null> {
		if (!runtime) {
			initialize();
		}

		try {
			const newSession = await runtime!.createSession();
			session.set(newSession);
			isHost.set(true);
			sessionState.set(newSession.status);
			participants.set(newSession.participants);
			return newSession;
		} catch (error) {
			console.error('Failed to create session:', error);
			return null;
		}
	}

	/**
	 * Join an existing session
	 */
	async function joinSession(sessionId: string): Promise<boolean> {
		if (!runtime) {
			initialize();
		}

		try {
			const participant = await runtime!.joinSession(sessionId);
			if (participant) {
				updateSession();
				isHost.set(false);
				return true;
			}
			return false;
		} catch (error) {
			console.error('Failed to join session:', error);
			return false;
		}
	}

	/**
	 * Leave the current session
	 */
	function leaveSession(): void {
		if (runtime) {
			runtime.leaveSession();
			session.set(null);
			participants.set([]);
			sessionState.set('IDLE');
			isHost.set(false);
		}
	}

	/**
	 * Send input to other players
	 */
	function sendInput(input: unknown): void {
		if (runtime) {
			runtime.sendInput(input);
		}
	}

	/**
	 * Send state update to other players
	 */
	function sendState(state: unknown): void {
		if (runtime) {
			runtime.sendState(state);
		}
	}

	/**
	 * Request state sync from host
	 */
	function requestStateSync(): void {
		if (runtime) {
			runtime.requestStateSync();
		}
	}

	/**
	 * Register callback for input events
	 */
	function onInput(callback: (input: unknown) => void): void {
		if (runtime) {
			runtime.onInput(callback);
		}
	}

	/**
	 * Register callback for state sync events
	 */
	function onStateSync(callback: (state: unknown) => void): void {
		if (runtime) {
			runtime.onStateSync(callback);
		}
	}

	/**
	 * Get current latency
	 */
	function getLatency(): number {
		return runtime?.getLatency() ?? 0;
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
	 * Cleanup
	 */
	function destroy(): void {
		if (runtime) {
			runtime.destroy();
			runtime = null;
		}
	}

	// Auto-initialize on first use
	initialize();

	return {
		// Stores
		session,
		participants,
		connectionQuality,
		sessionState,
		isHost,
		isConnected,
		playerCount,
		spectatorCount,

		// Actions
		createSession,
		joinSession,
		leaveSession,
		sendInput,
		sendState,
		requestStateSync,
		onInput,
		onStateSync,
		getLatency,
		destroy
	};
}
