/**
 * Single-player Tic Tac Toe Store
 * Svelte store adapter for TicTacToeEngine
 */

import { writable, derived, get } from 'svelte/store';
import { TicTacToeEngine } from './engine/TicTacToeEngine';
import type { TicTacToeState, TicTacToeMove, TicTacToeConfig, Player } from './engine/types';

export function createTicTacToeStore(config: TicTacToeConfig = {}) {
  const engine = new TicTacToeEngine(config);
  const state = writable<TicTacToeState>(engine.getState());

  function updateState() {
    state.set(engine.getState());
  }

  return {
    subscribe: state.subscribe,

    // Derived stores
    board: derived(state, ($state) => $state.board),
    currentPlayer: derived(state, ($state) => $state.currentPlayer),
    status: derived(state, ($state) => $state.status),
    winner: derived(state, ($state) => $state.winner),
    winningLine: derived(state, ($state) => $state.winningLine),

    // Actions
    makeMove(position: number): boolean {
      const currentState = get(state);
      const move: TicTacToeMove = {
        type: 'place',
        player: currentState.currentPlayer,
        position,
      };

      const success = engine.applyMove(move);
      if (success) {
        updateState();

        // If bot is enabled and game is still playing, make bot move
        if (config.enableBot && engine.getState().status === 'playing') {
          setTimeout(() => {
            const botMove = engine.getBotMove();
            if (botMove !== null) {
              const botMoveObj: TicTacToeMove = {
                type: 'place',
                player: engine.getState().currentPlayer,
                position: botMove,
              };
              engine.applyMove(botMoveObj);
              updateState();
            }
          }, 500); // Small delay for better UX
        }
      }

      return success;
    },

    reset(): void {
      engine.reset();
      updateState();
    },

    getValidMoves(): number[] {
      return engine.getValidMoves();
    },
  };
}
