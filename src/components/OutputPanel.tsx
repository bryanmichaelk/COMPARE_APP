import { useEffect, useRef, useState } from 'react';
import { CodeEditor, type CodeEditorHandle } from './CodeEditor';

interface OutputPanelProps {
  left: string;
  right: string;
}

export function OutputPanel({ left, right }: OutputPanelProps) {
  const [side, setSide] = useState<'left' | 'right'>('right');
  const [message, setMessage] = useState('');
  const [value, setValue] = useState(right);
  const [dirty, setDirty] = useState(false);
  const editorRef = useRef<CodeEditorHandle>(null);
  const source = side === 'left' ? left : right;

  useEffect(() => {
    if (!dirty) setValue(source);
  }, [dirty, source]);

  const changeSide = (nextSide: 'left' | 'right') => {
    setSide(nextSide);
    setValue(nextSide === 'left' ? left : right);
    setDirty(false);
    setMessage('');
  };

  const reset = () => {
    setValue(source);
    setDirty(false);
    setMessage(`Output reset to ${side === 'left' ? 'Left' : 'Right'}.`);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${side === 'left' ? 'Left' : 'Right'} JSON copied.`);
    } catch {
      setMessage('Clipboard access failed. Select output and copy manually.');
    }
  };

  return (
    <section className="output-panel" aria-labelledby="output-heading">
      <div className="panel-heading output-heading">
        <div>
          <p className="eyebrow">Copyable result</p>
          <h2 id="output-heading">Output</h2>
        </div>
        <div className="output-controls">
          <label htmlFor="output-side">Document</label>
          <select id="output-side" value={side} onChange={(event) => changeSide(event.target.value as 'left' | 'right')}>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
          <button type="button" className="secondary-button" onClick={() => editorRef.current?.selectAll()}>Select all</button>
          <button type="button" className="secondary-button" onClick={reset} disabled={!dirty}>Reset output</button>
          <button type="button" className="primary-button" onClick={copy}>Copy JSONC</button>
        </div>
      </div>
      <CodeEditor
        ref={editorRef}
        value={value}
        onChange={(nextValue) => { setValue(nextValue); setDirty(true); setMessage('Output edited.'); }}
        ariaLabel={`Editable ${side} JSONC output`}
      />
      <p className="copy-status" role="status">{message}</p>
    </section>
  );
}
