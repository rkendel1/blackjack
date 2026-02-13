<script lang="ts">
	import '../global.css';
	import { createPokerStore } from '../../backend/adapters/createPokerStore';
	import CardsDefinitions from '$frontend/games/CardsDefinitions.svelte';
	import Card from '$frontend/games/SolitaireCard.svelte';
	import Button from '$frontend/components/Button.svelte';

	const game = createPokerStore();
	const { players, pot, currentBet, currentPlayer, currentPlayerIndex, phase, winners } = game;

	let humanCount = 1;
	let botCount = 3;
	let botDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
	let raiseAmount = 30;

	function handleSetup() {
		game.setupGame(humanCount, botCount, botDifficulty);
		game.startGame();
	}

	function handlePlayerAction(action: 'fold' | 'check' | 'call' | 'raise') {
		if (action === 'raise') {
			game.playerAction(action, raiseAmount);
		} else {
			game.playerAction(action);
		}
	}

	function toggleCardSelection(playerIndex: number, cardIndex: number) {
		if (playerIndex === $currentPlayerIndex) {
			game.toggleCard(cardIndex);
		}
	}

	function handleDraw() {
		game.humanDraw();
	}
</script>

<CardsDefinitions />

{#if $phase === 'setup'}
	<main class="setup">
		<div class="setup-panel">
			<h1>🎴 Five-Card Draw Poker</h1>
			<p class="subtitle">Configure your game</p>

			<div class="config-group">
				<label>
					Human Players:
					<input type="number" bind:value={humanCount} min="1" max="6" />
				</label>

				<label>
					Bot Players:
					<input type="number" bind:value={botCount} min="0" max="5" />
				</label>

				<label>
					Bot Difficulty:
					<select bind:value={botDifficulty}>
						<option value="easy">Easy</option>
						<option value="medium">Medium</option>
						<option value="hard">Hard</option>
					</select>
				</label>
			</div>

			<Button onclick={handleSetup} variant="deal">Start Game</Button>
		</div>
	</main>
{:else}
	<main class="game">
		<div class="game-area">
			<!-- Pot and Phase Info -->
			<div class="info-panel">
				<div class="pot">💰 Pot: ${$pot}</div>
				<div class="current-bet">Current Bet: ${$currentBet}</div>
				<div class="phase-info">{$phase}</div>
			</div>

			<!-- All Players -->
			<div class="players-area">
				{#each $players as player, i}
					<div
						class="player-section"
						class:active={$currentPlayer === player}
						class:folded={player.folded}
					>
						<div class="player-header">
							<span class="player-name">{player.name}</span>
							<span class="player-chips">💰 ${player.chips}</span>
							{#if player.currentBet > 0}
								<span class="player-bet">Bet: ${player.currentBet}</span>
							{/if}
							{#if player.folded}
								<span class="status">Folded</span>
							{/if}
						</div>

						<!-- Player Cards -->
						<div class="player-hand">
							{#each player.hand as card, cardIndex}
								<div
									class="card-wrapper"
									class:selected={player.selectedCards[cardIndex]}
									on:click={() => {
										if (player.type === 'human' && $phase === 'draw' && i === $currentPlayerIndex) {
											toggleCardSelection(i, cardIndex);
										}
									}}
									on:keydown={(e) => {
										if (
											e.key === 'Enter' &&
											player.type === 'human' &&
											$phase === 'draw' &&
											i === $currentPlayerIndex
										) {
											toggleCardSelection(i, cardIndex);
										}
									}}
									role="button"
									tabindex={player.type === 'human' &&
									$phase === 'draw' &&
									i === $currentPlayerIndex
										? 0
										: -1}
								>
									<Card {card} faceUp={player.type === 'human' || $phase === 'showdown'} />
								</div>
							{/each}
						</div>

						{#if $phase === 'showdown' && player.bestHand}
							<div class="hand-rank">{player.bestHand.description}</div>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Controls for Betting -->
			{#if ($phase === 'betting' || $phase === 'final-betting') && $currentPlayer && $currentPlayer.type === 'human'}
				<div class="controls">
					<Button onclick={() => handlePlayerAction('fold')} variant="draw">Fold</Button>
					{#if $currentBet === $currentPlayer.currentBet}
						<Button onclick={() => handlePlayerAction('check')} variant="draw">Check</Button>
					{:else}
						<Button onclick={() => handlePlayerAction('call')} variant="draw">
							Call ${$currentBet - $currentPlayer.currentBet}
						</Button>
					{/if}
					<div class="raise-control">
						<input type="number" bind:value={raiseAmount} min="10" step="10" />
						<Button onclick={() => handlePlayerAction('raise')} variant="draw">Raise</Button>
					</div>
				</div>
			{/if}

			<!-- Draw Phase Controls -->
			{#if $phase === 'draw' && $currentPlayer && $currentPlayer.type === 'human'}
				<div class="controls">
					<p class="instruction">Select cards to discard (click on cards), then click Draw</p>
					<Button onclick={handleDraw} variant="draw">
						Draw ({$currentPlayer.selectedCards.filter((s) => s).length} selected)
					</Button>
				</div>
			{/if}

			<!-- Showdown -->
			{#if $phase === 'showdown'}
				<div class="showdown">
					<h2>Winner{$winners.length > 1 ? 's' : ''}!</h2>
					{#each $winners as winner}
						<p>{winner.name} - {winner.bestHand?.description}</p>
					{/each}
					<Button onclick={() => game.nextHand()} variant="deal">Next Hand</Button>
				</div>
			{/if}
		</div>
	</main>
{/if}

<style>
	main {
		min-height: 100dvh;
		width: 100dvw;
		background: radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);
		padding: 20px;
	}

	.setup {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.setup-panel {
		background: rgba(0, 0, 0, 0.6);
		border: 2px solid goldenrod;
		border-radius: 12px;
		padding: 2rem;
		max-width: 500px;
		width: 100%;
	}

	h1 {
		font-size: 2.5rem;
		color: goldenrod;
		margin-bottom: 0.5rem;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
		text-align: center;
	}

	.subtitle {
		color: #e8eaed;
		text-align: center;
		margin-bottom: 2rem;
	}

	.config-group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	label {
		display: flex;
		flex-direction: column;
		color: #e8eaed;
		font-size: 1rem;
		gap: 0.5rem;
	}

	input,
	select {
		padding: 0.5rem;
		border-radius: 4px;
		border: 1px solid #ccc;
		font-size: 1rem;
	}

	.game-area {
		max-width: 1200px;
		margin: 0 auto;
	}

	.info-panel {
		background: rgba(0, 0, 0, 0.7);
		padding: 1rem;
		border-radius: 8px;
		border: 2px solid goldenrod;
		text-align: center;
		margin-bottom: 2rem;
		display: flex;
		justify-content: space-around;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.pot,
	.current-bet,
	.phase-info {
		color: goldenrod;
		font-size: 1.2rem;
		font-weight: bold;
	}

	.players-area {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.player-section {
		background: rgba(0, 0, 0, 0.6);
		border: 2px solid rgba(255, 215, 0, 0.3);
		border-radius: 12px;
		padding: 1rem;
	}

	.player-section.active {
		border-color: goldenrod;
		box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
	}

	.player-section.folded {
		opacity: 0.5;
	}

	.player-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.player-name {
		color: goldenrod;
		font-weight: bold;
		font-size: 1.1rem;
	}

	.player-chips,
	.player-bet,
	.status {
		color: #e8eaed;
		font-size: 0.9rem;
	}

	.player-hand {
		display: flex;
		gap: 8px;
		justify-content: center;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
	}

	.card-wrapper {
		cursor: pointer;
		transition: transform 0.2s;
		position: relative;
	}

	.card-wrapper:hover {
		transform: translateY(-5px);
	}

	.card-wrapper.selected {
		transform: translateY(-10px);
	}

	.card-wrapper.selected::after {
		content: '✓';
		position: absolute;
		top: -10px;
		right: -5px;
		background: goldenrod;
		color: black;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
	}

	.hand-rank {
		color: goldenrod;
		font-size: 1rem;
		font-weight: bold;
		text-align: center;
		margin-top: 0.5rem;
		background: rgba(0, 0, 0, 0.5);
		padding: 0.5rem;
		border-radius: 4px;
	}

	.controls {
		position: fixed;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 1rem;
		background: rgba(0, 0, 0, 0.9);
		padding: 1rem;
		border-radius: 12px;
		border: 2px solid goldenrod;
		align-items: center;
		flex-wrap: wrap;
		justify-content: center;
		max-width: 90%;
	}

	.instruction {
		color: #e8eaed;
		margin: 0;
		flex-basis: 100%;
		text-align: center;
	}

	.raise-control {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.raise-control input {
		width: 80px;
	}

	.showdown {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba(0, 0, 0, 0.95);
		border: 3px solid goldenrod;
		border-radius: 12px;
		padding: 2rem;
		text-align: center;
		min-width: 300px;
		z-index: 100;
	}

	.showdown h2 {
		color: goldenrod;
		margin-bottom: 1rem;
	}

	.showdown p {
		color: #e8eaed;
		margin: 0.5rem 0;
		font-size: 1.1rem;
	}

	@media (max-width: 768px) {
		.players-area {
			grid-template-columns: 1fr;
		}

		.info-panel {
			flex-direction: column;
			gap: 0.5rem;
		}

		h1 {
			font-size: 1.8rem;
		}

		.controls {
			bottom: 1rem;
		}
	}
</style>
