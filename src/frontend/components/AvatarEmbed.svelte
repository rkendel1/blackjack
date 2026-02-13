<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AvatarMessage } from '../../backend/multiplayer/types';

	export let avatar: AvatarMessage;
	export let width = 300;
	export let height = 400;

	let canvasElement: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;

	onMount(() => {
		ctx = canvasElement.getContext('2d');
		if (ctx) {
			renderAvatar();
		}
	});

	function renderAvatar() {
		if (!ctx) return;

		// Clear canvas
		ctx.clearRect(0, 0, width, height);

		// Draw placeholder avatar (in production, this would render a 3D model)
		// This is a simple 2D representation for demo purposes
		
		// Background
		ctx.fillStyle = '#f0f0f0';
		ctx.fillRect(0, 0, width, height);

		// Avatar silhouette
		ctx.fillStyle = '#4a5568';
		
		// Head
		ctx.beginPath();
		ctx.arc(width / 2, height / 3, 50, 0, Math.PI * 2);
		ctx.fill();

		// Body
		ctx.fillRect(width / 2 - 40, height / 3 + 30, 80, 100);

		// Arms
		ctx.fillRect(width / 2 - 70, height / 3 + 40, 25, 80);
		ctx.fillRect(width / 2 + 45, height / 3 + 40, 25, 80);

		// Legs
		ctx.fillRect(width / 2 - 35, height / 3 + 130, 25, 100);
		ctx.fillRect(width / 2 + 10, height / 3 + 130, 25, 100);

		// Display customizations
		if (avatar.customizations.skinTone) {
			ctx.fillStyle = avatar.customizations.skinTone;
			ctx.beginPath();
			ctx.arc(width / 2, height / 3, 50, 0, Math.PI * 2);
			ctx.fill();
		}

		// Label
		ctx.fillStyle = '#000';
		ctx.font = '14px sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText(`Avatar: ${avatar.userId}`, width / 2, height - 20);

		// Customization info
		if (avatar.customizations.bodyType) {
			ctx.fillText(`Type: ${avatar.customizations.bodyType}`, width / 2, height - 5);
		}
	}

	$: if (avatar && ctx) {
		renderAvatar();
	}

	onDestroy(() => {
		ctx = null;
	});
</script>

<div class="avatar-embed">
	<canvas bind:this={canvasElement} {width} {height}></canvas>
	
	<div class="info-overlay">
		<div class="info-item">
			<strong>Model:</strong> {avatar.avatarModel.split('/').pop() || 'Default'}
		</div>
		{#if avatar.customizations.expressions}
			<div class="info-item">
				<strong>Expressions:</strong>
				{Object.entries(avatar.customizations.expressions)
					.filter(([_, v]) => v > 0)
					.map(([k, v]) => `${k}(${Math.round(v * 100)}%)`)
					.join(', ') || 'None'}
			</div>
		{/if}
		{#if avatar.transform}
			<div class="info-item">
				<strong>Position:</strong>
				({avatar.transform.position[0].toFixed(2)}, 
				 {avatar.transform.position[1].toFixed(2)}, 
				 {avatar.transform.position[2].toFixed(2)})
			</div>
		{/if}
	</div>
</div>

<style>
	.avatar-embed {
		position: relative;
		display: inline-block;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		overflow: hidden;
		background: #fff;
	}

	canvas {
		display: block;
	}

	.info-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: rgba(255, 255, 255, 0.95);
		padding: 8px;
		font-size: 12px;
		border-top: 1px solid #e2e8f0;
	}

	.info-item {
		margin-bottom: 4px;
	}

	.info-item:last-child {
		margin-bottom: 0;
	}

	strong {
		color: #2d3748;
	}
</style>
