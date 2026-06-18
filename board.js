// SPDX-FileCopyrightText: Greg Back <git@gregback.net>
// SPDX-License-Identifier: MIT

const BLACK = 'rgb(0, 0, 0)'
const GRAY = 'rgb(60, 60, 60)'
const WHITE = 'rgb(255, 255, 255)'
const WALNUT = 'rgb(90, 55, 35)'
const WALNUT_LIGHT = 'rgb(105, 68, 48)'
const WALNUT_DARK = 'rgb(70, 42, 26)'
const BURGUNDY = 'rgb(180, 40, 40)'
const IVORY = 'rgb(235, 215, 175)'
const FELT_GREEN = 'rgb(34, 100, 52)'

const DEFAULT_OPTIONS = {
  canvasWidth: 690,
  canvasHeight: 560,
  canvasMargin: 40,
  frameThicknessX: 50,
  frameThicknessY: 25,
  barThickness: 40,
  frameColor: WALNUT,
  boardBackground: FELT_GREEN,
  oddPoints: BURGUNDY,
  evenPoints: IVORY,
  player1: {
    checkerColor: WHITE,
    checkerBorder: BLACK,
    textColor: BLACK,
    checkerHighlight: '#ffffff',
    checkerShadow: '#d0d0d0'
  },
  player2: {
    checkerColor: BLACK,
    checkerBorder: GRAY,
    textColor: WHITE,
    checkerHighlight: '#3d3d3d',
    checkerShadow: '#1a1a1a'
  }
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
      this.textPoint = this.board.y - 6
    } else { // Points on the near (Player 1) side of the board
      this.startX = this.board.x + this.board.width
      this.xDirection = -1 // right to left
      this.yDirection = -1 // upward
      this.baseLine = this.board.y + this.board.height
      this.textPoint = this.board.y + this.board.height + 18
    }
    if (this.index < 6 || this.index > 17) { // Points on the right side of the bar.
      this.startX += this.opts.barThickness
    }

    this.xInit = this.startX + this.xDirection * (this.index % 12) * this.board.width / 12
    this.midpoint = this.xInit + this.xDirection * this.board.width / 24
  }

  draw (ctx) {
    ctx.save()
    const pointGap = 1

    // We start counting at 0, so the "oddPoints" are at index 0, 2, 4, ... but
    // are points 1, 3, 5, ...
    ctx.fillStyle = this.index % 2 === 0 ? this.opts.oddPoints : this.opts.evenPoints
    // The stroke style is the opposite of the fill style
    // ctx.strokeStyle = this.index % 2 === 0 ? this.opts.evenPoints : this.opts.oddPoints;
    ctx.strokeStyle = BLACK
    ctx.textAlign = 'center'

    const pointHeight = this.board.height * 0.45
    const tip = this.baseLine + this.yDirection * pointHeight

    const isOdd = this.index % 2 === 0
    const baseColor = isOdd ? BURGUNDY : IVORY
    const tipColor = isOdd ? 'rgb(110, 20, 20)' : 'rgb(175, 155, 115)'
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

    // Label point number (always black, not configurable)
    ctx.fillStyle = BLACK
    ctx.fillText(this.index + 1, this.midpoint, this.textPoint)
    ctx.restore()
  }
};

