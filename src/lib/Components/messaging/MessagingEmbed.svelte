<script lang="ts">
	// This is a wrapper component that uses the sl-messaging web component
	// It provides backward compatibility for Svelte imports while using the normalized web component
	import { onMount } from 'svelte';
	import '../webcomponents/MessagingEmbed.wc.svelte';

	export let embedId = 'messaging-app';
	export let sessionId: string | undefined = undefined;
	export let enableVideo = true;
	export let enableAudio = true;

	let element: HTMLElement;

	onMount(() => {
		// Update attributes when props change
		if (element) {
			element.setAttribute('embedId', embedId);
			element.setAttribute('sessionId', sessionId || '');
			element.setAttribute('enableVideo', String(enableVideo));
			element.setAttribute('enableAudio', String(enableAudio));
		}
	});

	// Reactive updates
	$: if (element) {
		element.setAttribute('embedId', embedId);
		element.setAttribute('sessionId', sessionId || '');
		element.setAttribute('enableVideo', String(enableVideo));
		element.setAttribute('enableAudio', String(enableAudio));
	}
</script>

<sl-messaging
	bind:this={element}
	embedId={embedId}
	sessionId={sessionId || ''}
	enableVideo={String(enableVideo)}
	enableAudio={String(enableAudio)}
></sl-messaging>
