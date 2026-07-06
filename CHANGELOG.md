<!--
SPDX-FileCopyrightText: Greg Back <git@gregback.net>
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Changelog

All notable changes to `backgammon-js` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-07-06

### Fixed
- **Idempotent, global-safe loading.** `board.js` is now wrapped in a guarded IIFE
  and assigns its API (`Diagram`, `BoardStyle`, …) onto the global object. Re-injecting
  the script into a single realm — as Anki does when it reloads a card inside one
  long-lived webview — is now a no-op instead of throwing
  `Identifier 'Diagram' has already been declared`. Bare-identifier use from later
  `<script>` blocks and the `node:test` CommonJS `require` both keep working.

### Added
- **`CanvasRenderingContext2D.roundRect` polyfill.** Feature-detected and installed on
  load, so clients whose WebKit/Chromium predates `roundRect` (e.g. the QtWebEngine in
  older Anki builds) render the frame, cube, and dice instead of throwing.

[Unreleased]: https://github.com/gtback/backgammon-js/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/gtback/backgammon-js/releases/tag/v0.1.0
