import { Deck } from '../../../shared/deck';
import type { Card } from '../../../shared/deck';
import type { WarState, PlayerState, OpponentState, GameState, RoundResult, Winner, WarMove } from './types';
import { RANK_VALUES } from './types';

export class WarEngine {
	private player: PlayerState;
	private opponent: OpponentState;
	private gameState: GameState;
	private playerCard: Card | null;
	private opponentCard: Card | null;
	private roundResult: RoundResult;
	private cardsInPlay: Card[];
	private warCount: number;
	private winner: Winner;

	constructor() {
		this.player = this.createPlayer();
		this.opponent = this.createOpponent();
		this.gameState = 'ready';
		this.playerCard = null;
		this.opponentCard = null;
		this.roundResult = null;
		this.cardsInPlay = [];
		this.warCount = 0;
		this.winner = null;
	}

	private createPlayer(): PlayerState {
		return {
			name: 'Player',
			hand: [],
			wonCards: [],
			totalCards: 0
		};
	}

	private createOpponent(): OpponentState {
		return {
			name: 'Bot',
			hand: [],
			wonCards: [],
			totalCards: 0
		};
	}

	private updateTotalCards(): void {
		this.player.totalCards = this.player.hand.length + this.player.wonCards.length;
		this.opponent.totalCards = this.opponent.hand.length + this.opponent.wonCards.length;
	}

	private playCardFromDeck(playerState: PlayerState | OpponentState): Card | null {
		if (playerState.hand.length === 0) {
			// Shuffle won cards back into hand
			playerState.hand = [...playerState.wonCards];
			playerState.wonCards = [];
			// Shuffle using Fisher-Yates
			for (let i = playerState.hand.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[playerState.hand[i], playerState.hand[j]] = [playerState.hand[j], playerState.hand[i]];
			}
		}
		return playerState.hand.pop() || null;
	}

	private checkWinner(): void {
		if (this.player.totalCards === 0) {
			this.gameState = 'won';
			this.winner = 'opponent';
		} else if (this.opponent.totalCards === 0) {
			this.gameState = 'won';
			this.winner = 'player';
		}
	}

	start(): void {
		const deck = new Deck();
		
		// Reset game
		this.player = this.createPlayer();
		this.opponent = this.createOpponent();
		this.playerCard = null;
		this.opponentCard = null;
		this.roundResult = null;
		this.cardsInPlay = [];
		this.warCount = 0;
		this.winner = null;

		// Deal all cards equally
		while (deck.remaining > 0) {
			const card1 = deck.deal();
			this.player.hand.push(card1);
			
			if (deck.remaining > 0) {
				const card2 = deck.deal();
				this.opponent.hand.push(card2);
			}
		}

		this.updateTotalCards();
		this.gameState = 'playing';
	}

	playRound(): void {
		if (this.gameState === 'won') return;

		const pCard = this.playCardFromDeck(this.player);
		const oCard = this.playCardFromDeck(this.opponent);

		this.playerCard = pCard;
		this.opponentCard = oCard;

		if (!pCard || !oCard) {
			this.updateTotalCards();
			this.checkWinner();
			return;
		}

		this.cardsInPlay.push(pCard, oCard);

		const playerValue = RANK_VALUES[pCard.rank];
		const opponentValue = RANK_VALUES[oCard.rank];

		if (playerValue > opponentValue) {
			this.roundResult = 'player';
			this.player.wonCards.push(...this.cardsInPlay);
			this.cardsInPlay = [];
			this.warCount = 0;
			this.gameState = 'playing';
		} else if (opponentValue > playerValue) {
			this.roundResult = 'opponent';
			this.opponent.wonCards.push(...this.cardsInPlay);
			this.cardsInPlay = [];
			this.warCount = 0;
			this.gameState = 'playing';
		} else {
			this.roundResult = 'war';
			this.gameState = 'war';
			this.warCount++;
		}

		this.updateTotalCards();
		this.checkWinner();
	}

	applyMove(move: WarMove): void {
		switch (move.type) {
			case 'start':
				this.start();
				break;
			case 'play-round':
				this.playRound();
				break;
		}
	}

	getState(): WarState {
		return {
			player: {
				...this.player,
				hand: [...this.player.hand],
				wonCards: [...this.player.wonCards]
			},
			opponent: {
				...this.opponent,
				hand: [...this.opponent.hand],
				wonCards: [...this.opponent.wonCards]
			},
			gameState: this.gameState,
			playerCard: this.playerCard ? { ...this.playerCard } : null,
			opponentCard: this.opponentCard ? { ...this.opponentCard } : null,
			roundResult: this.roundResult,
			cardsInPlay: [...this.cardsInPlay],
			warCount: this.warCount,
			winner: this.winner
		};
	}
}
