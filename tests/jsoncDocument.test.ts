import { describe, expect, it } from 'vitest';
import { modifyJsoncDocument, parseJsoncDocument } from '../src/lib/jsoncDocument';

describe('JSONC documents', () => {
  it('accepts line comments, inline comments, and trailing commas', () => {
    const result = parseJsoncDocument('{\n  // service settings\n  "port": 3000, // local only\n}');
    expect(result).toEqual({ data: { port: 3000 } });
  });

  it('returns one-based error locations', () => {
    const result = parseJsoncDocument('{\n  invalid: true\n}');
    expect(result.error).toContain('line 2');
    expect(result.errorLine).toBe(2);
  });

  it('replaces a value while preserving nearby comments', () => {
    const text = '{\n  // endpoint\n  "url": "http://left", // production URL\n  "keep": true\n}';
    const updated = modifyJsoncDocument(text, ['url'], 'http://right');
    expect(updated).toContain('// endpoint');
    expect(updated).toContain('// production URL');
    expect(updated).toContain('"url": "http://right"');
  });

  it('adds and removes properties without damaging unrelated comments', () => {
    const text = '{\n  // retained\n  "keep": true\n}';
    const added = modifyJsoncDocument(text, ['newValue'], 5);
    expect(added).toContain('// retained');
    expect(parseJsoncDocument(added).data).toEqual({ keep: true, newValue: 5 });
    const removed = modifyJsoncDocument(added, ['newValue'], undefined);
    expect(removed).toContain('// retained');
    expect(parseJsoncDocument(removed).data).toEqual({ keep: true });
  });
});
