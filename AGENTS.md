<!--
SPDX-FileCopyrightText: Greg Back <git@gregback.net>
SPDX-License-Identifier: CC0-1.0
-->

# Agent Notes

`backgammon-js` is a dependency-free JavaScript library for rendering backgammon boards on an
HTML5 Canvas. See [README.md](README.md#purpose) for the full purpose.

**Do not break these constraints:**

- `board.js` must keep working as a bare `<script>` global on a plain HTML page. Any dev tooling
  (`package.json`, test runner) is optional and dev-only; if you add module exports for tests,
  guard them so the browser-global path still works.
- Drawing one board stays a one-liner — `new Diagram(container, 'XGID=…').draw()`. New styling/reuse
  APIs must be additive, never required.

Keep `README.md` a runnable-free reference (it's read on github.com); live, interactive demos go in
`index.html`. See the "README vs `index.html`" principle in [CONTRIBUTING.md](CONTRIBUTING.md).

## How `board.js` is structured (rationale behind those constraints)

The whole file is one guarded IIFE (since 0.1.0). To add public API, declare it inside the IIFE
and add its name to the `_api` object — that single object is both copied onto the global object
(for `<script>` consumers) and assigned to `module.exports` (for `node:test`). **Don't move
declarations back to the top level:** as lexical `class`/`const` globals they weren't reachable on
`window`, and re-running the file in one realm threw `Identifier 'Diagram' has already been
declared`. (Because the body lives inside the IIFE it's indented one level; `standard --fix`
handles that if you restructure.)

This matters because the main consumer is **Anki**, which reuses one long-lived webview and
re-injects card HTML on every flip — so loading `board.js` repeatedly in a single realm must be a
harmless no-op (the guard at the top of the IIFE). For the same reason, older Anki bundles an older
QtWebEngine: **feature-detect newer Canvas APIs before using them** (`board.js` polyfills
`ctx.roundRect` for exactly this).

- **Usage and configuration**: [README.md](README.md)
- **Dev workflow, code style, license compliance**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **XGID position format**: [docs/xgid.md](docs/xgid.md)
