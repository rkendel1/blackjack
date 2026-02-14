<svelte:options customElement="sl-arvr-spatial" />

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	// Exposed attributes
	export let objectId: string = '';
	export let objectType: string = 'cube';
	export let position: string = '0,0,-2';
	export let rotation: string = '0,0,0,1';
	export let scale: string = '1,1,1';
	export let color: string = '#4299e1';
	export let interactive: string = 'true';

	let canvasElement: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let isDragging = false;
	let dragStartX = 0;
	let dragStartY = 0;

	$: interactiveBool = interactive === 'true';
	$: positionArray = position.split(',').map(Number) as [number, number, number];
	$: rotationArray = rotation.split(',').map(Number) as [number, number, number, number];
	$: scaleArray = scale.split(',').map(Number) as [number, number, number];

	onMount(() => {
		ctx = canvasElement.getContext('2d');
		if (ctx) {
			renderObject();
		}

		dispatchEvent(
			new CustomEvent('object-placed', {
				detail: {
					objectId,
					objectType,
					position: positionArray,
					rotation: rotationArray,
					scale: scaleArray
				}
			})
		);
	});

	function renderObject() {
		if (!ctx) return;

		const width = 200;
		const height = 200;

		// Clear canvas
		ctx.clearRect(0, 0, width, height);

		// Background
		ctx.fillStyle = '#1a1a1a';
		ctx.fillRect(0, 0, width, height);

		// Draw grid
		ctx.strokeStyle = '#333';
		ctx.lineWidth = 1;
		for (let i = 0; i <= width; i += 20) {
			ctx.beginPath();
			ctx.moveTo(i, 0);
			ctx.lineTo(i, height);
			ctx.stroke();
		}
		for (let i = 0; i <= height; i += 20) {
			ctx.beginPath();
			ctx.moveTo(0, i);
			ctx.lineTo(width, i);
			ctx.stroke();
		}

		// Draw object (simple 2D representation)
		const centerX = width / 2 + positionArray[0] * 20;
		const centerY = height / 2 + positionArray[1] * 20;
		const size = 40 * scaleArray[0];

		ctx.fillStyle = color;
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 2;

		if (objectType === 'cube') {
			// Draw cube (isometric view)
			ctx.beginPath();
			ctx.moveTo(centerX, centerY - size / 2);
			ctx.lineTo(centerX + size / 2, centerY - size / 4);
			ctx.lineTo(centerX + size / 2, centerY + size / 4);
			ctx.lineTo(centerX, centerY + size / 2);
			ctx.lineTo(centerX - size / 2, centerY + size / 4);
			ctx.lineTo(centerX - size / 2, centerY - size / 4);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
		} else if (objectType === 'sphere') {
			// Draw sphere
			ctx.beginPath();
			ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
			ctx.fill();
			ctx.stroke();
		} else {
			// Default: draw cylinder
			ctx.fillRect(centerX - size / 2, centerY - size / 2, size, size);
			ctx.strokeRect(centerX - size / 2, centerY - size / 2, size, size);
		}

		// Draw label
		ctx.fillStyle = '#fff';
		ctx.font = '10px sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText(objectId || objectType, centerX, centerY + size / 2 + 15);
	}

	function handleMouseDown(e: MouseEvent) {
		if (!interactiveBool) return;
		isDragging = true;
		dragStartX = e.offsetX;
		dragStartY = e.offsetY;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;

		const deltaX = (e.offsetX - dragStartX) / 20;
		const deltaY = (e.offsetY - dragStartY) / 20;

		positionArray[0] += deltaX;
		positionArray[1] -= deltaY; // Invert Y for natural movement

		position = positionArray.join(',');

		dragStartX = e.offsetX;
		dragStartY = e.offsetY;

		renderObject();

		dispatchEvent(
			new CustomEvent('object-moved', {
				detail: {
					objectId,
					position: positionArray
				}
			})
		);
	}

	function handleMouseUp() {
		isDragging = false;
	}

	$: if (ctx && (position || rotation || scale || color)) {
		renderObject();
	}

	onDestroy(() => {
		ctx = null;
	});
</script>

<div class="arvr-spatial">
	<canvas
		bind:this={canvasElement}
		width="200"
		height="200"
		on:mousedown={handleMouseDown}
		on:mousemove={handleMouseMove}
		on:mouseup={handleMouseUp}
		on:mouseleave={handleMouseUp}
		class:interactive={interactiveBool}
	></canvas>
	<div class="object-info">
		<strong>{objectType}</strong>
		{#if objectId}
			<span class="object-id">#{objectId}</span>
		{/if}
	</div>
</div>

<style>
	.arvr-spatial {
		display: inline-block;
		border: 2px solid #2d3748;
		border-radius: 8px;
		overflow: hidden;
		background: #1a1a1a;
	}

	canvas {
		display: block;
	}

	canvas.interactive {
		cursor: move;
	}

	.object-info {
		background: rgba(0, 0, 0, 0.9);
		color: white;
		padding: 8px;
		font-size: 12px;
		text-align: center;
		border-top: 1px solid #374151;
	}

	.object-id {
		color: #9ca3af;
		font-size: 10px;
		margin-left: 8px;
	}

	strong {
		text-transform: capitalize;
	}
</style>
