<svelte:options customElement="sl-proximity-demo" />

<script lang="ts">
	import { useStackLiveDevice } from '../../backend/device-runtime/useStackLiveDevice';

	export let embedid = 'proximity-demo';

	const device = useStackLiveDevice({ embedId: embedid });

	let isScanning = false;
	let nearbyDevices: Array<{ id: string; distance: number; name: string }> = [];
	let status = '';

	async function startScanning() {
		if (!device.proximity.isSupported()) {
			status = '✗ Proximity/Bluetooth scanning not supported';
			return;
		}

		try {
			await device.proximity.start();
			isScanning = true;
			status = '📡 Scanning for nearby devices...';

			// Simulate finding devices
			setTimeout(() => {
				nearbyDevices = [
					{ id: '1', distance: 2.3, name: 'iPhone 14 Pro' },
					{ id: '2', distance: 5.1, name: 'MacBook Pro' },
					{ id: '3', distance: 8.7, name: 'Apple Watch' }
				];
				status = `✓ Found ${nearbyDevices.length} nearby devices`;
			}, 2000);
		} catch (error) {
			status = `✗ Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
		}
	}

	async function stopScanning() {
		await device.proximity.stop();
		isScanning = false;
		nearbyDevices = [];
		status = 'Scanning stopped';
	}

	function getDistanceColor(distance: number): string {
		if (distance < 3) return '#34C759';
		if (distance < 6) return '#FF9500';
		return '#FF3B30';
	}
</script>

<div class="proximity-demo">
	<h2>📍 Proximity Activation Demo</h2>
	<p>Detect nearby devices using Bluetooth beacons</p>

	<div class="scanner">
		{#if !isScanning}
			<button on:click={startScanning} class="scan-button">
				Start Scanning
			</button>
		{:else}
			<button on:click={stopScanning} class="stop-button">
				Stop Scanning
			</button>
		{/if}

		{#if status}
			<div class="status">
				{status}
			</div>
		{/if}
	</div>

	{#if nearbyDevices.length > 0}
		<div class="devices">
			<h3>Nearby Devices</h3>
			{#each nearbyDevices as device}
				<div class="device-item">
					<div class="device-info">
						<div class="device-name">{device.name}</div>
						<div class="device-id">ID: {device.id}</div>
					</div>
					<div class="device-distance" style="color: {getDistanceColor(device.distance)}">
						{device.distance.toFixed(1)}m
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<div class="use-cases">
		<h3>Use Cases</h3>
		<ul>
			<li>🏪 Store activation triggers</li>
			<li>🎮 Event auto-join</li>
			<li>🤝 Nearby multiplayer matching</li>
			<li>📱 Device pairing</li>
		</ul>
	</div>
</div>

<style>
	.proximity-demo {
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
		margin-bottom: 30px;
	}

	.scanner {
		text-align: center;
		margin-bottom: 30px;
	}

	.scan-button, .stop-button {
		padding: 16px 40px;
		border: none;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
	}

	.scan-button {
		background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
		color: white;
		box-shadow: 0 4px 15px rgba(0, 122, 255, 0.3);
	}

	.stop-button {
		background: #FF3B30;
		color: white;
	}

	.status {
		margin-top: 15px;
		padding: 12px;
		background: #f5f5f7;
		border-radius: 8px;
		color: #333;
		font-weight: 600;
	}

	.devices {
		background: white;
		padding: 20px;
		border-radius: 12px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		margin-bottom: 20px;
	}

	h3 {
		margin: 0 0 15px 0;
		color: #333;
		font-size: 18px;
	}

	.device-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15px;
		background: #f5f5f7;
		border-radius: 8px;
		margin-bottom: 10px;
	}

	.device-info {
		flex: 1;
	}

	.device-name {
		font-weight: 600;
		color: #333;
		margin-bottom: 4px;
	}

	.device-id {
		font-size: 12px;
		color: #666;
	}

	.device-distance {
		font-size: 20px;
		font-weight: 700;
		font-family: monospace;
	}

	.use-cases {
		background: #f5f5f7;
		padding: 20px;
		border-radius: 12px;
	}

	ul {
		margin: 0;
		padding-left: 20px;
	}

	li {
		color: #333;
		margin-bottom: 8px;
		line-height: 1.6;
	}
</style>
