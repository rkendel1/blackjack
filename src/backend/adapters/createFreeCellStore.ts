import { writable, derived } from 'svelte/store';
import { FreeCellEngine } from '../games/solitaire/freecell/engine';
import type { FreeCellState } from '../games/solitaire/freecell/engine';

export function createFreeCellStore() {
	const engine = new FreeCellEngine();
	const state = writable<FreeCellState>(engine.getState());

	function sync() {
		state.set(engine.getState());
	}

	const newGame = () => {
		engine.applyMove({ type: 'newGame' });
		sync();
	};

	const moveTableauToFreeCell = (tableauIndex: number, freeCellIndex: number) => {
		const result = engine.moveTableauToFreeCell(tableauIndex, freeCellIndex);
		sync();
		return result;
	};

	const moveFreeCellToTableau = (freeCellIndex: number, tableauIndex: number) => {
		const result = engine.moveFreeCellToTableau(freeCellIndex, tableauIndex);
		sync();
		return result;
	};

	const moveFreeCellToFoundation = (freeCellIndex: number, foundationIndex: number) => {
		const result = engine.moveFreeCellToFoundation(freeCellIndex, foundationIndex);
		sync();
		return result;
	};

	const moveTableauToTableau = (fromIndex: number, cardIndex: number, toIndex: number) => {
		const result = engine.moveTableauToTableau(fromIndex, cardIndex, toIndex);
		sync();
		return result;
	};

	const moveTableauToFoundation = (tableauIndex: number, foundationIndex: number) => {
		const result = engine.moveTableauToFoundation(tableauIndex, foundationIndex);
		sync();
		return result;
	};

	const autoPlay = () => {
		const result = engine.autoPlay();
		sync();
		return result;
	};

	const tableau = derived(state, ($state) => $state.tableau);
	const foundations = derived(state, ($state) => $state.foundations);
	const freeCells = derived(state, ($state) => $state.freeCells);
	const moves = derived(state, ($state) => $state.moves);
	const isWon = derived(state, ($state) => $state.foundations.every((f) => f.cards.length === 13));
	const autoPlayAvailable = derived(state, () => engine.canAutoPlay());

	return {
		state,
		tableau,
		foundations,
		freeCells,
		moves,
		isWon,
		autoPlayAvailable,
		newGame,
		moveTableauToFreeCell,
		moveFreeCellToTableau,
		moveFreeCellToFoundation,
		moveTableauToTableau,
		moveTableauToFoundation,
		autoPlay
	};
}
