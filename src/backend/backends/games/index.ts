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
export { createBlackjackStore } from '../../adapters/createBlackjackStore';
export { createPokerStore } from '../../adapters/createPokerStore';
export { createTexasHoldemStore } from '../../adapters/createTexasHoldemStore';
export { createGoFishStore } from '../../adapters/createGoFishStore';
export { createOldMaidStore } from '../../adapters/createOldMaidStore';
export { createCrazyEightsStore } from '../../adapters/createCrazyEightsStore';
export { createWarStore } from '../../adapters/createWarStore';

// Solitaire Games
export { createKlondikeStore } from '../../adapters/createKlondikeStore';
export { createSpiderStore } from '../../adapters/createSpiderStore';
export { createFreeCellStore } from '../../adapters/createFreeCellStore';

// Board Games
export { createTicTacToeStore } from '../../adapters/createTicTacToeStore';

/**
 * Re-export game engines for direct access
 * Use these if you want to implement your own adapter layer
 */
export { BlackjackEngine } from '../../games/blackjack/engine';
export { PokerEngine } from '../../games/poker/engine';
export { TexasHoldemEngine } from '../../games/texas-holdem/engine';
export { GoFishEngine } from '../../games/go-fish/engine';
export { OldMaidEngine } from '../../games/old-maid/engine';
export { CrazyEightsEngine } from '../../games/crazy-eights/engine';
export { WarEngine } from '../../games/war/engine/WarEngine';
export { KlondikeEngine } from '../../games/solitaire/klondike/engine';
export { SpiderEngine } from '../../games/solitaire/spider/engine';
export { FreeCellEngine } from '../../games/solitaire/freecell/engine';
export { TicTacToeEngine } from '../../games/tictactoe/engine/TicTacToeEngine';
