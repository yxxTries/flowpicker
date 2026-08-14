// AI booking / scheduling / appointment agent. Read Aug 2026.
module.exports = {
  slug: 'ai-appointment-scheduling-agent',
  updated: '2026-08-14',
  cardTitle: 'Booking & scheduling',
  cardDesc: 'Two different markets wearing one name — customer booking vs internal calendar. 14 providers.',
  keywords: ['ai scheduling agent', 'ai appointment booking', 'ai booking system', 'ai calendar assistant', 'motion vs reclaim', 'calendly ai', 'patient scheduling ai', 'ai appointment scheduling 2026'],
  title: 'AI Scheduling & Booking Agents (2026): Customer Booking vs Calendar AI, Compared',
  metaDesc: '"AI scheduling" is two markets: customer-facing booking agents (Luma Health, Boulevard, Mindbody, receptionist bundles) and internal calendar AI (Motion, Reclaim, Calendly). Real pricing and which one you actually need.',
  h1: 'AI agents for booking and scheduling',
  hero: 'Search "AI scheduling agent" and you get two unrelated products: one that books your customers, and one that rearranges your own week. They have different buyers, different economics, and only one of them is growing. Here is the split, with real pricing on both sides.',

  intro: {
    lead: 'Scheduling is the most common thing an AI agent is asked to do and the least common thing sold on its own. Customer-facing booking is almost always a feature inside a receptionist product or a vertical platform — nobody buys "a booking agent" separately. Internal calendar AI is a genuine standalone category, but it is consolidating fast, and one of its best-known products was shut down in March 2026.',
    stats: [
      { value: '$8–$29', label: 'Per seat, per month — the entire internal calendar AI category' },
      { value: '$99–$410', label: 'Per location, per month — vertical booking platforms with AI attached' },
      { value: 'Mar 2026', label: 'Clockwise discontinued after its Salesforce acquisition' },
      { value: '$250/mo', label: 'Entry price for Luma Health, the healthcare scheduling reference point' },
    ],
    flowTitle: 'What a booking agent actually does',
    flow: [
      { step: '1. Identify', text: 'Who is this — new or returning? Pull the record, history and any account constraints.' },
      { step: '2. Qualify', text: 'What service, how long, with which provider, and are they eligible or insured for it?' },
      { step: '3. Search', text: 'Real availability across staff, rooms, equipment and buffers — not just an open calendar slot.' },
      { step: '4. Negotiate', text: 'Offer options, handle "anything sooner?", hold the slot while the caller decides.' },
      { step: '5. Commit', text: 'Write the booking, take a deposit or card-on-file, send confirmation across SMS and email.' },
      { step: '6. Protect', text: 'Reminders, reschedules, waitlist backfill when someone cancels — where the ROI actually lives.' },
    ],
    blocks: [
      {
        h3: 'The two markets, and why it matters which one you are in',
        html: `      <ul>
        <li><strong>Customer-facing booking</strong> — the agent talks to your customers and writes into your business calendar. The hard part is not conversation, it is the constraint solving: staff skills, room and equipment availability, buffers, insurance eligibility, deposit rules. This is why it ships inside vertical platforms rather than as a standalone agent.</li>
        <li><strong>Internal calendar AI</strong> — the agent rearranges your own week around meetings, tasks and focus time. The hard part is preference modelling, and the buyer is an individual or a team lead with a small budget. Prices sit at $8–$29 per seat because that is what productivity software commands.</li>
      </ul>
      <p>Conflating them wastes procurement cycles. If your problem is missed bookings and no-shows, no amount of calendar optimisation helps. If your problem is a fragmented week, a receptionist agent is irrelevant.</p>`,
      },
      {
        h3: 'Where the money actually is: the no-show',
        html: `      <p>Booking is not the valuable part — anyone can book. The margin sits in the three things around it: filling cancellations from a waitlist automatically, reducing no-shows with well-timed multi-channel reminders, and taking a deposit at the point of booking. A clinic that recovers two cancelled slots a day has paid for the software many times over, which is why healthcare and beauty platforms lead here and generic schedulers do not.</p>`,
      },
      {
        h3: 'The consolidation signal',
        html: `      <p>Standalone calendar AI is being absorbed. Salesforce acquired Clockwise and discontinued the product on 27 March 2026, pointing users at Reclaim — which is itself now operated by Dropbox. Motion remains independent and has moved up-market with an "AI employee" tier. The pattern is clear: calendar optimisation is a feature of a larger suite, not a company. Customer-facing booking, meanwhile, keeps consolidating <em>into</em> vertical platforms that own the payment and the customer record.</p>`,
      },
    ],
  },

  providers: {
    lead: 'Split by which of the two problems they solve. Vertical booking platforms are priced per location; calendar AI is priced per seat; receptionist agents cover booking as one job among several.',
    cols: ['Provider', 'Type', 'What it is', 'Price anchor', 'Best fit'],
    rows: [
      ['Luma Health', '<span class="agent-badge">Healthcare</span>', 'Patient scheduling, waitlist backfill, multilingual outreach', 'From ~$250/mo', 'Clinics and physician groups'],
      ['Phreesia', '<span class="agent-badge">Healthcare</span>', 'Intake-first: check-in, eligibility, payment, then scheduling', 'Custom', 'Practices optimising the in-office visit'],
      ['Assort Health', '<span class="agent-badge">Healthcare</span>', 'Voice agent that books directly into the EHR', 'Custom', 'Specialty practices with phone volume'],
      ['Boulevard', '<span class="agent-badge">Beauty</span>', 'Salon and medspa booking with AI attached', '$176–$410/mo per location', 'Salons, spas, medspas'],
      ['Mindbody', '<span class="agent-badge">Fitness</span>', 'Class and appointment booking for wellness businesses', 'From ~€99/mo per location', 'Studios, gyms, wellness'],
      ['Slang.ai', '<span class="agent-badge">Hospitality</span>', 'Voice booking wired into OpenTable and SevenRooms', '$399–$599/mo per location', 'Restaurants'],
      ['Rosie / Goodcall', '<span class="agent-badge">Receptionist</span>', 'Booking as one job inside a phone agent', '$49–$299/mo', 'Small local service businesses'],
      ['Motion', '<span class="agent-badge">Calendar AI</span>', 'Auto-schedules your day around tasks and deadlines', '$19–$29/seat/mo; ~$49 AI tier', 'Individuals drowning in tasks'],
      ['Reclaim.ai', '<span class="agent-badge">Calendar AI</span>', 'Smart time blocking and habit scheduling', '~$8/mo', 'Teams wanting defended focus time'],
      ['Calendly', '<span class="agent-badge">Booking links</span>', 'Booking links plus routing forms and analytics', '~$10/seat/mo', 'B2B meeting scheduling'],
      ['Clockwise', '<span class="agent-badge">Discontinued</span>', 'Acquired by Salesforce, shut down 27 March 2026', '—', 'Nobody — migrate off'],
      ['Cal.com', '<span class="agent-badge">Open source</span>', 'Self-hostable scheduling infrastructure with an API', 'Free self-hosted; paid cloud', 'Teams embedding booking in a product'],
      ['Agentforce / CRM', '<span class="agent-badge">CRM suite</span>', 'Scheduling as an agent action inside the CRM', '$0.10/action', 'Salesforce estates'],
      ['Build your own', '<span class="agent-badge">DIY</span>', 'Voice or chat agent + calendar API + your rules engine', 'Model + telephony cost', 'Odd constraints no platform models'],
    ],
    note: 'Vertical platform pricing varies by module and promotional terms; treat per-location figures as anchors to quote against.',
  },

  how: [
    {
      h3: 'Healthcare — where scheduling is genuinely hard',
      items: [
        '<strong>Luma Health</strong> — the reference point for patient scheduling, from roughly $250/month. Its value is not the booking screen but the surrounding machinery: automated outreach, multilingual reminders, referral follow-up, and a smart waitlist that fills cancellations without staff intervention. No-show reduction is the line item that justifies it.',
        '<strong>Phreesia</strong> — approaches the same problem from intake rather than scheduling. Patients check in, sign consents, verify insurance and pay on their own device before reaching the desk, with the data flowing into the chart via EHR integration. Choose it when the in-office visit and revenue cycle are the bottleneck rather than filling the calendar.',
        '<strong>Assort Health</strong> — the voice-first option: a phone agent that speaks specialty workflows and writes appointments straight into the EHR. It belongs on this page because for most clinics the booking channel <em>is</em> the phone. See the <a href="ai-receptionist.html">receptionist comparison</a> for how it stacks up against generalist voice agents.',
      ],
    },
    {
      h3: 'Vertical platforms — booking bundled with payments',
      items: [
        '<strong>Boulevard</strong> — salon and medspa focused, with tiers from about $176 to $410 per month per location. The AI features sit on top of a business platform that already owns the client record, the card on file and the staff roster — which is exactly why a standalone booking agent cannot compete here.',
        '<strong>Mindbody</strong> — the wellness and fitness equivalent, from roughly €99/month per location with unlimited users at that site. Class scheduling, waitlists and memberships are structurally different from appointment booking, and generic agents model them badly.',
        '<strong>Slang.ai</strong> — restaurants, where "booking" means reservations against covers and shifts, integrated with OpenTable and SevenRooms at $399–$599 per location per month.',
        '<strong>Rosie and Goodcall</strong> — for a small service business, booking is simply one of the jobs the phone agent does. At $49–$299/month this is the cheapest credible path to "customers can book without anyone answering the phone".',
      ],
    },
    {
      h3: 'Internal calendar AI — your week, not your customers',
      items: [
        '<strong>Motion</strong> — auto-schedules tasks into open calendar time and reshuffles when priorities move, at $19/seat/month for Pro AI and $29 for Business AI, with an "AI employee" tier around $49. The most opinionated product in the category: it wants to own your task list as well as your calendar.',
        '<strong>Reclaim.ai</strong> — around $8/month for smart time blocking, habits and defended focus time, now operated by Dropbox and the official migration path Clockwise recommended to its users.',
        '<strong>Calendly</strong> — not an agent in the strict sense, but at about $10/seat/month its routing forms and analytics cover most of what teams actually wanted from "AI scheduling": get the right person booked without a thread.',
        '<strong>Clockwise</strong> — listed only as a warning. Salesforce acquired it and discontinued the product on 27 March 2026. If you are still on it, you have already needed to move.',
      ],
    },
    {
      h3: 'Infrastructure and DIY',
      items: [
        '<strong>Cal.com</strong> — open-source scheduling infrastructure with a proper API, self-hostable. The right choice when booking needs to live inside your own product rather than beside it.',
        '<strong>Agentforce and CRM suites</strong> — scheduling as one action among many, billed at roughly $0.10 per action. Rational only if the customer record already lives there.',
        '<strong>Build your own</strong> — a voice or chat agent plus a calendar API and a rules engine for your constraints. Worth it when your availability logic is genuinely unusual: multi-resource bookings, licensing rules, equipment dependencies. Not worth it to save $250 a month.',
      ],
    },
  ],

  prosCons: [
    { name: 'Luma Health', meta: 'Healthcare · from ~$250/mo', pros: ['Waitlist backfill and reminders where the ROI actually is', 'Multilingual outreach across the full care journey'], cons: ['Priced for practices, not solo providers', 'Broad platform — you pay for modules you may not use'], verdict: '<b>Buy if</b> no-shows and empty slots are costing you real revenue.' },
    { name: 'Phreesia', meta: 'Healthcare · custom', pros: ['Intake, eligibility and payment before the patient arrives', 'Deep EHR integration across major systems'], cons: ['Intake-first, so scheduling is not the centre of gravity', 'No public pricing'], verdict: '<b>Buy if</b> the check-in desk and revenue cycle are the bottleneck.' },
    { name: 'Assort Health', meta: 'Healthcare · custom', pros: ['Books by voice, which is how patients actually call', 'Specialty-specific workflows, EHR writes included'], cons: ['Healthcare only, enterprise sales motion', 'Overlaps other tools you may already run'], verdict: '<b>Buy if</b> the phone is your booking channel and it is overwhelmed.' },
    { name: 'Boulevard', meta: 'Beauty · $176–$410/mo per location', pros: ['Owns client record, card on file and staff roster', 'Purpose-built for salon and medspa constraints'], cons: ['Per-location pricing adds up across sites', 'Beauty vertical only'], verdict: '<b>Buy if</b> you run salons or medspas and want one system.' },
    { name: 'Mindbody', meta: 'Fitness · from ~€99/mo per location', pros: ['Unlimited users per location at the base price', 'Class, membership and waitlist logic done properly'], cons: ['Heavier than a small studio may need', 'Appointment booking is secondary to classes'], verdict: '<b>Buy if</b> you sell classes and memberships, not just appointments.' },
    { name: 'Slang.ai', meta: 'Hospitality · $399–$599/mo per location', pros: ['Reservation systems integrated on day one', 'Handles restaurant edge cases generic agents fumble'], cons: ['Restaurants only', 'Steep across a multi-site group'], verdict: '<b>Buy if</b> reservations compete with running the floor.' },
    { name: 'Rosie / Goodcall', meta: 'Receptionist · $49–$299/mo', pros: ['Cheapest path to unattended booking', 'Booking plus everything else the phone needs'], cons: ['Simple availability logic only', 'Not a system of record'], verdict: '<b>Buy if</b> you are small and the phone rings when nobody can answer.' },
    { name: 'Motion', meta: 'Calendar AI · $19–$29/seat/mo', pros: ['Genuinely reschedules your day as priorities change', 'Tasks and calendar in one model'], cons: ['Wants to own your whole workflow to work well', 'Highest price in the calendar-AI category'], verdict: '<b>Buy if</b> your problem is too many tasks and too little week.' },
    { name: 'Reclaim.ai', meta: 'Calendar AI · ~$8/mo', pros: ['Cheapest useful option in the category', 'Habits and focus time defended automatically'], cons: ['Roadmap now sits inside Dropbox', 'Lighter than Motion on task management'], verdict: '<b>Buy if</b> you want focus time protected without changing how you work.' },
    { name: 'Calendly', meta: 'Booking links · ~$10/seat/mo', pros: ['Routing forms solve the real B2B problem', 'Universally understood by the people you book with'], cons: ['Not an agent — no reasoning about your priorities', 'AI features are thin relative to the name'], verdict: '<b>Buy if</b> you just need the right person booked without a thread.' },
    { name: 'Cal.com', meta: 'Open source · free self-hosted', pros: ['Booking inside your own product, on your infrastructure', 'Proper API and no per-seat tax'], cons: ['You own hosting and maintenance', 'No AI layer out of the box'], verdict: '<b>Buy if</b> scheduling is part of your product, not your back office.' },
    { name: 'Build your own', meta: 'DIY · model + telephony cost', pros: ['Models constraints no platform supports', 'No per-location or per-seat pricing'], cons: ['Availability logic is deceptively hard to get right', 'You rebuild reminders, waitlists and deposits yourself'], verdict: '<b>Buy if</b> your booking rules genuinely do not fit any vertical platform.' },
  ],

  pick: [
    '<strong>Your customers book you</strong> → a vertical platform, not a scheduling agent. Luma Health (clinics), Boulevard (beauty), Mindbody (fitness), Slang.ai (restaurants).',
    '<strong>You are small and the phone is the problem</strong> → Rosie or Goodcall; booking comes bundled.',
    '<strong>Your own week is the problem</strong> → Motion if tasks overwhelm you, Reclaim at $8 if you just want focus time.',
    '<strong>You need the right colleague booked by a prospect</strong> → Calendly routing forms; skip the AI framing.',
    '<strong>Booking belongs inside your product</strong> → Cal.com.',
    '<strong>Still on Clockwise</strong> → it was discontinued in March 2026. Move to Reclaim or Motion.',
  ],

  investor: [
    '<strong>Standalone scheduling is not a category, it is a feature.</strong> Customer booking accrues to whoever owns the customer record and the payment; calendar optimisation accrues to whoever owns the productivity suite. Clockwise being acquired and shut down, and Reclaim landing inside Dropbox, are the same story told twice.',
    '<strong>The value is in the no-show, not the booking.</strong> Waitlist backfill, reminder sequencing and deposit capture are where measurable revenue appears. Any pitch that leads with "our agent books appointments" is describing the commodity half.',
    '<strong>Constraint solving is the real moat, and it is vertical.</strong> Staff skills, room and equipment dependencies, insurance eligibility, licensing rules — these do not generalise. That is why Boulevard, Mindbody and Luma Health coexist rather than one horizontal winner emerging.',
    '<strong>Per-location pricing is the tell for a healthy vertical.</strong> $99–$410 per location scales with the customer\'s physical footprint and resists the per-minute deflation hitting voice. Per-seat calendar AI at $8–$29 has no such protection, which is why it consolidated.',
    '<strong>Voice is the distribution channel, not the product.</strong> Assort Health and Slang.ai win booking business by owning the phone line. Expect voice agents to keep absorbing scheduling rather than scheduling vendors adding voice.',
  ],

  faq: [
    { q: 'What is an AI appointment scheduling agent?', a: 'Two different things share the name. A customer-facing booking agent talks to your customers — by phone, chat or web — and writes appointments into your business calendar, handling availability, deposits and reminders. An internal calendar AI rearranges your own week around tasks and meetings. Different buyers, different prices, rarely the same product.' },
    { q: 'How much does AI scheduling software cost?', a: 'Internal calendar AI runs $8–$29 per seat per month (Reclaim about $8, Motion $19–$29, Calendly around $10). Customer-facing vertical platforms are priced per location: Mindbody from about €99, Boulevard $176–$410, Slang.ai $399–$599, Luma Health from roughly $250 a month.' },
    { q: 'Can an AI agent book appointments over the phone?', a: 'Yes, and for most local businesses that is the channel that matters. Receptionist agents like Rosie and Goodcall book as one of several jobs from $49–$299 a month; Assort Health does it in healthcare with EHR writes; Slang.ai does it for restaurant reservations. The agent holds the slot mid-call and confirms before hanging up.' },
    { q: 'Motion vs Reclaim — which is better?', a: 'Motion ($19–$29/seat/month) is the stronger choice if your problem is too many tasks and too little time — it owns your task list and reschedules the day as priorities shift. Reclaim (about $8/month, now operated by Dropbox) is cheaper and lighter, focused on defending focus time and habits without restructuring how you work.' },
    { q: 'What happened to Clockwise?', a: 'Salesforce acquired Clockwise and the product was discontinued on 27 March 2026. Clockwise pointed users at Reclaim as the replacement. Its former pricing was free for individuals, $6.75 per user per month for Teams and $11.50 for Business.' },
    { q: 'Should I build my own booking agent?', a: 'Only if your availability logic genuinely does not fit an existing vertical platform — multi-resource bookings, equipment dependencies, licensing constraints. Availability solving is much harder than it looks, and you would also be rebuilding reminders, waitlist backfill and deposit capture, which is where the actual return lives.' },
  ],

  cta: 'Wiring a booking agent into your own product? Flowpicker compares the model, orchestration and integration layers behind it.',

  sources: `        Pricing read in August 2026:
        <a href="https://www.usecarly.com/blog/motion-pricing/" target="_blank" rel="noopener noreferrer">Motion</a>,
        <a href="https://reclaim.ai/blog/calendly-vs-reclaim" target="_blank" rel="noopener noreferrer">Reclaim and Calendly</a>,
        <a href="https://www.usecarly.com/blog/boulevard-ai/" target="_blank" rel="noopener noreferrer">Boulevard</a>,
        <a href="https://www.selecthub.com/p/patient-engagement-software/luma-health/" target="_blank" rel="noopener noreferrer">Luma Health</a>,
        <a href="https://www.selecthub.com/patient-engagement-software/phreesia-vs-luma-health/" target="_blank" rel="noopener noreferrer">Phreesia vs Luma Health</a>,
        <a href="https://www.slang.ai/pricing" target="_blank" rel="noopener noreferrer">Slang.ai</a>,
        <a href="https://heyrosie.com/pricing" target="_blank" rel="noopener noreferrer">Rosie</a>,
        <a href="https://www.goodcall.com/pricing" target="_blank" rel="noopener noreferrer">Goodcall</a>.
        Clockwise discontinuation and Reclaim ownership per
        <a href="https://superdupr.com/blog/ai-scheduling-assistants" target="_blank" rel="noopener noreferrer">2026 scheduling assistant comparisons</a>.
        Vertical platform pricing shifts with promotions and module mix — verify against a quote.`,
};
