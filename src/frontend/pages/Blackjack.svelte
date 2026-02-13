<script lang="ts">
	import '../global.css';
	import audioPath from '../../backend/assets/draw.mp3';
	import { createBlackjackStore } from '../../backend/adapters/createBlackjackStore';

	import GameControlls from '$frontend/components/GameControlls.svelte';
	import CardsDefinitions from '$frontend/components/CardsDefinitions.svelte';
	import Deck from '$frontend/components/Deck.svelte';
	import Hand from '$frontend/components/Hand.svelte';
	import { onMount } from 'svelte';

	const game = createBlackjackStore();
	const { player, dealer, winner, turn, inGame } = game;

	onMount(() => {
		// Setting audio in onMount since Audio is not present on the server
		game.setAudio(new Audio(audioPath));
	});
</script>

<CardsDefinitions />

<section>
	<Deck />
	<div>
		<Hand hand={$dealer.hand} score={$dealer.score} />

		<GameControlls
			winner={$winner}
			inGame={$inGame}
			turn={$turn}
			draw={() => game.playerTurn('draw')}
			stop={() => game.playerTurn('stop')}
			start={() => game.start()}
			restart={() => game.start(true)}
		/>

		<Hand hand={$player.hand} score={$player.score} />
	</div>
</section>

<style>
	section {
		display: flex;
		height: 100dvh;
		width: 100dvw;
		background: radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);
	}

	div {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 48px;
		gap: 20px;
	}

	@media (max-width: 768px) {
		div {
			padding: 16px 8px;
			gap: 12px;
		}
	}
</style>
