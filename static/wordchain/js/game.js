let gameState = {
    gameId: null,
    score: 0,
    round: 1,
    streak: 0,
    requiredChar: '',
    timeLeft: 15,
    timerInterval: null,
    isPlaying: false,
    startWord: ''
};

document.addEventListener('DOMContentLoaded', function() {
    if (!api.token) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(localStorage.getItem('wordchain_user') || '{}');
    document.getElementById('username').textContent = user.username || '玩家';

    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('submitBtn').addEventListener('click', submitWord);
    document.getElementById('playAgainBtn').addEventListener('click', startGame);
    document.getElementById('viewProfileBtn').addEventListener('click', () => {
        window.location.href = 'profile.html';
    });
    document.getElementById('profileBtn').addEventListener('click', () => {
        window.location.href = 'profile.html';
    });
    document.getElementById('logoutBtn').addEventListener('click', logout);

    document.getElementById('wordInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitWord();
        }
    });
});

async function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('endScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    document.getElementById('chatHistory').innerHTML = '';

    const startBtn = document.getElementById('startBtn');
    startBtn.disabled = true;
    startBtn.innerHTML = '<span class="loading"></span> 开始中...';

    const result = await api.startGame();
    
    startBtn.disabled = false;
    startBtn.textContent = '开始游戏';

    if (result.code === 0) {
        gameState = {
            gameId: result.data.game_id,
            score: 0,
            round: 1,
            streak: 0,
            requiredChar: result.data.current_last_char,
            timeLeft: 15,
            timerInterval: null,
            isPlaying: true,
            startWord: result.data.start_word
        };

        updateUI();
        addChatBubble('system', result.data.start_word, '系统起始词');
        startTimer();
        document.getElementById('wordInput').focus();
    } else {
        showToast(result.message, 'error');
        document.getElementById('startScreen').style.display = 'block';
        document.getElementById('gameScreen').style.display = 'none';
    }
}

function startTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }

    gameState.timeLeft = 15;
    updateTimerDisplay();

    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        updateTimerDisplay();

        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            handleTimeout();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerText = document.getElementById('timerText');
    const timerRing = document.getElementById('timerRing');
    
    timerText.textContent = gameState.timeLeft;
    
    const progress = (gameState.timeLeft / 15) * 100;
    timerRing.style.setProperty('--progress', `${progress}%`);
    
    if (gameState.timeLeft <= 5) {
        timerRing.classList.add('warning');
        timerText.classList.add('warning');
    } else {
        timerRing.classList.remove('warning');
        timerText.classList.remove('warning');
    }
}

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('round').textContent = gameState.round;
    document.getElementById('streak').textContent = gameState.streak;
    document.getElementById('requiredChar').textContent = gameState.requiredChar;
    document.getElementById('requiredCharText').textContent = gameState.requiredChar;
    
    const bonusHint = document.getElementById('bonusHint');
    if (gameState.streak >= 5) {
        bonusHint.style.display = 'inline';
    } else {
        bonusHint.style.display = 'none';
    }
}

async function submitWord() {
    if (!gameState.isPlaying) return;

    const input = document.getElementById('wordInput');
    const word = input.value.trim();

    if (!word) {
        showToast('请输入词语', 'error');
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 500);
        return;
    }

    if (word[0] !== gameState.requiredChar) {
        showToast(`词语必须以"${gameState.requiredChar}"开头`, 'error');
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 500);
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> 提交中...';

    const result = await api.submitWord(gameState.gameId, word);
    
    submitBtn.disabled = false;
    submitBtn.textContent = '提交';

    if (result.code === 0) {
        if (result.data.game_over) {
            handleGameOver(result.data);
        } else {
            clearInterval(gameState.timerInterval);
            
            gameState.score = result.data.total_score;
            gameState.round = result.data.round;
            gameState.streak = result.data.winning_streak;
            gameState.requiredChar = result.data.next_required_char;
            
            let scoreText = `+${result.data.score}分`;
            if (result.data.is_streak_bonus) {
                scoreText += ' (连胜加成×2)';
            }
            
            addChatBubble('player', word, scoreText, 'success');
            updateUI();
            
            input.value = '';
            startTimer();
            input.focus();
            
            if (result.data.is_streak_bonus) {
                showToast('🔥 连胜加成！得分翻倍！', 'success');
            }
        }
    } else {
        addChatBubble('player', word, result.message, 'failed');
        handleGameOver({
            is_win: false,
            final_score: gameState.score,
            round_count: gameState.round,
            max_streak: gameState.streak,
            words_count: gameState.round - 1
        });
        showToast(result.message, 'error');
    }
}

async function handleTimeout() {
    if (!gameState.isPlaying) return;

    const result = await api.timeout(gameState.gameId);
    
    if (result.code === 0) {
        addChatBubble('player', '⏰ 时间到', '超时未作答', 'failed');
        handleGameOver(result.data);
    }
}

function handleGameOver(data) {
    gameState.isPlaying = false;
    clearInterval(gameState.timerInterval);

    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('endScreen').style.display = 'block';

    const endTitle = document.getElementById('endTitle');
    const endSubtitle = document.getElementById('endSubtitle');
    
    if (data.is_win) {
        endTitle.textContent = '🎉 恭喜通关！';
        endSubtitle.textContent = '太厉害了，没有能难倒你的词！';
        showToast('🎉 恭喜通关！', 'success');
    } else {
        endTitle.textContent = '💔 游戏结束';
        endSubtitle.textContent = '再接再厉，下次一定能成功！';
    }

    document.getElementById('finalScore').textContent = data.final_score;
    document.getElementById('finalRounds').textContent = data.round_count;
    document.getElementById('finalStreak').textContent = data.max_streak;
    document.getElementById('finalWords').textContent = data.words_count;
}

function addChatBubble(source, word, info, result = 'success') {
    const chatHistory = document.getElementById('chatHistory');
    const bubble = document.createElement('div');
    
    bubble.className = `chat-bubble ${source} ${result === 'failed' ? 'failed' : ''}`;
    
    let content = `<div class="bubble-content">`;
    content += `<div class="bubble-word">${word}</div>`;
    content += `<div class="bubble-info">${info}</div>`;
    content += `</div>`;
    
    bubble.innerHTML = content;
    chatHistory.appendChild(bubble);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function logout() {
    await api.logout();
    api.clearToken();
    localStorage.removeItem('wordchain_user');
    window.location.href = 'index.html';
}
