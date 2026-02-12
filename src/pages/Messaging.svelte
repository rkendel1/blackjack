<script lang="ts">
	import MessagingEmbed from '$lib/Components/messaging/MessagingEmbed.svelte';
	import '../global.css';

	// Get session ID from URL if joining an existing session
	let sessionId: string | undefined;
	if (typeof window !== 'undefined') {
		const urlParams = new URLSearchParams(window.location.search);
		sessionId = urlParams.get('session') || undefined;
	}

	function copySessionLink() {
		const currentSession = sessionId || 'new-session';
		const link = `${window.location.origin}${window.location.pathname}?session=${currentSession}`;
		navigator.clipboard.writeText(link);
		alert('Session link copied to clipboard!');
	}
</script>

<svelte:head>
	<title>StackLive Messaging</title>
	<meta name="description" content="iMessage-style messaging embed for StackLive" />
</svelte:head>

<div class="container">
	<header>
		<h1>💬 StackLive Messaging</h1>
		<p>iMessage-style messaging with video calls, media sharing, and reactions</p>
	</header>

	<main>
		<div class="info-panel">
			<h2>Features</h2>
			<ul>
				<li>📥 Inbox with all conversations</li>
				<li>💬 Real-time text messaging</li>
				<li>📷 Photo and video sharing</li>
				<li>❤️ Message reactions</li>
				<li>📹 FaceTime-style video calls</li>
				<li>🔄 Cross-device sync</li>
			</ul>

			{#if sessionId}
				<div class="session-info">
					<p><strong>Joined Session:</strong> {sessionId.substring(0, 12)}...</p>
					<button on:click={copySessionLink}>Copy Invite Link</button>
				</div>
			{:else}
				<div class="session-info">
					<p>Starting new session...</p>
					<p class="hint">Share the session ID with others to connect</p>
				</div>
			{/if}
		</div>

		<div class="embed-container">
			<MessagingEmbed {sessionId} enableVideo={true} enableAudio={true} />
		</div>

		<div class="instructions">
			<h3>How to Use</h3>
			<ol>
				<li>Open this page in multiple browser windows or devices</li>
				<li>Copy the session ID from the inbox view</li>
				<li>Share it with others or paste it in another window</li>
				<li>Select a conversation to start messaging</li>
				<li>Click the video button to start a FaceTime-style call</li>
			</ol>

			<h3>Technology</h3>
			<div class="tech-stack">
				<div class="tech-item">
					<strong>WebRTC</strong>
					<p>Peer-to-peer video/audio streaming</p>
				</div>
				<div class="tech-item">
					<strong>StackLive Runtime</strong>
					<p>Real-time message synchronization</p>
				</div>
				<div class="tech-item">
					<strong>Svelte</strong>
					<p>Reactive UI components</p>
				</div>
			</div>
		</div>
	</main>
</div>

<style>
	.container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 2rem;
	}

	header {
		text-align: center;
		color: white;
		margin-bottom: 2rem;
	}

	header h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	header p {
		font-size: 1.25rem;
		opacity: 0.9;
	}

	main {
		max-width: 1400px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 300px 1fr 300px;
		gap: 2rem;
	}

	.info-panel,
	.instructions {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		height: fit-content;
	}

	.info-panel h2,
	.instructions h3 {
		margin-top: 0;
		color: #667eea;
	}

	.info-panel ul {
		list-style: none;
		padding: 0;
	}

	.info-panel li {
		padding: 0.5rem 0;
		font-size: 0.9375rem;
	}

	.session-info {
		margin-top: 1.5rem;
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 8px;
	}

	.session-info p {
		margin: 0.5rem 0;
		font-size: 0.875rem;
	}

	.session-info .hint {
		color: #666;
		font-size: 0.75rem;
	}

	.session-info button {
		width: 100%;
		margin-top: 0.75rem;
		padding: 0.5rem;
		background: #007aff;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background 0.2s;
	}

	.session-info button:hover {
		background: #0051d5;
	}

	.embed-container {
		display: flex;
		justify-content: center;
		align-items: flex-start;
	}

	.instructions ol {
		padding-left: 1.25rem;
	}

	.instructions li {
		margin: 0.75rem 0;
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	.tech-stack {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1rem;
	}

	.tech-item {
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 8px;
		border-left: 4px solid #667eea;
	}

	.tech-item strong {
		display: block;
		color: #667eea;
		margin-bottom: 0.25rem;
	}

	.tech-item p {
		margin: 0;
		font-size: 0.875rem;
		color: #666;
	}

	@media (max-width: 1200px) {
		main {
			grid-template-columns: 1fr;
		}

		.info-panel,
		.instructions {
			order: 1;
		}

		.embed-container {
			order: 0;
		}
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		header h1 {
			font-size: 1.75rem;
		}

		header p {
			font-size: 1rem;
		}
	}
</style>
