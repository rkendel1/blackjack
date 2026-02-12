<script lang="ts">
	import type { ChatMessage, MediaMessage } from '$lib/multiplayer/types';
	import MessageBubble from './MessageBubble.svelte';
	import MessageInput from './MessageInput.svelte';

	export let messages: (ChatMessage | MediaMessage)[];
	export let conversationName: string;
	export let currentUserId: string;
	export let localStream: MediaStream | null;
	export let remoteStreams: Map<string, MediaStream>;
	export let onBack: () => void;
	export let onSendMessage: (text: string) => void;
	export let onSendMedia: (mediaUrl: string, mediaType: string, caption?: string) => void;
	export let onStartVideoCall: () => void;

	let messageContainer: HTMLDivElement;

	// Auto-scroll to bottom when new messages arrive
	$: if (messages && messageContainer) {
		setTimeout(() => {
			messageContainer.scrollTop = messageContainer.scrollHeight;
		}, 100);
	}

	function handleReaction(messageId: string, reaction: string) {
		// Handle reaction (would integrate with interaction manager)
		console.log('Reaction:', messageId, reaction);
	}

</script>

<div class="chat-view">
	<div class="header">
		<button class="back-button" on:click={onBack}>
			<span>‹</span>
		</button>
		<div class="conversation-header">
			<div class="avatar">
				{conversationName.charAt(0).toUpperCase()}
			</div>
			<div class="info">
				<div class="name">{conversationName}</div>
				<div class="status">Active now</div>
			</div>
		</div>
		<button class="video-button" on:click={onStartVideoCall} title="Start video call">
			<span>📹</span>
		</button>
	</div>

	<div class="messages" bind:this={messageContainer}>
		{#if messages.length === 0}
			<div class="empty-messages">
				<p>💬</p>
				<p>No messages yet</p>
				<p class="hint">Send a message to start the conversation</p>
			</div>
		{:else}
			{#each messages as message}
				<MessageBubble
					{message}
					isSent={message.fromUserId === currentUserId}
					onReact={(reaction) => handleReaction(message.id, reaction)}
				/>
			{/each}
		{/if}
	</div>

	<MessageInput {onSendMessage} {onSendMedia} />
</div>

<style>
	.chat-view {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #ffffff;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e5e5e5;
		background: #f9f9f9;
	}

	.back-button {
		background: none;
		border: none;
		font-size: 1.75rem;
		color: #007aff;
		cursor: pointer;
		padding: 0;
		line-height: 1;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.back-button:hover {
		opacity: 0.7;
	}

	.conversation-header {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
	}

	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		flex-shrink: 0;
	}

	.info {
		min-width: 0;
	}

	.name {
		font-weight: 600;
		font-size: 0.9375rem;
		color: #000;
	}

	.status {
		font-size: 0.75rem;
		color: #34c759;
	}

	.video-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
		opacity: 0.7;
		transition: opacity 0.15s;
	}

	.video-button:hover {
		opacity: 1;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		background: #f9f9f9;
	}

	.empty-messages {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #999;
		text-align: center;
	}

	.empty-messages p:first-child {
		font-size: 3rem;
		margin: 0;
	}

	.empty-messages p {
		margin: 0.5rem 0;
	}

	.empty-messages .hint {
		font-size: 0.875rem;
		color: #bbb;
	}
</style>
