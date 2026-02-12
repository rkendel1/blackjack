import { writable, get } from 'svelte/store';
import { Deck } from '$lib/shared/deck';
import type { Card, Rank } from '$lib/shared/deck';
import { BasePlayer, AIPlayer } from '$lib/shared/player';

export class GoFishPlayer extends BasePlayer {
	books: Rank[] = [];

	hasRank(rank: Rank): boolean {
		return this.hand.some((card) => card.rank === rank);
	}

	countRank(rank: Rank): number {
		return this.hand.filter((card) => card.rank === rank).length;
	}

	giveCards(rank: Rank): Card[] {
		const cards = this.hand.filter((card) => card.rank === rank);
		this.hand = this.hand.filter((card) => card.rank !== rank);
		return cards;
	}

	checkForBooks(): Rank[] {
		const newBooks: Rank[] = [];
		const rankCounts = new Map<Rank, number>();

		for (const card of this.hand) {
			rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
		}

		for (const [rank, count] of rankCounts.entries()) {
			if (count === 4 && !this.books.includes(rank)) {
				this.books.push(rank);
				newBooks.push(rank);
				// Remove all cards of this rank from hand
				this.hand = this.hand.filter((card) => card.rank !== rank);
			}
		}

		return newBooks;
	}

	get score(): number {
		return this.books.length;
	}
}

export class GoFishAI extends AIPlayer {
	books: Rank[] = [];
	knownCards = new Map<Rank, boolean>();

	hasRank(rank: Rank): boolean {
		return this.hand.some((card) => card.rank === rank);
	}

	countRank(rank: Rank): number {
		return this.hand.filter((card) => card.rank === rank).length;
	}

	giveCards(rank: Rank): Card[] {
		const cards = this.hand.filter((card) => card.rank === rank);
		this.hand = this.hand.filter((card) => card.rank !== rank);
		return cards;
	}

	checkForBooks(): Rank[] {
		const newBooks: Rank[] = [];
		const rankCounts = new Map<Rank, number>();

		for (const card of this.hand) {
			rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
		}

		for (const [rank, count] of rankCounts.entries()) {
			if (count === 4 && !this.books.includes(rank)) {
				this.books.push(rank);
				newBooks.push(rank);
				this.hand = this.hand.filter((card) => card.rank !== rank);
			}
		}

		return newBooks;
	}

	get score(): number {
		return this.books.length;
	}

	chooseRank(): Rank | null {
		if (this.hand.length === 0) return null;

		// Strategy: Ask for ranks we have the most of
		const rankCounts = new Map<Rank, number>();
		for (const card of this.hand) {
			rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
		}

		let bestRank: Rank | null = null;
		let maxCount = 0;

		for (const [rank, count] of rankCounts.entries()) {
			if (count > maxCount) {
				maxCount = count;
				bestRank = rank;
			}
		}

		return bestRank;
	}
}

export type GameState = 'ready' | 'player-turn' | 'ai-turn' | 'won';

const getRankName = (rank: Rank): string => {
	const names: Record<Rank, string> = {
		'1': 'Ace',
		'2': '2',
		'3': '3',
		'4': '4',
		'5': '5',
		'6': '6',
		'7': '7',
		'8': '8',
		'9': '9',
		'10': '10',
		jack: 'Jack',
		queen: 'Queen',
		king: 'King'
	};
	return names[rank];
};

