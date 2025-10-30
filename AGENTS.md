## AGENTS.md

Authoritative guide for AI/code agents contributing to this repository.

### Project purpose
- **What this is**: A small, dependency-free HTML templating/DOM rendering library for AEM Edge Delivery Services blocks (and other HTML fragments).
- **Public API**: `renderBlock(element, context?)`, `renderElement(element, context?)` exported from `src/index.js` and bundled to `dist/faintly.js`.
- **Security**: Built-in XSS protection via `src/faintly.security.js`, bundled to `dist/faintly.security.js` (dynamically loaded by default).

### Environment
- **Node**: 20 (CI uses Node 20).
- **Package manager**: npm.
- **ES modules**: Use ESM imports/exports. Always include the `.js` extension in local imports (lint enforces this).

### Scripts (run from repo root)
- **Install**: `npm ci`
- **Lint**: `npm run lint` and `npm run lint:fix` (autofix)
- **Unit tests + coverage**: `npm test`
- **Run individual test file(s)**: `npm run test:file 'path/to/test.js'` (supports glob patterns like `'test/security/*.test.js'`)
- **Build bundle**: `npm run build` → outputs `dist/faintly.js` and prints gzipped size (warns if over limit)
- **Build (strict)**: `npm run build:strict` → fails if gzipped size exceeds 5120 bytes
- **Clean**: `npm run clean`
- **Verify all**: `npm run verify` → runs clean, build:strict, lint, and test in sequence (comprehensive check)

### Tests and coverage
- Test runner: `@web/test-runner` with Mocha.
- Groups:
  - `unit`: `test/**/*.test.{html,js}` excluding `test/performance/**` (default group used by `npm test`).
  - `perf`: `test/performance/**/*.test.{html,js}` (opt-in).
- Coverage thresholds (enforced in CI): 100% for statements, branches, functions, and lines.
- Coverage reports: written to `coverage/`. Excludes `test/fixtures/**`, `test/snapshots/**`, `test/test-utils.js`, and `node_modules/**`.
- When adding features, add or update tests to maintain 100% coverage in the `unit` group.
- **Running individual test files**:
  - Use `npm run test:file 'path/to/test.js'` to run a specific test file.
  - Supports glob patterns: `npm run test:file 'test/security/*.test.js'`
  - Note: This uses a separate config (`wtr-single.config.mjs`) because the main config's group-based file patterns take precedence over the `--files` flag.
  - Do NOT use `npm test -- --files 'path/to/test.js'` as it will not work correctly with the group-based configuration.

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
- Bundling uses `esbuild` to produce two ESM bundles for browser usage:
  - `dist/faintly.js` (core library, gzipped limit: **4KB / 4096 bytes**)
  - `dist/faintly.security.js` (security module, separate to allow tree-shaking)
- CI enforces a **combined gzipped size limit of 6KB (6144 bytes)** for both files.
- Keep additions small; avoid adding heavy dependencies.
- If you change source under `src/`, run `npm run build` so `dist/` artifacts are up to date.

### CI behavior (GitHub Actions)
- Workflow: `.github/workflows/main.yaml` runs on pull requests (open/sync/reopen).
- Steps: checkout → Node 20 → `npm ci` → `npm run lint` → `npm test` → `npm run build:strict`.
- The workflow will attempt to commit updated `dist/` artifacts back to the PR branch if they changed.

### Repo layout
- `src/`: library source
  - Core: `index.js`, `render.js`, `directives.js`, `expressions.js`, `templates.js`
  - Security: `faintly.security.js`
- `dist/`: built artifacts (`faintly.js`, `faintly.security.js`)
- `test/`: unit/perf tests, fixtures, snapshots, and utilities
  - `test/security/`: tests for security module
- `coverage/`: coverage output when tests are run with coverage
- `web-test-runner.config.mjs`: main test runner config with group-based patterns
- `wtr-single.config.mjs`: minimal config for running individual test files (bypasses groups)

### Contribution checklist for agents
1. Install deps with `npm ci`.
2. Make focused edits under `src/` and relevant tests under `test/`.
3. Run `npm run lint:fix` then `npm run lint` and resolve any remaining issues.
4. Run `npm test` and ensure coverage stays at 100%.
5. Run `npm run build:strict` and verify `dist/` artifacts update (if source changed).
6. Ensure combined gzipped size remains <= 6144 bytes (CI will enforce).
7. Update `README.md` if you change public behavior or usage.
8. Commit changes; open a PR. CI will validate and may commit updated `dist/` to the PR branch.

### Public API and usage (for context)
- Consumers copy `dist/faintly.js` and `dist/faintly.security.js` into their AEM project and use:
  - `renderBlock(block, context?)`
  - `renderElement(element, context?)`
- Security is **enabled by default** and dynamically loads `faintly.security.js` on first use.
- See `README.md` for examples, directives, expression syntax, and security configuration.

### Guardrails and constraints
- Keep the bundle tiny; avoid adding runtime deps.
- Maintain 100% test coverage; do not reduce thresholds or exclude more files.
- Respect ESM and `.js` extension import rule.
- Do not introduce Node-only APIs into browser code paths.

### Security module (`src/faintly.security.js`)
- Provides default XSS protection: attribute sanitization, URL scheme validation, same-origin enforcement.
- Exported as a separate bundle (`dist/faintly.security.js`) for tree-shaking in opt-out scenarios.
- Dynamically imported by `directives.js` when `context.security` is undefined.
- Users can disable (`security: false`), provide custom hooks, or override default configuration.
- When modifying security:
  - **Test thoroughly** - security bugs have serious consequences.
  - Use TDD approach with comprehensive test coverage.
  - Document changes in `README.md` security section.
  - Consider backwards compatibility for existing users.
  - Be conservative about what is allowed by default.


