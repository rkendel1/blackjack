<script lang="ts">
	import '../global.css';
	import audioPath from '../../backend/assets/draw.mp3';
	import { createMultiplayerBlackjack } from '../../backend/multiplayer/games/MultiplayerBlackjack';
	import { onMount } from 'svelte';

	import CardsDefinitions from '$frontend/games/CardsDefinitions.svelte';
	import Deck from '$frontend/games/Deck.svelte';
	import Hand from '$frontend/games/Hand.svelte';

	// Get session ID from URL if joining
	const sessionId = new URLSearchParams(window.location.search).get('session') || undefined;

	const game = createMultiplayerBlackjack(sessionId);
	const {
		session,
		participants,
		isHost,
		sessionState,
		playerCount,
		connectionQuality,
		gameState,
		player,
		dealer,
		winner,
		isMyTurn,
		gameStarted,
		startGame,
		hit,
		stand,
		leave
	} = game;

	let drawSound: HTMLAudioElement;

	onMount(() => {
		drawSound = new Audio(audioPath);
	});

	function playSound() {
		if (drawSound) {
			drawSound.play().catch(() => {});
		}
	}

	function handleHit() {
		playSound();
		hit();
	}

	function handleStand() {
		stand();
	}

	function copySessionLink() {
		if ($session) {
			const link = `${window.location.origin}/blackjack-multiplayer?session=${$session.id}`;
			navigator.clipboard.writeText(link);
			alert('Session link copied to clipboard!');
		}
	}
</script>

<CardsDefinitions />

<div class="game-container">
	{#if !$session}
		<div class="loading">
			<p>Connecting to multiplayer session...</p>
		</div>
	{:else}
		<!-- Multiplayer Info Panel -->
		<div class="mp-info">
			<div class="info-header">
				<h3>Multiplayer Blackjack</h3>
				{#if $isHost}
					<span class="badge host">Host</span>
				{:else}
					<span class="badge guest">Guest</span>
				{/if}
			</div>

			<div class="session-details">
				<p><strong>Session:</strong> {$session.id.substring(0, 12)}...</p>
				<p><strong>Status:</strong> {$sessionState}</p>
				<p><strong>Players:</strong> {$playerCount}/4</p>
				<p><strong>Latency:</strong> {$connectionQuality.latency}ms</p>
			</div>

			{#if $isHost && !$gameStarted}
				<button class="start-btn" on:click={startGame}>Start Game</button>
			{/if}

			{#if $isHost}
				<button class="share-btn" on:click={copySessionLink}>📋 Copy Invite Link</button>
			{/if}

			<button class="leave-btn" on:click={leave}>Leave Session</button>

			<div class="players-list">
				<h4>Players</h4>
				{#each $participants as participant}
					<div class="player-item">
						<span>{participant.userId.substring(0, 8)}</span>
						<span class="status {participant.connectionStatus}">
							{participant.connectionStatus}
						</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Game Board -->
		<section class="game-board">
			<Deck />
			<div class="game-area">
				{#if $gameState}
					<div class="dealer-area">
						<h3>Dealer</h3>
						<Hand hand={$dealer?.hand || []} score={$dealer?.score || 0} />
					</div>

					<div class="game-status">
						{#if $winner}
							<h2 class="result">
								{$winner === 'Player' ? '🎉 Player Wins!' : ''}
								{$winner === 'Dealer' ? '😞 Dealer Wins' : ''}
								{$winner === 'Draw' ? '🤝 Draw' : ''}
							</h2>
							{#if $isHost}
								<button on:click={startGame}>New Game</button>
							{/if}
						{:else if $isMyTurn}
							<p class="your-turn">Your Turn!</p>
							<div class="actions">
								<button on:click={handleHit}>Hit</button>
								<button on:click={handleStand}>Stand</button>
							</div>
						{:else}
							<p class="waiting">Waiting for {$isHost ? 'dealer' : 'host'}...</p>
						{/if}
					</div>

					<div class="player-area">
						<h3>Your Hand</h3>
						<Hand hand={$player?.hand || []} score={$player?.score || 0} />
					</div>
				{:else if !$gameStarted}
					<div class="waiting-start">
						<h2>Waiting for host to start the game...</h2>
					</div>
				{/if}
			</div>
		</section>
	{/if}
</div>

<style>
	.game-container {
		display: flex;
		height: 100dvh;
		width: 100dvw;
		background: radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		color: white;
		font-size: 1.5rem;
	}

	.mp-info {
		width: 300px;
		background: rgba(0, 0, 0, 0.6);
		padding: 1.5rem;
		color: white;
		overflow-y: auto;
	}

	.info-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.info-header h3 {
		margin: 0;
		flex: 1;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: bold;
	}

	.badge.host {
		background: #4caf50;
	}

	.badge.guest {
		background: #2196f3;
	}

	.session-details {
		background: rgba(255, 255, 255, 0.1);
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.session-details p {
		margin: 0.5rem 0;
		font-size: 0.9rem;
	}

	.start-btn,
	.share-btn,
	.leave-btn {
		width: 100%;
		padding: 0.75rem;
		margin: 0.5rem 0;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.start-btn {
		background: #4caf50;
		color: white;
	}

	.start-btn:hover {
		background: #45a049;
	}

	.share-btn {
		background: #2196f3;
		color: white;
	}

	.share-btn:hover {
		background: #0b7dda;
	}

	.leave-btn {
		background: #f44336;
		color: white;
	}

	.leave-btn:hover {
		background: #da190b;
	}

	.players-list {
		margin-top: 1.5rem;
	}

	.players-list h4 {
		margin: 0 0 0.75rem 0;
	}

	.player-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		margin: 0.5rem 0;
	}

	.status {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 8px;
	}

	.status.connected {
		background: #4caf50;
	}

	.status.connecting {
		background: #ff9800;
	}

	.status.disconnected {
		background: #f44336;
	}

	.game-board {
		flex: 1;
		display: flex;
		position: relative;
	}

	.game-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-around;
		padding: 2rem;
	}

	.dealer-area,
	.player-area {
		text-align: center;
	}

	.dealer-area h3,
	.player-area h3 {
		color: goldenrod;
		margin-bottom: 1rem;
	}

	.game-status {
		text-align: center;
		color: white;
	}

	.result {
		font-size: 2rem;
		color: goldenrod;
		margin: 1rem 0;
	}

	.your-turn {
		font-size: 1.5rem;
		color: #4caf50;
		font-weight: bold;
		margin: 1rem 0;
	}

	.waiting {
		font-size: 1.2rem;
		color: #999;
		margin: 1rem 0;
	}

	.waiting-start {
		text-align: center;
		color: white;
	}

	.waiting-start h2 {
		color: goldenrod;
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 1rem;
	}

	.actions button {
		padding: 1rem 2rem;
		font-size: 1.2rem;
		background: goldenrod;
		color: #001a00;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-weight: bold;
		transition: all 0.2s;
	}

	.actions button:hover {
		background: #daa520;
		transform: scale(1.05);
	}

	.actions button:active {
		transform: scale(0.95);
	}

	.game-status button {
		padding: 0.75rem 1.5rem;
		background: #4caf50;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		margin-top: 1rem;
	}

	.game-status button:hover {
		background: #45a049;
	}

	@media (max-width: 768px) {
		.game-container {
			flex-direction: column;
		}

		.mp-info {
			width: 100%;
			max-height: 200px;
		}

		.game-area {
			padding: 1rem;
		}
	}
</style>
