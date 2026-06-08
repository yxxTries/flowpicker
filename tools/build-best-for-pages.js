// Generates "best <layer> for <segment>" pages from real attrs.
// Output: /best-for/<slug>.html  (e.g. best-llm-for-budget.html)
// Each page is a config-defined segment: a filter that selects matching products
// and a ranker that orders them, plus an honest intro and a #1 pick rationale.
// Run: node tools/build-best-for-pages.js

const fs = require('fs');
const path = require('path');
const L = require('./lib/seo-data');

const OUT_DIR = path.join(L.ROOT, 'best-for');
const OUT_REL = 'best-for';
const TOP_N = 8;

// Helpers shared by segment definitions.
const isFree = o => L.parsePrice(o.attrs.pricing) === 0 || /free/i.test(o.attrs.pricing || '') || /free/i.test(o.attrs.priceTier || '');
const isOpen = o => /^yes/i.test(o.attrs.openSource || '') || /open|self/i.test(o.attrs.hosting || '');
const swe = o => L.parsePct(o.attrs.sweBench) ?? -1;
const inPrice = o => { const p = L.parsePrice(o.attrs.priceInput); return p == null ? Infinity : p; };
const ctx = o => L.parseContext(o.attrs.contextWindow) ?? -1;
const langMatch = (o, re) => re.test(o.attrs.languages || '') || re.test(o.attrs.bestFor || '') || re.test(o.attrs.capabilities || '');
const popFirst = layerId => (a, b) => (L.isPopular(layerId, b.id) - L.isPopular(layerId, a.id)) || a.position - b.position;

