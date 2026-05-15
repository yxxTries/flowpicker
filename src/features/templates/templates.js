(() => {
  function extractMonthlyPrice(costString) {
    if (!costString) return 0;
    const match = costString.match(/\$(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  function getPriceTier(templates, template) {
    const prices = templates.map(t => extractMonthlyPrice(t.cost)).filter(p => p > 0).sort((a, b) => a - b);
    if (prices.length === 0) return 'Free';

    const templatePrice = extractMonthlyPrice(template.cost);
    if (templatePrice === 0) return 'Free';

    const q33 = prices[Math.floor(prices.length / 3)];
    const q66 = prices[Math.floor(prices.length * 2 / 3)];

    if (templatePrice <= q33) return 'Budget';
    if (templatePrice <= q66) return 'Mid-Range';
    return 'Premium';
  }

  function sortTemplates(templates, mode) {
    const sorted = [...templates];
    switch (mode) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-asc':
        sorted.sort((a, b) => extractMonthlyPrice(a.cost) - extractMonthlyPrice(b.cost));
        break;
      case 'price-desc':
        sorted.sort((a, b) => extractMonthlyPrice(b.cost) - extractMonthlyPrice(a.cost));
        break;
      case 'newest':
        sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
      case 'oldest':
        sorted.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        break;
      case 'popularity':
        sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
    }
    return sorted;
  }

  function loadTemplate(template) {
    if (!window.SelectionsStore) {
      console.error('[Templates] SelectionsStore not available');
      return;
    }
    if (!template || !template.selections) {
      console.error('[Templates] Template or selections missing');
      return;
    }

    console.log('[Templates] Loading template:', template.id);
    console.log('[Templates] Selections to save:', template.selections);

    // Save template selections to localStorage
    // They will be enriched with full product details on the Plan page
    window.SelectionsStore.save(template.selections);
    const saved = localStorage.getItem('flowpicker-selections');
    console.log('[Templates] Saved to localStorage, length:', saved?.length);

    console.log('[Templates] Navigating to index.html');
    window.location.href = 'index.html';
  }

  let currentSort = 'popularity';

  function renderTemplates(templates) {
    const container = document.getElementById('templates-container');
    if (!container) return;

    const select = document.getElementById('templates-sort-select');
    if (select && !select.dataset.bound) {
      select.value = currentSort;
      select.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderTemplates(templates);
      });
      select.dataset.bound = 'true';
    }

    const sorted = sortTemplates(templates, currentSort);

    container.innerHTML = `
      <div class="templates-grid">
        ${sorted.map(t => `
          <div class="template-card" data-id="${t.id}">
            <div class="template-card-header">
              <h3 class="template-name">${escapeHtml(t.name)}</h3>
              <div class="template-author">by ${escapeHtml(t.author)}</div>
              ${t.cost ? `<div class="template-cost">${escapeHtml(getPriceTier(templates, t))}</div>` : ''}
            </div>
            <p class="template-description">${escapeHtml(t.description)}</p>
            <div class="template-stack">
              ${Object.entries(t.selections || {})
                .filter(([_, items]) => items && items.length > 0)
                .map(([layer, items]) => `
                  <div class="template-layer">
                    <span class="layer-label">${escapeHtml(layer)}:</span>
                    <span class="layer-items">${items.map(i => escapeHtml(i.name || i.id)).join(', ')}</span>
                  </div>
                `).join('')}
            </div>
            <button type="button" class="template-use-btn" data-action="use" aria-label="Use this template">
              Use Template
            </button>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('[data-id]').forEach(card => {
      const templateId = card.dataset.id;
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      card.querySelector('[data-action="use"]').addEventListener('click', () => {
        loadTemplate(template);
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  window.TemplatesFeature = {
    renderTemplates,
    loadTemplate,
    sortTemplates,
  };
})();
