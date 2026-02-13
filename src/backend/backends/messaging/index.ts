/**
 * Messaging Backend - Unified Export
 * 
 * This module provides a unified interface for messaging backend functionality.
 * It exports both the TypeScript-based backend and standalone JavaScript backend.
 * 
 * Usage in TypeScript/Svelte projects:
 * ```typescript
 * import { createMessagingBackend } from './.';
 * const backend = createMessagingBackend({ embedId: 'my-app' });
 * ```
 * 
 * Usage in standalone JavaScript:
 * ```javascript
 * import { MessagingBackend } from './MessagingBackendStandalone.js';
 * const backend = new MessagingBackend({ embedId: 'my-app' });
 * ```
 */

export { createMessagingBackend } from './MessagingBackend';
export type { MessagingBackend, MessagingBackendConfig, MessagingBackendStores, MessagingBackendActions } from './MessagingBackend';
