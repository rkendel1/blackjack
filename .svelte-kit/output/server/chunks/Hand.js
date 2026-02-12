import { D as Deck$1 } from "./CardsDefinitions.js";
import { c as create_ssr_component, b as each, e as escape, v as validate_component } from "./ssr.js";
import { C as Card } from "./Card.js";
const SCORES = {
  "1": 11,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  jack: 10,
  queen: 10,
  king: 10
};
function calculateScore(cards) {
  let score = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === "1") {
      aces++;
      score += 11;
    } else {
      score += SCORES[card.rank];
    }
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}
class BlackjackEngine {
  deck;
  player;
  dealer;
  turn;
  winner;
  constructor() {
    this.deck = new Deck$1();
    this.player = this.createPlayer();
    this.dealer = this.createDealer();
    this.turn = null;
    this.winner = null;
  }
  createPlayer() {
    return {
      name: "Player",
      hand: [],
      score: 0
    };
  }
  createDealer() {
    return {
      name: "Dealer",
      hand: [],
      score: 0
    };
  }
  updatePlayerScore() {
    this.player.score = calculateScore(this.player.hand);
  }
  updateDealerScore() {
    this.dealer.score = calculateScore(this.dealer.hand);
  }
  checkBlackjack() {
    if (this.player.score === 21) {
      this.winner = "Player";
      this.turn = null;
    }
  }
  checkBust() {
    if (this.player.score > 21) {
      this.winner = "Dealer";
      this.turn = null;
    }
  }
  calculateWinner() {
    if (this.dealer.score > 21) {
      this.winner = "Player";
    } else if (this.player.score > this.dealer.score) {
      this.winner = "Player";
    } else if (this.player.score < this.dealer.score) {
      this.winner = "Dealer";
    } else {
      this.winner = "Draw";
    }
    this.turn = null;
  }
  start() {
    this.deck = new Deck$1();
    this.player = this.createPlayer();
    this.dealer = this.createDealer();
    this.winner = null;
    this.turn = "Player";
    this.dealer.hand.push(this.deck.deal());
    this.player.hand.push(this.deck.deal());
    this.player.hand.push(this.deck.deal());
    this.updatePlayerScore();
    this.updateDealerScore();
    this.checkBlackjack();
  }
  hit() {
    if (this.turn !== "Player" || this.winner !== null) {
      return;
    }
    if (this.player.score < 21) {
      this.player.hand.push(this.deck.deal());
      this.updatePlayerScore();
      this.checkBust();
    }
  }
  stand() {
    if (this.turn !== "Player" || this.winner !== null) {
      return;
    }
    this.turn = "Dealer";
    this.dealerTurn();
  }
  dealerTurn() {
    while (this.dealer.score < 17) {
      this.dealer.hand.push(this.deck.deal());
      this.updateDealerScore();
    }
    this.calculateWinner();
  }
  applyMove(move) {
    switch (move.type) {
      case "start":
        this.start();
        break;
      case "hit":
        this.hit();
        break;
      case "stand":
        this.stand();
        break;
    }
  }
  getState() {
    return {
      player: { ...this.player, hand: [...this.player.hand] },
      dealer: { ...this.dealer, hand: [...this.dealer.hand] },
      turn: this.turn,
      winner: this.winner,
      deckRemaining: this.deck.remaining
    };
  }
  // Helper method to check if dealer needs to draw (for UI layer to animate)
  shouldDealerDraw() {
    return this.turn === "Dealer" && this.dealer.score < 17;
  }
}
const css$1 = {
  code: ".wrapper.svelte-gz4c5s{display:flex;justify-content:center;align-items:center}#deck.svelte-gz4c5s{position:relative;width:200px;height:250px;flex-shrink:0;display:flex;justify-content:center;align-items:center;padding:20px}svg.svelte-gz4c5s{padding-left:24px;position:absolute;top:0;left:0;width:100%;height:100%}@media(max-width: 768px){#deck.svelte-gz4c5s{width:120px;height:150px;padding:10px}svg.svelte-gz4c5s{padding-left:8px}}",
  map: '{"version":3,"file":"Deck.svelte","sources":["Deck.svelte"],"sourcesContent":["<div class=\\"wrapper\\">\\n\\t<div id=\\"deck\\">\\n\\t\\t{#each Array(5) as _, i}\\n\\t\\t\\t<svg style=\\"transform: translate({i * 2}px, {-i * 2}px); z-index: {5 - i};\\">\\n\\t\\t\\t\\t<use href=\\"#back\\" />\\n\\t\\t\\t</svg>\\n\\t\\t{/each}\\n\\t</div>\\n</div>\\n\\n<style>\\n\\t.wrapper {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t\\talign-items: center;\\n\\t}\\n\\n\\t#deck {\\n\\t\\tposition: relative;\\n\\t\\twidth: 200px;\\n\\t\\theight: 250px;\\n\\n\\t\\tflex-shrink: 0;\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t\\talign-items: center;\\n\\t\\tpadding: 20px;\\n\\t}\\n\\n\\tsvg {\\n\\t\\tpadding-left: 24px;\\n\\t\\tposition: absolute;\\n\\t\\ttop: 0;\\n\\t\\tleft: 0;\\n\\t\\twidth: 100%;\\n\\t\\theight: 100%;\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\t#deck {\\n\\t\\t\\twidth: 120px;\\n\\t\\t\\theight: 150px;\\n\\t\\t\\tpadding: 10px;\\n\\t\\t}\\n\\n\\t\\tsvg {\\n\\t\\t\\tpadding-left: 8px;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAWC,sBAAS,CACR,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MACd,CAEA,mBAAM,CACL,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,CAEb,WAAW,CAAE,CAAC,CACd,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,OAAO,CAAE,IACV,CAEA,iBAAI,CACH,YAAY,CAAE,IAAI,CAClB,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IACT,CAEA,MAAO,YAAY,KAAK,CAAE,CACzB,mBAAM,CACL,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,CACb,OAAO,CAAE,IACV,CAEA,iBAAI,CACH,YAAY,CAAE,GACf,CACD"}'
};
const Deck = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$1);
  return `<div class="wrapper svelte-gz4c5s"><div id="deck" class="svelte-gz4c5s">${each(Array(5), (_, i) => {
    return `<svg style="${"transform: translate(" + escape(i * 2, true) + "px, " + escape(-i * 2, true) + "px); z-index: " + escape(5 - i, true) + ";"}" class="svelte-gz4c5s"><use href="#back"></use></svg>`;
  })}</div> </div>`;
});
const css = {
  code: ".score.svelte-hpwphf{position:absolute;top:0;right:0;width:68px;height:42px;border-radius:12px;display:flex;justify-content:center;align-items:center;font-size:28px;font-weight:bold;color:goldenrod}.wrapper.svelte-hpwphf{position:relative;display:flex;flex-grow:1;align-items:center;justify-content:flex-start;padding:10px 48px;border:2px solid rgba(0, 0, 0, 0.76);box-shadow:0px 4px 10px rgba(0, 0, 0, 0.5);border-radius:12px}@media(max-width: 768px){.wrapper.svelte-hpwphf{padding:4px 12px;gap:8px}.score.svelte-hpwphf{width:48px;height:32px;font-size:20px}}",
  map: '{"version":3,"file":"Hand.svelte","sources":["Hand.svelte"],"sourcesContent":["<script lang=\\"ts\\">import Card from \\"./Card.svelte\\";\\nexport let hand;\\nexport let score;\\n<\/script>\\n\\n<div class=\\"wrapper\\">\\n\\t<div class=\\"score\\">{score}</div>\\n\\t{#each hand as card}\\n\\t\\t<Card name={card.displayName} />\\n\\t{/each}\\n</div>\\n\\n<style>\\n\\t.score {\\n\\t\\tposition: absolute;\\n\\t\\ttop: 0;\\n\\t\\tright: 0;\\n\\t\\twidth: 68px;\\n\\t\\theight: 42px;\\n\\t\\tborder-radius: 12px;\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t\\talign-items: center;\\n\\t\\tfont-size: 28px;\\n\\t\\tfont-weight: bold;\\n\\t\\tcolor: goldenrod;\\n\\t}\\n\\n\\t.wrapper {\\n\\t\\tposition: relative;\\n\\t\\tdisplay: flex;\\n\\t\\tflex-grow: 1;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: flex-start;\\n\\t\\tpadding: 10px 48px;\\n\\t\\tborder: 2px solid rgba(0, 0, 0, 0.76);\\n\\t\\tbox-shadow: 0px 4px 10px rgba(0, 0, 0, 0.5);\\n\\t\\tborder-radius: 12px;\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\t.wrapper {\\n\\t\\t\\tpadding: 4px 12px;\\n\\t\\t\\tgap: 8px;\\n\\t\\t}\\n\\n\\t\\t.score {\\n\\t\\t\\twidth: 48px;\\n\\t\\t\\theight: 32px;\\n\\t\\t\\tfont-size: 20px;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAaC,oBAAO,CACN,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,KAAK,CAAE,CAAC,CACR,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,IAAI,CACnB,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,IAAI,CACjB,KAAK,CAAE,SACR,CAEA,sBAAS,CACR,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,IAAI,CACb,SAAS,CAAE,CAAC,CACZ,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,UAAU,CAC3B,OAAO,CAAE,IAAI,CAAC,IAAI,CAClB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,CACrC,UAAU,CAAE,GAAG,CAAC,GAAG,CAAC,IAAI,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAC3C,aAAa,CAAE,IAChB,CAEA,MAAO,YAAY,KAAK,CAAE,CACzB,sBAAS,CACR,OAAO,CAAE,GAAG,CAAC,IAAI,CACjB,GAAG,CAAE,GACN,CAEA,oBAAO,CACN,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,SAAS,CAAE,IACZ,CACD"}'
};
const Hand = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { hand } = $$props;
  let { score } = $$props;
  if ($$props.hand === void 0 && $$bindings.hand && hand !== void 0) $$bindings.hand(hand);
  if ($$props.score === void 0 && $$bindings.score && score !== void 0) $$bindings.score(score);
  $$result.css.add(css);
  return `<div class="wrapper svelte-hpwphf"><div class="score svelte-hpwphf">${escape(score)}</div> ${each(hand, (card) => {
    return `${validate_component(Card, "Card").$$render($$result, { name: card.displayName }, {}, {})}`;
  })} </div>`;
});
export {
  BlackjackEngine as B,
  Deck as D,
  Hand as H
};