class Diagram {
  constructor (canvas, game) {
    this.canvas = canvas
    if (game == null) {
      game = STARTING_POSITION
    }
    this.game = xgidToGame(game)
    this.ctx = canvas.getContext('2d')

    this.opts = DEFAULT_OPTIONS

    const canvasWidth = this.canvas.width = this.opts.canvasWidth
    const canvasHeight = this.canvas.height = this.opts.canvasHeight

    const canvasMargin = this.opts.canvasMargin

    const frameX = canvasMargin
    const frameY = canvasMargin

    const frameWidth = canvasWidth - 2 * canvasMargin
    const frameHeight = canvasHeight - 2 * canvasMargin

    this.frame = {
      x: frameX,
      y: frameY,
      width: frameWidth,
      height: frameHeight
    }

    const boardX = frameX + this.opts.frameThicknessX
    const boardY = frameY + this.opts.frameThicknessY

    const boardWidth = frameWidth - 2 * this.opts.frameThicknessX - this.opts.barThickness
    const boardHeight = frameHeight - 2 * this.opts.frameThicknessY

    this.board = {
      x: boardX,
      y: boardY,
      width: boardWidth,
      height: boardHeight
    }

    this.points = []
    for (let point = 0; point < 24; point++) {
      this.points.push(new Point(point, this.board, this.opts))
    }

    this.radius = this.board.width / 25
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

  drawCanvas () {
    this.ctx.save()
    this.ctx.lineWidth = 5
    this.ctx.strokeStyle = BLACK // always a black border around the canvas
    this.ctx.beginPath()
    this.ctx.roundRect(0, 0, this.canvas.width, this.canvas.height, 8)
    this.ctx.stroke()
    this.ctx.restore()
  }

  drawFrame () {
    this.ctx.save()
    const grad = this.ctx.createLinearGradient(
      this.frame.x, this.frame.y,
      this.frame.x, this.frame.y + this.frame.height
    )
    grad.addColorStop(0, WALNUT_LIGHT)
    grad.addColorStop(0.45, WALNUT)
    grad.addColorStop(1, WALNUT_DARK)
    this.ctx.fillStyle = grad
    this.ctx.beginPath()
    this.ctx.roundRect(this.frame.x, this.frame.y, this.frame.width, this.frame.height, 8)
    this.ctx.fill()
    this.ctx.lineWidth = 1
    this.ctx.strokeStyle = BLACK
    this.ctx.stroke()
    this.ctx.restore()
  }

  drawBoard () {
    this.ctx.save()
    this.ctx.fillStyle = this.opts.boardBackground
    this.ctx.fillRect(this.board.x, this.board.y, this.board.width + this.opts.barThickness, this.board.height)

    this.ctx.lineWidth = 1

    this.ctx.font = '18px arial'

    this.points.forEach((point) => point.draw(this.ctx))

    // Draw Bar
    this.ctx.fillStyle = this.opts.frameColor
    this.ctx.fillRect(this.board.x + this.board.width / 2, this.board.y, this.opts.barThickness, this.board.height)

    // Draw frame around board to clean up point strokes
    this.ctx.strokeStyle = BLACK
    this.ctx.strokeRect(this.board.x, this.board.y, this.board.width / 2, this.board.height)
    this.ctx.strokeRect(this.board.x + (this.board.width / 2) + this.opts.barThickness, this.board.y, this.board.width / 2, this.board.height)
    this.ctx.restore()
  }

  drawPlayerScores () {
    this.ctx.save()
    const x = this.opts.canvasMargin
    this.ctx.fillStyle = BLACK

    this.ctx.textAlign = 'left'

    // Opponent
    let y = this.opts.canvasMargin - 8
    this.ctx.fillText(`Opponent Score: ${this.game.oppScore}/${this.game.duration}`, x, y)

    // Player
    y = this.opts.canvasHeight - this.opts.canvasMargin + 18
    this.ctx.fillText(`Player Score: ${this.game.playerScore}/${this.game.duration}`, x, y)
    this.ctx.restore()
  }

  drawCheckers (pointNum, numCheckers, player) {
    this.ctx.save()
    const radius = this.radius

    this.ctx.textAlign = 'center'

    this.ctx.fillStyle = player.checkerColor
    this.ctx.strokeStyle = player.checkerBorder
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
    this.ctx.shadowBlur = 4
    this.ctx.shadowOffsetX = 1
    this.ctx.shadowOffsetY = 2

    // Use point-1 since we number points 1-24 but the code expects 0-23.
    const point = this.points[pointNum - 1]

    // Space above the baseline before starting checkers
    const pointPadding = 1
    // Space between checkers on the same point
    const pointSpacing = 1

    const maxCheckersPerPoint = 5

    for (let i = 0; i < Math.min(numCheckers, maxCheckersPerPoint); i++) {
      const cx = point.midpoint
      const cy = point.baseLine + point.yDirection * (pointPadding + pointSpacing * i + (2 * radius * i) + radius)
      const grad = this.ctx.createRadialGradient(
        cx - radius * 0.15, cy - radius * 0.2, radius * 0.05,
        cx, cy, radius
      )
      grad.addColorStop(0, player.checkerHighlight)
      grad.addColorStop(1, player.checkerShadow)
      this.ctx.fillStyle = grad
      this.ctx.beginPath()
      this.ctx.arc(cx, cy, radius, degToRad(0), degToRad(360), false)
      this.ctx.fill()
      this.ctx.shadowColor = 'transparent'
      this.ctx.stroke()
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
    }

    if (numCheckers > maxCheckersPerPoint) {
      this.ctx.fillStyle = player.textColor
      const x = point.midpoint

      // TODO: calculate this better
      let offsets = maxCheckersPerPoint
      if (point.yDirection === -1) {
        offsets--
      }
      const y = point.baseLine + point.yDirection * (((2 * radius + pointSpacing) * offsets)) - (radius - 5)

      this.ctx.fillText(numCheckers, x, y)
    }
    this.ctx.restore()
  }

  drawCheckersOnBar () {
    this.ctx.save()
    const barCenter = this.opts.canvasMargin + this.opts.frameThicknessX + (this.board.width / 2) + this.opts.barThickness / 2

    this.ctx.textAlign = 'center'
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
    this.ctx.shadowBlur = 4
    this.ctx.shadowOffsetX = 1
    this.ctx.shadowOffsetY = 2

    if (this.game.oppBarCheckers > 0) {
      const cx = barCenter
      const cy = this.board.y + (this.board.height * 2 / 3)
      const player = this.opts.player2
      const grad = this.ctx.createRadialGradient(
        cx - this.radius * 0.15, cy - this.radius * 0.2, this.radius * 0.05,
        cx, cy, this.radius
      )
      grad.addColorStop(0, player.checkerHighlight)
      grad.addColorStop(1, player.checkerShadow)
      this.ctx.fillStyle = grad
      this.ctx.beginPath()
      this.ctx.arc(cx, cy, this.radius, degToRad(0), degToRad(360), false)
      this.ctx.fill()
      this.ctx.shadowColor = 'transparent'
      this.ctx.stroke()
      if (this.game.oppBarCheckers > 1) {
        this.ctx.fillStyle = player.textColor
        this.ctx.fillText(this.game.oppBarCheckers, cx, cy + (this.radius - 12))
      }
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
    }

    if (this.game.playerBarCheckers > 0) {
      const cx = barCenter
      const cy = this.board.y + (this.board.height / 3)
      const player = this.opts.player1
      const grad = this.ctx.createRadialGradient(
        cx - this.radius * 0.15, cy - this.radius * 0.2, this.radius * 0.05,
        cx, cy, this.radius
      )
      grad.addColorStop(0, player.checkerHighlight)
      grad.addColorStop(1, player.checkerShadow)
      this.ctx.fillStyle = grad
      this.ctx.beginPath()
      this.ctx.arc(cx, cy, this.radius, degToRad(0), degToRad(360), false)
      this.ctx.fill()
      this.ctx.shadowColor = 'transparent'
      this.ctx.stroke()
      if (this.game.playerBarCheckers > 1) {
        this.ctx.fillStyle = player.textColor
        this.ctx.fillText(this.game.playerBarCheckers, cx, cy + (this.radius - 12))
      }
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
    }
    this.ctx.restore()
  }

  drawCube (owner, value) {
  // Owner should be:
  // - 0 for a centered cube
  // - 1 if the cube is owned by the player
  // - -1 if the cube is owned by the opponent
    this.ctx.save()
    const cubeSize = 40
    const margin = (this.opts.frameThicknessX - cubeSize) / 2

    const x = this.opts.canvasMargin + margin

    let y

    if (value === 1) {
      value = 64
    }

    if (owner === 0) {
      y = (this.opts.canvasHeight - cubeSize) / 2
    } else if (owner === -1) {
      y = this.opts.canvasMargin + this.opts.frameThicknessY
    } else {
      y = this.opts.canvasHeight - this.opts.canvasMargin - this.opts.frameThicknessY - cubeSize
    }

    this.ctx.fillStyle = WHITE
    this.ctx.strokeStyle = BLACK
    this.ctx.textAlign = 'center'

    this.ctx.beginPath()
    this.ctx.roundRect(x, y, cubeSize, cubeSize, 6)
    this.ctx.fill()
    this.ctx.stroke()

    this.ctx.fillStyle = BLACK

    this.ctx.fillText(value, (x + cubeSize / 2), y + cubeSize / 2 + 5)
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
    const pipColor = colors.textColor

    const dieSize = 36

    if (roll === '00') {
      // Cube decision: the player is on roll but hasn't rolled yet. Show two
      // dice (each a 1) stacked on the frame. Always use the right rail (the
      // left rail holds the cube), centered vertically so the dice stay clear
      // of the off-board checkers, which stack from the top and bottom ends.
      // The die color still indicates whose decision it is.
      const gap = 8
      const railX = this.opts.canvasWidth - this.opts.canvasMargin -
        this.opts.frameThicknessX + (this.opts.frameThicknessX - dieSize) / 2
      const topY = (this.opts.canvasHeight - (2 * dieSize + gap)) / 2

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
      ? this.board.x + this.board.width / 2 + this.opts.barThickness + this.board.width / 4
      : this.board.x + this.board.width / 4
    const y = this.board.y + this.board.height / 2 - dieSize / 2
    const gap = 12

    drawDie(this.ctx, halfCenterX - dieSize - gap / 2, y, dieSize, d1, dieColor, pipColor)
    drawDie(this.ctx, halfCenterX + gap / 2, y, dieSize, d2, dieColor, pipColor)
    this.ctx.restore()
  }

  drawCheckersOffBoard () {
    this.ctx.save()
    const offCheckerX = 40 // todo: should be radius / 2
    const offCheckerY = 8

    this.ctx.strokeStyle = BLACK

    const x = this.opts.canvasWidth - this.opts.canvasMargin - (this.opts.frameThicknessX + offCheckerX) / 2

    // Opponent
    let y = this.opts.canvasMargin + this.opts.frameThicknessY

    this.ctx.fillStyle = this.opts.player2.checkerColor

    for (let i = 0; i < this.game.opponentOffCheckers; i++) {
      this.ctx.beginPath()
      this.ctx.roundRect(x, y, offCheckerX, offCheckerY, 3)
      this.ctx.fill()
      this.ctx.stroke()
      y = y + 10
      // Add extra space between every 5 checkers
      if (i % 5 === 4) {
        y = y + 5
      }
    }

    // Player
    y = this.opts.canvasHeight - this.opts.canvasMargin - this.opts.frameThicknessY - offCheckerY
    this.ctx.fillStyle = this.opts.player1.checkerColor

    for (let i = 0; i < this.game.playerOffCheckers; i++) {
      this.ctx.beginPath()
      this.ctx.roundRect(x, y, offCheckerX, offCheckerY, 3)
      this.ctx.fill()
      this.ctx.stroke()
      y = y - 10
      // Add extra space between every 5 checkers
      if (i % 5 === 4) {
        y = y - 5
      }
    }
    this.ctx.restore()
  }
}

function degToRad (degrees) {
  return degrees * Math.PI / 180
};

// Draw a single die at top-left (x, y) of side `size`, showing `value` (1-6).
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
};

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
    // TODO
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
