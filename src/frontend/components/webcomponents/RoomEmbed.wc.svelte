<svelte:options customElement="sl-room" />

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { useStackLiveInteraction } from '../../../backend/backends/multiplayer';
	import type { StackLiveInteractionConfig } from '../../../backend/backends/multiplayer';
	import type { ChatMessage, MediaMessage, Participant } from '../../../backend/backends/multiplayer';

	// Exposed attributes (all strings for web components)
	export let embedId: string = 'room';
	export let sessionId: string = '';
	export let roomName: string = 'Work Room';
	export let enableVideo: string = 'false';
	export let enableAudio: string = 'false';
	export let maxMembers: string = '50';
	export let defaultRole: string = 'member';

	// Convert string attributes to appropriate types
	$: enableVideoBool = enableVideo === 'true';
	$: enableAudioBool = enableAudio === 'true';
	$: maxMembersNum = parseInt(maxMembers) || 50;
	$: sessionIdOrUndefined = sessionId || undefined;

	// State
	let isInitialized = false;
	let messageInput = '';
	let shoutInput = '';
	let showShoutDialog = false;
	let activeTab: 'chat' | 'members' | 'shouts' = 'chat';
	
	// Ephemeral notifications (smoke signals)
	let smokeSignals: Array<{ id: string; message: string; from: string; timestamp: number }> = [];

	// Configure interaction session
	$: config = {
		embedId,
		type: 'collaborative' as const,
		sessionId: sessionIdOrUndefined,
		maxParticipants: maxMembersNum,
		video: enableVideoBool,
		audio: enableAudioBool,
		debug: true
	} satisfies StackLiveInteractionConfig;

	$: interaction = useStackLiveInteraction(config);
	$: ({
		session,
		participants,
		isHost,
		isConnected,
		start,
		connect,
		send,
		getMessages,
		getLocalUserId
	} = interaction);

	// Messages store
	let messages: (ChatMessage | MediaMessage)[] = [];
	let shouts: Array<{ id: string; message: string; from: string; timestamp: number }> = [];

	onMount(async () => {
		if (sessionIdOrUndefined) {
			// Join existing session
			const success = await connect({ role: defaultRole as any });
			isInitialized = success;
		} else {
			// Create new session as host
			const newSession = await start();
			isInitialized = !!newSession;
		}

		// Set up message refresh
		const interval = setInterval(() => {
			if ($session) {
				messages = getMessages({ limit: 100 });
			}
		}, 1000);

		// Clean up old smoke signals
		const smokeInterval = setInterval(() => {
			const now = Date.now();
			smokeSignals = smokeSignals.filter(s => now - s.timestamp < 5000);
		}, 1000);

		// Dispatch ready event
		dispatchEvent(
			new CustomEvent('ready', {
				detail: { embedId, sessionId: $session?.sessionId, roomName }
			})
		);

		return () => {
			clearInterval(interval);
			clearInterval(smokeInterval);
		};
	});

	onDestroy(() => {
		interaction.destroy();
	});

	function handleSendMessage() {
		if (!messageInput.trim()) return;
		
		send({
			type: 'chat',
			payload: messageInput.trim()
		});
		
		messageInput = '';
	}

	function handleSendShout() {
		if (!shoutInput.trim()) return;
		
		const shout = {
			id: generateId(),
			message: shoutInput.trim(),
			from: getLocalUserId(),
			timestamp: Date.now()
		};
		
		shouts = [shout, ...shouts];
		
		// Broadcast shout to all participants
		send({
			type: 'chat',
			payload: `🔊 SHOUT: ${shoutInput.trim()}`
		});
		
		shoutInput = '';
		showShoutDialog = false;
	}

	function handleSmokeSignal(message: string) {
		const signal = {
			id: generateId(),
			message,
			from: getLocalUserId(),
			timestamp: Date.now()
		};
		
		smokeSignals = [...smokeSignals, signal];
		
		// Send as ephemeral message
		send({
			type: 'reaction',
			payload: `💨 ${message}`
		});
	}

	function getParticipantRole(participant: Participant): string {
		if (participant.userId === $session?.hostId) return 'host';
		return participant.role || 'member';
	}

	function getParticipantName(userId: string): string {
		const participant = $participants.find(p => p.userId === userId);
		return participant?.user?.name || userId.substring(0, 8);
	}

	function formatTime(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
	}

	// Export public API
	export function sendMessage(text: string): void {
		messageInput = text;
		handleSendMessage();
	}

	export function sendShout(text: string): void {
		shoutInput = text;
		handleSendShout();
	}

	export function sendSmokeSignal(message: string): void {
		handleSmokeSignal(message);
	}

	export function getRoomInfo() {
		return {
			roomName,
			sessionId: $session?.sessionId,
			memberCount: $participants.length,
			maxMembers: maxMembersNum,
			isHost: $isHost
		};
	}
</script>

