<script lang="ts">
	import type { Participant, Session } from '$lib/multiplayer/types';

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
		<h2>Messages</h2>
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
		padding: 1rem;
		border-bottom: 1px solid #e5e5e5;
		background: #f9f9f9;
	}

	.header h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #000;
	}

	.session-id {
		font-size: 0.75rem;
		color: #666;
	}

	.session-id .label {
		font-weight: 500;
	}

	.session-id .id {
		font-family: monospace;
		background: #e5e5e5;
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
		margin-left: 0.25rem;
	}

	.search-bar {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e5e5e5;
	}

	.search-bar input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: none;
		background: #f0f0f0;
		border-radius: 8px;
		font-size: 0.875rem;
		outline: none;
	}

	.search-bar input:focus {
		background: #e8e8e8;
	}

	.conversations {
		flex: 1;
		overflow-y: auto;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #999;
		text-align: center;
		padding: 2rem;
	}

	.empty-state p:first-child {
		font-size: 3rem;
		margin: 0;
	}

	.empty-state p {
		margin: 0.5rem 0;
	}

	.empty-state .hint {
		font-size: 0.875rem;
		color: #bbb;
	}

	.conversation-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border: none;
		background: transparent;
		border-bottom: 1px solid #f0f0f0;
		cursor: pointer;
		transition: background 0.15s;
		text-align: left;
		width: 100%;
	}

	.conversation-item:hover {
		background: #f9f9f9;
	}

	.avatar {
		position: relative;
		width: 48px;
		height: 48px;
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
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.online-indicator {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 12px;
		height: 12px;
		background: #34c759;
		border: 2px solid white;
		border-radius: 50%;
	}

	.conversation-info {
		flex: 1;
		min-width: 0;
	}

	.top-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 0.25rem;
	}

	.name {
		font-weight: 600;
		color: #000;
		font-size: 0.9375rem;
	}

	.time {
		font-size: 0.75rem;
		color: #999;
	}

	.preview {
		font-size: 0.875rem;
		color: #666;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
