<!--
SPDX-FileCopyrightText: Greg Back <git@gregback.net>
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# XGID Format Reference

XGID (eXtreme Gammon ID) is a compact text notation for encoding a complete backgammon game state,
including checker positions, cube state, scores, and dice. It was defined by the
[eXtreme Gammon](https://extremegammon.com/) software.

## Format

```
XGID=<position>:<cube>:<cubeOwner>:<turn>:<dice>:<playerScore>:<oppScore>:<crawford>:<matchLength>:<maxCube>
```

The `XGID=` prefix is optional. Fields are separated by colons.

Throughout this document, **Player** refers to the bottom player as rendered by the diagram
(uppercase characters in the position string), and **Opponent** refers to the top player
(lowercase characters). These terms are used interchangeably with "bottom" and "top" when
describing board orientation.

## Fields

### 1. Position (26 characters)

Encodes checker placement across all 26 locations: the Opponent's bar, points 1–24, and the
Player's bar.

| Index | Location |
|---|---|
| 0 | Opponent bar |
| 1–24 | Points 1–24 from the Player's perspective |
| 25 | Player bar |

Each character encodes both the count and owner of checkers at that location:

| Character | Meaning |
|---|---|
| `-` | Empty (no checkers) |
| `A`–`O` | Player's checkers; `A` = 1, `B` = 2, …, `O` = 15 |
| `a`–`o` | Opponent's checkers; `a` = 1, `b` = 2, …, `o` = 15 |

### 2. Cube value

The face value of the doubling cube is `2^field`, so:

| Value | Cube |
|---|---|
| `0` | 1 (starting value) |
| `1` | 2 |
| `2` | 4 |
| `3` | 8 |

### 3. Cube owner

| Value | Meaning |
|---|---|
| `1` | Player owns the cube |
| `0` | Cube is centered |
| `-1` | Opponent owns the cube |

### 4. Turn

| Value | Meaning |
|---|---|
| `1` | Player to move |
| `-1` | Opponent to move |

### 5. Dice

| Value | Meaning |
|---|---|
| `00` | Player is yet to roll or double |
| `D` | Player has doubled; opponent must take or drop |
| `B` | Player doubled; opponent beavered |
| `R` | Player doubled; opponent beavered; player racconed |
| `xy` | Player rolled `x` and `y` — each character is one die face (e.g., `21` = 2 and 1, `63` = 6 and 3) |

`D`, `B`, and `R` are defined by the XGID spec but are not currently parsed by this library;
passing an XGID with these values will cause parsing to fail silently.

### 6. Player score

Player's current match score in points.

### 7. Opponent score

Opponent's current match score in points.

### 8. Crawford / Jacoby flags

In match play, `1` means the current game is the Crawford game; `0` means it is not.

In unlimited (money) games, this field encodes Jacoby and Beaver rules:

| Value | Jacoby | Beaver |
|---|---|---|
| `0` | Off | Off |
| `1` | On | Off |
| `2` | Off | On |
| `3` | On | On |

### 9. Match length

Length of the match in points. `0` means unlimited (money) play.

### 10. Max cube

Maximum allowed cube value, expressed as a power of 2 (e.g., `8` means the cube can go up to
`2^8 = 256`).

## Example: Starting Position

```
XGID=-b----E-C---eE---c-e----B-:0:0:1:21:0:0:3:0:10
```

Decoded:

| Field | Value | Meaning |
|---|---|---|
| Position | `-b----E-C---eE---c-e----B-` | Standard starting position (see below) |
| Cube | `0` | Cube = 1 |
| Cube owner | `0` | Centered |
| Turn | `1` | Player to move |
| Dice | `21` | Rolled 2-1 |
| Player score | `0` | 0 points |
| Opponent score | `0` | 0 points |
| Crawford/Jacoby | `3` | Jacoby and Beaver (money game) |
| Match length | `0` | Unlimited |
| Max cube | `10` | Up to 2^10 = 1024 |

Position string breakdown for the starting position:

| Index | Char | Location | Checkers |
|---|---|---|---|
| 0 | `-` | Opponent bar | 0 |
| 1 | `b` | Point 1 | 2 (Opponent) |
| 2–5 | `----` | Points 2–5 | empty |
| 6 | `E` | Point 6 | 5 (Player) |
| 7 | `-` | Point 7 | empty |
| 8 | `C` | Point 8 | 3 (Player) |
| 9–11 | `---` | Points 9–11 | empty |
| 12 | `e` | Point 12 | 5 (Opponent) |
| 13 | `E` | Point 13 | 5 (Player) |
| 14–16 | `---` | Points 14–16 | empty |
| 17 | `c` | Point 17 | 3 (Opponent) |
| 18 | `-` | Point 18 | empty |
| 19 | `e` | Point 19 | 5 (Opponent) |
| 20–23 | `----` | Points 20–23 | empty |
| 24 | `B` | Point 24 | 2 (Player) |
| 25 | `-` | Player bar | 0 |

## Implementation Notes

`board.js` parses all fields via `xgidToGame()` but currently renders only a subset:

| Field | Rendered |
|---|---|
| Position | Yes |
| Cube value and owner | Yes — a value of 1 (XGID field `0`) displays as **64**, the standard backgammon convention for the unclaimed centered cube |
| Player and opponent scores | Yes |
| Dice | Yes — numeric rolls only; `D`/`B`/`R` not handled (parsing fails silently) |
| Turn, match length, max cube | Parsed, not yet drawn/used |
