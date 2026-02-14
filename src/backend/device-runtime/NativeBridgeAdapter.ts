/**
 * Native Bridge Adapter
 * Bridges with native iOS/Android apps via postMessage
 */

import type { CapabilityName, DeviceCapabilityState, NativeBridgeMessage } from './types';
import { DeviceEventBus } from './DeviceEventBus';

export class NativeBridgeAdapter {
	private eventBus: DeviceEventBus;
	private pendingRequests: Map<string, { resolve: (value: DeviceCapabilityState) => void; reject: (error: Error) => void }>;
	private requestIdCounter: number;
	private messageListener: ((event: MessageEvent) => void) | null;
	private debug: boolean;

	constructor(eventBus: DeviceEventBus, debug: boolean = false) {
		this.eventBus = eventBus;
		this.pendingRequests = new Map();
		this.requestIdCounter = 0;
		this.messageListener = null;
		this.debug = debug;
		this.setupMessageListener();
	}

	/**
	 * Check if native bridge is available
	 */
	isAvailable(): boolean {
		return typeof window !== 'undefined' && 'StackLiveNativeBridge' in window;
	}

	/**
	 * Activate a capability via native bridge
	 */
	async activate(capability: CapabilityName): Promise<DeviceCapabilityState> {
		if (!this.isAvailable()) {
			throw new Error('Native bridge not available');
		}

		this.log(`Requesting capability: ${capability}`);

		const requestId = this.generateRequestId();
		const message: NativeBridgeMessage = {
			type: 'REQUEST_CAPABILITY',
			capability,
			requestId
		};

		return new Promise((resolve, reject) => {
			// Store pending request
			this.pendingRequests.set(requestId, { resolve, reject });

			// Send message to native
			this.postMessage(message);

			// Set timeout
			setTimeout(() => {
				if (this.pendingRequests.has(requestId)) {
					this.pendingRequests.delete(requestId);
					reject(new Error(`Timeout waiting for capability ${capability}`));
				}
			}, 10000); // 10 second timeout
		});
	}

	/**
	 * Deactivate a capability
	 */
	async deactivate(capability: CapabilityName): Promise<void> {
		if (!this.isAvailable()) return;

		const message: NativeBridgeMessage = {
			type: 'CAPABILITY_GRANTED', // Reusing message type to signal deactivation
			capability,
			status: 'inactive'
		};

		this.postMessage(message);
		this.eventBus.emit('capability.deactivated', { capability });
	}

	/**
	 * Setup message listener for native responses
	 */
	private setupMessageListener(): void {
		if (typeof window === 'undefined') return;

		this.messageListener = (event: MessageEvent) => {
			// Only handle messages from native bridge
			if (!event.data || typeof event.data !== 'object') return;
			
			const message = event.data as NativeBridgeMessage;
			if (!message.type || !message.capability) return;

			this.handleNativeMessage(message);
		};

		window.addEventListener('message', this.messageListener);
	}

	/**
	 * Handle message from native bridge
	 */
	private handleNativeMessage(message: NativeBridgeMessage): void {
		this.log('Received native message:', message);

		const { type, capability, requestId, status, data, error } = message;

		switch (type) {
			case 'CAPABILITY_GRANTED':
				if (requestId && this.pendingRequests.has(requestId)) {
					const { resolve } = this.pendingRequests.get(requestId)!;
					this.pendingRequests.delete(requestId);
					resolve({
						capability,
						status: 'active',
						data
					});
				}
				this.eventBus.emit('capability.activated', { capability, data });
				this.eventBus.emit('permission.granted', { capability });
				break;

			case 'CAPABILITY_DENIED':
				if (requestId && this.pendingRequests.has(requestId)) {
					const { reject } = this.pendingRequests.get(requestId)!;
					this.pendingRequests.delete(requestId);
					reject(new Error(error || `Permission denied for ${capability}`));
				}
				this.eventBus.emit('permission.denied', { capability, error });
				break;

			case 'CAPABILITY_DATA':
				this.eventBus.emitCapabilityEvent(capability, 'data', data);
				break;

			case 'CAPABILITY_ERROR':
				if (requestId && this.pendingRequests.has(requestId)) {
					const { reject } = this.pendingRequests.get(requestId)!;
					this.pendingRequests.delete(requestId);
					reject(new Error(error || 'Unknown error'));
				}
				this.eventBus.emit('capability.error', { capability, error });
				break;
		}
	}

	/**
	 * Post message to native bridge
	 */
	private postMessage(message: NativeBridgeMessage): void {
		if (!this.isAvailable()) {
			this.log('Native bridge not available');
			return;
		}

		try {
			// Try WebView postMessage interface
			if ((window as any).StackLiveNativeBridge?.postMessage) {
				(window as any).StackLiveNativeBridge.postMessage(JSON.stringify(message));
			} 
			// Try React Native WebView interface
			else if ((window as any).ReactNativeWebView?.postMessage) {
				(window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
			}
			// Try WKWebView interface
			else if ((window as any).webkit?.messageHandlers?.StackLiveNativeBridge) {
				(window as any).webkit.messageHandlers.StackLiveNativeBridge.postMessage(message);
			}
			else {
				this.log('No native bridge interface found');
			}
		} catch (error) {
			this.log('Error posting message to native:', error);
		}
	}

	/**
	 * Generate unique request ID
	 */
	private generateRequestId(): string {
		return `req_${++this.requestIdCounter}_${Date.now()}`;
	}

	/**
	 * Log debug messages
	 */
	private log(...args: unknown[]): void {
		if (this.debug) {
			console.log('[NativeBridgeAdapter]', ...args);
		}
	}

	/**
	 * Cleanup
	 */
	destroy(): void {
		if (this.messageListener && typeof window !== 'undefined') {
			window.removeEventListener('message', this.messageListener);
			this.messageListener = null;
		}
		this.pendingRequests.clear();
	}
}
