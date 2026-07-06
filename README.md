<!--
SPDX-FileCopyrightText: Greg Back <git@gregback.net>
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# backgammon-js

A dependency-free JavaScript library for rendering backgammon board diagrams on an HTML5 Canvas.
It accepts positions in [XGID format](docs/xgid.md) and draws the board, checkers, doubling cube,
and player scores.

## Purpose

`backgammon-js` is designed around three goals:

1. **Drop-in, no build step.** It's a single file you add to any HTML page with a plain
   `<script>` tag — no npm, bundler, or framework required. It can also be used inside a
   tooled project if you have one, but it never depends on having one.
2. **Trivial to draw one board.** Rendering a position takes no configuration: pass an XGID
   string and call `.draw()`. Sensible defaults handle everything else.
3. **Ready to scale up.** The same primitives are meant to drive larger projects that render
   many diagrams on a page in a consistent style — so the API is built to set styling once and
   reuse it across many boards.

## Quick Start

Include `board.js` in your page, give it an empty container element, then create a `Diagram` and
call `.draw()`. The library creates the `<canvas>` inside the container for you and overlays
copy/download controls (see [Copying and exporting](#copying-and-exporting)):

```html
<script src="board.js"></script>

<div id="diagram"></div>

<script>
  const container = document.querySelector('#diagram');
  const diagram = new Diagram(container);
  diagram.draw();
</script>
```

Omitting the second argument (or passing `null`) draws the standard starting position. To draw a
specific position, pass an XGID string:

```js
const diagram = new Diagram(container, 'XGID=-b----E-C---eE---c-e----B-:0:0:1:21:0:0:3:0:10');
diagram.draw();
```

See `index.html` for a live demo with an interactive position input, theme presets, and
color pickers. The demo also supports loading a position via URL fragment: `index.html#XGID=...`.

## Theming and Custom Colors

Pass a partial options object as the third argument to `Diagram` to override any default colors:

```js
const diagram = new Diagram(container, xgid, {
  frameColor: '#1a3a5c',
  boardBackground: '#1f5f7a',
  oddPoints: '#0e7490',
  evenPoints: '#e0d7c0',
  player1: { checkerColor: '#f5f0e6' },
  player2: { checkerColor: '#10243a' }
});
diagram.draw();
```

You only need to specify the keys you want to change — the rest inherit from `DEFAULT_OPTIONS`.

### Built-in themes

`board.js` exports a `THEMES` object with named presets (`Maple`, `Midnight`, `Ocean`, `Slate`)
that can be passed directly as the options argument:

```js
const diagram = new Diagram(container, xgid, THEMES.Midnight);
diagram.draw();
```

### Derived colors

The renderer derives coordinated shades from each base color automatically, so a theme only needs
to specify a few base colors:

- **Frame gradient** — the frame and bar lighten and darken around `frameColor`, giving a
  wood-grain look without separate light/dark options.
- **Point tips** — each triangle fades to a darker shade of its own `oddPoints`/`evenPoints`
  color toward the tip.
- **Checker border and sheen** — the border, radial highlight, and shadow are all derived from
  `checkerColor`. Light checkers get a black border for contrast; dark checkers get a slightly
  lighter shade so the border doesn't disappear against the fill.
- **Checker labels and dice pips** — the checker count shown on a tall stack, the count on a
  barred checker, and the pips on the dice all pick black or white automatically based on the
  checker's brightness. A theme therefore only ever specifies fill colors, never text colors.

### Options reference

Every option is optional; unspecified keys inherit from `DEFAULT_OPTIONS`. Sizing is controlled
separately — see [Sizing](#sizing).

| Option | Default | Description |
|---|---|---|
| `margin` | `40` | Outer padding in pixels between the canvas edge and the board frame; a constant gap regardless of board scale |
| `controls` | `true` | Show the copy/download controls overlaid on the container (see [Copying and exporting](#copying-and-exporting)); set `false` for purely decorative boards. Ignored when a bare `<canvas>` is passed instead of a container |
| `frameColor` | `#b08a5a` (maple) | Base color for the frame and bar; gradient shades derived |
| `boardBackground` | `#226434` (green) | Board background (felt) color |
| `oddPoints` | `#b42828` (burgundy) | Base color for odd-numbered points; tip shade derived |
| `evenPoints` | `#ebd7af` (ivory) | Base color for even-numbered points; tip shade derived |
| `player1.checkerColor` | `#ffffff` | Player's checker fill; border, highlight, and shadow derived |
| `player2.checkerColor` | `#000000` | Opponent's checker fill; border, highlight, and shadow derived |

## Sizing

Every dimension on the board is a fixed multiple of one point's width, so the aspect ratio is
constant and a single scale factor reaches the screen. By default one point is 40px wide; pass
**one** optional scale knob (in the same options object) to size the board however is convenient:

| Scale knob | Meaning |
|---|---|
| `pointWidth` | Pixel width of one point/column — the base unit (most direct) |
| `boardWidth` | Pixel width of the whole framed board, frame edge to edge (includes the frame and bar) |
| `canvasWidth` | Total canvas width in pixels (the framed board plus the outer `margin` on each side) |

If more than one is given, the first present in the order above wins. The canvas height follows
automatically from the fixed aspect ratio.

```js
const diagram = new Diagram(container, xgid, { pointWidth: 30 });
diagram.draw();
```

## Drawing Many Diagrams with One Style

When a page shows several boards that should all look alike — a match transcript, a set of
flashcards — build a `BoardStyle` once (with a theme and/or a scale knob) and reuse it for every
diagram:

```js
const style = new BoardStyle({ ...THEMES.Midnight, pointWidth: 28 });

style.draw(containerA, 'XGID=…');   // every board shares the same look and size
style.draw(containerB, 'XGID=…');
```

`BoardStyle.draw(container, xgid)` returns the underlying `Diagram`. You can also loop over a list
of positions, drawing each into its own container:

```js
const style = new BoardStyle(THEMES.Ocean);

for (const [container, xgid] of positions) {
  style.draw(container, xgid);
}
```

Drawing a single board needs no `BoardStyle` — that stays the one-liner
`new Diagram(container, 'XGID=…').draw()`.

## Copying and exporting

Every diagram drawn into a container element gets a small set of controls, overlaid in the
top-right corner and revealed on hover or keyboard focus (they stay in the tab order, and are
hidden when printing): **copy the board as a PNG image**, **copy the XGID string**, and
**download a PNG**. Pass `controls: false` in the options to omit them.

The same actions are available as methods on the `Diagram`, so you can wire up your own UI:

| Method | Description |
|---|---|
| `copyXgid()` | Copy the rendered XGID string to the clipboard. Returns a promise. |
| `copyImage(scale = 2)` | Copy a PNG of the board to the clipboard; falls back to a download where the clipboard image API is unavailable (older browsers / insecure context). |
| `downloadPng(scale = 2)` | Save a PNG of the board as a file. |
| `toBlob(scale = 2)` | Resolve to a PNG `Blob` of the board. |
| `toCanvas(scale = 2)` | Return a detached `<canvas>` with the board rendered at `scale`× the on-screen size. |

Images are rendered at `scale`× the on-screen size (2× by default) so they stay crisp when pasted
or saved. Clipboard access requires a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)
(HTTPS or `localhost`).

For advanced use you can still pass a `<canvas>` element directly instead of a container; the
diagram renders into it and skips the controls.

## Notes

- **Checker stacking**: points with more than 5 checkers draw only 5 pieces and show the total
  count as a number on the top checker.
- **Centered cube**: when the cube has not yet been turned (XGID cube field `0`), the diagram
  shows "64" — the standard backgammon convention for the unclaimed doubling cube.

## XGID Format

Positions are expressed as XGID strings, a format defined by the eXtreme Gammon software. A full
field-by-field reference is in [docs/xgid.md](docs/xgid.md).

## License

MIT — see [LICENSES/MIT.txt](LICENSES/MIT.txt).
