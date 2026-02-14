<script lang="ts">
	import type { BluetoothDeviceInfo } from '../../backend/bluetooth';

	export let device: BluetoothDeviceInfo;
	export let onConnect: (deviceId: string) => void = () => {};
	export let onDisconnect: (deviceId: string) => void = () => {};
	export let onForget: (deviceId: string) => void = () => {};
	export let showActions: boolean = true;

	function handleConnect() {
		onConnect(device.id);
	}

	function handleDisconnect() {
		onDisconnect(device.id);
	}

	function handleForget() {
		onForget(device.id);
	}
</script>

<div class="device-item">
	<div class="device-info">
		<div class="device-name">{device.name}</div>
		<div class="device-status" class:connected={device.connected}>
			{device.connected ? 'Connected' : 'Not Connected'}
		</div>
	</div>
	
	{#if showActions}
		<div class="device-actions">
			{#if device.connected}
				<button class="info-button" aria-label="Device info">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
						<circle cx="10" cy="10" r="8" stroke="#007AFF" stroke-width="2" fill="none"/>
						<text x="10" y="14" text-anchor="middle" fill="#007AFF" font-size="12" font-weight="bold">i</text>
					</svg>
				</button>
			{:else if device.paired}
				<button class="connect-button" on:click={handleConnect}>
					Connect
				</button>
				<button class="info-button" aria-label="Device info">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
						<circle cx="10" cy="10" r="8" stroke="#007AFF" stroke-width="2" fill="none"/>
						<text x="10" y="14" text-anchor="middle" fill="#007AFF" font-size="12" font-weight="bold">i</text>
					</svg>
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.device-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: white;
		border-bottom: 1px solid #e5e5e5;
		min-height: 60px;
	}

	.device-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.device-name {
		font-size: 17px;
		color: #000;
		font-weight: 400;
	}

	.device-status {
		font-size: 15px;
		color: #8e8e93;
	}

	.device-status.connected {
		color: #007AFF;
	}

	.device-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.info-button {
		background: none;
		border: none;
		padding: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity 0.2s;
	}

	.info-button:hover {
		opacity: 0.7;
	}

	.info-button:active {
		opacity: 0.5;
	}

	.connect-button {
		background: none;
		border: none;
		color: #007AFF;
		font-size: 17px;
		cursor: pointer;
		padding: 4px 8px;
		transition: opacity 0.2s;
	}

	.connect-button:hover {
		opacity: 0.7;
	}

	.connect-button:active {
		opacity: 0.5;
	}
</style>
