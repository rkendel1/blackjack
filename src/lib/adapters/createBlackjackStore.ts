import { writable, derived } from 'svelte/store';
import { tick } from 'svelte';
import { BlackjackEngine } from '../games/blackjack/engine';
import type { BlackjackState } from '../games/blackjack/engine';

export function createBlackjackStore() {
	const engine = new BlackjackEngine();
	const state = writable<BlackjackState>(engine.getState());
	let drawSound: HTMLAudioElement | null = null;

	const inGame = derived(state, ($state) => $state.turn !== null);

	function sync() {
		state.set(engine.getState());
	}

	const playDrawSound = () => {
		return new Promise<void>((resolve) => {
			if (drawSound) {
				drawSound.onended = () => resolve();
				drawSound.play().catch(() => resolve());
				return;
			}
			resolve();
		});
	};

	const start = async (restart = false) => {
		engine.applyMove({ type: 'start' });
		
		if (restart) {
			await tick();
		}

		await playDrawSound();
		sync();
	};

	const playerTurn = async (option: 'draw' | 'stop') => {
		if (option === 'draw') {
			await playDrawSound();
			engine.applyMove({ type: 'hit' });
			sync();
		} else {
			engine.applyMove({ type: 'stand' });
			
			// UI timing for dealer animation
			const currentState = engine.getState();
			if (currentState.turn === 'Dealer') {
				// Give time for dealer cards to animate
				await new Promise(resolve => setTimeout(resolve, 800));
				
				// Play sound for each dealer draw
				while (engine.shouldDealerDraw()) {
					await playDrawSound();
					await new Promise(resolve => setTimeout(resolve, 800));
				}
			}
			
			sync();
		}
	};

	const setAudio = (audio: HTMLAudioElement) => {
		drawSound = audio;
	};

	// Expose individual stores for backward compatibility
	const player = derived(state, ($state) => ({
		name: $state.player.name,
		hand: $state.player.hand,
		score: $state.player.score,
		type: 'human' as const
	}));

	const dealer = derived(state, ($state) => ({
		name: $state.dealer.name,
		hand: $state.dealer.hand,
		score: $state.dealer.score,
		type: 'human' as const
	}));

	const winner = derived(state, ($state) => $state.winner);
	const turn = derived(state, ($state) => $state.turn);

	return {
		state,
		player,
		dealer,
		winner,
		turn,
		inGame,
		start,
		playerTurn,
		setAudio
	};
}
