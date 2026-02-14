<script lang="ts">
	import { deviceUIStore } from '../../backend/device-ui';
	import { fade, scale } from 'svelte/transition';
	
	$: request = $deviceUIStore.connectionRequest;

	function handleConnect() {
		deviceUIStore.approveConnection();
	}

	function handleCancel() {
		deviceUIStore.cancelConnection();
	}

	function handleBackdropClick() {
		handleCancel();
	}

	function getDeviceIcon(deviceType: string): string {
		const icons: Record<string, string> = {
			phone: '📱',
			tablet: '📱',
			watch: '⌚',
			laptop: '💻',
			desktop: '🖥️',
			speaker: '🔊',
			headphones: '🎧',
			beacon: '📡',
			sensor: '📡'
		};
		return icons[deviceType] || '📱';
	}
</script>

{#if request}
	<div class="modal-backdrop" on:click={handleBackdropClick} transition:fade={{ duration: 200 }}>
		<div class="connection-sheet" on:click|stopPropagation transition:scale={{ duration: 300, start: 0.95 }}>
			<div class="sheet-header">
				<div class="device-icon">{getDeviceIcon(request.deviceType)}</div>
				<h2 class="sheet-title">Connect to Device</h2>
				<p class="device-name">{request.deviceName}</p>
			</div>

			<div class="sheet-body">
				<p class="connection-message">
					<strong>{request.embedId}</strong> wants to connect to <strong>{request.deviceName}</strong>
				</p>
				
				<div class="info-box">
					<div class="info-row">
						<span class="info-label">Device Type</span>
						<span class="info-value">{request.deviceType}</span>
					</div>
					<div class="info-row">
						<span class="info-label">Capability</span>
						<span class="info-value">{request.capability}</span>
					</div>
				</div>

				<p class="warning-text">
					This will allow the embed to exchange data with the connected device.
				</p>
			</div>

			<div class="sheet-footer">
				<button class="btn btn-secondary" on:click={handleCancel}>
					Cancel
				</button>
				<button class="btn btn-primary" on:click={handleConnect}>
					Connect
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(8px);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.connection-sheet {
		background: white;
		border-radius: 20px;
		max-width: 440px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', sans-serif;
		overflow: hidden;
	}

	.sheet-header {
		padding: 32px 24px 24px;
		text-align: center;
		border-bottom: 1px solid #e5e5ea;
	}

	.device-icon {
		font-size: 64px;
		margin-bottom: 16px;
	}

	.sheet-title {
		font-size: 22px;
		font-weight: 600;
		color: #000;
		margin: 0 0 8px 0;
	}

	.device-name {
		font-size: 17px;
		color: #007AFF;
		font-weight: 500;
		margin: 0;
	}

	.sheet-body {
		padding: 24px;
	}

	.connection-message {
		font-size: 15px;
		color: #3c3c43;
		line-height: 1.5;
		margin: 0 0 20px 0;
		text-align: center;
	}

	.connection-message strong {
		font-weight: 600;
	}

	.info-box {
		background: #f2f2f7;
		border-radius: 12px;
		padding: 16px;
		margin-bottom: 20px;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		padding: 8px 0;
	}

	.info-row:not(:last-child) {
		border-bottom: 1px solid #e5e5ea;
	}

	.info-label {
		font-size: 15px;
		color: #8e8e93;
	}

	.info-value {
		font-size: 15px;
		color: #000;
		font-weight: 500;
	}

	.warning-text {
		font-size: 13px;
		color: #8e8e93;
		text-align: center;
		margin: 0;
	}

	.sheet-footer {
		padding: 16px 24px 24px;
		display: flex;
		gap: 12px;
	}

	.btn {
		flex: 1;
		padding: 14px 20px;
		border: none;
		border-radius: 12px;
		font-size: 17px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-secondary {
		background: #f2f2f7;
		color: #000;
	}

	.btn-secondary:hover {
		background: #e5e5ea;
	}

	.btn-primary {
		background: #007AFF;
		color: white;
	}

	.btn-primary:hover {
		background: #0051D5;
	}

	.btn:active {
		transform: scale(0.98);
	}

	@media (max-width: 768px) {
		.connection-sheet {
			max-width: 100%;
		}
	}
</style>
