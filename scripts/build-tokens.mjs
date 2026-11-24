// Generates design/tokens.css from design/tokens.json.
// Usage: node scripts/build-tokens.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const t = JSON.parse(readFileSync(new URL('../design/tokens.json', import.meta.url), 'utf8'));
const themes = t.color.themes.map((th) => th.id);
const [first] = themes;
const alias = (v) => {
  const m = /^\{(.+)\}$/.exec(v);
  return m ? `var(--${m[1]})` : v;
};

const out = ['/* ARC Design System — generated from tokens.json. Do not edit by hand. */'];
const firstBlock = t.color.tokens.map((k) => {
  const v = typeof k.value === 'string' ? k.value : k.value[first];
  return `  --${k.name}: ${alias(v)};`;
});
out.push(`:root, [data-theme="${first}"] {\n${firstBlock.join('\n')}\n}`);

for (const th of themes.slice(1)) {
  const lines = [];
  for (const k of t.color.tokens) {
    if (typeof k.value === 'object' && k.value[th]) lines.push(`  --${k.name}: ${alias(k.value[th])};`);
  }
  // re-declare plain aliases so they resolve against this theme's values
  for (const k of t.color.tokens) {
    if (typeof k.value === 'string' && k.value.startsWith('{')) lines.push(`  --${k.name}: ${alias(k.value)};`);
  }
  out.push(`[data-theme="${th}"] {\n${lines.join('\n')}\n}`);
}

const root = [];
for (const fam of ['spacing', 'radius']) for (const k of t[fam].tokens) root.push(`  --${k.name}: ${k.value};`);
for (const [k, v] of Object.entries(t.type.families)) root.push(`  --font-${k}: ${v};`);
out.push(`:root {\n${root.join('\n')}\n}`);

for (const g of t.type.groups) {
  for (const s of g.styles) {
    const fam = s.family ?? g.family;
    const p = [`font-family: var(--font-${fam})`, `font-size: ${s.fontSize}`, `line-height: ${s.lineHeight}`, `font-weight: ${s.fontWeight}`];
    if (s.letterSpacing) p.push(`letter-spacing: ${s.letterSpacing}`);
    out.push(`.${s.name} { ${p.join('; ')}; }`);
  }
}

writeFileSync(new URL('../design/tokens.css', import.meta.url), out.join('\n') + '\n');
console.log('design/tokens.css written');
