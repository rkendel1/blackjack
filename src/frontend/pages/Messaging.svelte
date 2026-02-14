<script>
	import '$frontend/sl-messaging.upgraded.svelte';
	import '../global.css';

	// Get session ID from URL if joining an existing session
	let sessionId = '';
	if (typeof window !== 'undefined') {
		const urlParams = new URLSearchParams(window.location.search);
		sessionId = urlParams.get('session') || '';
	}
</script>

<svelte:head>
	<title>StackLive Messaging - sl-messaging</title>
	<meta name="description" content="Minimal messaging component" />
</svelte:head>

<div class="container">
	<header>
		<h1>💬 sl-messaging Component</h1>
		<p>Minimal messaging web component</p>
	</header>

	<main>
		<sl-messaging embedId="messaging-demo" sessionId={sessionId} enableVideo="true" enableAudio="true"></sl-messaging>
	</main>
</div>

<style>
	.container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
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
		width: 100%;
		max-width: 500px;
		display: flex;
		justify-content: center;
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
