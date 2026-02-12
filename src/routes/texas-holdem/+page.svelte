<script lang="ts">
	import '../global.css';
	import { createTexasHoldemStore } from '$lib/adapters/createTexasHoldemStore';
	import CardsDefinitions from '$lib/Components/CardsDefinitions.svelte';
	import Card from '$lib/Components/SolitaireCard.svelte';
	import Button from '$lib/Components/Button.svelte';

	const game = createTexasHoldemStore();
	const { players, communityCards, pot, currentBet, currentPlayer, phase, winners } = game;

	let humanCount = 1;
	let botCount = 3;
	let botDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
	let raiseAmount = 50;

	function handleSetup() {
		game.setupGame(humanCount, botCount, botDifficulty);
		game.startGame();
	}

	function handlePlayerAction(action: 'fold' | 'check' | 'call' | 'raise' | 'all-in') {
		if (action === 'raise') {
			game.playerAction(action, raiseAmount);
		} else {
			game.playerAction(action);
		}
	}

	function getPlayerPosition(index: number, total: number): string {
		const angle = (index / total) * 360;
		const radius = 35;
		const x = 50 + radius * Math.cos((angle - 90) * (Math.PI / 180));
		const y = 50 + radius * Math.sin((angle - 90) * (Math.PI / 180));
		return `left: ${x}%; top: ${y}%;`;
	}
</script>

<CardsDefinitions />

{#if $phase === 'setup'}
	<main class="setup">
		<div class="setup-panel">
			<h1>🃏 Texas Hold'em Poker</h1>
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
		<!-- Poker Table -->
		<div class="table">
			<!-- Community Cards -->
			<div class="community-cards">
				<h3>Community Cards</h3>
				<div class="cards">
					{#each $communityCards as card}
						<Card {card} faceUp={true} />
					{/each}
				</div>
			</div>

			<!-- Pot -->
			<div class="pot-info">
				<div class="pot">Pot: ${$pot}</div>
				<div class="current-bet">Current Bet: ${$currentBet}</div>
				<div class="phase">{$phase}</div>
			</div>

			<!-- Players -->
			{#each $players as player, i}
				<div class="player" style={getPlayerPosition(i, $players.length)}>
					<div
						class="player-info"
						class:active={$currentPlayer === player}
						class:folded={player.folded}
					>
						<div class="player-name">{player.name}</div>
						<div class="player-chips">💰 ${player.chips}</div>
						{#if player.currentBet > 0}
							<div class="player-bet">Bet: ${player.currentBet}</div>
						{/if}
						{#if player.folded}
							<div class="status">Folded</div>
						{:else if player.allIn}
							<div class="status">All In</div>
						{/if}
					</div>
					<div class="player-cards">
						{#each player.hand as card}
							<Card {card} faceUp={player.type === 'human' || $phase === 'showdown'} />
						{/each}
					</div>
					{#if $phase === 'showdown' && player.bestHand}
						<div class="hand-rank">{player.bestHand.description}</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Controls -->
		{#if $phase !== 'showdown' && $currentPlayer && $currentPlayer.type === 'human'}
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
				<Button onclick={() => handlePlayerAction('all-in')} variant="draw">All In</Button>
			</div>
		{/if}

		{#if $phase === 'showdown'}
			<div class="showdown">
				<h2>Winner{$winners.length > 1 ? 's' : ''}!</h2>
				{#each $winners as winner}
					<p>{winner.name} - {winner.bestHand?.description}</p>
				{/each}
				<Button onclick={() => game.nextHand()} variant="deal">Next Hand</Button>
			</div>
		{/if}
	</main>
{/if}

<style>
	main {
		min-height: 100dvh;
		width: 100dvw;
		background: radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);
	}

	.setup {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
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

	.game {
		position: relative;
		height: 100dvh;
		overflow: hidden;
	}

	.table {
		position: relative;
		width: 100%;
		height: 100%;
		padding: 2rem;
	}

	.community-cards {
		position: absolute;
		top: 35%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
	}

	.community-cards h3 {
		color: goldenrod;
		margin-bottom: 1rem;
	}

	.cards {
		display: flex;
		gap: 8px;
		justify-content: center;
	}

	.pot-info {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		background: rgba(0, 0, 0, 0.7);
		padding: 1rem;
		border-radius: 8px;
		border: 2px solid goldenrod;
	}

	.pot,
	.current-bet,
	.phase {
		color: #e8eaed;
		font-size: 1.2rem;
		margin: 0.25rem 0;
	}

	.player {
		position: absolute;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.player-info {
		background: rgba(0, 0, 0, 0.7);
		padding: 0.75rem;
		border-radius: 8px;
		border: 2px solid transparent;
		min-width: 120px;
		text-align: center;
	}

	.player-info.active {
		border-color: goldenrod;
		box-shadow: 0 0 10px goldenrod;
	}

	.player-info.folded {
		opacity: 0.5;
	}

	.player-name {
		color: goldenrod;
		font-weight: bold;
		margin-bottom: 0.25rem;
	}

	.player-chips,
	.player-bet,
	.status {
		color: #e8eaed;
		font-size: 0.9rem;
	}

	.player-cards {
		display: flex;
		gap: 4px;
	}

	.hand-rank {
		color: goldenrod;
		font-size: 0.85rem;
		font-weight: bold;
		background: rgba(0, 0, 0, 0.8);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	.controls {
		position: fixed;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 1rem;
		background: rgba(0, 0, 0, 0.8);
		padding: 1rem;
		border-radius: 12px;
		border: 2px solid goldenrod;
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
		background: rgba(0, 0, 0, 0.9);
		border: 3px solid goldenrod;
		border-radius: 12px;
		padding: 2rem;
		text-align: center;
		min-width: 300px;
	}

	.showdown h2 {
		color: goldenrod;
		margin-bottom: 1rem;
	}

	.showdown p {
		color: #e8eaed;
		margin: 0.5rem 0;
	}

	@media (max-width: 768px) {
		.table {
			padding: 1rem;
		}

		.controls {
			flex-wrap: wrap;
			max-width: 90%;
		}

		.player-info {
			min-width: 80px;
			font-size: 0.8rem;
			padding: 0.5rem;
		}

		h1 {
			font-size: 1.8rem;
		}
	}
</style>
