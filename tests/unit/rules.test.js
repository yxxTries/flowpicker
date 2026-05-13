import { beforeEach, describe, expect, it } from 'vitest';
import { loadScript } from './helpers/loadScript.js';

describe('COMPATIBILITY_RULES', () => {
  beforeEach(() => {
    loadScript('data/rules.js');
  });

  function ruleById(id) {
    return globalThis.COMPATIBILITY_RULES.find(r => r.id === id);
  }

  it('exposes a global COMPATIBILITY_RULES array', () => {
    expect(Array.isArray(globalThis.COMPATIBILITY_RULES)).toBe(true);
    expect(globalThis.COMPATIBILITY_RULES.length).toBeGreaterThan(0);
  });

  it('every rule has id, when, message', () => {
    for (const r of globalThis.COMPATIBILITY_RULES) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.when).toBe('function');
      expect(typeof r.message).toBe('function');
    }
  });

  it('rule ids are unique', () => {
    const ids = globalThis.COMPATIBILITY_RULES.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe('cursor-built-needs-cursor', () => {
    const rule = () => ruleById('cursor-built-needs-cursor');

    it('fires when integration=cursor-built and IDE != cursor', () => {
      const s = {
        integration: { id: 'cursor-built', name: 'Cursor built-in' },
        ide: { id: 'vscode', name: 'VS Code' },
      };
      expect(rule().when(s)).toBe(true);
      expect(rule().message(s)).toContain('VS Code');
    });

    it('does not fire when IDE = cursor', () => {
      const s = {
        integration: { id: 'cursor-built', name: 'Cursor built-in' },
        ide: { id: 'cursor', name: 'Cursor' },
      };
      expect(rule().when(s)).toBe(false);
    });
  });

  describe('continue-needs-supported-ide', () => {
    const rule = () => ruleById('continue-needs-supported-ide');

    it('fires for unsupported IDE', () => {
      const s = {
        integration: { id: 'continue', name: 'Continue.dev' },
        ide: { id: 'sublime', name: 'Sublime' },
      };
      expect(rule().when(s)).toBe(true);
    });

    it.each(['vscode', 'jetbrains'])('does not fire for supported IDE %s', (ide) => {
      const s = {
        integration: { id: 'continue', name: 'Continue.dev' },
        ide: { id: ide, name: ide },
      };
      expect(rule().when(s)).toBe(false);
    });
  });

  describe('cursor-built-locked-model', () => {
    const rule = () => ruleById('cursor-built-locked-model');

    it('does not fire for claude models', () => {
      const s = {
        integration: { id: 'cursor-built', name: 'Cursor built-in' },
        llm: { id: 'claude-sonnet', name: 'Claude Sonnet' },
      };
      expect(rule().when(s)).toBe(false);
    });

    it('does not fire for gpt4o', () => {
      const s = {
        integration: { id: 'cursor-built', name: 'Cursor built-in' },
        llm: { id: 'gpt4o', name: 'GPT-4o' },
      };
      expect(rule().when(s)).toBe(false);
    });

    it('fires for an arbitrary other model', () => {
      const s = {
        integration: { id: 'cursor-built', name: 'Cursor built-in' },
        llm: { id: 'mistral-large', name: 'Mistral Large' },
      };
      expect(rule().when(s)).toBe(true);
    });
  });

  it('rules tolerate missing layers (predicates short-circuit on undefined)', () => {
    for (const rule of globalThis.COMPATIBILITY_RULES) {
      expect(() => rule.when({})).not.toThrow();
      expect(rule.when({})).toBeFalsy();
    }
  });
});
