// Aggregate analysis of the user's picked stack: per-layer cost breakdown plus
// an estimated monthly total, an LLM-driven speed read, multi-layer responsiveness,
// code-quality rating, privacy score, and setup complexity averaged across layers.
// Renders once IDE and LLM are both set.

App.features.stackAnalysis = (() => {
  const STORE_KEY = 'flowpicker-stack-analysis';

  // Persisted UI state — usage profile, team size, repo size, baseline pick.
  // Loaded on init, written on every change.
  function loadStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch { return {}; }
  }
  function saveStore() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        usageProfile: App.state.usageProfile,
        usageCustom: App.state.usageCustom,
        teamSize: App.state.teamSize,
        teamSeatsCustom: App.state.teamSeatsCustom,
        repoSize: App.state.repoSize,
        baseline: App.state.analysisBaseline,
      }));
    } catch {}
  }

  // Workflow-typed usage profiles. Numbers are per working day and were sourced
  // by triangulating: (a) Anthropic's "typical session" docs, (b) Cursor forum
  // threads disclosing real per-day token burns, (c) Verdent's 2026 pricing
  // guide, (d) the OpenAI Codex usage report. Each preset carries its own
  // variance range because workflow type dominates variance — e.g. autocomplete
  // is tight, agentic is wildly bursty.
  const USAGE_PROFILES = {
    autocomplete: {
      id: 'autocomplete', label: 'Autocomplete', blurb: 'Copilot-style ghost text',
      inputPerDay: 50_000, outputPerDay: 10_000,
      workingDaysPerMonth: 20, subscriptionProxy: 10,
      variance: { low: 0.7, high: 1.4 },
      methodology: 'Tight token range — completions are short, predictable.',
    },
    chat: {
      id: 'chat', label: 'Chat-driven', blurb: 'Cursor chat, Copilot Chat',
      inputPerDay: 400_000, outputPerDay: 100_000,
      workingDaysPerMonth: 20, subscriptionProxy: 20,
      variance: { low: 0.6, high: 1.7 },
      methodology: 'Conversational coding with occasional file edits.',
    },
    agentic: {
      id: 'agentic', label: 'Agentic', blurb: 'Cursor agent, Cline, multi-file',
      inputPerDay: 2_500_000, outputPerDay: 600_000,
      workingDaysPerMonth: 20, subscriptionProxy: 30,
      variance: { low: 0.5, high: 2.0 },
      methodology: 'Multi-file refactors + tool calls. Burst-heavy.',
    },
    autonomous: {
      id: 'autonomous', label: 'Autonomous', blurb: 'Devin, unattended Claude Code',
      inputPerDay: 8_000_000, outputPerDay: 2_000_000,
      workingDaysPerMonth: 22, subscriptionProxy: 50,
      variance: { low: 0.4, high: 2.4 },
      methodology: 'Background agents iterating until tests pass. Highly bursty.',
    },
  };
  const DEFAULT_PROFILE = 'chat';

  // Legacy ID migration so users with stored Light/Standard/Heavy don't reset.
  const LEGACY_PROFILE_MAP = {
    light:    'autocomplete',
    standard: 'chat',
    heavy:    'agentic',
  };

  // Team-size presets. Multiplier applies to per-seat costs and token volume;
  // token mult is sub-linear since not every seat is a heavy coder.
  // Token multiplier is derived from seats with a sub-linear discount: not
  // every seat is a heavy coder, so 10 seats ≠ 10× tokens. The 0.7 exponent
  // matches the prior hardcoded bucket multipliers (6 seats → ~4.2× etc.).
  function seatsToTokenMult(seats) {
    if (!Number.isFinite(seats) || seats <= 1) return 1;
    return Math.pow(seats, 0.83);
  }

  const TEAM_SIZES = {
    solo:    { id: 'solo',    label: 'Solo',    seats: 1  },
    small:   { id: 'small',   label: '2–10',    seats: 6  },
    medium:  { id: 'medium',  label: '10–50',   seats: 25 },
    large:   { id: 'large',   label: '50+',     seats: 75 },
  };
  const DEFAULT_TEAM = 'solo';
  const DEFAULT_TEAM_CUSTOM_SEATS = 8;
  const MAX_TEAM_SEATS = 10_000;

  // Repo size estimates typical context-window load per session.
  // Numbers are rough working-set sizes the agent tends to keep loaded.
  const REPO_SIZES = {
    small:    { id: 'small',    label: 'Small',    blurb: '<10K LOC',   needTokens:  40_000 },
    medium:   { id: 'medium',   label: 'Medium',   blurb: '10K–100K',   needTokens: 120_000 },
    large:    { id: 'large',    label: 'Large',    blurb: '100K–500K',  needTokens: 350_000 },
    monorepo: { id: 'monorepo', label: 'Monorepo', blurb: '500K+',      needTokens: 800_000 },
  };
  const DEFAULT_REPO = 'medium';

  // Baseline stacks for the "vs. baseline" delta — research shows users decide
  // by contrast, not absolute. Picked the two most-cited 2026 stacks.
  const BASELINES = {
    none:  { id: 'none',  label: 'No comparison' },
    mainstream: {
      id: 'mainstream',
      label: 'Cursor + Claude Sonnet',
      selections: {
        ide: [{ name: 'Cursor', interface: 'GUI', aiIntegration: 'AI-native', pricing: 'Paid subscription', cost: 'Paid subscription', complexity: 'Low', tokenMultiplier: 2.5, limitsModel: 'cursor-credits' }],
        llm: [{ name: 'Claude Sonnet', priceInput: '$3', priceOutput: '$15', speedTier: 'Standard', sweBench: '60%', humanEval: '90%', hosting: 'Closed/API', contextWindow: 200_000 }],
      },
    },
    terminal: {
      id: 'terminal',
      label: 'Claude Code + Sonnet',
      selections: {
        ide: [{ name: 'Claude Code', interface: 'Terminal/TUI', aiIntegration: 'AI-native', pricing: 'Paid subscription', cost: 'Paid subscription', complexity: 'Low', tokenMultiplier: 1.0, limitsModel: 'claude-5h-weekly' }],
        llm: [{ name: 'Claude Sonnet', priceInput: '$3', priceOutput: '$15', speedTier: 'Standard', sweBench: '60%', humanEval: '90%', hosting: 'Closed/API', contextWindow: 200_000 }],
      },
    },
  };

  // Defaults seeded into the Custom config the first time the user opens it.
  const CUSTOM_DEFAULTS = {
    inputPerDay: 1_000_000, outputPerDay: 250_000,
    workingDaysPerMonth: 20, subscriptionProxy: 20,
    llmInputPrice: null, llmOutputPrice: null,
  };

  // Published rate-limit models. Caps are token RANGES (low/typical/high)
  // because real per-user caps depend on plan tier and rolling-window timing.
  // verifiedOn drives the staleness chip in the UI.
  const LIMIT_CAPS = {
    'cursor-credits': {
      label: 'Cursor credits',
      monthlyTokens: { low: 20_000_000, typical: 30_000_000, high: 50_000_000 },
      burst: 'tight',
      verifiedOn: '2026-04-15',
      source: 'https://docs.cursor.com/account/pricing',
    },
    'claude-5h-weekly': {
      label: 'Claude 5h / weekly',
      monthlyTokens: { low: 60_000_000, typical: 80_000_000, high: 120_000_000 },
      burst: 'rolling',
      verifiedOn: '2026-04-15',
      source: 'https://docs.claude.com/en/docs/claude-code/usage-limits',
    },
    'copilot-premium-300': {
      label: 'Copilot 300 premium',
      monthlyTokens: { low: 10_000_000, typical: 15_000_000, high: 25_000_000 },
      burst: 'tight',
      verifiedOn: '2026-03-20',
      source: 'https://docs.github.com/en/copilot/billing',
    },
    'unlimited-api': {
      label: 'Pay-as-you-go API',
      monthlyTokens: { low: Infinity, typical: Infinity, high: Infinity },
      burst: 'none',
    },
    'local': {
      label: 'Local / self-hosted',
      monthlyTokens: { low: Infinity, typical: Infinity, high: Infinity },
      burst: 'none',
    },
  };

  // Token-burn multipliers per IDE/integration class. Stored as ranges since
  // the famous "Cursor uses 5.5× more tokens" claim (apidog, Medium) is one
  // benchmark — real workloads vary by task type.
  const TOKEN_MULTIPLIER_DEFAULTS = {
    // Used when an IDE/integration has no `tokenMultiplier` attr set in the DB.
    // typical = what we apply to the cost estimate; low/high feed the range.
    unknown: { low: 1.0, typical: 1.0, high: 1.0 },
  };

  // Staleness thresholds for the verifiedOn chip — research-driven cadence.
  const STALENESS_DAYS = { warn: 60, bad: 180 };

  function daysSince(iso) {
    if (!iso) return null;
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return null;
    return Math.floor((Date.now() - t) / 86_400_000);
  }

  function stalenessLevel(iso) {
    const d = daysSince(iso);
    if (d == null) return 'unknown';
    if (d >= STALENESS_DAYS.bad)  return 'bad';
    if (d >= STALENESS_DAYS.warn) return 'warn';
    return 'good';
  }

  // Normalize a token-multiplier field that may be a number (legacy) or a
  // {low,typical,high} object.
  function normalizeMult(v) {
    if (v == null) return null;
    if (typeof v === 'number' && Number.isFinite(v)) {
      return { low: v * 0.7, typical: v, high: v * 1.5 };
    }
    if (typeof v === 'object' && Number.isFinite(v.typical)) {
      return {
        low:     Number.isFinite(v.low)  ? v.low  : v.typical * 0.7,
        typical: v.typical,
        high:    Number.isFinite(v.high) ? v.high : v.typical * 1.5,
      };
    }
    return null;
  }

  function getCustom() {
    if (!App.state.usageCustom) App.state.usageCustom = { ...CUSTOM_DEFAULTS };
    return App.state.usageCustom;
  }

  function getProfile() {
    const id = App.state.usageProfile;
    if (id === 'custom') {
      const c = getCustom();
      return {
        id: 'custom', label: 'Custom', blurb: 'Your own numbers',
        inputPerDay: c.inputPerDay, outputPerDay: c.outputPerDay,
        workingDaysPerMonth: c.workingDaysPerMonth,
        subscriptionProxy: c.subscriptionProxy,
        llmInputPrice: c.llmInputPrice, llmOutputPrice: c.llmOutputPrice,
        variance: { low: 0.6, high: 1.8 },
        methodology: 'Custom inputs — variance assumed mid-range.',
      };
    }
    return USAGE_PROFILES[id] || USAGE_PROFILES[DEFAULT_PROFILE];
  }

  function getTeam() {
    const id = App.state.teamSize;
    if (id === 'custom') {
      const seats = Math.max(1, Math.min(MAX_TEAM_SEATS,
        Number.isFinite(App.state.teamSeatsCustom) ? App.state.teamSeatsCustom : DEFAULT_TEAM_CUSTOM_SEATS));
      return { id: 'custom', label: 'Custom', seats, tokenMult: seatsToTokenMult(seats) };
    }
    const base = TEAM_SIZES[id] || TEAM_SIZES[DEFAULT_TEAM];
    return { ...base, tokenMult: seatsToTokenMult(base.seats) };
  }
  function getRepo()     { return REPO_SIZES[App.state.repoSize] || REPO_SIZES[DEFAULT_REPO]; }
  function getBaseline() { return BASELINES[App.state.analysisBaseline] || BASELINES.none; }

  function init() {
    const stored = loadStore();
    let profileId = stored.usageProfile || DEFAULT_PROFILE;
    // Migrate legacy ids (light/standard/heavy → workflow types).
    if (LEGACY_PROFILE_MAP[profileId]) profileId = LEGACY_PROFILE_MAP[profileId];
    if (!USAGE_PROFILES[profileId] && profileId !== 'custom') profileId = DEFAULT_PROFILE;

    if (!App.state.usageProfile)     App.state.usageProfile     = profileId;
    if (!App.state.usageCustom)      App.state.usageCustom      = stored.usageCustom      || { ...CUSTOM_DEFAULTS };
    if (!App.state.teamSize)         App.state.teamSize         = stored.teamSize         || DEFAULT_TEAM;
    if (App.state.teamSeatsCustom == null) {
      App.state.teamSeatsCustom = Number.isFinite(stored.teamSeatsCustom)
        ? stored.teamSeatsCustom : DEFAULT_TEAM_CUSTOM_SEATS;
    }
    if (!App.state.repoSize)         App.state.repoSize         = stored.repoSize         || DEFAULT_REPO;
    if (!App.state.analysisBaseline) App.state.analysisBaseline = stored.baseline         || 'none';
  }

  function render() {
    const root = App.refs.stackAnalysis;
    if (!root) return;

    // Drop the active help popover reference — the DOM it points to is about
    // to be wiped by innerHTML, otherwise click-outside would no-op silently.
    activeHelp = null;

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

    root.appendChild(renderHeader());

    root.appendChild(renderCost(sel));
    root.appendChild(renderLimits(sel));
    root.appendChild(renderSpeed(sel));
    root.appendChild(renderResponsiveness(sel));
    root.appendChild(renderQuality(sel));
    root.appendChild(renderContextFit(sel));
    root.appendChild(renderPrivacy(sel));
    root.appendChild(renderComplexity(sel));
    root.appendChild(renderMethodology(sel));
  }

  // ---- Header (title + baseline picker) ---------------------------------

  function renderHeader() {
    const head = document.createElement('div');
    head.className = 'stack-analysis-head';

    const title = document.createElement('h2');
    title.className = 'stack-analysis-title';
    title.textContent = 'Stack analysis';
    head.appendChild(title);

    const compareWrap = document.createElement('label');
    compareWrap.className = 'stack-analysis-compare';
    const compareLbl = document.createElement('span');
    compareLbl.className = 'stack-analysis-compare-label';
    compareLbl.textContent = 'Compare to';
    compareWrap.appendChild(compareLbl);
    const select = document.createElement('select');
    select.className = 'stack-analysis-compare-select';
    for (const b of Object.values(BASELINES)) {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.label;
      if (App.state.analysisBaseline === b.id) opt.selected = true;
      select.appendChild(opt);
    }
    select.addEventListener('change', () => {
      App.state.analysisBaseline = select.value;
      saveStore();
      render();
    });
    compareWrap.appendChild(select);
    head.appendChild(compareWrap);

    return head;
  }

  // ---- Cost --------------------------------------------------------------

  function renderCost(sel) {
    const profile = getProfile();
    const team = getTeam();
    const section = document.createElement('section');
    section.className = 'stack-metric stack-metric-cost';

    section.appendChild(metricHead('Cost', {
      help: 'Token usage × LLM listed prices, plus a subscription proxy for paid tools. Scaled by team size and adjusted by per-tool token efficiency.',
    }));

    section.appendChild(renderUsageToggle(profile));
    section.appendChild(renderTeamToggle(team));
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

    const estimate = estimateMonthlyCost(sel, profile, team);
    const baselineEst = computeBaselineEstimate('cost', sel, profile, team);

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

    if (baselineEst != null) {
      figure.appendChild(makeDeltaChip(estimate.amount, baselineEst, { unit: '$', lowerIsBetter: true }));
    }
    const costStale = makeStalenessChip(oldestVerifiedAcross(sel, ['priceInput', 'priceOutput']));
    if (costStale) figure.appendChild(costStale);
    summary.appendChild(figure);

    const rangeLine = document.createElement('p');
    rangeLine.className = 'stack-cost-range';
    rangeLine.textContent =
      `Range ${formatUSD(estimate.low)}–${formatUSD(estimate.high)}/mo · ` +
      `~${formatUSD(estimate.amount * 12)}/yr`;
    summary.appendChild(rangeLine);

    summary.appendChild(renderBreakdown(estimate));

    const basis = document.createElement('p');
    basis.className = 'stack-cost-basis';
    const inputMonthlyMTok = (profile.inputPerDay * profile.workingDaysPerMonth) / 1_000_000;
    const outputMonthlyMTok = (profile.outputPerDay * profile.workingDaysPerMonth) / 1_000_000;
    let basisText =
      `${profile.label} workflow: ${fmtTokens(profile.inputPerDay)} in + ${fmtTokens(profile.outputPerDay)} out per day × ` +
      `${profile.workingDaysPerMonth} working days/mo ` +
      `(${formatMTok(inputMonthlyMTok)}M in / ${formatMTok(outputMonthlyMTok)}M out monthly). ` +
      `Paid subscriptions counted at $${profile.subscriptionProxy}/mo each. ` +
      `Team: ${team.label} (×${team.tokenMult.toFixed(1)} tokens, ×${team.seats} seats).`;
    if (estimate.multRange && estimate.multRange.typical > 1.05) {
      const r = estimate.multRange;
      const who = estimate.multContributor ? ` (${estimate.multContributor})` : '';
      basisText += ` Your IDE/integration${who} burns ~${r.typical.toFixed(1)}× tokens vs a CLI agent ` +
        `(range ${r.low.toFixed(1)}–${r.high.toFixed(1)}× depending on task).`;
    }
    basis.textContent = basisText;
    summary.appendChild(basis);
    split.appendChild(summary);

    section.appendChild(split);

    const notes = collectCostNotes(sel);
    if (notes.length > 0) section.appendChild(renderCostNotes(notes));

    return section;
  }

  function collectCostNotes(sel) {
    const out = [];
    for (const layer of LAYERS) {
      for (const p of (sel[layer.id] || [])) {
        if (p.costNotes) out.push({ name: p.name, note: p.costNotes });
      }
    }
    return out;
  }

  function renderCostNotes(notes) {
    const det = document.createElement('details');
    det.className = 'stack-cost-notes';
    const sum = document.createElement('summary');
    sum.className = 'stack-cost-notes-summary';
    sum.textContent = `Known billing gotchas (${notes.length})`;
    det.appendChild(sum);
    const ul = document.createElement('ul');
    ul.className = 'stack-cost-notes-list';
    for (const n of notes) {
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = n.name + ': ';
      li.appendChild(strong);
      li.appendChild(document.createTextNode(n.note));
      ul.appendChild(li);
    }
    det.appendChild(ul);
    return det;
  }

  function renderUsageToggle(profile) {
    const wrap = document.createElement('div');
    wrap.className = 'stack-usage-toggle';
    wrap.setAttribute('role', 'radiogroup');
    wrap.setAttribute('aria-label', 'Usage intensity');

    const choices = [
      USAGE_PROFILES.autocomplete,
      USAGE_PROFILES.chat,
      USAGE_PROFILES.agentic,
      USAGE_PROFILES.autonomous,
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
        saveStore();
        render();
      });

      wrap.appendChild(btn);
    }
    return wrap;
  }

  function renderTeamToggle(team) {
    const outer = document.createElement('div');
    outer.className = 'stack-team-block';

    const wrap = document.createElement('div');
    wrap.className = 'stack-usage-toggle stack-team-toggle';
    wrap.setAttribute('role', 'radiogroup');
    wrap.setAttribute('aria-label', 'Team size');

    const choices = [
      ...Object.values(TEAM_SIZES),
      { id: 'custom', label: 'Custom', seats: null },
    ];

    for (const opt of choices) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'stack-usage-option' + (team.id === opt.id ? ' is-active' : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', team.id === opt.id ? 'true' : 'false');

      const lbl = document.createElement('span');
      lbl.className = 'stack-usage-option-label';
      lbl.textContent = opt.label;
      const sub = document.createElement('span');
      sub.className = 'stack-usage-option-sub';
      if (opt.id === 'custom') {
        sub.textContent = 'Enter exact';
      } else {
        sub.textContent = `${opt.seats} ${opt.seats === 1 ? 'seat' : 'seats'}`;
      }
      btn.appendChild(lbl);
      btn.appendChild(sub);

      btn.addEventListener('click', () => {
        if (App.state.teamSize === opt.id) return;
        App.state.teamSize = opt.id;
        saveStore();
        render();
      });
      wrap.appendChild(btn);
    }
    outer.appendChild(wrap);

    if (team.id === 'custom') outer.appendChild(renderTeamSeatsField(team));
    return outer;
  }

  function renderTeamSeatsField(team) {
    const panel = document.createElement('div');
    panel.className = 'stack-team-seats-field';

    const label = document.createElement('label');
    label.className = 'stack-usage-field stack-team-seats-label';

    const lbl = document.createElement('span');
    lbl.className = 'stack-usage-field-label';
    lbl.textContent = 'Number of seats';
    label.appendChild(lbl);

    const inputWrap = document.createElement('span');
    inputWrap.className = 'stack-usage-field-input';
    const input = document.createElement('input');
    input.type = 'number';
    input.inputMode = 'numeric';
    input.min = '1';
    input.max = String(MAX_TEAM_SEATS);
    input.step = '1';
    input.value = String(team.seats);
    input.addEventListener('change', () => {
      const parsed = Number(input.value);
      if (!Number.isFinite(parsed) || parsed < 1) { input.value = '1'; App.state.teamSeatsCustom = 1; }
      else if (parsed > MAX_TEAM_SEATS) { input.value = String(MAX_TEAM_SEATS); App.state.teamSeatsCustom = MAX_TEAM_SEATS; }
      else { App.state.teamSeatsCustom = Math.round(parsed); }
      saveStore();
      render();
    });
    inputWrap.appendChild(input);
    const suffix = document.createElement('span');
    suffix.className = 'stack-usage-field-suffix';
    suffix.textContent = team.seats === 1 ? 'seat' : 'seats';
    inputWrap.appendChild(suffix);
    label.appendChild(inputWrap);

    panel.appendChild(label);

    const hint = document.createElement('span');
    hint.className = 'stack-team-seats-hint';
    hint.textContent = `≈ ${team.tokenMult.toFixed(1)}× token volume (sub-linear: not every seat codes daily)`;
    panel.appendChild(hint);

    return panel;
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
        saveStore();
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

    grid.appendChild(field({ key: 'inputPerDay', label: 'Input tokens / day', suffix: 'tokens', min: 0, step: 10000, value: c.inputPerDay, onCommit: v => { c.inputPerDay = v == null ? 0 : v; } }));
    grid.appendChild(field({ key: 'outputPerDay', label: 'Output tokens / day', suffix: 'tokens', min: 0, step: 10000, value: c.outputPerDay, onCommit: v => { c.outputPerDay = v == null ? 0 : v; } }));
    grid.appendChild(field({ key: 'workingDaysPerMonth', label: 'Working days / month', suffix: 'days', min: 0, step: 1, value: c.workingDaysPerMonth, onCommit: v => { c.workingDaysPerMonth = v == null ? 0 : v; } }));
    grid.appendChild(field({ key: 'subscriptionProxy', label: 'Subscription cost', suffix: '$ / mo each', min: 0, step: 1, value: c.subscriptionProxy, onCommit: v => { c.subscriptionProxy = v == null ? 0 : v; } }));
    grid.appendChild(field({ key: 'llmInputPrice', label: 'LLM input price (override)', suffix: '$ / 1M tok', min: 0, step: 0.1, placeholder: 'auto', value: c.llmInputPrice, onCommit: v => { c.llmInputPrice = v; } }));
    grid.appendChild(field({ key: 'llmOutputPrice', label: 'LLM output price (override)', suffix: '$ / 1M tok', min: 0, step: 0.1, placeholder: 'auto', value: c.llmOutputPrice, onCommit: v => { c.llmOutputPrice = v; } }));

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
      saveStore();
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

  function estimateMonthlyCost(sel, profile, team) {
    let hasUnknown = false;
    let llmInputTypical = 0, llmOutputTypical = 0, llmCounted = 0;
    let subs = 0, subsCount = 0;

    // Token efficiency: pick the worst-case (highest typical) multiplier
    // across IDE + integration. Each may now be a {low,typical,high} range or
    // a legacy number — normalized either way.
    let multRange = { low: 1, typical: 1, high: 1 };
    let multContributor = null;
    for (const layer of ['ide', 'integration']) {
      for (const p of (sel[layer] || [])) {
        const r = normalizeMult(p.tokenMultiplier);
        if (!r) continue;
        if (r.typical > multRange.typical) {
          multRange = r;
          multContributor = p.name;
        }
      }
    }

    const teamMult = (team && Number.isFinite(team.tokenMult)) ? team.tokenMult : 1;
    const seats = (team && Number.isFinite(team.seats)) ? team.seats : 1;

    const inputMTokBase  = (profile.inputPerDay  * profile.workingDaysPerMonth) / 1_000_000 * teamMult;
    const outputMTokBase = (profile.outputPerDay * profile.workingDaysPerMonth) / 1_000_000 * teamMult;

    const overrideIn = profile.llmInputPrice;
    const overrideOut = profile.llmOutputPrice;
    const hasFullOverride =
      overrideIn != null && Number.isFinite(overrideIn) &&
      overrideOut != null && Number.isFinite(overrideOut);

    const llmPicks = sel.llm || [];
    let avgInPrice = 0, avgOutPrice = 0;
    if (llmPicks.length > 0) {
      if (hasFullOverride) {
        avgInPrice = overrideIn;
        avgOutPrice = overrideOut;
        llmCounted = llmPicks.length;
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
          avgInPrice = inSum / count;
          avgOutPrice = outSum / count;
          llmCounted = count;
        }
      }
    }

    llmInputTypical  = avgInPrice  * inputMTokBase  * multRange.typical;
    llmOutputTypical = avgOutPrice * outputMTokBase * multRange.typical;
    const llmTypical = llmInputTypical + llmOutputTypical;

    // LLM range applies the multiplier range AND the profile's bursty-usage
    // variance — these compound (a noisy multiplier on noisy usage).
    const variance = (profile.variance && profile.variance.low) ? profile.variance : { low: 0.6, high: 1.8 };
    const llmLow  = avgInPrice * inputMTokBase * multRange.low  * variance.low
                  + avgOutPrice * outputMTokBase * multRange.low * variance.low;
    const llmHigh = avgInPrice * inputMTokBase * multRange.high * variance.high
                  + avgOutPrice * outputMTokBase * multRange.high * variance.high;

    for (const layer of LAYERS) {
      if (layer.id === 'llm') continue;
      const picks = sel[layer.id] || [];
      for (const p of picks) {
        const v = p.pricing || p.cost;
        if (v === 'Paid subscription') {
          subs += profile.subscriptionProxy * seats;
          subsCount++;
        }
      }
    }

    // Subscriptions don't get the variance treatment — they're fixed costs.
    const amount = llmTypical + subs;
    const low    = llmLow + subs;
    const high   = llmHigh + subs;

    let band;
    if (high < 25)       band = { tier: 'low',      label: 'Low'      };
    else if (high < 200) band = { tier: 'moderate', label: 'Moderate' };
    else                 band = { tier: 'high',     label: 'High'     };

    return {
      amount, low, high, band, hasUnknown,
      llmInput: llmInputTypical, llmOutput: llmOutputTypical, llmCounted,
      subs, subsCount,
      tokenMult: multRange.typical, multRange, multContributor,
    };
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

  const USD_WHOLE = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const USD_CENTS = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function formatUSD(n) {
    if (!Number.isFinite(n)) return '$0';
    if (n === 0) return '$0';
    if (n < 10) return USD_CENTS.format(n);
    return USD_WHOLE.format(Math.round(n));
  }

  // ---- Limits risk -------------------------------------------------------

  function renderLimits(sel) {
    const section = document.createElement('section');
    section.className = 'stack-metric stack-metric-limits';

    section.appendChild(metricHead('Rate-limit risk', {
      help: 'Whether your usage is likely to hit each tool\'s published rate or credit caps. The pain point most-cited in 2026 dev surveys.',
    }));

    const profile = getProfile();
    const team = getTeam();
    const teamMult = (team && Number.isFinite(team.tokenMult)) ? team.tokenMult : 1;

    // Pick the worst-case typical multiplier across IDE + integration.
    let multRange = { low: 1, typical: 1, high: 1 };
    for (const layer of ['ide', 'integration']) {
      for (const p of (sel[layer] || [])) {
        const r = normalizeMult(p.tokenMultiplier);
        if (r && r.typical > multRange.typical) multRange = r;
      }
    }

    const baseTokens = (profile.inputPerDay + profile.outputPerDay) * profile.workingDaysPerMonth * teamMult;
    const monthlyTokens     = baseTokens * multRange.typical;
    const monthlyTokensHigh = baseTokens * multRange.high * (profile.variance ? profile.variance.high : 1.8);

    const findings = [];
    let worst = 'good';
    let oldestVerified = null;

    for (const layer of ['ide', 'llm']) {
      for (const p of (sel[layer] || [])) {
        const key = p.limitsModel;
        if (!key) continue;
        const cap = LIMIT_CAPS[key];
        if (!cap) continue;
        if (cap.verifiedOn && (!oldestVerified || cap.verifiedOn < oldestVerified)) {
          oldestVerified = cap.verifiedOn;
        }
        const capTypical = cap.monthlyTokens && cap.monthlyTokens.typical;
        if (!Number.isFinite(capTypical)) {
          findings.push({ name: p.name, label: cap.label, status: 'good', note: 'no cap — pay-as-you-go' });
          continue;
        }
        const ratio     = monthlyTokens     / capTypical;
        const ratioHigh = monthlyTokensHigh / capTypical;

        let status, note;
        if (ratio >= 1) {
          status = 'bad';
          note = `~${Math.round(ratio*100)}% of cap typically — likely to throttle`;
          if (worst !== 'bad') worst = 'bad';
        } else if (ratio >= 0.7 || ratioHigh >= 1) {
          status = 'warn';
          note = ratioHigh >= 1
            ? `~${Math.round(ratio*100)}% typically, but a bursty week could exceed cap (${Math.round(ratioHigh*100)}%)`
            : `~${Math.round(ratio*100)}% of cap — comfortable margin gone`;
          if (worst === 'good') worst = 'warn';
        } else {
          status = 'good';
          note = `~${Math.round(ratio*100)}% of cap — comfortable headroom`;
        }
        if (cap.burst === 'tight' && status !== 'bad') {
          note += '; tight rolling-window caps may still trip';
        }
        findings.push({ name: p.name, label: cap.label, status, note });
      }
    }

    if (findings.length === 0) {
      const hint = document.createElement('p');
      hint.className = 'stack-metric-subtext';
      hint.textContent = 'No published rate limits detected on your picks — assume pay-as-you-go API billing.';
      section.appendChild(hint);
      return section;
    }

    const overall = document.createElement('div');
    overall.className = 'stack-metric-row';
    const pill = document.createElement('span');
    const status = worst;
    pill.className = `stack-status-pill is-${status}`;
    pill.textContent = status === 'good' ? 'Comfortable' : status === 'warn' ? 'Watch usage' : 'Likely to throttle';
    overall.appendChild(pill);
    const note = document.createElement('span');
    note.className = 'stack-metric-label';
    note.textContent = `${fmtTokens(monthlyTokens)} tokens/mo projected`;
    overall.appendChild(note);
    const stale = makeStalenessChip(oldestVerified);
    if (stale) overall.appendChild(stale);
    section.appendChild(overall);

    const ul = document.createElement('ul');
    ul.className = 'stack-limits-list';
    for (const f of findings) {
      const li = document.createElement('li');
      const dot = document.createElement('span');
      dot.className = `stack-status-dot is-${f.status}`;
      li.appendChild(dot);
      const strong = document.createElement('strong');
      strong.textContent = `${f.name} (${f.label}): `;
      li.appendChild(strong);
      li.appendChild(document.createTextNode(f.note));
      ul.appendChild(li);
    }
    section.appendChild(ul);

    if (worst !== 'good') {
      const fix = document.createElement('p');
      fix.className = 'stack-metric-fix';
      fix.textContent = worst === 'bad'
        ? '→ Consider a pay-as-you-go API key, downgrading usage profile, or splitting work across tools.'
        : '→ Keep an eye on usage; a heavy week could push you into throttling.';
      section.appendChild(fix);
    }

    return section;
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

    section.appendChild(metricHead('Speed', {
      help: 'Driven by your LLM choice. Slowest model in a multi-pick gates the rating.',
    }));

    const llmPicks = sel.llm || [];
    let score = null;
    let label = '—';
    let contributor = null;
    for (const p of llmPicks) {
      const m = SPEED_MAP[p.speedTier];
      if (!m) continue;
      if (score == null || m.score < score) { score = m.score; label = m.label; contributor = p.name; }
    }
    if (score == null) score = 0;

    const row = document.createElement('div');
    row.className = 'stack-metric-row';
    row.appendChild(makeDotBar(score));
    const lbl = document.createElement('span');
    lbl.className = 'stack-metric-label';
    lbl.textContent = label;
    row.appendChild(lbl);

    const baselineSpeed = computeBaselineScore('speed', sel);
    if (baselineSpeed != null) row.appendChild(makeDeltaChip(score, baselineSpeed, { unit: 'dot', lowerIsBetter: false }));

    section.appendChild(row);

    const sub = document.createElement('p');
    sub.className = 'stack-metric-subtext';
    sub.textContent = contributor
      ? `Gated by ${contributor}. Slowest model in a multi-pick wins.`
      : 'No speed-tier data on your LLM pick.';
    section.appendChild(sub);

    if (score > 0 && score <= 2) {
      const fix = document.createElement('p');
      fix.className = 'stack-metric-fix';
      fix.textContent = '→ For latency-sensitive editing, pair the reasoning model with a Fast model for autocomplete.';
      section.appendChild(fix);
    }

    return section;
  }

  // ---- Responsiveness ---------------------------------------------------

  function renderResponsiveness(sel) {
    const section = document.createElement('section');
    section.className = 'stack-metric stack-metric-responsiveness';

    section.appendChild(metricHead('Responsiveness', {
      help: 'Combines IDE interface, integration overhead, and context freshness across layers.',
    }));

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

    const baseline = computeBaselineScore('responsiveness', sel);
    if (baseline != null) row.appendChild(makeDeltaChip(score, baseline, { unit: 'dot', lowerIsBetter: false }));
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

    section.appendChild(metricHead('Quality', {
      help: 'Average of SWE-bench / HumanEval percentages on the picked LLM(s), plus a bonus for agent autonomy.',
    }));

    let llmAvg = 0, llmCount = 0;
    let missingBench = false;

    const llmPicks = sel.llm || [];
    for (const p of llmPicks) {
      let sum = 0, n = 0;
      const sb = parseBenchPercent(p.sweBench);
      if (sb != null) { sum += sb; n++; }
      const he = parseBenchPercent(p.humanEval);
      if (he != null) { sum += he; n++; }
      if (n > 0) { llmAvg += sum / n; llmCount++; }
      else missingBench = true;
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

    if (missingBench || llmCount === 0) {
      const est = document.createElement('span');
      est.className = 'stack-confidence-chip';
      est.textContent = llmCount === 0 ? 'no benchmark data' : 'estimated';
      row.appendChild(est);
    }

    const baseline = computeBaselineScore('quality', sel);
    if (baseline != null) row.appendChild(makeDeltaChip(score, baseline, { unit: 'dot', lowerIsBetter: false }));

    const qStale = makeStalenessChip(oldestVerifiedAcross(sel, ['sweBench', 'humanEval']));
    if (qStale) row.appendChild(qStale);

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

  // ---- Context window fit -----------------------------------------------

  function renderContextFit(sel) {
    const section = document.createElement('section');
    section.className = 'stack-metric stack-metric-context';

    section.appendChild(metricHead('Context window fit', {
      help: 'Whether your LLM can hold enough of your codebase in context. Models tend to degrade well before their advertised max.',
    }));

    section.appendChild(renderRepoToggle());

    const repo = getRepo();
    const llmPicks = sel.llm || [];
    let minCtx = null;
    let contributor = null;
    let missing = false;
    for (const p of llmPicks) {
      const ctx = Number(p.contextWindow);
      if (!Number.isFinite(ctx) || ctx <= 0) { missing = true; continue; }
      if (minCtx == null || ctx < minCtx) { minCtx = ctx; contributor = p.name; }
    }

    const row = document.createElement('div');
    row.className = 'stack-metric-row';

    let score, label, status;
    if (minCtx == null) {
      score = 0; label = 'No data'; status = 'warn';
    } else {
      // Reliable window is roughly 65% of advertised — sudden drop-off above that.
      const reliable = minCtx * 0.65;
      const ratio = repo.needTokens / reliable;
      if (ratio <= 0.5)      { score = 5; label = 'Comfortable';      status = 'good'; }
      else if (ratio <= 0.9) { score = 4; label = 'Adequate';         status = 'good'; }
      else if (ratio <= 1.5) { score = 3; label = 'Tight';            status = 'warn'; }
      else                   { score = 2; label = 'Will paginate';    status = 'bad';  }
    }
    row.appendChild(makeDotBar(score));
    const lbl = document.createElement('span');
    lbl.className = 'stack-metric-label';
    lbl.textContent = label;
    row.appendChild(lbl);
    if (missing && minCtx != null) {
      const chip = document.createElement('span');
      chip.className = 'stack-confidence-chip';
      chip.textContent = 'some picks lack data';
      row.appendChild(chip);
    }
    const ctxStale = makeStalenessChip(oldestVerifiedAcross(sel, ['contextWindow']));
    if (ctxStale) row.appendChild(ctxStale);
    section.appendChild(row);

    const sub = document.createElement('p');
    sub.className = 'stack-metric-subtext';
    if (minCtx != null) {
      sub.textContent = `${repo.label} repo (~${fmtTokens(repo.needTokens)} working set) vs ${contributor}'s ${fmtTokens(minCtx)} window (reliable ~${fmtTokens(Math.round(minCtx * 0.65))}).`;
    } else {
      sub.textContent = 'No context-window data on your LLM pick.';
    }
    section.appendChild(sub);

    if (status === 'bad') {
      const fix = document.createElement('p');
      fix.className = 'stack-metric-fix';
      fix.textContent = '→ Pick a 1M-context model (Gemini 3 Pro, Claude Opus 4.7) or add a RAG layer for retrieval.';
      section.appendChild(fix);
    } else if (status === 'warn') {
      const fix = document.createElement('p');
      fix.className = 'stack-metric-fix';
      fix.textContent = '→ You\'ll need careful file-scoping; consider a RAG/context layer.';
      section.appendChild(fix);
    }

    return section;
  }

  function renderRepoToggle() {
    const repo = getRepo();
    const wrap = document.createElement('div');
    wrap.className = 'stack-usage-toggle stack-repo-toggle';
    wrap.setAttribute('role', 'radiogroup');
    wrap.setAttribute('aria-label', 'Repo size');

    for (const opt of Object.values(REPO_SIZES)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'stack-usage-option' + (repo.id === opt.id ? ' is-active' : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', repo.id === opt.id ? 'true' : 'false');
      const lbl = document.createElement('span');
      lbl.className = 'stack-usage-option-label';
      lbl.textContent = opt.label;
      const sub = document.createElement('span');
      sub.className = 'stack-usage-option-sub';
      sub.textContent = opt.blurb;
      btn.appendChild(lbl);
      btn.appendChild(sub);
      btn.addEventListener('click', () => {
        if (App.state.repoSize === opt.id) return;
        App.state.repoSize = opt.id;
        saveStore();
        render();
      });
      wrap.appendChild(btn);
    }
    return wrap;
  }

  // ---- Privacy -----------------------------------------------------------

  function renderPrivacy(sel) {
    const section = document.createElement('section');
    section.className = 'stack-metric stack-metric-privacy';

    section.appendChild(metricHead('Privacy', {
      help: 'Tracks where your code data flows across model hosting, integration, and context layers, plus published policy specifics.',
    }));

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

    const baseline = computeBaselineScore('privacy', sel);
    if (baseline != null) row.appendChild(makeDeltaChip(score, baseline, { unit: 'dot', lowerIsBetter: false }));

    section.appendChild(row);

    // Detail breakdown — research showed users want auditable specifics.
    const detail = collectPrivacyDetails(sel);
    if (detail.rows.length > 0) {
      const dl = document.createElement('dl');
      dl.className = 'stack-privacy-detail';
      for (const r of detail.rows) {
        const dt = document.createElement('dt');
        dt.textContent = r.label;
        const dd = document.createElement('dd');
        dd.textContent = r.value;
        if (r.muted) dd.classList.add('is-muted');
        dl.appendChild(dt);
        dl.appendChild(dd);
      }
      section.appendChild(dl);
    }

    if (score <= 2) {
      const fix = document.createElement('p');
      fix.className = 'stack-metric-fix';
      fix.textContent = '→ Enable Privacy Mode in your IDE, swap to an open-weights or local model, or use a self-hosted gateway.';
      section.appendChild(fix);
    }

    return section;
  }

  function collectPrivacyDetails(sel) {
    const rows = [];
    function summarize(label, vals) {
      if (vals.length === 0) return;
      const unique = [...new Set(vals.filter(v => v != null && v !== ''))];
      if (unique.length === 0) {
        rows.push({ label, value: 'unknown', muted: true });
      } else {
        rows.push({ label, value: unique.join(', '), muted: false });
      }
    }
    const all = [];
    for (const layer of LAYERS) for (const p of (sel[layer.id] || [])) all.push(p);
    summarize('Training opt-out', all.map(p => p.trainingOptOut));
    summarize('Data retention',  all.map(p => p.retentionDays != null ? `${p.retentionDays}d` : null));
    summarize('SOC2',            all.map(p => p.soc2));
    summarize('Local-runnable',  all.map(p => p.localRunnable));
    return { rows };
  }

  // ---- Setup complexity --------------------------------------------------

  const SETUP_MAP = { 'Zero': 0, 'Low': 1, 'Medium': 2, 'High': 3 };

  function renderComplexity(sel) {
    const section = document.createElement('section');
    section.className = 'stack-metric stack-metric-complexity';

    section.appendChild(metricHead('Setup complexity', {
      help: 'Averaged across the setup effort of every picked layer.',
    }));

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

    const baseline = computeBaselineScore('complexity', sel);
    if (baseline != null) row.appendChild(makeDeltaChip(score, baseline, { unit: 'dot', lowerIsBetter: true }));

    section.appendChild(row);

    const sub = document.createElement('p');
    sub.className = 'stack-metric-subtext';
    sub.textContent = 'Averaged across the setup effort of every picked layer.';
    section.appendChild(sub);

    return section;
  }

  // ---- Baseline (vs-comparison) -----------------------------------------

  function computeBaselineEstimate(kind, sel, profile, team) {
    const b = getBaseline();
    if (b.id === 'none') return null;
    if (kind === 'cost') {
      const est = estimateMonthlyCost(b.selections, profile, team);
      return est.amount;
    }
    return null;
  }

  function computeBaselineScore(metric, currentSel) {
    const b = getBaseline();
    if (b.id === 'none') return null;
    const bSel = b.selections;
    if (metric === 'speed') {
      let score = null;
      for (const p of (bSel.llm || [])) {
        const m = SPEED_MAP[p.speedTier];
        if (!m) continue;
        if (score == null || m.score < score) score = m.score;
      }
      return score ?? 0;
    }
    if (metric === 'quality') {
      let sumAvg = 0, n = 0;
      for (const p of (bSel.llm || [])) {
        let s = 0, c = 0;
        const sb = parseBenchPercent(p.sweBench); if (sb != null) { s += sb; c++; }
        const he = parseBenchPercent(p.humanEval); if (he != null) { s += he; c++; }
        if (c > 0) { sumAvg += s / c; n++; }
      }
      const base = n > 0 ? sumAvg / n : 0;
      if (n === 0) return 0;
      if (base >= 80) return 5;
      if (base >= 60) return 4;
      if (base >= 40) return 3;
      if (base >= 20) return 2;
      return 1;
    }
    if (metric === 'privacy') {
      let ws = 0, tw = 0;
      const llmPicks = bSel.llm || [];
      if (llmPicks.length) {
        let sum = 0;
        for (const p of llmPicks) sum += (p.hosting === 'Open-weights' ? 5 : p.hosting === 'Closed/API' ? 2 : 3);
        ws += (sum / llmPicks.length) * 0.35; tw += 0.35;
      }
      const raw = tw > 0 ? ws / tw : 0;
      return Math.max(1, Math.min(5, Math.round(raw)));
    }
    if (metric === 'responsiveness') {
      let ws = 0, tw = 0;
      const idePicks = bSel.ide || [];
      if (idePicks.length) {
        let s = 0;
        for (const p of idePicks) {
          if (p.interface === 'Terminal/TUI') s += 5;
          else if (p.aiIntegration === 'AI-native') s += 4;
          else if (p.aiIntegration === 'AI via extension') s += 3;
          else s += 2;
        }
        ws += (s / idePicks.length) * 0.4; tw += 0.4;
      }
      const raw = tw > 0 ? ws / tw : 0;
      return Math.max(1, Math.min(5, Math.round(raw)));
    }
    if (metric === 'complexity') {
      let total = 0, count = 0;
      for (const p of (bSel.ide || [])) {
        const v = SETUP_MAP[p.complexity];
        if (v != null) { total += v; count++; }
      }
      const avg = count > 0 ? total / count : 0;
      if (avg < 0.75) return 1;
      if (avg < 1.75) return 2;
      if (avg < 2.5)  return 3;
      return 5;
    }
    return null;
  }

  // ---- Methodology (collapsible "where do these numbers come from?") ----

  function renderMethodology(sel) {
    const det = document.createElement('details');
    det.className = 'stack-methodology';
    const sum = document.createElement('summary');
    sum.className = 'stack-methodology-summary';
    sum.textContent = 'How these numbers are calculated';
    det.appendChild(sum);

    const body = document.createElement('div');
    body.className = 'stack-methodology-body';

    const profile = getProfile();
    const profParts = [];
    profParts.push(`<strong>Workflow:</strong> ${profile.label} — ${fmtTokens(profile.inputPerDay)} in / ${fmtTokens(profile.outputPerDay)} out per day.`);
    if (profile.methodology) profParts.push(profile.methodology);
    if (profile.variance) profParts.push(`Cost range applies a ${profile.variance.low.toFixed(1)}×–${profile.variance.high.toFixed(1)}× bursty-usage variance.`);
    const p1 = document.createElement('p');
    p1.innerHTML = profParts.join(' ');
    body.appendChild(p1);

    const p2 = document.createElement('p');
    p2.innerHTML =
      '<strong>Token multipliers:</strong> stored as low–typical–high ranges per tool, ' +
      'since the often-cited "Cursor uses 5.5× more tokens than Claude Code" claim is one benchmark — ' +
      'real workloads vary by task type (refactor vs. autocomplete vs. chat).';
    body.appendChild(p2);

    const p3 = document.createElement('p');
    p3.innerHTML =
      '<strong>Rate-limit caps:</strong> based on each vendor\'s published plan tiers. ' +
      'Caps drift — we surface a "data ≥60d old" chip when a value was last verified more than ' +
      `${STALENESS_DAYS.warn} days ago, and a stronger warning past ${STALENESS_DAYS.bad} days.`;
    body.appendChild(p3);

    const p4 = document.createElement('p');
    p4.innerHTML =
      '<strong>Pricing:</strong> pulled from each LLM\'s published per-million-token rate. ' +
      'Subscription tools are counted at the profile\'s subscription proxy ($' +
      profile.subscriptionProxy + '/mo each), multiplied by team seats.';
    body.appendChild(p4);

    const p5 = document.createElement('p');
    p5.className = 'stack-methodology-foot';
    p5.textContent =
      'All numbers are best-effort estimates. If your real bill differs by more than the displayed range, ' +
      'use the Custom workflow to plug in your actual token volume and prices.';
    body.appendChild(p5);

    det.appendChild(body);
    return det;
  }

  // ---- Shared UI helpers -------------------------------------------------

  // Tracks the currently-open help popover so opening a new one closes the
  // old. Also drives the document-level click-outside + Escape handlers,
  // which are installed lazily the first time a popover opens.
  let activeHelp = null;
  let helpDocListenersInstalled = false;

  function installHelpDocListeners() {
    if (helpDocListenersInstalled) return;
    helpDocListenersInstalled = true;
    document.addEventListener('click', (e) => {
      if (!activeHelp) return;
      if (activeHelp.btn.contains(e.target) || activeHelp.panel.contains(e.target)) return;
      closeActiveHelp();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeHelp) closeActiveHelp();
    });
  }

  function closeActiveHelp() {
    if (!activeHelp) return;
    activeHelp.panel.hidden = true;
    activeHelp.btn.setAttribute('aria-expanded', 'false');
    activeHelp = null;
  }

  function metricHead(title, opts) {
    const wrap = document.createElement('div');
    wrap.className = 'stack-metric-head';

    const h = document.createElement('h3');
    h.className = 'stack-metric-title';
    h.textContent = title;
    wrap.appendChild(h);

    let panel = null;
    if (opts && opts.help) {
      const tip = document.createElement('button');
      tip.type = 'button';
      tip.className = 'stack-metric-help';
      tip.setAttribute('aria-label', 'Explain this metric');
      tip.setAttribute('aria-expanded', 'false');
      tip.title = opts.help;
      tip.textContent = '?';

      panel = document.createElement('div');
      panel.className = 'stack-metric-help-panel';
      panel.hidden = true;
      panel.setAttribute('role', 'note');
      panel.textContent = opts.help;

      tip.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpenHere = activeHelp && activeHelp.btn === tip;
        if (isOpenHere) { closeActiveHelp(); return; }
        closeActiveHelp();
        panel.hidden = false;
        tip.setAttribute('aria-expanded', 'true');
        activeHelp = { btn: tip, panel };
        installHelpDocListeners();
      });

      wrap.appendChild(tip);
    }
    if (panel) {
      // Container so the popover sits below the head and inside the metric
      // section (so positioning stays predictable across themes/widths).
      const headWrap = document.createElement('div');
      headWrap.className = 'stack-metric-head-wrap';
      headWrap.appendChild(wrap);
      headWrap.appendChild(panel);
      return headWrap;
    }
    return wrap;
  }

  function makeDeltaChip(current, baseline, opts) {
    const span = document.createElement('span');
    span.className = 'stack-delta';
    const diff = current - baseline;
    const tol = opts.unit === '$' ? 1 : 0;
    if (Math.abs(diff) <= tol) {
      span.classList.add('is-neutral');
      span.textContent = 'same as baseline';
      return span;
    }
    const better = opts.lowerIsBetter ? diff < 0 : diff > 0;
    span.classList.add(better ? 'is-better' : 'is-worse');
    let text;
    if (opts.unit === '$') {
      text = (diff > 0 ? '+' : '−') + formatUSD(Math.abs(diff));
    } else {
      const n = Math.round(diff);
      text = (n > 0 ? '+' : '−') + Math.abs(n) + (Math.abs(n) === 1 ? ' dot' : ' dots');
    }
    span.textContent = `${text} vs baseline`;
    return span;
  }

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

  // Returns a small chip (or null) flagging that some inputs are old.
  // iso may be a single ISO date string or null.
  function makeStalenessChip(iso) {
    if (!iso) return null;
    const level = stalenessLevel(iso);
    if (level === 'good' || level === 'unknown') return null;
    const days = daysSince(iso);
    const span = document.createElement('span');
    span.className = `stack-staleness-chip is-${level}`;
    span.textContent = level === 'bad' ? `data ≥${STALENESS_DAYS.bad}d old` : `data ≥${STALENESS_DAYS.warn}d old`;
    span.title = `Some inputs were last verified ${days} days ago (${iso}). Vendor pricing and benchmarks change often — double-check before committing.`;
    return span;
  }

  // Collects the oldest verifiedOn across all picks for a set of fields.
  // Each pick may carry per-field verifiedOn (e.g. priceInputVerifiedOn) or a
  // single picksVerifiedOn fallback.
  function oldestVerifiedAcross(sel, fields) {
    let oldest = null;
    for (const layer of LAYERS) {
      for (const p of (sel[layer.id] || [])) {
        const candidates = fields.map(f => p[f + 'VerifiedOn']).concat([p.verifiedOn]);
        for (const c of candidates) {
          if (!c) continue;
          if (!oldest || c < oldest) oldest = c;
        }
      }
    }
    return oldest;
  }

  return { init, render };
})();
