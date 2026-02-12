

export const index = 10;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/multiplayer/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/10.76fwrToW.js","_app/immutable/chunks/Dd6VluMK.js","_app/immutable/chunks/CQ--qSfy.js","_app/immutable/chunks/D6YF6ztN.js","_app/immutable/chunks/BQ5YFyiR.js","_app/immutable/chunks/Co8BoKX6.js","_app/immutable/chunks/WLL1HCcy.js"];
export const stylesheets = ["_app/immutable/assets/10.CqI2Z_Yj.css","_app/immutable/assets/global.BTzhfVTa.css"];
export const fonts = [];
