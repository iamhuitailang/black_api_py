const GameState = (function() {
    let state = null;
    let listeners = [];
    let questionStartTime = 0;
    let timerInterval = null;

    let autoSaveInterval = null;
    
    function init() {
        console.log('GameState.init 开始');
        state = Storage.loadGameState();
        console.log('加载的状态:', state);
        
        if (!state.currentClothesId && state.isPlaying) {
            console.log('currentClothesId 为空，自动获取下一件衣物');
            nextClothes();
        }
        
        if (state.isPlaying && state.mode === 'challenge' && state.timeLeft > 0) {
            console.log('恢复计时器');
            startTimer();
        }
        
        window.addEventListener('beforeunload', saveState);
        window.addEventListener('pagehide', saveState);
        window.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                saveState();
            }
        });
        
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
        }
        autoSaveInterval = setInterval(() => {
            if (state && state.isPlaying) {
                saveState();
            }
        }, 2000);
        
        notifyListeners();
        console.log('GameState.init 完成');
    }

    function saveState() {
        if (state) {
            const saved = Storage.saveGameState(state);
            if (saved) {
                console.log('状态自动保存成功, isPlaying:', state.isPlaying);
            }
        }
    }

    function resetState() {
        state = { ...Storage.defaultGameState };
        state.isPlaying = false;
        saveState();
        notifyListeners();
    }

    function startGame(mode, dimension) {
        console.log('开始游戏:', mode, dimension);
        stopTimer();
        
        state = { ...Storage.defaultGameState };
        state.mode = mode;
        state.dimension = dimension;
        state.isPlaying = true;
        state.currentClothesId = null;
        
        if (mode === 'challenge') {
            state.timeLeft = 60;
        }
        
        saveState();
        
        if (mode === 'challenge') {
            startTimer();
        }
        
        nextClothes();
    }

    function nextClothes() {
        const clothes = ClothingData.getRandomClothesExcluding(state.usedClothesIds);
        state.currentClothesId = clothes.id;
        
        if (state.mode !== 'endless') {
            state.usedClothesIds.push(clothes.id);
        }
        
        state.clothesAnswered += 1;
        questionStartTime = Date.now();
        
        saveState();
        notifyListeners();
    }

    function submitAnswer(selectedOption) {
        if (!state.isPlaying) {
            console.warn('游戏未进行中，无法提交答案');
            return null;
        }

        const clothes = ClothingData.getClothesById(state.currentClothesId);
        const dimension = ClothingData.getDimension(state.dimension);
        const correctAnswer = clothes[state.dimension];
        const isCorrect = selectedOption === correctAnswer;
        const answerTime = (Date.now() - questionStartTime) / 1000;

        let scoreChange = 0;
        let feedback = '';

        if (isCorrect) {
            scoreChange += 10;
            state.combo += 1;
            state.maxCombo = Math.max(state.maxCombo, state.combo);
            state.correctCount += 1;

            const comboBonus = state.combo * 2;
            scoreChange += comboBonus;

            if (answerTime <= 5) {
                scoreChange += 5;
                feedback = `✅ 正确! +${scoreChange}分 (连击×${state.combo} + 快速回答+5)`;
            } else {
                feedback = `✅ 正确! +${scoreChange}分 (连击×${state.combo})`;
            }

            if (state.combo > 0 && state.combo % 5 === 0 && state.lives < 5) {
                state.lives += 1;
                feedback += ' 🎉 5连击! +1生命';
            }

            AudioManager.playCorrect();
            if (state.combo > 1) {
                AudioManager.playCombo(state.combo);
            }
        } else {
            state.combo = 0;
            state.wrongCount += 1;

            if (state.mode !== 'learn') {
                scoreChange = -5;
                state.lives -= 1;
                feedback = `❌ 错误! ${scoreChange}分 正确答案: ${correctAnswer}`;
                
                if (state.mode === 'challenge') {
                    state.timeLeft = Math.max(0, state.timeLeft - 3);
                    feedback += ' ⏱️ -3秒';
                }
            } else {
                feedback = `📚 学习模式: 正确答案是 ${correctAnswer}`;
            }

            AudioManager.playWrong();
        }

        state.score = Math.max(0, state.score + scoreChange);

        const gameOverResult = checkGameOver();
        
        const result = {
            isCorrect,
            scoreChange,
            correctAnswer,
            feedback,
            clothes,
            gameOver: gameOverResult
        };

        saveState();
        notifyListeners();

        console.log('提交答案结果:', result);
        return result;
    }

    function checkGameOver() {
        if (state.lives <= 0 && state.mode !== 'learn') {
            console.log('游戏结束: 生命耗尽');
            return 'lives';
        }

        if (state.mode === 'level') {
            const totalAnswered = state.correctCount + state.wrongCount;
            if (totalAnswered >= state.levelClothesCount) {
                const accuracy = state.correctCount / totalAnswered;
                if (accuracy >= 0.8) {
                    console.log('游戏结束: 关卡完成');
                    return 'levelComplete';
                } else {
                    console.log('游戏结束: 关卡失败');
                    return 'levelFailed';
                }
            }
        }

        if (state.mode === 'challenge' && state.timeLeft <= 0) {
            console.log('游戏结束: 时间到');
            return 'timeUp';
        }

        return null;
    }

    function nextLevel() {
        console.log('进入下一关:', state.level + 1);
        state.level += 1;
        state.usedClothesIds = [];
        state.correctCount = 0;
        state.wrongCount = 0;
        state.clothesAnswered = 0;
        state.lives = 3;
        
        Storage.updateHighestLevel(state.level);
        saveState();
        
        nextClothes();
    }

    function startTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        timerInterval = setInterval(() => {
            if (state.isPlaying && state.mode === 'challenge') {
                state.timeLeft -= 1;
                saveState();
                notifyListeners();
                
                if (state.timeLeft <= 0) {
                    stopTimer();
                }
            }
        }, 1000);
        
        console.log('计时器已启动');
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
            console.log('计时器已停止');
        }
    }

    function endGame() {
        console.log('结束游戏');
        stopTimer();
        state.isPlaying = false;
        Storage.updateStats(state.correctCount, state.wrongCount);
        saveState();
        notifyListeners();
    }

    function getState() {
        return { ...state };
    }

    function getCurrentClothes() {
        if (!state.currentClothesId) return null;
        return ClothingData.getClothesById(state.currentClothesId);
    }

    function getCurrentDimension() {
        return ClothingData.getDimension(state.dimension);
    }

    function subscribe(callback) {
        listeners.push(callback);
        return () => {
            listeners = listeners.filter(l => l !== callback);
        };
    }

    function notifyListeners() {
        listeners.forEach(callback => callback(state));
    }

    return {
        init,
        resetState,
        startGame,
        nextClothes,
        submitAnswer,
        nextLevel,
        endGame,
        getState,
        getCurrentClothes,
        getCurrentDimension,
        subscribe
    };
})();
