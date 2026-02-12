import type { Card, Rank } from '../../../shared/deck';

export interface GoFishPlayerState {
	name: string;
	hand: Card[];
	books: Rank[];
	score: number;
}

export interface GoFishBotState {
	name: string;
	handCount: number;
	books: Rank[];
	score: number;
}

export type GameState = 'ready' | 'player-turn' | 'bot-turn' | 'won';
export type Winner = 'player' | 'bot' | 'tie' | null;

export interface GoFishState {
	player: GoFishPlayerState;
	bot: GoFishBotState;
	state: GameState;
	deckRemaining: number;
	winner: Winner;
	message: string;
	lastAction: string;
}

export type GoFishMove =
	| { type: 'start' }
	| { type: 'ask'; rank: Rank }
	| { type: 'bot-turn' };
