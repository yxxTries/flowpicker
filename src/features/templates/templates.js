(() => {
  const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : '';
  const SORT_KEY = 'flowpicker-template-sort';
  const USE_DB = !!API_URL; // Use DB API if backend is available

  function readUserTemplates() {
    try { return JSON.parse(localStorage.getItem('flowpicker-user-templates')) || []; } catch { return []; }
  }

  function writeUserTemplates(templates) {
    localStorage.setItem('flowpicker-user-templates', JSON.stringify(templates));
  }

  async function upvote(templateId, email) {
    if (!USE_DB || !email) {
      console.warn('Database voting requires email and backend');
      return;
    }
    try {
      const resp = await fetch(`${API_URL}/api/templates/${templateId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (e) {
      console.error('Failed to upvote:', e);
    }
  }

  async function downvote(templateId, email) {
    if (!USE_DB || !email) {
      console.warn('Database voting requires email and backend');
      return;
    }
    try {
      const resp = await fetch(`${API_URL}/api/templates/${templateId}/downvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (e) {
      console.error('Failed to downvote:', e);
    }
  }

  async function addUserTemplate(name, description, selections, author = 'Anonymous', email) {
    if (USE_DB && email) {
      try {
        const resp = await fetch(`${API_URL}/api/templates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description, selections, author, email })
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return await resp.json();
      } catch (e) {
        console.error('Failed to create template:', e);
        return null;
      }
    } else {
      // Fallback to localStorage
      const userTemplates = readUserTemplates();
      const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const template = {
        id,
        name,
        description,
        author,
        selections,
        upvotes: 0,
        downvotes: 0,
        createdAt: Date.now(),
        isUserTemplate: true,
      };
      userTemplates.unshift(template);
      writeUserTemplates(userTemplates);
      return template;
    }
  }

  async function deleteUserTemplate(templateId, email) {
    if (USE_DB && email) {
      try {
        const resp = await fetch(`${API_URL}/api/templates/${templateId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return true;
      } catch (e) {
        console.error('Failed to delete template:', e);
        return false;
      }
    } else {
      // Fallback to localStorage
      const userTemplates = readUserTemplates();
      const filtered = userTemplates.filter(t => t.id !== templateId);
      writeUserTemplates(filtered);
      return true;
    }
  }

  async function fetchAllTemplates() {
    if (USE_DB) {
      try {
        const resp = await fetch(`${API_URL}/api/templates`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return await resp.json();
      } catch (e) {
        console.warn('Failed to fetch from database, using local templates:', e);
        // Fall back to local templates
        return window.TEMPLATES || [];
      }
    } else {
      return [...(window.TEMPLATES || []), ...readUserTemplates()];
    }
  }

  function loadTemplate(template) {
    if (window.SelectionsStore && template.selections) {
      window.SelectionsStore.save(template.selections);
      window.location.href = 'index.html';
    }
  }

  function getSortMode() {
    return localStorage.getItem(SORT_KEY) || 'upvotes-high';
  }

  function setSortMode(mode) {
    localStorage.setItem(SORT_KEY, mode);
  }

  function sortTemplates(templates, mode) {
    const sorted = [...templates];
    switch (mode) {
      case 'upvotes-high':
        sorted.sort((a, b) => {
          const aTotal = a.upvotes || 0;
          const bTotal = b.upvotes || 0;
          return bTotal - aTotal;
        });
        break;
      case 'upvotes-low':
        sorted.sort((a, b) => {
          const aTotal = a.upvotes || 0;
          const bTotal = b.upvotes || 0;
          return aTotal - bTotal;
        });
        break;
      case 'newest':
        sorted.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
        break;
      case 'oldest':
        sorted.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
        break;
    }
    return sorted;
  }

  async function renderTemplates(allTemplates, userEmail) {
    const container = document.getElementById('templates-container');
    if (!container) return;

    const sortMode = getSortMode();
    const sorted = sortTemplates(allTemplates, sortMode);

    container.innerHTML = `
      <div class="templates-controls">
        <button type="button" id="new-template-btn" class="new-template-btn" aria-label="Create new template">
          + New Template
        </button>
        <div class="sort-controls">
          <label for="sort-select">Sort:</label>
          <select id="sort-select" class="sort-select">
            <option value="upvotes-high">Highest upvotes</option>
            <option value="upvotes-low">Lowest upvotes</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>
      <div class="templates-grid">
        ${sorted.map(t => {
          const upvoteCount = t.upvotes || 0;
          const downvoteCount = t.downvotes || 0;
          const isUserTemplate = t.is_user_template || t.isUserTemplate;
          return `
            <div class="template-card" data-id="${t.id}">
              <div class="template-card-header">
                <h3 class="template-name">${escapeHtml(t.name)}</h3>
                <div class="template-author">by ${escapeHtml(t.author)}</div>
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
              <div class="template-actions">
                <button type="button" class="template-use-btn" data-action="use" aria-label="Use this template">
                  Use Template
                </button>
                <div class="template-votes">
                  <button type="button" class="vote-btn vote-up" data-action="upvote" aria-label="Upvote">
                    <span class="vote-icon">👍</span>
                    <span class="vote-count">${upvoteCount}</span>
                  </button>
                  <button type="button" class="vote-btn vote-down" data-action="downvote" aria-label="Downvote">
                    <span class="vote-icon">👎</span>
                    <span class="vote-count">${downvoteCount}</span>
                  </button>
                  ${isUserTemplate ? `
                    <button type="button" class="vote-btn vote-delete" data-action="delete" aria-label="Delete template" title="Delete this template">
                      🗑️
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.value = sortMode;
      sortSelect.addEventListener('change', (e) => {
        setSortMode(e.target.value);
        renderTemplates(allTemplates, userEmail);
      });
    }

    const newTemplateBtn = document.getElementById('new-template-btn');
    if (newTemplateBtn) {
      newTemplateBtn.addEventListener('click', () => {
        openNewTemplateModal(allTemplates, userEmail);
      });
    }

    container.querySelectorAll('[data-id]').forEach(card => {
      const templateId = card.dataset.id;
      const template = allTemplates.find(t => t.id === templateId);
      if (!template) return;

      card.querySelector('[data-action="use"]').addEventListener('click', () => {
        loadTemplate(template);
      });

      card.querySelector('[data-action="upvote"]').addEventListener('click', async () => {
        await upvote(templateId, userEmail);
        const updated = await fetchAllTemplates();
        await renderTemplates(updated, userEmail);
      });

      card.querySelector('[data-action="downvote"]').addEventListener('click', async () => {
        await downvote(templateId, userEmail);
        const updated = await fetchAllTemplates();
        await renderTemplates(updated, userEmail);
      });

      const deleteBtn = card.querySelector('[data-action="delete"]');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
          if (confirm('Delete this template?')) {
            await deleteUserTemplate(templateId, userEmail);
            const updated = await fetchAllTemplates();
            await renderTemplates(updated, userEmail);
          }
        });
      }
    });
  }

  async function openNewTemplateModal(allTemplates, userEmail) {
    const modal = document.createElement('div');
    modal.className = 'new-template-modal';
    modal.innerHTML = `
      <div class="modal-backdrop" data-close="true"></div>
      <div class="modal-panel">
        <header class="modal-header">
          <h2>Create New Template</h2>
          <button type="button" class="modal-close" data-close="true" aria-label="Close">×</button>
        </header>
        <div class="modal-body">
          <form id="new-template-form">
            <div class="form-group">
              <label for="template-name">Template Name</label>
              <input type="text" id="template-name" required placeholder="e.g., My Custom Stack">
            </div>
            <div class="form-group">
              <label for="template-description">Description</label>
              <textarea id="template-description" required placeholder="Brief description of this stack" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label for="template-author">Your Name</label>
              <input type="text" id="template-author" placeholder="Anonymous" value="Anonymous">
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="template-use-current" checked>
                Use my current selections
              </label>
              <p class="form-hint">If unchecked, you can start with an empty template</p>
            </div>
            <div class="modal-actions">
              <button type="button" class="modal-btn modal-cancel" data-close="true">Cancel</button>
              <button type="submit" class="modal-btn modal-primary">Create Template</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeButtons = modal.querySelectorAll('[data-close="true"]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => modal.remove());
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal.querySelector('.modal-backdrop')) {
        modal.remove();
      }
    });

    const form = modal.querySelector('#new-template-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('template-name').value.trim();
      const description = document.getElementById('template-description').value.trim();
      const author = document.getElementById('template-author').value.trim() || 'Anonymous';
      const useCurrent = document.getElementById('template-use-current').checked;

      if (!name || !description) {
        alert('Please fill in all required fields');
        return;
      }

      if (!userEmail) {
        alert('You must be logged in to create a template');
        return;
      }

      const selections = useCurrent && window.App && window.App.state && window.App.state.selections
        ? window.App.state.selections
        : { ide: [], llm: [], integration: [], context: [], agent: [] };

      const newTemplate = await addUserTemplate(name, description, selections, author, userEmail);
      modal.remove();

      if (newTemplate) {
        const updated = await fetchAllTemplates();
        await renderTemplates(updated, userEmail);
      } else {
        alert('Failed to create template');
      }
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  window.TemplatesFeature = {
    renderTemplates,
    upvote,
    downvote,
    loadTemplate,
    addUserTemplate,
    deleteUserTemplate,
    getSortMode,
    setSortMode,
    sortTemplates,
    readUserTemplates,
    fetchAllTemplates,
  };
})();
