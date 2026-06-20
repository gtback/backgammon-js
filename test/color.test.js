// SPDX-FileCopyrightText: Greg Back <git@gregback.net>
// SPDX-License-Identifier: MIT

const test = require('node:test')
const assert = require('node:assert/strict')

const {
  hexToRgb,
  rgbToHex,
  lighten,
  darken,
  luminance,
  deriveCheckerBorder
} = require('../board.js')

test('hexToRgb splits a hex color into channels', () => {
  assert.deepEqual(hexToRgb('#ffffff'), [255, 255, 255])
  assert.deepEqual(hexToRgb('#000000'), [0, 0, 0])
  assert.deepEqual(hexToRgb('#5a3723'), [90, 55, 35])
})

test('rgbToHex round-trips with hexToRgb', () => {
  for (const hex of ['#ffffff', '#000000', '#5a3723', '#b42828']) {
    assert.equal(rgbToHex(...hexToRgb(hex)), hex)
  }
})

test('rgbToHex clamps out-of-range channels and rounds', () => {
  assert.equal(rgbToHex(300, -5, 128), '#ff0080')
  assert.equal(rgbToHex(0.4, 1.6, 255.9), '#0002ff')
})

test('lighten blends toward white', () => {
  assert.equal(lighten('#000000', 1), '#ffffff')
  assert.equal(lighten('#5a3723', 0), '#5a3723')
  assert.equal(lighten('#ffffff', 0.5), '#ffffff')
})

test('darken blends toward black', () => {
  assert.equal(darken('#ffffff', 1), '#000000')
  assert.equal(darken('#5a3723', 0), '#5a3723')
  assert.equal(darken('#000000', 0.5), '#000000')
})

test('luminance ranges from 0 (black) to 1 (white)', () => {
  assert.equal(luminance('#ffffff'), 1)
  assert.equal(luminance('#000000'), 0)
  assert.ok(luminance('#ebd7af') > luminance('#5a3723'))
})

test('deriveCheckerBorder picks contrast by brightness', () => {
  // Light checker gets a black border.
  assert.equal(deriveCheckerBorder('#ffffff'), '#000000')
  // Dark checker gets a lighter (non-black) shade of itself.
  const darkBorder = deriveCheckerBorder('#000000')
  assert.notEqual(darkBorder, '#000000')
  assert.equal(darkBorder, lighten('#000000', 0.24))
})
