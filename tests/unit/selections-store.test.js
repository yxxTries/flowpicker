import { beforeEach, describe, expect, it } from 'vitest';
import { loadScript } from './helpers/loadScript.js';

describe('SelectionsStore', () => {
  beforeEach(() => {
    loadScript('src/features/selections-store/selections-store.js');
  });

  it('exposes the localStorage KEY', () => {
    expect(window.SelectionsStore.KEY).toBe('flowpicker-selections');
  });

  it('returns {} when nothing has been saved', () => {
    expect(window.SelectionsStore.load()).toEqual({});
  });

  it('round-trips selections through save/load', () => {
    const data = { ide: [{ id: 'cursor', name: 'Cursor' }] };
    window.SelectionsStore.save(data);
    expect(window.SelectionsStore.load()).toEqual(data);
  });

  it('returns {} when stored value is malformed JSON', () => {
    localStorage.setItem('flowpicker-selections', '{not json');
    expect(window.SelectionsStore.load()).toEqual({});
  });

  it('returns {} when stored value is a JSON primitive (not an object)', () => {
    localStorage.setItem('flowpicker-selections', '"hello"');
    expect(window.SelectionsStore.load()).toEqual({});
  });

  it('add() inserts an option for a new layer', () => {
    const next = window.SelectionsStore.add('ide', { id: 'cursor', name: 'Cursor' });
    expect(next).toEqual({ ide: [{ id: 'cursor', name: 'Cursor' }] });
    expect(window.SelectionsStore.load()).toEqual(next);
  });

  it('add() is idempotent for the same option id', () => {
    window.SelectionsStore.add('ide', { id: 'cursor', name: 'Cursor' });
    const next = window.SelectionsStore.add('ide', { id: 'cursor', name: 'Cursor v2' });
    expect(next.ide).toHaveLength(1);
    expect(next.ide[0].name).toBe('Cursor');
  });

  it('add() appends additional options for the same layer', () => {
    window.SelectionsStore.add('ide', { id: 'cursor', name: 'Cursor' });
    const next = window.SelectionsStore.add('ide', { id: 'vscode', name: 'VS Code' });
    expect(next.ide.map(o => o.id)).toEqual(['cursor', 'vscode']);
  });

  it('remove() drops a single option', () => {
    window.SelectionsStore.add('ide', { id: 'cursor', name: 'Cursor' });
    window.SelectionsStore.add('ide', { id: 'vscode', name: 'VS Code' });
    const next = window.SelectionsStore.remove('ide', 'cursor');
    expect(next.ide.map(o => o.id)).toEqual(['vscode']);
  });

  it('remove() deletes the layer key when empty', () => {
    window.SelectionsStore.add('ide', { id: 'cursor', name: 'Cursor' });
    const next = window.SelectionsStore.remove('ide', 'cursor');
    expect(next.ide).toBeUndefined();
  });
});
