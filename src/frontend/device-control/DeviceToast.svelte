<script lang="ts">
	import { deviceUIStore } from '../../backend/device-ui';
	import { fade, fly } from 'svelte/transition';
	
	$: toasts = $deviceUIStore.toasts;

	function getIcon(type: string) {
		switch (type) {
			case 'success':
				return '✓';
			case 'error':
				return '✕';
			case 'warning':
				return '⚠';
			case 'info':
			default:
				return 'ⓘ';
		}
	}

	function handleDismiss(id: string) {
		deviceUIStore.dismissToast(id);
	}
</script>

<div class="toast-container">
	{#each toasts as toast (toast.id)}
		<div 
			class="toast toast-{toast.type}" 
			transition:fly={{ y: -20, duration: 300 }}
		>
			<div class="toast-icon">{getIcon(toast.type)}</div>
			<div class="toast-message">{toast.message}</div>
			<button 
				class="toast-dismiss" 
				on:click={() => handleDismiss(toast.id)}
				aria-label="Dismiss"
			>
				✕
			</button>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 10000;
		display: flex;
		flex-direction: column;
		gap: 12px;
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		background: rgba(255, 255, 255, 0.95);
		border-radius: 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
		backdrop-filter: blur(20px);
		min-width: 300px;
		max-width: 400px;
		pointer-events: auto;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
	}

	.toast-icon {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		font-weight: bold;
		flex-shrink: 0;
	}

	.toast-success .toast-icon {
		background: #34C759;
		color: white;
	}

	.toast-error .toast-icon {
		background: #FF3B30;
		color: white;
	}

	.toast-warning .toast-icon {
		background: #FF9500;
		color: white;
	}

	.toast-info .toast-icon {
		background: #007AFF;
		color: white;
	}

	.toast-message {
		flex: 1;
		font-size: 15px;
		color: #000;
		line-height: 1.4;
	}

	.toast-dismiss {
		background: none;
		border: none;
		color: #8e8e93;
		font-size: 18px;
		cursor: pointer;
		padding: 4px;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: background 0.2s;
	}

	.toast-dismiss:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	@media (max-width: 768px) {
		.toast-container {
			top: 10px;
			right: 10px;
			left: 10px;
		}

		.toast {
			min-width: auto;
			max-width: 100%;
		}
	}
</style>
