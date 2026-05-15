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
        'gpt4o', 'openai-o3', 'openai-o4-mini', 'openai-gpt4-1',
        'gemini', 'gemini-2-5-pro', 'gemini-2-5-flash', 'gemini-3-flash',
        'grok-4.3', 'grok-4.20', 'grok-fast',
        'deepseek', 'deepseek-v4-flash', 'deepseek-v4-pro',
        'gpt-oss-120b', 'gpt-oss-20b',
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
      const autonomousAgents = ['swe-agent', 'langgraph', 'cline-agent', 'devin', 'openhands-agent', 'codex-cli-agent'];
      const staleLayers = ['continue-idx', 'chromadb', 'pinecone', 'lancedb', 'pgvector', 'qdrant', 'weaviate'];
      return autonomousAgents.includes(s.agent?.id) && staleLayers.includes(s.context?.id);
    },
    message: s => `⚠️ ${s.agent.name} with on-demand context "${s.context.name}" may act on stale code — prefer real-time context (Cursor @codebase, Greptile, GitHub Copilot indexing, Redis Vector).`,
  },
  {
    id: 'selfhosted-llm-cloud-context-privacy',
    when: s => {
      const selfHostedLLMs = ['llama3', 'deepseek', 'qwen-3', 'qwen-3.6', 'qwen-coder', 'qwen-coder-next', 'gemma-4', 'llama-4', 'phi-4', 'mistral-large-3', 'devstral-2', 'ministral-14b', 'gpt-oss-120b', 'gpt-oss-20b', 'glm-5.1', 'laguna-xs2', 'minimax-m2.7', 'mimo-v2.5-pro', 'ling-2.6-1t', 'granite-4.1'];
      const cloudContexts = ['cursor-cb', 'greptile', 'sourcegraph-cody', 'copilot-idx', 'pinecone', 'windsurf-idx', 'redis-vector', 'milvus', 'mem0'];
      return selfHostedLLMs.includes(s.llm?.id) && cloudContexts.includes(s.context?.id);
    },
    message: s => `Privacy conflict: Self-hosted ${s.llm.name} sends code to cloud ${s.context.name}. Use local context (Continue indexing, ChromaDB, LanceDB, pgvector) for true privacy.`,
  },
  {
    id: 'small-output-llm-autonomous-agent',
    when: s => ['swe-agent', 'langgraph', 'cline-agent', 'devin'].includes(s.agent?.id) && s.llm?.id === 'nova-micro',
    message: s => `${s.agent.name} with ${s.llm.name} (8K max output) may struggle with multi-file edits. Use models with 16K+ output capacity.`,
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
