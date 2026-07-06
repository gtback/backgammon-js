// SPDX-FileCopyrightText: Greg Back <git@gregback.net>
//
// SPDX-License-Identifier: MIT

const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const SRC = fs.readFileSync(path.join(__dirname, '..', 'board.js'), 'utf8')

test('board.js exposes Diagram/BoardStyle on the global object', () => {
  const context = vm.createContext({})
  vm.runInContext(SRC, context)
  assert.strictEqual(typeof context.Diagram, 'function')
  assert.strictEqual(typeof context.BoardStyle, 'function')
  assert.strictEqual(typeof context.xgidToGame, 'function')
})

test('re-evaluating board.js in one realm is a no-op, not a redeclaration error', () => {
  // Simulates Anki re-injecting <script src="_board.js"> into its single, long-lived
  // webview: the second execution must not throw "Diagram has already been declared".
  const context = vm.createContext({})
  vm.runInContext(SRC, context)
  const firstDiagram = context.Diagram
  assert.doesNotThrow(() => vm.runInContext(SRC, context))
  // The guard keeps the first-loaded API in place.
  assert.strictEqual(context.Diagram, firstDiagram)
})
