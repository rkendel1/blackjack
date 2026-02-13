<script lang="ts">
	import type { Turn, Winner } from '../../backend/games/blackjack/store';
	import Button from './Button.svelte';

	export let winner: Winner;
	export let inGame: boolean;
	export let turn: Turn;
	export let draw: () => void;
	export let stop: () => void;
	export let start: () => void;
	export let restart: () => void;

	$: winnerText = winner === 'Draw' ? 'Draw' : `${winner} won!`;
</script>

<div>
	{#if winner}
		<Button variant="deal" onclick={restart}>
			<span>{winnerText}</span> Start again
		</Button>
	{:else if inGame}
		<Button variant="draw" disabled={turn === 'Dealer'} onclick={draw}>Draw</Button>
		<Button variant="stop" disabled={turn === 'Dealer'} onclick={stop}>Stop</Button>
	{:else}
		<Button variant="deal" onclick={start}>Start game</Button>
	{/if}
</div>

<style>
	div {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 20px;
		height: 36px;
	}

	span {
		color: goldenrod;
		padding-right: 6px;
		margin-right: 3px;
		border-right: 2px solid rgba(255, 255, 255, 0.759);
	}
</style>
