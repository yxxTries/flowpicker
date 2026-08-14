// Generates the /ai-agents/ use-case pages — one page per agentic job
// ("AI agents for reception", "...for sales development", and so on).
//
// Unlike the other builders in this folder there is no database behind these:
// each page is hand-researched, so the research lives in tools/agent-pages/<slug>.js
// and this file owns only the shared four-part layout (intro → providers →
// how each handles it → pros and cons) plus the index grid on /ai-agents.html.
//
// Run: node tools/build-agent-pages.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'agent-pages');
const OUT_DIR = path.join(ROOT, 'ai-agents');
const INDEX_FILE = path.join(ROOT, 'ai-agents.html');
const SITE = 'https://flowpicker.xyz';

const esc = s => String(s).replace(/&(?!(?:[a-zA-Z]+|#\d+);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Nav is duplicated across the static pages in this repo rather than templated,
// so keep this in sync with ai-agents.html if the header ever changes.
const header = () => `    <header class="site-header">
      <a href="../" class="brand">Flowpicker</a>
      <nav class="site-nav" aria-label="Primary">
        <a href="../index.html">Plan</a>
        <a href="../browse.html" id="browse-link">Browse</a>
        <a href="../templates.html">Templates</a>
        <a href="../ai-agents.html" class="active">AI Agents</a>
        <a href="../compare.html">Compare</a>
        <a href="../leaderboard.html">Leaderboard</a>
        <a href="../saved.html">Saved</a>
      </nav>
      <nav class="browse-menu browse-menu-preview" aria-label="Layers" aria-hidden="true" hidden>
        <button type="button" class="browse-menu-item" data-layer="ide" style="--i:0" tabindex="-1">IDE / Editor</button>
        <button type="button" class="browse-menu-item" data-layer="llm" style="--i:1" tabindex="-1">LLM Provider / Model</button>
        <button type="button" class="browse-menu-item" data-layer="integration" style="--i:2" tabindex="-1">Integration</button>
        <button type="button" class="browse-menu-item" data-layer="context" style="--i:3" tabindex="-1">Context / RAG</button>
        <button type="button" class="browse-menu-item" data-layer="agent" style="--i:4" tabindex="-1">Agent / Orchestration</button>
        <button type="button" class="browse-menu-item" data-layer="others" style="--i:5" tabindex="-1">Others</button>
      </nav>
      <button type="button" id="dark-mode-toggle" class="dark-mode-toggle" aria-label="Toggle dark mode">🌙</button>
    </header>`;

function renderStats(stats) {
  if (!stats || !stats.length) return '';
  return `      <div class="agent-stats">
${stats.map(s => `        <div class="agent-stat">
          <span class="agent-stat-value">${s.value}</span>
          <span class="agent-stat-label">${s.label}</span>
        </div>`).join('\n')}
      </div>\n`;
}

function renderFlow(flow) {
  if (!flow || !flow.length) return '';
  const steps = flow.map(f =>
    `        <div class="agent-flow-step"><b>${f.step}</b><span>${f.text}</span></div>`);
  return `      <div class="agent-flow">
${steps.join('\n        <span class="agent-flow-arrow" aria-hidden="true">→</span>\n')}
      </div>\n`;
}

function renderBlocks(blocks) {
  if (!blocks || !blocks.length) return '';
  return blocks.map(b => `      <h3>${b.h3}</h3>\n${b.html}\n`).join('');
}

const ul = items => `      <ul>\n${items.map(i => `        <li>${i}</li>`).join('\n')}\n      </ul>\n`;

function renderTable(p) {
  const head = p.cols.map(c => `<th>${c}</th>`).join('');
  const body = p.rows.map(r => `            <tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('\n');
  return `      <div class="seo-table-scroll">
        <table class="seo-compare-table">
          <thead>
            <tr>${head}</tr>
          </thead>
          <tbody>
${body}
          </tbody>
        </table>
      </div>
${p.note ? `      <p class="agent-note">${p.note}</p>\n` : ''}`;
}

function renderProsCons(cards) {
  return `      <div class="agent-pc-grid">
${cards.map(c => `        <div class="agent-pc">
          <h3>${c.name}</h3>
          <p class="agent-pc-meta">${c.meta}</p>
          <ul>
${c.pros.map(p => `            <li class="is-pro">${p}</li>`).join('\n')}
${c.cons.map(p => `            <li class="is-con">${p}</li>`).join('\n')}
          </ul>
          <p class="agent-pc-verdict">${c.verdict}</p>
        </div>`).join('\n\n')}
      </div>\n`;
}

// ---- SEO blocks -------------------------------------------------------
// Three schema types per page: BreadcrumbList (sitelinks), ItemList (the
// provider set, which is what these pages actually rank for) and FAQPage
// (the only one here eligible for rich results in search).
function renderSchema(d, url) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'AI Agents', item: `${SITE}/ai-agents.html` },
      { '@type': 'ListItem', position: 3, name: d.cardTitle, item: url },
    ],
  };
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: d.h1,
    description: d.metaDesc,
    itemListElement: d.prosCons.map((c, i) => ({
      '@type': 'ListItem', position: i + 1, name: c.name,
    })),
  };
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: d.title,
    description: d.metaDesc,
    author: { '@type': 'Organization', name: 'Flowpicker', url: `${SITE}/` },
    publisher: { '@type': 'Organization', name: 'Flowpicker', logo: { '@type': 'ImageObject', url: `${SITE}/logo.svg` } },
    mainEntityOfPage: url,
    dateModified: d.updated,
  };
  const blocks = [breadcrumb, itemList, article];
  if (d.faq && d.faq.length) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: d.faq.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') },
      })),
    });
  }
  return blocks.map(b => `  <script type="application/ld+json">${JSON.stringify(b)}</script>`).join('\n');
}

function renderFaq(faq) {
  if (!faq || !faq.length) return '';
  return `    <section class="seo-section" id="faq">
      <h2>Frequently asked questions</h2>
${faq.map(f => `      <h3>${f.q}</h3>
      <p>${f.a}</p>`).join('\n')}
    </section>\n`;
}

// Internal links matter more than anything else on-page for a page cluster
// like this — every page links to every sibling.
function renderRelated(d, all) {
  const others = all.filter(p => p.slug !== d.slug);
  if (!others.length) return '';
  return `    <section class="seo-section" id="related">
      <h2>Other AI agent verticals</h2>
      <div class="agent-index-grid">
${others.map(p => `        <a class="agent-index-card" href="${p.slug}.html">
          <h3>${p.cardTitle}</h3>
          <p>${p.cardDesc}</p>
        </a>`).join('\n')}
      </div>
    </section>\n`;
}

function renderPage(d, all = []) {
  const url = `${SITE}/ai-agents/${d.slug}.html`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(d.title)}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <meta name="description" content="${esc(d.metaDesc)}" />
  <meta name="keywords" content="${esc((d.keywords || []).join(', '))}" />
  <link rel="canonical" href="${url}" />
  <meta property="article:modified_time" content="${d.updated}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${esc(d.title)}" />
  <meta property="og:description" content="${esc(d.metaDesc)}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:site_name" content="Flowpicker" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(d.title)}" />
  <meta name="twitter:description" content="${esc(d.metaDesc)}" />
  <meta name="twitter:image" content="${SITE}/og-image.png" />
${renderSchema(d, url)}

  <script async src="https://www.googletagmanager.com/gtag/js?id=G-P6NNRR7E8G"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-P6NNRR7E8G');
  </script>

  <script>
    (() => {
      const saved = localStorage.getItem('flowpicker-dark-mode');
      const isDark = saved !== null ? saved === 'true' : true;
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.backgroundColor = '#1a1a19';
      } else {
        document.documentElement.style.backgroundColor = '#fafaf9';
      }
    })();
  </script>

  <link rel="stylesheet" href="../src/styles/tokens.css" />
  <link rel="stylesheet" href="../src/styles/base.css" />
  <link rel="stylesheet" href="../src/features/browse-menu/browse-menu.css" />
  <link rel="stylesheet" href="../src/features/seo-pages/seo-pages.css" />
  <link rel="stylesheet" href="../src/features/ai-agents/ai-agents.css" />
</head>
<body>
  <main class="page">
${header()}

    <p class="seo-breadcrumb"><a href="../">Home</a> › <a href="../ai-agents.html">AI Agents</a> › ${d.cardTitle}</p>

    <section class="seo-hero">
      <h1>${d.h1}</h1>
      <p>${d.hero}</p>
    </section>

    <section class="seo-section" id="how-it-works">
      <h2>Intro — how this agent works</h2>
      <p>${d.intro.lead}</p>

${renderStats(d.intro.stats)}
${d.intro.flowTitle ? `      <h3>${d.intro.flowTitle}</h3>\n` : ''}${renderFlow(d.intro.flow)}
${renderBlocks(d.intro.blocks)}    </section>

    <section class="seo-section" id="providers">
      <h2>Part 1 — the providers</h2>
      <p>${d.providers.lead}</p>

${renderTable(d.providers)}    </section>

    <section class="seo-section" id="how-each-works">
      <h2>Part 2 — how each provider handles the work</h2>

${d.how.map(g => `      <h3>${g.h3}</h3>\n${ul(g.items)}`).join('\n')}    </section>

    <section class="seo-section" id="pros-cons">
      <h2>Part 3 — pros and cons</h2>

${renderProsCons(d.prosCons)}    </section>

    <section class="seo-section" id="how-to-pick">
      <h2>How to pick, in 30 seconds</h2>
${ul(d.pick)}
      <h3>The investor read</h3>
${ul(d.investor)}    </section>

${renderFaq(d.faq)}
${renderRelated(d, all)}
    <div class="seo-cta">
      <p class="seo-cta-text">${d.cta || 'Building the agent yourself? Flowpicker maps the model, orchestration and context layers — with compatibility warnings before you commit.'}</p>
      <a class="seo-cta-link" href="../index.html">Open the stack planner →</a>
    </div>

    <section class="seo-section" id="sources">
      <h2>Sources</h2>
      <p class="agent-sources">
${d.sources}
      </p>
    </section>
  </main>

  <footer class="site-footer">
    <span>Flowpicker — AI coding stack builder. </span>
    <div class="site-footer-links">
      <a href="https://github.com/yxxTries" target="_blank" rel="noopener noreferrer">GitHub</a>
      <a href="mailto:amil.shahul777@gmail.com">Email</a>
    </div>
  </footer>

  <script>window.App = { features: {} };</script>
  <script src="../src/features/darkmode/darkmode.js"></script>
  <script src="../src/features/browse-menu/browse-menu-preview.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (window.App && App.features.darkmode) App.features.darkmode.init();
    });
  </script>
</body>
</html>
`;
}

// The index grid is rewritten in place between two markers so the rest of
// ai-agents.html (auth slot, scripts, search UI) is left alone.
function updateIndex(pages) {
  const START = '<!-- agent-index:start -->';
  const END = '<!-- agent-index:end -->';
  let html = fs.readFileSync(INDEX_FILE, 'utf8');
  // The search blob carries provider names too, so typing "Intercom", "Clay"
  // or "Shopify" lands on the page that actually covers it.
  const cards = pages.map(d => {
    const providers = d.prosCons.map(c => c.name.replace(/&amp;/g, '&'));
    const blob = [d.cardTitle, d.cardDesc, ...(d.keywords || []), ...providers]
      .join(' ').toLowerCase().replace(/<[^>]+>/g, '');
    return `      <a class="agent-index-card" href="ai-agents/${d.slug}.html" data-search="${esc(blob)}">
        <h3>${d.cardTitle}</h3>
        <p>${d.cardDesc}</p>
      </a>`;
  }).join('\n');
  const block = `${START}\n${cards}\n      ${END}`;
  const re = new RegExp(`${START}[\\s\\S]*?${END}`);
  if (!re.test(html)) throw new Error(`ai-agents.html is missing the ${START} / ${END} markers`);
  html = html.replace(re, block);
  fs.writeFileSync(INDEX_FILE, html);
}

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.js')).sort();
  const pages = files.map(f => require(path.join(DATA_DIR, f)));
  // Explicit order for the index grid; anything unlisted falls to the end.
  const ORDER = require('./agent-pages/_order.json');
  pages.sort((a, b) => {
    const ai = ORDER.indexOf(a.slug), bi = ORDER.indexOf(b.slug);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
  for (const d of pages) {
    fs.writeFileSync(path.join(OUT_DIR, `${d.slug}.html`), renderPage(d, pages));
    console.log(`  ai-agents/${d.slug}.html`);
  }
  updateIndex(pages);
  console.log(`Built ${pages.length} agent page(s) + index grid.`);
}

if (require.main === module) main();
module.exports = { renderPage };
