<svelte:options customElement="sl-arvr-avatar" />

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	// Exposed attributes
	export let userId: string = '';
	export let modelUrl: string = '/models/default-avatar.glb';
	export let skinTone: string = '#f0d5a8';
	export let bodyType: string = 'average';
	export let width: string = '300px';
	export let height: string = '400px';
	export let showInfo: string = 'true';

	let canvasElement: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;

	$: showInfoBool = showInfo === 'true';
	$: canvasWidth = parseInt(width) || 300;
	$: canvasHeight = parseInt(height) || 400;

	onMount(() => {
		ctx = canvasElement.getContext('2d');
		if (ctx) {
			renderAvatar();
		}
	});

	function renderAvatar() {
		if (!ctx) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		// Background
		ctx.fillStyle = '#f0f0f0';
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		// Avatar silhouette (simplified 2D representation)
		// Head
		ctx.fillStyle = skinTone;
		ctx.beginPath();
		ctx.arc(canvasWidth / 2, canvasHeight / 3, 50, 0, Math.PI * 2);
		ctx.fill();

		// Body
		ctx.fillStyle = '#4a5568';
		ctx.fillRect(canvasWidth / 2 - 40, canvasHeight / 3 + 30, 80, 100);

		// Arms
		ctx.fillRect(canvasWidth / 2 - 70, canvasHeight / 3 + 40, 25, 80);
		ctx.fillRect(canvasWidth / 2 + 45, canvasHeight / 3 + 40, 25, 80);

		// Legs
		ctx.fillRect(canvasWidth / 2 - 35, canvasHeight / 3 + 130, 25, 100);
		ctx.fillRect(canvasWidth / 2 + 10, canvasHeight / 3 + 130, 25, 100);

		// Label
		if (showInfoBool) {
			ctx.fillStyle = '#000';
			ctx.font = '14px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText(`Avatar: ${userId || 'Guest'}`, canvasWidth / 2, canvasHeight - 20);
			ctx.fillText(`Type: ${bodyType}`, canvasWidth / 2, canvasHeight - 5);
		}

		dispatchEvent(new CustomEvent('rendered', { detail: { userId, modelUrl } }));
	}

	$: if (ctx && (skinTone || bodyType || userId)) {
		renderAvatar();
	}

	onDestroy(() => {
		ctx = null;
	});
</script>

<div class="arvr-avatar" style="width: {width}; height: {height};">
	<canvas bind:this={canvasElement} width={canvasWidth} height={canvasHeight}></canvas>
</div>

<style>
	.arvr-avatar {
		display: inline-block;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		overflow: hidden;
		background: #fff;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
