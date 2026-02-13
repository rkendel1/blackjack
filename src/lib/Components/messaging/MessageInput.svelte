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
		align-items: flex-end;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-top: 0.5px solid #d1d1d6;
		background: #f8f8f8;
		min-height: 52px;
	}

	.media-button {
		background: none;
		border: none;
		font-size: 1.625rem;
		cursor: pointer;
		padding: 0.375rem;
		line-height: 1;
		color: #007aff;
		opacity: 0.9;
		transition: all 0.15s;
		flex-shrink: 0;
		border-radius: 50%;
		width: 34px;
		height: 34px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 0.125rem;
	}

	.media-button:hover {
		opacity: 1;
		background: rgba(0, 122, 255, 0.1);
	}

	.media-button:active {
		opacity: 0.5;
		background: rgba(0, 122, 255, 0.2);
	}

	.input-wrapper {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
	}

	.text-input {
		width: 100%;
		padding: 0.5rem 0.875rem;
		border: 1px solid #c7c7cc;
		border-radius: 20px;
		font-size: 1.0625rem;
		outline: none;
		background: #ffffff;
		transition: all 0.2s;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
		resize: none;
		min-height: 36px;
		max-height: 100px;
		line-height: 1.35;
	}

	.text-input:focus {
		background: #ffffff;
		border-color: #007aff;
		box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
	}

	.text-input::placeholder {
		color: #8e8e93;
	}

	.send-button {
		width: 34px;
		height: 34px;
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
		margin-bottom: 0.125rem;
		box-shadow: 0 2px 4px rgba(0, 122, 255, 0.3);
	}

	.send-button:disabled {
		background: #c7c7cc;
		cursor: not-allowed;
		box-shadow: none;
	}

	.send-button:not(:disabled):hover {
		background: #0051d5;
		transform: scale(1.05);
		box-shadow: 0 3px 6px rgba(0, 122, 255, 0.4);
	}

	.send-button:not(:disabled):active {
		transform: scale(0.95);
	}
</style>
