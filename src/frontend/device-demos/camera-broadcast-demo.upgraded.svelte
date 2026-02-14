<svelte:options customElement="sl-camera-demo" />

<script lang="ts">
	import { useStackLiveDevice } from '../../backend/device-runtime/useStackLiveDevice';
	import { onMount, onDestroy } from 'svelte';

	export let embedid = 'camera-demo';

	const device = useStackLiveDevice({ embedId: embedid });

	let videoElement: HTMLVideoElement;
	let stream: MediaStream | null = null;
	let isActive = false;
	let facingMode: 'user' | 'environment' = 'user';

	async function startCamera() {
		try {
			const state = await device.camera.start();
			if (state.data?.stream) {
				stream = state.data.stream as MediaStream;
				if (videoElement) {
					videoElement.srcObject = stream;
					await videoElement.play();
					isActive = true;
				}
			}
		} catch (error) {
			console.error('Camera error:', error);
			alert('Camera access denied or not available');
		}
	}

	async function stopCamera() {
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
			stream = null;
		}
		if (videoElement) {
			videoElement.srcObject = null;
		}
		await device.camera.stop();
		isActive = false;
	}

	async function switchCamera() {
		await stopCamera();
		facingMode = facingMode === 'user' ? 'environment' : 'user';
		await startCamera();
	}

	function takeSnapshot() {
		if (!videoElement) return;

		const canvas = document.createElement('canvas');
		canvas.width = videoElement.videoWidth;
		canvas.height = videoElement.videoHeight;
		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.drawImage(videoElement, 0, 0);
			// Download snapshot
			canvas.toBlob(blob => {
				if (blob) {
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = `snapshot-${Date.now()}.png`;
					a.click();
					URL.revokeObjectURL(url);
				}
			});
		}
	}

	onDestroy(() => {
		stopCamera();
		device.destroy();
	});
</script>

<div class="camera-demo">
	<h2>📷 Camera Broadcast Demo</h2>
	<p>Access your device camera for streaming and snapshots</p>

	<div class="video-container">
		<video 
			bind:this={videoElement}
			class:active={isActive}
			autoplay
			playsinline
			muted
		/>
		{#if !isActive}
			<div class="placeholder">
				<div class="icon">📷</div>
				<p>Camera inactive</p>
			</div>
		{/if}
	</div>

	<div class="controls">
		{#if !isActive}
			<button on:click={startCamera} class="primary">
				Start Camera
			</button>
		{:else}
			<button on:click={stopCamera} class="danger">
				Stop Camera
			</button>
			<button on:click={switchCamera}>
				Switch Camera
			</button>
			<button on:click={takeSnapshot}>
				📸 Snapshot
			</button>
		{/if}
	</div>

	<div class="info">
		<div class="status-item">
			<span class="label">Status:</span>
			<span class="value" class:active={isActive}>
				{isActive ? '● Active' : '○ Inactive'}
			</span>
		</div>
		<div class="status-item">
			<span class="label">Facing:</span>
			<span class="value">{facingMode === 'user' ? 'Front' : 'Back'}</span>
		</div>
		<div class="status-item">
			<span class="label">Supported:</span>
			<span class="value">{device.camera.isSupported() ? '✓ Yes' : '✗ No'}</span>
		</div>
	</div>
</div>

<style>
	.camera-demo {
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		max-width: 600px;
		margin: 0 auto;
	}

	h2 {
		text-align: center;
		color: #333;
		margin-bottom: 10px;
	}

	p {
		text-align: center;
		color: #666;
		margin-bottom: 20px;
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
		display: none;
	}

	video.active {
		display: block;
	}

	.placeholder {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: #666;
	}

	.icon {
		font-size: 64px;
		margin-bottom: 10px;
	}

	.controls {
		display: flex;
		gap: 10px;
		justify-content: center;
		flex-wrap: wrap;
		margin-bottom: 20px;
	}

	button {
		padding: 12px 24px;
		background: #007AFF;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	button:hover {
		background: #0051D5;
	}

	button.primary {
		background: #34C759;
	}

	button.primary:hover {
		background: #28A745;
	}

	button.danger {
		background: #FF3B30;
	}

	button.danger:hover {
		background: #D70015;
	}

	.info {
		background: #f5f5f7;
		padding: 15px;
		border-radius: 12px;
		display: flex;
		gap: 20px;
		justify-content: space-around;
	}

	.status-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 5px;
	}

	.label {
		font-size: 12px;
		color: #666;
		font-weight: 600;
	}

	.value {
		font-size: 14px;
		color: #333;
		font-weight: 700;
	}

	.value.active {
		color: #34C759;
	}
</style>
