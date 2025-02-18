// SPDX-FileCopyrightText: 2022-2023 Greg Back <git@gregback.net>
// SPDX-License-Identifier: MIT

const BLACK = 'rgb(0, 0, 0)';
const BROWN = 'rgb(153,102,51)';
const RED = 'rgb(255, 0, 0)';
const WHITE = 'rgb(255, 255, 255)';
const GREEN = 'rgb(0,127,0)';

const BLUE = 'rgb(0, 127, 255)';
const YELLOW = 'rgb(255, 255, 0)';

const DEFAULT_OPTIONS = {
    canvasWidth: 640,
    canvasHeight: 560,
    canvasMargin: 40,
    frameThickness: 25,
    barThickness: 40,
    frameColor: BROWN,
    boardBackground: GREEN,
    oddPoints: RED,
    evenPoints: WHITE,
    player1: {
        checkerColor: BLACK,
        textColor: WHITE,
    },
    player2: {
        checkerColor: WHITE,
        textColor: BLACK,
    },
};

const STARTING_POSITION = "XGID=-b----E-C---eE---c-e----B-:0:0:1:21:0:0:3:0:10"

class Point {
    constructor(index, board, opts) {
        this.index = index;
        this.board = board;
        this.opts = opts;

        if (this.index >= 12) { // Points on the far (Player 2) side of the board
            this.startX = this.board.x;
            this.xDirection = 1; // left to right
            this.yDirection = 1; // downward
            this.baseLine = this.board.y;
            this.textPoint = this.board.y - 6;
        }
        else { // Points on the near (Player 1) side of the board
            this.startX = this.board.x + this.board.width;
            this.xDirection = -1; // right to left
            this.yDirection = -1; // upward
            this.baseLine = this.board.y + this.board.height;
            this.textPoint = this.board.y + this.board.height + 18;
        }
        if (this.index < 6 || this.index > 17) { // Points on the right side of the bar.
            this.startX += this.opts.barThickness;
        }

        this.xInit = this.startX + this.xDirection * (this.index % 12) * this.board.width / 12;
        this.midpoint = this.xInit + this.xDirection * this.board.width / 24;
    }

    draw(ctx) {
        const pointGap = 1;

        // We start counting at 0, so the "oddPoints" are at index 0, 2, 4, ... but
        // are points 1, 3, 5, ...
        ctx.fillStyle = this.index % 2 == 0 ? this.opts.oddPoints : this.opts.evenPoints;
        // The stroke style is the opposite of the fill style
        // ctx.strokeStyle = this.index % 2 == 0 ? this.opts.evenPoints : this.opts.oddPoints;
        ctx.strokeStyle = BLACK;

        const pointHeight = this.board.height * 0.45;
        let tip = this.baseLine + this.yDirection * pointHeight;

        ctx.beginPath();
        ctx.moveTo(this.xInit + this.xDirection * pointGap / 2, this.baseLine);
        ctx.lineTo(this.midpoint, tip);
        ctx.lineTo(this.xInit + this.xDirection * (this.board.width / 12 - pointGap / 2), this.baseLine);
        ctx.stroke();
        // Back to starting point
        ctx.lineTo(this.xInit + this.xDirection * pointGap / 2, this.baseLine);
        ctx.fill();

        // Label point number (always black, not configurable)
        ctx.fillStyle = BLACK;
        ctx.fillText(this.index + 1, this.midpoint, this.textPoint);
    }
};

class Diagram {
    constructor(canvas, game) {
        this.canvas = canvas;
        if (game == null) {
            game = STARTING_POSITION;
        }
        this.game = xgidToGame(game);
        this.ctx = canvas.getContext('2d');

        this.opts = DEFAULT_OPTIONS;

        const canvasWidth = this.canvas.width = this.opts.canvasWidth;
        const canvasHeight = this.canvas.height = this.opts.canvasHeight;

        const canvasMargin = this.opts.canvasMargin;

        const frameX = canvasMargin;
        const frameY = canvasMargin;

        const frameWidth = canvasWidth - 2 * canvasMargin;
        const frameHeight = canvasHeight - 2 * canvasMargin;

        this.frame = {
            x: frameX,
            y: frameY,
            width: frameWidth,
            height: frameHeight,
        }

        const boardX = frameX + this.opts.frameThickness;
        const boardY = frameY + this.opts.frameThickness;

        const boardWidth = frameWidth - 2 * this.opts.frameThickness - this.opts.barThickness;
        const boardHeight = frameHeight - 2 * this.opts.frameThickness;

        this.board = {
            x: boardX,
            y: boardY,
            width: boardWidth,
            height: boardHeight,
        }

        this.points = Array();
        for (let point = 0; point < 24; point++) {
            this.points.push(new Point(point, this.board, this.opts));
        }

        this.radius = this.board.width / 25;
    }

