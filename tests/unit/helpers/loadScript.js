// Feature scripts in this project are vanilla <script> files that attach to
// window globals inside IIFEs. To unit-test them in jsdom we read the source
// from disk and evaluate it as a script in the current global. This mimics
// what happens when index.html loads them via <script src=...>.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..', '..', '..');

export function loadScript(relativePath) {
  const src = readFileSync(resolve(ROOT, relativePath), 'utf8');
  // eslint-disable-next-line no-new-func
  new Function(src).call(globalThis);
}

// Bootstrap a fresh App namespace identical to what main.js sets up.
export function bootApp() {
  globalThis.App = {
    state: { selections: {}, activeLayerId: null },
    refs: {},
    features: {},
  };
  globalThis.LAYERS = [];
  return globalThis.App;
}

// A minimal LAYERS fixture used across tests so we don't need sql.js.
export function fixtureLayers() {
  return [
    {
      id: 'ide',
      name: 'IDE / Editor',
      optional: false,
      chipKeys: ['os', 'pricing'],
      options: [
        {
          id: 'cursor', name: 'Cursor',
          os: 'macOS, Windows, Linux',
          pricing: 'Freemium',
          aiIntegration: 'AI-native',
          interface: 'GUI',
          openSource: 'No',
          setup: 'Low',
          websiteUrl: 'https://cursor.com',
        },
        {
          id: 'vscode', name: 'VS Code',
          os: 'macOS, Windows, Linux',
          pricing: 'Free',
          aiIntegration: 'AI via extension',
          interface: 'GUI',
          openSource: 'Yes',
          setup: 'Low',
          websiteUrl: 'https://code.visualstudio.com',
        },
        {
          id: 'jetbrains', name: 'JetBrains',
          os: 'macOS, Windows, Linux',
          pricing: 'Paid',
          openSource: 'No',
          setup: 'Medium',
          websiteUrl: 'https://www.jetbrains.com',
        },
      ],
    },
    {
      id: 'llm',
      name: 'LLM Provider / Model',
      optional: false,
      chipKeys: ['provider'],
      options: [
        {
          id: 'claude-sonnet', name: 'Claude Sonnet',
          provider: 'Anthropic', hosting: 'Cloud',
          priceInput: '$3', priceOutput: '$15',
          contextWindow: '200K', speedTier: 'Standard',
          websiteUrl: 'https://anthropic.com',
        },
        {
          id: 'gpt4o', name: 'GPT-4o',
          provider: 'OpenAI', hosting: 'Cloud',
          priceInput: '$2.5', priceOutput: '$10',
          contextWindow: '128K', speedTier: 'Fast',
          websiteUrl: 'https://openai.com',
        },
      ],
    },
    {
      id: 'integration',
      name: 'Integration',
      optional: true,
      chipKeys: [],
      options: [
        { id: 'cursor-built', name: 'Cursor built-in', pricing: 'Freemium', openSource: 'No', setup: 'Zero' },
        { id: 'continue',     name: 'Continue.dev',   pricing: 'Free',     openSource: 'Yes', setup: 'Low' },
        { id: 'copilot',      name: 'GitHub Copilot', pricing: 'Paid subscription', openSource: 'No', setup: 'Low' },
        { id: 'aider',        name: 'Aider',          pricing: 'Free',     openSource: 'Yes', setup: 'Medium' },
      ],
    },
    {
      id: 'context',
      name: 'Context / RAG',
      optional: true,
      chipKeys: [],
      options: [
        { id: 'cursor-cb', name: '@codebase (Cursor)', openSource: 'No', setup: 'Zero' },
        { id: 'continue-idx', name: 'Continue index',  openSource: 'Yes', setup: 'Low' },
      ],
    },
    {
      id: 'agent',
      name: 'Agent / Orchestration',
      optional: true,
      chipKeys: [],
      options: [
        { id: 'aider-arch', name: 'Aider architect', openSource: 'Yes', setup: 'Medium', cost: 'Free' },
      ],
    },
  ];
}
