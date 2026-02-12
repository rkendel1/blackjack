const SUITS = ['heart', 'spade', 'diamond', 'club'] as const;
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'] as const;

export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];

export type Card = {
	suit: Suit;
	rank: Rank;
	displayName: string;
};

export const buildDeck = (): Card[] => {
	const deck: Card[] = [];
	for (const suit of SUITS) {
		for (const rank of RANKS) {
			deck.push({ suit, rank, displayName: `${suit}_${rank}` });
		}
	}
	return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
	return [...deck].sort(() => Math.random() - 0.5);
};

export const dealCards = (deck: Card[], count: number): { dealt: Card[]; remaining: Card[] } => {
	const dealt = deck.slice(0, count);
	const remaining = deck.slice(count);
	return { dealt, remaining };
};

export class Deck {
	cards = $state(buildDeck());

	constructor() {
		this.shuffle();
	}

	deal = () => {
		const card = this.cards.pop();

		if (!card) {
			throw new Error('Deck is empty');
		}

		return card;
	};

	shuffle = () => {
		this.cards = shuffleDeck(this.cards);
	};

	reset = () => {
		this.cards = buildDeck();
		this.shuffle();
	};

	get remaining(): number {
		return this.cards.length;
	}
}
