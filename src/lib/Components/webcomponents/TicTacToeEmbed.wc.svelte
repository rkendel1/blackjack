<svelte:options customElement="sl-tictactoe" />

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createMultiplayerTicTacToe } from '$lib/multiplayer/games/MultiplayerTicTacToe';
  import { createTicTacToeStore } from '$lib/games/tictactoe/store';
  import type { Player } from '$lib/games/tictactoe/engine/types';

  // Exposed attributes (all strings for web components)
  export let sessionId: string = '';
  export let enableBot: string = 'false';
  export let botDifficulty: string = 'medium';
  export let mode: string = 'single'; // 'single' or 'multiplayer'

  // Convert string attributes
  $: enableBotBool = enableBot === 'true';
  $: botDifficultyValue = (botDifficulty as 'easy' | 'medium' | 'hard') || 'medium';
  $: sessionIdOrUndefined = sessionId || undefined;
  $: isMultiplayer = mode === 'multiplayer';

  // Game state - use different stores based on mode
  let game: any;
  let isInitialized = false;

  $: {
    if (isMultiplayer && sessionIdOrUndefined) {
      game = createMultiplayerTicTacToe(sessionIdOrUndefined);
      isInitialized = true;
    } else if (!isMultiplayer) {
      game = createTicTacToeStore({
        enableBot: enableBotBool,
        botDifficulty: botDifficultyValue,
      });
      isInitialized = true;
    }
  }

  onMount(() => {
    // Dispatch ready event
    dispatchEvent(
      new CustomEvent('ready', {
        detail: { 
          mode, 
          sessionId: sessionIdOrUndefined,
          enableBot: enableBotBool 
        }
      })
    );
  });

  onDestroy(() => {
    if (isMultiplayer && game?.leave) {
      game.leave();
    }
  });

  function handleCellClick(position: number) {
    if (!game || !isInitialized) return;

    if (isMultiplayer) {
      // Multiplayer mode
      if ($game.board[position] === null && $game.isMyTurn && $game.status === 'playing') {
        game.makeMove(position);
      }
    } else {
      // Single player mode
      if ($game.board[position] === null && $game.status === 'playing') {
        game.makeMove(position);
      }
    }

    // Dispatch move event
    dispatchEvent(
      new CustomEvent('move', {
        detail: { position, mode }
      })
    );
  }

  function handleReset() {
    if (!game || !isInitialized) return;

    if (isMultiplayer && game.resetGame) {
      game.resetGame();
    } else if (!isMultiplayer && game.reset) {
      game.reset();
    }

    // Dispatch reset event
    dispatchEvent(new CustomEvent('reset', { detail: { mode } }));
  }

  function handleStartGame() {
    if (isMultiplayer && game?.startGame) {
      game.startGame();
      
      // Dispatch start event
      dispatchEvent(new CustomEvent('start', { detail: { mode } }));
    }
  }

  interface Participant {
    role: string;
    userId: string;
    connectionStatus: string;
  }

  $: playerCount = isMultiplayer 
    ? $game?.session?.participants.filter((p: Participant) => p.role === 'player').length || 0 
    : 1;
  
  $: canStart = isMultiplayer && $game?.isHost && $game?.sessionState === 'waiting_for_players' && playerCount >= 2;
  $: gameStarted = isMultiplayer ? $game?.gameStarted : true;
  $: canPlay = isMultiplayer ? gameStarted && playerCount >= 2 : true;
</script>

<div class="tictactoe-embed">
  {#if !isInitialized}
    <div class="loading">
      <p>Loading game...</p>
    </div>
  {:else}
    <div class="game-container">
      <!-- Multiplayer Info -->
      {#if isMultiplayer && $game.session}
        <div class="multiplayer-info">
          <p class="player-symbol">
            You are: <strong>{$game.mySymbol || '?'}</strong>
          </p>
          {#if !gameStarted}
            <p class="waiting">Waiting for {playerCount}/2 players...</p>
            {#if canStart}
              <button class="btn-start" on:click={handleStartGame}>Start Game</button>
            {/if}
          {/if}
        </div>
      {/if}

      <!-- Game Status -->
      {#if canPlay}
        <div class="game-status">
          {#if $game.status === 'playing'}
            {#if isMultiplayer}
              {#if $game.isMyTurn}
                <p class="status your-turn">Your turn</p>
              {:else}
                <p class="status">Opponent's turn</p>
              {/if}
            {:else}
              <p class="status">Current: {$game.currentPlayer}</p>
            {/if}
          {:else if $game.status === 'won'}
            {#if isMultiplayer}
              <p class="status {$game.winner === $game.mySymbol ? 'winner' : 'loser'}">
                {$game.winner === $game.mySymbol ? 'You win!' : 'You lose!'}
              </p>
            {:else}
              <p class="status winner">{$game.winner} wins!</p>
            {/if}
          {:else if $game.status === 'draw'}
            <p class="status draw">Draw!</p>
          {/if}
        </div>

        <!-- Game Board -->
        <div class="board">
          {#each $game.board as cell, i}
            <button
              class="cell"
              class:winning-cell={$game.winningLine?.includes(i)}
              class:my-turn={isMultiplayer && $game.isMyTurn && cell === null}
              on:click={() => handleCellClick(i)}
              disabled={(isMultiplayer && (!$game.isMyTurn || $game.status !== 'playing')) || 
                        (!isMultiplayer && $game.status !== 'playing') || 
                        cell !== null}
            >
              {cell || ''}
            </button>
          {/each}
        </div>

        <!-- Actions -->
        {#if $game.status !== 'playing'}
          <div class="actions">
            {#if isMultiplayer}
              {#if $game.isHost}
                <button class="btn-reset" on:click={handleReset}>New Game</button>
              {/if}
            {:else}
              <button class="btn-reset" on:click={handleReset}>New Game</button>
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .tictactoe-embed {
    font-family: system-ui, -apple-system, sans-serif;
    padding: 1rem;
    max-width: 500px;
    margin: 0 auto;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }

  .game-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .multiplayer-info {
    text-align: center;
    padding: 0.75rem;
    background: #f0f9ff;
    border-radius: 8px;
    font-size: 0.9rem;
  }

  .multiplayer-info p {
    margin: 0.25rem 0;
  }

  .player-symbol {
    font-weight: 600;
  }

  .waiting {
    color: #6b7280;
  }

  .game-status {
    text-align: center;
    min-height: 2rem;
  }

  .status {
    font-size: 1.2rem;
    font-weight: bold;
    margin: 0;
    color: #333;
  }

  .status.your-turn {
    color: #10b981;
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

  .board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    max-width: 300px;
    margin: 0 auto;
    aspect-ratio: 1;
  }

  .cell {
    background: white;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 2rem;
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
  }

  .actions {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn-start,
  .btn-reset {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    background: #10b981;
    color: white;
  }

  .btn-start:hover,
  .btn-reset:hover {
    background: #059669;
    transform: translateY(-1px);
  }
</style>
