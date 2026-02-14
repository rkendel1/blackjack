<svelte:options customElement="sl-wallet-demo" />

<script lang="ts">
	import { useStackLiveDevice } from '../../backend/device-runtime/useStackLiveDevice';

	export let embedid = 'wallet-demo';

	const device = useStackLiveDevice({ embedId: embedid });

	let amount = 5.00;
	let status = '';
	let processing = false;

	async function initiatePayment() {
		if (!device.wallet.isSupported()) {
			status = '✗ Wallet/Payment not supported on this device';
			return;
		}

		processing = true;
		status = 'Initializing payment...';

		try {
			// Request wallet capability
			const state = await device.wallet.start();
			
			// In a real implementation, this would use PaymentRequest API
			status = `✓ Payment capability ready. Would charge $${amount.toFixed(2)}`;
			
			// Simulate payment
			setTimeout(() => {
				status = `✓ Payment of $${amount.toFixed(2)} processed successfully!`;
				processing = false;
			}, 1500);

		} catch (error) {
			status = `✗ Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
			processing = false;
		}
	}
</script>

<div class="wallet-demo">
	<h2>💳 Wallet Payment Demo</h2>
	<p>Demonstrate in-embed payment capability</p>

	<div class="payment-card">
		<div class="amount-selector">
			<label for="amount">Payment Amount</label>
			<div class="amount-input">
				<span class="currency">$</span>
				<input 
					id="amount"
					type="number" 
					bind:value={amount} 
					min="0.01" 
					step="0.01"
					disabled={processing}
				/>
			</div>
		</div>

		<button 
			on:click={initiatePayment}
			disabled={processing || !device.wallet.isSupported()}
			class="pay-button"
		>
			{#if processing}
				Processing...
			{:else if !device.wallet.isSupported()}
				Wallet Not Supported
			{:else}
				Pay ${amount.toFixed(2)}
			{/if}
		</button>

		{#if status}
			<div class="status" class:error={status.includes('✗')}>
				{status}
			</div>
		{/if}
	</div>

	<div class="info">
		<h3>Payment Methods</h3>
		<div class="payment-methods">
			<div class="method">🍎 Apple Pay</div>
			<div class="method">📱 Google Pay</div>
			<div class="method">💳 Card</div>
		</div>
	</div>
</div>

<style>
	.wallet-demo {
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		max-width: 500px;
		margin: 0 auto;
	}

	h2 {
		text-align: center;
		color: #333;
		margin-bottom: 10px;
	}

	p {
		text-align: center;
		color: #666;
		margin-bottom: 30px;
	}

	.payment-card {
		background: white;
		padding: 30px;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		margin-bottom: 20px;
	}

	.amount-selector {
		margin-bottom: 20px;
	}

	label {
		display: block;
		font-size: 14px;
		color: #666;
		margin-bottom: 10px;
		font-weight: 600;
	}

	.amount-input {
		display: flex;
		align-items: center;
		background: #f5f5f7;
		border-radius: 12px;
		padding: 15px;
	}

	.currency {
		font-size: 24px;
		font-weight: 700;
		color: #333;
		margin-right: 10px;
	}

	input {
		flex: 1;
		border: none;
		background: transparent;
		font-size: 32px;
		font-weight: 700;
		color: #007AFF;
		outline: none;
	}

	input:disabled {
		opacity: 0.5;
	}

	.pay-button {
		width: 100%;
		padding: 16px;
		background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
		color: white;
		border: none;
		border-radius: 12px;
		font-size: 18px;
		font-weight: 700;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
		box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
	}

	.pay-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(0, 122, 255, 0.4);
	}

	.pay-button:disabled {
		background: #d1d1d6;
		cursor: not-allowed;
		box-shadow: none;
	}

	.status {
		margin-top: 15px;
		padding: 12px;
		border-radius: 8px;
		background: #E8F5E9;
		color: #2E7D32;
		text-align: center;
		font-weight: 600;
	}

	.status.error {
		background: #FFEBEE;
		color: #C62828;
	}

	.info {
		background: #f5f5f7;
		padding: 20px;
		border-radius: 12px;
	}

	h3 {
		margin: 0 0 15px 0;
		color: #333;
		font-size: 16px;
	}

	.payment-methods {
		display: flex;
		gap: 10px;
		justify-content: center;
	}

	.method {
		background: white;
		padding: 10px 20px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}
</style>
