<script lang="ts">
	import type { ChatMessage, MediaMessage } from '$lib/multiplayer/types';

	export let message: ChatMessage | MediaMessage;
	export let isSent: boolean;
	export let onReact: (reaction: string) => void;

	let showReactions = false;
	const reactions = ['👍', '❤️', '😂', '😮', '😢', '👏'];

	function isMediaMessage(msg: ChatMessage | MediaMessage): msg is MediaMessage {
		return 'mediaUrl' in msg;
	}

	function formatTime(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function getMediaType(mediaType: string): 'image' | 'video' | 'audio' | 'file' {
		if (mediaType.startsWith('image/')) return 'image';
		if (mediaType.startsWith('video/')) return 'video';
		if (mediaType.startsWith('audio/')) return 'audio';
		return 'file';
	}
</script>

<div class="message-bubble {isSent ? 'sent' : 'received'}">
	<div class="bubble">
		{#if isMediaMessage(message)}
			{@const type = getMediaType(message.mediaType)}
			<div class="media-message">
				{#if type === 'image'}
					<img src={message.mediaUrl} alt="Shared media" />
				{:else if type === 'video'}
					<video src={message.mediaUrl} controls aria-label="Shared video message">
						<track kind="captions" />
					</video>
				{:else if type === 'audio'}
					<audio src={message.mediaUrl} controls />
				{:else}
					<a href={message.mediaUrl} target="_blank" rel="noopener noreferrer">
						📎 {message.mediaType}
					</a>
				{/if}
				{#if message.payload?.caption}
					<div class="caption">{message.payload.caption}</div>
				{/if}
			</div>
		{:else}
			<div class="text-message">{message.payload}</div>
		{/if}

		<div class="metadata">
			<span class="time">{formatTime(message.timestamp)}</span>
			{#if isSent}
				<span class="status">✓</span>
			{/if}
		</div>
	</div>

	<button
		class="reaction-trigger"
		on:click={() => (showReactions = !showReactions)}
		title="React to message"
	>
		❤️
	</button>

	{#if showReactions}
		<div class="reaction-picker">
			{#each reactions as reaction}
				<button
					class="reaction-option"
					on:click={() => {
						onReact(reaction);
						showReactions = false;
					}}
				>
					{reaction}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.message-bubble {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		position: relative;
	}

	.message-bubble.sent {
		justify-content: flex-end;
	}

	.message-bubble.received {
		justify-content: flex-start;
	}

	.bubble {
		max-width: 70%;
		padding: 0.625rem 0.875rem;
		border-radius: 18px;
		position: relative;
	}

	.sent .bubble {
		background: #007aff;
		color: white;
		border-bottom-right-radius: 4px;
	}

	.received .bubble {
		background: #e5e5ea;
		color: #000;
		border-bottom-left-radius: 4px;
	}

	.text-message {
		font-size: 0.9375rem;
		line-height: 1.4;
		word-wrap: break-word;
	}

	.media-message {
		max-width: 100%;
	}

	.media-message img,
	.media-message video {
		max-width: 100%;
		border-radius: 12px;
		display: block;
	}

	.media-message audio {
		width: 100%;
	}

	.media-message a {
		color: inherit;
		text-decoration: underline;
	}

	.caption {
		margin-top: 0.5rem;
		font-size: 0.875rem;
	}

	.metadata {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-top: 0.25rem;
		font-size: 0.6875rem;
		opacity: 0.7;
	}

	.sent .metadata {
		justify-content: flex-end;
	}

	.reaction-trigger {
		opacity: 0;
		background: none;
		border: none;
		font-size: 1rem;
		cursor: pointer;
		padding: 0.25rem;
		transition: opacity 0.15s;
	}

	.message-bubble:hover .reaction-trigger {
		opacity: 0.6;
	}

	.reaction-trigger:hover {
		opacity: 1 !important;
	}

	.reaction-picker {
		position: absolute;
		bottom: 100%;
		background: white;
		border: 1px solid #e5e5e5;
		border-radius: 20px;
		padding: 0.5rem;
		display: flex;
		gap: 0.25rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		z-index: 10;
	}

	.sent .reaction-picker {
		right: 0;
	}

	.received .reaction-picker {
		left: 0;
	}

	.reaction-option {
		background: none;
		border: none;
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		transition: background 0.15s;
	}

	.reaction-option:hover {
		background: #f0f0f0;
	}
</style>
