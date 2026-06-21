// SPDX-FileCopyrightText: Greg Back <git@gregback.net>
// SPDX-License-Identifier: MIT

// Structural colors. These are intentionally not configurable: BLACK is used
// for borders and labels that should stay black regardless of theme.
const BLACK = '#000000'
const WHITE = '#ffffff'

// Base theme colors. Coordinated shades (frame gradient, point tips, checker
// sheen) are derived from these at draw time via lighten()/darken(), so a theme
// only needs to specify base colors.
const WALNUT = '#5a3723'
const BURGUNDY = '#b42828'
const IVORY = '#ebd7af'
const FELT_GREEN = '#226434'

// Amounts used to derive coordinated shades from a base color.
const FRAME_LIGHTEN = 0.09
const FRAME_DARKEN = 0.22
const POINT_TIP_DARKEN = 0.32
const CHECKER_HIGHLIGHT = 0.22
const CHECKER_SHADOW = 0.20
const CHECKER_BORDER_LIGHTEN = 0.24 // for dark checkers; light checkers always get BLACK

// Layout ratios, expressed in the fundamental unit U = one point (column) width.
// "The board is 12 points wide" is the most fundamental ratio, so every
// dimension is a fixed multiple of U and the aspect ratio is constant. One scale
// factor (U, in pixels) reaches the screen; see resolveUnit().
const BOARD_W = 12 // playing area is 12 points wide (6 per half), excludes bar
const BOARD_H = 11 // a 5-high checker stack is 4.5 U, leaving ~2 U down the middle
const BAR = 1 // the bar is about one column wide
const FRAME_X = 1.1 // side frame thickness; must be >= 1 U to fit cube/dice/tray
const FRAME_Y = 0.65 // top/bottom frame thickness
const CHECKER_DIAM = 0.9 // checker diameter as a fraction of a column -> r = 0.45 U
const POINT_H = 4.5 // point triangle height; just taller than a 5-high stack
const CUBE = 0.9
const DIE = 0.9
const OFF_H = 0.2 // off-board checker tray bar height (edge view of a checker)
const OFF_STEP = 0.25 // vertical stride between stacked off-board checkers

// Default scale when the caller passes no scale knob: one point is 40px wide.
const DEFAULT_POINT_WIDTH = 40

const DEFAULT_OPTIONS = {
  // Outer padding around the framed board, in pixels (a constant gap regardless
  // of board scale). Everything else a caller tunes is a color.
  margin: 40,
  frameColor: WALNUT,
  boardBackground: FELT_GREEN,
  oddPoints: BURGUNDY,
  evenPoints: IVORY,
  player1: {
    checkerColor: WHITE
  },
  player2: {
    checkerColor: BLACK
  }
}

// Framed board size in U (the playing area plus the side/top frames), excluding
// the outer margin which is added in pixels. The aspect ratio is constant.
const TOTAL_W = 2 * FRAME_X + BOARD_W + BAR // = 15.2 U
const TOTAL_H = 2 * FRAME_Y + BOARD_H // = 12.3 U

// Resolve the pixel size of one unit U from whichever scale knob the caller
// passed, in precedence order. Scale knobs are optional and not part of
// DEFAULT_OPTIONS; when none is given we fall back to DEFAULT_POINT_WIDTH so the
// zero-config one-liner still has a size. `opts` must already be merged over
// DEFAULT_OPTIONS, since canvasWidth back-solving subtracts the margin.
//   pointWidth  - the unit U itself (most direct)
//   boardWidth  - the whole framed board (frame + bar + playing area), TOTAL_W U
//   canvasWidth - the framed board plus the outer pixel margin on both sides
function resolveUnit (opts) {
  if (opts.pointWidth != null) return opts.pointWidth
  if (opts.boardWidth != null) return opts.boardWidth / TOTAL_W
  if (opts.canvasWidth != null) return (opts.canvasWidth - 2 * opts.margin) / TOTAL_W
  return DEFAULT_POINT_WIDTH
}

