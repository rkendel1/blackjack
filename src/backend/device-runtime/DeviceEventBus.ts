/**
 * Device Event Bus
 * Pub/sub event system for device capability events
 */

import type { CapabilityName, DeviceEventData } from './types';

export type DeviceEventType =
	| 'capability.activated'
	| 'capability.deactivated'
	| 'capability.data'
	| 'capability.error'
	| 'permission.granted'
	| 'permission.denied'
	| 'proximity.enter'
	| 'proximity.exit'
	| 'motion.change'
	| 'camera.start'
	| 'camera.stop'
	| 'microphone.start'
	| 'microphone.stop';

export type EventHandler = (data: unknown) => void;

export class DeviceEventBus {
	private handlers: Map<DeviceEventType | string, EventHandler[]>;
	private debug: boolean;

	constructor(debug: boolean = false) {
		this.handlers = new Map();
		this.debug = debug;
	}

	/**
	 * Subscribe to an event
	 */
	on(event: DeviceEventType | string, handler: EventHandler): () => void {
		if (!this.handlers.has(event)) {
			this.handlers.set(event, []);
		}
		this.handlers.get(event)!.push(handler);
		this.log(`Subscribed to ${event}`);

		// Return unsubscribe function
		return () => this.off(event, handler);
	}

	/**
	 * Subscribe to an event once
	 */
	once(event: DeviceEventType | string, handler: EventHandler): void {
		const onceHandler: EventHandler = (data) => {
			handler(data);
			this.off(event, onceHandler);
		};
		this.on(event, onceHandler);
	}

	/**
	 * Unsubscribe from an event
	 */
	off(event: DeviceEventType | string, handler: EventHandler): void {
		const handlers = this.handlers.get(event);
		if (!handlers) return;

		const index = handlers.indexOf(handler);
		if (index !== -1) {
			handlers.splice(index, 1);
			this.log(`Unsubscribed from ${event}`);
		}

		if (handlers.length === 0) {
			this.handlers.delete(event);
		}
	}

	/**
	 * Emit an event
	 */
	emit(event: DeviceEventType | string, data?: unknown): void {
		const handlers = this.handlers.get(event);
		if (!handlers || handlers.length === 0) {
			this.log(`No handlers for ${event}`);
			return;
		}

		this.log(`Emitting ${event} to ${handlers.length} handlers`, data);
		handlers.forEach(handler => {
			try {
				handler(data);
			} catch (error) {
				console.error(`Error in event handler for ${event}:`, error);
			}
		});
	}

	/**
	 * Emit a capability event
	 */
	emitCapabilityEvent(capability: CapabilityName, event: string, data: unknown): void {
		const eventData: DeviceEventData = {
			capability,
			event,
			data,
			timestamp: Date.now()
		};

		// Emit specific capability event
		this.emit(`${capability}.${event}`, eventData);

		// Emit general capability data event
		this.emit('capability.data', eventData);
	}

	/**
	 * Clear all handlers
	 */
	clear(): void {
		this.handlers.clear();
		this.log('Cleared all event handlers');
	}

	/**
	 * Get event names with active handlers
	 */
	getActiveEvents(): string[] {
		return Array.from(this.handlers.keys());
	}

	/**
	 * Get handler count for an event
	 */
	getHandlerCount(event: DeviceEventType | string): number {
		return this.handlers.get(event)?.length || 0;
	}

	/**
	 * Log debug messages
	 */
	private log(...args: unknown[]): void {
		if (this.debug) {
			console.log('[DeviceEventBus]', ...args);
		}
	}

	/**
	 * Cleanup
	 */
	destroy(): void {
		this.clear();
	}
}
