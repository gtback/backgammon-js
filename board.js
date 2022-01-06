black = 'rgb(0, 0, 0)';
brown = 'rgb(153,102,51)';
red = 'rgb(255, 0, 0)';
white = 'rgb(255, 255, 255)';

player1 = {
    checkerColor: 'rgb(0, 127, 255)'
};

player2 = {
    checkerColor: 'rgb(255, 255, 0)'
};

class Board {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        const canvasWidth = this.canvas.width = 790;
        const canvasHeight = this.canvas.height = 550;

        const canvasMargin = 50;

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

        this.radius = this.board.width / 32;
    }

    draw() {
        this.drawCanvas();
        this.drawFrame();
        this.drawBoard();

        // Draw Opening Position
        this.drawCheckers(6, 5, player1);
        this.drawCheckers(8, 3, player1);
        this.drawCheckers(13, 5, player1);
        this.drawCheckers(24, 2, player1);

        this.drawCheckers(25 - 6, 5, player2);
        this.drawCheckers(25 - 8, 3, player2);
        this.drawCheckers(25 - 13, 5, player2);
        this.drawCheckers(25 - 24, 2, player2);
    }

    drawCanvas() {
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = black;
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawFrame() {
        this.ctx.fillStyle = brown;
        this.ctx.fillRect(this.frame.x, this.frame.y, this.frame.width, this.frame.height);
    }

    drawBoard() {
        this.ctx.fillStyle = black;
        this.ctx.fillRect(this.board.x, this.board.y, this.board.width + this.board.barThickness, this.board.height);

        this.ctx.lineWidth = 2;

        this.ctx.font = '18px arial';
        this.ctx.textAlign = 'center';

        for (let point = 0; point < 24; point++) {
            this.ctx.strokeStyle = point % 2 == 0 ? white : red;
            this.ctx.fillStyle = point % 2 == 0 ? red : white;

            this.drawPoint(point)
        }

        // Draw frame around board to clean up point strokes
        this.ctx.strokeStyle = black;
        this.ctx.strokeRect(this.board.x, this.board.y, this.board.width + this.board.barThickness, this.board.height);

        // Draw Bar
        this.ctx.fillStyle = brown;
        this.ctx.fillRect(this.board.x + this.board.width / 2, this.frame.y, this.board.barThickness, this.frame.height);
    }

    drawPoint(point) {
        const pointGap = 4;

        let {
            startX,
            xDirection,
            yDirection,
            baseLine,
            textPoint,
            xInit,
            midpoint
        } = this.getPointData(point);

        const pointHeight = this.board.height * 0.45;
        let tip = baseLine + yDirection * pointHeight;

        this.ctx.beginPath();
        this.ctx.moveTo(xInit + xDirection * pointGap / 2, baseLine);
        this.ctx.lineTo(midpoint, tip);
        this.ctx.lineTo(xInit + xDirection * (this.board.width / 12 - pointGap / 2), baseLine);
        this.ctx.stroke();
        // Back to starting point
        this.ctx.lineTo(xInit + xDirection * pointGap / 2, baseLine);
        this.ctx.fill();

        // Label point number
        this.ctx.fillStyle = black;
        this.ctx.fillText(point + 1, midpoint, textPoint);
    }

    drawCheckers(point, numCheckers, player) {
        let radius = this.radius;

        this.ctx.fillStyle = player.checkerColor;

        // Use point-1 since we number points 1-24 but the code expects 0-23.
        const {
            startX,
            xDirection,
            yDirection,
            baseLine,
            textPoint,
            xInit,
            midpoint
        } = this.getPointData(point - 1);

        // Space above the baseline before starting checkers
        const pointPadding = 2;

        for (let i = 0; i < numCheckers; i++) {
            this.ctx.beginPath();
            this.ctx.arc(midpoint, baseLine + yDirection * (pointPadding + (2 * radius * i) + radius), radius, degToRad(0), degToRad(360), false);
            this.ctx.fill();
            this.ctx.stroke();
        }
    }

    getPointData(point) {
        const {
            boardX,
            boardY,
            boardWidth,
            boardHeight,
            barThickness
        } = this.board;

        let startX, xDirection, yDirection, baseLine, textPoint;

        if (point >= 12) {
            startX = this.board.x;
            xDirection = 1; // left to right
            yDirection = 1; // downward
            baseLine = this.board.y;
            textPoint = this.board.y - 5;
        }
        else {
            startX = this.board.x + this.board.width;
            xDirection = -1; // right to left
            yDirection = -1; // upward
            baseLine = this.board.y + this.board.height;
            textPoint = this.board.y + this.board.height + 18;
        }
        if (point < 6 || point > 17) {
            startX += this.board.barThickness;
        }

        let xInit = startX + xDirection * (point % 12) * this.board.width / 12;
        let midpoint = xInit + xDirection * this.board.width / 24;

        return {
            "startX": startX,
            "xDirection": xDirection,
            "yDirection": yDirection,
            "baseLine": baseLine,
            "textPoint": textPoint,
            "xInit": xInit,
            "midpoint": midpoint
        };
    };
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
};
