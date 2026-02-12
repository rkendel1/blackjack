import type { Card } from '../../../shared/deck';

export interface PlayerState {
	name: string;
	hand: Card[];
	score: number;
}

export interface DealerState {
	name: string;
	hand: Card[];
	score: number;
}

export type Winner = null | 'Player' | 'Dealer' | 'Draw';
export type Turn = null | 'Player' | 'Dealer';

export interface BlackjackState {
	player: PlayerState;
	dealer: DealerState;
	turn: Turn;
	winner: Winner;
	deckRemaining: number;
}

export type BlackjackMove = { type: 'start' } | { type: 'hit' } | { type: 'stand' };
