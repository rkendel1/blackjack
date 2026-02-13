import { writable, derived } from 'svelte/store';
import { SpiderEngine } from '../games/solitaire/spider/engine';
import type { SpiderState } from '../games/solitaire/spider/engine';

export function createSpiderStore() {
	const engine = new SpiderEngine();
	const state = writable<SpiderState>(engine.getState());

	function sync() {
		state.set(engine.getState());
	}

	const newGame = () => {
		engine.applyMove({ type: 'newGame' });
		sync();
	};

	const dealFromStock = () => {
		const result = engine.dealFromStock();
		sync();
		return result;
	};

	const moveTableauToTableau = (fromIndex: number, cardIndex: number, toIndex: number) => {
		const result = engine.moveTableauToTableau(fromIndex, cardIndex, toIndex);
		sync();
		return result;
	};

	const autoPlay = () => {
		const result = engine.autoPlay();
		sync();
		return result;
	};

	const getHint = () => {
		return engine.getHint();
	};

	const tableau = derived(state, ($state) => $state.tableau);
	const foundations = derived(state, ($state) => $state.foundations);
	const stock = derived(state, ($state) => $state.stock);
	const revealedTableau = derived(state, ($state) => $state.revealedTableau);
	const moves = derived(state, ($state) => $state.moves);
	const isWon = derived(state, ($state) => $state.foundations.length === 8);
	const canDealFromStock = derived(state, () => engine.canDealFromStock());
	const autoPlayAvailable = derived(state, () => engine.canAutoPlay());

	return {
		state,
		tableau,
		foundations,
		stock,
		revealedTableau,
		moves,
		isWon,
		canDealFromStock,
		autoPlayAvailable,
		newGame,
		dealFromStock,
		moveTableauToTableau,
		autoPlay,
		getHint
	};
}
