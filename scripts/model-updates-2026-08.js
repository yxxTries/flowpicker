// Verified model data for the August 2026 refresh of the `llm` layer.
//
// SOURCING RULE: every value here must come from the provider's own pricing
// page, model docs, model card, or launch announcement. Aggregator sites
// (aipricing.guru, pricepertoken, benchlm, felloai, gate.ai, edenai, ...) are
// not acceptable — during this refresh several were found publishing model
// names, dates and prices that do not exist. Each block records the primary
// source it was taken from.
//
// Applied by scripts/apply-model-updates.js.

module.exports = {
  // ---------------------------------------------------------------------
  // Rows that already existed but held wrong values.
  // Only the changed keys are listed; everything else is left alone.
  // ---------------------------------------------------------------------
  corrections: {
    // Source: https://platform.claude.com/docs/en/about-claude/models/overview
    //         https://support.claude.com/en/articles/12138966-release-notes
    // Was: released Nov 2025 (that is Opus 4.5's date), $15/$75, 200K context.
    // Opus 4.7 is $5/$25 with a 1M window — the table overstated price 3x and
    // understated context 5x.
    'claude-opus': {
      released: 'Apr 2026',
      knowledgeCutoff: 'Jan 2026',
      priceInput: '$5',
      priceOutput: '$25',
      priceCache: '$0.50',
      contextWindow: '1M+',
      contextTier: '500K+',
      maxOutput: '128K',
      capabilities: 'Vision, Tool use, Adaptive thinking, Effort control, Streaming, Structured output, Prompt caching, Task budgets',
      docsUrl: 'https://platform.claude.com/docs/en/about-claude/models/overview',
    },

    // Source: same as above. Was: released Sep 2025 (that is Sonnet 4.5's
    // date), cutoff Apr 2024 (off by ~16 months), 200K context.
    'claude-sonnet': {
      released: 'Feb 2026',
      knowledgeCutoff: 'Aug 2025',
      contextWindow: '1M+',
      contextTier: '500K+',
      maxOutput: '128K',
      capabilities: 'Vision, Tool use, Adaptive thinking, Effort control, Streaming, Structured output, Prompt caching',
      docsUrl: 'https://platform.claude.com/docs/en/about-claude/models/overview',
    },

    // Price, context and dates were already right; only the docs URL had moved.
    'claude-haiku': {
      docsUrl: 'https://platform.claude.com/docs/en/about-claude/models/overview',
    },

    // --- OpenAI ---------------------------------------------------------
    // Source: https://developers.openai.com/api/docs/pricing (verified directly)
    // The row still carried o3's launch pricing. OpenAI cut o3 ~80% in June
    // 2025; the table was 5x too expensive.
    'openai-o3': {
      priceInput: '$2',
      priceOutput: '$8',
      priceCache: '$0.50',
      maxOutput: '100K',
    },

    // Source: https://developers.openai.com/api/docs/pricing (verified directly)
    // modelId used dashes where OpenAI uses a dot — "gpt-5-4" 404s against the
    // API. Price was also stale ($3 vs the listed $2.50).
    'gpt-5-4': {
      modelId: 'gpt-5.4',
      priceInput: '$2.50',
      maxOutput: '128K',
    },

    // Same dash-for-dot defect; price confirmed correct at $5/$30.
    'gpt-5-5': {
      modelId: 'gpt-5.5',
      maxOutput: '128K',
    },
    'gpt-5-5-pro': {
      modelId: 'gpt-5.5-pro',
      maxOutput: '128K',
    },

    // Both gpt-oss weights carried a bare-year cutoff, which the date
    // validator can't order. Source: developers.openai.com model pages.
    'gpt-oss-120b': { knowledgeCutoff: 'Jun 2024' },
    'gpt-oss-20b': { knowledgeCutoff: 'Jun 2024' },

    // --- Google ---------------------------------------------------------
    // Source: https://ai.google.dev/gemini-api/docs/models + /pricing
    // (both verified directly). Gemini 3 Flash is a *preview* id and costs
    // 3.3x/5x what the table claimed.
    'gemini-3-flash': {
      released: 'Dec 2025',
      modelId: 'gemini-3-flash-preview',
      priceInput: '$0.50',
      priceOutput: '$3',
      priceCache: '$0.05',
      maxOutput: '64K',
    },
    'gemma-4': {
      released: 'Mar 2026',
      modelId: 'gemma-4-31b-it',
      knowledgeCutoff: 'Jan 2025',
    },
    'gemini-2-5-flash': {
      released: 'Jun 2025',
      knowledgeCutoff: 'Jan 2025',
      maxOutput: '64K',
    },

    // --- xAI ------------------------------------------------------------
    // Source: https://docs.x.ai/docs/models (verified directly). Grok 4.20
    // is a 1M-context model, not 2M as recorded.
    'grok-4-20': {
      contextWindow: '1M+',
      contextTier: '500K+',
      priceCache: '$0.20',
      modality: 'Multimodal (vision)',
    },
    'grok-4-3': {
      priceCache: '$0.20',
      modality: 'Multimodal (vision)',
    },

    // --- Meta -----------------------------------------------------------
    // Source: Meta model cards / Hugging Face model ids. The stored modelIds
    // were short names that don't resolve against any inference provider.
    'llama3': {
      modelId: 'meta-llama/Llama-3.3-70B-Instruct',
      contextWindow: '128K',
      contextTier: '32K-128K',
      knowledgeCutoff: 'Dec 2023',
      modality: 'Text-only',
    },
    'llama-4': {
      released: 'Apr 2025',
      modelId: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct',
      knowledgeCutoff: 'Aug 2024',
      modality: 'Multimodal (vision)',
    },
    'llama-4-scout': {
      modelId: 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
      // Was cutoff Aug 2025 against an Apr 2025 release — impossible.
      knowledgeCutoff: 'Aug 2024',
      modality: 'Multimodal (vision)',
      // Open weights that are also sold hosted, which is why it carries a price.
      hosting: 'Closed/API + Self-host',
    },
  },

  // ---------------------------------------------------------------------
  // Rows to remove: models that do not exist, or that have been retired.
  // ---------------------------------------------------------------------
  deletions: [
    {
      id: 'claude-haiku-4-5-fast',
      reason:
        'No such model. Anthropic has no `claude-haiku-4-5-fast` model ID — it is absent from the ' +
        'official model list. Fast mode is a request parameter (speed: "fast") available only on ' +
        'Claude Opus 5 and Opus 4.8, not a separate Haiku SKU. The row also carried an invented ' +
        'knowledge cutoff (Oct 2025 vs the real Haiku 4.5 cutoff of Feb 2025) and an invented ' +
        'SWE-bench score. Source: https://platform.claude.com/docs/en/about-claude/models/overview',
    },
    {
      id: 'gpt-5-1-codex',
      reason:
        'Shut down by OpenAI on 2026-07-23 (deprecated 2026-04-22); recommended replacement is ' +
        'gpt-5.6-sol. Source: https://developers.openai.com/api/docs/deprecations',
    },
    {
      id: 'gpt-5-1-codex-max',
      reason:
        'Shut down by OpenAI on 2026-07-23 alongside gpt-5.1-codex; recommended replacement is ' +
        'gpt-5.6-sol. Source: https://developers.openai.com/api/docs/deprecations',
    },
    {
      id: 'gemini-3-pro',
      reason:
        'Shut down by Google — absent from the available-models list and shown under Previous ' +
        'Models as "Shut down". Superseded by Gemini 3.1 Pro. ' +
        'Source: https://ai.google.dev/gemini-api/docs/models',
    },
    {
      id: 'gemini',
      reason:
        'The row tracked gemini-2.0-pro, which is no longer offered — the current 2.x models are ' +
        'Gemini 2.5 Pro and 2.5 Flash, both already separate rows. ' +
        'Source: https://ai.google.dev/gemini-api/docs/models',
    },
    {
      id: 'grok-fast',
      reason:
        'Grok 4.1 Fast (grok-4-1-fast-reasoning) was retired in xAI\'s May 2026 model cleanup and ' +
        'is absent from the current model list. Source: https://docs.x.ai/docs/models',
    },
  ],

  // ---------------------------------------------------------------------
  // Models missing from the table entirely.
  // ---------------------------------------------------------------------
  additions: [
    {
      id: 'claude-fable-5',
      name: 'Claude Fable 5',
      attrs: {
        provider: 'Anthropic',
        hosting: 'Closed/API',
        modelId: 'claude-fable-5',
        priceTier: 'Premium',
        priceInput: '$10',
        priceOutput: '$50',
        priceCache: '$1',
        contextWindow: '1M+',
        contextTier: '500K+',
        maxOutput: '128K',
        modality: 'Multimodal (vision)',
        capabilities:
          'Vision, Tool use, Always-on adaptive thinking, Effort control (low-max), Streaming, Structured output, Prompt caching, Task budgets, Compaction',
        speedTier: 'Slow/Reasoning',
        latency: 'high',
        benchmark: 'Anthropic’s most capable widely released model',
        sweBench: '—',
        humanEval: '—',
        mmlu: '—',
        bestFor: 'Long-running autonomous agents, the hardest reasoning and long-horizon engineering work',
        knowledgeCutoff: 'Jan 2026',
        released: 'Jun 2026',
        websiteUrl: 'https://www.anthropic.com/news/claude-fable-5-mythos-5',
        docsUrl: 'https://platform.claude.com/docs/en/about-claude/models/overview',
      },
    },
    {
      id: 'claude-opus-5',
      name: 'Claude Opus 5',
      attrs: {
        provider: 'Anthropic',
        hosting: 'Closed/API',
        modelId: 'claude-opus-5',
        priceTier: 'Premium',
        priceInput: '$5',
        priceOutput: '$25',
        priceCache: '$0.50',
        contextWindow: '1M+',
        contextTier: '500K+',
        maxOutput: '128K',
        modality: 'Multimodal (vision)',
        capabilities:
          'Vision, Tool use, Adaptive thinking (on by default), Effort control (low-max), Fast mode, Streaming, Structured output, Prompt caching, Task budgets, Mid-conversation tool changes',
        speedTier: 'Standard',
        latency: 'medium',
        benchmark: 'Near-frontier intelligence at half Fable 5 pricing',
        sweBench: '—',
        humanEval: '—',
        mmlu: '—',
        bestFor: 'Complex agentic coding, multi-file refactors and enterprise work',
        knowledgeCutoff: 'May 2026',
        released: 'Jul 2026',
        websiteUrl: 'https://www.anthropic.com/news/claude-opus-5',
        docsUrl: 'https://platform.claude.com/docs/en/about-claude/models/overview',
      },
    },
    {
      id: 'claude-sonnet-5',
      name: 'Claude Sonnet 5',
      attrs: {
        provider: 'Anthropic',
        hosting: 'Closed/API',
        modelId: 'claude-sonnet-5',
        priceTier: 'Mid',
        // Launched at introductory $2/$10; Anthropic made that permanent on
        // 2026-08-10, so this is the standing rate, not a promo.
        priceInput: '$2',
        priceOutput: '$10',
        priceCache: '$0.20',
        contextWindow: '1M+',
        contextTier: '500K+',
        maxOutput: '128K',
        modality: 'Multimodal (vision)',
        capabilities:
          'Vision, Tool use, Adaptive thinking, Effort control (low-max), Streaming, Structured output, Prompt caching, Task budgets',
        speedTier: 'Fast',
        latency: 'fast',
        benchmark: 'Near-Opus quality on coding and agentic work at Sonnet cost',
        sweBench: '—',
        humanEval: '—',
        mmlu: '—',
        bestFor: 'Day-to-day coding and agentic loops where speed and cost both matter',
        knowledgeCutoff: 'Jan 2026',
        released: 'Jun 2026',
        websiteUrl: 'https://www.anthropic.com/news/claude-sonnet-5',
        docsUrl: 'https://platform.claude.com/docs/en/about-claude/models/overview',
      },
    },
    {
      id: 'claude-opus-4-8',
      name: 'Claude Opus 4.8',
      attrs: {
        provider: 'Anthropic',
        hosting: 'Closed/API',
        modelId: 'claude-opus-4-8',
        priceTier: 'Premium',
        priceInput: '$5',
        priceOutput: '$25',
        priceCache: '$0.50',
        contextWindow: '1M+',
        contextTier: '500K+',
        maxOutput: '128K',
        modality: 'Multimodal (vision)',
        capabilities:
          'Vision, Tool use, Adaptive thinking, Effort control (low-max), Fast mode, Streaming, Structured output, Prompt caching, Task budgets, Mid-conversation system prompts',
        speedTier: 'Standard',
        latency: 'medium',
        benchmark: 'Strongest Opus 4 series model on long-horizon agentic work',
        sweBench: '—',
        humanEval: '—',
        mmlu: '—',
        bestFor: 'Long-horizon agentic execution, knowledge work and memory-backed agents',
        knowledgeCutoff: 'Jan 2026',
        released: 'May 2026',
        websiteUrl: 'https://www.anthropic.com/claude/opus',
        docsUrl: 'https://platform.claude.com/docs/en/about-claude/models/overview',
      },
    },
    {
      id: 'claude-opus-4-6',
      name: 'Claude Opus 4.6',
      attrs: {
        provider: 'Anthropic',
        hosting: 'Closed/API',
        modelId: 'claude-opus-4-6',
        priceTier: 'Premium',
        priceInput: '$5',
        priceOutput: '$25',
        priceCache: '$0.50',
        contextWindow: '1M+',
        contextTier: '500K+',
        maxOutput: '128K',
        modality: 'Multimodal (vision)',
        capabilities:
          'Vision, Tool use, Adaptive thinking, Extended thinking (deprecated), Effort control, Streaming, Structured output, Prompt caching',
        speedTier: 'Standard',
        latency: 'medium',
        benchmark: 'First Opus with adaptive thinking and a 1M context window',
        sweBench: '—',
        humanEval: '—',
        mmlu: '—',
        bestFor: 'Teams pinned to the 4.6 generation for reproducibility',
        knowledgeCutoff: 'May 2025',
        released: 'Feb 2026',
        websiteUrl: 'https://www.anthropic.com/claude/opus',
        docsUrl: 'https://platform.claude.com/docs/en/about-claude/models/overview',
      },
    },

    // --- OpenAI ---------------------------------------------------------
    // The GPT-5.6 family shipped 2026-07-09 and is the single biggest reason
    // this table went stale. Prices below are the CURRENT rates: OpenAI cut
    // Luna 80% and Terra 20% on 2026-07-30, so launch-day articles quoting
    // $1/$6 and $2.50/$15 are out of date.
    // NOTE: for all three, prompts over 272K input tokens are billed at 2x
    // input / 1.5x output for the whole request — a single price pair can't
    // express that, so these are the short-context rates.
    // Source: https://developers.openai.com/api/docs/pricing (verified directly)
    {
      id: 'gpt-5-6-sol',
      name: 'GPT-5.6 Sol',
      attrs: {
        provider: 'OpenAI',
        hosting: 'Closed/API',
        modelId: 'gpt-5.6-sol',
        priceTier: 'Premium',
        priceInput: '$5',
        priceOutput: '$30',
        priceCache: '$0.50',
        contextWindow: '1M+',
        contextTier: '500K+',
        maxOutput: '128K',
        modality: 'Multimodal (vision)',
        capabilities:
          'Vision, Tool use, Reasoning effort control (none-max), Fast mode, Streaming, Structured output, Prompt caching',
        speedTier: 'Slow/Reasoning',
        latency: 'high',
        benchmark: 'OpenAI’s frontier tier; SWE-bench no longer reported',
        sweBench: '—',
        humanEval: '—',
        mmlu: '—',
        bestFor: 'Frontier coding, agentic work and complex professional tasks',
        knowledgeCutoff: 'Feb 2026',
        released: 'Jul 2026',
        websiteUrl: 'https://openai.com/index/gpt-5-6/',
        docsUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-sol',
      },
    },
    {
      id: 'gpt-5-6-terra',
      name: 'GPT-5.6 Terra',
      attrs: {
        provider: 'OpenAI',
        hosting: 'Closed/API',
        modelId: 'gpt-5.6-terra',
        priceTier: 'Mid',
        priceInput: '$2',
        priceOutput: '$12',
        priceCache: '$0.20',
        contextWindow: '1M+',
        contextTier: '500K+',
        maxOutput: '128K',
        modality: 'Multimodal (vision)',
        capabilities:
          'Vision, Tool use, Reasoning effort control, Streaming, Structured output, Prompt caching',
        speedTier: 'Standard',
        latency: 'medium',
        benchmark: 'Balanced tier of the GPT-5.6 family',
        sweBench: '—',
        humanEval: '—',
        mmlu: '—',
        bestFor: 'Everyday work where intelligence and cost both matter',
        knowledgeCutoff: 'Feb 2026',
        released: 'Jul 2026',
        websiteUrl: 'https://openai.com/index/gpt-5-6/',
        docsUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-terra',
      },
    },
    {
      id: 'gpt-5-6-luna',
      name: 'GPT-5.6 Luna',
      attrs: {
        provider: 'OpenAI',
        hosting: 'Closed/API',
        modelId: 'gpt-5.6-luna',
        priceTier: 'Budget',
        priceInput: '$0.20',
        priceOutput: '$1.20',
        priceCache: '$0.02',
        contextWindow: '1M+',
        contextTier: '500K+',
        maxOutput: '128K',
        modality: 'Multimodal (vision)',
        capabilities:
          'Vision, Tool use, Reasoning effort control, Streaming, Structured output, Prompt caching',
        speedTier: 'Fast',
        latency: 'fast',
        benchmark: 'Cheapest 1M-context model in the GPT-5.6 family',
        sweBench: '—',
        humanEval: '—',
        mmlu: '—',
        bestFor: 'High-volume, cost-sensitive workloads that still need a large context window',
        knowledgeCutoff: 'Feb 2026',
        released: 'Jul 2026',
        websiteUrl: 'https://openai.com/index/gpt-5-6/',
        docsUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-luna',
      },
    },
    {
      // Fills the coding slot left by gpt-5.1-codex / -codex-max, both retired.
      id: 'gpt-5-3-codex',
      name: 'GPT-5.3 Codex',
      attrs: {
        provider: 'OpenAI',
        hosting: 'Closed/API',
        modelId: 'gpt-5.3-codex',
        priceTier: 'Mid',
        priceInput: '$1.75',
        priceOutput: '$14',
        priceCache: '$0.175',
        contextWindow: '400K',
        contextTier: '128K-500K',
        maxOutput: '128K',
        modality: 'Multimodal (vision)',
        capabilities:
          'Agentic coding, Steerable long-running tasks, Responses API, Vision, Tool use, Structured output',
        speedTier: 'Slow/Reasoning',
        latency: 'high',
        benchmark: 'Purpose-built for agentic coding rather than general chat',
        sweBench: '—',
        humanEval: '—',
        mmlu: '—',
        bestFor: 'Agentic coding across the Codex app, CLI, IDE and web',
        knowledgeCutoff: 'Aug 2025',
        released: 'Feb 2026',
        websiteUrl: 'https://openai.com/index/introducing-gpt-5-3-codex/',
        docsUrl: 'https://developers.openai.com/api/docs/models/gpt-5.3-codex',
      },
    },
    {
      id: 'gpt-5-4-mini',
      name: 'GPT-5.4 mini',
      attrs: {
        provider: 'OpenAI',
        hosting: 'Closed/API',
        modelId: 'gpt-5.4-mini',
        priceTier: 'Budget',
        priceInput: '$0.75',
        priceOutput: '$4.50',
        priceCache: '$0.075',
        contextWindow: '400K',
        contextTier: '128K-500K',
        maxOutput: '128K',
        modality: 'Multimodal (vision)',
        capabilities:
          'Reasoning effort control (none-xhigh), Computer use, Subagents, Vision, Tool use, Structured output',
        speedTier: 'Fast',
        latency: 'fast',
        benchmark: 'Budget tier with computer use and subagent support',
        sweBench: '—',
        humanEval: '—',
        mmlu: '—',
        bestFor: 'Coding, computer use and subagent orchestration on a budget',
        knowledgeCutoff: 'Aug 2025',
        released: 'Mar 2026',
        websiteUrl: 'https://openai.com/index/introducing-gpt-5-5/',
        docsUrl: 'https://developers.openai.com/api/docs/models/gpt-5.4-mini',
      },
    },
    {
      id: 'gpt-5-4-nano',
      name: 'GPT-5.4 nano',
      attrs: {
        provider: 'OpenAI',
        hosting: 'Closed/API',
        modelId: 'gpt-5.4-nano',
        priceTier: 'Budget',
        priceInput: '$0.20',
        priceOutput: '$1.25',
        priceCache: '$0.02',
        contextWindow: '400K',
        contextTier: '128K-500K',
        maxOutput: '128K',
        modality: 'Multimodal (vision)',
        capabilities: 'Streaming, Structured output, Tool use, Prompt caching',
        speedTier: 'Fast',
        latency: 'fast',
        benchmark: 'Cheapest OpenAI reasoning-family model',
        sweBench: '—',
        humanEval: '—',
        mmlu: '—',
        bestFor: 'Simple high-volume classification and extraction',
        knowledgeCutoff: 'Aug 2025',
        released: 'Mar 2026',
        websiteUrl: 'https://openai.com/index/introducing-gpt-5-5/',
        docsUrl: 'https://developers.openai.com/api/docs/models/gpt-5.4-nano',
      },
    },

    // --- Google ---------------------------------------------------------
    // Prices verified on https://ai.google.dev/gemini-api/docs/pricing.
    // Gemini bills a higher rate above 200K input tokens; these are the
    // short-context rates, matching how the rest of the table is stored.
    {
      id: 'gemini-3-6-flash',
      name: 'Gemini 3.6 Flash',
      attrs: {
        provider: 'Google', hosting: 'Closed/API', modelId: 'gemini-3.6-flash',
        priceTier: 'Mid', priceInput: '$1.50', priceOutput: '$7.50', priceCache: '$0.15',
        contextWindow: '1M+', contextTier: '500K+', maxOutput: '64K',
        modality: 'Multimodal (vision, audio, video)',
        capabilities: 'Vision, Audio, Video, Tool use, Thinking, Streaming, Function calling, Prompt caching, Code execution',
        speedTier: 'Fast', latency: 'fast',
        benchmark: 'Uses ~17% fewer output tokens than 3.5 Flash at higher coding scores',
        sweBench: '—', humanEval: '—', mmlu: '—',
        bestFor: 'High-throughput 1M-context work: long-context coding, computer use, agentic loops',
        knowledgeCutoff: 'Mar 2026', released: 'Jul 2026',
        websiteUrl: 'https://deepmind.google/models/gemini/flash/',
        docsUrl: 'https://ai.google.dev/gemini-api/docs/models',
      },
    },
    {
      id: 'gemini-3-5-flash',
      name: 'Gemini 3.5 Flash',
      attrs: {
        provider: 'Google', hosting: 'Closed/API', modelId: 'gemini-3.5-flash',
        priceTier: 'Mid', priceInput: '$1.50', priceOutput: '$9', priceCache: '$0.15',
        contextWindow: '1M+', contextTier: '500K+', maxOutput: '64K',
        modality: 'Multimodal (vision, audio, video)',
        capabilities: 'Vision, Audio, Video, Tool use, Thinking, Streaming, Function calling, Prompt caching',
        speedTier: 'Fast', latency: 'fast',
        benchmark: 'Previous Flash generation, superseded by 3.6 Flash',
        sweBench: '—', humanEval: '—', mmlu: '—',
        bestFor: 'Teams pinned to the 3.5 Flash generation',
        knowledgeCutoff: 'Jan 2025', released: 'May 2026',
        websiteUrl: 'https://deepmind.google/models/gemini/flash/',
        docsUrl: 'https://ai.google.dev/gemini-api/docs/models',
      },
    },
    {
      id: 'gemini-3-1-pro',
      name: 'Gemini 3.1 Pro',
      attrs: {
        provider: 'Google', hosting: 'Closed/API', modelId: 'gemini-3.1-pro-preview',
        priceTier: 'Premium', priceInput: '$2', priceOutput: '$12', priceCache: '$0.50',
        contextWindow: '1M+', contextTier: '500K+', maxOutput: '64K',
        modality: 'Multimodal (vision, audio, video)',
        capabilities: 'Vision, Audio, Video, Tool use, Deep Think, Generative UI, Streaming, Function calling, Prompt caching, Code execution',
        speedTier: 'Standard', latency: 'medium',
        benchmark: 'Google’s current Pro tier; replaced the retired Gemini 3 Pro',
        sweBench: '—', humanEval: '—', mmlu: '—',
        bestFor: 'Long-horizon agentic tasks, multimodal reasoning and generative UI',
        knowledgeCutoff: '—', released: 'Feb 2026',
        websiteUrl: 'https://deepmind.google/models/gemini/pro/',
        docsUrl: 'https://ai.google.dev/gemini-api/docs/models',
      },
    },
    {
      id: 'gemini-3-5-flash-lite',
      name: 'Gemini 3.5 Flash-Lite',
      attrs: {
        provider: 'Google', hosting: 'Closed/API', modelId: 'gemini-3.5-flash-lite',
        priceTier: 'Budget', priceInput: '$0.30', priceOutput: '$2.50', priceCache: '$0.03',
        contextWindow: '1M+', contextTier: '500K+', maxOutput: '64K',
        modality: 'Multimodal (vision)',
        capabilities: 'Vision, Tool use, Streaming, Function calling, Prompt caching',
        speedTier: 'Fast', latency: 'fast',
        benchmark: 'Cheapest current-generation 1M-context Gemini',
        sweBench: '—', humanEval: '—', mmlu: '—',
        bestFor: 'High-volume classification and extraction at 1M context',
        knowledgeCutoff: 'Mar 2026', released: 'Jul 2026',
        websiteUrl: 'https://deepmind.google/models/gemini/flash-lite/',
        docsUrl: 'https://ai.google.dev/gemini-api/docs/models',
      },
    },
    {
      id: 'gemini-3-1-flash-lite',
      name: 'Gemini 3.1 Flash-Lite',
      attrs: {
        provider: 'Google', hosting: 'Closed/API', modelId: 'gemini-3.1-flash-lite',
        priceTier: 'Budget', priceInput: '$0.25', priceOutput: '$1.50', priceCache: '$0.03',
        contextWindow: '1M+', contextTier: '500K+', maxOutput: '64K',
        modality: 'Multimodal (vision)',
        capabilities: 'Vision, Tool use, Streaming, Function calling, Prompt caching',
        speedTier: 'Fast', latency: 'fast',
        benchmark: 'Previous Flash-Lite generation',
        sweBench: '—', humanEval: '—', mmlu: '—',
        bestFor: 'Cost-floor workloads that still need a large context window',
        knowledgeCutoff: '—', released: 'May 2026',
        websiteUrl: 'https://deepmind.google/models/gemini/flash-lite/',
        docsUrl: 'https://ai.google.dev/gemini-api/docs/models',
      },
    },

    // --- xAI ------------------------------------------------------------
    // Verified on https://docs.x.ai/docs/models. xAI bills a higher rate
    // above 200K prompt tokens; these are the short-context rates.
    {
      id: 'grok-4-6',
      name: 'Grok 4.6',
      attrs: {
        provider: 'xAI', hosting: 'Closed/API', modelId: 'grok-4.6',
        priceTier: 'Mid', priceInput: '$2', priceOutput: '$6', priceCache: '$0.20',
        contextWindow: '500K', contextTier: '500K+', maxOutput: '128K',
        modality: 'Multimodal (vision)',
        capabilities: 'Vision, Tool use, Reasoning, Streaming, Structured output, Prompt caching, Agentic long-running tasks',
        speedTier: 'Standard', latency: 'medium',
        benchmark: 'Matches GPT-5.6 Sol on the Artificial Analysis Intelligence Index',
        sweBench: '—', humanEval: '—', mmlu: '—',
        bestFor: 'Long-running agents, coding and ambitious interactive/visual work',
        knowledgeCutoff: '—', released: 'Aug 2026',
        websiteUrl: 'https://x.ai/news/grok-4-6',
        docsUrl: 'https://docs.x.ai/docs/models',
      },
    },
    {
      id: 'grok-4-5',
      name: 'Grok 4.5',
      attrs: {
        provider: 'xAI', hosting: 'Closed/API', modelId: 'grok-4.5',
        priceTier: 'Mid', priceInput: '$2', priceOutput: '$6', priceCache: '$0.20',
        contextWindow: '500K', contextTier: '500K+', maxOutput: '128K',
        modality: 'Multimodal (vision)',
        capabilities: 'Vision, Tool use, Reasoning, Streaming, Structured output, Prompt caching',
        speedTier: 'Standard', latency: 'medium',
        benchmark: 'Previous xAI flagship, superseded by Grok 4.6',
        sweBench: '—', humanEval: '—', mmlu: '—',
        bestFor: 'Coding and agentic work on the previous xAI flagship',
        knowledgeCutoff: 'Feb 2026', released: 'Jul 2026',
        websiteUrl: 'https://x.ai/news/grok-4-5',
        docsUrl: 'https://docs.x.ai/docs/models',
      },
    },
    {
      id: 'grok-build-0-1',
      name: 'Grok Build 0.1',
      attrs: {
        provider: 'xAI', hosting: 'Closed/API', modelId: 'grok-build-0.1',
        priceTier: 'Budget', priceInput: '$1', priceOutput: '$2', priceCache: '$0.10',
        contextWindow: '256K', contextTier: '128K-500K', maxOutput: '64K',
        modality: 'Multimodal (vision)',
        capabilities: 'Tool use, App scaffolding, Streaming, Structured output',
        speedTier: 'Fast', latency: 'fast',
        benchmark: 'Tuned for the Grok Build app-generation surface',
        sweBench: '—', humanEval: '—', mmlu: '—',
        bestFor: 'Turning prompts into working apps inside Grok Build',
        knowledgeCutoff: '—', released: 'May 2026',
        websiteUrl: 'https://x.ai/build',
        docsUrl: 'https://docs.x.ai/docs/models',
      },
    },
    {
      id: 'grok-4-20-non-reasoning',
      name: 'Grok 4.20 (non-reasoning)',
      attrs: {
        provider: 'xAI', hosting: 'Closed/API', modelId: 'grok-4.20-0309-non-reasoning',
        priceTier: 'Mid', priceInput: '$1.25', priceOutput: '$2.50', priceCache: '$0.20',
        contextWindow: '1M+', contextTier: '500K+', maxOutput: '64K',
        modality: 'Multimodal (vision)',
        capabilities: 'Vision, Tool use, Streaming, Structured output, Prompt caching',
        speedTier: 'Fast', latency: 'fast',
        benchmark: 'Same weights as Grok 4.20 with reasoning disabled for latency',
        sweBench: '—', humanEval: '—', mmlu: '—',
        bestFor: 'Latency-sensitive 1M-context work that does not need reasoning',
        knowledgeCutoff: '—', released: 'Mar 2026',
        websiteUrl: 'https://x.ai/news',
        docsUrl: 'https://docs.x.ai/docs/models',
      },
    },
    {
      id: 'grok-4-20-multi-agent',
      name: 'Grok 4.20 Multi-Agent',
      attrs: {
        provider: 'xAI', hosting: 'Closed/API', modelId: 'grok-4.20-multi-agent-0309',
        priceTier: 'Mid', priceInput: '$1.25', priceOutput: '$2.50', priceCache: '$0.20',
        contextWindow: '1M+', contextTier: '500K+', maxOutput: '64K',
        modality: 'Multimodal (vision)',
        capabilities: 'Vision, Tool use, Multi-agent orchestration, Streaming, Structured output',
        speedTier: 'Standard', latency: 'medium',
        benchmark: 'Grok 4.20 variant tuned for multi-agent orchestration',
        sweBench: '—', humanEval: '—', mmlu: '—',
        bestFor: 'Fan-out workloads that delegate across multiple agents',
        knowledgeCutoff: '—', released: 'Mar 2026',
        websiteUrl: 'https://x.ai/news',
        docsUrl: 'https://docs.x.ai/docs/models',
      },
    },

    // --- Meta -----------------------------------------------------------
    // Muse Spark pricing verified on https://developer.meta.com/ai/models/muse-spark/
    {
      id: 'muse-spark-1-2',
      name: 'Muse Spark 1.2',
      attrs: {
        provider: 'Meta', hosting: 'Closed/API', modelId: 'muse-spark-1.2',
        priceTier: 'Mid', priceInput: '$1.25', priceOutput: '$4.25', priceCache: '—',
        contextWindow: '1M+', contextTier: '500K+', maxOutput: '64K',
        modality: 'Multimodal (vision)',
        capabilities: 'Tool use, Agentic coding, Streaming, Structured output, Long-running sessions',
        speedTier: 'Standard', latency: 'medium',
        benchmark: 'Higher first-attempt accuracy and more reliable tool calling than 1.1',
        sweBench: '—', humanEval: '—', mmlu: '—',
        bestFor: 'Real coding workflows and long-running tasks in a single session',
        knowledgeCutoff: '—', released: 'Aug 2026',
        websiteUrl: 'https://developer.meta.com/ai/models/muse-spark/',
        docsUrl: 'https://developer.meta.com/ai/products/meta-model-api/',
      },
    },
    {
      id: 'muse-spark-1-2-contributor',
      name: 'Muse Spark 1.2 (Contributor)',
      attrs: {
        provider: 'Meta', hosting: 'Closed/API', modelId: 'muse-spark-1.2-contributor',
        priceTier: 'Budget', priceInput: '$0.10', priceOutput: '$0.20', priceCache: '—',
        contextWindow: '1M+', contextTier: '500K+', maxOutput: '64K',
        modality: 'Multimodal (vision)',
        capabilities: 'Tool use, Agentic coding, Streaming, Structured output',
        speedTier: 'Standard', latency: 'medium',
        benchmark: 'Same model as Muse Spark 1.2 on a data-sharing tier',
        sweBench: '—', humanEval: '—', mmlu: '—',
        bestFor: 'Cheap access to Muse Spark 1.2 where prompts may be used to improve the model',
        knowledgeCutoff: '—', released: 'Aug 2026',
        websiteUrl: 'https://developer.meta.com/ai/models/muse-spark/',
        docsUrl: 'https://developer.meta.com/ai/products/meta-model-api/',
      },
    },
    {
      id: 'muse-glimmer-30b',
      name: 'Muse Glimmer 30B',
      attrs: {
        provider: 'Meta', hosting: 'Open-weights', modelId: 'meta-models/Muse-Glimmer-30B',
        priceTier: 'Free', priceInput: 'Free (self-hosted)', priceOutput: 'Free (self-hosted)',
        priceCache: '—',
        contextWindow: '128K', contextTier: '32K-128K', maxOutput: '32K',
        modality: 'Multimodal (vision)',
        capabilities: 'Vision, Tool use, Agentic local use, Apache 2.0 licence, Single-GPU inference',
        speedTier: 'Fast', latency: 'local-bound',
        benchmark: 'Open 30B model targeting always-on local agents',
        sweBench: '—', humanEval: '—', mmlu: '—',
        bestFor: 'Always-on local agents running on a single GPU',
        knowledgeCutoff: 'Jan 2026', released: 'Aug 2026',
        websiteUrl: 'https://developer.meta.com/ai/models/muse-glimmer/',
        docsUrl: 'https://huggingface.co/meta-models/Muse-Glimmer-30B',
      },
    },
  ],
};
