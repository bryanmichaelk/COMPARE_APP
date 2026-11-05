import { applyEdits, findNodeAtLocation, modify, parse, parseTree, type ParseError } from 'jsonc-parser';
import type { JsonValue, PathSegment } from '../types/diff';

export interface ParsedDocument {
  data?: JsonValue;
  error?: string;
  errorLine?: number;
}

function lineAndColumn(text: string, offset: number): { line: number; column: number } {
  const before = text.slice(0, offset);
  return { line: before.split('\n').length, column: offset - before.lastIndexOf('\n') };
}

function parseErrorMessage(text: string, error: ParseError): ParsedDocument {
  const location = lineAndColumn(text, error.offset);
  return {
    error: `Invalid JSONC at line ${location.line}, column ${location.column}.`,
    errorLine: location.line,
  };
}

export function parseJsoncDocument(text: string): ParsedDocument {
  if (!text.trim()) return { error: 'JSON or JSONC document is required.' };
  const errors: ParseError[] = [];
  const data = parse(text, errors, { allowTrailingComma: true }) as JsonValue | undefined;
  if (errors.length) return parseErrorMessage(text, errors[0]);
  if (data === undefined) return { error: 'JSON or JSONC document is required.' };
  return { data };
}

function formattingOptions(text: string) {
  const indent = text.match(/\n(\s+)\S/)?.[1] ?? '  ';
  return {
    formattingOptions: {
      insertSpaces: !indent.includes('\t'),
      tabSize: indent.includes('\t') ? 4 : indent.length,
      eol: text.includes('\r\n') ? '\r\n' : '\n',
    },
  };
}

export function modifyJsoncDocument(text: string, path: PathSegment[], value: JsonValue | undefined): string {
  return applyEdits(text, modify(text, path, value, formattingOptions(text)));
}

export function findJsoncPathLine(text: string, path: PathSegment[]): number | undefined {
  const tree = parseTree(text, [], { allowTrailingComma: true });
  const node = tree && findNodeAtLocation(tree, path);
  if (!node) return undefined;
  return lineAndColumn(text, node.offset).line;
}

export function collectIdentityKeys(value: JsonValue): string[] {
  const keys = new Set<string>();
  const isObject = (item: JsonValue): item is { [key: string]: JsonValue } => item !== null && !Array.isArray(item) && typeof item === 'object';
  const walk = (item: JsonValue) => {
    if (Array.isArray(item)) {
      if (item.length && item.every(isObject)) {
        for (const entry of item) {
          for (const [key, property] of Object.entries(entry)) {
            if (typeof property === 'string' || typeof property === 'number') keys.add(key);
          }
        }
      }
      item.forEach(walk);
    } else if (isObject(item)) {
      Object.values(item).forEach(walk);
    }
  };
  walk(value);
  return [...keys].sort((left, right) => left.localeCompare(right));
}