// Named preset themes. Each is a partial options object (base colors only) that
// merges over DEFAULT_OPTIONS. The 'Walnut' theme is the default look.
const THEMES = {
  Walnut: {},
  Midnight: {
    frameColor: '#3a3f55',
    boardBackground: '#23263a',
    oddPoints: '#7a6cae',
    evenPoints: '#cfcae0',
    player1: { checkerColor: '#ececf2' },
    player2: { checkerColor: '#3a3d4d' }
  },
  Ocean: {
    frameColor: '#c89b6a',
    boardBackground: '#1f5f7a',
    oddPoints: '#0e7490',
    evenPoints: '#e0d7c0',
    player1: { checkerColor: '#f5f0e6' },
    player2: { checkerColor: '#10243a' }
  },
  Slate: {
    frameColor: '#4a4a4a',
    boardBackground: '#6b6b6b',
    oddPoints: '#2f2f2f',
    evenPoints: '#cfcfcf',
    player1: { checkerColor: '#f0f0f0' },
    player2: { checkerColor: '#222222' }
  }
}

// Merge a partial override (e.g. a theme or caller options) over a base options
// object, one level deep for the player1/player2 sub-objects.
function mergeOptions (base, override) {
  override = override || {}
  return {
    ...base,
    ...override,
    player1: { ...base.player1, ...(override.player1 || {}) },
    player2: { ...base.player2, ...(override.player2 || {}) }
  }
}

function clampChannel (value) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function hexToRgb (hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex (r, g, b) {
  const toHex = (v) => clampChannel(v).toString(16).padStart(2, '0')
  return '#' + toHex(r) + toHex(g) + toHex(b)
}

// Blend a color toward white by `amount` (0..1).
function lighten (hex, amount) {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount)
}

// Blend a color toward black by `amount` (0..1).
function darken (hex, amount) {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount))
}

