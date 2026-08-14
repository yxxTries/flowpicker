// AI intake agent — legal and healthcare. Read Aug 2026.
module.exports = {
  slug: 'ai-intake-agent',
  updated: '2026-08-14',
  cardTitle: 'Client & patient intake',
  cardDesc: 'Captures and qualifies new clients where one lead is worth thousands. Legal and healthcare.',
  keywords: ['ai intake agent', 'ai legal intake', 'law firm intake software', 'ai patient intake', 'personal injury ai', 'lawmatics', 'clio grow', 'phreesia', 'best legal intake software 2026'],
  title: 'AI Intake Agents (2026): Legal & Patient Intake Providers Compared',
  metaDesc: 'AI intake agents for law firms and clinics — Smith.ai, Lawmatics, Clio Grow, Eve, Supio, EvenUp, Phreesia, Luma Health. Real pricing, how each qualifies a lead, and why intake economics invert every other agent vertical.',
  h1: 'AI agents for client and patient intake',
  hero: 'Intake is the agent job with the highest stakes per interaction: in personal injury or specialty care, a single captured lead can be worth thousands. That inverts the usual economics — here you optimise for capture rate, not cost per conversation. Below: how intake agents work, who builds them, and where each one fits.',

  intro: {
    lead: 'An intake agent answers a prospective client or patient, qualifies them against the criteria that decide whether they are worth taking on, collects the structured facts a case or chart needs, and either books the next step or declines politely. It is the same conversational machinery as a receptionist agent pointed at a much more valuable moment — which is why it is sold, and priced, completely differently.',
    stats: [
      { value: '$700M+', label: 'Identified funding across the plaintiff-law AI cluster' },
      { value: '$2B', label: 'EvenUp\'s valuation after a $150M Series E led by Bessemer' },
      { value: '$1B', label: 'Eve\'s valuation after raising $103M for plaintiff-firm AI' },
      { value: '$200–$2,000', label: 'Monthly range for credible legal intake tooling' },
    ],
    flowTitle: 'The intake conversation, step by step',
    flow: [
      { step: '1. Capture', text: 'Answer instantly on any channel. Speed here is the whole game — the lead is shopping.' },
      { step: '2. Qualify', text: 'Practice area, jurisdiction, statute of limitations, injury type, insurance. Screen out non-cases.' },
      { step: '3. Collect', text: 'Structured facts: dates, parties, providers, policy numbers — the fields a matter or chart requires.' },
      { step: '4. Conflict', text: 'Check against existing clients and adverse parties before anything is promised.' },
      { step: '5. Convert', text: 'Book the consult, send the engagement agreement or intake forms, capture a signature.' },
      { step: '6. Hand off', text: 'Write a complete record into the practice management system or EHR — not a call summary.' },
    ],
    blocks: [
      {
        h3: 'Why intake economics invert every other agent vertical',
        html: `      <p>In support, the goal is the lowest cost per resolution — vendors compete at $0.90 to $2.00. In intake, cost per conversation is close to irrelevant. If a signed personal injury case is worth tens of thousands in fees, paying $20 to handle the call that captures it is trivially correct, and the failure mode is not expense but a missed lead: reported figures put the share of callers who never call back after an unanswered first attempt at around 85%.</p>
      <p>Three consequences follow:</p>
      <ul>
        <li><strong>Hybrid human fallback is worth paying for here</strong> and almost nowhere else. Smith.ai charging the same for AI-first or human-first is a rational product for this buyer.</li>
        <li><strong>Speed to first response beats conversation quality.</strong> An adequate answer in 5 seconds outperforms an excellent one in 5 minutes.</li>
        <li><strong>The structured record is the deliverable.</strong> A beautiful conversation that leaves a paralegal re-keying twelve fields has captured nothing.</li>
      </ul>`,
      },
      {
        h3: 'Two vertical markets, barely overlapping',
        html: `      <ul>
        <li><strong>Legal intake</strong> — dominated by plaintiff-side firms, especially personal injury, where case value justifies real spend. The AI wave here went straight past intake into case work: medical record analysis, demand letters and case valuation. EvenUp at $2B and Eve at $1B are the markers, with the wider plaintiff-law cluster — EvenUp, Eve, Supio, Darrow, Hona, Theo AI, CaseMark — representing over $700M of identified funding.</li>
        <li><strong>Patient intake</strong> — a different problem: less about qualifying and more about collecting insurance, consents and payment before the visit, then writing it into the chart. Phreesia built a business on the in-office variant; Luma Health approaches it from communications and scheduling.</li>
      </ul>`,
      },
      {
        h3: 'Where intake agents fail',
        html: `      <ul>
        <li><strong>Conflict checks and jurisdiction.</strong> An agent that promises representation before a conflict check is a liability, not a productivity gain. Every legal deployment needs a hard gate here.</li>
        <li><strong>Declining well.</strong> Most intake calls are not cases. Turning someone down without generating a complaint — or an unauthorised-practice problem — is harder than saying yes.</li>
        <li><strong>Integration depth decides everything.</strong> If the agent cannot write into Clio, Filevine, MyCase or the EHR, staff re-enter the data and the ROI evaporates.</li>
        <li><strong>Compliance is not optional.</strong> HIPAA for patient intake, privilege and confidentiality for legal, plus call-recording consent in two-party states.</li>
      </ul>`,
      },
    ],
  },

  providers: {
    lead: 'Legal splits into intake-capture tools and the case-work AI that grew out of them. Healthcare splits into pre-visit intake and the voice agents that feed it.',
    cols: ['Provider', 'Type', 'What it is', 'Price anchor', 'Best fit'],
    rows: [
      ['Smith.ai', '<span class="agent-badge">Legal capture</span>', 'AI or human intake with deep legal PMS integrations', '$300–$2,100/mo (30–300 calls)', 'Firms where one signed case pays for a year'],
      ['Lawmatics', '<span class="agent-badge">Legal CRM</span>', 'Intake CRM and marketing automation, priced per firm', 'From ~$199/mo', 'Growing firms with real lead volume'],
      ['Clio Grow', '<span class="agent-badge">Legal CRM</span>', 'Intake front end to the Clio practice ecosystem', 'Per user', 'Firms already standardised on Clio'],
      ['QualifyAI / Josef', '<span class="agent-badge">Legal capture</span>', 'Automated qualification workflows and intake bots', 'Within the $200–$2,000/mo band', 'Firms with a clear qualification rubric'],
      ['Eve', '<span class="agent-badge">Legal AI</span>', 'Plaintiff-firm platform: intake through discovery', 'Custom', 'Plaintiff firms going all-in on AI'],
      ['Supio', '<span class="agent-badge">Legal AI</span>', 'Personal injury AI, heavy on medical records', 'Custom', 'PI firms drowning in records'],
      ['EvenUp', '<span class="agent-badge">Legal AI</span>', 'Demand letters and medical record analysis at $2B', 'Custom', 'PI firms scaling demand output'],
      ['Darrow', '<span class="agent-badge">Legal AI</span>', 'Case discovery — finds cases rather than screening them', 'Custom', 'Firms sourcing plaintiffs proactively'],
      ['Phreesia', '<span class="agent-badge">Patient intake</span>', 'Check-in, consents, eligibility and payment pre-visit', 'Custom', 'Practices fixing the front desk'],
      ['Luma Health', '<span class="agent-badge">Patient intake</span>', 'Intake plus scheduling, reminders and waitlists', 'From ~$250/mo', 'Clinics wanting one patient-comms layer'],
      ['Assort Health', '<span class="agent-badge">Voice intake</span>', 'Phone intake written straight into the EHR', 'Custom', 'Specialty practices with call volume'],
      ['Retell / Vapi', '<span class="agent-badge">Platform</span>', 'Build a custom intake agent on voice infrastructure', '$0.05–$0.31/min', 'Firms with unusual qualification logic'],
      ['Build your own', '<span class="agent-badge">DIY</span>', 'LLM + forms + PMS or EHR API', 'Model cost', 'High volume, fixed rubric, engineers on staff'],
    ],
    note: 'Legal and healthcare AI vendors overwhelmingly quote rather than publish. Treat the custom rows as "expect a sales conversation", and verify Smith.ai tiers against current plans.',
  },

  how: [
    {
      h3: 'Legal — capturing and qualifying the lead',
      items: [
        '<strong>Smith.ai</strong> — the most-used answer for firms, and the clearest expression of intake economics: the same plan can be answered AI-first or human-first at identical price, $300–$2,100/month for 30–300 calls with per-call overages of $8.50–$11.50. It reports handling 400,000+ calls a month with roughly 80% from law firms, and it integrates natively with Clio, Clio Grow, Lawmatics, MyCase, PracticePanther and Filevine — which is the part that actually matters, because the agent writes a matter rather than leaving a voicemail.',
        '<strong>Lawmatics</strong> — an intake CRM rather than an answering service, from about $199/month, priced per firm rather than per user (cheaper than Clio Grow for larger teams, pricier for a solo). It owns the follow-up sequence after capture, which is where most firms actually lose leads.',
        '<strong>Clio Grow</strong> — the same job inside the Clio ecosystem, billed per user. The argument for it is not features but that the matter, billing and documents already live in Clio.',
        '<strong>QualifyAI and Josef</strong> — lighter automation for firms that can articulate a qualification rubric and want it applied consistently. They sit in the $200–$2,000/month band that covers most credible legal intake tooling.',
      ],
    },
    {
      h3: 'Legal — the AI that moved past intake into the case',
      items: [
        '<strong>Eve</strong> — a plaintiff-firm platform spanning case intake, medical overviews, drafting and discovery. It reached a $1B valuation after raising $103M, having taken a $47M Series A led by Andreessen Horowitz. Intake is the entry point; the retention comes from the case work behind it.',
        '<strong>Supio</strong> — personal injury specific, strongest at ingesting and structuring medical records — the single most labour-intensive artefact in a PI case.',
        '<strong>EvenUp</strong> — the largest of the cluster at a $2B valuation after a $150M Series E led by Bessemer (with participation from RELX\'s venture arm), $385M raised in total. It automates demand letter generation and medical record analysis rather than the intake call itself.',
        '<strong>Darrow</strong> — inverts the problem: rather than qualifying inbound, it finds viable cases proactively. Relevant here because it competes for the same budget as intake tooling.',
      ],
    },
    {
      h3: 'Healthcare — intake as a pre-visit workflow',
      items: [
        '<strong>Phreesia</strong> — the incumbent for the in-office variant: patients check in, sign consents, verify insurance and pay on their own device or a kiosk before reaching the desk, with data flowing into the chart through EHR integration. Its intake is a revenue-cycle product as much as a clinical one.',
        '<strong>Luma Health</strong> — approaches intake through communications, from roughly $250/month, combining it with scheduling, multilingual reminders, referral follow-up and waitlist backfill. Choose it when the problem spans the whole patient journey rather than the check-in desk.',
        '<strong>Assort Health</strong> — the voice-first path, where intake happens on the phone and lands in the EHR. For most specialty practices the phone is still the intake channel, whatever the patient portal suggests.',
      ],
    },
    {
      h3: 'Building it yourself',
      items: [
        '<strong>Retell or Vapi</strong> — when your qualification logic is genuinely idiosyncratic, building on voice infrastructure at $0.05–$0.31 per minute costs a fraction of per-call intake pricing. The catch is that the conversation is the easy half; the integration into Clio, Filevine or an EHR is the work.',
        '<strong>Full DIY</strong> — an LLM, structured output for the intake fields, and API writes into your practice system. Defensible at high volume with a stable rubric. Not defensible for a firm taking thirty calls a month, where a missed case costs more than a year of Smith.ai.',
      ],
    },
  ],

  prosCons: [
    { name: 'Smith.ai', meta: 'Legal capture · $300–$2,100/mo', pros: ['Human fallback at no premium — right trade for high-value leads', 'Native writes into Clio, Filevine, MyCase, Lawmatics'], cons: ['Per-call overages of $8.50–$11.50 punish volume', 'Expensive if most calls are not cases'], verdict: '<b>Buy if</b> one signed case pays for a year of the subscription.' },
    { name: 'Lawmatics', meta: 'Legal CRM · from ~$199/mo', pros: ['Per-firm pricing beats per-seat for larger teams', 'Owns the follow-up sequence where leads are usually lost'], cons: ['Not an answering service — you still need call coverage', 'Pricier than Clio Grow for a solo practitioner'], verdict: '<b>Buy if</b> you capture leads fine but lose them in follow-up.' },
    { name: 'Clio Grow', meta: 'Legal CRM · per user', pros: ['Zero integration work if you already run Clio', 'Matter, billing and documents in one system'], cons: ['Per-user pricing scales badly with team size', 'Weak outside the Clio ecosystem'], verdict: '<b>Buy if</b> Clio is already your system of record.' },
    { name: 'QualifyAI / Josef', meta: 'Legal capture · $200–$2,000/mo', pros: ['Applies a qualification rubric consistently, every time', 'Cheaper than staffed intake for screening volume'], cons: ['Only as good as the rubric you write', 'Thinner integration depth than the incumbents'], verdict: '<b>Buy if</b> you know exactly what disqualifies a lead.' },
    { name: 'Eve', meta: 'Legal AI · custom, $1B valuation', pros: ['Spans intake through discovery, not just capture', 'Best-capitalised plaintiff-firm platform alongside EvenUp'], cons: ['Enterprise commitment, no public pricing', 'Plaintiff-side only'], verdict: '<b>Buy if</b> you are a plaintiff firm rebuilding the whole workflow.' },
    { name: 'Supio', meta: 'Legal AI · custom', pros: ['Strongest on medical record ingestion and structuring', 'Attacks the most labour-intensive part of a PI case'], cons: ['Narrow: personal injury only', 'Not an intake-capture product on its own'], verdict: '<b>Buy if</b> medical records are the bottleneck, not lead volume.' },
    { name: 'EvenUp', meta: 'Legal AI · custom, $2B valuation', pros: ['Demand letter automation with real scale behind it', '$385M raised — the category\'s deepest balance sheet'], cons: ['Downstream of intake; solves a different problem', 'Enterprise pricing and procurement'], verdict: '<b>Buy if</b> demand output, not intake, limits your caseload.' },
    { name: 'Darrow', meta: 'Legal AI · custom', pros: ['Finds cases instead of waiting for them', 'Differentiated from every intake tool here'], cons: ['Competes for intake budget without solving intake', 'Fit depends heavily on practice area'], verdict: '<b>Buy if</b> your constraint is case supply, not conversion.' },
    { name: 'Phreesia', meta: 'Patient intake · custom', pros: ['Consents, eligibility and payment before arrival', 'Broad EHR integration; a revenue-cycle product too'], cons: ['Built around the in-office visit', 'No public pricing'], verdict: '<b>Buy if</b> the check-in desk and collections are the problem.' },
    { name: 'Luma Health', meta: 'Patient intake · from ~$250/mo', pros: ['Intake, scheduling and reminders in one layer', 'Multilingual outreach across the care journey'], cons: ['Broad platform — you buy modules you may not need', 'Priced for practices, not solo providers'], verdict: '<b>Buy if</b> the whole patient journey leaks, not just intake.' },
    { name: 'Assort Health', meta: 'Voice intake · custom', pros: ['Intake by phone, which is how patients actually arrive', 'Specialty-specific with EHR writes'], cons: ['Healthcare only, enterprise motion', 'Overlaps tools you may already run'], verdict: '<b>Buy if</b> your intake queue is a ringing phone.' },
    { name: 'Retell / Vapi', meta: 'Platform · $0.05–$0.31/min', pros: ['A fraction of per-call intake pricing at volume', 'Model any qualification logic you like'], cons: ['You build every PMS and EHR integration', 'No human fallback unless you staff one'], verdict: '<b>Buy if</b> your rubric is unusual and volume justifies engineering.' },
  ],

  pick: [
    '<strong>Plaintiff or PI firm, leads are the constraint</strong> → Smith.ai for capture, and accept the human fallback premium.',
    '<strong>You capture leads but lose them</strong> → Lawmatics. The problem is follow-up, not answering.',
    '<strong>Already on Clio</strong> → Clio Grow, unless team size makes per-user pricing painful.',
    '<strong>Medical records or demand letters are the bottleneck</strong> → Supio or EvenUp; neither is an intake tool.',
    '<strong>Clinic fixing the front desk and collections</strong> → Phreesia. Fixing the whole journey → Luma Health.',
    '<strong>Patients intake by phone</strong> → Assort Health, or build on Retell if your logic is odd.',
  ],

  investor: [
    '<strong>Intake is a wedge, not a market.</strong> Every well-funded legal AI company entered near intake and moved into case work — Eve into discovery, EvenUp into demands, Supio into records. Intake gets you the account; document-heavy work retains it. Fund the second step, not the first.',
    '<strong>Value per interaction rewrites the pricing model.</strong> Where support agents fight over $0.90 per resolution, intake tools sustain $8.50–$11.50 per call, because the buyer is comparing against a lost case rather than a support ticket. Any vertical where one conversation is worth thousands can carry an order of magnitude more price.',
    '<strong>Plaintiff law is the most concentrated bet in vertical AI.</strong> Over $700M into a handful of companies serving one side of one practice area, on the logic that contingency fees make ROI immediate and provable. Watch whether the same concentration appears in specialty medicine.',
    '<strong>Integration depth is the moat, not conversation quality.</strong> Smith.ai\'s defensibility is that it writes into Clio, Filevine, MyCase and PracticePanther. A better-sounding agent that leaves staff re-keying data loses to a worse one that does not.',
    '<strong>Hybrid human fallback survives here.</strong> Everywhere else it looks like transitional scaffolding; in intake it is a permanent feature, because the cost of the human is negligible against the value of the captured case.',
  ],

  faq: [
    { q: 'What is an AI intake agent?', a: 'An agent that answers a prospective client or patient, qualifies them against your criteria, collects the structured facts a case file or chart needs, checks for conflicts, and books the next step — then writes a complete record into your practice management system or EHR. It differs from a receptionist agent mainly in what happens after the conversation.' },
    { q: 'How much does AI legal intake cost?', a: 'Credible legal intake tooling sits in a $200–$2,000 per month band. Smith.ai runs $300–$2,100 a month for 30–300 calls with $8.50–$11.50 per-call overages; Lawmatics starts around $199 a month priced per firm; Clio Grow bills per user. Case-work platforms like Eve, Supio and EvenUp are quote-only enterprise contracts.' },
    { q: 'Why is intake priced so much higher than AI support agents?', a: 'Because the value per conversation is orders of magnitude higher. A support vendor competes at $0.90–$2.00 per resolution against the cost of a support ticket. An intake tool is measured against a lost case worth tens of thousands in fees, so $10 a call is trivially worth paying — and human fallback is worth paying for too.' },
    { q: 'Can an AI agent do conflict checks?', a: 'It can trigger one, but it should never promise representation before the check clears. Treat conflict checking as a hard gate in the workflow rather than something the model reasons about, and make sure the agent is scripted to avoid anything that reads as legal advice or engagement.' },
    { q: 'What is the best AI intake software for a law firm?', a: 'For capture with human fallback, Smith.ai — largely because it writes natively into Clio, Clio Grow, Lawmatics, MyCase, PracticePanther and Filevine. For follow-up after capture, Lawmatics. If you are already standardised on Clio, Clio Grow removes the integration question entirely.' },
    { q: 'Is AI patient intake HIPAA compliant?', a: 'Vendor-dependent. Healthcare-specific platforms — Phreesia, Luma Health, Assort Health — build compliance in and sign BAAs as standard. If you build on general voice infrastructure instead, compliance is a paid add-on: Vapi, for example, charges $2,000 a month for HIPAA. Never assume a standard plan covers you.' },
  ],

  cta: 'Building custom intake on voice or LLM infrastructure? Flowpicker compares the model, orchestration and integration layers.',

  sources: `        Pricing and integrations read in August 2026:
        <a href="https://smith.ai/pricing" target="_blank" rel="noopener noreferrer">Smith.ai</a>,
        <a href="https://crossing.one/archive/ai-intake-agent-law-firm-cost-comparison-2026" target="_blank" rel="noopener noreferrer">legal intake cost comparison</a>,
        <a href="https://aiforlawfirms.org/lawmatics-crm-review/" target="_blank" rel="noopener noreferrer">Lawmatics</a>,
        <a href="https://www.selecthub.com/p/patient-engagement-software/luma-health/" target="_blank" rel="noopener noreferrer">Luma Health</a>,
        <a href="https://www.selecthub.com/patient-engagement-software/phreesia-vs-luma-health/" target="_blank" rel="noopener noreferrer">Phreesia vs Luma Health</a>.
        Funding:
        <a href="https://www.legal.io/articles/5738408/AI-Startup-Eve-Reaches-1B-Valuation-With-New-Funding-Round" target="_blank" rel="noopener noreferrer">Eve $1B</a>,
        <a href="https://www.artificiallawyer.com/2025/10/07/plaintiff-bar-ai-takes-off-evenup-bags-150m/" target="_blank" rel="noopener noreferrer">EvenUp $150M at $2B</a>,
        <a href="https://newmarketpitch.com/blogs/news/legal-ai-top-startups-fundraising" target="_blank" rel="noopener noreferrer">plaintiff-law AI funding cluster</a>.
        Call-abandonment and firm-volume figures are vendor-reported, not independently audited.`,
};
