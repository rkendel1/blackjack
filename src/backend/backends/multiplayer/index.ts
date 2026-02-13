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
export { useStackLiveMultiplayer } from '../../multiplayer/useStackLiveMultiplayer';
export { useStackLiveInteraction } from '../../multiplayer/useStackLiveInteraction';
export { useStackLiveARVR } from '../../multiplayer/useStackLiveARVR';

// Multiplayer game implementations
export { createMultiplayerBlackjack } from '../../multiplayer/games/MultiplayerBlackjack';
export { createMultiplayerTicTacToe } from '../../multiplayer/games/MultiplayerTicTacToe';

// Core runtime and managers
export { StackLiveMultiplayerRuntime } from '../../multiplayer/StackLiveMultiplayerRuntime';
export { SessionManager } from '../../multiplayer/SessionManager';
export { PeerConnectionManager } from '../../multiplayer/PeerConnectionManager';
export { MediaStreamManager } from '../../multiplayer/MediaStreamManager';
export { InteractionManager } from '../../multiplayer/InteractionManager';

// Specialized managers
export { ARVRManager } from '../../multiplayer/ARVRManager';
export { AvatarManager } from '../../multiplayer/AvatarManager';
export { FilterManager } from '../../multiplayer/FilterManager';
export { GestureDetector } from '../../multiplayer/GestureDetector';
export { SpatialInteractionManager } from '../../multiplayer/SpatialInteractionManager';
export { GameStateSyncManager } from '../../multiplayer/GameStateSyncManager';
export { MatchmakingManager } from '../../multiplayer/MatchmakingManager';
export { LatencyManager } from '../../multiplayer/LatencyManager';
export { AbusePreventionManager } from '../../multiplayer/AbusePreventionManager';
export { URLJoinManager } from '../../multiplayer/URLJoinManager';

// Convex integration
export * from '../../multiplayer/convex';

// Types
export type * from '../../multiplayer/types';
export type { StackLiveMultiplayerConfig } from '../../multiplayer/useStackLiveMultiplayer';
export type { StackLiveInteractionConfig, StackLiveInteractionSession } from '../../multiplayer/useStackLiveInteraction';
export type { MediaStreamConfig } from '../../multiplayer/MediaStreamManager';
