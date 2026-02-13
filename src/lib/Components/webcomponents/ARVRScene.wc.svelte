<svelte:options customElement="sl-arvr-scene" />

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { useStackLiveARVR } from '$lib/backends/arvr';

	// Exposed attributes
	export let userId: string = '';
	export let sessionId: string = '';
	export let mode: 'ar' | 'vr' | 'inline' = 'inline';
	export let avatarEnabled: string = 'true';
	export let filtersEnabled: string = 'true';
	export let spatialEnabled: string = 'true';
	export let gestureEnabled: string = 'true';
	export let width: string = '100%';
	export let height: string = '600px';

	let canvasElement: HTMLCanvasElement;
	let videoElement: HTMLVideoElement;
	let cameraStream: MediaStream | null = null;
	let arvr: ReturnType<typeof useStackLiveARVR> | null = null;
	let initialized = false;

	// Convert string attributes to boolean
	$: avatarEnabledBool = avatarEnabled === 'true';
	$: filtersEnabledBool = filtersEnabled === 'true';
	$: spatialEnabledBool = spatialEnabled === 'true';
	$: gestureEnabledBool = gestureEnabled === 'true';

	onMount(async () => {
		if (!userId) {
			userId = `user-${Math.random().toString(36).substring(2, 9)}`;
		}
		if (!sessionId) {
			sessionId = `session-${Date.now()}`;
		}

		// Initialize AR/VR hook using backend
		arvr = useStackLiveARVR(userId, sessionId);

		// Request camera access
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

		// Setup canvas for rendering
		const ctx = canvasElement.getContext('2d');
		if (ctx && videoElement) {
			// Simple render loop - draw video to canvas
			const render = () => {
				if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
					ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
				}
				requestAnimationFrame(render);
			};
			render();
		}

		// Configure features
		if (arvr && avatarEnabledBool) arvr.setAvatarEnabled(true);
		if (arvr && filtersEnabledBool) arvr.setFiltersEnabled(true);
		if (arvr && spatialEnabledBool) arvr.setSpatialEnabled(true);
		if (arvr && gestureEnabledBool) arvr.setGestureDetectionEnabled(true);

		// Auto-start session if mode is specified
		if (mode === 'ar' && arvr) {
			await arvr.startARSession();
		} else if (mode === 'vr' && arvr) {
			await arvr.startVRSession();
		}

		initialized = true;

		// Dispatch ready event
		dispatchEvent(new CustomEvent('ready', { detail: { userId, sessionId } }));
	});

	onDestroy(async () => {
		// Cleanup camera stream
		if (cameraStream) {
			cameraStream.getTracks().forEach((track) => track.stop());
		}

		// Cleanup AR/VR
		if (arvr) {
			await arvr.cleanup();
		}
	});

	// Public methods exposed to web component users
	export function startAR(): Promise<boolean> {
		if (!arvr) return Promise.resolve(false);
		return arvr.startARSession();
	}

	export function startVR(): Promise<boolean> {
		if (!arvr) return Promise.resolve(false);
		return arvr.startVRSession();
	}

	export function endSession(): Promise<void> {
		if (!arvr) return Promise.resolve();
		return arvr.endSession();
	}

	export function loadAvatar(modelUrl: string, customizations?: any) {
		if (!arvr) return Promise.resolve(null);
		return arvr.loadAvatar(modelUrl, customizations);
	}

	export function applyFilter(filterId: string) {
		if (!arvr) return;
		return arvr.applyFilter(filterId);
	}

	export function placeObject(objectId: string, position: [number, number, number]) {
		if (!arvr) return;
		return arvr.placeObject(objectId, position);
	}
</script>

<div class="arvr-scene" style="width: {width}; height: {height};">
	<canvas bind:this={canvasElement} width="800" height="600" />
	<video bind:this={videoElement} autoplay playsinline muted style="display: none;" />

	{#if initialized && arvr}
		<div class="overlay-info">
			<div class="status">
				<span class="indicator" class:active={$arvr.sessionState.active}></span>
				{$arvr.sessionState.active ? $arvr.sessionState.mode?.toUpperCase() : 'INACTIVE'}
			</div>
			{#if $arvr.sessionState.avatarEnabled}
				<div class="feature-badge">👤 {$arvr.avatars.size} avatars</div>
			{/if}
			{#if $arvr.sessionState.spatialEnabled}
				<div class="feature-badge">🎯 {$arvr.spatialObjects.size} objects</div>
			{/if}
			{#if $arvr.lastGesture}
				<div class="feature-badge">👋 {$arvr.lastGesture.gesture}</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.arvr-scene {
		position: relative;
		background: #000;
		border-radius: 8px;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	canvas {
		max-width: 100%;
		max-height: 100%;
		display: block;
	}

	.overlay-info {
		position: absolute;
		top: 16px;
		right: 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		align-items: flex-end;
	}

	.status {
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 8px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #ef4444;
	}

	.indicator.active {
		background: #10b981;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.feature-badge {
		background: rgba(255, 255, 255, 0.95);
		color: #1f2937;
		padding: 6px 10px;
		border-radius: 16px;
		font-size: 11px;
		font-weight: 600;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
</style>