// Perceived brightness on a 0..1 scale.
function luminance (hex) {
  const [r, g, b] = hexToRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

// Light checkers get a black border for contrast; dark checkers get a
// slightly lighter shade so the border isn't invisible against the dark fill.
function deriveCheckerBorder (checkerColor) {
  return luminance(checkerColor) > 0.5 ? BLACK : lighten(checkerColor, CHECKER_BORDER_LIGHTEN)
}

// Text/pips drawn on a checker or die contrast with it: black on a light
// checker, white on a dark one.
function deriveTextColor (checkerColor) {
  return luminance(checkerColor) > 0.5 ? BLACK : WHITE
}

const STARTING_POSITION = 'XGID=-b----E-C---eE---c-e----B-:0:0:1:21:0:0:3:0:10'

class Point {
  constructor (index, board, opts) {
    this.index = index
    this.board = board
    this.opts = opts

    if (this.index >= 12) { // Points on the far (Player 2) side of the board
      this.startX = this.board.x
      this.xDirection = 1 // left to right
      this.yDirection = 1 // downward
      this.baseLine = this.board.y
      this.textPoint = this.board.y - this.board.unit * 0.15
    } else { // Points on the near (Player 1) side of the board
      this.startX = this.board.x + this.board.width
      this.xDirection = -1 // right to left
      this.yDirection = -1 // upward
      this.baseLine = this.board.y + this.board.height
      this.textPoint = this.board.y + this.board.height + this.board.unit * 0.45
    }
    if (this.index < 6 || this.index > 17) { // Points on the right side of the bar.
      this.startX += this.board.bar
    }

    this.xInit = this.startX + this.xDirection * (this.index % 12) * this.board.width / 12
    this.midpoint = this.xInit + this.xDirection * this.board.width / 24
  }

  draw (ctx) {
    ctx.save()
    const pointGap = 1

    ctx.strokeStyle = BLACK
    ctx.textAlign = 'center'

    const pointHeight = POINT_H * this.board.unit
    const tip = this.baseLine + this.yDirection * pointHeight

    // We start counting at 0, so the "oddPoints" are at index 0, 2, 4, ... but
    // are points 1, 3, 5, ... The darker tip shade is derived from the base
    // point color so the two move together.
    const isOdd = this.index % 2 === 0
    const baseColor = isOdd ? this.opts.oddPoints : this.opts.evenPoints
    const tipColor = darken(baseColor, POINT_TIP_DARKEN)
    const grad = ctx.createLinearGradient(this.midpoint, this.baseLine, this.midpoint, tip)
    grad.addColorStop(0, baseColor)
    grad.addColorStop(1, tipColor)
    ctx.fillStyle = grad

    ctx.beginPath()
    ctx.moveTo(this.xInit + this.xDirection * pointGap / 2, this.baseLine)
    ctx.lineTo(this.midpoint, tip)
    ctx.lineTo(this.xInit + this.xDirection * (this.board.width / 12 - pointGap / 2), this.baseLine)
    ctx.stroke()
    // Back to starting point
    ctx.lineTo(this.xInit + this.xDirection * pointGap / 2, this.baseLine)
    ctx.fill()

    // Label point number. The label sits on the frame, so pick black or white
    // for contrast against the frame color (a dark walnut frame needs white).
    ctx.fillStyle = luminance(this.opts.frameColor) > 0.5 ? BLACK : WHITE
    ctx.fillText(this.index + 1, this.midpoint, this.textPoint)
    ctx.restore()
  }
}

class Diagram {
  constructor (canvas, game, opts) {
    this.canvas = canvas
    if (game == null) {
      game = STARTING_POSITION
    }
    this.game = xgidToGame(game)
    this.ctx = canvas.getContext('2d')

    this.opts = mergeOptions(DEFAULT_OPTIONS, opts)

    // Everything is a fixed multiple of one unit U (a column width). Resolve U
    // to pixels from the caller's scale knob, then derive the rest.
    const unit = this.unit = resolveUnit(this.opts)
    this.radius = (CHECKER_DIAM / 2) * unit

    const margin = this.margin = this.opts.margin // outer padding, in pixels
    const frameThicknessX = this.frameX = FRAME_X * unit
    const frameThicknessY = this.frameY = FRAME_Y * unit
    const bar = BAR * unit

    const canvasWidth = this.canvasWidth = this.canvas.width = TOTAL_W * unit + 2 * margin
    const canvasHeight = this.canvasHeight = this.canvas.height = TOTAL_H * unit + 2 * margin

    this.frame = {
      x: margin,
      y: margin,
      width: canvasWidth - 2 * margin,
      height: canvasHeight - 2 * margin
    }

    this.board = {
      x: margin + frameThicknessX,
      y: margin + frameThicknessY,
      width: BOARD_W * unit,
      height: BOARD_H * unit,
      bar,
      unit
    }

    this.points = []
    for (let point = 0; point < 24; point++) {
      this.points.push(new Point(point, this.board, this.opts))
    }
  }

  draw () {
    this.drawCanvas()
    this.drawFrame()
    this.drawBoard()

    // TODO: Assumes a match, not money game
    this.drawPlayerScores()

    for (let i = 1; i < 25; i++) {
      const numCheckers = this.game.checkerCount[i - 1]
      const player = this.game.players[i - 1] === 1 ? this.opts.player1 : this.opts.player2

      if (numCheckers !== 0) {
        this.drawCheckers(i, numCheckers, player)
      }
    }

    this.drawCheckersOnBar()
    this.drawCube(this.game.cubeOwner, this.game.cube)

    this.drawCheckersOffBoard()

    this.drawDice()
  }

  // Pixels for `k` units. The whole layout is expressed in unit multiples; this
  // keeps draw-time call sites readable.
  u (k) {
    return this.unit * k
  }

  drawCanvas () {
    this.ctx.save()
    this.ctx.lineWidth = this.u(0.125)
    this.ctx.strokeStyle = BLACK // always a black border around the canvas
    this.ctx.beginPath()
    this.ctx.roundRect(0, 0, this.canvas.width, this.canvas.height, this.u(0.2))
    this.ctx.stroke()
    this.ctx.restore()
  }

  makeFrameGradient () {
    const grad = this.ctx.createLinearGradient(
      this.frame.x, this.frame.y,
      this.frame.x, this.frame.y + this.frame.height
    )
    grad.addColorStop(0, lighten(this.opts.frameColor, FRAME_LIGHTEN))
    grad.addColorStop(0.45, this.opts.frameColor)
    grad.addColorStop(1, darken(this.opts.frameColor, FRAME_DARKEN))
    return grad
  }

  drawFrame () {
    this.ctx.save()
    this.ctx.fillStyle = this.makeFrameGradient()
    this.ctx.beginPath()
    this.ctx.roundRect(this.frame.x, this.frame.y, this.frame.width, this.frame.height, this.u(0.2))
    this.ctx.fill()
    this.ctx.lineWidth = this.u(0.025)
    this.ctx.strokeStyle = BLACK
    this.ctx.stroke()
    this.ctx.restore()
  }

  drawBoard () {
    this.ctx.save()
    this.ctx.fillStyle = this.opts.boardBackground
    this.ctx.fillRect(this.board.x, this.board.y, this.board.width + this.board.bar, this.board.height)

    this.ctx.lineWidth = this.u(0.025)

    this.ctx.font = `${this.u(0.45)}px arial`

    this.points.forEach((point) => point.draw(this.ctx))

    // Draw Bar — use the same gradient as the outer frame so it blends in.
    this.ctx.fillStyle = this.makeFrameGradient()
    this.ctx.fillRect(this.board.x + this.board.width / 2, this.board.y, this.board.bar, this.board.height)

    // Draw frame around board to clean up point strokes
    this.ctx.strokeStyle = BLACK
    this.ctx.strokeRect(this.board.x, this.board.y, this.board.width / 2, this.board.height)
    this.ctx.strokeRect(this.board.x + (this.board.width / 2) + this.board.bar, this.board.y, this.board.width / 2, this.board.height)
    this.ctx.restore()
  }

  drawPlayerScores () {
    this.ctx.save()
    const x = this.margin
    this.ctx.fillStyle = BLACK
    this.ctx.font = `${this.u(0.35)}px arial`
    this.ctx.textAlign = 'left'

    // Opponent
    let y = this.margin - this.u(0.2)
    this.ctx.fillText(`Opponent Score: ${this.game.oppScore}/${this.game.duration}`, x, y)

    // Player
    y = this.canvasHeight - this.margin + this.u(0.45)
    this.ctx.fillText(`Player Score: ${this.game.playerScore}/${this.game.duration}`, x, y)
    this.ctx.restore()
  }

  drawSingleChecker (cx, cy, radius, player) {
    const grad = this.ctx.createRadialGradient(
      cx - radius * 0.15, cy - radius * 0.2, radius * 0.05,
      cx, cy, radius
    )
    grad.addColorStop(0, lighten(player.checkerColor, CHECKER_HIGHLIGHT))
    grad.addColorStop(1, darken(player.checkerColor, CHECKER_SHADOW))
    this.ctx.fillStyle = grad
    this.ctx.strokeStyle = deriveCheckerBorder(player.checkerColor)
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
    this.ctx.shadowBlur = 4
    this.ctx.shadowOffsetX = 1
    this.ctx.shadowOffsetY = 2
    this.ctx.beginPath()
    this.ctx.arc(cx, cy, radius, degToRad(0), degToRad(360), false)
    this.ctx.fill()
    this.ctx.shadowColor = 'transparent'
    this.ctx.stroke()
  }

  drawCheckers (pointNum, numCheckers, player) {
    this.ctx.save()
    const radius = this.radius

    this.ctx.textAlign = 'center'

    // Use point-1 since we number points 1-24 but the code expects 0-23.
    const point = this.points[pointNum - 1]

    // Space above the baseline before starting checkers
    const pointPadding = this.u(0.025)
    // Space between checkers on the same point
    const pointSpacing = this.u(0.025)

    const maxCheckersPerPoint = 5

    for (let i = 0; i < Math.min(numCheckers, maxCheckersPerPoint); i++) {
      const cx = point.midpoint
      const cy = point.baseLine + point.yDirection * (pointPadding + pointSpacing * i + (2 * radius * i) + radius)
      this.drawSingleChecker(cx, cy, radius, player)
    }

    if (numCheckers > maxCheckersPerPoint) {
      this.ctx.fillStyle = deriveTextColor(player.checkerColor)
      const x = point.midpoint

      // Place the count label over the outermost checker in the stack.
      let offsets = maxCheckersPerPoint
      if (point.yDirection === -1) {
        offsets--
      }
      const y = point.baseLine + point.yDirection * (((2 * radius + pointSpacing) * offsets)) - (radius - this.u(0.125))

      this.ctx.fillText(numCheckers, x, y)
    }
    this.ctx.restore()
  }

  drawCheckersOnBar () {
    this.ctx.save()
    this.ctx.textAlign = 'center'
    // The two players' barred checkers sit two-thirds and one-third down the bar.
    this.drawBarChecker(this.game.oppBarCheckers, this.board.y + this.board.height * 2 / 3, this.opts.player2)
    this.drawBarChecker(this.game.playerBarCheckers, this.board.y + this.board.height / 3, this.opts.player1)
    this.ctx.restore()
  }

  drawBarChecker (count, cy, player) {
    if (count <= 0) return
    const cx = this.board.x + this.board.width / 2 + this.board.bar / 2
    this.drawSingleChecker(cx, cy, this.radius, player)
    if (count > 1) {
      this.ctx.fillStyle = deriveTextColor(player.checkerColor)
      this.ctx.fillText(count, cx, cy + (this.radius - this.u(0.3)))
    }
  }

  drawCube (owner, value) {
    this.ctx.save()
    const cubeSize = CUBE * this.unit
    const railOffset = (this.frameX - cubeSize) / 2

    const x = this.margin + railOffset

    let y

    // An unturned (centered) cube shows 64 by convention, not its value of 1.
    if (value === 1) {
      value = 64
    }

    if (owner === 0) {
      y = (this.canvasHeight - cubeSize) / 2
    } else if (owner === -1) {
      y = this.margin + this.frameY
    } else {
      y = this.canvasHeight - this.margin - this.frameY - cubeSize
    }

    this.ctx.fillStyle = WHITE
    this.ctx.strokeStyle = BLACK
    // A heavier border than the dice (1px) keeps the cube visually distinct.
    this.ctx.lineWidth = this.u(0.07)
    this.ctx.textAlign = 'center'

    this.ctx.beginPath()
    this.ctx.roundRect(x, y, cubeSize, cubeSize, this.u(0.15))
    this.ctx.fill()
    this.ctx.stroke()

    this.ctx.fillStyle = BLACK
    this.ctx.font = `bold ${this.u(0.45)}px arial`

    this.ctx.fillText(value, (x + cubeSize / 2), y + cubeSize / 2 + this.u(0.125))
    this.ctx.restore()
  }

  drawDice () {
    this.ctx.save()
    const roll = this.game.roll
    if (roll == null || roll.length !== 2) {
      this.ctx.restore()
      return
    }

    // Dice take the active player's colors: player1 (white die, black pips) or
    // player2 (black die, white pips).
    const isPlayer = this.game.turn === '1'
    const colors = isPlayer ? this.opts.player1 : this.opts.player2
    const dieColor = colors.checkerColor
    const pipColor = deriveTextColor(dieColor)

    const dieSize = DIE * this.unit

    if (roll === '00') {
      // Cube decision: the player is on roll but hasn't rolled yet. Show two
      // dice (each a 1) stacked on the frame. Always use the right rail (the
      // left rail holds the cube), centered vertically so the dice stay clear
      // of the off-board checkers, which stack from the top and bottom ends.
      // The die color still indicates whose decision it is.
      const gap = this.u(0.2)
      const railX = this.canvasWidth - this.margin -
        this.frameX + (this.frameX - dieSize) / 2
      const topY = (this.canvasHeight - (2 * dieSize + gap)) / 2

      drawDie(this.ctx, railX, topY, dieSize, 1, dieColor, pipColor)
      drawDie(this.ctx, railX, topY + dieSize + gap, dieSize, 1, dieColor, pipColor)
      this.ctx.restore()
      return
    }

    const d1 = parseInt(roll[0], 10)
    const d2 = parseInt(roll[1], 10)
    if (Number.isNaN(d1) || Number.isNaN(d2)) {
      this.ctx.restore()
      return
    }

    // Actual roll: two dice side by side, vertically centered, in the active
    // player's right half of the board. Players face each other, so the player
    // (bottom) rolls in the screen-right half and the opponent (top) in the
    // screen-left half.
    const halfCenterX = isPlayer
      ? this.board.x + this.board.width / 2 + this.board.bar + this.board.width / 4
      : this.board.x + this.board.width / 4
    const y = this.board.y + this.board.height / 2 - dieSize / 2
    const gap = this.u(0.3)

    drawDie(this.ctx, halfCenterX - dieSize - gap / 2, y, dieSize, d1, dieColor, pipColor)
    drawDie(this.ctx, halfCenterX + gap / 2, y, dieSize, d2, dieColor, pipColor)
    this.ctx.restore()
  }

  drawCheckersOffBoard () {
    this.ctx.save()
    this.ctx.strokeStyle = BLACK
    // The opponent's tray stacks down from the top frame; the player's stacks up
    // from the bottom frame.
    this.drawOffBoardStack(this.game.opponentOffCheckers, this.margin + this.frameY, 1, this.opts.player2.checkerColor)
    this.drawOffBoardStack(this.game.playerOffCheckers, this.canvasHeight - this.margin - this.frameY - OFF_H * this.unit, -1, this.opts.player1.checkerColor)
    this.ctx.restore()
  }

  // Draw `count` borne-off checkers as a stack of edge-on bars, starting at
  // `startY` and stepping by `dir` (1 = down from the top, -1 = up from the
  // bottom), with a small extra gap after every 5.
  drawOffBoardStack (count, startY, dir, color) {
    const width = CHECKER_DIAM * this.unit
    const height = OFF_H * this.unit
    const step = OFF_STEP * this.unit
    const groupGap = this.u(0.125)
    const cornerRadius = this.u(0.075)
    const x = this.canvasWidth - this.margin - (this.frameX + width) / 2

    this.ctx.fillStyle = color
    let y = startY
    for (let i = 0; i < count; i++) {
      this.ctx.beginPath()
      this.ctx.roundRect(x, y, width, height, cornerRadius)
      this.ctx.fill()
      this.ctx.stroke()
      y += dir * step
      if (i % 5 === 4) {
        y += dir * groupGap
      }
    }
  }
}

// A reusable style: merge options (a theme and/or scale knobs) once, then draw
// many diagrams that share it. Drawing a single board needs no BoardStyle — that
// path stays the one-liner `new Diagram(canvas, 'XGID=…').draw()`.
class BoardStyle {
  constructor (opts) {
    this.opts = mergeOptions(DEFAULT_OPTIONS, opts)
  }

  draw (canvas, game) {
    return new Diagram(canvas, game, this.opts).draw()
  }
}

function degToRad (degrees) {
  return degrees * Math.PI / 180
}

function drawDie (ctx, x, y, size, value, dieColor, pipColor) {
  ctx.save()
  const radius = size * 0.15

  ctx.fillStyle = dieColor
  ctx.strokeStyle = BLACK
  ctx.lineWidth = 1

  ctx.beginPath()
  ctx.roundRect(x, y, size, size, radius)
  ctx.fill()
  ctx.stroke()

  // Pip centers on a 3x3 grid.
  const left = x + size * 0.25
  const midX = x + size * 0.5
  const right = x + size * 0.75
  const top = y + size * 0.25
  const midY = y + size * 0.5
  const bottom = y + size * 0.75

  // Pip positions for each die value.
  const pips = {
    1: [[midX, midY]],
    2: [[left, top], [right, bottom]],
    3: [[left, top], [midX, midY], [right, bottom]],
    4: [[left, top], [right, top], [left, bottom], [right, bottom]],
    5: [[left, top], [right, top], [midX, midY], [left, bottom], [right, bottom]],
    6: [[left, top], [right, top], [left, midY], [right, midY], [left, bottom], [right, bottom]]
  }[value] || []

  const pipRadius = size * 0.1
  ctx.fillStyle = pipColor
  pips.forEach(([px, py]) => {
    ctx.beginPath()
    ctx.arc(px, py, pipRadius, degToRad(0), degToRad(360), false)
    ctx.fill()
  })
  ctx.restore()
}

function charToCount (char) {
  if (char === '-'.charCodeAt(0)) {
    return 0
  }
  const count = (char - 'A'.charCodeAt(0)) % 32 + 1
  return count
}

function xgidToGame (xgid) {
  const regex = /(XGID=)?([-A-Oa-o]{26}):(\d+):(-?[01]):(-?1):([0-6][0-6]):(\d+):(\d+):([0-3]):(\d+):(\d+)/
  const match = xgid.match(regex)
  if (match === null) {
    throw new Error(`invalid XGID: ${xgid}`)
  }

  const checkers = match[2]
  const cube = 2 ** match[3]
  const cubeOwner = match[4]
  // Check that if cube = 1, owner is 0
  const turn = match[5]
  const roll = match[6]
  const playerScore = match[7]
  const oppScore = match[8]
  const gameOptions = match[9]
  const matchDuration = match[10]
  const maxCube = match[11]

  const checkerCount = []
  const player = []

  let playerOffCheckers = 15
  let oppOffCheckers = 15

  for (let i = 1; i < 25; i++) {
    const char = checkers.charCodeAt(i)
    const count = charToCount(char)
    checkerCount.push(count)
    if (char === '-'.charCodeAt(0)) {
      player.push(0)
    } else if (char < 'Z'.charCodeAt(0)) {
      player.push(1)
      playerOffCheckers -= count
    } else if (char >= 'a'.charCodeAt(0)) {
      player.push(-1)
      oppOffCheckers -= count
    } else {
      console.log('Unknown character: ' + char)
    }
  }

  const playerBarCheckers = charToCount(checkers.charCodeAt(25))
  const oppBarCheckers = charToCount(checkers.charCodeAt(0))

  playerOffCheckers -= playerBarCheckers
  oppOffCheckers -= oppBarCheckers

  return {
    checkerCount,
    players: player,
    playerBarCheckers,
    oppBarCheckers,
    cube,
    cubeOwner,
    playerOffCheckers,
    opponentOffCheckers: oppOffCheckers,
    playerScore,
    oppScore,
    duration: matchDuration,
    turn,
    roll,
    gameOptions,
    maxCube
  }
}

// Dev-only: expose pure helpers for node:test. Guarded so the browser-global
// path (bare <script> usage) is unaffected.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Diagram,
    BoardStyle,
    mergeOptions,
    resolveUnit,
    clampChannel,
    hexToRgb,
    rgbToHex,
    lighten,
    darken,
    luminance,
    deriveCheckerBorder,
    deriveTextColor,
    charToCount,
    xgidToGame,
    DEFAULT_OPTIONS,
    DEFAULT_POINT_WIDTH,
    BOARD_W,
    BOARD_H,
    BAR,
    FRAME_X,
    FRAME_Y,
    CHECKER_DIAM,
    TOTAL_W,
    TOTAL_H,
    THEMES,
    STARTING_POSITION
  }
}
