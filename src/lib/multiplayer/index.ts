/**
 * StackLive Realtime Multiplayer Platform (SRMP)
 * Main entry point
 */

export { StackLiveMultiplayerRuntime } from './StackLiveMultiplayerRuntime';
export { useStackLiveMultiplayer } from './useStackLiveMultiplayer';
export { PeerConnectionManager } from './PeerConnectionManager';
export { SessionManager } from './SessionManager';
export { LatencyManager } from './LatencyManager';

export type {
	Session,
	SessionConfig,
	SessionState,
	Participant,
	ParticipantRole,
	ConnectionStatus,
	AuthorityMode,
	StackLiveMessage,
	SignalingMessage,
	SignalingMessageType,
	MultiplayerConfig,
	ConnectionQuality,
	LifecycleEvent,
	LifecycleEventType,
	User,
	RTCConfig
} from './types';
