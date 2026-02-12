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
function canPlaceOnTableau(card, onCard) {
  if (!onCard) {
    return true;
  }
  return getRankValue(card.rank) === getRankValue(onCard.rank) - 1;
}
function isSequenceComplete(cards) {
  if (cards.length !== 13) return false;
  const suit = cards[0].suit;
  for (let i = 0; i < 13; i++) {
    if (cards[i].suit !== suit || getRankValue(cards[i].rank) !== 13 - i) {
      return false;
    }
  }
  return true;
}
function findCompleteSequences(pile, revealed) {
  const sequences = [];
  for (let i = 0; i < pile.length; i++) {
    if (!revealed[i]) continue;
    if (pile.length - i >= 13 && pile[i].rank === "king") {
      const sequence = pile.slice(i, i + 13);
      if (isSequenceComplete(sequence)) {
        sequences.push(i);
      }
    }
  }
  return sequences;
}
function isValidSequence(cards) {
  if (cards.length === 0) return true;
  const suit = cards[0].suit;
  for (let i = 1; i < cards.length; i++) {
    if (cards[i].suit !== suit || getRankValue(cards[i].rank) !== getRankValue(cards[i - 1].rank) - 1) {
      return false;
    }
  }
  return true;
}
class SpiderEngine {
  tableau;
  foundations;
  stock;
  revealedTableau;
  moves;
  constructor() {
    this.tableau = Array(10).fill(null).map(() => []);
    this.foundations = [];
    this.stock = [];
    this.revealedTableau = Array(10).fill(null).map(() => []);
    this.moves = 0;
  }
  newGame() {
    const deck1 = new Deck();
    const deck2 = new Deck();
    const combinedDeck = [...deck1.cards, ...deck2.cards];
    for (let i = combinedDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combinedDeck[i], combinedDeck[j]] = [combinedDeck[j], combinedDeck[i]];
    }
    this.tableau = Array(10).fill(null).map(() => []);
    this.revealedTableau = Array(10).fill(null).map(() => []);
    let cardIndex = 0;
    for (let col = 0; col < 10; col++) {
      const cardCount = col < 4 ? 6 : 5;
      for (let row = 0; row < cardCount; row++) {
        this.tableau[col].push(combinedDeck[cardIndex]);
        this.revealedTableau[col].push(row === cardCount - 1);
        cardIndex++;
      }
    }
    this.stock = combinedDeck.slice(cardIndex);
    this.foundations = [];
    this.moves = 0;
    this.checkForCompleteSequences();
  }
  dealFromStock() {
    if (this.stock.length < 10) return false;
    const allPilesHaveCards = this.tableau.every((pile) => pile.length > 0);
    if (!allPilesHaveCards) return false;
    for (let i = 0; i < 10; i++) {
      const card = this.stock.shift();
      if (card) {
        this.tableau[i].push(card);
        this.revealedTableau[i].push(true);
      }
    }
    this.moves++;
    this.checkForCompleteSequences();
    return true;
  }
  checkForCompleteSequences() {
    let foundSequence = false;
    for (let i = 0; i < 10; i++) {
      const pile = this.tableau[i];
      const revealed = this.revealedTableau[i];
      const sequences = findCompleteSequences(pile, revealed);
      if (sequences.length > 0) {
        foundSequence = true;
        const seqIndex = sequences[0];
        const completedSequence = pile.splice(seqIndex, 13);
        this.foundations.push(completedSequence);
        revealed.splice(seqIndex, 13);
        if (pile.length > 0 && !revealed[revealed.length - 1]) {
          revealed[revealed.length - 1] = true;
        }
      }
    }
    if (foundSequence) {
      this.checkForCompleteSequences();
    }
  }
  moveTableauToTableau(fromIndex, cardIndex, toIndex) {
    if (fromIndex === toIndex) return false;
    const fromPile = this.tableau[fromIndex];
    const toPile = this.tableau[toIndex];
    if (cardIndex < 0 || cardIndex >= fromPile.length) return false;
    if (!this.revealedTableau[fromIndex][cardIndex]) return false;
    const movingCards = fromPile.slice(cardIndex);
    const targetCard = toPile.length > 0 ? toPile[toPile.length - 1] : null;
    if (!canPlaceOnTableau(movingCards[0], targetCard)) return false;
    const revealedMovingCards = this.revealedTableau[fromIndex].slice(cardIndex);
    if (!isValidSequence(movingCards)) {
      if (movingCards.length > 1) return false;
    }
    this.tableau[fromIndex] = fromPile.slice(0, cardIndex);
    this.tableau[toIndex].push(...movingCards);
    if (this.tableau[fromIndex].length > 0) {
      this.revealedTableau[fromIndex][this.tableau[fromIndex].length - 1] = true;
    }
    this.revealedTableau[fromIndex] = this.revealedTableau[fromIndex].slice(0, cardIndex);
    this.revealedTableau[toIndex].push(...revealedMovingCards);
    this.moves++;
    this.checkForCompleteSequences();
    return true;
  }
  canAutoPlay() {
    for (let i = 0; i < this.tableau.length; i++) {
      const pile = this.tableau[i];
      const revealed = this.revealedTableau[i];
      const sequences = findCompleteSequences(pile, revealed);
      if (sequences.length > 0) {
        return true;
      }
    }
    return false;
  }
  autoPlay() {
    this.checkForCompleteSequences();
    return this.canAutoPlay();
  }
  getHint() {
    for (let from = 0; from < 10; from++) {
      const fromPile = this.tableau[from];
      const revealed = this.revealedTableau[from];
      for (let cardIdx = 0; cardIdx < fromPile.length; cardIdx++) {
        if (!revealed[cardIdx]) continue;
        const movingCards = fromPile.slice(cardIdx);
        for (let to = 0; to < 10; to++) {
          if (from === to) continue;
          const toPile = this.tableau[to];
          const targetCard = toPile.length > 0 ? toPile[toPile.length - 1] : null;
          if (canPlaceOnTableau(movingCards[0], targetCard)) {
            if (movingCards.length === 1 || isValidSequence(movingCards)) {
              return { from, cardIndex: cardIdx, to };
            }
          }
        }
      }
    }
    return null;
  }
  canDealFromStock() {
    if (this.stock.length < 10) return false;
    return this.tableau.every((pile) => pile.length > 0);
  }
  isWon() {
    return this.foundations.length === 8;
  }
  applyMove(move) {
    switch (move.type) {
      case "newGame":
        this.newGame();
        break;
      case "dealFromStock":
        this.dealFromStock();
        break;
      case "moveTableauToTableau":
        this.moveTableauToTableau(move.fromIndex, move.cardIndex, move.toIndex);
        break;
    }
  }
  getState() {
    return {
      tableau: this.tableau.map((pile) => [...pile]),
      foundations: this.foundations.map((pile) => [...pile]),
      stock: [...this.stock],
      revealedTableau: this.revealedTableau.map((revealed) => [...revealed]),
      moves: this.moves
    };
  }
}
function createSpiderStore() {
  const engine = new SpiderEngine();
  const state = writable(engine.getState());
  function sync() {
    state.set(engine.getState());
  }
  const newGame = () => {
    engine.applyMove({ type: "newGame" });
    sync();
  };
  const dealFromStock = () => {
    const result = engine.dealFromStock();
    sync();
    return result;
  };
  const moveTableauToTableau = (fromIndex, cardIndex, toIndex) => {
    const result = engine.moveTableauToTableau(fromIndex, cardIndex, toIndex);
    sync();
    return result;
  };
  const autoPlay = () => {
    const result = engine.autoPlay();
    sync();
    return result;
  };
  const getHint = () => {
    return engine.getHint();
  };
  const tableau = derived(state, ($state) => $state.tableau);
  const foundations = derived(state, ($state) => $state.foundations);
  const stock = derived(state, ($state) => $state.stock);
  const revealedTableau = derived(state, ($state) => $state.revealedTableau);
  const moves = derived(state, ($state) => $state.moves);
  const isWon = derived(state, ($state) => $state.foundations.length === 8);
  const canDealFromStock = derived(state, () => engine.canDealFromStock());
  const autoPlayAvailable = derived(state, () => engine.canAutoPlay());
  return {
    state,
    tableau,
    foundations,
    stock,
    revealedTableau,
    moves,
    isWon,
    canDealFromStock,
    autoPlayAvailable,
    newGame,
    dealFromStock,
    moveTableauToTableau,
    autoPlay,
    getHint
  };
}
const css = {
  code: "main.svelte-7s7d1r.svelte-7s7d1r{min-height:100dvh;width:100dvw;background:radial-gradient(circle at center, #1a4d2e, #0d2818 50%, #000000);padding:20px;overflow-x:hidden}.game-container.svelte-7s7d1r.svelte-7s7d1r{max-width:1400px;margin:0 auto}.header.svelte-7s7d1r.svelte-7s7d1r{display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;flex-wrap:wrap;gap:1rem}h1.svelte-7s7d1r.svelte-7s7d1r{font-size:2rem;color:goldenrod;margin:0;text-shadow:2px 2px 4px rgba(0, 0, 0, 0.5)}.stats.svelte-7s7d1r.svelte-7s7d1r{display:flex;gap:1.5rem;color:#e8eaed;font-size:1.2rem}.actions.svelte-7s7d1r.svelte-7s7d1r{display:flex;gap:0.5rem;flex-wrap:wrap}.top-row.svelte-7s7d1r.svelte-7s7d1r{display:flex;justify-content:space-between;margin-bottom:3rem;gap:1rem;align-items:flex-start}.stock-area.svelte-7s7d1r.svelte-7s7d1r{display:flex;gap:1rem}.stock.svelte-7s7d1r.svelte-7s7d1r{position:relative;width:80px;height:110px;border-radius:8px;cursor:pointer;border:2px dashed rgba(255, 215, 0, 0.3)}.stock.disabled.svelte-7s7d1r.svelte-7s7d1r{opacity:0.5;cursor:not-allowed}.stock-pile.svelte-7s7d1r.svelte-7s7d1r{position:relative;width:100%;height:100%}.stock-layer.svelte-7s7d1r.svelte-7s7d1r{position:absolute}.stock-count.svelte-7s7d1r.svelte-7s7d1r{position:absolute;bottom:5px;right:5px;background:rgba(0, 0, 0, 0.8);color:goldenrod;font-weight:bold;font-size:1rem;padding:2px 6px;border-radius:4px;pointer-events:none}.spacer.svelte-7s7d1r.svelte-7s7d1r{flex-grow:1}.foundations.svelte-7s7d1r.svelte-7s7d1r{display:flex;gap:0.5rem;flex-wrap:wrap}.foundation.svelte-7s7d1r.svelte-7s7d1r{position:relative;width:80px;height:110px;border-radius:8px}.foundation-badge.svelte-7s7d1r.svelte-7s7d1r{position:absolute;top:5px;right:5px;background:rgba(34, 197, 94, 0.9);color:white;font-weight:bold;font-size:0.9rem;padding:2px 6px;border-radius:4px;pointer-events:none}.foundation-placeholder.svelte-7s7d1r.svelte-7s7d1r{border:2px solid rgba(255, 215, 0, 0.2)}.foundation-icon.svelte-7s7d1r.svelte-7s7d1r{font-size:2rem;opacity:0.3}.empty-pile.svelte-7s7d1r.svelte-7s7d1r{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0, 0, 0, 0.3);border-radius:8px;font-size:2rem;color:rgba(255, 215, 0, 0.3)}.tableau.svelte-7s7d1r.svelte-7s7d1r{display:grid;grid-template-columns:repeat(10, 1fr);gap:0.5rem;min-height:500px}.tableau-pile.svelte-7s7d1r.svelte-7s7d1r{position:relative;min-height:110px}.tableau-card.svelte-7s7d1r.svelte-7s7d1r{position:absolute;left:0;cursor:pointer;transition:transform 0.2s}.tableau-card.svelte-7s7d1r.svelte-7s7d1r:hover{transform:translateY(-5px);z-index:10}.tableau-card.hinted.svelte-7s7d1r.svelte-7s7d1r{animation:svelte-7s7d1r-pulse 1s infinite}.tableau-card.hint-target.svelte-7s7d1r.svelte-7s7d1r{animation:svelte-7s7d1r-glow 1s infinite}@keyframes svelte-7s7d1r-pulse{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-10px) scale(1.05)}}@keyframes svelte-7s7d1r-glow{0%,100%{box-shadow:0 0 10px rgba(255, 215, 0, 0.5)}50%{box-shadow:0 0 20px rgba(255, 215, 0, 1)}}.tableau-empty.svelte-7s7d1r.svelte-7s7d1r{border:2px solid rgba(255, 215, 0, 0.3)}.win-overlay.svelte-7s7d1r.svelte-7s7d1r{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0, 0, 0, 0.8);display:flex;align-items:center;justify-content:center;z-index:1000}.win-message.svelte-7s7d1r.svelte-7s7d1r{background:rgba(0, 0, 0, 0.95);border:3px solid goldenrod;border-radius:12px;padding:3rem;text-align:center;animation:svelte-7s7d1r-celebrate 0.5s ease-out}@keyframes svelte-7s7d1r-celebrate{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}.win-message.svelte-7s7d1r h2.svelte-7s7d1r{color:goldenrod;font-size:2.5rem;margin-bottom:1rem}.win-message.svelte-7s7d1r p.svelte-7s7d1r{color:#e8eaed;font-size:1.3rem;margin-bottom:2rem}@media(max-width: 1200px){.tableau.svelte-7s7d1r.svelte-7s7d1r{grid-template-columns:repeat(5, 1fr)}.foundations.svelte-7s7d1r.svelte-7s7d1r{gap:0.3rem}.foundation.svelte-7s7d1r.svelte-7s7d1r{width:60px;height:85px}}@media(max-width: 768px){.header.svelte-7s7d1r.svelte-7s7d1r{flex-direction:column;align-items:flex-start}h1.svelte-7s7d1r.svelte-7s7d1r{font-size:1.5rem}.stats.svelte-7s7d1r.svelte-7s7d1r{font-size:1rem;gap:1rem}.top-row.svelte-7s7d1r.svelte-7s7d1r{flex-direction:column}.tableau.svelte-7s7d1r.svelte-7s7d1r{grid-template-columns:repeat(5, 1fr);gap:0.3rem}.stock.svelte-7s7d1r.svelte-7s7d1r,.foundation.svelte-7s7d1r.svelte-7s7d1r{width:60px;height:85px}.tableau-card.svelte-7s7d1r.svelte-7s7d1r{top:auto}.tableau-card.svelte-7s7d1r.svelte-7s7d1r:nth-child(n){top:calc((var(--card-index, 0)) * 20px)}}@media(max-width: 480px){main.svelte-7s7d1r.svelte-7s7d1r{padding:10px}.tableau.svelte-7s7d1r.svelte-7s7d1r{grid-template-columns:repeat(5, 1fr);gap:0.2rem}.stock.svelte-7s7d1r.svelte-7s7d1r,.foundation.svelte-7s7d1r.svelte-7s7d1r{width:50px;height:70px}}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import \\"../../global.css\\";\\nimport { createSpiderStore } from \\"$lib/adapters/createSpiderStore\\";\\nimport CardsDefinitions from \\"$lib/Components/CardsDefinitions.svelte\\";\\nimport Card from \\"$lib/Components/SolitaireCard.svelte\\";\\nimport Button from \\"$lib/Components/Button.svelte\\";\\nimport { onMount } from \\"svelte\\";\\nconst game = createSpiderStore();\\nconst {\\n  tableau,\\n  foundations,\\n  stock,\\n  revealedTableau,\\n  moves,\\n  isWon,\\n  canDealFromStock,\\n  autoPlayAvailable\\n} = game;\\nlet draggedCard = null;\\nlet hintMove = null;\\nonMount(() => {\\n  game.newGame();\\n});\\nfunction handleDragStart(index, cardIndex) {\\n  draggedCard = { index, cardIndex };\\n  hintMove = null;\\n}\\nfunction handleDrop(toIndex) {\\n  if (!draggedCard) return;\\n  game.moveTableauToTableau(draggedCard.index, draggedCard.cardIndex, toIndex);\\n  draggedCard = null;\\n}\\nfunction handleCardClick(index, cardIndex) {\\n  hintMove = null;\\n}\\nfunction showHint() {\\n  hintMove = game.getHint();\\n}\\n<\/script>\\n\\n<CardsDefinitions />\\n\\n<main>\\n\\t<div class=\\"game-container\\">\\n\\t\\t<!-- Header -->\\n\\t\\t<div class=\\"header\\">\\n\\t\\t\\t<h1>🕷️ Spider Solitaire</h1>\\n\\t\\t\\t<div class=\\"stats\\">\\n\\t\\t\\t\\t<span>Moves: {$moves}</span>\\n\\t\\t\\t\\t<span>Completed: {$foundations.length}/8</span>\\n\\t\\t\\t</div>\\n\\t\\t\\t<div class=\\"actions\\">\\n\\t\\t\\t\\t{#if $autoPlayAvailable}\\n\\t\\t\\t\\t\\t<Button onclick={() => game.autoPlay()} variant=\\"draw\\">Auto Play</Button>\\n\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t<Button onclick={showHint} variant=\\"draw\\">Hint</Button>\\n\\t\\t\\t\\t<Button onclick={() => game.newGame()} variant=\\"stop\\">New Game</Button>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\n\\t\\t<!-- Top Row: Stock and Foundations -->\\n\\t\\t<div class=\\"top-row\\">\\n\\t\\t\\t<!-- Stock -->\\n\\t\\t\\t<div class=\\"stock-area\\">\\n\\t\\t\\t\\t<div\\n\\t\\t\\t\\t\\tclass=\\"stock\\"\\n\\t\\t\\t\\t\\tclass:disabled={!$canDealFromStock}\\n\\t\\t\\t\\t\\ton:click={() => $canDealFromStock && game.dealFromStock()}\\n\\t\\t\\t\\t\\trole=\\"button\\"\\n\\t\\t\\t\\t\\ttabindex=\\"0\\"\\n\\t\\t\\t\\t\\ton:keydown={(e) => e.key === 'Enter' && $canDealFromStock && game.dealFromStock()}\\n\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t{#if $stock.length > 0}\\n\\t\\t\\t\\t\\t\\t<div class=\\"stock-pile\\">\\n\\t\\t\\t\\t\\t\\t\\t{#each Array(Math.min(5, Math.ceil($stock.length / 10))) as _, i}\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"stock-layer\\" style=\\"left: {i * 2}px; top: {i * 2}px;\\">\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<Card card={$stock[0]} faceUp={false} />\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t\\t\\t<div class=\\"stock-count\\">{Math.floor($stock.length / 10)}</div>\\n\\t\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t\\t<div class=\\"empty-pile\\">📦</div>\\n\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<div class=\\"spacer\\"></div>\\n\\n\\t\\t\\t<!-- Foundations -->\\n\\t\\t\\t<div class=\\"foundations\\">\\n\\t\\t\\t\\t{#each Array(8) as _, i}\\n\\t\\t\\t\\t\\t<div class=\\"foundation\\">\\n\\t\\t\\t\\t\\t\\t{#if i < $foundations.length}\\n\\t\\t\\t\\t\\t\\t\\t<Card card={$foundations[i][0]} faceUp={true} />\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"foundation-badge\\">✓</div>\\n\\t\\t\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"empty-pile foundation-placeholder\\">\\n\\t\\t\\t\\t\\t\\t\\t\\t<span class=\\"foundation-icon\\">🕷️</span>\\n\\t\\t\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t{/each}\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\n\\t\\t<!-- Tableau -->\\n\\t\\t<div class=\\"tableau\\">\\n\\t\\t\\t{#each $tableau as pile, i}\\n\\t\\t\\t\\t<div\\n\\t\\t\\t\\t\\tclass=\\"tableau-pile\\"\\n\\t\\t\\t\\t\\ton:dragover={(e) => e.preventDefault()}\\n\\t\\t\\t\\t\\ton:drop={() => handleDrop(i)}\\n\\t\\t\\t\\t\\trole=\\"button\\"\\n\\t\\t\\t\\t\\ttabindex=\\"0\\"\\n\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t{#if pile.length === 0}\\n\\t\\t\\t\\t\\t\\t<div class=\\"empty-pile tableau-empty\\"></div>\\n\\t\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t\\t{#each pile as card, cardIndex}\\n\\t\\t\\t\\t\\t\\t\\t{@const isRevealed = $revealedTableau[i][cardIndex]}\\n\\t\\t\\t\\t\\t\\t\\t{@const isHinted =\\n\\t\\t\\t\\t\\t\\t\\t\\thintMove && hintMove.from === i && hintMove.cardIndex === cardIndex}\\n\\t\\t\\t\\t\\t\\t\\t{@const isHintTarget = hintMove && hintMove.to === i && cardIndex === pile.length - 1}\\n\\t\\t\\t\\t\\t\\t\\t<div\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"tableau-card\\"\\n\\t\\t\\t\\t\\t\\t\\t\\tclass:hinted={isHinted}\\n\\t\\t\\t\\t\\t\\t\\t\\tclass:hint-target={isHintTarget}\\n\\t\\t\\t\\t\\t\\t\\t\\tstyle=\\"top: {cardIndex * 30}px\\"\\n\\t\\t\\t\\t\\t\\t\\t\\tdraggable={isRevealed}\\n\\t\\t\\t\\t\\t\\t\\t\\ton:dragstart={() => handleDragStart(i, cardIndex)}\\n\\t\\t\\t\\t\\t\\t\\t\\ton:click={() => handleCardClick(i, cardIndex)}\\n\\t\\t\\t\\t\\t\\t\\t\\trole=\\"button\\"\\n\\t\\t\\t\\t\\t\\t\\t\\ttabindex={isRevealed ? 0 : -1}\\n\\t\\t\\t\\t\\t\\t\\t\\ton:keydown={(e) => e.key === 'Enter' && handleCardClick(i, cardIndex)}\\n\\t\\t\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t\\t\\t\\t<Card {card} faceUp={isRevealed} />\\n\\t\\t\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t{/each}\\n\\t\\t</div>\\n\\n\\t\\t{#if $isWon}\\n\\t\\t\\t<div class=\\"win-overlay\\">\\n\\t\\t\\t\\t<div class=\\"win-message\\">\\n\\t\\t\\t\\t\\t<h2>🎉 Congratulations! 🎉</h2>\\n\\t\\t\\t\\t\\t<p>You completed all 8 sequences in {$moves} moves!</p>\\n\\t\\t\\t\\t\\t<Button onclick={() => game.newGame()} variant=\\"stop\\">Play Again</Button>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\t\\t{/if}\\n\\t</div>\\n</main>\\n\\n<style>\\n\\tmain {\\n\\t\\tmin-height: 100dvh;\\n\\t\\twidth: 100dvw;\\n\\t\\tbackground: radial-gradient(circle at center, #1a4d2e, #0d2818 50%, #000000);\\n\\t\\tpadding: 20px;\\n\\t\\toverflow-x: hidden;\\n\\t}\\n\\n\\t.game-container {\\n\\t\\tmax-width: 1400px;\\n\\t\\tmargin: 0 auto;\\n\\t}\\n\\n\\t.header {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: space-between;\\n\\t\\talign-items: center;\\n\\t\\tmargin-bottom: 2rem;\\n\\t\\tflex-wrap: wrap;\\n\\t\\tgap: 1rem;\\n\\t}\\n\\n\\th1 {\\n\\t\\tfont-size: 2rem;\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin: 0;\\n\\t\\ttext-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);\\n\\t}\\n\\n\\t.stats {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 1.5rem;\\n\\t\\tcolor: #e8eaed;\\n\\t\\tfont-size: 1.2rem;\\n\\t}\\n\\n\\t.actions {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 0.5rem;\\n\\t\\tflex-wrap: wrap;\\n\\t}\\n\\n\\t.top-row {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: space-between;\\n\\t\\tmargin-bottom: 3rem;\\n\\t\\tgap: 1rem;\\n\\t\\talign-items: flex-start;\\n\\t}\\n\\n\\t.stock-area {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 1rem;\\n\\t}\\n\\n\\t.stock {\\n\\t\\tposition: relative;\\n\\t\\twidth: 80px;\\n\\t\\theight: 110px;\\n\\t\\tborder-radius: 8px;\\n\\t\\tcursor: pointer;\\n\\t\\tborder: 2px dashed rgba(255, 215, 0, 0.3);\\n\\t}\\n\\n\\t.stock.disabled {\\n\\t\\topacity: 0.5;\\n\\t\\tcursor: not-allowed;\\n\\t}\\n\\n\\t.stock-pile {\\n\\t\\tposition: relative;\\n\\t\\twidth: 100%;\\n\\t\\theight: 100%;\\n\\t}\\n\\n\\t.stock-layer {\\n\\t\\tposition: absolute;\\n\\t}\\n\\n\\t.stock-count {\\n\\t\\tposition: absolute;\\n\\t\\tbottom: 5px;\\n\\t\\tright: 5px;\\n\\t\\tbackground: rgba(0, 0, 0, 0.8);\\n\\t\\tcolor: goldenrod;\\n\\t\\tfont-weight: bold;\\n\\t\\tfont-size: 1rem;\\n\\t\\tpadding: 2px 6px;\\n\\t\\tborder-radius: 4px;\\n\\t\\tpointer-events: none;\\n\\t}\\n\\n\\t.spacer {\\n\\t\\tflex-grow: 1;\\n\\t}\\n\\n\\t.foundations {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 0.5rem;\\n\\t\\tflex-wrap: wrap;\\n\\t}\\n\\n\\t.foundation {\\n\\t\\tposition: relative;\\n\\t\\twidth: 80px;\\n\\t\\theight: 110px;\\n\\t\\tborder-radius: 8px;\\n\\t}\\n\\n\\t.foundation-badge {\\n\\t\\tposition: absolute;\\n\\t\\ttop: 5px;\\n\\t\\tright: 5px;\\n\\t\\tbackground: rgba(34, 197, 94, 0.9);\\n\\t\\tcolor: white;\\n\\t\\tfont-weight: bold;\\n\\t\\tfont-size: 0.9rem;\\n\\t\\tpadding: 2px 6px;\\n\\t\\tborder-radius: 4px;\\n\\t\\tpointer-events: none;\\n\\t}\\n\\n\\t.foundation-placeholder {\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.2);\\n\\t}\\n\\n\\t.foundation-icon {\\n\\t\\tfont-size: 2rem;\\n\\t\\topacity: 0.3;\\n\\t}\\n\\n\\t.empty-pile {\\n\\t\\twidth: 100%;\\n\\t\\theight: 100%;\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\tbackground: rgba(0, 0, 0, 0.3);\\n\\t\\tborder-radius: 8px;\\n\\t\\tfont-size: 2rem;\\n\\t\\tcolor: rgba(255, 215, 0, 0.3);\\n\\t}\\n\\n\\t.tableau {\\n\\t\\tdisplay: grid;\\n\\t\\tgrid-template-columns: repeat(10, 1fr);\\n\\t\\tgap: 0.5rem;\\n\\t\\tmin-height: 500px;\\n\\t}\\n\\n\\t.tableau-pile {\\n\\t\\tposition: relative;\\n\\t\\tmin-height: 110px;\\n\\t}\\n\\n\\t.tableau-card {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\tcursor: pointer;\\n\\t\\ttransition: transform 0.2s;\\n\\t}\\n\\n\\t.tableau-card:hover {\\n\\t\\ttransform: translateY(-5px);\\n\\t\\tz-index: 10;\\n\\t}\\n\\n\\t.tableau-card.hinted {\\n\\t\\tanimation: pulse 1s infinite;\\n\\t}\\n\\n\\t.tableau-card.hint-target {\\n\\t\\tanimation: glow 1s infinite;\\n\\t}\\n\\n\\t@keyframes pulse {\\n\\t\\t0%,\\n\\t\\t100% {\\n\\t\\t\\ttransform: translateY(0) scale(1);\\n\\t\\t}\\n\\t\\t50% {\\n\\t\\t\\ttransform: translateY(-10px) scale(1.05);\\n\\t\\t}\\n\\t}\\n\\n\\t@keyframes glow {\\n\\t\\t0%,\\n\\t\\t100% {\\n\\t\\t\\tbox-shadow: 0 0 10px rgba(255, 215, 0, 0.5);\\n\\t\\t}\\n\\t\\t50% {\\n\\t\\t\\tbox-shadow: 0 0 20px rgba(255, 215, 0, 1);\\n\\t\\t}\\n\\t}\\n\\n\\t.tableau-empty {\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.3);\\n\\t}\\n\\n\\t.win-overlay {\\n\\t\\tposition: fixed;\\n\\t\\ttop: 0;\\n\\t\\tleft: 0;\\n\\t\\twidth: 100%;\\n\\t\\theight: 100%;\\n\\t\\tbackground: rgba(0, 0, 0, 0.8);\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\tz-index: 1000;\\n\\t}\\n\\n\\t.win-message {\\n\\t\\tbackground: rgba(0, 0, 0, 0.95);\\n\\t\\tborder: 3px solid goldenrod;\\n\\t\\tborder-radius: 12px;\\n\\t\\tpadding: 3rem;\\n\\t\\ttext-align: center;\\n\\t\\tanimation: celebrate 0.5s ease-out;\\n\\t}\\n\\n\\t@keyframes celebrate {\\n\\t\\tfrom {\\n\\t\\t\\ttransform: scale(0.5);\\n\\t\\t\\topacity: 0;\\n\\t\\t}\\n\\t\\tto {\\n\\t\\t\\ttransform: scale(1);\\n\\t\\t\\topacity: 1;\\n\\t\\t}\\n\\t}\\n\\n\\t.win-message h2 {\\n\\t\\tcolor: goldenrod;\\n\\t\\tfont-size: 2.5rem;\\n\\t\\tmargin-bottom: 1rem;\\n\\t}\\n\\n\\t.win-message p {\\n\\t\\tcolor: #e8eaed;\\n\\t\\tfont-size: 1.3rem;\\n\\t\\tmargin-bottom: 2rem;\\n\\t}\\n\\n\\t@media (max-width: 1200px) {\\n\\t\\t.tableau {\\n\\t\\t\\tgrid-template-columns: repeat(5, 1fr);\\n\\t\\t}\\n\\n\\t\\t.foundations {\\n\\t\\t\\tgap: 0.3rem;\\n\\t\\t}\\n\\n\\t\\t.foundation {\\n\\t\\t\\twidth: 60px;\\n\\t\\t\\theight: 85px;\\n\\t\\t}\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\t.header {\\n\\t\\t\\tflex-direction: column;\\n\\t\\t\\talign-items: flex-start;\\n\\t\\t}\\n\\n\\t\\th1 {\\n\\t\\t\\tfont-size: 1.5rem;\\n\\t\\t}\\n\\n\\t\\t.stats {\\n\\t\\t\\tfont-size: 1rem;\\n\\t\\t\\tgap: 1rem;\\n\\t\\t}\\n\\n\\t\\t.top-row {\\n\\t\\t\\tflex-direction: column;\\n\\t\\t}\\n\\n\\t\\t.tableau {\\n\\t\\t\\tgrid-template-columns: repeat(5, 1fr);\\n\\t\\t\\tgap: 0.3rem;\\n\\t\\t}\\n\\n\\t\\t.stock,\\n\\t\\t.foundation {\\n\\t\\t\\twidth: 60px;\\n\\t\\t\\theight: 85px;\\n\\t\\t}\\n\\n\\t\\t.tableau-card {\\n\\t\\t\\ttop: auto;\\n\\t\\t}\\n\\n\\t\\t.tableau-card:nth-child(n) {\\n\\t\\t\\ttop: calc((var(--card-index, 0)) * 20px);\\n\\t\\t}\\n\\t}\\n\\n\\t@media (max-width: 480px) {\\n\\t\\tmain {\\n\\t\\t\\tpadding: 10px;\\n\\t\\t}\\n\\n\\t\\t.tableau {\\n\\t\\t\\tgrid-template-columns: repeat(5, 1fr);\\n\\t\\t\\tgap: 0.2rem;\\n\\t\\t}\\n\\n\\t\\t.stock,\\n\\t\\t.foundation {\\n\\t\\t\\twidth: 50px;\\n\\t\\t\\theight: 70px;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"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"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $moves, $$unsubscribe_moves;
  let $foundations, $$unsubscribe_foundations;
  let $autoPlayAvailable, $$unsubscribe_autoPlayAvailable;
  let $canDealFromStock, $$unsubscribe_canDealFromStock;
  let $stock, $$unsubscribe_stock;
  let $tableau, $$unsubscribe_tableau;
  let $revealedTableau, $$unsubscribe_revealedTableau;
  let $isWon, $$unsubscribe_isWon;
  const game = createSpiderStore();
  const { tableau, foundations, stock, revealedTableau, moves, isWon, canDealFromStock, autoPlayAvailable } = game;
  $$unsubscribe_tableau = subscribe(tableau, (value) => $tableau = value);
  $$unsubscribe_foundations = subscribe(foundations, (value) => $foundations = value);
  $$unsubscribe_stock = subscribe(stock, (value) => $stock = value);
  $$unsubscribe_revealedTableau = subscribe(revealedTableau, (value) => $revealedTableau = value);
  $$unsubscribe_moves = subscribe(moves, (value) => $moves = value);
  $$unsubscribe_isWon = subscribe(isWon, (value) => $isWon = value);
  $$unsubscribe_canDealFromStock = subscribe(canDealFromStock, (value) => $canDealFromStock = value);
  $$unsubscribe_autoPlayAvailable = subscribe(autoPlayAvailable, (value) => $autoPlayAvailable = value);
  let hintMove = null;
  function showHint() {
    hintMove = game.getHint();
  }
  $$result.css.add(css);
  $$unsubscribe_moves();
  $$unsubscribe_foundations();
  $$unsubscribe_autoPlayAvailable();
  $$unsubscribe_canDealFromStock();
  $$unsubscribe_stock();
  $$unsubscribe_tableau();
  $$unsubscribe_revealedTableau();
  $$unsubscribe_isWon();
  return `${validate_component(CardsDefinitions, "CardsDefinitions").$$render($$result, {}, {}, {})} <main class="svelte-7s7d1r"><div class="game-container svelte-7s7d1r"> <div class="header svelte-7s7d1r"><h1 class="svelte-7s7d1r" data-svelte-h="svelte-xhcziy">🕷️ Spider Solitaire</h1> <div class="stats svelte-7s7d1r"><span>Moves: ${escape($moves)}</span> <span>Completed: ${escape($foundations.length)}/8</span></div> <div class="actions svelte-7s7d1r">${$autoPlayAvailable ? `${validate_component(Button, "Button").$$render(
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
  )}` : ``} ${validate_component(Button, "Button").$$render($$result, { onclick: showHint, variant: "draw" }, {}, {
    default: () => {
      return `Hint`;
    }
  })} ${validate_component(Button, "Button").$$render(
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
  )}</div></div>  <div class="top-row svelte-7s7d1r"> <div class="stock-area svelte-7s7d1r"><div class="${["stock svelte-7s7d1r", !$canDealFromStock ? "disabled" : ""].join(" ").trim()}" role="button" tabindex="0">${$stock.length > 0 ? `<div class="stock-pile svelte-7s7d1r">${each(Array(Math.min(5, Math.ceil($stock.length / 10))), (_, i) => {
    return `<div class="stock-layer svelte-7s7d1r" style="${"left: " + escape(i * 2, true) + "px; top: " + escape(i * 2, true) + "px;"}">${validate_component(SolitaireCard, "Card").$$render($$result, { card: $stock[0], faceUp: false }, {}, {})} </div>`;
  })}</div> <div class="stock-count svelte-7s7d1r">${escape(Math.floor($stock.length / 10))}</div>` : `<div class="empty-pile svelte-7s7d1r" data-svelte-h="svelte-1ofa278">📦</div>`}</div></div> <div class="spacer svelte-7s7d1r"></div>  <div class="foundations svelte-7s7d1r">${each(Array(8), (_, i) => {
    return `<div class="foundation svelte-7s7d1r">${i < $foundations.length ? `${validate_component(SolitaireCard, "Card").$$render($$result, { card: $foundations[i][0], faceUp: true }, {}, {})} <div class="foundation-badge svelte-7s7d1r" data-svelte-h="svelte-i0pl11">✓</div>` : `<div class="empty-pile foundation-placeholder svelte-7s7d1r" data-svelte-h="svelte-dhslk3"><span class="foundation-icon svelte-7s7d1r">🕷️</span> </div>`} </div>`;
  })}</div></div>  <div class="tableau svelte-7s7d1r">${each($tableau, (pile, i) => {
    return `<div class="tableau-pile svelte-7s7d1r" role="button" tabindex="0">${pile.length === 0 ? `<div class="empty-pile tableau-empty svelte-7s7d1r"></div>` : `${each(pile, (card, cardIndex) => {
      let isRevealed = $revealedTableau[i][cardIndex], isHinted = hintMove && hintMove.from === i && hintMove.cardIndex === cardIndex, isHintTarget = hintMove && hintMove.to === i && cardIndex === pile.length - 1;
      return `   <div class="${[
        "tableau-card svelte-7s7d1r",
        (isHinted ? "hinted" : "") + " " + (isHintTarget ? "hint-target" : "")
      ].join(" ").trim()}" style="${"top: " + escape(cardIndex * 30, true) + "px"}"${add_attribute("draggable", isRevealed, 0)} role="button"${add_attribute("tabindex", isRevealed ? 0 : -1, 0)}>${validate_component(SolitaireCard, "Card").$$render($$result, { card, faceUp: isRevealed }, {}, {})} </div>`;
    })}`} </div>`;
  })}</div> ${$isWon ? `<div class="win-overlay svelte-7s7d1r"><div class="win-message svelte-7s7d1r"><h2 class="svelte-7s7d1r" data-svelte-h="svelte-1e2z9mw">🎉 Congratulations! 🎉</h2> <p class="svelte-7s7d1r">You completed all 8 sequences in ${escape($moves)} moves!</p> ${validate_component(Button, "Button").$$render(
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
