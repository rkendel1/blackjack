<script lang="ts">
	import { onMount } from 'svelte';

	export let conversationName: string;
	export let localStream: MediaStream | null;
	export let remoteStreams: Map<string, MediaStream>;
	export let onEndCall: () => void;

	let localVideoElement: HTMLVideoElement;
	let isAudioEnabled = true;
	let isVideoEnabled = true;

	// Svelte action to attach stream to video element
	function attachStream(element: HTMLVideoElement, stream: MediaStream) {
		element.srcObject = stream;
		return {
			update(newStream: MediaStream) {
				element.srcObject = newStream;
			},
			destroy() {
				element.srcObject = null;
			}
		};
	}

	onMount(() => {
		// Setup local video
		if (localStream && localVideoElement) {
			localVideoElement.srcObject = localStream;
		}
	});

	function toggleAudio() {
		if (localStream) {
			const audioTrack = localStream.getAudioTracks()[0];
			if (audioTrack) {
				audioTrack.enabled = !audioTrack.enabled;
				isAudioEnabled = audioTrack.enabled;
			}
		}
	}

	function toggleVideo() {
		if (localStream) {
			const videoTrack = localStream.getVideoTracks()[0];
			if (videoTrack) {
				videoTrack.enabled = !videoTrack.enabled;
				isVideoEnabled = videoTrack.enabled;
			}
		}
	}
</script>

<div class="video-call-panel">
	<div class="header">
		<div class="call-info">
			<div class="name">{conversationName}</div>
			<div class="status">Connected</div>
		</div>
	</div>

	<div class="video-grid">
		{#if remoteStreams.size > 0}
			{#each [...remoteStreams.entries()] as [userId, stream]}
				<div class="video-container remote">
					<video
						use:attachStream={stream}
						autoplay
						playsinline
						class="video"
						aria-label="Remote video stream from {userId}"
					>
						<track kind="captions" />
					</video>
					<div class="video-label">
						{userId.substring(0, 8)}
					</div>
				</div>
			{/each}
		{:else}
			<div class="waiting-message">
				<p>📞</p>
				<p>Waiting for {conversationName} to join...</p>
			</div>
		{/if}

		<div class="video-container local">
			<video bind:this={localVideoElement} autoplay playsinline muted class="video" aria-label="Local video stream">
				<track kind="captions" />
			</video>
			<div class="video-label">You</div>
		</div>
	</div>

	<div class="controls">
		<button
			class="control-button {isAudioEnabled ? '' : 'disabled'}"
			on:click={toggleAudio}
			title={isAudioEnabled ? 'Mute' : 'Unmute'}
		>
			<span>{isAudioEnabled ? '🎤' : '🔇'}</span>
		</button>

		<button class="control-button end-call" on:click={onEndCall} title="End call">
			<span>📞</span>
		</button>

		<button
			class="control-button {isVideoEnabled ? '' : 'disabled'}"
			on:click={toggleVideo}
			title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
		>
			<span>{isVideoEnabled ? '📹' : '🚫'}</span>
		</button>
	</div>
</div>

<style>
	.video-call-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #000000;
		color: white;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
	}

	.header {
		padding: 1.25rem 1rem 1rem 1rem;
		background: linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%);
		backdrop-filter: blur(20px);
		z-index: 10;
		position: relative;
	}

	.call-info {
		text-align: center;
	}

	.name {
		font-weight: 600;
		font-size: 1.25rem;
		margin-bottom: 0.375rem;
		letter-spacing: -0.3px;
	}

	.status {
		font-size: 0.875rem;
		color: #34c759;
		font-weight: 500;
		letter-spacing: -0.1px;
	}

	.video-grid {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr;
		gap: 0;
		position: relative;
		overflow: hidden;
	}

	.waiting-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: rgba(255, 255, 255, 0.8);
	}

	.waiting-message p:first-child {
		font-size: 4rem;
		margin: 0 0 1.5rem 0;
	}

	.waiting-message p {
		margin: 0;
		font-size: 1.125rem;
		letter-spacing: -0.2px;
	}

	.video-container {
		position: relative;
		background: #1c1c1e;
		overflow: hidden;
	}

	.video-container.remote {
		width: 100%;
		height: 100%;
	}

	.video-container.local {
		position: absolute;
		top: 1.25rem;
		right: 1.25rem;
		width: 100px;
		height: 140px;
		border-radius: 16px;
		border: 2px solid rgba(255, 255, 255, 0.25);
		z-index: 5;
		overflow: hidden;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	}

	.video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.video-label {
		position: absolute;
		bottom: 0.625rem;
		left: 0.625rem;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(10px);
		padding: 0.375rem 0.625rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: -0.1px;
	}

	.controls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 2rem;
		padding: 2rem 1.5rem;
		background: linear-gradient(0deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%);
		backdrop-filter: blur(20px);
		position: relative;
	}

	.control-button {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		border: none;
		background: rgba(60, 60, 67, 0.6);
		backdrop-filter: blur(20px);
		color: white;
		font-size: 1.625rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.control-button:hover {
		background: rgba(80, 80, 87, 0.7);
		transform: scale(1.05);
	}

	.control-button:active {
		transform: scale(0.95);
	}

	.control-button.disabled {
		background: rgba(255, 59, 48, 0.6);
	}

	.control-button.disabled:hover {
		background: rgba(255, 59, 48, 0.7);
	}

	.control-button.end-call {
		background: #ff3b30;
		width: 68px;
		height: 68px;
		font-size: 1.75rem;
		box-shadow: 0 6px 16px rgba(255, 59, 48, 0.4);
	}

	.control-button.end-call:hover {
		background: #d62d20;
		box-shadow: 0 8px 20px rgba(255, 59, 48, 0.5);
	}

	@media (max-width: 768px) {
		.video-container.local {
			width: 90px;
			height: 120px;
			top: 1rem;
			right: 1rem;
		}

		.controls {
			gap: 1.5rem;
			padding: 1.5rem 1rem;
		}

		.control-button {
			width: 54px;
			height: 54px;
		}

		.control-button.end-call {
			width: 60px;
			height: 60px;
		}
	}
</style>
