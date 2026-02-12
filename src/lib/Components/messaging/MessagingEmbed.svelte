<script lang="ts">
	// This is a wrapper component that uses the sl-messaging web component
	// It provides backward compatibility for Svelte imports while using the normalized web component
	import '../webcomponents/MessagingEmbed.wc.svelte';

	export let embedId = 'messaging-app';
	export let sessionId: string | undefined = undefined;
	export let enableVideo = true;
	export let enableAudio = true;

	let element: HTMLElement;

	// Reactive updates - only way to set attributes
	$: if (element) {
		element.setAttribute('embedId', embedId);
		element.setAttribute('sessionId', sessionId || '');
		element.setAttribute('enableVideo', String(enableVideo));
		element.setAttribute('enableAudio', String(enableAudio));
	}
</script>

<sl-messaging bind:this={element}></sl-messaging>
