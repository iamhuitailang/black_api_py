var Renderer = (function() {
    'use strict';

    var ctx = null;
    var canvas = null;

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        canvas.width = GameConfig.get('GAME.CANVAS_WIDTH');
        canvas.height = GameConfig.get('GAME.CANVAS_HEIGHT');
    }

    function clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function drawBackground() {
        var backgroundColor = GameConfig.get('GAME.BACKGROUND_COLOR');
        var borderColor = GameConfig.get('GAME.BORDER_COLOR');
        var borderWidth = GameConfig.get('GAME.BORDER_WIDTH');

        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(
            borderWidth / 2,
            borderWidth / 2,
            canvas.width - borderWidth,
            canvas.height - borderWidth
        );

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        var gridSize = 40;
        for (var x = borderWidth; x < canvas.width - borderWidth; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, borderWidth);
            ctx.lineTo(x, canvas.height - borderWidth);
            ctx.stroke();
        }
        for (var y = borderWidth; y < canvas.height - borderWidth; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(borderWidth, y);
            ctx.lineTo(canvas.width - borderWidth, y);
            ctx.stroke();
        }
    }

    function drawMouse(mouse) {
        if (!mouse) return;

        var x = mouse.x;
        var y = mouse.y;
        var r = mouse.radius;
        var mouseConfig = GameConfig.CONFIG.MOUSE;

        ctx.save();
        ctx.translate(x, y);

        if (mouse.direction.x < 0) {
            ctx.scale(-1, 1);
        }

        var tailPos = mouse.getTailPosition();
        ctx.beginPath();
        ctx.strokeStyle = mouseConfig.TAIL_COLOR;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.moveTo(r * 0.8, 0);
        ctx.quadraticCurveTo(
            r * 0.8 + mouseConfig.TAIL_LENGTH / 2,
            (tailPos.endY - tailPos.baseY) * 0.5,
            r * 0.8 + mouseConfig.TAIL_LENGTH,
            tailPos.endY - tailPos.baseY
        );
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = mouseConfig.EAR_COLOR;
        ctx.arc(-r * 0.4, -r * 0.7, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(r * 0.4, -r * 0.7, r * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = '#ffaaaa';
        ctx.arc(-r * 0.4, -r * 0.65, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.4, -r * 0.65, r * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = mouseConfig.COLOR;
        ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(-r * 0.35, -r * 0.15, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.35, -r * 0.15, r * 0.18, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = '#000000';
        ctx.arc(-r * 0.35, -r * 0.12, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.35, -r * 0.12, r * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = '#ffaaaa';
        ctx.arc(0, r * 0.15, r * 0.12, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';

        ctx.moveTo(-r * 0.2, r * 0.1);
        ctx.lineTo(-r * 0.2 - mouseConfig.WHISKER_LENGTH, r * 0.05);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-r * 0.2, r * 0.2);
        ctx.lineTo(-r * 0.2 - mouseConfig.WHISKER_LENGTH, r * 0.25);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(r * 0.2, r * 0.1);
        ctx.lineTo(r * 0.2 + mouseConfig.WHISKER_LENGTH, r * 0.05);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r * 0.2, r * 0.2);
        ctx.lineTo(r * 0.2 + mouseConfig.WHISKER_LENGTH, r * 0.25);
        ctx.stroke();

        ctx.restore();
    }

    function drawCat(cat) {
        if (!cat) return;

        var x = cat.x;
        var y = cat.y;
        var r = cat.radius;
        var catConfig = GameConfig.CONFIG.CAT;

        ctx.save();
        ctx.translate(x, y);

        ctx.beginPath();
        ctx.fillStyle = catConfig.COLOR;
        ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = catConfig.STRIPE_COLOR;
        for (var i = -2; i <= 2; i++) {
            var stripeX = i * r * 0.35;
            var stripeWidth = r * 0.2;
            var stripeHeight = r * 0.6;
            
            ctx.fillRect(
                stripeX - stripeWidth / 2,
                -stripeHeight / 2,
                stripeWidth,
                stripeHeight
            );
        }

        ctx.beginPath();
        ctx.fillStyle = catConfig.EAR_COLOR;
        ctx.moveTo(-r * 0.6, -r * 0.5);
        ctx.lineTo(-r * 0.3, -r * 1.1);
        ctx.lineTo(0, -r * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, -r * 0.5);
        ctx.lineTo(r * 0.3, -r * 1.1);
        ctx.lineTo(r * 0.6, -r * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = '#ffcccc';
        ctx.moveTo(-r * 0.45, -r * 0.55);
        ctx.lineTo(-r * 0.3, -r * 0.85);
        ctx.lineTo(-r * 0.15, -r * 0.55);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(r * 0.15, -r * 0.55);
        ctx.lineTo(r * 0.3, -r * 0.85);
        ctx.lineTo(r * 0.45, -r * 0.55);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = catConfig.EYE_COLOR;
        ctx.ellipse(-r * 0.35, -r * 0.15, r * 0.18, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.35, -r * 0.15, r * 0.18, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = catConfig.PUPIL_COLOR;
        ctx.ellipse(-r * 0.35, -r * 0.15, r * 0.06, r * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.35, -r * 0.15, r * 0.06, r * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = '#ff8888';
        ctx.moveTo(0, r * 0.05);
        ctx.lineTo(-r * 0.08, r * 0.2);
        ctx.lineTo(r * 0.08, r * 0.2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, r * 0.2);
        ctx.quadraticCurveTo(-r * 0.15, r * 0.35, -r * 0.25, r * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, r * 0.2);
        ctx.quadraticCurveTo(r * 0.15, r * 0.35, r * 0.25, r * 0.3);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        ctx.moveTo(-r * 0.2, r * 0.15);
        ctx.lineTo(-r * 0.6, r * 0.05);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-r * 0.2, r * 0.25);
        ctx.lineTo(-r * 0.6, r * 0.25);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-r * 0.2, r * 0.35);
        ctx.lineTo(-r * 0.6, r * 0.45);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(r * 0.2, r * 0.15);
        ctx.lineTo(r * 0.6, r * 0.05);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r * 0.2, r * 0.25);
        ctx.lineTo(r * 0.6, r * 0.25);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r * 0.2, r * 0.35);
        ctx.lineTo(r * 0.6, r * 0.45);
        ctx.stroke();

        ctx.restore();
    }

    function drawCheese(cheese) {
        if (!cheese) return;

        var x = cheese.x;
        var y = cheese.y;
        var size = cheese.size;
        var cheeseConfig = GameConfig.CONFIG.CHEESE;

        ctx.save();
        ctx.translate(x, y);

        ctx.beginPath();
        ctx.fillStyle = cheeseConfig.COLOR;
        ctx.moveTo(0, -size * 0.7);
        ctx.lineTo(-size * 0.6, size * 0.5);
        ctx.lineTo(size * 0.6, size * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = cheeseConfig.HOLE_COLOR;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = cheeseConfig.HOLE_COLOR;
        ctx.arc(-size * 0.2, 0, size * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(size * 0.15, size * 0.15, size * 0.12, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function drawCheeses(cheeses) {
        if (!cheeses || !cheeses.length) return;

        for (var i = 0; i < cheeses.length; i++) {
            drawCheese(cheeses[i]);
        }
    }

    function drawGameScene(mouse, cat, cheeses) {
        clear();
        drawBackground();
        drawCheeses(cheeses);
        drawMouse(mouse);
        drawCat(cat);
    }

    function drawPausedOverlay() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('游戏暂停', canvas.width / 2, canvas.height / 2 - 30);

        ctx.font = '24px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.fillText('按空格键或点击继续按钮继续游戏', canvas.width / 2, canvas.height / 2 + 30);
    }

    function drawGameOverOverlay(score, survivalTime) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 56px Arial';
        ctx.fillStyle = '#e74c3c';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 80);

        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('最终得分: ' + score, canvas.width / 2, canvas.height / 2);

        ctx.font = '28px Arial';
        ctx.fillStyle = '#f39c12';
        var timeText = '生存时间: ' + Utils.formatTime(survivalTime);
        ctx.fillText(timeText, canvas.width / 2, canvas.height / 2 + 50);

        ctx.font = '20px Arial';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('点击「再来一局」重新开始', canvas.width / 2, canvas.height / 2 + 100);
    }

    return {
        init: init,
        clear: clear,
        drawBackground: drawBackground,
        drawMouse: drawMouse,
        drawCat: drawCat,
        drawCheese: drawCheese,
        drawCheeses: drawCheeses,
        drawGameScene: drawGameScene,
        drawPausedOverlay: drawPausedOverlay,
        drawGameOverOverlay: drawGameOverOverlay
    };
})();
