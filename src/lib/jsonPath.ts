import type { PathSegment } from '../types/diff';

export function formatPath(path: PathSegment[]): string {
  if (path.length === 0) return '/';
  return `/${path.map((segment) => String(segment).replaceAll('~', '~0').replaceAll('/', '~1')).join('/')}`;
}

export function displayPath(path: PathSegment[]): string {
  if (path.length === 0) return 'root';
  return path.reduce<string>((result, segment) => (
    typeof segment === 'number' ? `${result}[${segment}]` : result ? `${result}.${segment}` : segment
  ), '');
}
