// AI receptionist / virtual front desk. Pricing read from vendor pages Aug 2026.
module.exports = {
  slug: 'ai-receptionist',
  updated: '2026-08-14',
  cardTitle: 'Receptionist',
  cardDesc: 'Answers the business phone line — books, qualifies, routes, logs. 15 providers compared.',
  keywords: ['ai receptionist', 'virtual receptionist', 'ai phone answering service', 'ai front desk', 'ai answering service', 'best ai receptionist 2026', 'ai receptionist pricing'],
  title: 'AI Receptionist in 2026: 15 Providers Compared (Pricing + Pros & Cons)',
  metaDesc: 'Every AI receptionist provider compared — Rosie, Goodcall, Slang.ai, Smith.ai, Retell, Bland, Synthflow, Vapi, ElevenLabs, Sierra, Assort Health. Real pricing from vendor pages, how each handles the call, and honest pros and cons.',
  h1: 'AI agents for reception',
  hero: 'The agent that answers the business phone line — books, reschedules, qualifies, routes, and logs the call. Below: how it works, every provider worth knowing, how each one handles the job, and where each one breaks. Pricing pulled from vendor pages in August 2026.',

  intro: {
    lead: 'A receptionist agent is the first fully-closed loop in voice AI: the call arrives, the agent completes the task end to end, and a row lands in the calendar or CRM. Nothing is handed to a human unless the agent decides it should be. That closed loop is what makes it sellable — the buyer is not purchasing "AI", they are purchasing answered calls.',
    stats: [
      { value: '$0.07–$0.31', label: 'All-in cost per AI-answered minute (Retell\'s published range)' },
      { value: '$4.35–$5.40', label: 'Per-minute overage on a premium human answering service (Ruby)' },
      { value: '&lt;800 ms', label: 'Voice-to-voice latency below which callers stop hearing the machine' },
      { value: '~$1.9B', label: 'Raised in H1 2026 by Sierra, ElevenLabs, Parloa, Assort Health and Vapi combined' },
    ],
    flowTitle: 'The call, step by step',
    flow: [
      { step: '1. Answer', text: 'PSTN/SIP trunk picks up. The business number ports over from the old phone system.' },
      { step: '2. Listen', text: 'Streaming speech-to-text plus turn detection — deciding the caller <em>finished</em>, not just paused.' },
      { step: '3. Think', text: 'A tightly scoped LLM prompt, plus business facts (hours, services, prices) retrieved from a knowledge base.' },
      { step: '4. Act', text: 'Tool calls: check the calendar, hold a slot, look up the customer, send an SMS, take a deposit.' },
      { step: '5. Speak', text: 'Streamed text-to-speech that can be cut off mid-sentence when the caller interrupts (barge-in).' },
      { step: '6. Close', text: 'Warm-transfer to a human if needed, then transcript, summary and outcome written back to the CRM.' },
    ],
    blocks: [
      {
        h3: 'Two architectures, and the choice matters',
        html: `      <ul>
        <li><strong>Cascaded (STT → LLM → TTS).</strong> Three swappable stages. Cheapest, easiest to constrain and audit, and you can pin the model that says the prices. Cost: latency stacks up at every hop, and the LLM never hears tone — only text.</li>
        <li><strong>Speech-to-speech.</strong> One realtime model consumes and emits audio directly (OpenAI's <code>gpt-realtime</code> family). Lowest latency, keeps prosody and natural interruptions. Cost: more expensive per minute, and harder to constrain — you are steering a model that cannot be inspected between stages.</li>
      </ul>
      <p>Most production receptionists in 2026 are cascaded, because a front desk quoting the wrong price is a liability and cascaded stacks are easier to guardrail.</p>`,
      },
      {
        h3: 'Why this is harder than it looks',
        html: `      <ul>
        <li><strong>Turn-taking.</strong> Humans leave roughly a 200 ms gap between turns. An agent that waits 1.5 s to be sure feels broken; one that jumps in at 300 ms talks over people.</li>
        <li><strong>Latency budget.</strong> Reported production fleets sit around 680 ms median and 1,180 ms at p95 — every component you add spends from that budget.</li>
        <li><strong>Containment, not accuracy.</strong> The metric that matters is what share of calls finish without a human. Well-scoped agents are reported to contain 62–88%; the rest must escalate cleanly, not fail loudly.</li>
        <li><strong>The unsexy 20%.</strong> 8 kHz phone codecs, accents and background noise, call-recording consent, HIPAA/PCI, number porting, and after-hours routing rules.</li>
      </ul>`,
      },
      {
        h3: 'The economic argument in one line',
        html: `      <p>A four-minute booking call costs roughly <strong>$0.30–$1.25</strong> on an AI stack versus <strong>$17–$22</strong> at a premium human service's overage rates, against a front-desk salary of $35–45k a year. That gap is why the category funds — but note it is a gap on <em>marginal</em> calls, and the incumbents' pricing is falling toward it.</p>
      <p class="agent-note">Illustrative, using vendor-published rates; real cost depends on model choice, telephony and call mix.</p>`,
      },
    ],
  },

  providers: {
    lead: 'Four layers, and the layer decides almost everything about price, speed to launch, and how much of the outcome you control.',
    cols: ['Provider', 'Layer', 'What it is', 'Price anchor', 'Best fit'],
    rows: [
      ['Rosie', '<span class="agent-badge">Turnkey</span>', 'Self-serve AI answering service, live in minutes', '$49–$299/mo for 250–2,000 min', 'Solo operators, local services'],
      ['Goodcall', '<span class="agent-badge">Turnkey</span>', 'Per-agent receptionist billed on customers, not minutes', '$79–$249/mo per agent', 'Spiky, unpredictable call volume'],
      ['Slang.ai', '<span class="agent-badge">Vertical</span>', 'Restaurant phone host — reservations, hours, waitlist', '$399–$599/mo per location', 'Restaurants, multi-location groups'],
      ['Smith.ai', '<span class="agent-badge">Hybrid</span>', 'AI-first or human-first, same price either way', '$300–$2,100/mo for 30–300 calls', 'Law firms, high-value inbound leads'],
      ['Retell AI', '<span class="agent-badge">Platform</span>', 'No-code agent builder with à-la-carte components', '$0.07–$0.31/min', 'Agencies and startups shipping fast'],
      ['Bland AI', '<span class="agent-badge">Platform</span>', 'Vertically integrated stack — own STT, LLM and TTS', '$0.11–$0.14/min all-in, $0–$499/mo', 'Volume, with billing you can forecast'],
      ['Synthflow', '<span class="agent-badge">Platform</span>', 'No-code builder that has moved upmarket', 'Contracts from $30,000/yr', 'Mid-market and enterprise rollouts'],
      ['Vapi', '<span class="agent-badge">Infra</span>', 'Orchestration layer; bring your own models and keys', '$0.05/min + models at cost', 'Dev teams that want full control'],
      ['ElevenLabs Agents', '<span class="agent-badge">Infra</span>', 'Best-in-class voices, with STT/RAG/telephony bundled', '$0.08/min + LLM at cost', 'When voice quality <em>is</em> the product'],
      ['OpenAI Realtime API', '<span class="agent-badge">Infra</span>', 'Single speech-to-speech model, no pipeline', '$32/$64 per 1M audio in/out tokens', 'Lowest-latency custom builds'],
      ['LiveKit Agents / Pipecat', '<span class="agent-badge">Open source</span>', 'Self-hosted agent frameworks you assemble yourself', 'Free + your infra (&lt;$0.05/min at volume)', 'Teams with infra and on-call capacity'],
      ['Sierra', '<span class="agent-badge">Enterprise</span>', 'Outcome-priced agent platform; bought Receptive AI for voice', '~$1–$2.50 per resolution (est.)', 'Fortune 500 customer experience'],
      ['PolyAI', '<span class="agent-badge">Enterprise</span>', 'Voice-first contact-centre agents, heavy tuning', '~$150k/yr entry (est.) + per-minute', 'High-volume contact centres'],
      ['Parloa', '<span class="agent-badge">Enterprise</span>', 'Agent management platform, strongest in Europe', 'Custom', 'Multinational, multilingual operations'],
      ['Assort Health', '<span class="agent-badge">Vertical</span>', 'Specialty-specific medical front desk, EHR-integrated', 'Custom', 'Physician groups and specialty clinics'],
    ],
    note: 'Enterprise figures marked "est." are third-party estimates; those vendors do not publish pricing.',
  },

  how: [
    {
      h3: 'Turnkey — the vendor owns the whole stack',
      items: [
        '<strong>Rosie</strong> — you describe the business in a form, it builds the agent. Minute-bundled plans (250 / 1,000 / 2,000), with calendar booking, warm and waterfall transfers, and spam filtering on the upper tiers. Zero pipeline decisions; you never see a model name.',
        '<strong>Goodcall</strong> — configuration is "logic flows" (1 / 3 / 25 by tier) rather than prompts. Notably, minutes and tokens are <em>not</em> metered at all; billing runs on unique customers per month (100 / 250 / 500, then $0.50 each), which inverts the industry\'s usual risk.',
        '<strong>Slang.ai</strong> — restaurant-shaped from the ground up: it speaks reservations, integrating directly with OpenTable, SevenRooms, Yelp and Fishbowl, with VIP routing and cross-sell on the premium tier. Priced per location, so it scales with footprint rather than call volume.',
        '<strong>Smith.ai</strong> — the hybrid: the same plan can be answered AI-first or human-first, at identical price. Billing is per call, not per minute (30 / 90 / 300 calls, then $8.50–$11.50 each), which suits low-volume, high-value inbound where one missed call outweighs the subscription.',
      ],
    },
    {
      h3: 'Platform — you configure, they run it',
      items: [
        '<strong>Retell AI</strong> — assembles the call from parts you choose and prices each part visibly: $0.055/min infrastructure, $0.015/min US telephony, TTS from $0.015/min (ElevenLabs $0.040), and the LLM from $0.003/min for a nano model up to $0.16/min for a frontier one. Guardrails, PII removal and knowledge base are metered add-ons at $0.005–$0.01/min. You can build a $0.09 agent or a $0.31 agent on the same platform.',
        '<strong>Bland AI</strong> — the opposite bet: it hosts its own speech recognition, language model and voices, tuned end to end for phone latency. One rate covers everything with no token charges — $0.14/min free-tier, $0.12 on the $299/mo plan, $0.11 on the $499/mo plan — with daily call caps (100 / 2,000 / 5,000) and concurrency tiers.',
        '<strong>Synthflow</strong> — visual no-code builder, but the company has moved decisively upmarket: enterprise contracts now start at $30,000 a year, scoped on call volume, concurrency, telephony and security review. It is no longer a self-serve option, whatever older comparison posts say.',
      ],
    },
    {
      h3: 'Infrastructure — you build the agent',
      items: [
        '<strong>Vapi</strong> — pure orchestration. It charges $0.05/min to run the call and passes model and telephony costs straight through, dropping to $0 if you bring your own API keys. Ten concurrent lines included, $10/line/month beyond; HIPAA is a $2,000/mo add-on and zero data retention $1,000/mo. It crossed a billion calls and raised a $50M Series B at roughly $500M in May 2026 after Amazon\'s Ring picked it over 40 rivals.',
        '<strong>ElevenLabs Agents</strong> — $0.08/min ($0.16 when bursting past your concurrency), bundling TTS, STT, knowledge bases, RAG and telephony, with only the LLM billed at cost. Plans run free through $990/mo for 12,375 minutes. Klarna put it in front of 35M US customers as first-line phone support in February 2026.',
        '<strong>OpenAI Realtime API</strong> — no pipeline to assemble: <code>gpt-realtime-2.1</code> takes audio in and emits audio out at $32 per 1M audio input tokens and $64 per 1M output ($0.40 cached), with a mini tier at $10/$20. You get the best interruption handling available and you write everything else — telephony, booking tools, escalation, logging.',
        '<strong>LiveKit Agents / Pipecat</strong> — the open-source route. LiveKit (Apache-2.0) puts your agent in a WebRTC room and solves media at scale with native telephony; Pipecat (v1.0, April 2026) models the call as a processor pipeline with a very large plugin library. Both can run under $0.05/min at volume — in exchange for owning latency tuning, infrastructure and the pager.',
      ],
    },
    {
      h3: 'Enterprise &amp; vertical — the outcome is the product',
      items: [
        '<strong>Sierra</strong> — sells resolutions, not minutes: you pay when the agent actually resolves the call, and unresolved or escalated conversations typically cost nothing. It bought voice startup Receptive AI in March 2026 to attack the ~80% of service interactions still on the phone, and raised $950M at $15.8B in May 2026 on roughly $200M ARR.',
        '<strong>PolyAI</strong> — voice-first by design, deployed as a managed engagement with continuous tuning and 24/7 support folded into the contract. Raised $86M at $750M in December 2025.',
        '<strong>Parloa</strong> — positions as an agent <em>management</em> platform (build, monitor, improve a fleet) rather than a single bot, and is strongest on European multilingual deployments. Tripled to a $3B valuation on a $350M Series D in January 2026.',
        '<strong>Assort Health</strong> — the vertical thesis proven out: specialty-specific agents (orthopaedics, dermatology) that speak insurance verification and EHR scheduling, not generic reception. Roughly 15,000 physicians deployed, a claimed 90%+ first-call resolution, and a $120M Series C at $1.2B led by Menlo Ventures in June 2026.',
      ],
    },
  ],

  prosCons: [
    { name: 'Rosie', meta: 'Turnkey · $49–$299/mo', pros: ['Cheapest credible entry point; live the same day', 'Minute bundles make the bill predictable'], cons: ['Minute caps bite fast — 250 min is ~60 short calls', 'Little control over behaviour or escalation logic'], verdict: "<b>Buy if</b> you're one person missing calls and want it fixed today." },
    { name: 'Goodcall', meta: 'Turnkey · $79–$249/mo per agent', pros: ["Unlimited minutes — a busy month can't blow up the bill", 'Logic flows are easier to reason about than free-form prompts'], cons: ['Unique-customer caps penalise wide, shallow call bases', 'Per-agent pricing multiplies across locations'], verdict: '<b>Buy if</b> your volume is spiky and repeat callers dominate.' },
    { name: 'Slang.ai', meta: 'Vertical · $399–$599/mo per location', pros: ['Reservation integrations work on day one, not after a build', 'Understands restaurant edge cases generic agents fumble'], cons: ['Useless outside hospitality', 'Per-location pricing gets steep across a group'], verdict: '<b>Buy if</b> you run restaurants and the phone competes with the dining room.' },
    { name: 'Smith.ai', meta: 'Hybrid · $300–$2,100/mo', pros: ['Humans as the fallback, at no price premium', 'Per-call billing aligns with lead value, not talk time'], cons: ['By far the highest cost per call in this list', 'Overages ($8.50–$11.50/call) punish growth'], verdict: '<b>Buy if</b> one converted call is worth four figures.' },
    { name: 'Retell AI', meta: 'Platform · $0.07–$0.31/min', pros: ['Transparent component pricing — you can engineer the margin', 'Strong inbound quality; $60M ARR says the market agrees'], cons: ['The advertised $0.07 floor requires the weakest model', 'Add-ons (guardrails, PII, KB) each shave the margin'], verdict: "<b>Buy if</b> you're reselling receptionists and cost per minute is your P&amp;L." },
    { name: 'Bland AI', meta: 'Platform · $0.11–$0.14/min all-in', pros: ['One number covers everything — no token surprises', 'Owning the whole stack keeps latency tight'], cons: ['No model choice; you get their models or nothing', 'Daily call caps and $299–$499/mo floors to reach the good rate'], verdict: '<b>Buy if</b> you need a forecastable per-minute cost at volume.' },
    { name: 'Synthflow', meta: 'Platform · from $30,000/yr', pros: ['No-code builder with enterprise support and security review', 'Scoped launch help rather than a docs link'], cons: ['Self-serve is gone — the floor is a five-figure contract', 'No public pricing to benchmark against'], verdict: "<b>Buy if</b> you're mid-market and want no-code with a signed SLA." },
    { name: 'Vapi', meta: 'Infra · $0.05/min + models at cost', pros: ['Thinnest margin on top of raw cost; BYO keys make models free', "Proven at scale — 1B calls, chosen by Amazon's Ring"], cons: ['You assemble and own the pipeline quality', 'Compliance is expensive: $2,000/mo for HIPAA'], verdict: '<b>Buy if</b> you have engineers and want control without building transport.' },
    { name: 'ElevenLabs Agents', meta: 'Infra · $0.08/min + LLM at cost', pros: ['The voices callers are least likely to hang up on', 'STT, RAG, KB and telephony bundled into one rate'], cons: ['Burst pricing doubles to $0.16/min past concurrency', 'Agents are one product inside a much broader company'], verdict: "<b>Buy if</b> brand voice is the differentiator you're selling." },
    { name: 'OpenAI Realtime API', meta: 'Infra · $32/$64 per 1M audio tokens', pros: ['Best-in-class interruption and turn handling', 'One model, one hop — the latency floor of the category'], cons: ['Everything around the model is your problem', 'Hardest architecture to guardrail and audit'], verdict: '<b>Buy if</b> conversational feel is worth building the rest yourself.' },
    { name: 'LiveKit Agents / Pipecat', meta: 'Open source · free + your infra', pros: ['Lowest marginal cost at volume — under $0.05/min', 'No vendor lock-in; swap any component'], cons: ['You own latency tuning, scaling and on-call', 'Months to reach what a platform gives you in a week'], verdict: '<b>Buy if</b> voice is core IP and volume justifies the team.' },
    { name: 'Sierra', meta: 'Enterprise · ~$1–$2.50 per resolution (est.)', pros: ["Outcome pricing puts the vendor's risk beside yours", 'Deepest capital base in the category ($15.8B valuation)'], cons: ['Six-figure contracts and setup fees; no self-serve', 'Voice is newer here than chat — acquired, not native'], verdict: "<b>Buy if</b> you're an enterprise buying resolved conversations, not software." },
    { name: 'PolyAI &amp; Parloa', meta: 'Enterprise · custom, ~$150k/yr entry (est.)', pros: ['Built for contact-centre volume, compliance and multilingual', 'Managed tuning included rather than sold as services'], cons: ['Long sales and deployment cycles', 'Wildly oversized for a single front desk'], verdict: '<b>Buy if</b> "reception" means thousands of calls a day across markets.' },
    { name: 'Assort Health', meta: 'Vertical · custom', pros: ['Speaks insurance, EHR scheduling and specialty workflows natively', 'Reference density: ~15,000 physicians live'], cons: ['Healthcare only', 'Vendor-reported outcome metrics, not audited'], verdict: "<b>Buy if</b> you're a physician group and the front desk is drowning." },
  ],

  pick: [
    '<strong>Under ~500 calls/month, no engineers</strong> → Rosie or Goodcall. Slang.ai if you\'re a restaurant.',
    '<strong>High-value leads, can\'t risk a bad answer</strong> → Smith.ai, and let humans catch what AI drops.',
    '<strong>Reselling to clients</strong> → Retell for margin control, Bland for billing you can quote.',
    '<strong>Building a product on top</strong> → Vapi or ElevenLabs; OpenAI Realtime if latency is the feature.',
    '<strong>Regulated or specialised</strong> → the vertical (Assort Health) beats the generalist every time.',
    '<strong>Thousands of calls a day</strong> → Sierra, PolyAI or Parloa, and budget for a deployment, not a signup.',
  ],

  investor: [
    "<strong>The pipe is commoditising; the workflow isn't.</strong> STT, TTS and orchestration are converging on ~$0.05–$0.12/min. Nobody defends a moat there. Assort Health at $1.2B and Slang.ai's per-location pricing say the value sits in the vertical workflow — insurance verification, reservation systems, EHR writes — not the voice.",
    '<strong>Pricing is migrating from minutes to outcomes.</strong> Sierra charges per resolution; Goodcall charges per customer and gives minutes away. Both are bets that metered minutes become a race to zero.',
    '<strong>The displacement target is human answering services, not software budgets.</strong> A ~15× gap in cost per call against incumbents like Ruby is the whole thesis — and it\'s a services market being converted to software, which is why growth rates (Retell +650% YoY) look unlike SaaS.',
    '<strong>Containment rate is the real metric.</strong> Not accuracy, not latency, not voice quality — what fraction of calls end without a human. Reported ranges of 62–88% are the difference between a demo and a P&amp;L line.',
    '<strong>Consolidation has started.</strong> Sierra buying Receptive AI for voice is the signal: horizontal CX platforms will acquire the voice layer rather than rebuild it.',
  ],

  faq: [
    { q: 'How much does an AI receptionist cost?', a: 'Turnkey services start at $49/month (Rosie, 250 minutes) and run to $2,100/month for a hybrid AI-plus-human plan like Smith.ai. If you build on a platform, expect $0.07–$0.31 per minute on Retell or a flat $0.11–$0.14 on Bland. A typical small business answering 300 calls a month lands between $80 and $300.' },
    { q: 'Is an AI receptionist cheaper than a human one?', a: 'On marginal calls, dramatically. A four-minute booking call costs roughly $0.30–$1.25 on an AI stack against $17–$22 at a premium human answering service\'s overage rates, versus a front-desk salary of $35–45k a year. The gap narrows once you count setup, supervision and the calls that still escalate.' },
    { q: 'Can an AI receptionist book appointments directly into my calendar?', a: 'Yes — this is table stakes in 2026. The agent makes a tool call to your calendar or booking system mid-conversation, holds a slot, and confirms it before hanging up. Rosie, Goodcall, Slang.ai and Assort Health all ship native integrations; on a platform like Retell or Vapi you wire the function call yourself.' },
    { q: 'What happens when the AI cannot handle a call?', a: 'It escalates. Good implementations do a warm transfer to a human with the transcript attached, rather than dumping the caller to voicemail. The share of calls finishing without a human — the containment rate — is the metric that actually matters; reported ranges run 62–88% for well-scoped agents.' },
    { q: 'Is an AI receptionist HIPAA compliant?', a: 'Only if you pay for it. Vapi charges $2,000/month for HIPAA and $1,000/month for zero data retention. Healthcare-specific vendors like Assort Health build compliance in and sign BAAs as standard. Do not assume a general-purpose plan covers you.' },
    { q: 'Which AI receptionist is best for a small business?', a: 'Rosie if you are a solo operator wanting it live today, Goodcall if your call volume is unpredictable and you want unlimited minutes, and Slang.ai if you run a restaurant. Choose Smith.ai instead when a single missed lead is worth four figures and you want human fallback.' },
  ],

  cta: 'Building the receptionist agent yourself? Flowpicker maps the model, orchestration and context layers — with compatibility warnings before you commit.',

  sources: `        Pricing read from vendor pages in August 2026:
        <a href="https://heyrosie.com/pricing" target="_blank" rel="noopener noreferrer">Rosie</a>,
        <a href="https://www.goodcall.com/pricing" target="_blank" rel="noopener noreferrer">Goodcall</a>,
        <a href="https://www.slang.ai/pricing" target="_blank" rel="noopener noreferrer">Slang.ai</a>,
        <a href="https://smith.ai/pricing" target="_blank" rel="noopener noreferrer">Smith.ai</a>,
        <a href="https://www.retellai.com/pricing" target="_blank" rel="noopener noreferrer">Retell AI</a>,
        <a href="https://www.bland.ai/pricing" target="_blank" rel="noopener noreferrer">Bland AI</a>,
        <a href="https://synthflow.ai/pricing" target="_blank" rel="noopener noreferrer">Synthflow</a>,
        <a href="https://vapi.ai/pricing" target="_blank" rel="noopener noreferrer">Vapi</a>,
        <a href="https://elevenlabs.io/pricing/agents" target="_blank" rel="noopener noreferrer">ElevenLabs</a>,
        <a href="https://developers.openai.com/api/docs/pricing" target="_blank" rel="noopener noreferrer">OpenAI</a>.
        Funding and traction:
        <a href="https://techcrunch.com/2026/05/04/sierra-raises-950m-as-the-race-to-own-enterprise-ai-gets-serious/" target="_blank" rel="noopener noreferrer">Sierra $950M at $15.8B</a>,
        <a href="https://techcrunch.com/2026/02/04/elevenlabs-raises-500m-from-sequioia-at-a-11-billion-valuation/" target="_blank" rel="noopener noreferrer">ElevenLabs $500M at $11B</a>,
        <a href="https://techcrunch.com/2026/01/15/parloa-triples-its-valuation-in-8-months-to-3b-with-350m-raise/" target="_blank" rel="noopener noreferrer">Parloa $350M at $3B</a>,
        <a href="https://www.fiercehealthcare.com/ai-and-machine-learning/assort-health-scores-120m-series-c-scale-voice-ai-agent-platform-healthcare" target="_blank" rel="noopener noreferrer">Assort Health $120M at $1.2B</a>,
        <a href="https://techcrunch.com/2026/05/12/vapi-hits-500m-valuation-as-amazon-ring-chose-its-ai-platform-over-40-rivals/" target="_blank" rel="noopener noreferrer">Vapi $50M Series B</a>,
        <a href="https://www.forbes.com/sites/iainmartin/2025/12/15/polyai-raises-86-million-as-fight-to-answer-calls-with-ai-heats-up/" target="_blank" rel="noopener noreferrer">PolyAI $86M at $750M</a>,
        <a href="https://sacra.com/research/retell-ai-60m-yr-up-650-yoy/" target="_blank" rel="noopener noreferrer">Retell AI $60M ARR</a>.
        Latency and containment figures are reported production ranges, not a Flowpicker benchmark.`,
};
