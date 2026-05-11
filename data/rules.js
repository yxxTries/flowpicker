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
];