<div class="room-embed">
	{#if !isInitialized}
		<div class="loading">
			<div class="spinner"></div>
			<p>Joining room...</p>
		</div>
	{:else}
		<div class="room-header">
			<div class="room-info">
				<h2>{roomName}</h2>
				<span class="member-count">
					{$participants.length} / {maxMembersNum} members
				</span>
			</div>
			{#if !$isConnected}
				<div class="status-badge reconnecting">Reconnecting...</div>
			{:else}
				<div class="status-badge connected">Connected</div>
			{/if}
		</div>

		<div class="tabs">
			<button
				class="tab"
				class:active={activeTab === 'chat'}
				on:click={() => activeTab = 'chat'}
			>
				💬 Chat
			</button>
			<button
				class="tab"
				class:active={activeTab === 'members'}
				on:click={() => activeTab = 'members'}
			>
				👥 Members
			</button>
			<button
				class="tab"
				class:active={activeTab === 'shouts'}
				on:click={() => activeTab = 'shouts'}
			>
				🔊 Shouts
			</button>
		</div>

		<div class="room-content">
			{#if activeTab === 'chat'}
				<div class="chat-section">
					<div class="messages">
						{#each messages as message (message.id)}
							<div class="message" class:own={message.fromUserId === getLocalUserId()}>
								<div class="message-header">
									<span class="sender">{getParticipantName(message.fromUserId)}</span>
									<span class="time">{formatTime(message.timestamp)}</span>
								</div>
								<div class="message-content">
									{#if 'mediaUrl' in message}
										{#if message.mediaType.startsWith('image/')}
											<img src={message.mediaUrl} alt="Shared media" />
										{:else if message.mediaType.startsWith('video/')}
											<video src={message.mediaUrl} controls />
										{/if}
										{#if message.payload?.caption}
											<p>{message.payload.caption}</p>
										{/if}
									{:else}
										<p>{message.payload}</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
					<div class="message-input">
						<input
							type="text"
							bind:value={messageInput}
							on:keydown={(e) => e.key === 'Enter' && handleSendMessage()}
							placeholder="Type a message..."
						/>
						<button on:click={handleSendMessage} disabled={!messageInput.trim()}>
							Send
						</button>
					</div>
				</div>
			{:else if activeTab === 'members'}
				<div class="members-section">
					<div class="presence-list">
						{#each $participants as participant (participant.id)}
							<div class="presence-item">
								<div class="avatar">
									{participant.user?.avatar || participant.userId.charAt(0).toUpperCase()}
								</div>
								<div class="presence-info">
									<div class="presence-name">
										{participant.user?.name || participant.userId.substring(0, 12)}
									</div>
									<div class="presence-role">
										{getParticipantRole(participant)}
									</div>
								</div>
								<div
									class="presence-status"
									class:online={participant.connectionStatus === 'connected'}
									class:offline={participant.connectionStatus === 'disconnected'}
								>
									{participant.connectionStatus === 'connected' ? '🟢' : '⚪'}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else if activeTab === 'shouts'}
				<div class="shouts-section">
					<div class="shouts-header">
						<p>Broadcast messages to all room members</p>
						<button class="btn-primary" on:click={() => showShoutDialog = true}>
							New Shout
						</button>
					</div>
					<div class="shouts-list">
						{#each shouts as shout (shout.id)}
							<div class="shout-item">
								<div class="shout-icon">🔊</div>
								<div class="shout-content">
									<div class="shout-message">{shout.message}</div>
									<div class="shout-meta">
										<span>{getParticipantName(shout.from)}</span>
										<span>•</span>
										<span>{formatTime(shout.timestamp)}</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Shout Dialog -->
		{#if showShoutDialog}
			<div class="dialog-overlay" on:click={() => showShoutDialog = false}>
				<div class="dialog" on:click|stopPropagation>
					<h3>Send a Shout</h3>
					<textarea
						bind:value={shoutInput}
						placeholder="Type your shout message..."
						rows="4"
					></textarea>
					<div class="dialog-actions">
						<button on:click={() => showShoutDialog = false}>Cancel</button>
						<button class="btn-primary" on:click={handleSendShout} disabled={!shoutInput.trim()}>
							Shout
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Smoke Signals (Ephemeral notifications) -->
		<div class="smoke-signals">
			{#each smokeSignals as signal (signal.id)}
				<div class="smoke-signal">
					💨 {signal.message}
				</div>
			{/each}
		</div>

		<!-- Quick Actions -->
		<div class="quick-actions">
			<button
				class="quick-action"
				on:click={() => handleSmokeSignal('👋 Hello!')}
				title="Send quick greeting"
			>
				👋
			</button>
			<button
				class="quick-action"
				on:click={() => handleSmokeSignal('👍 Agreed')}
				title="Send agreement"
			>
				👍
			</button>
			<button
				class="quick-action"
				on:click={() => handleSmokeSignal('🎉 Celebrate!')}
				title="Celebrate"
			>
				🎉
			</button>
		</div>
	{/if}
</div>

<style>
	.room-embed {
		width: 100%;
		max-width: 800px;
		height: 600px;
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		position: relative;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

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
		border-top: 4px solid #5b21b6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.room-header {
		background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%);
		color: white;
		padding: 1.25rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.room-info h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.member-count {
		font-size: 0.875rem;
		opacity: 0.9;
	}

	.status-badge {
		padding: 0.375rem 0.75rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.status-badge.connected {
		background: rgba(16, 185, 129, 0.2);
		color: #10b981;
	}

	.status-badge.reconnecting {
		background: rgba(245, 158, 11, 0.2);
		color: #f59e0b;
	}

	.tabs {
		display: flex;
		border-bottom: 1px solid #e5e7eb;
		background: #f9fafb;
	}

	.tab {
		flex: 1;
		padding: 0.875rem;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		color: #6b7280;
		transition: all 0.2s;
	}

	.tab:hover {
		background: #f3f4f6;
	}

	.tab.active {
		color: #5b21b6;
		border-bottom: 2px solid #5b21b6;
		background: white;
	}

	.room-content {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.chat-section,
	.members-section,
	.shouts-section {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.message {
		display: flex;
		flex-direction: column;
		max-width: 70%;
	}

	.message.own {
		align-self: flex-end;
	}

	.message-header {
		display: flex;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: #6b7280;
		margin-bottom: 0.25rem;
	}

	.message.own .message-header {
		flex-direction: row-reverse;
	}

	.sender {
		font-weight: 600;
	}

	.message-content {
		background: #f3f4f6;
		padding: 0.75rem;
		border-radius: 12px;
		word-wrap: break-word;
	}

	.message.own .message-content {
		background: #5b21b6;
		color: white;
	}

	.message-content p {
		margin: 0;
	}

	.message-content img,
	.message-content video {
		max-width: 100%;
		border-radius: 8px;
		margin-bottom: 0.5rem;
	}

	.message-input {
		display: flex;
		gap: 0.5rem;
		padding: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.message-input input {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 0.875rem;
	}

	.message-input button {
		padding: 0.75rem 1.5rem;
		background: #5b21b6;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.message-input button:hover:not(:disabled) {
		background: #7c3aed;
	}

	.message-input button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.presence-list {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}

	.presence-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: 8px;
		margin-bottom: 0.5rem;
		transition: background 0.2s;
	}

	.presence-item:hover {
		background: #f9fafb;
	}

	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #5b21b6, #7c3aed);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
	}

	.presence-info {
		flex: 1;
	}

	.presence-name {
		font-weight: 600;
		color: #111827;
	}

	.presence-role {
		font-size: 0.75rem;
		color: #6b7280;
		text-transform: capitalize;
	}

	.presence-status {
		font-size: 1.25rem;
	}

	.shouts-section {
		padding: 1rem;
	}

	.shouts-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.shouts-header p {
		margin: 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.shouts-list {
		flex: 1;
		overflow-y: auto;
	}

	.shout-item {
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		background: #fef3c7;
		border-left: 4px solid #f59e0b;
		border-radius: 8px;
		margin-bottom: 0.75rem;
	}

	.shout-icon {
		font-size: 1.5rem;
	}

	.shout-content {
		flex: 1;
	}

	.shout-message {
		font-weight: 600;
		color: #111827;
		margin-bottom: 0.25rem;
	}

	.shout-meta {
		font-size: 0.75rem;
		color: #6b7280;
		display: flex;
		gap: 0.5rem;
	}

	.btn-primary {
		padding: 0.5rem 1rem;
		background: #5b21b6;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-primary:hover:not(:disabled) {
		background: #7c3aed;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.dialog-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.dialog {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		min-width: 400px;
		max-width: 90%;
	}

	.dialog h3 {
		margin: 0 0 1rem 0;
	}

	.dialog textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.875rem;
		resize: vertical;
		margin-bottom: 1rem;
	}

	.dialog-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.dialog-actions button {
		padding: 0.5rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		background: white;
		transition: all 0.2s;
	}

	.dialog-actions button:hover {
		background: #f9fafb;
	}

	.smoke-signals {
		position: absolute;
		top: 5rem;
		right: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		z-index: 50;
	}

	.smoke-signal {
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		animation: fadeInOut 5s ease-in-out;
	}

	@keyframes fadeInOut {
		0% {
			opacity: 0;
			transform: translateY(10px);
		}
		10% {
			opacity: 1;
			transform: translateY(0);
		}
		90% {
			opacity: 1;
			transform: translateY(0);
		}
		100% {
			opacity: 0;
			transform: translateY(-10px);
		}
	}

	.quick-actions {
		position: absolute;
		bottom: 5rem;
		right: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		z-index: 50;
	}

	.quick-action {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: none;
		background: white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		font-size: 1.5rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.quick-action:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	@media (max-width: 768px) {
		.room-embed {
			max-width: 100%;
			height: 100vh;
			border-radius: 0;
		}

		.message {
			max-width: 85%;
		}

		.dialog {
			min-width: 90%;
		}
	}
</style>
