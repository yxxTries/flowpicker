App.features.warnings = (() => {
  function init() {}

  function combinations(selections) {
    const layerIds = Object.keys(selections).filter(id => (selections[id] || []).length > 0);
    if (layerIds.length === 0) return [{}];
    let out = [{}];
    for (const id of layerIds) {
      const next = [];
      for (const combo of out) {
        for (const option of selections[id]) {
          next.push({ ...combo, [id]: option });
        }
      }
      out = next;
    }
    return out;
  }

  function evaluateRules(selections) {
    const seen = new Set();
    const issues = [];
    for (const state of combinations(selections)) {
      for (const rule of COMPATIBILITY_RULES) {
        try {
          if (!rule.when(state)) continue;
          const text = rule.message(state);
          if (seen.has(text)) continue;
          seen.add(text);
          issues.push(text);
        } catch (_) { /* incomplete combination — rule doesn't apply */ }
      }
    }
    return issues;
  }

  function wouldConflict(layerId, option) {
    const baseline = evaluateRules(App.state.selections).length;
    const current = App.state.selections[layerId] || [];
    const exists = current.some(o => o.id === option.id);
    const trialPicks = exists ? current : [...current, option];
    const trial = { ...App.state.selections, [layerId]: trialPicks };
    return evaluateRules(trial).length > baseline;
  }

  function render() {
    const { warningBanner, warningHeadline, warningList } = App.refs;
    const issues = evaluateRules(App.state.selections);

    if (issues.length === 0) {
      warningBanner.hidden = true;
      warningBanner.open = false;
      return;
    }

    warningBanner.hidden = false;
    warningHeadline.textContent =
      issues.length === 1
        ? '1 compatibility issue'
        : `${issues.length} compatibility issues`;

    warningList.innerHTML = '';
    for (const text of issues) {
      const li = document.createElement('li');
      li.textContent = text;
      warningList.appendChild(li);
    }
  }

  return { init, render, evaluateRules, wouldConflict };
})();
