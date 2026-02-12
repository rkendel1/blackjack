import { c as create_ssr_component, a as subscribe, v as validate_component, e as escape, b as each } from "../../../chunks/ssr.js";
/* empty css                     */
import { w as writable, d as derived } from "../../../chunks/index.js";
import { D as Deck, C as CardsDefinitions } from "../../../chunks/CardsDefinitions.js";
import { C as Card } from "../../../chunks/Card.js";
import { B as Button } from "../../../chunks/Button.js";
const getCardName = (card) => {
  const rankNames = {
    "1": "Ace",
    "2": "2",
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "6",
    "7": "7",
    "8": "8",
    "9": "9",
    "10": "10",
    jack: "Jack",
    queen: "Queen",
    king: "King"
  };
  return `${rankNames[card.rank]} of ${card.suit}s`;
};
class Player {
  constructor(name) {
    this.name = name;
  }
  hand = [];
  canPlayCard(card, topCard, currentSuit) {
    if (card.rank === "8") return true;
    if (card.suit === (currentSuit || topCard.suit)) return true;
    if (card.rank === topCard.rank) return true;
    return false;
  }
  getPlayableCards(topCard, currentSuit) {
    return this.hand.filter((card) => this.canPlayCard(card, topCard, currentSuit));
  }
  addCard(card) {
    this.hand.push(card);
  }
}
class Bot extends Player {
  chooseCardToPlay(topCard, currentSuit) {
    const playable = this.getPlayableCards(topCard, currentSuit);
    if (playable.length === 0) return null;
    const nonEights = playable.filter((c) => c.rank !== "8");
    if (nonEights.length > 0) {
      return nonEights[0];
    }
    return playable[0];
  }
  chooseSuit() {
    const suitCounts = /* @__PURE__ */ new Map();
    for (const card of this.hand) {
      suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
    }
    let bestSuit = "heart";
    let maxCount = 0;
    for (const [suit, count] of suitCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        bestSuit = suit;
      }
    }
    return bestSuit;
  }
}
class CrazyEightsEngine {
  deck;
  player;
  bot;
  discardPile;
  gameState;
  currentSuit;
  winner;
  message;
  lastAction;
  constructor() {
    this.deck = new Deck();
    this.player = new Player("Player");
    this.bot = new Bot("Bot");
    this.discardPile = [];
    this.gameState = "ready";
    this.currentSuit = null;
    this.winner = null;
    this.message = 'Click "Start Game" to begin!';
    this.lastAction = "";
  }
  getState() {
    return {
      player: {
        name: this.player.name,
        hand: [...this.player.hand],
        handCount: this.player.hand.length
      },
      bot: {
        name: this.bot.name,
        handCount: this.bot.hand.length
      },
      state: this.gameState,
      topCard: this.discardPile.length > 0 ? this.discardPile[this.discardPile.length - 1] : null,
      currentSuit: this.currentSuit,
      deckRemaining: this.deck.remaining,
      winner: this.winner,
      message: this.message,
      lastAction: this.lastAction
    };
  }
  applyMove(move) {
    if (move.type === "start") {
      this.start();
    } else if (move.type === "play-card") {
      this.handlePlayCard(move.cardIndex);
    } else if (move.type === "draw-card") {
      this.handleDrawCard();
    } else if (move.type === "choose-suit") {
      this.handleChooseSuit(move.suit);
    } else if (move.type === "bot-turn") {
      this.handleBotTurn();
    }
  }
  start() {
    this.deck = new Deck();
    this.player = new Player("Player");
    this.bot = new Bot("Bot");
    this.discardPile = [];
    for (let i = 0; i < 5; i++) {
      this.player.addCard(this.deck.deal());
      this.bot.addCard(this.deck.deal());
    }
    this.discardPile.push(this.deck.deal());
    this.gameState = "player-turn";
    this.currentSuit = null;
    this.message = "Your turn! Play a card or draw.";
    this.winner = null;
    this.lastAction = "Game started!";
  }
  handlePlayCard(cardIndex) {
    if (this.gameState !== "player-turn") return;
    const card = this.player.hand[cardIndex];
    if (!card) return;
    const topCard = this.discardPile[this.discardPile.length - 1];
    if (!this.player.canPlayCard(card, topCard, this.currentSuit)) {
      this.message = "Can't play that card!";
      return;
    }
    this.player.hand.splice(cardIndex, 1);
    this.discardPile.push(card);
    this.lastAction = `You played ${getCardName(card)}`;
    if (card.rank === "8") {
      this.gameState = "choosing-suit";
      this.message = "Choose a suit!";
      return;
    }
    this.currentSuit = null;
    if (this.player.hand.length === 0) {
      this.checkWinner();
    } else {
      this.gameState = "bot-turn";
    }
  }
  handleDrawCard() {
    if (this.gameState !== "player-turn") return;
    if (this.deck.remaining > 0) {
      const card = this.deck.deal();
      this.player.addCard(card);
      this.lastAction = "You drew a card";
      const topCard = this.discardPile[this.discardPile.length - 1];
      if (this.player.canPlayCard(card, topCard, this.currentSuit)) {
        this.message = "You can play the card you drew!";
      } else {
        this.message = "Turn passed to bot.";
        this.gameState = "bot-turn";
      }
    } else {
      this.message = "Deck is empty! Turn passed.";
      this.gameState = "bot-turn";
    }
  }
  handleChooseSuit(suit) {
    if (this.gameState !== "choosing-suit") return;
    this.currentSuit = suit;
    this.lastAction += ` and chose ${suit}`;
    this.message = "Suit chosen!";
    if (this.player.hand.length === 0) {
      this.checkWinner();
    } else {
      this.gameState = "bot-turn";
    }
  }
  handleBotTurn() {
    if (this.gameState !== "bot-turn") return;
    const topCard = this.discardPile[this.discardPile.length - 1];
    const playableCard = this.bot.chooseCardToPlay(topCard, this.currentSuit);
    if (playableCard) {
      const index = this.bot.hand.indexOf(playableCard);
      this.bot.hand.splice(index, 1);
      this.discardPile.push(playableCard);
      this.lastAction = `Bot played ${getCardName(playableCard)}`;
      if (playableCard.rank === "8") {
        const chosenSuit = this.bot.chooseSuit();
        this.currentSuit = chosenSuit;
        this.lastAction += ` and chose ${chosenSuit}`;
      } else {
        this.currentSuit = null;
      }
      if (this.bot.hand.length === 0) {
        this.checkWinner();
      } else {
        this.gameState = "player-turn";
        this.message = "Your turn! Play a card or draw.";
      }
    } else {
      if (this.deck.remaining > 0) {
        const card = this.deck.deal();
        this.bot.addCard(card);
        this.lastAction = "Bot drew a card";
        if (this.bot.canPlayCard(card, topCard, this.currentSuit)) {
          return;
        } else {
          this.gameState = "player-turn";
          this.message = "Your turn! Play a card or draw.";
        }
      } else {
        this.gameState = "player-turn";
        this.message = "Deck is empty! Your turn.";
      }
    }
  }
  checkWinner() {
    this.gameState = "won";
    if (this.player.hand.length === 0) {
      this.winner = "player";
      this.message = "You win!";
    } else if (this.bot.hand.length === 0) {
      this.winner = "bot";
      this.message = "Bot wins!";
    }
  }
  needsBotTurn() {
    return this.gameState === "bot-turn";
  }
  canDrawAgain() {
    if (this.gameState !== "bot-turn") return false;
    const topCard = this.discardPile[this.discardPile.length - 1];
    const lastCard = this.bot.hand[this.bot.hand.length - 1];
    return this.bot.canPlayCard(lastCard, topCard, this.currentSuit);
  }
}
function canPlayCard(card, topCard, currentSuit) {
  if (card.rank === "8") return true;
  if (card.suit === (currentSuit || topCard.suit)) return true;
  if (card.rank === topCard.rank) return true;
  return false;
}
function createCrazyEightsStore() {
  const engine = new CrazyEightsEngine();
  const state = writable(engine.getState());
  function sync() {
    state.set(engine.getState());
  }
  const start = () => {
    engine.applyMove({ type: "start" });
    sync();
  };
  const playCard = async (cardIndex) => {
    engine.applyMove({ type: "play-card", cardIndex });
    sync();
    if (engine.needsBotTurn()) {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      while (engine.needsBotTurn()) {
        engine.applyMove({ type: "bot-turn" });
        sync();
        if (engine.canDrawAgain()) {
          await new Promise((resolve) => setTimeout(resolve, 1e3));
        }
      }
    }
  };
  const drawCard = async () => {
    engine.applyMove({ type: "draw-card" });
    sync();
    if (engine.needsBotTurn()) {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      while (engine.needsBotTurn()) {
        engine.applyMove({ type: "bot-turn" });
        sync();
        if (engine.canDrawAgain()) {
          await new Promise((resolve) => setTimeout(resolve, 1e3));
        }
      }
    }
  };
  const chooseSuit = async (suit) => {
    engine.applyMove({ type: "choose-suit", suit });
    sync();
    if (engine.needsBotTurn()) {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      while (engine.needsBotTurn()) {
        engine.applyMove({ type: "bot-turn" });
        sync();
        if (engine.canDrawAgain()) {
          await new Promise((resolve) => setTimeout(resolve, 1e3));
        }
      }
    }
  };
  const player = derived(state, ($state) => ({
    name: $state.player.name,
    hand: $state.player.hand,
    canPlayCard: (card, topCard2, currentSuit2) => canPlayCard(card, topCard2, currentSuit2)
  }));
  const bot = derived(state, ($state) => ({
    name: $state.bot.name,
    hand: new Array($state.bot.handCount).fill(null)
  }));
  const deck = derived(state, ($state) => ({
    remaining: $state.deckRemaining
  }));
  const discardPile = derived(state, ($state) => {
    const cards = [];
    if ($state.topCard) {
      cards.push($state.topCard);
    }
    return cards;
  });
  const gameState = derived(state, ($state) => $state.state);
  const topCard = derived(state, ($state) => $state.topCard);
  const currentSuit = derived(state, ($state) => $state.currentSuit);
  const message = derived(state, ($state) => $state.message);
  const lastAction = derived(state, ($state) => $state.lastAction);
  const winner = derived(state, ($state) => $state.winner);
  return {
    state,
    player,
    bot,
    deck,
    discardPile,
    gameState,
    topCard,
    currentSuit,
    message,
    lastAction,
    winner,
    start,
    playCard,
    drawCard,
    chooseSuit
  };
}
const css = {
  code: "main.svelte-1qr7fdu.svelte-1qr7fdu{min-height:100dvh;width:100dvw;background:radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);padding:20px;display:flex;align-items:center;justify-content:center}.container.svelte-1qr7fdu.svelte-1qr7fdu{max-width:1200px;width:100%}.header.svelte-1qr7fdu.svelte-1qr7fdu{text-align:center;margin-bottom:1.5rem;position:relative}.back-button.svelte-1qr7fdu.svelte-1qr7fdu{position:absolute;left:0;top:50%;transform:translateY(-50%);color:goldenrod;text-decoration:none;font-size:1rem;transition:opacity 0.3s}.back-button.svelte-1qr7fdu.svelte-1qr7fdu:hover{opacity:0.8}h1.svelte-1qr7fdu.svelte-1qr7fdu{font-size:2.5rem;color:goldenrod;margin:0;text-shadow:2px 2px 4px rgba(0, 0, 0, 0.5)}h3.svelte-1qr7fdu.svelte-1qr7fdu{color:#e8eaed;margin:0 0 1rem 0;font-size:1.2rem}.game-info.svelte-1qr7fdu.svelte-1qr7fdu{display:flex;justify-content:center;gap:2rem;margin-bottom:1.5rem;flex-wrap:wrap}.info-item.svelte-1qr7fdu.svelte-1qr7fdu{background:rgba(0, 0, 0, 0.4);padding:0.75rem 1.5rem;border-radius:8px;border:2px solid rgba(255, 215, 0, 0.3);color:#e8eaed}.info-item.svelte-1qr7fdu strong.svelte-1qr7fdu{color:goldenrod;margin-left:0.5rem;font-size:1.2rem}.message-box.svelte-1qr7fdu.svelte-1qr7fdu{background:rgba(0, 0, 0, 0.4);border:2px solid rgba(255, 215, 0, 0.3);border-radius:12px;padding:1rem;margin-bottom:1.5rem;text-align:center}.message.svelte-1qr7fdu.svelte-1qr7fdu{color:goldenrod;font-size:1.2rem;font-weight:bold;margin:0}.last-action.svelte-1qr7fdu.svelte-1qr7fdu{color:#c4c4cc;font-size:0.95rem;margin:0.5rem 0 0 0}.current-suit.svelte-1qr7fdu.svelte-1qr7fdu{color:#e8eaed;font-size:1rem;margin:0.5rem 0 0 0}.suit-badge.svelte-1qr7fdu.svelte-1qr7fdu{color:goldenrod;font-weight:bold;text-transform:capitalize}.suit-selector.svelte-1qr7fdu.svelte-1qr7fdu{background:rgba(0, 0, 0, 0.5);border:2px solid goldenrod;border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;text-align:center}.suits.svelte-1qr7fdu.svelte-1qr7fdu{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}.suit-button.svelte-1qr7fdu.svelte-1qr7fdu{padding:1rem 2rem;font-size:1.2rem;font-weight:bold;border-radius:8px;border:2px solid;cursor:pointer;transition:all 0.3s}.suit-button.heart.svelte-1qr7fdu.svelte-1qr7fdu{background:#8b0000;color:white;border-color:#ff0000}.suit-button.spade.svelte-1qr7fdu.svelte-1qr7fdu{background:#1a1a1a;color:white;border-color:#666}.suit-button.diamond.svelte-1qr7fdu.svelte-1qr7fdu{background:#8b0000;color:white;border-color:#ff0000}.suit-button.club.svelte-1qr7fdu.svelte-1qr7fdu{background:#1a1a1a;color:white;border-color:#666}.suit-button.svelte-1qr7fdu.svelte-1qr7fdu:hover{transform:scale(1.1)}.game-area.svelte-1qr7fdu.svelte-1qr7fdu{display:flex;flex-direction:column;gap:2rem;margin-bottom:2rem}.discard-area.svelte-1qr7fdu.svelte-1qr7fdu{text-align:center}.top-card.svelte-1qr7fdu.svelte-1qr7fdu{display:flex;justify-content:center}.empty-pile.svelte-1qr7fdu.svelte-1qr7fdu{width:200px;height:250px;margin:0 auto;border:3px dashed rgba(255, 215, 0, 0.3);border-radius:12px;display:flex;align-items:center;justify-content:center;color:rgba(255, 215, 0, 0.3);font-size:1.5rem}.player-hand.svelte-1qr7fdu.svelte-1qr7fdu{background:rgba(0, 0, 0, 0.3);border:2px solid rgba(255, 215, 0, 0.2);border-radius:12px;padding:1.5rem}.cards-row.svelte-1qr7fdu.svelte-1qr7fdu{display:flex;gap:0.5rem;flex-wrap:wrap;justify-content:center}.card-button.svelte-1qr7fdu.svelte-1qr7fdu{background:none;border:none;padding:0;cursor:pointer;transition:transform 0.2s,\n			opacity 0.2s;opacity:0.7}.card-button.playable.svelte-1qr7fdu.svelte-1qr7fdu{opacity:1}.card-button.playable.svelte-1qr7fdu.svelte-1qr7fdu:hover{transform:translateY(-10px)}.card-button.svelte-1qr7fdu.svelte-1qr7fdu:disabled{cursor:not-allowed}.controls.svelte-1qr7fdu.svelte-1qr7fdu{display:flex;justify-content:center;gap:1rem}@media(max-width: 768px){h1.svelte-1qr7fdu.svelte-1qr7fdu{font-size:2rem}.back-button.svelte-1qr7fdu.svelte-1qr7fdu{position:static;display:block;margin-bottom:1rem;transform:none}.game-info.svelte-1qr7fdu.svelte-1qr7fdu{gap:1rem}.info-item.svelte-1qr7fdu.svelte-1qr7fdu{padding:0.5rem 1rem;font-size:0.9rem}.message.svelte-1qr7fdu.svelte-1qr7fdu{font-size:1rem}.empty-pile.svelte-1qr7fdu.svelte-1qr7fdu{width:120px;height:150px}}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import \\"../global.css\\";\\nimport { createCrazyEightsStore } from \\"$lib/adapters/createCrazyEightsStore\\";\\nimport CardsDefinitions from \\"$lib/Components/CardsDefinitions.svelte\\";\\nimport Card from \\"$lib/Components/Card.svelte\\";\\nimport Button from \\"$lib/Components/Button.svelte\\";\\nconst game = createCrazyEightsStore();\\nconst {\\n  player,\\n  bot,\\n  deck,\\n  gameState,\\n  message,\\n  lastAction,\\n  currentSuit,\\n  topCard,\\n  start,\\n  playCard,\\n  chooseSuit,\\n  drawCard\\n} = game;\\nfunction handleCardClick(index) {\\n  if ($gameState === \\"player-turn\\") {\\n    playCard(index);\\n  }\\n}\\nfunction handleSuitChoice(suit) {\\n  chooseSuit(suit);\\n}\\n<\/script>\\n\\n<CardsDefinitions />\\n\\n<main>\\n\\t<div class=\\"container\\">\\n\\t\\t<div class=\\"header\\">\\n\\t\\t\\t<a href=\\"/\\" class=\\"back-button\\">← Back to Games</a>\\n\\t\\t\\t<h1>Crazy Eights</h1>\\n\\t\\t</div>\\n\\n\\t\\t<div class=\\"game-info\\">\\n\\t\\t\\t<div class=\\"info-item\\">\\n\\t\\t\\t\\t<span>Your Cards:</span>\\n\\t\\t\\t\\t<strong>{$player.hand.length}</strong>\\n\\t\\t\\t</div>\\n\\t\\t\\t<div class=\\"info-item\\">\\n\\t\\t\\t\\t<span>Bot Cards:</span>\\n\\t\\t\\t\\t<strong>{$bot.hand.length}</strong>\\n\\t\\t\\t</div>\\n\\t\\t\\t<div class=\\"info-item\\">\\n\\t\\t\\t\\t<span>Deck:</span>\\n\\t\\t\\t\\t<strong>{$deck.remaining}</strong>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\n\\t\\t<div class=\\"message-box\\">\\n\\t\\t\\t<p class=\\"message\\">{$message}</p>\\n\\t\\t\\t{#if $lastAction}\\n\\t\\t\\t\\t<p class=\\"last-action\\">{$lastAction}</p>\\n\\t\\t\\t{/if}\\n\\t\\t\\t{#if $currentSuit}\\n\\t\\t\\t\\t<p class=\\"current-suit\\">Current Suit: <span class=\\"suit-badge\\">{$currentSuit}</span></p>\\n\\t\\t\\t{/if}\\n\\t\\t</div>\\n\\n\\t\\t{#if $gameState === 'choosing-suit'}\\n\\t\\t\\t<div class=\\"suit-selector\\">\\n\\t\\t\\t\\t<h3>Choose a Suit:</h3>\\n\\t\\t\\t\\t<div class=\\"suits\\">\\n\\t\\t\\t\\t\\t<button class=\\"suit-button heart\\" on:click={() => handleSuitChoice('heart')}\\n\\t\\t\\t\\t\\t\\t>♥ Hearts</button\\n\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t<button class=\\"suit-button spade\\" on:click={() => handleSuitChoice('spade')}\\n\\t\\t\\t\\t\\t\\t>♠ Spades</button\\n\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t<button class=\\"suit-button diamond\\" on:click={() => handleSuitChoice('diamond')}\\n\\t\\t\\t\\t\\t\\t>♦ Diamonds</button\\n\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t<button class=\\"suit-button club\\" on:click={() => handleSuitChoice('club')}>♣ Clubs</button\\n\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\t\\t{/if}\\n\\n\\t\\t<div class=\\"game-area\\">\\n\\t\\t\\t<!-- Discard Pile -->\\n\\t\\t\\t<div class=\\"discard-area\\">\\n\\t\\t\\t\\t<h3>Discard Pile</h3>\\n\\t\\t\\t\\t{#if $topCard}\\n\\t\\t\\t\\t\\t<div class=\\"top-card\\">\\n\\t\\t\\t\\t\\t\\t<Card name={$topCard.displayName} />\\n\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t<div class=\\"empty-pile\\">Empty</div>\\n\\t\\t\\t\\t{/if}\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<!-- Player Hand -->\\n\\t\\t\\t<div class=\\"player-hand\\">\\n\\t\\t\\t\\t<h3>Your Hand</h3>\\n\\t\\t\\t\\t<div class=\\"cards-row\\">\\n\\t\\t\\t\\t\\t{#each $player.hand as card, i}\\n\\t\\t\\t\\t\\t\\t{#if $topCard}\\n\\t\\t\\t\\t\\t\\t\\t<button\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"card-button\\"\\n\\t\\t\\t\\t\\t\\t\\t\\tclass:playable={$gameState === 'player-turn' &&\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t$player.canPlayCard(card, $topCard, $currentSuit)}\\n\\t\\t\\t\\t\\t\\t\\t\\ton:click={() => handleCardClick(i)}\\n\\t\\t\\t\\t\\t\\t\\t\\tdisabled={$gameState !== 'player-turn'}\\n\\t\\t\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t\\t\\t\\t<Card name={card.displayName} />\\n\\t\\t\\t\\t\\t\\t\\t</button>\\n\\t\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\n\\t\\t<!-- Controls -->\\n\\t\\t<div class=\\"controls\\">\\n\\t\\t\\t{#if $gameState === 'ready' || $gameState === 'won'}\\n\\t\\t\\t\\t<Button variant=\\"deal\\" onclick={() => start()}>\\n\\t\\t\\t\\t\\t{$gameState === 'ready' ? 'Start Game' : 'Play Again'}\\n\\t\\t\\t\\t</Button>\\n\\t\\t\\t{:else if $gameState === 'player-turn'}\\n\\t\\t\\t\\t<Button variant=\\"draw\\" onclick={() => drawCard()}>Draw Card</Button>\\n\\t\\t\\t{/if}\\n\\t\\t</div>\\n\\t</div>\\n</main>\\n\\n<style>\\n\\tmain {\\n\\t\\tmin-height: 100dvh;\\n\\t\\twidth: 100dvw;\\n\\t\\tbackground: radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);\\n\\t\\tpadding: 20px;\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t}\\n\\n\\t.container {\\n\\t\\tmax-width: 1200px;\\n\\t\\twidth: 100%;\\n\\t}\\n\\n\\t.header {\\n\\t\\ttext-align: center;\\n\\t\\tmargin-bottom: 1.5rem;\\n\\t\\tposition: relative;\\n\\t}\\n\\n\\t.back-button {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 50%;\\n\\t\\ttransform: translateY(-50%);\\n\\t\\tcolor: goldenrod;\\n\\t\\ttext-decoration: none;\\n\\t\\tfont-size: 1rem;\\n\\t\\ttransition: opacity 0.3s;\\n\\t}\\n\\n\\t.back-button:hover {\\n\\t\\topacity: 0.8;\\n\\t}\\n\\n\\th1 {\\n\\t\\tfont-size: 2.5rem;\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin: 0;\\n\\t\\ttext-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);\\n\\t}\\n\\n\\th3 {\\n\\t\\tcolor: #e8eaed;\\n\\t\\tmargin: 0 0 1rem 0;\\n\\t\\tfont-size: 1.2rem;\\n\\t}\\n\\n\\t.game-info {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t\\tgap: 2rem;\\n\\t\\tmargin-bottom: 1.5rem;\\n\\t\\tflex-wrap: wrap;\\n\\t}\\n\\n\\t.info-item {\\n\\t\\tbackground: rgba(0, 0, 0, 0.4);\\n\\t\\tpadding: 0.75rem 1.5rem;\\n\\t\\tborder-radius: 8px;\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.3);\\n\\t\\tcolor: #e8eaed;\\n\\t}\\n\\n\\t.info-item strong {\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin-left: 0.5rem;\\n\\t\\tfont-size: 1.2rem;\\n\\t}\\n\\n\\t.message-box {\\n\\t\\tbackground: rgba(0, 0, 0, 0.4);\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.3);\\n\\t\\tborder-radius: 12px;\\n\\t\\tpadding: 1rem;\\n\\t\\tmargin-bottom: 1.5rem;\\n\\t\\ttext-align: center;\\n\\t}\\n\\n\\t.message {\\n\\t\\tcolor: goldenrod;\\n\\t\\tfont-size: 1.2rem;\\n\\t\\tfont-weight: bold;\\n\\t\\tmargin: 0;\\n\\t}\\n\\n\\t.last-action {\\n\\t\\tcolor: #c4c4cc;\\n\\t\\tfont-size: 0.95rem;\\n\\t\\tmargin: 0.5rem 0 0 0;\\n\\t}\\n\\n\\t.current-suit {\\n\\t\\tcolor: #e8eaed;\\n\\t\\tfont-size: 1rem;\\n\\t\\tmargin: 0.5rem 0 0 0;\\n\\t}\\n\\n\\t.suit-badge {\\n\\t\\tcolor: goldenrod;\\n\\t\\tfont-weight: bold;\\n\\t\\ttext-transform: capitalize;\\n\\t}\\n\\n\\t.suit-selector {\\n\\t\\tbackground: rgba(0, 0, 0, 0.5);\\n\\t\\tborder: 2px solid goldenrod;\\n\\t\\tborder-radius: 12px;\\n\\t\\tpadding: 1.5rem;\\n\\t\\tmargin-bottom: 1.5rem;\\n\\t\\ttext-align: center;\\n\\t}\\n\\n\\t.suits {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 1rem;\\n\\t\\tjustify-content: center;\\n\\t\\tflex-wrap: wrap;\\n\\t}\\n\\n\\t.suit-button {\\n\\t\\tpadding: 1rem 2rem;\\n\\t\\tfont-size: 1.2rem;\\n\\t\\tfont-weight: bold;\\n\\t\\tborder-radius: 8px;\\n\\t\\tborder: 2px solid;\\n\\t\\tcursor: pointer;\\n\\t\\ttransition: all 0.3s;\\n\\t}\\n\\n\\t.suit-button.heart {\\n\\t\\tbackground: #8b0000;\\n\\t\\tcolor: white;\\n\\t\\tborder-color: #ff0000;\\n\\t}\\n\\n\\t.suit-button.spade {\\n\\t\\tbackground: #1a1a1a;\\n\\t\\tcolor: white;\\n\\t\\tborder-color: #666;\\n\\t}\\n\\n\\t.suit-button.diamond {\\n\\t\\tbackground: #8b0000;\\n\\t\\tcolor: white;\\n\\t\\tborder-color: #ff0000;\\n\\t}\\n\\n\\t.suit-button.club {\\n\\t\\tbackground: #1a1a1a;\\n\\t\\tcolor: white;\\n\\t\\tborder-color: #666;\\n\\t}\\n\\n\\t.suit-button:hover {\\n\\t\\ttransform: scale(1.1);\\n\\t}\\n\\n\\t.game-area {\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\tgap: 2rem;\\n\\t\\tmargin-bottom: 2rem;\\n\\t}\\n\\n\\t.discard-area {\\n\\t\\ttext-align: center;\\n\\t}\\n\\n\\t.top-card {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t}\\n\\n\\t.empty-pile {\\n\\t\\twidth: 200px;\\n\\t\\theight: 250px;\\n\\t\\tmargin: 0 auto;\\n\\t\\tborder: 3px dashed rgba(255, 215, 0, 0.3);\\n\\t\\tborder-radius: 12px;\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\tcolor: rgba(255, 215, 0, 0.3);\\n\\t\\tfont-size: 1.5rem;\\n\\t}\\n\\n\\t.player-hand {\\n\\t\\tbackground: rgba(0, 0, 0, 0.3);\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.2);\\n\\t\\tborder-radius: 12px;\\n\\t\\tpadding: 1.5rem;\\n\\t}\\n\\n\\t.cards-row {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 0.5rem;\\n\\t\\tflex-wrap: wrap;\\n\\t\\tjustify-content: center;\\n\\t}\\n\\n\\t.card-button {\\n\\t\\tbackground: none;\\n\\t\\tborder: none;\\n\\t\\tpadding: 0;\\n\\t\\tcursor: pointer;\\n\\t\\ttransition:\\n\\t\\t\\ttransform 0.2s,\\n\\t\\t\\topacity 0.2s;\\n\\t\\topacity: 0.7;\\n\\t}\\n\\n\\t.card-button.playable {\\n\\t\\topacity: 1;\\n\\t}\\n\\n\\t.card-button.playable:hover {\\n\\t\\ttransform: translateY(-10px);\\n\\t}\\n\\n\\t.card-button:disabled {\\n\\t\\tcursor: not-allowed;\\n\\t}\\n\\n\\t.controls {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t\\tgap: 1rem;\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\th1 {\\n\\t\\t\\tfont-size: 2rem;\\n\\t\\t}\\n\\n\\t\\t.back-button {\\n\\t\\t\\tposition: static;\\n\\t\\t\\tdisplay: block;\\n\\t\\t\\tmargin-bottom: 1rem;\\n\\t\\t\\ttransform: none;\\n\\t\\t}\\n\\n\\t\\t.game-info {\\n\\t\\t\\tgap: 1rem;\\n\\t\\t}\\n\\n\\t\\t.info-item {\\n\\t\\t\\tpadding: 0.5rem 1rem;\\n\\t\\t\\tfont-size: 0.9rem;\\n\\t\\t}\\n\\n\\t\\t.message {\\n\\t\\t\\tfont-size: 1rem;\\n\\t\\t}\\n\\n\\t\\t.empty-pile {\\n\\t\\t\\twidth: 120px;\\n\\t\\t\\theight: 150px;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"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"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $gameState, $$unsubscribe_gameState;
  let $player, $$unsubscribe_player;
  let $bot, $$unsubscribe_bot;
  let $deck, $$unsubscribe_deck;
  let $message, $$unsubscribe_message;
  let $lastAction, $$unsubscribe_lastAction;
  let $currentSuit, $$unsubscribe_currentSuit;
  let $topCard, $$unsubscribe_topCard;
  const game = createCrazyEightsStore();
  const { player, bot, deck, gameState, message, lastAction, currentSuit, topCard, start, drawCard } = game;
  $$unsubscribe_player = subscribe(player, (value) => $player = value);
  $$unsubscribe_bot = subscribe(bot, (value) => $bot = value);
  $$unsubscribe_deck = subscribe(deck, (value) => $deck = value);
  $$unsubscribe_gameState = subscribe(gameState, (value) => $gameState = value);
  $$unsubscribe_message = subscribe(message, (value) => $message = value);
  $$unsubscribe_lastAction = subscribe(lastAction, (value) => $lastAction = value);
  $$unsubscribe_currentSuit = subscribe(currentSuit, (value) => $currentSuit = value);
  $$unsubscribe_topCard = subscribe(topCard, (value) => $topCard = value);
  $$result.css.add(css);
  $$unsubscribe_gameState();
  $$unsubscribe_player();
  $$unsubscribe_bot();
  $$unsubscribe_deck();
  $$unsubscribe_message();
  $$unsubscribe_lastAction();
  $$unsubscribe_currentSuit();
  $$unsubscribe_topCard();
  return `${validate_component(CardsDefinitions, "CardsDefinitions").$$render($$result, {}, {}, {})} <main class="svelte-1qr7fdu"><div class="container svelte-1qr7fdu"><div class="header svelte-1qr7fdu" data-svelte-h="svelte-sxrfzo"><a href="/" class="back-button svelte-1qr7fdu">← Back to Games</a> <h1 class="svelte-1qr7fdu">Crazy Eights</h1></div> <div class="game-info svelte-1qr7fdu"><div class="info-item svelte-1qr7fdu"><span data-svelte-h="svelte-iiegfk">Your Cards:</span> <strong class="svelte-1qr7fdu">${escape($player.hand.length)}</strong></div> <div class="info-item svelte-1qr7fdu"><span data-svelte-h="svelte-bs5mxa">Bot Cards:</span> <strong class="svelte-1qr7fdu">${escape($bot.hand.length)}</strong></div> <div class="info-item svelte-1qr7fdu"><span data-svelte-h="svelte-bq4qb9">Deck:</span> <strong class="svelte-1qr7fdu">${escape($deck.remaining)}</strong></div></div> <div class="message-box svelte-1qr7fdu"><p class="message svelte-1qr7fdu">${escape($message)}</p> ${$lastAction ? `<p class="last-action svelte-1qr7fdu">${escape($lastAction)}</p>` : ``} ${$currentSuit ? `<p class="current-suit svelte-1qr7fdu">Current Suit: <span class="suit-badge svelte-1qr7fdu">${escape($currentSuit)}</span></p>` : ``}</div> ${$gameState === "choosing-suit" ? `<div class="suit-selector svelte-1qr7fdu"><h3 class="svelte-1qr7fdu" data-svelte-h="svelte-4yze0f">Choose a Suit:</h3> <div class="suits svelte-1qr7fdu"><button class="suit-button heart svelte-1qr7fdu" data-svelte-h="svelte-lxn6rr">♥ Hearts</button> <button class="suit-button spade svelte-1qr7fdu" data-svelte-h="svelte-8irkr3">♠ Spades</button> <button class="suit-button diamond svelte-1qr7fdu" data-svelte-h="svelte-gqgl2k">♦ Diamonds</button> <button class="suit-button club svelte-1qr7fdu" data-svelte-h="svelte-1kgjk4n">♣ Clubs</button></div></div>` : ``} <div class="game-area svelte-1qr7fdu"> <div class="discard-area svelte-1qr7fdu"><h3 class="svelte-1qr7fdu" data-svelte-h="svelte-1uj2lma">Discard Pile</h3> ${$topCard ? `<div class="top-card svelte-1qr7fdu">${validate_component(Card, "Card").$$render($$result, { name: $topCard.displayName }, {}, {})}</div>` : `<div class="empty-pile svelte-1qr7fdu" data-svelte-h="svelte-xfid32">Empty</div>`}</div>  <div class="player-hand svelte-1qr7fdu"><h3 class="svelte-1qr7fdu" data-svelte-h="svelte-xf15pi">Your Hand</h3> <div class="cards-row svelte-1qr7fdu">${each($player.hand, (card, i) => {
    return `${$topCard ? `<button class="${[
      "card-button svelte-1qr7fdu",
      $gameState === "player-turn" && $player.canPlayCard(card, $topCard, $currentSuit) ? "playable" : ""
    ].join(" ").trim()}" ${$gameState !== "player-turn" ? "disabled" : ""}>${validate_component(Card, "Card").$$render($$result, { name: card.displayName }, {}, {})} </button>` : ``}`;
  })}</div></div></div>  <div class="controls svelte-1qr7fdu">${$gameState === "ready" || $gameState === "won" ? `${validate_component(Button, "Button").$$render($$result, { variant: "deal", onclick: () => start() }, {}, {
    default: () => {
      return `${escape($gameState === "ready" ? "Start Game" : "Play Again")}`;
    }
  })}` : `${$gameState === "player-turn" ? `${validate_component(Button, "Button").$$render(
    $$result,
    {
      variant: "draw",
      onclick: () => drawCard()
    },
    {},
    {
      default: () => {
        return `Draw Card`;
      }
    }
  )}` : ``}`}</div></div> </main>`;
});
export {
  Page as default
};
