<script lang="ts">
	import type { FilterPreset } from '$lib/multiplayer/types';

	export let presets: FilterPreset[] = [];
	export let selectedFilterId: string | null = null;
	export let onFilterSelect: (filterId: string) => void;

	function handleFilterClick(filterId: string) {
		selectedFilterId = filterId;
		onFilterSelect(filterId);
	}
</script>

<div class="filter-selector">
	<h3>AR Filters</h3>
	
	<div class="filter-grid">
		{#each presets as preset}
			<button
				class="filter-item"
				class:selected={selectedFilterId === preset.id}
				on:click={() => handleFilterClick(preset.id)}
			>
				<div class="filter-thumbnail">
					{#if preset.thumbnailUrl}
						<img src={preset.thumbnailUrl} alt={preset.name} />
					{:else}
						<div class="filter-placeholder">
							<span class="filter-icon">
								{#if preset.type === 'face'}🎭{/if}
								{#if preset.type === 'body'}👤{/if}
								{#if preset.type === 'environment'}🌍{/if}
								{#if preset.type === 'object'}📦{/if}
							</span>
						</div>
					{/if}
				</div>
				<div class="filter-name">{preset.name}</div>
				<div class="filter-category">{preset.category || preset.type}</div>
			</button>
		{/each}
	</div>
</div>

<style>
	.filter-selector {
		padding: 16px;
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	h3 {
		margin: 0 0 16px 0;
		font-size: 18px;
		font-weight: 600;
		color: #2d3748;
	}

	.filter-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 12px;
	}

	.filter-item {
		background: #f7fafc;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		padding: 8px;
		cursor: pointer;
		transition: all 0.2s;
		text-align: center;
	}

	.filter-item:hover {
		border-color: #cbd5e0;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.filter-item.selected {
		border-color: #4299e1;
		background: #ebf8ff;
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

	.filter-name {
		font-size: 12px;
		font-weight: 600;
		color: #2d3748;
		margin-bottom: 4px;
	}

	.filter-category {
		font-size: 10px;
		color: #718096;
		text-transform: uppercase;
	}

	@media (max-width: 768px) {
		.filter-grid {
			grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
			gap: 8px;
		}

		.filter-item {
			padding: 6px;
		}

		.filter-name {
			font-size: 11px;
		}

		.filter-category {
			font-size: 9px;
		}
	}
</style>
