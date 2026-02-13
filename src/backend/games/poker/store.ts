import { writable, derived, get } from 'svelte/store';
import { Deck } from '../../shared/deck';
import type { Card } from '../../shared/deck';
import { BasePlayer, BotPlayer } from '../../shared/player';
import { evaluateHand, type HandEvaluation } from '../shared/poker-hands';

export type GamePhase = 'setup' | 'deal' | 'betting' | 'draw' | 'final-betting' | 'showdown';
export type PlayerAction = 'fold' | 'check' | 'call' | 'raise';

export class PokerPlayer extends BasePlayer {
	chips: number;
	currentBet: number;
	folded: boolean;
	bestHand: HandEvaluation | null = null;
	selectedCards: boolean[] = [false, false, false, false, false];

	constructor(name: string, type: 'human' | 'bot' = 'human', chips: number = 1000) {
		super(name, type);
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

export class PokerBot extends BotPlayer {
	chips: number;
	currentBet: number;
	folded: boolean;
	bestHand: HandEvaluation | null = null;
	selectedCards: boolean[] = [false, false, false, false, false];

	constructor(
		name: string,
		difficulty: 'easy' | 'medium' | 'hard' = 'medium',
		chips: number = 1000
	) {
		super(name, difficulty);
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

	selectCardsToDiscard() {
		this.evaluateHand();
		if (!this.bestHand) return;

		// Simple strategy: keep good cards based on hand rank
		const handRank = this.bestHand.rank;

		if (
			handRank === 'royal-flush' ||
			handRank === 'straight-flush' ||
			handRank === 'full-house' ||
			handRank === 'flush' ||
			handRank === 'straight'
		) {
			// Keep all cards
			this.selectedCards = [false, false, false, false, false];
		} else if (handRank === 'four-of-a-kind') {
			// Keep the four of a kind, discard the kicker
			const rankCounts = new Map<string, number>();
			this.hand.forEach((card) => {
				rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
			});
			const quadRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 4)?.[0];
			this.selectedCards = this.hand.map((card) => card.rank !== quadRank);
		} else if (handRank === 'three-of-a-kind') {
			// Keep the three of a kind, discard others
			const rankCounts = new Map<string, number>();
			this.hand.forEach((card) => {
				rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
			});
			const tripRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 3)?.[0];
			this.selectedCards = this.hand.map((card) => card.rank !== tripRank);
		} else if (handRank === 'two-pair') {
			// Keep the two pairs, discard the kicker
			const rankCounts = new Map<string, number>();
			this.hand.forEach((card) => {
				rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
			});
			const pairRanks = Array.from(rankCounts.entries())
				.filter(([_, count]) => count === 2)
				.map(([rank]) => rank);
			this.selectedCards = this.hand.map((card) => !pairRanks.includes(card.rank));
		} else if (handRank === 'pair') {
			// Keep the pair, discard others
			const rankCounts = new Map<string, number>();
			this.hand.forEach((card) => {
				rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
			});
			const pairRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 2)?.[0];
			this.selectedCards = this.hand.map((card) => card.rank !== pairRank);
		} else {
			// High card - discard based on difficulty
			if (this.difficulty === 'easy') {
				// Random discards
				this.selectedCards = this.hand.map(() => Math.random() > 0.5);
			} else {
				// Keep highest cards
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

	makeDecision(currentBet: number, pot: number): { action: PlayerAction; amount?: number } {
		this.evaluateHand();
		const handStrength = this.bestHand ? this.bestHand.score / 10000000 : 0.1;
		const toCall = currentBet - this.currentBet;

		// Easy: Random decisions
		if (this.difficulty === 'easy') {
			const rand = Math.random();
			if (toCall === 0) {
				return rand > 0.5 ? { action: 'check' } : { action: 'raise', amount: 20 };
			}
			if (rand < 0.4) return { action: 'fold' };
			if (rand < 0.8) return { action: 'call' };
			return { action: 'raise', amount: toCall + 20 };
		}

		// Medium and Hard: Based on hand strength
		if (toCall === 0) {
			return handStrength > 0.4 ? { action: 'raise', amount: 30 } : { action: 'check' };
		}

		if (handStrength < 0.25) return { action: 'fold' };
		if (handStrength < 0.5) return { action: 'call' };
		return { action: 'raise', amount: toCall + 40 };
	}
}

export type PlayerType = PokerPlayer | PokerBot;

export function createPokerGame() {
	const players = writable<PlayerType[]>([]);
	const deck = writable(new Deck());
	const pot = writable(0);
	const currentBet = writable(0);
	const currentPlayerIndex = writable(0);
	const phase = writable<GamePhase>('setup');
	const winners = writable<PlayerType[]>([]);
	const ante = 10;

	const activePlayers = derived(players, ($players) =>
		$players.filter((p) => !p.folded && p.chips > 0)
	);

	const currentPlayer = derived(
		[players, currentPlayerIndex],
		([$players, $index]) => $players[$index]
	);

	const setupGame = (
		humanCount: number,
		botCount: number,
		botDifficulty: 'easy' | 'medium' | 'hard' = 'medium'
	) => {
		const newPlayers: PlayerType[] = [];

		for (let i = 0; i < humanCount; i++) {
			newPlayers.push(new PokerPlayer(`Player ${i + 1}`, 'human'));
		}

		for (let i = 0; i < botCount; i++) {
			newPlayers.push(new PokerBot(`Bot ${i + 1}`, botDifficulty));
		}

		players.set(newPlayers);
		phase.set('setup');
	};

	const startGame = () => {
		const $players = get(players);
		if ($players.length < 2) {
			throw new Error('Need at least 2 players to start');
		}

		const newDeck = new Deck();
		deck.set(newDeck);
		pot.set(0);
		currentBet.set(ante);
		winners.set([]);

		// Reset all players and collect ante
		$players.forEach((player) => {
			player.hand = [];
			player.currentBet = 0;
			player.folded = false;
			player.bestHand = null;
			player.selectedCards = [false, false, false, false, false];
			const anteAmount = player.bet(ante);
			pot.update((p) => p + anteAmount);
		});

		// Deal 5 cards to each player
		for (let i = 0; i < 5; i++) {
			$players.forEach((player) => {
				player.addCard(newDeck.deal());
			});
		}

		players.set($players);
		currentPlayerIndex.set(0);
		phase.set('betting');
	};

	const playerAction = (action: PlayerAction, raiseAmount?: number) => {
		const $players = get(players);
		const $currentPlayerIndex = get(currentPlayerIndex);
		const player = $players[$currentPlayerIndex];

		if (action === 'fold') {
			player.fold();
		} else if (action === 'check') {
			// Do nothing
		} else if (action === 'call') {
			const toCall = get(currentBet) - player.currentBet;
			const betAmount = player.bet(toCall);
			pot.update((p) => p + betAmount);
		} else if (action === 'raise') {
			const toCall = get(currentBet) - player.currentBet;
			const totalRaise = toCall + (raiseAmount || 30);
			const betAmount = player.bet(totalRaise);
			pot.update((p) => p + betAmount);
			currentBet.set(player.currentBet);
		}

		players.set($players);
		nextPlayer();
	};

	const nextPlayer = () => {
		const $players = get(players);
		const $currentPlayerIndex = get(currentPlayerIndex);
		let nextIndex = ($currentPlayerIndex + 1) % $players.length;
		let attempts = 0;

		// Find next active player
		while ($players[nextIndex].folded && attempts < $players.length) {
			nextIndex = (nextIndex + 1) % $players.length;
			attempts++;
		}

		// Check if betting round is complete
		const activePlayers = $players.filter((p) => !p.folded);
		const allBetsEqual = activePlayers.every((p) => p.currentBet === get(currentBet));

		if (allBetsEqual && attempts > 0) {
			nextPhase();
		} else {
			currentPlayerIndex.set(nextIndex);

			// If current player is a bot, make them act
			if ($players[nextIndex].type === 'bot') {
				setTimeout(() => {
					processBotAction();
				}, 1000);
			}
		}
	};

	const processBotAction = () => {
		const $players = get(players);
		const $currentPlayerIndex = get(currentPlayerIndex);
		const bot = $players[$currentPlayerIndex];

		if (bot.type === 'bot') {
			const decision = (bot as PokerBot).makeDecision(get(currentBet), get(pot));
			playerAction(decision.action, decision.amount);
		}
	};

	const nextPhase = () => {
		const $phase = get(phase);
		const $players = get(players);

		// Reset current bets for next round
		$players.forEach((player) => {
			player.currentBet = 0;
		});
		currentBet.set(0);
		players.set($players);

		if ($phase === 'betting') {
			phase.set('draw');
		} else if ($phase === 'draw') {
			phase.set('final-betting');
			currentPlayerIndex.set(0);
		} else if ($phase === 'final-betting') {
			showdown();
		}
	};

	const drawPhase = () => {
		const $players = get(players);
		const $deck = get(deck);

		// Bots select cards to discard
		$players.forEach((player) => {
			if (player.type === 'bot' && !player.folded) {
				(player as PokerBot).selectCardsToDiscard();
				player.discardAndDraw($deck);
			}
		});

		players.set($players);
		deck.set($deck);
	};

	const humanDraw = () => {
		const $players = get(players);
		const $currentPlayerIndex = get(currentPlayerIndex);
		const player = $players[$currentPlayerIndex];
		const $deck = get(deck);

		if (player.type === 'human') {
			player.discardAndDraw($deck);
			players.set($players);
			deck.set($deck);
		}
	};

	const showdown = () => {
		const $players = get(players);

		// Evaluate all non-folded players
		const activePlayers = $players.filter((p) => !p.folded);
		activePlayers.forEach((player) => {
			player.evaluateHand();
		});

		// Find winners
		let bestScore = 0;
		const winningPlayers: PlayerType[] = [];

		activePlayers.forEach((player) => {
			if (player.bestHand) {
				if (player.bestHand.score > bestScore) {
					bestScore = player.bestHand.score;
					winningPlayers.length = 0;
					winningPlayers.push(player);
				} else if (player.bestHand.score === bestScore) {
					winningPlayers.push(player);
				}
			}
		});

		// Distribute pot
		const potAmount = get(pot);
		const winAmount = Math.floor(potAmount / winningPlayers.length);
		winningPlayers.forEach((player) => {
			player.chips += winAmount;
		});

		winners.set(winningPlayers);
		phase.set('showdown');
		players.set($players);
	};

	const nextHand = () => {
		startGame();
	};

	return {
		players,
		pot,
		currentBet,
		currentPlayer,
		currentPlayerIndex,
		activePlayers,
		phase,
		winners,
		setupGame,
		startGame,
		playerAction,
		drawPhase,
		humanDraw,
		nextHand
	};
}
