import { c as create_ssr_component, d as add_attribute } from "./ssr.js";
const css = {
  code: ".solitaire-card.svelte-pgxqh9.svelte-pgxqh9{width:80px;height:110px;border-radius:8px;background:white;box-shadow:0 2px 4px rgba(0, 0, 0, 0.3);overflow:hidden;position:relative}svg.svelte-pgxqh9.svelte-pgxqh9{width:100%;height:100%;display:block}.face-down.svelte-pgxqh9 svg.svelte-pgxqh9{transform:none}@media(max-width: 768px){.solitaire-card.svelte-pgxqh9.svelte-pgxqh9{width:60px;height:85px}}",
  map: '{"version":3,"file":"SolitaireCard.svelte","sources":["SolitaireCard.svelte"],"sourcesContent":["<script lang=\\"ts\\">export let card;\\nexport let faceUp = true;\\n<\/script>\\n\\n<div class=\\"solitaire-card\\" class:face-down={!faceUp}>\\n\\t{#if faceUp}\\n\\t\\t<svg>\\n\\t\\t\\t<use href={`#${card.displayName}`} />\\n\\t\\t</svg>\\n\\t{:else}\\n\\t\\t<svg>\\n\\t\\t\\t<use href=\\"#back\\" />\\n\\t\\t</svg>\\n\\t{/if}\\n</div>\\n\\n<style>\\n\\t.solitaire-card {\\n\\t\\twidth: 80px;\\n\\t\\theight: 110px;\\n\\t\\tborder-radius: 8px;\\n\\t\\tbackground: white;\\n\\t\\tbox-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);\\n\\t\\toverflow: hidden;\\n\\t\\tposition: relative;\\n\\t}\\n\\n\\tsvg {\\n\\t\\twidth: 100%;\\n\\t\\theight: 100%;\\n\\t\\tdisplay: block;\\n\\t}\\n\\n\\t.face-down svg {\\n\\t\\ttransform: none;\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\t.solitaire-card {\\n\\t\\t\\twidth: 60px;\\n\\t\\t\\theight: 85px;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAiBC,2CAAgB,CACf,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,KAAK,CACb,aAAa,CAAE,GAAG,CAClB,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CACxC,QAAQ,CAAE,MAAM,CAChB,QAAQ,CAAE,QACX,CAEA,+BAAI,CACH,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,KACV,CAEA,wBAAU,CAAC,iBAAI,CACd,SAAS,CAAE,IACZ,CAEA,MAAO,YAAY,KAAK,CAAE,CACzB,2CAAgB,CACf,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IACT,CACD"}'
};
const SolitaireCard = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { card } = $$props;
  let { faceUp = true } = $$props;
  if ($$props.card === void 0 && $$bindings.card && card !== void 0) $$bindings.card(card);
  if ($$props.faceUp === void 0 && $$bindings.faceUp && faceUp !== void 0) $$bindings.faceUp(faceUp);
  $$result.css.add(css);
  return `<div class="${["solitaire-card svelte-pgxqh9", !faceUp ? "face-down" : ""].join(" ").trim()}">${faceUp ? `<svg class="svelte-pgxqh9"><use${add_attribute("href", `#${card.displayName}`, 0)}></use></svg>` : `<svg class="svelte-pgxqh9"><use href="#back"></use></svg>`} </div>`;
});
export {
  SolitaireCard as S
};
