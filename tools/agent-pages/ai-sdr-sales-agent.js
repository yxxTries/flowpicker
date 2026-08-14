// AI SDR / sales development agent. Pricing and traction read Aug 2026.
module.exports = {
  slug: 'ai-sdr-sales-agent',
  updated: '2026-08-14',
  cardTitle: 'SDR / sales',
  cardDesc: 'Prospects, personalises and books meetings. The category that overpromised — and what replaced it.',
  keywords: ['ai sdr', 'ai sales agent', 'ai sdr pricing', '11x pricing', 'artisan ai ava', 'regie.ai', 'clay gtm', 'best ai sdr 2026', 'ai sales development representative'],
  title: 'AI SDR Agents (2026): 12 Providers, Real Pricing, and the Churn Nobody Mentions',
  metaDesc: 'AI SDR tools compared — 11x, Artisan, Regie, AiSDR, Qualified Piper, Clay, Unify. What they actually cost, why first-generation AI SDRs churned at 50–70%, and which model is working in 2026.',
  h1: 'AI agents for sales development',
  hero: 'The agent that finds prospects, writes the outreach, and books the meeting. It is also the vertical with the widest gap between the 2024 pitch and the 2026 results — so this page covers both what these tools cost and why the category corrected.',

  intro: {
    lead: 'An AI SDR agent researches a prospect, decides they are worth contacting, writes something personalised, sends it across email and LinkedIn, handles the reply, and books a meeting on an account executive\'s calendar. Every part of that works in isolation. The category\'s problem was never capability — it was that running the whole loop autonomously breaks the channel it depends on.',
    stats: [
      { value: '50–70%', label: 'Reported annual churn for AI SDR tools — roughly double human SDR turnover' },
      { value: '2.6×', label: 'Revenue human SDRs generated vs AI in a reported head-to-head ($147k vs $56k)' },
      { value: '$5B', label: 'Clay\'s valuation — the data layer beneath the agents, not the agent' },
      { value: '$250–$3,750', label: 'Published monthly range, from AiSDR Solo to 11x Growth' },
    ],
    flowTitle: 'The outbound loop, step by step',
    flow: [
      { step: '1. Source', text: 'Pull accounts and contacts from a data provider, then filter to an ICP definition.' },
      { step: '2. Enrich', text: 'Waterfall enrichment across vendors for email, role, tech stack, funding, hiring signals.' },
      { step: '3. Signal', text: 'Score intent — job changes, funding, site visits. The step that decides if outreach is welcome.' },
      { step: '4. Write', text: 'Generate a personalised sequence per contact, grounded in the enrichment, not a mail-merge token.' },
      { step: '5. Send', text: 'Rotate inboxes and domains, warm them, pace volume to protect deliverability.' },
      { step: '6. Handle', text: 'Classify replies, answer objections, book the meeting, or route a real human in.' },
    ],
    blocks: [
      {
        h3: 'What actually went wrong',
        html: `      <p>By April 2026, Bain Capital Ventures stated plainly that fully autonomous AI SDRs had not replaced human sales teams at any meaningful scale. Three failure modes explain most of it:</p>
      <ul>
        <li><strong>Deliverability is a shared resource you can burn.</strong> Cold outbound routinely runs 0.5–1% complaint rates without aggressive list hygiene. An agent that can send ten times more email does not get ten times the pipeline — it gets its domain filtered, and the cost shifts from labour savings to domain and brand spend.</li>
        <li><strong>Personalisation collapses toward templates at scale.</strong> The thousandth "I noticed you're hiring SDRs" is a template whether or not an LLM wrote it. Recipients pattern-match faster than models vary.</li>
        <li><strong>The metric was meetings booked, not revenue.</strong> Reported head-to-head tests put human SDRs at 71% meeting show rates against 52% for AI. Booking a meeting nobody attends is a measurable success and a commercial nothing.</li>
      </ul>
      <p>The churn numbers followed: 50–70% annually across the category by multiple reports, with 11x reported at 75% three-month churn. That is not a product tweak away from fixed — it is a signal the unit sold did not match the value delivered.</p>`,
      },
      {
        h3: 'What replaced it: GTM engineering',
        html: `      <p>The money moved one layer down. Instead of buying an autonomous agent, teams hired a "GTM engineer" — 400+ open roles at a roughly $160k median — and gave them a programmable data layer. Clay is the winner of that shift: roughly $150M ARR by May 2026 and a $5B valuation, selling the enrichment and orchestration substrate rather than the agent on top.</p>
      <p>The working 2026 pattern is hybrid, and about 45% of sales teams are reported to run it: AI does the research, enrichment, list building and drafting — the roughly 70% of SDR time that is admin — and humans own the conversation. That is a real productivity gain. It is not the "fire your SDR team" pitch that sold the category.</p>`,
      },
      {
        h3: 'The honest test before you buy',
        html: `      <ul>
        <li><strong>Are you buying volume or precision?</strong> If your TAM is 2,000 accounts, more email is the wrong lever entirely and no AI SDR will help.</li>
        <li><strong>Who owns deliverability?</strong> If the vendor's answer is "we rotate inboxes", ask what happens to your primary domain when complaint rates climb.</li>
        <li><strong>What is the contract length against the reported churn?</strong> Annual prepay into a category with 50–70% churn is a specific risk, not a general one.</li>
        <li><strong>Measure show rates and pipeline, never meetings booked.</strong> The gap between those two numbers is where this category hid for two years.</li>
      </ul>`,
      },
    ],
  },

  providers: {
    lead: 'Three groups now: the autonomous AI SDRs that defined the category, the data and orchestration layer that beat them commercially, and the incumbent sales platforms absorbing both.',
    cols: ['Provider', 'Type', 'What it is', 'Price anchor', 'Best fit'],
    rows: [
      ['11x', '<span class="agent-badge">Autonomous</span>', 'Alice and Julian — the category-defining AI SDRs', '~$3,750/mo annual (~$36–40k/yr)', 'Enterprises testing autonomous outbound'],
      ['Artisan', '<span class="agent-badge">Autonomous</span>', 'Ava, sold with data and deliverability bundled', 'Quote-scoped; ~2,500–6,000 leads/mo tiers', 'Teams wanting one vendor for the whole loop'],
      ['AiSDR', '<span class="agent-badge">Autonomous</span>', 'The accessible end of the category', 'From $250/mo (Solo)', 'Founders testing outbound cheaply'],
      ['Regie.ai', '<span class="agent-badge">Hybrid</span>', 'Agents inside a rep\'s workflow, sold per seat', '$180–$499/user/mo, seat minimums', 'Existing SDR teams adding leverage'],
      ['Qualified (Piper)', '<span class="agent-badge">Inbound</span>', 'Inbound website SDR — now part of Agentforce', 'Acquired by Salesforce, April 2026', 'Salesforce shops with heavy web traffic'],
      ['Clay', '<span class="agent-badge">Data layer</span>', 'Programmable enrichment and GTM orchestration', '~$30k/yr median contract', 'Teams with a GTM engineer'],
      ['Unify', '<span class="agent-badge">Data layer</span>', 'Intent signals plus sequencing in one product', '$1,740/mo annual (~$21k/yr)', 'Signal-led outbound'],
      ['Common Room', '<span class="agent-badge">Data layer</span>', 'Person-level signal aggregation — acquired by Zoom', 'Acquired July 2026', 'PLG motions with community signal'],
      ['Apollo.io', '<span class="agent-badge">Data + SEP</span>', 'Database and sequencing at self-serve prices', 'Low per-seat, self-serve', 'Budget-constrained teams'],
      ['Outreach / Salesloft', '<span class="agent-badge">Incumbent</span>', 'Sales engagement platforms adding agents', 'Enterprise per-seat', 'Established sales orgs'],
      ['Salesforce Agentforce SDR', '<span class="agent-badge">CRM suite</span>', 'SDR agent native to CRM data', '$2/conversation or $0.10/action', 'Salesforce-committed enterprises'],
      ['Build your own', '<span class="agent-badge">DIY</span>', 'Clay or an API + LLM + your own inbox infra', 'Data + model cost', 'GTM engineers with a specific motion'],
    ],
    note: 'Published AI SDR pricing is unusually unstable — several vendors moved to quote-only during 2026 and third-party reports disagree. Treat every figure here as an anchor to verify, not a quote.',
  },

  how: [
    {
      h3: 'Autonomous AI SDRs — the agent owns the loop',
      items: [
        '<strong>11x</strong> — the company that defined the category, selling Alice for outbound and Julian for voice. Published pricing has been inconsistent (roughly $3,750/mo billed annually, or a stated $36,000/year, with buyers reporting a median near $40k), which is itself informative. It runs the full loop autonomously, which is exactly the model that drew the churn reporting — 75% at three months in one account.',
        '<strong>Artisan</strong> — sells Ava as an "AI employee", bundling B2B data, enrichment and deliverability management so you are not assembling a stack. Pricing moved to quote-scoped during 2026, with tiers described by volume (~2,500 leads/month on Team, ~6,000 on Scale) rather than dollars; third-party reports range from $280 to $5,000 a month. Bundling data is the genuine differentiator — it removes the most common failure point, which is bad lists.',
        '<strong>AiSDR</strong> — the cheap entry at $250/month for a solo tier. Useful for testing whether outbound works for you at all before committing five figures, provided you accept it is a lighter product.',
      ],
    },
    {
      h3: 'Hybrid — agents inside a human workflow',
      items: [
        '<strong>Regie.ai</strong> — the clearest expression of the correction: it sells per seat to teams that still have reps. AI SEP runs $180/user/month on annual with a 10-seat minimum; the Force Multiplier Rep tier is $499/user/month with a 5-seat minimum; the full RegieOne platform is quote-only, with third parties reporting $2,000–6,000/month. Seat-based pricing signals the agent augments a rep rather than replacing one — which matches what actually works.',
        '<strong>Qualified (Piper)</strong> — attacked inbound rather than outbound, which sidesteps the entire deliverability problem: Piper engages visitors already on your website, where the intent is real and the channel cannot be spam-filtered. Salesforce closed its acquisition on 1 April 2026 and folded Piper into Agentforce. That inbound-first thesis is why it got acquired while outbound-first peers churned.',
        '<strong>Outreach and Salesloft</strong> — the incumbent sales engagement platforms adding agentic features to sequences reps already live in. Less exciting, much stickier, and they own the workflow the AI-natives had to persuade reps to leave.',
      ],
    },
    {
      h3: 'The data layer — where the value actually accrued',
      items: [
        '<strong>Clay</strong> — a programmable GTM environment: waterfall enrichment across dozens of data vendors, then LLM calls over the results to research, score and draft at row level. It sells the substrate rather than the autonomy, and it won — roughly $150M ARR by May 2026, up from $108M at the end of 2025, a $5B valuation after a January 2026 tender, and median contracts around $30k/year. It also requires someone to operate it, which is what "GTM engineer" means.',
        '<strong>Unify</strong> — combines intent signals with sequencing so outbound fires on a trigger rather than a schedule, at $1,740/month billed annually. Raised a $40M Series B led by Battery at a $260M valuation.',
        '<strong>Common Room</strong> — aggregated person-level signal across community, product and social surfaces; Zoom agreed to acquire it in July 2026, another data-layer exit rather than an agent exit.',
        '<strong>Apollo.io</strong> — database plus sequencing at self-serve prices. Not an agent, but for a large share of teams it is the honest alternative: the data and the sending, with a human writing.',
        '<strong>Build your own</strong> — Clay or a data API, an LLM for research and drafting, and your own inbox infrastructure. This is what most sophisticated GTM teams actually run in 2026, and it is why the autonomous vendors struggled to hold accounts: the pieces are assemblable by one competent operator.',
      ],
    },
  ],

  prosCons: [
    { name: '11x', meta: 'Autonomous · ~$3,750/mo annual', pros: ['Most complete autonomous loop in the category', 'Outbound and voice agents under one platform'], cons: ['Reported 75% three-month churn in one account', 'Published pricing has been inconsistent and quote-driven'], verdict: '<b>Buy if</b> you are explicitly running an experiment with a budget you can lose.' },
    { name: 'Artisan', meta: 'Autonomous · quote-scoped', pros: ['Bundles data and deliverability — removes the top failure point', 'Volume tiers are clear even when pricing is not'], cons: ['No public pricing; reported range spans 18×', 'Still an autonomous model in a category that corrected'], verdict: '<b>Buy if</b> you want one vendor accountable for lists, sending and replies.' },
    { name: 'AiSDR', meta: 'Autonomous · from $250/mo', pros: ['Cheapest way to test whether outbound works for you', 'No five-figure annual commitment'], cons: ['Lighter product than the enterprise tier', 'Same structural deliverability risk at volume'], verdict: '<b>Buy if</b> you are a founder validating a motion, not scaling one.' },
    { name: 'Regie.ai', meta: 'Hybrid · $180–$499/user/mo', pros: ['Per-seat model matches what actually works — augmentation', 'Sits in the workflow reps already use'], cons: ['Seat minimums (10 and 5) exclude small teams', 'Full platform is quote-only'], verdict: '<b>Buy if</b> you have reps and want them faster, not fewer.' },
    { name: 'Qualified (Piper)', meta: 'Inbound · now part of Agentforce', pros: ['Inbound intent sidesteps deliverability entirely', 'Validated by a Salesforce acquisition'], cons: ['Only useful with meaningful website traffic', 'Future is tied to Agentforce packaging'], verdict: '<b>Buy if</b> traffic arrives and nobody follows up fast enough.' },
    { name: 'Clay', meta: 'Data layer · ~$30k/yr median', pros: ['The substrate that beat the agents commercially', 'Waterfall enrichment plus LLM research at row level'], cons: ['Needs a dedicated operator to be worth it', 'Credit-based costs are easy to run away with'], verdict: '<b>Buy if</b> you have — or will hire — a GTM engineer.' },
    { name: 'Unify', meta: 'Data layer · $1,740/mo annual', pros: ['Signal-triggered outbound beats scheduled outbound', 'Enrichment and sequencing in one place'], cons: ['Smaller ecosystem than Clay', 'Annual commitment at a mid-market price'], verdict: '<b>Buy if</b> you want outbound to fire on triggers, not calendars.' },
    { name: 'Common Room', meta: 'Data layer · acquired by Zoom', pros: ['Best-in-class person-level signal aggregation', 'Strong fit for product-led motions'], cons: ['Roadmap now depends on Zoom', 'Acquisition uncertainty for new buyers'], verdict: '<b>Buy if</b> community and product signals drive your pipeline — with eyes open.' },
    { name: 'Apollo.io', meta: 'Data + SEP · self-serve', pros: ['Lowest cost path to data plus sequencing', 'No agent premium on top of the database'], cons: ['Data quality is variable at the edges', 'You supply the intelligence yourself'], verdict: '<b>Buy if</b> the honest answer is you need a list and a sender.' },
    { name: 'Outreach / Salesloft', meta: 'Incumbent · enterprise per-seat', pros: ['Own the workflow reps already work inside', 'Governance, reporting and compliance are mature'], cons: ['Agent features trail the AI-natives', 'Enterprise pricing and procurement'], verdict: '<b>Buy if</b> you already run one and want agents without a migration.' },
    { name: 'Agentforce SDR', meta: 'CRM suite · $2/conv or $0.10/action', pros: ['Native to CRM data with no integration lift', 'Same contract as the rest of Salesforce'], cons: ['Conversation billing is hard to forecast', 'Weakest fit outside the Salesforce estate'], verdict: '<b>Buy if</b> your pipeline already lives in Salesforce.' },
    { name: 'Build your own', meta: 'DIY · data + model cost', pros: ['What most sophisticated GTM teams actually run', 'Full control of sending reputation and messaging'], cons: ['Requires a competent operator, permanently', 'You own deliverability when it goes wrong'], verdict: '<b>Buy if</b> your motion is specific and you have the operator.' },
  ],

  pick: [
    '<strong>Testing whether outbound works at all</strong> → AiSDR at $250/mo, or Apollo plus a human writing.',
    '<strong>You have reps and want leverage</strong> → Regie.ai. Per-seat augmentation is the model with evidence behind it.',
    '<strong>You have website traffic going unworked</strong> → Qualified/Piper. Inbound intent beats any outbound agent.',
    '<strong>You have or will hire a GTM engineer</strong> → Clay, and skip the autonomous layer entirely.',
    '<strong>You want one vendor accountable end to end</strong> → Artisan, because bundled data fixes the most common failure.',
    '<strong>You were about to prepay a year for an autonomous SDR</strong> → don\'t. Pilot quarterly and measure show rates and pipeline, not meetings booked.',
  ],

  investor: [
    '<strong>The picks-and-shovels layer won outright.</strong> Clay at $5B and roughly $150M ARR, against a cohort of autonomous SDR vendors reporting 50–70% churn. When the application layer churns and the data layer compounds, the moat was never the agent.',
    '<strong>Churn exposed a unit-of-value mismatch.</strong> These tools were priced like an employee replacement (~$36–40k/year, the cost of a junior SDR) while delivering a productivity tool. Regie\'s per-seat pricing and Qualified\'s inbound focus are the two corrections that stuck.',
    '<strong>Deliverability is a commons, and the category over-grazed it.</strong> Any product whose output degrades as adoption rises has a structural ceiling. This is the clearest example in enterprise AI, and worth checking for in any "AI does outbound X" pitch.',
    '<strong>Inbound is the defensible half.</strong> Qualified got acquired by Salesforce; outbound-first peers did not. Where intent is genuine and the channel cannot be filtered, agents work — and that logic generalises well beyond sales.',
    '<strong>Consolidation is running through the data layer.</strong> Salesforce bought Qualified, Zoom bought Common Room. The acquirers are buying signal and workflow position, not autonomy.',
  ],

  faq: [
    { q: 'How much does an AI SDR cost?', a: 'Published pricing runs from $250/month for AiSDR\'s solo tier to about $3,750/month for 11x\'s Growth plan billed annually — roughly $36,000–40,000 a year, deliberately close to a junior SDR salary. Regie.ai charges per seat instead, $180–$499 per user per month with seat minimums. Several vendors moved to quote-only pricing during 2026.' },
    { q: 'Do AI SDRs actually work?', a: 'Not as autonomous replacements. Bain Capital Ventures noted in April 2026 that fully autonomous AI SDRs had not replaced human sales teams at meaningful scale, and reported head-to-head tests showed human SDRs generating 2.6× the revenue with 71% meeting show rates against 52%. What does work is the hybrid model — AI handles research, enrichment and drafting; humans own conversations.' },
    { q: 'Why do AI SDR tools churn so much?', a: 'Reported churn is 50–70% annually, roughly double human SDR turnover. Three causes: cold outbound deliverability degrades as volume rises, personalisation converges on templates at scale, and the tools were measured on meetings booked rather than pipeline or revenue — so the gap surfaced only at renewal.' },
    { q: 'Is Clay an AI SDR?', a: 'No, and that distinction explains its success. Clay is the data and orchestration layer underneath — waterfall enrichment plus LLM research at row level — that a human operator, the "GTM engineer", drives. It reached roughly $150M ARR and a $5B valuation while the autonomous agents above it churned.' },
    { q: 'What is a GTM engineer?', a: 'The role that emerged to operate tools like Clay: someone who builds go-to-market systems — enrichment waterfalls, scoring logic, triggered sequences — rather than sending emails manually. There are 400+ open roles at a roughly $160k median salary, which is the clearest evidence that outbound became an engineering problem rather than a headcount one.' },
    { q: 'Will an AI SDR hurt my domain reputation?', a: 'It can, and this is the risk to underwrite before buying. Cold outbound runs 0.5–1% complaint rates without aggressive list hygiene, and an agent that sends far more volume reaches filtering thresholds faster. Ask any vendor what happens to your primary sending domain when complaint rates climb — "we rotate inboxes" is not an answer.' },
  ],

  cta: 'Assembling the enrichment, model and orchestration layer yourself? Flowpicker compares the pieces side by side.',

  sources: `        Pricing and traction read in August 2026:
        <a href="https://altitudebiz.dev/notes/ai-sdr-pricing-index" target="_blank" rel="noopener noreferrer">AI SDR pricing index</a>,
        <a href="https://www.artisan.co/pricing" target="_blank" rel="noopener noreferrer">Artisan tiers</a>,
        <a href="https://formanorden.com/blog/ai-sdr-pricing/" target="_blank" rel="noopener noreferrer">11x and Regie rates</a>,
        <a href="https://gtmlens.com/vendors/unify/" target="_blank" rel="noopener noreferrer">Unify</a>.
        Funding and outcomes:
        <a href="https://sacra.com/c/clay/" target="_blank" rel="noopener noreferrer">Clay revenue and valuation</a>,
        <a href="https://www.clay.com/blog/series-b-expansion" target="_blank" rel="noopener noreferrer">Clay funding history</a>.
        Category performance:
        <a href="https://www.kwanzoo.com/blog/why-first-gen-ai-sdrs-failed" target="_blank" rel="noopener noreferrer">why first-generation AI SDRs failed</a>,
        <a href="https://salesmotion.io/blog/ai-sdrs-vs-human-sdrs" target="_blank" rel="noopener noreferrer">AI vs human SDR comparison</a>.
        Churn, show-rate and head-to-head revenue figures are reported by vendors and analysts with commercial interests in the answer — directionally consistent across sources, but not independently audited.`,
};
