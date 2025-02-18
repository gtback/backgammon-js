// SPDX-FileCopyrightText: Greg Back <git@gregback.net>
// SPDX-License-Identifier: MIT

const BLACK = 'rgb(0, 0, 0)';
const BROWN = 'rgb(153,102,51)';
const RED = 'rgb(255, 0, 0)';
const WHITE = 'rgb(255, 255, 255)';
const GREEN = 'rgb(0,127,0)';

const BLUE = 'rgb(0, 127, 255)';
const YELLOW = 'rgb(255, 255, 0)';

const DEFAULT_OPTIONS = {
    canvasWidth: 690,
    canvasHeight: 560,
    canvasMargin: 40,
    frameThicknessX: 50,
    frameThicknessY: 25,
    barThickness: 40,
    frameColor: BROWN,
    boardBackground: GREEN,
    oddPoints: RED,
    evenPoints: WHITE,
    player1: {
        checkerColor: WHITE,
        textColor: BLACK,
    },
    player2: {
        checkerColor: BLACK,
        textColor: WHITE,
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

        const boardX = frameX + this.opts.frameThicknessX;
        const boardY = frameY + this.opts.frameThicknessY;

        const boardWidth = frameWidth - 2 * this.opts.frameThicknessX - this.opts.barThickness;
        const boardHeight = frameHeight - 2 * this.opts.frameThicknessY;

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

        this.drawCheckersOnBar();
        this.drawCube(this.game.cubeOwner, this.game.cube);

        this.drawCheckersOffBoard();
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

    drawCheckersOnBar() {
        const barCenter = this.opts.canvasMargin + this.opts.frameThicknessX + (this.board.width / 2) + this.opts.barThickness / 2;

        if (this.game.oppBarCheckers > 0) {
            let y = this.board.y + (this.board.height * 2 / 3)
            this.ctx.fillStyle = this.opts.player2.checkerColor;
            this.ctx.beginPath();
            this.ctx.arc(barCenter, y, this.radius, degToRad(0), degToRad(360), false);
            this.ctx.fill();
            this.ctx.stroke();
            if (this.game.oppBarCheckers > 1) {
                this.ctx.fillStyle = this.opts.player2.textColor;
                this.ctx.fillText(this.game.oppBarCheckers, barCenter, y + (this.radius - 12));
            }
        }

        if (this.game.playerBarCheckers > 0) {
            let y = this.board.y + (this.board.height / 3)
            this.ctx.fillStyle = this.opts.player1.checkerColor;
            this.ctx.beginPath();
            this.ctx.arc(barCenter, y, this.radius, degToRad(0), degToRad(360), false);
            this.ctx.fill();
            this.ctx.stroke();
            if (this.game.playerBarCheckers > 1) {
                this.ctx.fillStyle = this.opts.player1.textColor;
                this.ctx.fillText(this.game.playerBarCheckers, barCenter, y + (this.radius - 12));
            }
        }
    }

    drawCube(owner, value) {
        // Owner should be:
        // - 0 for a centered cube
        // - 1 if the cube is owned by the player
        // - -1 if the cube is owned by the opponent
        const cubeSize = 40;
        const margin = (this.opts.frameThicknessX - cubeSize) / 2;

        let x = this.opts.canvasMargin + margin;

        let y;

        if (value == 1) {
            value = 64;
        }

        if (owner == 0) {
            y = (this.opts.canvasHeight - cubeSize) / 2;
        }
        else if (owner == -1) {
            y = this.opts.canvasMargin + this.opts.frameThicknessY;
        }
        else {
            y = this.opts.canvasHeight - this.opts.canvasMargin - this.opts.frameThicknessY - cubeSize;
        }


        this.ctx.fillStyle = WHITE;
        this.ctx.strokeStyle = BLACK;

        this.ctx.fillRect(x, y, cubeSize, cubeSize);
        this.ctx.strokeRect(x, y, cubeSize, cubeSize);

        this.ctx.fillStyle = BLACK;

        this.ctx.fillText(value, (x + cubeSize / 2), y + cubeSize / 2 + 5);
    }

    drawCheckersOffBoard() {
        const offCheckerX = 40; // todo: should be radius / 2
        const offCheckerY = 8;

        this.ctx.strokeStyle = BLACK;

        let x = this.opts.canvasWidth - this.opts.canvasMargin - (this.opts.frameThicknessX + offCheckerX) / 2;

        // Opponent
        let y = this.opts.canvasMargin + this.opts.frameThicknessY;

        this.ctx.fillStyle = this.opts.player2.checkerColor;


        for (let i = 0; i < this.game.opponentOffCheckers; i++) {
            this.ctx.fillRect(x, y, offCheckerX, offCheckerY);
            this.ctx.strokeRect(x, y, offCheckerX, offCheckerY);
            y = y + 10;
            // Add extra space between every 5 checkers
            if (i % 5 == 4) {
                y = y + 5;
            }
        }

        // Player
        y = this.opts.canvasHeight - this.opts.canvasMargin - this.opts.frameThicknessY - offCheckerY;
        this.ctx.fillStyle = this.opts.player1.checkerColor;

        for (let i = 0; i < this.game.playerOffCheckers; i++) {
            this.ctx.fillRect(x, y, offCheckerX, offCheckerY);
            this.ctx.strokeRect(x, y, offCheckerX, offCheckerY);
            y = y - 10;
            // Add extra space between every 5 checkers
            if (i % 5 == 4) {
                y = y - 5;
            }
        }
    }
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
};

function charToCount(char) {
    if (char == '-'.charCodeAt(0)) {
        return 0;
    }
    let count = (char - 'A'.charCodeAt(0)) % 32 + 1;
    return count;
}

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

    let playerOffCheckers = 15
    let oppOffCheckers = 15

    for (let i = 1; i < 25; i++) {
        let char = checkers.charCodeAt(i);
        let count = charToCount(char)
        checkerCount.push(count);
        if (char == '-'.charCodeAt(0)) {
            player.push(0);
        }
        else if (char < 'Z'.charCodeAt(0)) {
            player.push(1)
            playerOffCheckers -= count;
        }
        else if (char >= 'a'.charCodeAt(0)) {
            player.push(-1)
            oppOffCheckers -= count;
        }
        else {
            console.log("Unknown character: " + char)
        }
    }

    let playerBarCheckers = charToCount(checkers.charCodeAt(25))
    let oppBarCheckers = charToCount(checkers.charCodeAt(0))

    playerOffCheckers -= playerBarCheckers;
    oppOffCheckers -= oppBarCheckers;


    return {
        checkerCount: checkerCount,
        players: player,
        playerBarCheckers: playerBarCheckers,
        oppBarCheckers: oppBarCheckers,
        cube: cube,
        cubeOwner: cubeOwner,
        playerOffCheckers: playerOffCheckers,
        opponentOffCheckers: oppOffCheckers,
    }
}
