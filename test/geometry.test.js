// SPDX-FileCopyrightText: Greg Back <git@gregback.net>
// SPDX-License-Identifier: MIT

const test = require('node:test')
const assert = require('node:assert/strict')

const {
  mergeOptions,
  resolveUnit,
  deriveTextColor,
  BoardStyle,
  DEFAULT_OPTIONS,
  DEFAULT_POINT_WIDTH,
  BOARD_W,
  CHECKER_DIAM,
  TOTAL_W,
  TOTAL_H,
  THEMES
} = require('../board.js')

// resolveUnit expects options already merged over the defaults (it reads the
// pixel margin to back-solve canvasWidth).
const merged = (override) => mergeOptions(DEFAULT_OPTIONS, override)
const close = (a, b) => Math.abs(a - b) < 1e-9

// Default outer margin, in pixels.
const M = DEFAULT_OPTIONS.margin

test('TOTAL_W/TOTAL_H describe the constant framed-board aspect ratio', () => {
  assert.ok(close(TOTAL_W, 15.2)) // 2*1.1 + 12 + 1
  assert.ok(close(TOTAL_H, 12.3)) // 2*0.65 + 11
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
  // canvasWidth: the outer margin is pixels, so it is subtracted before
  // dividing the remaining framed-board width by TOTAL_W.
  assert.ok(close(resolveUnit(merged({ canvasWidth: TOTAL_W * 40 + 2 * M })), 40))
})

test('resolveUnit precedence: checkerRadius > pointWidth > boardWidth > canvasWidth', () => {
  const all = merged({
    checkerRadius: CHECKER_DIAM / 2 * 11, // -> U 11
    pointWidth: 22,
    boardWidth: 12 * 33,
    canvasWidth: TOTAL_W * 44 + 2 * M
  })
  assert.equal(resolveUnit(all), 11)

  assert.equal(resolveUnit(merged({ pointWidth: 22, boardWidth: 12 * 33 })), 22)
  assert.equal(resolveUnit(merged({ boardWidth: 12 * 33, canvasWidth: TOTAL_W * 44 + 2 * M })), 33)
})

test('default scale yields r = 18 and a 688x572 canvas', () => {
  const U = resolveUnit(merged({}))
  assert.equal(U, 40)
  assert.equal((CHECKER_DIAM / 2) * U, 18) // checker radius
  // Canvas = framed board (in U) plus the pixel margin on each side.
  assert.ok(close(TOTAL_W * U + 2 * M, 688))
  assert.ok(close(TOTAL_H * U + 2 * M, 572))
})

test('deriveTextColor contrasts with the checker', () => {
  assert.equal(deriveTextColor('#ffffff'), '#000000') // light checker -> black text
  assert.equal(deriveTextColor('#000000'), '#ffffff') // dark checker -> white text
  assert.equal(deriveTextColor('#10243a'), '#ffffff') // dark Ocean checker
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
  assert.equal(opts.player2.checkerColor, THEMES.Midnight.player2.checkerColor)
})
