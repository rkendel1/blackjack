/**
 * Device Capability Types
 * Defines all types for the device capability system
 */

export type CapabilityName =
	| 'camera'
	| 'microphone'
	| 'motion'
	| 'bluetooth'
	| 'nfc'
	| 'wallet'
	| 'location'
	| 'filesystem'
	| 'screen_capture'
	| 'biometrics'
	| 'proximity'
	| 'push_notifications'
	| 'nearby_devices'
	| 'spatial_audio';

export type SurfaceType = 'native-ios' | 'native-android' | 'web' | 'mini-app' | 'extension';

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unavailable';

export type PermissionScope = 'one-time' | 'session' | 'always' | 'embed-level' | 'host-level';

export interface CapabilityDefinition {
	name: CapabilityName;
	displayName: string;
	requiredPermissions: string[];
	supportedSurfaces: SurfaceType[];
	securityClassification: 'low' | 'medium' | 'high' | 'critical';
	canStream: boolean;
	crossSurfaceSync: boolean;
	description: string;
}

export interface PermissionRequest {
	capability: CapabilityName;
	scope: PermissionScope;
	reason?: string;
}

export interface PermissionGrant {
	capability: CapabilityName;
	status: PermissionStatus;
	scope: PermissionScope;
	expiresAt?: number;
	grantedAt: number;
}

export interface DeviceCapabilityState {
	capability: CapabilityName;
	status: 'inactive' | 'active' | 'streaming' | 'error';
	error?: string;
	data?: unknown;
}

export interface NativeBridgeMessage {
	type: 'REQUEST_CAPABILITY' | 'CAPABILITY_GRANTED' | 'CAPABILITY_DENIED' | 'CAPABILITY_DATA' | 'CAPABILITY_ERROR';
	capability: CapabilityName;
	status?: PermissionStatus | 'active' | 'inactive';
	data?: unknown;
	error?: string;
	requestId?: string;
}

export interface DeviceEventData {
	capability: CapabilityName;
	event: string;
	data: unknown;
	timestamp: number;
}
