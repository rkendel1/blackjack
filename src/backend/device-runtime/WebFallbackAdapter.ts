/**
 * Web Fallback Adapter
 * Uses browser APIs for device capabilities
 */

import type { CapabilityName, DeviceCapabilityState } from './types';
import { DeviceEventBus } from './DeviceEventBus';

export class WebFallbackAdapter {
	private eventBus: DeviceEventBus;
	private activeStreams: Map<CapabilityName, MediaStream>;
	private debug: boolean;

	constructor(eventBus: DeviceEventBus, debug: boolean = false) {
		this.eventBus = eventBus;
		this.activeStreams = new Map();
		this.debug = debug;
	}

	/**
	 * Activate a capability
	 */
	async activate(capability: CapabilityName): Promise<DeviceCapabilityState> {
		this.log(`Activating ${capability}`);

		try {
			switch (capability) {
				case 'camera':
					return await this.activateCamera();
				case 'microphone':
					return await this.activateMicrophone();
				case 'motion':
					return await this.activateMotion();
				case 'bluetooth':
					return await this.activateBluetooth();
				case 'location':
					return await this.activateLocation();
				case 'screen_capture':
					return await this.activateScreenCapture();
				case 'wallet':
					return this.checkWalletSupport();
				case 'push_notifications':
					return await this.activateNotifications();
				default:
					return {
						capability,
						status: 'error',
						error: `Capability ${capability} not supported in web fallback`
					};
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unknown error';
			this.log(`Error activating ${capability}:`, error);
			return {
				capability,
				status: 'error',
				error: errorMsg
			};
		}
	}

	/**
	 * Deactivate a capability
	 */
	async deactivate(capability: CapabilityName): Promise<void> {
		this.log(`Deactivating ${capability}`);

		// Stop any active media streams
		const stream = this.activeStreams.get(capability);
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
			this.activeStreams.delete(capability);
		}

		this.eventBus.emit('capability.deactivated', { capability });
	}

	/**
	 * Get capability state
	 */
	getState(capability: CapabilityName): DeviceCapabilityState {
		const stream = this.activeStreams.get(capability);
		return {
			capability,
			status: stream ? 'streaming' : 'inactive'
		};
	}

	/**
	 * Check if capability is supported
	 */
	isSupported(capability: CapabilityName): boolean {
		if (typeof navigator === 'undefined') return false;

		switch (capability) {
			case 'camera':
			case 'microphone':
				return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
			case 'motion':
				return typeof DeviceMotionEvent !== 'undefined';
			case 'bluetooth':
				return 'bluetooth' in navigator;
			case 'location':
				return 'geolocation' in navigator;
			case 'screen_capture':
				return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
			case 'wallet':
				return typeof PaymentRequest !== 'undefined';
			case 'push_notifications':
				return 'Notification' in window;
			case 'nfc':
				return 'NDEFReader' in window;
			default:
				return false;
		}
	}

	// Capability-specific implementations

	private async activateCamera(): Promise<DeviceCapabilityState> {
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			throw new Error('Camera not supported');
		}

		const stream = await navigator.mediaDevices.getUserMedia({ video: true });
		this.activeStreams.set('camera', stream);
		this.eventBus.emit('camera.start', { stream });

		return {
			capability: 'camera',
			status: 'streaming',
			data: { stream }
		};
	}

	private async activateMicrophone(): Promise<DeviceCapabilityState> {
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			throw new Error('Microphone not supported');
		}

		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		this.activeStreams.set('microphone', stream);
		this.eventBus.emit('microphone.start', { stream });

		return {
			capability: 'microphone',
			status: 'streaming',
			data: { stream }
		};
	}

	private async activateMotion(): Promise<DeviceCapabilityState> {
		if (typeof DeviceMotionEvent === 'undefined') {
			throw new Error('Motion sensors not supported');
		}

		// Request permission on iOS 13+
		if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
			const permission = await (DeviceMotionEvent as any).requestPermission();
			if (permission !== 'granted') {
				throw new Error('Motion permission denied');
			}
		}

		return {
			capability: 'motion',
			status: 'active',
			data: { supported: true }
		};
	}

	private async activateBluetooth(): Promise<DeviceCapabilityState> {
		if (!('bluetooth' in navigator)) {
			throw new Error('Bluetooth not supported');
		}

		return {
			capability: 'bluetooth',
			status: 'active',
			data: { supported: true }
		};
	}

	private async activateLocation(): Promise<DeviceCapabilityState> {
		if (!('geolocation' in navigator)) {
			throw new Error('Geolocation not supported');
		}

		return new Promise((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					resolve({
						capability: 'location',
						status: 'active',
						data: {
							latitude: position.coords.latitude,
							longitude: position.coords.longitude,
							accuracy: position.coords.accuracy
						}
					});
				},
				(error) => {
					reject(new Error(error.message));
				}
			);
		});
	}

	private async activateScreenCapture(): Promise<DeviceCapabilityState> {
		if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
			throw new Error('Screen capture not supported');
		}

		const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
		this.activeStreams.set('screen_capture', stream);

		return {
			capability: 'screen_capture',
			status: 'streaming',
			data: { stream }
		};
	}

	private checkWalletSupport(): DeviceCapabilityState {
		const supported = typeof PaymentRequest !== 'undefined';
		return {
			capability: 'wallet',
			status: supported ? 'active' : 'error',
			error: supported ? undefined : 'Payment Request API not supported',
			data: { supported }
		};
	}

	private async activateNotifications(): Promise<DeviceCapabilityState> {
		if (!('Notification' in window)) {
			throw new Error('Notifications not supported');
		}

		const permission = await Notification.requestPermission();
		if (permission !== 'granted') {
			throw new Error('Notification permission denied');
		}

		return {
			capability: 'push_notifications',
			status: 'active',
			data: { permission }
		};
	}

	/**
	 * Log debug messages
	 */
	private log(...args: unknown[]): void {
		if (this.debug) {
			console.log('[WebFallbackAdapter]', ...args);
		}
	}

	/**
	 * Cleanup
	 */
	destroy(): void {
		// Stop all active streams
		this.activeStreams.forEach((stream, capability) => {
			stream.getTracks().forEach(track => track.stop());
		});
		this.activeStreams.clear();
	}
}
