import { OVERRIDES_KEY } from "./token-keys";

/**
 * Render-blocking <head> script: applies token experiments from /design-system before first paint,
 * so a refresh never flashes the default tokens first.
 */
export const tokenScript = `try{var o=JSON.parse(localStorage.getItem("${OVERRIDES_KEY}")||"{}");for(var k in o)document.documentElement.style.setProperty(k,o[k])}catch(e){}`;
