import { c as create_ssr_component, d as add_attribute } from "./ssr.js";
const css = {
  code: ".card.svelte-l9vqz6{position:relative;width:200px;height:250px;transform-style:preserve-3d;perspective:1000px;z-index:10}svg.svelte-l9vqz6{position:absolute;width:100%;height:100%}.back.svelte-l9vqz6{z-index:1}.front.svelte-l9vqz6{backface-visibility:hidden;z-index:2}@media(max-width: 768px){.card.svelte-l9vqz6{width:80px;height:112px}}",
  map: '{"version":3,"file":"Card.svelte","sources":["Card.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { flyAndFlip } from \\"$lib/animation\\";\\nexport let name;\\n<\/script>\\n\\n<div class=\\"card\\" in:flyAndFlip>\\n\\t<svg class=\\"back\\">\\n\\t\\t<use href=\\"#back\\" />\\n\\t</svg>\\n\\n\\t<svg class=\\"front\\">\\n\\t\\t<use href={`#${name}`} />\\n\\t</svg>\\n</div>\\n\\n<style>\\n\\t.card {\\n\\t\\tposition: relative;\\n\\t\\twidth: 200px;\\n\\t\\theight: 250px;\\n\\t\\ttransform-style: preserve-3d;\\n\\t\\tperspective: 1000px;\\n\\t\\tz-index: 10;\\n\\t}\\n\\n\\tsvg {\\n\\t\\tposition: absolute;\\n\\t\\twidth: 100%;\\n\\t\\theight: 100%;\\n\\t}\\n\\n\\t.back {\\n\\t\\tz-index: 1;\\n\\t}\\n\\n\\t.front {\\n\\t\\tbackface-visibility: hidden;\\n\\t\\tz-index: 2;\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\t.card {\\n\\t\\t\\twidth: 80px;\\n\\t\\t\\theight: 112px;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAeC,mBAAM,CACL,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,CACb,eAAe,CAAE,WAAW,CAC5B,WAAW,CAAE,MAAM,CACnB,OAAO,CAAE,EACV,CAEA,iBAAI,CACH,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IACT,CAEA,mBAAM,CACL,OAAO,CAAE,CACV,CAEA,oBAAO,CACN,mBAAmB,CAAE,MAAM,CAC3B,OAAO,CAAE,CACV,CAEA,MAAO,YAAY,KAAK,CAAE,CACzB,mBAAM,CACL,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,KACT,CACD"}'
};
const Card = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { name } = $$props;
  if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
  $$result.css.add(css);
  return `<div class="card svelte-l9vqz6"><svg class="back svelte-l9vqz6"><use href="#back"></use></svg> <svg class="front svelte-l9vqz6"><use${add_attribute("href", `#${name}`, 0)}></use></svg> </div>`;
});
export {
  Card as C
};
