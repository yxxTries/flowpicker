(() => {
  const VOTES_KEY = 'flowpicker-template-votes';
  const TEMPLATES_KEY = 'flowpicker-user-templates';
  const SORT_KEY = 'flowpicker-template-sort';

  function readVotes() {
    try { return JSON.parse(localStorage.getItem(VOTES_KEY)) || {}; } catch { return {}; }
  }

  function writeVotes(votes) {
    localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
  }

  function readUserTemplates() {
    try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY)) || []; } catch { return []; }
  }

  function writeUserTemplates(templates) {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  }

  function getVotes(templateId) {
    const votes = readVotes();
    return votes[templateId] || { upvotes: 0, downvotes: 0 };
  }

  function setVotes(templateId, upvotes, downvotes) {
    const votes = readVotes();
    votes[templateId] = { upvotes, downvotes };
    writeVotes(votes);
  }

  function upvote(templateId) {
    const v = getVotes(templateId);
    setVotes(templateId, v.upvotes + 1, v.downvotes);
  }

  function downvote(templateId) {
    const v = getVotes(templateId);
    setVotes(templateId, v.upvotes, v.downvotes + 1);
  }

  function loadTemplate(template) {
    if (window.SelectionsStore && template.selections) {
      window.SelectionsStore.save(template.selections);
      window.location.href = 'index.html';
    }
  }

  function addUserTemplate(name, description, selections, author = 'Anonymous') {
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

  function deleteUserTemplate(templateId) {
    const userTemplates = readUserTemplates();
    const filtered = userTemplates.filter(t => t.id !== templateId);
    writeUserTemplates(filtered);
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
          const aVotes = getVotes(a.id);
          const bVotes = getVotes(b.id);
          const aTotal = (a.upvotes || 0) + aVotes.upvotes;
          const bTotal = (b.upvotes || 0) + bVotes.upvotes;
          return bTotal - aTotal;
        });
        break;
      case 'upvotes-low':
        sorted.sort((a, b) => {
          const aVotes = getVotes(a.id);
          const bVotes = getVotes(b.id);
          const aTotal = (a.upvotes || 0) + aVotes.upvotes;
          const bTotal = (b.upvotes || 0) + bVotes.upvotes;
          return aTotal - bTotal;
        });
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

  function renderTemplates(allTemplates, onSortChange) {
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
          const votes = getVotes(t.id);
          const upvoteCount = (t.upvotes || 0) + (votes.upvotes || 0);
          const downvoteCount = (t.downvotes || 0) + (votes.downvotes || 0);
          const isUserTemplate = t.isUserTemplate;
          return `
            <div class="template-card" data-id="${t.id}">
              <div class="template-card-header">
                <h3 class="template-name">${escapeHtml(t.name)}</h3>
                <div class="template-author">by ${escapeHtml(t.author)}</div>
              </div>
              <p class="template-description">${escapeHtml(t.description)}</p>
              <div class="template-stack">
                ${Object.entries(t.selections || {})
                  .filter(([_, items]) => items.length > 0)
                  .map(([layer, items]) => `
                    <div class="template-layer">
                      <span class="layer-label">${escapeHtml(layer)}:</span>
                      <span class="layer-items">${items.map(i => escapeHtml(i.name)).join(', ')}</span>
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
        renderTemplates(allTemplates, onSortChange);
      });
    }

    const newTemplateBtn = document.getElementById('new-template-btn');
    if (newTemplateBtn) {
      newTemplateBtn.addEventListener('click', () => {
        openNewTemplateModal(allTemplates, onSortChange);
      });
    }

    container.querySelectorAll('[data-id]').forEach(card => {
      const templateId = card.dataset.id;
      const template = allTemplates.find(t => t.id === templateId);
      if (!template) return;

      card.querySelector('[data-action="use"]').addEventListener('click', () => {
        loadTemplate(template);
      });

      card.querySelector('[data-action="upvote"]').addEventListener('click', () => {
        upvote(templateId);
        renderTemplates(allTemplates, onSortChange);
      });

      card.querySelector('[data-action="downvote"]').addEventListener('click', () => {
        downvote(templateId);
        renderTemplates(allTemplates, onSortChange);
      });

      const deleteBtn = card.querySelector('[data-action="delete"]');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          if (confirm('Delete this template?')) {
            deleteUserTemplate(templateId);
            const updated = [...window.TEMPLATES, ...readUserTemplates()];
            renderTemplates(updated, onSortChange);
          }
        });
      }
    });
  }

  function openNewTemplateModal(allTemplates, onSortChange) {
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
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('template-name').value.trim();
      const description = document.getElementById('template-description').value.trim();
      const author = document.getElementById('template-author').value.trim() || 'Anonymous';
      const useCurrent = document.getElementById('template-use-current').checked;

      if (!name || !description) {
        alert('Please fill in all required fields');
        return;
      }

      const selections = useCurrent && window.App && window.App.state && window.App.state.selections
        ? window.App.state.selections
        : { ide: [], llm: [], integration: [], context: [], agent: [] };

      const newTemplate = addUserTemplate(name, description, selections, author);
      modal.remove();

      const updated = [...(window.TEMPLATES || []), ...readUserTemplates()];
      renderTemplates(updated, onSortChange);
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
  };
})();
