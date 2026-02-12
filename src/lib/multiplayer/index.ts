/**
 * StackLive Realtime Multiplayer Platform (SRMP)
 * Main entry point
 */

export { StackLiveMultiplayerRuntime } from './StackLiveMultiplayerRuntime';
export { useStackLiveMultiplayer } from './useStackLiveMultiplayer';
export { PeerConnectionManager } from './PeerConnectionManager';
export { SessionManager } from './SessionManager';
export { LatencyManager } from './LatencyManager';
export { MatchmakingManager } from './MatchmakingManager';
export { AbusePreventionManager } from './AbusePreventionManager';
export { URLJoinManager } from './URLJoinManager';
export { GameStateSyncManager, GameSyncMessageAdapter } from './GameStateSyncManager';
export { MockSignalingAdapter, ConvexSignalingAdapter } from './SignalingAdapter';

// Game integrations
export { createMultiplayerBlackjack } from './games/MultiplayerBlackjack';

// Convex integration
export * as convex from './convex/client';

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
