import { writable, derived } from 'svelte/store';
import { TexasHoldemEngine } from '../games/texas-holdem/engine';
import type { TexasHoldemState, PlayerAction } from '../games/texas-holdem/engine';

export function createTexasHoldemStore() {
	const engine = new TexasHoldemEngine();
	const state = writable<TexasHoldemState>(engine.getState());

	function sync() {
		state.set(engine.getState());
	}

	const setupGame = (
		humanCount: number,
		botCount: number,
		botDifficulty: 'easy' | 'medium' | 'hard' = 'medium'
	) => {
		engine.applyMove({ type: 'setup', humanCount, botCount, botDifficulty });
		sync();
	};

	const startGame = async () => {
		engine.applyMove({ type: 'start' });
		sync();

		// Handle initial bot actions
		while (engine.needsBotAction()) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			engine.applyMove({ type: 'bot-action' });
			sync();
		}
	};

	const playerAction = async (action: PlayerAction, raiseAmount?: number) => {
		engine.applyMove({ type: 'player-action', action, raiseAmount });
		sync();

		// Handle subsequent bot actions
		while (engine.needsBotAction()) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			engine.applyMove({ type: 'bot-action' });
			sync();
		}
	};

	const nextHand = async () => {
		engine.applyMove({ type: 'next-hand' });
		sync();

		// Handle initial bot actions
		while (engine.needsBotAction()) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			engine.applyMove({ type: 'bot-action' });
			sync();
		}
	};

	// Derived stores
	const players = derived(state, ($state) => $state.players);
	const communityCards = derived(state, ($state) => $state.communityCards);
	const pot = derived(state, ($state) => $state.pot);
	const currentBet = derived(state, ($state) => $state.currentBet);
	const phase = derived(state, ($state) => $state.phase);
	const winners = derived(state, ($state) => $state.winners.map((idx) => $state.players[idx]));

	const currentPlayer = derived(state, ($state) => {
		const idx = $state.currentPlayerIndex;
		return idx >= 0 && idx < $state.players.length ? $state.players[idx] : null;
	});

	const activePlayers = derived(state, ($state) =>
		$state.players.filter((p) => !p.folded && p.chips > 0)
	);

	return {
		state,
		players,
		communityCards,
		pot,
		currentBet,
		currentPlayer,
		activePlayers,
		phase,
		winners,
		setupGame,
		startGame,
		playerAction,
		nextHand
	};
}
