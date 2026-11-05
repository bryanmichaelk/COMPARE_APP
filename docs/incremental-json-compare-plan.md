# Incremental JSON Compare Plan

## Goal

Build browser-only React tool for comparing two JSON documents, applying differences in either direction, and copying valid merged JSON.

## Increment 1: Project Foundation

- Create standalone Vite, React, and TypeScript project.
- Add development, test, production build, and Docker scripts.
- Keep data in browser memory. No API, storage, tracking, or server-side JSON processing.

## Increment 2: JSON Comparison Engine

- Parse left and right JSON independently.
- Compare object properties recursively.
- Report added, removed, changed, and type-changed paths.
- Compare arrays of objects by configurable identity key, default `id`.
- Fall back to index comparison for primitive arrays, duplicate identities, and items missing identity key.
- Return warnings with affected array paths when fallback occurs.

## Increment 3: Difference Application

- Store separate left and right paths for each difference.
- Copy source value into destination document for per-row direction actions.
- Remove destination value when source path is absent.
- Support bulk left-to-right and right-to-left application after explicit confirmation. Bulk transfer copies complete source document so object-array additions cannot use stale indexes.
- Re-run comparison after each applied difference.

## Increment 4: Interface

- Provide paste editors and local `.json` file loading for both sides.
- Show input parse errors before comparison.
- Provide array identity key setting.
- Show summary counts, warnings, filterable difference rows, and accessible feedback.
- Allow output side selection, pretty JSON output, and clipboard copy.
- Use compact light workbench layout on desktop and stacked editors on mobile.

## Increment 5: Delivery

- Add unit tests for nested properties, type changes, keyed arrays, warnings, and apply behavior.
- Build production static assets.
- Serve built app using Nginx in multi-stage Docker image.
- Add compose file with port `8080` and health check.

## Increment 6: JSONC Editor Workbench

- Accept JSONC comments and trailing commas using `jsonc-parser`.
- Preserve comments and surrounding formatting during per-path changes.
- Use CodeMirror editors with one-based line-number gutters for Left, Right, and Output.
- Display parser errors with line and column context, including error-line highlighting.
- Support `.jsonc` file loading and raw JSONC clipboard output.

## Increment 7: Source-Aware Difference Review

- Map each JSON difference to one-based Left and Right source lines.
- Highlight added, removed, changed, and selected lines in both editors.
- Add clickable source-line controls in difference table rows.
- Detect scalar object-array identity key options alongside `id`, `key`, `code`, `uuid`, and `name` presets.
- Refine toolbar, filters, editor surfaces, and selected-row state for dense configuration review.

## Design Decisions

- Color: warm paper neutral reduces glare during long text comparison; teal marks usable actions; semantic colors identify difference kind.
- Layout: paired source editors match left/right comparison task; central results table supports scanning and per-path action.
- Typography: system sans prioritizes legibility and avoids external font dependency.
- Spacing: compact grouped regions maximize visible JSON and diff rows.
- Motion: no decorative motion. Brief feedback changes only communicate state.
- Editor: CodeMirror line gutters give direct reference points for large configuration documents.
