/**
 * Multiplayer Backend - Unified Export
 * 
 * This module provides backend functionality for multiplayer/realtime features.
 * It includes:
 * - StackLive multiplayer runtime
 * - Session management
 * - Peer connections
 * - Media streaming
 * - AR/VR integration
 * - Interaction hooks
 * 
 * All multiplayer backends use the StackLive WebRTC infrastructure.
 */

// Core multiplayer hooks
export { useStackLiveMultiplayer } from '$lib/multiplayer/useStackLiveMultiplayer';
export { useStackLiveInteraction } from '$lib/multiplayer/useStackLiveInteraction';
export { useStackLiveARVR } from '$lib/multiplayer/useStackLiveARVR';

// Multiplayer game implementations
export { createMultiplayerBlackjack } from '$lib/multiplayer/games/MultiplayerBlackjack';
export { createMultiplayerTicTacToe } from '$lib/multiplayer/games/MultiplayerTicTacToe';

// Core runtime and managers
export { StackLiveMultiplayerRuntime } from '$lib/multiplayer/StackLiveMultiplayerRuntime';
export { SessionManager } from '$lib/multiplayer/SessionManager';
export { PeerConnectionManager } from '$lib/multiplayer/PeerConnectionManager';
export { MediaStreamManager } from '$lib/multiplayer/MediaStreamManager';
export { InteractionManager } from '$lib/multiplayer/InteractionManager';

// Specialized managers
export { ARVRManager } from '$lib/multiplayer/ARVRManager';
export { AvatarManager } from '$lib/multiplayer/AvatarManager';
export { FilterManager } from '$lib/multiplayer/FilterManager';
export { GestureDetector } from '$lib/multiplayer/GestureDetector';
export { SpatialInteractionManager } from '$lib/multiplayer/SpatialInteractionManager';
export { GameStateSyncManager } from '$lib/multiplayer/GameStateSyncManager';
export { MatchmakingManager } from '$lib/multiplayer/MatchmakingManager';
export { LatencyManager } from '$lib/multiplayer/LatencyManager';
export { AbusePreventionManager } from '$lib/multiplayer/AbusePreventionManager';
export { URLJoinManager } from '$lib/multiplayer/URLJoinManager';

// Convex integration
export * from '$lib/multiplayer/convex';

// Types
export type * from '$lib/multiplayer/types';
export type { StackLiveMultiplayerConfig } from '$lib/multiplayer/useStackLiveMultiplayer';
export type { StackLiveInteractionConfig, StackLiveInteractionSession } from '$lib/multiplayer/useStackLiveInteraction';
export type { MediaStreamConfig } from '$lib/multiplayer/MediaStreamManager';
