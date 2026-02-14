<svelte:options customElement="sl-bluetooth" />

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createBluetoothBackend } from '../../backend/bluetooth';
	import type { BluetoothDeviceInfo } from '../../backend/bluetooth';
	import BluetoothControl from './BluetoothControl.svelte';
	import DeviceList from './DeviceList.svelte';

	// Exposed attributes (all strings for web components)
	export let embedId: string = 'bluetooth-embed';
	export let deviceName: string = "This Device";
	export let autoScan: string = 'false';
	export let persistDevices: string = 'true';
	export let theme: string = 'light';

	// Convert string attributes to proper types
	$: autoScanBool = autoScan === 'true';
	$: persistDevicesBool = persistDevices === 'true';

	// Create the Bluetooth backend once (not reactively to avoid losing state)
	let backend = createBluetoothBackend({
		embedId,
		autoScan: autoScanBool,
		persistDevices: persistDevicesBool,
		debug: true
	});

	// Destructure stores and actions from backend
	let {
		// Stores
		isEnabled,
		isScanning,
		availableDevices,
		connectedDevices,
		pairedDevices,
		error,
		isSupported,
		// Actions
		enable,
		disable,
		scan,
		stopScan,
		connect,
		disconnect,
		forget,
		getDeviceInfo,
		on,
		destroy
	} = backend;

	// Separate devices into My Devices and Other Devices
	$: myDevices = $pairedDevices;
	$: otherDevices = $availableDevices.filter(d => !d.paired);
	$: hasOtherDevices = otherDevices.length > 0;

	let mounted = false;

	onMount(() => {
		mounted = true;

		// Set up event listeners
		on('devicefound', (device) => {
			console.log('Device found:', device);
		});

		on('connected', (device) => {
			console.log('Device connected:', device);
			dispatchEvent(
				new CustomEvent('deviceconnected', {
					detail: device
				})
			);
		});

		on('disconnected', (device) => {
			console.log('Device disconnected:', device);
			dispatchEvent(
				new CustomEvent('devicedisconnected', {
					detail: device
				})
			);
		});

		on('error', (errorMsg) => {
			console.error('Bluetooth error:', errorMsg);
			dispatchEvent(
				new CustomEvent('error', {
					detail: { error: errorMsg }
				})
			);
		});

		// Dispatch ready event
		dispatchEvent(
			new CustomEvent('ready', {
				detail: { 
					embedId, 
					supported: $isSupported 
				}
			})
		);
	});

	onDestroy(() => {
		destroy();
	});

	function handleToggle(enabled: boolean) {
		if (enabled) {
			enable();
		} else {
			disable();
		}
	}

	async function handleScan() {
		await scan();
	}

	async function handleConnect(deviceId: string) {
		await connect(deviceId);
	}

	async function handleDisconnect(deviceId: string) {
		await disconnect(deviceId);
	}

	function handleForget(deviceId: string) {
		forget(deviceId);
	}
</script>

<div class="bluetooth-embed" data-theme={theme}>
	<!-- Header -->
	<div class="header">
		<button class="back-button" aria-label="Back">
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
				<path d="M15 18L9 12L15 6" stroke="#007AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</button>
		<div class="header-content">
			<div class="bluetooth-icon">
				<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect width="64" height="64" rx="14" fill="#007AFF"/>
					<path d="M32 16L44 28L36 36L44 44L32 56V36L20 44L20 40L28 32L20 24V20L32 28V16Z" fill="white"/>
				</svg>
			</div>
			<h1 class="title">Bluetooth</h1>
			<p class="subtitle">
				Connect to accessories you can use for activities such as streaming music, making phone calls, and gaming. 
				<a href="#" class="learn-more">Learn more...</a>
			</p>
		</div>
	</div>

	{#if !$isSupported}
		<div class="error-banner">
			<p>⚠️ Bluetooth is not supported in this browser</p>
		</div>
	{:else}
		<!-- Bluetooth Toggle Control -->
		<BluetoothControl
			isEnabled={$isEnabled}
			isScanning={$isScanning}
			{deviceName}
			onToggle={handleToggle}
			onScan={handleScan}
		/>

		{#if $isEnabled}
			<!-- My Devices Section -->
			<DeviceList
				title="My Devices"
				devices={myDevices}
				emptyMessage="No paired devices"
				onConnect={handleConnect}
				onDisconnect={handleDisconnect}
				onForget={handleForget}
			/>

			<!-- Other Devices Section -->
			{#if hasOtherDevices || $isScanning}
				<div class="section-header">
					<span class="section-title">Other Devices</span>
					{#if $isScanning}
						<div class="scanning-indicator">
							<div class="spinner"></div>
						</div>
					{/if}
				</div>
				<DeviceList
					title=""
					devices={otherDevices}
					emptyMessage={$isScanning ? "Scanning for devices..." : "No devices found"}
					onConnect={handleConnect}
					onDisconnect={handleDisconnect}
					onForget={handleForget}
				/>
			{/if}
		{/if}

		{#if $error}
			<div class="error-banner">
				<p>⚠️ {$error}</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	.bluetooth-embed {
		width: 100%;
		max-width: 430px;
		height: 100%;
		min-height: 600px;
		background: #f2f2f7;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif;
		overflow-y: auto;
		position: relative;
	}

	.header {
		background: #f2f2f7;
		padding-top: 8px;
		position: relative;
	}

	.back-button {
		position: absolute;
		top: 16px;
		left: 8px;
		background: white;
		border: none;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: opacity 0.2s;
	}

	.back-button:hover {
		opacity: 0.8;
	}

	.back-button:active {
		opacity: 0.6;
	}

	.header-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 40px 32px 24px;
	}

	.bluetooth-icon {
		margin-bottom: 16px;
	}

	.title {
		font-size: 28px;
		font-weight: 600;
		color: #000;
		margin: 0 0 8px 0;
	}

	.subtitle {
		font-size: 13px;
		line-height: 1.5;
		color: #8e8e93;
		text-align: center;
		margin: 0;
		max-width: 340px;
	}

	.learn-more {
		color: #007AFF;
		text-decoration: none;
	}

	.learn-more:hover {
		text-decoration: underline;
	}

	.section-header {
		padding: 12px 16px;
		font-size: 13px;
		font-weight: 400;
		color: #8e8e93;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		background: #f2f2f7;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.section-title {
		flex: 1;
	}

	.scanning-indicator {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid #e5e5ea;
		border-top: 2px solid #8e8e93;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.error-banner {
		background: #ff3b30;
		color: white;
		padding: 12px 16px;
		text-align: center;
		font-size: 15px;
	}

	.error-banner p {
		margin: 0;
	}

	/* Dark theme support */
	.bluetooth-embed[data-theme='dark'] {
		background: #000;
		color: #fff;
	}

	.bluetooth-embed[data-theme='dark'] .header {
		background: #000;
	}

	.bluetooth-embed[data-theme='dark'] .title {
		color: #fff;
	}

	.bluetooth-embed[data-theme='dark'] .subtitle {
		color: #98989d;
	}

	.bluetooth-embed[data-theme='dark'] .section-header {
		background: #000;
		color: #98989d;
	}

	@media (max-width: 768px) {
		.bluetooth-embed {
			max-width: 100%;
			min-height: 100vh;
		}
	}
</style>
