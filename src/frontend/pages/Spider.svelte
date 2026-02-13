<script lang="ts">
	import '../global.css';
	import { createSpiderStore } from '$lib/adapters/createSpiderStore';
	import CardsDefinitions from '$frontend/components/CardsDefinitions.svelte';
	import Card from '$frontend/components/SolitaireCard.svelte';
	import Button from '$frontend/components/Button.svelte';
	import { onMount } from 'svelte';

	const game = createSpiderStore();
	const {
		tableau,
		foundations,
		stock,
		revealedTableau,
		moves,
		isWon,
		canDealFromStock,
		autoPlayAvailable
	} = game;

	let draggedCard: { index: number; cardIndex: number } | null = null;
	let hintMove: { from: number; cardIndex: number; to: number } | null = null;

	onMount(() => {
		game.newGame();
	});

	function handleDragStart(index: number, cardIndex: number) {
		draggedCard = { index, cardIndex };
		hintMove = null;
	}

	function handleDrop(toIndex: number) {
		if (!draggedCard) return;

		game.moveTableauToTableau(draggedCard.index, draggedCard.cardIndex, toIndex);
		draggedCard = null;
	}

	function handleCardClick(index: number, cardIndex: number) {
		hintMove = null;
	}

	function showHint() {
		hintMove = game.getHint();
	}
</script>

<CardsDefinitions />

