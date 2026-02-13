import { writable, derived } from 'svelte/store';
import { WarEngine } from '../games/war/engine';
import type { WarState } from '../games/war/engine';

export function createWarStore() {
	const engine = new WarEngine();
	const state = writable<WarState>(engine.getState());

	function sync() {
		state.set(engine.getState());
	}

	const start = () => {
		engine.applyMove({ type: 'start' });
		sync();
	};

	const playRound = () => {
		engine.applyMove({ type: 'play-round' });
		sync();
	};

	const continueWar = () => {
		const currentState = engine.getState();
		if (currentState.gameState === 'war') {
			playRound();
		}
	};

	// Derived stores for backward compatibility
	const player = derived(state, ($state) => ({
		name: $state.player.name,
		hand: $state.player.hand,
		wonCards: $state.player.wonCards,
		totalCards: $state.player.totalCards,
		type: 'human' as const
	}));

	const opponent = derived(state, ($state) => ({
		name: $state.opponent.name,
		hand: $state.opponent.hand,
		wonCards: $state.opponent.wonCards,
		totalCards: $state.opponent.totalCards,
		type: 'bot' as const
	}));

	const gameState = derived(state, ($state) => $state.gameState);
	const playerCard = derived(state, ($state) => $state.playerCard);
	const opponentCard = derived(state, ($state) => $state.opponentCard);
	const roundResult = derived(state, ($state) => $state.roundResult);
	const cardsInPlay = derived(state, ($state) => $state.cardsInPlay);
	const warCount = derived(state, ($state) => $state.warCount);
	const winner = derived(state, ($state) => $state.winner);

	const message = derived(state, ($state) => {
		if ($state.gameState === 'ready') {
			return 'Click "Start Game" to begin!';
		} else if ($state.gameState === 'won') {
			if ($state.winner === 'player') {
				return 'You win the game!';
			} else if ($state.winner === 'opponent') {
				return 'Bot wins the game!';
			}
		} else if ($state.gameState === 'war') {
			return 'WAR! Click "Play Card" again!';
		} else if ($state.roundResult === 'player' && $state.cardsInPlay.length === 0) {
			const wonCount = $state.player.wonCards.length;
			return `You won this round! (${wonCount} cards)`;
		} else if ($state.roundResult === 'opponent' && $state.cardsInPlay.length === 0) {
			const wonCount = $state.opponent.wonCards.length;
			return `Bot won this round! (${wonCount} cards)`;
		} else if ($state.gameState === 'playing') {
			return 'Click "Play Card" to continue!';
		}
		return '';
	});

	return {
		state,
		player,
		opponent,
		gameState: gameState as typeof gameState & { subscribe: typeof gameState.subscribe },
		playerCard,
		opponentCard,
		roundResult,
		cardsInPlay,
		warCount,
		message,
		winner,
		start,
		playRound,
		continueWar
	};
}
