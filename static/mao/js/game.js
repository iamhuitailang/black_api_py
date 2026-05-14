let gameState;

function initGame() {
    gameState = loadGameState();
    applyTheme(gameState.theme);
    
    const cardContainer = document.getElementById('cardContainer');
    const wheelContainer = document.getElementById('wheelContainer');
    
    if (gameState.drawMethod === 'wheel') {
        cardContainer.style.display = 'none';
        wheelContainer.style.display = 'flex';
        initWheelSegments(gameState.mode, gameState.difficulty);
    } else {
        cardContainer.style.display = 'flex';
        wheelContainer.style.display = 'none';
    }
    
    updateUI();
}

function applyTheme(theme) {
    document.body.className = `theme-${theme}`;
    gameState.theme = theme;
    saveGameState(gameState);
}

function setMode(mode) {
    gameState.mode = mode;
    saveGameState(gameState);
}

function setDifficulty(difficulty) {
    gameState.difficulty = difficulty;
    saveGameState(gameState);
}

function setDrawMethod(method) {
    gameState.drawMethod = method;
    saveGameState(gameState);
    
    const cardContainer = document.getElementById('cardContainer');
    const wheelContainer = document.getElementById('wheelContainer');
    
    if (method === 'wheel') {
        cardContainer.style.display = 'none';
        wheelContainer.style.display = 'flex';
        initWheelSegments(gameState.mode, gameState.difficulty);
    } else {
        cardContainer.style.display = 'flex';
        wheelContainer.style.display = 'none';
    }
}

function drawRandomQuestion() {
    const { mode, difficulty } = gameState;
    let type;
    
    if (mode === 'truth') {
        type = 'truth';
    } else if (mode === 'dare') {
        type = 'dare';
    } else {
        type = Math.random() > 0.5 ? 'truth' : 'dare';
    }
    
    const questions = getQuestions(type, difficulty);
    if (questions.length === 0) {
        return null;
    }
    
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
}

function flipCard() {
    if (gameState.isFlipped) return;
    
    const question = drawRandomQuestion();
    if (!question) {
        alert('该分类下暂无题目！');
        return;
    }
    
    gameState.currentCard = question;
    gameState.isFlipped = true;
    saveGameState(gameState);
    
    const card = document.getElementById('card');
    card.classList.add('flipped');
    
    updateCardContent(question);
    
    setTimeout(() => {
        showActionButtons();
    }, 800);
}

function updateCardContent(question) {
    const cardType = document.getElementById('cardType');
    const cardContent = document.getElementById('cardContent');
    const cardDifficulty = document.getElementById('cardDifficulty');
    
    cardType.textContent = question.type === 'truth' ? '💬 真心话' : '🎯 大冒险';
    cardType.className = `card-type ${question.type}`;
    
    cardContent.textContent = question.content;
    cardDifficulty.textContent = difficultyNames[question.difficulty];
    cardDifficulty.className = `card-difficulty ${question.difficulty}`;
}

function unflipCard() {
    const card = document.getElementById('card');
    card.classList.remove('flipped');
    gameState.isFlipped = false;
    gameState.currentCard = null;
    saveGameState(gameState);
    
    hideActionButtons();
}

function showActionButtons() {
    document.getElementById('actionButtons').style.display = 'flex';
    document.getElementById('drawBtn').style.display = 'none';
}

function hideActionButtons() {
    document.getElementById('actionButtons').style.display = 'none';
    document.getElementById('drawBtn').style.display = 'block';
}

async function doWheelSpin() {
    const drawBtn = document.getElementById('drawButton');
    drawBtn.disabled = true;
    
    const result = await spinWheel();
    
    let question = result.question;
    if (!question) {
        question = drawRandomQuestion();
    }
    
    if (question) {
        gameState.currentCard = question;
        gameState.isFlipped = true;
        saveGameState(gameState);
        updateCardContent(question);
        showActionButtons();
    }
    
    drawBtn.disabled = false;
}

function completeTask() {
    const scorePoints = {
        light: 10,
        normal: 20,
        hard: 30,
        adult: 50
    };
    
    const points = scorePoints[gameState.currentCard.difficulty] || 10;
    addScoreToPlayer(gameState.currentPlayerIndex, points);
    
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    saveGameState(gameState);
    
    triggerCelebration(gameState.theme);
    updateUI();
    unflipCard();
}

function punishPlayer() {
    const punishment = punishments[Math.floor(Math.random() * punishments.length)];
    
    const modal = document.getElementById('punishModal');
    const punishContent = document.getElementById('punishContent');
    punishContent.textContent = punishment;
    modal.style.display = 'flex';
    
    addScoreToPlayer(gameState.currentPlayerIndex, -5);
    updateUI();
}

function closePunishModal() {
    document.getElementById('punishModal').style.display = 'none';
}

function nextRound() {
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    saveGameState(gameState);
    updateUI();
    unflipCard();
}

