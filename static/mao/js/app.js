document.addEventListener('DOMContentLoaded', () => {
    initAnimations();
    initGame();
    bindEvents();
});

function bindEvents() {
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            applyTheme(btn.dataset.theme);
            updateActiveButtons();
        });
    });
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setMode(btn.dataset.mode);
            updateActiveButtons();
            if (gameState.drawMethod === 'wheel') {
                initWheelSegments(gameState.mode, gameState.difficulty);
            }
        });
    });
    
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setDifficulty(btn.dataset.difficulty);
            updateActiveButtons();
            if (gameState.drawMethod === 'wheel') {
                initWheelSegments(gameState.mode, gameState.difficulty);
            }
        });
    });
    
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setDrawMethod(btn.dataset.method);
            updateActiveButtons();
        });
    });
    
    document.getElementById('card').addEventListener('click', () => {
        if (gameState.drawMethod === 'card') {
            flipCard();
        }
    });
    
    document.getElementById('drawButton').addEventListener('click', () => {
        if (gameState.drawMethod === 'card') {
            flipCard();
        } else {
            doWheelSpin();
        }
    });
    
    document.getElementById('completeBtn').addEventListener('click', completeTask);
    document.getElementById('punishBtn').addEventListener('click', punishPlayer);
    document.getElementById('nextBtn').addEventListener('click', nextRound);
    
    document.getElementById('closePunishBtn').addEventListener('click', closePunishModal);
    
    document.getElementById('addPlayerBtn').addEventListener('click', showAddPlayerModal);
    document.getElementById('cancelPlayerBtn').addEventListener('click', hidePlayerModal);
    document.getElementById('confirmPlayerBtn').addEventListener('click', confirmAddPlayer);
    
    document.getElementById('addQuestionBtn').addEventListener('click', addCustomQuestionFromInput);
    document.getElementById('questionInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addCustomQuestionFromInput();
        }
    });
    
    document.getElementById('settingsBtn').addEventListener('click', () => {
        if (confirm('是否要重置游戏？')) {
            resetGame();
        }
    });
    
    document.getElementById('clearDataBtn').addEventListener('click', () => {
        if (confirm('确定要清除所有数据并重新加载吗？')) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    });
    
    handleShake();
}