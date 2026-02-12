import { Deck } from '$lib/shared/deck';
import type { Card, Rank } from '$lib/shared/deck';
import { BasePlayer, AIPlayer } from '$lib/shared/player';

export class GoFishPlayer extends BasePlayer {
	books = $state<Rank[]>([]);

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
	books = $state<Rank[]>([]);
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

export class GoFishGame {
	player = $state(new GoFishPlayer('Player'));
	ai = $state(new GoFishAI('Computer'));
	deck = $state(new Deck());
	state = $state<GameState>('ready');
	message = $state('');
	selectedRank = $state<Rank | null>(null);
	winner = $state<'player' | 'ai' | null>(null);
	lastAction = $state('');

	start() {
		this.deck = new Deck();
		this.player = new GoFishPlayer('Player');
		this.ai = new GoFishAI('Computer');

		// Deal 7 cards to each player
		for (let i = 0; i < 7; i++) {
			this.player.addCard(this.deck.deal());
			this.ai.addCard(this.deck.deal());
		}

		this.player.checkForBooks();
		this.ai.checkForBooks();

		this.state = 'player-turn';
		this.message = 'Your turn! Select a rank to ask for.';
		this.selectedRank = null;
		this.winner = null;
		this.lastAction = '';
	}

	askForRank(rank: Rank) {
		if (this.state !== 'player-turn') return;

		this.selectedRank = rank;
		const count = this.ai.countRank(rank);

		if (count > 0) {
			const cards = this.ai.giveCards(rank);
			this.player.addCards(cards);
			this.lastAction = `Computer gave you ${count} ${this.getRankName(rank)}(s)`;
			this.message = 'You got cards! Check for books and go again.';

			const newBooks = this.player.checkForBooks();
			if (newBooks.length > 0) {
				this.lastAction += `\nYou completed ${newBooks.map((r) => this.getRankName(r)).join(', ')}!`;
			}

			this.checkWinner();
		} else {
			this.lastAction = `Computer says "Go Fish!"`;
			this.message = 'Go Fish! Drawing a card...';
			this.goFish();
		}
	}

	goFish() {
		if (this.deck.remaining > 0) {
			const card = this.deck.deal();
			this.player.addCard(card);

			const newBooks = this.player.checkForBooks();
			if (newBooks.length > 0) {
				this.lastAction += `\nYou completed ${newBooks.map((r) => this.getRankName(r)).join(', ')}!`;
			}
		}

		this.checkWinner();
		if (this.state !== 'won') {
			setTimeout(() => this.aiTurn(), 1500);
		}
	}

	aiTurn() {
		this.state = 'ai-turn';
		const rankToAsk = this.ai.chooseRank();

		if (!rankToAsk) {
			this.endTurn();
			return;
		}

		const count = this.player.countRank(rankToAsk);

		if (count > 0) {
			const cards = this.player.giveCards(rankToAsk);
			this.ai.addCards(cards);
			this.lastAction = `Computer asked for ${this.getRankName(rankToAsk)} and got ${count}!`;

			const newBooks = this.ai.checkForBooks();
			if (newBooks.length > 0) {
				this.lastAction += `\nComputer completed ${newBooks.map((r) => this.getRankName(r)).join(', ')}!`;
			}

			this.checkWinner();
			if (!this.winner) {
				setTimeout(() => this.aiTurn(), 1500);
			}
		} else {
			this.lastAction = `Computer asked for ${this.getRankName(rankToAsk)} - Go Fish!`;

			if (this.deck.remaining > 0) {
				const card = this.deck.deal();
				this.ai.addCard(card);

				const newBooks = this.ai.checkForBooks();
				if (newBooks.length > 0) {
					this.lastAction += `\nComputer completed ${newBooks.map((r) => this.getRankName(r)).join(', ')}!`;
				}
			}

			this.checkWinner();
			if (!this.winner) {
				setTimeout(() => this.endTurn(), 1500);
			}
		}
	}

	endTurn() {
		this.state = 'player-turn';
		this.message = 'Your turn! Select a rank to ask for.';
		this.selectedRank = null;
	}

	checkWinner() {
		const noCardsLeft =
			this.deck.remaining === 0 && this.player.hand.length === 0 && this.ai.hand.length === 0;

		if (noCardsLeft) {
			this.state = 'won';
			if (this.player.score > this.ai.score) {
				this.winner = 'player';
				this.message = `You win! ${this.player.score} - ${this.ai.score}`;
			} else if (this.ai.score > this.player.score) {
				this.winner = 'ai';
				this.message = `Computer wins! ${this.ai.score} - ${this.player.score}`;
			} else {
				this.message = `It's a tie! ${this.player.score} - ${this.ai.score}`;
			}
		}
	}

	getRankName(rank: Rank): string {
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
	}

	getAvailableRanks(): Rank[] {
		const ranks = new Set<Rank>();
		for (const card of this.player.hand) {
			ranks.add(card.rank);
		}
		return Array.from(ranks);
	}
}
