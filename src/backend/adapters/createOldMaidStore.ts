import { writable, derived } from 'svelte/store';
import { OldMaidEngine } from '../games/old-maid/engine';
import type { OldMaidState } from '../games/old-maid/engine';

export function createOldMaidStore() {
	const engine = new OldMaidEngine();
	const state = writable<OldMaidState>(engine.getState());
	const selectedCardIndex = writable<number | null>(null);
	const lastAction = writable('');

	function sync() {
		state.set(engine.getState());
	}

	const start = () => {
		engine.applyMove({ type: 'start' });
		sync();
		selectedCardIndex.set(null);
		lastAction.set('Game started! Initial pairs removed.');
	};

	const playerDrawCard = (index: number) => {
		const currentState = engine.getState();
		if (currentState.gameState !== 'player-turn') return;

		const result = engine.playerDrawCard(index);
		if (result.drewCard) {
			lastAction.set('You drew a card from the bot.');
			sync();

			// If game not over and it's bot's turn, trigger bot action after delay
			const newState = engine.getState();
			if (newState.gameState === 'bot-turn') {
				setTimeout(() => {
					botTurn();
				}, 1500);
			}
		}
	};

	const botTurn = () => {
		const result = engine.botDrawCard();
		if (result.drewCard) {
			lastAction.set('Bot drew a card from you.');
			sync();
		}
	};

	// Derived stores for backward compatibility
	const player = derived(state, ($state) => ({
		name: $state.player.name,
		hand: $state.player.hand,
		pairs: $state.player.pairs,
		pairCount: $state.player.pairCount,
		type: 'human' as const
	}));

	const bot = derived(state, ($state) => ({
		name: $state.bot.name,
		hand: $state.bot.hand,
		pairs: $state.bot.pairs,
		pairCount: $state.bot.pairCount,
		type: 'bot' as const
	}));

	const gameState = derived(state, ($state) => $state.gameState);
	const winner = derived(state, ($state) => $state.winner);

	const message = derived(state, ($state) => {
		switch ($state.gameState) {
			case 'ready':
				return 'Click "Start Game" to begin';
			case 'player-turn':
				return 'Your turn! Pick a card from the bot.';
			case 'bot-turn':
				return 'Bot is choosing...';
			case 'won':
				if ($state.winner === 'player') {
					return 'You win! Bot has the Old Maid!';
				} else if ($state.winner === 'bot') {
					return 'Bot wins! You have the Old Maid!';
				} else {
					return "It's a tie!";
				}
			default:
				return '';
		}
	});

	return {
		state,
		player,
		bot,
		gameState,
		message,
		selectedCardIndex,
		winner,
		lastAction,
		start,
		playerDrawCard
	};
}
