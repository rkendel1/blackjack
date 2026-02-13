<script lang="ts">
	import type { ChatMessage, MediaMessage } from '$lib/multiplayer/types';
	import MessageBubble from './MessageBubble.svelte';
	import MessageInput from './MessageInput.svelte';

	export let messages: (ChatMessage | MediaMessage)[];
	export let conversationName: string;
	export let currentUserId: string;
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
		padding: 0.875rem 1rem;
		border-bottom: 0.5px solid #d1d1d6;
		background: #f8f8f8;
		min-height: 60px;
	}

	.back-button {
		background: none;
		border: none;
		font-size: 2rem;
		color: #007aff;
		cursor: pointer;
		padding: 0;
		line-height: 1;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 400;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
	}

	.back-button:hover {
		opacity: 0.6;
	}

	.back-button:active {
		opacity: 0.4;
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
		background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		flex-shrink: 0;
		font-size: 1.125rem;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
	}

	.info {
		min-width: 0;
		flex: 1;
	}

	.name {
		font-weight: 600;
		font-size: 1.0625rem;
		color: #000000;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
		letter-spacing: -0.2px;
	}

	.status {
		font-size: 0.75rem;
		color: #8e8e93;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
		margin-top: 1px;
	}

	.video-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.375rem;
		line-height: 1;
		color: #007aff;
		opacity: 0.9;
		transition: opacity 0.15s;
		border-radius: 50%;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.video-button:hover {
		opacity: 1;
		background: rgba(0, 122, 255, 0.1);
	}

	.video-button:active {
		opacity: 0.5;
		background: rgba(0, 122, 255, 0.2);
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		background: #ffffff;
	}

	.messages::-webkit-scrollbar {
		width: 6px;
	}

	.messages::-webkit-scrollbar-track {
		background: transparent;
	}

	.messages::-webkit-scrollbar-thumb {
		background: #d1d1d6;
		border-radius: 3px;
	}

	.empty-messages {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #8e8e93;
		text-align: center;
	}

	.empty-messages p:first-child {
		font-size: 4rem;
		margin: 0 0 1rem 0;
		opacity: 0.5;
	}

	.empty-messages p {
		margin: 0.5rem 0;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
	}

	.empty-messages .hint {
		font-size: 0.875rem;
		color: #c7c7cc;
	}
</style>
