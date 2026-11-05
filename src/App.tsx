import { useRef, useState } from 'react';
import { compareJson } from './lib/compareJson';
import { collectIdentityKeys, findJsoncPathLine, modifyJsoncDocument, parseJsoncDocument } from './lib/jsoncDocument';
import type { CodeEditorHandle } from './components/CodeEditor';
import { DiffTable } from './components/DiffTable';
import { JsonEditor } from './components/JsonEditor';
import { OutputPanel } from './components/OutputPanel';
import type { CompareResult, JsonDiff, JsonValue } from './types/diff';

const emptyResult: CompareResult = { differences: [], warnings: [] };

export default function App() {
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [leftError, setLeftError] = useState<string>();
  const [rightError, setRightError] = useState<string>();
  const [leftErrorLine, setLeftErrorLine] = useState<number>();
  const [rightErrorLine, setRightErrorLine] = useState<number>();
  const [left, setLeft] = useState<JsonValue>();
  const [right, setRight] = useState<JsonValue>();
  const [identityKey, setIdentityKey] = useState('id');
  const [result, setResult] = useState<CompareResult>(emptyResult);
  const [filter, setFilter] = useState('all');
  const [selectedDiffId, setSelectedDiffId] = useState<string>();
  const [status, setStatus] = useState('Paste both JSON documents, then compare.');
  const leftEditorRef = useRef<CodeEditorHandle>(null);
  const rightEditorRef = useRef<CodeEditorHandle>(null);

  const compare = (nextLeftText = leftText, nextRightText = rightText) => {
    const parsedLeft = parseJsoncDocument(nextLeftText);
    const parsedRight = parseJsoncDocument(nextRightText);
    setLeftError(parsedLeft.error);
    setRightError(parsedRight.error);
    setLeftErrorLine(parsedLeft.errorLine);
    setRightErrorLine(parsedRight.errorLine);
    if (parsedLeft.data === undefined || parsedRight.data === undefined) {
      setResult(emptyResult);
      setStatus('Fix invalid JSON before comparison.');
      return;
    }
    const comparison = compareJson(parsedLeft.data, parsedRight.data, identityKey.trim() || 'id');
    const nextResult = {
      ...comparison,
      differences: comparison.differences.map((diff) => ({
        ...diff,
        leftLine: diff.hasLeft ? findJsoncPathLine(nextLeftText, diff.leftPath) : undefined,
        rightLine: diff.hasRight ? findJsoncPathLine(nextRightText, diff.rightPath) : undefined,
      })),
    };
    setLeft(parsedLeft.data);
    setRight(parsedRight.data);
    setLeftText(nextLeftText);
    setRightText(nextRightText);
    setResult(nextResult);
    setSelectedDiffId(undefined);
    setStatus(nextResult.differences.length ? `${nextResult.differences.length} difference(s) found.` : 'Documents match.');
  };

  const updateLeft = (value: string) => {
    setLeftText(value);
    setLeft(undefined);
    setResult(emptyResult);
    setSelectedDiffId(undefined);
    setLeftError(undefined);
    setLeftErrorLine(undefined);
  };
  const updateRight = (value: string) => {
    setRightText(value);
    setRight(undefined);
    setResult(emptyResult);
    setSelectedDiffId(undefined);
    setRightError(undefined);
    setRightErrorLine(undefined);
  };

  const apply = (diff: JsonDiff, direction: 'left' | 'right') => {
    if (!left || !right) return;
    if (direction === 'right') {
      const nextRightText = modifyJsoncDocument(rightText, diff.rightPath, diff.hasLeft ? diff.leftValue : undefined);
      compare(leftText, nextRightText);
      setStatus(`Applied ${diff.path} from Left to Right.`);
      return;
    }
    const nextLeftText = modifyJsoncDocument(leftText, diff.leftPath, diff.hasRight ? diff.rightValue : undefined);
    compare(nextLeftText, rightText);
    setStatus(`Applied ${diff.path} from Right to Left.`);
  };

  const applyAll = (direction: 'left' | 'right') => {
    if (!left || !right || result.differences.length === 0) return;
    const removalCount = result.differences.filter((diff) => direction === 'right' ? !diff.hasLeft : !diff.hasRight).length;
    if (removalCount > 0 && !window.confirm(`This applies ${result.differences.length} differences and removes ${removalCount} value(s). Continue?`)) return;
    if (direction === 'right') {
      compare(leftText, leftText);
    } else {
      compare(rightText, rightText);
    }
    setStatus('Applied all current differences.');
  };

  const reset = () => {
    setLeftText('');
    setRightText('');
    setLeft(undefined);
    setRight(undefined);
    setLeftError(undefined);
    setRightError(undefined);
    setLeftErrorLine(undefined);
    setRightErrorLine(undefined);
    setResult(emptyResult);
    setSelectedDiffId(undefined);
    setStatus('Editors cleared.');
  };

  const visibleDifferences = filter === 'all' ? result.differences : result.differences.filter((diff) => diff.kind === filter);
  const counts = result.differences.reduce<Record<string, number>>((total, diff) => ({ ...total, [diff.kind]: (total[diff.kind] ?? 0) + 1 }), {});
  const identityKeys = [...new Set(['id', 'key', 'code', 'uuid', 'name', ...(left ? collectIdentityKeys(left) : []), ...(right ? collectIdentityKeys(right) : []), identityKey])];
  const leftHighlights = result.differences.filter((diff) => diff.leftLine).map((diff) => ({ line: diff.leftLine!, kind: diff.kind, active: diff.id === selectedDiffId }));
  const rightHighlights = result.differences.filter((diff) => diff.rightLine).map((diff) => ({ line: diff.rightLine!, kind: diff.kind, active: diff.id === selectedDiffId }));

  const selectDiff = (diff: JsonDiff) => {
    setSelectedDiffId(diff.id);
    if (diff.leftLine) leftEditorRef.current?.revealLine(diff.leftLine);
    if (diff.rightLine) rightEditorRef.current?.revealLine(diff.rightLine);
  };

  return (
    <main>
      <header className="app-header">
        <div>
          <p className="eyebrow">Local comparison workspace</p>
          <h1>JSON Compare</h1>
        </div>
        <p className="privacy-note">Files stay in this browser.</p>
      </header>

      <section className="settings" aria-label="Comparison settings">
        <div className="identity-control">
          <label htmlFor="identity-key">Object array identity key</label>
          <input id="identity-key" list="identity-key-options" value={identityKey} onChange={(event) => setIdentityKey(event.target.value)} placeholder="id" />
          <datalist id="identity-key-options">{identityKeys.map((key) => <option key={key} value={key} />)}</datalist>
        </div>
        <p>Default: <code>id</code>. Common and detected scalar keys available. Invalid arrays use index comparison.</p>
        <div className="toolbar-actions">
          <button className="primary-button" type="button" onClick={() => compare()}>Compare JSONC</button>
          <button className="secondary-button" type="button" onClick={reset}>Clear</button>
        </div>
      </section>

      <section className="editors" aria-label="JSON input documents">
        <JsonEditor ref={leftEditorRef} label="Left" value={leftText} error={leftError} errorLine={leftErrorLine} highlights={leftHighlights} onChange={updateLeft} />
        <JsonEditor ref={rightEditorRef} label="Right" value={rightText} error={rightError} errorLine={rightErrorLine} highlights={rightHighlights} onChange={updateRight} />
      </section>

      <section className="command-bar" aria-label="Comparison controls">
        <p role="status">{status}</p>
      </section>

      <section className="results" aria-labelledby="results-heading">
        <div className="results-heading">
          <div>
            <p className="eyebrow">Comparison output</p>
            <h2 id="results-heading">Differences</h2>
          </div>
          <div className="bulk-actions">
            <button className="secondary-button" type="button" disabled={!result.differences.length} onClick={() => applyAll('right')}>Apply all Left to Right</button>
            <button className="secondary-button" type="button" disabled={!result.differences.length} onClick={() => applyAll('left')}>Apply all Right to Left</button>
          </div>
        </div>
        <div className="summary-controls">
          <div className="summary" aria-label="Difference counts">
            <button className={filter === 'all' ? 'summary-filter selected' : 'summary-filter'} type="button" onClick={() => setFilter('all')}>{result.differences.length} total</button>
            <button className={filter === 'added' ? 'summary-filter selected added-filter' : 'summary-filter added-filter'} type="button" onClick={() => setFilter('added')}>{counts.added ?? 0} added</button>
            <button className={filter === 'removed' ? 'summary-filter selected removed-filter' : 'summary-filter removed-filter'} type="button" onClick={() => setFilter('removed')}>{counts.removed ?? 0} removed</button>
            <button className={filter === 'changed' ? 'summary-filter selected changed-filter' : 'summary-filter changed-filter'} type="button" onClick={() => setFilter('changed')}>{(counts.changed ?? 0) + (counts['type-changed'] ?? 0)} changed</button>
          </div>
          <label className="filter-label" htmlFor="diff-filter">Show
            <select id="diff-filter" value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All differences</option>
              <option value="added">Added</option>
              <option value="removed">Removed</option>
              <option value="changed">Changed</option>
              <option value="type-changed">Type changed</option>
            </select>
          </label>
        </div>
        {result.warnings.length > 0 && <div className="warnings" role="alert"><strong>Array comparison warning</strong>{result.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>}
        <DiffTable differences={visibleDifferences} selectedId={selectedDiffId} onSelect={selectDiff} onUseLeft={(diff) => apply(diff, 'right')} onUseRight={(diff) => apply(diff, 'left')} />
      </section>

      <OutputPanel left={leftText} right={rightText} />
    </main>
  );
}
