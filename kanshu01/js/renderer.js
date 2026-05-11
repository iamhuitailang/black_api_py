const Renderer = (function() {
    let canvas = null;
    let ctx = null;
    let width = 0;
    let height = 0;
    let animationId = null;
    
    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
    }
    
    function resize() {
        const rect = canvas.getBoundingClientRect();
        width = rect.width * window.devicePixelRatio;
        height = rect.height * window.devicePixelRatio;
        canvas.width = width;
        canvas.height = height;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    
    function getWidth() {
        return canvas.getBoundingClientRect().width;
    }
    
    function getHeight() {
        return canvas.getBoundingClientRect().height;
    }
    
    function drawBackground() {
        const w = getWidth();
        const h = getHeight();
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#E0F7FA');
        gradient.addColorStop(1, '#90EE90');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        
        drawClouds();
        
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, h - 80, w, 80);
        
        ctx.fillStyle = '#7CB342';
        ctx.fillRect(0, h - 80, w, 10);
    }
    
    function drawClouds() {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const time = Date.now() * 0.0001;
        
        for (let i = 0; i < 3; i++) {
            const x = ((getTimeOffset(i) + time) % 1.2 - 0.1) * getWidth();
            const y = 60 + i * 50;
            drawCloud(x, y);
        }
        
        ctx.restore();
    }
    
    function getTimeOffset(i) {
        return i * 0.3;
    }
    
    function drawCloud(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.arc(x + 25, y - 10, 25, 0, Math.PI * 2);
        ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
        ctx.arc(x + 25, y + 10, 25, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawTree(gameState, playerData) {
        const w = getWidth();
        const h = getHeight();
        const treeX = w / 2;
        const treeSkin = Object.values(CONSTANTS.TREE_SKINS).find(t => t.id === playerData.equippedTree);
        const trunkColor = treeSkin ? treeSkin.trunkColor : '#8B4513';
        const leavesColor = treeSkin ? treeSkin.leavesColor : '#228B22';
        
        const bottomY = h - 80;
        const segmentHeight = CONSTANTS.GAME.SEGMENT_HEIGHT;
        const treeWidth = CONSTANTS.GAME.TREE_WIDTH;
        
        drawTreeLeaves(treeX, bottomY - CONSTANTS.GAME.VISUAL_SEGMENTS * segmentHeight - 40, leavesColor);
        
        const visibleSegments = gameState.segments.slice(0, CONSTANTS.GAME.VISUAL_SEGMENTS);
        
        visibleSegments.forEach((segment, index) => {
            const y = bottomY - (index + 1) * segmentHeight;
            
            drawTreeSegment(treeX, y, treeWidth, segmentHeight, trunkColor);
            
            if (segment.leftBranch) {
                drawBranch(treeX, y, SIDE.LEFT, segment.isBeehiveLeft);
            }
            if (segment.rightBranch) {
                drawBranch(treeX, y, SIDE.RIGHT, segment.isBeehiveRight);
            }
        });
        
        if (gameState.cutting) {
            drawCuttingEffect(treeX, bottomY, gameState.cutting);
        }
    }
    
    function drawTreeLeaves(x, y, color) {
        ctx.save();
        ctx.fillStyle = color;
        
        ctx.beginPath();
        ctx.moveTo(x, y - 60);
        ctx.lineTo(x - 60, y + 40);
        ctx.lineTo(x + 60, y + 40);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x, y - 30);
        ctx.lineTo(x - 50, y + 20);
        ctx.lineTo(x + 50, y + 20);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    function drawTreeSegment(x, y, width, height, color) {
        ctx.save();
        
        const gradient = ctx.createLinearGradient(x - width/2, y, x + width/2, y);
        gradient.addColorStop(0, adjustColor(color, -30));
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, adjustColor(color, -30));
        ctx.fillStyle = gradient;
        ctx.fillRect(x - width/2, y, width, height);
        
        ctx.strokeStyle = adjustColor(color, -50);
        ctx.lineWidth = 2;
        ctx.strokeRect(x - width/2, y, width, height);
        
        ctx.strokeStyle = adjustColor(color, -40);
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x - width/2 + 10 + i * 25, y);
            ctx.lineTo(x - width/2 + 10 + i * 25, y + height);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    function drawBranch(treeX, y, side, isBeehive) {
        ctx.save();
        const length = CONSTANTS.GAME.BRANCH_LENGTH;
        const branchHeight = CONSTANTS.GAME.BRANCH_HEIGHT;
        const direction = side === SIDE.LEFT ? -1 : 1;
        const startX = treeX + direction * (CONSTANTS.GAME.TREE_WIDTH / 2);
        
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.moveTo(startX, y + 10);
        ctx.lineTo(startX + direction * length, y + 5);
        ctx.lineTo(startX + direction * (length + 10), y + branchHeight/2);
        ctx.lineTo(startX + direction * length, y + branchHeight + 5);
        ctx.lineTo(startX, y + branchHeight + 10);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(startX + direction * (length + 10), y + branchHeight/2, 20, 0, Math.PI * 2);
        ctx.fill();
        
        if (isBeehive) {
            ctx.fillStyle = '#DAA520';
            ctx.beginPath();
            ctx.ellipse(startX + direction * (length - 20), y + 10, 15, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.ellipse(startX + direction * (length - 20), y + 5 + i * 8, 12, 4, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
    
    function drawCuttingEffect(treeX, bottomY, cutting) {
        ctx.save();
        const direction = cutting.side === SIDE.LEFT ? -1 : 1;
        const progress = cutting.progress;
        
        const axeX = treeX + direction * (CONSTANTS.GAME.TREE_WIDTH / 2 + 50) * (1 - progress * 0.5);
        const axeY = bottomY - CONSTANTS.GAME.SEGMENT_HEIGHT / 2 - progress * 20;
        const rotation = direction * (Math.PI / 4 - progress * Math.PI / 3);
        
        ctx.translate(axeX, axeY);
        ctx.rotate(rotation);
        
        drawAxe(cutting.axe);
        
        ctx.restore();
        
        if (progress > 0.3) {
            drawWoodChips(treeX + direction * CONSTANTS.GAME.TREE_WIDTH / 2, bottomY - CONSTANTS.GAME.SEGMENT_HEIGHT / 2, direction);
        }
    }
    
    function drawAxe(axeId) {
        ctx.save();
        const axe = Object.values(CONSTANTS.AXES).find(a => a.id === axeId);
        
        if (axeId === 'chainsaw') {
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(-40, -10, 70, 20);
            ctx.fillStyle = '#333';
            ctx.fillRect(-50, -15, 30, 30);
            ctx.fillStyle = '#888';
            ctx.fillRect(30, -5, 60, 10);
            
            ctx.fillStyle = '#FFD700';
            for (let i = 0; i < 6; i++) {
                const angle = (Date.now() * 0.01 + i) % (Math.PI * 2);
                ctx.beginPath();
                ctx.arc(40 + Math.cos(angle) * 25, Math.sin(angle) * 3, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-5, -3, 50, 6);
            
            const axeColor = axe ? CONSTANTS.COLORS.axe[axeId] : '#808080';
            ctx.fillStyle = axeColor;
            ctx.beginPath();
            ctx.moveTo(45, -15);
            ctx.lineTo(65, -8);
            ctx.lineTo(65, 8);
            ctx.lineTo(45, 15);
            ctx.lineTo(45, 3);
            ctx.lineTo(55, 0);
            ctx.lineTo(45, -3);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    function drawWoodChips(x, y, direction) {
        ctx.save();
        const time = Date.now() * 0.01;
        ctx.fillStyle = '#DEB887';
        
        for (let i = 0; i < 5; i++) {
            const angle = direction * (Math.PI / 3 + (i - 2) * 0.2) + time * 0.1;
            const distance = (time + i * 10) % 100;
            const chipX = x + Math.cos(angle) * distance;
            const chipY = y + Math.sin(angle) * distance - distance * 0.02;
            const size = 4 + Math.sin(time + i) * 2;
            
            ctx.beginPath();
            ctx.arc(chipX, chipY, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    function drawPlayer(side, axeId, gameState) {
        ctx.save();
        const w = getWidth();
        const h = getHeight();
        
        const treeCenterX = w / 2;
        const treeHalfWidth = CONSTANTS.GAME.TREE_WIDTH / 2;
        const treeLeftEdge = treeCenterX - treeHalfWidth;
        const treeRightEdge = treeCenterX + treeHalfWidth;
        
        const bodyWidth = 30;
        const bodyHalfWidth = bodyWidth / 2;
        const distanceFromTree = 100;
        
        let playerCenterX;
        let axeDirection;
        
        if (side === SIDE.LEFT) {
            playerCenterX = treeLeftEdge - distanceFromTree;
            axeDirection = 1;
        } else {
            playerCenterX = treeRightEdge + distanceFromTree;
            axeDirection = -1;
        }
        
        playerCenterX = Math.max(80, Math.min(w - 80, playerCenterX));
        
        const playerY = h - 80;
        
        const isActive = gameState && (
            (side === SIDE.LEFT && gameState.lastCutSide === SIDE.LEFT) ||
            (side === SIDE.RIGHT && gameState.lastCutSide === SIDE.RIGHT)
        );
        
        ctx.save();
        ctx.translate(playerCenterX, playerY);
        ctx.scale(axeDirection, 1);
        
        const bodyColor = isActive ? '#305AB5' : '#4169E1';
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-bodyHalfWidth, -80, bodyWidth, 50);
        
        ctx.fillStyle = '#FFDAB9';
        ctx.beginPath();
        ctx.arc(0, -95, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(axeDirection * 5, -97, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2F4F4F';
        ctx.fillRect(-12, -60, 10, 40);
        ctx.fillRect(2, -60, 10, 40);
        
        ctx.fillStyle = '#FFDAB9';
        ctx.save();
        ctx.translate(10, -70);
        ctx.rotate(-Math.PI / 12);
        ctx.fillRect(0, -3, 25, 6);
        ctx.restore();
        
        ctx.save();
        ctx.translate(30, -75);
        ctx.rotate(-Math.PI / 12);
        drawPlayerAxe(axeId, axeDirection);
        ctx.restore();
        
        ctx.restore();
        ctx.restore();
    }
    
    function drawPlayerAxe(axeId, direction) {
        ctx.save();
        
        if (axeId === 'chainsaw') {
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(-20, -6, 35, 12);
            ctx.fillStyle = '#333';
            ctx.fillRect(-25, -8, 18, 16);
            ctx.fillStyle = '#888';
            ctx.fillRect(15, -2, 25, 4);
            
            ctx.fillStyle = '#FFD700';
            for (let i = 0; i < 3; i++) {
                const angle = (Date.now() * 0.01 + i) % (Math.PI * 2);
                ctx.beginPath();
                ctx.arc(22 + Math.cos(angle) * 10, Math.sin(angle) * 2, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-2, -1.5, 28, 3);
            
            const axe = Object.values(CONSTANTS.AXES).find(a => a.id === axeId);
            const axeColor = axe ? CONSTANTS.COLORS.axe[axeId] : '#808080';
            ctx.fillStyle = axeColor;
            
            ctx.beginPath();
            ctx.moveTo(25, -8);
            ctx.lineTo(35, -4);
            ctx.lineTo(35, 4);
            ctx.lineTo(25, 8);
            ctx.lineTo(25, 2);
            ctx.lineTo(32, 0);
            ctx.lineTo(25, -2);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    function drawSquirrels(gameState) {
        ctx.save();
        const w = getWidth();
        const h = getHeight();
        const time = Date.now() * 0.003;
        
        gameState.squirrels = gameState.squirrels || [];
        
        gameState.squirrels.forEach((squirrel, index) => {
            const progress = squirrel.progress;
            const fromLeft = squirrel.fromLeft;
            
            const x = fromLeft ? 
                progress * (w / 2 - 150) :
                w / 2 + 150 + progress * (w / 2 - 150);
            const y = h - 120 + Math.sin(time * 5 + index) * 5;
            
            ctx.save();
            ctx.translate(x, y);
            if (!fromLeft) ctx.scale(-1, 1);
            
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(-25, -10, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(15, -5);
            ctx.quadraticCurveTo(35, -30, 25, -45);
            ctx.quadraticCurveTo(20, -30, 15, -15);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-28, -12, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        ctx.restore();
    }
    
    function drawBees(gameState) {
        ctx.save();
        const w = getWidth();
        const h = getHeight();
        const time = Date.now() * 0.005;
        
        gameState.bees = gameState.bees || [];
        
        gameState.bees.forEach((bee, index) => {
            const beeX = bee.x + Math.sin(time * 3 + index) * 20;
            const beeY = bee.y + Math.cos(time * 4 + index * 2) * 15;
            
            ctx.save();
            ctx.translate(beeX, beeY);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            const wingAngle = Math.sin(time * 20) * 0.3;
            ctx.save();
            ctx.rotate(wingAngle);
            ctx.beginPath();
            ctx.ellipse(-3, -8, 5, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            ctx.save();
            ctx.rotate(-wingAngle);
            ctx.beginPath();
            ctx.ellipse(3, -8, 5, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.ellipse(0, 0, 6, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(-6, -6 + i * 5, 12, 2);
            }
            
            ctx.restore();
        });
        
        if (gameState.bees && gameState.bees.length > 5) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(0, 0, w, h);
        }
        
        ctx.restore();
    }
    
    function drawPowerupEffects(gameState) {
        ctx.save();
        const w = getWidth();
        const h = getHeight();
        
        if (gameState.activePowerups && gameState.activePowerups.double) {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
            ctx.lineWidth = 3;
            ctx.strokeRect(10, 10, w - 20, h - 20);
        }
        
        if (gameState.activePowerups && gameState.activePowerups.shield) {
            const playerX = gameState.lastCutSide === SIDE.LEFT ? w / 2 - 150 : w / 2 + 150;
            const playerY = h - 130;
            
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(playerX, playerY, 60, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    function adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    function render(gameState, playerData) {
        ctx.clearRect(0, 0, getWidth(), getHeight());
        drawBackground();
        
        if (gameState.state === GAME_STATE.PLAYING || 
            gameState.state === GAME_STATE.PAUSED ||
            gameState.state === GAME_STATE.GAME_OVER) {
            drawTree(gameState, playerData);
            drawPlayer(SIDE.LEFT, playerData.equippedAxe, gameState);
            drawPlayer(SIDE.RIGHT, playerData.equippedAxe, gameState);
            drawSquirrels(gameState);
            drawBees(gameState);
            drawPowerupEffects(gameState);
        }
    }
    
    function startLoop(callback) {
        function loop() {
            if (callback) callback();
            animationId = requestAnimationFrame(loop);
        }
        animationId = requestAnimationFrame(loop);
    }
    
    function stopLoop() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }
    
    return {
        init,
        resize,
        getWidth,
        getHeight,
        render,
        startLoop,
        stopLoop
    };
})();