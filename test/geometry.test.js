// SPDX-FileCopyrightText: Greg Back <git@gregback.net>
// SPDX-License-Identifier: MIT

const test = require('node:test')
const assert = require('node:assert/strict')

const {
  mergeOptions,
  resolveUnit,
  totalWidth,
  totalHeight,
  BoardStyle,
  DEFAULT_OPTIONS,
  DEFAULT_POINT_WIDTH,
  BOARD_W,
  CHECKER_DIAM,
  THEMES
} = require('../board.js')

// resolveUnit expects options already merged over the defaults (it reads the
// chrome amounts to back-solve canvasWidth).
const merged = (override) => mergeOptions(DEFAULT_OPTIONS, override)
const close = (a, b) => Math.abs(a - b) < 1e-9

test('totalWidth/totalHeight describe the constant aspect ratio', () => {
  // Default chrome: margin 1, frameX 1.1, frameY 0.65.
  assert.ok(close(totalWidth(DEFAULT_OPTIONS), 17.2)) // 2*1 + 2*1.1 + 12 + 1
  assert.ok(close(totalHeight(DEFAULT_OPTIONS), 14.3)) // 2*1 + 2*0.65 + 11
})

test('resolveUnit falls back to the default point width', () => {
  assert.equal(resolveUnit(merged({})), DEFAULT_POINT_WIDTH)
  assert.equal(DEFAULT_POINT_WIDTH, 40)
})

test('resolveUnit back-solves U from each scale knob', () => {
  // pointWidth is the unit itself.
  assert.equal(resolveUnit(merged({ pointWidth: 50 })), 50)
  // boardWidth / BOARD_W.
  assert.equal(resolveUnit(merged({ boardWidth: 12 * 30 })), 30)
  assert.ok(close(resolveUnit(merged({ boardWidth: 480 })), 480 / BOARD_W))
  // checkerRadius / (CHECKER_DIAM / 2): radius 18 -> U 40 at default ratios.
  assert.ok(close(resolveUnit(merged({ checkerRadius: 18 })), 18 / (CHECKER_DIAM / 2)))
  assert.equal(resolveUnit(merged({ checkerRadius: CHECKER_DIAM / 2 * 40 })), 40)
  // canvasWidth / totalWidth, using the merged chrome amounts.
  const tw = totalWidth(DEFAULT_OPTIONS)
  assert.ok(close(resolveUnit(merged({ canvasWidth: tw * 40 })), 40))
})

test('resolveUnit precedence: checkerRadius > pointWidth > boardWidth > canvasWidth', () => {
  const tw = totalWidth(DEFAULT_OPTIONS)
  const all = merged({
    checkerRadius: CHECKER_DIAM / 2 * 11, // -> U 11
    pointWidth: 22,
    boardWidth: 12 * 33,
    canvasWidth: tw * 44
  })
  assert.equal(resolveUnit(all), 11)

  assert.equal(resolveUnit(merged({ pointWidth: 22, boardWidth: 12 * 33 })), 22)
  assert.equal(resolveUnit(merged({ boardWidth: 12 * 33, canvasWidth: tw * 44 })), 33)
})

test('default scale yields r = 18 and a 688x572 canvas', () => {
  const U = resolveUnit(merged({}))
  assert.equal(U, 40)
  assert.equal((CHECKER_DIAM / 2) * U, 18) // checker radius
  assert.ok(close(totalWidth(DEFAULT_OPTIONS) * U, 688))
  assert.ok(close(totalHeight(DEFAULT_OPTIONS) * U, 572))
})

test('BoardStyle merges options once over the defaults', () => {
  const style = new BoardStyle(THEMES.Ocean)
  assert.equal(style.opts.frameColor, THEMES.Ocean.frameColor)
  assert.equal(style.opts.player1.checkerColor, THEMES.Ocean.player1.checkerColor)
  // Unspecified keys fall back to the defaults.
  assert.equal(style.opts.margin, DEFAULT_OPTIONS.margin)
})

test('a THEMES preset round-trips through mergeOptions', () => {
  const opts = mergeOptions(DEFAULT_OPTIONS, THEMES.Midnight)
  assert.equal(opts.frameColor, THEMES.Midnight.frameColor)
  assert.equal(opts.oddPoints, THEMES.Midnight.oddPoints)
  assert.equal(opts.player2.textColor, THEMES.Midnight.player2.textColor)
})
