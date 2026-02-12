import { c as create_ssr_component, a as subscribe, v as validate_component, e as escape, b as each } from "../../../chunks/ssr.js";
/* empty css                     */
import { w as writable, d as derived } from "../../../chunks/index.js";
import { D as Deck, C as CardsDefinitions } from "../../../chunks/CardsDefinitions.js";
import { C as Card } from "../../../chunks/Card.js";
import { B as Button } from "../../../chunks/Button.js";
const getRankName = (rank) => {
  const names = {
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
  return names[rank];
};
class Player {
  constructor(name) {
    this.name = name;
  }
  hand = [];
  books = [];
  hasRank(rank) {
    return this.hand.some((card) => card.rank === rank);
  }
  countRank(rank) {
    return this.hand.filter((card) => card.rank === rank).length;
  }
  addCard(card) {
    this.hand.push(card);
  }
  addCards(cards) {
    this.hand.push(...cards);
  }
  giveCards(rank) {
    const cards = this.hand.filter((card) => card.rank === rank);
    this.hand = this.hand.filter((card) => card.rank !== rank);
    return cards;
  }
  checkForBooks() {
    const newBooks = [];
    const rankCounts = /* @__PURE__ */ new Map();
    for (const card of this.hand) {
      rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
    }
    for (const [rank, count] of rankCounts.entries()) {
      if (count === 4 && !this.books.includes(rank)) {
        this.books.push(rank);
        newBooks.push(rank);
        this.hand = this.hand.filter((card) => card.rank !== rank);
      }
    }
    return newBooks;
  }
  get score() {
    return this.books.length;
  }
}
class Bot extends Player {
  chooseRank() {
    if (this.hand.length === 0) return null;
    const rankCounts = /* @__PURE__ */ new Map();
    for (const card of this.hand) {
      rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
    }
    let bestRank = null;
    let maxCount = 0;
    for (const [rank, count] of rankCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        bestRank = rank;
      }
    }
    return bestRank;
  }
}
class GoFishEngine {
  deck;
  player;
  bot;
  gameState;
  winner;
  message;
  lastAction;
  constructor() {
    this.deck = new Deck();
    this.player = new Player("Player");
    this.bot = new Bot("Bot");
    this.gameState = "ready";
    this.winner = null;
    this.message = 'Click "Start Game" to begin!';
    this.lastAction = "";
  }
  getState() {
    return {
      player: {
        name: this.player.name,
        hand: [...this.player.hand],
        books: [...this.player.books],
        score: this.player.score
      },
      bot: {
        name: this.bot.name,
        handCount: this.bot.hand.length,
        books: [...this.bot.books],
        score: this.bot.score
      },
      state: this.gameState,
      deckRemaining: this.deck.remaining,
      winner: this.winner,
      message: this.message,
      lastAction: this.lastAction
    };
  }
  applyMove(move) {
    if (move.type === "start") {
      this.start();
    } else if (move.type === "ask") {
      this.handlePlayerAsk(move.rank);
    } else if (move.type === "bot-turn") {
      this.handleBotTurn();
    }
  }
  start() {
    this.deck = new Deck();
    this.player = new Player("Player");
    this.bot = new Bot("Bot");
    for (let i = 0; i < 7; i++) {
      this.player.addCard(this.deck.deal());
      this.bot.addCard(this.deck.deal());
    }
    this.player.checkForBooks();
    this.bot.checkForBooks();
    this.gameState = "player-turn";
    this.message = "Your turn! Select a rank to ask for.";
    this.winner = null;
    this.lastAction = "";
  }
  handlePlayerAsk(rank) {
    if (this.gameState !== "player-turn") return;
    const count = this.bot.countRank(rank);
    if (count > 0) {
      const cards = this.bot.giveCards(rank);
      this.player.addCards(cards);
      this.lastAction = `Bot gave you ${count} ${getRankName(rank)}(s)`;
      this.message = "You got cards! Check for books and go again.";
      const newBooks = this.player.checkForBooks();
      if (newBooks.length > 0) {
        this.lastAction += `
You completed ${newBooks.map((r) => getRankName(r)).join(", ")}!`;
      }
      this.checkWinner();
    } else {
      this.lastAction = `Bot says "Go Fish!"`;
      this.message = "Go Fish! Drawing a card...";
      if (this.deck.remaining > 0) {
        const card = this.deck.deal();
        this.player.addCard(card);
        const newBooks = this.player.checkForBooks();
        if (newBooks.length > 0) {
          this.lastAction += `
You completed ${newBooks.map((r) => getRankName(r)).join(", ")}!`;
        }
      }
      this.checkWinner();
      if (this.winner === null) {
        this.gameState = "bot-turn";
      }
    }
  }
  handleBotTurn() {
    if (this.gameState !== "bot-turn") return;
    const rankToAsk = this.bot.chooseRank();
    if (!rankToAsk) {
      this.gameState = "player-turn";
      this.message = "Your turn! Select a rank to ask for.";
      return;
    }
    const count = this.player.countRank(rankToAsk);
    if (count > 0) {
      const cards = this.player.giveCards(rankToAsk);
      this.bot.addCards(cards);
      this.lastAction = `Bot asked for ${getRankName(rankToAsk)} and got ${count}!`;
      const newBooks = this.bot.checkForBooks();
      if (newBooks.length > 0) {
        this.lastAction += `
Bot completed ${newBooks.map((r) => getRankName(r)).join(", ")}!`;
      }
      this.checkWinner();
    } else {
      this.lastAction = `Bot asked for ${getRankName(rankToAsk)} - Go Fish!`;
      if (this.deck.remaining > 0) {
        const card = this.deck.deal();
        this.bot.addCard(card);
        const newBooks = this.bot.checkForBooks();
        if (newBooks.length > 0) {
          this.lastAction += `
Bot completed ${newBooks.map((r) => getRankName(r)).join(", ")}!`;
        }
      }
      this.checkWinner();
      if (this.winner === null) {
        this.gameState = "player-turn";
        this.message = "Your turn! Select a rank to ask for.";
      }
    }
  }
  checkWinner() {
    const noCardsLeft = this.deck.remaining === 0 && this.player.hand.length === 0 && this.bot.hand.length === 0;
    if (noCardsLeft) {
      this.gameState = "won";
      if (this.player.score > this.bot.score) {
        this.winner = "player";
        this.message = `You win! ${this.player.score} - ${this.bot.score}`;
      } else if (this.bot.score > this.player.score) {
        this.winner = "bot";
        this.message = `Bot wins! ${this.bot.score} - ${this.player.score}`;
      } else {
        this.winner = "tie";
        this.message = `It's a tie! ${this.player.score} - ${this.bot.score}`;
      }
    }
  }
  needsBotTurn() {
    return this.gameState === "bot-turn";
  }
}
function createGoFishStore() {
  const engine = new GoFishEngine();
  const state = writable(engine.getState());
  function sync() {
    state.set(engine.getState());
  }
  const start = () => {
    engine.applyMove({ type: "start" });
    sync();
  };
  const askForRank = async (rank) => {
    engine.applyMove({ type: "ask", rank });
    sync();
    while (engine.needsBotTurn()) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      engine.applyMove({ type: "bot-turn" });
      sync();
    }
  };
  const player = derived(state, ($state) => ({
    name: $state.player.name,
    hand: $state.player.hand,
    books: $state.player.books,
    score: $state.player.score
  }));
  const bot = derived(state, ($state) => ({
    name: $state.bot.name,
    hand: new Array($state.bot.handCount).fill(null),
    // Hidden cards
    books: $state.bot.books,
    score: $state.bot.score
  }));
  const deck = derived(state, ($state) => ({
    remaining: $state.deckRemaining
  }));
  const gameState = derived(state, ($state) => $state.state);
  const message = derived(state, ($state) => $state.message);
  const lastAction = derived(state, ($state) => $state.lastAction);
  const winner = derived(state, ($state) => $state.winner);
  return {
    state,
    player,
    bot,
    deck,
    gameState,
    message,
    lastAction,
    winner,
    start,
    askForRank
  };
}
const css = {
  code: "main.svelte-10igcp4.svelte-10igcp4{min-height:100dvh;width:100dvw;background:radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);padding:20px;display:flex;align-items:center;justify-content:center}.container.svelte-10igcp4.svelte-10igcp4{max-width:1200px;width:100%}.header.svelte-10igcp4.svelte-10igcp4{text-align:center;margin-bottom:1.5rem;position:relative}.back-button.svelte-10igcp4.svelte-10igcp4{position:absolute;left:0;top:50%;transform:translateY(-50%);color:goldenrod;text-decoration:none;font-size:1rem;transition:opacity 0.3s}.back-button.svelte-10igcp4.svelte-10igcp4:hover{opacity:0.8}h1.svelte-10igcp4.svelte-10igcp4{font-size:2.5rem;color:goldenrod;margin:0;text-shadow:2px 2px 4px rgba(0, 0, 0, 0.5)}h3.svelte-10igcp4.svelte-10igcp4{color:#e8eaed;margin:0 0 1rem 0;font-size:1.2rem}.scores.svelte-10igcp4.svelte-10igcp4{display:flex;justify-content:center;gap:2rem;margin-bottom:1.5rem;flex-wrap:wrap}.score-item.svelte-10igcp4.svelte-10igcp4{background:rgba(0, 0, 0, 0.4);padding:0.75rem 1.5rem;border-radius:8px;border:2px solid rgba(255, 215, 0, 0.3);color:#e8eaed}.score-item.svelte-10igcp4 strong.svelte-10igcp4{color:goldenrod;margin-left:0.5rem;font-size:1.2rem}.message-box.svelte-10igcp4.svelte-10igcp4{background:rgba(0, 0, 0, 0.4);border:2px solid rgba(255, 215, 0, 0.3);border-radius:12px;padding:1rem;margin-bottom:1.5rem;text-align:center}.message.svelte-10igcp4.svelte-10igcp4{color:goldenrod;font-size:1.2rem;font-weight:bold;margin:0}.last-action.svelte-10igcp4.svelte-10igcp4{color:#c4c4cc;font-size:0.95rem;margin:0.5rem 0 0 0;white-space:pre-line}.game-area.svelte-10igcp4.svelte-10igcp4{display:flex;flex-direction:column;gap:2rem;margin-bottom:2rem}.opponent-hand.svelte-10igcp4.svelte-10igcp4,.player-hand.svelte-10igcp4.svelte-10igcp4{background:rgba(0, 0, 0, 0.3);border:2px solid rgba(255, 215, 0, 0.2);border-radius:12px;padding:1.5rem}.cards-row.svelte-10igcp4.svelte-10igcp4{display:flex;gap:0.5rem;flex-wrap:wrap;justify-content:center}.card-back-small.svelte-10igcp4.svelte-10igcp4{width:60px;height:84px;background:rgba(139, 0, 0, 0.6);border:2px solid rgba(255, 215, 0, 0.4);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:rgba(255, 215, 0, 0.6)}.card-button.svelte-10igcp4.svelte-10igcp4{background:none;border:none;padding:0;cursor:pointer;transition:transform 0.2s;opacity:0.9}.card-button.selectable.svelte-10igcp4.svelte-10igcp4:hover{transform:translateY(-10px);opacity:1}.card-button.svelte-10igcp4.svelte-10igcp4:disabled{cursor:not-allowed}.controls.svelte-10igcp4.svelte-10igcp4{display:flex;justify-content:center;gap:1rem}@media(max-width: 768px){h1.svelte-10igcp4.svelte-10igcp4{font-size:2rem}.back-button.svelte-10igcp4.svelte-10igcp4{position:static;display:block;margin-bottom:1rem;transform:none}.scores.svelte-10igcp4.svelte-10igcp4{gap:1rem}.score-item.svelte-10igcp4.svelte-10igcp4{padding:0.5rem 1rem;font-size:0.9rem}.message.svelte-10igcp4.svelte-10igcp4{font-size:1rem}}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import \\"../global.css\\";\\nimport { createGoFishStore } from \\"$lib/adapters/createGoFishStore\\";\\nimport CardsDefinitions from \\"$lib/Components/CardsDefinitions.svelte\\";\\nimport Card from \\"$lib/Components/Card.svelte\\";\\nimport Button from \\"$lib/Components/Button.svelte\\";\\nconst game = createGoFishStore();\\nconst { player, bot, deck, gameState, message, lastAction, start, askForRank } = game;\\nfunction handleRankClick(rank) {\\n  if ($gameState === \\"player-turn\\") {\\n    askForRank(rank);\\n  }\\n}\\n<\/script>\\n\\n<CardsDefinitions />\\n\\n<main>\\n\\t<div class=\\"container\\">\\n\\t\\t<div class=\\"header\\">\\n\\t\\t\\t<a href=\\"/\\" class=\\"back-button\\">← Back to Games</a>\\n\\t\\t\\t<h1>Go Fish</h1>\\n\\t\\t</div>\\n\\n\\t\\t<div class=\\"scores\\">\\n\\t\\t\\t<div class=\\"score-item\\">\\n\\t\\t\\t\\t<span>Your Books:</span>\\n\\t\\t\\t\\t<strong>{$player.score}</strong>\\n\\t\\t\\t</div>\\n\\t\\t\\t<div class=\\"score-item\\">\\n\\t\\t\\t\\t<span>Bot Books:</span>\\n\\t\\t\\t\\t<strong>{$bot.score}</strong>\\n\\t\\t\\t</div>\\n\\t\\t\\t<div class=\\"score-item\\">\\n\\t\\t\\t\\t<span>Deck:</span>\\n\\t\\t\\t\\t<strong>{$deck.remaining}</strong>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\n\\t\\t<div class=\\"message-box\\">\\n\\t\\t\\t<p class=\\"message\\">{$message}</p>\\n\\t\\t\\t{#if $lastAction}\\n\\t\\t\\t\\t<p class=\\"last-action\\">{$lastAction}</p>\\n\\t\\t\\t{/if}\\n\\t\\t</div>\\n\\n\\t\\t<div class=\\"game-area\\">\\n\\t\\t\\t<!-- Computer Hand -->\\n\\t\\t\\t<div class=\\"opponent-hand\\">\\n\\t\\t\\t\\t<h3>Bot ({$bot.hand.length} cards)</h3>\\n\\t\\t\\t\\t<div class=\\"cards-row\\">\\n\\t\\t\\t\\t\\t<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->\\n\\t\\t\\t\\t\\t{#each $bot.hand as _}\\n\\t\\t\\t\\t\\t\\t<div class=\\"card-back-small\\">?</div>\\n\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<!-- Player Hand -->\\n\\t\\t\\t<div class=\\"player-hand\\">\\n\\t\\t\\t\\t<h3>Your Hand ({$player.hand.length} cards)</h3>\\n\\t\\t\\t\\t<div class=\\"cards-row\\">\\n\\t\\t\\t\\t\\t{#each $player.hand as card}\\n\\t\\t\\t\\t\\t\\t<button\\n\\t\\t\\t\\t\\t\\t\\tclass=\\"card-button\\"\\n\\t\\t\\t\\t\\t\\t\\tclass:selectable={$gameState === 'player-turn'}\\n\\t\\t\\t\\t\\t\\t\\ton:click={() => handleRankClick(card.rank)}\\n\\t\\t\\t\\t\\t\\t\\tdisabled={$gameState !== 'player-turn'}\\n\\t\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t\\t\\t<Card name={card.displayName} />\\n\\t\\t\\t\\t\\t\\t</button>\\n\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\n\\t\\t<!-- Controls -->\\n\\t\\t<div class=\\"controls\\">\\n\\t\\t\\t{#if $gameState === 'ready' || $gameState === 'won'}\\n\\t\\t\\t\\t<Button variant=\\"deal\\" onclick={() => start()}>\\n\\t\\t\\t\\t\\t{$gameState === 'ready' ? 'Start Game' : 'Play Again'}\\n\\t\\t\\t\\t</Button>\\n\\t\\t\\t{/if}\\n\\t\\t</div>\\n\\t</div>\\n</main>\\n\\n<style>\\n\\tmain {\\n\\t\\tmin-height: 100dvh;\\n\\t\\twidth: 100dvw;\\n\\t\\tbackground: radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);\\n\\t\\tpadding: 20px;\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t}\\n\\n\\t.container {\\n\\t\\tmax-width: 1200px;\\n\\t\\twidth: 100%;\\n\\t}\\n\\n\\t.header {\\n\\t\\ttext-align: center;\\n\\t\\tmargin-bottom: 1.5rem;\\n\\t\\tposition: relative;\\n\\t}\\n\\n\\t.back-button {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 50%;\\n\\t\\ttransform: translateY(-50%);\\n\\t\\tcolor: goldenrod;\\n\\t\\ttext-decoration: none;\\n\\t\\tfont-size: 1rem;\\n\\t\\ttransition: opacity 0.3s;\\n\\t}\\n\\n\\t.back-button:hover {\\n\\t\\topacity: 0.8;\\n\\t}\\n\\n\\th1 {\\n\\t\\tfont-size: 2.5rem;\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin: 0;\\n\\t\\ttext-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);\\n\\t}\\n\\n\\th3 {\\n\\t\\tcolor: #e8eaed;\\n\\t\\tmargin: 0 0 1rem 0;\\n\\t\\tfont-size: 1.2rem;\\n\\t}\\n\\n\\t.scores {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t\\tgap: 2rem;\\n\\t\\tmargin-bottom: 1.5rem;\\n\\t\\tflex-wrap: wrap;\\n\\t}\\n\\n\\t.score-item {\\n\\t\\tbackground: rgba(0, 0, 0, 0.4);\\n\\t\\tpadding: 0.75rem 1.5rem;\\n\\t\\tborder-radius: 8px;\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.3);\\n\\t\\tcolor: #e8eaed;\\n\\t}\\n\\n\\t.score-item strong {\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin-left: 0.5rem;\\n\\t\\tfont-size: 1.2rem;\\n\\t}\\n\\n\\t.message-box {\\n\\t\\tbackground: rgba(0, 0, 0, 0.4);\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.3);\\n\\t\\tborder-radius: 12px;\\n\\t\\tpadding: 1rem;\\n\\t\\tmargin-bottom: 1.5rem;\\n\\t\\ttext-align: center;\\n\\t}\\n\\n\\t.message {\\n\\t\\tcolor: goldenrod;\\n\\t\\tfont-size: 1.2rem;\\n\\t\\tfont-weight: bold;\\n\\t\\tmargin: 0;\\n\\t}\\n\\n\\t.last-action {\\n\\t\\tcolor: #c4c4cc;\\n\\t\\tfont-size: 0.95rem;\\n\\t\\tmargin: 0.5rem 0 0 0;\\n\\t\\twhite-space: pre-line;\\n\\t}\\n\\n\\t.game-area {\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\tgap: 2rem;\\n\\t\\tmargin-bottom: 2rem;\\n\\t}\\n\\n\\t.opponent-hand,\\n\\t.player-hand {\\n\\t\\tbackground: rgba(0, 0, 0, 0.3);\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.2);\\n\\t\\tborder-radius: 12px;\\n\\t\\tpadding: 1.5rem;\\n\\t}\\n\\n\\t.cards-row {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 0.5rem;\\n\\t\\tflex-wrap: wrap;\\n\\t\\tjustify-content: center;\\n\\t}\\n\\n\\t.card-back-small {\\n\\t\\twidth: 60px;\\n\\t\\theight: 84px;\\n\\t\\tbackground: rgba(139, 0, 0, 0.6);\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.4);\\n\\t\\tborder-radius: 6px;\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\tfont-size: 1.5rem;\\n\\t\\tcolor: rgba(255, 215, 0, 0.6);\\n\\t}\\n\\n\\t.card-button {\\n\\t\\tbackground: none;\\n\\t\\tborder: none;\\n\\t\\tpadding: 0;\\n\\t\\tcursor: pointer;\\n\\t\\ttransition: transform 0.2s;\\n\\t\\topacity: 0.9;\\n\\t}\\n\\n\\t.card-button.selectable:hover {\\n\\t\\ttransform: translateY(-10px);\\n\\t\\topacity: 1;\\n\\t}\\n\\n\\t.card-button:disabled {\\n\\t\\tcursor: not-allowed;\\n\\t}\\n\\n\\t.controls {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t\\tgap: 1rem;\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\th1 {\\n\\t\\t\\tfont-size: 2rem;\\n\\t\\t}\\n\\n\\t\\t.back-button {\\n\\t\\t\\tposition: static;\\n\\t\\t\\tdisplay: block;\\n\\t\\t\\tmargin-bottom: 1rem;\\n\\t\\t\\ttransform: none;\\n\\t\\t}\\n\\n\\t\\t.scores {\\n\\t\\t\\tgap: 1rem;\\n\\t\\t}\\n\\n\\t\\t.score-item {\\n\\t\\t\\tpadding: 0.5rem 1rem;\\n\\t\\t\\tfont-size: 0.9rem;\\n\\t\\t}\\n\\n\\t\\t.message {\\n\\t\\t\\tfont-size: 1rem;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAuFC,kCAAK,CACJ,UAAU,CAAE,MAAM,CAClB,KAAK,CAAE,MAAM,CACb,UAAU,CAAE,gBAAgB,MAAM,CAAC,EAAE,CAAC,MAAM,CAAC,CAAC,OAAO,CAAC,CAAC,OAAO,CAAC,GAAG,CAAC,CAAC,OAAO,CAAC,CAC5E,OAAO,CAAE,IAAI,CACb,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAClB,CAEA,wCAAW,CACV,SAAS,CAAE,MAAM,CACjB,KAAK,CAAE,IACR,CAEA,qCAAQ,CACP,UAAU,CAAE,MAAM,CAClB,aAAa,CAAE,MAAM,CACrB,QAAQ,CAAE,QACX,CAEA,0CAAa,CACZ,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,GAAG,CACR,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,KAAK,CAAE,SAAS,CAChB,eAAe,CAAE,IAAI,CACrB,SAAS,CAAE,IAAI,CACf,UAAU,CAAE,OAAO,CAAC,IACrB,CAEA,0CAAY,MAAO,CAClB,OAAO,CAAE,GACV,CAEA,gCAAG,CACF,SAAS,CAAE,MAAM,CACjB,KAAK,CAAE,SAAS,CAChB,MAAM,CAAE,CAAC,CACT,WAAW,CAAE,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAC3C,CAEA,gCAAG,CACF,KAAK,CAAE,OAAO,CACd,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,CAAC,CAClB,SAAS,CAAE,MACZ,CAEA,qCAAQ,CACP,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,GAAG,CAAE,IAAI,CACT,aAAa,CAAE,MAAM,CACrB,SAAS,CAAE,IACZ,CAEA,yCAAY,CACX,UAAU,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAC9B,OAAO,CAAE,OAAO,CAAC,MAAM,CACvB,aAAa,CAAE,GAAG,CAClB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CACxC,KAAK,CAAE,OACR,CAEA,0BAAW,CAAC,qBAAO,CAClB,KAAK,CAAE,SAAS,CAChB,WAAW,CAAE,MAAM,CACnB,SAAS,CAAE,MACZ,CAEA,0CAAa,CACZ,UAAU,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAC9B,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CACxC,aAAa,CAAE,IAAI,CACnB,OAAO,CAAE,IAAI,CACb,aAAa,CAAE,MAAM,CACrB,UAAU,CAAE,MACb,CAEA,sCAAS,CACR,KAAK,CAAE,SAAS,CAChB,SAAS,CAAE,MAAM,CACjB,WAAW,CAAE,IAAI,CACjB,MAAM,CAAE,CACT,CAEA,0CAAa,CACZ,KAAK,CAAE,OAAO,CACd,SAAS,CAAE,OAAO,CAClB,MAAM,CAAE,MAAM,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACpB,WAAW,CAAE,QACd,CAEA,wCAAW,CACV,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,GAAG,CAAE,IAAI,CACT,aAAa,CAAE,IAChB,CAEA,4CAAc,CACd,0CAAa,CACZ,UAAU,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAC9B,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CACxC,aAAa,CAAE,IAAI,CACnB,OAAO,CAAE,MACV,CAEA,wCAAW,CACV,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,MAAM,CACX,SAAS,CAAE,IAAI,CACf,eAAe,CAAE,MAClB,CAEA,8CAAiB,CAChB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,KAAK,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAChC,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CACxC,aAAa,CAAE,GAAG,CAClB,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,SAAS,CAAE,MAAM,CACjB,KAAK,CAAE,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAC7B,CAEA,0CAAa,CACZ,UAAU,CAAE,IAAI,CAChB,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,CAAC,CACV,MAAM,CAAE,OAAO,CACf,UAAU,CAAE,SAAS,CAAC,IAAI,CAC1B,OAAO,CAAE,GACV,CAEA,YAAY,yCAAW,MAAO,CAC7B,SAAS,CAAE,WAAW,KAAK,CAAC,CAC5B,OAAO,CAAE,CACV,CAEA,0CAAY,SAAU,CACrB,MAAM,CAAE,WACT,CAEA,uCAAU,CACT,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,GAAG,CAAE,IACN,CAEA,MAAO,YAAY,KAAK,CAAE,CACzB,gCAAG,CACF,SAAS,CAAE,IACZ,CAEA,0CAAa,CACZ,QAAQ,CAAE,MAAM,CAChB,OAAO,CAAE,KAAK,CACd,aAAa,CAAE,IAAI,CACnB,SAAS,CAAE,IACZ,CAEA,qCAAQ,CACP,GAAG,CAAE,IACN,CAEA,yCAAY,CACX,OAAO,CAAE,MAAM,CAAC,IAAI,CACpB,SAAS,CAAE,MACZ,CAEA,sCAAS,CACR,SAAS,CAAE,IACZ,CACD"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $gameState, $$unsubscribe_gameState;
  let $player, $$unsubscribe_player;
  let $bot, $$unsubscribe_bot;
  let $deck, $$unsubscribe_deck;
  let $message, $$unsubscribe_message;
  let $lastAction, $$unsubscribe_lastAction;
  const game = createGoFishStore();
  const { player, bot, deck, gameState, message, lastAction, start } = game;
  $$unsubscribe_player = subscribe(player, (value) => $player = value);
  $$unsubscribe_bot = subscribe(bot, (value) => $bot = value);
  $$unsubscribe_deck = subscribe(deck, (value) => $deck = value);
  $$unsubscribe_gameState = subscribe(gameState, (value) => $gameState = value);
  $$unsubscribe_message = subscribe(message, (value) => $message = value);
  $$unsubscribe_lastAction = subscribe(lastAction, (value) => $lastAction = value);
  $$result.css.add(css);
  $$unsubscribe_gameState();
  $$unsubscribe_player();
  $$unsubscribe_bot();
  $$unsubscribe_deck();
  $$unsubscribe_message();
  $$unsubscribe_lastAction();
  return `${validate_component(CardsDefinitions, "CardsDefinitions").$$render($$result, {}, {}, {})} <main class="svelte-10igcp4"><div class="container svelte-10igcp4"><div class="header svelte-10igcp4" data-svelte-h="svelte-fh1xdj"><a href="/" class="back-button svelte-10igcp4">← Back to Games</a> <h1 class="svelte-10igcp4">Go Fish</h1></div> <div class="scores svelte-10igcp4"><div class="score-item svelte-10igcp4"><span data-svelte-h="svelte-8rvvzp">Your Books:</span> <strong class="svelte-10igcp4">${escape($player.score)}</strong></div> <div class="score-item svelte-10igcp4"><span data-svelte-h="svelte-e72eot">Bot Books:</span> <strong class="svelte-10igcp4">${escape($bot.score)}</strong></div> <div class="score-item svelte-10igcp4"><span data-svelte-h="svelte-bq4qb9">Deck:</span> <strong class="svelte-10igcp4">${escape($deck.remaining)}</strong></div></div> <div class="message-box svelte-10igcp4"><p class="message svelte-10igcp4">${escape($message)}</p> ${$lastAction ? `<p class="last-action svelte-10igcp4">${escape($lastAction)}</p>` : ``}</div> <div class="game-area svelte-10igcp4"> <div class="opponent-hand svelte-10igcp4"><h3 class="svelte-10igcp4">Bot (${escape($bot.hand.length)} cards)</h3> <div class="cards-row svelte-10igcp4"> ${each($bot.hand, (_) => {
    return `<div class="card-back-small svelte-10igcp4" data-svelte-h="svelte-1jkj2iy">?</div>`;
  })}</div></div>  <div class="player-hand svelte-10igcp4"><h3 class="svelte-10igcp4">Your Hand (${escape($player.hand.length)} cards)</h3> <div class="cards-row svelte-10igcp4">${each($player.hand, (card) => {
    return `<button class="${[
      "card-button svelte-10igcp4",
      $gameState === "player-turn" ? "selectable" : ""
    ].join(" ").trim()}" ${$gameState !== "player-turn" ? "disabled" : ""}>${validate_component(Card, "Card").$$render($$result, { name: card.displayName }, {}, {})} </button>`;
  })}</div></div></div>  <div class="controls svelte-10igcp4">${$gameState === "ready" || $gameState === "won" ? `${validate_component(Button, "Button").$$render($$result, { variant: "deal", onclick: () => start() }, {}, {
    default: () => {
      return `${escape($gameState === "ready" ? "Start Game" : "Play Again")}`;
    }
  })}` : ``}</div></div> </main>`;
});
export {
  Page as default
};
