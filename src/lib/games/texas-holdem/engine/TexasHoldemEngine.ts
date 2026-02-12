import { Deck } from '../../../shared/deck';
import type { Card } from '../../../shared/deck';
import { getBestHand, type HandEvaluation } from '../../shared/poker-hands';
import type { TexasHoldemState, TexasHoldemMove, GamePhase, PlayerAction, TexasHoldemPlayerState } from './types';

const SMALL_BLIND = 10;
const BIG_BLIND = 20;

class Player {
	hand: Card[] = [];
	chips: number;
	currentBet: number;
	folded: boolean;
	allIn: boolean;
	bestHand: HandEvaluation | null = null;

	constructor(
		public name: string,
		public type: 'human' | 'bot',
		chips: number = 1000
	) {
		this.chips = chips;
		this.currentBet = 0;
		this.folded = false;
		this.allIn = false;
	}

	bet(amount: number): number {
		const actualBet = Math.min(amount, this.chips);
		this.chips -= actualBet;
		this.currentBet += actualBet;
		if (this.chips === 0) {
			this.allIn = true;
		}
		return actualBet;
	}

	fold() {
		this.folded = true;
	}

	evaluateBestHand(communityCards: Card[]) {
		if (communityCards.length >= 3) {
			const allCards = [...this.hand, ...communityCards];
			this.bestHand = getBestHand(allCards);
		}
	}

	addCard(card: Card) {
		this.hand.push(card);
	}
}

class Bot extends Player {
	constructor(
		name: string,
		public difficulty: 'easy' | 'medium' | 'hard' = 'medium',
		chips: number = 1000
	) {
		super(name, 'bot', chips);
	}

	makeDecision(
		currentBet: number,
		pot: number,
		communityCards: Card[]
	): { action: PlayerAction; amount?: number } {
		this.evaluateBestHand(communityCards);

		const toCall = currentBet - this.currentBet;
		const handStrength = this.bestHand ? this.bestHand.score / 10000000 : 0.1;

		if (this.difficulty === 'easy') {
			const rand = Math.random();
			if (toCall === 0) {
				return rand > 0.5 ? { action: 'check' } : { action: 'raise', amount: 20 };
			}
			if (rand < 0.3) return { action: 'fold' };
			if (rand < 0.7) return { action: 'call' };
			return { action: 'raise', amount: toCall + 20 };
		}

		if (this.difficulty === 'medium') {
			if (toCall === 0) {
				return handStrength > 0.5 ? { action: 'raise', amount: 40 } : { action: 'check' };
			}
			if (handStrength < 0.3) return { action: 'fold' };
			if (handStrength < 0.6) return { action: 'call' };
			return { action: 'raise', amount: toCall + 50 };
		}

		// Hard
		if (toCall === 0) {
			if (handStrength > 0.7) return { action: 'raise', amount: pot * 0.5 };
			if (handStrength > 0.5) return { action: 'raise', amount: 50 };
			return { action: 'check' };
		}

		const potOdds = toCall / (pot + toCall);
		if (handStrength < potOdds - 0.1) return { action: 'fold' };
		if (handStrength > 0.8) return { action: 'raise', amount: toCall + pot * 0.5 };
		return { action: 'call' };
	}
}

export class TexasHoldemEngine {
	private deck: Deck;
	private players: Player[];
	private communityCards: Card[];
	private pot: number;
	private currentBet: number;
	private currentPlayerIndex: number;
	private dealerIndex: number;
	private phase: GamePhase;
	private winners: number[];
	private botDifficulty: 'easy' | 'medium' | 'hard';

	constructor() {
		this.deck = new Deck();
		this.players = [];
		this.communityCards = [];
		this.pot = 0;
		this.currentBet = 0;
		this.currentPlayerIndex = 0;
		this.dealerIndex = 0;
		this.phase = 'setup';
		this.winners = [];
		this.botDifficulty = 'medium';
	}

	getState(): TexasHoldemState {
		return {
			players: this.players.map(p => ({
				name: p.name,
				type: p.type,
				hand: [...p.hand],
				chips: p.chips,
				currentBet: p.currentBet,
				folded: p.folded,
				allIn: p.allIn,
				bestHand: p.bestHand
			})),
			communityCards: [...this.communityCards],
			pot: this.pot,
			currentBet: this.currentBet,
			currentPlayerIndex: this.currentPlayerIndex,
			dealerIndex: this.dealerIndex,
			phase: this.phase,
			deckRemaining: this.deck.remaining,
			winners: [...this.winners]
		};
	}

	applyMove(move: TexasHoldemMove): void {
		if (move.type === 'setup') {
			this.setup(move.humanCount, move.botCount, move.botDifficulty);
		} else if (move.type === 'start') {
			this.start();
		} else if (move.type === 'player-action') {
			this.handlePlayerAction(move.action, move.raiseAmount);
		} else if (move.type === 'next-hand') {
			this.nextHand();
		} else if (move.type === 'bot-action') {
			this.processBotAction();
		}
	}

	private setup(humanCount: number, botCount: number, botDifficulty: 'easy' | 'medium' | 'hard' = 'medium'): void {
		this.players = [];
		this.botDifficulty = botDifficulty;

		for (let i = 0; i < humanCount; i++) {
			this.players.push(new Player(`Player ${i + 1}`, 'human'));
		}

		for (let i = 0; i < botCount; i++) {
			this.players.push(new Bot(`Bot ${i + 1}`, botDifficulty));
		}

		this.phase = 'setup';
	}

