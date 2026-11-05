import { forwardRef, useId, useImperativeHandle, useRef, useState } from 'react';
import { CodeEditor, type CodeEditorHandle } from './CodeEditor';

interface JsonEditorProps {
  label: 'Left' | 'Right';
  value: string;
  error?: string;
  errorLine?: number;
  onChange: (value: string) => void;
  highlights?: Array<{ line: number; kind: 'added' | 'removed' | 'changed' | 'type-changed'; active?: boolean }>;
}

export const JsonEditor = forwardRef<CodeEditorHandle, JsonEditorProps>(function JsonEditor({ label, value, error, errorLine, onChange, highlights }, ref) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<CodeEditorHandle>(null);
  const [message, setMessage] = useState('');

  useImperativeHandle(ref, () => ({
    revealLine: (line) => editorRef.current?.revealLine(line),
    selectAll: () => editorRef.current?.selectAll(),
    focus: () => editorRef.current?.focus(),
  }));

  const loadFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsText(file);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} JSONC copied.`);
    } catch {
      editorRef.current?.selectAll();
      setMessage('Clipboard access failed. Text selected for manual copy.');
    }
  };

  return (
    <section className="editor-panel" aria-labelledby={`${inputId}-label`}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Source document</p>
          <h2 id={`${inputId}-label`}>{label}</h2>
        </div>
        <div className="editor-actions">
          <button className="text-button" type="button" onClick={() => editorRef.current?.selectAll()}>Select all</button>
          <button className="text-button" type="button" onClick={copy}>Copy</button>
          <button className="text-button" type="button" onClick={() => fileRef.current?.click()}>Load file</button>
        </div>
        <input
          ref={fileRef}
          className="visually-hidden"
          id={inputId}
          type="file"
          accept="application/json,.json,.jsonc"
          onChange={(event) => loadFile(event.target.files?.[0])}
        />
      </div>
      <CodeEditor ref={editorRef} value={value} onChange={onChange} errorLine={errorLine} highlights={highlights} ariaLabel={`${label} JSONC document`} />
      <p className={error ? 'validation error' : 'validation'} id={`${inputId}-error`} role={error ? 'alert' : 'status'}>
        {error ?? (message || 'JSON keys use bold highlighting. JSON and JSONC supported.')}
      </p>
    </section>
  );
});
