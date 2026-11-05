import { describe, expect, it } from 'vitest';
import { applyToLeft, applyToRight } from '../src/lib/applyDifference';
import { compareJson } from '../src/lib/compareJson';
import type { JsonValue } from '../src/types/diff';

describe('difference application', () => {
  it('copies changed value to matching keyed item on right', () => {
    const left: JsonValue = { items: [{ id: 'b', value: 'left' }] };
    const right: JsonValue = { items: [{ id: 'b', value: 'right' }] };
    const diff = compareJson(left, right, 'id').differences[0];
    expect(applyToRight(right, diff)).toEqual(left);
  });

  it('removes destination property when source property is missing', () => {
    const left: JsonValue = { account: {} };
    const right: JsonValue = { account: { obsolete: true } };
    const diff = compareJson(left, right, 'id').differences[0];
    expect(applyToRight(right, diff)).toEqual(left);
  });

  it('adds source property to left when right has it', () => {
    const left: JsonValue = { account: {} };
    const right: JsonValue = { account: { enabled: true } };
    const diff = compareJson(left, right, 'id').differences[0];
    expect(applyToLeft(left, diff)).toEqual(right);
  });
});
