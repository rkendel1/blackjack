<script lang="ts">
	export let onSendMessage: (text: string) => void;
	export let onSendMedia: (mediaUrl: string, mediaType: string, caption?: string) => void;

	let inputText = '';
	let fileInput: HTMLInputElement;

	function handleSend() {
		if (inputText.trim()) {
			onSendMessage(inputText);
			inputText = '';
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	}

	function handleMediaClick() {
		fileInput.click();
	}

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		// In a real implementation, you would upload the file to a server
		// and get back a URL. For demo purposes, we'll use a data URL
		const reader = new FileReader();
		reader.onload = (e) => {
			const dataUrl = e.target?.result as string;
			onSendMedia(dataUrl, file.type, inputText || undefined);
			inputText = '';
			target.value = ''; // Reset file input
		};
		reader.readAsDataURL(file);
	}
</script>

<div class="message-input">
	<button class="media-button" on:click={handleMediaClick} title="Send photo or video">
		<span>📷</span>
	</button>

	<input
		type="file"
		bind:this={fileInput}
		on:change={handleFileSelect}
		accept="image/*,video/*,audio/*"
		style="display: none;"
	/>

	<div class="input-wrapper">
		<input
			type="text"
			bind:value={inputText}
			on:keypress={handleKeyPress}
			placeholder="iMessage"
			class="text-input"
		/>
	</div>

	<button
		class="send-button"
		on:click={handleSend}
		disabled={!inputText.trim()}
		title="Send message"
	>
		<span>↑</span>
	</button>
</div>

<style>
	.message-input {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-top: 1px solid #e5e5e5;
		background: #ffffff;
	}

	.media-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
		opacity: 0.7;
		transition: opacity 0.15s;
		flex-shrink: 0;
	}

	.media-button:hover {
		opacity: 1;
	}

	.input-wrapper {
		flex: 1;
		min-width: 0;
	}

	.text-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #e5e5e5;
		border-radius: 18px;
		font-size: 0.9375rem;
		outline: none;
		background: #f9f9f9;
		transition: background 0.15s;
	}

	.text-input:focus {
		background: #ffffff;
		border-color: #007aff;
	}

	.send-button {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: none;
		background: #007aff;
		color: white;
		font-size: 1.25rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s;
		flex-shrink: 0;
	}

	.send-button:disabled {
		background: #e5e5e5;
		cursor: not-allowed;
	}

	.send-button:not(:disabled):hover {
		background: #0051d5;
		transform: scale(1.05);
	}

	.send-button:not(:disabled):active {
		transform: scale(0.95);
	}
</style>
