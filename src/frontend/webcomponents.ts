/**
 * Web Components Registration
 * 
 * Import all web components to register them globally.
 * These components use Svelte's customElement feature to create native web components.
 * Components are organized by feature in their respective directories.
 */

// AR/VR Web Components
import './sl-arvr-scene.upgraded.svelte';
import './sl-arvr-avatar.upgraded.svelte';
import './sl-arvr-filter.upgraded.svelte';
import './sl-arvr-spatial.upgraded.svelte';

// Messaging Web Components
import './sl-messaging.upgraded.svelte';
import './sl-room.upgraded.svelte';

// Game Web Components
import './sl-tictactoe.upgraded.svelte';

// RSS Web Components
import './sl-rss-reader.upgraded.svelte';

// Bluetooth Web Components
import './sl-bluetooth.upgraded.svelte';

// Re-export for convenience (though the custom elements are automatically registered)
export { default as ARVRScene } from './sl-arvr-scene.upgraded.svelte';
export { default as ARVRAvatar } from './sl-arvr-avatar.upgraded.svelte';
export { default as ARVRFilter } from './sl-arvr-filter.upgraded.svelte';
export { default as ARVRSpatial } from './sl-arvr-spatial.upgraded.svelte';
export { default as MessagingEmbed } from './sl-messaging.upgraded.svelte';
export { default as RoomEmbed } from './sl-room.upgraded.svelte';
export { default as TicTacToeEmbed } from './sl-tictactoe.upgraded.svelte';
export { default as RSSReaderEmbed } from './sl-rss-reader.upgraded.svelte';
export { default as BluetoothEmbed } from './sl-bluetooth.upgraded.svelte';
