<script lang="ts">
  import { onMount } from 'svelte';
  import { createMultiplayerTicTacToe } from '$lib/multiplayer/games/MultiplayerTicTacToe';
  import MultiplayerLobby from '$lib/Components/MultiplayerLobby.svelte';

  // Get session ID from URL if joining an existing game
  let sessionId: string | undefined;
  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    sessionId = params.get('session') || undefined;
  });

  $: game = createMultiplayerTicTacToe(sessionId);

  function handleCellClick(position: number) {
    if ($game.board[position] === null && $game.isMyTurn && $game.status === 'playing') {
      game.makeMove(position);
    }
  }

  function handleStartGame() {
    game.startGame();
  }

  function handleReset() {
    game.resetGame();
  }

  function copyInviteLink() {
    if (!$game.session) return;

    const inviteUrl = `${window.location.origin}/tictactoe-multiplayer?session=${$game.session.sessionId}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      alert('Invite link copied to clipboard!');
    });
  }

  $: canStart = $game.isHost && $game.sessionState === 'waiting_for_players';
  $: playerCount = $game.session?.participants.filter((p) => p.role === 'player').length || 0;
  $: canPlay = $game.gameStarted && playerCount >= 2;
</script>

<div class="tictactoe-multiplayer-container">
  <h1>Multiplayer Tic Tac Toe</h1>

  <!-- Multiplayer Lobby -->
  <MultiplayerLobby
    session={$game.session}
    sessionState={$game.sessionState}
    isHost={$game.isHost}
    participants={$game.session?.participants || []}
    connectionQuality={$game.connectionQuality}
    on:copyInvite={copyInviteLink}
  />

  {#if $game.session}
    <div class="game-container">
      <!-- Player Info -->
      <div class="player-info">
        <p>You are playing as: <strong>{$game.mySymbol || '?'}</strong></p>
        {#if $game.mySymbol === 'X'}
          <p class="symbol-note">You go first!</p>
        {/if}
      </div>

      <!-- Game Status -->
      <div class="game-status">
        {#if !$game.gameStarted}
          <p class="waiting">Waiting for {playerCount}/2 players...</p>
          {#if canStart && playerCount >= 2}
            <button class="btn-start" on:click={handleStartGame}>Start Game</button>
          {:else if canStart}
            <p class="info">Share the invite link to get another player!</p>
          {/if}
        {:else if $game.status === 'playing'}
          {#if $game.isMyTurn}
            <p class="status your-turn">🎯 Your turn!</p>
          {:else}
            <p class="status waiting-turn">⏳ Waiting for opponent...</p>
          {/if}
        {:else if $game.status === 'won'}
          {#if $game.winner === $game.mySymbol}
            <p class="status winner">🎉 You win!</p>
          {:else}
            <p class="status loser">😔 You lose!</p>
          {/if}
        {:else if $game.status === 'draw'}
          <p class="status draw">🤝 It's a draw!</p>
        {/if}
      </div>

      <!-- Game Board -->
      {#if canPlay}
        <div class="board">
          {#each $game.board as cell, i}
            <button
              class="cell"
              class:winning-cell={$game.winningLine?.includes(i)}
              class:my-turn={$game.isMyTurn && cell === null}
              on:click={() => handleCellClick(i)}
              disabled={!$game.isMyTurn || $game.status !== 'playing' || cell !== null}
            >
              {cell || ''}
            </button>
          {/each}
        </div>

        <!-- Game Actions -->
        <div class="actions">
          {#if $game.status !== 'playing' && $game.isHost}
            <button class="btn-reset" on:click={handleReset}>New Game</button>
          {/if}
          <button class="btn-leave" on:click={() => game.leave()}>Leave Game</button>
        </div>
      {/if}
    </div>
  {:else}
    <div class="loading">
      <p>Connecting to game session...</p>
    </div>
  {/if}
</div>

<style>
  .tictactoe-multiplayer-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }

  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 2rem;
  }

  .game-container {
    margin-top: 2rem;
  }

  .player-info {
    text-align: center;
    margin-bottom: 1rem;
    padding: 1rem;
    background: #f0f9ff;
    border-radius: 8px;
  }

  .player-info p {
    margin: 0.25rem 0;
    font-size: 1.1rem;
  }

  .symbol-note {
    color: #0284c7;
    font-size: 0.9rem !important;
  }

  .game-status {
    text-align: center;
    margin-bottom: 2rem;
    min-height: 3rem;
  }

  .status {
    font-size: 1.4rem;
    font-weight: bold;
    margin: 0;
  }

  .status.your-turn {
    color: #10b981;
    animation: pulse 2s ease-in-out infinite;
  }

  .status.waiting-turn {
    color: #6b7280;
  }

  .status.winner {
    color: #10b981;
  }

  .status.loser {
    color: #ef4444;
  }

  .status.draw {
    color: #6b7280;
  }

  .waiting {
    color: #6b7280;
    font-size: 1.2rem;
  }

  .info {
    color: #0284c7;
    font-size: 1rem;
    margin-top: 0.5rem;
  }

  .board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    max-width: 400px;
    margin: 0 auto 2rem;
    aspect-ratio: 1;
  }

  .cell {
    background: white;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 3rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cell.my-turn:not(:disabled) {
    border-color: #10b981;
    background: #f0fdf4;
  }

  .cell:hover:not(:disabled) {
    background: #f0f0f0;
    border-color: #4f46e5;
    transform: scale(1.05);
  }

  .cell:disabled {
    cursor: not-allowed;
  }

  .cell.winning-cell {
    background: #fef3c7;
    border-color: #f59e0b;
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.9;
    }
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-start,
  .btn-reset,
  .btn-leave {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-start,
  .btn-reset {
    background: #10b981;
    color: white;
  }

  .btn-start:hover,
  .btn-reset:hover {
    background: #059669;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }

  .btn-leave {
    background: #ef4444;
    color: white;
  }

  .btn-leave:hover {
    background: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  }

  .loading {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
  }
</style>
