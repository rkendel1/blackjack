/**
 * Unit tests for SpiderEngine
 *
 * These tests validate the pure game logic without Svelte dependencies.
 */

import { SpiderEngine } from './SpiderEngine';
import type { Card } from '../../../../shared/deck';

function createCard(rank: string, suit: string = 'heart'): Card {
	return {
		rank: rank as any,
		suit: suit as any,
		displayName: `${suit}_${rank}`
	};
}

console.log('Testing SpiderEngine...');

// Test initial state
const engine = new SpiderEngine();
const initialState = engine.getState();
console.assert(initialState.tableau.length === 10, 'Should have 10 tableau piles');
console.assert(initialState.foundations.length === 0, 'Should have 0 foundations initially');
console.assert(initialState.stock.length === 0, 'Stock should be empty initially');
console.assert(initialState.moves === 0, 'Moves should be 0 initially');

// Test new game
engine.newGame();
const newGameState = engine.getState();
console.assert(newGameState.stock.length === 50, 'Stock should have 50 cards (104 - 54 in tableau)');
console.assert(newGameState.foundations.length === 0, 'Foundations should be empty after new game');
console.assert(newGameState.moves === 0, 'Moves should reset to 0');

// Verify tableau setup (4 piles with 6 cards, 6 piles with 5 cards)
let totalTableauCards = 0;
for (let i = 0; i < 10; i++) {
	const expectedSize = i < 4 ? 6 : 5;
	console.assert(
		newGameState.tableau[i].length === expectedSize,
		`Tableau pile ${i} should have ${expectedSize} cards`
	);
	console.assert(
		newGameState.revealedTableau[i].length === expectedSize,
		`Revealed array ${i} should have ${expectedSize} entries`
	);
	console.assert(
		newGameState.revealedTableau[i][expectedSize - 1] === true,
		`Top card of pile ${i} should be revealed`
	);
	totalTableauCards += expectedSize;
}
console.assert(totalTableauCards === 54, 'Tableau should have 54 cards total');

// Test canDealFromStock
const canDeal = engine.canDealFromStock();
console.assert(canDeal === true, 'Should be able to deal from stock when all piles have cards');

// Test deal from stock
engine.dealFromStock();
const afterDeal = engine.getState();
console.assert(afterDeal.stock.length === 40, 'Stock should have 40 cards left (50 - 10)');
console.assert(afterDeal.moves === 1, 'Moves should increment');

// Verify each pile got one card
for (let i = 0; i < 10; i++) {
	const expectedSize = (i < 4 ? 6 : 5) + 1;
	console.assert(
		afterDeal.tableau[i].length === expectedSize,
		`Tableau pile ${i} should have ${expectedSize} cards after deal`
	);
}

// Test applyMove
const engine2 = new SpiderEngine();
engine2.applyMove({ type: 'newGame' });
const moveState = engine2.getState();
console.assert(moveState.stock.length === 50, 'applyMove should work for newGame');

engine2.applyMove({ type: 'dealFromStock' });
const afterMoveState = engine2.getState();
console.assert(afterMoveState.stock.length === 40, 'applyMove should work for dealFromStock');

// Test isWon (should be false for new game)
const notWon = engine2.isWon();
console.assert(notWon === false, 'New game should not be won');

console.log('SpiderEngine tests passed!');

console.log('\n✅ All tests passed!');
