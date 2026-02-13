import { Deck } from '../../../shared/deck';
import type { Card } from '../../../shared/deck';
import { evaluateHand, type HandEvaluation } from '../../shared/poker-hands';
import type { PokerState, PokerMove, GamePhase, PlayerAction, PokerPlayerState } from './types';

const ANTE = 10;

class Player {
	hand: Card[] = [];
	chips: number;
	currentBet: number;
	folded: boolean;
	bestHand: HandEvaluation | null = null;
	selectedCards: boolean[] = [false, false, false, false, false];

	constructor(
		public name: string,
		public type: 'human' | 'bot',
		chips: number = 1000
	) {
		this.chips = chips;
		this.currentBet = 0;
		this.folded = false;
	}

	bet(amount: number): number {
		const actualBet = Math.min(amount, this.chips);
		this.chips -= actualBet;
		this.currentBet += actualBet;
		return actualBet;
	}

	fold() {
		this.folded = true;
	}

	evaluateHand() {
		if (this.hand.length === 5) {
			this.bestHand = evaluateHand(this.hand);
		}
	}

	addCard(card: Card) {
		this.hand.push(card);
	}

	discardAndDraw(deck: Deck) {
		const newCards: Card[] = [];
		for (let i = this.selectedCards.length - 1; i >= 0; i--) {
			if (this.selectedCards[i]) {
				this.hand.splice(i, 1);
				newCards.push(deck.deal());
			}
		}
		this.hand.push(...newCards);
		this.selectedCards = [false, false, false, false, false];
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

	selectCardsToDiscard() {
		this.evaluateHand();
		if (!this.bestHand) return;

		const handRank = this.bestHand.rank;

		if (
			handRank === 'royal-flush' ||
			handRank === 'straight-flush' ||
			handRank === 'full-house' ||
			handRank === 'flush' ||
			handRank === 'straight'
		) {
			this.selectedCards = [false, false, false, false, false];
		} else if (handRank === 'four-of-a-kind') {
			const rankCounts = new Map<string, number>();
			this.hand.forEach((card) => {
				rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
			});
			const quadRank = Array.from(rankCounts.entries()).find(([, count]) => count === 4)?.[0];
			this.selectedCards = this.hand.map((card) => card.rank !== quadRank);
		} else if (handRank === 'three-of-a-kind') {
			const rankCounts = new Map<string, number>();
			this.hand.forEach((card) => {
				rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
			});
			const tripRank = Array.from(rankCounts.entries()).find(([, count]) => count === 3)?.[0];
			this.selectedCards = this.hand.map((card) => card.rank !== tripRank);
		} else if (handRank === 'two-pair') {
			const rankCounts = new Map<string, number>();
			this.hand.forEach((card) => {
				rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
			});
			const pairRanks = Array.from(rankCounts.entries())
				.filter(([, count]) => count === 2)
				.map(([rank]) => rank);
			this.selectedCards = this.hand.map((card) => !pairRanks.includes(card.rank));
		} else if (handRank === 'pair') {
			const rankCounts = new Map<string, number>();
			this.hand.forEach((card) => {
				rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
			});
			const pairRank = Array.from(rankCounts.entries()).find(([, count]) => count === 2)?.[0];
			this.selectedCards = this.hand.map((card) => card.rank !== pairRank);
		} else {
			if (this.difficulty === 'easy') {
				this.selectedCards = this.hand.map(() => Math.random() > 0.5);
			} else {
				const sorted = [...this.hand].sort((a, b) => {
					const rankValue = (rank: string) => {
						if (rank === '1') return 14;
						if (rank === 'king') return 13;
						if (rank === 'queen') return 12;
						if (rank === 'jack') return 11;
						return parseInt(rank);
					};
					return rankValue(b.rank) - rankValue(a.rank);
				});
				const keepCount = this.difficulty === 'hard' ? 2 : 1;
				this.selectedCards = this.hand.map((card) => !sorted.slice(0, keepCount).includes(card));
			}
		}
	}

	makeDecision(currentBet: number): { action: PlayerAction; amount?: number } {
		this.evaluateHand();
		const handStrength = this.bestHand ? this.bestHand.score / 10000000 : 0.1;
		const toCall = currentBet - this.currentBet;

		if (this.difficulty === 'easy') {
			const rand = Math.random();
			if (toCall === 0) {
				return rand > 0.5 ? { action: 'check' } : { action: 'raise', amount: 20 };
			}
			if (rand < 0.4) return { action: 'fold' };
			if (rand < 0.8) return { action: 'call' };
			return { action: 'raise', amount: toCall + 20 };
		}

		if (toCall === 0) {
			return handStrength > 0.4 ? { action: 'raise', amount: 30 } : { action: 'check' };
		}

		if (handStrength < 0.25) return { action: 'fold' };
		if (handStrength < 0.5) return { action: 'call' };
		return { action: 'raise', amount: toCall + 40 };
	}
}

export class PokerEngine {
	private deck: Deck;
	private players: Player[];
	private pot: number;
	private currentBet: number;
	private currentPlayerIndex: number;
	private phase: GamePhase;
	private winners: number[];
	private botDifficulty: 'easy' | 'medium' | 'hard';

