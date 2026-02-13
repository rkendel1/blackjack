import { writable, derived, get } from 'svelte/store';
import { buildDeck, shuffleDeck } from '../../../shared/deck';
import type { Card, Suit, Rank } from '../../../shared/deck';

export type Pile = Card[];

const RANK_VALUES: Record<Rank, number> = {
	'1': 1,
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

function getRankValue(rank: Rank): number {
	return RANK_VALUES[rank];
}

function canPlaceOnTableau(card: Card, onCard: Card | null): boolean {
	if (!onCard) {
		return true;
	}
	return getRankValue(card.rank) === getRankValue(onCard.rank) - 1;
}

function isSequenceComplete(cards: Card[]): boolean {
	if (cards.length !== 13) return false;

	const suit = cards[0].suit;
	for (let i = 0; i < 13; i++) {
		if (cards[i].suit !== suit || getRankValue(cards[i].rank) !== 13 - i) {
			return false;
		}
	}
	return true;
}

function findCompleteSequences(pile: Pile, revealed: boolean[]): number[] {
	const sequences: number[] = [];

	for (let i = 0; i < pile.length; i++) {
		if (!revealed[i]) continue;

		if (pile.length - i >= 13 && pile[i].rank === 'king') {
			const sequence = pile.slice(i, i + 13);
			if (isSequenceComplete(sequence)) {
				sequences.push(i);
			}
		}
	}

	return sequences;
}

function isValidSequence(cards: Card[]): boolean {
	if (cards.length === 0) return true;
	const suit = cards[0].suit;

	for (let i = 1; i < cards.length; i++) {
		if (
			cards[i].suit !== suit ||
			getRankValue(cards[i].rank) !== getRankValue(cards[i - 1].rank) - 1
		) {
			return false;
		}
	}
	return true;
}

export function createSpiderGame() {
	const tableau = writable<Pile[]>(
		Array(10)
			.fill([])
			.map(() => [])
	);
	const foundations = writable<Pile[]>([]);
	const stock = writable<Card[]>([]);
	const revealedTableau = writable<boolean[][]>(
		Array(10)
			.fill([])
			.map(() => [])
	);
	const moves = writable(0);
	const autoPlayAvailable = writable(false);

	const isWon = derived(foundations, ($foundations) => $foundations.length === 8);

	const canDealFromStock = derived([stock, tableau], ([$stock, $tableau]) => {
		if ($stock.length < 10) return false;
		return $tableau.every((pile) => pile.length > 0);
	});

	const newGame = () => {
		const deck1 = buildDeck();
		const deck2 = buildDeck();
		const combinedDeck = shuffleDeck([...deck1, ...deck2]);

		const newTableau: Pile[] = Array(10)
			.fill([])
			.map(() => []);
		const newRevealed: boolean[][] = Array(10)
			.fill([])
			.map(() => []);

		let cardIndex = 0;

		for (let col = 0; col < 10; col++) {
			const cardCount = col < 4 ? 6 : 5;
			for (let row = 0; row < cardCount; row++) {
				newTableau[col].push(combinedDeck[cardIndex]);
				newRevealed[col].push(row === cardCount - 1);
				cardIndex++;
			}
		}

		const remainingCards = combinedDeck.slice(cardIndex);

		tableau.set(newTableau);
		stock.set(remainingCards);
		revealedTableau.set(newRevealed);
		foundations.set([]);
		moves.set(0);
		autoPlayAvailable.set(false);
		checkForCompleteSequences();
	};

	const dealFromStock = () => {
		const $stock = get(stock);
		const $tableau = get(tableau);
		const $revealedTableau = get(revealedTableau);

		if ($stock.length < 10) return false;

		const allPilesHaveCards = $tableau.every((pile) => pile.length > 0);
		if (!allPilesHaveCards) return false;

		for (let i = 0; i < 10; i++) {
			const card = $stock.shift();
			if (card) {
				$tableau[i].push(card);
				$revealedTableau[i].push(true);
			}
		}

		tableau.set($tableau);
		stock.set($stock);
		revealedTableau.set($revealedTableau);
		moves.update((m) => m + 1);
		checkForCompleteSequences();
		return true;
	};

	const checkForCompleteSequences = () => {
		const $tableau = get(tableau);
		const $foundations = get(foundations);
		const $revealedTableau = get(revealedTableau);

		let foundSequence = false;

		for (let i = 0; i < 10; i++) {
			const pile = $tableau[i];
			const revealed = $revealedTableau[i];
			const sequences = findCompleteSequences(pile, revealed);

			if (sequences.length > 0) {
				foundSequence = true;
				const seqIndex = sequences[0];
				const completedSequence = pile.splice(seqIndex, 13);
				$foundations.push(completedSequence);

				revealed.splice(seqIndex, 13);

				if (pile.length > 0 && !revealed[revealed.length - 1]) {
					revealed[revealed.length - 1] = true;
				}
			}
		}

		if (foundSequence) {
			tableau.set($tableau);
			foundations.set($foundations);
			revealedTableau.set($revealedTableau);
			checkForCompleteSequences();
		}

		checkAutoPlay();
	};

	const moveTableauToTableau = (fromIndex: number, cardIndex: number, toIndex: number) => {
		const $tableau = get(tableau);
		const $revealedTableau = get(revealedTableau);

		if (fromIndex === toIndex) return false;

		const fromPile = $tableau[fromIndex];
		const toPile = $tableau[toIndex];

		if (cardIndex < 0 || cardIndex >= fromPile.length) return false;
		if (!$revealedTableau[fromIndex][cardIndex]) return false;

		const movingCards = fromPile.slice(cardIndex);
		const targetCard = toPile.length > 0 ? toPile[toPile.length - 1] : null;

		if (!canPlaceOnTableau(movingCards[0], targetCard)) return false;

		const revealedMovingCards = $revealedTableau[fromIndex].slice(cardIndex);
		if (!isValidSequence(movingCards)) {
			if (movingCards.length > 1) return false;
		}

		$tableau[fromIndex] = fromPile.slice(0, cardIndex);
		$tableau[toIndex].push(...movingCards);

		if ($tableau[fromIndex].length > 0) {
			$revealedTableau[fromIndex][$tableau[fromIndex].length - 1] = true;
		}

		$revealedTableau[fromIndex] = $revealedTableau[fromIndex].slice(0, cardIndex);
		$revealedTableau[toIndex].push(...revealedMovingCards);

		tableau.set($tableau);
		revealedTableau.set($revealedTableau);
		moves.update((m) => m + 1);

		checkForCompleteSequences();
		return true;
	};

	const checkAutoPlay = () => {
		const $tableau = get(tableau);
		const $revealedTableau = get(revealedTableau);

		for (let i = 0; i < $tableau.length; i++) {
			const pile = $tableau[i];
			const revealed = $revealedTableau[i];
			const sequences = findCompleteSequences(pile, revealed);
			if (sequences.length > 0) {
				autoPlayAvailable.set(true);
				return;
			}
		}

		autoPlayAvailable.set(false);
	};

	const autoPlay = () => {
		checkForCompleteSequences();
		return get(autoPlayAvailable);
	};

	const getHint = (): { from: number; cardIndex: number; to: number } | null => {
		const $tableau = get(tableau);
		const $revealedTableau = get(revealedTableau);

		for (let from = 0; from < 10; from++) {
			const fromPile = $tableau[from];
			const revealed = $revealedTableau[from];

			for (let cardIdx = 0; cardIdx < fromPile.length; cardIdx++) {
				if (!revealed[cardIdx]) continue;

				const movingCards = fromPile.slice(cardIdx);

				for (let to = 0; to < 10; to++) {
					if (from === to) continue;

					const toPile = $tableau[to];
					const targetCard = toPile.length > 0 ? toPile[toPile.length - 1] : null;

					if (canPlaceOnTableau(movingCards[0], targetCard)) {
						if (movingCards.length === 1 || isValidSequence(movingCards)) {
							return { from, cardIndex: cardIdx, to };
						}
					}
				}
			}
		}

		return null;
	};

	return {
		tableau,
		foundations,
		stock,
		revealedTableau,
		moves,
		isWon,
		canDealFromStock,
		autoPlayAvailable,
		newGame,
		dealFromStock,
		moveTableauToTableau,
		autoPlay,
		getHint
	};
}
