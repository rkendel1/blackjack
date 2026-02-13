<script lang="ts">
	import type { Participant, Session } from '../../../backend/multiplayer/types';

	export let participants: Participant[];
	export let sessionInfo: Session | null;
	export let onSelectConversation: (userId: string) => void;

	// Get list of conversations (other participants)
	$: conversations = participants
		.filter((p) => p.userId !== sessionInfo?.hostId)
		.map((p) => ({
			userId: p.userId,
			name: p.user?.name || p.userId,
			avatar: p.user?.avatar || '',
			online: p.connectionStatus === 'connected',
			lastMessage: 'Start a conversation',
			timestamp: Date.now()
		}));
</script>

<div class="conversation-list">
	<div class="header">
		<h2>StackLive Messenger</h2>
		<div class="session-id">
			{#if sessionInfo}
				<span class="label">Session:</span>
				<span class="id">{sessionInfo.id.substring(0, 8)}...</span>
			{/if}
		</div>
	</div>

	<div class="search-bar">
		<input type="text" placeholder="🔍 Search conversations..." />
	</div>

	<div class="conversations">
		{#if conversations.length === 0}
			<div class="empty-state">
				<p>📭</p>
				<p>No conversations yet</p>
				<p class="hint">Share your session ID to connect with others</p>
			</div>
		{:else}
			{#each conversations as conversation}
				<button
					class="conversation-item"
					on:click={() => onSelectConversation(conversation.userId)}
				>
					<div class="avatar">
						{#if conversation.avatar}
							<img src={conversation.avatar} alt={conversation.name} />
						{:else}
							<div class="avatar-placeholder">
								{conversation.name.charAt(0).toUpperCase()}
							</div>
						{/if}
						{#if conversation.online}
							<div class="online-indicator"></div>
						{/if}
					</div>

					<div class="conversation-info">
						<div class="top-row">
							<span class="name">{conversation.name}</span>
							<span class="time">Now</span>
						</div>
						<div class="preview">
							{conversation.lastMessage}
						</div>
					</div>
				</button>
			{/each}
		{/if}
	</div>
</div>

<style>
	.conversation-list {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #ffffff;
	}

	.header {
		padding: 1.25rem 1rem 1rem 1rem;
		border-bottom: 0.5px solid #d1d1d6;
		background: #f8f8f8;
	}

	.header h2 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 700;
		color: #000000;
		letter-spacing: -0.5px;
	}

	.session-id {
		font-size: 0.6875rem;
		color: #8e8e93;
		font-weight: 500;
	}

	.session-id .label {
		font-weight: 600;
	}

	.session-id .id {
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
		background: #e5e5ea;
		padding: 0.125rem 0.5rem;
		border-radius: 6px;
		margin-left: 0.375rem;
	}

	.search-bar {
		padding: 0.5rem 1rem 0.75rem 1rem;
		background: #f8f8f8;
		border-bottom: 0.5px solid #d1d1d6;
	}

	.search-bar input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: none;
		background: #e5e5ea;
		border-radius: 10px;
		font-size: 1rem;
		outline: none;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
	}

	.search-bar input:focus {
		background: #d1d1d6;
	}

	.search-bar input::placeholder {
		color: #8e8e93;
	}

	.conversations {
		flex: 1;
		overflow-y: auto;
		background: #ffffff;
	}

	.conversations::-webkit-scrollbar {
		width: 6px;
	}

	.conversations::-webkit-scrollbar-track {
		background: transparent;
	}

	.conversations::-webkit-scrollbar-thumb {
		background: #d1d1d6;
		border-radius: 3px;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #8e8e93;
		text-align: center;
		padding: 2rem;
	}

	.empty-state p:first-child {
		font-size: 4rem;
		margin: 0 0 1rem 0;
		opacity: 0.5;
	}

	.empty-state p {
		margin: 0.5rem 0;
		font-size: 1rem;
		color: #8e8e93;
	}

	.empty-state .hint {
		font-size: 0.875rem;
		color: #c7c7cc;
	}

	.conversation-item {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.75rem 1rem;
		border: none;
		background: #ffffff;
		border-bottom: 0.5px solid #f2f2f7;
		cursor: pointer;
		transition: background 0.1s;
		text-align: left;
		width: 100%;
	}

	.conversation-item:hover {
		background: #f2f2f7;
	}

	.conversation-item:active {
		background: #e5e5ea;
	}

	.avatar {
		position: relative;
		width: 52px;
		height: 52px;
		flex-shrink: 0;
	}

	.avatar img,
	.avatar-placeholder {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
	}

	.avatar-placeholder {
		background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.375rem;
		font-weight: 600;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
	}

	.online-indicator {
		position: absolute;
		bottom: 0px;
		right: 0px;
		width: 14px;
		height: 14px;
		background: #34c759;
		border: 2.5px solid white;
		border-radius: 50%;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.conversation-info {
		flex: 1;
		min-width: 0;
	}

	.top-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 0.3rem;
	}

	.name {
		font-weight: 600;
		color: #000000;
		font-size: 1.0625rem;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
	}

	.time {
		font-size: 0.9375rem;
		color: #8e8e93;
		font-weight: 400;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
	}

	.preview {
		font-size: 0.9375rem;
		color: #8e8e93;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
		font-weight: 400;
	}
</style>
