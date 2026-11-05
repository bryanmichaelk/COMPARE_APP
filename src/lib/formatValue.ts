import type { JsonValue } from '../types/diff';

export function formatValue(value: JsonValue | undefined, exists: boolean): string {
  if (!exists) return 'missing';
  const text = JSON.stringify(value);
  return text.length > 92 ? `${text.slice(0, 89)}...` : text;
}
