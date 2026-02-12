<script lang="ts">
	import '../global.css';
	import { createWarGame } from '$lib/games/war/store';
	import CardsDefinitions from '$lib/Components/CardsDefinitions.svelte';
	import Card from '$lib/Components/Card.svelte';
	import Button from '$lib/Components/Button.svelte';

	const game = createWarGame();
	const { player, opponent, state, playerCard, opponentCard, message, warCount, start, playRound } =
		game;
</script>

<CardsDefinitions />

<main>
	<div class="container">
		<div class="header">
			<a href="/" class="back-button">← Back to Games</a>
			<h1>War</h1>
		</div>

		<div class="game-board">
			<!-- Opponent Section -->
			<div class="player-section">
				<h2>Bot</h2>
				<div class="card-count">Cards: {$opponent.totalCards}</div>
				<div class="card-area">
					{#if $opponentCard}
						<Card name={$opponentCard.displayName} />
					{:else}
						<div class="empty-slot">?</div>
					{/if}
				</div>
			</div>

			<!-- Message Area -->
			<div class="message-area">
				<p class="message">{$message}</p>
				{#if $warCount > 0}
					<p class="war-indicator">WAR x{$warCount}</p>
				{/if}
			</div>

			<!-- Player Section -->
			<div class="player-section">
				<h2>You</h2>
				<div class="card-count">Cards: {$player.totalCards}</div>
				<div class="card-area">
					{#if $playerCard}
						<Card name={$playerCard.displayName} />
					{:else}
						<div class="empty-slot">?</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Controls -->
		<div class="controls">
			{#if $state === 'ready' || $state === 'won'}
				<Button variant="deal" onclick={() => start()}>
					{$state === 'ready' ? 'Start Game' : 'Play Again'}
				</Button>
			{:else if $state === 'playing' || $state === 'war'}
				<Button variant="draw" onclick={() => playRound()}>Play Card</Button>
			{/if}
		</div>
	</div>
</main>

<style>
	main {
		min-height: 100dvh;
		width: 100dvw;
		background: radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);
		padding: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.container {
		max-width: 800px;
		width: 100%;
	}

	.header {
		text-align: center;
		margin-bottom: 2rem;
		position: relative;
	}

	.back-button {
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		color: goldenrod;
		text-decoration: none;
		font-size: 1rem;
		transition: opacity 0.3s;
	}

	.back-button:hover {
		opacity: 0.8;
	}

	h1 {
		font-size: 2.5rem;
		color: goldenrod;
		margin: 0;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
	}

	h2 {
		font-size: 1.5rem;
		color: #e8eaed;
		margin: 0 0 0.5rem 0;
	}

	.game-board {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.player-section {
		text-align: center;
	}

	.card-count {
		color: goldenrod;
		font-size: 1.2rem;
		font-weight: bold;
		margin-bottom: 1rem;
	}

	.card-area {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 250px;
	}

	.empty-slot {
		width: 200px;
		height: 250px;
		border: 3px dashed rgba(255, 215, 0, 0.3);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 4rem;
		color: rgba(255, 215, 0, 0.3);
	}

	.message-area {
		text-align: center;
		padding: 1.5rem;
		background: rgba(0, 0, 0, 0.4);
		border-radius: 12px;
		border: 2px solid rgba(255, 215, 0, 0.3);
	}

	.message {
		font-size: 1.3rem;
		color: #e8eaed;
		margin: 0;
		font-weight: bold;
	}

	.war-indicator {
		font-size: 2rem;
		color: #ff4444;
		margin: 0.5rem 0 0 0;
		font-weight: bold;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
		animation: pulse 1s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.controls {
		display: flex;
		justify-content: center;
		gap: 1rem;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 2rem;
		}

		.back-button {
			position: static;
			display: block;
			margin-bottom: 1rem;
			transform: none;
		}

		.card-area {
			min-height: 150px;
		}

		.empty-slot {
			width: 120px;
			height: 150px;
			font-size: 3rem;
		}

		.message {
			font-size: 1.1rem;
		}

		.war-indicator {
			font-size: 1.5rem;
		}
	}
</style>
