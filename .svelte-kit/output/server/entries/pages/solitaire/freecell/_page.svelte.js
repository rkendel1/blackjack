import { c as create_ssr_component, a as subscribe, v as validate_component, e as escape, b as each } from "../../../../chunks/ssr.js";
/* empty css                        */
import { w as writable, d as derived } from "../../../../chunks/index.js";
import { D as Deck, C as CardsDefinitions } from "../../../../chunks/CardsDefinitions.js";
import { S as SolitaireCard } from "../../../../chunks/SolitaireCard.js";
import { B as Button } from "../../../../chunks/Button.js";
const RANK_VALUES = {
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  jack: 11,
  queen: 12,
  king: 13
};
function getRankValue(rank) {
  return RANK_VALUES[rank];
}
function isRed(suit) {
  return suit === "heart" || suit === "diamond";
}
function canPlaceOnTableau(card, onCard) {
  if (!onCard) {
    return true;
  }
  if (isRed(card.suit) === isRed(onCard.suit)) {
    return false;
  }
  return getRankValue(card.rank) === getRankValue(onCard.rank) - 1;
}
function canPlaceOnFoundation(card, foundation) {
  if (foundation.cards.length === 0) {
    return card.rank === "1";
  }
  const topCard = foundation.cards[foundation.cards.length - 1];
  return card.suit === foundation.suit && getRankValue(card.rank) === getRankValue(topCard.rank) + 1;
}
function countEmptyFreeCells(freeCells) {
  return freeCells.filter((cell) => cell === null).length;
}
function countEmptyTableauColumns(tableau) {
  return tableau.filter((pile) => pile.length === 0).length;
}
function maxMovableCards(emptyFreeCells, emptyTableauColumns) {
  return (emptyFreeCells + 1) * (emptyTableauColumns + 1);
}
class FreeCellEngine {
  tableau;
  foundations;
  freeCells;
  moves;
  constructor() {
    this.tableau = [[], [], [], [], [], [], [], []];
    this.foundations = [
      { suit: "heart", cards: [] },
      { suit: "diamond", cards: [] },
      { suit: "club", cards: [] },
      { suit: "spade", cards: [] }
    ];
    this.freeCells = [null, null, null, null];
    this.moves = 0;
  }
  newGame() {
    const deck = new Deck();
    deck.shuffle();
    const cards = deck.cards;
    this.tableau = [[], [], [], [], [], [], [], []];
    let cardIndex = 0;
    for (let col = 0; col < 8; col++) {
      const cardsInColumn = col < 4 ? 7 : 6;
      for (let row = 0; row < cardsInColumn; row++) {
        this.tableau[col].push(cards[cardIndex]);
        cardIndex++;
      }
    }
    this.freeCells = [null, null, null, null];
    this.foundations = [
      { suit: "heart", cards: [] },
      { suit: "diamond", cards: [] },
      { suit: "club", cards: [] },
      { suit: "spade", cards: [] }
    ];
    this.moves = 0;
  }
  moveTableauToFreeCell(tableauIndex, freeCellIndex) {
    const pile = this.tableau[tableauIndex];
    if (pile.length === 0) return false;
    if (this.freeCells[freeCellIndex] !== null) return false;
    const card = pile[pile.length - 1];
    this.tableau[tableauIndex] = pile.slice(0, -1);
    this.freeCells[freeCellIndex] = card;
    this.moves++;
    return true;
  }
  moveFreeCellToTableau(freeCellIndex, tableauIndex) {
    const card = this.freeCells[freeCellIndex];
    if (!card) return false;
    const targetPile = this.tableau[tableauIndex];
    const targetCard = targetPile.length > 0 ? targetPile[targetPile.length - 1] : null;
    if (canPlaceOnTableau(card, targetCard)) {
      this.freeCells[freeCellIndex] = null;
      this.tableau[tableauIndex].push(card);
      this.moves++;
      return true;
    }
    return false;
  }
  moveFreeCellToFoundation(freeCellIndex, foundationIndex) {
    const card = this.freeCells[freeCellIndex];
    if (!card) return false;
    const foundation = this.foundations[foundationIndex];
    if (canPlaceOnFoundation(card, foundation)) {
      this.freeCells[freeCellIndex] = null;
      foundation.cards.push(card);
      this.moves++;
      return true;
    }
    return false;
  }
  moveTableauToTableau(fromIndex, cardIndex, toIndex) {
    const fromPile = this.tableau[fromIndex];
    const toPile = this.tableau[toIndex];
    if (cardIndex < 0 || cardIndex >= fromPile.length) return false;
    const movingCards = fromPile.slice(cardIndex);
    const targetCard = toPile.length > 0 ? toPile[toPile.length - 1] : null;
    for (let i = 0; i < movingCards.length - 1; i++) {
      if (!canPlaceOnTableau(movingCards[i + 1], movingCards[i])) {
        return false;
      }
    }
    const emptyFreeCells = countEmptyFreeCells(this.freeCells);
    const emptyColumns = countEmptyTableauColumns(this.tableau) - (toPile.length === 0 ? 1 : 0);
    const maxCards = maxMovableCards(emptyFreeCells, emptyColumns);
    if (movingCards.length > maxCards) {
      return false;
    }
    if (canPlaceOnTableau(movingCards[0], targetCard)) {
      this.tableau[fromIndex] = fromPile.slice(0, cardIndex);
      this.tableau[toIndex].push(...movingCards);
      this.moves++;
      return true;
    }
    return false;
  }
  moveTableauToFoundation(tableauIndex, foundationIndex) {
    const pile = this.tableau[tableauIndex];
    if (pile.length === 0) return false;
    const card = pile[pile.length - 1];
    const foundation = this.foundations[foundationIndex];
    if (canPlaceOnFoundation(card, foundation)) {
      this.tableau[tableauIndex] = pile.slice(0, -1);
      foundation.cards.push(card);
      this.moves++;
      return true;
    }
    return false;
  }
  canAutoPlay() {
    for (let i = 0; i < this.tableau.length; i++) {
      const pile = this.tableau[i];
      if (pile.length > 0) {
        const card = pile[pile.length - 1];
        for (let f = 0; f < this.foundations.length; f++) {
          if (canPlaceOnFoundation(card, this.foundations[f])) {
            return true;
          }
        }
      }
    }
    for (let i = 0; i < this.freeCells.length; i++) {
      const card = this.freeCells[i];
      if (card) {
        for (let f = 0; f < this.foundations.length; f++) {
          if (canPlaceOnFoundation(card, this.foundations[f])) {
            return true;
          }
        }
      }
    }
    return false;
  }
  autoPlay() {
    for (let i = 0; i < this.tableau.length; i++) {
      const pile = this.tableau[i];
      if (pile.length > 0) {
        const card = pile[pile.length - 1];
        for (let f = 0; f < this.foundations.length; f++) {
          if (canPlaceOnFoundation(card, this.foundations[f])) {
            this.moveTableauToFoundation(i, f);
            return true;
          }
        }
      }
    }
    for (let i = 0; i < this.freeCells.length; i++) {
      const card = this.freeCells[i];
      if (card) {
        for (let f = 0; f < this.foundations.length; f++) {
          if (canPlaceOnFoundation(card, this.foundations[f])) {
            this.moveFreeCellToFoundation(i, f);
            return true;
          }
        }
      }
    }
    return false;
  }
  isWon() {
    return this.foundations.every((f) => f.cards.length === 13);
  }
  applyMove(move) {
    switch (move.type) {
      case "newGame":
        this.newGame();
        break;
      case "moveTableauToFreeCell":
        this.moveTableauToFreeCell(move.tableauIndex, move.freeCellIndex);
        break;
      case "moveFreeCellToTableau":
        this.moveFreeCellToTableau(move.freeCellIndex, move.tableauIndex);
        break;
      case "moveFreeCellToFoundation":
        this.moveFreeCellToFoundation(move.freeCellIndex, move.foundationIndex);
        break;
      case "moveTableauToTableau":
        this.moveTableauToTableau(move.fromIndex, move.cardIndex, move.toIndex);
        break;
      case "moveTableauToFoundation":
        this.moveTableauToFoundation(move.tableauIndex, move.foundationIndex);
        break;
    }
  }
  getState() {
    return {
      tableau: this.tableau.map((pile) => [...pile]),
      foundations: this.foundations.map((f) => ({ suit: f.suit, cards: [...f.cards] })),
      freeCells: [...this.freeCells],
      moves: this.moves
    };
  }
}
function createFreeCellStore() {
  const engine = new FreeCellEngine();
  const state = writable(engine.getState());
  function sync() {
    state.set(engine.getState());
  }
  const newGame = () => {
    engine.applyMove({ type: "newGame" });
    sync();
  };
  const moveTableauToFreeCell = (tableauIndex, freeCellIndex) => {
    const result = engine.moveTableauToFreeCell(tableauIndex, freeCellIndex);
    sync();
    return result;
  };
  const moveFreeCellToTableau = (freeCellIndex, tableauIndex) => {
    const result = engine.moveFreeCellToTableau(freeCellIndex, tableauIndex);
    sync();
    return result;
  };
  const moveFreeCellToFoundation = (freeCellIndex, foundationIndex) => {
    const result = engine.moveFreeCellToFoundation(freeCellIndex, foundationIndex);
    sync();
    return result;
  };
  const moveTableauToTableau = (fromIndex, cardIndex, toIndex) => {
    const result = engine.moveTableauToTableau(fromIndex, cardIndex, toIndex);
    sync();
    return result;
  };
  const moveTableauToFoundation = (tableauIndex, foundationIndex) => {
    const result = engine.moveTableauToFoundation(tableauIndex, foundationIndex);
    sync();
    return result;
  };
  const autoPlay = () => {
    const result = engine.autoPlay();
    sync();
    return result;
  };
  const tableau = derived(state, ($state) => $state.tableau);
  const foundations = derived(state, ($state) => $state.foundations);
  const freeCells = derived(state, ($state) => $state.freeCells);
  const moves = derived(state, ($state) => $state.moves);
  const isWon = derived(state, ($state) => $state.foundations.every((f) => f.cards.length === 13));
  const autoPlayAvailable = derived(state, () => engine.canAutoPlay());
  return {
    state,
    tableau,
    foundations,
    freeCells,
    moves,
    isWon,
    autoPlayAvailable,
    newGame,
    moveTableauToFreeCell,
    moveFreeCellToTableau,
    moveFreeCellToFoundation,
    moveTableauToTableau,
    moveTableauToFoundation,
    autoPlay
  };
}
const css = {
  code: "main.svelte-14ut8tj.svelte-14ut8tj{min-height:100dvh;width:100dvw;background:radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);padding:20px;overflow-x:hidden}.game-container.svelte-14ut8tj.svelte-14ut8tj{max-width:1400px;margin:0 auto}.header.svelte-14ut8tj.svelte-14ut8tj{display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;flex-wrap:wrap;gap:1rem}h1.svelte-14ut8tj.svelte-14ut8tj{font-size:2rem;color:goldenrod;margin:0;text-shadow:2px 2px 4px rgba(0, 0, 0, 0.5)}.stats.svelte-14ut8tj.svelte-14ut8tj{color:#e8eaed;font-size:1.2rem}.actions.svelte-14ut8tj.svelte-14ut8tj{display:flex;gap:0.5rem}.top-row.svelte-14ut8tj.svelte-14ut8tj{display:flex;justify-content:space-between;margin-bottom:3rem;gap:1rem}.free-cells.svelte-14ut8tj.svelte-14ut8tj,.foundations.svelte-14ut8tj.svelte-14ut8tj{display:flex;gap:1rem}.free-cell.svelte-14ut8tj.svelte-14ut8tj,.foundation.svelte-14ut8tj.svelte-14ut8tj{position:relative;width:80px;height:110px;border-radius:8px;cursor:pointer}.free-cell.svelte-14ut8tj.svelte-14ut8tj{border:2px dashed rgba(255, 215, 0, 0.3)}.foundation.svelte-14ut8tj.svelte-14ut8tj{border:2px solid rgba(255, 215, 0, 0.3)}.cell-card.svelte-14ut8tj.svelte-14ut8tj{position:relative;width:100%;height:100%}.spacer.svelte-14ut8tj.svelte-14ut8tj{flex-grow:1}.empty-pile.svelte-14ut8tj.svelte-14ut8tj{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0, 0, 0, 0.3);border-radius:8px;font-size:2rem;color:rgba(255, 215, 0, 0.3);font-weight:bold}.foundation-suit.svelte-14ut8tj.svelte-14ut8tj{font-size:3rem}.free-cell-empty.svelte-14ut8tj.svelte-14ut8tj{font-size:2.5rem}.tableau.svelte-14ut8tj.svelte-14ut8tj{display:grid;grid-template-columns:repeat(8, 1fr);gap:1rem;min-height:400px}.tableau-pile.svelte-14ut8tj.svelte-14ut8tj{position:relative;min-height:110px}.tableau-card.svelte-14ut8tj.svelte-14ut8tj{position:absolute;left:0;cursor:pointer}.tableau-empty.svelte-14ut8tj.svelte-14ut8tj{border:2px solid rgba(255, 215, 0, 0.3)}.win-overlay.svelte-14ut8tj.svelte-14ut8tj{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0, 0, 0, 0.8);display:flex;align-items:center;justify-content:center;z-index:1000}.win-message.svelte-14ut8tj.svelte-14ut8tj{background:rgba(0, 0, 0, 0.95);border:3px solid goldenrod;border-radius:12px;padding:3rem;text-align:center;animation:svelte-14ut8tj-celebrate 0.5s ease-out}@keyframes svelte-14ut8tj-celebrate{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}.win-message.svelte-14ut8tj h2.svelte-14ut8tj{color:goldenrod;font-size:2.5rem;margin-bottom:1rem}.win-message.svelte-14ut8tj p.svelte-14ut8tj{color:#e8eaed;font-size:1.3rem;margin-bottom:2rem}@media(max-width: 768px){.header.svelte-14ut8tj.svelte-14ut8tj{flex-direction:column;align-items:flex-start}h1.svelte-14ut8tj.svelte-14ut8tj{font-size:1.5rem}.top-row.svelte-14ut8tj.svelte-14ut8tj{flex-direction:column}.tableau.svelte-14ut8tj.svelte-14ut8tj{grid-template-columns:repeat(4, 1fr);gap:0.5rem}.free-cell.svelte-14ut8tj.svelte-14ut8tj,.foundation.svelte-14ut8tj.svelte-14ut8tj{width:60px;height:85px}.free-cells.svelte-14ut8tj.svelte-14ut8tj,.foundations.svelte-14ut8tj.svelte-14ut8tj{gap:0.5rem}.tableau-card.svelte-14ut8tj.svelte-14ut8tj{position:static}.empty-pile.svelte-14ut8tj.svelte-14ut8tj{font-size:1.5rem}.foundation-suit.svelte-14ut8tj.svelte-14ut8tj{font-size:2rem}.free-cell-empty.svelte-14ut8tj.svelte-14ut8tj{font-size:1.8rem}}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import \\"../../global.css\\";\\nimport { createFreeCellStore } from \\"$lib/adapters/createFreeCellStore\\";\\nimport CardsDefinitions from \\"$lib/Components/CardsDefinitions.svelte\\";\\nimport Card from \\"$lib/Components/SolitaireCard.svelte\\";\\nimport Button from \\"$lib/Components/Button.svelte\\";\\nimport { onMount } from \\"svelte\\";\\nconst game = createFreeCellStore();\\nconst { tableau, foundations, freeCells, moves, isWon, autoPlayAvailable } = game;\\nlet draggedCard = null;\\nonMount(() => {\\n  game.newGame();\\n});\\nfunction handleDragStart(from, index, cardIndex) {\\n  draggedCard = { from, index, cardIndex };\\n}\\nfunction handleDrop(to, toIndex) {\\n  if (!draggedCard) return;\\n  if (draggedCard.from === \\"freeCell\\") {\\n    if (to === \\"tableau\\") {\\n      game.moveFreeCellToTableau(draggedCard.index, toIndex);\\n    } else if (to === \\"foundation\\") {\\n      game.moveFreeCellToFoundation(draggedCard.index, toIndex);\\n    }\\n  } else if (draggedCard.from === \\"tableau\\" && draggedCard.cardIndex !== void 0) {\\n    if (to === \\"tableau\\") {\\n      game.moveTableauToTableau(draggedCard.index, draggedCard.cardIndex, toIndex);\\n    } else if (to === \\"foundation\\") {\\n      const pile = $tableau[draggedCard.index];\\n      if (draggedCard.cardIndex === pile.length - 1) {\\n        game.moveTableauToFoundation(draggedCard.index, toIndex);\\n      }\\n    } else if (to === \\"freeCell\\") {\\n      const pile = $tableau[draggedCard.index];\\n      if (draggedCard.cardIndex === pile.length - 1) {\\n        game.moveTableauToFreeCell(draggedCard.index, toIndex);\\n      }\\n    }\\n  }\\n  draggedCard = null;\\n}\\nfunction handleCardClick(from, index, cardIndex) {\\n  if (from === \\"freeCell\\") {\\n    for (let f = 0; f < $foundations.length; f++) {\\n      if (game.moveFreeCellToFoundation(index, f)) {\\n        return;\\n      }\\n    }\\n  } else if (from === \\"tableau\\" && cardIndex !== void 0) {\\n    const pile = $tableau[index];\\n    if (cardIndex === pile.length - 1) {\\n      for (let f = 0; f < $foundations.length; f++) {\\n        if (game.moveTableauToFoundation(index, f)) {\\n          return;\\n        }\\n      }\\n    }\\n  }\\n}\\n<\/script>\\n\\n<CardsDefinitions />\\n\\n<main>\\n\\t<div class=\\"game-container\\">\\n\\t\\t<!-- Header -->\\n\\t\\t<div class=\\"header\\">\\n\\t\\t\\t<h1>🃏 FreeCell Solitaire</h1>\\n\\t\\t\\t<div class=\\"stats\\">\\n\\t\\t\\t\\t<span>Moves: {$moves}</span>\\n\\t\\t\\t</div>\\n\\t\\t\\t<div class=\\"actions\\">\\n\\t\\t\\t\\t{#if $autoPlayAvailable}\\n\\t\\t\\t\\t\\t<Button onclick={() => game.autoPlay()} variant=\\"draw\\">Auto Play</Button>\\n\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t<Button onclick={() => game.newGame()} variant=\\"stop\\">New Game</Button>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\n\\t\\t<!-- Top Row: Free Cells and Foundations -->\\n\\t\\t<div class=\\"top-row\\">\\n\\t\\t\\t<!-- Free Cells -->\\n\\t\\t\\t<div class=\\"free-cells\\">\\n\\t\\t\\t\\t{#each $freeCells as card, i}\\n\\t\\t\\t\\t\\t<div\\n\\t\\t\\t\\t\\t\\tclass=\\"free-cell\\"\\n\\t\\t\\t\\t\\t\\ton:dragover={(e) => e.preventDefault()}\\n\\t\\t\\t\\t\\t\\ton:drop={() => handleDrop('freeCell', i)}\\n\\t\\t\\t\\t\\t\\trole=\\"button\\"\\n\\t\\t\\t\\t\\t\\ttabindex=\\"0\\"\\n\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t\\t{#if card}\\n\\t\\t\\t\\t\\t\\t\\t<div\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"cell-card\\"\\n\\t\\t\\t\\t\\t\\t\\t\\tdraggable=\\"true\\"\\n\\t\\t\\t\\t\\t\\t\\t\\ton:dragstart={() => handleDragStart('freeCell', i)}\\n\\t\\t\\t\\t\\t\\t\\t\\ton:click={() => handleCardClick('freeCell', i)}\\n\\t\\t\\t\\t\\t\\t\\t\\trole=\\"button\\"\\n\\t\\t\\t\\t\\t\\t\\t\\ttabindex=\\"0\\"\\n\\t\\t\\t\\t\\t\\t\\t\\ton:keydown={(e) => e.key === 'Enter' && handleCardClick('freeCell', i)}\\n\\t\\t\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t\\t\\t\\t<Card {card} faceUp={true} />\\n\\t\\t\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"empty-pile free-cell-empty\\">F</div>\\n\\t\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t{/each}\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<div class=\\"spacer\\"></div>\\n\\n\\t\\t\\t<!-- Foundations -->\\n\\t\\t\\t<div class=\\"foundations\\">\\n\\t\\t\\t\\t{#each $foundations as foundation, i}\\n\\t\\t\\t\\t\\t<div\\n\\t\\t\\t\\t\\t\\tclass=\\"foundation\\"\\n\\t\\t\\t\\t\\t\\ton:dragover={(e) => e.preventDefault()}\\n\\t\\t\\t\\t\\t\\ton:drop={() => handleDrop('foundation', i)}\\n\\t\\t\\t\\t\\t\\trole=\\"button\\"\\n\\t\\t\\t\\t\\t\\ttabindex=\\"0\\"\\n\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t\\t{#if foundation.cards.length > 0}\\n\\t\\t\\t\\t\\t\\t\\t<Card card={foundation.cards[foundation.cards.length - 1]} faceUp={true} />\\n\\t\\t\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"empty-pile foundation-suit\\">\\n\\t\\t\\t\\t\\t\\t\\t\\t{#if foundation.suit === 'heart'}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t♥\\n\\t\\t\\t\\t\\t\\t\\t\\t{:else if foundation.suit === 'diamond'}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t♦\\n\\t\\t\\t\\t\\t\\t\\t\\t{:else if foundation.suit === 'club'}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t♣\\n\\t\\t\\t\\t\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t♠\\n\\t\\t\\t\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t{/each}\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\n\\t\\t<!-- Tableau -->\\n\\t\\t<div class=\\"tableau\\">\\n\\t\\t\\t{#each $tableau as pile, i}\\n\\t\\t\\t\\t<div\\n\\t\\t\\t\\t\\tclass=\\"tableau-pile\\"\\n\\t\\t\\t\\t\\ton:dragover={(e) => e.preventDefault()}\\n\\t\\t\\t\\t\\ton:drop={() => handleDrop('tableau', i)}\\n\\t\\t\\t\\t\\trole=\\"button\\"\\n\\t\\t\\t\\t\\ttabindex=\\"0\\"\\n\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t{#if pile.length === 0}\\n\\t\\t\\t\\t\\t\\t<div class=\\"empty-pile tableau-empty\\"></div>\\n\\t\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t\\t{#each pile as card, cardIndex}\\n\\t\\t\\t\\t\\t\\t\\t<div\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"tableau-card\\"\\n\\t\\t\\t\\t\\t\\t\\t\\tstyle=\\"top: {cardIndex * 25}px\\"\\n\\t\\t\\t\\t\\t\\t\\t\\tdraggable=\\"true\\"\\n\\t\\t\\t\\t\\t\\t\\t\\ton:dragstart={() => handleDragStart('tableau', i, cardIndex)}\\n\\t\\t\\t\\t\\t\\t\\t\\ton:click={() => handleCardClick('tableau', i, cardIndex)}\\n\\t\\t\\t\\t\\t\\t\\t\\trole=\\"button\\"\\n\\t\\t\\t\\t\\t\\t\\t\\ttabindex=\\"0\\"\\n\\t\\t\\t\\t\\t\\t\\t\\ton:keydown={(e) => e.key === 'Enter' && handleCardClick('tableau', i, cardIndex)}\\n\\t\\t\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t\\t\\t\\t<Card {card} faceUp={true} />\\n\\t\\t\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t{/each}\\n\\t\\t</div>\\n\\n\\t\\t{#if $isWon}\\n\\t\\t\\t<div class=\\"win-overlay\\">\\n\\t\\t\\t\\t<div class=\\"win-message\\">\\n\\t\\t\\t\\t\\t<h2>🎉 Congratulations! 🎉</h2>\\n\\t\\t\\t\\t\\t<p>You won in {$moves} moves!</p>\\n\\t\\t\\t\\t\\t<Button onclick={() => game.newGame()} variant=\\"stop\\">Play Again</Button>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\t\\t{/if}\\n\\t</div>\\n</main>\\n\\n<style>\\n\\tmain {\\n\\t\\tmin-height: 100dvh;\\n\\t\\twidth: 100dvw;\\n\\t\\tbackground: radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);\\n\\t\\tpadding: 20px;\\n\\t\\toverflow-x: hidden;\\n\\t}\\n\\n\\t.game-container {\\n\\t\\tmax-width: 1400px;\\n\\t\\tmargin: 0 auto;\\n\\t}\\n\\n\\t.header {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: space-between;\\n\\t\\talign-items: center;\\n\\t\\tmargin-bottom: 2rem;\\n\\t\\tflex-wrap: wrap;\\n\\t\\tgap: 1rem;\\n\\t}\\n\\n\\th1 {\\n\\t\\tfont-size: 2rem;\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin: 0;\\n\\t\\ttext-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);\\n\\t}\\n\\n\\t.stats {\\n\\t\\tcolor: #e8eaed;\\n\\t\\tfont-size: 1.2rem;\\n\\t}\\n\\n\\t.actions {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 0.5rem;\\n\\t}\\n\\n\\t.top-row {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: space-between;\\n\\t\\tmargin-bottom: 3rem;\\n\\t\\tgap: 1rem;\\n\\t}\\n\\n\\t.free-cells,\\n\\t.foundations {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 1rem;\\n\\t}\\n\\n\\t.free-cell,\\n\\t.foundation {\\n\\t\\tposition: relative;\\n\\t\\twidth: 80px;\\n\\t\\theight: 110px;\\n\\t\\tborder-radius: 8px;\\n\\t\\tcursor: pointer;\\n\\t}\\n\\n\\t.free-cell {\\n\\t\\tborder: 2px dashed rgba(255, 215, 0, 0.3);\\n\\t}\\n\\n\\t.foundation {\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.3);\\n\\t}\\n\\n\\t.cell-card {\\n\\t\\tposition: relative;\\n\\t\\twidth: 100%;\\n\\t\\theight: 100%;\\n\\t}\\n\\n\\t.spacer {\\n\\t\\tflex-grow: 1;\\n\\t}\\n\\n\\t.empty-pile {\\n\\t\\twidth: 100%;\\n\\t\\theight: 100%;\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\tbackground: rgba(0, 0, 0, 0.3);\\n\\t\\tborder-radius: 8px;\\n\\t\\tfont-size: 2rem;\\n\\t\\tcolor: rgba(255, 215, 0, 0.3);\\n\\t\\tfont-weight: bold;\\n\\t}\\n\\n\\t.foundation-suit {\\n\\t\\tfont-size: 3rem;\\n\\t}\\n\\n\\t.free-cell-empty {\\n\\t\\tfont-size: 2.5rem;\\n\\t}\\n\\n\\t.tableau {\\n\\t\\tdisplay: grid;\\n\\t\\tgrid-template-columns: repeat(8, 1fr);\\n\\t\\tgap: 1rem;\\n\\t\\tmin-height: 400px;\\n\\t}\\n\\n\\t.tableau-pile {\\n\\t\\tposition: relative;\\n\\t\\tmin-height: 110px;\\n\\t}\\n\\n\\t.tableau-card {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\tcursor: pointer;\\n\\t}\\n\\n\\t.tableau-empty {\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.3);\\n\\t}\\n\\n\\t.win-overlay {\\n\\t\\tposition: fixed;\\n\\t\\ttop: 0;\\n\\t\\tleft: 0;\\n\\t\\twidth: 100%;\\n\\t\\theight: 100%;\\n\\t\\tbackground: rgba(0, 0, 0, 0.8);\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\tz-index: 1000;\\n\\t}\\n\\n\\t.win-message {\\n\\t\\tbackground: rgba(0, 0, 0, 0.95);\\n\\t\\tborder: 3px solid goldenrod;\\n\\t\\tborder-radius: 12px;\\n\\t\\tpadding: 3rem;\\n\\t\\ttext-align: center;\\n\\t\\tanimation: celebrate 0.5s ease-out;\\n\\t}\\n\\n\\t@keyframes celebrate {\\n\\t\\tfrom {\\n\\t\\t\\ttransform: scale(0.5);\\n\\t\\t\\topacity: 0;\\n\\t\\t}\\n\\t\\tto {\\n\\t\\t\\ttransform: scale(1);\\n\\t\\t\\topacity: 1;\\n\\t\\t}\\n\\t}\\n\\n\\t.win-message h2 {\\n\\t\\tcolor: goldenrod;\\n\\t\\tfont-size: 2.5rem;\\n\\t\\tmargin-bottom: 1rem;\\n\\t}\\n\\n\\t.win-message p {\\n\\t\\tcolor: #e8eaed;\\n\\t\\tfont-size: 1.3rem;\\n\\t\\tmargin-bottom: 2rem;\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\t.header {\\n\\t\\t\\tflex-direction: column;\\n\\t\\t\\talign-items: flex-start;\\n\\t\\t}\\n\\n\\t\\th1 {\\n\\t\\t\\tfont-size: 1.5rem;\\n\\t\\t}\\n\\n\\t\\t.top-row {\\n\\t\\t\\tflex-direction: column;\\n\\t\\t}\\n\\n\\t\\t.tableau {\\n\\t\\t\\tgrid-template-columns: repeat(4, 1fr);\\n\\t\\t\\tgap: 0.5rem;\\n\\t\\t}\\n\\n\\t\\t.free-cell,\\n\\t\\t.foundation {\\n\\t\\t\\twidth: 60px;\\n\\t\\t\\theight: 85px;\\n\\t\\t}\\n\\n\\t\\t.free-cells,\\n\\t\\t.foundations {\\n\\t\\t\\tgap: 0.5rem;\\n\\t\\t}\\n\\n\\t\\t.tableau-card {\\n\\t\\t\\tposition: static;\\n\\t\\t}\\n\\n\\t\\t.empty-pile {\\n\\t\\t\\tfont-size: 1.5rem;\\n\\t\\t}\\n\\n\\t\\t.foundation-suit {\\n\\t\\t\\tfont-size: 2rem;\\n\\t\\t}\\n\\n\\t\\t.free-cell-empty {\\n\\t\\t\\tfont-size: 1.8rem;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"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"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $foundations, $$unsubscribe_foundations;
  let $tableau, $$unsubscribe_tableau;
  let $moves, $$unsubscribe_moves;
  let $autoPlayAvailable, $$unsubscribe_autoPlayAvailable;
  let $freeCells, $$unsubscribe_freeCells;
  let $isWon, $$unsubscribe_isWon;
  const game = createFreeCellStore();
  const { tableau, foundations, freeCells, moves, isWon, autoPlayAvailable } = game;
  $$unsubscribe_tableau = subscribe(tableau, (value) => $tableau = value);
  $$unsubscribe_foundations = subscribe(foundations, (value) => $foundations = value);
  $$unsubscribe_freeCells = subscribe(freeCells, (value) => $freeCells = value);
  $$unsubscribe_moves = subscribe(moves, (value) => $moves = value);
  $$unsubscribe_isWon = subscribe(isWon, (value) => $isWon = value);
  $$unsubscribe_autoPlayAvailable = subscribe(autoPlayAvailable, (value) => $autoPlayAvailable = value);
  $$result.css.add(css);
  $$unsubscribe_foundations();
  $$unsubscribe_tableau();
  $$unsubscribe_moves();
  $$unsubscribe_autoPlayAvailable();
  $$unsubscribe_freeCells();
  $$unsubscribe_isWon();
  return `${validate_component(CardsDefinitions, "CardsDefinitions").$$render($$result, {}, {}, {})} <main class="svelte-14ut8tj"><div class="game-container svelte-14ut8tj"> <div class="header svelte-14ut8tj"><h1 class="svelte-14ut8tj" data-svelte-h="svelte-lbwza9">🃏 FreeCell Solitaire</h1> <div class="stats svelte-14ut8tj"><span>Moves: ${escape($moves)}</span></div> <div class="actions svelte-14ut8tj">${$autoPlayAvailable ? `${validate_component(Button, "Button").$$render(
    $$result,
    {
      onclick: () => game.autoPlay(),
      variant: "draw"
    },
    {},
    {
      default: () => {
        return `Auto Play`;
      }
    }
  )}` : ``} ${validate_component(Button, "Button").$$render(
    $$result,
    {
      onclick: () => game.newGame(),
      variant: "stop"
    },
    {},
    {
      default: () => {
        return `New Game`;
      }
    }
  )}</div></div>  <div class="top-row svelte-14ut8tj"> <div class="free-cells svelte-14ut8tj">${each($freeCells, (card, i) => {
    return `<div class="free-cell svelte-14ut8tj" role="button" tabindex="0">${card ? `<div class="cell-card svelte-14ut8tj" draggable="true" role="button" tabindex="0">${validate_component(SolitaireCard, "Card").$$render($$result, { card, faceUp: true }, {}, {})} </div>` : `<div class="empty-pile free-cell-empty svelte-14ut8tj" data-svelte-h="svelte-wfbfaq">F</div>`} </div>`;
  })}</div> <div class="spacer svelte-14ut8tj"></div>  <div class="foundations svelte-14ut8tj">${each($foundations, (foundation, i) => {
    return `<div class="foundation svelte-14ut8tj" role="button" tabindex="0">${foundation.cards.length > 0 ? `${validate_component(SolitaireCard, "Card").$$render(
      $$result,
      {
        card: foundation.cards[foundation.cards.length - 1],
        faceUp: true
      },
      {},
      {}
    )}` : `<div class="empty-pile foundation-suit svelte-14ut8tj">${foundation.suit === "heart" ? `♥` : `${foundation.suit === "diamond" ? `♦` : `${foundation.suit === "club" ? `♣` : `♠`}`}`} </div>`} </div>`;
  })}</div></div>  <div class="tableau svelte-14ut8tj">${each($tableau, (pile, i) => {
    return `<div class="tableau-pile svelte-14ut8tj" role="button" tabindex="0">${pile.length === 0 ? `<div class="empty-pile tableau-empty svelte-14ut8tj"></div>` : `${each(pile, (card, cardIndex) => {
      return `<div class="tableau-card svelte-14ut8tj" style="${"top: " + escape(cardIndex * 25, true) + "px"}" draggable="true" role="button" tabindex="0">${validate_component(SolitaireCard, "Card").$$render($$result, { card, faceUp: true }, {}, {})} </div>`;
    })}`} </div>`;
  })}</div> ${$isWon ? `<div class="win-overlay svelte-14ut8tj"><div class="win-message svelte-14ut8tj"><h2 class="svelte-14ut8tj" data-svelte-h="svelte-1e2z9mw">🎉 Congratulations! 🎉</h2> <p class="svelte-14ut8tj">You won in ${escape($moves)} moves!</p> ${validate_component(Button, "Button").$$render(
    $$result,
    {
      onclick: () => game.newGame(),
      variant: "stop"
    },
    {},
    {
      default: () => {
        return `Play Again`;
      }
    }
  )}</div></div>` : ``}</div> </main>`;
});
export {
  Page as default
};
