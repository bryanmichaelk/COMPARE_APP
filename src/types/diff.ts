export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type PathSegment = string | number;

export type DiffKind = 'added' | 'removed' | 'changed' | 'type-changed';

export interface JsonDiff {
  id: string;
  kind: DiffKind;
  path: string;
  leftPath: PathSegment[];
  rightPath: PathSegment[];
  leftValue?: JsonValue;
  rightValue?: JsonValue;
  hasLeft: boolean;
  hasRight: boolean;
  leftLine?: number;
  rightLine?: number;
}

export interface CompareResult {
  differences: JsonDiff[];
  warnings: string[];
}
