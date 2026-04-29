(function() {
    'use strict';

    const STORAGE_KEY = 'hongshui_game_state';

    const DIFFICULTY_CONFIG = {
        easy: {
            gridSize: 10,
            colorCount: 4,
            targetSteps: 15
        },
        normal: {
            gridSize: 14,
            colorCount: 5,
            targetSteps: 25
        },
        hard: {
            gridSize: 20,
            colorCount: 6,
            targetSteps: 35
        }
    };

    const COLOR_PALETTES = [
        ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
        ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
        ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
    ];

    let gameState = {
        difficulty: 'normal',
        grid: [],
        gridSize: 14,
        colorCount: 5,
        colors: [],
        currentSteps: 0,
        targetSteps: 25,
        isPlaying: false,
        isPaused: false,
        isVictory: false,
        selectedColor: null
    };

    let canvas, ctx;
    let cellSize;
    let animationFrameId = null;

    const elements = {
        difficulty: null,
        currentSteps: null,
        targetSteps: null,
        startBtn: null,
        pauseBtn: null,
        restartBtn: null,
        resumeBtn: null,
        pauseOverlay: null,
        colorPalette: null,
        victoryModal: null,
        victorySteps: null,
        victoryTarget: null,
        victoryRating: null,
        playAgainBtn: null
    };

    function init() {
        elements.difficulty = document.getElementById('difficulty');
        elements.currentSteps = document.getElementById('current-steps');
        elements.targetSteps = document.getElementById('target-steps');
        elements.startBtn = document.getElementById('start-btn');
        elements.pauseBtn = document.getElementById('pause-btn');
        elements.restartBtn = document.getElementById('restart-btn');
        elements.resumeBtn = document.getElementById('resume-btn');
        elements.pauseOverlay = document.getElementById('pause-overlay');
        elements.colorPalette = document.getElementById('color-palette');
        elements.victoryModal = document.getElementById('victory-modal');
        elements.victorySteps = document.getElementById('victory-steps');
        elements.victoryTarget = document.getElementById('victory-target');
        elements.victoryRating = document.getElementById('victory-rating');
        elements.playAgainBtn = document.getElementById('play-again-btn');

        canvas = document.getElementById('game-board');
        ctx = canvas.getContext('2d');

        loadGameState();
        bindEvents();
        
        if (gameState.isPlaying && gameState.grid.length > 0) {
            createColorPalette();
        }
        
        updateUI();
        renderCanvas();
        updateButtonStates();
        restoreGameOverlay();
    }

    function restoreGameOverlay() {
        if (gameState.isPaused) {
            elements.pauseOverlay.classList.remove('hidden');
        } else {
            elements.pauseOverlay.classList.add('hidden');
        }

        if (gameState.isVictory) {
            showVictoryModal();
        } else {
            hideVictoryModal();
        }
    }

    function loadGameState() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                gameState = { ...gameState, ...parsed };
                elements.difficulty.value = gameState.difficulty;
            } catch (e) {
                console.error('Failed to load game state:', e);
                resetGameState();
            }
        } else {
            resetGameState();
        }
    }

    function saveGameState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }

    function resetGameState() {
        const config = DIFFICULTY_CONFIG[gameState.difficulty];
        const paletteIndex = Math.min(config.colorCount - 4, COLOR_PALETTES.length - 1);
        
        gameState.grid = [];
        gameState.gridSize = config.gridSize;
        gameState.colorCount = config.colorCount;
        gameState.colors = COLOR_PALETTES[paletteIndex].slice(0, config.colorCount);
        gameState.currentSteps = 0;
        gameState.targetSteps = config.targetSteps;
        gameState.isPlaying = false;
        gameState.isPaused = false;
        gameState.isVictory = false;
        gameState.selectedColor = null;
    }

    function generateGrid() {
        const config = DIFFICULTY_CONFIG[gameState.difficulty];
        const grid = [];
        
        for (let i = 0; i < config.gridSize; i++) {
            grid[i] = [];
            for (let j = 0; j < config.gridSize; j++) {
                grid[i][j] = Math.floor(Math.random() * config.colorCount);
            }
        }

        let attempts = 0;
        while (attempts < 100) {
            const connectedCount = getConnectedRegionSize(grid, 0, 0, grid[0][0]);
            const requiredCount = Math.ceil(config.gridSize * config.gridSize * 0.1);
            
            if (connectedCount >= requiredCount) {
                break;
            }

            const colorIndex = grid[0][0];
            const positions = getConnectedRegion(grid, 0, 0, grid[0][0]);
            for (const pos of positions) {
                grid[pos.row][pos.col] = colorIndex;
            }

            const newPositions = getRandomAdjacentPositions(positions, config.gridSize);
            for (const pos of newPositions) {
                grid[pos.row][pos.col] = colorIndex;
            }
            
            attempts++;
        }

        return grid;
    }

    function getRandomAdjacentPositions(positions, gridSize) {
        const result = [];
        const visited = new Set();
        for (const pos of positions) {
            visited.add(`${pos.row},${pos.col}`);
        }

        for (const pos of positions) {
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of directions) {
                const newRow = pos.row + dr;
                const newCol = pos.col + dc;
                const key = `${newRow},${newCol}`;
                
                if (newRow >= 0 && newRow < gridSize && 
                    newCol >= 0 && newCol < gridSize && 
                    !visited.has(key) && 
                    Math.random() > 0.5) {
                    result.push({ row: newRow, col: newCol });
                    visited.add(key);
                }
            }
        }

        return result;
    }

    function getConnectedRegion(grid, startRow, startCol, colorIndex) {
        const result = [];
        const visited = new Set();
        const queue = [{ row: startRow, col: startCol }];
        const gridSize = grid.length;

        while (queue.length > 0) {
            const pos = queue.shift();
            const key = `${pos.row},${pos.col}`;

            if (visited.has(key)) continue;
            if (pos.row < 0 || pos.row >= gridSize || pos.col < 0 || pos.col >= gridSize) continue;
            if (grid[pos.row][pos.col] !== colorIndex) continue;

            visited.add(key);
            result.push(pos);

            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of directions) {
                queue.push({ row: pos.row + dr, col: pos.col + dc });
            }
        }

        return result;
    }

    function getConnectedRegionSize(grid, startRow, startCol, colorIndex) {
        return getConnectedRegion(grid, startRow, startCol, colorIndex).length;
    }

    function floodFill(newColorIndex) {
        const currentColor = gameState.grid[0][0];
        
        if (newColorIndex === currentColor) return;

        const connectedRegion = getConnectedRegion(gameState.grid, 0, 0, currentColor);
        
        for (const pos of connectedRegion) {
            gameState.grid[pos.row][pos.col] = newColorIndex;
        }

        gameState.currentSteps++;
        gameState.selectedColor = newColorIndex;
        
        saveGameState();
        updateUI();
        renderCanvas();

        checkVictory();
    }

    function checkVictory() {
        const firstColor = gameState.grid[0][0];
        
        for (let i = 0; i < gameState.gridSize; i++) {
            for (let j = 0; j < gameState.gridSize; j++) {
                if (gameState.grid[i][j] !== firstColor) {
                    return false;
                }
            }
        }

        gameState.isVictory = true;
        gameState.isPlaying = false;
        saveGameState();
        showVictoryModal();
        return true;
    }

    function calculateRating(steps, targetSteps) {
        const ratio = steps / targetSteps;
        
        if (ratio <= 0.7) {
            return { text: '完美！', class: 'rating-excellent' };
        } else if (ratio <= 1.0) {
            return { text: '很好！', class: 'rating-good' };
        } else {
            return { text: '继续加油！', class: 'rating-ok' };
        }
    }

    function showVictoryModal() {
        const rating = calculateRating(gameState.currentSteps, gameState.targetSteps);
        
        elements.victorySteps.textContent = gameState.currentSteps;
        elements.victoryTarget.textContent = gameState.targetSteps;
        elements.victoryRating.textContent = rating.text;
        
        elements.victoryRating.className = 'victory-value ' + rating.class;
        elements.victoryModal.classList.remove('hidden');
        
        updateButtonStates();
    }

    function hideVictoryModal() {
        elements.victoryModal.classList.add('hidden');
    }

    function startGame() {
        resetGameState();
        gameState.grid = generateGrid();
        gameState.isPlaying = true;
        gameState.isPaused = false;
        gameState.isVictory = false;
        
        saveGameState();
        updateUI();
        renderCanvas();
        createColorPalette();
        updateButtonStates();
    }

    function pauseGame() {
        if (!gameState.isPlaying || gameState.isPaused) return;
        
        gameState.isPaused = true;
        saveGameState();
        elements.pauseOverlay.classList.remove('hidden');
        updateButtonStates();
    }

    function resumeGame() {
        gameState.isPaused = false;
        saveGameState();
        elements.pauseOverlay.classList.add('hidden');
        updateButtonStates();
    }

    function restartGame() {
        if (gameState.grid.length > 0 && gameState.isPlaying) {
            startGame();
        }
    }

    function createColorPalette() {
        elements.colorPalette.innerHTML = '';
        
        gameState.colors.forEach((color, index) => {
            const button = document.createElement('button');
            button.className = 'color-btn';
            button.style.backgroundColor = color;
            button.dataset.colorIndex = index;
            
            button.addEventListener('click', function() {
                if (gameState.isPlaying && !gameState.isPaused && !gameState.isVictory) {
                    floodFill(index);
                }
            });
            
            elements.colorPalette.appendChild(button);
        });

        updateColorPaletteState();
    }

    function updateColorPaletteState() {
        const buttons = elements.colorPalette.querySelectorAll('.color-btn');
        const currentColor = gameState.grid.length > 0 ? gameState.grid[0][0] : -1;
        
        buttons.forEach((button, index) => {
            if (index === currentColor) {
                button.classList.add('disabled');
                button.disabled = true;
            } else {
                button.classList.remove('disabled');
                button.disabled = false;
            }
            
            if (index === gameState.selectedColor) {
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });
    }

    function updateUI() {
        elements.currentSteps.textContent = gameState.currentSteps;
        elements.targetSteps.textContent = gameState.targetSteps;
        elements.difficulty.value = gameState.difficulty;
        
        updateColorPaletteState();
    }

    function updateButtonStates() {
        const canStart = !gameState.isPlaying || gameState.isVictory;
        const canPause = gameState.isPlaying && !gameState.isPaused && !gameState.isVictory;
        const canRestart = gameState.isPlaying && !gameState.isVictory;

        elements.startBtn.disabled = !canStart;
        elements.pauseBtn.disabled = !canPause;
        elements.restartBtn.disabled = !canRestart;
    }

    function renderCanvas() {
        const config = DIFFICULTY_CONFIG[gameState.difficulty];
        const maxWidth = Math.min(500, window.innerWidth - 60);
        
        canvas.width = maxWidth;
        canvas.height = maxWidth;
        cellSize = maxWidth / config.gridSize;

        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (gameState.grid.length === 0) {
            return;
        }

        const padding = 2;
        for (let i = 0; i < gameState.gridSize; i++) {
            for (let j = 0; j < gameState.gridSize; j++) {
                const colorIndex = gameState.grid[i][j];
                const x = j * cellSize;
                const y = i * cellSize;
                
                ctx.fillStyle = gameState.colors[colorIndex];
                ctx.beginPath();
                ctx.roundRect(
                    x + padding, 
                    y + padding, 
                    cellSize - padding * 2, 
                    cellSize - padding * 2, 
                    4
                );
                ctx.fill();
            }
        }
    }

    function bindEvents() {
        elements.startBtn.addEventListener('click', startGame);
        elements.pauseBtn.addEventListener('click', pauseGame);
        elements.restartBtn.addEventListener('click', restartGame);
        elements.resumeBtn.addEventListener('click', resumeGame);
        elements.playAgainBtn.addEventListener('click', function() {
            hideVictoryModal();
            startGame();
        });

        elements.difficulty.addEventListener('change', function() {
            const newDifficulty = this.value;
            if (gameState.difficulty !== newDifficulty) {
                gameState.difficulty = newDifficulty;
                resetGameState();
                saveGameState();
                updateUI();
                renderCanvas();
                createColorPalette();
                updateButtonStates();
                restoreGameOverlay();
            }
        });

        window.addEventListener('resize', function() {
            renderCanvas();
        });

        document.addEventListener('keydown', function(e) {
            if (e.code === 'Space') {
                e.preventDefault();
                if (gameState.isPlaying && !gameState.isPaused && !gameState.isVictory) {
                    pauseGame();
                } else if (gameState.isPaused) {
                    resumeGame();
                }
            }
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
