import { describe, expect, it } from 'vitest';
import { compareJson } from '../src/lib/compareJson';
import type { JsonValue } from '../src/types/diff';

describe('compareJson', () => {
  it('reports nested added, removed, and changed values', () => {
    const result = compareJson(
      { account: { active: true, old: 'remove' } },
      { account: { active: false, added: 'new' } },
      'id',
    );
    expect(result.differences.map((diff) => [diff.path, diff.kind])).toEqual([
      ['account.active', 'changed'],
      ['account.added', 'added'],
      ['account.old', 'removed'],
    ]);
  });

  it('treats different JSON types as one atomic difference', () => {
    const result = compareJson({ amount: 1 }, { amount: '1' }, 'id');
    expect(result.differences).toHaveLength(1);
    expect(result.differences[0].kind).toBe('type-changed');
  });

  it('matches object arrays by configured identity key regardless of order', () => {
    const left: JsonValue = { items: [{ code: 'B', name: 'same' }, { code: 'A', name: 'left' }] };
    const right: JsonValue = { items: [{ code: 'A', name: 'right' }, { code: 'B', name: 'same' }] };
    const result = compareJson(left, right, 'code');
    expect(result.warnings).toEqual([]);
    expect(result.differences).toHaveLength(1);
    expect(result.differences[0].leftPath).toEqual(['items', 1, 'name']);
    expect(result.differences[0].rightPath).toEqual(['items', 0, 'name']);
  });

  it('warns and falls back to indexes when object identity is invalid', () => {
    const result = compareJson({ items: [{ id: 1 }, { name: 'missing-id' }] }, { items: [{ id: 2 }] }, 'id');
    expect(result.warnings).toEqual(['items uses index comparison because "id" is missing or duplicated.']);
    expect(result.differences.length).toBeGreaterThan(0);
  });
});
