<!--
SPDX-FileCopyrightText: Greg Back <git@gregback.net>
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# backgammon-js

A dependency-free JavaScript library for rendering backgammon board diagrams on an HTML5 Canvas.
It accepts positions in [XGID format](docs/xgid.md) and draws the board, checkers, doubling cube,
and player scores.

## Quick Start

Include `board.js` in your page, then create a `Diagram` and call `.draw()`:

```html
<script src="board.js"></script>

<canvas id="diagram">
  <p>Backgammon board</p>
</canvas>

<script>
  const canvas = document.querySelector('#diagram');
  const diagram = new Diagram(canvas);
  diagram.draw();
</script>
```

Omitting the second argument (or passing `null`) draws the standard starting position. To draw a
specific position, pass an XGID string:

```js
const diagram = new Diagram(canvas, 'XGID=-b----E-C---eE---c-e----B-:0:0:1:21:0:0:3:0:10');
diagram.draw();
```

See `index.html` for a live demo with an interactive position input, theme presets, and
color pickers. The demo also supports loading a position via URL fragment: `index.html#XGID=...`.

## Theming and Custom Colors

Pass a partial options object as the third argument to `Diagram` to override any default colors:

```js
const diagram = new Diagram(canvas, xgid, {
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

`board.js` exports a `THEMES` object with named presets (`Walnut`, `Midnight`, `Ocean`, `Slate`)
that can be passed directly as the options argument:

```js
const diagram = new Diagram(canvas, xgid, THEMES.Midnight);
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

### Options reference

| Option | Default | Description |
|---|---|---|
| `canvasWidth` | `690` | Canvas width in pixels |
| `canvasHeight` | `560` | Canvas height in pixels |
| `canvasMargin` | `40` | Margin between canvas edge and board frame |
| `frameThicknessX` | `50` | Horizontal frame thickness |
| `frameThicknessY` | `25` | Vertical frame thickness |
| `barThickness` | `40` | Width of the center bar |
| `frameColor` | `#5a3723` (walnut) | Base color for the frame and bar; gradient shades derived |
| `boardBackground` | `#226434` (green) | Board background (felt) color |
| `oddPoints` | `#b42828` (burgundy) | Base color for odd-numbered points; tip shade derived |
| `evenPoints` | `#ebd7af` (ivory) | Base color for even-numbered points; tip shade derived |
| `player1.checkerColor` | `#ffffff` | Player's checker fill; border, highlight, and shadow derived |
| `player1.textColor` | `#000000` | Text on Player's checkers |
| `player2.checkerColor` | `#000000` | Opponent's checker fill; border, highlight, and shadow derived |
| `player2.textColor` | `#ffffff` | Text on Opponent's checkers |

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
