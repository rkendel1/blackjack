<script lang="ts">
	import { onMount } from 'svelte';
	import ARVRControlPanel from '$frontend/arvr/ARVRControlPanel.svelte';
	import { useStackLiveARVR } from '../../backend/multiplayer';

	let videoElement: HTMLVideoElement;
	let cameraStream: MediaStream | null = null;
	let userId = `user-${Math.random().toString(36).substring(2, 9)}`;
	let sessionId = `demo-session-${Date.now()}`;

	const arvr = useStackLiveARVR(userId, sessionId);

	onMount(async () => {
		// Request camera access for AR/VR features
		try {
			cameraStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'user' },
				audio: false
			});

			if (videoElement && cameraStream) {
				videoElement.srcObject = cameraStream;
			}
		} catch (error) {
			console.error('Failed to access camera:', error);
		}

		return () => {
			// Cleanup camera stream
			if (cameraStream) {
				cameraStream.getTracks().forEach((track) => track.stop());
			}
		};
	});
</script>

<svelte:head>
	<title>AR/VR Demo - StackLive</title>
</svelte:head>

<div class="demo-container">
	<header>
		<h1>🎭 StackLive AR/VR Demo</h1>
		<p class="subtitle">
			Experience immersive AR/VR capabilities with avatars, filters, and spatial interactions
		</p>
	</header>

	<div class="demo-content">
		<div class="video-section">
			<h2>Camera Preview</h2>
			<div class="video-container">
				<video bind:this={videoElement} autoplay playsinline muted></video>
				{#if !cameraStream}
					<div class="no-camera">
						<p>📷 Camera access required</p>
						<p class="help-text">Please allow camera access to use AR/VR features</p>
					</div>
				{/if}
			</div>

			<div class="session-info">
				<p><strong>User ID:</strong> <code>{userId}</code></p>
				<p><strong>Session ID:</strong> <code>{sessionId}</code></p>
				<p>
					<strong>Session Active:</strong>
					<span class:active={$arvr.sessionState.active}>
						{$arvr.sessionState.active ? '✓ Yes' : '✗ No'}
					</span>
				</p>
				{#if $arvr.sessionState.active}
					<p><strong>Mode:</strong> {$arvr.sessionState.mode?.toUpperCase()}</p>
				{/if}
			</div>
		</div>

		<div class="control-section">
			<ARVRControlPanel {userId} {sessionId} {videoElement} />
		</div>
	</div>

	<div class="features-section">
		<h2>✨ Available Features</h2>
		<div class="features-grid">
			<div class="feature-card">
				<div class="feature-icon">🧑‍🎤</div>
				<h3>3D Avatars</h3>
				<p>Load and customize 3D avatars with expressions, clothing, and accessories</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">🎨</div>
				<h3>AR Filters</h3>
				<p>Apply real-time face, body, and environment filters</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">👋</div>
				<h3>Gesture Detection</h3>
				<p>Detect hand gestures, face expressions, and body poses</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">🎯</div>
				<h3>Spatial Interactions</h3>
				<p>Place, move, and interact with objects in 3D space</p>
			</div>
		</div>
	</div>

	<div class="info-section">
		<h2>📚 Documentation</h2>
		<p>
			For complete documentation, usage examples, and integration guides, see
			<a href="/ARVR_DOCUMENTATION.md" target="_blank">ARVR_DOCUMENTATION.md</a>
		</p>

		<h3>Quick Start</h3>
		<pre><code>{`import { useStackLiveARVR } from '../../backend/multiplayer';

const arvr = useStackLiveARVR(userId, sessionId);

// Start AR session
await arvr.startARSession();

// Load avatar
await arvr.loadAvatar('/models/avatar.glb');

// Apply filter
arvr.applyFilter('beauty-smooth');

// Enable gesture detection
await arvr.startGestureDetection(videoElement);`}</code></pre>
	</div>

	<footer>
		<p>
			Built with ❤️ using StackLive Realtime Multiplayer Platform
		</p>
		<p class="note">
			Note: WebXR support required for full AR/VR experience. Fallback rendering available on
			unsupported devices.
		</p>
	</footer>
</div>

<style>
	.demo-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
			Cantarell, sans-serif;
	}

	header {
		text-align: center;
		margin-bottom: 40px;
	}

	h1 {
		font-size: 36px;
		font-weight: 700;
		color: #2d3748;
		margin: 0 0 10px 0;
	}

	.subtitle {
		font-size: 18px;
		color: #718096;
		margin: 0;
	}

	.demo-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 30px;
		margin-bottom: 40px;
	}

	.video-section h2,
	.features-section h2,
	.info-section h2 {
		font-size: 24px;
		font-weight: 600;
		color: #2d3748;
		margin: 0 0 20px 0;
	}

	.video-container {
		position: relative;
		width: 100%;
		aspect-ratio: 4/3;
		background: #000;
		border-radius: 12px;
		overflow: hidden;
		margin-bottom: 20px;
	}

	video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.no-camera {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: #1a202c;
		color: #fff;
		text-align: center;
	}

	.no-camera p {
		margin: 8px 0;
		font-size: 18px;
	}

	.help-text {
		font-size: 14px !important;
		color: #cbd5e0;
	}

	.session-info {
		background: #f7fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 16px;
	}

	.session-info p {
		margin: 8px 0;
		font-size: 14px;
		color: #4a5568;
	}

	.session-info strong {
		color: #2d3748;
	}

	.session-info code {
		background: #edf2f7;
		padding: 2px 6px;
		border-radius: 3px;
		font-size: 12px;
		font-family: 'Courier New', monospace;
	}

	.session-info .active {
		color: #48bb78;
		font-weight: 600;
	}

	.features-section {
		margin-bottom: 40px;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 20px;
	}

	.feature-card {
		background: #fff;
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		padding: 24px;
		text-align: center;
		transition: all 0.3s;
	}

	.feature-card:hover {
		border-color: #4299e1;
		transform: translateY(-4px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	}

	.feature-icon {
		font-size: 48px;
		margin-bottom: 12px;
	}

	.feature-card h3 {
		font-size: 18px;
		font-weight: 600;
		color: #2d3748;
		margin: 0 0 8px 0;
	}

	.feature-card p {
		font-size: 14px;
		color: #718096;
		margin: 0;
		line-height: 1.5;
	}

	.info-section {
		background: #f7fafc;
		border-radius: 12px;
		padding: 24px;
		margin-bottom: 40px;
	}

	.info-section h3 {
		font-size: 18px;
		font-weight: 600;
		color: #2d3748;
		margin: 20px 0 12px 0;
	}

	.info-section p {
		font-size: 14px;
		color: #4a5568;
		line-height: 1.6;
	}

	.info-section a {
		color: #4299e1;
		text-decoration: none;
		font-weight: 600;
	}

	.info-section a:hover {
		text-decoration: underline;
	}

	pre {
		background: #2d3748;
		color: #e2e8f0;
		padding: 16px;
		border-radius: 8px;
		overflow-x: auto;
		margin: 12px 0;
	}

	code {
		font-family: 'Courier New', monospace;
		font-size: 13px;
		line-height: 1.5;
	}

	footer {
		text-align: center;
		padding: 20px 0;
		border-top: 2px solid #e2e8f0;
		margin-top: 40px;
	}

	footer p {
		margin: 8px 0;
		color: #718096;
		font-size: 14px;
	}

	.note {
		font-size: 12px !important;
		font-style: italic;
	}

	@media (max-width: 768px) {
		.demo-content {
			grid-template-columns: 1fr;
		}

		h1 {
			font-size: 28px;
		}

		.subtitle {
			font-size: 16px;
		}

		.features-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
