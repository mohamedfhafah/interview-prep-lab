// Antisèche à garder sous les yeux pendant l'entretien : index cliquable + cartes mots-clés.
// Usage : node tools/build_cheatsheet.mjs <simulation.json> <cards.json> <sortie.pdf>
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('/opt/node-tools/node_modules/playwright'));
}

const [, , simPath, cardsPath, output] = process.argv;
if (!simPath || !cardsPath || !output) {
  console.error('Usage : node tools/build_cheatsheet.mjs <simulation.json> <cards.json> <sortie.pdf>');
  process.exit(1);
}
const sim = JSON.parse(readFileSync(simPath, 'utf8'));
const cards = JSON.parse(readFileSync(cardsPath, 'utf8')).cards;

// Mêmes couleurs que la version complète.
const COLORS = ['#2563EB', '#7C3AED', '#0891B2', '#059669', '#D97706', '#DC2626', '#4F46E5', '#DB2777', '#EA580C', '#4D7C0F', '#0F766E'];
const DARK = ['#1E40AF', '#5B21B6', '#155E75', '#065F46', '#92400E', '#991B1B', '#3730A3', '#9D174D', '#9A3412', '#3F6212', '#115E59'];

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const nb = (s = '') =>
  esc(s).replace(/ ([?!:;»])/g, ' $1').replace(/« /g, '« ');

const sections = sim.sections.map((s, i) => ({
  id: s.id,
  title: s.title.replace(/\s*\(.*\)\s*$/, ''),
  color: COLORS[i % COLORS.length],
  dark: DARK[i % DARK.length],
  cards: cards.filter((c) => c.section === s.id),
}));

const index = sections
  .map(
    (s) => `
  <div class="ix" style="--c:${s.color};--d:${s.dark}">
    <a class="ix-h" href="#sec-${s.id}">${nb(s.title)}</a>
    ${s.cards
      .map(
        (c) =>
          `<a class="ix-q${c.star ? ' star' : ''}" href="#q${c.n}"><b>${c.n}</b>${nb(c.short)}</a>`,
      )
      .join('')}
  </div>`,
  )
  .join('');

const body = sections
  .map(
    (s) => `
  <section id="sec-${s.id}" style="--c:${s.color};--d:${s.dark}">
    <h2>${nb(s.title)}</h2>
    <div class="grid">
      ${s.cards
        .map(
          (c) => `
        <article class="card${c.star ? ' star' : ''}" id="q${c.n}">
          <h3><span class="n">Q${c.n}</span>${nb(c.short)}</h3>
          <p class="start">${nb(c.start)}</p>
          <ul>${c.keys.map((k) => `<li>${nb(k)}</li>`).join('')}</ul>
          ${c.end ? `<p class="end">→ ${nb(c.end)}</p>` : ''}
        </article>`,
        )
        .join('')}
    </div>
  </section>`,
  )
  .join('');

const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Antisèche — Wavestone Marseille</title>
<style>
  @page { size: A4 landscape; margin: 9mm 10mm 11mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Inter', 'DejaVu Sans', sans-serif; color: #1B2230; font-size: 10.5pt; line-height: 1.38;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  a { color: inherit; text-decoration: none; }
  .top { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; border-bottom: 2px solid #0F172A; padding-bottom: 4px; margin-bottom: 8px; }
  .top h1 { font-size: 17pt; margin: 0; }
  .top p { margin: 0; font-size: 9.5pt; color: #475569; }
  .index { columns: 4; column-gap: 14px; font-size: 8.8pt; line-height: 1.28; }
  .ix { break-inside: avoid; margin-bottom: 8px; }
  .ix-h { display: block; background: var(--c); color: #fff; font-weight: 700; border-radius: 5px; padding: 2px 7px; margin-bottom: 2px; font-size: 9.2pt; }
  .ix-q { display: block; padding: 1px 2px; border-bottom: 1px dotted #DCE2EA; }
  .ix-q b { display: inline-block; min-width: 26px; color: var(--d); font-variant-numeric: tabular-nums; }
  .ix-q.star { font-weight: 700; }
  .ix-q.star::after { content: " ★"; color: var(--c); }
  .legend { font-size: 8.8pt; color: #475569; margin-top: 2px; }
  .sections { break-before: page; column-count: 3; column-gap: 9px; }
  section { display: contents; }
  h2 { break-after: avoid; background: var(--c); color: #fff; font-size: 13pt; margin: 0 0 7px; padding: 4px 10px; border-radius: 6px; }
  .grid { display: contents; }
  .card { margin-bottom: 7px; }
  .card { break-inside: avoid; border: 1.5px solid #DCE2EA; border-top: 4px solid var(--c); border-radius: 7px; padding: 6px 9px 7px; }
  .card.star { border-color: var(--c); background: color-mix(in srgb, var(--c) 6%, white); }
  .card h3 { margin: 0 0 3px; font-size: 12pt; line-height: 1.22; color: var(--d); }
  .card.star h3::after { content: " ★"; color: var(--c); }
  .n { font-size: 8.5pt; background: var(--c); color: #fff; border-radius: 99px; padding: 1px 6px; margin-right: 6px; vertical-align: 2px; }
  .start { margin: 0 0 3px; font-weight: 600; font-size: 10.5pt; }
  ul { margin: 0; padding-left: 15px; }
  li { margin: 1px 0; }
  li::marker { color: var(--c); }
  .end { margin: 3px 0 0; color: #475569; font-size: 9.8pt; }
</style></head><body>
<div class="top">
  <h1>Antisèche — Wavestone Marseille</h1>
  <p>Cliquez une question pour aller à sa carte · ★ = les plus probables · le numéro renvoie au PDF complet</p>
</div>
<div class="index">${index}</div>
<div class="sections">${body}</div>
</body></html>`;

writeFileSync(output.replace(/\.pdf$/i, '.html'), html);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
await page.pdf({
  path: output,
  format: 'A4',
  landscape: true,
  printBackground: true,
  outline: true,
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: `<div style="width:100%;font-size:7.5pt;color:#94A3B8;font-family:Inter,sans-serif;padding:0 10mm;display:flex;justify-content:space-between">
    <span>Antisèche — Wavestone Marseille — Mohamed Fhafah</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  margin: { top: '9mm', bottom: '11mm', left: '10mm', right: '10mm' },
});
await browser.close();
console.log('PDF écrit :', output);