// Each segment: { slug, layer, h1, intro, keyword, filter, rank, pickWhy(top), cols }
const SEGMENTS = [
  // ---- LLM segments ----
  {
    slug: 'best-llm-for-budget', layer: 'llm',
    h1: 'Best budget LLM for coding',
    keyword: 'cheap / budget LLM for coding',
    intro: 'The cheapest LLMs that are still genuinely usable for coding — ranked by input-token price, filtered to models with real benchmark scores so you are not just buying cheap-and-useless tokens.',
    filter: o => inPrice(o) !== Infinity && swe(o) >= 40,
    rank: (a, b) => inPrice(a) - inPrice(b),
    cols: ['priceInput', 'priceOutput', 'sweBench', 'contextWindow'],
    pickWhy: t => {
      const p = L.parsePrice(t.attrs.priceInput);
      const pricePhrase = p === 0 ? 'free to self-host (no token cost)' : `just $${p}/1M input tokens`;
      return `At ${pricePhrase} with a ${t.attrs.sweBench} SWE-bench score, ${t.name} is the cheapest model that still holds up on real coding tasks.`;
    },
  },
  {
    slug: 'best-llm-for-reasoning', layer: 'llm',
    h1: 'Best LLM for hard reasoning & debugging',
    keyword: 'best reasoning LLM for coding',
    intro: 'When your daily-driver model gets stuck, you escalate. These are the highest-scoring models on SWE-bench Verified — the benchmark that best tracks real, gnarly bug-fixing.',
    filter: o => swe(o) >= 60,
    rank: (a, b) => swe(b) - swe(a),
    cols: ['sweBench', 'humanEval', 'priceInput', 'contextWindow'],
    pickWhy: t => `${t.name} tops the tracked SWE-bench scores at ${t.attrs.sweBench} — the model to reach for when a problem is genuinely hard.`,
  },
  {
    slug: 'best-llm-for-long-context', layer: 'llm',
    h1: 'Best LLM for long-context refactors',
    keyword: 'largest context window LLM',
    intro: 'For whole-repo analysis and large refactors, context window size is the constraint that matters most. Ranked by maximum context window, filtered to coding-capable models.',
    filter: o => ctx(o) >= 200000,
    rank: (a, b) => ctx(b) - ctx(a),
    cols: ['contextWindow', 'maxOutput', 'sweBench', 'priceInput'],
    pickWhy: t => `${t.name} handles ${t.attrs.contextWindow} of context — enough to load a small repo or a full framework's docs in one shot.`,
  },
  {
    slug: 'best-open-source-llm-for-coding', layer: 'llm',
    h1: 'Best open-source / self-hostable LLM for coding',
    keyword: 'best open-source coding LLM',
    intro: 'Open-weight models you can run on your own hardware — your code never leaves your infrastructure. Ranked by SWE-bench among models with open weights or self-host options.',
    filter: o => isOpen(o) && swe(o) >= 40,
    rank: (a, b) => swe(b) - swe(a),
    cols: ['sweBench', 'contextWindow', 'hosting', 'priceInput'],
    pickWhy: t => `${t.name} is the strongest open-weight model we track for coding (${t.attrs.sweBench} SWE-bench) — run it locally for full privacy.`,
  },
  {
    slug: 'best-fast-llm-for-autocomplete', layer: 'llm',
    h1: 'Best fast LLM for autocomplete',
    keyword: 'fastest LLM for autocomplete',
    intro: 'Autocomplete lives or dies on latency. These are the models rated for fast, low-latency responses — the ones that feel instant as ghost-text.',
    filter: o => o.attrs.speedTier === 'Fast' || /fast|flash|haiku|mini|nano|lite/i.test(o.name),
    rank: (a, b) => inPrice(a) - inPrice(b),
    cols: ['speedTier', 'latency', 'priceInput', 'sweBench'],
    pickWhy: t => `${t.name} pairs fast responses with low cost — ideal for completion spam where speed beats raw reasoning.`,
  },

  // ---- IDE segments ----
  {
    slug: 'best-ide-for-python', layer: 'ide',
    h1: 'Best IDE for Python + AI coding',
    keyword: 'best AI IDE for Python',
    intro: 'AI-capable editors with strong Python support. Filtered to IDEs that explicitly support Python (or all languages) and ranked toward the most AI-native options.',
    filter: o => langMatch(o, /python|all/i),
    rank: popFirst('ide'),
    cols: ['languages', 'aiIntegration', 'os', 'pricing'],
    pickWhy: t => `${t.name} combines first-class Python support with strong AI integration (${t.attrs.aiIntegration || 'built-in'}).`,
  },
  {
    slug: 'best-free-ai-ide', layer: 'ide',
    h1: 'Best free AI coding IDE',
    keyword: 'best free AI IDE',
    intro: 'Editors with a genuinely free path to AI-assisted coding. Filtered to free or open IDEs, ranked by breadth and AI capability.',
    filter: o => isFree(o) || isOpen(o),
    rank: popFirst('ide'),
    cols: ['pricing', 'openSource', 'aiIntegration', 'os'],
    pickWhy: t => `${t.name} gives you AI coding without a subscription (${t.attrs.pricing || 'free'}).`,
  },
  {
    slug: 'best-ide-for-jetbrains-users', layer: 'ide',
    h1: 'Best AI editors for JetBrains-style workflows',
    keyword: 'AI IDE for JetBrains users',
    intro: 'If you live in JetBrains or want a polished, full-IDE experience (not a lightweight text editor), these are the AI-capable options ranked for you.',
    filter: o => /java|kotlin|jetbrains|all major/i.test(`${o.attrs.languages} ${o.attrs.bestFor} ${o.name}`),
    rank: popFirst('ide'),
    cols: ['languages', 'aiIntegration', 'extensibility', 'pricing'],
    pickWhy: t => `${t.name} suits heavier, IDE-style work with broad language support.`,
  },

  // ---- Integration segments ----
  {
    slug: 'best-free-ai-coding-assistant', layer: 'integration',
    h1: 'Best free AI coding assistant',
    keyword: 'best free AI coding assistant',
    intro: 'AI coding integrations with a real free tier or BYO-API-key path. Ranked toward the most widely-supported, lowest-friction options.',
    filter: o => isFree(o) || isOpen(o) || /byo|free/i.test(o.attrs.pricing || ''),
    rank: popFirst('integration'),
    cols: ['pricing', 'compatibility', 'modelChoice', 'openSource'],
    pickWhy: t => `${t.name} delivers AI assistance with no paywall (${t.attrs.pricing || 'free'}) across ${t.attrs.compatibility || 'major editors'}.`,
  },
  {
    slug: 'best-open-source-copilot-alternative', layer: 'integration',
    h1: 'Best open-source GitHub Copilot alternative',
    keyword: 'open-source Copilot alternative',
    intro: 'Open-source AI coding integrations you can audit, self-host, or run with your own API key — the privacy-respecting alternatives to GitHub Copilot.',
    filter: o => isOpen(o),
    rank: popFirst('integration'),
    cols: ['openSource', 'compatibility', 'modelChoice', 'privacy'],
    pickWhy: t => `${t.name} is open source and lets you bring your own model — full control over where your code goes.`,
  },

  // ---- Context / RAG segments ----
  {
    slug: 'best-context-layer-for-privacy', layer: 'context',
    h1: 'Best private / self-hosted context & RAG layer',
    keyword: 'self-hosted RAG for code',
    intro: 'Code-context and RAG layers you can run entirely on your own infrastructure — no code shipped to a third-party index. Filtered to local / self-hostable options.',
    filter: o => isOpen(o) || /local|self/i.test(o.attrs.hosting || ''),
    rank: popFirst('context'),
    cols: ['hosting', 'indexType', 'updateMode', 'openSource'],
    pickWhy: t => `${t.name} runs locally / self-hosted, so your code never leaves your machines while still giving the LLM repo context.`,
  },
  {
    slug: 'best-realtime-codebase-context', layer: 'context',
    h1: 'Best real-time codebase context for AI agents',
    keyword: 'real-time codebase indexing',
    intro: 'Autonomous agents act on stale code when their context is a batch index. These context layers update in real time, so the agent always sees current code.',
    filter: o => /real|live|auto|incremental/i.test(`${o.attrs.updateMode} ${o.attrs.staleness} ${o.attrs.capabilities}`),
    rank: popFirst('context'),
    cols: ['updateMode', 'staleness', 'indexType', 'hosting'],
    pickWhy: t => `${t.name} keeps its index fresh (${t.attrs.updateMode || 'real-time'}), the safest choice when an agent is editing live code.`,
  },

  // ---- Agent segments ----
  {
    slug: 'best-autonomous-coding-agent', layer: 'agent',
    h1: 'Best autonomous coding agent',
    keyword: 'best autonomous coding agent',
    intro: 'Agents that can plan and execute multi-step coding tasks with minimal hand-holding. Filtered to autonomous / semi-autonomous agents.',
    filter: o => /autonom/i.test(o.attrs.autonomy || ''),
    rank: popFirst('agent'),
    cols: ['autonomy', 'cost', 'contextHandling', 'guardrails'],
    pickWhy: t => `${t.name} runs ${t.attrs.autonomy?.toLowerCase() || 'autonomously'} — it plans and executes multi-file changes with limited supervision.`,
  },
  {
    slug: 'best-open-source-coding-agent', layer: 'agent',
    h1: 'Best open-source coding agent',
    keyword: 'open-source coding agent',
    intro: 'Coding agents you can run, inspect, and extend yourself. Filtered to open-source agents and orchestration frameworks.',
    filter: o => isOpen(o),
    rank: popFirst('agent'),
    cols: ['openSource', 'autonomy', 'cost', 'contextHandling'],
    pickWhy: t => `${t.name} is open source — run it locally, wire in any model, and audit exactly what it does.`,
  },
];

