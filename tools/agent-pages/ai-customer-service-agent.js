// AI customer service / support agent. Pricing read from vendor pages Aug 2026.
module.exports = {
  slug: 'ai-customer-service-agent',
  updated: '2026-08-14',
  cardTitle: 'Customer service',
  cardDesc: 'Resolves support tickets and chats end to end. 13 providers, all priced per resolution.',
  keywords: ['ai customer service agent', 'ai support agent', 'ai customer support', 'per resolution pricing', 'intercom fin pricing', 'decagon ai', 'zendesk ai agents', 'best ai support agent 2026', 'ai support agent shopify', 'ecommerce ai support', 'helpdesk ai agent'],
  title: 'AI Customer Service Agents (2026): 13 Providers Compared by Cost Per Resolution',
  metaDesc: 'Every AI customer service agent compared — Fin, Decagon, Sierra, Zendesk, Agentforce, Ada, Gorgias, Forethought. Real per-resolution pricing, how each defines a "resolution", and honest pros and cons.',
  h1: 'AI agents for customer service',
  hero: 'The agent that answers support tickets, chats and emails end to end — and only escalates what it cannot close. This is the one vertical where the whole market agreed on a pricing unit: you pay per resolution. Below: how it works, every provider, and why the same "$1 per resolution" means very different things.',

  intro: {
    lead: 'A customer service agent reads the ticket, retrieves the right answer from your help centre and past tickets, takes an action against your systems (refund, reorder, address change, subscription pause), and replies. What separates it from the chatbots of 2021 is that it acts rather than deflects — and that it is sold on outcomes, not seats.',
    stats: [
      { value: '$0.90–$2.00', label: 'The converged per-resolution price band across almost every vendor' },
      { value: '6% → 19%', label: 'Voice AI share of inbound contact-centre volume, 2024 to 2026' },
      { value: '$50k/yr', label: 'Typical enterprise platform floor before a single resolution is billed' },
      { value: '$4.5B', label: 'Decagon\'s valuation after a $250M Series D in January 2026' },
    ],
    flowTitle: 'The ticket, step by step',
    flow: [
      { step: '1. Ingest', text: 'Ticket arrives from chat, email, in-app or voice. The agent reads history and customer record.' },
      { step: '2. Retrieve', text: 'RAG over help centre, macros and past resolved tickets — the quality ceiling of the whole system.' },
      { step: '3. Decide', text: 'Answer, act, or escalate. Policy lives here: what the agent is allowed to promise or refund.' },
      { step: '4. Act', text: 'API calls into Shopify, Stripe, the order system or billing — the step that turns deflection into resolution.' },
      { step: '5. Reply', text: 'Drafts in your brand voice, in the customer\'s language, on the channel they started on.' },
      { step: '6. Grade', text: 'Was it resolved? That judgement is both the quality signal and the invoice line.' },
    ],
    blocks: [
      {
        h3: 'The word "resolution" is doing a lot of work',
        html: `      <p>Every vendor bills per resolution and every vendor defines it differently. Intercom's Fin charges $0.99 per <em>outcome</em> — when the customer confirms it was resolved, asks no follow-up, or a workflow completes. Zendesk counts a resolution when its AI handles the issue start to finish, and charges nothing when it escalates. Salesforce bills a <em>conversation</em> — a 24-hour session that may contain dozens of actions — at about $2.</p>
      <ul>
        <li><strong>Confirmation-based</strong> (Fin) is the strictest: the customer effectively has to agree it worked.</li>
        <li><strong>No-escalation</strong> (Zendesk, Gorgias) is the most common: if a human touches it, you don't pay.</li>
        <li><strong>Session-based</strong> (Agentforce conversations) is the loosest: one billable unit can cover a whole day of back-and-forth.</li>
      </ul>
      <p>The consequence: a headline rate is not comparable across vendors without knowing the denominator. Model your own ticket mix before believing any per-resolution quote.</p>`,
      },
      {
        h3: 'Why this vertical matured first',
        html: `      <ul>
        <li><strong>Text is forgiving.</strong> No latency budget, no barge-in, no turn detection. A support agent can think for four seconds and nobody notices.</li>
        <li><strong>The training data was already there.</strong> Every company has years of resolved tickets — a labelled corpus of question-to-correct-answer pairs sitting in the helpdesk.</li>
        <li><strong>The buyer already had a budget line.</strong> Support is a measured cost centre with a known cost per ticket, so the ROI conversation is arithmetic rather than vision.</li>
        <li><strong>The ceiling is your documentation, not the model.</strong> Teams that fail at this almost always fail on retrieval quality and stale help centres, not on the LLM.</li>
      </ul>`,
      },
      {
        h3: 'Where it still breaks',
        html: `      <ul>
        <li><strong>Actions, not answers.</strong> Answering "what's your refund policy" is solved. Issuing the refund against a billing system with edge cases is where deployments stall.</li>
        <li><strong>Escalation quality.</strong> A bad handoff — losing context, making the customer repeat themselves — destroys more goodwill than never having automated at all.</li>
        <li><strong>The long tail is the expensive tail.</strong> The 20% of tickets that don't automate are the complex ones, so your remaining human team gets a harder job, not just a smaller one.</li>
      </ul>`,
      },
    ],
  },

  providers: {
    lead: 'Three groups: helpdesk incumbents bolting agents onto an existing seat business, AI-native platforms selling resolutions, and the CRM giants bundling agents into the suite.',
    cols: ['Provider', 'Type', 'What it is', 'Price anchor', 'Best fit'],
    rows: [
      ['Intercom Fin', '<span class="agent-badge">AI-native</span>', 'The category benchmark; runs standalone on other helpdesks', '$0.99 per outcome', 'Almost anyone — the default to beat'],
      ['Decagon', '<span class="agent-badge">AI-native</span>', 'Enterprise "concierge" agents with QA monitoring built in', '$50k/yr + ~$0.99/conversation', 'Large consumer brands'],
      ['Sierra', '<span class="agent-badge">AI-native</span>', 'Outcome-priced platform, voice and chat', '~$1.50 per resolution (est.)', 'Fortune 500 CX transformation'],
      ['Zendesk AI Agents', '<span class="agent-badge">Helpdesk</span>', 'Outcome pricing bolted onto the incumbent helpdesk', '~$2/resolution PAYG, ~$1.50 committed', 'Teams already on Zendesk'],
      ['Salesforce Agentforce', '<span class="agent-badge">CRM suite</span>', 'Agents native to Service Cloud data and workflows', '$2/conversation or $0.10/action', 'Salesforce-committed enterprises'],
      ['Ada', '<span class="agent-badge">AI-native</span>', 'Multilingual automation-first platform', '$1–$3.50/resolution, ~$30k/yr entry (est.)', 'Global, multi-language support'],
      ['Gorgias', '<span class="agent-badge">Vertical</span>', 'E-commerce support — Shopify-shaped from the start', '$0.90/resolution annual, $1.00 monthly', 'DTC and Shopify merchants'],
      ['Forethought', '<span class="agent-badge">AI-native</span>', 'Platform fee plus outcome blend, strong triage', '~$59,500/yr (est.)', 'Mid-market with messy ticket taxonomies'],
      ['Parloa', '<span class="agent-badge">Voice CX</span>', 'Agent management for voice-heavy contact centres', 'Custom', 'Multilingual European operations'],
      ['PolyAI', '<span class="agent-badge">Voice CX</span>', 'Voice-first resolution at contact-centre scale', '~$150k/yr entry (est.) + per-minute', 'Phone-dominant support'],
      ['Freshworks Freddy', '<span class="agent-badge">Helpdesk</span>', 'Bundled agents in a cheaper helpdesk suite', 'Per-session add-on', 'Cost-sensitive SMB teams'],
      ['Crescendo', '<span class="agent-badge">Hybrid</span>', 'AI plus managed human agents sold as one service', 'Custom, outcome-linked', 'Teams outsourcing support entirely'],
      ['Build your own', '<span class="agent-badge">DIY</span>', 'LLM API + RAG + your ticketing webhooks', 'Model cost only (cents per ticket)', 'Engineering-led teams with odd workflows'],
    ],
    note: 'Figures marked "est." come from third-party reporting; those vendors do not publish pricing. Rates change often — verify before committing.',
  },

  how: [
    {
      h3: 'AI-native platforms — resolutions are the product',
      items: [
        '<strong>Intercom Fin</strong> — the one to benchmark against, partly because it will run on top of Zendesk or Salesforce rather than demanding you migrate. $0.99 per outcome, and an outcome only counts when the customer confirms resolution, asks no follow-up, or a workflow completes — the strictest definition in the market, which makes the headline number more honest than most. Seats are separate ($29/$85/$132 per seat/mo) but not required for standalone Fin.',
        '<strong>Decagon</strong> — sells to large consumer brands with a $50,000 annual platform fee covering all channels, integrations, "Agent Operating Procedures" and its Watchtower QA monitoring, then roughly $0.99 per conversation on top. The QA layer is the differentiator: it grades its own agents continuously rather than leaving you to sample transcripts. Tripled to a $4.5B valuation on a $250M Series D in January 2026, on about $35M of 2025 revenue.',
        '<strong>Sierra</strong> — the same outcome-based model it uses for voice, at roughly $1.50 per resolution, with unresolved conversations typically free. Contracts are six figures with real setup fees, so it is a transformation programme rather than a signup.',
        '<strong>Ada</strong> — automation-first and unusually strong on multilingual, reportedly $1–$3.50 per resolution from about $30k/year, but it expects to sit alongside Zendesk or Salesforce rather than replace them.',
        '<strong>Forethought</strong> — blends a platform fee with outcome pricing at roughly $59,500/year, and is strongest at triage and routing on messy ticket taxonomies rather than pure deflection.',
      ],
    },
    {
      h3: 'Helpdesk incumbents — agents attached to a seat business',
      items: [
        '<strong>Zendesk AI Agents</strong> — outcome pricing grafted onto the incumbent: about $2 per automated resolution pay-as-you-go, falling to roughly $1.50 with committed volume, and nothing when the agent escalates. But it sits on top of Suite seats at $55–$115 per agent per month, and the Copilot add-on is a further $50 per agent per month. The all-in number is rarely the per-resolution number.',
        '<strong>Freshworks Freddy</strong> — the value option, bundled into a cheaper suite and billed per session. Fewer capabilities per resolution, but the total bill for a small team lands well below the AI-native platforms.',
        '<strong>Gorgias</strong> — the clearest pricing in the category and the tightest vertical fit: $0.90 per resolved conversation on annual plans, $1.00 monthly, with overage interactions at $1.50. Because it is built around Shopify, order lookups, returns and refunds work without integration work.',
      ],
    },
    {
      h3: 'CRM suites — the agent is a feature of the platform',
      items: [
        '<strong>Salesforce Agentforce</strong> — three ways to pay, which tells you the model is still settling: about $2 per conversation, Flex Credits at $500 per 100,000 (20 credits per action, so $0.10 an action, and $0.15 for voice), or per-user licensing from $125/user/mo. The arithmetic matters: conversations win above ~20 actions each, Flex Credits win below. The real argument for Agentforce is not price but that the agent already sits on your Service Cloud data.',
      ],
    },
    {
      h3: 'Voice, hybrid and DIY',
      items: [
        '<strong>PolyAI and Parloa</strong> — where support is phone-dominant, these replace the IVR rather than the chat widget. Priced as managed enterprise engagements, with tuning and support inside the contract. See the <a href="ai-receptionist.html">receptionist page</a> for how their voice stacks work.',
        '<strong>Crescendo</strong> — sells AI and managed human agents as a single service with outcome-linked commercials, which is effectively BPO with the labour arbitrage replaced by model inference.',
        '<strong>Build your own</strong> — an LLM API, retrieval over your help centre and past tickets, and webhooks into your ticketing system. Marginal cost is cents per ticket rather than dollars, and for a high-volume, narrow-workflow business the savings against $1/resolution are enormous. You are buying that with evaluation harnesses, guardrails, escalation logic and QA that the platforms give you on day one.',
      ],
    },
  ],

  prosCons: [
    { name: 'Intercom Fin', meta: 'AI-native · $0.99 per outcome', pros: ['Strictest resolution definition — you pay for real wins', 'Runs standalone on Zendesk or Salesforce; no migration'], cons: ['Costs climb fast past ~10k resolutions/month', 'Full Intercom value needs Intercom seats too'], verdict: '<b>Buy if</b> you want the market benchmark and hate ambiguous billing.' },
    { name: 'Decagon', meta: 'AI-native · $50k/yr + ~$0.99/conv', pros: ['Watchtower QA grades agents continuously', 'Built for consumer-brand volume and tone control'], cons: ['$50k floor before a single resolution', 'Enterprise sales cycle, not a signup'], verdict: '<b>Buy if</b> you are a large consumer brand and quality drift is your fear.' },
    { name: 'Sierra', meta: 'AI-native · ~$1.50/resolution (est.)', pros: ['Voice and chat under one outcome contract', 'Unresolved conversations typically cost nothing'], cons: ['Six-figure contracts plus setup fees', 'No public pricing to model against'], verdict: '<b>Buy if</b> CX is a board-level programme, not a tooling decision.' },
    { name: 'Zendesk AI Agents', meta: 'Helpdesk · ~$1.50–$2/resolution', pros: ['Zero migration if you are already on Zendesk', 'No charge when the agent escalates'], cons: ['Stacks on $55–$115/agent seats plus $50 Copilot', 'Highest effective all-in cost in this list'], verdict: '<b>Buy if</b> you are on Zendesk and switching costs outweigh the premium.' },
    { name: 'Salesforce Agentforce', meta: 'CRM suite · $2/conv or $0.10/action', pros: ['Native access to Service Cloud data and workflows', 'Three pricing models — pick the cheaper for your mix'], cons: ['Conversation billing is the loosest unit in the market', 'Credit accounting is genuinely hard to forecast'], verdict: '<b>Buy if</b> your customer data already lives in Salesforce.' },
    { name: 'Ada', meta: 'AI-native · $1–$3.50/resolution (est.)', pros: ['Strong multilingual coverage out of the box', 'Automation-first design, not a chatbot retrofit'], cons: ['Widest and least predictable price band', 'Expects an existing Zendesk or Salesforce'], verdict: '<b>Buy if</b> you support many languages and volume justifies ~$30k/yr.' },
    { name: 'Gorgias', meta: 'Vertical · $0.90/resolution', pros: ['Cheapest transparent per-resolution rate here', 'Shopify order, return and refund actions work natively'], cons: ['E-commerce only', 'Overage interactions jump to $1.50'], verdict: '<b>Buy if</b> you sell on Shopify — the vertical fit beats the generalists.' },
    { name: 'Forethought', meta: 'AI-native · ~$59,500/yr (est.)', pros: ['Excellent triage and routing on messy taxonomies', 'Blended pricing softens per-resolution spikes'], cons: ['Highest published-estimate entry point', 'Less known for pure deflection quality'], verdict: '<b>Buy if</b> your problem is routing chaos more than answer quality.' },
    { name: 'PolyAI &amp; Parloa', meta: 'Voice CX · custom, enterprise', pros: ['Replace the IVR, not the chat widget', 'Tuning and 24/7 support inside the contract'], cons: ['Long deployment cycles', 'Overkill unless phone volume dominates'], verdict: '<b>Buy if</b> most of your support pain arrives by telephone.' },
    { name: 'Freshworks Freddy', meta: 'Helpdesk · per-session add-on', pros: ['Materially cheaper total bill for small teams', 'Bundled into a suite you may already pay for'], cons: ['Weaker action-taking than AI-native platforms', 'Session billing obscures true cost per resolution'], verdict: '<b>Buy if</b> budget is the binding constraint and tickets are simple.' },
    { name: 'Crescendo', meta: 'Hybrid · custom, outcome-linked', pros: ['AI and humans on one contract and one SLA', 'No internal team to hire or manage'], cons: ['You outsource the customer relationship itself', 'Least control over how answers are given'], verdict: '<b>Buy if</b> you want support to be someone else\'s operating problem.' },
    { name: 'Build your own', meta: 'DIY · model cost only', pros: ['Cents per ticket instead of dollars per resolution', 'Total control over policy, tone and actions'], cons: ['You build evals, guardrails, QA and escalation yourself', 'Quality ceiling is your retrieval, and retrieval is hard'], verdict: '<b>Buy if</b> volume is high, workflows are odd, and you have engineers.' },
  ],

  pick: [
    '<strong>Under ~2,000 tickets/month</strong> → Fin. The benchmark, no migration, honest billing unit.',
    '<strong>You sell on Shopify</strong> → Gorgias at $0.90/resolution beats every generalist on both price and fit.',
    '<strong>Already deep in Zendesk or Salesforce</strong> → use their agent and accept the premium; migration costs more.',
    '<strong>Large consumer brand, tone matters</strong> → Decagon for the QA layer, Sierra if it is a board-level programme.',
    '<strong>Many languages</strong> → Ada, then Parloa if the volume is voice.',
    '<strong>High volume, narrow workflows, engineers on staff</strong> → build it. The per-resolution economics invert above roughly 50k tickets a month.',
  ],

  investor: [
    '<strong>Per-resolution pricing is the category\'s defining event.</strong> Support is the first software market to widely abandon seats for outcomes, and it happened in under three years. The band has already compressed to $0.90–$2.00 — which is what commoditisation looks like while it is still happening.',
    '<strong>The definition of "resolution" is the real pricing power.</strong> Fin\'s confirmation-based unit and Agentforce\'s 24-hour conversation are not the same product at the same price. Vendors that loosen the denominator raise prices without touching the rate card. Watch that number, not the headline.',
    '<strong>Distribution is beating technology.</strong> Zendesk and Salesforce ship worse agents at higher all-in cost and still win deals, because the data and the contract are already there. The AI-natives\' answer — Fin running standalone on rival helpdesks — is the most important competitive move in the category.',
    '<strong>The DIY floor caps the ceiling.</strong> An in-house agent costs cents per ticket. Every platform is selling the gap between that and $1, filled with evals, QA and guardrails. That gap narrows every time the tooling improves — the durable vendors are the ones building QA and monitoring moats (Decagon\'s Watchtower), not answer quality.',
    '<strong>Verticals out-earn generalists.</strong> Gorgias charges the least per resolution and is the hardest to displace among Shopify merchants, because the actions — refund, reorder, address change — are pre-integrated. Expect the same pattern in healthcare, travel and fintech support.',
  ],

  faq: [
    { q: 'How much does an AI customer service agent cost?', a: 'The market has converged on $0.90–$2.00 per resolution. Gorgias is $0.90 on annual plans, Intercom Fin $0.99 per outcome, Sierra around $1.50, and Zendesk about $2 pay-as-you-go. Enterprise platforms add a floor — Decagon charges $50,000 a year before usage, Forethought roughly $59,500.' },
    { q: 'What counts as a "resolution" in AI support pricing?', a: 'It varies by vendor and it materially changes your bill. Intercom charges only when the customer confirms resolution or a workflow completes. Zendesk and Gorgias charge when no human touches the ticket. Salesforce bills a 24-hour "conversation" that may contain dozens of actions. Always model your own ticket mix rather than comparing headline rates.' },
    { q: 'Is Intercom Fin better than Zendesk AI agents?', a: 'Fin is cheaper per resolution ($0.99 vs about $2), uses a stricter billing definition, and will run standalone on top of Zendesk. Zendesk wins only when you are already on Zendesk and want a single vendor. On pure economics Fin is the benchmark the others are measured against.' },
    { q: 'Should we build our own AI support agent instead?', a: 'Above roughly 50,000 tickets a month the economics invert — an in-house agent costs cents per ticket against a dollar or more per resolution. What you take on is evaluation harnesses, guardrails, escalation logic and continuous QA, which is exactly what the platforms sell. Below that volume, buying is almost always cheaper than the engineering.' },
    { q: 'What percentage of support tickets can AI resolve?', a: 'Well-scoped deployments report containing the majority of tickets, but the number depends far more on your documentation quality and how many actions the agent can take than on the model. Teams that stall usually have stale help centres or no API path to issue refunds and changes — not a weak LLM.' },
    { q: 'Which AI support agent is best for e-commerce?', a: 'Gorgias, on both price and fit. At $0.90 per resolved conversation it is the cheapest transparent rate in the category, and because it is built around Shopify, order lookups, returns and refunds work without custom integration.' },
  ],

  cta: 'Working out the model and retrieval layer behind your support agent? Flowpicker compares LLMs, RAG and orchestration side by side.',

  sources: `        Pricing read from vendor pages and reporting in August 2026:
        <a href="https://www.intercom.com/pricing" target="_blank" rel="noopener noreferrer">Intercom Fin</a>,
        <a href="https://help.salesforce.com/s/articleView?id=004811240&amp;type=1" target="_blank" rel="noopener noreferrer">Salesforce Agentforce</a>,
        <a href="https://www.eesel.ai/blog/zendesk-ai-dynamic-pricing-resolution" target="_blank" rel="noopener noreferrer">Zendesk per-resolution</a>,
        <a href="https://minami.ai/blog/gorgias-ai-agent-pricing" target="_blank" rel="noopener noreferrer">Gorgias</a>,
        <a href="https://fin.ai/learn/decagon-ai-pricing" target="_blank" rel="noopener noreferrer">Decagon pricing</a>,
        <a href="https://fin.ai/learn/ai-customer-service-agent-pricing-comparison" target="_blank" rel="noopener noreferrer">Ada &amp; Forethought estimates</a>.
        Funding and traction:
        <a href="https://www.forbes.com/sites/alexyork/2026/02/06/ai-agent-startup-decagon-triples-valuation-to-45-billion/" target="_blank" rel="noopener noreferrer">Decagon $250M at $4.5B</a>,
        <a href="https://techcrunch.com/2026/05/04/sierra-raises-950m-as-the-race-to-own-enterprise-ai-gets-serious/" target="_blank" rel="noopener noreferrer">Sierra $950M at $15.8B</a>,
        <a href="https://sacra.com/c/decagon/" target="_blank" rel="noopener noreferrer">Decagon revenue</a>.
        Contact-centre voice-share figures are reported industry estimates, not a Flowpicker benchmark.`,
};
