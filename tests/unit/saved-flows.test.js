import { beforeEach, describe, expect, it } from 'vitest';
import { loadScript } from './helpers/loadScript.js';

describe('SavedFlows', () => {
  beforeEach(() => {
    loadScript('src/features/saved-flows/saved-flows.js');
  });

  describe('listFor()', () => {
    it('returns [] for an unknown user', () => {
      expect(window.SavedFlows.listFor('nobody@example.com')).toEqual([]);
    });

    it('returns [] when email is empty', () => {
      expect(window.SavedFlows.listFor('')).toEqual([]);
    });
  });

  describe('save()', () => {
    it('prepends new flows so most recent is first', () => {
      const email = 'a@b.com';
      window.SavedFlows.save(email, { id: '1', name: 'first', selections: {}, savedAt: 1 });
      window.SavedFlows.save(email, { id: '2', name: 'second', selections: {}, savedAt: 2 });
      const list = window.SavedFlows.listFor(email);
      expect(list.map(f => f.id)).toEqual(['2', '1']);
    });

    it('is a no-op when email is missing', () => {
      window.SavedFlows.save(null, { id: '1', name: 'x', selections: {}, savedAt: 0 });
      expect(window.SavedFlows.listFor('a@b.com')).toEqual([]);
    });
  });

  describe('get()', () => {
    it('finds a flow by id', () => {
      const email = 'a@b.com';
      const flow = { id: 'f1', name: 'mine', selections: { ide: [{ id: 'cursor' }] }, savedAt: 0 };
      window.SavedFlows.save(email, flow);
      expect(window.SavedFlows.get(email, 'f1')).toEqual(flow);
    });

    it('returns null when not found', () => {
      expect(window.SavedFlows.get('a@b.com', 'missing')).toBeNull();
    });
  });

  describe('remove()', () => {
    it('deletes the matching flow', () => {
      const email = 'a@b.com';
      window.SavedFlows.save(email, { id: '1', name: 'a', selections: {}, savedAt: 0 });
      window.SavedFlows.save(email, { id: '2', name: 'b', selections: {}, savedAt: 0 });
      window.SavedFlows.remove(email, '1');
      expect(window.SavedFlows.listFor(email).map(f => f.id)).toEqual(['2']);
    });
  });

  describe('user isolation', () => {
    it('isolates flows per user', () => {
      window.SavedFlows.save('a@x.com', { id: '1', name: 'A', selections: {}, savedAt: 0 });
      window.SavedFlows.save('b@x.com', { id: '2', name: 'B', selections: {}, savedAt: 0 });
      expect(window.SavedFlows.listFor('a@x.com').map(f => f.id)).toEqual(['1']);
      expect(window.SavedFlows.listFor('b@x.com').map(f => f.id)).toEqual(['2']);
    });
  });

  describe('defaultName()', () => {
    it('returns "Empty stack" for empty selections', () => {
      expect(window.SavedFlows.defaultName({})).toBe('Empty stack');
      expect(window.SavedFlows.defaultName(null)).toBe('Empty stack');
    });

    it('returns "Empty stack" when layers exist but options are empty', () => {
      expect(window.SavedFlows.defaultName({ ide: [] })).toBe('Empty stack');
    });

    it('joins names with " + " for up to 3 picks', () => {
      const sel = {
        ide: [{ id: 'cursor', name: 'Cursor' }],
        llm: [{ id: 'sonnet', name: 'Claude Sonnet' }],
      };
      expect(window.SavedFlows.defaultName(sel)).toBe('Cursor + Claude Sonnet');
    });

    it('appends "+N more" beyond 3 picks', () => {
      const sel = {
        ide: [
          { id: 'a', name: 'A' },
          { id: 'b', name: 'B' },
          { id: 'c', name: 'C' },
          { id: 'd', name: 'D' },
          { id: 'e', name: 'E' },
        ],
      };
      expect(window.SavedFlows.defaultName(sel)).toBe('A + B + C +2 more');
    });

    it('falls back to id when name missing', () => {
      const sel = { ide: [{ id: 'cursor' }] };
      expect(window.SavedFlows.defaultName(sel)).toBe('cursor');
    });
  });

  describe('resilience', () => {
    it('readAll() recovers from malformed JSON', () => {
      localStorage.setItem('flowpicker-saved-flows', '{broken');
      expect(window.SavedFlows.listFor('a@b.com')).toEqual([]);
    });
  });
});
