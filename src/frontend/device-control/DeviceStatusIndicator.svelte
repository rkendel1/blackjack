<script lang="ts">
	import { deviceUIStore, hasActiveCapabilities } from '../../backend/device-ui';
	import { fade } from 'svelte/transition';
	
	$: activeCapabilities = $deviceUIStore.activeCapabilities;
	$: hasActive = $hasActiveCapabilities;

	function handleClick() {
		deviceUIStore.togglePanel();
	}

	function getCapabilityColor(capability: string): string {
		const colors: Record<string, string> = {
			camera: '#34C759',
			microphone: '#FF9500',
			motion: '#007AFF',
			bluetooth: '#5E5CE6',
			wallet: '#32ADE6',
			screen_capture: '#AF52DE',
			location: '#FF3B30'
		};
		return colors[capability] || '#8e8e93';
	}

	function getCapabilityShortName(capability: string): string {
		const names: Record<string, string> = {
			camera: 'Cam',
			microphone: 'Mic',
			motion: 'Motion',
			bluetooth: 'BT',
			wallet: 'Wallet',
			screen_capture: 'Screen',
			location: 'Location'
		};
		return names[capability] || capability.substring(0, 3).toUpperCase();
	}
</script>

{#if hasActive}
	<button 
		class="status-indicator"
		on:click={handleClick}
		transition:fade={{ duration: 200 }}
		aria-label="Device Control Panel"
		title="Active capabilities - Click to view"
	>
		<div class="indicator-content">
			{#each activeCapabilities.slice(0, 3) as cap}
				<div 
					class="capability-dot" 
					style="background: {getCapabilityColor(cap.capability)}"
					title={cap.capability}
				>
					{#if activeCapabilities.length === 1}
						<span class="capability-label">{getCapabilityShortName(cap.capability)}</span>
					{/if}
				</div>
			{/each}
			{#if activeCapabilities.length > 3}
				<div class="more-indicator">+{activeCapabilities.length - 3}</div>
			{/if}
		</div>
	</button>
{/if}

<style>
	.status-indicator {
		position: fixed;
		top: 20px;
		right: 80px;
		z-index: 9998;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		border: none;
		border-radius: 20px;
		padding: 8px 16px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
		cursor: pointer;
		transition: all 0.2s;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
	}

	.status-indicator:hover {
		transform: scale(1.05);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
	}

	.status-indicator:active {
		transform: scale(0.98);
	}

	.indicator-content {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.capability-dot {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: pulse 2s infinite;
	}

	.capability-label {
		font-size: 9px;
		font-weight: 600;
		color: white;
		text-transform: uppercase;
	}

	.more-indicator {
		font-size: 12px;
		font-weight: 600;
		color: #8e8e93;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	@media (max-width: 768px) {
		.status-indicator {
			top: 10px;
			right: 60px;
			padding: 6px 12px;
		}

		.capability-dot {
			width: 20px;
			height: 20px;
		}

		.capability-label {
			font-size: 8px;
		}
	}
</style>
