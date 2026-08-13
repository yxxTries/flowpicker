// Guards the `llm` layer of data/flowpicker.db against the defect classes that
// made the table go stale and self-contradictory:
//   - release dates stored as a bare year, so recency sorting can't compare rows
//   - knowledge cutoffs dated after the model's own release
//   - the same company stored under two spellings, splitting provider grouping
//   - option ids that disagree with the URL slug the generators derive from them
//
// These are cheap invariants, but every one of them shipped to production at
// least once. Keep them enforced.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const initSqlJs = require('../../vendor/sql-wasm.js');

const DB_PATH = path.join(process.cwd(), 'data', 'flowpicker.db');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_YEAR = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/;
const UNKNOWN = '—';

// Same transform as tools/build-static-pages.js — an id that isn't already its
// own slug means the stored key and the public URL have drifted apart.
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** "Mar 2026" -> comparable integer. Returns null for the unknown marker. */
function monthOrdinal(value) {
  if (!value || value === UNKNOWN) return null;
  const m = value.match(MONTH_YEAR);
  if (!m) return null;
  return Number(m[0].slice(-4)) * 12 + MONTHS.indexOf(m[1]);
}

const ENUMS = {
  hosting: ['Closed/API', 'Open-weights', 'Open/Self-host', 'Closed/API + Self-host'],
  priceTier: ['Budget', 'Free', 'Mid', 'Premium'],
  contextTier: ['<32K', '32K-128K', '128K-500K', '500K+'],
  speedTier: ['Fast', 'Standard', 'Medium', 'Slow/Reasoning'],
};

const REQUIRED = [
  'provider', 'modelId', 'released', 'contextWindow',
  'priceInput', 'priceOutput', 'hosting', 'bestFor', 'websiteUrl',
];

const PRICE = /^(\$\d+(\.\d+)?|Free \(self-hosted\))$/;

// Rows carrying known date debt from before the August 2026 refresh: a bare
// year instead of "Mon YYYY", or a cutoff dated after the release. They are
// exempt from the three date checks below and nothing else.
//
// This list is a to-do, not a permanent waiver. The Anthropic and OpenAI rows
// were refreshed against primary sources and hold no exemptions; the providers
// below are still pending that pass. Delete an entry as soon as its row is
// refreshed — the "no stale exemptions" test fails if an id here has already
// been fixed, so the list cannot quietly outlive the problem.
const PENDING_REFRESH = new Set([
  // Alibaba
  'qwen-3-6', 'qwen-coder', 'qwen-coder-next',
  // Amazon
  'nova-lite', 'nova-micro', 'nova-pro',
  // DeepSeek
  'deepseek-v4-flash', 'deepseek-v4-pro',
  // Google — the rest of the Google rows were refreshed 2026-08; these two
  // still hold a bare-year cutoff.
  'gemini-3-deep-think', 'gemini-3-flash',
  // IBM
  'granite-4-1',
  // InclusionAI
  'ling-2-6-1t',
  // MiniMax
  'minimax-m2-7',
  // Mistral
  'devstral-2', 'ministral-14b', 'mistral-medium-3-5',
  // Poolside
  'laguna-xs2',
  // xAI
  'grok-4-3',
  // Xiaomi
  'mimo-v2-5-pro',
  // Z.ai
  'glm-5-1',
]);

let models = [];
// Every option id across all layers — rules.js references ide/integration/
// agent/context ids too, not just llm ones.
let allOptionIds = [];

beforeAll(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));

  const allRes = db.exec(`SELECT id FROM options`);
  allOptionIds = allRes.length ? allRes[0].values.flat() : [];

  const res = db.exec(`
    SELECT o.id, o.name, a.key, a.value
    FROM options o
    JOIN option_attrs a ON a.layer_id = o.layer_id AND a.option_id = o.id
    WHERE o.layer_id = 'llm'
  `);
  const byId = new Map();
  for (const [id, name, key, value] of res[0].values) {
    if (!byId.has(id)) byId.set(id, { id, name, attrs: {} });
    byId.get(id).attrs[key] = value;
  }
  models = [...byId.values()];
});

