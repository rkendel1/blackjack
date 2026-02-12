import type { Card, Suit } from '../../../shared/deck';

export interface CrazyEightsPlayerState {
	name: string;
	hand: Card[];
	handCount: number;
}

export interface CrazyEightsBotState {
	name: string;
	handCount: number;
}

export type GameState = 'ready' | 'player-turn' | 'bot-turn' | 'won' | 'choosing-suit';
export type Winner = 'player' | 'bot' | null;

export interface CrazyEightsState {
	player: CrazyEightsPlayerState;
	bot: CrazyEightsBotState;
	state: GameState;
	topCard: Card | null;
	currentSuit: Suit | null;
	deckRemaining: number;
	winner: Winner;
	message: string;
	lastAction: string;
}

export type CrazyEightsMove =
	| { type: 'start' }
	| { type: 'play-card'; cardIndex: number }
	| { type: 'draw-card' }
	| { type: 'choose-suit'; suit: Suit }
	| { type: 'bot-turn' };
