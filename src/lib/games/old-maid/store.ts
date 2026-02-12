import { writable, get } from 'svelte/store';
import { Deck } from '$lib/shared/deck';
import type { Card, Rank } from '$lib/shared/deck';
import { BasePlayer, AIPlayer } from '$lib/shared/player';

export class OldMaidPlayer extends BasePlayer {
	pairs: Rank[] = [];

	removePairs() {
		const rankCounts = new Map<Rank, Card[]>();

		// Group cards by rank
		for (const card of this.hand) {
			if (!rankCounts.has(card.rank)) {
				rankCounts.set(card.rank, []);
			}
			rankCounts.get(card.rank)!.push(card);
		}

		// Remove pairs
		const newHand: Card[] = [];
		for (const [rank, cards] of rankCounts.entries()) {
			const pairCount = Math.floor(cards.length / 2);
			for (let i = 0; i < pairCount; i++) {
				this.pairs.push(rank);
			}
			// Keep remaining odd card(s)
			if (cards.length % 2 === 1) {
				newHand.push(cards[cards.length - 1]);
			}
		}

		this.hand = newHand;
	}

	get pairCount(): number {
		return this.pairs.length;
	}
}

export class OldMaidAI extends AIPlayer {
	pairs: Rank[] = [];

	removePairs() {
		const rankCounts = new Map<Rank, Card[]>();

		for (const card of this.hand) {
			if (!rankCounts.has(card.rank)) {
				rankCounts.set(card.rank, []);
			}
			rankCounts.get(card.rank)!.push(card);
		}

		const newHand: Card[] = [];
		for (const [rank, cards] of rankCounts.entries()) {
			const pairCount = Math.floor(cards.length / 2);
			for (let i = 0; i < pairCount; i++) {
				this.pairs.push(rank);
			}
			if (cards.length % 2 === 1) {
				newHand.push(cards[cards.length - 1]);
			}
		}

		this.hand = newHand;
	}

	get pairCount(): number {
		return this.pairs.length;
	}

	chooseCardIndex(): number {
		// AI randomly chooses a card index from opponent
		return Math.floor(Math.random() * 100) % 100; // Will be modulo'd by hand length
	}
}

export type GameState = 'ready' | 'player-turn' | 'ai-turn' | 'won';

export function createOldMaidGame() {
	const player = writable(new OldMaidPlayer('Player'));
	const ai = writable(new OldMaidAI('Computer'));
	const state = writable<GameState>('ready');
	const message = writable('');
	const selectedCardIndex = writable<number | null>(null);
	const winner = writable<'player' | 'ai' | null>(null);
	const lastAction = writable('');

	const start = () => {
		const deck = new Deck();
		const newPlayer = new OldMaidPlayer('Player');
		const newAI = new OldMaidAI('Computer');

		// Remove one Queen to make it the "Old Maid"
		// Remove 3 queens, keep 1 as old maid
		const queens = deck.cards.filter((c) => c.rank === 'queen');
		if (queens.length >= 3) {
			for (let i = 0; i < 3; i++) {
				const index = deck.cards.indexOf(queens[i]);
				deck.cards.splice(index, 1);
			}
		}

		deck.shuffle();

		// Deal all cards
		let isPlayer = true;
		while (deck.remaining > 0) {
			const card = deck.deal();
			if (isPlayer) {
				newPlayer.addCard(card);
			} else {
				newAI.addCard(card);
			}
			isPlayer = !isPlayer;
		}

		// Remove initial pairs
		newPlayer.removePairs();
		newAI.removePairs();

		player.set(newPlayer);
		ai.set(newAI);
		state.set('player-turn');
		message.set('Your turn! Pick a card from the computer.');
		selectedCardIndex.set(null);
		winner.set(null);
		lastAction.set('Game started! Initial pairs removed.');
	};

	const checkWinner = () => {
		const $player = get(player);
		const $ai = get(ai);

		state.set('won');

		if ($player.hand.length === 0 && $ai.hand.length > 0) {
			winner.set('player');
			message.set('You win! Computer has the Old Maid!');
		} else if ($ai.hand.length === 0 && $player.hand.length > 0) {
			winner.set('ai');
			message.set('Computer wins! You have the Old Maid!');
		} else if ($player.hand.length === 0 && $ai.hand.length === 0) {
			message.set("It's a tie!");
		}
	};

	const aiTurn = () => {
		state.set('ai-turn');
		const $player = get(player);
		const $ai = get(ai);

		if ($player.hand.length === 0) {
			checkWinner();
			return;
		}

		const index = $ai.chooseCardIndex() % $player.hand.length;
		const card = $player.hand.splice(index, 1)[0];
		$ai.addCard(card);
		lastAction.set(`Computer drew a card from you.`);

		$ai.removePairs();

		player.set($player);
		ai.set($ai);

		if ($player.hand.length === 0 || $ai.hand.length === 0) {
			checkWinner();
		} else {
			state.set('player-turn');
			message.set('Your turn! Pick a card from the computer.');
		}
	};

	const playerDrawCard = (index: number) => {
		if (get(state) !== 'player-turn') return;

		const $ai = get(ai);
		const $player = get(player);

		if ($ai.hand.length === 0) return;

		const card = $ai.hand.splice(index, 1)[0];
		$player.addCard(card);
		lastAction.set(`You drew a card from the computer.`);

		$player.removePairs();

		player.set($player);
		ai.set($ai);

		if ($player.hand.length === 0 || $ai.hand.length === 0) {
			checkWinner();
		} else {
			setTimeout(() => aiTurn(), 1500);
		}
	};

	return {
		player,
		ai,
		state,
		message,
		selectedCardIndex,
		winner,
		lastAction,
		start,
		playerDrawCard
	};
}
