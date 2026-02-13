<script lang="ts">
	import '../global.css';
	import { createOldMaidStore } from '../../backend/adapters/createOldMaidStore';
	import CardsDefinitions from '$frontend/games/CardsDefinitions.svelte';
	import Card from '$frontend/games/Card.svelte';
	import Button from '$frontend/components/Button.svelte';

	const game = createOldMaidStore();
	const { player, bot, gameState, message, lastAction, start, playerDrawCard } = game;

	function handleCardClick(index: number) {
		if ($gameState === 'player-turn') {
			playerDrawCard(index);
		}
	}
</script>

<CardsDefinitions />

<main>
	<div class="container">
		<div class="header">
			<a href="/" class="back-button">← Back to Games</a>
			<h1>Old Maid</h1>
		</div>

		<div class="scores">
			<div class="score-item">
				<span>Your Pairs:</span>
				<strong>{$player.pairCount}</strong>
			</div>
			<div class="score-item">
				<span>Bot Pairs:</span>
				<strong>{$bot.pairCount}</strong>
			</div>
		</div>

		<div class="message-box">
			<p class="message">{$message}</p>
			{#if $lastAction}
				<p class="last-action">{$lastAction}</p>
			{/if}
		</div>

		<div class="game-area">
			<!-- Computer Hand -->
			<div class="opponent-hand">
				<h3>Bot ({$bot.hand.length} cards)</h3>
				<div class="cards-row">
					<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
					{#each $bot.hand as _, i}
						<button
							class="card-back-button"
							class:selectable={$gameState === 'player-turn'}
							on:click={() => handleCardClick(i)}
							disabled={$gameState !== 'player-turn'}
						>
							<div class="card-back">?</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Player Hand -->
			<div class="player-hand">
				<h3>Your Hand ({$player.hand.length} cards)</h3>
				<div class="cards-row">
					{#each $player.hand as card}
						<div class="player-card">
							<Card name={card.displayName} />
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Controls -->
		<div class="controls">
			{#if $gameState === 'ready' || $gameState === 'won'}
				<Button variant="deal" onclick={() => start()}>
					{$gameState === 'ready' ? 'Start Game' : 'Play Again'}
				</Button>
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
		max-width: 1200px;
		width: 100%;
	}

	.header {
		text-align: center;
		margin-bottom: 1.5rem;
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

	h3 {
		color: #e8eaed;
		margin: 0 0 1rem 0;
		font-size: 1.2rem;
	}

	.scores {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.score-item {
		background: rgba(0, 0, 0, 0.4);
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		border: 2px solid rgba(255, 215, 0, 0.3);
		color: #e8eaed;
	}

	.score-item strong {
		color: goldenrod;
		margin-left: 0.5rem;
		font-size: 1.2rem;
	}

	.message-box {
		background: rgba(0, 0, 0, 0.4);
		border: 2px solid rgba(255, 215, 0, 0.3);
		border-radius: 12px;
		padding: 1rem;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.message {
		color: goldenrod;
		font-size: 1.2rem;
		font-weight: bold;
		margin: 0;
	}

	.last-action {
		color: #c4c4cc;
		font-size: 0.95rem;
		margin: 0.5rem 0 0 0;
	}

	.game-area {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.opponent-hand,
	.player-hand {
		background: rgba(0, 0, 0, 0.3);
		border: 2px solid rgba(255, 215, 0, 0.2);
		border-radius: 12px;
		padding: 1.5rem;
	}

	.cards-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.card-back-button {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.card-back {
		width: 80px;
		height: 112px;
		background: rgba(139, 0, 0, 0.6);
		border: 2px solid rgba(255, 215, 0, 0.4);
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		color: rgba(255, 215, 0, 0.6);
		transition:
			transform 0.2s,
			border-color 0.2s;
	}

	.card-back-button.selectable:hover .card-back {
		transform: translateY(-10px);
		border-color: goldenrod;
	}

	.card-back-button:disabled {
		cursor: not-allowed;
	}

	.player-card {
		opacity: 0.9;
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

		.scores {
			gap: 1rem;
		}

		.score-item {
			padding: 0.5rem 1rem;
			font-size: 0.9rem;
		}

		.message {
			font-size: 1rem;
		}

		.card-back {
			width: 60px;
			height: 84px;
			font-size: 1.5rem;
		}
	}
</style>
