/**
 * Device UI Backend
 * Exports for device control UI system
 */

export { deviceUIStore, hasActiveCapabilities, hasPermissionRequest, hasConnectionRequest } from './device-ui-store';
export type { 
	DevicePermissionRequest, 
	DeviceConnectionRequest, 
	ActiveCapability, 
	DeviceToastMessage,
	DeviceUIState 
} from './device-ui-store';
