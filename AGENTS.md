## AGENTS.md

Authoritative guide for AI/code agents contributing to this repository.

### Project purpose
- **What this is**: A small, dependency-free HTML templating/DOM rendering library for AEM Edge Delivery Services blocks (and other HTML fragments).
- **Public API**: `renderBlock(element, context?)`, `renderElement(element, context?)` exported from `src/index.js` and bundled to `dist/faintly.js`.

### Environment
- **Node**: 20 (CI uses Node 20).
- **Package manager**: npm.
- **ES modules**: Use ESM imports/exports. Always include the `.js` extension in local imports (lint enforces this).

### Scripts (run from repo root)
- **Install**: `npm ci`
- **Lint**: `npm run lint`
- **Lint (auto-fix)**: `npm run lint:fix`
- **Unit tests + coverage**: `npm test`
- **Performance tests**: `npm run test:perf`
- **Build bundle**: `npm run build` → outputs `dist/faintly.js` and prints gzipped size (warns if over limit)
- **Build (strict)**: `npm run build:strict` → fails if gzipped size exceeds 5120 bytes
- **Clean**: `npm run clean`

### Tests and coverage
- Test runner: `@web/test-runner` with Mocha.
- Groups:
  - `unit`: `test/**/*.test.{html,js}` excluding `test/performance/**` (default group used by `npm test`).
  - `perf`: `test/performance/**/*.test.{html,js}` (opt-in).
- Coverage thresholds (enforced in CI): 100% for statements, branches, functions, and lines.
- Coverage reports: written to `coverage/`. Excludes `test/fixtures/**`, `test/snapshots/**`, `test/test-utils.js`, and `node_modules/**`.
- When adding features, add or update tests to maintain 100% coverage in the `unit` group.

### Linting and code style
- ESLint config: `airbnb-base` via `.eslintrc.js` with `@babel/eslint-parser`.
- Key rules:
  - `import/extensions`: require `.js` in imports.
  - `linebreak-style`: `unix`.
  - `no-param-reassign`: allowed for parameter properties (props: false).
- Style expectations for agents:
  - Prefer clear, descriptive variable and function names over abbreviations.
  - Use guard clauses and shallow control flow.
  - Only add comments where non-obvious rationale or edge cases require it.
  - Keep modules small and readable; avoid deep nesting; avoid unnecessary try/catch.

### Build and artifacts
- Bundling uses `esbuild` to produce a single ESM file at `dist/faintly.js` for browser usage.
- CI enforces a gzipped bundle size limit of **5KB (5120 bytes)**. Keep additions small; avoid adding heavy dependencies.
- If you change source under `src/`, run `npm run build` so `dist/faintly.js` is up to date.

### CI behavior (GitHub Actions)
- Workflow: `.github/workflows/main.yaml` runs on pull requests (open/sync/reopen).
- Steps: checkout → Node 20 → `npm ci` → `npm run lint` → `npm test` → `npm run build:strict`.
- The workflow will attempt to commit updated `dist/` artifacts back to the PR branch if they changed.

### Repo layout
- `src/`: library source (`index.js`, `render.js`, `directives.js`, `expressions.js`, `templates.js`).
- `dist/`: built artifact (`faintly.js`).
- `test/`: unit/perf tests, fixtures, snapshots, and utilities.
- `coverage/`: coverage output when tests are run with coverage.

### Contribution checklist for agents
1. Install deps with `npm ci`.
2. Make focused edits under `src/` and relevant tests under `test/`.
3. Run `npm run lint:fix` then `npm run lint` and resolve any remaining issues.
4. Run `npm test` and ensure coverage stays at 100%.
5. Run `npm run build:strict` and verify `dist/faintly.js` updates (if source changed).
6. Ensure gzipped size of `dist/faintly.js` remains <= 5120 bytes (CI will enforce).
7. Update `README.md` if you change public behavior or usage.
8. Commit changes; open a PR. CI will validate and may commit updated `dist/` to the PR branch.

### Public API and usage (for context)
- Consumers copy `dist/faintly.js` into their AEM project and use:
  - `renderBlock(block, context?)`
  - `renderElement(element, context?)`
- See `README.md` for examples, directives, and expression syntax.

### Guardrails and constraints
- Keep the bundle tiny; avoid adding runtime deps.
- Maintain 100% test coverage; do not reduce thresholds or exclude more files.
- Respect ESM and `.js` extension import rule.
- Do not introduce Node-only APIs into browser code paths.



