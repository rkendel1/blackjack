/**
 * useStackLiveDevice
 * Svelte store adapter for device capabilities
 */

import { writable, derived, get } from 'svelte/store';
import { DeviceCapabilityManager, type DeviceCapabilityManagerConfig } from './DeviceCapabilityManager';
import type { CapabilityName, DeviceCapabilityState, PermissionStatus } from './types';

export interface DeviceCapability {
	start: () => Promise<DeviceCapabilityState>;
	stop: () => Promise<void>;
	isActive: () => boolean;
	isSupported: () => boolean;
	hasPermission: () => boolean;
	subscribe: (handler: (data: unknown) => void) => () => void;
}

export function useStackLiveDevice(config: DeviceCapabilityManagerConfig = {}) {
	let manager: DeviceCapabilityManager | null = null;

	// Core stores
	const capabilities = writable<CapabilityName[]>([]);
	const activeCapabilities = writable<CapabilityName[]>([]);
	const surface = writable<string>('web');
	const error = writable<string | null>(null);

	// Derived stores
	const hasActiveCapabilities = derived(activeCapabilities, ($active) => $active.length > 0);
	const capabilityCount = derived(activeCapabilities, ($active) => $active.length);

	/**
	 * Initialize the manager
	 */
	function initialize(): void {
		if (manager) return;

		manager = new DeviceCapabilityManager(config);
		
		// Update stores
		surface.set(manager.getSurface());
		capabilities.set(manager.getSupportedCapabilities());

		// Subscribe to capability events
		manager.subscribe('capability.activated', (data: any) => {
			activeCapabilities.set(manager!.getActiveCapabilities());
		});

		manager.subscribe('capability.deactivated', (data: any) => {
			activeCapabilities.set(manager!.getActiveCapabilities());
		});

		manager.subscribe('capability.error', (data: any) => {
			error.set(data.error || 'Unknown error');
		});
	}

	/**
	 * Create capability interface
	 */
	function createCapabilityInterface(capability: CapabilityName): DeviceCapability {
		return {
			start: async () => {
				if (!manager) initialize();
				try {
					error.set(null);
					return await manager!.request(capability);
				} catch (err) {
					const errorMsg = err instanceof Error ? err.message : 'Unknown error';
					error.set(errorMsg);
					throw err;
				}
			},

			stop: async () => {
				if (!manager) return;
				try {
					await manager.deactivate(capability);
					error.set(null);
				} catch (err) {
					const errorMsg = err instanceof Error ? err.message : 'Unknown error';
					error.set(errorMsg);
				}
			},

			isActive: () => {
				if (!manager) return false;
				return manager.isActive(capability);
			},

			isSupported: () => {
				if (!manager) initialize();
				return manager!.isSupported(capability);
			},

			hasPermission: () => {
				if (!manager) return false;
				return manager.isPermissionGranted(capability);
			},

			subscribe: (handler: (data: unknown) => void) => {
				if (!manager) initialize();
				return manager!.subscribe(`${capability}.data`, handler);
			}
		};
	}

	// Initialize on first use
	initialize();

	return {
		// Stores
		capabilities,
		activeCapabilities,
		surface,
		error,
		hasActiveCapabilities,
		capabilityCount,

		// Capability interfaces
		camera: createCapabilityInterface('camera'),
		microphone: createCapabilityInterface('microphone'),
		motion: createCapabilityInterface('motion'),
		bluetooth: createCapabilityInterface('bluetooth'),
		nfc: createCapabilityInterface('nfc'),
		wallet: createCapabilityInterface('wallet'),
		location: createCapabilityInterface('location'),
		filesystem: createCapabilityInterface('filesystem'),
		screen: createCapabilityInterface('screen_capture'),
		biometrics: createCapabilityInterface('biometrics'),
		proximity: createCapabilityInterface('proximity'),
		notifications: createCapabilityInterface('push_notifications'),
		nearbyDevices: createCapabilityInterface('nearby_devices'),
		spatialAudio: createCapabilityInterface('spatial_audio'),

		// General methods
		getCapability: (name: CapabilityName) => {
			if (!manager) return undefined;
			return manager.getCapability(name);
		},

		isSupported: (name: CapabilityName) => {
			if (!manager) initialize();
			return manager!.isSupported(name);
		},

		revokePermission: (name: CapabilityName) => {
			if (!manager) return;
			manager.revokePermission(name);
		},

		subscribe: (event: string, handler: (data: unknown) => void) => {
			if (!manager) initialize();
			return manager!.subscribe(event, handler);
		},

		destroy: () => {
			if (manager) {
				manager.destroy();
				manager = null;
			}
		}
	};
}