<main>
	<div class="game-container">
		<!-- Header -->
		<div class="header">
			<h1>🕷️ Spider Solitaire</h1>
			<div class="stats">
				<span>Moves: {$moves}</span>
				<span>Completed: {$foundations.length}/8</span>
			</div>
			<div class="actions">
				{#if $autoPlayAvailable}
					<Button onclick={() => game.autoPlay()} variant="draw">Auto Play</Button>
				{/if}
				<Button onclick={showHint} variant="draw">Hint</Button>
				<Button onclick={() => game.newGame()} variant="stop">New Game</Button>
			</div>
		</div>

		<!-- Top Row: Stock and Foundations -->
		<div class="top-row">
			<!-- Stock -->
			<div class="stock-area">
				<div
					class="stock"
					class:disabled={!$canDealFromStock}
					on:click={() => $canDealFromStock && game.dealFromStock()}
					role="button"
					tabindex="0"
					on:keydown={(e) => e.key === 'Enter' && $canDealFromStock && game.dealFromStock()}
				>
					{#if $stock.length > 0}
						<div class="stock-pile">
							{#each Array(Math.min(5, Math.ceil($stock.length / 10))) as _, i}
								<div class="stock-layer" style="left: {i * 2}px; top: {i * 2}px;">
									<Card card={$stock[0]} faceUp={false} />
								</div>
							{/each}
						</div>
						<div class="stock-count">{Math.floor($stock.length / 10)}</div>
					{:else}
						<div class="empty-pile">📦</div>
					{/if}
				</div>
			</div>

			<div class="spacer"></div>

			<!-- Foundations -->
			<div class="foundations">
				{#each Array(8) as _, i}
					<div class="foundation">
						{#if i < $foundations.length}
							<Card card={$foundations[i][0]} faceUp={true} />
							<div class="foundation-badge">✓</div>
						{:else}
							<div class="empty-pile foundation-placeholder">
								<span class="foundation-icon">🕷️</span>
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
					on:drop={() => handleDrop(i)}
					role="button"
					tabindex="0"
				>
					{#if pile.length === 0}
						<div class="empty-pile tableau-empty"></div>
					{:else}
						{#each pile as card, cardIndex}
							{@const isRevealed = $revealedTableau[i][cardIndex]}
							{@const isHinted =
								hintMove && hintMove.from === i && hintMove.cardIndex === cardIndex}
							{@const isHintTarget = hintMove && hintMove.to === i && cardIndex === pile.length - 1}
							<div
								class="tableau-card"
								class:hinted={isHinted}
								class:hint-target={isHintTarget}
								style="top: {cardIndex * 30}px"
								draggable={isRevealed}
								on:dragstart={() => handleDragStart(i, cardIndex)}
								on:click={() => handleCardClick(i, cardIndex)}
								role="button"
								tabindex={isRevealed ? 0 : -1}
								on:keydown={(e) => e.key === 'Enter' && handleCardClick(i, cardIndex)}
							>
								<Card {card} faceUp={isRevealed} />
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
					<p>You completed all 8 sequences in {$moves} moves!</p>
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
		background: radial-gradient(circle at center, #1a4d2e, #0d2818 50%, #000000);
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
		display: flex;
		gap: 1.5rem;
		color: #e8eaed;
		font-size: 1.2rem;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.top-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 3rem;
		gap: 1rem;
		align-items: flex-start;
	}

	.stock-area {
		display: flex;
		gap: 1rem;
	}

	.stock {
		position: relative;
		width: 80px;
		height: 110px;
		border-radius: 8px;
		cursor: pointer;
		border: 2px dashed rgba(255, 215, 0, 0.3);
	}

	.stock.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.stock-pile {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.stock-layer {
		position: absolute;
	}

	.stock-count {
		position: absolute;
		bottom: 5px;
		right: 5px;
		background: rgba(0, 0, 0, 0.8);
		color: goldenrod;
		font-weight: bold;
		font-size: 1rem;
		padding: 2px 6px;
		border-radius: 4px;
		pointer-events: none;
	}

	.spacer {
		flex-grow: 1;
	}

	.foundations {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.foundation {
		position: relative;
		width: 80px;
		height: 110px;
		border-radius: 8px;
	}

	.foundation-badge {
		position: absolute;
		top: 5px;
		right: 5px;
		background: rgba(34, 197, 94, 0.9);
		color: white;
		font-weight: bold;
		font-size: 0.9rem;
		padding: 2px 6px;
		border-radius: 4px;
		pointer-events: none;
	}

	.foundation-placeholder {
		border: 2px solid rgba(255, 215, 0, 0.2);
	}

	.foundation-icon {
		font-size: 2rem;
		opacity: 0.3;
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

	.tableau {
		display: grid;
		grid-template-columns: repeat(10, 1fr);
		gap: 0.5rem;
		min-height: 500px;
	}

	.tableau-pile {
		position: relative;
		min-height: 110px;
	}

	.tableau-card {
		position: absolute;
		left: 0;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.tableau-card:hover {
		transform: translateY(-5px);
		z-index: 10;
	}

	.tableau-card.hinted {
		animation: pulse 1s infinite;
	}

	.tableau-card.hint-target {
		animation: glow 1s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			transform: translateY(0) scale(1);
		}
		50% {
			transform: translateY(-10px) scale(1.05);
		}
	}

	@keyframes glow {
		0%,
		100% {
			box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
		}
		50% {
			box-shadow: 0 0 20px rgba(255, 215, 0, 1);
		}
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

	@media (max-width: 1200px) {
		.tableau {
			grid-template-columns: repeat(5, 1fr);
		}

		.foundations {
			gap: 0.3rem;
		}

		.foundation {
			width: 60px;
			height: 85px;
		}
	}

	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			align-items: flex-start;
		}

		h1 {
			font-size: 1.5rem;
		}

		.stats {
			font-size: 1rem;
			gap: 1rem;
		}

		.top-row {
			flex-direction: column;
		}

		.tableau {
			grid-template-columns: repeat(5, 1fr);
			gap: 0.3rem;
		}

		.stock,
		.foundation {
			width: 60px;
			height: 85px;
		}

		.tableau-card {
			top: auto;
		}

		.tableau-card:nth-child(n) {
			top: calc((var(--card-index, 0)) * 20px);
		}
	}

	@media (max-width: 480px) {
		main {
			padding: 10px;
		}

		.tableau {
			grid-template-columns: repeat(5, 1fr);
			gap: 0.2rem;
		}

		.stock,
		.foundation {
			width: 50px;
			height: 70px;
		}
	}
</style>
