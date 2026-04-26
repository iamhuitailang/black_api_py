(function() {
    'use strict';

    const STORAGE_KEY = 'jzq_game_state';

    const GameState = {
        NOT_STARTED: 'not_started',
        PLAYING: 'playing',
        PAUSED: 'paused',
        FINISHED: 'finished'
    };

    const Player = {
        X: 'X',
        O: 'O'
    };

    const Difficulty = {
        EASY: 'easy',
        MEDIUM: 'medium',
        HARD: 'hard'
    };

    const winPatterns = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    let game = {
        state: GameState.NOT_STARTED,
        board: Array(9).fill(null),
        currentPlayer: Player.X,
        difficulty: Difficulty.HARD,
        scores: {
            playerX: 0,
            playerO: 0,
            draws: 0
        },
        winStreak: 0,
        maxWinStreak: 0,
        gameTime: 0,
        lastSavedAt: null,
        winningCells: null,
        winner: null
    };

    let timerInterval = null;
    let canvas, ctx;
    let cellSize, padding;
    const BOARD_SIZE = 400;
    const CELL_COUNT = 3;

    let startScreen, gameMain, startBtn;
    let scoreXEl, scoreOEl, scoreDrawsEl;
    let gameTimeEl, winStreakEl;
    let currentPlayerEl;
    let pauseBtn, restartBtn, newGameBtn;
    let pauseOverlay, resumeBtn;
    let resultModal, modalIcon, modalTitle, modalMessage;
    let modalNewGameBtn, modalRestartBtn;
    let difficultySelect;
    let difficultyIndicator;

    function init() {
        cacheElements();
        setupCanvas();
        bindEvents();
        loadGameState();
        render();
    }

    function cacheElements() {
        startScreen = document.getElementById('startScreen');
        gameMain = document.getElementById('gameMain');
        startBtn = document.getElementById('startBtn');

        scoreXEl = document.getElementById('scoreX');
        scoreOEl = document.getElementById('scoreO');
        scoreDrawsEl = document.getElementById('scoreDraws');

        gameTimeEl = document.getElementById('gameTime');
        winStreakEl = document.getElementById('winStreak');

        currentPlayerEl = document.getElementById('currentPlayer');

        pauseBtn = document.getElementById('pauseBtn');
        restartBtn = document.getElementById('restartBtn');
        newGameBtn = document.getElementById('newGameBtn');

        pauseOverlay = document.getElementById('pauseOverlay');
        resumeBtn = document.getElementById('resumeBtn');

        resultModal = document.getElementById('resultModal');
        modalIcon = document.getElementById('modalIcon');
        modalTitle = document.getElementById('modalTitle');
        modalMessage = document.getElementById('modalMessage');
        modalNewGameBtn = document.getElementById('modalNewGameBtn');
        modalRestartBtn = document.getElementById('modalRestartBtn');

        difficultySelect = document.getElementById('difficultySelect');
        difficultyIndicator = document.getElementById('difficultyIndicator');

        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
    }

    function setupCanvas() {
        cellSize = BOARD_SIZE / CELL_COUNT;
        padding = cellSize * 0.15;
    }

    function bindEvents() {
        startBtn.addEventListener('click', startGame);
        canvas.addEventListener('click', handleCanvasClick);
        pauseBtn.addEventListener('click', pauseGame);
        resumeBtn.addEventListener('click', resumeGame);
        restartBtn.addEventListener('click', restartGame);
        newGameBtn.addEventListener('click', returnToStart);
        modalNewGameBtn.addEventListener('click', () => {
            hideResultModal();
            returnToStart();
        });
        modalRestartBtn.addEventListener('click', () => {
            hideResultModal();
            restartGame();
        });

        const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
        difficultyRadios.forEach(radio => {
            radio.addEventListener('change', handleDifficultyChange);
        });

        window.addEventListener('beforeunload', saveGameState);
    }

    function handleDifficultyChange(e) {
        game.difficulty = e.target.value;
        updateDifficultyIndicator();
        saveGameState();
    }

    function updateDifficultyIndicator() {
        if (difficultyIndicator) {
            const labels = {
                [Difficulty.EASY]: '简单',
                [Difficulty.MEDIUM]: '中等',
                [Difficulty.HARD]: '困难'
            };
            difficultyIndicator.textContent = labels[game.difficulty] || '困难';
        }
        
        const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
        difficultyRadios.forEach(radio => {
            radio.checked = (radio.value === game.difficulty);
        });
    }

    function getSelectedDifficulty() {
        const checked = document.querySelector('input[name="difficulty"]:checked');
        return checked ? checked.value : Difficulty.HARD;
    }

    function loadGameState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const state = JSON.parse(saved);
                if (state.game) {
                    game = { ...game, ...state.game };
                    
                    if (game.state === GameState.PLAYING || game.state === GameState.PAUSED) {
                        showGameScreen();
                        
                        if (game.state === GameState.PLAYING) {
                            startTimer();
                        } else if (game.state === GameState.PAUSED) {
                            pauseOverlay.style.display = 'flex';
                        }
                    } else if (game.state === GameState.FINISHED && game.winner) {
                        showGameScreen();
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load game state:', e);
        }
    }

    function saveGameState() {
        try {
            game.lastSavedAt = Date.now();
            const state = {
                game: game,
                savedAt: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save game state:', e);
        }
    }

    function startGame() {
        game.difficulty = getSelectedDifficulty();
        game.state = GameState.PLAYING;
        game.board = Array(9).fill(null);
        game.currentPlayer = Player.X;
        game.winningCells = null;
        game.winner = null;
        game.gameTime = 0;
        game.winStreak = 0;

        showGameScreen();
        startTimer();
        render();
        saveGameState();
    }

    function showGameScreen() {
        startScreen.style.display = 'none';
        gameMain.style.display = 'block';
        updateUI();
    }

    function pauseGame() {
        if (game.state !== GameState.PLAYING) return;
        
        game.state = GameState.PAUSED;
        stopTimer();
        pauseOverlay.style.display = 'flex';
        saveGameState();
    }

    function resumeGame() {
        if (game.state !== GameState.PAUSED) return;
        
        game.state = GameState.PLAYING;
        pauseOverlay.style.display = 'none';
        startTimer();
        saveGameState();
    }

    function restartGame() {
        stopTimer();
        hideResultModal();
        
        game.state = GameState.PLAYING;
        game.board = Array(9).fill(null);
        game.currentPlayer = Player.X;
        game.winningCells = null;
        game.winner = null;
        game.gameTime = 0;
        
        pauseOverlay.style.display = 'none';
        startTimer();
        render();
        updateUI();
        saveGameState();
    }

    function returnToStart() {
        stopTimer();
        hideResultModal();
        pauseOverlay.style.display = 'none';
        
        game.state = GameState.NOT_STARTED;
        game.board = Array(9).fill(null);
        game.currentPlayer = Player.X;
        game.winningCells = null;
        game.winner = null;
        game.gameTime = 0;
        game.winStreak = 0;
        
        startScreen.style.display = 'flex';
        gameMain.style.display = 'none';
        
        updateDifficultyIndicator();
        saveGameState();
    }

    function newGame() {
        stopTimer();
        hideResultModal();
        
        game.state = GameState.PLAYING;
        game.board = Array(9).fill(null);
        game.currentPlayer = Player.X;
        game.winningCells = null;
        game.winner = null;
        game.gameTime = 0;
        game.winStreak = 0;
        
        pauseOverlay.style.display = 'none';
        startTimer();
        render();
        updateUI();
        saveGameState();
    }

    function startTimer() {
        if (timerInterval) return;
        
        timerInterval = setInterval(() => {
            game.gameTime++;
            updateTimeDisplay();
            saveGameState();
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function updateTimeDisplay() {
        const minutes = Math.floor(game.gameTime / 60);
        const seconds = game.gameTime % 60;
        gameTimeEl.textContent = 
            String(minutes).padStart(2, '0') + ':' + 
            String(seconds).padStart(2, '0');
    }

    function handleCanvasClick(e) {
        if (game.state !== GameState.PLAYING) return;
        if (game.currentPlayer === Player.O) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        const index = row * CELL_COUNT + col;
        
        if (index >= 0 && index < 9 && game.board[index] === null) {
            makeMove(index);
        }
    }

    function makeMove(index) {
        if (game.board[index] !== null) return;
        
        game.board[index] = game.currentPlayer;
        render();
        
        const winResult = checkWin();
        if (winResult) {
            handleWin(winResult.winner, winResult.cells);
            return;
        }
        
        if (checkDraw()) {
            handleDraw();
            return;
        }
        
        game.currentPlayer = game.currentPlayer === Player.X ? Player.O : Player.X;
        updateTurnIndicator();
        saveGameState();
        
        if (game.currentPlayer === Player.O && game.state === GameState.PLAYING) {
            setTimeout(computerMove, 500);
        }
    }

    function getAvailableMoves(board) {
        const moves = [];
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                moves.push(i);
            }
        }
        return moves;
    }

    function checkWinForBoard(board) {
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return {
                    winner: board[a],
                    cells: pattern
                };
            }
        }
        return null;
    }

    function checkDrawForBoard(board) {
        return board.every(cell => cell !== null);
    }

    function checkWin() {
        return checkWinForBoard(game.board);
    }

    function checkDraw() {
        return checkDrawForBoard(game.board);
    }

    function findWinningMove(board, player) {
        const available = getAvailableMoves(board);
        for (const move of available) {
            const tempBoard = [...board];
            tempBoard[move] = player;
            const result = checkWinForBoard(tempBoard);
            if (result && result.winner === player) {
                return move;
            }
        }
        return null;
    }

    function evaluate(board) {
        const result = checkWinForBoard(board);
        if (result) {
            if (result.winner === Player.O) {
                return 10;
            } else {
                return -10;
            }
        }
        if (checkDrawForBoard(board)) {
            return 0;
        }
        return null;
    }

    function minimax(board, depth, isMaximizing, alpha, beta) {
        const score = evaluate(board);
        if (score !== null) {
            if (score === 10) return score - depth;
            if (score === -10) return score + depth;
            return score;
        }

        const available = getAvailableMoves(board);

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of available) {
                const tempBoard = [...board];
                tempBoard[move] = Player.O;
                const eval_ = minimax(tempBoard, depth + 1, false, alpha, beta);
                maxEval = Math.max(maxEval, eval_);
                alpha = Math.max(alpha, eval_);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of available) {
                const tempBoard = [...board];
                tempBoard[move] = Player.X;
                const eval_ = minimax(tempBoard, depth + 1, true, alpha, beta);
                minEval = Math.min(minEval, eval_);
                beta = Math.min(beta, eval_);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    function findBestMoveMinimax() {
        const available = getAvailableMoves(game.board);
        let bestMove = null;
        let bestScore = -Infinity;

        for (const move of available) {
            const tempBoard = [...game.board];
            tempBoard[move] = Player.O;
            const score = minimax(tempBoard, 0, false, -Infinity, Infinity);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    function findSmartMove() {
        const winMove = findWinningMove(game.board, Player.O);
        if (winMove !== null) {
            return winMove;
        }

        const blockMove = findWinningMove(game.board, Player.X);
        if (blockMove !== null) {
            return blockMove;
        }

        const available = getAvailableMoves(game.board);
        
        if (available.includes(4)) {
            return 4;
        }

        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(c => available.includes(c));
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }

        const sides = [1, 3, 5, 7];
        const availableSides = sides.filter(s => available.includes(s));
        if (availableSides.length > 0) {
            return availableSides[Math.floor(Math.random() * availableSides.length)];
        }

        return available[Math.floor(Math.random() * available.length)];
    }

    function computerMove() {
        if (game.state !== GameState.PLAYING) return;

        const available = getAvailableMoves(game.board);
        if (available.length === 0) return;

        let move;

        switch (game.difficulty) {
            case Difficulty.EASY:
                move = available[Math.floor(Math.random() * available.length)];
                break;

            case Difficulty.MEDIUM:
                const shouldUseSmart = Math.random() < 0.7;
                if (shouldUseSmart) {
                    move = findSmartMove();
                } else {
                    move = available[Math.floor(Math.random() * available.length)];
                }
                break;

            case Difficulty.HARD:
            default:
                const moveCount = game.board.filter(c => c !== null).length;
                if (moveCount <= 1) {
                    if (game.board[4] === null) {
                        move = 4;
                    } else {
                        const corners = [0, 2, 6, 8];
                        move = corners[Math.floor(Math.random() * corners.length)];
                    }
                } else {
                    move = findBestMoveMinimax();
                }
                break;
        }

        if (move !== null && game.board[move] === null) {
            makeMove(move);
        }
    }

    function handleWin(winner, cells) {
        game.state = GameState.FINISHED;
        game.winningCells = cells;
        game.winner = winner;
        stopTimer();
        
        if (winner === Player.X) {
            game.scores.playerX++;
            game.winStreak++;
            if (game.winStreak > game.maxWinStreak) {
                game.maxWinStreak = game.winStreak;
            }
        } else {
            game.scores.playerO++;
            game.winStreak = 0;
        }
        
        render();
        updateUI();
        showResultModal(winner === Player.X ? 'win' : 'lose', winner);
        saveGameState();
    }

    function handleDraw() {
        game.state = GameState.FINISHED;
        game.winner = 'draw';
        game.winStreak = 0;
        stopTimer();
        
        game.scores.draws++;
        
        updateUI();
        showResultModal('draw', null);
        saveGameState();
    }

    function showResultModal(type, winner) {
        modalIcon.className = 'modal-icon';
        
        if (type === 'win') {
            modalIcon.classList.add('win');
            modalIcon.textContent = '🎉';
            modalTitle.textContent = winner + '赢了！';
            modalMessage.textContent = '恭喜获胜！再接再厉！';
        } else if (type === 'lose') {
            modalIcon.classList.add('lose');
            modalIcon.textContent = '😔';
            modalTitle.textContent = winner + '赢了！';
            modalMessage.textContent = '电脑获胜，再来一局吧！';
        } else {
            modalIcon.classList.add('draw');
            modalIcon.textContent = '🤝';
            modalTitle.textContent = '平局！';
            modalMessage.textContent = '势均力敌，难分胜负！';
        }
        
        resultModal.style.display = 'flex';
    }

    function hideResultModal() {
        resultModal.style.display = 'none';
    }

    function updateUI() {
        scoreXEl.textContent = game.scores.playerX;
        scoreOEl.textContent = game.scores.playerO;
        scoreDrawsEl.textContent = game.scores.draws;
        
        winStreakEl.textContent = game.maxWinStreak;
        
        updateTimeDisplay();
        updateTurnIndicator();
        updateDifficultyIndicator();
    }

    function updateTurnIndicator() {
        currentPlayerEl.textContent = game.currentPlayer;
        currentPlayerEl.style.color = game.currentPlayer === Player.X ? '#c41e3a' : '#1a1a1a';
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawBoard();
        drawPieces();
        drawWinningHighlight();
    }

    function drawBoard() {
        ctx.strokeStyle = '#2d2d2d';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(cellSize, padding / 2);
        ctx.lineTo(cellSize, BOARD_SIZE - padding / 2);
        ctx.moveTo(cellSize * 2, padding / 2);
        ctx.lineTo(cellSize * 2, BOARD_SIZE - padding / 2);
        ctx.moveTo(padding / 2, cellSize);
        ctx.lineTo(BOARD_SIZE - padding / 2, cellSize);
        ctx.moveTo(padding / 2, cellSize * 2);
        ctx.lineTo(BOARD_SIZE - padding / 2, cellSize * 2);
        ctx.stroke();
        
        drawCorners();
    }

    function drawCorners() {
        const cornerSize = 20;
        ctx.strokeStyle = '#2d2d2d';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(padding, cornerSize);
        ctx.lineTo(padding, padding);
        ctx.lineTo(cornerSize, padding);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(BOARD_SIZE - cornerSize, padding);
        ctx.lineTo(BOARD_SIZE - padding, padding);
        ctx.lineTo(BOARD_SIZE - padding, cornerSize);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(padding, BOARD_SIZE - cornerSize);
        ctx.lineTo(padding, BOARD_SIZE - padding);
        ctx.lineTo(cornerSize, BOARD_SIZE - padding);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(BOARD_SIZE - cornerSize, BOARD_SIZE - padding);
        ctx.lineTo(BOARD_SIZE - padding, BOARD_SIZE - padding);
        ctx.lineTo(BOARD_SIZE - padding, BOARD_SIZE - cornerSize);
        ctx.stroke();
    }

    function drawPieces() {
        for (let i = 0; i < 9; i++) {
            if (game.board[i]) {
                const row = Math.floor(i / CELL_COUNT);
                const col = i % CELL_COUNT;
                const x = col * cellSize + cellSize / 2;
                const y = row * cellSize + cellSize / 2;
                
                if (game.board[i] === Player.X) {
                    drawX(x, y);
                } else {
                    drawO(x, y);
                }
            }
        }
    }

    function drawX(x, y) {
        const size = cellSize * 0.35;
        
        ctx.strokeStyle = '#c41e3a';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x - size, y - size);
        ctx.lineTo(x + size, y + size);
        ctx.moveTo(x + size, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(196, 30, 58, 0.3)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(x - size, y - size);
        ctx.lineTo(x + size, y + size);
        ctx.moveTo(x + size, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.stroke();
    }

    function drawO(x, y) {
        const radius = cellSize * 0.3;
        
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 4;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(26, 26, 26, 0.3)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    function drawWinningHighlight() {
        if (!game.winningCells) return;
        
        ctx.fillStyle = 'rgba(34, 139, 34, 0.2)';
        ctx.strokeStyle = '#228b22';
        ctx.lineWidth = 3;
        
        for (const cellIndex of game.winningCells) {
            const row = Math.floor(cellIndex / CELL_COUNT);
            const col = cellIndex % CELL_COUNT;
            const x = col * cellSize + padding;
            const y = row * cellSize + padding;
            const size = cellSize - padding * 2;
            
            ctx.fillRect(x, y, size, size);
            ctx.strokeRect(x, y, size, size);
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
