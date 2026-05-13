// Analyze actual product incompatibilities across all layers
const LAYERS = [
  {
    id: 'ide',
    name: 'IDE / Editor',
    options: [
      { id: 'vscode', name: 'VS Code' },
      { id: 'cursor', name: 'Cursor' },
      { id: 'zed', name: 'Zed' },
      { id: 'neovim', name: 'Neovim' },
      { id: 'jetbrains', name: 'JetBrains' },
      { id: 'windsurf', name: 'Windsurf' },
      { id: 'fleet', name: 'JetBrains Fleet' },
      { id: 'replit', name: 'Replit' },
      { id: 'visual-studio', name: 'Visual Studio 2022' },
      { id: 'sublime-text', name: 'Sublime Text' },
      { id: 'helix', name: 'Helix' },
    ],
  },
  {
    id: 'llm',
    name: 'LLM Provider / Model',
    options: [
      { id: 'claude-sonnet', name: 'Claude Sonnet 4.6', provider: 'Anthropic' },
      { id: 'claude-opus', name: 'Claude Opus 4.7', provider: 'Anthropic' },
      { id: 'claude-haiku', name: 'Claude Haiku 4.5', provider: 'Anthropic' },
      { id: 'gpt4o', name: 'GPT-4o', provider: 'OpenAI' },
      { id: 'gemini', name: 'Gemini 2.x', provider: 'Google' },
      { id: 'llama3', name: 'Llama 3', provider: 'Meta' },
      { id: 'deepseek', name: 'Deepseek', provider: 'DeepSeek' },
      { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', provider: 'DeepSeek' },
      { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', provider: 'DeepSeek' },
    ],
  },
  {
    id: 'integration',
    name: 'Integration Layer',
    options: [
      { id: 'copilot', name: 'GitHub Copilot', compatibility: 'VS Code, JetBrains, Neovim', modelChoice: 'Multiple providers' },
      { id: 'continue', name: 'Continue.dev', compatibility: 'VS Code, JetBrains', modelChoice: 'BYO model' },
      { id: 'codeium', name: 'Codeium', compatibility: 'VS Code, JetBrains, Vim', modelChoice: 'Fixed' },
      { id: 'cursor-built', name: 'Cursor built-in', compatibility: 'Cursor only', modelChoice: 'Multiple providers' },
      { id: 'aider', name: 'Aider (terminal)', compatibility: 'Any editor', modelChoice: 'BYO model' },
      { id: 'cline', name: 'Cline', compatibility: 'VS Code, JetBrains, Terminal', modelChoice: 'BYO model' },
      { id: 'windsurf-cascade', name: 'Windsurf Cascade', compatibility: 'Windsurf only', modelChoice: 'Multiple providers' },
      { id: 'cody', name: 'Sourcegraph Cody', compatibility: 'VS Code, JetBrains, Visual Studio, Web', modelChoice: 'Multiple providers' },
      { id: 'tabnine', name: 'Tabnine', compatibility: 'VS Code, JetBrains, Eclipse, all major IDEs', modelChoice: 'Multiple providers' },
    ],
  },
  {
    id: 'context',
    name: 'Context / RAG Layer',
    options: [
      { id: 'none', name: 'None (vanilla)' },
      { id: 'cursor-cb', name: '@codebase (Cursor)', hosting: 'Cloud' },
      { id: 'continue-idx', name: 'Continue codebase indexing', hosting: 'Local' },
      { id: 'greptile', name: 'Greptile', hosting: 'Cloud' },
      { id: 'chromadb', name: 'Local ChromaDB', hosting: 'Local' },
    ],
  },
  {
    id: 'agent',
    name: 'Agent / Orchestration Layer',
    options: [
      { id: 'none', name: 'None' },
      { id: 'aider-arch', name: 'Aider (architect)', modelChoice: 'BYO model' },
      { id: 'swe-agent', name: 'SWE-agent', modelChoice: 'BYO model' },
      { id: 'claude-code', name: 'Claude Code', modelChoice: 'Fixed (Claude only)' },
      { id: 'devin', name: 'Devin', modelChoice: 'Fixed (proprietary)' },
    ],
  },
];

const incompatibilities = [];

// 1. INTEGRATION + IDE incompatibilities
console.log('🔍 Checking Integration Layer <-> IDE compatibilities...\n');
const integrations = LAYERS.find(l => l.id === 'integration').options;
const ides = LAYERS.find(l => l.id === 'ide').options.map(i => i.id);

integrations.forEach(integ => {
  if (integ.compatibility && integ.compatibility !== 'Any editor (terminal)' && integ.compatibility !== 'Any editor (web UI)') {
    const compatible = integ.compatibility.split(', ').map(s => s.trim().toLowerCase());
    ides.forEach(ide => {
      let matches = false;
      if (compatible.some(c => c.includes('vscode') || c === 'code')) matches = ides.includes('vscode');
      if (compatible.some(c => c.includes('jetbrains'))) matches = ides.includes('jetbrains');
      if (compatible.some(c => c.includes('neovim'))) matches = ides.includes('neovim');
      if (compatible.some(c => c.includes('cursor'))) matches = ide === 'cursor';
      if (compatible.some(c => c.includes('windsurf'))) matches = ide === 'windsurf';
      if (compatible.some(c => c.includes('vs code'))) matches = ide === 'vscode';

      // Simple check: if integration says it supports an IDE, it should work
      const ideNames = {
        vscode: 'VS Code',
        cursor: 'Cursor',
        jetbrains: 'JetBrains',
        neovim: 'Neovim',
        windsurf: 'Windsurf',
        zed: 'Zed',
      };

      if (integ.compatibility.includes(ideNames[ide])) {
        // Compatible
      } else if (integ.compatibility === 'Cursor only' && ide !== 'cursor') {
        incompatibilities.push({
          layer1: 'integration',
          product1: integ.name,
          layer2: 'ide',
          product2: LAYERS.find(l => l.id === 'ide').options.find(i => i.id === ide).name,
          issue: `${integ.name} only works with Cursor`
        });
      } else if (integ.compatibility === 'Windsurf only' && ide !== 'windsurf') {
        incompatibilities.push({
          layer1: 'integration',
          product1: integ.name,
          layer2: 'ide',
          product2: LAYERS.find(l => l.id === 'ide').options.find(i => i.id === ide).name,
          issue: `${integ.name} only works with Windsurf`
        });
      }
    });
  }
});

// 2. AGENT + LLM incompatibilities
console.log('\n🔍 Checking Agent Layer <-> LLM compatibilities...\n');
const agents = LAYERS.find(l => l.id === 'agent').options;
const llms = LAYERS.find(l => l.id === 'llm').options;

agents.forEach(agent => {
  if (agent.modelChoice === 'Fixed (Claude only)') {
    llms.forEach(llm => {
      if (!llm.provider || llm.provider !== 'Anthropic') {
        incompatibilities.push({
          layer1: 'agent',
          product1: agent.name,
          layer2: 'llm',
          product2: llm.name,
          issue: `${agent.name} only works with Claude models, not ${llm.name}`
        });
      }
    });
  }
  if (agent.modelChoice === 'Fixed (proprietary)') {
    incompatibilities.push({
      layer1: 'agent',
      product1: agent.name,
      layer2: 'llm',
      product2: 'Custom LLMs',
      issue: `${agent.name} uses proprietary model, cannot use custom LLMs`
    });
  }
});

// 3. CONTEXT + INTEGRATION incompatibilities
console.log('\n🔍 Checking Context Layer <-> Integration compatibilities...\n');
const contexts = LAYERS.find(l => l.id === 'context').options;

contexts.forEach(ctx => {
  if (ctx.id === 'cursor-cb') {
    // @codebase only works with Cursor integration
    integrations.forEach(integ => {
      if (integ.id !== 'cursor-built') {
        incompatibilities.push({
          layer1: 'context',
          product1: ctx.name,
          layer2: 'integration',
          product2: integ.name,
          issue: `${ctx.name} only works with Cursor built-in integration`
        });
      }
    });
  }
  if (ctx.id === 'continue-idx') {
    // Continue indexing only works with Continue integration
    integrations.forEach(integ => {
      if (integ.id !== 'continue') {
        incompatibilities.push({
          layer1: 'context',
          product1: ctx.name,
          layer2: 'integration',
          product2: integ.name,
          issue: `${ctx.name} only works with Continue.dev integration`
        });
      }
    });
  }
});

// Print results
console.log('\n' + '='.repeat(80));
console.log('INCOMPATIBILITY REPORT');
console.log('='.repeat(80) + '\n');

if (incompatibilities.length === 0) {
  console.log('✅ No incompatibilities found!');
} else {
  console.log(`Found ${incompatibilities.length} incompatibilities:\n`);

  incompatibilities.forEach((inc, i) => {
    console.log(`${i + 1}. ⚠️  ${inc.issue}`);
    console.log(`   Layer 1: ${inc.layer1} → ${inc.product1}`);
    console.log(`   Layer 2: ${inc.layer2} → ${inc.product2}`);
    console.log();
  });
}

console.log('='.repeat(80));
