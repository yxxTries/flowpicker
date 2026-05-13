import { describe, expect, it } from 'vitest';
import { loadScript } from './helpers/loadScript.js';

describe('ATTRIBUTE_LABELS', () => {
  it('exposes a global object', () => {
    loadScript('data/attribute-labels.js');
    expect(typeof globalThis.ATTRIBUTE_LABELS).toBe('object');
    expect(globalThis.ATTRIBUTE_LABELS).not.toBeNull();
  });

  it('every value is a non-empty string', () => {
    loadScript('data/attribute-labels.js');
    for (const [k, v] of Object.entries(globalThis.ATTRIBUTE_LABELS)) {
      expect(typeof v).toBe('string');
      expect(v.length, `${k} → "${v}"`).toBeGreaterThan(0);
    }
  });

  it('covers the attribute keys used by table resolvers', () => {
    loadScript('data/attribute-labels.js');
    const labels = globalThis.ATTRIBUTE_LABELS;
    for (const key of [
      'priceInput', 'priceOutput', 'contextWindow', 'speedTier',
      'pricing', 'aiIntegration', 'interface', 'compatibility',
      'hosting', 'staleness', 'autonomy', 'cost', 'setup',
      'openSource', 'provider', 'websiteUrl',
    ]) {
      expect(labels[key], `missing label for ${key}`).toBeTruthy();
    }
  });
});
