// Aggregate analysis of the user's picked stack: per-layer cost breakdown plus
// an estimated monthly total, an LLM-driven speed read, multi-layer responsiveness,
// code-quality rating, privacy score, and setup complexity averaged across layers.
// Renders once IDE and LLM are both set.

App.features.stackAnalysis = (() => {
  // Three usage presets the user can switch between. Token volumes are per
  // working day; subscription proxy is the assumed $/mo for "Paid subscription"
  // tools at that intensity (heavier users tend to be on pricier seats).
  const USAGE_PROFILES = {
    light: {
      id: 'light',
      label: 'Light',
      blurb: 'Casual / hobby use',
      inputPerDay: 200_000,
      outputPerDay: 50_000,
      workingDaysPerMonth: 15,
      subscriptionProxy: 10,
    },
    standard: {
      id: 'standard',
      label: 'Standard',
      blurb: 'Daily professional use',
      inputPerDay: 1_000_000,
      outputPerDay: 250_000,
      workingDaysPerMonth: 20,
      subscriptionProxy: 20,
    },
    heavy: {
      id: 'heavy',
      label: 'Heavy',
      blurb: 'All-day agentic coding',
      inputPerDay: 5_000_000,
      outputPerDay: 1_250_000,
      workingDaysPerMonth: 22,
      subscriptionProxy: 40,
    },
  };
  const DEFAULT_PROFILE = 'standard';

  // Defaults seeded into the Custom config the first time the user opens it.
  // Starts as a copy of Standard so the math doesn't snap unexpectedly.
  const CUSTOM_DEFAULTS = {
    inputPerDay: 1_000_000,
    outputPerDay: 250_000,
    workingDaysPerMonth: 20,
    subscriptionProxy: 20,
    llmInputPrice: null,   // null = use LLM's own listed price; number = override
    llmOutputPrice: null,
  };

  function getCustom() {
    if (!App.state.usageCustom) App.state.usageCustom = { ...CUSTOM_DEFAULTS };
    return App.state.usageCustom;
  }

  function getProfile() {
    const id = App.state.usageProfile;
    if (id === 'custom') {
      const c = getCustom();
      return {
        id: 'custom',
        label: 'Custom',
        blurb: 'Your own numbers',
        inputPerDay: c.inputPerDay,
        outputPerDay: c.outputPerDay,
        workingDaysPerMonth: c.workingDaysPerMonth,
        subscriptionProxy: c.subscriptionProxy,
        llmInputPrice: c.llmInputPrice,
        llmOutputPrice: c.llmOutputPrice,
      };
    }
    return USAGE_PROFILES[id] || USAGE_PROFILES[DEFAULT_PROFILE];
  }

  function init() {
    if (!App.state.usageProfile) App.state.usageProfile = DEFAULT_PROFILE;
  }

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
    root.appendChild(renderResponsiveness(sel));
    root.appendChild(renderQuality(sel));
    root.appendChild(renderPrivacy(sel));
    root.appendChild(renderComplexity(sel));
  }

  // ---- Cost --------------------------------------------------------------

  function renderCost(sel) {
    const profile = getProfile();
    const section = document.createElement('section');
    section.className = 'stack-metric stack-metric-cost';

    const head = document.createElement('h3');
    head.className = 'stack-metric-title';
    head.textContent = 'Cost';
    section.appendChild(head);

    section.appendChild(renderUsageToggle(profile));
    if (profile.id === 'custom') section.appendChild(renderCustomPanel());

    const split = document.createElement('div');
    split.className = 'stack-cost-split';

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
    split.appendChild(list);

    const estimate = estimateMonthlyCost(sel, profile);
    const summary = document.createElement('div');
    summary.className = 'stack-cost-summary';

    const figure = document.createElement('div');
    figure.className = 'stack-cost-figure';
    const num = document.createElement('span');
    num.className = 'stack-cost-num';
    num.textContent = formatUSD(estimate.amount) + (estimate.hasUnknown ? '+' : '');
    const per = document.createElement('span');
    per.className = 'stack-cost-per';
    per.textContent = '/mo';
    const band = document.createElement('span');
    band.className = `stack-cost-band band-${estimate.band.tier}`;
    band.textContent = estimate.band.label;
    figure.appendChild(num);
    figure.appendChild(per);
    figure.appendChild(band);
    summary.appendChild(figure);

    summary.appendChild(renderBreakdown(estimate));

    const basis = document.createElement('p');
    basis.className = 'stack-cost-basis';
    const inputMonthlyMTok = (profile.inputPerDay * profile.workingDaysPerMonth) / 1_000_000;
    const outputMonthlyMTok = (profile.outputPerDay * profile.workingDaysPerMonth) / 1_000_000;
    basis.textContent =
      `${profile.label} usage: ${fmtTokens(profile.inputPerDay)} in + ${fmtTokens(profile.outputPerDay)} out per day × ` +
      `${profile.workingDaysPerMonth} working days/mo ` +
      `(${formatMTok(inputMonthlyMTok)}M in / ${formatMTok(outputMonthlyMTok)}M out monthly). ` +
      `Paid subscriptions counted at $${profile.subscriptionProxy}/mo each.`;
    summary.appendChild(basis);
    split.appendChild(summary);

    section.appendChild(split);

    return section;
  }

  function renderUsageToggle(profile) {
    const wrap = document.createElement('div');
    wrap.className = 'stack-usage-toggle';
    wrap.setAttribute('role', 'radiogroup');
    wrap.setAttribute('aria-label', 'Usage intensity');

    const choices = [
      USAGE_PROFILES.light,
      USAGE_PROFILES.standard,
      USAGE_PROFILES.heavy,
      { id: 'custom', label: 'Custom', blurb: 'Your own numbers' },
    ];

    for (const opt of choices) {
      const id = opt.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'stack-usage-option' + (profile.id === id ? ' is-active' : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', profile.id === id ? 'true' : 'false');
      btn.dataset.profile = id;

      const lbl = document.createElement('span');
      lbl.className = 'stack-usage-option-label';
      lbl.textContent = opt.label;
      const sub = document.createElement('span');
      sub.className = 'stack-usage-option-sub';
      sub.textContent = opt.blurb;
      btn.appendChild(lbl);
      btn.appendChild(sub);

      btn.addEventListener('click', () => {
        if (App.state.usageProfile === id) return;
        App.state.usageProfile = id;
        render();
      });

      wrap.appendChild(btn);
    }
    return wrap;
  }

  function renderCustomPanel() {
    const c = getCustom();
    const panel = document.createElement('div');
    panel.className = 'stack-usage-custom';

    const grid = document.createElement('div');
    grid.className = 'stack-usage-custom-grid';

    function field(opts) {
      const { key, label, suffix, min, step, placeholder, value, onCommit } = opts;

      const wrap = document.createElement('label');
      wrap.className = 'stack-usage-field';

      const lbl = document.createElement('span');
      lbl.className = 'stack-usage-field-label';
      lbl.textContent = label;
      wrap.appendChild(lbl);

      const inputWrap = document.createElement('span');
      inputWrap.className = 'stack-usage-field-input';

      const input = document.createElement('input');
      input.type = 'number';
      input.inputMode = 'decimal';
      input.min = String(min);
      if (step != null) input.step = String(step);
      if (placeholder) input.placeholder = placeholder;
      input.value = value == null ? '' : String(value);
      input.dataset.key = key;

      input.addEventListener('change', () => {
        const raw = input.value.trim();
        const parsed = raw === '' ? null : Number(raw);
        const next = (parsed == null || !Number.isFinite(parsed) || parsed < min) ? null : parsed;
        onCommit(next);
        render();
      });

      inputWrap.appendChild(input);
      if (suffix) {
        const s = document.createElement('span');
        s.className = 'stack-usage-field-suffix';
        s.textContent = suffix;
        inputWrap.appendChild(s);
      }
      wrap.appendChild(inputWrap);
      return wrap;
    }

    grid.appendChild(field({
      key: 'inputPerDay',
      label: 'Input tokens / day',
      suffix: 'tokens',
      min: 0,
      step: 10000,
      value: c.inputPerDay,
      onCommit: v => { c.inputPerDay = v == null ? 0 : v; },
    }));
    grid.appendChild(field({
      key: 'outputPerDay',
      label: 'Output tokens / day',
      suffix: 'tokens',
      min: 0,
      step: 10000,
      value: c.outputPerDay,
      onCommit: v => { c.outputPerDay = v == null ? 0 : v; },
    }));
    grid.appendChild(field({
      key: 'workingDaysPerMonth',
      label: 'Working days / month',
      suffix: 'days',
      min: 0,
      step: 1,
      value: c.workingDaysPerMonth,
      onCommit: v => { c.workingDaysPerMonth = v == null ? 0 : v; },
    }));
    grid.appendChild(field({
      key: 'subscriptionProxy',
      label: 'Subscription cost',
      suffix: '$ / mo each',
      min: 0,
      step: 1,
      value: c.subscriptionProxy,
      onCommit: v => { c.subscriptionProxy = v == null ? 0 : v; },
    }));
    grid.appendChild(field({
      key: 'llmInputPrice',
      label: 'LLM input price (override)',
      suffix: '$ / 1M tok',
      min: 0,
      step: 0.1,
      placeholder: 'auto',
      value: c.llmInputPrice,
      onCommit: v => { c.llmInputPrice = v; },
    }));
    grid.appendChild(field({
      key: 'llmOutputPrice',
      label: 'LLM output price (override)',
      suffix: '$ / 1M tok',
      min: 0,
      step: 0.1,
      placeholder: 'auto',
      value: c.llmOutputPrice,
      onCommit: v => { c.llmOutputPrice = v; },
    }));

    panel.appendChild(grid);

    const foot = document.createElement('div');
    foot.className = 'stack-usage-custom-foot';
    const hint = document.createElement('span');
    hint.className = 'stack-usage-custom-hint';
    hint.textContent = 'Leave override blank to use each LLM\'s listed pricing.';
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'stack-usage-custom-reset';
    reset.textContent = 'Reset to defaults';
    reset.addEventListener('click', () => {
      App.state.usageCustom = { ...CUSTOM_DEFAULTS };
      render();
    });
    foot.appendChild(hint);
    foot.appendChild(reset);
    panel.appendChild(foot);

    return panel;
  }

  function renderBreakdown(estimate) {
    const list = document.createElement('dl');
    list.className = 'stack-cost-breakdown';

    function row(label, value, muted) {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      if (muted) dd.classList.add('is-muted');
      list.appendChild(dt);
      list.appendChild(dd);
    }

    if (estimate.llmCounted > 0) {
      row('LLM input', formatUSD(estimate.llmInput));
      row('LLM output', formatUSD(estimate.llmOutput));
    } else {
      row('LLM', estimate.hasUnknown ? 'price unlisted' : formatUSD(0), true);
    }
    if (estimate.subsCount > 0) {
      const lbl = estimate.subsCount === 1 ? 'Subscription' : `${estimate.subsCount} subscriptions`;
      row(lbl, formatUSD(estimate.subs));
    }

    return list;
  }

  function estimateMonthlyCost(sel, profile) {
    let amount = 0;
    let hasUnknown = false;
    let llmInput = 0, llmOutput = 0, llmCounted = 0;
    let subs = 0, subsCount = 0;

    const inputMTok = (profile.inputPerDay * profile.workingDaysPerMonth) / 1_000_000;
    const outputMTok = (profile.outputPerDay * profile.workingDaysPerMonth) / 1_000_000;

    const overrideIn = profile.llmInputPrice;
    const overrideOut = profile.llmOutputPrice;
    const hasFullOverride =
      overrideIn != null && Number.isFinite(overrideIn) &&
      overrideOut != null && Number.isFinite(overrideOut);

    const llmPicks = sel.llm || [];
    if (llmPicks.length > 0) {
      if (hasFullOverride) {
        // Custom override replaces listed prices entirely; no "unknown" risk.
        llmInput = overrideIn * inputMTok;
        llmOutput = overrideOut * outputMTok;
        llmCounted = llmPicks.length;
        amount += llmInput + llmOutput;
      } else {
        let inSum = 0, outSum = 0, count = 0;
        for (const p of llmPicks) {
          const inPrice = overrideIn != null && Number.isFinite(overrideIn)
            ? overrideIn : parsePrice(p.priceInput);
          const outPrice = overrideOut != null && Number.isFinite(overrideOut)
            ? overrideOut : parsePrice(p.priceOutput);
          if (inPrice == null || outPrice == null) { hasUnknown = true; continue; }
          inSum += inPrice;
          outSum += outPrice;
          count++;
        }
        if (count > 0) {
          llmInput = (inSum / count) * inputMTok;
          llmOutput = (outSum / count) * outputMTok;
          llmCounted = count;
          amount += llmInput + llmOutput;
        }
      }
    }

    for (const layer of LAYERS) {
      if (layer.id === 'llm') continue;
      const picks = sel[layer.id] || [];
      for (const p of picks) {
        const v = p.pricing || p.cost;
        if (v === 'Paid subscription') {
          subs += profile.subscriptionProxy;
          subsCount++;
        }
      }
    }
    amount += subs;

    let band;
    if (amount < 25)       band = { tier: 'low',      label: 'Low'      };
    else if (amount < 200) band = { tier: 'moderate', label: 'Moderate' };
    else                   band = { tier: 'high',     label: 'High'     };

    return { amount, band, hasUnknown, llmInput, llmOutput, llmCounted, subs, subsCount };
  }

  function fmtTokens(n) {
    if (n >= 1_000_000) {
      const m = n / 1_000_000;
      return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + 'M';
    }
    if (n >= 1_000) return Math.round(n / 1_000) + 'K';
    return String(n);
  }

  function formatMTok(n) {
    if (n >= 10) return n.toFixed(0);
    if (n >= 1)  return n.toFixed(1).replace(/\.0$/, '');
    return n.toFixed(2).replace(/\.?0+$/, '');
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

  // Cleaner USD formatting via Intl.NumberFormat: thousands separators, $ symbol,
  // and decimals only when the amount is small enough that cents are meaningful.
  const USD_WHOLE = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  const USD_CENTS = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  function formatUSD(n) {
    if (!Number.isFinite(n)) return '$0';
    if (n === 0) return '$0';
    if (n < 10) return USD_CENTS.format(n);
    return USD_WHOLE.format(Math.round(n));
  }

  // ---- Speed -------------------------------------------------------------

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

  // ---- Responsiveness ---------------------------------------------------

  function renderResponsiveness(sel) {
    const section = document.createElement('section');
    section.className = 'stack-metric stack-metric-responsiveness';

    const head = document.createElement('h3');
    head.className = 'stack-metric-title';
    head.textContent = 'Responsiveness';
    section.appendChild(head);

    let weightedSum = 0, totalWeight = 0;

    const idePicks = sel.ide || [];
    if (idePicks.length > 0) {
      let ideSum = 0;
      for (const p of idePicks) {
        const iface = p.interface;
        const ai = p.aiIntegration;
        if (iface === 'Terminal/TUI') ideSum += 5;
        else if (ai === 'AI-native') ideSum += 4;
        else if (ai === 'AI via extension') ideSum += 3;
        else ideSum += 2;
      }
      weightedSum += (ideSum / idePicks.length) * 0.4;
      totalWeight += 0.4;
    }

    const intPicks = sel.integration || [];
    if (intPicks.length > 0) {
      let intSum = 0;
      for (const p of intPicks) {
        const iface = p.interface;
        if (iface === 'In-editor') intSum += 4;
        else if (iface === 'Terminal/CLI') intSum += 3;
        else intSum += 2;
      }
      weightedSum += (intSum / intPicks.length) * 0.3;
      totalWeight += 0.3;
    }

    const ctxPicks = sel.context || [];
    if (ctxPicks.length > 0) {
      let ctxSum = 0;
      for (const p of ctxPicks) {
        const staleness = p.staleness;
        if (staleness === 'auto') ctxSum += 4;
        else if (staleness === 'manual') ctxSum += 3;
        else ctxSum += 2;
      }
      weightedSum += (ctxSum / ctxPicks.length) * 0.3;
      totalWeight += 0.3;
    }

    const raw = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const score = Math.max(1, Math.min(5, Math.round(raw)));
    const label = score >= 5 ? 'Instant' : score >= 4 ? 'Responsive' : score >= 3 ? 'Standard' : 'Measured';

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
    sub.textContent = 'Combines IDE interface, integration overhead, and context freshness across layers.';
    section.appendChild(sub);

    return section;
  }

  // ---- Quality -----------------------------------------------------------

  function renderQuality(sel) {
    const section = document.createElement('section');
    section.className = 'stack-metric stack-metric-quality';

    const head = document.createElement('h3');
    head.className = 'stack-metric-title';
    head.textContent = 'Quality';
    section.appendChild(head);

    let llmAvg = 0, llmCount = 0;

    const llmPicks = sel.llm || [];
    for (const p of llmPicks) {
      let sum = 0, n = 0;
      const sb = parseBenchPercent(p.sweBench);
      if (sb != null) { sum += sb; n++; }
      const he = parseBenchPercent(p.humanEval);
      if (he != null) { sum += he; n++; }
      if (n > 0) { llmAvg += sum / n; llmCount++; }
    }

    let agentBonus = 0;
    const agentPicks = sel.agent || [];
    for (const p of agentPicks) {
      if (p.autonomy === 'Autonomous') agentBonus = 1;
      else if (p.autonomy === 'Semi-autonomous' && agentBonus < 0.5) agentBonus = 0.5;
    }

    const base = llmCount > 0 ? llmAvg / llmCount : 0;
    let score;
    if (llmCount === 0) score = 0;
    else if (base >= 80) score = 5;
    else if (base >= 60) score = 4;
    else if (base >= 40) score = 3;
    else if (base >= 20) score = 2;
    else score = 1;

    score = Math.min(5, score + agentBonus);

    const label =
      score >= 5 ? 'Elite' : score >= 4 ? 'Strong' : score >= 3 ? 'Capable' : score >= 2 ? 'Basic' : 'Entry';

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
    sub.textContent = 'Based on benchmark scores (SWE-bench, HumanEval) plus agent autonomy.';
    section.appendChild(sub);

    return section;
  }

  function parseBenchPercent(v) {
    if (v == null) return null;
    const s = String(v).trim();
    if (s === '—' || s === '' || s === 'N/A') return null;
    const m = s.match(/([\d.]+)\s*%/);
    if (m) return Number(m[1]);
    if (/top/i.test(s)) return 75;
    if (/high/i.test(s)) return 55;
    if (/mid/i.test(s)) return 35;
    if (/low/i.test(s)) return 15;
    return null;
  }

  // ---- Privacy -----------------------------------------------------------

  function renderPrivacy(sel) {
    const section = document.createElement('section');
    section.className = 'stack-metric stack-metric-privacy';

    const head = document.createElement('h3');
    head.className = 'stack-metric-title';
    head.textContent = 'Privacy';
    section.appendChild(head);

    let weightedSum = 0, totalWeight = 0;

    const llmPicks = sel.llm || [];
    if (llmPicks.length > 0) {
      let sum = 0;
      for (const p of llmPicks) {
        if (p.hosting === 'Open-weights') sum += 5;
        else if (p.hosting === 'Closed/API') sum += 2;
        else sum += 3;
      }
      weightedSum += (sum / llmPicks.length) * 0.35;
      totalWeight += 0.35;
    }

    const intPicks = sel.integration || [];
    if (intPicks.length > 0) {
      let sum = 0;
      for (const p of intPicks) {
        const prv = p.privacy;
        if (prv === 'Local-only') sum += 5;
        else if (prv === 'Configurable') sum += 4;
        else if (prv === 'Sent to provider') sum += 2;
        else sum += 3;
      }
      weightedSum += (sum / intPicks.length) * 0.35;
      totalWeight += 0.35;
    }

    const ctxPicks = sel.context || [];
    if (ctxPicks.length > 0) {
      let sum = 0;
      for (const p of ctxPicks) {
        const host = p.hosting;
        if (host === 'Local') sum += 5;
        else if (host === 'Cloud') sum += 2;
        else sum += 3;
      }
      weightedSum += (sum / ctxPicks.length) * 0.3;
      totalWeight += 0.3;
    }

    const raw = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const score = Math.max(1, Math.min(5, Math.round(raw)));
    const label =
      score >= 5 ? 'Local-first' : score >= 4 ? 'Configurable' : score >= 3 ? 'Mixed' : 'Cloud-reliant';

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
    sub.textContent = 'Tracks where your code data flows across model hosting, integration, and context layers.';
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
