<svelte:options customElement="sl-device-control" />

<script lang="ts">
	import { onMount } from 'svelte';
	import DevicePermissionSheet from './device-control/DevicePermissionSheet.svelte';
	import DeviceConnectionSheet from './device-control/DeviceConnectionSheet.svelte';
	import DeviceStatusIndicator from './device-control/DeviceStatusIndicator.svelte';
	import DeviceCapabilityPanel from './device-control/DeviceCapabilityPanel.svelte';
	import DeviceToast from './device-control/DeviceToast.svelte';
	import { deviceUIStore, hasPermissionRequest, hasConnectionRequest } from '../backend/device-ui';

	// Exposed attributes
	export let embedId: string = 'stacklive-device-control';
	export let debug: string = 'false';

	$: debugMode = debug === 'true';

	// Handle custom events from parent page
	function handleRequestPermission(event: CustomEvent) {
		const { capability, embedId, reason, onApprove, onDeny } = event.detail;
		deviceUIStore.requestPermission({
			capability,
			embedId,
			reason,
			onApprove,
			onDeny
		});
	}

	function handleRequestConnection(event: CustomEvent) {
		const { deviceId, deviceName, deviceType, capability, embedId, onConnect, onCancel } = event.detail;
		deviceUIStore.requestConnection({
			deviceId,
			deviceName,
			deviceType,
			capability,
			embedId,
			onConnect,
			onCancel
		});
	}

	function handleActivateCapability(event: CustomEvent) {
		const { capability, embedId, status } = event.detail;
		deviceUIStore.activateCapability({
			capability,
			embedId,
			status: status || 'active',
			startedAt: Date.now()
		});
	}

	function handleDeactivateAll() {
		const capabilities = [...$deviceUIStore.activeCapabilities];
		capabilities.forEach(cap => {
			deviceUIStore.deactivateCapability(cap.capability, cap.embedId);
		});
	}

	function handleShowToast(event: CustomEvent) {
		const { type, message, capability, duration } = event.detail;
		deviceUIStore.showToast({
			type,
			message,
			capability,
			duration
		});
	}

	onMount(() => {
		if (debugMode) {
			console.log('[DeviceControl] Mounted', { embedId });
		}

		// Set up custom event listeners
		const element = document.querySelector('sl-device-control');
		if (element) {
			element.addEventListener('request-permission', handleRequestPermission as EventListener);
			element.addEventListener('request-connection', handleRequestConnection as EventListener);
			element.addEventListener('activate-capability', handleActivateCapability as EventListener);
			element.addEventListener('deactivate-all', handleDeactivateAll);
			element.addEventListener('show-toast', handleShowToast as EventListener);
		}

		// Dispatch ready event
		dispatchEvent(
			new CustomEvent('ready', {
				detail: { embedId }
			})
		);

		// Example: Auto-show demo permission request in debug mode
		if (debugMode) {
			setTimeout(() => {
				deviceUIStore.requestPermission({
					capability: 'camera',
					embedId: 'Demo Embed',
					reason: 'For video streaming in multiplayer session',
					onApprove: (scope) => {
						console.log('[DeviceControl] Permission approved with scope:', scope);
						deviceUIStore.showToast({
							type: 'success',
							message: 'Camera permission granted',
							capability: 'camera'
						});
						
						// Simulate activating the capability
						deviceUIStore.activateCapability({
							capability: 'camera',
							embedId: 'Demo Embed',
							status: 'active',
							startedAt: Date.now()
						});
					},
					onDeny: () => {
						console.log('[DeviceControl] Permission denied');
						deviceUIStore.showToast({
							type: 'error',
							message: 'Camera permission denied'
						});
					}
				});
			}, 2000);
		}

		// Cleanup
		return () => {
			if (element) {
				element.removeEventListener('request-permission', handleRequestPermission as EventListener);
				element.removeEventListener('request-connection', handleRequestConnection as EventListener);
				element.removeEventListener('activate-capability', handleActivateCapability as EventListener);
				element.removeEventListener('deactivate-all', handleDeactivateAll);
				element.removeEventListener('show-toast', handleShowToast as EventListener);
			}
		};
	});
</script>

<!-- Device Control Provider - renders all UI components -->
<div class="device-control-provider">
	<!-- Permission Request Modal -->
	{#if $hasPermissionRequest}
		<DevicePermissionSheet />
	{/if}

	<!-- Connection Request Modal -->
	{#if $hasConnectionRequest}
		<DeviceConnectionSheet />
	{/if}

	<!-- Status Indicator (always mounted, shows when capabilities are active) -->
	<DeviceStatusIndicator />

	<!-- Capability Panel (side panel, shown when status indicator is clicked) -->
	<DeviceCapabilityPanel />

	<!-- Toast Notifications -->
	<DeviceToast />
</div>

<style>
	.device-control-provider {
		/* Provider is invisible but hosts all UI elements */
		position: relative;
		pointer-events: none;
	}

	/* Allow child elements to receive pointer events */
	.device-control-provider :global(*) {
		pointer-events: auto;
	}
</style>
