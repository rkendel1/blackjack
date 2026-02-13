<script lang="ts">
	import type { Card } from '../../backend/shared/deck';

	export let card: Card;
	export let faceUp: boolean = true;
</script>

<div class="solitaire-card" class:face-down={!faceUp}>
	{#if faceUp}
		<svg>
			<use href={`#${card.displayName}`} />
		</svg>
	{:else}
		<svg>
			<use href="#back" />
		</svg>
	{/if}
</div>

<style>
	.solitaire-card {
		width: 80px;
		height: 110px;
		border-radius: 8px;
		background: white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		overflow: hidden;
		position: relative;
	}

	svg {
		width: 100%;
		height: 100%;
		display: block;
	}

	.face-down svg {
		transform: none;
	}

	@media (max-width: 768px) {
		.solitaire-card {
			width: 60px;
			height: 85px;
		}
	}
</style>
