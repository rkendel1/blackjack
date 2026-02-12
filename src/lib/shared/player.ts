import type { Card } from './deck';

export type PlayerType = 'human' | 'ai';

export class BasePlayer {
	name: string;
	hand: Card[];
	type: PlayerType;

	constructor(name: string, type: PlayerType = 'human') {
		this.name = name;
		this.type = type;
		this.hand = [];
	}

	addCard(card: Card) {
		this.hand.push(card);
	}

	addCards(cards: Card[]) {
		this.hand.push(...cards);
	}

	removeCard(index: number): Card | undefined {
		return this.hand.splice(index, 1)[0];
	}

	removeCards(indices: number[]): Card[] {
		const removed: Card[] = [];
		// Sort indices in descending order to avoid index shifting
		const sortedIndices = [...indices].sort((a, b) => b - a);
		for (const index of sortedIndices) {
			const card = this.hand.splice(index, 1)[0];
			if (card) removed.push(card);
		}
		return removed;
	}

	clearHand() {
		this.hand = [];
	}

	hasCards(): boolean {
		return this.hand.length > 0;
	}

	get cardCount(): number {
		return this.hand.length;
	}
}

export class AIPlayer extends BasePlayer {
	difficulty: 'easy' | 'medium' | 'hard';

	constructor(name: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
		super(name, 'ai');
		this.difficulty = difficulty;
	}

	// Override in specific game implementations
	makeMove(): void {
		// Base implementation - override in game-specific AI
	}
}
