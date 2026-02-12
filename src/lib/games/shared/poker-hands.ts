import type { Card, Rank, Suit } from '$lib/shared/deck';

export type HandRank =
	| 'high-card'
	| 'pair'
	| 'two-pair'
	| 'three-of-a-kind'
	| 'straight'
	| 'flush'
	| 'full-house'
	| 'four-of-a-kind'
	| 'straight-flush'
	| 'royal-flush';

export interface HandEvaluation {
	rank: HandRank;
	score: number;
	cards: Card[];
	description: string;
}

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

const HAND_RANK_VALUES: Record<HandRank, number> = {
	'high-card': 1,
	pair: 2,
	'two-pair': 3,
	'three-of-a-kind': 4,
	straight: 5,
	flush: 6,
	'full-house': 7,
	'four-of-a-kind': 8,
	'straight-flush': 9,
	'royal-flush': 10
};

function getRankValue(rank: Rank): number {
	return RANK_VALUES[rank];
}

function isFlush(cards: Card[]): boolean {
	const suit = cards[0].suit;
	return cards.every((card) => card.suit === suit);
}

function isStraight(cards: Card[]): boolean {
	const values = cards.map((c) => getRankValue(c.rank)).sort((a, b) => a - b);

	// Check for regular straight
	for (let i = 0; i < values.length - 1; i++) {
		if (values[i + 1] - values[i] !== 1) {
			// Check for wheel (A-2-3-4-5)
			if (
				values[0] === 2 &&
				values[1] === 3 &&
				values[2] === 4 &&
				values[3] === 5 &&
				values[4] === 14
			) {
				return true;
			}
			return false;
		}
	}
	return true;
}

function getRankCounts(cards: Card[]): Map<Rank, number> {
	const counts = new Map<Rank, number>();
	for (const card of cards) {
		counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
	}
	return counts;
}

export function evaluateHand(cards: Card[]): HandEvaluation {
	if (cards.length !== 5) {
		throw new Error('Must evaluate exactly 5 cards');
	}

	const sortedCards = [...cards].sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank));
	const rankCounts = getRankCounts(sortedCards);
	const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);
	const isFlushHand = isFlush(sortedCards);
	const isStraightHand = isStraight(sortedCards);

	// Royal Flush
	if (isFlushHand && isStraightHand) {
		const values = sortedCards.map((c) => getRankValue(c.rank));
		if (values[0] === 14 && values[1] === 13) {
			return {
				rank: 'royal-flush',
				score: HAND_RANK_VALUES['royal-flush'] * 1000000 + values[0],
				cards: sortedCards,
				description: 'Royal Flush'
			};
		}
		return {
			rank: 'straight-flush',
			score: HAND_RANK_VALUES['straight-flush'] * 1000000 + values[0],
			cards: sortedCards,
			description: 'Straight Flush'
		};
	}

	// Four of a Kind
	if (counts[0] === 4) {
		const quadRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 4)?.[0];
		const kickerRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 1)?.[0];
		return {
			rank: 'four-of-a-kind',
			score:
				HAND_RANK_VALUES['four-of-a-kind'] * 1000000 +
				getRankValue(quadRank!) * 100 +
				getRankValue(kickerRank!),
			cards: sortedCards,
			description: 'Four of a Kind'
		};
	}

	// Full House
	if (counts[0] === 3 && counts[1] === 2) {
		const tripRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 3)?.[0];
		const pairRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 2)?.[0];
		return {
			rank: 'full-house',
			score:
				HAND_RANK_VALUES['full-house'] * 1000000 +
				getRankValue(tripRank!) * 100 +
				getRankValue(pairRank!),
			cards: sortedCards,
			description: 'Full House'
		};
	}

	// Flush
	if (isFlushHand) {
		const values = sortedCards.map((c) => getRankValue(c.rank));
		return {
			rank: 'flush',
			score:
				HAND_RANK_VALUES.flush * 1000000 +
				values[0] * 10000 +
				values[1] * 1000 +
				values[2] * 100 +
				values[3] * 10 +
				values[4],
			cards: sortedCards,
			description: 'Flush'
		};
	}

	// Straight
	if (isStraightHand) {
		const values = sortedCards.map((c) => getRankValue(c.rank));
		return {
			rank: 'straight',
			score: HAND_RANK_VALUES.straight * 1000000 + values[0],
			cards: sortedCards,
			description: 'Straight'
		};
	}

	// Three of a Kind
	if (counts[0] === 3) {
		const tripRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 3)?.[0];
		const kickers = sortedCards.filter((c) => c.rank !== tripRank).map((c) => getRankValue(c.rank));
		return {
			rank: 'three-of-a-kind',
			score:
				HAND_RANK_VALUES['three-of-a-kind'] * 1000000 +
				getRankValue(tripRank!) * 10000 +
				kickers[0] * 100 +
				kickers[1],
			cards: sortedCards,
			description: 'Three of a Kind'
		};
	}

	// Two Pair
	if (counts[0] === 2 && counts[1] === 2) {
		const pairs = Array.from(rankCounts.entries())
			.filter(([_, count]) => count === 2)
			.map(([rank]) => getRankValue(rank))
			.sort((a, b) => b - a);
		const kicker = sortedCards
			.filter((c) => getRankValue(c.rank) !== pairs[0] && getRankValue(c.rank) !== pairs[1])
			.map((c) => getRankValue(c.rank))[0];
		return {
			rank: 'two-pair',
			score: HAND_RANK_VALUES['two-pair'] * 1000000 + pairs[0] * 10000 + pairs[1] * 100 + kicker,
			cards: sortedCards,
			description: 'Two Pair'
		};
	}

	// Pair
	if (counts[0] === 2) {
		const pairRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 2)?.[0];
		const kickers = sortedCards
			.filter((c) => c.rank !== pairRank)
			.map((c) => getRankValue(c.rank))
			.sort((a, b) => b - a);
		return {
			rank: 'pair',
			score:
				HAND_RANK_VALUES.pair * 1000000 +
				getRankValue(pairRank!) * 100000 +
				kickers[0] * 1000 +
				kickers[1] * 100 +
				kickers[2],
			cards: sortedCards,
			description: 'Pair'
		};
	}

	// High Card
	const values = sortedCards.map((c) => getRankValue(c.rank));
	return {
		rank: 'high-card',
		score:
			HAND_RANK_VALUES['high-card'] * 1000000 +
			values[0] * 10000 +
			values[1] * 1000 +
			values[2] * 100 +
			values[3] * 10 +
			values[4],
		cards: sortedCards,
		description: 'High Card'
	};
}

export function getBestHand(cards: Card[]): HandEvaluation {
	if (cards.length < 5) {
		throw new Error('Need at least 5 cards to evaluate');
	}

	if (cards.length === 5) {
		return evaluateHand(cards);
	}

	// Generate all 5-card combinations
	const combinations: Card[][] = [];
	function combine(start: number, combo: Card[]) {
		if (combo.length === 5) {
			combinations.push([...combo]);
			return;
		}
		for (let i = start; i < cards.length; i++) {
			combo.push(cards[i]);
			combine(i + 1, combo);
			combo.pop();
		}
	}
	combine(0, []);

	// Evaluate all combinations and return the best
	let bestHand: HandEvaluation | null = null;
	for (const combo of combinations) {
		const evaluation = evaluateHand(combo);
		if (!bestHand || evaluation.score > bestHand.score) {
			bestHand = evaluation;
		}
	}

	return bestHand!;
}

export function compareHands(hand1: HandEvaluation, hand2: HandEvaluation): number {
	return hand1.score - hand2.score;
}
