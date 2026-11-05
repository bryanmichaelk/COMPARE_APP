import type { JsonDiff, JsonValue, PathSegment } from '../types/diff';

type JsonObject = { [key: string]: JsonValue };
type JsonContainer = JsonObject | JsonValue[];

function copy<T>(value: T): T {
  return structuredClone(value);
}

function isContainer(value: JsonValue): value is JsonContainer {
  return value !== null && typeof value === 'object';
}

function setPath(root: JsonValue, path: PathSegment[], value: JsonValue): JsonValue {
  if (path.length === 0) return copy(value);
  const result = copy(root);
  let target: JsonContainer = result as JsonContainer;
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index];
    const nextSegment = path[index + 1];
    if (Array.isArray(target)) {
      const child = target[segment as number];
      if (child === undefined || child === null || typeof child !== 'object') {
        target[segment as number] = typeof nextSegment === 'number' ? [] : {};
      }
      target = target[segment as number] as JsonContainer;
    } else {
      const child = target[segment as string];
      if (child === undefined || child === null || typeof child !== 'object') {
        target[segment as string] = typeof nextSegment === 'number' ? [] : {};
      }
      target = target[segment as string] as JsonContainer;
    }
  }
  const finalSegment = path[path.length - 1];
  if (Array.isArray(target)) {
    const position = finalSegment as number;
    if (position >= target.length) target.push(copy(value));
    else target[position] = copy(value);
  } else {
    target[finalSegment as string] = copy(value);
  }
  return result;
}

function removePath(root: JsonValue, path: PathSegment[]): JsonValue | undefined {
  if (path.length === 0) return undefined;
  const result = copy(root);
  let target: JsonContainer = result as JsonContainer;
  for (const segment of path.slice(0, -1)) {
    const child = Array.isArray(target) ? target[segment as number] : target[segment as string];
    if (child === undefined || !isContainer(child)) return result;
    target = child;
  }
  const finalSegment = path[path.length - 1];
  if (Array.isArray(target)) target.splice(finalSegment as number, 1);
  else delete target[finalSegment as string];
  return result;
}

export function applyToRight(right: JsonValue, diff: JsonDiff): JsonValue | undefined {
  return diff.hasLeft ? setPath(right, diff.rightPath, diff.leftValue as JsonValue) : removePath(right, diff.rightPath);
}

export function applyToLeft(left: JsonValue, diff: JsonDiff): JsonValue | undefined {
  return diff.hasRight ? setPath(left, diff.leftPath, diff.rightValue as JsonValue) : removePath(left, diff.leftPath);
}
