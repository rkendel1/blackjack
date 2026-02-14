/**
 * Capability Message Protocol
 * Defines message types for native bridge communication
 */

import type { CapabilityName, NativeBridgeMessage } from '../backend/device-runtime/types';

/**
 * Request capability from native
 */
export interface CapabilityRequest extends NativeBridgeMessage {
	type: 'REQUEST_CAPABILITY';
	capability: CapabilityName;
	requestId: string;
	options?: {
		quality?: 'low' | 'medium' | 'high';
		streaming?: boolean;
		persist?: boolean;
	};
}

/**
 * Capability granted by native
 */
export interface CapabilityGranted extends NativeBridgeMessage {
	type: 'CAPABILITY_GRANTED';
	capability: CapabilityName;
	requestId?: string;
	status: 'active';
	data?: {
		stream?: MediaStream;
		deviceId?: string;
		capabilities?: Record<string, unknown>;
	};
}

/**
 * Capability denied by native
 */
export interface CapabilityDenied extends NativeBridgeMessage {
	type: 'CAPABILITY_DENIED';
	capability: CapabilityName;
	requestId?: string;
	error: string;
	reason?: 'permission_denied' | 'not_supported' | 'unavailable';
}

/**
 * Capability data streaming
 */
export interface CapabilityData extends NativeBridgeMessage {
	type: 'CAPABILITY_DATA';
	capability: CapabilityName;
	data: unknown;
	timestamp: number;
}

/**
 * Capability error
 */
export interface CapabilityError extends NativeBridgeMessage {
	type: 'CAPABILITY_ERROR';
	capability: CapabilityName;
	requestId?: string;
	error: string;
	code?: string;
}

/**
 * Type union of all message types
 */
export type CapabilityMessage =
	| CapabilityRequest
	| CapabilityGranted
	| CapabilityDenied
	| CapabilityData
	| CapabilityError;

/**
 * Message validator
 */
export function isValidMessage(message: unknown): message is CapabilityMessage {
	if (!message || typeof message !== 'object') return false;
	const msg = message as any;
	return (
		typeof msg.type === 'string' &&
		typeof msg.capability === 'string' &&
		['REQUEST_CAPABILITY', 'CAPABILITY_GRANTED', 'CAPABILITY_DENIED', 'CAPABILITY_DATA', 'CAPABILITY_ERROR'].includes(msg.type)
	);
}

/**
 * Create request message
 */
export function createRequest(capability: CapabilityName, requestId: string, options?: CapabilityRequest['options']): CapabilityRequest {
	return {
		type: 'REQUEST_CAPABILITY',
		capability,
		requestId,
		options
	};
}

/**
 * Create granted message
 */
export function createGranted(capability: CapabilityName, data?: CapabilityGranted['data'], requestId?: string): CapabilityGranted {
	return {
		type: 'CAPABILITY_GRANTED',
		capability,
		requestId,
		status: 'active',
		data
	};
}

/**
 * Create denied message
 */
export function createDenied(capability: CapabilityName, error: string, requestId?: string, reason?: CapabilityDenied['reason']): CapabilityDenied {
	return {
		type: 'CAPABILITY_DENIED',
		capability,
		requestId,
		error,
		reason
	};
}

/**
 * Create data message
 */
export function createData(capability: CapabilityName, data: unknown): CapabilityData {
	return {
		type: 'CAPABILITY_DATA',
		capability,
		data,
		timestamp: Date.now()
	};
}

/**
 * Create error message
 */
export function createError(capability: CapabilityName, error: string, requestId?: string, code?: string): CapabilityError {
	return {
		type: 'CAPABILITY_ERROR',
		capability,
		requestId,
		error,
		code
	};
}
