// Generates "<X> alternatives" pages — one per notable product.
// Output: /alternatives/<slug>-alternatives.html
// Each page ranks same-layer peers and gives a concrete, data-derived reason to
// consider each one (cheaper, faster, open-source, bigger context, etc.), so the
// page answers the query instead of being a bare list. Cross-links to an existing
// /compare or /vs head-to-head page when one exists, else the peer's profile.
// Run: node tools/build-alternatives-pages.js

const fs = require('fs');
const path = require('path');
const L = require('./lib/seo-data');

const OUT_DIR = path.join(L.ROOT, 'alternatives');
const OUT_REL = 'alternatives';
const MAX_ALTS = 6;

// Score how relevant peer B is as an alternative to subject A within a layer.
// Higher = more relevant. Combines benchmark proximity, price proximity, shared
// capabilities, and a popularity nudge.
function relevance(layerId, A, B) {
  let score = 0;
  const a = A.attrs, b = B.attrs;

  const swa = L.parsePct(a.sweBench), swb = L.parsePct(b.sweBench);
  if (swa != null && swb != null) score += 40 - Math.min(40, Math.abs(swa - swb));

  const pa = L.parsePrice(a.priceInput), pb = L.parsePrice(b.priceInput);
  if (pa != null && pb != null) {
    const ratio = pa === 0 || pb === 0 ? 2 : Math.max(pa, pb) / Math.max(0.01, Math.min(pa, pb));
    score += Math.max(0, 20 - (ratio - 1) * 4);
  }

  const overlap = (s1, s2) => {
    if (!L.has(s1) || !L.has(s2)) return 0;
    const w1 = new Set(String(s1).toLowerCase().split(/[\s,/]+/).filter(w => w.length > 3));
    const w2 = String(s2).toLowerCase().split(/[\s,/]+/).filter(w => w.length > 3);
    return w2.filter(w => w1.has(w)).length;
  };
  score += overlap(a.bestFor, b.bestFor) * 6;
  score += overlap(a.capabilities, b.capabilities) * 3;

  if (L.isPopular(layerId, B.id)) score += 12;
  score += Math.max(0, 6 - (B.position || 0) * 0.1);
  return score;
}

// A concrete reason to consider B instead of A — grounded in real attr diffs.
function switchReason(layerId, A, B) {
  const a = A.attrs, b = B.attrs;
  const reasons = [];

  if (layerId === 'llm') {
    const pa = L.parsePrice(a.priceInput), pb = L.parsePrice(b.priceInput);
    if (pa != null && pb != null && pb < pa) {
      const mult = pb > 0 ? (pa / pb).toFixed(1) : null;
      reasons.push(`Cheaper — $${pb}/1M input vs $${pa}${mult && pb > 0 ? `, ~${mult}× less` : ''}`);
    }
    const swa = L.parsePct(a.sweBench), swb = L.parsePct(b.sweBench);
    if (swa != null && swb != null && swb > swa) reasons.push(`Higher SWE-bench (${swb}% vs ${swa}%)`);
    const ca = L.parseContext(a.contextWindow), cb = L.parseContext(b.contextWindow);
    if (ca != null && cb != null && cb > ca) reasons.push(`Bigger context window (${b.contextWindow})`);
    if (/^yes/i.test(b.openSource) && !/^yes/i.test(a.openSource)) reasons.push('Open weights / self-hostable');
    if (b.speedTier === 'Fast' && a.speedTier !== 'Fast') reasons.push('Faster — better for autocomplete');
  } else {
    const fb = L.parsePrice(b.pricing) === 0 || /free/i.test(b.pricing || '');
    const fa = L.parsePrice(a.pricing) === 0 || /free/i.test(a.pricing || '');
    if (fb && !fa) reasons.push(`Has a free tier (${b.pricing})`);
    if (/^yes/i.test(b.openSource) && !/^yes/i.test(a.openSource)) reasons.push('Open source / self-hostable');
    if (L.has(b.compatibility) && b.compatibility !== a.compatibility) reasons.push(`Different IDE support: ${b.compatibility}`);
    if (L.has(b.os) && b.os !== a.os) reasons.push(`Runs on ${b.os}`);
    if (b.setup === 'Zero' && a.setup && a.setup !== 'Zero') reasons.push('Zero setup vs heavier config');
    if (L.has(b.interface) && b.interface !== a.interface) reasons.push(`${b.interface} interface`);
    if (L.has(b.modelChoice) && b.modelChoice !== a.modelChoice) reasons.push(`Model choice: ${b.modelChoice}`);
    if (L.has(b.autonomy) && b.autonomy !== a.autonomy) reasons.push(`${b.autonomy} autonomy level`);
    if (L.has(b.indexType) && b.indexType !== a.indexType) reasons.push(`${b.indexType} indexing`);
  }

  if (!reasons.length && L.has(b.bestFor)) reasons.push(`Built for: ${b.bestFor}`);
  return reasons.slice(0, 3);
}

