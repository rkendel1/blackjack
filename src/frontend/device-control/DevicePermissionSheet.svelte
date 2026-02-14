<script lang="ts">
	import { deviceUIStore } from '../../backend/device-ui';
	import type { PermissionScope } from '../../backend/device-runtime/types';
	import { fade, scale } from 'svelte/transition';
	
	$: request = $deviceUIStore.permissionRequest;
	
	let selectedScope: PermissionScope = 'session';

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
			motion: 'Motion & Orientation',
			bluetooth: 'Bluetooth',
			nfc: 'NFC',
			wallet: 'Wallet',
			location: 'Location',
			filesystem: 'File System',
			screen_capture: 'Screen Capture',
			biometrics: 'Biometric Authentication',
			proximity: 'Proximity Sensors',
			push_notifications: 'Push Notifications',
			nearby_devices: 'Nearby Devices',
			spatial_audio: 'Spatial Audio'
		};
		return names[capability] || capability;
	}

	function handleApprove() {
		deviceUIStore.approvePermission(selectedScope);
	}

	function handleDeny() {
		deviceUIStore.denyPermission();
	}

	function handleBackdropClick() {
		handleDeny();
	}
</script>

{#if request}
	<div class="modal-backdrop" on:click={handleBackdropClick} transition:fade={{ duration: 200 }}>
		<div class="permission-sheet" on:click|stopPropagation transition:scale={{ duration: 300, start: 0.95 }}>
			<div class="sheet-header">
				<div class="capability-icon">{getCapabilityIcon(request.capability)}</div>
				<h2 class="sheet-title">{getCapabilityDisplayName(request.capability)} Access</h2>
				<p class="sheet-description">
					<strong>{request.embedId}</strong> wants to use your {getCapabilityDisplayName(request.capability).toLowerCase()}
				</p>
				{#if request.reason}
					<p class="sheet-reason">{request.reason}</p>
				{/if}
			</div>

			<div class="sheet-body">
				<div class="scope-options">
					<label class="scope-option">
						<input 
							type="radio" 
							name="scope" 
							value="one-time" 
							bind:group={selectedScope}
						/>
						<div class="option-content">
							<div class="option-title">Only This Time</div>
							<div class="option-description">Permission expires after this use</div>
						</div>
					</label>

					<label class="scope-option">
						<input 
							type="radio" 
							name="scope" 
							value="session" 
							bind:group={selectedScope}
						/>
						<div class="option-content">
							<div class="option-title">This Session</div>
							<div class="option-description">Permission expires after 24 hours</div>
						</div>
					</label>

					<label class="scope-option">
						<input 
							type="radio" 
							name="scope" 
							value="embed-level" 
							bind:group={selectedScope}
						/>
						<div class="option-content">
							<div class="option-title">For This Embed</div>
							<div class="option-description">Permission lasts for this embed only</div>
						</div>
					</label>

					<label class="scope-option">
						<input 
							type="radio" 
							name="scope" 
							value="always" 
							bind:group={selectedScope}
						/>
						<div class="option-content">
							<div class="option-title">Always Allow</div>
							<div class="option-description">Don't ask again for this embed</div>
						</div>
					</label>
				</div>
			</div>

			<div class="sheet-footer">
				<button class="btn btn-secondary" on:click={handleDeny}>
					Don't Allow
				</button>
				<button class="btn btn-primary" on:click={handleApprove}>
					Allow
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

	.permission-sheet {
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

	.capability-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}

	.sheet-title {
		font-size: 22px;
		font-weight: 600;
		color: #000;
		margin: 0 0 12px 0;
	}

	.sheet-description {
		font-size: 15px;
		color: #3c3c43;
		line-height: 1.5;
		margin: 0;
	}

	.sheet-description strong {
		font-weight: 600;
	}

	.sheet-reason {
		font-size: 13px;
		color: #8e8e93;
		margin: 12px 0 0 0;
		font-style: italic;
	}

	.sheet-body {
		padding: 24px;
	}

	.scope-options {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.scope-option {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		background: #f2f2f7;
		border-radius: 12px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.scope-option:hover {
		background: #e5e5ea;
	}

	.scope-option input[type="radio"] {
		width: 20px;
		height: 20px;
		margin: 0;
		cursor: pointer;
		accent-color: #007AFF;
	}

	.option-content {
		flex: 1;
	}

	.option-title {
		font-size: 15px;
		font-weight: 500;
		color: #000;
		margin-bottom: 4px;
	}

	.option-description {
		font-size: 13px;
		color: #8e8e93;
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
		.permission-sheet {
			max-width: 100%;
		}
	}
</style>
