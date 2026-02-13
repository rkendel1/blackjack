// Export all Web Components
// These components use Svelte's customElement feature to create native web components
// Components are now organized by feature in their respective directories

// Import the components to register them
import '../../arvr/sl-arvr-scene.svelte';
import '../../arvr/sl-arvr-avatar.svelte';
import '../../arvr/sl-arvr-filter.svelte';
import '../../arvr/sl-arvr-spatial.svelte';
import '../../messaging/sl-messaging.svelte';
import '../../messaging/sl-room.svelte';
import '../../games/sl-tictactoe.svelte';
import '../../rss/sl-rss-reader.svelte';

// Re-export for convenience (though the custom elements are automatically registered)
export { default as ARVRScene } from '../../arvr/sl-arvr-scene.svelte';
export { default as ARVRAvatar } from '../../arvr/sl-arvr-avatar.svelte';
export { default as ARVRFilter } from '../../arvr/sl-arvr-filter.svelte';
export { default as ARVRSpatial } from '../../arvr/sl-arvr-spatial.svelte';
export { default as MessagingEmbed } from '../../messaging/sl-messaging.svelte';
export { default as RoomEmbed } from '../../messaging/sl-room.svelte';
export { default as TicTacToeEmbed } from '../../games/sl-tictactoe.svelte';
export { default as RSSReaderEmbed } from '../../rss/sl-rss-reader.svelte';

