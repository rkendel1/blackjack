import { Deck } from '../../../shared/deck';
import type { Card, Rank } from '../../../shared/deck';
import type { OldMaidState, PlayerState, BotState, GameState, Winner, OldMaidMove } from './types';

function removePairs(hand: Card[]): { newHand: Card[]; pairs: Rank[] } {
	const rankCounts = new Map<Rank, Card[]>();

	// Group cards by rank
	for (const card of hand) {
		if (!rankCounts.has(card.rank)) {
			rankCounts.set(card.rank, []);
		}
		rankCounts.get(card.rank)!.push(card);
	}

	// Remove pairs
	const newHand: Card[] = [];
	const pairs: Rank[] = [];
	for (const [rank, cards] of rankCounts.entries()) {
		const pairCount = Math.floor(cards.length / 2);
		for (let i = 0; i < pairCount; i++) {
			pairs.push(rank);
		}
		// Keep remaining odd card(s)
		if (cards.length % 2 === 1) {
			newHand.push(cards[cards.length - 1]);
		}
	}

	return { newHand, pairs };
}

export class OldMaidEngine {
	private player: PlayerState;
	private bot: BotState;
	private gameState: GameState;
	private winner: Winner;

	constructor() {
		this.player = this.createPlayer();
		this.bot = this.createBot();
		this.gameState = 'ready';
		this.winner = null;
	}

	private createPlayer(): PlayerState {
		return {
			name: 'Player',
			hand: [],
			pairs: [],
			pairCount: 0,
			cardCount: 0
		};
	}

	private createBot(): BotState {
		return {
			name: 'Bot',
			hand: [],
			pairs: [],
			pairCount: 0,
			cardCount: 0
		};
	}

	private updatePlayerPairs(): void {
		const result = removePairs(this.player.hand);
		this.player.hand = result.newHand;
		this.player.pairs.push(...result.pairs);
		this.player.pairCount = this.player.pairs.length;
		this.player.cardCount = this.player.hand.length;
	}

	private updateBotPairs(): void {
		const result = removePairs(this.bot.hand);
		this.bot.hand = result.newHand;
		this.bot.pairs.push(...result.pairs);
		this.bot.pairCount = this.bot.pairs.length;
		this.bot.cardCount = this.bot.hand.length;
	}

	private checkWinner(): void {
		if (this.player.hand.length === 0 && this.bot.hand.length > 0) {
			this.winner = 'player';
			this.gameState = 'won';
		} else if (this.bot.hand.length === 0 && this.player.hand.length > 0) {
			this.winner = 'bot';
			this.gameState = 'won';
		} else if (this.player.hand.length === 0 && this.bot.hand.length === 0) {
			// Tie - this shouldn't happen in Old Maid, but handle it
			this.gameState = 'won';
		}
	}

	start(): void {
		const deck = new Deck();

		// Reset game
		this.player = this.createPlayer();
		this.bot = this.createBot();
		this.winner = null;

		// Remove 3 queens, keep 1 as the "Old Maid"
		const queens = deck.cards.filter((c) => c.rank === 'queen');
		if (queens.length >= 3) {
			for (let i = 0; i < 3; i++) {
				const index = deck.cards.indexOf(queens[i]);
				deck.cards.splice(index, 1);
			}
		}

		deck.shuffle();

		// Deal all cards alternating between player and bot
		let isPlayer = true;
		while (deck.remaining > 0) {
			const card = deck.deal();
			if (isPlayer) {
				this.player.hand.push(card);
			} else {
				this.bot.hand.push(card);
			}
			isPlayer = !isPlayer;
		}

		// Remove initial pairs
		this.updatePlayerPairs();
		this.updateBotPairs();

		this.gameState = 'player-turn';
	}

	playerDrawCard(index: number): { drewCard: boolean } {
		if (this.gameState !== 'player-turn') {
			return { drewCard: false };
		}

		if (this.bot.hand.length === 0 || index < 0 || index >= this.bot.hand.length) {
			return { drewCard: false };
		}

		// Player draws card from bot
		const card = this.bot.hand.splice(index, 1)[0];
		this.player.hand.push(card);
		this.bot.cardCount = this.bot.hand.length;

		// Remove any new pairs
		this.updatePlayerPairs();

		// Check for winner
		if (this.player.hand.length === 0 || this.bot.hand.length === 0) {
			this.checkWinner();
			return { drewCard: true };
		}

		// Set to bot turn (UI will handle timing)
		this.gameState = 'bot-turn';
		return { drewCard: true };
	}

	botDrawCard(): { drewCard: boolean; cardIndex: number } {
		if (this.gameState !== 'bot-turn') {
			return { drewCard: false, cardIndex: -1 };
		}

		if (this.player.hand.length === 0) {
			this.checkWinner();
			return { drewCard: false, cardIndex: -1 };
		}

		// Bot randomly chooses a card
		const cardIndex = Math.floor(Math.random() * this.player.hand.length);
		const card = this.player.hand.splice(cardIndex, 1)[0];
		this.bot.hand.push(card);
		this.player.cardCount = this.player.hand.length;

		// Remove any new pairs
		this.updateBotPairs();

		// Check for winner
		if (this.player.hand.length === 0 || this.bot.hand.length === 0) {
			this.checkWinner();
			return { drewCard: true, cardIndex };
		}

		// Set to player turn
		this.gameState = 'player-turn';
		return { drewCard: true, cardIndex };
	}

	applyMove(move: OldMaidMove): void {
		switch (move.type) {
			case 'start':
				this.start();
				break;
			case 'draw':
				this.playerDrawCard(move.playerIndex);
				break;
			case 'bot-draw':
				this.botDrawCard();
				break;
		}
	}

	getState(): OldMaidState {
		return {
			player: {
				...this.player,
				hand: [...this.player.hand],
				pairs: [...this.player.pairs]
			},
			bot: {
				...this.bot,
				hand: [...this.bot.hand],
				pairs: [...this.bot.pairs]
			},
			gameState: this.gameState,
			winner: this.winner
		};
	}

	// Helper for UI to know if bot should draw
	shouldBotDraw(): boolean {
		return this.gameState === 'bot-turn';
	}
}