export function createGoFishGame() {
	const player = writable(new GoFishPlayer('Player'));
	const ai = writable(new GoFishAI('Computer'));
	const deck = writable(new Deck());
	const state = writable<GameState>('ready');
	const message = writable('');
	const selectedRank = writable<Rank | null>(null);
	const winner = writable<'player' | 'ai' | null>(null);
	const lastAction = writable('');

	const start = () => {
		const newDeck = new Deck();
		const newPlayer = new GoFishPlayer('Player');
		const newAI = new GoFishAI('Computer');

		// Deal 7 cards to each player
		for (let i = 0; i < 7; i++) {
			newPlayer.addCard(newDeck.deal());
			newAI.addCard(newDeck.deal());
		}

		newPlayer.checkForBooks();
		newAI.checkForBooks();

		deck.set(newDeck);
		player.set(newPlayer);
		ai.set(newAI);
		state.set('player-turn');
		message.set('Your turn! Select a rank to ask for.');
		selectedRank.set(null);
		winner.set(null);
		lastAction.set('');
	};

	const checkWinner = () => {
		const $deck = get(deck);
		const $player = get(player);
		const $ai = get(ai);

		const noCardsLeft = $deck.remaining === 0 && $player.hand.length === 0 && $ai.hand.length === 0;

		if (noCardsLeft) {
			state.set('won');
			if ($player.score > $ai.score) {
				winner.set('player');
				message.set(`You win! ${$player.score} - ${$ai.score}`);
			} else if ($ai.score > $player.score) {
				winner.set('ai');
				message.set(`Computer wins! ${$ai.score} - ${$player.score}`);
			} else {
				message.set(`It's a tie! ${$player.score} - ${$ai.score}`);
			}
		}
	};

	const goFish = () => {
		const $deck = get(deck);
		const $player = get(player);

		if ($deck.remaining > 0) {
			const card = $deck.deal();
			$player.addCard(card);

			const newBooks = $player.checkForBooks();
			if (newBooks.length > 0) {
				lastAction.update(
					(la) => la + `\nYou completed ${newBooks.map((r) => getRankName(r)).join(', ')}!`
				);
			}

			deck.set($deck);
			player.set($player);
		}

		checkWinner();
		if (get(state) !== 'won') {
			setTimeout(() => aiTurn(), 1500);
		}
	};

	const endTurn = () => {
		state.set('player-turn');
		message.set('Your turn! Select a rank to ask for.');
		selectedRank.set(null);
	};

	const aiTurn = () => {
		state.set('ai-turn');
		const $ai = get(ai);
		const $player = get(player);
		const $deck = get(deck);

		const rankToAsk = $ai.chooseRank();

		if (!rankToAsk) {
			endTurn();
			return;
		}

		const count = $player.countRank(rankToAsk);

		if (count > 0) {
			const cards = $player.giveCards(rankToAsk);
			$ai.addCards(cards);
			lastAction.set(`Computer asked for ${getRankName(rankToAsk)} and got ${count}!`);

			const newBooks = $ai.checkForBooks();
			if (newBooks.length > 0) {
				lastAction.update(
					(la) => la + `\nComputer completed ${newBooks.map((r) => getRankName(r)).join(', ')}!`
				);
			}

			player.set($player);
			ai.set($ai);

			checkWinner();
			if (!get(winner)) {
				setTimeout(() => aiTurn(), 1500);
			}
		} else {
			lastAction.set(`Computer asked for ${getRankName(rankToAsk)} - Go Fish!`);

			if ($deck.remaining > 0) {
				const card = $deck.deal();
				$ai.addCard(card);

				const newBooks = $ai.checkForBooks();
				if (newBooks.length > 0) {
					lastAction.update(
						(la) => la + `\nComputer completed ${newBooks.map((r) => getRankName(r)).join(', ')}!`
					);
				}

				deck.set($deck);
				ai.set($ai);
			}

			checkWinner();
			if (!get(winner)) {
				setTimeout(() => endTurn(), 1500);
			}
		}
	};

	const askForRank = (rank: Rank) => {
		if (get(state) !== 'player-turn') return;

		selectedRank.set(rank);
		const $ai = get(ai);
		const $player = get(player);
		const count = $ai.countRank(rank);

		if (count > 0) {
			const cards = $ai.giveCards(rank);
			$player.addCards(cards);
			lastAction.set(`Computer gave you ${count} ${getRankName(rank)}(s)`);
			message.set('You got cards! Check for books and go again.');

			const newBooks = $player.checkForBooks();
			if (newBooks.length > 0) {
				lastAction.update(
					(la) => la + `\nYou completed ${newBooks.map((r) => getRankName(r)).join(', ')}!`
				);
			}

			ai.set($ai);
			player.set($player);

			checkWinner();
		} else {
			lastAction.set(`Computer says "Go Fish!"`);
			message.set('Go Fish! Drawing a card...');
			goFish();
		}
	};

	const getAvailableRanks = (): Rank[] => {
		const $player = get(player);
		const ranks = new Set<Rank>();
		for (const card of $player.hand) {
			ranks.add(card.rank);
		}
		return Array.from(ranks);
	};

	return {
		player,
		ai,
		deck,
		state,
		message,
		selectedRank,
		winner,
		lastAction,
		start,
		askForRank,
		getAvailableRanks
	};
}