	private start(): void {
		if (this.players.length < 2) {
			throw new Error('Need at least 2 players to start');
		}

		this.deck = new Deck();
		this.communityCards = [];
		this.pot = 0;
		this.currentBet = BIG_BLIND;
		this.winners = [];

		this.players.forEach((player) => {
			player.hand = [];
			player.currentBet = 0;
			player.folded = false;
			player.allIn = false;
			player.bestHand = null;
		});

		// Post blinds
		const smallBlindIndex = (this.dealerIndex + 1) % this.players.length;
		const bigBlindIndex = (this.dealerIndex + 2) % this.players.length;

		const smallBlindAmount = this.players[smallBlindIndex].bet(SMALL_BLIND);
		const bigBlindAmount = this.players[bigBlindIndex].bet(BIG_BLIND);
		this.pot += smallBlindAmount + bigBlindAmount;

		// Deal hole cards
		for (let i = 0; i < 2; i++) {
			this.players.forEach((player) => {
				player.addCard(this.deck.deal());
			});
		}

		this.currentPlayerIndex = (bigBlindIndex + 1) % this.players.length;
		this.phase = 'pre-flop';
	}

	private handlePlayerAction(action: PlayerAction, raiseAmount?: number): void {
		const player = this.players[this.currentPlayerIndex];

		if (action === 'fold') {
			player.fold();
		} else if (action === 'check') {
			// Do nothing
		} else if (action === 'call') {
			const toCall = this.currentBet - player.currentBet;
			const betAmount = player.bet(toCall);
			this.pot += betAmount;
		} else if (action === 'raise') {
			const toCall = this.currentBet - player.currentBet;
			const totalRaise = toCall + (raiseAmount || 50);
			const betAmount = player.bet(totalRaise);
			this.pot += betAmount;
			this.currentBet = player.currentBet;
		} else if (action === 'all-in') {
			const betAmount = player.bet(player.chips);
			this.pot += betAmount;
			if (player.currentBet > this.currentBet) {
				this.currentBet = player.currentBet;
			}
		}

		this.nextPlayer();
	}

	private nextPlayer(): void {
		let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
		let attempts = 0;

		while (
			(this.players[nextIndex].folded || this.players[nextIndex].allIn) &&
			attempts < this.players.length
		) {
			nextIndex = (nextIndex + 1) % this.players.length;
			attempts++;
		}

		const activePlayers = this.players.filter((p) => !p.folded && !p.allIn);
		const allBetsEqual = activePlayers.every((p) => p.currentBet === this.currentBet);

		if (allBetsEqual && attempts > 0) {
			this.nextPhase();
		} else {
			this.currentPlayerIndex = nextIndex;
		}
	}

	private nextPhase(): void {
		this.players.forEach((player) => {
			player.currentBet = 0;
		});
		this.currentBet = 0;

		if (this.phase === 'pre-flop') {
			this.communityCards.push(this.deck.deal(), this.deck.deal(), this.deck.deal());
			this.phase = 'flop';
		} else if (this.phase === 'flop') {
			this.communityCards.push(this.deck.deal());
			this.phase = 'turn';
		} else if (this.phase === 'turn') {
			this.communityCards.push(this.deck.deal());
			this.phase = 'river';
		} else if (this.phase === 'river') {
			this.showdown();
			return;
		}

		this.currentPlayerIndex = (this.dealerIndex + 1) % this.players.length;
	}

	private showdown(): void {
		const activePlayers = this.players.filter((p) => !p.folded);
		activePlayers.forEach((player) => {
			player.evaluateBestHand(this.communityCards);
		});

		let bestScore = 0;
		const winningIndices: number[] = [];

		activePlayers.forEach((player) => {
			if (player.bestHand) {
				const playerIndex = this.players.indexOf(player);
				if (player.bestHand.score > bestScore) {
					bestScore = player.bestHand.score;
					winningIndices.length = 0;
					winningIndices.push(playerIndex);
				} else if (player.bestHand.score === bestScore) {
					winningIndices.push(playerIndex);
				}
			}
		});

		const winAmount = Math.floor(this.pot / winningIndices.length);
		winningIndices.forEach((index) => {
			this.players[index].chips += winAmount;
		});

		this.winners = winningIndices;
		this.phase = 'showdown';
	}

	private nextHand(): void {
		this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
		this.start();
	}

	private processBotAction(): void {
		const bot = this.players[this.currentPlayerIndex];
		if (bot.type === 'bot') {
			const decision = (bot as Bot).makeDecision(this.currentBet, this.pot, this.communityCards);
			this.handlePlayerAction(decision.action, decision.amount);
		}
	}

	needsBotAction(): boolean {
		if (this.phase === 'setup' || this.phase === 'showdown' || this.phase === 'ended') {
			return false;
		}
		return this.players[this.currentPlayerIndex]?.type === 'bot';
	}

	getCurrentPlayer(): TexasHoldemPlayerState | null {
		if (this.currentPlayerIndex < 0 || this.currentPlayerIndex >= this.players.length) {
			return null;
		}
		const p = this.players[this.currentPlayerIndex];
		return {
			name: p.name,
			type: p.type,
			hand: [...p.hand],
			chips: p.chips,
			currentBet: p.currentBet,
			folded: p.folded,
			allIn: p.allIn,
			bestHand: p.bestHand
		};
	}
}
