import type { Card, Rank } from '../../../shared/deck';

export const RANK_VALUES: Record<Rank, number> = {
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

export interface PlayerState {
	name: string;
	hand: Card[];
	wonCards: Card[];
	totalCards: number;
}

export interface OpponentState {
	name: string;
	hand: Card[];
	wonCards: Card[];
	totalCards: number;
}

export type GameState = 'ready' | 'playing' | 'war' | 'won';
export type RoundResult = 'player' | 'opponent' | 'war' | null;
export type Winner = 'player' | 'opponent' | null;

export interface WarState {
	player: PlayerState;
	opponent: OpponentState;
	gameState: GameState;
	playerCard: Card | null;
	opponentCard: Card | null;
	roundResult: RoundResult;
	cardsInPlay: Card[];
	warCount: number;
	winner: Winner;
}

export type WarMove = 
	| { type: 'start' }
	| { type: 'play-round' };
