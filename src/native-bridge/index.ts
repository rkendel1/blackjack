/**
 * Native Bridge Module
 * Main exports for native bridge communication
 */

export { StackLiveNativeBridge, type IStackLiveNativeBridge } from './StackLiveNativeBridge';
export {
	isValidMessage,
	createRequest,
	createGranted,
	createDenied,
	createData,
	createError,
	type CapabilityMessage,
	type CapabilityRequest,
	type CapabilityGranted,
	type CapabilityDenied,
	type CapabilityData,
	type CapabilityError
} from './CapabilityMessageProtocol';
