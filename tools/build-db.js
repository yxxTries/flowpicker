// One-shot script to generate data/flowpicker.db from the legacy LAYERS array.
// Run once: `node tools/build-db.js`. After that, edit flowpicker.db directly
// with DB Browser for SQLite or the sqlite3 CLI — this script is for the
// initial migration only.

const fs = require('fs');
const path = require('path');
const initSqlJs = require('../vendor/sql-wasm.js');

const LAYERS = [
  {
    id: 'ide',
    name: 'IDE / Editor',
    optional: false,
    chipKeys: ['notes'],
    options: [
      {
        id: 'vscode', name: 'VS Code',
        notes: 'Largest extension ecosystem', os: 'macOS, Windows, Linux', pricing: 'Free',
        aiIntegration: 'AI via extension', interface: 'GUI',
        bestFor: 'Extension-rich general development across all languages',
        capabilities: 'Vim mode, Multi-cursor, Remote dev, SSH, WSL, Extensions, Live Share',
        languages: 'All major, via LSP',
        extensibility: 'Extensions',
        collaboration: 'Live Share',
        released: '2015',
        websiteUrl: 'https://code.visualstudio.com/',
        docsUrl: 'https://code.visualstudio.com/docs',
      },
      {
        id: 'cursor', name: 'Cursor',
        notes: 'Best built-in inline AI', os: 'macOS, Windows, Linux', pricing: 'Freemium',
        aiIntegration: 'AI-native', interface: 'GUI',
        bestFor: 'AI-first development with inline editing and chat',
        capabilities: 'Vim mode, Multi-cursor, AI inline edits, Chat, Agent mode, Tabs, Auto-context',
        languages: 'All major, via LSP',
        extensibility: 'Extensions',
        collaboration: '—',
        released: '2024',
        websiteUrl: 'https://cursor.com/',
        docsUrl: 'https://docs.cursor.com/',
      },
      {
        id: 'zed', name: 'Zed',
        notes: 'Fastest, Rust-native', os: 'macOS, Linux', pricing: 'Free',
        aiIntegration: 'AI-native', interface: 'GUI',
        bestFor: 'Blazing-fast collaborative editing with built-in AI',
        capabilities: 'Vim mode, Multi-cursor, AI inline, CRDT collab, GPU rendering',
        languages: 'All major, via LSP',
        extensibility: 'Extensions',
        collaboration: 'CRDT',
        released: '2023',
        websiteUrl: 'https://zed.dev/',
        docsUrl: 'https://zed.dev/docs',
      },
      {
        id: 'neovim', name: 'Neovim',
        notes: 'Terminal-native, keyboard-first', os: 'macOS, Windows, Linux', pricing: 'Free',
        aiIntegration: 'AI via extension', interface: 'Terminal/TUI',
        bestFor: 'Terminal-native, keyboard-driven editing with deep extensibility',
        capabilities: 'Vim mode, Multi-cursor, Remote dev, Lua scripting, Treesitter, LSP',
        languages: 'All major, via LSP',
        extensibility: 'Extensions',
        collaboration: '—',
        released: '2015',
        websiteUrl: 'https://neovim.io/',
        docsUrl: 'https://neovim.io/doc/',
      },
      {
        id: 'jetbrains', name: 'JetBrains',
        notes: 'Deep language tooling', os: 'macOS, Windows, Linux', pricing: 'Freemium',
        aiIntegration: 'AI via extension', interface: 'GUI',
        bestFor: 'Deep language-aware tooling with refactoring and static analysis',
        capabilities: 'Vim mode, Multi-cursor, Remote dev, Deep refactoring, Profiling, DB tools, Extensions',
        languages: 'Java, Kotlin, Python, JS/TS, C#, Go, many more',
        extensibility: 'Extensions',
        collaboration: 'Code With Me',
        released: '2001',
        websiteUrl: 'https://www.jetbrains.com/',
        docsUrl: 'https://www.jetbrains.com/help/',
      },
    ],
  },
  {
    id: 'llm',
    name: 'LLM Provider / Model',
    optional: false,
    chipKeys: ['contextWindow'],
    options: [
      {
        id: 'claude-sonnet', name: 'Claude Sonnet 4.6',
        provider: 'Anthropic', hosting: 'Closed/API',
        modelId: 'claude-sonnet-4-6',
        priceTier: 'Mid', priceInput: '$3', priceOutput: '$15', priceCache: '$0.30',
        contextWindow: '200K', contextTier: '128K-500K', maxOutput: '64K',
        modality: 'Multimodal (vision)',
        capabilities: 'Vision, Tool use, Streaming, Structured output, Prompt caching',
        speedTier: 'Standard', latency: 'medium',
        benchmark: 'SWE-bench: high',
        sweBench: '64%', humanEval: '92%', mmlu: '86%',
        bestFor: 'Day-to-day coding, fast agentic loops, balanced cost/quality',
        knowledgeCutoff: 'Apr 2024', released: 'Sep 2025',
        websiteUrl: 'https://www.anthropic.com/claude/sonnet',
        docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models',
      },
      {
        id: 'claude-opus', name: 'Claude Opus 4.7',
        provider: 'Anthropic', hosting: 'Closed/API',
        modelId: 'claude-opus-4-7',
        priceTier: 'Premium', priceInput: '$15', priceOutput: '$75', priceCache: '$1.50',
        contextWindow: '200K', contextTier: '128K-500K', maxOutput: '32K',
        modality: 'Multimodal (vision)',
        capabilities: 'Vision, Tool use, Extended thinking, Streaming, Structured output, Prompt caching',
        speedTier: 'Slow/Reasoning', latency: 'medium',
        benchmark: 'SWE-bench: top',
        sweBench: '72%', humanEval: '94%', mmlu: '88%',
        bestFor: 'Complex refactors, agentic coding, hard debugging, deep reasoning',
        knowledgeCutoff: 'Jan 2026', released: 'Nov 2025',
        websiteUrl: 'https://www.anthropic.com/claude/opus',
        docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models',
      },
      {
        id: 'gpt4o', name: 'GPT-4o',
        provider: 'OpenAI', hosting: 'Closed/API',
        modelId: 'gpt-4o',
        priceTier: 'Mid', priceInput: '$2.50', priceOutput: '$10', priceCache: '$1.25',
        contextWindow: '128K', contextTier: '32K-128K', maxOutput: '16K',
        modality: 'Multimodal (vision + audio)',
        capabilities: 'Vision, Audio, Tool use, Streaming, Structured output',
        speedTier: 'Fast', latency: 'fast',
        benchmark: 'HumanEval: high',
        sweBench: '38%', humanEval: '90%', mmlu: '88%',
        bestFor: 'Multimodal tasks, fast chat, broad general use',
        knowledgeCutoff: 'Oct 2023', released: 'May 2024',
        websiteUrl: 'https://openai.com/index/hello-gpt-4o/',
        docsUrl: 'https://platform.openai.com/docs/models',
      },
      {
        id: 'gemini', name: 'Gemini 2.x',
        provider: 'Google', hosting: 'Closed/API',
        modelId: 'gemini-2.0-pro',
        priceTier: 'Mid', priceInput: '$1.25', priceOutput: '$5', priceCache: '$0.31',
        contextWindow: '1M+', contextTier: '500K+', maxOutput: '8K',
        modality: 'Multimodal (vision + audio)',
        capabilities: 'Vision, Audio, Tool use, Streaming, Structured output, Long context',
        speedTier: 'Fast', latency: 'fast',
        benchmark: 'mid-high',
        sweBench: '52%', humanEval: '86%', mmlu: '85%',
        bestFor: 'Huge documents, video/audio understanding, long-context retrieval',
        knowledgeCutoff: 'Aug 2024', released: 'Dec 2024',
        websiteUrl: 'https://deepmind.google/technologies/gemini/',
        docsUrl: 'https://ai.google.dev/gemini-api/docs/models',
      },
      {
        id: 'llama3', name: 'Llama 3 (Ollama/Groq)',
        provider: 'Meta', hosting: 'Open-weights',
        modelId: 'llama-3.3-70b-instruct',
        priceTier: 'Free', priceInput: 'Free (self-hosted)', priceOutput: 'Free (self-hosted)', priceCache: '—',
        contextWindow: '8K-128K', contextTier: '32K-128K', maxOutput: '8K',
        modality: 'Text-only',
        capabilities: 'Tool use, Streaming, Structured output, Self-hostable',
        speedTier: 'Fast', latency: 'local-bound',
        benchmark: 'mid',
        sweBench: '28%', humanEval: '81%', mmlu: '82%',
        bestFor: 'Local/offline use, privacy-sensitive work, no-cost experimentation',
        knowledgeCutoff: 'Dec 2023', released: 'Dec 2024',
        websiteUrl: 'https://www.llama.com/',
        docsUrl: 'https://llama.meta.com/docs/',
      },
      {
        id: 'deepseek', name: 'Deepseek',
        provider: 'DeepSeek', hosting: 'Open-weights',
        modelId: 'deepseek-v3',
        priceTier: 'Budget', priceInput: '$0.27', priceOutput: '$1.10', priceCache: '$0.07',
        contextWindow: '128K', contextTier: '32K-128K', maxOutput: '8K',
        modality: 'Text-only',
        capabilities: 'Tool use, Streaming, Structured output, Self-hostable',
        speedTier: 'Standard', latency: 'medium',
        benchmark: 'high (coding)',
        sweBench: '42%', humanEval: '89%', mmlu: '84%',
        bestFor: 'Cheap high-quality coding, bulk classification, self-host for privacy',
        knowledgeCutoff: 'Jul 2024', released: 'Dec 2024',
        websiteUrl: 'https://www.deepseek.com/',
        docsUrl: 'https://api-docs.deepseek.com/',
      },
    ],
  },
  {
    id: 'integration',
    name: 'Integration Layer',
    optional: false,
    chipKeys: ['compatibility'],
    options: [
      {
        id: 'copilot', name: 'GitHub Copilot',
        compatibility: 'VS Code, JetBrains, Neovim', pricing: 'Paid subscription',
        openSource: 'No', interface: 'In-editor',
        bestFor: 'AI completions and chat across major IDEs from a trusted platform',
        capabilities: 'Inline completion, Chat, Multi-file edits, Agent mode, Code review',
        modelChoice: 'Multiple providers',
        contextHandling: 'Repo-aware',
        privacy: 'Sent to provider',
        released: '2021',
        websiteUrl: 'https://github.com/features/copilot',
        docsUrl: 'https://docs.github.com/en/copilot',
      },
      {
        id: 'continue', name: 'Continue.dev',
        compatibility: 'VS Code, JetBrains', pricing: 'Free',
        openSource: 'Yes', interface: 'In-editor',
        bestFor: 'Open-source AI extension with full model and provider flexibility',
        capabilities: 'Inline completion, Chat, Multi-file edits, Agent mode',
        modelChoice: 'BYO model',
        contextHandling: 'Indexed RAG',
        privacy: 'Configurable',
        released: '2023',
        websiteUrl: 'https://continue.dev/',
        docsUrl: 'https://docs.continue.dev/',
      },
      {
        id: 'codeium', name: 'Codeium',
        compatibility: 'VS Code, JetBrains, Vim', pricing: 'Freemium',
        openSource: 'No', interface: 'In-editor',
        bestFor: 'Free AI completions with broad IDE support',
        capabilities: 'Inline completion, Chat, Command palette, Multi-file edits',
        modelChoice: 'Fixed',
        contextHandling: '—',
        privacy: 'Sent to provider',
        released: '2022',
        websiteUrl: 'https://codeium.com/',
        docsUrl: 'https://docs.codeium.com/',
      },
      {
        id: 'cursor-built', name: 'Cursor built-in',
        compatibility: 'Cursor only', pricing: 'Paid subscription',
        openSource: 'No', interface: 'In-editor',
        bestFor: 'Tightest IDE-AI integration with tab-to-apply and inline edits',
        capabilities: 'Inline completion, Chat, Multi-file edits, Agent mode, Tabs, Auto-context, Composer',
        modelChoice: 'Multiple providers',
        contextHandling: 'Indexed RAG',
        privacy: 'Configurable',
        released: '2024',
        websiteUrl: 'https://cursor.com/',
        docsUrl: 'https://docs.cursor.com/',
      },
      {
        id: 'aider', name: 'Aider (terminal)',
        compatibility: 'Any editor (terminal)', pricing: 'BYO API key',
        openSource: 'Yes', interface: 'Terminal/CLI',
        bestFor: 'Git-aware AI pair programming from any terminal or editor',
        capabilities: 'Chat, Multi-file edits, Git integration, Map-reduce, Multi-model',
        modelChoice: 'BYO model',
        contextHandling: 'Repo-aware',
        privacy: 'Configurable',
        released: '2023',
        websiteUrl: 'https://aider.chat/',
        docsUrl: 'https://aider.chat/docs/',
      },
      {
        id: 'direct-api', name: 'Direct API / custom',
        compatibility: 'Anywhere you wire it', pricing: 'BYO API key',
        openSource: 'No', interface: 'API/SDK',
        bestFor: 'Maximum control for bespoke tooling and custom workflows',
        capabilities: '—',
        modelChoice: 'BYO model',
        contextHandling: '—',
        privacy: 'Configurable',
        released: '—',
        websiteUrl: '—',
        docsUrl: '—',
      },
    ],
  },
  {
    id: 'context',
    name: 'Context / RAG Layer',
    optional: false,
    chipKeys: ['hosting', 'staleness'],
    options: [
      {
        id: 'none', name: 'None (vanilla)',
        indexLimit: '—', hosting: '—', staleness: 'N/A',
        setup: 'Zero', openSource: 'N/A',
        bestFor: 'Simple projects where the LLM context window is sufficient',
        capabilities: 'None',
        indexType: 'None',
        updateMode: '—',
        privacy: '—',
        released: '—',
        websiteUrl: '—',
        docsUrl: '—',
      },
      {
        id: 'cursor-cb', name: '@codebase (Cursor)',
        indexLimit: 'Large', hosting: 'Cloud', staleness: 'auto',
        setup: 'Zero', openSource: 'No',
        bestFor: 'Zero-config semantic search across a codebase inside Cursor',
        capabilities: 'Semantic search, Symbol search, File-level relevance',
        indexType: 'Embeddings',
        updateMode: 'Real-time',
        privacy: 'Cloud index',
        released: '2024',
        websiteUrl: 'https://cursor.com/',
        docsUrl: 'https://docs.cursor.com/',
      },
      {
        id: 'continue-idx', name: 'Continue codebase indexing',
        indexLimit: 'Repo-size', hosting: 'Local', staleness: 'manual',
        setup: 'Low', openSource: 'Yes',
        bestFor: 'Local-first codebase indexing for use with any model',
        capabilities: 'Embedding search, Symbol search, Multi-provider',
        indexType: 'Embeddings',
        updateMode: 'On-demand',
        privacy: 'Local-only',
        released: '2023',
        websiteUrl: 'https://continue.dev/',
        docsUrl: 'https://docs.continue.dev/',
      },
      {
        id: 'greptile', name: 'Greptile',
        indexLimit: 'Large', hosting: 'Cloud', staleness: 'auto',
        setup: 'Low', openSource: 'No',
        bestFor: 'Cloud-hosted codebase indexing with semantic and code-aware search',
        capabilities: 'Semantic search, Symbol search, Code-aware search, API',
        indexType: 'AST / Hybrid',
        updateMode: 'Real-time',
        privacy: 'Cloud index',
        released: '2023',
        websiteUrl: 'https://greptile.com/',
        docsUrl: 'https://docs.greptile.com/',
      },
      {
        id: 'chromadb', name: 'Local ChromaDB',
        indexLimit: 'You manage', hosting: 'Local', staleness: 'manual',
        setup: 'High', openSource: 'Yes',
        bestFor: 'DIY local embedding-based codebase search with full control',
        capabilities: 'Embedding-based search, Vector storage, API',
        indexType: 'Embeddings',
        updateMode: 'On-demand',
        privacy: 'Local-only',
        released: '2023',
        websiteUrl: 'https://www.trychroma.com/',
        docsUrl: 'https://docs.trychroma.com/',
      },
    ],
  },
  {
    id: 'agent',
    name: 'Agent / Orchestration Layer',
    optional: true,
    chipKeys: ['notes'],
    options: [
      {
        id: 'none', name: 'None',
        notes: 'Autocomplete / chat only', autonomy: 'None',
        interface: 'N/A', openSource: 'N/A', cost: 'N/A',
        bestFor: 'Projects that only need inline completions and chat',
        capabilities: 'None',
        modelChoice: '—',
        guardrails: '—',
        released: '—',
        websiteUrl: '—',
        docsUrl: '—',
      },
      {
        id: 'aider-arch', name: 'Aider (architect)',
        notes: 'Plan-then-edit loop', autonomy: 'Assist',
        interface: 'Terminal/CLI', openSource: 'Yes', cost: 'BYO API key',
        bestFor: 'Plan-then-edit workflow with git safety net for complex changes',
        capabilities: 'Tool use, Multi-step planning, Git integration, Shell access, Multi-model',
        modelChoice: 'BYO model',
        guardrails: 'Approval gates',
        released: '2023',
        websiteUrl: 'https://aider.chat/',
        docsUrl: 'https://aider.chat/docs/',
      },
      {
        id: 'swe-agent', name: 'SWE-agent',
        notes: 'Issue-resolution agent', autonomy: 'Autonomous',
        interface: 'Terminal/CLI', openSource: 'Yes', cost: 'BYO API key',
        bestFor: 'Autonomous issue resolution and PR generation from GitHub issues',
        capabilities: 'Tool use, Multi-step planning, Shell access, Browser, Git, File editing',
        modelChoice: 'BYO model',
        guardrails: 'Sandboxed',
        released: '2024',
        websiteUrl: 'https://swe-agent.com/',
        docsUrl: 'https://swe-agent.com/latest/',
      },
      {
        id: 'claude-code', name: 'Claude Code',
        notes: 'CLI agent, full repo access', autonomy: 'Semi-autonomous',
        interface: 'Terminal/CLI', openSource: 'No', cost: 'Paid subscription',
        bestFor: 'Anthropic CLI agent with full repo awareness and terminal access',
        capabilities: 'Tool use, Multi-step planning, Shell access, Browser, MCP, Git, File editing',
        modelChoice: 'Fixed',
        guardrails: 'Approval gates',
        released: '2025',
        websiteUrl: 'https://www.anthropic.com/claude-code',
        docsUrl: 'https://docs.anthropic.com/en/docs/claude-code',
      },
      {
        id: 'langgraph', name: 'Custom LangGraph',
        notes: 'DIY pipelines', autonomy: 'Autonomous',
        interface: 'Framework/SDK', openSource: 'Yes', cost: 'BYO API key',
        bestFor: 'Build custom multi-agent workflows with full control and state management',
        capabilities: 'Tool use, Multi-step planning, State graphs, Custom tools, Human-in-the-loop, Multi-agent',
        modelChoice: 'BYO model',
        guardrails: '—',
        released: '2024',
        websiteUrl: 'https://www.langchain.com/langgraph',
        docsUrl: 'https://langchain-ai.github.io/langgraph/',
      },
    ],
  },
];

