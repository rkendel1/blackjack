/**
 * Backend - Unified Export Layer
 * 
 * This is the main backend export module that provides a separation layer
 * between the TypeScript backend implementation and frontend components.
 * 
 * Architecture:
 * - TypeScript backends integrate with full StackLive infrastructure
 * - Standalone JavaScript backends work without external dependencies
 * - All backends follow the same interface pattern
 * 
 * Usage in TypeScript/Svelte projects:
 * ```typescript
 * import { createMessagingBackend } from '$lib/backends/messaging';
 * import { createBlackjackStore } from '$lib/backends/games';
 * import { useStackLiveMultiplayer } from '$lib/backends/multiplayer';
 * ```
 * 
 * Usage in standalone JavaScript:
 * ```javascript
 * import { MessagingBackend } from './backends/messaging/MessagingBackendStandalone.js';
 * ```
 */

// Messaging backends
export * from './messaging';

// Game backends (engines + adapters)
export * from './games';

// Multiplayer backends
export * from './multiplayer';

// AR/VR backends
export * from './arvr';

// Utility backends
export * from './utils';

// Animation backends
export * from './animation';
