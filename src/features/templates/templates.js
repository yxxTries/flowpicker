(() => {
  function sortTemplates(templates, mode) {
    const sorted = [...templates];
    switch (mode) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
      case 'oldest':
        sorted.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        break;
    }
    return sorted;
  }

  function loadTemplate(template) {
    if (window.SelectionsStore && template.selections) {
      window.SelectionsStore.save(template.selections);
      window.location.href = 'index.html';
    }
  }

  function renderTemplates(templates) {
    const container = document.getElementById('templates-container');
    if (!container) return;

    const sorted = sortTemplates(templates, 'name');

    container.innerHTML = `
      <div class="templates-grid">
        ${sorted.map(t => `
          <div class="template-card" data-id="${t.id}">
            <div class="template-card-header">
              <h3 class="template-name">${escapeHtml(t.name)}</h3>
              <div class="template-author">by ${escapeHtml(t.author)}</div>
              ${t.cost ? `<div class="template-cost">${escapeHtml(t.cost)}</div>` : ''}
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
