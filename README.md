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
  const diagram = new Diagram(document.querySelector('#diagram'));
  diagram.draw();
</script>
```

This draws the board in the standard starting position. To draw a specific position, pass an XGID
string as the second argument:

```js
const diagram = new Diagram(canvas, 'XGID=-b----E-C---eE---c-e----B-:0:0:1:21:0:0:3:0:10');
diagram.draw();
```

See `index.html` for a live demo with an interactive position input.

## Configuration

Sizes and colors are controlled by `DEFAULT_OPTIONS` in `board.js`:

| Option | Default | Description |
|---|---|---|
| `canvasWidth` | `690` | Canvas width in pixels |
| `canvasHeight` | `560` | Canvas height in pixels |
| `canvasMargin` | `40` | Margin between canvas edge and board frame |
| `frameThicknessX` | `50` | Horizontal frame (home board / bar) thickness |
| `frameThicknessY` | `25` | Vertical frame (top / bottom border) thickness |
| `barThickness` | `40` | Width of the bar in the center of the board |
| `frameColor` | dark brown | Color of the outer board frame |
| `boardBackground` | green | Board background color |
| `oddPoints` | red | Color of odd-numbered triangular points |
| `evenPoints` | white | Color of even-numbered triangular points |
| `player1.checkerColor` | white | Player's checker fill color |
| `player1.checkerBorder` | black | Player's checker border color |
| `player1.textColor` | black | Text color on Player's checkers |
| `player2.checkerColor` | black | Opponent's checker fill color |
| `player2.checkerBorder` | gray | Opponent's checker border color |
| `player2.textColor` | white | Text color on Opponent's checkers |

## XGID Format

Positions are expressed as XGID strings, a format defined by the eXtreme Gammon software. A full
field-by-field reference is in [docs/xgid.md](docs/xgid.md).

## License

MIT — see [LICENSES/MIT.txt](LICENSES/MIT.txt).
