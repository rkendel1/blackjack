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

	onMount(() => {
		if (debugMode) {
			console.log('[DeviceControl] Mounted', { embedId });
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
