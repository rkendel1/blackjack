<svelte:options customElement="sl-device-tester" />

<script lang="ts">
	import { useStackLiveDevice } from '../../backend/device-runtime/useStackLiveDevice';
	import type { CapabilityName } from '../../backend/device-runtime/types';

	// Props
	export let embedid = 'device-tester';
	export let debug = 'false';

	const device = useStackLiveDevice({
		embedId: embedid,
		debug: debug === 'true'
	});

	let selectedCapability: CapabilityName = 'camera';
	let status = '';
	let testResults: Array<{ capability: string; supported: boolean; active: boolean }> = [];

	const capabilities: CapabilityName[] = [
		'camera',
		'microphone',
		'motion',
		'bluetooth',
		'nfc',
		'wallet',
		'location',
		'filesystem',
		'screen_capture',
		'biometrics',
		'proximity',
		'push_notifications',
		'nearby_devices',
		'spatial_audio'
	];

	async function testCapability() {
		status = `Testing ${selectedCapability}...`;
		try {
			const state = await device[getCapabilityKey(selectedCapability)].start();
			status = `✓ ${selectedCapability} activated: ${state.status}`;
		} catch (error) {
			status = `✗ ${selectedCapability} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
		}
	}

	async function stopCapability() {
		status = `Stopping ${selectedCapability}...`;
		try {
			await device[getCapabilityKey(selectedCapability)].stop();
			status = `✓ ${selectedCapability} stopped`;
		} catch (error) {
			status = `✗ Failed to stop ${selectedCapability}: ${error instanceof Error ? error.message : 'Unknown error'}`;
		}
	}

	function testAllCapabilities() {
		testResults = capabilities.map(cap => {
			const key = getCapabilityKey(cap);
			return {
				capability: cap,
				supported: device[key].isSupported(),
				active: device[key].isActive()
			};
		});
	}

	function getCapabilityKey(cap: CapabilityName): string {
		const mapping: Record<CapabilityName, string> = {
			camera: 'camera',
			microphone: 'microphone',
			motion: 'motion',
			bluetooth: 'bluetooth',
			nfc: 'nfc',
			wallet: 'wallet',
			location: 'location',
			filesystem: 'filesystem',
			screen_capture: 'screen',
			biometrics: 'biometrics',
			proximity: 'proximity',
			push_notifications: 'notifications',
			nearby_devices: 'nearbyDevices',
			spatial_audio: 'spatialAudio'
		};
		return mapping[cap] || cap;
	}

	$: surfaceInfo = $device.surface;
	$: errorMessage = $device.error;
</script>

<div class="device-tester">
	<div class="header">
		<h2>🔌 StackLive Device Capability Tester</h2>
		<div class="surface-badge">Surface: {surfaceInfo}</div>
	</div>

	<div class="controls">
		<div class="control-group">
			<label for="capability">Select Capability:</label>
			<select id="capability" bind:value={selectedCapability}>
				{#each capabilities as cap}
					<option value={cap}>{cap}</option>
				{/each}
			</select>
		</div>

		<div class="button-group">
			<button on:click={testCapability}>Test Capability</button>
			<button on:click={stopCapability}>Stop</button>
			<button on:click={testAllCapabilities}>Test All</button>
		</div>
	</div>

	{#if status}
		<div class="status" class:error={status.includes('✗')}>
			{status}
		</div>
	{/if}

	{#if errorMessage}
		<div class="error-message">
			<strong>Error:</strong> {errorMessage}
		</div>
	{/if}

	{#if testResults.length > 0}
		<div class="results">
			<h3>Capability Support Matrix</h3>
			<table>
				<thead>
					<tr>
						<th>Capability</th>
						<th>Supported</th>
						<th>Active</th>
					</tr>
				</thead>
				<tbody>
					{#each testResults as result}
						<tr>
							<td>{result.capability}</td>
							<td class:supported={result.supported}>
								{result.supported ? '✓' : '✗'}
							</td>
							<td class:active={result.active}>
								{result.active ? '●' : '○'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<div class="info">
		<h3>Active Capabilities</h3>
		<div class="capability-count">
			{$device.capabilityCount} active
		</div>
		<div class="capability-list">
			{#each $device.activeCapabilities as cap}
				<span class="capability-badge">{cap}</span>
			{/each}
		</div>
	</div>
</div>

<style>
	.device-tester {
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		max-width: 800px;
		margin: 0 auto;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		border-bottom: 2px solid #007AFF;
		padding-bottom: 10px;
	}

	h2 {
		margin: 0;
		color: #333;
		font-size: 24px;
	}

	.surface-badge {
		background: #007AFF;
		color: white;
		padding: 5px 15px;
		border-radius: 15px;
		font-size: 12px;
		font-weight: 600;
	}

	.controls {
		background: #f5f5f7;
		padding: 20px;
		border-radius: 10px;
		margin-bottom: 20px;
	}

	.control-group {
		margin-bottom: 15px;
	}

	label {
		display: block;
		margin-bottom: 5px;
		font-weight: 600;
		color: #333;
	}

	select {
		width: 100%;
		padding: 10px;
		border: 1px solid #d1d1d6;
		border-radius: 8px;
		font-size: 14px;
		background: white;
	}

	.button-group {
		display: flex;
		gap: 10px;
	}

	button {
		flex: 1;
		padding: 12px 20px;
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

	.status {
		padding: 15px;
		border-radius: 8px;
		margin-bottom: 20px;
		background: #E8F5E9;
		color: #2E7D32;
		border-left: 4px solid #4CAF50;
	}

	.status.error {
		background: #FFEBEE;
		color: #C62828;
		border-left-color: #F44336;
	}

	.error-message {
		padding: 15px;
		border-radius: 8px;
		background: #FFEBEE;
		color: #C62828;
		margin-bottom: 20px;
		border-left: 4px solid #F44336;
	}

	.results {
		margin-bottom: 20px;
	}

	h3 {
		color: #333;
		margin-bottom: 10px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	th {
		background: #f5f5f7;
		padding: 12px;
		text-align: left;
		font-weight: 600;
		color: #333;
		border-bottom: 2px solid #d1d1d6;
	}

	td {
		padding: 12px;
		border-bottom: 1px solid #f5f5f7;
	}

	td.supported {
		color: #4CAF50;
		font-weight: 600;
	}

	td.active {
		color: #007AFF;
		font-weight: 600;
	}

	.info {
		background: white;
		padding: 20px;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.capability-count {
		font-size: 24px;
		font-weight: 600;
		color: #007AFF;
		margin-bottom: 15px;
	}

	.capability-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.capability-badge {
		background: #007AFF;
		color: white;
		padding: 5px 12px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 600;
	}
</style>
