// Génère un PDF de simulation d'entretien à partir d'un fichier JSON.
// Usage : node tools/build_pdf.mjs <contenu.json> <sortie.pdf>
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('/opt/node-tools/node_modules/playwright'));
}

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error('Usage : node tools/build_pdf.mjs <contenu.json> <sortie.pdf>');
  process.exit(1);
}
const doc = JSON.parse(readFileSync(input, 'utf8'));

// Une couleur par thème : "main" pour les bandeaux, "dark" pour le texte, "tint" pour les fonds.
const PALETTE = [
  { main: '#2563EB', dark: '#1E40AF', tint: '#EFF4FF' },
  { main: '#7C3AED', dark: '#5B21B6', tint: '#F4EFFE' },
  { main: '#0891B2', dark: '#155E75', tint: '#ECF8FB' },
  { main: '#059669', dark: '#065F46', tint: '#ECFAF4' },
  { main: '#D97706', dark: '#92400E', tint: '#FEF6E7' },
  { main: '#DC2626', dark: '#991B1B', tint: '#FEF0F0' },
  { main: '#4F46E5', dark: '#3730A3', tint: '#EFEFFD' },
  { main: '#DB2777', dark: '#9D174D', tint: '#FDEFF6' },
  { main: '#EA580C', dark: '#9A3412', tint: '#FEF2EA' },
  { main: '#4D7C0F', dark: '#3F6212', tint: '#F3F8EA' },
  { main: '#0F766E', dark: '#115E59', tint: '#EBF7F6' },
];

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const nbsp = (s) =>
  s.replace(/ ([?!:;»])/g, '\u00A0$1').replace(/« /g, '«\u00A0').replace(/(\d) (\d{3})/g, '$1\u202F$2');
const inline = (s = '') => nbsp(esc(s)).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const paras = (s = '') =>
  String(s)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
    .map((p) => `<p>${inline(p)}</p>`)
    .join('');

let qn = 0;
const sectionHtml = (s, i) => {
  const c = PALETTE[i % PALETTE.length];
  const qs = s.questions
    .map((q) => {
      qn += 1;
      return `
      <article class="q" style="--main:${c.main};--dark:${c.dark};--tint:${c.tint}">
        <h3><span class="num">Q${qn}</span>${inline(q.question)}</h3>
        ${q.checks ? `<div class="checks"><span>${esc(s.checksLabel || "Ce qu'on vérifie :")}</span> ${inline(q.checks)}</div>` : ''}
        <div class="answer">${paras(q.answer)}</div>
        ${q.tip ? `<div class="tip"><span>Conseil</span>${inline(q.tip)}</div>` : ''}
      </article>`;
    })
    .join('');
  return `
    <section class="sec" style="--main:${c.main};--dark:${c.dark};--tint:${c.tint}">
      <header class="sec-head">
        <div class="sec-num">${i + 1}</div>
        <div>
          <h2>${inline(s.title)}</h2>
          ${s.goal ? `<p class="goal">${inline(s.goal)}</p>` : ''}
        </div>
      </header>
      ${qs}
    </section>`;
};

const list = (items = []) => `<ul>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`;
const m = doc.meta;
const intro = doc.intro || {};

