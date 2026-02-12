/**
 * StackLive Realtime Multiplayer Platform (SRMP)
 * Core type definitions for the multiplayer runtime
 */

// Session lifecycle states
export type SessionState =
	| 'IDLE'
	| 'CREATING'
	| 'WAITING_FOR_PLAYERS'
	| 'CONNECTING'
	| 'SYNCING'
	| 'IN_GAME'
	| 'PAUSED'
	| 'RECONNECTING'
	| 'ENDED';

// Participant roles
export type ParticipantRole = 'host' | 'player' | 'spectator';

// Connection status
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// Authority modes
export type AuthorityMode = 'host-authoritative' | 'deterministic-lockstep' | 'mesh';

// Message types for data channel protocol
export type StackLiveMessage =
	| { type: 'input'; frame: number; payload: unknown }
	| { type: 'state'; payload: unknown }
	| { type: 'sync-request' }
	| { type: 'sync-response'; payload: unknown }
	| { type: 'presence'; user: User }
	| { type: 'ping'; ts: number }
	| { type: 'pong'; ts: number }
	| { type: 'lobby-update'; players: Participant[] };

// User information
export interface User {
	id: string;
	name: string;
	avatar?: string;
}

// Participant in a session
export interface Participant {
	id: string;
	userId: string;
	role: ParticipantRole;
	connectionStatus: ConnectionStatus;
	latency?: number;
	user?: User;
}

// Session configuration
export interface SessionConfig {
	gameId: string;
	mode: AuthorityMode;
	maxPlayers: number;
	allowSpectators: boolean;
	visibility: 'public' | 'private';
	matchmaking?: boolean;
	screenShare?: boolean;
}

// Session metadata
export interface Session {
	id: string;
	gameId: string;
	hostId: string;
	mode: AuthorityMode;
	status: SessionState;
	config: SessionConfig;
	participants: Participant[];
	createdAt: number;
	expiresAt?: number;
}

// Signaling message types
export type SignalingMessageType = 'offer' | 'answer' | 'candidate';

export interface SignalingMessage {
	sessionId: string;
	from: string;
	to: string;
	type: SignalingMessageType;
	payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

// Multiplayer configuration
export interface MultiplayerConfig {
	gameId: string;
	mode?: AuthorityMode;
	matchmaking?: boolean;
	spectators?: boolean;
	screenShare?: boolean;
	maxPlayers?: number;
	debug?: boolean;
}

// Connection quality metrics
export interface ConnectionQuality {
	latency: number;
	jitter: number;
	packetLoss: number;
	quality: 'excellent' | 'good' | 'fair' | 'poor';
}

// Lifecycle event types
export type LifecycleEventType =
	| 'playerJoined'
	| 'playerLeft'
	| 'connectionLost'
	| 'reconnected'
	| 'gameStart'
	| 'gameEnd'
	| 'stateChanged';

export interface LifecycleEvent {
	type: LifecycleEventType;
	data?: unknown;
	timestamp: number;
}

// WebRTC configuration
export interface RTCConfig {
	iceServers: RTCIceServer[];
}
