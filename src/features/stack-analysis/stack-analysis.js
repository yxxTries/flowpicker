// Aggregate analysis of the user's picked stack: per-layer cost breakdown plus
// an estimated monthly total, an LLM-driven speed read, and a setup complexity
// score averaged across picked layers. Renders once IDE and LLM are both set.

App.features.stackAnalysis = (() => {
  // Fixed workload used for the monthly estimate. Shown to the user verbatim so
  // the number feels like an estimate against a known baseline, not a guess.
  const WORKLOAD = {
    inputPerDay: 1_000_000,
    outputPerDay: 250_000,
    workingDaysPerMonth: 20,
  };
  const SUBSCRIPTION_PROXY = 20; // flat $/mo per paid-subscription layer pick

  function init() {}

  function render() {
    const root = App.refs.stackAnalysis;
    if (!root) return;

    const sel = App.state.selections;
    const idePicks = sel.ide || [];
    const llmPicks = sel.llm || [];

    root.hidden = false;
    root.innerHTML = '';

    if (idePicks.length === 0 || llmPicks.length === 0) {
      const missing = [];
      if (idePicks.length === 0) missing.push('an IDE');
      if (llmPicks.length === 0) missing.push('an LLM');
      const hint = document.createElement('p');
      hint.className = 'stack-analysis-hint';
      hint.textContent = `Add ${missing.join(' and ')} to see your stack report.`;
      root.appendChild(hint);
      return;
    }

    const title = document.createElement('h2');
    title.className = 'stack-analysis-title';
    title.textContent = 'Stack analysis';
    root.appendChild(title);

    root.appendChild(renderCost(sel));
    root.appendChild(renderSpeed(sel));
    root.appendChild(renderComplexity(sel));
  }

  // ---- Cost --------------------------------------------------------------

  function renderCost(sel) {
    const section = document.createElement('section');
    section.className = 'stack-metric stack-metric-cost';

    const head = document.createElement('h3');
    head.className = 'stack-metric-title';
    head.textContent = 'Cost';
    section.appendChild(head);

    const list = document.createElement('dl');
    list.className = 'stack-cost-list';
    for (const layer of LAYERS) {
      const picks = sel[layer.id] || [];
      const dt = document.createElement('dt');
      dt.textContent = App.features.table.shortLayerName(layer.name);
      const dd = document.createElement('dd');
      if (picks.length === 0) {
        dd.textContent = '—';
        dd.classList.add('is-muted');
      } else {
        const parts = picks
          .map(p => App.features.table.resolveCell('cost', layer.id, p))
          .filter(Boolean);
        dd.textContent = parts.length ? parts.join(', ') : '—';
        if (!parts.length) dd.classList.add('is-muted');
      }
      list.appendChild(dt);
      list.appendChild(dd);
    }
    section.appendChild(list);

    const estimate = estimateMonthlyCost(sel);
    const summary = document.createElement('div');
    summary.className = 'stack-cost-summary';
    const figure = document.createElement('div');
    figure.className = 'stack-cost-figure';
    const num = document.createElement('span');
    num.className = 'stack-cost-num';
    num.textContent = estimate.hasUnknown
      ? `~$${formatDollars(estimate.amount)}+/mo`
      : `~$${formatDollars(estimate.amount)}/mo`;
    const band = document.createElement('span');
    band.className = `stack-cost-band band-${estimate.band.toLowerCase()}`;
    band.textContent = estimate.band;
    figure.appendChild(num);
    figure.appendChild(band);
    summary.appendChild(figure);

    const basis = document.createElement('p');
    basis.className = 'stack-cost-basis';
    const inputMTok = WORKLOAD.inputPerDay / 1_000_000;
    const outputMTok = (WORKLOAD.outputPerDay * WORKLOAD.workingDaysPerMonth) / 1_000_000;
    const inputMonthlyMTok = (WORKLOAD.inputPerDay * WORKLOAD.workingDaysPerMonth) / 1_000_000;
    basis.textContent =
      `Based on ${inputMTok}M input + ${WORKLOAD.outputPerDay / 1000}K output tokens/day × ` +
      `${WORKLOAD.workingDaysPerMonth} working days/mo (${inputMonthlyMTok}M in / ${outputMTok}M out per month). ` +
      `Subscriptions counted at $${SUBSCRIPTION_PROXY}/mo each.`;
    summary.appendChild(basis);
    section.appendChild(summary);

    return section;
  }

  function estimateMonthlyCost(sel) {
    let amount = 0;
    let hasUnknown = false;

    const inputMTok = (WORKLOAD.inputPerDay * WORKLOAD.workingDaysPerMonth) / 1_000_000;
    const outputMTok = (WORKLOAD.outputPerDay * WORKLOAD.workingDaysPerMonth) / 1_000_000;

    const llmPicks = sel.llm || [];
    if (llmPicks.length > 0) {
      // For multi-pick LLMs we take the average price (proxy for "you'd use one
      // at a time but might switch"). Self-hosted counts as 0.
      let inSum = 0, outSum = 0, count = 0;
      for (const p of llmPicks) {
        const inPrice = parsePrice(p.priceInput);
        const outPrice = parsePrice(p.priceOutput);
        if (inPrice == null || outPrice == null) { hasUnknown = true; continue; }
        inSum += inPrice;
        outSum += outPrice;
        count++;
      }
      if (count > 0) {
        amount += (inSum / count) * inputMTok + (outSum / count) * outputMTok;
      }
    }

    for (const layer of LAYERS) {
      if (layer.id === 'llm') continue;
      const picks = sel[layer.id] || [];
      for (const p of picks) {
        const v = p.pricing || p.cost;
        if (v === 'Paid subscription') amount += SUBSCRIPTION_PROXY;
        // Free / Freemium / BYO API key / N/A → 0
      }
    }

    let band;
    if (amount < 10) band = '$';
    else if (amount < 100) band = '$$';
    else band = '$$$';

    return { amount, band, hasUnknown };
  }

  function parsePrice(v) {
    if (v == null) return null;
    if (typeof v === 'number') return v;
    const s = String(v).trim();
    if (s === '' || s === '—' || s === 'N/A') return null;
    if (/free/i.test(s)) return 0;
    const m = s.match(/\$?\s*([\d.]+)/);
    return m ? Number(m[1]) : null;
  }

  function formatDollars(n) {
    if (n >= 100) return String(Math.round(n));
    if (n >= 10) return n.toFixed(0);
    return n.toFixed(2).replace(/\.00$/, '');
  }

  // ---- Speed -------------------------------------------------------------

  // Slowest LLM in the pick set gates perceived speed.
  const SPEED_MAP = {
    'Fast':            { score: 4, label: 'Fast' },
    'Standard':        { score: 3, label: 'Standard' },
    'Slow/Reasoning':  { score: 1, label: 'Slow / reasoning' },
  };

  function renderSpeed(sel) {
    const section = document.createElement('section');
    section.className = 'stack-metric stack-metric-speed';

    const head = document.createElement('h3');
    head.className = 'stack-metric-title';
    head.textContent = 'Speed';
    section.appendChild(head);

    const llmPicks = sel.llm || [];
    let score = null;
    let label = '—';
    for (const p of llmPicks) {
      const m = SPEED_MAP[p.speedTier];
      if (!m) continue;
      if (score == null || m.score < score) { score = m.score; label = m.label; }
    }
    if (score == null) score = 0;

    const row = document.createElement('div');
    row.className = 'stack-metric-row';
    row.appendChild(makeDotBar(score));
    const lbl = document.createElement('span');
    lbl.className = 'stack-metric-label';
    lbl.textContent = label;
    row.appendChild(lbl);
    section.appendChild(row);

    const sub = document.createElement('p');
    sub.className = 'stack-metric-subtext';
    sub.textContent = 'Driven by your LLM choice. Slowest model in a multi-pick gates the rating.';
    section.appendChild(sub);

    return section;
  }

  // ---- Setup complexity --------------------------------------------------

  const SETUP_MAP = { 'Zero': 0, 'Low': 1, 'Medium': 2, 'High': 3 };

  function renderComplexity(sel) {
    const section = document.createElement('section');
    section.className = 'stack-metric stack-metric-complexity';

    const head = document.createElement('h3');
    head.className = 'stack-metric-title';
    head.textContent = 'Setup complexity';
    section.appendChild(head);

    let total = 0, count = 0;
    for (const layer of LAYERS) {
      const picks = sel[layer.id] || [];
      for (const p of picks) {
        const text = App.features.table.resolveCell('complexity', layer.id, p);
        if (text == null) continue;
        if (text === 'API call') { total += 1; count++; continue; }
        const v = SETUP_MAP[text];
        if (v != null) { total += v; count++; }
      }
    }

    const avg = count > 0 ? total / count : 0;
    let label, score;
    if (avg < 0.75)      { label = 'Trivial'; score = 1; }
    else if (avg < 1.75) { label = 'Low';     score = 2; }
    else if (avg < 2.5)  { label = 'Medium';  score = 3; }
    else                 { label = 'High';    score = 5; }

    const row = document.createElement('div');
    row.className = 'stack-metric-row';
    row.appendChild(makeDotBar(score));
    const lbl = document.createElement('span');
    lbl.className = 'stack-metric-label';
    lbl.textContent = label;
    row.appendChild(lbl);
    section.appendChild(row);

    const sub = document.createElement('p');
    sub.className = 'stack-metric-subtext';
    sub.textContent = 'Averaged across the setup effort of every picked layer.';
    section.appendChild(sub);

    return section;
  }

  // ---- Dot bar -----------------------------------------------------------

  function makeDotBar(filled) {
    const bar = document.createElement('span');
    bar.className = 'dot-bar';
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', `${filled} of 5`);
    for (let i = 0; i < 5; i++) {
      const d = document.createElement('span');
      d.className = 'dot' + (i < filled ? ' is-filled' : '');
      bar.appendChild(d);
    }
    return bar;
  }

  return { init, render };
})();
