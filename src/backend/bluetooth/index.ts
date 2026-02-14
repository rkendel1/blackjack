/**
 * Bluetooth Backend Module
 * 
 * Exports the Bluetooth backend adapter for use in web components
 */

export { createBluetoothBackend } from './BluetoothBackend';
export type { 
	BluetoothBackend,
	BluetoothBackendConfig,
	BluetoothBackendStores,
	BluetoothBackendActions,
	BluetoothDeviceInfo
} from './BluetoothBackend';
