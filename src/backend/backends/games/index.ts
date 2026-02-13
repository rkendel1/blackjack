/**
 * Game Backend - Unified Export
 * 
 * This module provides backend adapters for all game engines.
 * Each game follows the pattern: Engine → Adapter → Component
 * 
 * The adapter layer provides:
 * - Svelte store integration
 * - Action creators
 * - State management
 * - Audio/animation handling
 * 
 * All game backends are framework-agnostic at the engine level,
 * with Svelte integration provided by the adapter layer.
 */

// Card Games
export { createBlackjackStore } from '$lib/adapters/createBlackjackStore';
export { createPokerStore } from '$lib/adapters/createPokerStore';
export { createTexasHoldemStore } from '$lib/adapters/createTexasHoldemStore';
export { createGoFishStore } from '$lib/adapters/createGoFishStore';
export { createOldMaidStore } from '$lib/adapters/createOldMaidStore';
export { createCrazyEightsStore } from '$lib/adapters/createCrazyEightsStore';
export { createWarStore } from '$lib/adapters/createWarStore';

// Solitaire Games
export { createKlondikeStore } from '$lib/adapters/createKlondikeStore';
export { createSpiderStore } from '$lib/adapters/createSpiderStore';
export { createFreeCellStore } from '$lib/adapters/createFreeCellStore';

// Board Games
export { createTicTacToeStore } from '$lib/adapters/createTicTacToeStore';

/**
 * Re-export game engines for direct access
 * Use these if you want to implement your own adapter layer
 */
export { BlackjackEngine } from '$lib/games/blackjack/engine';
export { PokerEngine } from '$lib/games/poker/engine';
export { TexasHoldemEngine } from '$lib/games/texas-holdem/engine';
export { GoFishEngine } from '$lib/games/go-fish/engine';
export { OldMaidEngine } from '$lib/games/old-maid/engine';
export { CrazyEightsEngine } from '$lib/games/crazy-eights/engine';
export { WarEngine } from '$lib/games/war/engine/WarEngine';
export { KlondikeEngine } from '$lib/games/solitaire/klondike/engine';
export { SpiderEngine } from '$lib/games/solitaire/spider/engine';
export { FreeCellEngine } from '$lib/games/solitaire/freecell/engine';
export { TicTacToeEngine } from '$lib/games/tictactoe/engine/TicTacToeEngine';
