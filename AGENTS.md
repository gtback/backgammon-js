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
- Drawing one board stays a one-liner — `new Diagram(canvas, 'XGID=…').draw()`. New styling/reuse
  APIs must be additive, never required.

Keep `README.md` a runnable-free reference (it's read on github.com); live, interactive demos go in
`index.html`. See the "README vs `index.html`" principle in [CONTRIBUTING.md](CONTRIBUTING.md).

- **Usage and configuration**: [README.md](README.md)
- **Dev workflow, code style, license compliance**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **XGID position format**: [docs/xgid.md](docs/xgid.md)
