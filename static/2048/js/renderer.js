var Renderer = (function() {
    'use strict';

    var canvas = null;
    var ctx = null;
    var floatScoresContainer = null;

    var CONFIG = {
        gridSize: 4,
        cellSize: 100,
        cellGap: 12,
        boardPadding: 12,
        borderRadius: 6,
        tileRadius: 4
    };

    var TILE_COLORS = {
        2: { bg: '#eee4da', text: '#776e65', fontSize: 48 },
        4: { bg: '#ede0c8', text: '#776e65', fontSize: 48 },
        8: { bg: '#f2b179', text: '#f9f6f2', fontSize: 48 },
        16: { bg: '#f59563', text: '#f9f6f2', fontSize: 46 },
        32: { bg: '#f67c5f', text: '#f9f6f2', fontSize: 46 },
        64: { bg: '#f65e3b', text: '#f9f6f2', fontSize: 46 },
        128: { bg: '#edcf72', text: '#f9f6f2', fontSize: 40 },
        256: { bg: '#edcc61', text: '#f9f6f2', fontSize: 40 },
        512: { bg: '#edc850', text: '#f9f6f2', fontSize: 40 },
        1024: { bg: '#edc53f', text: '#f9f6f2', fontSize: 32 },
        2048: { bg: '#edc22e', text: '#f9f6f2', fontSize: 32 }
    };

    var DARK_TILE_COLORS = {
        2: { bg: '#3d3d5c', text: '#e8e8e8', fontSize: 48 },
        4: { bg: '#4a4a6a', text: '#e8e8e8', fontSize: 48 },
        8: { bg: '#c28a4a', text: '#f9f6f2', fontSize: 48 },
        16: { bg: '#d47a4a', text: '#f9f6f2', fontSize: 46 },
        32: { bg: '#e06a4a', text: '#f9f6f2', fontSize: 46 },
        64: { bg: '#e85a4a', text: '#f9f6f2', fontSize: 46 },
        128: { bg: '#d4b04a', text: '#f9f6f2', fontSize: 40 },
        256: { bg: '#d4a83a', text: '#f9f6f2', fontSize: 40 },
        512: { bg: '#d4a02a', text: '#f9f6f2', fontSize: 40 },
        1024: { bg: '#d4981a', text: '#f9f6f2', fontSize: 32 },
        2048: { bg: '#d4900a', text: '#f9f6f2', fontSize: 32 }
    };

    var currentTheme = 'light';
    var currentGrid = null;
    var animatingTiles = [];
    var mergingTiles = [];
    var newTiles = [];

    function init(canvasElement, floatContainer) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        floatScoresContainer = floatContainer;
        resize();
        window.addEventListener('resize', Utils.debounce(resize, 100));
    }

    function resize() {
        if (!canvas) return;
        
        var container = canvas.parentElement;
        var containerWidth = container.clientWidth - CONFIG.boardPadding * 2;
        var maxSize = Math.min(containerWidth, 400);
        
        CONFIG.cellSize = Math.floor((maxSize - (CONFIG.gridSize - 1) * CONFIG.cellGap) / CONFIG.gridSize);
        
        var boardSize = CONFIG.cellSize * CONFIG.gridSize + CONFIG.cellGap * (CONFIG.gridSize - 1);
        canvas.width = boardSize;
        canvas.height = boardSize;
        
        render();
    }

    function setTheme(theme) {
        currentTheme = theme;
        render();
    }

    function getTileColors(value) {
        var colors = currentTheme === 'dark' ? DARK_TILE_COLORS : TILE_COLORS;
        if (value <= 2048 && colors[value]) {
            return colors[value];
        }
        
        var baseColor = currentTheme === 'dark' ? '#2a2a4a' : '#3c3a32';
        return {
            bg: baseColor,
            text: '#f9f6f2',
            fontSize: value >= 10000 ? 24 : value >= 1000 ? 28 : 32
        };
    }

    function getBoardColors() {
        if (currentTheme === 'dark') {
            return {
                background: '#0f0f23',
                cell: 'rgba(255, 255, 255, 0.08)'
            };
        }
        return {
            background: '#bbada0',
            cell: 'rgba(238, 228, 218, 0.35)'
        };
    }

    function getCellPosition(row, col) {
        return {
            x: col * (CONFIG.cellSize + CONFIG.cellGap),
            y: row * (CONFIG.cellSize + CONFIG.cellGap)
        };
    }

    function drawRoundRect(x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    function drawBoard() {
        var colors = getBoardColors();
        
        ctx.fillStyle = colors.background;
        drawRoundRect(0, 0, canvas.width, canvas.height, CONFIG.borderRadius);
        ctx.fill();

        for (var row = 0; row < CONFIG.gridSize; row++) {
            for (var col = 0; col < CONFIG.gridSize; col++) {
                var pos = getCellPosition(row, col);
                ctx.fillStyle = colors.cell;
                drawRoundRect(pos.x, pos.y, CONFIG.cellSize, CONFIG.cellSize, CONFIG.tileRadius);
                ctx.fill();
            }
        }
    }

    function drawTile(row, col, value, scale, offsetX, offsetY) {
        if (value === 0) return;

        var colors = getTileColors(value);
        var pos = getCellPosition(row, col);
        
        var x = pos.x + (offsetX || 0);
        var y = pos.y + (offsetY || 0);
        var scaleFactor = scale || 1;
        
        var scaledSize = CONFIG.cellSize * scaleFactor;
        var offset = (CONFIG.cellSize - scaledSize) / 2;
        
        ctx.save();
        ctx.translate(x + offset, y + offset);
        
        ctx.fillStyle = colors.bg;
        drawRoundRect(0, 0, scaledSize, scaledSize, CONFIG.tileRadius);
        ctx.fill();

        ctx.fillStyle = colors.text;
        ctx.font = 'bold ' + (colors.fontSize * scaleFactor) + 'px "Microsoft YaHei", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toString(), scaledSize / 2, scaledSize / 2);
        
        ctx.restore();
    }

    function render(grid) {
        if (grid) {
            currentGrid = grid;
        }
        
        if (!currentGrid) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBoard();

        for (var row = 0; row < CONFIG.gridSize; row++) {
            for (var col = 0; col < CONFIG.gridSize; col++) {
                var value = currentGrid[row][col];
                if (value !== 0) {
                    drawTile(row, col, value);
                }
            }
        }
    }

    function renderWithAnimation(grid, timestamp) {
        if (!grid) return;
        
        currentGrid = grid;
        var progress = Animator.getAnimationProgress(timestamp);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBoard();

        var tileAnimations = Animator.getTileAnimations();
        var mergeAnimations = Animator.getMergeAnimations();
        var newTileAnimations = Animator.getNewTileAnimations();

        var movingTiles = {};

        tileAnimations.forEach(function(anim) {
            var easedProgress = Animator.easeOutQuad(progress.move);
            var fromPos, toPos;
            
            if (anim.row !== null) {
                fromPos = getCellPosition(anim.row, anim.fromCol);
                toPos = getCellPosition(anim.row, anim.toCol);
            } else {
                fromPos = getCellPosition(anim.fromRow, anim.col);
                toPos = getCellPosition(anim.toRow, anim.col);
            }
            
            var offsetX = (toPos.x - fromPos.x) * easedProgress;
            var offsetY = (toPos.y - fromPos.y) * easedProgress;
            
            var key = (anim.row !== null ? anim.row + '-' + anim.fromCol : anim.fromRow + '-' + anim.col);
            movingTiles[key] = true;
            
            var value;
            if (anim.row !== null) {
                value = grid[anim.row][anim.toCol];
            } else {
                value = grid[anim.toRow][anim.col];
            }
            
            if (anim.row !== null) {
                drawTile(anim.row, anim.fromCol, value, 1, offsetX, offsetY);
            } else {
                drawTile(anim.fromRow, anim.col, value, 1, offsetX, offsetY);
            }
        });

        mergeAnimations.forEach(function(anim) {
            var easedProgress = Animator.easeOutQuad(progress.move);
            var mergeScale = 1 + (Animator.easeOutBack(progress.merge) * 0.2);
            
            var fromPos1, fromPos2, toPos;
            var value = anim.value;
            
            if (anim.row !== null) {
                fromPos1 = getCellPosition(anim.row, anim.fromCol1);
                fromPos2 = getCellPosition(anim.row, anim.fromCol2);
                toPos = getCellPosition(anim.row, anim.toCol);
                
                var offsetX1 = (toPos.x - fromPos1.x) * easedProgress;
                var offsetY1 = (toPos.y - fromPos1.y) * easedProgress;
                var offsetX2 = (toPos.x - fromPos2.x) * easedProgress;
                var offsetY2 = (toPos.y - fromPos2.y) * easedProgress;
                
                drawTile(anim.row, anim.fromCol1, value / 2, 1, offsetX1, offsetY1);
                drawTile(anim.row, anim.fromCol2, value / 2, 1, offsetX2, offsetY2);
                
                if (progress.move >= 1) {
                    drawTile(anim.row, anim.toCol, value, mergeScale);
                }
            } else {
                fromPos1 = getCellPosition(anim.fromRow1, anim.col);
                fromPos2 = getCellPosition(anim.fromRow2, anim.col);
                toPos = getCellPosition(anim.toRow, anim.col);
                
                var offsetX1 = (toPos.x - fromPos1.x) * easedProgress;
                var offsetY1 = (toPos.y - fromPos1.y) * easedProgress;
                var offsetX2 = (toPos.x - fromPos2.x) * easedProgress;
                var offsetY2 = (toPos.y - fromPos2.y) * easedProgress;
                
                drawTile(anim.fromRow1, anim.col, value / 2, 1, offsetX1, offsetY1);
                drawTile(anim.fromRow2, anim.col, value / 2, 1, offsetX2, offsetY2);
                
                if (progress.move >= 1) {
                    drawTile(anim.toRow, anim.col, value, mergeScale);
                }
            }
            
            var key1 = (anim.row !== null ? anim.row + '-' + anim.fromCol1 : anim.fromRow1 + '-' + anim.col);
            var key2 = (anim.row !== null ? anim.row + '-' + anim.fromCol2 : anim.fromRow2 + '-' + anim.col);
            movingTiles[key1] = true;
            movingTiles[key2] = true;
        });

        for (var row = 0; row < CONFIG.gridSize; row++) {
            for (var col = 0; col < CONFIG.gridSize; col++) {
                var value = grid[row][col];
                var key = row + '-' + col;
                
                if (value !== 0 && !movingTiles[key]) {
                    var isNewTile = false;
                    var newScale = 1;
                    
                    newTileAnimations.forEach(function(newAnim) {
                        if (newAnim.row === row && newAnim.col === col) {
                            isNewTile = true;
                            newScale = Animator.easeOutBack(progress.newTile);
                        }
                    });
                    
                    if (isNewTile && progress.newTile > 0) {
                        drawTile(row, col, value, newScale);
                    } else if (!isNewTile) {
                        drawTile(row, col, value);
                    }
                }
            }
        }
    }

    function showFloatScore(row, col, value) {
        if (!floatScoresContainer) return;

        var pos = getCellPosition(row, col);
        var scale = canvas.width / 400;
        
        var floatEl = Utils.createElement('div', 'float-score', '+' + value);
        floatEl.style.left = (pos.x + CONFIG.cellSize / 2) * scale + 'px';
        floatEl.style.top = (pos.y + CONFIG.cellSize / 2) * scale + 'px';
        floatEl.style.transform = 'translate(-50%, -50%)';
        
        floatScoresContainer.appendChild(floatEl);
        
        setTimeout(function() {
            Utils.removeElement(floatEl);
        }, 800);
    }

    function getConfig() {
        return CONFIG;
    }

    return {
        init: init,
        resize: resize,
        setTheme: setTheme,
        render: render,
        renderWithAnimation: renderWithAnimation,
        showFloatScore: showFloatScore,
        getConfig: getConfig,
        getCellPosition: getCellPosition
    };
})();
