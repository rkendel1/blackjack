import { writable, derived, get } from 'svelte/store';
import { Deck } from '$lib/shared/deck';
import type { Card } from '$lib/shared/deck';
import { BasePlayer, BotPlayer } from '$lib/shared/player';
import { getBestHand, type HandEvaluation } from '$lib/games/shared/poker-hands';

export type GamePhase = 'setup' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown' | 'ended';
export type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

export class TexasHoldemPlayer extends BasePlayer {
	chips: number;
	currentBet: number;
	folded: boolean;
	allIn: boolean;
	bestHand: HandEvaluation | null = null;

	constructor(name: string, type: 'human' | 'bot' = 'human', chips: number = 1000) {
		super(name, type);
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
}

export class TexasHoldemBot extends BotPlayer {
	chips: number;
	currentBet: number;
	folded: boolean;
	allIn: boolean;
	bestHand: HandEvaluation | null = null;

	constructor(
		name: string,
		difficulty: 'easy' | 'medium' | 'hard' = 'medium',
		chips: number = 1000
	) {
		super(name, difficulty);
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

	makeDecision(
		currentBet: number,
		pot: number,
		communityCards: Card[]
	): { action: PlayerAction; amount?: number } {
		// Simple bot AI
		this.evaluateBestHand(communityCards);

		const toCall = currentBet - this.currentBet;
		const handStrength = this.bestHand ? this.bestHand.score / 10000000 : 0.1;

		// Easy: Random decisions
		if (this.difficulty === 'easy') {
			const rand = Math.random();
			if (toCall === 0) {
				return rand > 0.5 ? { action: 'check' } : { action: 'raise', amount: 20 };
			}
			if (rand < 0.3) return { action: 'fold' };
			if (rand < 0.7) return { action: 'call' };
			return { action: 'raise', amount: toCall + 20 };
		}

		// Medium: Based on hand strength
		if (this.difficulty === 'medium') {
			if (toCall === 0) {
				return handStrength > 0.5 ? { action: 'raise', amount: 40 } : { action: 'check' };
			}
			if (handStrength < 0.3) return { action: 'fold' };
			if (handStrength < 0.6) return { action: 'call' };
			return { action: 'raise', amount: toCall + 50 };
		}

		// Hard: Strategic play
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

export type PlayerType = TexasHoldemPlayer | TexasHoldemBot;

export function createTexasHoldemGame() {
	const players = writable<PlayerType[]>([]);
	const communityCards = writable<Card[]>([]);
	const deck = writable(new Deck());
	const pot = writable(0);
	const currentBet = writable(0);
	const currentPlayerIndex = writable(0);
	const dealerIndex = writable(0);
	const phase = writable<GamePhase>('setup');
	const winners = writable<PlayerType[]>([]);
	const smallBlind = 10;
	const bigBlind = 20;

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
			newPlayers.push(new TexasHoldemPlayer(`Player ${i + 1}`, 'human'));
		}

		for (let i = 0; i < botCount; i++) {
			newPlayers.push(new TexasHoldemBot(`Bot ${i + 1}`, botDifficulty));
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
		communityCards.set([]);
		pot.set(0);
		currentBet.set(bigBlind);
		winners.set([]);

		// Reset all players
		$players.forEach((player) => {
			player.hand = [];
			player.currentBet = 0;
			player.folded = false;
			player.allIn = false;
			player.bestHand = null;
		});

		// Post blinds
		const smallBlindIndex = (get(dealerIndex) + 1) % $players.length;
		const bigBlindIndex = (get(dealerIndex) + 2) % $players.length;

		const smallBlindAmount = $players[smallBlindIndex].bet(smallBlind);
		const bigBlindAmount = $players[bigBlindIndex].bet(bigBlind);
		pot.update((p) => p + smallBlindAmount + bigBlindAmount);

		// Deal hole cards
		for (let i = 0; i < 2; i++) {
			$players.forEach((player) => {
				player.addCard(newDeck.deal());
			});
		}

		players.set($players);
		currentPlayerIndex.set((bigBlindIndex + 1) % $players.length);
		phase.set('pre-flop');
	};

	const nextPhase = () => {
		const $phase = get(phase);
		const $deck = get(deck);
		const $communityCards = get(communityCards);
		const $players = get(players);

		// Reset current bets for next round
		$players.forEach((player) => {
			player.currentBet = 0;
		});
		currentBet.set(0);
		players.set($players);

		if ($phase === 'pre-flop') {
			// Deal flop (3 cards)
			$communityCards.push($deck.deal(), $deck.deal(), $deck.deal());
			communityCards.set($communityCards);
			phase.set('flop');
		} else if ($phase === 'flop') {
			// Deal turn (1 card)
			$communityCards.push($deck.deal());
			communityCards.set($communityCards);
			phase.set('turn');
		} else if ($phase === 'turn') {
			// Deal river (1 card)
			$communityCards.push($deck.deal());
			communityCards.set($communityCards);
			phase.set('river');
		} else if ($phase === 'river') {
			showdown();
		}

		// Set current player to dealer + 1
		currentPlayerIndex.set((get(dealerIndex) + 1) % $players.length);
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
			const totalRaise = toCall + (raiseAmount || 50);
			const betAmount = player.bet(totalRaise);
			pot.update((p) => p + betAmount);
			currentBet.set(player.currentBet);
		} else if (action === 'all-in') {
			const betAmount = player.bet(player.chips);
			pot.update((p) => p + betAmount);
			if (player.currentBet > get(currentBet)) {
				currentBet.set(player.currentBet);
			}
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
		while (
			($players[nextIndex].folded || $players[nextIndex].allIn) &&
			attempts < $players.length
		) {
			nextIndex = (nextIndex + 1) % $players.length;
			attempts++;
		}

		// Check if betting round is complete
		const activePlayers = $players.filter((p) => !p.folded && !p.allIn);
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
		const bot = $players[$currentPlayerIndex] as TexasHoldemBot;

		if (bot.type === 'bot') {
			const decision = bot.makeDecision(get(currentBet), get(pot), get(communityCards));
			playerAction(decision.action, decision.amount);
		}
	};

	const showdown = () => {
		const $players = get(players);
		const $communityCards = get(communityCards);

		// Evaluate all non-folded players
		const activePlayers = $players.filter((p) => !p.folded);
		activePlayers.forEach((player) => {
			player.evaluateBestHand($communityCards);
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
		dealerIndex.update((d) => (d + 1) % get(players).length);
		startGame();
	};

	return {
		players,
		communityCards,
		pot,
		currentBet,
		currentPlayer,
		activePlayers,
		phase,
		winners,
		setupGame,
		startGame,
		playerAction,
		nextHand
	};
}
