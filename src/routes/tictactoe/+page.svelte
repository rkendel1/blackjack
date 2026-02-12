<script lang="ts">
  import { createTicTacToeStore } from '$lib/games/tictactoe/store';
  import type { Player } from '$lib/games/tictactoe/engine/types';

  let enableBot = true;
  let botDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  let playerSymbol: Player = 'X';

  $: game = createTicTacToeStore({
    startingPlayer: 'X',
    enableBot,
    botDifficulty,
  });

  $: {
    // Reset game when settings change
    game.reset();
  }

  function handleCellClick(position: number) {
    if ($game.board[position] === null && $game.status === 'playing') {
      game.makeMove(position);
    }
  }

  function handleReset() {
    game.reset();
  }
</script>

<div class="tictactoe-container">
  <h1>Tic Tac Toe</h1>

  <div class="settings">
    <div class="setting">
      <label>
        <input type="checkbox" bind:checked={enableBot} />
        Play against bot
      </label>
    </div>

    {#if enableBot}
      <div class="setting">
        <label>
          Bot difficulty:
          <select bind:value={botDifficulty}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard (Unbeatable)</option>
          </select>
        </label>
      </div>
    {/if}
  </div>

  <div class="game-info">
    {#if $game.status === 'playing'}
      <p class="status">Current player: <strong>{$game.currentPlayer}</strong></p>
    {:else if $game.status === 'won'}
      <p class="status winner">🎉 Player <strong>{$game.winner}</strong> wins!</p>
    {:else if $game.status === 'draw'}
      <p class="status draw">🤝 It's a draw!</p>
    {/if}
  </div>

  <div class="board">
    {#each $game.board as cell, i}
      <button
        class="cell"
        class:winning-cell={$game.winningLine?.includes(i)}
        on:click={() => handleCellClick(i)}
        disabled={$game.status !== 'playing' || cell !== null}
      >
        {cell || ''}
      </button>
    {/each}
  </div>

  <div class="actions">
    <button class="btn-reset" on:click={handleReset}>New Game</button>
    <a href="/tictactoe-multiplayer" class="btn-multiplayer">Play Multiplayer</a>
  </div>
</div>

<style>
  .tictactoe-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }

  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 2rem;
  }

  .settings {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  .setting {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .setting label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .setting select {
    padding: 0.25rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .game-info {
    text-align: center;
    margin-bottom: 2rem;
    min-height: 2rem;
  }

  .status {
    font-size: 1.2rem;
    margin: 0;
  }

  .status.winner {
    color: #10b981;
    font-weight: bold;
  }

  .status.draw {
    color: #6b7280;
    font-weight: bold;
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
    }
    50% {
      transform: scale(1.05);
    }
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-reset,
  .btn-multiplayer {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-block;
  }

  .btn-reset {
    background: #4f46e5;
    color: white;
  }

  .btn-reset:hover {
    background: #4338ca;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
  }

  .btn-multiplayer {
    background: #10b981;
    color: white;
  }

  .btn-multiplayer:hover {
    background: #059669;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }
</style>
