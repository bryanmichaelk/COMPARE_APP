import { describe, expect, it } from 'vitest';
import { collectIdentityKeys, findJsoncPathLine } from '../src/lib/jsoncDocument';

describe('JSONC location metadata', () => {
  it('locates nested properties despite comments', () => {
    const text = '{\n  // service\n  "settings": {\n    "url": "https://example.test"\n  }\n}';
    expect(findJsoncPathLine(text, ['settings', 'url'])).toBe(4);
  });

  it('returns scalar keys from object arrays', () => {
    expect(collectIdentityKeys({ items: [{ id: 1, code: 'A', nested: {} }] })).toEqual(['code', 'id']);
  });
});
