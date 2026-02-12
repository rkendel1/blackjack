import { Deck } from '$lib/shared/deck';
import type { Card, Rank } from '$lib/shared/deck';
import { BasePlayer, AIPlayer } from '$lib/shared/player';

const RANK_VALUES: Record<Rank, number> = {
	'1': 14, // Ace is highest
	'2': 2,
	'3': 3,
	'4': 4,
	'5': 5,
	'6': 6,
	'7': 7,
	'8': 8,
	'9': 9,
	'10': 10,
	jack: 11,
	queen: 12,
	king: 13
};

export class WarPlayer extends BasePlayer {
	wonCards = $state<Card[]>([]);

	get totalCards(): number {
		return this.hand.length + this.wonCards.length;
	}

	playCard(): Card | null {
		if (this.hand.length === 0) {
			// Shuffle won cards back into hand
			this.hand = [...this.wonCards];
			this.wonCards = [];
			// Shuffle
			this.hand.sort(() => Math.random() - 0.5);
		}
		return this.hand.pop() || null;
	}

	addWonCards(cards: Card[]) {
		this.wonCards.push(...cards);
	}
}

export class WarAIPlayer extends AIPlayer {
	wonCards = $state<Card[]>([]);

	get totalCards(): number {
		return this.hand.length + this.wonCards.length;
	}

	playCard(): Card | null {
		if (this.hand.length === 0) {
			this.hand = [...this.wonCards];
			this.wonCards = [];
			this.hand.sort(() => Math.random() - 0.5);
		}
		return this.hand.pop() || null;
	}

	addWonCards(cards: Card[]) {
		this.wonCards.push(...cards);
	}

	makeMove() {
		return this.playCard();
	}
}

export type GameState = 'ready' | 'playing' | 'war' | 'won';
export type RoundResult = 'player' | 'opponent' | 'war' | null;

export class WarGame {
	player = $state(new WarPlayer('Player'));
	opponent = $state(new WarAIPlayer('Computer'));
	state = $state<GameState>('ready');
	playerCard = $state<Card | null>(null);
	opponentCard = $state<Card | null>(null);
	roundResult = $state<RoundResult>(null);
	cardsInPlay = $state<Card[]>([]);
	warCount = $state(0);
	message = $state('');
	winner = $state<'player' | 'opponent' | null>(null);

	start() {
		const deck = new Deck();
		this.player = new WarPlayer('Player');
		this.opponent = new WarAIPlayer('Computer');

		// Deal all cards equally
		while (deck.remaining > 0) {
			const card1 = deck.deal();
			const card2 = deck.deal();
			this.player.addCard(card1);
			if (card2) this.opponent.addCard(card2);
		}

		this.state = 'playing';
		this.playerCard = null;
		this.opponentCard = null;
		this.roundResult = null;
		this.cardsInPlay = [];
		this.warCount = 0;
		this.message = 'Click "Play Card" to start!';
		this.winner = null;
	}

	playRound() {
		if (this.state === 'won') return;

		this.playerCard = this.player.playCard();
		this.opponentCard = this.opponent.playCard();

		if (!this.playerCard || !this.opponentCard) {
			this.checkWinner();
			return;
		}

		this.cardsInPlay.push(this.playerCard, this.opponentCard);

		const playerValue = RANK_VALUES[this.playerCard.rank];
		const opponentValue = RANK_VALUES[this.opponentCard.rank];

		if (playerValue > opponentValue) {
			this.roundResult = 'player';
			this.player.addWonCards([...this.cardsInPlay]);
			this.message = `You won this round! (+${this.cardsInPlay.length} cards)`;
			this.cardsInPlay = [];
			this.warCount = 0;
		} else if (opponentValue > playerValue) {
			this.roundResult = 'opponent';
			this.opponent.addWonCards([...this.cardsInPlay]);
			this.message = `Computer won this round! (+${this.cardsInPlay.length} cards)`;
			this.cardsInPlay = [];
			this.warCount = 0;
		} else {
			this.roundResult = 'war';
			this.state = 'war';
			this.warCount++;
			this.message = 'WAR! Click "Play Card" again!';
		}

		this.checkWinner();
	}

	checkWinner() {
		if (this.player.totalCards === 0) {
			this.state = 'won';
			this.winner = 'opponent';
			this.message = 'Computer wins the game!';
		} else if (this.opponent.totalCards === 0) {
			this.state = 'won';
			this.winner = 'player';
			this.message = 'You win the game!';
		}
	}

	continueWar() {
		// In war, each player plays 3 face-down cards and 1 face-up
		// For simplicity, we'll just play 1 more card
		if (this.state === 'war') {
			this.state = 'playing';
			this.playRound();
		}
	}
}
