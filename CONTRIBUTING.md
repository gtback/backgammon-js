<!--
SPDX-FileCopyrightText: Greg Back <git@gregback.net>
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Contributing

## Running the demo

No build step is required. Open `index.html` directly in a browser:

```sh
open index.html          # macOS
xdg-open index.html      # Linux
```

Or serve it locally with any static file server.

## Code style

JavaScript is formatted with [Standard JS](https://standardjs.com/). The style is enforced by a
pre-commit hook; to check manually:

```sh
npx standard board.js
```

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

## Key files

| File | Purpose |
|---|---|
| `board.js` | The library — Canvas renderer and XGID parser |
| `index.html` | Interactive demo |
| `docs/xgid.md` | XGID position format reference |
