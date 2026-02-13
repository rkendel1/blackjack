// Export all AR/VR Web Components
// These components use Svelte's customElement feature to create native web components

// Import the components to register them
import './ARVRScene.wc.svelte';
import './ARVRAvatar.wc.svelte';
import './ARVRFilter.wc.svelte';
import './ARVRSpatial.wc.svelte';
import './MessagingEmbed.wc.svelte';
import './TicTacToeEmbed.wc.svelte';
import './RSSReaderEmbed.wc.svelte';

// Re-export for convenience (though the custom elements are automatically registered)
export { default as ARVRScene } from './ARVRScene.wc.svelte';
export { default as ARVRAvatar } from './ARVRAvatar.wc.svelte';
export { default as ARVRFilter } from './ARVRFilter.wc.svelte';
export { default as ARVRSpatial } from './ARVRSpatial.wc.svelte';
export { default as MessagingEmbed } from './MessagingEmbed.wc.svelte';
export { default as TicTacToeEmbed } from './TicTacToeEmbed.wc.svelte';
export { default as RSSReaderEmbed } from './RSSReaderEmbed.wc.svelte';
