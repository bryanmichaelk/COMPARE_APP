import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { json } from '@codemirror/lang-json';
import { bracketMatching, HighlightStyle, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { Compartment, EditorState } from '@codemirror/state';
import { Decoration, drawSelection, EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view';
import { tags } from '@lezer/highlight';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  errorLine?: number;
  ariaLabel: string;
  highlights?: Array<{ line: number; kind: 'added' | 'removed' | 'changed' | 'type-changed'; active?: boolean }>;
}

export interface CodeEditorHandle {
  revealLine: (line: number) => void;
  selectAll: () => void;
  focus: () => void;
}

const jsonHighlightStyle = HighlightStyle.define([
  { tag: tags.propertyName, color: '#0b514c', fontWeight: '700' },
  { tag: tags.string, color: '#8a3d16' },
  { tag: tags.number, color: '#174f91', fontWeight: '600' },
  { tag: [tags.bool, tags.null], color: '#6e2d84', fontWeight: '600' },
  { tag: tags.lineComment, color: '#68736a', fontStyle: 'italic' },
]);

const errorLineTheme = EditorView.baseTheme({
  '.cm-error-line': { backgroundColor: '#ffe6df' },
  '.cm-diff-added': { backgroundColor: '#dff4e7' },
  '.cm-diff-removed': { backgroundColor: '#ffe3df' },
  '.cm-diff-changed, .cm-diff-type-changed': { backgroundColor: '#fff2cc' },
  '.cm-diff-active': { boxShadow: 'inset 3px 0 #176d67' },
});

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor({ value, onChange, readOnly = false, errorLine, ariaLabel, highlights = [] }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView>();
  const readOnlyCompartment = useRef(new Compartment());
  const errorCompartment = useRef(new Compartment());
  const changeRef = useRef(onChange);
  const syncingRef = useRef(false);
  changeRef.current = onChange;

  useImperativeHandle(ref, () => ({
    revealLine: (line) => {
      const view = viewRef.current;
      if (!view || line < 1 || line > view.state.doc.lines) return;
      view.dispatch({ selection: { anchor: view.state.doc.line(line).from }, scrollIntoView: true });
    },
    selectAll: () => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({ selection: { anchor: 0, head: view.state.doc.length } });
      view.focus();
    },
    focus: () => viewRef.current?.focus(),
  }));

  useEffect(() => {
    if (!hostRef.current) return undefined;
    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          history(),
          drawSelection(),
          EditorState.allowMultipleSelections.of(true),
          indentOnInput(),
          bracketMatching(),
          highlightActiveLine(),
          syntaxHighlighting(jsonHighlightStyle),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          json(),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !syncingRef.current) changeRef.current?.(update.state.doc.toString());
          }),
          EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
          readOnlyCompartment.current.of(EditorState.readOnly.of(readOnly)),
          errorCompartment.current.of([]),
          errorLineTheme,
          EditorView.theme({
            '&': { height: '100%', fontSize: '13px' },
            '.cm-scroller': { overflow: 'auto', fontFamily: 'Consolas, "Courier New", monospace', lineHeight: '1.6' },
            '.cm-gutters': { backgroundColor: '#edf0ea', color: '#6c746a', borderRight: '1px solid #d1d7cc' },
            '.cm-activeLineGutter': { backgroundColor: '#e0e7df', color: '#20231f' },
            '.cm-activeLine': { backgroundColor: '#f3f6f0' },
            '.cm-content': { padding: '12px 0 18px' },
            '.cm-line': { padding: '0 14px' },
            '.cm-focused': { outline: '3px solid #176d67', outlineOffset: '-3px' },
          }),
        ],
      }),
      parent: hostRef.current,
    });
    viewRef.current = view;
    return () => view.destroy();
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || value === view.state.doc.toString()) return;
    syncingRef.current = true;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    syncingRef.current = false;
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: readOnlyCompartment.current.reconfigure(EditorState.readOnly.of(readOnly)) });
  }, [readOnly]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const lineClasses = new Map<number, string>();
    highlights.forEach((highlight) => {
      if (highlight.line >= 1 && highlight.line <= view.state.doc.lines) lineClasses.set(highlight.line, `cm-diff-${highlight.kind}${highlight.active ? ' cm-diff-active' : ''}`);
    });
    if (errorLine && errorLine <= view.state.doc.lines) lineClasses.set(errorLine, 'cm-error-line');
    const ranges = [...lineClasses.entries()]
      .sort(([left], [right]) => left - right)
      .map(([line, className]) => Decoration.line({ attributes: { class: className } }).range(view.state.doc.line(line).from));
    const decorations = ranges.length ? EditorView.decorations.of(Decoration.set(ranges)) : [];
    view.dispatch({ effects: errorCompartment.current.reconfigure(decorations) });
  }, [errorLine, highlights]);

  return <div className="code-editor" ref={hostRef} />;
});
