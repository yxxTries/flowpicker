// Generates "<X> pricing" pages for products that have pricing data.
// Output: /pricing/<slug>-pricing.html
// For LLMs: token-price breakdown + a worked monthly cost estimate at sample
// volumes, plus the 3 cheapest same-layer alternatives. For tools: tier/pricing
// model breakdown. Every page carries unique numbers, so it is not thin.
// Run: node tools/build-pricing-pages.js

const fs = require('fs');
const path = require('path');
const L = require('./lib/seo-data');

const OUT_DIR = path.join(L.ROOT, 'pricing');
const OUT_REL = 'pricing';

// Sample monthly workloads for the LLM cost estimate (input/output token millions).
const WORKLOADS = [
  { label: 'Light (hobby)', inM: 2, outM: 0.5 },
  { label: 'Daily driver', inM: 15, outM: 4 },
  { label: 'Heavy / agentic', inM: 80, outM: 20 },
];

function money(n) {
  if (n === 0) return '$0';
  if (n < 1) return '$' + n.toFixed(2);
  if (n < 100) return '$' + n.toFixed(1);
  return '$' + Math.round(n).toLocaleString();
}

function hasPricingData(layerId, o) {
  const a = o.attrs;
  if (o.id === 'none') return false;
  if (layerId === 'llm') return L.parsePrice(a.priceInput) != null;
  return L.has(a.pricing);
}

function renderLlmPricing(o, peers) {
  const a = o.attrs;
  const slugId = L.slug(o.id);
  const canonical = `${L.SITE_BASE}/${OUT_REL}/${slugId}-pricing.html`;
  const pin = L.parsePrice(a.priceInput), pout = L.parsePrice(a.priceOutput);

  const title = `${o.name} pricing (${L.YEAR}) — token cost & monthly estimate`;
  const description = `${o.name} pricing: $${pin}/1M input, ${L.has(a.priceOutput) ? `$${pout}/1M output` : 'output varies'}. Worked monthly cost estimates and cheaper alternatives.`;

  const priceRows = [
    ['Input tokens', a.priceInput], ['Output tokens', a.priceOutput],
    ['Cached input', a.priceCache], ['Price tier', a.priceTier],
  ].filter(([, v]) => L.has(v))
   .map(([k, v]) => `          <tr><td>${k}</td><td>${L.escapeHtml(v)} ${k.includes('tokens') || k.includes('input') ? '<span class="seo-na">/ 1M tokens</span>' : ''}</td></tr>`)
   .join('\n');

  const estRows = WORKLOADS.map(w => {
    const cost = (pin || 0) * w.inM + (pout != null ? pout : (pin || 0) * 4) * w.outM;
    return `          <tr><td>${w.label}</td><td>${w.inM}M in / ${w.outM}M out</td><td><strong>${money(cost)}/mo</strong></td></tr>`;
  }).join('\n');

  const cheaper = peers
    .filter(p => { const pp = L.parsePrice(p.attrs.priceInput); return pp != null && (pin == null || pp < pin); })
    .sort((x, y) => L.parsePrice(x.attrs.priceInput) - L.parsePrice(y.attrs.priceInput))
    .slice(0, 3);
  const cheaperHtml = cheaper.length
    ? `      <ul>\n${cheaper.map(p => `        <li><a href="${L.escapeHtml(L.toolHref('llm', p.id))}">${L.escapeHtml(p.name)}</a> — $${L.parsePrice(p.attrs.priceInput)}/1M input${L.has(p.attrs.sweBench) ? ` (${p.attrs.sweBench} SWE-bench)` : ''}</li>`).join('\n')}\n      </ul>`
    : `      <p class="seo-empty">${L.escapeHtml(o.name)} is already among the cheapest models we track.</p>`;

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: o.name,
    description: a.bestFor || `${o.name} LLM pricing`,
    offers: { '@type': 'Offer', priceCurrency: 'USD', price: String(pin ?? 0), description: `$${a.priceInput}/1M input tokens` },
  };

  return L.pageHead({ title, description, canonical, jsonLd })
    + `
    <p class="seo-breadcrumb"><a href="../">Home</a> › <a href="../compare.html">Compare</a> › ${L.escapeHtml(o.name)} pricing</p>

    <section class="seo-hero">
      <h1>${L.escapeHtml(o.name)} pricing</h1>
      <p>${L.escapeHtml(o.name)} is a ${L.escapeHtml(a.priceTier ? a.priceTier.toLowerCase() + '-tier ' : '')}LLM from ${L.escapeHtml(a.provider || 'its provider')}. Here's the full token-price breakdown and what it actually costs per month at real coding workloads.</p>
    </section>

    <section class="seo-section">
      <h2>Token pricing</h2>
      <table class="seo-compare-table">
        <tbody>
${priceRows}
        </tbody>
      </table>
    </section>

    <section class="seo-section">
      <h2>What it costs per month</h2>
      <p>Estimated API cost at three typical AI-coding workloads (caching off — real bills are usually lower):</p>
      <table class="seo-compare-table">
        <thead><tr><th>Workload</th><th>Volume</th><th>Est. cost</th></tr></thead>
        <tbody>
${estRows}
        </tbody>
      </table>
      <p style="font-size:13px;color:var(--muted);">Estimates assume ${L.has(a.priceOutput) ? 'the listed output price' : '~4× the input price for output'}. Prompt caching (${L.has(a.priceCache) ? `${a.priceCache}/1M` : 'where available'}) can cut input cost substantially on repeated context.</p>
    </section>

    <section class="seo-section">
      <h2>Cheaper alternatives</h2>
${cheaperHtml}
    </section>

    <div class="seo-cta">
      <p class="seo-cta-text">Pair ${L.escapeHtml(o.name)} with the right tools — Flowpicker flags model/IDE compatibility before you spend.</p>
      <a class="seo-cta-link" href="../index.html">Open the stack planner →</a>
    </div>
`
    + L.pageFoot();
}

