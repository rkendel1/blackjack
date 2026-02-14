/**
 * Device UI Store
 * Global state store for device control UI
 */

import { writable, derived } from 'svelte/store';
import type { CapabilityName, PermissionScope } from '../device-runtime/types';

export interface DevicePermissionRequest {
	capability: CapabilityName;
	embedId: string;
	reason?: string;
	scope?: PermissionScope;
	onApprove?: (scope: PermissionScope) => void;
	onDeny?: () => void;
}

export interface DeviceConnectionRequest {
	deviceId: string;
	deviceName: string;
	deviceType: string;
	capability: CapabilityName;
	embedId: string;
	onConnect?: () => void;
	onCancel?: () => void;
}

export interface ActiveCapability {
	capability: CapabilityName;
	embedId: string;
	status: 'active' | 'streaming';
	startedAt: number;
	metadata?: Record<string, unknown>;
}

export interface DeviceToastMessage {
	id: string;
	type: 'success' | 'error' | 'info' | 'warning';
	message: string;
	capability?: CapabilityName;
	duration?: number;
}

export interface DeviceUIState {
	permissionRequest: DevicePermissionRequest | null;
	connectionRequest: DeviceConnectionRequest | null;
	activeCapabilities: ActiveCapability[];
	toasts: DeviceToastMessage[];
	isPanelOpen: boolean;
}

function createDeviceUIStore() {
	const { subscribe, update, set } = writable<DeviceUIState>({
		permissionRequest: null,
		connectionRequest: null,
		activeCapabilities: [],
		toasts: [],
		isPanelOpen: false
	});

	return {
		subscribe,
		set,
		update,

		// Permission request methods
		requestPermission: (request: DevicePermissionRequest) => {
			update(state => ({
				...state,
				permissionRequest: request
			}));
		},

		approvePermission: (scope: PermissionScope = 'session') => {
			update(state => {
				if (state.permissionRequest?.onApprove) {
					state.permissionRequest.onApprove(scope);
				}
				return {
					...state,
					permissionRequest: null
				};
			});
		},

		denyPermission: () => {
			update(state => {
				if (state.permissionRequest?.onDeny) {
					state.permissionRequest.onDeny();
				}
				return {
					...state,
					permissionRequest: null
				};
			});
		},

		// Connection request methods
		requestConnection: (request: DeviceConnectionRequest) => {
			update(state => ({
				...state,
				connectionRequest: request
			}));
		},

		approveConnection: () => {
			update(state => {
				if (state.connectionRequest?.onConnect) {
					state.connectionRequest.onConnect();
				}
				return {
					...state,
					connectionRequest: null
				};
			});
		},

		cancelConnection: () => {
			update(state => {
				if (state.connectionRequest?.onCancel) {
					state.connectionRequest.onCancel();
				}
				return {
					...state,
					connectionRequest: null
				};
			});
		},

		// Active capabilities methods
		activateCapability: (capability: ActiveCapability) => {
			update(state => ({
				...state,
				activeCapabilities: [
					...state.activeCapabilities.filter(c => 
						!(c.capability === capability.capability && c.embedId === capability.embedId)
					),
					capability
				]
			}));
		},

		deactivateCapability: (capability: CapabilityName, embedId: string) => {
			update(state => ({
				...state,
				activeCapabilities: state.activeCapabilities.filter(
					c => !(c.capability === capability && c.embedId === embedId)
				)
			}));
		},

		// Toast methods
		showToast: (toast: Omit<DeviceToastMessage, 'id'>) => {
			const id = `toast-${Date.now()}-${Math.random()}`;
			const duration = toast.duration || 3000;

			update(state => ({
				...state,
				toasts: [...state.toasts, { ...toast, id }]
			}));

			// Auto-dismiss
			setTimeout(() => {
				update(state => ({
					...state,
					toasts: state.toasts.filter(t => t.id !== id)
				}));
			}, duration);
		},

		dismissToast: (id: string) => {
			update(state => ({
				...state,
				toasts: state.toasts.filter(t => t.id !== id)
			}));
		},

		// Panel methods
		openPanel: () => {
			update(state => ({
				...state,
				isPanelOpen: true
			}));
		},

		closePanel: () => {
			update(state => ({
				...state,
				isPanelOpen: false
			}));
		},

		togglePanel: () => {
			update(state => ({
				...state,
				isPanelOpen: !state.isPanelOpen
			}));
		}
	};
}

export const deviceUIStore = createDeviceUIStore();

// Derived stores
export const hasActiveCapabilities = derived(
	deviceUIStore,
	$store => $store.activeCapabilities.length > 0
);

export const hasPermissionRequest = derived(
	deviceUIStore,
	$store => $store.permissionRequest !== null
);

export const hasConnectionRequest = derived(
	deviceUIStore,
	$store => $store.connectionRequest !== null
);
