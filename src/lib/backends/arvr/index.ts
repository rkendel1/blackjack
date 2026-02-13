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

export { useStackLiveARVR } from '$lib/multiplayer/useStackLiveARVR';
export type { ARVRConfig, ARVRStores, ARVRActions } from '$lib/multiplayer/useStackLiveARVR';

export { ARVRManager } from '$lib/multiplayer/ARVRManager';
export { AvatarManager } from '$lib/multiplayer/AvatarManager';
export { FilterManager } from '$lib/multiplayer/FilterManager';
export { GestureDetector } from '$lib/multiplayer/GestureDetector';
export { SpatialInteractionManager } from '$lib/multiplayer/SpatialInteractionManager';
