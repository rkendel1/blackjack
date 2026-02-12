<script lang="ts">
	import '../../global.css';
	import { createFreeCellGame } from '$lib/games/solitaire/freecell/store';
	import CardsDefinitions from '$lib/Components/CardsDefinitions.svelte';
	import Card from '$lib/Components/SolitaireCard.svelte';
	import Button from '$lib/Components/Button.svelte';
	import { onMount } from 'svelte';

	const game = createFreeCellGame();
	const { tableau, foundations, freeCells, moves, isWon, autoPlayAvailable } = game;

	let draggedCard: {
		from: 'freeCell' | 'tableau';
		index: number;
		cardIndex?: number;
	} | null = null;

	onMount(() => {
		game.newGame();
	});

	function handleDragStart(from: 'freeCell' | 'tableau', index: number, cardIndex?: number) {
		draggedCard = { from, index, cardIndex };
	}

	function handleDrop(to: 'tableau' | 'foundation' | 'freeCell', toIndex: number) {
		if (!draggedCard) return;

		if (draggedCard.from === 'freeCell') {
			if (to === 'tableau') {
				game.moveFreeCellToTableau(draggedCard.index, toIndex);
			} else if (to === 'foundation') {
				game.moveFreeCellToFoundation(draggedCard.index, toIndex);
			}
		} else if (draggedCard.from === 'tableau' && draggedCard.cardIndex !== undefined) {
			if (to === 'tableau') {
				game.moveTableauToTableau(draggedCard.index, draggedCard.cardIndex, toIndex);
			} else if (to === 'foundation') {
				const pile = $tableau[draggedCard.index];
				// Only allow moving the top card to foundation
				if (draggedCard.cardIndex === pile.length - 1) {
					game.moveTableauToFoundation(draggedCard.index, toIndex);
				}
			} else if (to === 'freeCell') {
				const pile = $tableau[draggedCard.index];
				// Only allow moving the top card to free cell
				if (draggedCard.cardIndex === pile.length - 1) {
					game.moveTableauToFreeCell(draggedCard.index, toIndex);
				}
			}
		}

		draggedCard = null;
	}

	function handleCardClick(from: 'freeCell' | 'tableau', index: number, cardIndex?: number) {
		// Try to auto-place on foundation
		if (from === 'freeCell') {
			for (let f = 0; f < $foundations.length; f++) {
				if (game.moveFreeCellToFoundation(index, f)) {
					return;
				}
			}
		} else if (from === 'tableau' && cardIndex !== undefined) {
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
			<h1>🃏 FreeCell Solitaire</h1>
			<div class="stats">
				<span>Moves: {$moves}</span>
			</div>
			<div class="actions">
				{#if $autoPlayAvailable}
					<Button on:click={() => game.autoPlay()}>Auto Play</Button>
				{/if}
				<Button on:click={() => game.newGame()}>New Game</Button>
			</div>
		</div>

		<!-- Top Row: Free Cells and Foundations -->
		<div class="top-row">
			<!-- Free Cells -->
			<div class="free-cells">
				{#each $freeCells as card, i}
					<div
						class="free-cell"
						on:dragover={(e) => e.preventDefault()}
						on:drop={() => handleDrop('freeCell', i)}
						role="button"
						tabindex="0"
					>
						{#if card}
							<div
								class="cell-card"
								draggable="true"
								on:dragstart={() => handleDragStart('freeCell', i)}
								on:click={() => handleCardClick('freeCell', i)}
								role="button"
								tabindex="0"
								on:keydown={(e) => e.key === 'Enter' && handleCardClick('freeCell', i)}
							>
								<Card {card} faceUp={true} />
							</div>
						{:else}
							<div class="empty-pile free-cell-empty">F</div>
						{/if}
					</div>
				{/each}
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
								draggable="true"
								on:dragstart={() => handleDragStart('tableau', i, cardIndex)}
								on:click={() => handleCardClick('tableau', i, cardIndex)}
								role="button"
								tabindex="0"
								on:keydown={(e) => e.key === 'Enter' && handleCardClick('tableau', i, cardIndex)}
							>
								<Card {card} faceUp={true} />
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
					<Button on:click={() => game.newGame()}>Play Again</Button>
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
		max-width: 1400px;
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

	.free-cells,
	.foundations {
		display: flex;
		gap: 1rem;
	}

	.free-cell,
	.foundation {
		position: relative;
		width: 80px;
		height: 110px;
		border-radius: 8px;
		cursor: pointer;
	}

	.free-cell {
		border: 2px dashed rgba(255, 215, 0, 0.3);
	}

	.foundation {
		border: 2px solid rgba(255, 215, 0, 0.3);
	}

	.cell-card {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.spacer {
		flex-grow: 1;
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
		font-weight: bold;
	}

	.foundation-suit {
		font-size: 3rem;
	}

	.free-cell-empty {
		font-size: 2.5rem;
	}

	.tableau {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
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

		.free-cell,
		.foundation {
			width: 60px;
			height: 85px;
		}

		.free-cells,
		.foundations {
			gap: 0.5rem;
		}

		.tableau-card {
			position: static;
		}

		.empty-pile {
			font-size: 1.5rem;
		}

		.foundation-suit {
			font-size: 2rem;
		}

		.free-cell-empty {
			font-size: 1.8rem;
		}
	}
</style>
