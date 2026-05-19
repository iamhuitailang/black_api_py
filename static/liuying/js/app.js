const App = (function() {
    let selectedMode = 'level';
    let selectedDimension = 'color';
    let isAnswered = false;
    let currentResult = null;

    const elements = {};

    function init() {
        console.log('App.init 开始');
        cacheElements();
        AudioManager.init();
        ThemeManager.init();
        GameState.init();
        Renderer.init();
        
        const currentTheme = ThemeManager.getCurrentTheme();
        console.log('当前主题:', currentTheme);
        Renderer.setTheme(currentTheme);
        
        bindEvents();
        updateUI();
        updateMenuUI();
        
        GameState.subscribe(onStateChange);
        
        const savedState = GameState.getState();
        console.log('保存的游戏状态:', savedState);
        
        if (savedState.isPlaying) {
            console.log('检测到进行中的游戏，开始恢复...');
            selectedMode = savedState.mode;
            selectedDimension = savedState.dimension;
            isAnswered = false;
            currentResult = null;
            
            const currentClothes = GameState.getCurrentClothes();
            if (!currentClothes) {
                console.log('当前衣物不存在，重新获取下一件');
                GameState.nextClothes();
            }
            
            showScreen('game');
            renderCurrentClothes();
            
            if (savedState.mode === 'challenge') {
                elements.timerContainer.style.display = 'flex';
            } else {
                elements.timerContainer.style.display = 'none';
            }
            
            Renderer.setTheme(ThemeManager.getCurrentTheme());
            Renderer.start();
            updateUI();
            
            console.log('游戏状态恢复完成！分数:', savedState.score, '生命:', savedState.lives);
        } else {
            console.log('没有进行中的游戏，显示菜单');
        }
        
        Storage.checkThemeUnlocks();
        console.log('App.init 完成');
    }

    function cacheElements() {
        elements.menuScreen = document.getElementById('menu-screen');
        elements.gameScreen = document.getElementById('game-screen');
        elements.resultScreen = document.getElementById('result-screen');
        
        elements.scoreEl = document.getElementById('score');
        elements.comboEl = document.getElementById('combo');
        elements.livesEl = document.getElementById('lives');
        elements.timerEl = document.getElementById('timer');
        elements.timerContainer = document.getElementById('timer-container');
        elements.levelEl = document.getElementById('level');
        elements.progressEl = document.getElementById('progress');
        
        elements.clothesIcon = document.getElementById('clothes-icon');
        elements.clothesName = document.getElementById('clothes-name');
        elements.clothesTags = document.getElementById('clothes-tags');
        elements.clothesDifficulty = document.getElementById('clothes-difficulty');
        elements.categoryButtons = document.getElementById('category-buttons');
        elements.feedback = document.getElementById('feedback');
        elements.nextBtn = document.getElementById('next-btn');
        
        elements.resultTitle = document.getElementById('result-title');
        elements.finalScore = document.getElementById('final-score');
        elements.correctCount = document.getElementById('correct-count');
        elements.wrongCount = document.getElementById('wrong-count');
        elements.maxCombo = document.getElementById('max-combo');
        elements.accuracy = document.getElementById('accuracy');
        elements.retryBtn = document.getElementById('retry-btn');
        elements.menuBtn = document.getElementById('menu-btn');
        
        elements.modeButtons = document.querySelectorAll('.mode-btn');
        elements.dimButtons = document.querySelectorAll('.dim-btn');
        elements.themeButtons = document.querySelectorAll('.theme-btn');
        
        elements.challengeBtn = document.getElementById('challenge-btn');
        elements.endlessBtn = document.getElementById('endless-btn');
        elements.sakuraTheme = document.getElementById('sakura-theme');
        elements.industrialTheme = document.getElementById('industrial-theme');
        elements.christmasTheme = document.getElementById('christmas-theme');
        
        elements.soundCorrect = document.getElementById('sound-correct');
        elements.soundWrong = document.getElementById('sound-wrong');
        elements.soundCombo = document.getElementById('sound-combo');
        elements.soundBgm = document.getElementById('sound-bgm');
    }

    function bindEvents() {
        elements.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                if (isModeUnlocked(mode)) {
                    selectedMode = mode;
                    updateModeButtons();
                    setTimeout(() => startGame(), 300);
                }
            });
        });

        elements.dimButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                selectedDimension = btn.dataset.dim;
                updateDimButtons();
            });
        });

        elements.themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                console.log('点击主题按钮:', theme);
                console.log('主题是否解锁:', ThemeManager.isThemeUnlocked(theme));
                
                if (ThemeManager.isThemeUnlocked(theme)) {
                    const result = ThemeManager.setTheme(theme);
                    console.log('ThemeManager.setTheme 结果:', result);
                    
                    Renderer.setTheme(theme);
                    updateThemeButtons();
                    
                    console.log('主题切换完成，当前主题:', ThemeManager.getCurrentTheme());
                } else {
                    console.log('主题未解锁:', theme);
                }
            });
        });

        elements.nextBtn.addEventListener('click', () => {
            if (currentResult && currentResult.gameOver) {
                if (currentResult.gameOver === 'levelComplete') {
                    GameState.nextLevel();
                    isAnswered = false;
                    currentResult = null;
                    elements.feedback.textContent = '';
                    elements.nextBtn.style.display = 'none';
                    renderCurrentClothes();
                } else {
                    showResult();
                }
            } else {
                GameState.nextClothes();
                isAnswered = false;
                currentResult = null;
                elements.feedback.textContent = '';
                elements.nextBtn.style.display = 'none';
                renderCurrentClothes();
            }
        });

        elements.retryBtn.addEventListener('click', () => {
            startGame();
        });

        elements.menuBtn.addEventListener('click', () => {
            GameState.endGame();
            showScreen('menu');
            updateMenuUI();
            isAnswered = false;
            currentResult = null;
        });

        elements.soundCorrect.addEventListener('change', (e) => {
            const settings = Storage.loadSettings();
            settings.sound.correct = e.target.checked;
            Storage.saveSettings(settings);
            AudioManager.setSettings(settings.sound);
        });

        elements.soundWrong.addEventListener('change', (e) => {
            const settings = Storage.loadSettings();
            settings.sound.wrong = e.target.checked;
            Storage.saveSettings(settings);
            AudioManager.setSettings(settings.sound);
        });

        elements.soundCombo.addEventListener('change', (e) => {
            const settings = Storage.loadSettings();
            settings.sound.combo = e.target.checked;
            Storage.saveSettings(settings);
            AudioManager.setSettings(settings.sound);
        });

        elements.soundBgm.addEventListener('change', (e) => {
            const settings = Storage.loadSettings();
            settings.sound.bgm = e.target.checked;
            Storage.saveSettings(settings);
            AudioManager.toggleBGM(e.target.checked);
        });

        document.addEventListener('click', () => {
            AudioManager.resume();
        }, { once: true });
    }

    function isModeUnlocked(mode) {
        const settings = Storage.loadSettings();
        const modeConfig = ClothingData.getMode(mode);
        return modeConfig && settings.highestLevel >= modeConfig.unlockLevel;
    }

    function updateModeButtons() {
        elements.modeButtons.forEach(btn => {
            const mode = btn.dataset.mode;
            const unlocked = isModeUnlocked(mode);
            btn.disabled = !unlocked;
            btn.style.opacity = unlocked ? (mode === selectedMode ? '1' : '0.8') : '0.5';
            btn.style.borderColor = mode === selectedMode ? 'var(--primary)' : 'transparent';
        });
    }

    function updateDimButtons() {
        elements.dimButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.dim === selectedDimension);
        });
    }

    function updateThemeButtons() {
        const currentTheme = ThemeManager.getCurrentTheme();
        elements.themeButtons.forEach(btn => {
            const theme = btn.dataset.theme;
            const unlocked = ThemeManager.isThemeUnlocked(theme);
            btn.disabled = !unlocked;
            btn.classList.toggle('active', theme === currentTheme);
        });
    }

    function updateMenuUI() {
        const settings = Storage.loadSettings();
        
        elements.challengeBtn.disabled = settings.highestLevel < 3;
        elements.endlessBtn.disabled = settings.highestLevel < 5;
        
        elements.sakuraTheme.disabled = !ThemeManager.isThemeUnlocked('sakura');
        elements.industrialTheme.disabled = !ThemeManager.isThemeUnlocked('industrial');
        elements.christmasTheme.disabled = !ThemeManager.isThemeUnlocked('christmas');
        
        elements.soundCorrect.checked = settings.sound.correct;
        elements.soundWrong.checked = settings.sound.wrong;
        elements.soundCombo.checked = settings.sound.combo;
        elements.soundBgm.checked = settings.sound.bgm;
        
        AudioManager.setSettings(settings.sound);
        
        updateModeButtons();
        updateDimButtons();
        updateThemeButtons();
    }

    function startGame() {
        GameState.startGame(selectedMode, selectedDimension);
        showScreen('game');
        isAnswered = false;
        currentResult = null;
        
        if (selectedMode === 'challenge') {
            elements.timerContainer.style.display = 'flex';
        } else {
            elements.timerContainer.style.display = 'none';
        }
        
        Renderer.setTheme(ThemeManager.getCurrentTheme());
        Renderer.start();
        renderCurrentClothes();
        updateUI();
    }

    function showScreen(screen) {
        elements.menuScreen.classList.toggle('active', screen === 'menu');
        elements.gameScreen.classList.toggle('active', screen === 'game');
        elements.resultScreen.classList.toggle('active', screen === 'result');
    }

    function renderCurrentClothes() {
        const clothes = GameState.getCurrentClothes();
        const dimension = GameState.getCurrentDimension();
        
        if (!clothes || !dimension) return;

        elements.clothesIcon.textContent = clothes.icon;
        elements.clothesName.textContent = clothes.name;
        elements.clothesDifficulty.textContent = ClothingData.getDifficultyStars(clothes.difficulty);
        
        elements.clothesTags.innerHTML = '';
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = `按${dimension.label}分类`;
        elements.clothesTags.appendChild(tag);

        elements.categoryButtons.innerHTML = '';
        dimension.options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.textContent = option;
            btn.addEventListener('click', () => handleAnswer(option, btn));
            elements.categoryButtons.appendChild(btn);
        });

        document.querySelectorAll('.cat-btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct', 'wrong');
        });
    }

    function handleAnswer(selectedOption, button) {
        if (isAnswered) return;
        
        isAnswered = true;
        currentResult = GameState.submitAnswer(selectedOption);
        
        if (!currentResult) return;

        const buttons = document.querySelectorAll('.cat-btn');
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === currentResult.correctAnswer) {
                btn.classList.add('correct');
            } else if (btn === button && !currentResult.isCorrect) {
                btn.classList.add('wrong');
            }
        });

        elements.feedback.textContent = currentResult.feedback;
        elements.feedback.className = `feedback ${currentResult.isCorrect ? 'correct' : 'wrong'}`;

        if (currentResult.gameOver) {
            if (currentResult.gameOver === 'levelComplete') {
                elements.nextBtn.textContent = '下一关 →';
                AudioManager.playLevelUp();
            } else {
                elements.nextBtn.textContent = '查看结果';
                AudioManager.playGameOver();
            }
        } else {
            elements.nextBtn.textContent = '下一件 →';
        }
        
        elements.nextBtn.style.display = 'block';
    }

    function showResult() {
        const state = GameState.getState();
        const total = state.correctCount + state.wrongCount;
        const accuracy = total > 0 ? Math.round((state.correctCount / total) * 100) : 0;
        
        let title = '游戏结束';
        if (currentResult && currentResult.gameOver === 'levelComplete') {
            title = '🎉 恭喜通关!';
        } else if (currentResult && currentResult.gameOver === 'levelFailed') {
            title = '😢 挑战失败';
        } else if (state.mode === 'challenge') {
            title = '⏱️ 时间到!';
        } else if (state.lives <= 0) {
            title = '💔 生命耗尽';
        }
        
        elements.resultTitle.textContent = title;
        elements.finalScore.textContent = state.score;
        elements.correctCount.textContent = state.correctCount;
        elements.wrongCount.textContent = state.wrongCount;
        elements.maxCombo.textContent = state.maxCombo;
        elements.accuracy.textContent = `${accuracy}%`;
        
        GameState.endGame();
        Renderer.stop();
        showScreen('result');
        
        Storage.checkThemeUnlocks();
        updateMenuUI();
    }

    function onStateChange(state) {
        updateUI();
    }

    function updateUI() {
        const state = GameState.getState();
        
        elements.scoreEl.textContent = state.score;
        elements.comboEl.textContent = state.combo;
        elements.livesEl.textContent = '❤️'.repeat(Math.max(0, state.lives)) || '💔';
        elements.timerEl.textContent = state.timeLeft;
        elements.levelEl.textContent = state.level;
        
        const totalAnswered = state.correctCount + state.wrongCount;
        if (state.mode === 'level') {
            elements.progressEl.textContent = `${totalAnswered}/${state.levelClothesCount}`;
            elements.progressContainer.style.display = 'flex';
        } else if (state.mode === 'endless') {
            elements.progressEl.textContent = `${totalAnswered}`;
            elements.progressContainer.style.display = 'flex';
        } else {
            elements.progressContainer.style.display = 'none';
        }
    }

    return {
        init
    };
})();

document.addEventListener('DOMContentLoaded', App.init);
