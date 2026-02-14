/**
 * StackLive Native Bridge
 * Interface for native iOS/Android communication
 * 
 * This file defines the contract between web embeds and native apps.
 * Native apps should implement handlers for these message types.
 */

import type { CapabilityMessage } from './CapabilityMessageProtocol';
import { isValidMessage } from './CapabilityMessageProtocol';

/**
 * Native bridge interface
 * This should be implemented by native iOS/Android apps
 */
export interface IStackLiveNativeBridge {
	/**
	 * Post message to native
	 */
	postMessage(message: string): void;

	/**
	 * Check if native bridge is ready
	 */
	isReady?(): boolean;

	/**
	 * Get native version
	 */
	getVersion?(): string;
}

/**
 * Declare global window extension
 */
declare global {
	interface Window {
		StackLiveNativeBridge?: IStackLiveNativeBridge;
		ReactNativeWebView?: {
			postMessage(message: string): void;
		};
		webkit?: {
			messageHandlers?: {
				StackLiveNativeBridge?: {
					postMessage(message: unknown): void;
				};
			};
		};
	}
}

/**
 * Native Bridge Helper Class
 * Provides utilities for working with the native bridge
 */
export class StackLiveNativeBridge {
	/**
	 * Check if native bridge is available
	 */
	static isAvailable(): boolean {
		if (typeof window === 'undefined') return false;

		return !!(
			window.StackLiveNativeBridge ||
			window.ReactNativeWebView ||
			window.webkit?.messageHandlers?.StackLiveNativeBridge
		);
	}

	/**
	 * Post message to native
	 */
	static postMessage(message: CapabilityMessage): void {
		if (!this.isAvailable()) {
			console.warn('[StackLiveNativeBridge] Native bridge not available');
			return;
		}

		if (!isValidMessage(message)) {
			console.error('[StackLiveNativeBridge] Invalid message format', message);
			return;
		}

		const messageStr = JSON.stringify(message);

		try {
			// Standard StackLive bridge
			if (window.StackLiveNativeBridge?.postMessage) {
				window.StackLiveNativeBridge.postMessage(messageStr);
			}
			// React Native WebView
			else if (window.ReactNativeWebView?.postMessage) {
				window.ReactNativeWebView.postMessage(messageStr);
			}
			// iOS WKWebView
			else if (window.webkit?.messageHandlers?.StackLiveNativeBridge) {
				window.webkit.messageHandlers.StackLiveNativeBridge.postMessage(message);
			}
		} catch (error) {
			console.error('[StackLiveNativeBridge] Error posting message:', error);
		}
	}

	/**
	 * Listen for messages from native
	 */
	static addMessageListener(handler: (message: CapabilityMessage) => void): () => void {
		if (typeof window === 'undefined') {
			return () => {};
		}

		const listener = (event: MessageEvent) => {
			try {
				const message = typeof event.data === 'string' 
					? JSON.parse(event.data) 
					: event.data;

				if (isValidMessage(message)) {
					handler(message);
				}
			} catch (error) {
				console.error('[StackLiveNativeBridge] Error parsing message:', error);
			}
		};

		window.addEventListener('message', listener);

		// Return cleanup function
		return () => {
			window.removeEventListener('message', listener);
		};
	}

	/**
	 * Get bridge version
	 */
	static getVersion(): string {
		if (window.StackLiveNativeBridge?.getVersion) {
			return window.StackLiveNativeBridge.getVersion();
		}
		return 'unknown';
	}

	/**
	 * Check if bridge is ready
	 */
	static isReady(): boolean {
		if (window.StackLiveNativeBridge?.isReady) {
			return window.StackLiveNativeBridge.isReady();
		}
		return this.isAvailable();
	}
}

/**
 * Example native implementation (for reference)
 * 
 * iOS (Swift):
 * ```swift
 * class StackLiveNativeBridge: NSObject, WKScriptMessageHandler {
 *   func userContentController(_ userContentController: WKUserContentController, 
 *                            didReceive message: WKScriptMessage) {
 *     guard let dict = message.body as? [String: Any],
 *           let type = dict["type"] as? String,
 *           let capability = dict["capability"] as? String else {
 *       return
 *     }
 *     
 *     handleCapabilityRequest(type: type, capability: capability, dict: dict)
 *   }
 * }
 * ```
 * 
 * Android (Kotlin):
 * ```kotlin
 * class StackLiveNativeBridge(private val webView: WebView) {
 *   @JavascriptInterface
 *   fun postMessage(message: String) {
 *     val json = JSONObject(message)
 *     val type = json.getString("type")
 *     val capability = json.getString("capability")
 *     handleCapabilityRequest(type, capability, json)
 *   }
 * }
 * ```
 * 
 * React Native:
 * ```javascript
 * <WebView
 *   onMessage={(event) => {
 *     const message = JSON.parse(event.nativeEvent.data);
 *     handleCapabilityRequest(message);
 *   }}
 * />
 * ```
 */
