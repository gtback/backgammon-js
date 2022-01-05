function drawBoard(selector) {
    const canvas = document.querySelector(selector);
    const ctx = canvas.getContext('2d');

    const canvasWidth = canvas.width = 790;
    const canvasHeight = canvas.height = 550;

    const canvasMargin = 50;

    const frameX = canvasMargin;
    const frameY = canvasMargin;

    const frameWidth = canvasWidth - 2 * canvasMargin;
    const frameHeight = canvasHeight - 2 * canvasMargin;

    const frameThickness = 25;

    const boardX = frameX + frameThickness;
    const boardY = frameY + frameThickness;

    const barThickness = 40;

    const boardWidth = frameWidth - 2 * frameThickness - barThickness;
    const boardHeight = frameHeight - 2 * frameThickness;

    const board = {
        boardX: boardX,
        boardY: boardY,
        boardWidth: boardWidth,
        boardHeight: boardHeight,
        barThickness: barThickness,
    }

    const pointHeight = boardHeight * 0.45;

    black = 'rgb(0, 0, 0)';
    brown = 'rgb(153,102,51)';
    red = 'rgb(255, 0, 0)';
    white = 'rgb(255, 255, 255)';

    ctx.lineWidth = 5;
    ctx.strokeStyle = black;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = brown;
    ctx.fillRect(frameX, frameY, frameWidth, frameHeight);

    ctx.fillStyle = black;
    ctx.fillRect(boardX, boardY, boardWidth + barThickness, boardHeight);

    ctx.lineWidth = 2;
    pointGap = 4;

    ctx.font = '18px arial';
    ctx.textAlign = 'center';

    for (point = 0; point < 24; point++) {
        ctx.strokeStyle = point % 2 == 0 ? white : red;
        ctx.fillStyle = point % 2 == 0 ? red : white;

        const {
            startX,
            xDirection,
            yDirection,
            baseLine,
            textPoint,
            xInit,
            midpoint
        } = getPointData(point, board);

        tip = baseLine + yDirection * pointHeight;

        ctx.beginPath();
        ctx.moveTo(xInit + xDirection * pointGap / 2, baseLine);
        ctx.lineTo(midpoint, tip);
        ctx.lineTo(xInit + xDirection * (boardWidth / 12 - pointGap / 2), baseLine);
        ctx.stroke();
        // Back to starting point
        ctx.lineTo(xInit + xDirection * pointGap / 2, baseLine);
        ctx.fill();

        ctx.fillStyle = black;
        ctx.fillText(point + 1, midpoint, textPoint);
    }

    // Draw frame around board to clean up point strokes
    ctx.strokeStyle = black;
    ctx.strokeRect(boardX, boardY, boardWidth + barThickness, boardHeight);

    // Draw Bar
    ctx.fillStyle = brown;
    ctx.fillRect(boardX + boardWidth / 2, frameY, barThickness, frameHeight);

    point = 17;
    radius = boardWidth / 32;
    ctx.fillStyle = 'rgb(0, 127, 255)';

    // Use point-1 since we number points 1-24 but the code expects 0-23.
    const {
        startX,
        xDirection,
        yDirection,
        baseLine,
        textPoint,
        xInit,
        midpoint
    } = getPointData(point - 1, board);

    numCheckers = 4;
    for (i = 0; i < numCheckers; i++) {
        ctx.beginPath();
        ctx.arc(midpoint, baseLine + yDirection * (pointGap / 2 + (2 * radius * i) + radius), radius, degToRad(0), degToRad(360), false);
        ctx.fill();
        ctx.stroke();
    }
}

function getPointData(point, board) {
    const {
        boardX,
        boardY,
        boardWidth,
        boardHeight,
        barThickness
    } = board;

    if (point >= 12) {
        startX = boardX;
        xDirection = 1; // left to right
        yDirection = 1; // downward
        baseLine = boardY;
        textPoint = boardY - 5;
    }
    else {
        startX = boardX + boardWidth;
        xDirection = -1; // right to left
        yDirection = -1; // upward
        baseLine = boardY + boardHeight;
        textPoint = boardY + boardHeight + 18;
    }
    if (point < 6 || point > 17) {
        startX += barThickness;
    }

    xInit = startX + xDirection * (point % 12) * boardWidth / 12;
    midpoint = xInit + xDirection * boardWidth / 24;

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

function degToRad(degrees) {
    return degrees * Math.PI / 180;
};