    draw() {
        this.drawCanvas();
        this.drawFrame();
        this.drawBoard();

        for (let i = 1; i < 25; i++) {
            let numCheckers = this.game.checkerCount[i - 1];
            let player = this.game.players[i - 1] == 1 ? this.opts.player1 : this.opts.player2;

            if (numCheckers != 0) {
                this.drawCheckers(i, numCheckers, player);
            }
        }
    }

    drawCanvas() {
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = BLACK; // always a black border around the canvas
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawFrame() {
        this.ctx.fillStyle = this.opts.frameColor;
        this.ctx.fillRect(this.frame.x, this.frame.y, this.frame.width, this.frame.height);
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = BLACK;
        this.ctx.strokeRect(this.frame.x, this.frame.y, this.frame.width, this.frame.height);
    }

    drawBoard() {
        this.ctx.fillStyle = this.opts.boardBackground;
        this.ctx.fillRect(this.board.x, this.board.y, this.board.width + this.opts.barThickness, this.board.height);

        this.ctx.lineWidth = 1;

        this.ctx.font = '18px arial';
        this.ctx.textAlign = 'center';

        this.points.forEach((point) => point.draw(this.ctx));

        // Draw Bar
        this.ctx.fillStyle = this.opts.frameColor;
        this.ctx.fillRect(this.board.x + this.board.width / 2, this.board.y, this.opts.barThickness, this.board.height);

        // Draw frame around board to clean up point strokes
        this.ctx.strokeStyle = BLACK;
        this.ctx.strokeRect(this.board.x, this.board.y, this.board.width / 2, this.board.height);
        this.ctx.strokeRect(this.board.x + (this.board.width / 2) + this.opts.barThickness, this.board.y, this.board.width / 2, this.board.height);
    }

    drawCheckers(pointNum, numCheckers, player) {
        let radius = this.radius;

        this.ctx.fillStyle = player.checkerColor;

        // Use point-1 since we number points 1-24 but the code expects 0-23.
        let point = this.points[pointNum - 1];

        // Space above the baseline before starting checkers
        const pointPadding = 2;
        // Space between checkers on the same point
        const pointSpacing = 2;

        let maxCheckersPerPoint = 5;

        for (let i = 0; i < Math.min(numCheckers, maxCheckersPerPoint); i++) {
            this.ctx.beginPath();
            this.ctx.arc(point.midpoint, point.baseLine + point.yDirection * (pointPadding + pointSpacing * i + (2 * radius * i) + radius), radius, degToRad(0), degToRad(360), false);
            this.ctx.fill();
            this.ctx.stroke();
        }

        if (numCheckers > maxCheckersPerPoint) {
            this.ctx.fillStyle = player.textColor;
            let x = point.midpoint;

            // TODO: calculate this better
            let offsets = maxCheckersPerPoint;
            if (point.yDirection == - 1) {
                offsets--;
            }
            let y = point.baseLine + point.yDirection * (((2 * radius + pointSpacing) * offsets)) - (radius - 5);

            this.ctx.fillText(numCheckers, x, y);
        }
    }
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
};

function xgidToGame(xgid) {
    const regex = /(XGID=)?([-A-Oa-o]{26}):(\d+):(-?[01]):(-?1):([0-6][0-6]):(\d+):(\d+):([0-3]):(\d+):.+/;
    let match = xgid.match(regex);
    if (match == null) {
        //TODO
    }

    let checkers = match[2];
    let cube = 2 ** match[3];
    let cubeOwner = match[4];
    // Check that if cube = 1, owner is 0
    let turn = match[5];
    let roll = match[6];
    let playerScore = match[7];
    let oppScore = match[8];
    let gameOptions = match[9];
    let matchDuration = match[10];
    let xxx = match[11]; // ???

    let checkerCount = Array();
    let player = Array();

    // TODO: handle checkers on bar (checkers[0] and checkers[25])
    for (let i = 1; i < 25; i++) {
        let char = checkers.charCodeAt(i);
        if (char == '-'.charCodeAt(0)) {
            checkerCount.push(0);
            player.push(0);
        }
        else if (char < 'Z'.charCodeAt(0)) {
            player.push(1)
            checkerCount.push((char - 'A'.charCodeAt(0)) + 1);
        }
        else if (char >= 'a'.charCodeAt(0)) {
            player.push(-1)
            checkerCount.push((char - 'a'.charCodeAt(0)) + 1);
        }
        else {
            console.log("Unknown character: " + char)
        }
    }

    return {
        checkerCount: checkerCount,
        players: player,
    }
}
