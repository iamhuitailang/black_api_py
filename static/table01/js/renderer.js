var Renderer = (function() {
    'use strict';

    var gameConfig = Config.GAME_CONFIG;
    var colors = Config.COLORS;

    function drawTable(ctx, width, height, tableBounds) {
        ctx.fillStyle = colors.tableBorder;
        ctx.fillRect(0, 0, width, height);

        var gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#654321');
        gradient.addColorStop(0.5, '#8B4513');
        gradient.addColorStop(1, '#654321');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = colors.table;
        ctx.fillRect(tableBounds.left, tableBounds.top, tableBounds.width, tableBounds.height);

        var feltGradient = ctx.createRadialGradient(
            tableBounds.left + tableBounds.width / 2,
            tableBounds.top + tableBounds.height / 2,
            0,
            tableBounds.left + tableBounds.width / 2,
            tableBounds.top + tableBounds.height / 2,
            Math.max(tableBounds.width, tableBounds.height) / 2
        );
        feltGradient.addColorStop(0, 'rgba(0, 120, 60, 0.3)');
        feltGradient.addColorStop(1, 'rgba(0, 60, 30, 0.5)');
        ctx.fillStyle = feltGradient;
        ctx.fillRect(tableBounds.left, tableBounds.top, tableBounds.width, tableBounds.height);

        ctx.strokeStyle = colors.tableBorderInner;
        ctx.lineWidth = 6;
        ctx.strokeRect(
            tableBounds.left - 3,
            tableBounds.top - 3,
            tableBounds.width + 6,
            tableBounds.height + 6
        );
    }

    function drawPockets(ctx, pockets, pocketRadius) {
        for (var i = 0; i < pockets.length; i++) {
            var pocket = pockets[i];

            ctx.beginPath();
            ctx.arc(pocket.x, pocket.y, pocketRadius + 4, 0, Math.PI * 2);
            ctx.fillStyle = '#333';
            ctx.fill();

            var innerGradient = ctx.createRadialGradient(
                pocket.x - 3, pocket.y - 3, 0,
                pocket.x, pocket.y, pocketRadius
            );
            innerGradient.addColorStop(0, '#1a1a1a');
            innerGradient.addColorStop(0.7, '#0a0a0a');
            innerGradient.addColorStop(1, '#000000');
            ctx.beginPath();
            ctx.arc(pocket.x, pocket.y, pocketRadius, 0, Math.PI * 2);
            ctx.fillStyle = innerGradient;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(pocket.x, pocket.y, pocketRadius + 2, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    function drawBall(ctx, ball) {
        if (ball.isPocketed) return;

        var x = ball.x;
        var y = ball.y;
        var radius = ball.radius;

        ctx.beginPath();
        ctx.arc(x + 3, y + 3, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();

        var gradient = ctx.createRadialGradient(
            x - radius * 0.3, y - radius * 0.3, 0,
            x, y, radius
        );

        if (ball.isCue) {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.7, '#e0e0e0');
            gradient.addColorStop(1, '#a0a0a0');
        } else {
            gradient.addColorStop(0, lightenColor(ball.color, 50));
            gradient.addColorStop(0.5, ball.color);
            gradient.addColorStop(1, darkenColor(ball.color, 40));
        }

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x - radius * 0.35, y - radius * 0.35, radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();

        if (ball.label && !ball.isCue) {
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();

            ctx.fillStyle = '#333';
            ctx.font = 'bold ' + Math.floor(radius * 0.55) + 'px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ball.label, x, y);
        }

        if (ball.isCue) {
            ctx.beginPath();
            ctx.arc(x + radius * 0.3, y + radius * 0.3, radius * 0.1, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
            ctx.fill();
        }
    }

    function drawCue(ctx, cueBall, angle, force, maxForce, isAiming) {
        if (!isAiming || !cueBall) return;
        if (cueBall.isPocketed || cueBall.isMoving) return;

        var x = cueBall.x;
        var y = cueBall.y;
        var radius = cueBall.radius;

        var forcePercent = force / maxForce;
        var pullDistance = 30 + forcePercent * 80;

        var cueEndX = x - Math.cos(angle) * (radius + 20 + pullDistance);
        var cueEndY = y - Math.sin(angle) * (radius + 20 + pullDistance);
        var cueStartX = x - Math.cos(angle) * (radius + 10);
        var cueStartY = y - Math.sin(angle) * (radius + 10);

        ctx.save();
        ctx.globalAlpha = 0.9;

        ctx.lineWidth = gameConfig.cueWidth;
        ctx.lineCap = 'round';

        var cueGradient = ctx.createLinearGradient(cueStartX, cueStartY, cueEndX, cueEndY);
        cueGradient.addColorStop(0, '#f5f5dc');
        cueGradient.addColorStop(0.05, '#c9a66b');
        cueGradient.addColorStop(0.1, '#8B4513');
        cueGradient.addColorStop(0.5, '#A0522D');
        cueGradient.addColorStop(1, '#654321');

        ctx.beginPath();
        ctx.moveTo(cueStartX, cueStartY);
        ctx.lineTo(cueEndX, cueEndY);
        ctx.strokeStyle = cueGradient;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cueStartX, cueStartY);
        ctx.lineTo(x - Math.cos(angle) * radius, y - Math.sin(angle) * radius);
        ctx.strokeStyle = colors.cueTip;
        ctx.lineWidth = gameConfig.cueWidth * 0.6;
        ctx.stroke();

        ctx.restore();

        if (force > 0) {
            var barWidth = 8;
            var barHeight = 100;
            var barX = 50;
            var barY = y - barHeight / 2;

            ctx.fillStyle = colors.powerBarBg;
            ctx.fillRect(barX, barY, barWidth, barHeight);

            var powerHeight = barHeight * forcePercent;
            var powerGradient = ctx.createLinearGradient(barX, barY + barHeight, barX, barY);
            powerGradient.addColorStop(0, '#55efc4');
            powerGradient.addColorStop(0.5, '#f1c40f');
            powerGradient.addColorStop(1, '#e74c3c');

            ctx.fillStyle = powerGradient;
            ctx.fillRect(barX, barY + barHeight - powerHeight, barWidth, powerHeight);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(Math.floor(forcePercent * 100) + '%', barX + barWidth / 2, barY - 10);
        }
    }

    function drawAimLine(ctx, cueBall, angle, force, maxForce) {
        if (!cueBall || cueBall.isPocketed || cueBall.isMoving) return;

        var x = cueBall.x;
        var y = cueBall.y;
        var radius = cueBall.radius;

        var forcePercent = force / maxForce;
        var lineLength = 50 + forcePercent * 200;

        var endX = x + Math.cos(angle) * lineLength;
        var endY = y + Math.sin(angle) * lineLength;

        ctx.save();

        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
        ctx.lineTo(endX, endY);

        var lineGradient = ctx.createLinearGradient(
            x, y,
            endX, endY
        );
        lineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        lineGradient.addColorStop(1, 'rgba(255, 100, 100, 0.3)');

        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(endX, endY, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.fill();

        ctx.restore();
    }

    function lightenColor(color, percent) {
        var num = parseInt(color.replace('#', ''), 16);
        var amt = Math.round(2.55 * percent);
        var R = (num >> 16) + amt;
        var G = (num >> 8 & 0x00FF) + amt;
        var B = (num & 0x0000FF) + amt;
        R = Math.min(255, Math.max(0, R));
        G = Math.min(255, Math.max(0, G));
        B = Math.min(255, Math.max(0, B));
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    function darkenColor(color, percent) {
        var num = parseInt(color.replace('#', ''), 16);
        var amt = Math.round(2.55 * percent);
        var R = (num >> 16) - amt;
        var G = (num >> 8 & 0x00FF) - amt;
        var B = (num & 0x0000FF) - amt;
        R = Math.min(255, Math.max(0, R));
        G = Math.min(255, Math.max(0, G));
        B = Math.min(255, Math.max(0, B));
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    function clear(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);
    }

    return {
        drawTable: drawTable,
        drawPockets: drawPockets,
        drawBall: drawBall,
        drawCue: drawCue,
        drawAimLine: drawAimLine,
        clear: clear
    };
})();