function renderSegment(seg, layers) {
  const layer = layers.find(l => l.id === seg.layer);
  const layerTitle = L.LAYER_TITLES[seg.layer] || seg.layer;
  const canonical = `${L.SITE_BASE}/${OUT_REL}/${seg.slug}.html`;

  const matches = layer.options
    .filter(o => o.id !== 'none' && L.has(o.attrs.bestFor))
    .filter(seg.filter)
    .sort(seg.rank)
    .slice(0, TOP_N);

  if (matches.length < 3) return null; // not enough to make a credible list

  const top = matches[0];
  const title = `${seg.h1} (${L.YEAR}) — ranked picks`;
  const description = `${seg.intro}`.slice(0, 155);

  const cols = seg.cols.filter(k => matches.some(o => L.has(o.attrs[k])));
  const headRow = `<tr><th>#</th><th>${seg.layer === 'llm' ? 'Model' : 'Tool'}</th>${cols.map(k => `<th>${L.escapeHtml(L.ATTR_LABELS[k] || k)}</th>`).join('')}</tr>`;
  const bodyRows = matches.map((o, i) => {
    const cells = cols.map(k => `<td>${L.has(o.attrs[k]) ? L.escapeHtml(o.attrs[k]) : '—'}</td>`).join('');
    return `          <tr><td>${i + 1}</td><td><a href="${L.escapeHtml(L.toolHref(seg.layer, o.id))}">${L.escapeHtml(o.name)}</a></td>${cells}</tr>`;
  }).join('\n');

  const cards = matches.map((o, i) => `      <div class="seo-rank-item">
        <h3><span class="seo-alt-rank">${i + 1}</span> <a href="${L.escapeHtml(L.toolHref(seg.layer, o.id))}">${L.escapeHtml(o.name)}</a></h3>
        <p>${L.escapeHtml(o.attrs.bestFor)}${L.has(o.attrs.notes) ? ` ${L.escapeHtml(o.attrs.notes)}.` : ''}</p>
      </div>`).join('\n');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: seg.h1,
    itemListElement: matches.map((o, i) => ({
      '@type': 'ListItem', position: i + 1, name: o.name,
      url: `${L.SITE_BASE}/tools/${seg.layer}/${L.slug(o.id)}/`,
    })),
  };

  return L.pageHead({ title, description, canonical, jsonLd })
    + `
    <p class="seo-breadcrumb"><a href="../">Home</a> › <a href="../compare.html">Compare</a> › ${L.escapeHtml(seg.h1)}</p>

    <section class="seo-hero">
      <h1>${L.escapeHtml(seg.h1)} (${L.YEAR})</h1>
      <p>${L.escapeHtml(seg.intro)}</p>
    </section>

    <section class="seo-section">
      <h2>🏆 Top pick: ${L.escapeHtml(top.name)}</h2>
      <p>${L.escapeHtml(seg.pickWhy(top))}</p>
      <p><a href="${L.escapeHtml(L.toolHref(seg.layer, top.id))}">Full ${L.escapeHtml(top.name)} profile →</a></p>
    </section>

    <section class="seo-section">
      <h2>The ranked list</h2>
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
      <h2>Why each made the list</h2>
      <div class="seo-rank-list">
${cards}
      </div>
    </section>

    <div class="seo-cta">
      <p class="seo-cta-text">Found your pick? Build a full stack around it — Flowpicker shows compatibility warnings before you commit.</p>
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

  let count = 0, skipped = [];
  for (const seg of SEGMENTS) {
    const html = renderSegment(seg, layers);
    if (!html) { skipped.push(seg.slug); continue; }
    fs.writeFileSync(path.join(OUT_DIR, `${seg.slug}.html`), html, 'utf8');
    count++;
  }
  console.log(`Wrote ${count} best-for pages under ${OUT_DIR}` + (skipped.length ? ` (skipped ${skipped.join(', ')} — too few matches)` : ''));
})();
