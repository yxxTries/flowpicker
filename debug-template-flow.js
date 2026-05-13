/**
 * Test script to simulate the entire template-to-plan flow
 * Run with: node debug-template-flow.js
 */

// Simulate localStorage
class MockLocalStorage {
  constructor() {
    this.data = {};
  }
  getItem(key) {
    return this.data[key] || null;
  }
  setItem(key, value) {
    this.data[key] = String(value);
  }
  removeItem(key) {
    delete this.data[key];
  }
  clear() {
    this.data = {};
  }
}

const localStorage = new MockLocalStorage();

// Simulate SelectionsStore
const SelectionsStore = (() => {
  const KEY = 'flowpicker-selections';

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch {
      return {};
    }
  }

  function save(selections) {
    try {
      localStorage.setItem(KEY, JSON.stringify(selections || {}));
    } catch {}
  }

  return { load, save, KEY };
})();

// Test template from data/templates.js
const testTemplate = {
  id: 'cursor-power-user',
  name: 'Cursor Power User',
  description: 'IDE-integrated AI with real-time codebase context. Best for daily productivity.',
  author: 'Dev',
  cost: '$20/month (Cursor Pro)',
  upvotes: 0,
  downvotes: 0,
  selections: {
    ide: [{ id: 'cursor', name: 'Cursor' }],
    llm: [{ id: 'claude-sonnet', name: 'Claude Sonnet 4.6' }],
    integration: [{ id: 'cursor-built', name: 'Cursor built-in' }],
    context: [{ id: 'cursor-cb', name: '@codebase (Cursor)' }],
    agent: [{ id: 'cursor-agent', name: 'Cursor Agent Mode' }],
  },
};

console.log('===== TEMPLATE FLOW TEST =====\n');

console.log('1. Initial state');
console.log('   localStorage keys:', Object.keys(localStorage.data));

console.log('\n2. Template selections structure');
console.log('   Template ID:', testTemplate.id);
console.log('   Selections keys:', Object.keys(testTemplate.selections));
for (const [layer, items] of Object.entries(testTemplate.selections)) {
  console.log(`   - ${layer}: [${items.map(i => i.name).join(', ')}]`);
}

console.log('\n3. Simulating loadTemplate() - saving to localStorage');
SelectionsStore.save(testTemplate.selections);
const saved = localStorage.getItem(SelectionsStore.KEY);
console.log('   Saved to localStorage:', saved ? 'YES (' + saved.length + ' bytes)' : 'NO');

console.log('\n4. Simulating page load - loading from localStorage');
const loaded = SelectionsStore.load();
console.log('   Loaded selections:', loaded);
console.log('   Loaded keys:', Object.keys(loaded));

console.log('\n5. Comparing loaded vs original');
for (const layer of ['ide', 'llm', 'integration', 'context', 'agent']) {
  const original = testTemplate.selections[layer];
  const current = loaded[layer];
  const match = JSON.stringify(original) === JSON.stringify(current);
  console.log(`   ${layer}: ${match ? '✓ MATCH' : '✗ MISMATCH'}`);
  if (!match) {
    console.log(`      Original: ${JSON.stringify(original)}`);
    console.log(`      Loaded:   ${JSON.stringify(current)}`);
  }
}

console.log('\n6. Simulating table render - checking if selections accessible');
// This simulates what table.js does
const LAYERS = [
  { id: 'ide', name: 'IDE / Editor', optional: false },
  { id: 'llm', name: 'LLM Provider / Model', optional: false },
  { id: 'integration', name: 'Integration', optional: false },
  { id: 'context', name: 'Context / RAG', optional: true },
  { id: 'agent', name: 'Agent / Orchestration', optional: true },
];

const App = {
  state: {
    selections: loaded
  }
};

let renderIssues = 0;
for (const layer of LAYERS) {
  const picks = App.state.selections[layer.id] || [];
  console.log(`   ${layer.name}:`);
  if (picks.length === 0) {
    console.log(`      → No selections (show "Choose ${layer.name}" button)`);
  } else {
    for (const pick of picks) {
      if (!pick.id || !pick.name) {
        console.log(`      ✗ ERROR: item missing id or name: ${JSON.stringify(pick)}`);
        renderIssues++;
      } else {
        console.log(`      → ${pick.name}`);
      }
    }
  }
}

console.log('\n===== SUMMARY =====');
if (renderIssues === 0 && JSON.stringify(loaded) === JSON.stringify(testTemplate.selections)) {
  console.log('✓ TEST PASSED: Template selections flow works correctly');
  process.exit(0);
} else {
  console.log('✗ TEST FAILED:');
  if (JSON.stringify(loaded) !== JSON.stringify(testTemplate.selections)) {
    console.log('  - Loaded selections do not match original');
  }
  if (renderIssues > 0) {
    console.log(`  - ${renderIssues} render issues found`);
  }
  process.exit(1);
}
