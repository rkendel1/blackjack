import { writable, derived, get } from 'svelte/store';
import { TicTacToeEngine } from '../games/tictactoe/engine/TicTacToeEngine';
import type { TicTacToeState, TicTacToeMove, TicTacToeConfig } from '../games/tictactoe/engine/types';

export function createTicTacToeStore(config: TicTacToeConfig = {}) {
	const engine = new TicTacToeEngine(config);
	const state = writable<TicTacToeState>(engine.getState());

	function sync() {
		state.set(engine.getState());
	}

	// Derived stores
	const board = derived(state, ($state) => $state.board);
	const currentPlayer = derived(state, ($state) => $state.currentPlayer);
	const status = derived(state, ($state) => $state.status);
	const winner = derived(state, ($state) => $state.winner);
	const winningLine = derived(state, ($state) => $state.winningLine);

	const makeMove = (position: number): boolean => {
		const currentState = get(state);
		const move: TicTacToeMove = {
			type: 'place',
			player: currentState.currentPlayer,
			position
		};

		const success = engine.applyMove(move);
		if (success) {
			sync();

			// If bot is enabled and game is still playing, make bot move
			if (config.enableBot && engine.getState().status === 'playing') {
				setTimeout(() => {
					const botMove = engine.getBotMove();
					if (botMove !== null) {
						const botMoveObj: TicTacToeMove = {
							type: 'place',
							player: engine.getState().currentPlayer,
							position: botMove
						};
						engine.applyMove(botMoveObj);
						sync();
					}
				}, 500); // Small delay for better UX
			}
		}

		return success;
	};

	const reset = (): void => {
		engine.reset();
		sync();
	};

	const getValidMoves = (): number[] => {
		return engine.getValidMoves();
	};

	return {
		subscribe: state.subscribe,
		board,
		currentPlayer,
		status,
		winner,
		winningLine,
		makeMove,
		reset,
		getValidMoves
	};
}
