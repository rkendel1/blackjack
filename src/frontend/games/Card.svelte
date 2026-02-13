<script lang="ts">
	import { flyAndFlip } from '../../backend/animation';

	export let name: string;
</script>

<div class="card" in:flyAndFlip>
	<svg class="back">
		<use href="#back" />
	</svg>

	<svg class="front">
		<use href={`#${name}`} />
	</svg>
</div>

<style>
	.card {
		position: relative;
		width: 200px;
		height: 250px;
		transform-style: preserve-3d;
		perspective: 1000px;
		z-index: 10;
	}

	svg {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.back {
		z-index: 1;
	}

	.front {
		backface-visibility: hidden;
		z-index: 2;
	}

	@media (max-width: 768px) {
		.card {
			width: 80px;
			height: 112px;
		}
	}
</style>
