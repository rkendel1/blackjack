import { Deck } from '../../../shared/deck';
import type { Card, Rank, Suit } from '../../../shared/deck';
import type { CrazyEightsState, CrazyEightsMove, Winner, GameState } from './types';

const getCardName = (card: Card): string => {
	const rankNames: Record<Rank, string> = {
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
	return `${rankNames[card.rank]} of ${card.suit}s`;
};

class Player {
	hand: Card[] = [];

	constructor(public name: string) {}

	canPlayCard(card: Card, topCard: Card, currentSuit: Suit | null): boolean {
		if (card.rank === '8') return true;
		if (card.suit === (currentSuit || topCard.suit)) return true;
		if (card.rank === topCard.rank) return true;
		return false;
	}

	getPlayableCards(topCard: Card, currentSuit: Suit | null): Card[] {
		return this.hand.filter((card) => this.canPlayCard(card, topCard, currentSuit));
	}

	addCard(card: Card) {
		this.hand.push(card);
	}
}

class Bot extends Player {
	chooseCardToPlay(topCard: Card, currentSuit: Suit | null): Card | null {
		const playable = this.getPlayableCards(topCard, currentSuit);
		if (playable.length === 0) return null;

		const nonEights = playable.filter((c) => c.rank !== '8');
		if (nonEights.length > 0) {
			return nonEights[0];
		}
		return playable[0];
	}

	chooseSuit(): Suit {
		const suitCounts = new Map<Suit, number>();
		for (const card of this.hand) {
			suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
		}

		let bestSuit: Suit = 'heart';
		let maxCount = 0;
		for (const [suit, count] of suitCounts.entries()) {
			if (count > maxCount) {
				maxCount = count;
				bestSuit = suit;
			}
		}
		return bestSuit;
	}
}

export class CrazyEightsEngine {
	private deck: Deck;
	private player: Player;
	private bot: Bot;
	private discardPile: Card[];
	private gameState: GameState;
	private currentSuit: Suit | null;
	private winner: Winner;
	private message: string;
	private lastAction: string;

	constructor() {
		this.deck = new Deck();
		this.player = new Player('Player');
		this.bot = new Bot('Bot');
		this.discardPile = [];
		this.gameState = 'ready';
		this.currentSuit = null;
		this.winner = null;
		this.message = 'Click "Start Game" to begin!';
		this.lastAction = '';
	}

	getState(): CrazyEightsState {
		return {
			player: {
				name: this.player.name,
				hand: [...this.player.hand],
				handCount: this.player.hand.length
			},
			bot: {
				name: this.bot.name,
				handCount: this.bot.hand.length
			},
			state: this.gameState,
			topCard: this.discardPile.length > 0 ? this.discardPile[this.discardPile.length - 1] : null,
			currentSuit: this.currentSuit,
			deckRemaining: this.deck.remaining,
			winner: this.winner,
			message: this.message,
			lastAction: this.lastAction
		};
	}

	applyMove(move: CrazyEightsMove): void {
		if (move.type === 'start') {
			this.start();
		} else if (move.type === 'play-card') {
			this.handlePlayCard(move.cardIndex);
		} else if (move.type === 'draw-card') {
			this.handleDrawCard();
		} else if (move.type === 'choose-suit') {
			this.handleChooseSuit(move.suit);
		} else if (move.type === 'bot-turn') {
			this.handleBotTurn();
		}
	}

	private start(): void {
		this.deck = new Deck();
		this.player = new Player('Player');
		this.bot = new Bot('Bot');
		this.discardPile = [];

		// Deal 5 cards to each player
		for (let i = 0; i < 5; i++) {
			this.player.addCard(this.deck.deal());
			this.bot.addCard(this.deck.deal());
		}

		// Start discard pile
		this.discardPile.push(this.deck.deal());

		this.gameState = 'player-turn';
		this.currentSuit = null;
		this.message = 'Your turn! Play a card or draw.';
		this.winner = null;
		this.lastAction = 'Game started!';
	}

	private handlePlayCard(cardIndex: number): void {
		if (this.gameState !== 'player-turn') return;

		const card = this.player.hand[cardIndex];
		if (!card) return;

		const topCard = this.discardPile[this.discardPile.length - 1];
		if (!this.player.canPlayCard(card, topCard, this.currentSuit)) {
			this.message = "Can't play that card!";
			return;
		}

		this.player.hand.splice(cardIndex, 1);
		this.discardPile.push(card);
		this.lastAction = `You played ${getCardName(card)}`;

		if (card.rank === '8') {
			this.gameState = 'choosing-suit';
			this.message = 'Choose a suit!';
			return;
		}

		this.currentSuit = null;

		if (this.player.hand.length === 0) {
			this.checkWinner();
		} else {
			this.gameState = 'bot-turn';
		}
	}

	private handleDrawCard(): void {
		if (this.gameState !== 'player-turn') return;

		if (this.deck.remaining > 0) {
			const card = this.deck.deal();
			this.player.addCard(card);
			this.lastAction = 'You drew a card';

			const topCard = this.discardPile[this.discardPile.length - 1];
			if (this.player.canPlayCard(card, topCard, this.currentSuit)) {
				this.message = 'You can play the card you drew!';
			} else {
				this.message = 'Turn passed to bot.';
				this.gameState = 'bot-turn';
			}
		} else {
			this.message = 'Deck is empty! Turn passed.';
			this.gameState = 'bot-turn';
		}
	}

	private handleChooseSuit(suit: Suit): void {
		if (this.gameState !== 'choosing-suit') return;

		this.currentSuit = suit;
		this.lastAction += ` and chose ${suit}`;
		this.message = 'Suit chosen!';

		if (this.player.hand.length === 0) {
			this.checkWinner();
		} else {
			this.gameState = 'bot-turn';
		}
	}

	private handleBotTurn(): void {
		if (this.gameState !== 'bot-turn') return;

		const topCard = this.discardPile[this.discardPile.length - 1];
		const playableCard = this.bot.chooseCardToPlay(topCard, this.currentSuit);

		if (playableCard) {
			const index = this.bot.hand.indexOf(playableCard);
			this.bot.hand.splice(index, 1);
			this.discardPile.push(playableCard);
			this.lastAction = `Bot played ${getCardName(playableCard)}`;

			if (playableCard.rank === '8') {
				const chosenSuit = this.bot.chooseSuit();
				this.currentSuit = chosenSuit;
				this.lastAction += ` and chose ${chosenSuit}`;
			} else {
				this.currentSuit = null;
			}

			if (this.bot.hand.length === 0) {
				this.checkWinner();
			} else {
				this.gameState = 'player-turn';
				this.message = 'Your turn! Play a card or draw.';
			}
		} else {
			if (this.deck.remaining > 0) {
				const card = this.deck.deal();
				this.bot.addCard(card);
				this.lastAction = 'Bot drew a card';

				if (this.bot.canPlayCard(card, topCard, this.currentSuit)) {
					// Bot can play, continue bot turn
					return;
				} else {
					this.gameState = 'player-turn';
					this.message = 'Your turn! Play a card or draw.';
				}
			} else {
				this.gameState = 'player-turn';
				this.message = 'Deck is empty! Your turn.';
			}
		}
	}

	private checkWinner(): void {
		this.gameState = 'won';

		if (this.player.hand.length === 0) {
			this.winner = 'player';
			this.message = 'You win!';
		} else if (this.bot.hand.length === 0) {
			this.winner = 'bot';
			this.message = 'Bot wins!';
		}
	}

	needsBotTurn(): boolean {
		return this.gameState === 'bot-turn';
	}

	canDrawAgain(): boolean {
		if (this.gameState !== 'bot-turn') return false;
		const topCard = this.discardPile[this.discardPile.length - 1];
		const lastCard = this.bot.hand[this.bot.hand.length - 1];
		return this.bot.canPlayCard(lastCard, topCard, this.currentSuit);
	}
}
