<script lang="ts">
	import '../global.css';
	import { createCrazyEightsStore } from '$lib/adapters/createCrazyEightsStore';
	import type { Suit } from '$lib/shared/deck';
	import CardsDefinitions from '$frontend/components/CardsDefinitions.svelte';
	import Card from '$frontend/components/Card.svelte';
	import Button from '$frontend/components/Button.svelte';

	const game = createCrazyEightsStore();
	const {
		player,
		bot,
		deck,
		gameState,
		message,
		lastAction,
		currentSuit,
		topCard,
		start,
		playCard,
		chooseSuit,
		drawCard
	} = game;

	function handleCardClick(index: number) {
		if ($gameState === 'player-turn') {
			playCard(index);
		}
	}

	function handleSuitChoice(suit: Suit) {
		chooseSuit(suit);
	}
</script>

<CardsDefinitions />

<main>
	<div class="container">
		<div class="header">
			<a href="/" class="back-button">← Back to Games</a>
			<h1>Crazy Eights</h1>
		</div>

		<div class="game-info">
			<div class="info-item">
				<span>Your Cards:</span>
				<strong>{$player.hand.length}</strong>
			</div>
			<div class="info-item">
				<span>Bot Cards:</span>
				<strong>{$bot.hand.length}</strong>
			</div>
			<div class="info-item">
				<span>Deck:</span>
				<strong>{$deck.remaining}</strong>
			</div>
		</div>

		<div class="message-box">
			<p class="message">{$message}</p>
			{#if $lastAction}
				<p class="last-action">{$lastAction}</p>
			{/if}
			{#if $currentSuit}
				<p class="current-suit">Current Suit: <span class="suit-badge">{$currentSuit}</span></p>
			{/if}
		</div>

		{#if $gameState === 'choosing-suit'}
			<div class="suit-selector">
				<h3>Choose a Suit:</h3>
				<div class="suits">
					<button class="suit-button heart" on:click={() => handleSuitChoice('heart')}
						>♥ Hearts</button
					>
					<button class="suit-button spade" on:click={() => handleSuitChoice('spade')}
						>♠ Spades</button
					>
					<button class="suit-button diamond" on:click={() => handleSuitChoice('diamond')}
						>♦ Diamonds</button
					>
					<button class="suit-button club" on:click={() => handleSuitChoice('club')}>♣ Clubs</button
					>
				</div>
			</div>
		{/if}

		<div class="game-area">
			<!-- Discard Pile -->
			<div class="discard-area">
				<h3>Discard Pile</h3>
				{#if $topCard}
					<div class="top-card">
						<Card name={$topCard.displayName} />
					</div>
				{:else}
					<div class="empty-pile">Empty</div>
				{/if}
			</div>

			<!-- Player Hand -->
			<div class="player-hand">
				<h3>Your Hand</h3>
				<div class="cards-row">
					{#each $player.hand as card, i}
						{#if $topCard}
							<button
								class="card-button"
								class:playable={$gameState === 'player-turn' &&
									$player.canPlayCard(card, $topCard, $currentSuit)}
								on:click={() => handleCardClick(i)}
								disabled={$gameState !== 'player-turn'}
							>
								<Card name={card.displayName} />
							</button>
						{/if}
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
			{:else if $gameState === 'player-turn'}
				<Button variant="draw" onclick={() => drawCard()}>Draw Card</Button>
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

	.game-info {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.info-item {
		background: rgba(0, 0, 0, 0.4);
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		border: 2px solid rgba(255, 215, 0, 0.3);
		color: #e8eaed;
	}

	.info-item strong {
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

	.current-suit {
		color: #e8eaed;
		font-size: 1rem;
		margin: 0.5rem 0 0 0;
	}

	.suit-badge {
		color: goldenrod;
		font-weight: bold;
		text-transform: capitalize;
	}

	.suit-selector {
		background: rgba(0, 0, 0, 0.5);
		border: 2px solid goldenrod;
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.suits {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.suit-button {
		padding: 1rem 2rem;
		font-size: 1.2rem;
		font-weight: bold;
		border-radius: 8px;
		border: 2px solid;
		cursor: pointer;
		transition: all 0.3s;
	}

	.suit-button.heart {
		background: #8b0000;
		color: white;
		border-color: #ff0000;
	}

	.suit-button.spade {
		background: #1a1a1a;
		color: white;
		border-color: #666;
	}

	.suit-button.diamond {
		background: #8b0000;
		color: white;
		border-color: #ff0000;
	}

	.suit-button.club {
		background: #1a1a1a;
		color: white;
		border-color: #666;
	}

	.suit-button:hover {
		transform: scale(1.1);
	}

	.game-area {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.discard-area {
		text-align: center;
	}

	.top-card {
		display: flex;
		justify-content: center;
	}

	.empty-pile {
		width: 200px;
		height: 250px;
		margin: 0 auto;
		border: 3px dashed rgba(255, 215, 0, 0.3);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 215, 0, 0.3);
		font-size: 1.5rem;
	}

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

	.card-button {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		transition:
			transform 0.2s,
			opacity 0.2s;
		opacity: 0.7;
	}

	.card-button.playable {
		opacity: 1;
	}

	.card-button.playable:hover {
		transform: translateY(-10px);
	}

	.card-button:disabled {
		cursor: not-allowed;
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

		.game-info {
			gap: 1rem;
		}

		.info-item {
			padding: 0.5rem 1rem;
			font-size: 0.9rem;
		}

		.message {
			font-size: 1rem;
		}

		.empty-pile {
			width: 120px;
			height: 150px;
		}
	}
</style>