function updateUI() {
    updateActiveButtons();
    updateScoreBoard();
    updateCustomQuestionsList();
    
    if (gameState.isFlipped && gameState.currentCard) {
        const card = document.getElementById('card');
        card.classList.add('flipped');
        updateCardContent(gameState.currentCard);
        showActionButtons();
    } else {
        hideActionButtons();
    }
}

function updateActiveButtons() {
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === gameState.theme);
    });
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === gameState.mode);
    });
    
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.difficulty === gameState.difficulty);
    });
    
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.method === gameState.drawMethod);
    });
}

function updateScoreBoard() {
    const scoreList = document.getElementById('scoreList');
    const sortedPlayers = getSortedPlayers();
    
    scoreList.innerHTML = sortedPlayers.map((player, index) => `
        <div class="score-item">
            <span class="score-name">${index === 0 ? '👑 ' : ''}${player.name}</span>
            <span class="score-value">${player.score} 分</span>
        </div>
    `).join('');
}

function updateCustomQuestionsList() {
    const customList = document.getElementById('customList');
    const state = loadGameState();
    
    let html = '';
    
    ['truth', 'dare'].forEach(type => {
        const key = type === 'truth' ? 'customTruth' : 'customDare';
        ['light', 'normal', 'hard', 'adult'].forEach(diff => {
            const questions = state[key][diff] || [];
            questions.forEach(q => {
                html += `
                    <div class="custom-item">
                        <span class="custom-item-info">
                            <span class="custom-item-type ${type}">${type === 'truth' ? '真心话' : '大冒险'}</span>
                            <span>${difficultyNames[diff]}: ${q.content}</span>
                        </span>
                        <button class="custom-item-delete" onclick="deleteQuestion('${type}', '${diff}', ${q.id})">删除</button>
                    </div>
                `;
            });
        });
    });
    
    customList.innerHTML = html || '<p style="text-align: center; color: #666;">暂无自定义题目</p>';
}

function addCustomQuestionFromInput() {
    const type = document.getElementById('questionType').value;
    const difficulty = document.getElementById('questionLevel').value;
    const input = document.getElementById('questionInput');
    const content = input.value.trim();
    
    if (!content) {
        alert('请输入题目内容！');
        return;
    }
    
    addCustomQuestion(type, difficulty, content);
    input.value = '';
    updateCustomQuestionsList();
}

function deleteQuestion(type, difficulty, id) {
    deleteCustomQuestion(type, difficulty, id);
    updateCustomQuestionsList();
}

function showAddPlayerModal() {
    document.getElementById('playerModal').style.display = 'flex';
    document.getElementById('playerNameInput').value = '';
    document.getElementById('playerNameInput').focus();
}

function hidePlayerModal() {
    document.getElementById('playerModal').style.display = 'none';
}

function confirmAddPlayer() {
    const input = document.getElementById('playerNameInput');
    const name = input.value.trim();
    
    if (!name) {
        alert('请输入玩家姓名！');
        return;
    }
    
    addPlayer(name);
    hidePlayerModal();
    updateScoreBoard();
}

function handleShake() {
    if (typeof DeviceMotionEvent !== 'undefined' && 
        typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    startShakeDetection();
                }
            })
            .catch(console.error);
    } else {
        startShakeDetection();
    }
}

function startShakeDetection() {
    let lastShake = 0;
    let lastX = 0, lastY = 0, lastZ = 0;
    
    window.addEventListener('devicemotion', (event) => {
        const current = event.accelerationIncludingGravity;
        if (!current) return;
        
        const { x, y, z } = current;
        const deltaX = Math.abs(x - lastX);
        const deltaY = Math.abs(y - lastY);
        const deltaZ = Math.abs(z - lastZ);
        
        if ((deltaX + deltaY + deltaZ) > 30) {
            const now = Date.now();
            if (now - lastShake > 1000) {
                lastShake = now;
                if (!gameState.isFlipped) {
                    if (gameState.drawMethod === 'card') {
                        flipCard();
                    } else {
                        doWheelSpin();
                    }
                }
            }
        }
        
        lastX = x;
        lastY = y;
        lastZ = z;
    });
}

function resetGame() {
    if (confirm('确定要重置游戏吗？所有进度和自定义题目都会被清除！')) {
        clearGameState();
        gameState = loadGameState();
        applyTheme(gameState.theme);
        
        const cardContainer = document.getElementById('cardContainer');
        const wheelContainer = document.getElementById('wheelContainer');
        
        if (gameState.drawMethod === 'wheel') {
            cardContainer.style.display = 'none';
            wheelContainer.style.display = 'flex';
            initWheelSegments(gameState.mode, gameState.difficulty);
        } else {
            cardContainer.style.display = 'flex';
            wheelContainer.style.display = 'none';
        }
        
        const card = document.getElementById('card');
        card.classList.remove('flipped');
        
        updateUI();
    }
}