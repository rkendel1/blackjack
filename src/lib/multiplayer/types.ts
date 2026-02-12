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

// Session types for realtime interactions
export type SessionType = 'game' | 'class' | 'quiz' | 'poll' | 'dashboard' | 'collaborative';

// Participant roles
export type ParticipantRole = 'host' | 'player' | 'spectator' | 'viewer' | 'presenter';

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
	| { type: 'lobby-update'; players: Participant[] }
	| { type: 'interaction'; interactionType: InteractionType; payload: unknown; fromUserId: string }
	| { type: 'poll'; payload: PollMessage }
	| { type: 'quiz'; payload: QuizMessage }
	| { type: 'reaction'; payload: string }
	| { type: 'snap'; payload: SnapMessage }
	| { type: 'videoFrame'; payload: MediaStreamTrack }
	| { type: 'audioFrame'; payload: MediaStreamTrack }
	| { type: 'avatar'; payload: AvatarMessage }
	| { type: 'filter'; payload: FilterMessage }
	| { type: 'gesture'; payload: GestureMessage }
	| { type: 'spatial'; payload: SpatialMessage };

// Interaction types for realtime embed interactions
export type InteractionType = 'poll' | 'quiz' | 'reaction' | 'snap' | 'input' | 'vote' | 'answer' | 'chat' | 'media' | 'pollResponse' | 'avatar' | 'filter' | 'gesture' | 'spatial';

// Poll message structure
export interface PollMessage {
	id: string;
	question: string;
	options: string[];
	allowMultiple?: boolean;
	expiresAt?: number;
}

// Poll response structure
export interface PollResponse {
	pollId: string;
	userId: string;
	answers: number[]; // indices of selected options
	timestamp: number;
}

// Quiz message structure
export interface QuizMessage {
	id: string;
	question: string;
	options: string[];
	correctAnswer?: number; // index of correct answer (only for host)
	timeLimit?: number;
	points?: number;
}

// Quiz response structure
export interface QuizResponse {
	quizId: string;
	userId: string;
	answer: number; // index of selected option
	timestamp: number;
	timeElapsed?: number;
}

// Snap message (collaborative interaction)
export interface SnapMessage {
	id: string;
	type: 'photo' | 'drawing' | 'annotation';
	data: string; // base64 or data URL
	userId: string;
	timestamp: number;
}

// Chat message structure
export interface ChatMessage {
	id: string;
	sessionId: string;
	fromUserId: string;
	payload: string; // text content
	timestamp: number;
}

// Media message structure
export interface MediaMessage {
	id: string;
	sessionId: string;
	fromUserId: string;
	payload: {
		caption?: string;
		[key: string]: unknown;
	};
	mediaUrl: string;
	mediaType: string; // MIME type, e.g., "image/jpeg", "video/mp4"
	timestamp: number;
}

// Contact information
export interface Contact {
	userId: string;
	name: string;
	avatarUrl?: string;
	online: boolean;
	lastActive: number;
}

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
	gameId?: string; // Optional for non-game embeds
	embedId?: string; // Unique identifier for the embed
	type?: SessionType; // Type of session (game, class, quiz, poll, etc.)
	mode: AuthorityMode;
	maxPlayers: number;
	allowSpectators: boolean;
	visibility: 'public' | 'private';
	matchmaking?: boolean;
	screenShare?: boolean;
	video?: boolean; // Enable video streaming
	audio?: boolean; // Enable audio streaming
}

// Session metadata
export interface Session {
	id: string;
	gameId?: string; // Optional for non-game embeds
	embedId?: string; // Unique identifier for the embed
	type?: SessionType; // Type of session
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
	gameId?: string; // Optional for non-game embeds
	embedId?: string; // Unique identifier for the embed
	type?: SessionType; // Type of session
	mode?: AuthorityMode;
	matchmaking?: boolean;
	spectators?: boolean;
	screenShare?: boolean;
	video?: boolean; // Enable video streaming
	audio?: boolean; // Enable audio streaming
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

// AR/VR Support Types

// Avatar message structure
export interface AvatarMessage {
	id: string;
	userId: string;
	sessionId?: string;
	avatarModel: string; // URL to glTF or USDZ file
	customizations: {
		hair?: string;
		clothing?: string;
		accessories?: string[];
		expressions?: Record<string, number>; // expression name -> intensity (0-1)
		skinTone?: string;
		bodyType?: string;
	};
	transform?: {
		position: [number, number, number];
		rotation: [number, number, number, number]; // quaternion
		scale: [number, number, number];
	};
	timestamp: number;
}

// Filter types for AR effects
export type FilterType = 'face' | 'body' | 'environment' | 'object';
export type FilterCategory = 'beauty' | 'fun' | 'artistic' | 'seasonal' | 'brand';

// Filter message structure
export interface FilterMessage {
	id: string;
	userId: string;
	sessionId?: string;
	filterType: FilterType;
	filterCategory?: FilterCategory;
	filterName: string;
	filterUrl?: string; // URL to filter asset
	parameters?: Record<string, unknown>; // filter-specific params
	intensity?: number; // 0-1
	enabled: boolean;
	timestamp: number;
}

// Gesture detection data
export interface GestureMessage {
	id: string;
	userId: string;
	sessionId?: string;
	gestureType: 'hand' | 'face' | 'body' | 'pose';
	landmarks?: Array<{
		x: number;
		y: number;
		z?: number;
		visibility?: number;
	}>;
	gesture?: string; // recognized gesture name (e.g., "thumbsUp", "wave", "smile")
	confidence?: number; // 0-1
	timestamp: number;
}

// Spatial interaction data
export interface SpatialMessage {
	id: string;
	userId: string;
	sessionId?: string;
	interactionType: 'place' | 'move' | 'rotate' | 'scale' | 'grab' | 'point' | 'draw';
	objectId?: string; // ID of object being interacted with
	position?: [number, number, number];
	rotation?: [number, number, number, number]; // quaternion
	scale?: [number, number, number];
	rayOrigin?: [number, number, number];
	rayDirection?: [number, number, number];
	drawPath?: Array<[number, number, number]>;
	timestamp: number;
}

// WebXR session configuration
export interface XRSessionConfig {
	mode: 'immersive-vr' | 'immersive-ar' | 'inline';
	requiredFeatures?: string[];
	optionalFeatures?: string[];
	domOverlay?: Element;
}

// AR/VR session state
export interface ARVRSessionState {
	active: boolean;
	mode?: 'ar' | 'vr';
	xrSession?: XRSession;
	avatarEnabled: boolean;
	filtersEnabled: boolean;
	spatialEnabled: boolean;
	gestureDetectionEnabled: boolean;
}

// Avatar customization options
export interface AvatarCustomization {
	hair?: {
		style: string;
		color: string;
	};
	clothing?: {
		top: string;
		bottom: string;
		outfit?: string;
	};
	accessories?: Array<{
		type: string;
		id: string;
		position?: string;
	}>;
	expressions?: {
		smile?: number;
		surprised?: number;
		angry?: number;
		sad?: number;
		[key: string]: number | undefined;
	};
	skinTone?: string;
	bodyType?: 'slim' | 'average' | 'athletic' | 'heavy';
}

// Filter preset
export interface FilterPreset {
	id: string;
	name: string;
	type: FilterType;
	category: FilterCategory;
	thumbnailUrl?: string;
	assetUrl?: string;
	parameters?: Record<string, unknown>;
	requiresCamera?: boolean;
	deviceCompatibility?: string[];
}