function renderAlt(layerId, layerTitle, subject, peers) {
  const sSlug = L.slug(subject.id);
  const canonical = `${L.SITE_BASE}/${OUT_REL}/${sSlug}-alternatives.html`;
  const noun = L.LAYER_NOUN[layerId] || 'tool';

  const ranked = peers
    .map(p => ({ opt: p, score: relevance(layerId, subject, p) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, MAX_ALTS)
    .map(x => x.opt);

  const title = `${subject.name} alternatives — ${ranked.length} ${noun} options compared (${L.YEAR})`;
  const description = `The best ${subject.name} alternatives for AI coding in ${L.YEAR}: ${ranked.slice(0, 4).map(p => p.name).join(', ')} and more — with the real reason to switch to each.`;

  const cards = ranked.map((p, i) => {
    const reasons = switchReason(layerId, subject, p);
    const reasonHtml = reasons.map(r => `<li>${L.escapeHtml(r)}</li>`).join('');
    // Prefer a real head-to-head page when one exists; otherwise the profile.
    const cmp = L.comparePageFor(subject.id, p.id);
    const link = cmp
      ? `<a href="${L.escapeHtml(cmp.href)}">${L.escapeHtml(subject.name)} vs ${L.escapeHtml(p.name)} →</a>`
      : `<a href="${L.escapeHtml(L.toolHref(layerId, p.id))}">View ${L.escapeHtml(p.name)} profile →</a>`;
    return `      <div class="seo-alt">
        <div class="seo-alt-head">
          <span class="seo-alt-rank">${i + 1}</span>
          <h3><a href="${L.escapeHtml(L.toolHref(layerId, p.id))}">${L.escapeHtml(p.name)}</a></h3>
        </div>
        <p class="seo-alt-tagline">${L.escapeHtml(p.attrs.bestFor || p.attrs.notes || layerTitle)}</p>
        <p class="seo-alt-why">Why consider it instead:</p>
        <ul>${reasonHtml}</ul>
        <p class="seo-alt-links">${link}</p>
      </div>`;
  }).join('\n');

  const tableKeys = layerId === 'llm'
    ? ['priceInput', 'sweBench', 'contextWindow', 'speedTier']
    : ['pricing', 'openSource', 'setup', 'compatibility'];
  const allForTable = [subject, ...ranked];
  const usableKeys = tableKeys.filter(k => allForTable.some(o => L.has(o.attrs[k])));
  const headRow = `<tr><th>${noun === 'LLM' ? 'Model' : 'Tool'}</th>${usableKeys.map(k => `<th>${L.escapeHtml(L.ATTR_LABELS[k] || k)}</th>`).join('')}</tr>`;
  const bodyRows = allForTable.map(o => {
    const cells = usableKeys.map(k => `<td>${L.has(o.attrs[k]) ? L.escapeHtml(o.attrs[k]) : '—'}</td>`).join('');
    const nameCell = o.id === subject.id
      ? `<td><strong>${L.escapeHtml(o.name)}</strong> (you)</td>`
      : `<td><a href="${L.escapeHtml(L.toolHref(layerId, o.id))}">${L.escapeHtml(o.name)}</a></td>`;
    return `          <tr>${nameCell}${cells}</tr>`;
  }).join('\n');

  const jsonLd = L.articleJsonLd({ title, description, canonical });

  return L.pageHead({ title, description, canonical, jsonLd })
    + `
    <p class="seo-breadcrumb"><a href="../">Home</a> › <a href="../compare.html">Compare</a> › ${L.escapeHtml(subject.name)} alternatives</p>

    <section class="seo-hero">
      <h1>${L.escapeHtml(subject.name)} alternatives</h1>
      <p>Looking for an alternative to ${L.escapeHtml(subject.name)}? Here are the ${ranked.length} closest ${L.escapeHtml(layerTitle.toLowerCase())} options for AI coding, each ranked by how well it replaces ${L.escapeHtml(subject.name)} — with the concrete reason to switch.</p>
    </section>

    <section class="seo-section">
      <h2>Quick comparison</h2>
      <table class="seo-compare-table">
        <thead>
          ${headRow}
        </thead>
        <tbody>
${bodyRows}
        </tbody>
      </table>
    </section>

    <section class="seo-section">
      <h2>The best ${L.escapeHtml(subject.name)} alternatives</h2>
      <div class="seo-alt-list">
${cards}
      </div>
    </section>

    <div class="seo-cta">
      <p class="seo-cta-text">Switching from ${L.escapeHtml(subject.name)}? Check the new tool fits the rest of your stack — Flowpicker shows compatibility warnings live.</p>
      <a class="seo-cta-link" href="../index.html">Open the stack planner →</a>
    </div>
`
    + L.pageFoot();
}

(function main() {
  const layers = L.loadLayers();
  L.mkdirp(OUT_DIR);
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.endsWith('.html')) fs.rmSync(path.join(OUT_DIR, f));
  }

  let count = 0;
  for (const layer of layers) {
    const layerTitle = L.LAYER_TITLES[layer.id] || layer.name;
    const notable = layer.options.filter(o => L.isNotable(layer.id, o));
    for (const subject of notable) {
      const peers = notable.filter(o => o.id !== subject.id);
      if (peers.length < 2) continue;
      const html = renderAlt(layer.id, layerTitle, subject, peers);
      fs.writeFileSync(path.join(OUT_DIR, `${L.slug(subject.id)}-alternatives.html`), html, 'utf8');
      count++;
    }
  }
  console.log(`Wrote ${count} alternatives pages under ${OUT_DIR}`);
})();
