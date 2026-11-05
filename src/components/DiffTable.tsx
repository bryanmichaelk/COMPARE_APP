import type { JsonDiff } from '../types/diff';
import { formatValue } from '../lib/formatValue';

interface DiffTableProps {
  differences: JsonDiff[];
  onUseLeft: (diff: JsonDiff) => void;
  onUseRight: (diff: JsonDiff) => void;
  selectedId?: string;
  onSelect: (diff: JsonDiff) => void;
}

export function DiffTable({ differences, onUseLeft, onUseRight, selectedId, onSelect }: DiffTableProps) {
  if (differences.length === 0) {
    return <p className="empty-result">No remaining differences. Both documents match.</p>;
  }

  return (
    <div className="diff-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Path</th>
            <th scope="col">Type</th>
            <th scope="col">Left line</th>
            <th scope="col">Left value</th>
            <th scope="col">Right line</th>
            <th scope="col">Right value</th>
            <th scope="col">Apply</th>
          </tr>
        </thead>
        <tbody>
          {differences.map((diff) => (
            <tr key={diff.id} className={selectedId === diff.id ? 'selected-diff' : ''} aria-selected={selectedId === diff.id} onClick={() => onSelect(diff)}>
              <td><code>{diff.path}</code></td>
              <td><span className={`kind kind-${diff.kind}`}>{diff.kind.replace('-', ' ')}</span></td>
              <td>{diff.leftLine ? <button className="line-button" type="button" onClick={(event) => { event.stopPropagation(); onSelect(diff); }} aria-label={`Go to Left line ${diff.leftLine}`}>L {diff.leftLine}</button> : '-'}</td>
              <td><code>{formatValue(diff.leftValue, diff.hasLeft)}</code></td>
              <td>{diff.rightLine ? <button className="line-button" type="button" onClick={(event) => { event.stopPropagation(); onSelect(diff); }} aria-label={`Go to Right line ${diff.rightLine}`}>R {diff.rightLine}</button> : '-'}</td>
              <td><code>{formatValue(diff.rightValue, diff.hasRight)}</code></td>
              <td className="actions-cell">
                <button type="button" className="small-button" onClick={(event) => { event.stopPropagation(); onUseLeft(diff); }}>Use Left</button>
                <button type="button" className="small-button" onClick={(event) => { event.stopPropagation(); onUseRight(diff); }}>Use Right</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
