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
    when: s => s.integration?.id === 'copilot' && s.ide && !['vscode', 'jetbrains', 'neovim'].includes(s.ide.id),
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
    when: s => s.integration?.id === 'cursor-built' && s.llm && !s.llm.id.startsWith('claude') && s.llm.id !== 'gpt4o',
    message: s => `Cursor's built-in integration routes through its own model menu — ${s.llm.name} may not be selectable there.`,
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
    when: s => s.agent?.id === 'devin' && s.llm && !s.llm.id.startsWith('devin') && s.llm.modelChoice === 'BYO model',
    message: s => `Devin uses a proprietary model and cannot be paired with ${s.llm.name}.`,
  },
  {
    id: 'cursor-codebase-needs-cursor-integration',
    when: s => s.context?.id === 'cursor-cb' && s.integration && s.integration.id !== 'cursor-built',
    message: s => `@codebase (Cursor) only works with Cursor built-in integration (yours is ${s.integration.name}).`,
  },
  {
    id: 'autonomous-agent-needs-realtime-context',
    when: s => {
      const autonomousAgents = ['swe-agent', 'langgraph', 'cline-agent', 'devin'];
      const staleLayers = ['continue-idx', 'chromadb', 'pinecone', 'lancedb'];
      return autonomousAgents.includes(s.agent?.id) && staleLayers.includes(s.context?.id);
    },
    message: s => `⚠️ ${s.agent.name} with on-demand context "${s.context.name}" may act on stale code — prefer real-time context (Cursor @codebase, Greptile, GitHub Copilot indexing).`,
  },
  {
    id: 'selfhosted-llm-cloud-context-privacy',
    when: s => {
      const selfHostedLLMs = ['llama3', 'deepseek', 'qwen-3', 'gemma-4', 'llama-4', 'phi-4'];
      const cloudContexts = ['cursor-cb', 'greptile', 'sourcegraph-cody', 'copilot-idx', 'pinecone', 'windsurf-idx'];
      return selfHostedLLMs.includes(s.llm?.id) && cloudContexts.includes(s.context?.id);
    },
    message: s => `Privacy conflict: Self-hosted ${s.llm.name} sends code to cloud ${s.context.name}. Use local context (Continue indexing, ChromaDB, LanceDB) for true privacy.`,
  },
  {
    id: 'small-output-llm-autonomous-agent',
    when: s => ['swe-agent', 'langgraph', 'cline-agent', 'devin'].includes(s.agent?.id) && s.llm?.id === 'nova-micro',
    message: s => `${s.agent.name} with ${s.llm.name} (8K max output) may struggle with multi-file edits. Use models with 16K+ output capacity.`,
  },
];
