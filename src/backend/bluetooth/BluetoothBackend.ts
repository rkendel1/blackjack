/**
 * BluetoothBackend - Web Bluetooth API Backend Adapter
 * 
 * This backend provides a clean abstraction layer over the Web Bluetooth API
 * for scanning, connecting, and managing Bluetooth devices. It exposes:
 * 
 * - Device scanning and discovery
 * - Connection management (connect, disconnect, forget)
 * - Device status tracking
 * - Paired device persistence
 * - Event handling for device state changes
 * 
 * This follows the same pattern as other backends in the system,
 * providing stores for reactive state and actions for operations.
 */

import { writable, derived, type Writable, type Readable } from 'svelte/store';

export interface BluetoothDeviceInfo {
	id: string;
	name: string;
	connected: boolean;
	paired: boolean;
	gatt?: BluetoothRemoteGATTServer;
	device?: BluetoothDevice;
}

export interface BluetoothBackendConfig {
	embedId?: string;
	autoScan?: boolean;
	persistDevices?: boolean;
	debug?: boolean;
}

export interface BluetoothBackendStores {
	isEnabled: Writable<boolean>;
	isScanning: Writable<boolean>;
	availableDevices: Writable<BluetoothDeviceInfo[]>;
	connectedDevices: Writable<BluetoothDeviceInfo[]>;
	pairedDevices: Writable<BluetoothDeviceInfo[]>;
	error: Writable<string | null>;
	isSupported: Readable<boolean>;
}

export interface BluetoothBackendActions {
	enable: () => void;
	disable: () => void;
	scan: () => Promise<void>;
	stopScan: () => void;
	connect: (deviceId: string) => Promise<boolean>;
	disconnect: (deviceId: string) => Promise<void>;
	forget: (deviceId: string) => void;
	getDeviceInfo: (deviceId: string) => BluetoothDeviceInfo | null;
	on: (event: 'devicefound' | 'connected' | 'disconnected' | 'error', callback: (data: unknown) => void) => void;
	destroy: () => void;
}

export type BluetoothBackend = BluetoothBackendStores & BluetoothBackendActions;

/**
 * Create a Bluetooth backend using the Web Bluetooth API
 */
