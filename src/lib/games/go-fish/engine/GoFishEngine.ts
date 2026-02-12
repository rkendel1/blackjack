import { Deck } from '../../../shared/deck';
import type { Card, Rank } from '../../../shared/deck';
import type { GoFishState, GoFishMove, Winner, GameState } from './types';

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

class Player {
	hand: Card[] = [];
	books: Rank[] = [];

	constructor(public name: string) {}

	hasRank(rank: Rank): boolean {
		return this.hand.some((card) => card.rank === rank);
	}

	countRank(rank: Rank): number {
		return this.hand.filter((card) => card.rank === rank).length;
	}

	addCard(card: Card) {
		this.hand.push(card);
	}

	addCards(cards: Card[]) {
		this.hand.push(...cards);
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
}

class Bot extends Player {
	chooseRank(): Rank | null {
		if (this.hand.length === 0) return null;

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

export class GoFishEngine {
	private deck: Deck;
	private player: Player;
	private bot: Bot;
	private gameState: GameState;
	private winner: Winner;
	private message: string;
	private lastAction: string;

	constructor() {
		this.deck = new Deck();
		this.player = new Player('Player');
		this.bot = new Bot('Bot');
		this.gameState = 'ready';
		this.winner = null;
		this.message = 'Click "Start Game" to begin!';
		this.lastAction = '';
	}

	getState(): GoFishState {
		return {
			player: {
				name: this.player.name,
				hand: [...this.player.hand],
				books: [...this.player.books],
				score: this.player.score
			},
			bot: {
				name: this.bot.name,
				handCount: this.bot.hand.length,
				books: [...this.bot.books],
				score: this.bot.score
			},
			state: this.gameState,
			deckRemaining: this.deck.remaining,
			winner: this.winner,
			message: this.message,
			lastAction: this.lastAction
		};
	}

	applyMove(move: GoFishMove): void {
		if (move.type === 'start') {
			this.start();
		} else if (move.type === 'ask') {
			this.handlePlayerAsk(move.rank);
		} else if (move.type === 'bot-turn') {
			this.handleBotTurn();
		}
	}

	private start(): void {
		this.deck = new Deck();
		this.player = new Player('Player');
		this.bot = new Bot('Bot');

		// Deal 7 cards to each player
		for (let i = 0; i < 7; i++) {
			this.player.addCard(this.deck.deal());
			this.bot.addCard(this.deck.deal());
		}

		this.player.checkForBooks();
		this.bot.checkForBooks();

		this.gameState = 'player-turn';
		this.message = 'Your turn! Select a rank to ask for.';
		this.winner = null;
		this.lastAction = '';
	}

	private handlePlayerAsk(rank: Rank): void {
		if (this.gameState !== 'player-turn') return;

		const count = this.bot.countRank(rank);

		if (count > 0) {
			const cards = this.bot.giveCards(rank);
			this.player.addCards(cards);
			this.lastAction = `Bot gave you ${count} ${getRankName(rank)}(s)`;
			this.message = 'You got cards! Check for books and go again.';

			const newBooks = this.player.checkForBooks();
			if (newBooks.length > 0) {
				this.lastAction += `\nYou completed ${newBooks.map((r) => getRankName(r)).join(', ')}!`;
			}

			this.checkWinner();
		} else {
			this.lastAction = `Bot says "Go Fish!"`;
			this.message = 'Go Fish! Drawing a card...';

			if (this.deck.remaining > 0) {
				const card = this.deck.deal();
				this.player.addCard(card);

				const newBooks = this.player.checkForBooks();
				if (newBooks.length > 0) {
					this.lastAction += `\nYou completed ${newBooks.map((r) => getRankName(r)).join(', ')}!`;
				}
			}

			this.checkWinner();

			if (this.winner === null) {
				this.gameState = 'bot-turn';
			}
		}
	}

	private handleBotTurn(): void {
		if (this.gameState !== 'bot-turn') return;

		const rankToAsk = this.bot.chooseRank();

		if (!rankToAsk) {
			this.gameState = 'player-turn';
			this.message = 'Your turn! Select a rank to ask for.';
			return;
		}

		const count = this.player.countRank(rankToAsk);

		if (count > 0) {
			const cards = this.player.giveCards(rankToAsk);
			this.bot.addCards(cards);
			this.lastAction = `Bot asked for ${getRankName(rankToAsk)} and got ${count}!`;

			const newBooks = this.bot.checkForBooks();
			if (newBooks.length > 0) {
				this.lastAction += `\nBot completed ${newBooks.map((r) => getRankName(r)).join(', ')}!`;
			}

			this.checkWinner();
		} else {
			this.lastAction = `Bot asked for ${getRankName(rankToAsk)} - Go Fish!`;

			if (this.deck.remaining > 0) {
				const card = this.deck.deal();
				this.bot.addCard(card);

				const newBooks = this.bot.checkForBooks();
				if (newBooks.length > 0) {
					this.lastAction += `\nBot completed ${newBooks.map((r) => getRankName(r)).join(', ')}!`;
				}
			}

			this.checkWinner();

			if (this.winner === null) {
				this.gameState = 'player-turn';
				this.message = 'Your turn! Select a rank to ask for.';
			}
		}
	}

	private checkWinner(): void {
		const noCardsLeft =
			this.deck.remaining === 0 && this.player.hand.length === 0 && this.bot.hand.length === 0;

		if (noCardsLeft) {
			this.gameState = 'won';
			if (this.player.score > this.bot.score) {
				this.winner = 'player';
				this.message = `You win! ${this.player.score} - ${this.bot.score}`;
			} else if (this.bot.score > this.player.score) {
				this.winner = 'bot';
				this.message = `Bot wins! ${this.bot.score} - ${this.player.score}`;
			} else {
				this.winner = 'tie';
				this.message = `It's a tie! ${this.player.score} - ${this.bot.score}`;
			}
		}
	}

	needsBotTurn(): boolean {
		return this.gameState === 'bot-turn';
	}
}