(async () => {
  const wasmBinary = fs.readFileSync(path.join(__dirname, '..', 'vendor', 'sql-wasm.wasm'));
  const SQL = await initSqlJs({ wasmBinary });
  const db = new SQL.Database();

  db.run(`
    CREATE TABLE layers (
      id        TEXT PRIMARY KEY,
      name      TEXT NOT NULL,
      optional  INTEGER NOT NULL DEFAULT 0,
      position  INTEGER NOT NULL
    );

    CREATE TABLE layer_chip_keys (
      layer_id  TEXT NOT NULL REFERENCES layers(id),
      key       TEXT NOT NULL,
      position  INTEGER NOT NULL,
      PRIMARY KEY (layer_id, key)
    );

    CREATE TABLE options (
      layer_id  TEXT NOT NULL REFERENCES layers(id),
      id        TEXT NOT NULL,
      name      TEXT NOT NULL,
      position  INTEGER NOT NULL,
      PRIMARY KEY (layer_id, id)
    );

    CREATE TABLE option_attrs (
      layer_id   TEXT NOT NULL,
      option_id  TEXT NOT NULL,
      key        TEXT NOT NULL,
      value      TEXT,
      PRIMARY KEY (layer_id, option_id, key),
      FOREIGN KEY (layer_id, option_id) REFERENCES options(layer_id, id)
    );

    CREATE INDEX idx_options_layer ON options(layer_id, position);
    CREATE INDEX idx_option_attrs_option ON option_attrs(layer_id, option_id);
  `);

  const insLayer = db.prepare('INSERT INTO layers (id, name, optional, position) VALUES (?, ?, ?, ?)');
  const insChip  = db.prepare('INSERT INTO layer_chip_keys (layer_id, key, position) VALUES (?, ?, ?)');
  const insOpt   = db.prepare('INSERT INTO options (layer_id, id, name, position) VALUES (?, ?, ?, ?)');
  const insAttr  = db.prepare('INSERT INTO option_attrs (layer_id, option_id, key, value) VALUES (?, ?, ?, ?)');

  LAYERS.forEach((layer, layerPos) => {
    insLayer.run([layer.id, layer.name, layer.optional ? 1 : 0, layerPos]);
    (layer.chipKeys || []).forEach((key, i) => insChip.run([layer.id, key, i]));
    layer.options.forEach((opt, optPos) => {
      insOpt.run([layer.id, opt.id, opt.name, optPos]);
      for (const [key, value] of Object.entries(opt)) {
        if (key === 'id' || key === 'name') continue;
        insAttr.run([layer.id, opt.id, key, value == null ? null : String(value)]);
      }
    });
  });

  insLayer.free(); insChip.free(); insOpt.free(); insAttr.free();

  const bytes = db.export();
  const outPath = path.join(__dirname, '..', 'data', 'flowpicker.db');
  fs.writeFileSync(outPath, Buffer.from(bytes));
  console.log(`Wrote ${outPath} (${bytes.length} bytes)`);
  db.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
