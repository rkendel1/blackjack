<script lang="ts">
	import '../global.css';
	import { createKlondikeStore } from '$lib/adapters/createKlondikeStore';
	import CardsDefinitions from '$frontend/components/CardsDefinitions.svelte';
	import Card from '$frontend/components/SolitaireCard.svelte';
	import Button from '$frontend/components/Button.svelte';
	import { onMount } from 'svelte';

	const game = createKlondikeStore();
	const { tableau, foundations, stock, waste, revealedTableau, moves, isWon, autoPlayAvailable } =
		game;

	let draggedCard: { from: 'waste' | 'tableau'; index?: number; cardIndex?: number } | null = null;

	onMount(() => {
		game.newGame();
	});

	function handleDragStart(from: 'waste' | 'tableau', index?: number, cardIndex?: number) {
		draggedCard = { from, index, cardIndex };
	}

	function handleDrop(to: 'tableau' | 'foundation', toIndex: number) {
		if (!draggedCard) return;

		if (draggedCard.from === 'waste') {
			if (to === 'tableau') {
				game.moveWasteToTableau(toIndex);
			} else if (to === 'foundation') {
				game.moveWasteToFoundation(toIndex);
			}
		} else if (draggedCard.from === 'tableau' && draggedCard.index !== undefined) {
			if (to === 'tableau') {
				game.moveTableauToTableau(draggedCard.index, draggedCard.cardIndex || 0, toIndex);
			} else if (to === 'foundation' && draggedCard.cardIndex !== undefined) {
				const pile = $tableau[draggedCard.index];
				// Only allow moving the top card to foundation
				if (draggedCard.cardIndex === pile.length - 1) {
					game.moveTableauToFoundation(draggedCard.index, toIndex);
				}
			}
		}

		draggedCard = null;
	}

	function handleCardClick(from: 'waste' | 'tableau', index?: number, cardIndex?: number) {
		// Try to auto-place on foundation
		if (from === 'waste') {
			for (let f = 0; f < $foundations.length; f++) {
				if (game.moveWasteToFoundation(f)) {
					return;
				}
			}
		} else if (from === 'tableau' && index !== undefined && cardIndex !== undefined) {
			const pile = $tableau[index];
			if (cardIndex === pile.length - 1) {
				for (let f = 0; f < $foundations.length; f++) {
					if (game.moveTableauToFoundation(index, f)) {
						return;
					}
				}
			}
		}
	}
</script>

<CardsDefinitions />

