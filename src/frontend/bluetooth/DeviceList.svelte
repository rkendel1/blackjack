<script lang="ts">
	import type { BluetoothDeviceInfo } from '../../backend/bluetooth';
	import DeviceItem from './DeviceItem.svelte';

	export let title: string = 'My Devices';
	export let devices: BluetoothDeviceInfo[] = [];
	export let emptyMessage: string = 'No devices';
	export let onConnect: (deviceId: string) => void = () => {};
	export let onDisconnect: (deviceId: string) => void = () => {};
	export let onForget: (deviceId: string) => void = () => {};
	export let showActions: boolean = true;
</script>

<div class="device-list">
	{#if title}
		<div class="list-header">{title}</div>
	{/if}
	
	{#if devices.length === 0}
		<div class="empty-state">{emptyMessage}</div>
	{:else}
		<div class="devices">
			{#each devices as device (device.id)}
				<DeviceItem
					{device}
					{onConnect}
					{onDisconnect}
					{onForget}
					{showActions}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.device-list {
		display: flex;
		flex-direction: column;
	}

	.list-header {
		padding: 12px 16px;
		font-size: 13px;
		font-weight: 400;
		color: #8e8e93;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		background: #f2f2f7;
	}

	.empty-state {
		padding: 32px 16px;
		text-align: center;
		color: #8e8e93;
		font-size: 15px;
	}

	.devices {
		background: white;
	}
</style>
