<!--
SPDX-FileCopyrightText: Greg Back <git@gregback.net>
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Contributing

## Design principles

Keep these in mind when changing the library (see [AGENTS.md](AGENTS.md) for the full rationale):

- **`board.js` stays a drop-in `<script>` file.** It must work on a plain HTML page with no npm,
  bundler, or framework. Any dev tooling here is optional and dev-only — if you add module exports
  for tests, guard them so the browser-global path keeps working.
- **Drawing one board stays a one-liner**: `new Diagram(container, 'XGID=…').draw()`. New options or
  styling APIs should be additive, never required for the simple case.
- **README vs `index.html` — know where things go.** `README.md` is the front door and reference
  manual: it is read on github.com, so it must be useful *without running any JavaScript* (purpose,
  quick start, the options/sizing/theme reference, each shown with a short illustrative snippet, and
  later static screenshots). `index.html` is the live, interactive demo and feature showcase —
  controls plus a gallery of positions that exercise every rendering path. Rule of thumb: if it has
  to *run* to be useful, it belongs in the demo; if it documents *what the API is*, it belongs in
  the README.

## Running the demo

No build step is required. Open `index.html` directly in a browser:

```sh
open index.html          # macOS
xdg-open index.html      # Linux
```

Or serve it locally with any static file server.

To exercise the copy controls (copy image / copy XGID), the page must run in a
[secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts), so serve
it over `http://localhost` rather than opening it via `file://`:

```sh
python3 -m http.server      # then open http://localhost:8000/
```

## Running tests

The library has a small test suite built on Node's built-in [`node:test`](https://nodejs.org/api/test.html)
runner — no runtime dependencies, matching the project's dependency-free ethos. Run it with:

```sh
npm test     # runs `node --test`
```

The tests are dev-only and do not affect drop-in `<script>` usage: `board.js` guards its module
exports so the browser-global path keeps working. `test/idempotency.test.js` additionally evaluates
`board.js` twice in one `vm` realm to prove re-loading it (as Anki does) is a safe no-op.

## Code style

JavaScript is formatted with [Standard JS](https://standardjs.com/). The style is enforced by a
pre-commit hook; to check manually:

```sh
npx standard board.js
```

`board.js` is wrapped in a single IIFE (see [AGENTS.md](AGENTS.md)), so its whole body is indented
one level. If you restructure it, let `standard --fix board.js` handle the reindentation rather than
doing it by hand.

## License compliance

This project uses [REUSE](https://reuse.software/) to track copyright and license metadata. Every
file must either carry an SPDX header comment or have an entry in `REUSE.toml`. To check:

```sh
reuse lint
```

New files should follow the conventions used by existing files:
- Source code (`.js`): MIT
- Documentation (`.md`): CC-BY-SA-4.0
- Configuration / tooling: CC0-1.0

## Pull requests

`main` is protected: land changes through a pull request with the `test` status check green,
rather than pushing to `main` directly.

## Key files

| File | Purpose |
|---|---|
| `board.js` | The library — Canvas renderer and XGID parser |
| `index.html` | Interactive demo and feature showcase |
| `docs/xgid.md` | XGID position format reference |
| `test/` | `node:test` suite for the pure helpers |
| `package.json` | Dev-only tooling (test script); not needed for drop-in use |
