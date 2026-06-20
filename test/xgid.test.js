// SPDX-FileCopyrightText: Greg Back <git@gregback.net>
// SPDX-License-Identifier: MIT

const test = require('node:test')
const assert = require('node:assert/strict')

const { charToCount, xgidToGame, STARTING_POSITION } = require('../board.js')

test('charToCount maps position characters to checker counts', () => {
  const code = (c) => c.charCodeAt(0)
  assert.equal(charToCount(code('-')), 0)
  assert.equal(charToCount(code('A')), 1)
  assert.equal(charToCount(code('B')), 2)
  assert.equal(charToCount(code('E')), 5)
  // Lowercase (opponent) letters wrap back to a 1-based count.
  assert.equal(charToCount(code('a')), 1)
})

test('xgidToGame parses the standard starting position', () => {
  const game = xgidToGame(STARTING_POSITION)

  assert.equal(game.checkerCount.length, 24)

  // Cube: centered, value 1 (2 ** 0).
  assert.equal(game.cube, 1)
  assert.equal(game.cubeOwner, '0')

  // Match metadata.
  assert.equal(game.turn, '1')
  assert.equal(game.roll, '21')
  assert.equal(game.playerScore, '0')
  assert.equal(game.oppScore, '0')
  assert.equal(game.duration, '0')

  // All 15 checkers per side are on the board.
  assert.equal(game.playerOffCheckers, 0)
  assert.equal(game.opponentOffCheckers, 0)
  assert.equal(game.playerBarCheckers, 0)
  assert.equal(game.oppBarCheckers, 0)
})

test('xgidToGame reads bar and off-board counts', () => {
  // Opponent has 2 on the bar (index 0 = 'b'), player has 3 on the bar
  // (index 25 = 'C'); all 24 points are empty.
  const xgid = 'XGID=b------------------------C:0:0:1:00:0:0:0:0:0'
  const game = xgidToGame(xgid)

  assert.equal(game.oppBarCheckers, 2)
  assert.equal(game.playerBarCheckers, 3)
  // 15 total minus the checkers accounted for on the bar.
  assert.equal(game.opponentOffCheckers, 13)
  assert.equal(game.playerOffCheckers, 12)
})

test('xgidToGame counts an all-borne-off position', () => {
  // No checkers anywhere on the board or bar.
  const xgid = 'XGID=--------------------------:0:0:1:00:0:0:0:0:0'
  const game = xgidToGame(xgid)

  assert.equal(game.playerOffCheckers, 15)
  assert.equal(game.opponentOffCheckers, 15)
})

test('xgidToGame reads the cube value and owner', () => {
  // Cube exponent 2 (value 4), owned by the player (1).
  const xgid = 'XGID=--------------------------:2:1:1:00:0:0:0:0:0'
  const game = xgidToGame(xgid)

  assert.equal(game.cube, 4)
  assert.equal(game.cubeOwner, '1')
})

test('xgidToGame rejects invalid input', () => {
  assert.throws(() => xgidToGame('not an xgid'))
})
