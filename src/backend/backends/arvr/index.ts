/**
 * AR/VR Backend - Unified Export
 * 
 * This module provides backend functionality for AR/VR features.
 * It wraps the StackLive AR/VR multiplayer capabilities.
 * 
 * Features:
 * - Avatar management
 * - Gesture detection
 * - Spatial interactions
 * - AR filters
 * - 3D object placement
 */

export { useStackLiveARVR } from '../../multiplayer/useStackLiveARVR';
export type { ARVRConfig, ARVRStores, ARVRActions } from '../../multiplayer/useStackLiveARVR';

export { ARVRManager } from '../../multiplayer/ARVRManager';
export { AvatarManager } from '../../multiplayer/AvatarManager';
export { FilterManager } from '../../multiplayer/FilterManager';
export { GestureDetector } from '../../multiplayer/GestureDetector';
export { SpatialInteractionManager } from '../../multiplayer/SpatialInteractionManager';
