// Export and share for the planned list.
// - "Share" copies a permalink whose hash encodes selected option IDs per layer.
// - "Export" produces Markdown, CSV, JSON, or plain text mirroring the table.
// Import path: main.js calls applyHashImport() before the first render, then init() after.

App.features.export = (() => {
  const HASH_KEY = 's';

  function init() {
    const { exportToolbar, shareBtn, exportBtn, exportMenu } = App.refs;
    if (!exportToolbar) return;

    shareBtn.addEventListener('click', onShare);

    exportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    exportMenu.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const fmt = target.dataset.format;
      if (!fmt) return;
      closeMenu();
      runExport(fmt);
    });

    document.addEventListener('click', (e) => {
      if (!exportMenu.hidden && !exportToolbar.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !exportMenu.hidden) closeMenu();
    });
  }

  function refresh() {
    const { exportToolbar } = App.refs;
    if (!exportToolbar) return;
    exportToolbar.hidden = false;
  }

  // ---- Share link ----------------------------------------------------------

  function buildShareUrl() {
    const parts = [];
    for (const layer of LAYERS) {
      const picks = App.state.selections[layer.id] || [];
      if (picks.length === 0) continue;
      const ids = picks.map(p => encodeURIComponent(p.id)).join(',');
      parts.push(`${encodeURIComponent(layer.id)}:${ids}`);
    }
    if (parts.length === 0) return null;
    // Always use index.html as the base so shared links point to the plan page
    // regardless of which page the user was on when they created the share link.
    const origin = location.origin + location.pathname.split('/').slice(0, -1).join('/') + '/';
    const base = origin + 'index.html';
    return `${base}#${HASH_KEY}=${parts.join(';')}`;
  }

  async function onShare() {
    const url = buildShareUrl();
    if (!url) return;
    const ok = await copyText(url);
    showToast(ok ? 'Link copied to clipboard' : 'Could not copy — link shown in URL bar');
    if (!ok) {
      // Fallback: put it in the address bar so the user can copy manually.
      history.replaceState(null, '', url.split(location.origin)[1] || url);
    }
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }

  // Called from main.js before the first render. Returns true if the hash
  // contained an importable selection (caller may want to skip the stored copy).
  function applyHashImport() {
    const hash = location.hash || '';
    const m = hash.match(new RegExp(`[#&]${HASH_KEY}=([^&]+)`));
    if (!m) return false;

    const incoming = {};
    let dropped = 0;
    for (const group of m[1].split(';')) {
      const [rawLayer, rawIds] = group.split(':');
      if (!rawLayer || !rawIds) continue;
      const layerId = decodeURIComponent(rawLayer);
      const layer = LAYERS.find(l => l.id === layerId);
      if (!layer) { dropped++; continue; }
      const picks = [];
      for (const rawId of rawIds.split(',')) {
        const id = decodeURIComponent(rawId);
        const opt = (layer.options || []).find(o => o.id === id);
        if (opt) picks.push(opt);
        else dropped++;
      }
      if (picks.length) incoming[layerId] = picks;
    }

    if (Object.keys(incoming).length === 0) return false;
    App.state.selections = incoming;
    if (window.SelectionsStore) window.SelectionsStore.save(incoming);

    // Clean the URL so a reload doesn't re-import (and replace the saved state).
    history.replaceState(null, '', location.pathname + location.search);

    if (dropped > 0) pendingImportNotice = `${dropped} item${dropped === 1 ? '' : 's'} from the shared link are no longer available.`;
    return true;
  }

  let pendingImportNotice = null;
  function consumeImportNotice() {
    const n = pendingImportNotice;
    pendingImportNotice = null;
    return n;
  }

  // ---- Export formats ------------------------------------------------------

  const COLUMNS = [
    { key: 'layer',     label: 'Layer' },
    { key: 'selection', label: 'Selection' },
    { key: 'cost',      label: 'Cost' },
    { key: 'source',    label: 'Source' },
    { key: 'complexity', label: 'Setup Complexity' },
    { key: 'provider',  label: 'Provider' },
    { key: 'keyspecs',  label: 'Key Specs' },
  ];

  function rowsForExport() {
    // Reuse the table's resolvers so what you export matches what you see.
    const resolve = App.features.table.resolveCell;
    const out = [];
    for (const layer of LAYERS) {
      const picks = App.state.selections[layer.id] || [];
      if (picks.length === 0) continue;
      const selection = picks.map(p => p.name).join(', ');
      const first = picks[0];
      const cells = {
        layer:      layer.name,
        selection:  selection,
        cost:       resolve('cost', layer.id, first) || '',
        source:     resolve('source', layer.id, first) || '',
        complexity: resolve('complexity', layer.id, first) || '',
        provider:   resolve('provider', layer.id, first) || '',
        keyspecs:   resolve('keyspecs', layer.id, first) || '',
      };
      out.push(cells);
    }
    return out;
  }

  function toMarkdown() {
    const rows = rowsForExport();
    if (rows.length === 0) return '';
    const head = `| ${COLUMNS.map(c => c.label).join(' | ')} |`;
    const sep  = `| ${COLUMNS.map(() => '---').join(' | ')} |`;
    const body = rows.map(r =>
      `| ${COLUMNS.map(c => mdEscape(r[c.key])).join(' | ')} |`
    ).join('\n');
    return `${head}\n${sep}\n${body}\n`;
  }

  function mdEscape(s) {
    return String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  }

  function toCsv() {
    const rows = rowsForExport();
    const lines = [COLUMNS.map(c => csvField(c.label)).join(',')];
    for (const r of rows) {
      lines.push(COLUMNS.map(c => csvField(r[c.key])).join(','));
    }
    return lines.join('\r\n') + '\r\n';
  }

  function csvField(v) {
    const s = String(v ?? '');
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function toJson() {
    const out = { layers: [] };
    for (const layer of LAYERS) {
      const picks = App.state.selections[layer.id] || [];
      if (picks.length === 0) continue;
      out.layers.push({
        id: layer.id,
        name: layer.name,
        picks: picks.map(p => ({ ...p })),
      });
    }
    return JSON.stringify(out, null, 2);
  }

  function toPlainText() {
    const lines = [];
    for (const layer of LAYERS) {
      const picks = App.state.selections[layer.id] || [];
      if (picks.length === 0) continue;
      lines.push(`${layer.name}: ${picks.map(p => p.name).join(', ')}`);
    }
    return lines.join('\n') + '\n';
  }

  function runExport(format) {
    let content = '';
    let filename = '';
    let mime = 'text/plain';
    switch (format) {
      case 'markdown':
        content = toMarkdown();
        filename = 'flowpicker-stack.md';
        mime = 'text/markdown';
        break;
      case 'csv':
        content = toCsv();
        filename = 'flowpicker-stack.csv';
        mime = 'text/csv';
        break;
      case 'json':
        content = toJson();
        filename = 'flowpicker-stack.json';
        mime = 'application/json';
        break;
      case 'text':
        content = toPlainText();
        filename = 'flowpicker-stack.txt';
        mime = 'text/plain';
        break;
      case 'copy-markdown':
        copyText(toMarkdown()).then(ok =>
          showToast(ok ? 'Markdown copied to clipboard' : 'Could not copy'));
        return;
      default:
        return;
    }
    if (!content.trim()) {
      showToast('Nothing to export yet');
      return;
    }
    downloadFile(filename, content, mime);
    showToast(`Downloaded ${filename}`);
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---- Menu + toast --------------------------------------------------------

  function toggleMenu() {
    const { exportMenu, exportBtn } = App.refs;
    const open = exportMenu.hidden;
    exportMenu.hidden = !open;
    exportBtn.setAttribute('aria-expanded', String(open));
  }

  function closeMenu() {
    const { exportMenu, exportBtn } = App.refs;
    exportMenu.hidden = true;
    exportBtn.setAttribute('aria-expanded', 'false');
  }

  let toastTimer = null;
  function showToast(msg) {
    const { exportToast } = App.refs;
    if (!exportToast) return;
    exportToast.textContent = msg;
    exportToast.hidden = false;
    exportToast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      exportToast.classList.remove('is-visible');
      setTimeout(() => { exportToast.hidden = true; }, 200);
    }, 1800);
  }

  return {
    init,
    refresh,
    applyHashImport,
    consumeImportNotice,
    buildShareUrl,
  };
})();
