<svelte:options customElement="sl-motion-demo" />

<script lang="ts">
	import { useStackLiveDevice } from '../../backend/device-runtime/useStackLiveDevice';
	import { onDestroy } from 'svelte';

	export let embedid = 'motion-demo';

	const device = useStackLiveDevice({ embedId: embedid, debug: true });

	let isActive = false;
	let motionData = {
		x: 0,
		y: 0,
		z: 0,
		alpha: 0,
		beta: 0,
		gamma: 0
	};
	let ballPosition = { x: 50, y: 50 };

	let motionHandler: ((event: DeviceMotionEvent) => void) | null = null;

	async function startMotion() {
		try {
			await device.motion.start();
			isActive = true;

			// Listen for motion events
			motionHandler = (event: DeviceMotionEvent) => {
				if (event.accelerationIncludingGravity) {
					motionData.x = event.accelerationIncludingGravity.x || 0;
					motionData.y = event.accelerationIncludingGravity.y || 0;
					motionData.z = event.accelerationIncludingGravity.z || 0;
				}

				if (event.rotationRate) {
					motionData.alpha = event.rotationRate.alpha || 0;
					motionData.beta = event.rotationRate.beta || 0;
					motionData.gamma = event.rotationRate.gamma || 0;
				}

				// Update ball position based on tilt
				// beta is forward/back tilt, gamma is left/right tilt
				const tiltX = (event.rotationRate?.gamma || 0) / 90; // -1 to 1
				const tiltY = (event.rotationRate?.beta || 0) / 90; // -1 to 1

				ballPosition.x = Math.max(0, Math.min(100, ballPosition.x + tiltX * 2));
				ballPosition.y = Math.max(0, Math.min(100, ballPosition.y + tiltY * 2));
			};

			window.addEventListener('devicemotion', motionHandler);
		} catch (error) {
			console.error('Motion error:', error);
		}
	}

	async function stopMotion() {
		await device.motion.stop();
		isActive = false;
		if (motionHandler) {
			window.removeEventListener('devicemotion', motionHandler);
			motionHandler = null;
		}
	}

	onDestroy(() => {
		if (motionHandler) {
			window.removeEventListener('devicemotion', motionHandler);
		}
		device.destroy();
	});
</script>

<div class="motion-demo">
	<h2>📱 Motion Controller Demo</h2>
	<p>Tilt your device to control the ball!</p>

	<div class="controls">
		{#if !isActive}
			<button on:click={startMotion}>Start Motion</button>
		{:else}
			<button on:click={stopMotion} class="stop">Stop Motion</button>
		{/if}
	</div>

	<div class="game-area">
		<div 
			class="ball"
			style="left: {ballPosition.x}%; top: {ballPosition.y}%"
		/>
	</div>

	{#if isActive}
		<div class="data-display">
			<h3>Motion Data</h3>
			<div class="data-grid">
				<div class="data-item">
					<span class="label">X:</span>
					<span class="value">{motionData.x.toFixed(2)}</span>
				</div>
				<div class="data-item">
					<span class="label">Y:</span>
					<span class="value">{motionData.y.toFixed(2)}</span>
				</div>
				<div class="data-item">
					<span class="label">Z:</span>
					<span class="value">{motionData.z.toFixed(2)}</span>
				</div>
				<div class="data-item">
					<span class="label">Alpha:</span>
					<span class="value">{motionData.alpha.toFixed(2)}°</span>
				</div>
				<div class="data-item">
					<span class="label">Beta:</span>
					<span class="value">{motionData.beta.toFixed(2)}°</span>
				</div>
				<div class="data-item">
					<span class="label">Gamma:</span>
					<span class="value">{motionData.gamma.toFixed(2)}°</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.motion-demo {
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

	.controls {
		display: flex;
		justify-content: center;
		margin-bottom: 20px;
	}

	button {
		padding: 12px 30px;
		background: #007AFF;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
	}

	button.stop {
		background: #FF3B30;
	}

	.game-area {
		width: 100%;
		height: 400px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 12px;
		position: relative;
		margin-bottom: 20px;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
	}

	.ball {
		width: 40px;
		height: 40px;
		background: #FFD60A;
		border-radius: 50%;
		position: absolute;
		transform: translate(-50%, -50%);
		transition: all 0.1s ease-out;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.data-display {
		background: #f5f5f7;
		padding: 20px;
		border-radius: 12px;
	}

	h3 {
		margin: 0 0 15px 0;
		color: #333;
	}

	.data-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 15px;
	}

	.data-item {
		background: white;
		padding: 12px;
		border-radius: 8px;
		display: flex;
		justify-content: space-between;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.label {
		font-weight: 600;
		color: #666;
	}

	.value {
		color: #007AFF;
		font-weight: 700;
		font-family: monospace;
	}
</style>
