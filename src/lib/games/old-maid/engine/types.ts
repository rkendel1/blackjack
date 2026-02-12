import type { Card, Rank } from '../../../shared/deck';

export interface PlayerState {
	name: string;
	hand: Card[];
	pairs: Rank[];
	pairCount: number;
	cardCount: number;
}

export interface BotState {
	name: string;
	hand: Card[];
	pairs: Rank[];
	pairCount: number;
	cardCount: number;
}

export type GameState = 'ready' | 'player-turn' | 'bot-turn' | 'won';
export type Winner = 'player' | 'bot' | null;

export interface OldMaidState {
	player: PlayerState;
	bot: BotState;
	gameState: GameState;
	winner: Winner;
}

export type OldMaidMove =
	| { type: 'start' }
	| { type: 'draw'; playerIndex: number }
	| { type: 'bot-draw' };
