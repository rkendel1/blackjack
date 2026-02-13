import { Deck } from '../../../shared/deck';
import type { Card } from '../../../shared/deck';
import type { BlackjackState, PlayerState, DealerState, Winner, BlackjackMove } from './types';

const SCORES: Record<string, number> = {
	'1': 11,
	'2': 2,
	'3': 3,
	'4': 4,
	'5': 5,
	'6': 6,
	'7': 7,
	'8': 8,
	'9': 9,
	'10': 10,
	jack: 10,
	queen: 10,
	king: 10
};

export function calculateScore(cards: Card[]): number {
	let score = 0;
	let aces = 0;

	for (const card of cards) {
		if (card.rank === '1') {
			aces++;
			score += 11;
		} else {
			score += SCORES[card.rank];
		}
	}

	// Adjust for aces if score > 21
	while (score > 21 && aces > 0) {
		score -= 10;
		aces--;
	}

	return score;
}

export class BlackjackEngine {
	private deck: Deck;
	private player: PlayerState;
	private dealer: DealerState;
	private turn: 'Player' | 'Dealer' | null;
	private winner: Winner;

	constructor() {
		this.deck = new Deck();
		this.player = this.createPlayer();
		this.dealer = this.createDealer();
		this.turn = null;
		this.winner = null;
	}

	private createPlayer(): PlayerState {
		return {
			name: 'Player',
			hand: [],
			score: 0
		};
	}

	private createDealer(): DealerState {
		return {
			name: 'Dealer',
			hand: [],
			score: 0
		};
	}

	private updatePlayerScore(): void {
		this.player.score = calculateScore(this.player.hand);
	}

	private updateDealerScore(): void {
		this.dealer.score = calculateScore(this.dealer.hand);
	}

	private checkBlackjack(): void {
		if (this.player.score === 21) {
			this.winner = 'Player';
			this.turn = null;
		}
	}

	private checkBust(): void {
		if (this.player.score > 21) {
			this.winner = 'Dealer';
			this.turn = null;
		}
	}

	private calculateWinner(): void {
		if (this.dealer.score > 21) {
			this.winner = 'Player';
		} else if (this.player.score > this.dealer.score) {
			this.winner = 'Player';
		} else if (this.player.score < this.dealer.score) {
			this.winner = 'Dealer';
		} else {
			this.winner = 'Draw';
		}
		this.turn = null;
	}

	start(): void {
		// Reset game
		this.deck = new Deck();
		this.player = this.createPlayer();
		this.dealer = this.createDealer();
		this.winner = null;
		this.turn = 'Player';

		// Deal initial cards
		this.dealer.hand.push(this.deck.deal());
		this.player.hand.push(this.deck.deal());
		this.player.hand.push(this.deck.deal());

		this.updatePlayerScore();
		this.updateDealerScore();

		this.checkBlackjack();
	}

	hit(): void {
		if (this.turn !== 'Player' || this.winner !== null) {
			return;
		}

		if (this.player.score < 21) {
			this.player.hand.push(this.deck.deal());
			this.updatePlayerScore();
			this.checkBust();
		}
	}

	stand(): void {
		if (this.turn !== 'Player' || this.winner !== null) {
			return;
		}

		this.turn = 'Dealer';
		this.dealerTurn();
	}

	private dealerTurn(): void {
		// Dealer draws until score >= 17
		while (this.dealer.score < 17) {
			this.dealer.hand.push(this.deck.deal());
			this.updateDealerScore();
		}

		this.calculateWinner();
	}

	applyMove(move: BlackjackMove): void {
		switch (move.type) {
			case 'start':
				this.start();
				break;
			case 'hit':
				this.hit();
				break;
			case 'stand':
				this.stand();
				break;
		}
	}

	getState(): BlackjackState {
		return {
			player: { ...this.player, hand: [...this.player.hand] },
			dealer: { ...this.dealer, hand: [...this.dealer.hand] },
			turn: this.turn,
			winner: this.winner,
			deckRemaining: this.deck.remaining
		};
	}

	// Helper method to check if dealer needs to draw (for UI layer to animate)
	shouldDealerDraw(): boolean {
		return this.turn === 'Dealer' && this.dealer.score < 17;
	}
}
