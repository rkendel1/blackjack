<script lang="ts">
	export let isEnabled: boolean = false;
	export let isScanning: boolean = false;
	export let deviceName: string = "This Device";
	export let onToggle: (enabled: boolean) => void = () => {};
	export let onScan: () => void = () => {};

	function handleToggle() {
		onToggle(!isEnabled);
	}

	function handleScan() {
		onScan();
	}
</script>

<div class="bluetooth-control">
	<div class="toggle-section">
		<div class="toggle-label">Bluetooth</div>
		<button 
			class="toggle-switch" 
			class:enabled={isEnabled}
			on:click={handleToggle}
			aria-label="Toggle Bluetooth"
		>
			<div class="toggle-knob"></div>
		</button>
	</div>

	{#if isEnabled}
		<div class="device-name-section">
			<p class="device-name-text">
				This device is discoverable as "{deviceName}" while Bluetooth Settings is open.
			</p>
		</div>

		<button class="scan-button" on:click={handleScan} disabled={isScanning}>
			{isScanning ? 'Scanning...' : 'Add New Device'}
		</button>
	{/if}
</div>

<style>
	.bluetooth-control {
		padding: 16px;
		background: white;
		border-bottom: 1px solid #e5e5e5;
	}

	.toggle-section {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 0;
	}

	.toggle-label {
		font-size: 17px;
		color: #000;
		font-weight: 400;
	}

	.toggle-switch {
		position: relative;
		width: 51px;
		height: 31px;
		border-radius: 16px;
		border: none;
		cursor: pointer;
		transition: background-color 0.3s;
		background-color: #e5e5ea;
		padding: 0;
	}

	.toggle-switch.enabled {
		background-color: #34c759;
	}

	.toggle-knob {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 27px;
		height: 27px;
		border-radius: 50%;
		background: white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: transform 0.3s;
	}

	.toggle-switch.enabled .toggle-knob {
		transform: translateX(20px);
	}

	.device-name-section {
		margin-top: 12px;
		padding: 8px 0;
	}

	.device-name-text {
		font-size: 13px;
		color: #8e8e93;
		line-height: 1.4;
		margin: 0;
	}

	.scan-button {
		width: 100%;
		margin-top: 16px;
		padding: 12px;
		background: #007AFF;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 17px;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.scan-button:hover:not(:disabled) {
		opacity: 0.8;
	}

	.scan-button:active:not(:disabled) {
		opacity: 0.6;
	}

	.scan-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