// Sommaire avec les couleurs de chaque thème.
let count = 0;
const toc = doc.sections
  .map((s, i) => {
    const c = PALETTE[i % PALETTE.length];
    const from = count + 1;
    count += s.questions.length;
    return `<li><span class="dot" style="background:${c.main}"></span><b>${i + 1}. ${inline(
      s.title,
    )}</b><em>Q${from}–Q${count}</em></li>`;
  })
  .join('');

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>${esc(m.title)}</title>
<style>
  @page { size: A4; margin: 15mm 15mm 17mm 15mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Inter', 'DejaVu Sans', sans-serif; color: #1F2430; margin: 0;
         font-size: 14.5pt; line-height: 1.58; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  strong { font-weight: 700; color: var(--dark, #111); }
  .cover { page-break-after: always; }
  .cover .band { background: #0F172A; color: #fff; border-radius: 14px; padding: 24px 28px 20px; }
  .cover .band strong { color: #fff; }
  .cover .kicker { font-size: 11pt; letter-spacing: .14em; text-transform: uppercase; color: #93C5FD; font-weight: 600; }
  .cover h1 { font-size: 27pt; line-height: 1.15; margin: 10px 0 8px; }
  .cover .sub { font-size: 15pt; color: #CBD5E1; margin: 0; }
  .cover .meta { display: flex; gap: 22px; margin-top: 18px; font-size: 12pt; color: #E2E8F0; flex-wrap: wrap; }
  .cover .meta b { color: #fff; }
  .box { border-radius: 12px; padding: 12px 18px; margin-top: 12px; background: #F5F7FA; border: 1px solid #E3E8EF; }
  .box h2 { font-size: 15pt; margin: 0 0 6px; color: #0F172A; }
  .box ul { margin: 4px 0 0; padding-left: 20px; font-size: 12pt; line-height: 1.45; }
  .box li { margin: 3px 0; }
  .toc { list-style: none; padding: 0; margin: 4px 0 0; font-size: 11.5pt; }
  .toc li { margin: 2px 0; display: flex; align-items: baseline; gap: 10px; border-bottom: 1px dotted #D5DCE5; padding: 2px 0; }
  .toc li em { color: #64748B; font-style: normal; margin-left: auto; font-size: 10.5pt; white-space: nowrap; }
  .dot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; flex: none; transform: translateY(1px); }
  .page { page-break-after: always; }
  .page h2.title { font-size: 21pt; margin: 0 0 4px; color: #0F172A; }
  .steps { counter-reset: st; list-style: none; padding: 0; margin: 8px 0 0; }
  .steps li { counter-increment: st; position: relative; padding: 8px 0 8px 44px; border-bottom: 1px solid #E8ECF2; font-size: 12.5pt; line-height: 1.5; }
  .steps li::before { content: counter(st); position: absolute; left: 0; top: 8px; width: 30px; height: 30px; border-radius: 50%;
                      background: #2563EB; color: #fff; font-weight: 700; text-align: center; line-height: 30px; font-size: 13pt; }
  .memo { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
  .memo div { background: #F5F7FA; border: 1px solid #E3E8EF; border-radius: 10px; padding: 9px 12px; font-size: 11.5pt; line-height: 1.45; break-inside: avoid; }
  .memo b { display: block; font-size: 10pt; text-transform: uppercase; letter-spacing: .08em; color: #2563EB; margin-bottom: 2px; }
  .sec { page-break-before: always; }
  .sec-head { display: flex; gap: 16px; align-items: center; background: var(--main); color: #fff; border-radius: 14px; padding: 16px 20px; margin-bottom: 18px; }
  .sec-num { font-size: 30pt; font-weight: 800; line-height: 1; opacity: .9; min-width: 40px; text-align: center; }
  .sec-head h2 { font-size: 21pt; margin: 0; line-height: 1.2; }
  .sec-head .goal { margin: 4px 0 0; font-size: 12pt; line-height: 1.4; opacity: .95; }
  .q { break-inside: avoid; border-left: 6px solid var(--main); padding: 2px 0 2px 16px; margin: 0 0 22px; }
  .q h3 { font-size: 17.5pt; line-height: 1.3; margin: 0 0 6px; color: var(--dark); font-weight: 750; }
  .q .num { display: inline-block; background: var(--main); color: #fff; font-size: 11pt; font-weight: 700; border-radius: 999px;
            padding: 2px 10px; margin-right: 10px; transform: translateY(-2px); }
  .checks { font-size: 11pt; color: #5B6475; font-style: italic; margin: 0 0 8px; line-height: 1.4; }
  .checks span { font-style: normal; font-weight: 600; color: #475569; }
  .answer p { margin: 0 0 9px; }
  .tip { background: var(--tint); border-radius: 9px; padding: 8px 12px; font-size: 11.5pt; line-height: 1.45; color: #2B3240; }
  .tip span { font-weight: 700; color: var(--dark); text-transform: uppercase; font-size: 9.5pt; letter-spacing: .08em; margin-right: 8px; }
  .final { page-break-before: always; }
  .box { break-inside: avoid; }
</style></head><body>

<div class="cover">
  <div class="band">
    <div class="kicker">${esc(m.kicker || 'Simulation d’entretien')}</div>
    <h1>${inline(m.title)}</h1>
    <p class="sub">${inline(m.subtitle || '')}</p>
    <div class="meta">${(m.facts || []).map((f) => `<span>${inline(f)}</span>`).join('')}</div>
  </div>
  ${intro.howto ? `<div class="box"><h2>Comment utiliser ce document</h2>${list(intro.howto)}</div>` : ''}
  <div class="box"><h2>Sommaire — ${qn === 0 ? doc.sections.reduce((a, s) => a + s.questions.length, 0) : qn} questions</h2><ul class="toc">${toc}</ul></div>
</div>

${
  intro.deroule || intro.regles
    ? `<div class="page">
  ${intro.deroule ? `<h2 class="title">Le déroulé probable</h2><ol class="steps">${intro.deroule.map((d) => `<li>${inline(d)}</li>`).join('')}</ol>` : ''}
  ${intro.regles ? `<div class="box"><h2>Les règles d’or des experts</h2>${list(intro.regles)}</div>` : ''}
</div>`
    : ''
}

${
  intro.memo
    ? `<div class="page"><h2 class="title">${esc(intro.memoTitle || 'Wavestone en bref')}</h2>
  ${intro.memoIntro ? `<p style="font-size:12.5pt;color:#475569;margin:0">${inline(intro.memoIntro)}</p>` : ''}
  <div class="memo">${intro.memo.map((x) => `<div><b>${esc(x.label)}</b>${inline(x.value)}</div>`).join('')}</div>
  ${intro.memoNote ? `<p style="font-size:10pt;color:#64748B;margin-top:10px">${inline(intro.memoNote)}</p>` : ''}
</div>`
    : ''
}

${doc.sections.map(sectionHtml).join('')}

${
  doc.final
    ? `<section class="final"><h2 class="title" style="font-size:21pt;margin:0 0 6px">${esc(doc.final.title)}</h2>
  ${doc.final.blocks.map((b) => `<div class="box"><h2>${esc(b.title)}</h2>${list(b.items)}</div>`).join('')}
</section>`
    : ''
}
</body></html>`;

const htmlPath = output.replace(/\.pdf$/i, '.html');
writeFileSync(htmlPath, html);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
await page.pdf({
  path: output,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: `<div style="width:100%;font-size:8.5pt;color:#94A3B8;font-family:Inter,sans-serif;padding:0 15mm;display:flex;justify-content:space-between">
    <span>${esc(m.footer || m.title)}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  margin: { top: '15mm', bottom: '17mm', left: '15mm', right: '15mm' },
});
await browser.close();
console.log('PDF écrit :', output);