function renderToolPricing(layerId, layerTitle, o, peers) {
  const a = o.attrs;
  const slugId = L.slug(o.id);
  const canonical = `${L.SITE_BASE}/${OUT_REL}/${slugId}-pricing.html`;

  const title = `${o.name} pricing (${L.YEAR}) — plans, free tier & cost`;
  const description = `${o.name} pricing for AI coding: ${a.pricing}. ${L.has(a.cost) ? a.cost + '. ' : ''}Free-tier notes and cheaper alternatives.`;

  const rows = [
    ['Pricing', a.pricing], ['Cost model', a.cost], ['Open source', a.openSource],
    ['Setup effort', a.setup], ['Hosting', a.hosting],
  ].filter(([, v]) => L.has(v))
   .map(([k, v]) => `          <tr><td>${k}</td><td>${L.escapeHtml(v)}</td></tr>`)
   .join('\n');

  const free = peers.filter(p => /free|byo|open/i.test(p.attrs.pricing || '') || /^yes/i.test(p.attrs.openSource || '')).slice(0, 4);
  const freeHtml = free.length
    ? `      <ul>\n${free.map(p => `        <li><a href="${L.escapeHtml(L.toolHref(layerId, p.id))}">${L.escapeHtml(p.name)}</a> — ${L.escapeHtml(p.attrs.pricing || 'free / open')}</li>`).join('\n')}\n      </ul>`
    : `      <p class="seo-empty">Most ${L.escapeHtml(layerTitle.toLowerCase())} options in this layer are paid — see the <a href="../tools/${layerId}/">full ${L.escapeHtml(layerTitle.toLowerCase())} list</a>.</p>`;

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: o.name,
    description: a.bestFor || `${o.name} pricing`,
    offers: { '@type': 'Offer', priceCurrency: 'USD', description: a.pricing },
  };

  return L.pageHead({ title, description, canonical, jsonLd })
    + `
    <p class="seo-breadcrumb"><a href="../">Home</a> › <a href="../compare.html">Compare</a> › ${L.escapeHtml(o.name)} pricing</p>

    <section class="seo-hero">
      <h1>${L.escapeHtml(o.name)} pricing</h1>
      <p>${L.escapeHtml(o.name)} is ${L.escapeHtml(layerTitle.toLowerCase())} for AI coding${L.has(a.bestFor) ? ` — best for ${L.escapeHtml(a.bestFor.toLowerCase())}` : ''}. Here's how it's priced and what the free options are.</p>
    </section>

    <section class="seo-section">
      <h2>Pricing &amp; plans</h2>
      <table class="seo-compare-table">
        <tbody>
${rows}
        </tbody>
      </table>
    </section>

    <section class="seo-section">
      <h2>Free &amp; open-source alternatives</h2>
${freeHtml}
    </section>

    <div class="seo-cta">
      <p class="seo-cta-text">Weighing ${L.escapeHtml(o.name)}'s cost? Build the full stack and see total complexity in Flowpicker.</p>
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
    const eligible = layer.options.filter(o => L.isNotable(layer.id, o) && hasPricingData(layer.id, o));
    for (const o of eligible) {
      const peers = layer.options.filter(p => p.id !== o.id && p.id !== 'none');
      const html = layer.id === 'llm'
        ? renderLlmPricing(o, peers)
        : renderToolPricing(layer.id, layerTitle, o, peers);
      fs.writeFileSync(path.join(OUT_DIR, `${L.slug(o.id)}-pricing.html`), html, 'utf8');
      count++;
    }
  }
  console.log(`Wrote ${count} pricing pages under ${OUT_DIR}`);
})();
