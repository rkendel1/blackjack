<svelte:options customElement="sl-arvr-filter" />

<script lang="ts">
	import { onMount } from 'svelte';

	// Exposed attributes
	export let filterType: 'face' | 'body' | 'environment' | 'object' = 'face';
	export let filterName: string = 'beauty';
	export let intensity: string = '0.5';
	export let thumbnailUrl: string = '';

	$: intensityValue = parseFloat(intensity) || 0.5;

	onMount(() => {
		dispatchEvent(
			new CustomEvent('filter-loaded', {
				detail: { filterType, filterName, intensity: intensityValue }
			})
		);
	});

	function handleClick() {
		dispatchEvent(
			new CustomEvent('filter-selected', {
				detail: { filterType, filterName, intensity: intensityValue }
			})
		);
	}
</script>

<button class="arvr-filter" on:click={handleClick}>
	<div class="filter-thumbnail">
		{#if thumbnailUrl}
			<img src={thumbnailUrl} alt={filterName} />
		{:else}
			<div class="filter-placeholder">
				<span class="filter-icon">
					{#if filterType === 'face'}🎭{/if}
					{#if filterType === 'body'}👤{/if}
					{#if filterType === 'environment'}🌍{/if}
					{#if filterType === 'object'}📦{/if}
				</span>
			</div>
		{/if}
	</div>
	<div class="filter-info">
		<div class="filter-name">{filterName}</div>
		<div class="filter-type">{filterType}</div>
		<div class="filter-intensity">
			<div class="intensity-bar">
				<div class="intensity-fill" style="width: {intensityValue * 100}%"></div>
			</div>
		</div>
	</div>
</button>

<style>
	.arvr-filter {
		display: flex;
		flex-direction: column;
		background: #f7fafc;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		padding: 8px;
		cursor: pointer;
		transition: all 0.2s;
		width: 120px;
	}

	.arvr-filter:hover {
		border-color: #cbd5e0;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.filter-thumbnail {
		width: 100%;
		aspect-ratio: 1;
		border-radius: 4px;
		overflow: hidden;
		background: #edf2f7;
		margin-bottom: 8px;
	}

	.filter-thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.filter-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.filter-icon {
		font-size: 36px;
	}

	.filter-info {
		text-align: center;
	}

	.filter-name {
		font-size: 12px;
		font-weight: 600;
		color: #2d3748;
		margin-bottom: 4px;
		text-transform: capitalize;
	}

	.filter-type {
		font-size: 10px;
		color: #718096;
		text-transform: uppercase;
		margin-bottom: 6px;
	}

	.intensity-bar {
		height: 4px;
		background: #e2e8f0;
		border-radius: 2px;
		overflow: hidden;
	}

	.intensity-fill {
		height: 100%;
		background: #4299e1;
		transition: width 0.3s;
	}
</style>
