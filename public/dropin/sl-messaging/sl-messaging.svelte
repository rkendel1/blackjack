<svelte:options customElement="sl-messaging" />

<script>
	import { onMount, onDestroy } from 'svelte';

	// Exposed attributes (all strings for web components)
	export let embedId = 'messaging-app';
	export let sessionId = '';
	export let enableVideo = 'true';
	export let enableAudio = 'true';

	// Convert string attributes to booleans
	$: enableVideoBool = enableVideo === 'true';
	$: enableAudioBool = enableAudio === 'true';

	// State
	let currentView = 'inbox'; // 'inbox' | 'chat' | 'video'
	let selectedConversationId = null;
	let isInitialized = false;
	let conversations = [];
	let messages = [];
	let currentUserId = 'user-1';
	let conversationName = '';

	onMount(async () => {
		// Simplified initialization - no external dependencies
		isInitialized = true;
		
		// Mock conversations for demo
		conversations = [
			{
				userId: 'user-2',
				name: 'Alice Johnson',
				avatar: '',
				online: true,
				lastMessage: 'Start a conversation',
				timestamp: Date.now()
			},
			{
				userId: 'user-3',
				name: 'Bob Smith',
				avatar: '',
				online: true,
				lastMessage: 'Start a conversation',
				timestamp: Date.now()
			}
		];

		// Dispatch ready event
		const event = new CustomEvent('ready', {
			detail: { embedId, sessionId }
		});
		dispatchEvent(event);
	});

	function handleSelectConversation(userId) {
		selectedConversationId = userId;
		currentView = 'chat';
		const conv = conversations.find(c => c.userId === userId);
		conversationName = conv ? conv.name : userId;
		
		// Mock messages
		messages = [
			{
				id: '1',
				fromUserId: userId,
				payload: 'Hello! This is a demo message.',
				timestamp: Date.now() - 60000
			},
			{
				id: '2',
				fromUserId: currentUserId,
				payload: 'Hi there!',
				timestamp: Date.now()
			}
		];
	}

	function handleBackToInbox() {
		currentView = 'inbox';
		selectedConversationId = null;
	}

	function handleStartVideoCall() {
		currentView = 'video';
	}

	function handleEndVideoCall() {
		currentView = 'chat';
	}

	function handleSendMessage(text) {
		if (!text.trim()) return;
		messages = [...messages, {
			id: Date.now().toString(),
			fromUserId: currentUserId,
			payload: text.trim(),
			timestamp: Date.now()
		}];
	}
</script>

