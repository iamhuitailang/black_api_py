const Renderer = (function() {
    let canvas = null;
    let ctx = null;
    let width = 800;
    let height = 500;
    let currentLevel = null;
    let hoveredObject = null;
    let animationTime = 0;
    
    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
    }
    
    function resize() {
        const container = document.getElementById('game-container');
        const maxWidth = Math.min(container.clientWidth - 40, 900);
        const maxHeight = Math.min(container.clientHeight - 200, 600);
        
        const aspectRatio = 800 / 500;
        if (maxWidth / maxHeight > aspectRatio) {
            height = maxHeight;
            width = height * aspectRatio;
        } else {
            width = maxWidth;
            height = width / aspectRatio;
        }
        
        canvas.width = width;
        canvas.height = height;
    }
    
    function setLevel(level) {
        currentLevel = level;
    }
    
    function clear() {
        if (!ctx || !currentLevel) return;
        
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, currentLevel.background);
        gradient.addColorStop(1, shadeColor(currentLevel.background, -20));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        drawBackgroundPattern();
    }
    
    function drawBackgroundPattern() {
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = currentLevel.accentColor;
        ctx.lineWidth = 1;
        
        for (let i = 0; i < width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }
        
        for (let i = 0; i < height; i += 40) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    function renderObjects(objects, solvedPuzzles) {
        if (!ctx) return;
        
        animationTime += 0.016;
        
        const scaleX = width / 800;
        const scaleY = height / 500;
        
        objects.forEach(obj => {
            drawObject(obj, scaleX, scaleY, solvedPuzzles);
        });
    }
    
    function drawObject(obj, scaleX, scaleY, solvedPuzzles) {
        const x = obj.x * scaleX;
        const y = obj.y * scaleY;
        const w = obj.width * scaleX;
        const h = obj.height * scaleY;
        
        if (obj.revealCondition && !obj.revealed) {
            if (solvedPuzzles.includes(obj.revealCondition.replace('_solved', ''))) {
                obj.revealed = true;
            } else {
                return;
            }
        }
        
        if (obj.hidden && !obj.revealed && obj.type !== 'clue') {
            return;
        }
        
        ctx.save();
        
        const isHovered = hoveredObject && hoveredObject.id === obj.id;
        
        switch (obj.type) {
            case 'interactive':
                drawInteractiveObject(x, y, w, h, obj, isHovered);
                if (obj.children) {
                    obj.children.forEach(child => {
                        const childX = (obj.x + child.x) * scaleX;
                        const childY = (obj.y + child.y) * scaleY;
                        const childW = child.width * scaleX;
                        const childH = child.height * scaleY;
                        drawObjectChild(childX, childY, childW, childH, child, solvedPuzzles);
                    });
                }
                break;
            case 'item':
                drawItem(x, y, w, h, obj, isHovered);
                break;
            case 'clue':
                drawClue(x, y, w, h, obj, isHovered);
                break;
            case 'trap':
                drawTrap(x, y, w, h, obj, isHovered);
                break;
            case 'puzzle_trigger':
                drawPuzzleTrigger(x, y, w, h, obj, isHovered, solvedPuzzles);
                break;
            case 'exit':
                drawExit(x, y, w, h, obj, isHovered, solvedPuzzles);
                break;
            case 'area':
                drawArea(x, y, w, h, obj);
                break;
            default:
                drawDefault(x, y, w, h, obj, isHovered);
        }
        
        ctx.restore();
    }
    
    function drawObjectChild(x, y, w, h, obj, solvedPuzzles) {
        ctx.save();
        
        const isHovered = hoveredObject && hoveredObject.id === obj.id;
        
        switch (obj.type) {
            case 'drawer':
                drawDrawer(x, y, w, h, obj, isHovered, solvedPuzzles);
                break;
            case 'compartment':
                drawCompartment(x, y, w, h, obj, isHovered);
                break;
            case 'lock':
                drawLock(x, y, w, h, obj, isHovered, solvedPuzzles);
                break;
            default:
                drawDefault(x, y, w, h, obj, isHovered);
        }
        
        ctx.restore();
    }
    
    function drawInteractiveObject(x, y, w, h, obj, isHovered) {
        ctx.fillStyle = obj.color;
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = shadeColor(obj.color, 30);
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        
        ctx.fillStyle = shadeColor(obj.color, -15);
        ctx.fillRect(x + 10, y + 10, w - 20, h - 20);
        
        if (isHovered) {
            ctx.shadowColor = currentLevel.accentColor;
            ctx.shadowBlur = 20;
            ctx.strokeStyle = currentLevel.accentColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
        }
        
        ctx.fillStyle = shadeColor(obj.color, 50);
        ctx.font = `${Math.min(w, h) * 0.1}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(obj.name, x + w / 2, y + 25);
    }
    
    function drawDrawer(x, y, w, h, obj, isHovered, solvedPuzzles) {
        const isOpen = solvedPuzzles.includes(obj.puzzle);
        
        ctx.fillStyle = obj.color;
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = shadeColor(obj.color, 20);
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        
        ctx.fillStyle = shadeColor(obj.color, 40);
        ctx.fillRect(x + w / 2 - 20, y + h / 2 - 5, 40, 10);
        
        if (isOpen) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(x, y, w * 0.3, h);
        }
        
        if (isHovered && !isOpen) {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
        }
    }
    
    function drawCompartment(x, y, w, h, obj, isHovered) {
        ctx.fillStyle = obj.locked ? shadeColor(obj.color, -10) : shadeColor(obj.color, 20);
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = shadeColor(obj.color, 30);
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        
        if (obj.locked) {
            ctx.font = `${h * 0.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffd700';
            ctx.fillText('🔒', x + w / 2, y + h / 2);
        } else {
            ctx.font = `${h * 0.4}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#4ade80';
            ctx.fillText('📂', x + w / 2, y + h / 2);
        }
        
        if (isHovered) {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
        }
    }
    
    function drawLock(x, y, w, h, obj, isHovered, solvedPuzzles) {
        const isUnlocked = solvedPuzzles.includes(obj.puzzle);
        
        ctx.fillStyle = obj.color;
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = shadeColor(obj.color, 20);
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        
        ctx.font = `${h * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isUnlocked ? '🔓' : '🔐', x + w / 2, y + h / 2);
        
        if (isHovered && !isUnlocked) {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);
        }
    }
    
    function drawItem(x, y, w, h, obj, isHovered) {
        const item = Items.getItem(obj.itemId);
        if (!item) return;
        
        const pulse = Math.sin(animationTime * 3) * 3;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, Math.max(w, h) / 2 + pulse, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.font = `${Math.min(w, h) * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.icon, x + w / 2, y + h / 2);
        
        if (isHovered) {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 20 + pulse * 2;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, Math.max(w, h) / 2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    function drawClue(x, y, w, h, obj, isHovered) {
        ctx.fillStyle = obj.color;
        ctx.fillRect(x, y, w, h);
        
        if (obj.revealed) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = `${Math.min(w, h) * 0.25}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('📝', x + w / 2, y + h / 2);
        }
        
        if (isHovered) {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
        }
    }
    
    function drawTrap(x, y, w, h, obj, isHovered) {
        if (obj.triggered) {
            ctx.globalAlpha = 0.3;
        }
        
        ctx.fillStyle = obj.color;
        ctx.fillRect(x, y, w, h);
        
        ctx.font = `${Math.min(w, h) * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠️', x + w / 2, y + h / 2);
        
        if (isHovered && !obj.triggered) {
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
        }
    }
    
    function drawPuzzleTrigger(x, y, w, h, obj, isHovered, solvedPuzzles) {
        const isSolved = solvedPuzzles.includes(obj.puzzle);
        
        ctx.fillStyle = isSolved ? shadeColor(obj.color, 20) : obj.color;
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = shadeColor(obj.color, 30);
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        
        ctx.font = `${Math.min(w, h) * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isSolved ? '✅' : '❓', x + w / 2, y + h / 2);
        
        if (obj.locked && obj.requiredItem) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(x, y, w, h);
            ctx.font = `${Math.min(w, h) * 0.4}px Arial`;
            ctx.fillText('🔒', x + w / 2, y + h / 2);
        }
        
        if (isHovered && !isSolved && (!obj.locked || !obj.requiredItem)) {
            ctx.shadowColor = currentLevel.accentColor;
            ctx.shadowBlur = 15;
            ctx.strokeStyle = currentLevel.accentColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);
        }
    }
    
    function drawExit(x, y, w, h, obj, isHovered, solvedPuzzles) {
        const canExit = checkCanExit(obj, solvedPuzzles);
        
        const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
        gradient.addColorStop(0, obj.color);
        gradient.addColorStop(1, shadeColor(obj.color, 20));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = shadeColor(obj.color, 40);
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, w, h);
        
        ctx.fillStyle = shadeColor(obj.color, -20);
        ctx.fillRect(x + 10, y + 10, w - 20, h - 20);
        
        if (obj.locked && !canExit) {
            ctx.font = `${Math.min(w, h) * 0.3}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔒', x + w / 2, y + h / 2);
        } else {
            const glow = Math.sin(animationTime * 2) * 0.3 + 0.7;
            ctx.shadowColor = '#4ade80';
            ctx.shadowBlur = 30 * glow;
            ctx.fillStyle = `rgba(74, 222, 128, ${glow})`;
            ctx.fillRect(x + 15, y + 15, w - 30, h - 30);
            
            ctx.font = `${Math.min(w, h) * 0.25}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText('🚪', x + w / 2, y + h / 2);
        }
        
        if (isHovered) {
            ctx.shadowColor = canExit ? '#4ade80' : '#ef4444';
            ctx.shadowBlur = 20;
            ctx.strokeStyle = canExit ? '#4ade80' : '#ef4444';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);
        }
    }
    
    function drawArea(x, y, w, h, obj) {
        ctx.fillStyle = obj.color;
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = shadeColor(obj.color, 20);
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = `${Math.min(w, h) * 0.1}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(obj.name, x + w / 2, y + 30);
    }
    
    function drawDefault(x, y, w, h, obj, isHovered) {
        ctx.fillStyle = obj.color || '#666';
        ctx.fillRect(x, y, w, h);
        
        if (isHovered) {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
        }
    }
    
    function checkCanExit(exitObj, solvedPuzzles) {
        if (exitObj.requiredPuzzles) {
            return exitObj.requiredPuzzles.every(p => solvedPuzzles.includes(p));
        }
        return !exitObj.locked;
    }
    
    function setHoveredObject(obj) {
        hoveredObject = obj;
    }
    
    function getHoveredObject() {
        return hoveredObject;
    }
    
    function shadeColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + 
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }
    
    function screenToGame(screenX, screenY) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = 800 / width;
        const scaleY = 500 / height;
        return {
            x: (screenX - rect.left) * scaleX,
            y: (screenY - rect.top) * scaleY
        };
    }
    
    function getCanvas() {
        return canvas;
    }
    
    function getWidth() {
        return width;
    }
    
    function getHeight() {
        return height;
    }
    
    return {
        init,
        resize,
        setLevel,
        clear,
        renderObjects,
        setHoveredObject,
        getHoveredObject,
        screenToGame,
        getCanvas,
        getWidth,
        getHeight
    };
})();
