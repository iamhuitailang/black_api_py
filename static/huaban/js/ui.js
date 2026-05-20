const UI = (function() {
    const screens = {};
    let currentScreen = null;
    
    function init() {
        screens.mainMenu = document.getElementById('mainMenu');
        screens.characterSelect = document.getElementById('characterSelect');
        screens.howToPlay = document.getElementById('howToPlay');
        screens.gameHUD = document.getElementById('gameHUD');
        screens.pauseMenu = document.getElementById('pauseMenu');
        screens.gameOver = document.getElementById('gameOver');
        
        updateHighScore();
        renderCharacterList();
    }
    
    function showScreen(screenName) {
        for (const name in screens) {
            if (screens[name]) {
                screens[name].classList.remove('active');
            }
        }
        
        if (screens[screenName]) {
            screens[screenName].classList.add('active');
            currentScreen = screenName;
        }
    }
    
    function showOverlay(screenName) {
        if (screens[screenName]) {
            screens[screenName].classList.add('active');
        }
    }
    
    function hideOverlay(screenName) {
        if (screens[screenName]) {
            screens[screenName].classList.remove('active');
        }
    }
    
    function getCurrentScreen() {
        return currentScreen;
    }
    
    function updateScore(score) {
        const scoreEl = document.getElementById('score');
        if (scoreEl) {
            scoreEl.textContent = score.toLocaleString();
        }
    }
    
    function updateHighScore(mode = 'endless') {
        const highScore = Storage.getHighScore(mode);
        const highScoreEl = document.getElementById('highScore');
        const menuHighScoreEl = document.getElementById('menuHighScore');
        
        if (highScoreEl) {
            highScoreEl.textContent = highScore.toLocaleString();
        }
        if (menuHighScoreEl) {
            menuHighScoreEl.textContent = highScore.toLocaleString();
        }
    }
    
    function updateDistance(distance) {
        const distanceEl = document.getElementById('distance');
        if (distanceEl) {
            distanceEl.textContent = Math.floor(distance) + 'm';
        }
    }
    
    function updateTimer(time) {
        const timerEl = document.getElementById('timer');
        if (timerEl) {
            timerEl.textContent = Math.ceil(time);
        }
    }
    
    function showTimer(show) {
        const timerContainer = document.getElementById('timerContainer');
        if (timerContainer) {
            timerContainer.style.display = show ? 'flex' : 'none';
        }
    }
    
    function updateBoost(boost) {
        const boostFill = document.getElementById('boostFill');
        if (boostFill) {
            boostFill.style.width = boost + '%';
        }
    }
    
    function showCombo(combo) {
        const comboDisplay = document.getElementById('comboDisplay');
        if (comboDisplay) {
            if (combo > 1) {
                comboDisplay.textContent = combo + 'x 连击!';
                comboDisplay.classList.add('show');
                setTimeout(() => {
                    comboDisplay.classList.remove('show');
                }, 1000);
            }
        }
    }
    
    function showTrick(trickName, score) {
        const trickDisplay = document.getElementById('trickDisplay');
        if (trickDisplay) {
            trickDisplay.textContent = trickName + ' +' + score;
            trickDisplay.classList.remove('show');
            void trickDisplay.offsetWidth;
            trickDisplay.classList.add('show');
        }
    }
    
    function showTrickPopup(trickName, score, quality = '') {
        const popup = document.getElementById('trickPopup');
        if (popup) {
            let text = trickName;
            if (quality) {
                text += ' - ' + quality;
            }
            text += ' +' + score;
            
            popup.textContent = text;
            popup.classList.remove('show');
            void popup.offsetWidth;
            popup.classList.add('show');
            
            setTimeout(() => {
                popup.classList.remove('show');
            }, 1500);
        }
    }
    
    function showGameOver(score, highScore, distance, isNewRecord) {
        document.getElementById('finalScore').textContent = score.toLocaleString();
        document.getElementById('finalHighScore').textContent = highScore.toLocaleString();
        document.getElementById('finalDistance').textContent = Math.floor(distance) + 'm';
        
        const newRecordEl = document.getElementById('newRecord');
        if (newRecordEl) {
            newRecordEl.style.display = isNewRecord ? 'block' : 'none';
        }
        
        showOverlay('gameOver');
    }
    
    function hideGameOver() {
        hideOverlay('gameOver');
    }
    
    function showPauseMenu() {
        showOverlay('pauseMenu');
    }
    
    function hidePauseMenu() {
        hideOverlay('pauseMenu');
    }
    
    function renderCharacterList() {
        const characterList = document.getElementById('characterList');
        if (!characterList) return;
        
        characterList.innerHTML = '';
        
        const characters = Player.getAllCharacters();
        const selectedChar = Storage.getSelectedCharacter();
        
        for (const id in characters) {
            const char = characters[id];
            const isUnlocked = Storage.isCharacterUnlocked(id);
            const isSelected = id === selectedChar;
            
            const card = document.createElement('div');
            card.className = 'character-card';
            if (isSelected) card.classList.add('selected');
            if (!isUnlocked) card.classList.add('locked');
            
            card.innerHTML = `
                <div class="character-icon">${char.icon}</div>
                <div class="character-name">${char.name}</div>
                <div class="character-stats">
                    <div>速度: ${getStarRating(char.speed / 6.5)}</div>
                    <div>跳跃: ${getStarRating(char.jumpHeight)}</div>
                    <div>特技: ${getStarRating(char.trickBonus)}</div>
                </div>
                ${!isUnlocked ? `<div class="character-unlock">🔒 ${char.unlockCondition}</div>` : ''}
            `;
            
            if (isUnlocked) {
                card.addEventListener('click', () => selectCharacter(id));
            }
            
            characterList.appendChild(card);
        }
    }
    
    function getStarRating(value) {
        const maxStars = 5;
        const stars = Math.max(0, Math.min(maxStars, Math.round(value * maxStars)));
        return '★'.repeat(stars) + '☆'.repeat(maxStars - stars);
    }
    
    function selectCharacter(charId) {
        if (Storage.setSelectedCharacter(charId)) {
            renderCharacterList();
        }
    }
    
    function bindButtonEvents(callbacks) {
        console.log('🔗 正在绑定按钮事件...');
        
        const modeButtons = document.querySelectorAll('[data-mode]');
        console.log(`找到 ${modeButtons.length} 个游戏模式按钮`);
        
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mode = btn.dataset.mode;
                console.log(`🎮 点击了游戏模式: ${mode}`);
                if (callbacks.onStartGame) {
                    callbacks.onStartGame(mode);
                }
            });
        });
        
        const charBtn = document.getElementById('characterSelectBtn');
        if (charBtn) {
            charBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('👤 点击了选择角色按钮');
                showScreen('characterSelect');
                renderCharacterList();
            });
        }
        
        const howToBtn = document.getElementById('howToPlayBtn');
        if (howToBtn) {
            howToBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('📖 点击了操作说明按钮');
                showScreen('howToPlay');
            });
        }
        
        const backButtons = document.querySelectorAll('[data-back]');
        backButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const target = btn.dataset.back;
                console.log(`🔙 返回: ${target}`);
                showScreen(target);
            });
        });
        
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('⏸️ 点击了暂停按钮');
                if (callbacks.onPause) {
                    callbacks.onPause();
                }
            });
        }
        
        const resumeBtn = document.getElementById('resumeBtn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('▶️ 点击了继续按钮');
                if (callbacks.onResume) {
                    callbacks.onResume();
                }
            });
        }
        
        const restartBtns = document.querySelectorAll('#restartBtn, #playAgainBtn');
        restartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('🔄 点击了重新开始按钮');
                if (callbacks.onRestart) {
                    callbacks.onRestart();
                }
            });
        });
        
        const quitBtns = document.querySelectorAll('#quitBtn, #backToMenuBtn');
        quitBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('🚪 点击了退出按钮');
                if (callbacks.onQuit) {
                    callbacks.onQuit();
                }
            });
        });
        
        console.log('✅ 按钮事件绑定完成');
    }
    
    function showMessage(text, duration = 2000) {
        const popup = document.getElementById('trickPopup');
        if (popup) {
            popup.textContent = text;
            popup.classList.remove('show');
            void popup.offsetWidth;
            popup.classList.add('show');
            
            setTimeout(() => {
                popup.classList.remove('show');
            }, duration);
        }
    }
    
    return {
        init,
        showScreen,
        showOverlay,
        hideOverlay,
        getCurrentScreen,
        updateScore,
        updateHighScore,
        updateDistance,
        updateTimer,
        showTimer,
        updateBoost,
        showCombo,
        showTrick,
        showTrickPopup,
        showGameOver,
        hideGameOver,
        showPauseMenu,
        hidePauseMenu,
        renderCharacterList,
        bindButtonEvents,
        showMessage
    };
})();
