import { writable, derived } from 'svelte/store';
import { KlondikeEngine } from '../games/solitaire/klondike/engine';
import type { KlondikeState } from '../games/solitaire/klondike/engine';

export function createKlondikeStore() {
	const engine = new KlondikeEngine();
	const state = writable<KlondikeState>(engine.getState());

	function sync() {
		state.set(engine.getState());
	}

	const newGame = () => {
		engine.applyMove({ type: 'newGame' });
		sync();
	};

	const drawFromStock = () => {
		engine.applyMove({ type: 'drawFromStock' });
		sync();
	};

	const moveWasteToTableau = (tableauIndex: number) => {
		const beforeMoves = engine.getState().moves;
		engine.applyMove({ type: 'moveWasteToTableau', tableauIndex });
		sync();
		return engine.getState().moves > beforeMoves;
	};

	const moveWasteToFoundation = (foundationIndex: number) => {
		const beforeMoves = engine.getState().moves;
		engine.applyMove({ type: 'moveWasteToFoundation', foundationIndex });
		sync();
		return engine.getState().moves > beforeMoves;
	};

	const moveTableauToTableau = (fromIndex: number, cardIndex: number, toIndex: number) => {
		const beforeMoves = engine.getState().moves;
		engine.applyMove({ type: 'moveTableauToTableau', fromIndex, cardIndex, toIndex });
		sync();
		return engine.getState().moves > beforeMoves;
	};

	const moveTableauToFoundation = (tableauIndex: number, foundationIndex: number) => {
		const beforeMoves = engine.getState().moves;
		engine.applyMove({ type: 'moveTableauToFoundation', tableauIndex, foundationIndex });
		sync();
		return engine.getState().moves > beforeMoves;
	};

	const autoPlay = () => {
		const result = engine.autoPlay();
		sync();
		return result;
	};

	const tableau = derived(state, ($state) => $state.tableau);
	const foundations = derived(state, ($state) => $state.foundations);
	const stock = derived(state, ($state) => $state.stock);
	const waste = derived(state, ($state) => $state.waste);
	const revealedTableau = derived(state, ($state) => $state.revealedTableau);
	const moves = derived(state, ($state) => $state.moves);
	const isWon = derived(state, ($state) => $state.foundations.every((f) => f.cards.length === 13));
	const autoPlayAvailable = derived(state, () => engine.canAutoPlay());

	return {
		state,
		tableau,
		foundations,
		stock,
		waste,
		revealedTableau,
		moves,
		isWon,
		autoPlayAvailable,
		newGame,
		drawFromStock,
		moveWasteToTableau,
		moveWasteToFoundation,
		moveTableauToTableau,
		moveTableauToFoundation,
		autoPlay
	};
}
