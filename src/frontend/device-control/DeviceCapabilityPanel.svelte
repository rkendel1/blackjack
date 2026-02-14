<script lang="ts">
	import { deviceUIStore } from '../../backend/device-ui';
	import { slide, fade } from 'svelte/transition';
	import type { ActiveCapability } from '../../backend/device-ui';
	
	$: isPanelOpen = $deviceUIStore.isPanelOpen;
	$: activeCapabilities = $deviceUIStore.activeCapabilities;

	function handleClose() {
		deviceUIStore.closePanel();
	}

	function handleDisconnect(cap: ActiveCapability) {
		deviceUIStore.deactivateCapability(cap.capability, cap.embedId);
		deviceUIStore.showToast({
			type: 'info',
			message: `${getCapabilityDisplayName(cap.capability)} disconnected`,
			capability: cap.capability
		});
	}

	function getCapabilityIcon(capability: string): string {
		const icons: Record<string, string> = {
			camera: '📷',
			microphone: '🎤',
			motion: '📍',
			bluetooth: '🔵',
			nfc: '📱',
			wallet: '💳',
			location: '📍',
			filesystem: '📁',
			screen_capture: '🖥️',
			biometrics: '👆',
			proximity: '📡',
			push_notifications: '🔔',
			nearby_devices: '📱',
			spatial_audio: '🔊'
		};
		return icons[capability] || '⚙️';
	}

	function getCapabilityDisplayName(capability: string): string {
		const names: Record<string, string> = {
			camera: 'Camera',
			microphone: 'Microphone',
			motion: 'Motion',
			bluetooth: 'Bluetooth',
			nfc: 'NFC',
			wallet: 'Wallet',
			location: 'Location',
			filesystem: 'File System',
			screen_capture: 'Screen Capture',
			biometrics: 'Biometric Auth',
			proximity: 'Proximity',
			push_notifications: 'Notifications',
			nearby_devices: 'Nearby Devices',
			spatial_audio: 'Spatial Audio'
		};
		return names[capability] || capability;
	}

	function getStatusColor(status: string): string {
		return status === 'streaming' ? '#34C759' : '#007AFF';
	}

	function formatDuration(startedAt: number): string {
		const seconds = Math.floor((Date.now() - startedAt) / 1000);
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		return `${hours}h ${minutes % 60}m`;
	}

	function handleBackdropClick() {
		handleClose();
	}
</script>

{#if isPanelOpen}
	<div class="panel-backdrop" on:click={handleBackdropClick} transition:fade={{ duration: 200 }}>
		<div class="capability-panel" on:click|stopPropagation transition:slide={{ duration: 300, axis: 'x' }}>
			<div class="panel-header">
				<h2 class="panel-title">Device Control</h2>
				<button class="close-button" on:click={handleClose} aria-label="Close">
					✕
				</button>
			</div>

			<div class="panel-body">
				{#if activeCapabilities.length === 0}
					<div class="empty-state">
						<div class="empty-icon">🔌</div>
						<p class="empty-text">No active capabilities</p>
						<p class="empty-subtext">Device access will appear here when in use</p>
					</div>
				{:else}
					<div class="capability-list">
						<div class="section-title">Active</div>
						{#each activeCapabilities as cap (cap.capability + cap.embedId)}
							<div class="capability-item">
								<div class="item-icon">{getCapabilityIcon(cap.capability)}</div>
								<div class="item-info">
									<div class="item-name">{getCapabilityDisplayName(cap.capability)}</div>
									<div class="item-details">
										<span class="item-embed">{cap.embedId}</span>
										<span class="item-separator">•</span>
										<span class="item-duration">{formatDuration(cap.startedAt)}</span>
									</div>
								</div>
								<div class="item-status" style="background: {getStatusColor(cap.status)}">
									{cap.status === 'streaming' ? 'Streaming' : 'Active'}
								</div>
								<button 
									class="disconnect-button" 
									on:click={() => handleDisconnect(cap)}
									aria-label="Disconnect"
								>
									Disconnect
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="panel-footer">
				<button class="footer-link">Settings</button>
				<button class="footer-link">Privacy</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.panel-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(4px);
		z-index: 9997;
		display: flex;
		justify-content: flex-end;
	}

	.capability-panel {
		background: white;
		width: 400px;
		height: 100%;
		box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
		display: flex;
		flex-direction: column;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
	}

	.panel-header {
		padding: 20px 24px;
		border-bottom: 1px solid #e5e5ea;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.panel-title {
		font-size: 22px;
		font-weight: 600;
		color: #000;
		margin: 0;
	}

	.close-button {
		background: #f2f2f7;
		border: none;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 18px;
		color: #8e8e93;
		transition: background 0.2s;
	}

	.close-button:hover {
		background: #e5e5ea;
	}

	.panel-body {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
	}

	.empty-state {
		text-align: center;
		padding: 60px 20px;
	}

	.empty-icon {
		font-size: 64px;
		margin-bottom: 16px;
		opacity: 0.5;
	}

	.empty-text {
		font-size: 17px;
		font-weight: 500;
		color: #000;
		margin: 0 0 8px 0;
	}

	.empty-subtext {
		font-size: 13px;
		color: #8e8e93;
		margin: 0;
	}

	.section-title {
		font-size: 13px;
		font-weight: 600;
		color: #8e8e93;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 12px;
	}

	.capability-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.capability-item {
		background: #f2f2f7;
		border-radius: 12px;
		padding: 16px;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.item-icon {
		font-size: 32px;
	}

	.item-info {
		flex: 1;
		min-width: 0;
	}

	.item-name {
		font-size: 15px;
		font-weight: 500;
		color: #000;
		margin-bottom: 4px;
	}

	.item-details {
		font-size: 13px;
		color: #8e8e93;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.item-embed {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-separator {
		flex-shrink: 0;
	}

	.item-duration {
		flex-shrink: 0;
	}

	.item-status {
		padding: 4px 8px;
		border-radius: 6px;
		font-size: 11px;
		font-weight: 600;
		color: white;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.disconnect-button {
		background: none;
		border: 1px solid #FF3B30;
		color: #FF3B30;
		padding: 8px 12px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.disconnect-button:hover {
		background: #FF3B30;
		color: white;
	}

	.panel-footer {
		padding: 16px 24px;
		border-top: 1px solid #e5e5ea;
		display: flex;
		gap: 16px;
		justify-content: center;
	}

	.footer-link {
		background: none;
		border: none;
		color: #007AFF;
		font-size: 15px;
		cursor: pointer;
		padding: 8px;
		transition: opacity 0.2s;
	}

	.footer-link:hover {
		opacity: 0.7;
	}

	@media (max-width: 768px) {
		.capability-panel {
			width: 100%;
		}
	}
</style>
