var Renderer = (function() {
    var canvas, ctx;
    var width, height;
    var cameraX = 0;
    var cameraY = 0;

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
    }

    function resize() {
        var container = canvas.parentElement;
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width;
        canvas.height = height;
    }

    function setCamera(x, y) {
        cameraX = Math.max(0, x - width * 0.3);
        cameraY = Math.max(-100, Math.min(y - height * 0.5, 200));
    }

    function clear() {
        ctx.clearRect(0, 0, width, height);
    }

    function drawBackground(time) {
        clear();

        var skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.3, '#B8E6B8');
        skyGradient.addColorStop(0.6, '#90EE90');
        skyGradient.addColorStop(1, '#228B22');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (var i = 0; i < 5; i++) {
            var cloudX = ((i * 300 + time * 0.01) % (width + 200)) - 100 - cameraX * 0.05;
            var cloudY = 30 + (i % 3) * 40;
            ctx.beginPath();
            ctx.arc(cloudX, cloudY, 25, 0, Math.PI * 2);
            ctx.arc(cloudX + 20, cloudY + 5, 22, 0, Math.PI * 2);
            ctx.arc(cloudX + 40, cloudY, 25, 0, Math.PI * 2);
            ctx.arc(cloudX + 20, cloudY - 10, 18, 0, Math.PI * 2);
            ctx.fill();
        }

        var treeColors = ['#1a5f1a', '#228B22', '#2E8B57', '#1a4d1a'];
        for (var j = 0; j < 15; j++) {
            var treeX = ((j * 180) % (width + 100)) - 50 - cameraX * 0.15;
            var treeY = height - 120 - (j % 4) * 25;
            var scale = 0.6 + (j % 3) * 0.15;

            ctx.fillStyle = '#5D4037';
            ctx.fillRect(treeX - 5 * scale, treeY, 10 * scale, 80 * scale);

            ctx.fillStyle = treeColors[j % treeColors.length];
            ctx.beginPath();
            ctx.moveTo(treeX, treeY - 100 * scale);
            ctx.lineTo(treeX - 45 * scale, treeY - 15 * scale);
            ctx.lineTo(treeX - 25 * scale, treeY);
            ctx.lineTo(treeX + 25 * scale, treeY);
            ctx.lineTo(treeX + 45 * scale, treeY - 15 * scale);
            ctx.closePath();
            ctx.fill();
        }

        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 4;
        for (var k = 0; k < 8; k++) {
            var vineX = ((k * 250) % (width + 50)) - 25 - cameraX * 0.25;
            var vineY = 40 + (k % 3) * 40;
            var vineLength = 100 + (k % 3) * 50;
            var sway = Math.sin(time * 0.001 + k) * 8;

            ctx.beginPath();
            ctx.moveTo(vineX, vineY);
            for (var m = 0; m < vineLength; m += 10) {
                ctx.lineTo(vineX + Math.sin(m * 0.05 + time * 0.002) * 4 + sway * (m / vineLength), vineY + m);
            }
            ctx.stroke();

            ctx.fillStyle = '#32CD32';
            for (var n = 20; n < vineLength; n += 30) {
                ctx.beginPath();
                ctx.ellipse(
                    vineX + Math.sin(n * 0.05 + time * 0.002) * 4 + sway * (n / vineLength),
                    vineY + n,
                    8, 5, 0.3, 0, Math.PI * 2
                );
                ctx.fill();
            }
        }

        var leafColors = ['#228B22', '#32CD32', '#90EE90', '#98FB98'];
        for (var p = 0; p < 20; p++) {
            var leafX = ((p * 100 + time * 0.02) % (width + 50)) - 25 - cameraX * 0.3;
            var leafY = ((time * 0.03 + p * 60) % (height - 100));
            var leafRotation = time * 0.001 + p;
            var leafScale = 0.4 + (p % 3) * 0.1;

            ctx.save();
            ctx.translate(leafX, leafY);
            ctx.rotate(leafRotation);
            ctx.scale(leafScale, leafScale);
            ctx.fillStyle = leafColors[p % leafColors.length];
            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.quadraticCurveTo(10, 0, 0, 12);
            ctx.quadraticCurveTo(-10, 0, 0, -12);
            ctx.fill();
            ctx.restore();
        }

        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#FFE66D';
        for (var q = 0; q < 3; q++) {
            var rayX = ((q * 400) % (width + 300)) - 150 - cameraX * 0.08;
            ctx.beginPath();
            ctx.moveTo(rayX, 0);
            ctx.lineTo(rayX + 80, 0);
            ctx.lineTo(rayX + 150, height);
            ctx.lineTo(rayX + 70, height);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    function drawLevel(levelData, time) {
        if (!levelData) return;

        for (var i = 0; i < levelData.ropes.length; i++) {
            drawRope(levelData.ropes[i], time);
        }

        for (var j = 0; j < levelData.platforms.length; j++) {
            drawPlatform(levelData.platforms[j], time);
        }

        if (levelData.obstacles && levelData.obstacles.length > 0) {
            for (var k = 0; k < levelData.obstacles.length; k++) {
                drawObstacle(levelData.obstacles[k], time);
            }
        }

        if (levelData.wind && levelData.wind.enabled) {
            drawWindEffect(levelData.wind, time);
        }
    }

    function drawRope(rope, time) {
        var x = rope.x - cameraX;
        var y = rope.y - cameraY;

        if (x < -50 || x > width + 50) return;

        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - 20, y - 15, 40, 12);

        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);

        var sway = Math.sin(time * 0.001) * 8;
        for (var i = 0; i <= rope.length; i += 10) {
            var wobble = Math.sin(i * 0.03 + time * 0.002) * 3 + sway * (i / rope.length);
            ctx.lineTo(x + wobble, y + i);
        }
        ctx.stroke();

        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        for (var j = 0; j < rope.length; j += 8) {
            ctx.beginPath();
            ctx.moveTo(x - 3, y + j);
            ctx.lineTo(x + 3, y + j + 5);
            ctx.stroke();
        }

        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.arc(x, y + rope.length, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawPlatform(platform, time) {
        var x = platform.x - cameraX;
        var y = platform.y - cameraY;

        if (x > width + 50 || x + platform.width < -50) return;

        if (platform.type === 'opening' && !platform.isOpen) {
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 5]);
            ctx.strokeRect(x, y, platform.width, platform.height);
            ctx.setLineDash([]);
            return;
        }

        var gradient = ctx.createLinearGradient(x, y, x, y + platform.height);
        if (platform.type === 'start') {
            gradient.addColorStop(0, '#66BB6A');
            gradient.addColorStop(1, '#43A047');
        } else if (platform.type === 'end') {
            gradient.addColorStop(0, '#FFD54F');
            gradient.addColorStop(1, '#FF8F00');
        } else {
            gradient.addColorStop(0, '#A1887F');
            gradient.addColorStop(0.5, '#8D6E63');
            gradient.addColorStop(1, '#6D4C41');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, platform.width, platform.height);

        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 1;
        for (var i = 0; i < platform.width; i += 12) {
            ctx.beginPath();
            ctx.moveTo(x + i, y);
            ctx.lineTo(x + i, y + platform.height);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x, y + platform.height - 5, platform.width, 5);

        if (platform.type === 'start' || platform.type === 'end') {
            ctx.fillStyle = '#2E7D32';
            for (var g = 0; g < platform.width; g += 8) {
                var grassHeight = 6 + Math.sin(g * 0.1 + time * 0.001) * 3;
                ctx.fillRect(x + g, y - grassHeight, 3, grassHeight);
            }

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            var text = platform.type === 'start' ? '起点' : '终点';
            ctx.strokeText(text, x + platform.width / 2, y - 15);
            ctx.fillText(text, x + platform.width / 2, y - 15);

            if (platform.type === 'end') {
                ctx.fillStyle = '#5D4037';
                ctx.fillRect(x + platform.width / 2 - 2, y - 60, 4, 60);
                ctx.fillStyle = '#E53935';
                ctx.beginPath();
                ctx.moveTo(x + platform.width / 2 + 2, y - 55);
                ctx.lineTo(x + platform.width / 2 + 35, y - 40);
                ctx.lineTo(x + platform.width / 2 + 2, y - 30);
                ctx.closePath();
                ctx.fill();
            }
        }

        if (platform.type === 'opening') {
            ctx.strokeStyle = 'rgba(255, 193, 7, 0.8)';
            ctx.lineWidth = 3;
            ctx.strokeRect(x - 3, y - 3, platform.width + 6, platform.height + 6);
        }
    }

    function drawObstacle(obstacle, time) {
        if (!obstacle) return;
        if (obstacle.type === 'rock') {
            drawRock(obstacle);
        } else if (obstacle.type === 'wood') {
            drawWoodObstacle(obstacle);
        }
    }

    function drawRock(rock) {
        if (rock.currentX === undefined || rock.currentY === undefined) return;

        var x = rock.currentX - cameraX;
        var y = rock.currentY - cameraY;

        if (x < -60 || x > width + 60 || y < -60 || y > height + 60) return;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x + 5, y + rock.radius * 0.8, rock.radius * 0.8, rock.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        var gradient = ctx.createRadialGradient(
            x - rock.radius * 0.3, y - rock.radius * 0.3, 0,
            x, y, rock.radius
        );
        gradient.addColorStop(0, '#9E9E9E');
        gradient.addColorStop(0.5, '#757575');
        gradient.addColorStop(1, '#424242');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, rock.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x - rock.radius * 0.3, y - rock.radius * 0.4, rock.radius * 0.35, rock.radius * 0.25, -0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(50, 205, 50, 0.4)';
        ctx.beginPath();
        ctx.arc(x - rock.radius * 0.4, y + rock.radius * 0.3, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawWoodObstacle(wood) {
        if (wood.currentX === undefined || wood.currentY === undefined) return;

        var x = wood.currentX - cameraX;
        var y = wood.currentY - cameraY;

        if (x < -120 || x > width + 120) return;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x - wood.width / 2 + 4, y + wood.height / 2, wood.width, 5);

        var gradient = ctx.createLinearGradient(
            x - wood.width / 2, y,
            x + wood.width / 2, y
        );
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.5, '#A0522D');
        gradient.addColorStop(1, '#8B4513');

        ctx.fillStyle = gradient;
        ctx.fillRect(x - wood.width / 2, y - wood.height / 2, wood.width, wood.height);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        for (var i = 0; i < wood.width; i += 8) {
            ctx.beginPath();
            ctx.moveTo(x - wood.width / 2 + i, y - wood.height / 2);
            ctx.lineTo(x - wood.width / 2 + i, y + wood.height / 2);
            ctx.stroke();
        }

        ctx.fillStyle = '#6B4423';
        ctx.beginPath();
        ctx.ellipse(x - wood.width / 2, y, 4, wood.height / 2 + 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + wood.width / 2, y, 4, wood.height / 2 + 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawWindEffect(wind, time) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;

        for (var i = 0; i < 10; i++) {
            var yLine = 80 + i * 60 - cameraY * 0.2;
            if (yLine > 0 && yLine < height) {
                var offset = Math.sin(time * 0.003 + i * 0.5) * 30;
                var startX = wind.direction > 0 ? -100 - cameraX : width + 100 - cameraX;
                var endX = wind.direction > 0 ? width + 100 - cameraX : -100 - cameraX;

                ctx.beginPath();
                ctx.moveTo(startX + offset, yLine);
                ctx.quadraticCurveTo((startX + endX) / 2 + offset, yLine + 15, endX + offset, yLine);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    function drawPlayer(player, time) {
        if (!player) return;

        var x = player.x - cameraX;
        var y = player.y - cameraY;

        if (player.isSwinging && player.rope) {
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(player.rope.x - cameraX, player.rope.y - cameraY);
            ctx.quadraticCurveTo(
                (player.rope.x - cameraX + x) / 2,
                (player.rope.y - cameraY + y - player.height / 2) / 2 + 10,
                x, y - player.height / 2
            );
            ctx.stroke();
        }

        ctx.save();
        ctx.translate(x, y);

        if (player.isSwinging) {
            ctx.rotate(player.angle * 0.15);
        } else if (!player.onPlatform) {
            ctx.rotate(Math.max(-0.3, Math.min(0.3, player.vx * 0.015)));
        }

        drawCharacter(player, time);

        ctx.restore();

        if (player.isSwinging || player.power > 0) {
            drawPowerIndicator(x, y - player.height - 40, player.power);
        }
    }

    function drawCharacter(player, time) {
        var charType = player.characterType;
        var w = player.width;
        var h = player.height;

        if (charType === 'explorer') {
            drawExplorer(w, h, player, time);
        } else if (charType === 'girl') {
            drawGirl(w, h, player, time);
        } else if (charType === 'warrior') {
            drawWarrior(w, h, player, time);
        }
    }

    function drawExplorer(w, h, player, time) {
        var skinColor = player.skinColor || '#FFCC80';
        var hairColor = player.hairColor || '#4a3728';

        ctx.fillStyle = '#5D4037';
        ctx.fillRect(-w / 2 + 5, h / 4, w - 10, h / 3);

        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        var legSwing = player.onPlatform ? 0 : Math.sin(time * 0.005) * 5;
        ctx.beginPath();
        ctx.moveTo(-w / 4, h / 4 + h / 3);
        ctx.lineTo(-w / 4 + legSwing, h / 2 + 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w / 4, h / 4 + h / 3);
        ctx.lineTo(w / 4 - legSwing, h / 2 + 15);
        ctx.stroke();

        ctx.fillStyle = player.color || '#4a90d9';
        ctx.beginPath();
        ctx.moveTo(-w / 2, -h / 4);
        ctx.lineTo(w / 2, -h / 4);
        ctx.lineTo(w / 2 - 5, h / 4);
        ctx.lineTo(-w / 2 + 5, h / 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-w / 2 + 3, -h / 8, w - 6, 6);

        ctx.strokeStyle = player.color || '#4a90d9';
        ctx.lineWidth = 5;
        var armAngle = player.isSwinging ? -Math.PI / 2.5 : (player.onPlatform ? 0 : Math.sin(time * 0.004) * 0.4);
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 4, -h / 6);
        ctx.lineTo(-w / 2 - 5 + Math.cos(armAngle) * 12, -h / 6 + Math.sin(armAngle) * 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w / 2 - 4, -h / 6);
        ctx.lineTo(w / 2 + 5 - Math.cos(armAngle) * 12, -h / 6 + Math.sin(armAngle) * 12);
        ctx.stroke();

        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(0, -h / 3, 13, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = hairColor;
        ctx.beginPath();
        ctx.arc(0, -h / 3 - 4, 13, Math.PI, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, -h / 3 - 11, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-10, -h / 3 - 19, 20, 8);

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-4, -h / 3, 2.5, 0, Math.PI * 2);
        ctx.arc(4, -h / 3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -h / 3 + 4, 4, 0.3, Math.PI - 0.3);
        ctx.stroke();
    }

    function drawGirl(w, h, player, time) {
        var skinColor = player.skinColor || '#FFE0B2';
        var hairColor = player.hairColor || '#8D6E63';

        ctx.fillStyle = player.color || '#e91e63';
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 3, -h / 4);
        ctx.lineTo(w / 2 - 3, -h / 4);
        ctx.lineTo(w / 2 + 5, h / 4 + 6);
        ctx.lineTo(-w / 2 - 5, h / 4 + 6);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = skinColor;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        var legSwing = player.onPlatform ? 0 : Math.sin(time * 0.006) * 4;
        ctx.beginPath();
        ctx.moveTo(-w / 4, h / 4 + 6);
        ctx.lineTo(-w / 4 + legSwing, h / 2 + 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w / 4, h / 4 + 6);
        ctx.lineTo(w / 4 - legSwing, h / 2 + 12);
        ctx.stroke();

        ctx.strokeStyle = player.color || '#e91e63';
        ctx.lineWidth = 4;
        var armAngle = player.isSwinging ? -Math.PI / 2.5 : 0;
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 5, -h / 8);
        ctx.lineTo(-w / 2 - 8 + Math.cos(armAngle) * 10, -h / 8 + Math.sin(armAngle) * 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w / 2 - 5, -h / 8);
        ctx.lineTo(w / 2 + 8 - Math.cos(armAngle) * 10, -h / 8 + Math.sin(armAngle) * 10);
        ctx.stroke();

        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(0, -h / 3, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = hairColor;
        ctx.beginPath();
        ctx.arc(0, -h / 3 - 3, 13, Math.PI, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-13, -h / 3);
        ctx.quadraticCurveTo(-18, -h / 3 + 15, -9, -h / 3 + 22);
        ctx.lineTo(-7, -h / 3 + 14);
        ctx.quadraticCurveTo(-14, -h / 3 + 5, -10, -h / 3 - 3);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(13, -h / 3);
        ctx.quadraticCurveTo(18, -h / 3 + 15, 9, -h / 3 + 22);
        ctx.lineTo(7, -h / 3 + 14);
        ctx.quadraticCurveTo(14, -h / 3 + 5, 10, -h / 3 - 3);
        ctx.fill();

        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.arc(8, -h / 3 - 9, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-3, -h / 3, 2, 0, Math.PI * 2);
        ctx.arc(3, -h / 3, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
        ctx.beginPath();
        ctx.arc(-7, -h / 3 + 4, 4, 0, Math.PI * 2);
        ctx.arc(7, -h / 3 + 4, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -h / 3 + 5, 4, 0.3, Math.PI - 0.3);
        ctx.stroke();
    }

    function drawWarrior(w, h, player, time) {
        var skinColor = player.skinColor || '#FFAB91';
        var hairColor = player.hairColor || '#212121';

        ctx.fillStyle = '#3E2723';
        ctx.fillRect(-w / 2 + 3, h / 4, w - 6, h / 3);

        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        var legSwing = player.onPlatform ? 0 : Math.sin(time * 0.004) * 4;
        ctx.beginPath();
        ctx.moveTo(-w / 4, h / 4 + h / 3);
        ctx.lineTo(-w / 4 + legSwing, h / 2 + 18);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w / 4, h / 4 + h / 3);
        ctx.lineTo(w / 4 - legSwing, h / 2 + 18);
        ctx.stroke();

        ctx.fillStyle = '#5D4037';
        ctx.fillRect(-w / 3 - 3, h / 2 + 12, w / 1.5 + 6, 8);

        ctx.fillStyle = player.color || '#ff6b35';
        ctx.beginPath();
        ctx.moveTo(-w / 2 - 3, -h / 4);
        ctx.lineTo(w / 2 + 3, -h / 4);
        ctx.lineTo(w / 2, h / 4);
        ctx.lineTo(-w / 2, h / 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 3, -h / 4);
        ctx.lineTo(-w / 2 + 3, h / 4);
        ctx.lineTo(-w / 4, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = skinColor;
        ctx.lineWidth = 7;
        var armAngle = player.isSwinging ? -Math.PI / 2.5 : 0;
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 3, -h / 8);
        ctx.lineTo(-w / 2 - 10 + Math.cos(armAngle) * 12, -h / 8 + Math.sin(armAngle) * 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w / 2 - 3, -h / 8);
        ctx.lineTo(w / 2 + 10 - Math.cos(armAngle) * 12, -h / 8 + Math.sin(armAngle) * 12);
        ctx.stroke();

        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(0, -h / 3, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = hairColor;
        ctx.beginPath();
        ctx.arc(0, -h / 3 - 5, 15, Math.PI, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = hairColor;
        ctx.beginPath();
        ctx.moveTo(-10, -h / 3 - 6);
        ctx.lineTo(-13, -h / 3 + 5);
        ctx.lineTo(-8, -h / 3);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(10, -h / 3 - 6);
        ctx.lineTo(13, -h / 3 + 5);
        ctx.lineTo(8, -h / 3);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#4E342E';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-6, -h / 3 - 4);
        ctx.lineTo(-2, -h / 3 - 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(2, -h / 3 - 4);
        ctx.lineTo(6, -h / 3 - 4);
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-5, -h / 3, 3, 0, Math.PI * 2);
        ctx.arc(5, -h / 3, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-5, -h / 3 + 6);
        ctx.lineTo(5, -h / 3 + 6);
        ctx.stroke();

        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.ellipse(-15, h / 8, 5, 12, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(15, h / 8, 5, 12, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawPowerIndicator(x, y, power) {
        if (power <= 0) return;

        ctx.save();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x - 35, y - 5, 70, 12);

        var color;
        if (power < 0.33) {
            color = '#4CAF50';
        } else if (power < 0.66) {
            color = '#FFC107';
        } else {
            color = '#F44336';
        }

        ctx.fillStyle = color;
        ctx.fillRect(x - 33, y - 3, 66 * power, 8);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 35, y - 5, 70, 12);

        ctx.restore();
    }

    function drawTrail(trail) {
        if (!trail || trail.length < 2) return;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (var i = 1; i < trail.length; i++) {
            var alpha = (i / trail.length) * 0.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, ' + alpha + ')';
            ctx.lineWidth = (i / trail.length) * 5;
            ctx.beginPath();
            ctx.moveTo(trail[i - 1].x - cameraX, trail[i - 1].y - cameraY);
            ctx.lineTo(trail[i].x - cameraX, trail[i].y - cameraY);
            ctx.stroke();
        }
        ctx.restore();
    }

    return {
        init: init,
        resize: resize,
        setCamera: setCamera,
        drawBackground: drawBackground,
        drawLevel: drawLevel,
        drawPlayer: drawPlayer,
        drawTrail: drawTrail
    };
})();
