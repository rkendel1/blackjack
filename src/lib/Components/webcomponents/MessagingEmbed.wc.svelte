<svelte:options customElement="sl-messaging" />

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { useStackLiveInteraction } from '$lib/multiplayer/useStackLiveInteraction';
	import type { StackLiveInteractionConfig } from '$lib/multiplayer/useStackLiveInteraction';
	import type { ChatMessage, MediaMessage } from '$lib/multiplayer/types';
	import ConversationList from '../messaging/ConversationList.svelte';
	import ChatView from '../messaging/ChatView.svelte';
	import VideoCallPanel from '../messaging/VideoCallPanel.svelte';

	// Exposed attributes (all strings for web components)
	export let embedId: string = 'messaging-app';
	export let sessionId: string = '';
	export let enableVideo: string = 'true';
	export let enableAudio: string = 'true';

	// Convert string attributes to booleans
	$: enableVideoBool = enableVideo === 'true';
	$: enableAudioBool = enableAudio === 'true';
	$: sessionIdOrUndefined = sessionId || undefined;

	// State
	let currentView: 'inbox' | 'chat' | 'video' = 'inbox';
	let selectedConversationId: string | null = null;
	let isInitialized = false;

	// Configure interaction session
	$: config = {
		embedId,
		type: 'collaborative' as const,
		sessionId: sessionIdOrUndefined,
		maxParticipants: 10,
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
		localStream,
		remoteStreams,
		start,
		connect,
		send,
		getMessages,
		getLocalUserId
	} = interaction);

	// Messages store for current conversation
	let messages: (ChatMessage | MediaMessage)[] = [];

	onMount(async () => {
		if (sessionIdOrUndefined) {
			// Join existing session
			const success = await connect({ role: 'player' });
			isInitialized = success;
		} else {
			// Create new session as host
			const newSession = await start();
			isInitialized = !!newSession;
		}

		// Set up message refresh
		const interval = setInterval(() => {
			if ($session && selectedConversationId) {
				messages = getMessages({ limit: 100 });
			}
		}, 1000);

		// Dispatch ready event
		dispatchEvent(
			new CustomEvent('ready', {
				detail: { embedId, sessionId: $session?.sessionId }
			})
		);

		return () => {
			clearInterval(interval);
		};
	});

	onDestroy(() => {
		interaction.destroy();
	});

	function handleSelectConversation(conversationId: string) {
		selectedConversationId = conversationId;
		currentView = 'chat';
		// Load messages for this conversation
		if ($session) {
			messages = getMessages({ limit: 100 });
		}
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

	function handleSendMessage(text: string) {
		if (!text.trim()) return;
		send({
			type: 'chat',
			payload: text.trim()
		});
	}

	function handleSendMedia(mediaUrl: string, mediaType: string, caption?: string) {
		send({
			type: 'media',
			payload: { caption },
			mediaUrl,
			mediaType
		});
	}

	// Get conversation info
	$: conversationName = selectedConversationId
		? $participants.find((p) => p.userId === selectedConversationId)?.user?.name ||
			selectedConversationId
		: '';
</script>

<div class="messaging-embed">
	{#if !isInitialized}
		<div class="loading">
			<div class="spinner"></div>
			<p>Connecting...</p>
		</div>
	{:else if currentView === 'inbox'}
		<ConversationList
			participants={$participants}
			sessionInfo={$session}
			onSelectConversation={handleSelectConversation}
		/>
	{:else if currentView === 'chat'}
		<ChatView
			{messages}
			conversationName={conversationName}
			currentUserId={getLocalUserId()}
			onBack={handleBackToInbox}
			onSendMessage={handleSendMessage}
			onSendMedia={handleSendMedia}
			onStartVideoCall={handleStartVideoCall}
		/>
	{:else if currentView === 'video'}
		<VideoCallPanel
			conversationName={conversationName}
			localStream={$localStream}
			remoteStreams={$remoteStreams}
			onEndCall={handleEndVideoCall}
		/>
	{/if}

	{#if !$isConnected}
		<div class="connection-banner">
			<span>⚠️ Reconnecting...</span>
		</div>
	{/if}
</div>

<style>
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
		border-top: 4px solid #007aff;
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

	.connection-banner {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		background: #ff9800;
		color: white;
		padding: 0.5rem;
		text-align: center;
		font-size: 0.875rem;
		z-index: 1000;
	}

	@media (max-width: 768px) {
		.messaging-embed {
			max-width: 100%;
			height: 100vh;
			border-radius: 0;
		}
	}
</style>
