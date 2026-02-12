import { writable, derived } from 'svelte/store';
import { PokerEngine } from '../games/poker/engine';
import type { PokerState, PlayerAction } from '../games/poker/engine';

export function createPokerStore() {
	const engine = new PokerEngine();
	const state = writable<PokerState>(engine.getState());

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
			await new Promise(resolve => setTimeout(resolve, 1000));
			engine.applyMove({ type: 'bot-action' });
			sync();
		}
	};

	const playerAction = async (action: PlayerAction, raiseAmount?: number) => {
		engine.applyMove({ type: 'player-action', action, raiseAmount });
		sync();

		// Handle subsequent bot actions
		while (engine.needsBotAction()) {
			await new Promise(resolve => setTimeout(resolve, 1000));
			engine.applyMove({ type: 'bot-action' });
			sync();
		}
	};

	const toggleCard = (cardIndex: number) => {
		engine.applyMove({ type: 'toggle-card', cardIndex });
		sync();
	};

	const drawPhase = () => {
		engine.applyMove({ type: 'draw-cards' });
		sync();
	};

	const humanDraw = async () => {
		engine.applyMove({ type: 'draw-cards' });
		sync();

		// Handle bot actions after draw
		while (engine.needsBotAction()) {
			await new Promise(resolve => setTimeout(resolve, 1000));
			engine.applyMove({ type: 'bot-action' });
			sync();
		}
	};

	const nextHand = async () => {
		engine.applyMove({ type: 'next-hand' });
		sync();

		// Handle initial bot actions
		while (engine.needsBotAction()) {
			await new Promise(resolve => setTimeout(resolve, 1000));
			engine.applyMove({ type: 'bot-action' });
			sync();
		}
	};

	// Derived stores
	const players = derived(state, ($state) => $state.players);
	const pot = derived(state, ($state) => $state.pot);
	const currentBet = derived(state, ($state) => $state.currentBet);
	const currentPlayerIndex = derived(state, ($state) => $state.currentPlayerIndex);
	const phase = derived(state, ($state) => $state.phase);
	const winners = derived(state, ($state) => 
		$state.winners.map(idx => $state.players[idx])
	);

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
		pot,
		currentBet,
		currentPlayer,
		currentPlayerIndex,
		activePlayers,
		phase,
		winners,
		setupGame,
		startGame,
		playerAction,
		toggleCard,
		drawPhase,
		humanDraw,
		nextHand
	};
}