<div class="messaging-embed">
	{#if !isInitialized}
		<div class="loading">
			<div class="spinner"></div>
			<p>Connecting...</p>
		</div>
	{:else if currentView === 'inbox'}
		<!-- Conversation List -->
		<div class="conversation-list">
			<div class="header">
				<h2>Messenger</h2>
				<div class="session-id">
					{#if sessionId}
						<span class="label">Session:</span>
						<span class="id">{sessionId.substring(0, 8)}...</span>
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
					</div>
				{:else}
					{#each conversations as conversation}
						<button
							class="conversation-item"
							on:click={() => handleSelectConversation(conversation.userId)}
						>
							<div class="avatar">
								{conversation.name.charAt(0).toUpperCase()}
							</div>
							<div class="conversation-info">
								<div class="name">{conversation.name}</div>
								<div class="last-message">{conversation.lastMessage}</div>
							</div>
							{#if conversation.online}
								<div class="online-indicator"></div>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{:else if currentView === 'chat'}
		<!-- Chat View -->
		<div class="chat-view">
			<div class="chat-header">
				<button class="back-button" on:click={handleBackToInbox}>
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
				<button class="video-button" on:click={handleStartVideoCall} title="Start video call">
					<span>📹</span>
				</button>
			</div>

			<div class="messages">
				{#if messages.length === 0}
					<div class="empty-messages">
						<p>No messages yet</p>
						<p>Start the conversation!</p>
					</div>
				{:else}
					{#each messages as message}
						<div class="message" class:sent={message.fromUserId === currentUserId}>
							<div class="bubble">
								{message.payload}
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<div class="message-input">
				<input
					type="text"
					placeholder="Message..."
					on:keydown={(e) => {
						if (e.key === 'Enter' && e.target.value.trim()) {
							handleSendMessage(e.target.value);
							e.target.value = '';
						}
					}}
				/>
				<button class="send-button">Send</button>
			</div>
		</div>
	{:else if currentView === 'video'}
		<!-- Video Call Panel -->
		<div class="video-call-panel">
			<div class="video-header">
				<span>{conversationName}</span>
				<span class="call-status">Connected</span>
			</div>

			<div class="video-container">
				<div class="remote-video">
					<div class="placeholder">
						<span>📹</span>
						<p>{conversationName}</p>
					</div>
				</div>

				<div class="local-video">
					<div class="placeholder-small">
						<span>📷</span>
					</div>
				</div>
			</div>

			<div class="video-controls">
				<button class="control-button" title="Mute">🎤</button>
				<button class="control-button" title="Video">📹</button>
				<button class="control-button end-call" on:click={handleEndVideoCall} title="End Call">📞</button>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Main Container */
	.messaging-embed {
		width: 100%;
		max-width: 500px;
		height: 600px;
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		position: relative;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
	}

	/* Loading State */
	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #666;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #007aff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* Conversation List */
	.conversation-list {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.header {
		background: linear-gradient(to bottom, #f7f7f7, #ffffff);
		padding: 1rem;
		border-bottom: 1px solid #e5e5e5;
	}

	.header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #000;
	}

	.session-id {
		margin-top: 0.5rem;
		font-size: 0.75rem;
		color: #666;
	}

	.search-bar {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e5e5e5;
	}

	.search-bar input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		font-size: 0.9375rem;
	}

	.conversations {
		flex: 1;
		overflow-y: auto;
	}

	.conversation-item {
		display: flex;
		align-items: center;
		width: 100%;
		padding: 1rem;
		border: none;
		border-bottom: 1px solid #e5e5e5;
		background: white;
		cursor: pointer;
		text-align: left;
		position: relative;
	}

	.conversation-item:hover {
		background: #f5f5f5;
	}

	.avatar {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea, #764ba2);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		font-weight: bold;
		margin-right: 1rem;
	}

	.conversation-info {
		flex: 1;
	}

	.name {
		font-weight: 600;
		font-size: 1rem;
		color: #000;
		margin-bottom: 0.25rem;
	}

	.last-message {
		font-size: 0.875rem;
		color: #666;
	}

	.online-indicator {
		width: 12px;
		height: 12px;
		background: #4caf50;
		border-radius: 50%;
		border: 2px solid white;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #999;
		padding: 2rem;
		text-align: center;
	}

	.empty-state p:first-child {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}

	/* Chat View */
	.chat-view {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.chat-header {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		background: linear-gradient(to bottom, #f7f7f7, #ffffff);
		border-bottom: 1px solid #e5e5e5;
	}

	.back-button {
		background: none;
		border: none;
		font-size: 2rem;
		cursor: pointer;
		padding: 0;
		margin-right: 0.5rem;
		color: #007aff;
	}

	.conversation-header {
		display: flex;
		align-items: center;
		flex: 1;
	}

	.conversation-header .avatar {
		width: 40px;
		height: 40px;
		font-size: 1rem;
	}

	.info {
		margin-left: 0.75rem;
	}

	.info .name {
		font-weight: 600;
		font-size: 0.9375rem;
	}

	.info .status {
		font-size: 0.75rem;
		color: #666;
	}

	.video-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.25rem;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		background: #fff;
	}

	.empty-messages {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #999;
	}

	.message {
		display: flex;
		margin-bottom: 0.75rem;
	}

	.message.sent {
		justify-content: flex-end;
	}

	.bubble {
		max-width: 70%;
		padding: 0.75rem 1rem;
		border-radius: 18px;
		font-size: 0.9375rem;
		line-height: 1.4;
	}

	.message:not(.sent) .bubble {
		background: #e5e5ea;
		color: #000;
		border-bottom-left-radius: 4px;
	}

	.message.sent .bubble {
		background: #007aff;
		color: white;
		border-bottom-right-radius: 4px;
	}

	.message-input {
		display: flex;
		padding: 0.75rem 1rem;
		border-top: 1px solid #e5e5e5;
		background: #f7f7f7;
	}

	.message-input input {
		flex: 1;
		padding: 0.5rem 1rem;
		border: 1px solid #e5e5e5;
		border-radius: 20px;
		font-size: 0.9375rem;
		margin-right: 0.5rem;
	}

	.send-button {
		padding: 0.5rem 1rem;
		background: #007aff;
		color: white;
		border: none;
		border-radius: 20px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 600;
	}

	/* Video Call Panel */
	.video-call-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #000;
		color: white;
	}

	.video-header {
		display: flex;
		justify-content: space-between;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.5);
	}

	.call-status {
		color: #4caf50;
		font-size: 0.875rem;
	}

	.video-container {
		flex: 1;
		position: relative;
	}

	.remote-video {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #1a1a1a;
	}

	.placeholder {
		text-align: center;
	}

	.placeholder span {
		font-size: 4rem;
	}

	.placeholder p {
		margin-top: 1rem;
		font-size: 1.25rem;
	}

	.local-video {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 120px;
		height: 160px;
		background: #333;
		border-radius: 8px;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.placeholder-small span {
		font-size: 2rem;
	}

	.video-controls {
		display: flex;
		justify-content: center;
		gap: 1rem;
		padding: 1.5rem;
		background: rgba(0, 0, 0, 0.5);
	}

	.control-button {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		border: none;
		background: rgba(255, 255, 255, 0.2);
		color: white;
		font-size: 1.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.control-button:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.control-button.end-call {
		background: #ff3b30;
	}

	.control-button.end-call:hover {
		background: #ff2d21;
	}

	@media (max-width: 768px) {
		.messaging-embed {
			max-width: 100%;
			height: 100vh;
			border-radius: 0;
		}
	}
</style>