describe('llm layer data integrity', () => {
  it('has models to check', () => {
    expect(models.length).toBeGreaterThan(50);
  });

  it('stores every release date as "Mon YYYY"', () => {
    const bad = models
      .filter((m) => !PENDING_REFRESH.has(m.id))
      .filter((m) => !MONTH_YEAR.test(m.attrs.released || ''))
      .map((m) => `${m.id} → "${m.attrs.released}"`);
    expect(bad, `release dates must be "Mon YYYY", not a bare year:\n${bad.join('\n')}`).toEqual([]);
  });

  it('stores every knowledge cutoff as "Mon YYYY" or the unknown marker', () => {
    const bad = models
      .filter((m) => !PENDING_REFRESH.has(m.id))
      .filter((m) => {
        const v = m.attrs.knowledgeCutoff;
        return v !== undefined && v !== UNKNOWN && !MONTH_YEAR.test(v);
      })
      .map((m) => `${m.id} → "${m.attrs.knowledgeCutoff}"`);
    expect(bad, `bad knowledge cutoffs:\n${bad.join('\n')}`).toEqual([]);
  });

  it('never dates a knowledge cutoff after the model was released', () => {
    const bad = models
      .filter((m) => !PENDING_REFRESH.has(m.id))
      .map((m) => {
        const rel = monthOrdinal(m.attrs.released);
        const cut = monthOrdinal(m.attrs.knowledgeCutoff);
        if (rel === null || cut === null || cut <= rel) return null;
        return `${m.id}: released ${m.attrs.released} but cutoff ${m.attrs.knowledgeCutoff}`;
      })
      .filter(Boolean);
    expect(bad, `a model cannot know about data from after it shipped:\n${bad.join('\n')}`).toEqual([]);
  });

  it('does not claim a release date in the future', () => {
    const now = new Date();
    const cap = now.getUTCFullYear() * 12 + now.getUTCMonth();
    const bad = models
      .filter((m) => {
        const rel = monthOrdinal(m.attrs.released);
        return rel !== null && rel > cap;
      })
      .map((m) => `${m.id} → ${m.attrs.released}`);
    expect(bad, `future release dates:\n${bad.join('\n')}`).toEqual([]);
  });

  it('uses one canonical spelling per provider', () => {
    // Collapse case and non-alphanumerics: "MoonshotAI" and "Moonshot AI" must
    // not both survive, or provider grouping silently splits the company in two.
    const byKey = new Map();
    for (const m of models) {
      const provider = m.attrs.provider;
      if (!provider) continue;
      const key = provider.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!byKey.has(key)) byKey.set(key, new Set());
      byKey.get(key).add(provider);
    }
    const split = [...byKey.values()]
      .filter((names) => names.size > 1)
      .map((names) => [...names].join(' / '));
    expect(split, `same provider stored under multiple spellings:\n${split.join('\n')}`).toEqual([]);
  });

  it('keeps every option id equal to its URL slug', () => {
    const bad = models
      .filter((m) => slug(m.id) !== m.id)
      .map((m) => `${m.id} → would publish as /${slug(m.id)}/`);
    expect(bad, `id and public URL have drifted:\n${bad.join('\n')}`).toEqual([]);
  });

  it('populates every required attribute', () => {
    const bad = [];
    for (const m of models) {
      for (const key of REQUIRED) {
        const v = m.attrs[key];
        if (v === undefined || v === null || String(v).trim() === '') {
          bad.push(`${m.id} missing ${key}`);
        }
      }
    }
    expect(bad, `missing required attributes:\n${bad.join('\n')}`).toEqual([]);
  });

  it('formats input and output prices consistently', () => {
    const bad = [];
    for (const m of models) {
      for (const key of ['priceInput', 'priceOutput']) {
        const v = m.attrs[key];
        if (v && !PRICE.test(v)) bad.push(`${m.id}.${key} → "${v}"`);
      }
    }
    expect(bad, `prices must be "$N", "$N.NN", or "Free (self-hosted)":\n${bad.join('\n')}`).toEqual([]);
  });

  it('restricts tier attributes to their known vocabularies', () => {
    const bad = [];
    for (const m of models) {
      for (const [key, allowed] of Object.entries(ENUMS)) {
        const v = m.attrs[key];
        if (v && !allowed.includes(v)) bad.push(`${m.id}.${key} → "${v}"`);
      }
    }
    expect(bad, `unknown tier values:\n${bad.join('\n')}`).toEqual([]);
  });

  it('carries no stale date exemptions', () => {
    // Keeps PENDING_REFRESH honest in both directions: an id that no longer
    // exists, or one whose dates have since been fixed, must be deleted from
    // the list rather than left behind to silently weaken the date checks.
    const byId = new Map(models.map((m) => [m.id, m]));
    const stale = [];
    for (const id of PENDING_REFRESH) {
      const m = byId.get(id);
      if (!m) {
        stale.push(`${id} — no such row; drop it from PENDING_REFRESH`);
        continue;
      }
      const rel = m.attrs.released;
      const cut = m.attrs.knowledgeCutoff;
      const stillBroken =
        !MONTH_YEAR.test(rel || '') ||
        (cut !== undefined && cut !== UNKNOWN && !MONTH_YEAR.test(cut)) ||
        (monthOrdinal(rel) !== null &&
          monthOrdinal(cut) !== null &&
          monthOrdinal(cut) > monthOrdinal(rel));
      if (!stillBroken) {
        stale.push(`${id} — dates are valid now; drop it from PENDING_REFRESH`);
      }
    }
    expect(stale, `stale exemptions:\n${stale.join('\n')}`).toEqual([]);
  });

  it('has no compatibility rule pointing at an option that does not exist', () => {
    // data/rules.js hardcodes option ids in per-IDE allowlists. Renaming or
    // removing an option silently breaks those rules — the predicate keeps
    // matching, so the rule fires (or stops firing) for the wrong models with
    // no error anywhere. Cross-check the two files.
    const src = fs.readFileSync(path.join(process.cwd(), 'data', 'rules.js'), 'utf8');

    const known = new Set(allOptionIds);

    // The allowlists are bracketed literals holding several quoted ids —
    // `new Set([...])`, `const openai = [...]`, `![...].includes(s.llm.id)`.
    // Requiring 3+ entries skips rule ids, `startsWith('claude')` prefixes and
    // any other incidental string literal.
    const referenced = new Set();
    for (const block of src.matchAll(/\[([^[\]]*?)\]/gs)) {
      const strings = [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
      if (strings.length < 3) continue;
      for (const s of strings) referenced.add(s);
    }

    const suspicious = [...referenced].filter((ref) => !known.has(ref));

    expect(
      suspicious,
      `data/rules.js references option ids that no longer exist:\n${suspicious.join('\n')}`
    ).toEqual([]);
  });

  it('does not point two models at the same API model id', () => {
    const byModelId = new Map();
    for (const m of models) {
      const key = m.attrs.modelId;
      if (!key) continue;
      if (!byModelId.has(key)) byModelId.set(key, []);
      byModelId.get(key).push(m.id);
    }
    const dupes = [...byModelId.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([modelId, ids]) => `${modelId} ← ${ids.join(', ')}`);
    expect(dupes, `duplicate modelId:\n${dupes.join('\n')}`).toEqual([]);
  });
});
