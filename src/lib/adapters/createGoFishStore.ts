import { writable, derived } from 'svelte/store';
import { GoFishEngine } from '../games/go-fish/engine';
import type { GoFishState } from '../games/go-fish/engine';
import type { Rank } from '../shared/deck';

export function createGoFishStore() {
	const engine = new GoFishEngine();
	const state = writable<GoFishState>(engine.getState());

	function sync() {
		state.set(engine.getState());
	}

	const start = () => {
		engine.applyMove({ type: 'start' });
		sync();
	};

	const askForRank = async (rank: Rank) => {
		engine.applyMove({ type: 'ask', rank });
		sync();

		// Handle bot turns with timing
		while (engine.needsBotTurn()) {
			await new Promise((resolve) => setTimeout(resolve, 1500));
			engine.applyMove({ type: 'bot-turn' });
			sync();
		}
	};

	// Derived stores for backward compatibility
	const player = derived(state, ($state) => ({
		name: $state.player.name,
		hand: $state.player.hand,
		books: $state.player.books,
		score: $state.player.score
	}));

	const bot = derived(state, ($state) => ({
		name: $state.bot.name,
		hand: new Array($state.bot.handCount).fill(null), // Hidden cards
		books: $state.bot.books,
		score: $state.bot.score
	}));

	const deck = derived(state, ($state) => ({
		remaining: $state.deckRemaining
	}));

	const gameState = derived(state, ($state) => $state.state);
	const message = derived(state, ($state) => $state.message);
	const lastAction = derived(state, ($state) => $state.lastAction);
	const winner = derived(state, ($state) => $state.winner);

	return {
		state,
		player,
		bot,
		deck,
		gameState,
		message,
		lastAction,
		winner,
		start,
		askForRank
	};
}
