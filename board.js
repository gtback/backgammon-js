black = 'rgb(0, 0, 0)';
brown = 'rgb(153,102,51)';
red = 'rgb(255, 0, 0)';
white = 'rgb(255, 255, 255)';

blue = 'rgb(0, 127, 255)';
yellow = 'rgb(255, 255, 0)';

const DEFAULT_OPTIONS = {
    frameColor: brown,
    boardBackground: black,
    // We start counting at 0, so the "oddPoints" are at index 0, 2, 4, ... but
    // are points 1, 3, 5, ...
    oddPoints: red,
    evenPoints: white,
    player1: {
        checkerColor: blue
    },
    player2: {
        checkerColor: yellow,
    },
};

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
            this.startX += this.board.barThickness;
        }

        this.xInit = this.startX + this.xDirection * (this.index % 12) * this.board.width / 12;
        this.midpoint = this.xInit + this.xDirection * this.board.width / 24;
    }

    draw(ctx) {
        const pointGap = 6;

        ctx.fillStyle = this.index % 2 == 0 ? this.opts.oddPoints : this.opts.evenPoints;
        // The stroke style is the opposite of the fill style
        ctx.strokeStyle = this.index % 2 == 0 ? this.opts.evenPoints : this.opts.oddPoints;

        const pointHeight = this.board.height * 0.40;
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
        ctx.fillStyle = black;
        ctx.fillText(this.index + 1, this.midpoint, this.textPoint);
    }
};

class Diagram {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.opts = DEFAULT_OPTIONS;

        const canvasWidth = this.canvas.width = 640;
        const canvasHeight = this.canvas.height = 480;

        const canvasMargin = 40;

        const frameX = canvasMargin;
        const frameY = canvasMargin;

        const frameWidth = canvasWidth - 2 * canvasMargin;
        const frameHeight = canvasHeight - 2 * canvasMargin;

        const frameThickness = 25;

        this.frame = {
            x: frameX,
            y: frameY,
            width: frameWidth,
            height: frameHeight,
            frameThickness: frameThickness,
        }

        const boardX = frameX + frameThickness;
        const boardY = frameY + frameThickness;

        const barThickness = 40;

        const boardWidth = frameWidth - 2 * frameThickness - barThickness;
        const boardHeight = frameHeight - 2 * frameThickness;

        this.board = {
            x: boardX,
            y: boardY,
            width: boardWidth,
            height: boardHeight,
            barThickness: barThickness,
        }

        this.points = Array();
        for (let point = 0; point < 24; point++) {
            this.points.push(new Point(point, this.board, this.opts));
        }

        this.radius = this.board.width / 32;
    }

    draw() {
        this.drawCanvas();
        this.drawFrame();
        this.drawBoard();

        // Draw Opening Position
        this.drawCheckers(6, 5, this.opts.player1);
        this.drawCheckers(8, 3, this.opts.player1);
        this.drawCheckers(13, 5, this.opts.player1);
        this.drawCheckers(24, 2, this.opts.player1);

        this.drawCheckers(25 - 6, 5, this.opts.player2);
        this.drawCheckers(25 - 8, 3, this.opts.player2);
        this.drawCheckers(25 - 13, 5, this.opts.player2);
        this.drawCheckers(25 - 24, 2, this.opts.player2);
    }

    drawCanvas() {
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = black; // always a black border around the canvas
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawFrame() {
        this.ctx.fillStyle = this.opts.frameColor;
        this.ctx.fillRect(this.frame.x, this.frame.y, this.frame.width, this.frame.height);
    }

    drawBoard() {
        this.ctx.fillStyle = this.opts.boardBackground;
        this.ctx.fillRect(this.board.x, this.board.y, this.board.width + this.board.barThickness, this.board.height);

        this.ctx.lineWidth = 2;

        this.ctx.font = '18px arial';
        this.ctx.textAlign = 'center';

        this.points.forEach((point) => point.draw(this.ctx));

        // Draw frame around board to clean up point strokes
        this.ctx.strokeStyle = black;
        this.ctx.strokeRect(this.board.x, this.board.y, this.board.width + this.board.barThickness, this.board.height);

        // Draw Bar
        this.ctx.fillStyle = this.opts.frameColor;
        this.ctx.fillRect(this.board.x + this.board.width / 2, this.frame.y, this.board.barThickness, this.frame.height);
    }

    drawCheckers(pointNum, numCheckers, player) {
        let radius = this.radius;

        this.ctx.fillStyle = player.checkerColor;

        // Use point-1 since we number points 1-24 but the code expects 0-23.
        let point = this.points[pointNum - 1];

        // Space above the baseline before starting checkers
        const pointPadding = 2;

        for (let i = 0; i < numCheckers; i++) {
            this.ctx.beginPath();
            this.ctx.arc(point.midpoint, point.baseLine + point.yDirection * (pointPadding + (2 * radius * i) + radius), radius, degToRad(0), degToRad(360), false);
            this.ctx.fill();
            this.ctx.stroke();
        }
    }
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
};
