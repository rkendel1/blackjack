import { writable, derived } from 'svelte/store';
import { CrazyEightsEngine } from '../games/crazy-eights/engine';
import type { CrazyEightsState } from '../games/crazy-eights/engine';
import type { Card, Suit } from '../shared/deck';

function canPlayCard(card: Card, topCard: Card, currentSuit: Suit | null): boolean {
	if (card.rank === '8') return true;
	if (card.suit === (currentSuit || topCard.suit)) return true;
	if (card.rank === topCard.rank) return true;
	return false;
}

export function createCrazyEightsStore() {
	const engine = new CrazyEightsEngine();
	const state = writable<CrazyEightsState>(engine.getState());

	function sync() {
		state.set(engine.getState());
	}

	const start = () => {
		engine.applyMove({ type: 'start' });
		sync();
	};

	const playCard = async (cardIndex: number) => {
		engine.applyMove({ type: 'play-card', cardIndex });
		sync();

		// Handle bot turns with timing
		if (engine.needsBotTurn()) {
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			while (engine.needsBotTurn()) {
				engine.applyMove({ type: 'bot-turn' });
				sync();
				
				// Check if bot drew and can play again
				if (engine.canDrawAgain()) {
					await new Promise(resolve => setTimeout(resolve, 1000));
				}
			}
		}
	};

	const drawCard = async () => {
		engine.applyMove({ type: 'draw-card' });
		sync();

		// Handle bot turns with timing
		if (engine.needsBotTurn()) {
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			while (engine.needsBotTurn()) {
				engine.applyMove({ type: 'bot-turn' });
				sync();
				
				if (engine.canDrawAgain()) {
					await new Promise(resolve => setTimeout(resolve, 1000));
				}
			}
		}
	};

	const chooseSuit = async (suit: Suit) => {
		engine.applyMove({ type: 'choose-suit', suit });
		sync();

		// Handle bot turns with timing
		if (engine.needsBotTurn()) {
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			while (engine.needsBotTurn()) {
				engine.applyMove({ type: 'bot-turn' });
				sync();
				
				if (engine.canDrawAgain()) {
					await new Promise(resolve => setTimeout(resolve, 1000));
				}
			}
		}
	};

	// Derived stores for backward compatibility
	const player = derived(state, ($state) => ({
		name: $state.player.name,
		hand: $state.player.hand,
		canPlayCard: (card: Card, topCard: Card, currentSuit: Suit | null) => 
			canPlayCard(card, topCard, currentSuit)
	}));

	const bot = derived(state, ($state) => ({
		name: $state.bot.name,
		hand: new Array($state.bot.handCount).fill(null)
	}));

	const deck = derived(state, ($state) => ({
		remaining: $state.deckRemaining
	}));

	const discardPile = derived(state, ($state) => {
		const cards = [];
		if ($state.topCard) {
			cards.push($state.topCard);
		}
		return cards;
	});

	const gameState = derived(state, ($state) => $state.state);
	const topCard = derived(state, ($state) => $state.topCard);
	const currentSuit = derived(state, ($state) => $state.currentSuit);
	const message = derived(state, ($state) => $state.message);
	const lastAction = derived(state, ($state) => $state.lastAction);
	const winner = derived(state, ($state) => $state.winner);

	return {
		state,
		player,
		bot,
		deck,
		discardPile,
		gameState,
		topCard,
		currentSuit,
		message,
		lastAction,
		winner,
		start,
		playCard,
		drawCard,
		chooseSuit
	};
}
