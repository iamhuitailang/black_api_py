(function() {
    'use strict';
    
    const DIFFICULTIES = {
        easy: { rows: 9, cols: 9, mines: 10 },
        medium: { rows: 16, cols: 16, mines: 40 },
        hard: { rows: 16, cols: 30, mines: 99 }
    };
    
    const NUMBER_COLORS = {
        1: '#FF6B6B',
        2: '#FFA94D',
        3: '#FFE066',
        4: '#69DB7C',
        5: '#4DABF7',
        6: '#9775FA',
        7: '#DA77F2',
        8: '#F783AC'
    };
    
    const CELL_SIZE = 32;
    const CELL_PADDING = 4;
    const CELL_ROUND = 8;
    
    let game = {
        state: 'menu',
        difficulty: 'easy',
        rows: 9,
        cols: 9,
        mines: 10,
        board: [],
        revealed: [],
        flagged: [],
        firstClick: true,
        firstClickRow: -1,
        firstClickCol: -1,
        timer: 0,
        timerInterval: null,
        score: 0,
        highScore: 0,
        remainingMines: 10,
        revealedCount: 0,
        virtualMode: 'normal'
    };
    
    let canvas, ctx;
    let elements = {};
    let longPressTimer = null;
    let longPressRow = -1, longPressCol = -1;
    let isLongPressTriggered = false;
    
    function init() {
        elements = {
            difficultySelector: document.getElementById('difficulty-selector'),
            gameCanvasContainer: document.getElementById('game-canvas-container'),
            controlButtons: document.getElementById('control-buttons'),
            virtualControls: document.getElementById('virtual-controls'),
            gameOverModal: document.getElementById('game-over-modal'),
            pauseModal: document.getElementById('pause-modal'),
            mineCount: document.getElementById('mine-count'),
            timer: document.getElementById('timer'),
            score: document.getElementById('score'),
            highScore: document.getElementById('high-score'),
            gameOverTitle: document.getElementById('game-over-title'),
            gameOverMessage: document.getElementById('game-over-message'),
            finalTime: document.getElementById('final-time'),
            finalScore: document.getElementById('final-score'),
            currentMode: document.getElementById('current-mode'),
            gameCanvas: document.getElementById('game-canvas')
        };
        
        canvas = elements.gameCanvas;
        ctx = canvas.getContext('2d');
        
        if (!ctx.roundRect) {
            ctx.roundRect = function(x, y, width, height, radius) {
                this.moveTo(x + radius, y);
                this.lineTo(x + width - radius, y);
                this.quadraticCurveTo(x + width, y, x + width, y + radius);
                this.lineTo(x + width, y + height - radius);
                this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                this.lineTo(x + radius, y + height);
                this.quadraticCurveTo(x, y + height, x, y + height - radius);
                this.lineTo(x, y + radius);
                this.quadraticCurveTo(x, y, x + radius, y);
            };
        }
        
        loadHighScore();
        bindEvents();
        loadGameState();
    }
    
    function bindEvents() {
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => startNewGame(btn.dataset.difficulty));
        });
        
        document.getElementById('btn-pause').addEventListener('click', pauseGame);
        document.getElementById('btn-restart').addEventListener('click', restartGame);
        document.getElementById('btn-new').addEventListener('click', () => {
            stopTimer();
            showDifficultySelector();
        });
        
        document.getElementById('btn-flag').addEventListener('click', () => setVirtualMode('flag'));
        document.getElementById('btn-quick-open').addEventListener('click', () => setVirtualMode('quick'));
        document.getElementById('btn-cancel').addEventListener('click', () => setVirtualMode('normal'));
        
        document.getElementById('btn-play-again').addEventListener('click', () => {
            hideGameOverModal();
            restartGame();
        });
        
        document.getElementById('btn-change-difficulty').addEventListener('click', () => {
            hideGameOverModal();
            stopTimer();
            showDifficultySelector();
        });
        
        document.getElementById('btn-resume').addEventListener('click', resumeGame);
        
        canvas.addEventListener('click', handleCanvasClick);
        canvas.addEventListener('contextmenu', handleCanvasRightClick);
        canvas.addEventListener('mousedown', handleCanvasMouseDown);
        canvas.addEventListener('mouseup', handleCanvasMouseUp);
        canvas.addEventListener('mouseleave', handleCanvasMouseLeave);
        canvas.addEventListener('touchstart', handleCanvasTouchStart, { passive: false });
        canvas.addEventListener('touchend', handleCanvasTouchEnd);
        canvas.addEventListener('touchleave', handleCanvasTouchLeave);
        canvas.addEventListener('touchmove', handleCanvasTouchMove);
        canvas.addEventListener('dblclick', handleCanvasDoubleClick);
        
        window.addEventListener('beforeunload', saveGameState);
    }
    
    function startNewGame(difficulty) {
        game.difficulty = difficulty;
        const config = DIFFICULTIES[difficulty];
        game.rows = config.rows;
        game.cols = config.cols;
        game.mines = config.mines;
        game.remainingMines = config.mines;
        game.revealedCount = 0;
        game.firstClick = true;
        game.firstClickRow = -1;
        game.firstClickCol = -1;
        game.timer = 0;
        game.score = 0;
        game.virtualMode = 'normal';
        game.state = 'playing';
        
        initBoard();
        resizeCanvas();
        updateUI();
        hideDifficultySelector();
        render();
        saveGameState();
    }
    
    function initBoard() {
        game.board = [];
        game.revealed = [];
        game.flagged = [];
        
        for (let r = 0; r < game.rows; r++) {
            game.board[r] = [];
            game.revealed[r] = [];
            game.flagged[r] = [];
            for (let c = 0; c < game.cols; c++) {
                game.board[r][c] = 0;
                game.revealed[r][c] = false;
                game.flagged[r][c] = false;
            }
        }
    }
    
    function placeMines(excludeRow, excludeCol) {
        let minesPlaced = 0;
        
        while (minesPlaced < game.mines) {
            const r = Math.floor(Math.random() * game.rows);
            const c = Math.floor(Math.random() * game.cols);
            
            if (game.board[r][c] === -1) continue;
            if (Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1) continue;
            
            game.board[r][c] = -1;
            minesPlaced++;
        }
        
        calculateNumbers();
    }
    
    function calculateNumbers() {
        for (let r = 0; r < game.rows; r++) {
            for (let c = 0; c < game.cols; c++) {
                if (game.board[r][c] === -1) continue;
                
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < game.rows && nc >= 0 && nc < game.cols) {
                            if (game.board[nr][nc] === -1) count++;
                        }
                    }
                }
                game.board[r][c] = count;
            }
        }
    }
    
    function resizeCanvas() {
        canvas.width = game.cols * CELL_SIZE;
        canvas.height = game.rows * CELL_SIZE;
    }
    
    function handleCanvasClick(e) {
        if (game.state !== 'playing') return;
        
        const pos = getCellPosition(e);
        if (!pos) return;
        
        const { row, col } = pos;
        
        if (game.virtualMode === 'flag') {
            toggleFlag(row, col);
        } else if (game.virtualMode === 'quick') {
            quickReveal(row, col);
        } else {
            revealCell(row, col);
        }
    }
    
    function handleCanvasRightClick(e) {
        e.preventDefault();
        if (game.state !== 'playing') return;
        
        const pos = getCellPosition(e);
        if (!pos) return;
        
        toggleFlag(pos.row, pos.col);
    }
    
    function handleCanvasDoubleClick(e) {
        if (game.state !== 'playing') return;
        
        const pos = getCellPosition(e);
        if (!pos) return;
        
        quickReveal(pos.row, pos.col);
    }
    
    function handleCanvasMouseDown(e) {
        if (game.state !== 'playing') return;
        if (e.button !== 0) return;
        
        const pos = getCellPosition(e);
        if (!pos) return;
        
        longPressRow = pos.row;
        longPressCol = pos.col;
        isLongPressTriggered = false;
        
        longPressTimer = setTimeout(() => {
            isLongPressTriggered = true;
            toggleFlag(longPressRow, longPressCol);
        }, 500);
    }
    
    function handleCanvasMouseUp(e) {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }
    
    function handleCanvasMouseLeave(e) {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }
    
    function handleCanvasTouchStart(e) {
        e.preventDefault();
        if (game.state !== 'playing') return;
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        const col = Math.floor(x / CELL_SIZE);
        const row = Math.floor(y / CELL_SIZE);
        
        if (row < 0 || row >= game.rows || col < 0 || col >= game.cols) return;
        
        longPressRow = row;
        longPressCol = col;
        isLongPressTriggered = false;
        
        longPressTimer = setTimeout(() => {
            isLongPressTriggered = true;
            toggleFlag(longPressRow, longPressCol);
        }, 500);
    }
    
    function handleCanvasTouchEnd(e) {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        
        if (!isLongPressTriggered && longPressRow >= 0) {
            if (game.virtualMode === 'flag') {
                toggleFlag(longPressRow, longPressCol);
            } else if (game.virtualMode === 'quick') {
                quickReveal(longPressRow, longPressCol);
            } else {
                revealCell(longPressRow, longPressCol);
            }
        }
        
        longPressRow = -1;
        longPressCol = -1;
    }
    
    function handleCanvasTouchLeave(e) {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }
    
    function handleCanvasTouchMove(e) {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }
    
    function getCellPosition(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.floor(x / CELL_SIZE);
        const row = Math.floor(y / CELL_SIZE);
        
        if (row < 0 || row >= game.rows || col < 0 || col >= game.cols) {
            return null;
        }
        
        return { row, col };
    }
    
    function revealCell(row, col) {
        if (game.revealed[row][col] || game.flagged[row][col]) return;
        
        if (game.firstClick) {
            game.firstClick = false;
            game.firstClickRow = row;
            game.firstClickCol = col;
            placeMines(row, col);
            startTimer();
        }
        
        if (game.board[row][col] === -1) {
            gameOver(false);
            return;
        }
        
        revealCellRecursive(row, col);
        checkWin();
        saveGameState();
    }
    
    function revealCellRecursive(row, col) {
        if (row < 0 || row >= game.rows || col < 0 || col >= game.cols) return;
        if (game.revealed[row][col] || game.flagged[row][col]) return;
        
        game.revealed[row][col] = true;
        game.revealedCount++;
        game.score += 10;
        
        if (game.board[row][col] === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    revealCellRecursive(row + dr, col + dc);
                }
            }
        }
        
        updateUI();
        render();
    }
    
    function toggleFlag(row, col) {
        if (game.revealed[row][col]) return;
        if (game.firstClick) return;
        
        game.flagged[row][col] = !game.flagged[row][col];
        
        if (game.flagged[row][col]) {
            game.remainingMines--;
        } else {
            game.remainingMines++;
        }
        
        updateUI();
        render();
        saveGameState();
    }
    
    function quickReveal(row, col) {
        if (!game.revealed[row][col]) {
            revealCell(row, col);
            return;
        }
        
        if (game.board[row][col] === 0) return;
        
        const value = game.board[row][col];
        let flagCount = 0;
        
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < game.rows && nc >= 0 && nc < game.cols) {
                    if (game.flagged[nr][nc]) flagCount++;
                }
            }
        }
        
        if (flagCount !== value) return;
        
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < game.rows && nc >= 0 && nc < game.cols) {
                    if (!game.revealed[nr][nc] && !game.flagged[nr][nc]) {
                        if (game.board[nr][nc] === -1) {
                            gameOver(false);
                            return;
                        }
                        revealCellRecursive(nr, nc);
                    }
                }
            }
        }
        
        checkWin();
        saveGameState();
    }
    
    function checkWin() {
        const totalCells = game.rows * game.cols;
        const safeCells = totalCells - game.mines;
        
        if (game.revealedCount === safeCells) {
            gameOver(true);
        }
    }
    
    function gameOver(win) {
        game.state = win ? 'won' : 'lost';
        stopTimer();
        
        if (win) {
            const timeBonus = Math.max(0, 1000 - game.timer * 10);
            game.score += timeBonus;
            
            if (game.score > game.highScore) {
                game.highScore = game.score;
                saveHighScore();
            }
        }
        
        for (let r = 0; r < game.rows; r++) {
            for (let c = 0; c < game.cols; c++) {
                if (game.board[r][c] === -1) {
                    game.revealed[r][c] = true;
                }
            }
        }
        
        render();
        showGameOverModal(win);
        saveGameState();
    }
    
    function setVirtualMode(mode) {
        game.virtualMode = mode;
        
        document.querySelectorAll('.virtual-btn').forEach(btn => btn.classList.remove('active'));
        
        if (mode === 'flag') {
            document.getElementById('btn-flag').classList.add('active');
            elements.currentMode.textContent = '插旗模式';
        } else if (mode === 'quick') {
            document.getElementById('btn-quick-open').classList.add('active');
            elements.currentMode.textContent = '快速翻开模式';
        } else {
            document.getElementById('btn-cancel').classList.add('active');
            elements.currentMode.textContent = '普通点击';
        }
        
        saveGameState();
    }
    
    function startTimer() {
        stopTimer();
        game.timerInterval = setInterval(() => {
            game.timer++;
            updateTimerDisplay();
            saveGameState();
        }, 1000);
    }
    
    function stopTimer() {
        if (game.timerInterval) {
            clearInterval(game.timerInterval);
            game.timerInterval = null;
        }
    }
    
    function updateTimerDisplay() {
        const minutes = Math.floor(game.timer / 60).toString().padStart(2, '0');
        const seconds = (game.timer % 60).toString().padStart(2, '0');
        elements.timer.textContent = `${minutes}:${seconds}`;
    }
    
    function pauseGame() {
        if (game.state !== 'playing') return;
        game.state = 'paused';
        stopTimer();
        elements.pauseModal.style.display = 'flex';
        saveGameState();
    }
    
    function resumeGame() {
        if (game.state !== 'paused') return;
        game.state = 'playing';
        elements.pauseModal.style.display = 'none';
        startTimer();
        saveGameState();
    }
    
    function restartGame() {
        game.firstClick = true;
        game.firstClickRow = -1;
        game.firstClickCol = -1;
        game.timer = 0;
        game.score = 0;
        game.remainingMines = game.mines;
        game.revealedCount = 0;
        game.virtualMode = 'normal';
        game.state = 'playing';
        
        initBoard();
        updateUI();
        setVirtualMode('normal');
        render();
        saveGameState();
    }
    
    function updateUI() {
        elements.mineCount.textContent = game.remainingMines;
        elements.score.textContent = game.score;
        elements.highScore.textContent = game.highScore;
        updateTimerDisplay();
    }
    
    function showDifficultySelector() {
        game.state = 'menu';
        elements.difficultySelector.style.display = 'block';
        elements.gameCanvasContainer.style.display = 'none';
        elements.controlButtons.style.display = 'none';
        elements.virtualControls.style.display = 'none';
        saveGameState();
    }
    
    function hideDifficultySelector() {
        elements.difficultySelector.style.display = 'none';
        elements.gameCanvasContainer.style.display = 'block';
        elements.controlButtons.style.display = 'flex';
        elements.virtualControls.style.display = 'block';
    }
    
    function showGameOverModal(win) {
        elements.gameOverTitle.textContent = win ? '🎉 恭喜获胜！' : '💥 游戏结束';
        elements.gameOverTitle.className = win ? 'win' : 'lose';
        elements.gameOverMessage.textContent = win ? 
            '太棒了！你成功找出了所有地雷！' : 
            '很遗憾，你踩到了地雷...';
        elements.finalTime.textContent = elements.timer.textContent;
        elements.finalScore.textContent = game.score;
        elements.gameOverModal.style.display = 'flex';
    }
    
    function hideGameOverModal() {
        elements.gameOverModal.style.display = 'none';
    }
    
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let r = 0; r < game.rows; r++) {
            for (let c = 0; c < game.cols; c++) {
                drawCell(r, c);
            }
        }
    }
    
    function drawCell(row, col) {
        const x = col * CELL_SIZE + CELL_PADDING;
        const y = row * CELL_SIZE + CELL_PADDING;
        const size = CELL_SIZE - CELL_PADDING * 2;
        
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, CELL_ROUND);
        
        if (game.revealed[row][col]) {
            ctx.fillStyle = '#e8edff';
            ctx.fill();
            
            const value = game.board[row][col];
            if (value === -1) {
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('💣', x + size / 2, y + size / 2);
            } else if (value > 0) {
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = NUMBER_COLORS[value];
                ctx.fillText(value.toString(), x + size / 2, y + size / 2);
            }
        } else {
            ctx.fillStyle = '#c9d6ff';
            ctx.fill();
            
            ctx.beginPath();
            ctx.roundRect(x + 2, y + 2, size - 4, size - 2, CELL_ROUND - 2);
            ctx.fillStyle = '#dbe4ff';
            ctx.fill();
            
            if (game.flagged[row][col]) {
                ctx.font = 'bold 18px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🚩', x + size / 2, y + size / 2);
            }
        }
    }
    
    function saveHighScore() {
        try {
            const scores = JSON.parse(localStorage.getItem('saolei_highscores') || '{}');
            scores[game.difficulty] = game.highScore;
            localStorage.setItem('saolei_highscores', JSON.stringify(scores));
        } catch (e) {
            console.error('Failed to save high score:', e);
        }
    }
    
    function loadHighScore() {
        try {
            const scores = JSON.parse(localStorage.getItem('saolei_highscores') || '{}');
            game.highScore = scores[game.difficulty] || 0;
            elements.highScore.textContent = game.highScore;
        } catch (e) {
            console.error('Failed to load high score:', e);
            game.highScore = 0;
        }
    }
    
    function saveGameState() {
        try {
            const state = {
                state: game.state,
                difficulty: game.difficulty,
                rows: game.rows,
                cols: game.cols,
                mines: game.mines,
                board: game.board,
                revealed: game.revealed,
                flagged: game.flagged,
                firstClick: game.firstClick,
                firstClickRow: game.firstClickRow,
                firstClickCol: game.firstClickCol,
                timer: game.timer,
                score: game.score,
                remainingMines: game.remainingMines,
                revealedCount: game.revealedCount,
                virtualMode: game.virtualMode,
                timestamp: Date.now()
            };
            
            localStorage.setItem('saolei_gamestate', JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save game state:', e);
        }
    }
    
    function loadGameState() {
        try {
            const saved = localStorage.getItem('saolei_gamestate');
            if (!saved) return;
            
            const state = JSON.parse(saved);
            
            const maxAge = 24 * 60 * 60 * 1000;
            if (state.timestamp && Date.now() - state.timestamp > maxAge) {
                localStorage.removeItem('saolei_gamestate');
                return;
            }
            
            game.state = state.state || 'menu';
            game.difficulty = state.difficulty || 'easy';
            game.rows = state.rows || 9;
            game.cols = state.cols || 9;
            game.mines = state.mines || 10;
            game.board = state.board || [];
            game.revealed = state.revealed || [];
            game.flagged = state.flagged || [];
            game.firstClick = state.firstClick !== false;
            game.firstClickRow = state.firstClickRow || -1;
            game.firstClickCol = state.firstClickCol || -1;
            game.timer = state.timer || 0;
            game.score = state.score || 0;
            game.remainingMines = state.remainingMines !== undefined ? state.remainingMines : game.mines;
            game.revealedCount = state.revealedCount || 0;
            game.virtualMode = state.virtualMode || 'normal';
            
            loadHighScore();
            
            if (game.state === 'playing' || game.state === 'won' || game.state === 'lost' || game.state === 'paused') {
                resizeCanvas();
                updateUI();
                hideDifficultySelector();
                setVirtualMode(game.virtualMode);
                render();
                
                if (game.state === 'playing') {
                    startTimer();
                } else if (game.state === 'paused') {
                    elements.pauseModal.style.display = 'flex';
                } else if (game.state === 'won' || game.state === 'lost') {
                    showGameOverModal(game.state === 'won');
                }
            }
        } catch (e) {
            console.error('Failed to load game state:', e);
        }
    }
    
    document.addEventListener('DOMContentLoaded', init);
})();
