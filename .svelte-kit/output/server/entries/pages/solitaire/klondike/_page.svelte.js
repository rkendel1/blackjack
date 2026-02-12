import { c as create_ssr_component, a as subscribe, v as validate_component, e as escape, b as each, d as add_attribute } from "../../../../chunks/ssr.js";
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
    return card.rank === "king";
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
class KlondikeEngine {
  tableau;
  foundations;
  stock;
  waste;
  revealedTableau;
  moves;
  constructor() {
    this.tableau = [[], [], [], [], [], [], []];
    this.foundations = [
      { suit: "heart", cards: [] },
      { suit: "diamond", cards: [] },
      { suit: "club", cards: [] },
      { suit: "spade", cards: [] }
    ];
    this.stock = [];
    this.waste = [];
    this.revealedTableau = [[], [], [], [], [], [], []];
    this.moves = 0;
  }
  newGame() {
    const deck = new Deck();
    deck.shuffle();
    const cards = deck.cards;
    this.tableau = [[], [], [], [], [], [], []];
    this.revealedTableau = [[], [], [], [], [], [], []];
    let cardIndex = 0;
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        this.tableau[col].push(cards[cardIndex]);
        this.revealedTableau[col].push(row === col);
        cardIndex++;
      }
    }
    this.stock = cards.slice(cardIndex);
    this.waste = [];
    this.foundations = [
      { suit: "heart", cards: [] },
      { suit: "diamond", cards: [] },
      { suit: "club", cards: [] },
      { suit: "spade", cards: [] }
    ];
    this.moves = 0;
  }
  drawFromStock() {
    if (this.stock.length > 0) {
      const cardsToDraw = Math.min(3, this.stock.length);
      const drawnCards = this.stock.splice(0, cardsToDraw);
      this.waste.push(...drawnCards);
      this.moves++;
    } else if (this.waste.length > 0) {
      this.stock = [...this.waste].reverse();
      this.waste = [];
      this.moves++;
    }
  }
  moveWasteToTableau(tableauIndex) {
    if (this.waste.length === 0) return false;
    const card = this.waste[this.waste.length - 1];
    const targetPile = this.tableau[tableauIndex];
    const targetCard = targetPile.length > 0 ? targetPile[targetPile.length - 1] : null;
    if (canPlaceOnTableau(card, targetCard)) {
      this.waste.pop();
      this.tableau[tableauIndex].push(card);
      this.moves++;
      return true;
    }
    return false;
  }
  moveWasteToFoundation(foundationIndex) {
    if (this.waste.length === 0) return false;
    const card = this.waste[this.waste.length - 1];
    const foundation = this.foundations[foundationIndex];
    if (canPlaceOnFoundation(card, foundation)) {
      this.waste.pop();
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
    if (!this.revealedTableau[fromIndex][cardIndex]) return false;
    const movingCards = fromPile.slice(cardIndex);
    const targetCard = toPile.length > 0 ? toPile[toPile.length - 1] : null;
    if (canPlaceOnTableau(movingCards[0], targetCard)) {
      this.tableau[fromIndex] = fromPile.slice(0, cardIndex);
      this.tableau[toIndex].push(...movingCards);
      if (this.tableau[fromIndex].length > 0) {
        this.revealedTableau[fromIndex][this.tableau[fromIndex].length - 1] = true;
      }
      this.revealedTableau[fromIndex] = this.revealedTableau[fromIndex].slice(0, cardIndex);
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
      pile.pop();
      foundation.cards.push(card);
      if (pile.length > 0) {
        this.revealedTableau[tableauIndex][pile.length - 1] = true;
      }
      this.revealedTableau[tableauIndex].pop();
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
    if (this.waste.length > 0) {
      const card = this.waste[this.waste.length - 1];
      for (let f = 0; f < this.foundations.length; f++) {
        if (canPlaceOnFoundation(card, this.foundations[f])) {
          return true;
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
    if (this.waste.length > 0) {
      const card = this.waste[this.waste.length - 1];
      for (let f = 0; f < this.foundations.length; f++) {
        if (canPlaceOnFoundation(card, this.foundations[f])) {
          this.moveWasteToFoundation(f);
          return true;
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
      case "drawFromStock":
        this.drawFromStock();
        break;
      case "moveWasteToTableau":
        this.moveWasteToTableau(move.tableauIndex);
        break;
      case "moveWasteToFoundation":
        this.moveWasteToFoundation(move.foundationIndex);
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
      stock: [...this.stock],
      waste: [...this.waste],
      revealedTableau: this.revealedTableau.map((revealed) => [...revealed]),
      moves: this.moves
    };
  }
}
function createKlondikeStore() {
  const engine = new KlondikeEngine();
  const state = writable(engine.getState());
  function sync() {
    state.set(engine.getState());
  }
  const newGame = () => {
    engine.applyMove({ type: "newGame" });
    sync();
  };
  const drawFromStock = () => {
    engine.applyMove({ type: "drawFromStock" });
    sync();
  };
  const moveWasteToTableau = (tableauIndex) => {
    const beforeMoves = engine.getState().moves;
    engine.applyMove({ type: "moveWasteToTableau", tableauIndex });
    sync();
    return engine.getState().moves > beforeMoves;
  };
  const moveWasteToFoundation = (foundationIndex) => {
    const beforeMoves = engine.getState().moves;
    engine.applyMove({ type: "moveWasteToFoundation", foundationIndex });
    sync();
    return engine.getState().moves > beforeMoves;
  };
  const moveTableauToTableau = (fromIndex, cardIndex, toIndex) => {
    const beforeMoves = engine.getState().moves;
    engine.applyMove({ type: "moveTableauToTableau", fromIndex, cardIndex, toIndex });
    sync();
    return engine.getState().moves > beforeMoves;
  };
  const moveTableauToFoundation = (tableauIndex, foundationIndex) => {
    const beforeMoves = engine.getState().moves;
    engine.applyMove({ type: "moveTableauToFoundation", tableauIndex, foundationIndex });
    sync();
    return engine.getState().moves > beforeMoves;
  };
  const autoPlay = () => {
    const result = engine.autoPlay();
    sync();
    return result;
  };
  const tableau = derived(state, ($state) => $state.tableau);
  const foundations = derived(state, ($state) => $state.foundations);
  const stock = derived(state, ($state) => $state.stock);
  const waste = derived(state, ($state) => $state.waste);
  const revealedTableau = derived(state, ($state) => $state.revealedTableau);
  const moves = derived(state, ($state) => $state.moves);
  const isWon = derived(state, ($state) => $state.foundations.every((f) => f.cards.length === 13));
  const autoPlayAvailable = derived(state, () => engine.canAutoPlay());
  return {
    state,
    tableau,
    foundations,
    stock,
    waste,
    revealedTableau,
    moves,
    isWon,
    autoPlayAvailable,
    newGame,
    drawFromStock,
    moveWasteToTableau,
    moveWasteToFoundation,
    moveTableauToTableau,
    moveTableauToFoundation,
    autoPlay
  };
}
const css = {
  code: "main.svelte-7z8c47.svelte-7z8c47{min-height:100dvh;width:100dvw;background:radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);padding:20px;overflow-x:hidden}.game-container.svelte-7z8c47.svelte-7z8c47{max-width:1200px;margin:0 auto}.header.svelte-7z8c47.svelte-7z8c47{display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;flex-wrap:wrap;gap:1rem}h1.svelte-7z8c47.svelte-7z8c47{font-size:2rem;color:goldenrod;margin:0;text-shadow:2px 2px 4px rgba(0, 0, 0, 0.5)}.stats.svelte-7z8c47.svelte-7z8c47{color:#e8eaed;font-size:1.2rem}.actions.svelte-7z8c47.svelte-7z8c47{display:flex;gap:0.5rem}.top-row.svelte-7z8c47.svelte-7z8c47{display:flex;justify-content:space-between;margin-bottom:3rem;gap:1rem}.stock-area.svelte-7z8c47.svelte-7z8c47{display:flex;gap:1rem}.stock.svelte-7z8c47.svelte-7z8c47,.waste.svelte-7z8c47.svelte-7z8c47,.foundation.svelte-7z8c47.svelte-7z8c47{position:relative;width:80px;height:110px;border-radius:8px;cursor:pointer}.stock.svelte-7z8c47.svelte-7z8c47{border:2px dashed rgba(255, 215, 0, 0.3)}.waste.svelte-7z8c47.svelte-7z8c47{position:relative;width:140px}.waste-card.svelte-7z8c47.svelte-7z8c47{position:absolute;top:0}.stock-count.svelte-7z8c47.svelte-7z8c47{position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);color:goldenrod;font-weight:bold;font-size:1.5rem;text-shadow:2px 2px 4px rgba(0, 0, 0, 0.8);pointer-events:none}.spacer.svelte-7z8c47.svelte-7z8c47{flex-grow:1}.foundations.svelte-7z8c47.svelte-7z8c47{display:flex;gap:1rem}.foundation.svelte-7z8c47.svelte-7z8c47{border:2px solid rgba(255, 215, 0, 0.3)}.empty-pile.svelte-7z8c47.svelte-7z8c47{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0, 0, 0, 0.3);border-radius:8px;font-size:2rem;color:rgba(255, 215, 0, 0.3)}.foundation-suit.svelte-7z8c47.svelte-7z8c47{font-size:3rem}.tableau.svelte-7z8c47.svelte-7z8c47{display:grid;grid-template-columns:repeat(7, 1fr);gap:1rem;min-height:400px}.tableau-pile.svelte-7z8c47.svelte-7z8c47{position:relative;min-height:110px}.tableau-card.svelte-7z8c47.svelte-7z8c47{position:absolute;left:0;cursor:pointer}.tableau-empty.svelte-7z8c47.svelte-7z8c47{border:2px solid rgba(255, 215, 0, 0.3)}.win-overlay.svelte-7z8c47.svelte-7z8c47{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0, 0, 0, 0.8);display:flex;align-items:center;justify-content:center;z-index:1000}.win-message.svelte-7z8c47.svelte-7z8c47{background:rgba(0, 0, 0, 0.95);border:3px solid goldenrod;border-radius:12px;padding:3rem;text-align:center;animation:svelte-7z8c47-celebrate 0.5s ease-out}@keyframes svelte-7z8c47-celebrate{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}.win-message.svelte-7z8c47 h2.svelte-7z8c47{color:goldenrod;font-size:2.5rem;margin-bottom:1rem}.win-message.svelte-7z8c47 p.svelte-7z8c47{color:#e8eaed;font-size:1.3rem;margin-bottom:2rem}@media(max-width: 768px){.header.svelte-7z8c47.svelte-7z8c47{flex-direction:column;align-items:flex-start}h1.svelte-7z8c47.svelte-7z8c47{font-size:1.5rem}.top-row.svelte-7z8c47.svelte-7z8c47{flex-direction:column}.tableau.svelte-7z8c47.svelte-7z8c47{grid-template-columns:repeat(4, 1fr);gap:0.5rem}.stock.svelte-7z8c47.svelte-7z8c47,.waste.svelte-7z8c47.svelte-7z8c47,.foundation.svelte-7z8c47.svelte-7z8c47{width:60px;height:85px}.waste.svelte-7z8c47.svelte-7z8c47{width:110px}.foundations.svelte-7z8c47.svelte-7z8c47{gap:0.5rem}.stock-area.svelte-7z8c47.svelte-7z8c47{gap:0.5rem}}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import \\"../../global.css\\";\\nimport { createKlondikeStore } from \\"$lib/adapters/createKlondikeStore\\";\\nimport CardsDefinitions from \\"$lib/Components/CardsDefinitions.svelte\\";\\nimport Card from \\"$lib/Components/SolitaireCard.svelte\\";\\nimport Button from \\"$lib/Components/Button.svelte\\";\\nimport { onMount } from \\"svelte\\";\\nconst game = createKlondikeStore();\\nconst { tableau, foundations, stock, waste, revealedTableau, moves, isWon, autoPlayAvailable } = game;\\nlet draggedCard = null;\\nonMount(() => {\\n  game.newGame();\\n});\\nfunction handleDragStart(from, index, cardIndex) {\\n  draggedCard = { from, index, cardIndex };\\n}\\nfunction handleDrop(to, toIndex) {\\n  if (!draggedCard) return;\\n  if (draggedCard.from === \\"waste\\") {\\n    if (to === \\"tableau\\") {\\n      game.moveWasteToTableau(toIndex);\\n    } else if (to === \\"foundation\\") {\\n      game.moveWasteToFoundation(toIndex);\\n    }\\n  } else if (draggedCard.from === \\"tableau\\" && draggedCard.index !== void 0) {\\n    if (to === \\"tableau\\") {\\n      game.moveTableauToTableau(draggedCard.index, draggedCard.cardIndex || 0, toIndex);\\n    } else if (to === \\"foundation\\" && draggedCard.cardIndex !== void 0) {\\n      const pile = $tableau[draggedCard.index];\\n      if (draggedCard.cardIndex === pile.length - 1) {\\n        game.moveTableauToFoundation(draggedCard.index, toIndex);\\n      }\\n    }\\n  }\\n  draggedCard = null;\\n}\\nfunction handleCardClick(from, index, cardIndex) {\\n  if (from === \\"waste\\") {\\n    for (let f = 0; f < $foundations.length; f++) {\\n      if (game.moveWasteToFoundation(f)) {\\n        return;\\n      }\\n    }\\n  } else if (from === \\"tableau\\" && index !== void 0 && cardIndex !== void 0) {\\n    const pile = $tableau[index];\\n    if (cardIndex === pile.length - 1) {\\n      for (let f = 0; f < $foundations.length; f++) {\\n        if (game.moveTableauToFoundation(index, f)) {\\n          return;\\n        }\\n      }\\n    }\\n  }\\n}\\n<\/script>\\n\\n<CardsDefinitions />\\n\\n<main>\\n\\t<div class=\\"game-container\\">\\n\\t\\t<!-- Header -->\\n\\t\\t<div class=\\"header\\">\\n\\t\\t\\t<h1>🃏 Klondike Solitaire</h1>\\n\\t\\t\\t<div class=\\"stats\\">\\n\\t\\t\\t\\t<span>Moves: {$moves}</span>\\n\\t\\t\\t</div>\\n\\t\\t\\t<div class=\\"actions\\">\\n\\t\\t\\t\\t{#if $autoPlayAvailable}\\n\\t\\t\\t\\t\\t<Button onclick={() => game.autoPlay()} variant=\\"draw\\">Auto Play</Button>\\n\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t<Button onclick={() => game.newGame()} variant=\\"stop\\">New Game</Button>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\n\\t\\t<!-- Top Row: Stock, Waste, and Foundations -->\\n\\t\\t<div class=\\"top-row\\">\\n\\t\\t\\t<!-- Stock -->\\n\\t\\t\\t<div class=\\"stock-area\\">\\n\\t\\t\\t\\t<div\\n\\t\\t\\t\\t\\tclass=\\"stock\\"\\n\\t\\t\\t\\t\\ton:click={() => game.drawFromStock()}\\n\\t\\t\\t\\t\\trole=\\"button\\"\\n\\t\\t\\t\\t\\ttabindex=\\"0\\"\\n\\t\\t\\t\\t\\ton:keydown={(e) => e.key === 'Enter' && game.drawFromStock()}\\n\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t{#if $stock.length > 0}\\n\\t\\t\\t\\t\\t\\t<Card card={$stock[0]} faceUp={false} />\\n\\t\\t\\t\\t\\t\\t<div class=\\"stock-count\\">{$stock.length}</div>\\n\\t\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t\\t<div class=\\"empty-pile\\">♻️</div>\\n\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t</div>\\n\\n\\t\\t\\t\\t<!-- Waste -->\\n\\t\\t\\t\\t<div\\n\\t\\t\\t\\t\\tclass=\\"waste\\"\\n\\t\\t\\t\\t\\trole=\\"region\\"\\n\\t\\t\\t\\t\\taria-label=\\"Waste pile\\"\\n\\t\\t\\t\\t\\ton:dragover={(e) => e.preventDefault()}\\n\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t{#if $waste.length > 0}\\n\\t\\t\\t\\t\\t\\t{#each $waste.slice(-3) as card, i}\\n\\t\\t\\t\\t\\t\\t\\t<div\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"waste-card\\"\\n\\t\\t\\t\\t\\t\\t\\t\\tstyle=\\"left: {i * 20}px\\"\\n\\t\\t\\t\\t\\t\\t\\t\\tdraggable=\\"true\\"\\n\\t\\t\\t\\t\\t\\t\\t\\ton:dragstart={() => handleDragStart('waste')}\\n\\t\\t\\t\\t\\t\\t\\t\\ton:click={() => handleCardClick('waste')}\\n\\t\\t\\t\\t\\t\\t\\t\\trole=\\"button\\"\\n\\t\\t\\t\\t\\t\\t\\t\\ttabindex=\\"0\\"\\n\\t\\t\\t\\t\\t\\t\\t\\ton:keydown={(e) => e.key === 'Enter' && handleCardClick('waste')}\\n\\t\\t\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t\\t\\t\\t<Card {card} faceUp={true} />\\n\\t\\t\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t\\t<div class=\\"empty-pile\\"></div>\\n\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<div class=\\"spacer\\"></div>\\n\\n\\t\\t\\t<!-- Foundations -->\\n\\t\\t\\t<div class=\\"foundations\\">\\n\\t\\t\\t\\t{#each $foundations as foundation, i}\\n\\t\\t\\t\\t\\t<div\\n\\t\\t\\t\\t\\t\\tclass=\\"foundation\\"\\n\\t\\t\\t\\t\\t\\ton:dragover={(e) => e.preventDefault()}\\n\\t\\t\\t\\t\\t\\ton:drop={() => handleDrop('foundation', i)}\\n\\t\\t\\t\\t\\t\\trole=\\"button\\"\\n\\t\\t\\t\\t\\t\\ttabindex=\\"0\\"\\n\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t\\t{#if foundation.cards.length > 0}\\n\\t\\t\\t\\t\\t\\t\\t<Card card={foundation.cards[foundation.cards.length - 1]} faceUp={true} />\\n\\t\\t\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"empty-pile foundation-suit\\">\\n\\t\\t\\t\\t\\t\\t\\t\\t{#if foundation.suit === 'heart'}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t♥\\n\\t\\t\\t\\t\\t\\t\\t\\t{:else if foundation.suit === 'diamond'}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t♦\\n\\t\\t\\t\\t\\t\\t\\t\\t{:else if foundation.suit === 'club'}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t♣\\n\\t\\t\\t\\t\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t♠\\n\\t\\t\\t\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t{/each}\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\n\\t\\t<!-- Tableau -->\\n\\t\\t<div class=\\"tableau\\">\\n\\t\\t\\t{#each $tableau as pile, i}\\n\\t\\t\\t\\t<div\\n\\t\\t\\t\\t\\tclass=\\"tableau-pile\\"\\n\\t\\t\\t\\t\\ton:dragover={(e) => e.preventDefault()}\\n\\t\\t\\t\\t\\ton:drop={() => handleDrop('tableau', i)}\\n\\t\\t\\t\\t\\trole=\\"button\\"\\n\\t\\t\\t\\t\\ttabindex=\\"0\\"\\n\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t{#if pile.length === 0}\\n\\t\\t\\t\\t\\t\\t<div class=\\"empty-pile tableau-empty\\"></div>\\n\\t\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t\\t{#each pile as card, cardIndex}\\n\\t\\t\\t\\t\\t\\t\\t<div\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"tableau-card\\"\\n\\t\\t\\t\\t\\t\\t\\t\\tstyle=\\"top: {cardIndex * 25}px\\"\\n\\t\\t\\t\\t\\t\\t\\t\\tdraggable={$revealedTableau[i][cardIndex]}\\n\\t\\t\\t\\t\\t\\t\\t\\ton:dragstart={() => handleDragStart('tableau', i, cardIndex)}\\n\\t\\t\\t\\t\\t\\t\\t\\ton:click={() => handleCardClick('tableau', i, cardIndex)}\\n\\t\\t\\t\\t\\t\\t\\t\\trole=\\"button\\"\\n\\t\\t\\t\\t\\t\\t\\t\\ttabindex={$revealedTableau[i][cardIndex] ? 0 : -1}\\n\\t\\t\\t\\t\\t\\t\\t\\ton:keydown={(e) => e.key === 'Enter' && handleCardClick('tableau', i, cardIndex)}\\n\\t\\t\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t\\t\\t\\t<Card {card} faceUp={$revealedTableau[i][cardIndex]} />\\n\\t\\t\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t{/each}\\n\\t\\t</div>\\n\\n\\t\\t{#if $isWon}\\n\\t\\t\\t<div class=\\"win-overlay\\">\\n\\t\\t\\t\\t<div class=\\"win-message\\">\\n\\t\\t\\t\\t\\t<h2>🎉 Congratulations! 🎉</h2>\\n\\t\\t\\t\\t\\t<p>You won in {$moves} moves!</p>\\n\\t\\t\\t\\t\\t<Button onclick={() => game.newGame()} variant=\\"stop\\">Play Again</Button>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\t\\t{/if}\\n\\t</div>\\n</main>\\n\\n<style>\\n\\tmain {\\n\\t\\tmin-height: 100dvh;\\n\\t\\twidth: 100dvw;\\n\\t\\tbackground: radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);\\n\\t\\tpadding: 20px;\\n\\t\\toverflow-x: hidden;\\n\\t}\\n\\n\\t.game-container {\\n\\t\\tmax-width: 1200px;\\n\\t\\tmargin: 0 auto;\\n\\t}\\n\\n\\t.header {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: space-between;\\n\\t\\talign-items: center;\\n\\t\\tmargin-bottom: 2rem;\\n\\t\\tflex-wrap: wrap;\\n\\t\\tgap: 1rem;\\n\\t}\\n\\n\\th1 {\\n\\t\\tfont-size: 2rem;\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin: 0;\\n\\t\\ttext-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);\\n\\t}\\n\\n\\t.stats {\\n\\t\\tcolor: #e8eaed;\\n\\t\\tfont-size: 1.2rem;\\n\\t}\\n\\n\\t.actions {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 0.5rem;\\n\\t}\\n\\n\\t.top-row {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: space-between;\\n\\t\\tmargin-bottom: 3rem;\\n\\t\\tgap: 1rem;\\n\\t}\\n\\n\\t.stock-area {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 1rem;\\n\\t}\\n\\n\\t.stock,\\n\\t.waste,\\n\\t.foundation {\\n\\t\\tposition: relative;\\n\\t\\twidth: 80px;\\n\\t\\theight: 110px;\\n\\t\\tborder-radius: 8px;\\n\\t\\tcursor: pointer;\\n\\t}\\n\\n\\t.stock {\\n\\t\\tborder: 2px dashed rgba(255, 215, 0, 0.3);\\n\\t}\\n\\n\\t.waste {\\n\\t\\tposition: relative;\\n\\t\\twidth: 140px;\\n\\t}\\n\\n\\t.waste-card {\\n\\t\\tposition: absolute;\\n\\t\\ttop: 0;\\n\\t}\\n\\n\\t.stock-count {\\n\\t\\tposition: absolute;\\n\\t\\ttop: 50%;\\n\\t\\tleft: 50%;\\n\\t\\ttransform: translate(-50%, -50%);\\n\\t\\tcolor: goldenrod;\\n\\t\\tfont-weight: bold;\\n\\t\\tfont-size: 1.5rem;\\n\\t\\ttext-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);\\n\\t\\tpointer-events: none;\\n\\t}\\n\\n\\t.spacer {\\n\\t\\tflex-grow: 1;\\n\\t}\\n\\n\\t.foundations {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 1rem;\\n\\t}\\n\\n\\t.foundation {\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.3);\\n\\t}\\n\\n\\t.empty-pile {\\n\\t\\twidth: 100%;\\n\\t\\theight: 100%;\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\tbackground: rgba(0, 0, 0, 0.3);\\n\\t\\tborder-radius: 8px;\\n\\t\\tfont-size: 2rem;\\n\\t\\tcolor: rgba(255, 215, 0, 0.3);\\n\\t}\\n\\n\\t.foundation-suit {\\n\\t\\tfont-size: 3rem;\\n\\t}\\n\\n\\t.tableau {\\n\\t\\tdisplay: grid;\\n\\t\\tgrid-template-columns: repeat(7, 1fr);\\n\\t\\tgap: 1rem;\\n\\t\\tmin-height: 400px;\\n\\t}\\n\\n\\t.tableau-pile {\\n\\t\\tposition: relative;\\n\\t\\tmin-height: 110px;\\n\\t}\\n\\n\\t.tableau-card {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\tcursor: pointer;\\n\\t}\\n\\n\\t.tableau-empty {\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.3);\\n\\t}\\n\\n\\t.win-overlay {\\n\\t\\tposition: fixed;\\n\\t\\ttop: 0;\\n\\t\\tleft: 0;\\n\\t\\twidth: 100%;\\n\\t\\theight: 100%;\\n\\t\\tbackground: rgba(0, 0, 0, 0.8);\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\tz-index: 1000;\\n\\t}\\n\\n\\t.win-message {\\n\\t\\tbackground: rgba(0, 0, 0, 0.95);\\n\\t\\tborder: 3px solid goldenrod;\\n\\t\\tborder-radius: 12px;\\n\\t\\tpadding: 3rem;\\n\\t\\ttext-align: center;\\n\\t\\tanimation: celebrate 0.5s ease-out;\\n\\t}\\n\\n\\t@keyframes celebrate {\\n\\t\\tfrom {\\n\\t\\t\\ttransform: scale(0.5);\\n\\t\\t\\topacity: 0;\\n\\t\\t}\\n\\t\\tto {\\n\\t\\t\\ttransform: scale(1);\\n\\t\\t\\topacity: 1;\\n\\t\\t}\\n\\t}\\n\\n\\t.win-message h2 {\\n\\t\\tcolor: goldenrod;\\n\\t\\tfont-size: 2.5rem;\\n\\t\\tmargin-bottom: 1rem;\\n\\t}\\n\\n\\t.win-message p {\\n\\t\\tcolor: #e8eaed;\\n\\t\\tfont-size: 1.3rem;\\n\\t\\tmargin-bottom: 2rem;\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\t.header {\\n\\t\\t\\tflex-direction: column;\\n\\t\\t\\talign-items: flex-start;\\n\\t\\t}\\n\\n\\t\\th1 {\\n\\t\\t\\tfont-size: 1.5rem;\\n\\t\\t}\\n\\n\\t\\t.top-row {\\n\\t\\t\\tflex-direction: column;\\n\\t\\t}\\n\\n\\t\\t.tableau {\\n\\t\\t\\tgrid-template-columns: repeat(4, 1fr);\\n\\t\\t\\tgap: 0.5rem;\\n\\t\\t}\\n\\n\\t\\t.stock,\\n\\t\\t.waste,\\n\\t\\t.foundation {\\n\\t\\t\\twidth: 60px;\\n\\t\\t\\theight: 85px;\\n\\t\\t}\\n\\n\\t\\t.waste {\\n\\t\\t\\twidth: 110px;\\n\\t\\t}\\n\\n\\t\\t.foundations {\\n\\t\\t\\tgap: 0.5rem;\\n\\t\\t}\\n\\n\\t\\t.stock-area {\\n\\t\\t\\tgap: 0.5rem;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAqMC,gCAAK,CACJ,UAAU,CAAE,MAAM,CAClB,KAAK,CAAE,MAAM,CACb,UAAU,CAAE,gBAAgB,MAAM,CAAC,EAAE,CAAC,MAAM,CAAC,CAAC,OAAO,CAAC,CAAC,OAAO,CAAC,GAAG,CAAC,CAAC,OAAO,CAAC,CAC5E,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,MACb,CAEA,2CAAgB,CACf,SAAS,CAAE,MAAM,CACjB,MAAM,CAAE,CAAC,CAAC,IACX,CAEA,mCAAQ,CACP,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,aAAa,CAC9B,WAAW,CAAE,MAAM,CACnB,aAAa,CAAE,IAAI,CACnB,SAAS,CAAE,IAAI,CACf,GAAG,CAAE,IACN,CAEA,8BAAG,CACF,SAAS,CAAE,IAAI,CACf,KAAK,CAAE,SAAS,CAChB,MAAM,CAAE,CAAC,CACT,WAAW,CAAE,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAC3C,CAEA,kCAAO,CACN,KAAK,CAAE,OAAO,CACd,SAAS,CAAE,MACZ,CAEA,oCAAS,CACR,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,MACN,CAEA,oCAAS,CACR,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,aAAa,CAC9B,aAAa,CAAE,IAAI,CACnB,GAAG,CAAE,IACN,CAEA,uCAAY,CACX,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,IACN,CAEA,kCAAM,CACN,kCAAM,CACN,uCAAY,CACX,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,KAAK,CACb,aAAa,CAAE,GAAG,CAClB,MAAM,CAAE,OACT,CAEA,kCAAO,CACN,MAAM,CAAE,GAAG,CAAC,MAAM,CAAC,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CACzC,CAEA,kCAAO,CACN,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,KACR,CAEA,uCAAY,CACX,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CACN,CAEA,wCAAa,CACZ,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,GAAG,CACR,IAAI,CAAE,GAAG,CACT,SAAS,CAAE,UAAU,IAAI,CAAC,CAAC,IAAI,CAAC,CAChC,KAAK,CAAE,SAAS,CAChB,WAAW,CAAE,IAAI,CACjB,SAAS,CAAE,MAAM,CACjB,WAAW,CAAE,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAC3C,cAAc,CAAE,IACjB,CAEA,mCAAQ,CACP,SAAS,CAAE,CACZ,CAEA,wCAAa,CACZ,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,IACN,CAEA,uCAAY,CACX,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CACxC,CAEA,uCAAY,CACX,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,UAAU,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAC9B,aAAa,CAAE,GAAG,CAClB,SAAS,CAAE,IAAI,CACf,KAAK,CAAE,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAC7B,CAEA,4CAAiB,CAChB,SAAS,CAAE,IACZ,CAEA,oCAAS,CACR,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,OAAO,CAAC,CAAC,CAAC,GAAG,CAAC,CACrC,GAAG,CAAE,IAAI,CACT,UAAU,CAAE,KACb,CAEA,yCAAc,CACb,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KACb,CAEA,yCAAc,CACb,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,MAAM,CAAE,OACT,CAEA,0CAAe,CACd,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CACxC,CAEA,wCAAa,CACZ,QAAQ,CAAE,KAAK,CACf,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAC9B,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,OAAO,CAAE,IACV,CAEA,wCAAa,CACZ,UAAU,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,CAC/B,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,SAAS,CAC3B,aAAa,CAAE,IAAI,CACnB,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,MAAM,CAClB,SAAS,CAAE,uBAAS,CAAC,IAAI,CAAC,QAC3B,CAEA,WAAW,uBAAU,CACpB,IAAK,CACJ,SAAS,CAAE,MAAM,GAAG,CAAC,CACrB,OAAO,CAAE,CACV,CACA,EAAG,CACF,SAAS,CAAE,MAAM,CAAC,CAAC,CACnB,OAAO,CAAE,CACV,CACD,CAEA,0BAAY,CAAC,gBAAG,CACf,KAAK,CAAE,SAAS,CAChB,SAAS,CAAE,MAAM,CACjB,aAAa,CAAE,IAChB,CAEA,0BAAY,CAAC,eAAE,CACd,KAAK,CAAE,OAAO,CACd,SAAS,CAAE,MAAM,CACjB,aAAa,CAAE,IAChB,CAEA,MAAO,YAAY,KAAK,CAAE,CACzB,mCAAQ,CACP,cAAc,CAAE,MAAM,CACtB,WAAW,CAAE,UACd,CAEA,8BAAG,CACF,SAAS,CAAE,MACZ,CAEA,oCAAS,CACR,cAAc,CAAE,MACjB,CAEA,oCAAS,CACR,qBAAqB,CAAE,OAAO,CAAC,CAAC,CAAC,GAAG,CAAC,CACrC,GAAG,CAAE,MACN,CAEA,kCAAM,CACN,kCAAM,CACN,uCAAY,CACX,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IACT,CAEA,kCAAO,CACN,KAAK,CAAE,KACR,CAEA,wCAAa,CACZ,GAAG,CAAE,MACN,CAEA,uCAAY,CACX,GAAG,CAAE,MACN,CACD"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $foundations, $$unsubscribe_foundations;
  let $tableau, $$unsubscribe_tableau;
  let $moves, $$unsubscribe_moves;
  let $autoPlayAvailable, $$unsubscribe_autoPlayAvailable;
  let $stock, $$unsubscribe_stock;
  let $waste, $$unsubscribe_waste;
  let $revealedTableau, $$unsubscribe_revealedTableau;
  let $isWon, $$unsubscribe_isWon;
  const game = createKlondikeStore();
  const { tableau, foundations, stock, waste, revealedTableau, moves, isWon, autoPlayAvailable } = game;
  $$unsubscribe_tableau = subscribe(tableau, (value) => $tableau = value);
  $$unsubscribe_foundations = subscribe(foundations, (value) => $foundations = value);
  $$unsubscribe_stock = subscribe(stock, (value) => $stock = value);
  $$unsubscribe_waste = subscribe(waste, (value) => $waste = value);
  $$unsubscribe_revealedTableau = subscribe(revealedTableau, (value) => $revealedTableau = value);
  $$unsubscribe_moves = subscribe(moves, (value) => $moves = value);
  $$unsubscribe_isWon = subscribe(isWon, (value) => $isWon = value);
  $$unsubscribe_autoPlayAvailable = subscribe(autoPlayAvailable, (value) => $autoPlayAvailable = value);
  $$result.css.add(css);
  $$unsubscribe_foundations();
  $$unsubscribe_tableau();
  $$unsubscribe_moves();
  $$unsubscribe_autoPlayAvailable();
  $$unsubscribe_stock();
  $$unsubscribe_waste();
  $$unsubscribe_revealedTableau();
  $$unsubscribe_isWon();
  return `${validate_component(CardsDefinitions, "CardsDefinitions").$$render($$result, {}, {}, {})} <main class="svelte-7z8c47"><div class="game-container svelte-7z8c47"> <div class="header svelte-7z8c47"><h1 class="svelte-7z8c47" data-svelte-h="svelte-1lk2t04">🃏 Klondike Solitaire</h1> <div class="stats svelte-7z8c47"><span>Moves: ${escape($moves)}</span></div> <div class="actions svelte-7z8c47">${$autoPlayAvailable ? `${validate_component(Button, "Button").$$render(
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
  )}</div></div>  <div class="top-row svelte-7z8c47"> <div class="stock-area svelte-7z8c47"><div class="stock svelte-7z8c47" role="button" tabindex="0">${$stock.length > 0 ? `${validate_component(SolitaireCard, "Card").$$render($$result, { card: $stock[0], faceUp: false }, {}, {})} <div class="stock-count svelte-7z8c47">${escape($stock.length)}</div>` : `<div class="empty-pile svelte-7z8c47" data-svelte-h="svelte-5nneft">♻️</div>`}</div>  <div class="waste svelte-7z8c47" role="region" aria-label="Waste pile">${$waste.length > 0 ? `${each($waste.slice(-3), (card, i) => {
    return `<div class="waste-card svelte-7z8c47" style="${"left: " + escape(i * 20, true) + "px"}" draggable="true" role="button" tabindex="0">${validate_component(SolitaireCard, "Card").$$render($$result, { card, faceUp: true }, {}, {})} </div>`;
  })}` : `<div class="empty-pile svelte-7z8c47"></div>`}</div></div> <div class="spacer svelte-7z8c47"></div>  <div class="foundations svelte-7z8c47">${each($foundations, (foundation, i) => {
    return `<div class="foundation svelte-7z8c47" role="button" tabindex="0">${foundation.cards.length > 0 ? `${validate_component(SolitaireCard, "Card").$$render(
      $$result,
      {
        card: foundation.cards[foundation.cards.length - 1],
        faceUp: true
      },
      {},
      {}
    )}` : `<div class="empty-pile foundation-suit svelte-7z8c47">${foundation.suit === "heart" ? `♥` : `${foundation.suit === "diamond" ? `♦` : `${foundation.suit === "club" ? `♣` : `♠`}`}`} </div>`} </div>`;
  })}</div></div>  <div class="tableau svelte-7z8c47">${each($tableau, (pile, i) => {
    return `<div class="tableau-pile svelte-7z8c47" role="button" tabindex="0">${pile.length === 0 ? `<div class="empty-pile tableau-empty svelte-7z8c47"></div>` : `${each(pile, (card, cardIndex) => {
      return `<div class="tableau-card svelte-7z8c47" style="${"top: " + escape(cardIndex * 25, true) + "px"}"${add_attribute("draggable", $revealedTableau[i][cardIndex], 0)} role="button"${add_attribute("tabindex", $revealedTableau[i][cardIndex] ? 0 : -1, 0)}>${validate_component(SolitaireCard, "Card").$$render(
        $$result,
        {
          card,
          faceUp: $revealedTableau[i][cardIndex]
        },
        {},
        {}
      )} </div>`;
    })}`} </div>`;
  })}</div> ${$isWon ? `<div class="win-overlay svelte-7z8c47"><div class="win-message svelte-7z8c47"><h2 class="svelte-7z8c47" data-svelte-h="svelte-1e2z9mw">🎉 Congratulations! 🎉</h2> <p class="svelte-7z8c47">You won in ${escape($moves)} moves!</p> ${validate_component(Button, "Button").$$render(
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
