import type { CompareResult, DiffKind, JsonDiff, JsonValue, PathSegment } from '../types/diff';
import { displayPath, formatPath } from './jsonPath';

const missing = Symbol('missing');
type MaybeJson = JsonValue | typeof missing;

function isObject(value: MaybeJson): value is { [key: string]: JsonValue } {
  return value !== missing && value !== null && !Array.isArray(value) && typeof value === 'object';
}

function valueType(value: MaybeJson): string {
  if (value === missing) return 'missing';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function equalPrimitive(left: MaybeJson, right: MaybeJson): boolean {
  return left === right;
}

function arrayValue(values: JsonValue[], index: number): MaybeJson {
  return index < values.length ? values[index] : missing;
}

function objectValue(value: { [key: string]: JsonValue }, key: string): MaybeJson {
  return Object.hasOwn(value, key) ? value[key] : missing;
}

function isValidIdentityItem(value: JsonValue, identityKey: string): value is { [key: string]: JsonValue } {
  return isObject(value) && Object.hasOwn(value, identityKey) && ['string', 'number'].includes(typeof value[identityKey]);
}

function keyedArrayMap(values: JsonValue[], identityKey: string): Map<string | number, number> | null {
  const map = new Map<string | number, number>();
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!isValidIdentityItem(value, identityKey)) return null;
    const id = value[identityKey] as string | number;
    if (map.has(id)) return null;
    map.set(id, index);
  }
  return map;
}

export function compareJson(left: JsonValue, right: JsonValue, identityKey: string): CompareResult {
  const differences: JsonDiff[] = [];
  const warnings = new Set<string>();

  const addDiff = (
    kind: DiffKind,
    leftValue: MaybeJson,
    rightValue: MaybeJson,
    leftPath: PathSegment[],
    rightPath: PathSegment[],
  ) => {
    const sharedPath = leftPath.length >= rightPath.length ? leftPath : rightPath;
    differences.push({
      id: `${kind}:${formatPath(leftPath)}:${formatPath(rightPath)}`,
      kind,
      path: displayPath(sharedPath),
      leftPath,
      rightPath,
      ...(leftValue === missing ? {} : { leftValue }),
      ...(rightValue === missing ? {} : { rightValue }),
      hasLeft: leftValue !== missing,
      hasRight: rightValue !== missing,
    });
  };

  const walk = (leftValue: MaybeJson, rightValue: MaybeJson, leftPath: PathSegment[], rightPath: PathSegment[]) => {
    if (leftValue === missing || rightValue === missing) {
      addDiff(leftValue === missing ? 'added' : 'removed', leftValue, rightValue, leftPath, rightPath);
      return;
    }

    const leftType = valueType(leftValue);
    const rightType = valueType(rightValue);
    if (leftType !== rightType) {
      addDiff('type-changed', leftValue, rightValue, leftPath, rightPath);
      return;
    }

    if (isObject(leftValue) && isObject(rightValue)) {
      const keys = new Set([...Object.keys(leftValue), ...Object.keys(rightValue)]);
      for (const key of [...keys].sort()) {
        walk(objectValue(leftValue, key), objectValue(rightValue, key), [...leftPath, key], [...rightPath, key]);
      }
      return;
    }

    if (Array.isArray(leftValue) && Array.isArray(rightValue)) {
      const leftMap = keyedArrayMap(leftValue, identityKey);
      const rightMap = keyedArrayMap(rightValue, identityKey);
      if (leftMap && rightMap) {
        const ids = new Set([...leftMap.keys(), ...rightMap.keys()]);
        for (const id of ids) {
          const leftIndex = leftMap.get(id);
          const rightIndex = rightMap.get(id);
          walk(
            leftIndex === undefined ? missing : leftValue[leftIndex],
            rightIndex === undefined ? missing : rightValue[rightIndex],
            leftIndex === undefined ? [...leftPath, leftValue.length] : [...leftPath, leftIndex],
            rightIndex === undefined ? [...rightPath, rightValue.length] : [...rightPath, rightIndex],
          );
        }
        return;
      }

      if (leftValue.some((value) => isObject(value)) || rightValue.some((value) => isObject(value))) {
        warnings.add(`${displayPath(leftPath)} uses index comparison because "${identityKey}" is missing or duplicated.`);
      }
      const length = Math.max(leftValue.length, rightValue.length);
      for (let index = 0; index < length; index += 1) {
        walk(arrayValue(leftValue, index), arrayValue(rightValue, index), [...leftPath, index], [...rightPath, index]);
      }
      return;
    }

    if (!equalPrimitive(leftValue, rightValue)) {
      addDiff('changed', leftValue, rightValue, leftPath, rightPath);
    }
  };

  walk(left, right, [], []);
  return { differences, warnings: [...warnings] };
}