export function createBluetoothBackend(config: BluetoothBackendConfig = {}): BluetoothBackend {
	const {
		embedId = 'bluetooth-embed',
		autoScan = false,
		persistDevices = true,
		debug = false
	} = config;

	// Check if Web Bluetooth is supported
	const bluetoothSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

	// Create stores
	const isEnabled = writable<boolean>(false);
	const isScanning = writable<boolean>(false);
	const availableDevices = writable<BluetoothDeviceInfo[]>([]);
	const connectedDevices = writable<BluetoothDeviceInfo[]>([]);
	const pairedDevices = writable<BluetoothDeviceInfo[]>([]);
	const error = writable<string | null>(null);
	const isSupported = writable<boolean>(bluetoothSupported);

	// Event handlers
	const eventHandlers: Map<string, ((data: unknown) => void)[]> = new Map();

	// Device tracking
	const devices = new Map<string, BluetoothDeviceInfo>();
	const deviceListeners = new Map<string, (event: Event) => void>();

	// Load persisted devices
	if (persistDevices && typeof localStorage !== 'undefined') {
		try {
			const stored = localStorage.getItem(`${embedId}-paired-devices`);
			if (stored) {
				const pairedIds = JSON.parse(stored);
				pairedIds.forEach((id: string) => {
					devices.set(id, {
						id,
						name: 'Paired Device',
						connected: false,
						paired: true
					});
				});
				pairedDevices.set(Array.from(devices.values()).filter(d => d.paired));
			}
		} catch (e) {
			if (debug) console.error('Failed to load paired devices:', e);
		}
	}

	function log(...args: unknown[]) {
		if (debug) console.log('[BluetoothBackend]', ...args);
	}

	function emitEvent(event: string, data: unknown) {
		const handlers = eventHandlers.get(event) || [];
		handlers.forEach(handler => handler(data));
	}

	function updateDeviceStores() {
		const allDevices = Array.from(devices.values());
		availableDevices.set(allDevices);
		connectedDevices.set(allDevices.filter(d => d.connected));
		pairedDevices.set(allDevices.filter(d => d.paired));
	}

	function persistPairedDevices() {
		if (!persistDevices || typeof localStorage === 'undefined') return;
		
		try {
			const pairedIds = Array.from(devices.values())
				.filter(d => d.paired)
				.map(d => d.id);
			localStorage.setItem(`${embedId}-paired-devices`, JSON.stringify(pairedIds));
		} catch (e) {
			if (debug) console.error('Failed to persist paired devices:', e);
		}
	}

	async function scanForDevices() {
		if (!bluetoothSupported) {
			error.set('Web Bluetooth API is not supported in this browser');
			return;
		}

		try {
			isScanning.set(true);
			error.set(null);
			log('Requesting Bluetooth device...');

			// Note: requestDevice shows a browser picker dialog, not a background scan
			// This is a limitation of the Web Bluetooth API for security reasons
			const device = await navigator.bluetooth.requestDevice({
				acceptAllDevices: true,
				optionalServices: ['battery_service', 'device_information']
			});

			if (device) {
				const deviceInfo: BluetoothDeviceInfo = {
					id: device.id,
					name: device.name || 'Unknown Device',
					connected: false,
					paired: false,
					device
				};

				devices.set(device.id, deviceInfo);
				updateDeviceStores();
				emitEvent('devicefound', deviceInfo);
				log('Device found:', device.name);
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Failed to scan for devices';
			error.set(errorMsg);
			emitEvent('error', errorMsg);
			log('Scan error:', err);
		} finally {
			isScanning.set(false);
		}
	}

	async function connectToDevice(deviceId: string): Promise<boolean> {
		const deviceInfo = devices.get(deviceId);
		if (!deviceInfo || !deviceInfo.device) {
			error.set('Device not found');
			return false;
		}

		try {
			log('Connecting to device:', deviceInfo.name);
			const gatt = await deviceInfo.device.gatt?.connect();
			
			if (gatt) {
				deviceInfo.gatt = gatt;
				deviceInfo.connected = true;
				deviceInfo.paired = true;
				devices.set(deviceId, deviceInfo);
				updateDeviceStores();
				persistPairedDevices();
				emitEvent('connected', deviceInfo);
				log('Connected to device:', deviceInfo.name);

				// Listen for disconnection
				const disconnectListener = () => {
					deviceInfo.connected = false;
					devices.set(deviceId, deviceInfo);
					updateDeviceStores();
					emitEvent('disconnected', deviceInfo);
					log('Device disconnected:', deviceInfo.name);
				};
				deviceListeners.set(deviceId, disconnectListener);
				deviceInfo.device.addEventListener('gattserverdisconnected', disconnectListener);

				return true;
			}
			return false;
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Failed to connect to device';
			error.set(errorMsg);
			emitEvent('error', errorMsg);
			log('Connection error:', err);
			return false;
		}
	}

	async function disconnectFromDevice(deviceId: string): Promise<void> {
		const deviceInfo = devices.get(deviceId);
		if (!deviceInfo || !deviceInfo.gatt) {
			return;
		}

		try {
			log('Disconnecting from device:', deviceInfo.name);
			
			// Remove event listener before disconnecting
			const listener = deviceListeners.get(deviceId);
			if (listener && deviceInfo.device) {
				deviceInfo.device.removeEventListener('gattserverdisconnected', listener);
				deviceListeners.delete(deviceId);
			}
			
			deviceInfo.gatt.disconnect();
			deviceInfo.connected = false;
			devices.set(deviceId, deviceInfo);
			updateDeviceStores();
			emitEvent('disconnected', deviceInfo);
			log('Disconnected from device:', deviceInfo.name);
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Failed to disconnect from device';
			error.set(errorMsg);
			emitEvent('error', errorMsg);
			log('Disconnect error:', err);
		}
	}

	function forgetDevice(deviceId: string) {
		const deviceInfo = devices.get(deviceId);
		if (!deviceInfo) return;

		log('Forgetting device:', deviceInfo.name);
		
		// Disconnect if connected
		if (deviceInfo.connected && deviceInfo.gatt) {
			deviceInfo.gatt.disconnect();
		}

		// Remove disconnect listener
		const listener = deviceListeners.get(deviceId);
		if (listener && deviceInfo.device) {
			deviceInfo.device.removeEventListener('gattserverdisconnected', listener);
			deviceListeners.delete(deviceId);
		}

		devices.delete(deviceId);
		updateDeviceStores();
		persistPairedDevices();
		log('Device forgotten:', deviceInfo.name);
	}

	// Auto-scan on mount if enabled
	if (autoScan && bluetoothSupported) {
		log('Auto-scan enabled');
	}

	return {
		// Stores
		isEnabled,
		isScanning,
		availableDevices,
		connectedDevices,
		pairedDevices,
		error,
		isSupported,

		// Actions
		enable: () => {
			isEnabled.set(true);
			log('Bluetooth enabled');
		},

		disable: () => {
			isEnabled.set(false);
			// Disconnect all devices
			devices.forEach((device, id) => {
				if (device.connected) {
					disconnectFromDevice(id);
				}
			});
			log('Bluetooth disabled');
		},

		scan: scanForDevices,

		stopScan: () => {
			isScanning.set(false);
			log('Scan stopped');
		},

		connect: connectToDevice,

		disconnect: disconnectFromDevice,

		forget: forgetDevice,

		getDeviceInfo: (deviceId: string) => {
			return devices.get(deviceId) || null;
		},

		on: (event, callback) => {
			if (!eventHandlers.has(event)) {
				eventHandlers.set(event, []);
			}
			eventHandlers.get(event)!.push(callback);
		},

		destroy: () => {
			// Disconnect all devices and clean up listeners
			devices.forEach((device, id) => {
				if (device.connected) {
					disconnectFromDevice(id);
				}
				const listener = deviceListeners.get(id);
				if (listener && device.device) {
					device.device.removeEventListener('gattserverdisconnected', listener);
				}
			});
			devices.clear();
			deviceListeners.clear();
			eventHandlers.clear();
			log('Backend destroyed');
		}
	};
}