	constructor() {
		this.deck = new Deck();
		this.players = [];
		this.pot = 0;
		this.currentBet = 0;
		this.currentPlayerIndex = 0;
		this.phase = 'setup';
		this.winners = [];
		this.botDifficulty = 'medium';
	}

	getState(): PokerState {
		return {
			players: this.players.map((p) => ({
				name: p.name,
				type: p.type,
				hand: [...p.hand],
				chips: p.chips,
				currentBet: p.currentBet,
				folded: p.folded,
				bestHand: p.bestHand,
				selectedCards: [...p.selectedCards]
			})),
			pot: this.pot,
			currentBet: this.currentBet,
			currentPlayerIndex: this.currentPlayerIndex,
			phase: this.phase,
			deckRemaining: this.deck.remaining,
			winners: [...this.winners]
		};
	}

	applyMove(move: PokerMove): void {
		if (move.type === 'setup') {
			this.setup(move.humanCount, move.botCount, move.botDifficulty);
		} else if (move.type === 'start') {
			this.start();
		} else if (move.type === 'player-action') {
			this.handlePlayerAction(move.action, move.raiseAmount);
		} else if (move.type === 'toggle-card') {
			this.toggleCard(move.cardIndex);
		} else if (move.type === 'draw-cards') {
			this.drawCards();
		} else if (move.type === 'next-hand') {
			this.start();
		} else if (move.type === 'bot-action') {
			this.processBotAction();
		}
	}

	private setup(
		humanCount: number,
		botCount: number,
		botDifficulty: 'easy' | 'medium' | 'hard' = 'medium'
	): void {
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
		this.pot = 0;
		this.currentBet = ANTE;
		this.winners = [];

		this.players.forEach((player) => {
			player.hand = [];
			player.currentBet = 0;
			player.folded = false;
			player.bestHand = null;
			player.selectedCards = [false, false, false, false, false];
			const anteAmount = player.bet(ANTE);
			this.pot += anteAmount;
		});

		for (let i = 0; i < 5; i++) {
			this.players.forEach((player) => {
				player.addCard(this.deck.deal());
			});
		}

		this.currentPlayerIndex = 0;
		this.phase = 'betting';
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
			const totalRaise = toCall + (raiseAmount || 30);
			const betAmount = player.bet(totalRaise);
			this.pot += betAmount;
			this.currentBet = player.currentBet;
		}

		this.nextPlayer();
	}

	private nextPlayer(): void {
		let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
		let attempts = 0;

		while (this.players[nextIndex].folded && attempts < this.players.length) {
			nextIndex = (nextIndex + 1) % this.players.length;
			attempts++;
		}

		const activePlayers = this.players.filter((p) => !p.folded);
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

		if (this.phase === 'betting') {
			this.phase = 'draw';
			this.handleDrawPhase();
		} else if (this.phase === 'draw') {
			this.phase = 'final-betting';
			this.currentPlayerIndex = 0;
		} else if (this.phase === 'final-betting') {
			this.showdown();
		}
	}

	private handleDrawPhase(): void {
		this.players.forEach((player) => {
			if (player.type === 'bot' && !player.folded) {
				(player as Bot).selectCardsToDiscard();
				player.discardAndDraw(this.deck);
			}
		});
	}

	private toggleCard(cardIndex: number): void {
		const player = this.players[this.currentPlayerIndex];
		if (player.type === 'human' && this.phase === 'draw') {
			player.selectedCards[cardIndex] = !player.selectedCards[cardIndex];
		}
	}

	private drawCards(): void {
		const player = this.players[this.currentPlayerIndex];
		if (player.type === 'human' && this.phase === 'draw') {
			player.discardAndDraw(this.deck);
			this.nextPhase();
		}
	}

	private showdown(): void {
		const activePlayers = this.players.filter((p) => !p.folded);
		activePlayers.forEach((player) => {
			player.evaluateHand();
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

	private processBotAction(): void {
		const bot = this.players[this.currentPlayerIndex];
		if (bot.type === 'bot') {
			const decision = (bot as Bot).makeDecision(this.currentBet);
			this.handlePlayerAction(decision.action, decision.amount);
		}
	}

	needsBotAction(): boolean {
		if (this.phase !== 'betting' && this.phase !== 'final-betting') return false;
		return this.players[this.currentPlayerIndex]?.type === 'bot';
	}

	getCurrentPlayer(): PokerPlayerState | null {
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
			bestHand: p.bestHand,
			selectedCards: [...p.selectedCards]
		};
	}
}
