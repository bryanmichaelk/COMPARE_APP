# JSON Compare

Browser-only tool for comparing, applying, and copying JSON and JSONC differences.

## Run locally

```bash
npm install
npm run dev
```

## Test and build

```bash
npm run test
npm run build
```

## Run with Docker

```bash
docker compose up --build
```

Open `http://localhost:8080`.

## Behavior

- Paste JSONC or load local `.json` and `.jsonc` files in Left and Right editors.
- JSON keys use bold syntax highlighting; input editors provide Select all and Copy controls.
- JSONC comments and trailing commas are accepted.
- Per-difference apply preserves destination comments and surrounding formatting.
- Editors and output include one-based line-number gutters.
- Configure array identity property, default `id`.
- Object arrays match by identity property even when order differs.
- Invalid or duplicate array identities use index comparison and show warning.
- Use Left applies one source value to Right. Use Right applies one source value to Left.
- Bulk application makes destination document match source document in selected direction.
- Output preserves selected document JSONC text, remains editable, and supports Select all, reset, and clipboard copy.
- JSON never leaves browser memory.
