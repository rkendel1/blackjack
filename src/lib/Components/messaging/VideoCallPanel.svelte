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
					></video>
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
			<video bind:this={localVideoElement} autoplay playsinline muted class="video"></video>
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
		background: #000;
		color: white;
	}

	.header {
		padding: 1rem;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
		z-index: 10;
	}

	.call-info {
		text-align: center;
	}

	.name {
		font-weight: 600;
		font-size: 1.125rem;
		margin-bottom: 0.25rem;
	}

	.status {
		font-size: 0.875rem;
		color: #34c759;
	}

	.video-grid {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.5rem;
		padding: 0.5rem;
		position: relative;
		overflow: hidden;
	}

	.waiting-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: rgba(255, 255, 255, 0.7);
	}

	.waiting-message p:first-child {
		font-size: 3rem;
		margin: 0 0 1rem 0;
	}

	.waiting-message p {
		margin: 0;
		font-size: 1rem;
	}

	.video-container {
		position: relative;
		background: #1c1c1e;
		border-radius: 12px;
		overflow: hidden;
	}

	.video-container.remote {
		width: 100%;
		height: 100%;
	}

	.video-container.local {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		width: 120px;
		height: 160px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		z-index: 5;
	}

	.video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.video-label {
		position: absolute;
		bottom: 0.5rem;
		left: 0.5rem;
		background: rgba(0, 0, 0, 0.6);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
	}

	.controls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1.5rem;
		padding: 1.5rem;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
	}

	.control-button {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		border: none;
		background: rgba(255, 255, 255, 0.2);
		color: white;
		font-size: 1.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.control-button:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(1.05);
	}

	.control-button:active {
		transform: scale(0.95);
	}

	.control-button.disabled {
		background: rgba(255, 59, 48, 0.3);
	}

	.control-button.end-call {
		background: #ff3b30;
		width: 64px;
		height: 64px;
	}

	.control-button.end-call:hover {
		background: #d62d20;
	}

	@media (max-width: 768px) {
		.video-container.local {
			width: 100px;
			height: 133px;
		}
	}
</style>
