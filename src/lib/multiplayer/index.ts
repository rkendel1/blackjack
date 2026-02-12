/**
 * StackLive Realtime Multiplayer Platform (SRMP)
 * Main entry point
 */

// Core runtime
export { StackLiveMultiplayerRuntime } from './StackLiveMultiplayerRuntime';
export { useStackLiveMultiplayer } from './useStackLiveMultiplayer';

// Realtime Interaction Runtime
export { useStackLiveInteraction } from './useStackLiveInteraction';
export type { StackLiveInteractionConfig, StackLiveInteractionSession } from './useStackLiveInteraction';

// Managers
export { PeerConnectionManager } from './PeerConnectionManager';
export { SessionManager } from './SessionManager';
export { LatencyManager } from './LatencyManager';
export { MatchmakingManager } from './MatchmakingManager';
export { AbusePreventionManager } from './AbusePreventionManager';
export { URLJoinManager } from './URLJoinManager';
export { GameStateSyncManager, GameSyncMessageAdapter } from './GameStateSyncManager';
export { InteractionManager } from './InteractionManager';
export { MediaStreamManager } from './MediaStreamManager';
export type { MediaStreamConfig } from './MediaStreamManager';

// Signaling
export { MockSignalingAdapter, ConvexSignalingAdapter } from './SignalingAdapter';

// Game integrations
export { createMultiplayerBlackjack } from './games/MultiplayerBlackjack';

// Convex integration
export * as convex from './convex/client';

export type {
	Session,
	SessionConfig,
	SessionState,
	SessionType,
	Participant,
	ParticipantRole,
	ConnectionStatus,
	AuthorityMode,
	StackLiveMessage,
	InteractionType,
	PollMessage,
	PollResponse,
	QuizMessage,
	QuizResponse,
	SnapMessage,
	SignalingMessage,
	SignalingMessageType,
	MultiplayerConfig,
	ConnectionQuality,
	LifecycleEvent,
	LifecycleEventType,
	User,
	RTCConfig
} from './types';