<main>
	<div class="game-container">
		<!-- Header -->
		<div class="header">
			<h1>🃏 Klondike Solitaire</h1>
			<div class="stats">
				<span>Moves: {$moves}</span>
			</div>
			<div class="actions">
				{#if $autoPlayAvailable}
					<Button onclick={() => game.autoPlay()} variant="draw">Auto Play</Button>
				{/if}
				<Button onclick={() => game.newGame()} variant="stop">New Game</Button>
			</div>
		</div>

		<!-- Top Row: Stock, Waste, and Foundations -->
		<div class="top-row">
			<!-- Stock -->
			<div class="stock-area">
				<div
					class="stock"
					on:click={() => game.drawFromStock()}
					role="button"
					tabindex="0"
					on:keydown={(e) => e.key === 'Enter' && game.drawFromStock()}
				>
					{#if $stock.length > 0}
						<Card card={$stock[0]} faceUp={false} />
						<div class="stock-count">{$stock.length}</div>
					{:else}
						<div class="empty-pile">♻️</div>
					{/if}
				</div>

				<!-- Waste -->
				<div
					class="waste"
					role="region"
					aria-label="Waste pile"
					on:dragover={(e) => e.preventDefault()}
				>
					{#if $waste.length > 0}
						{#each $waste.slice(-3) as card, i}
							<div
								class="waste-card"
								style="left: {i * 20}px"
								draggable="true"
								on:dragstart={() => handleDragStart('waste')}
								on:click={() => handleCardClick('waste')}
								role="button"
								tabindex="0"
								on:keydown={(e) => e.key === 'Enter' && handleCardClick('waste')}
							>
								<Card {card} faceUp={true} />
							</div>
						{/each}
					{:else}
						<div class="empty-pile"></div>
					{/if}
				</div>
			</div>

			<div class="spacer"></div>

			<!-- Foundations -->
			<div class="foundations">
				{#each $foundations as foundation, i}
					<div
						class="foundation"
						on:dragover={(e) => e.preventDefault()}
						on:drop={() => handleDrop('foundation', i)}
						role="button"
						tabindex="0"
					>
						{#if foundation.cards.length > 0}
							<Card card={foundation.cards[foundation.cards.length - 1]} faceUp={true} />
						{:else}
							<div class="empty-pile foundation-suit">
								{#if foundation.suit === 'heart'}
									♥
								{:else if foundation.suit === 'diamond'}
									♦
								{:else if foundation.suit === 'club'}
									♣
								{:else}
									♠
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Tableau -->
		<div class="tableau">
			{#each $tableau as pile, i}
				<div
					class="tableau-pile"
					on:dragover={(e) => e.preventDefault()}
					on:drop={() => handleDrop('tableau', i)}
					role="button"
					tabindex="0"
				>
					{#if pile.length === 0}
						<div class="empty-pile tableau-empty"></div>
					{:else}
						{#each pile as card, cardIndex}
							<div
								class="tableau-card"
								style="top: {cardIndex * 25}px"
								draggable={$revealedTableau[i][cardIndex]}
								on:dragstart={() => handleDragStart('tableau', i, cardIndex)}
								on:click={() => handleCardClick('tableau', i, cardIndex)}
								role="button"
								tabindex={$revealedTableau[i][cardIndex] ? 0 : -1}
								on:keydown={(e) => e.key === 'Enter' && handleCardClick('tableau', i, cardIndex)}
							>
								<Card {card} faceUp={$revealedTableau[i][cardIndex]} />
							</div>
						{/each}
					{/if}
				</div>
			{/each}
		</div>

		{#if $isWon}
			<div class="win-overlay">
				<div class="win-message">
					<h2>🎉 Congratulations! 🎉</h2>
					<p>You won in {$moves} moves!</p>
					<Button onclick={() => game.newGame()} variant="stop">Play Again</Button>
				</div>
			</div>
		{/if}
	</div>
</main>

<style>
	main {
		min-height: 100dvh;
		width: 100dvw;
		background: radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);
		padding: 20px;
		overflow-x: hidden;
	}

	.game-container {
		max-width: 1200px;
		margin: 0 auto;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	h1 {
		font-size: 2rem;
		color: goldenrod;
		margin: 0;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
	}

	.stats {
		color: #e8eaed;
		font-size: 1.2rem;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.top-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 3rem;
		gap: 1rem;
	}

	.stock-area {
		display: flex;
		gap: 1rem;
	}

	.stock,
	.waste,
	.foundation {
		position: relative;
		width: 80px;
		height: 110px;
		border-radius: 8px;
		cursor: pointer;
	}

	.stock {
		border: 2px dashed rgba(255, 215, 0, 0.3);
	}

	.waste {
		position: relative;
		width: 140px;
	}

	.waste-card {
		position: absolute;
		top: 0;
	}

	.stock-count {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: goldenrod;
		font-weight: bold;
		font-size: 1.5rem;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
		pointer-events: none;
	}

	.spacer {
		flex-grow: 1;
	}

	.foundations {
		display: flex;
		gap: 1rem;
	}

	.foundation {
		border: 2px solid rgba(255, 215, 0, 0.3);
	}

	.empty-pile {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		font-size: 2rem;
		color: rgba(255, 215, 0, 0.3);
	}

	.foundation-suit {
		font-size: 3rem;
	}

	.tableau {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 1rem;
		min-height: 400px;
	}

	.tableau-pile {
		position: relative;
		min-height: 110px;
	}

	.tableau-card {
		position: absolute;
		left: 0;
		cursor: pointer;
	}

	.tableau-empty {
		border: 2px solid rgba(255, 215, 0, 0.3);
	}

	.win-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.win-message {
		background: rgba(0, 0, 0, 0.95);
		border: 3px solid goldenrod;
		border-radius: 12px;
		padding: 3rem;
		text-align: center;
		animation: celebrate 0.5s ease-out;
	}

	@keyframes celebrate {
		from {
			transform: scale(0.5);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.win-message h2 {
		color: goldenrod;
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}

	.win-message p {
		color: #e8eaed;
		font-size: 1.3rem;
		margin-bottom: 2rem;
	}

	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			align-items: flex-start;
		}

		h1 {
			font-size: 1.5rem;
		}

		.top-row {
			flex-direction: column;
		}

		.tableau {
			grid-template-columns: repeat(4, 1fr);
			gap: 0.5rem;
		}

		.stock,
		.waste,
		.foundation {
			width: 60px;
			height: 85px;
		}

		.waste {
			width: 110px;
		}

		.foundations {
			gap: 0.5rem;
		}

		.stock-area {
			gap: 0.5rem;
		}
	}
</style>
