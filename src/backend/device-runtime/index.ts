/**
 * Device Runtime Module
 * Main exports for the device capability infrastructure
 */

export { DeviceCapabilityManager, type DeviceCapabilityManagerConfig } from './DeviceCapabilityManager';
export { CapabilityRegistry, CAPABILITIES } from './CapabilityRegistry';
export { PermissionManager } from './PermissionManager';
export { NativeBridgeAdapter } from './NativeBridgeAdapter';
export { WebFallbackAdapter } from './WebFallbackAdapter';
export { DeviceEventBus } from './DeviceEventBus';
export { useStackLiveDevice } from './useStackLiveDevice';
export type * from './types';
