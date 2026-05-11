var Renderer = (function() {
    'use strict';

    var canvas = null;
    var ctx = null;
    var width = 0;
    var height = 0;
    var hoverArea = null;
    var animationFrame = null;

    function init() {
        canvas = Utils.$('#game-canvas');
        if (!canvas) return;
        
        ctx = canvas.getContext('2d');
        resize();
        
        window.addEventListener('resize', Utils.debounce(resize, 100));
        
        startRenderLoop();
    }

    function resize() {
        var container = canvas.parentElement;
        width = container.clientWidth;
        height = container.clientHeight;
        
        canvas.width = width;
        canvas.height = height;
        
        render();
    }

    function startRenderLoop() {
        function loop() {
            render();
            animationFrame = requestAnimationFrame(loop);
        }
        animationFrame = requestAnimationFrame(loop);
    }

    function stopRenderLoop() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    }

    function setHoverArea(area) {
        hoverArea = area;
    }

    function render() {
        if (!ctx) return;
        
        var colors = Config.GAME_CONFIG.colors;
        var scene = Scenes.getCurrentScene();
        
        ctx.clearRect(0, 0, width, height);
        
        drawBackground(colors, scene);
        
        if (scene) {
            drawScene(scene, colors);
        }
    }

    function drawBackground(colors, scene) {
        var gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a0a0a');
        gradient.addColorStop(0.5, '#0d0505');
        gradient.addColorStop(1, '#1a1010');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        drawRoomStructure(colors);
        drawAtmosphere(colors);
    }

    function drawRoomStructure(colors) {
        ctx.fillStyle = '#2a1510';
        ctx.fillRect(0, height * 0.65, width, height * 0.35);
        
        ctx.strokeStyle = '#1a0a08';
        ctx.lineWidth = 2;
        var tileWidth = width / 12;
        var tileHeight = (height * 0.35) / 6;
        
        for (var row = 0; row < 6; row++) {
            for (var col = 0; col < 12; col++) {
                var x = col * tileWidth + (row % 2 === 0 ? 0 : tileWidth / 2);
                var y = height * 0.65 + row * tileHeight;
                ctx.strokeRect(x, y, tileWidth, tileHeight);
            }
        }
        
        ctx.fillStyle = '#1a0808';
        ctx.fillRect(0, 0, width, 40);
        ctx.fillRect(0, height * 0.25, width, 20);
        
        drawWallPattern(colors);
    }

    function drawWallPattern(colors) {
        ctx.fillStyle = 'rgba(42, 16, 16, 0.3)';
        var panelWidth = width / 8;
        var panelHeight = (height * 0.65) / 4;
        
        for (var row = 0; row < 4; row++) {
            for (var col = 0; col < 8; col++) {
                var x = col * panelWidth + 10;
                var y = 40 + row * panelHeight + 10;
                var w = panelWidth - 20;
                var h = panelHeight - 20;
                
                ctx.fillRect(x, y, w, h);
            }
        }
    }

    function drawAtmosphere(colors) {
        var gradient = ctx.createRadialGradient(
            width * 0.15, height * 0.6, 0,
            width * 0.15, height * 0.6, width * 0.4
        );
        gradient.addColorStop(0, 'rgba(255, 100, 30, 0.15)');
        gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.08)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        var vignette = ctx.createRadialGradient(
            width / 2, height / 2, width * 0.2,
            width / 2, height / 2, width * 0.7
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
    }

    function drawScene(scene, colors) {
        var areas = Scenes.getCurrentAreas();
        
        drawFireplace(colors);
        drawBookshelf(colors);
        drawPainting(colors);
        drawDesk(colors);
        drawCabinet(colors);
        drawSecretDoor(colors);
        
        areas.forEach(function(area) {
            drawArea(area, colors);
        });
        
        drawSceneDescription(scene, colors);
    }

    function drawFireplace(colors) {
        var x = width * 0.15;
        var y = height * 0.4;
        var w = width * 0.25;
        var h = height * 0.35;
        
        ctx.fillStyle = '#3a2015';
        ctx.fillRect(x, y, w, h);
        
        ctx.fillStyle = '#2a1510';
        ctx.fillRect(x - 15, y - 20, w + 30, 25);
        
        var innerX = x + w * 0.15;
        var innerY = y + h * 0.15;
        var innerW = w * 0.7;
        var innerH = h * 0.7;
        
        ctx.fillStyle = '#0a0505';
        ctx.fillRect(innerX, innerY, innerW, innerH);
        
        var fireGradient = ctx.createRadialGradient(
            innerX + innerW / 2, innerY + innerH * 0.8, 0,
            innerX + innerW / 2, innerY + innerH * 0.8, innerW * 0.5
        );
        fireGradient.addColorStop(0, 'rgba(255, 200, 50, 0.8)');
        fireGradient.addColorStop(0.3, 'rgba(255, 100, 0, 0.5)');
        fireGradient.addColorStop(0.6, 'rgba(200, 50, 0, 0.2)');
        fireGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = fireGradient;
        ctx.fillRect(innerX - 20, innerY, innerW + 40, innerH);
        
        ctx.fillStyle = '#2a1a15';
        ctx.fillRect(innerX + 10, innerY + innerH - 30, innerW - 20, 15);
        
        ctx.fillStyle = colors.accentDark;
        ctx.fillRect(x + w * 0.05, y + 10, 8, h - 10);
        ctx.fillRect(x + w - w * 0.05 - 8, y + 10, 8, h - 10);
    }

    function drawBookshelf(colors) {
        var x = width * 0.6;
        var y = height * 0.15;
        var w = width * 0.3;
        var h = height * 0.6;
        
        ctx.fillStyle = '#3a2015';
        ctx.fillRect(x, y, w, h);
        
        ctx.fillStyle = '#2a1510';
        ctx.fillRect(x - 10, y - 10, w + 20, 15);
        ctx.fillRect(x - 10, y + h, w + 20, 15);
        ctx.fillRect(x - 10, y, 10, h);
        ctx.fillRect(x + w, y, 10, h);
        
        var shelfHeight = h / 5;
        for (var i = 1; i < 5; i++) {
            ctx.fillStyle = '#4a2818';
            ctx.fillRect(x, y + i * shelfHeight, w, 8);
        }
        
        var bookColors = [
            '#8b0000', '#4a0000', '#2a0000', '#6a3000', '#8b4513',
            '#5a2d0a', '#3a1d0a', '#2a1508', '#7a3500', '#5a2500'
        ];
        
        var shelfBooks = [7, 6, 8, 5, 7];
        var bookWidths = [18, 22, 15, 20, 17, 19, 16, 21];
        
        for (var shelf = 0; shelf < 5; shelf++) {
            var bookY = y + shelf * shelfHeight + 15;
            var bookX = x + 15;
            var booksPerShelf = shelfBooks[shelf];
            
            for (var b = 0; b < booksPerShelf; b++) {
                var bookW = bookWidths[(shelf + b) % bookWidths.length];
                var bookH = shelfHeight - 35;
                var colorIndex = (shelf * 3 + b) % bookColors.length;
                
                ctx.fillStyle = bookColors[colorIndex];
                ctx.fillRect(bookX, bookY + (shelfHeight - 35 - bookH) / 2, bookW, bookH);
                
                ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
                ctx.fillRect(bookX, bookY + (shelfHeight - 35 - bookH) / 2, 3, bookH);
                
                bookX += bookW + 3;
                if (bookX > x + w - 20) break;
            }
        }
    }

    function drawPainting(colors) {
        var x = width * 0.38;
        var y = height * 0.12;
        var w = width * 0.18;
        var h = height * 0.32;
        
        ctx.fillStyle = '#5a3010';
        ctx.fillRect(x - 15, y - 15, w + 30, h + 30);
        
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
        
        ctx.fillStyle = '#3a2015';
        ctx.fillRect(x - 5, y - 5, w + 10, h + 10);
        
        var skyGradient = ctx.createLinearGradient(x, y, x, y + h);
        skyGradient.addColorStop(0, '#1a0a2a');
        skyGradient.addColorStop(0.5, '#2a1540');
        skyGradient.addColorStop(1, '#1a1020');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(x, y, w, h);
        
        ctx.beginPath();
        ctx.arc(x + w * 0.7, y + h * 0.25, w * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = '#f5f5dc';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w * 0.68, y + h * 0.24, w * 0.09, 0, Math.PI * 2);
        ctx.fillStyle = '#1a0a2a';
        ctx.fill();
        
        ctx.fillStyle = '#2a1508';
        ctx.beginPath();
        ctx.moveTo(x, y + h * 0.75);
        ctx.lineTo(x + w * 0.3, y + h * 0.55);
        ctx.lineTo(x + w * 0.5, y + h * 0.7);
        ctx.lineTo(x + w * 0.7, y + h * 0.5);
        ctx.lineTo(x + w, y + h * 0.65);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + w * 0.45, y + h * 0.03, w * 0.1, 3);
    }

    function drawDesk(colors) {
        var x = width * 0.08;
        var y = height * 0.12;
        var w = width * 0.22;
        var h = height * 0.28;
        
        ctx.fillStyle = '#3a2015';
        ctx.fillRect(x, y + h * 0.3, w, h * 0.1);
        
        ctx.fillStyle = '#5a3018';
        ctx.fillRect(x + w * 0.05, y + h * 0.4, w * 0.9, h * 0.5);
        
        ctx.fillStyle = '#2a1508';
        ctx.fillRect(x + w * 0.08, y + h * 0.45, w * 0.84, 3);
        
        ctx.fillStyle = '#4a2510';
        ctx.fillRect(x + 10, y + h * 0.15, w - 20, h * 0.18);
        
        ctx.fillStyle = '#2a1508';
        ctx.fillRect(x + w * 0.1, y + h * 0.2, w * 0.3, h * 0.08);
        ctx.fillRect(x + w * 0.5, y + h * 0.22, w * 0.25, h * 0.05);
        
        ctx.fillStyle = '#d4a574';
        ctx.fillRect(x + w * 0.55, y + h * 0.23, w * 0.15, h * 0.03);
    }

    function drawCabinet(colors) {
        var x = width * 0.04;
        var y = height * 0.48;
        var w = width * 0.1;
        var h = height * 0.42;
        
        ctx.fillStyle = '#3a2015';
        ctx.fillRect(x, y, w, h);
        
        ctx.fillStyle = '#4a2818';
        ctx.fillRect(x + 5, y + 5, w - 10, h * 0.45);
        ctx.fillRect(x + 5, y + h * 0.5, w - 10, h * 0.48);
        
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x + 5, y, w - 10, 5);
        ctx.fillRect(x + 5, y + h - 5, w - 10, 5);
        
        ctx.fillStyle = '#8b6914';
        ctx.beginPath();
        ctx.arc(x + w * 0.8, y + h * 0.25, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w * 0.8, y + h * 0.75, 4, 0, Math.PI * 2);
        ctx.fill();
        
        var isLocked = !Puzzles.isPuzzleCompleted('cabinet_diary');
        if (isLocked) {
            ctx.fillStyle = '#8b6914';
            ctx.fillRect(x + w * 0.1, y + h * 0.46, w * 0.8, 8);
            
            ctx.fillStyle = '#4a3010';
            ctx.fillRect(x + w * 0.4, y + h * 0.44, w * 0.2, 12);
            ctx.beginPath();
            ctx.arc(x + w * 0.5, y + h * 0.45, w * 0.1, Math.PI, 0);
            ctx.strokeStyle = '#4a3010';
            ctx.lineWidth = 4;
            ctx.stroke();
        }
    }

    function drawSecretDoor(colors) {
        if (!GameState.isAreaRevealed('secret_door')) return;
        
        var x = width * 0.88;
        var y = height * 0.28;
        var w = width * 0.08;
        var h = height * 0.52;
        
        ctx.fillStyle = '#2a1010';
        ctx.fillRect(x, y, w, h);
        
        ctx.fillStyle = '#1a0808';
        ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
        
        var gradient = ctx.createLinearGradient(x, y, x + w, y);
        gradient.addColorStop(0, 'rgba(124, 205, 124, 0.15)');
        gradient.addColorStop(0.5, 'rgba(124, 205, 124, 0.3)');
        gradient.addColorStop(1, 'rgba(124, 205, 124, 0.15)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, w, h);
        
        ctx.fillStyle = '#7ccd7c';
        ctx.font = 'bold 24px serif';
        ctx.textAlign = 'center';
        ctx.fillText('🚪', x + w / 2, y + h / 2);
    }

    function drawArea(area, colors) {
        var areaX = area.x * width;
        var areaY = area.y * height;
        var areaW = area.width * width;
        var areaH = area.height * height;
        
        var isHovered = hoverArea && hoverArea.id === area.id;
        var isInteractable = Scenes.isAreaInteractable(area);
        
        if (isHovered && isInteractable) {
            ctx.fillStyle = 'rgba(196, 30, 58, 0.2)';
            ctx.fillRect(areaX, areaY, areaW, areaH);
            
            ctx.strokeStyle = 'rgba(196, 30, 58, 0.6)';
            ctx.lineWidth = 3;
            ctx.strokeRect(areaX, areaY, areaW, areaH);
            
            drawAreaIndicator(areaX, areaY, areaW, areaH, area.name, colors);
        }
    }

    function drawAreaIndicator(x, y, w, h, name, colors) {
        ctx.font = '16px "Georgia", serif';
        ctx.textAlign = 'center';
        
        var textWidth = Math.max(ctx.measureText(name).width + 40, 100);
        var boxX = width / 2 - textWidth / 2;
        var boxY = 20;
        
        ctx.fillStyle = 'rgba(26, 8, 8, 0.95)';
        ctx.fillRect(boxX, boxY, textWidth, 32);
        
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, textWidth, 32);
        
        ctx.fillStyle = colors.gold;
        ctx.fillText(name, width / 2, boxY + 23);
    }

    function drawSceneDescription(scene, colors) {
        var padding = 20;
        var boxY = height - 80;
        var boxX = padding;
        var boxW = width - padding * 2;
        var boxH = 60;
        
        ctx.fillStyle = 'rgba(10, 5, 5, 0.85)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        
        ctx.strokeStyle = colors.accentDark;
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);
        
        ctx.fillStyle = colors.text;
        ctx.font = '18px "Georgia", serif';
        ctx.textAlign = 'center';
        
        var maxWidth = boxW - 40;
        var words = scene.description.split('');
        var line = '';
        var lines = [];
        
        for (var i = 0; i < words.length; i++) {
            var testLine = line + words[i];
            var metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && i > 0) {
                lines.push(line);
                line = words[i];
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        
        var lineHeight = 22;
        var startY = boxY + (boxH - lines.length * lineHeight) / 2 + 15;
        
        lines.forEach(function(lineText, index) {
            ctx.fillText(lineText, width / 2, startY + index * lineHeight);
        });
    }

    function getCanvasSize() {
        return { width: width, height: height };
    }

    return {
        init: init,
        resize: resize,
        render: render,
        setHoverArea: setHoverArea,
        getCanvasSize: getCanvasSize,
        startRenderLoop: startRenderLoop,
        stopRenderLoop: stopRenderLoop
    };
})();
