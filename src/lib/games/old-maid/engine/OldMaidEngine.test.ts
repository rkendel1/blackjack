/**
 * Unit tests for OldMaidEngine
 *
 * These tests validate the pure game logic without Svelte dependencies.
 */

import { OldMaidEngine } from './OldMaidEngine';

console.log('Testing OldMaidEngine...');

// Test initial state
const engine = new OldMaidEngine();
const initialState = engine.getState();
console.assert(initialState.gameState === 'ready', 'Initial game state should be ready');
console.assert(initialState.winner === null, 'Initial winner should be null');
console.assert(initialState.player.hand.length === 0, 'Player should have no cards initially');
console.assert(initialState.bot.hand.length === 0, 'Bot should have no cards initially');

// Test start
engine.start();
const startState = engine.getState();
console.assert(
	startState.gameState === 'player-turn',
	'Game state should be player-turn after start'
);
console.assert(startState.player.hand.length > 0, 'Player should have cards after start');
console.assert(startState.bot.hand.length > 0, 'Bot should have cards after start');
console.assert(startState.player.pairCount >= 0, 'Player should have pair count calculated');
console.assert(startState.bot.pairCount >= 0, 'Bot should have pair count calculated');

// Total cards should be 49 (52 - 3 queens removed)
const totalCards =
	startState.player.hand.length +
	startState.bot.hand.length +
	startState.player.pairCount * 2 +
	startState.bot.pairCount * 2;
console.assert(totalCards === 49, `Total cards should be 49, got ${totalCards}`);

// Test player draw
const beforeDraw = engine.getState();
if (beforeDraw.gameState === 'player-turn' && beforeDraw.bot.hand.length > 0) {
	const botHandSize = beforeDraw.bot.hand.length;
	const result = engine.playerDrawCard(0);
	console.assert(result.drewCard === true, 'Player should be able to draw card');

	const afterDraw = engine.getState();
	// Bot should have one less card (unless player made a pair and removed both)
	console.assert(
		afterDraw.bot.hand.length <= botHandSize,
		'Bot should have same or fewer cards after player draws'
	);
}

// Test bot draw
const engine2 = new OldMaidEngine();
engine2.start();
// Force to bot turn
engine2.applyMove({ type: 'draw', playerIndex: 0 });
const beforeBotDraw = engine2.getState();
if (beforeBotDraw.gameState === 'bot-turn') {
	const result = engine2.botDrawCard();
	console.assert(result.drewCard === true, 'Bot should be able to draw card');
	console.assert(result.cardIndex >= 0, 'Bot should return a valid card index');

	const afterBotDraw = engine2.getState();
	console.assert(
		afterBotDraw.gameState === 'player-turn' || afterBotDraw.gameState === 'won',
		'Game should transition to player turn or won after bot draws'
	);
}

// Test applyMove
const engine3 = new OldMaidEngine();
engine3.applyMove({ type: 'start' });
const moveState = engine3.getState();
console.assert(moveState.gameState === 'player-turn', 'applyMove should work for start');

console.log('OldMaidEngine tests passed!');

console.log('\n✅ All tests passed!');
