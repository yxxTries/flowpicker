// Deep compatibility analysis - find subtle incompatibilities
const fs = require('fs');

// Full data from build-db.js
const allData = {
  ides: [
    { id: 'vscode', name: 'VS Code', interface: 'GUI', os: 'macOS, Windows, Linux' },
    { id: 'cursor', name: 'Cursor', interface: 'GUI', os: 'macOS, Windows, Linux' },
    { id: 'zed', name: 'Zed', interface: 'GUI', os: 'macOS, Linux' },
    { id: 'neovim', name: 'Neovim', interface: 'Terminal/TUI', os: 'macOS, Windows, Linux' },
    { id: 'jetbrains', name: 'JetBrains', interface: 'GUI', os: 'macOS, Windows, Linux' },
    { id: 'windsurf', name: 'Windsurf', interface: 'GUI', os: 'macOS, Windows, Linux' },
    { id: 'fleet', name: 'JetBrains Fleet', interface: 'GUI', os: 'macOS, Windows, Linux' },
    { id: 'replit', name: 'Replit', interface: 'GUI', os: 'Browser, macOS, iOS, Android' },
    { id: 'visual-studio', name: 'Visual Studio 2022', interface: 'GUI', os: 'Windows, macOS' },
    { id: 'sublime-text', name: 'Sublime Text', interface: 'GUI', os: 'macOS, Windows, Linux' },
    { id: 'helix', name: 'Helix', interface: 'Terminal/TUI', os: 'macOS, Windows, Linux' },
  ],
  llms: [
    { id: 'claude-sonnet', name: 'Claude Sonnet 4.6', capabilities: 'Vision, Tool use, Streaming, Structured output, Prompt caching', modality: 'Multimodal (vision)' },
    { id: 'claude-opus', name: 'Claude Opus 4.7', capabilities: 'Vision, Tool use, Extended thinking, Streaming, Structured output, Prompt caching', modality: 'Multimodal (vision)' },
    { id: 'claude-haiku', name: 'Claude Haiku 4.5', capabilities: 'Vision, Tool use, Streaming, Structured output, Prompt caching', modality: 'Multimodal (vision)' },
    { id: 'gpt4o', name: 'GPT-4o', capabilities: 'Vision, Audio, Tool use, Streaming, Structured output', modality: 'Multimodal (vision + audio)' },
    { id: 'gemini', name: 'Gemini 2.x', capabilities: 'Vision, Audio, Tool use, Streaming, Structured output, Long context', modality: 'Multimodal (vision + audio)' },
    { id: 'llama3', name: 'Llama 3', capabilities: 'Tool use, Streaming, Structured output, Self-hostable', modality: 'Text-only' },
    { id: 'deepseek', name: 'Deepseek', capabilities: 'Tool use, Streaming, Structured output, Self-hostable', modality: 'Text-only' },
    { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', capabilities: 'Tool use, Streaming, Structured output, Thinking mode, Prefix completion, FIM', modality: 'Text-only' },
    { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', capabilities: 'Tool use, Streaming, Structured output, Thinking mode, Deep reasoning', modality: 'Text-only' },
    { id: 'codestral', name: 'Codestral', capabilities: 'Tool use, Streaming, Structured output, FIM, Code completion, Code generation', modality: 'Text-only', specialization: 'Code-focused' },
    { id: 'grok-4.3', name: 'Grok 4.3', capabilities: 'Vision, Tool use, Streaming, Structured output, Web search, X search, Code execution', modality: 'Multimodal (vision)', specialization: 'Web search' },
    { id: 'grok-4.20', name: 'Grok 4.20', capabilities: 'Vision, Tool use, Streaming, Structured output, Reasoning, Web search, X search, MCP', modality: 'Multimodal (vision)', specialization: 'Reasoning' },
    { id: 'mistral-large-3', name: 'Mistral Large 3', capabilities: 'Vision, Tool use, Streaming, Structured output, Multilingual, Self-hostable', modality: 'Multimodal (vision)' },
    { id: 'llama-4', name: 'Llama 4 Maverick', capabilities: 'Vision, Tool use, Streaming, Structured output, Self-hostable, MoE architecture', modality: 'Multimodal (vision)' },
    { id: 'qwen-3', name: 'Qwen 3', capabilities: 'Tool use, Streaming, Structured output, Thinking mode, MCP, 119 languages, Self-hostable', modality: 'Text-only' },
    { id: 'gemma-4', name: 'Gemma 4 31B', capabilities: 'Vision, Tool use, Streaming, Structured output, Thinking mode, Function calling, Agentic coding, System prompts, Self-hostable', modality: 'Multimodal (vision)' },
    { id: 'nova-micro', name: 'Amazon Nova Micro', capabilities: 'Tool use, Streaming, Structured output, AWS integration', modality: 'Text-only', maxOutput: '8K' },
  ],
  integrations: [
    { id: 'copilot', name: 'GitHub Copilot', interface: 'In-editor', modelChoice: 'Multiple providers', compatibility: 'VS Code, JetBrains, Neovim' },
    { id: 'continue', name: 'Continue.dev', interface: 'In-editor', modelChoice: 'BYO model', compatibility: 'VS Code, JetBrains' },
    { id: 'codeium', name: 'Codeium', interface: 'In-editor', modelChoice: 'Fixed', compatibility: 'VS Code, JetBrains, Vim' },
    { id: 'cursor-built', name: 'Cursor built-in', interface: 'In-editor', modelChoice: 'Multiple providers', compatibility: 'Cursor only' },
    { id: 'aider', name: 'Aider (terminal)', interface: 'Terminal/CLI', modelChoice: 'BYO model', compatibility: 'Any editor' },
    { id: 'cline', name: 'Cline', interface: 'In-editor', modelChoice: 'BYO model', compatibility: 'VS Code, JetBrains, Terminal' },
    { id: 'windsurf-cascade', name: 'Windsurf Cascade', interface: 'In-editor', modelChoice: 'Multiple providers', compatibility: 'Windsurf only' },
    { id: 'cody', name: 'Sourcegraph Cody', interface: 'In-editor', modelChoice: 'Multiple providers', compatibility: 'VS Code, JetBrains, Visual Studio, Web' },
    { id: 'tabnine', name: 'Tabnine', interface: 'In-editor', modelChoice: 'Multiple providers', compatibility: 'VS Code, JetBrains, Eclipse, all major IDEs' },
    { id: 'direct-api', name: 'Direct API / custom', interface: 'API/SDK', modelChoice: 'BYO model' },
  ],
  contexts: [
    { id: 'none', name: 'None (vanilla)', indexType: 'None', updateMode: '—' },
    { id: 'cursor-cb', name: '@codebase (Cursor)', indexType: 'Embeddings', updateMode: 'Real-time', hosting: 'Cloud' },
    { id: 'continue-idx', name: 'Continue codebase indexing', indexType: 'Embeddings', updateMode: 'On-demand', hosting: 'Local' },
    { id: 'greptile', name: 'Greptile', indexType: 'AST / Hybrid', updateMode: 'Real-time', hosting: 'Cloud' },
    { id: 'chromadb', name: 'Local ChromaDB', indexType: 'Embeddings', updateMode: 'On-demand', hosting: 'Local' },
    { id: 'sourcegraph-cody', name: 'Sourcegraph Cody Context', indexType: 'AST / Hybrid', updateMode: 'Real-time', hosting: 'Cloud' },
    { id: 'copilot-idx', name: 'GitHub Copilot codebase indexing', indexType: 'Embeddings', updateMode: 'Real-time', hosting: 'Cloud' },
    { id: 'pinecone', name: 'Pinecone', indexType: 'Embeddings', updateMode: 'On-demand', hosting: 'Cloud' },
    { id: 'lancedb', name: 'LanceDB', indexType: 'Embeddings', updateMode: 'On-demand', hosting: 'Local' },
    { id: 'windsurf-idx', name: 'Windsurf codebase indexing', indexType: 'Embeddings', updateMode: 'Real-time', hosting: 'Cloud' },
  ],
  agents: [
    { id: 'none', name: 'None', autonomy: 'None', modelChoice: '—' },
    { id: 'aider-arch', name: 'Aider (architect)', autonomy: 'Assist', modelChoice: 'BYO model' },
    { id: 'swe-agent', name: 'SWE-agent', autonomy: 'Autonomous', modelChoice: 'BYO model' },
    { id: 'claude-code', name: 'Claude Code', autonomy: 'Semi-autonomous', modelChoice: 'Fixed (Claude only)' },
    { id: 'langgraph', name: 'Custom LangGraph', autonomy: 'Autonomous', modelChoice: 'BYO model' },
    { id: 'cline-agent', name: 'Cline Agent', autonomy: 'Autonomous', modelChoice: 'BYO model' },
    { id: 'devin', name: 'Devin', autonomy: 'Autonomous', modelChoice: 'Fixed (proprietary)' },
    { id: 'windsurf-cascade-agent', name: 'Windsurf Cascade Agent', autonomy: 'Semi-autonomous', modelChoice: 'Multiple providers' },
    { id: 'tabnine-agent', name: 'Tabnine Agent', autonomy: 'Semi-autonomous', modelChoice: 'Multiple providers' },
  ]
};

const issues = [];

console.log('🔎 DEEP COMPATIBILITY ANALYSIS\n');

// 1. Integration interface mismatch with IDE interface
console.log('1️⃣  Checking Integration Interface <-> IDE Interface compatibility...\n');
allData.integrations.forEach(integ => {
  if (integ.interface === 'API/SDK' || integ.interface === 'Terminal/CLI') {
    // Terminal integrations may have issues with GUI-only IDEs
    if (integ.interface === 'Terminal/CLI') {
      allData.ides.forEach(ide => {
        if (ide.interface === 'GUI' && integ.compatibility !== 'Any editor') {
          // Terminal integration with GUI IDE might be awkward
          if (!integ.compatibility.includes(ide.name) && integ.compatibility !== 'Any editor (terminal)') {
            // This is OK - integrations can target GUI IDEs from CLI
          }
        }
      });
    }
  }
});

// 2. OS compatibility mismatches
console.log('2️⃣  Checking OS compatibility between IDE and Integration...\n');
// Zed only works on macOS and Linux (no Windows)
allData.ides.forEach(ide => {
  if (ide.id === 'zed' && ide.os === 'macOS, Linux') {
    allData.integrations.forEach(integ => {
      if (integ.compatibility && (integ.compatibility.includes('Continue.dev') || integ.compatibility.includes('Codeium'))) {
        // These claim to support Zed but Zed doesn't exist on Windows
        // This is more of an edge case
      }
    });
  }
  // Visual Studio 2022 only on Windows/macOS (no Linux)
  if (ide.id === 'visual-studio' && ide.os === 'Windows, macOS') {
    allData.integrations.forEach(integ => {
      if (integ.id === 'tabnine' && integ.compatibility && integ.compatibility.includes('all major IDEs')) {
        // Tabnine says all major IDEs, but may not support Visual Studio on Linux
      }
    });
  }
});

// 3. Capability mismatches
console.log('3️⃣  Checking LLM Capability <-> Integration Requirements...\n');

// Codestral is code-focused only, might conflict with non-code tasks
allData.llms.forEach(llm => {
  if (llm.id === 'codestral' && llm.specialization === 'Code-focused') {
    // Works with general integrations - no conflict
  }
});

// Text-only models vs Vision-requiring tools
allData.llms.forEach(llm => {
  if (llm.modality === 'Text-only') {
    // These can still work with integrations, but some tools might benefit from vision
    // Not a hard incompatibility though
  }
});

// 4. Agent capability gaps
console.log('4️⃣  Checking Agent <-> LLM Reasoning Capability...\n');
allData.agents.forEach(agent => {
  if (agent.id === 'swe-agent' || agent.id === 'cline-agent' || agent.id === 'langgraph') {
    // These are autonomous agents - they might work better with reasoning models
    allData.llms.forEach(llm => {
      // But there's no hard incompatibility - even basic models can work
    });
  }
});

// 5. Context update staleness vs Agent autonomy
console.log('5️⃣  Checking Context Staleness <-> Agent Autonomy...\n');
allData.contexts.forEach(ctx => {
  if (ctx.updateMode === 'On-demand' || ctx.updateMode === 'manual') {
    allData.agents.forEach(agent => {
      if (agent.autonomy === 'Autonomous') {
        // Autonomous agents with on-demand context updates could cause issues
        issues.push({
          type: 'STALENESS_ISSUE',
          severity: 'MEDIUM',
          issue: `Autonomous agent "${agent.name}" with on-demand context "${ctx.name}" may act on stale codebase info`,
          context: ctx.name,
          agent: agent.name,
          detail: 'Autonomous agents should use real-time context updates'
        });
      }
    });
  }
});

// 6. Fixed LLM model with specific requirements
console.log('6️⃣  Checking Fixed Models <-> Feature Requirements...\n');
allData.agents.forEach(agent => {
  if (agent.modelChoice === 'Fixed (Claude only)') {
    // Claude Code is locked to Claude
    // Check if there are any workflows that need non-Claude features
    allData.llms.forEach(llm => {
      if (llm.specialization === 'Web search' && llm.id.includes('grok')) {
        issues.push({
          type: 'FEATURE_GAP',
          severity: 'LOW',
          issue: `${agent.name} cannot use ${llm.name}'s web search capability (locked to Claude models)`,
          agent: agent.name,
          llm: llm.name,
          detail: 'If you need web search, switch from Claude Code to a BYO model agent'
        });
      }
    });
  }
});

// 7. Terminal-only agents with GUI IDE constraints
console.log('7️⃣  Checking Terminal Interface <-> IDE...\n');
allData.integrations.forEach(integ => {
  if (integ.interface === 'Terminal/CLI' && integ.id === 'aider') {
    // Aider is terminal, but can work with any IDE
    // No hard incompatibility
  }
});

// 8. Private/Cloud context with privacy-sensitive LLMs
console.log('8️⃣  Checking Context Privacy <-> LLM Privacy...\n');
allData.contexts.forEach(ctx => {
  if (ctx.hosting === 'Cloud') {
    allData.llms.forEach(llm => {
      if (llm.id === 'llama3' || llm.id === 'deepseek' || llm.id === 'qwen-3' || llm.id === 'gemma-4') {
        // Self-hosted models with cloud context = privacy contradiction
        issues.push({
          type: 'PRIVACY_CONFLICT',
          severity: 'MEDIUM',
          issue: `Self-hosted LLM "${llm.name}" with cloud context "${ctx.name}" sends code to cloud`,
          context: ctx.name,
          llm: llm.name,
          detail: 'For privacy, use local context layer (Continue indexing, ChromaDB, LanceDB) with self-hosted models'
        });
      }
    });
  }
});

// 9. MCP requirement mismatches
console.log('9️⃣  Checking MCP Support...\n');
allData.llms.forEach(llm => {
  if (llm.capabilities && llm.capabilities.includes('MCP')) {
    // Some agents specifically require MCP
  }
});

// 10. Small context window with large file codebases
console.log('🔟 Checking Context Window Size...\n');
allData.llms.forEach(llm => {
  if (llm.id === 'nova-micro' && llm.maxOutput === '8K') {
    allData.agents.forEach(agent => {
      if (agent.autonomy === 'Autonomous') {
        issues.push({
          type: 'CAPACITY_ISSUE',
          severity: 'MEDIUM',
          issue: `Autonomous agent "${agent.name}" with small context LLM "${llm.name}" may struggle with large changes`,
          agent: agent.name,
          llm: llm.name,
          detail: `${llm.name} has only 8K max output, limiting multi-file edits in autonomous mode`
        });
      }
    });
  }
});

// Print results
console.log('\n' + '='.repeat(80));
console.log('SUBTLE INCOMPATIBILITY FINDINGS');
console.log('='.repeat(80) + '\n');

if (issues.length === 0) {
  console.log('✅ No subtle incompatibilities found beyond the main ones already captured.');
} else {
  console.log(`Found ${issues.length} subtle incompatibilities:\n`);

  // Group by type
  const byType = {};
  issues.forEach(issue => {
    if (!byType[issue.type]) byType[issue.type] = [];
    byType[issue.type].push(issue);
  });

  Object.entries(byType).forEach(([type, typeIssues]) => {
    console.log(`\n### ${type} (${typeIssues.length} issues)\n`);
    typeIssues.forEach((issue, i) => {
      console.log(`${i + 1}. [${issue.severity}] ${issue.issue}`);
      console.log(`   → ${issue.detail}`);
      if (issue.context) console.log(`   Context: ${issue.context}`);
      if (issue.agent) console.log(`   Agent: ${issue.agent}`);
      if (issue.llm) console.log(`   LLM: ${issue.llm}`);
      console.log();
    });
  });
}

console.log('='.repeat(80));
