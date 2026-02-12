

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.DMsLr73u.js","_app/immutable/chunks/Dd6VluMK.js","_app/immutable/chunks/CQ--qSfy.js"];
export const stylesheets = [];
export const fonts = [];
