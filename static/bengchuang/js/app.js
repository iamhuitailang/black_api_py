(function() {
    let selectedChar = null;
    let initialized = false;

    function init() {
        if (initialized) return;
        initialized = true;
        
        const canvas = document.getElementById('gameCanvas');
        Renderer.init(canvas);
        Game.init();

        setupCharacterSelection();
        setupButtons();
        
        restoreUIFromStorage();
    }

    function restoreUIFromStorage() {
        const savedState = Storage.load();
        
        if (savedState.selectedCharacter) {
            selectedChar = savedState.selectedCharacter;
            highlightSelectedCard(savedState.selectedCharacter);
            enableStartButton();
        }

        const gameState = Game.getState();
        if (gameState.gameState === GAME_STATES.PLAYING && gameState.player1) {
            showGameCanvas();
            Game.gameLoop();
        } else if (gameState.gameState === GAME_STATES.GAME_OVER && gameState.winner) {
            showGameCanvas();
            showGameOverModal(gameState.winner);
        }
    }

    function setupCharacterSelection() {
        const cards = document.querySelectorAll('.character-card');
        
        cards.forEach(card => {
            card.addEventListener('click', function() {
                const charType = this.getAttribute('data-char');
                selectCharacter(charType, this);
            });
        });
    }

    function selectCharacter(charType, cardElement) {
        selectedChar = charType;
        
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        if (cardElement) {
            cardElement.classList.add('selected');
        } else {
            highlightSelectedCard(charType);
        }

        Game.selectCharacter(charType);
        enableStartButton();
    }

    function highlightSelectedCard(charType) {
        const card = document.querySelector(`.character-card[data-char="${charType}"]`);
        if (card) {
            card.classList.add('selected');
        }
    }

    function enableStartButton() {
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.classList.remove('disabled');
        }
    }

    function setupButtons() {
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', startGame);
        }

        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', restartGame);
        }

        const changeCharBtn = document.getElementById('changeCharBtn');
        if (changeCharBtn) {
            changeCharBtn.addEventListener('click', changeCharacter);
        }
    }

    function startGame() {
        if (!selectedChar) return;

        showGameCanvas();
        Game.startGame();
        
        updateGameStatus('对战中...');
    }

    function showGameCanvas() {
        const charSelect = document.getElementById('characterSelect');
        const gameCanvasContainer = document.getElementById('gameCanvasContainer');
        
        if (charSelect) {
            charSelect.style.display = 'none';
        }
        if (gameCanvasContainer) {
            gameCanvasContainer.style.display = 'block';
        }
    }

    function showCharacterSelect() {
        const charSelect = document.getElementById('characterSelect');
        const gameCanvasContainer = document.getElementById('gameCanvasContainer');
        const gameOverModal = document.getElementById('gameOverModal');
        
        if (charSelect) {
            charSelect.style.display = 'block';
        }
        if (gameCanvasContainer) {
            gameCanvasContainer.style.display = 'none';
        }
        if (gameOverModal) {
            gameOverModal.style.display = 'none';
        }
        
        updateGameStatus('选择角色开始游戏');
    }

    function restartGame() {
        const gameOverModal = document.getElementById('gameOverModal');
        if (gameOverModal) {
            gameOverModal.style.display = 'none';
        }
        
        Game.restartGame();
        updateGameStatus('对战中...');
    }

    function changeCharacter() {
        const gameOverModal = document.getElementById('gameOverModal');
        if (gameOverModal) {
            gameOverModal.style.display = 'none';
        }
        
        selectedChar = null;
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.classList.add('disabled');
        }
        
        Storage.clear();
        showCharacterSelect();
    }

    function updateGameStatus(text) {
        const statusElement = document.getElementById('gameStatus');
        if (statusElement) {
            statusElement.textContent = text;
        }
    }

    function checkGameOver() {
        const state = Game.getState();
        if (state.gameState === GAME_STATES.GAME_OVER && state.winner) {
            showGameOverModal(state.winner);
        }
    }

    function showGameOverModal(winner) {
        const modal = document.getElementById('gameOverModal');
        const winnerText = document.getElementById('winnerText');
        const winnerEmoji = document.getElementById('winnerEmoji');
        
        if (!modal) return;

        const state = Game.getState();
        
        if (winner === 'player') {
            winnerText.textContent = state.player1 ? state.player1.name + ' 获胜!' : '你获胜了!';
            winnerEmoji.textContent = '🎉';
            updateGameStatus('你赢了!');
        } else {
            winnerText.textContent = state.player2 ? state.player2.name + ' 获胜!' : 'AI获胜了!';
            winnerEmoji.textContent = '😢';
            updateGameStatus('再接再厉!');
        }

        modal.style.display = 'flex';
    }

    setInterval(checkGameOver, 100);

    document.addEventListener('DOMContentLoaded', init);

    if (document.readyState !== 'loading') {
        init();
    }
})();