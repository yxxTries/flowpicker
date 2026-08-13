const COMPATIBILITY_RULES = [
  {
    id: 'cursor-built-needs-cursor',
    when: s => s.integration?.id === 'cursor-built' && s.ide && s.ide.id !== 'cursor',
    message: s => `${s.integration.name} only runs inside the Cursor editor — your IDE is ${s.ide.name}.`,
  },
  {
    id: 'cursor-codebase-needs-cursor',
    when: s => s.context?.id === 'cursor-cb' && s.ide && s.ide.id !== 'cursor',
    message: s => `@codebase indexing is a Cursor-only feature, but your IDE is ${s.ide.name}.`,
  },
  {
    id: 'continue-needs-supported-ide',
    when: s => s.integration?.id === 'continue' && s.ide && !['vscode', 'jetbrains'].includes(s.ide.id),
    message: s => `${s.integration.name} only supports VS Code and JetBrains — your IDE is ${s.ide.name}.`,
  },
  {
    id: 'copilot-needs-supported-ide',
    when: s => s.integration?.id === 'copilot' && s.ide && !['vscode', 'jetbrains', 'neovim', 'vim', 'visual-studio', 'xcode', 'fleet'].includes(s.ide.id),
    message: s => `GitHub Copilot does not officially support ${s.ide.name}.`,
  },
  {
    id: 'continue-index-needs-continue',
    when: s => s.context?.id === 'continue-idx' && s.integration && s.integration.id !== 'continue',
    message: s => `Continue's codebase indexing only works when the integration is Continue.dev (yours is ${s.integration.name}).`,
  },
  {
    id: 'aider-architect-needs-aider',
    when: s => s.agent?.id === 'aider-arch' && s.integration && s.integration.id !== 'aider',
    message: s => `Aider architect mode requires the Aider integration (yours is ${s.integration.name}).`,
  },
  {
    id: 'cursor-built-locked-model',
    when: s => {
      if (s.integration?.id !== 'cursor-built' || !s.llm) return false;
      const cursorSupported = new Set([
        'claude-sonnet', 'claude-opus', 'claude-haiku',
        'claude-fable-5', 'claude-opus-5', 'claude-sonnet-5', 'claude-opus-4-8', 'claude-opus-4-6',
        'gpt4o', 'openai-o3', 'openai-o4-mini', 'openai-gpt4-1',
        'gpt-5-4', 'gpt-5-5', 'gpt-5-5-pro', 'gpt-5-1',
        'gpt-5-6-sol', 'gpt-5-6-terra', 'gpt-5-6-luna', 'gpt-5-3-codex', 'gpt-5-4-mini', 'gpt-5-4-nano',
        'gemini-2-5-pro', 'gemini-2-5-flash', 'gemini-3-flash', 'gemini-3-deep-think',
        'gemini-3-1-pro', 'gemini-3-6-flash', 'gemini-3-5-flash',
        'grok-4-3', 'grok-4-20', 'grok-5', 'grok-code-fast-2', 'grok-4-5', 'grok-4-6',
        'deepseek', 'deepseek-v4-flash', 'deepseek-v4-pro', 'deepseek-r2', 'deepseek-v4',
        'gpt-oss-120b', 'gpt-oss-20b',
        'kimi-k2-6', 'kimi-k3',
      ]);
      return !cursorSupported.has(s.llm.id);
    },
    message: s => `Cursor's built-in model menu may not include ${s.llm.name} — verify it's available in your Cursor model picker.`,
  },
  {
    id: 'windsurf-cascade-needs-windsurf',
    when: s => s.integration?.id === 'windsurf-cascade' && s.ide && s.ide.id !== 'windsurf',
    message: s => `${s.integration.name} only runs inside Windsurf — your IDE is ${s.ide.name}.`,
  },
  {
    id: 'windsurf-index-needs-windsurf',
    when: s => s.context?.id === 'windsurf-idx' && s.integration && s.integration.id !== 'windsurf-cascade',
    message: s => `Windsurf codebase indexing only works with Windsurf Cascade integration (yours is ${s.integration.name}).`,
  },
  {
    id: 'claude-code-needs-claude',
    when: s => s.agent?.id === 'claude-code' && s.llm && !s.llm.id.startsWith('claude'),
    message: s => `Claude Code only works with Claude models — your LLM is ${s.llm.name}.`,
  },
  {
    id: 'claude-code-sdk-prefers-claude',
    when: s => s.agent?.id === 'claude-code-sdk' && s.llm && !s.llm.id.startsWith('claude'),
    message: s => `The Claude Code SDK is tuned for Claude models — ${s.llm.name} may work via the model adapter but loses Claude-specific features (thinking, prompt caching, sub-agents).`,
  },
  {
    id: 'codex-cloud-fixed-model',
    when: s => s.agent?.id === 'codex-cloud' && s.llm,
    message: s => `OpenAI Codex (Cloud) runs GPT-5.1 Codex internally — your selected ${s.llm.name} will be ignored.`,
  },
  {
    id: 'jules-fixed-model',
    when: s => s.agent?.id === 'jules' && s.llm && !s.llm.id.startsWith('gemini'),
    message: s => `Jules runs Gemini models internally — your selected ${s.llm.name} will be ignored.`,
  },
  {
    id: 'replit-agent-3-fixed-model',
    when: s => s.agent?.id === 'replit-agent-3' && s.llm,
    message: s => `Replit Agent 3 uses its own model selection internally — your selected ${s.llm.name} will be ignored.`,
  },
  {
    id: 'lovable-fixed-model',
    when: s => s.agent?.id === 'lovable' && s.llm,
    message: s => `Lovable uses a fixed internal model — your selected ${s.llm.name} will be ignored.`,
  },
  {
    id: 'gemini-cli-needs-gemini',
    when: s => s.integration?.id === 'gemini-cli' && s.llm && !s.llm.id.startsWith('gemini'),
    message: s => `Gemini CLI is locked to Google Gemini models — your LLM is ${s.llm.name}.`,
  },
  {
    id: 'codex-vscode-needs-openai',
    when: s => {
      if (s.integration?.id !== 'codex-vscode' || !s.llm) return false;
      // Hosted OpenAI API models only — the gpt-oss open weights are made by
      // OpenAI but are not selectable inside the Codex extension, so this
      // stays an explicit list rather than a provider check.
      const openai = ['gpt4o', 'openai-o3', 'openai-o4-mini', 'openai-gpt4-1', 'gpt-5-4', 'gpt-5-5', 'gpt-5-5-pro', 'gpt-5-1', 'gpt-5-6-sol', 'gpt-5-6-terra', 'gpt-5-6-luna', 'gpt-5-3-codex', 'gpt-5-4-mini', 'gpt-5-4-nano'];
      return !openai.includes(s.llm.id);
    },
    message: s => `OpenAI Codex (VS Code) is tied to OpenAI's hosted GPT-5 and Codex models — ${s.llm.name} is not selectable inside this integration.`,
  },
  {
    id: 'zed-agent-needs-zed',
    when: s => s.integration?.id === 'zed-agent' && s.ide && s.ide.id !== 'zed',
    message: s => `${s.integration.name} only runs inside the Zed editor — your IDE is ${s.ide.name}.`,
  },
  {
    id: 'cursor-cli-needs-cursor-account',
    when: s => s.integration?.id === 'cursor-cli' && s.ide && s.ide.id !== 'cursor',
    message: s => `Cursor CLI works in any terminal but needs an active Cursor subscription — your IDE is ${s.ide.name}, which is fine but the cost is tied to Cursor.`,
  },
  {
    id: 'cursor-bg-agent-needs-cursor',
    when: s => s.agent?.id === 'cursor-bg-agent' && s.ide && s.ide.id !== 'cursor' && s.ide.id !== 'cursor-mobile',
    message: s => `Cursor Background Agents are dispatched from Cursor (desktop or mobile) — your IDE is ${s.ide.name}.`,
  },
  {
    id: 'antigravity-prefers-gemini',
    when: s => s.ide?.id === 'antigravity' && s.llm && !s.llm.id.startsWith('gemini') && !s.llm.id.startsWith('claude') && !['gpt-5-4', 'gpt-5-5', 'gpt-5-5-pro', 'gpt-5-1', 'gpt-5-6-sol', 'gpt-5-6-terra', 'gpt-5-6-luna', 'gpt-5-3-codex', 'gpt-5-4-mini', 'gpt-5-4-nano'].includes(s.llm.id),
    message: s => `${s.ide.name} is built around Gemini 3 Pro; Claude and recent GPT-5 models also work, but ${s.llm.name} is not in the supported model list.`,
  },
  {
    id: 'kiro-prefers-claude',
    when: s => s.ide?.id === 'kiro' && s.llm && !s.llm.id.startsWith('claude'),
    message: s => `${s.ide.name}'s spec mode is tuned for Claude models — ${s.llm.name} may work but spec-driven flows are best with Claude.`,
  },
  {
    id: 'trae-fixed-models',
    when: s => s.ide?.id === 'trae' && s.llm && !['claude-sonnet','claude-opus','claude-haiku','claude-opus-5','claude-sonnet-5','gpt4o','gpt-5-4','gpt-5-5','gpt-5-1','gpt-5-6-sol','gpt-5-6-terra','gpt-5-3-codex','deepseek','deepseek-v4','deepseek-v4-pro','deepseek-r2','gemini-2-5-pro','gemini-3-1-pro','gemini-3-6-flash','grok-4-3','grok-4-5','grok-5','grok-code-fast-2'].includes(s.llm.id),
    message: s => `Trae's built-in model menu may not include ${s.llm.name} — Trae primarily ships with Claude/GPT/Gemini/DeepSeek.`,
  },
  {
    id: 'void-prefers-byok',
    when: s => s.ide?.id === 'void' && s.integration && !['direct-api', 'continue', 'cline', 'roo-code'].includes(s.integration.id),
    message: s => `${s.ide.name} is BYO-API-key first — ${s.integration.name} runs as an extension on top, which can work but isn't the intended Void workflow.`,
  },
  {
    id: 'roo-code-needs-supported-ide',
    when: s => s.integration?.id === 'roo-code' && s.ide && !['vscode','jetbrains','cursor','windsurf','fleet','void','pearai','trae','antigravity','kiro'].includes(s.ide.id),
    message: s => `Roo Code runs as a VS Code-compatible extension — your IDE is ${s.ide.name}.`,
  },
  {
    id: 'kilocode-needs-supported-ide',
    when: s => s.integration?.id === 'kilocode' && s.ide && !['vscode','jetbrains','cursor','windsurf','fleet','void','pearai','trae','antigravity','kiro'].includes(s.ide.id),
    message: s => `Kilo Code runs as a VS Code-compatible extension — your IDE is ${s.ide.name}.`,
  },
  {
    id: 'augment-needs-supported-ide',
    when: s => s.integration?.id === 'augment' && s.ide && !['vscode','jetbrains','vim','neovim','fleet'].includes(s.ide.id),
    message: s => `Augment Code officially supports VS Code, JetBrains, Vim, and Neovim — your IDE is ${s.ide.name}.`,
  },
  {
    id: 'opencode-cli-only',
    when: s => s.integration?.id === 'opencode' && s.ide && !['vscode','jetbrains','neovim','vim','helix','emacs','windsurf','cursor','zed'].includes(s.ide.id) && s.ide.id !== 'fleet',
    message: s => `OpenCode is a terminal-first CLI; running it inside ${s.ide.name} works but the experience is in the embedded terminal.`,
  },
  {
    id: 'plandex-terminal',
    when: s => s.integration?.id === 'plandex' && s.ide?.id === 'replit',
    message: s => `Plandex is a terminal-first CLI and is not designed to run inside the Replit web IDE.`,
  },
  {
    id: 'warp-needs-warp',
    when: s => s.integration?.id === 'warp-ai',
    message: s => `Warp Agent Mode requires the Warp terminal — your IDE selection (${s.ide?.name || 'none'}) is independent, but the agent runs inside Warp.`,
  },
  {
    id: 'crush-cli-only',
    when: s => s.integration?.id === 'crush' && s.ide?.id === 'replit',
    message: s => `Crush is a terminal TUI agent; it does not run inside the Replit web IDE.`,
  },
  {
    id: 'amp-needs-supported-ide',
    when: s => s.integration?.id === 'amp' && s.ide && !['vscode','jetbrains','fleet'].includes(s.ide.id),
    message: s => `Amp (Sourcegraph) officially supports VS Code and JetBrains — your IDE is ${s.ide.name}. Use the CLI version otherwise.`,
  },
  {
    id: 'cody-vscode-needs-supported-ide',
    when: s => s.integration?.id === 'cody-vscode' && s.ide && !['vscode','jetbrains','visual-studio','fleet'].includes(s.ide.id),
    message: s => `Sourcegraph Cody (Enterprise) supports VS Code, JetBrains, and Visual Studio — your IDE is ${s.ide.name}.`,
  },
  {
    id: 'mobile-ide-no-local-integration',
    when: s => s.ide?.id === 'cursor-mobile' && s.integration && !['cursor-built', 'cursor-cli'].includes(s.integration.id),
    message: s => `${s.ide.name} only runs Cursor-managed agents and background tasks — local-only integrations like ${s.integration.name} cannot run on the phone.`,
  },
  {
    id: 'positron-data-science-focus',
    when: s => s.ide?.id === 'positron' && s.integration && !['continue', 'copilot', 'codeium', 'direct-api', 'codex-vscode'].includes(s.integration.id),
    message: s => `${s.ide.name} is VS Code-based but tuned for R/Python data science — ${s.integration.name} may install but is not officially supported.`,
  },
  {
    id: 'rstudio-r-focus',
    when: s => s.ide?.id === 'rstudio' && s.integration && !['direct-api'].includes(s.integration.id),
    message: s => `${s.integration.name} does not officially support RStudio — use direct API calls or the rstudio.cloud Copilot integration.`,
  },
  {
    id: 'spyder-python-focus',
    when: s => s.ide?.id === 'spyder' && s.integration && !['direct-api'].includes(s.integration.id),
    message: s => `${s.integration.name} does not officially support Spyder — use the direct API.`,
  },
  {
    id: 'eclipse-limited-ai',
    when: s => s.ide?.id === 'eclipse' && s.integration && !['copilot', 'direct-api', 'tabnine', 'codeium'].includes(s.integration.id),
    message: s => `${s.integration.name} does not officially support Eclipse — Copilot, Tabnine, and Codeium are the main supported options.`,
  },
  {
    id: 'netbeans-limited-ai',
    when: s => s.ide?.id === 'netbeans' && s.integration && !['copilot', 'direct-api', 'tabnine'].includes(s.integration.id),
    message: s => `${s.integration.name} does not officially support Apache NetBeans — Copilot and Tabnine are the main supported options.`,
  },
  {
    id: 'lapce-limited-ai',
    when: s => s.ide?.id === 'lapce' && s.integration && !['direct-api', 'continue'].includes(s.integration.id),
    message: s => `${s.ide.name} has a small plugin ecosystem; ${s.integration.name} may not have an official plugin yet.`,
  },
  {
    id: 'devin-proprietary-model',
    when: s => s.agent?.id === 'devin' && s.llm,
    message: s => `Devin uses Cognition's proprietary model internally — your selected ${s.llm.name} will be ignored.`,
  },
  {
    id: 'cursor-codebase-needs-cursor-integration',
    when: s => s.context?.id === 'cursor-cb' && s.integration && s.integration.id !== 'cursor-built',
    message: s => `@codebase (Cursor) only works with Cursor built-in integration (yours is ${s.integration.name}).`,
  },
  {
    id: 'autonomous-agent-needs-realtime-context',
    when: s => {
      const autonomousAgents = ['swe-agent', 'langgraph', 'cline-agent', 'devin', 'openhands-agent', 'codex-cli-agent', 'codex-cloud', 'jules', 'factory-droid', 'cursor-bg-agent', 'replit-agent-3', 'all-hands-cloud', 'bolt-new', 'lovable'];
      const staleLayers = ['continue-idx', 'chromadb', 'pinecone', 'lancedb', 'pgvector', 'qdrant', 'weaviate', 'vespa', 'elasticsearch-vector', 'mongodb-atlas-vector', 'supabase-vector', 'marqo'];
      return autonomousAgents.includes(s.agent?.id) && staleLayers.includes(s.context?.id);
    },
    message: s => `⚠️ ${s.agent.name} with on-demand context "${s.context.name}" may act on stale code — prefer real-time context (Cursor @codebase, Greptile, GitHub Copilot indexing, Augment Context, CocoIndex, turbopuffer).`,
  },
  {
    id: 'selfhosted-llm-cloud-context-privacy',
    when: s => {
      const selfHostedLLMs = ['llama3', 'deepseek', 'qwen-3', 'qwen-3-6', 'qwen-coder', 'qwen-coder-next', 'gemma-4', 'llama-4', 'phi-4', 'phi-5', 'mistral-large-3', 'mistral-large-4', 'devstral-2', 'magistral-2', 'ministral-14b', 'gpt-oss-120b', 'gpt-oss-20b', 'glm-5-1', 'glm-5-air', 'laguna-xs2', 'minimax-m2-7', 'mimo-v2-5-pro', 'ling-2-6-1t', 'granite-4-1', 'kimi-k2-6', 'kimi-k3', 'hy3-preview', 'step-3-5-flash', 'nemotron-3-super', 'nemotron-3-nano-omni', 'qwen-3-5-397b', 'qwen-3-6-27b', 'qwen-3-max', 'jamba-mini-2', 'jamba-large-2', 'jamba-1-7', 'deepseek-v4', 'llama-4-behemoth', 'llama-4-scout', 'hermes-4', 'yi-3-lightning'];
      const cloudContexts = ['cursor-cb', 'greptile', 'sourcegraph-cody', 'copilot-idx', 'pinecone', 'windsurf-idx', 'redis-vector', 'milvus', 'mem0', 'turbopuffer', 'mongodb-atlas-vector', 'supabase-vector', 'augment-context', 'sweep-index'];
      return selfHostedLLMs.includes(s.llm?.id) && cloudContexts.includes(s.context?.id);
    },
    message: s => `Privacy conflict: Self-hosted ${s.llm.name} sends code to cloud ${s.context.name}. Use local context (Continue indexing, ChromaDB, LanceDB, pgvector, Vespa self-hosted) for true privacy.`,
  },
  {
    id: 'small-output-llm-autonomous-agent',
    when: s => ['swe-agent', 'langgraph', 'cline-agent', 'devin', 'codex-cloud', 'jules', 'cursor-bg-agent', 'all-hands-cloud'].includes(s.agent?.id) && ['nova-micro', 'llama-4-scout', 'phi-5', 'yi-3-lightning'].includes(s.llm?.id),
    message: s => `${s.agent.name} with ${s.llm.name} (≤8K max output) may struggle with multi-file edits. Use models with 16K+ output capacity.`,
  },
  {
    id: 'amazon-q-needs-supported-ide',
    when: s => s.integration?.id === 'amazon-q' && s.ide && !['vscode', 'jetbrains'].includes(s.ide.id),
    message: s => `Amazon Q Developer does not officially support ${s.ide.name} — use VS Code or JetBrains.`,
  },
  {
    id: 'jetbrains-ai-needs-jetbrains',
    when: s => s.integration?.id === 'jetbrains-ai' && s.ide && !['jetbrains', 'fleet'].includes(s.ide.id),
    message: s => `JetBrains AI Assistant only runs inside JetBrains IDEs — your IDE is ${s.ide.name}.`,
  },
  {
    id: 'supermaven-redundant-ai-native',
    when: s => s.integration?.id === 'supermaven' && s.ide && ['cursor', 'windsurf'].includes(s.ide.id),
    message: s => `${s.ide.name} has its own built-in AI; Supermaven may conflict with or be redundant to it.`,
  },
  {
    id: 'xcode-limited-integration',
    when: s => s.ide?.id === 'xcode' && s.integration && !['direct-api', 'copilot'].includes(s.integration.id),
    message: s => `${s.integration.name} does not officially support Xcode. Use GitHub Copilot for Xcode or Direct API.`,
  },
  {
    id: 'android-studio-limited-integration',
    when: s => s.ide?.id === 'android-studio' && s.integration && !['copilot', 'direct-api', 'jetbrains-ai'].includes(s.integration.id),
    message: s => `${s.integration.name} has limited or no official Android Studio support. Use GitHub Copilot or JetBrains AI Assistant.`,
  },
  {
    id: 'codeium-needs-supported-ide',
    when: s => s.integration?.id === 'codeium' && s.ide && !['vscode', 'jetbrains', 'vim', 'neovim', 'fleet', 'visual-studio'].includes(s.ide.id),
    message: s => `Codeium does not officially support ${s.ide.name} — use VS Code, JetBrains, Vim, or Neovim.`,
  },
  {
    id: 'cody-needs-supported-ide',
    when: s => s.integration?.id === 'cody' && s.ide && !['vscode', 'jetbrains', 'visual-studio', 'fleet'].includes(s.ide.id),
    message: s => `Sourcegraph Cody does not officially support ${s.ide.name} — use VS Code, JetBrains, or Visual Studio.`,
  },
  {
    id: 'cline-needs-supported-ide',
    when: s => s.integration?.id === 'cline' && s.ide && !['vscode', 'jetbrains', 'fleet'].includes(s.ide.id),
    message: s => `Cline only supports VS Code and JetBrains IDEs — your IDE is ${s.ide.name}.`,
  },
  {
    id: 'qodo-needs-supported-ide',
    when: s => s.integration?.id === 'qodo' && s.ide && !['vscode', 'jetbrains', 'fleet'].includes(s.ide.id),
    message: s => `Qodo officially supports VS Code and JetBrains — your IDE is ${s.ide.name}.`,
  },
  {
    id: 'supermaven-needs-supported-ide',
    when: s => s.integration?.id === 'supermaven' && s.ide && !['vscode', 'jetbrains', 'neovim', 'zed', 'fleet'].includes(s.ide.id),
    message: s => `Supermaven only supports VS Code, JetBrains, Neovim, and Zed — your IDE is ${s.ide.name}.`,
  },
  {
    id: 'tabnine-needs-supported-ide',
    when: s => s.integration?.id === 'tabnine' && s.ide && !['vscode', 'jetbrains', 'visual-studio', 'neovim', 'vim', 'sublime-text', 'fleet', 'android-studio'].includes(s.ide.id),
    message: s => `Tabnine does not officially support ${s.ide.name}.`,
  },
  {
    id: 'replit-external-integration',
    when: s => s.ide?.id === 'replit' && s.integration && !['direct-api'].includes(s.integration.id),
    message: s => `Replit has its own built-in AI Agent — external integrations like ${s.integration.name} cannot run inside the Replit web IDE.`,
  },
  {
    id: 'cri-o-needs-kubernetes',
    when: s => s.others?.id === 'cri-o',
    message: s => `${s.others.name} is a Kubernetes-only container runtime — make sure you're running on Kubernetes / OpenShift, not standalone Docker workflows.`,
  },
  {
    id: 'prometheus-setup-effort',
    when: s => s.others?.id === 'prometheus',
    message: s => `Heads up: ${s.others.name} has high setup effort — plan for Alertmanager, exporters, and a dashboarding tool (Grafana) to get full value.`,
  },
];
