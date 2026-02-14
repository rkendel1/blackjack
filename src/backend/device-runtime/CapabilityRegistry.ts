/**
 * Capability Registry
 * Defines all supported device capabilities and their properties
 */

import type { CapabilityDefinition, CapabilityName } from './types';

export const CAPABILITIES: Record<CapabilityName, CapabilityDefinition> = {
	camera: {
		name: 'camera',
		displayName: 'Camera',
		requiredPermissions: ['camera'],
		supportedSurfaces: ['native-ios', 'native-android', 'web', 'mini-app'],
		securityClassification: 'high',
		canStream: true,
		crossSurfaceSync: true,
		description: 'Access device camera for photo/video capture and streaming'
	},
	microphone: {
		name: 'microphone',
		displayName: 'Microphone',
		requiredPermissions: ['microphone'],
		supportedSurfaces: ['native-ios', 'native-android', 'web', 'mini-app'],
		securityClassification: 'high',
		canStream: true,
		crossSurfaceSync: true,
		description: 'Access device microphone for audio recording and streaming'
	},
	motion: {
		name: 'motion',
		displayName: 'Motion Sensors',
		requiredPermissions: ['motion'],
		supportedSurfaces: ['native-ios', 'native-android', 'web'],
		securityClassification: 'medium',
		canStream: true,
		crossSurfaceSync: true,
		description: 'Access accelerometer, gyroscope, and motion sensors'
	},
	bluetooth: {
		name: 'bluetooth',
		displayName: 'Bluetooth',
		requiredPermissions: ['bluetooth'],
		supportedSurfaces: ['native-ios', 'native-android', 'web'],
		securityClassification: 'high',
		canStream: true,
		crossSurfaceSync: false,
		description: 'Access Bluetooth LE for device scanning and connection'
	},
	nfc: {
		name: 'nfc',
		displayName: 'NFC',
		requiredPermissions: ['nfc'],
		supportedSurfaces: ['native-ios', 'native-android', 'web'],
		securityClassification: 'high',
		canStream: false,
		crossSurfaceSync: false,
		description: 'Access NFC for contactless communication'
	},
	wallet: {
		name: 'wallet',
		displayName: 'Wallet',
		requiredPermissions: ['payment'],
		supportedSurfaces: ['native-ios', 'native-android', 'web'],
		securityClassification: 'critical',
		canStream: false,
		crossSurfaceSync: false,
		description: 'Access Apple Pay, Google Pay, and Payment Request API'
	},
	location: {
		name: 'location',
		displayName: 'Location',
		requiredPermissions: ['geolocation'],
		supportedSurfaces: ['native-ios', 'native-android', 'web', 'mini-app'],
		securityClassification: 'high',
		canStream: true,
		crossSurfaceSync: true,
		description: 'Access GPS and location services'
	},
	filesystem: {
		name: 'filesystem',
		displayName: 'File System',
		requiredPermissions: ['filesystem'],
		supportedSurfaces: ['native-ios', 'native-android', 'web'],
		securityClassification: 'medium',
		canStream: false,
		crossSurfaceSync: false,
		description: 'Access device file system for reading/writing files'
	},
	screen_capture: {
		name: 'screen_capture',
		displayName: 'Screen Capture',
		requiredPermissions: ['display-capture'],
		supportedSurfaces: ['web', 'extension'],
		securityClassification: 'critical',
		canStream: true,
		crossSurfaceSync: true,
		description: 'Capture screen content for sharing or recording'
	},
	biometrics: {
		name: 'biometrics',
		displayName: 'Biometrics',
		requiredPermissions: ['biometric'],
		supportedSurfaces: ['native-ios', 'native-android', 'web'],
		securityClassification: 'critical',
		canStream: false,
		crossSurfaceSync: false,
		description: 'Access biometric authentication (Face ID, Touch ID, fingerprint)'
	},
	proximity: {
		name: 'proximity',
		displayName: 'Proximity',
		requiredPermissions: ['bluetooth', 'location'],
		supportedSurfaces: ['native-ios', 'native-android'],
		securityClassification: 'medium',
		canStream: true,
		crossSurfaceSync: true,
		description: 'Detect nearby devices and beacon proximity'
	},
	push_notifications: {
		name: 'push_notifications',
		displayName: 'Push Notifications',
		requiredPermissions: ['notifications'],
		supportedSurfaces: ['native-ios', 'native-android', 'web'],
		securityClassification: 'medium',
		canStream: false,
		crossSurfaceSync: false,
		description: 'Send push notifications to device'
	},
	nearby_devices: {
		name: 'nearby_devices',
		displayName: 'Nearby Devices',
		requiredPermissions: ['bluetooth', 'location'],
		supportedSurfaces: ['native-ios', 'native-android'],
		securityClassification: 'high',
		canStream: true,
		crossSurfaceSync: true,
		description: 'Discover and connect to nearby devices'
	},
	spatial_audio: {
		name: 'spatial_audio',
		displayName: 'Spatial Audio',
		requiredPermissions: ['microphone', 'motion'],
		supportedSurfaces: ['native-ios', 'native-android', 'web'],
		securityClassification: 'medium',
		canStream: true,
		crossSurfaceSync: true,
		description: 'Enable spatial audio processing and playback'
	}
};

export class CapabilityRegistry {
	private capabilities: Map<CapabilityName, CapabilityDefinition>;

	constructor() {
		this.capabilities = new Map(Object.entries(CAPABILITIES) as Array<[CapabilityName, CapabilityDefinition]>);
	}

	get(name: CapabilityName): CapabilityDefinition | undefined {
		return this.capabilities.get(name);
	}

	has(name: CapabilityName): boolean {
		return this.capabilities.has(name);
	}

	getAll(): CapabilityDefinition[] {
		return Array.from(this.capabilities.values());
	}

	isSupported(name: CapabilityName, surface: string): boolean {
		const capability = this.capabilities.get(name);
		if (!capability) return false;
		return capability.supportedSurfaces.includes(surface as any);
	}

	getBySecurityLevel(level: 'low' | 'medium' | 'high' | 'critical'): CapabilityDefinition[] {
		return this.getAll().filter(c => c.securityClassification === level);
	}

	getStreamable(): CapabilityDefinition[] {
		return this.getAll().filter(c => c.canStream);
	}

	getSyncable(): CapabilityDefinition[] {
		return this.getAll().filter(c => c.crossSurfaceSync);
	}
}
