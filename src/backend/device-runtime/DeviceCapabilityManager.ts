/**
 * Device Capability Manager
 * Central orchestrator for device capabilities
 */

import { CapabilityRegistry } from './CapabilityRegistry';
import { PermissionManager } from './PermissionManager';
import { NativeBridgeAdapter } from './NativeBridgeAdapter';
import { WebFallbackAdapter } from './WebFallbackAdapter';
import { DeviceEventBus } from './DeviceEventBus';
import type { CapabilityName, DeviceCapabilityState, SurfaceType } from './types';

export interface DeviceCapabilityManagerConfig {
	embedId?: string;
	surface?: SurfaceType;
	preferNative?: boolean;
	debug?: boolean;
}

export class DeviceCapabilityManager {
	private registry: CapabilityRegistry;
	private permissions: PermissionManager;
	private nativeAdapter: NativeBridgeAdapter;
	private webAdapter: WebFallbackAdapter;
	private eventBus: DeviceEventBus;
	private config: Required<DeviceCapabilityManagerConfig>;
	private activeCapabilities: Set<CapabilityName>;

	constructor(config: DeviceCapabilityManagerConfig = {}) {
		this.config = {
			embedId: config.embedId || 'stacklive-device',
			surface: config.surface || this.detectSurface(),
			preferNative: config.preferNative !== false,
			debug: config.debug || false
		};

		this.registry = new CapabilityRegistry();
		this.permissions = new PermissionManager(this.config.embedId, this.config.debug);
		this.eventBus = new DeviceEventBus(this.config.debug);
		this.nativeAdapter = new NativeBridgeAdapter(this.eventBus, this.config.debug);
		this.webAdapter = new WebFallbackAdapter(this.eventBus, this.config.debug);
		this.activeCapabilities = new Set();

		this.log('Initialized on surface:', this.config.surface);
		this.log('Native bridge available:', this.nativeAdapter.isAvailable());
	}

	/**
	 * Request and activate a capability
	 */
	async request(capability: CapabilityName): Promise<DeviceCapabilityState> {
		this.log(`Requesting capability: ${capability}`);

		// Check if capability exists
		if (!this.registry.has(capability)) {
			throw new Error(`Unknown capability: ${capability}`);
		}

		// Check if capability is supported on current surface
		if (!this.registry.isSupported(capability, this.config.surface)) {
			throw new Error(`Capability ${capability} not supported on ${this.config.surface}`);
		}

		// Request permission
		await this.permissions.ensure(capability);

		// Activate via appropriate adapter
		const adapter = this.getAdapter();
		const state = await adapter.activate(capability);

		if (state.status === 'active' || state.status === 'streaming') {
			this.activeCapabilities.add(capability);
			this.eventBus.emit('capability.activated', { capability, state });
		}

		return state;
	}

	/**
	 * Deactivate a capability
	 */
	async deactivate(capability: CapabilityName): Promise<void> {
		this.log(`Deactivating capability: ${capability}`);

		const adapter = this.getAdapter();
		await adapter.deactivate(capability);

		this.activeCapabilities.delete(capability);
		this.eventBus.emit('capability.deactivated', { capability });
	}

	/**
	 * Get capability definition
	 */
	getCapability(capability: CapabilityName) {
		return this.registry.get(capability);
	}

	/**
	 * Check if capability is supported
	 */
	isSupported(capability: CapabilityName): boolean {
		if (!this.registry.has(capability)) return false;
		
		const adapter = this.getAdapter();
		
		// Check registry support
		if (!this.registry.isSupported(capability, this.config.surface)) {
			return false;
		}

		// Check adapter support
		if (adapter instanceof WebFallbackAdapter) {
			return adapter.isSupported(capability);
		}

		// Native adapter - assume supported if in registry
		return true;
	}

	/**
	 * Check if capability is active
	 */
	isActive(capability: CapabilityName): boolean {
		return this.activeCapabilities.has(capability);
	}

	/**
	 * Get all active capabilities
	 */
	getActiveCapabilities(): CapabilityName[] {
		return Array.from(this.activeCapabilities);
	}

	/**
	 * Get all supported capabilities for current surface
	 */
	getSupportedCapabilities(): CapabilityName[] {
		return this.registry
			.getAll()
			.filter(c => this.isSupported(c.name))
			.map(c => c.name);
	}

	/**
	 * Subscribe to capability events
	 */
	subscribe(event: string, handler: (data: unknown) => void): () => void {
		return this.eventBus.on(event, handler);
	}

	/**
	 * Get current surface type
	 */
	getSurface(): SurfaceType {
		return this.config.surface;
	}

	/**
	 * Check if permission is granted for capability
	 */
	isPermissionGranted(capability: CapabilityName): boolean {
		return this.permissions.isGranted(capability);
	}

	/**
	 * Revoke permission for capability
	 */
	revokePermission(capability: CapabilityName): void {
		this.permissions.revoke(capability);
		if (this.activeCapabilities.has(capability)) {
			this.deactivate(capability);
		}
	}

	/**
	 * Get appropriate adapter based on configuration and availability
	 */
	private getAdapter(): NativeBridgeAdapter | WebFallbackAdapter {
		if (this.config.preferNative && this.nativeAdapter.isAvailable()) {
			return this.nativeAdapter;
		}
		return this.webAdapter;
	}

	/**
	 * Detect current surface type
	 */
	private detectSurface(): SurfaceType {
		if (typeof window === 'undefined') return 'web';

		// Check for native bridge
		if ('StackLiveNativeBridge' in window) {
			// Try to detect iOS vs Android from user agent
			const ua = navigator.userAgent;
			if (/iPhone|iPad|iPod/.test(ua)) {
				return 'native-ios';
			}
			if (/Android/.test(ua)) {
				return 'native-android';
			}
			return 'web'; // Native bridge in web context
		}

		// Check for browser extension
		if ('chrome' in window && (window as any).chrome?.runtime) {
			return 'extension';
		}

		// Default to web
		return 'web';
	}

	/**
	 * Log debug messages
	 */
	private log(...args: unknown[]): void {
		if (this.config.debug) {
			console.log('[DeviceCapabilityManager]', ...args);
		}
	}

	/**
	 * Cleanup
	 */
	destroy(): void {
		// Deactivate all capabilities
		this.activeCapabilities.forEach(capability => {
			this.deactivate(capability);
		});

		this.nativeAdapter.destroy();
		this.webAdapter.destroy();
		this.permissions.destroy();
		this.eventBus.destroy();
		this.activeCapabilities.clear();

		this.log('Manager destroyed');
	}
}
