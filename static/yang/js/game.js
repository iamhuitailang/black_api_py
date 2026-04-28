(function() {
    'use strict';

    const CARD_TYPES = [
        { emoji: '🐑', name: '绵羊', color: '#f8bbd0' },
        { emoji: '🐐', name: '山羊', color: '#c5e1a5' },
        { emoji: '🐄', name: '奶牛', color: '#bbdefb' },
        { emoji: '🐷', name: '小猪', color: '#f48fb1' },
        { emoji: '🐔', name: '小鸡', color: '#fff9c4' },
        { emoji: '🐰', name: '兔子', color: '#e1bee7' },
        { emoji: '🐶', name: '狗狗', color: '#ffcc80' },
        { emoji: '🐱', name: '猫咪', color: '#ffab91' },
        { emoji: '🐸', name: '青蛙', color: '#a5d6a7' },
        { emoji: '🐻', name: '小熊', color: '#bcaaa4' },
        { emoji: '🌸', name: '樱花', color: '#fce4ec' },
        { emoji: '🍀', name: '幸运草', color: '#c8e6c9' }
    ];

    const CONFIG = {
        CARD_WIDTH: 60,
        CARD_HEIGHT: 70,
        MAX_SLOTS: 7,
        LAYERS: 3,
        DEFAULT_TIME: 180,
        STORAGE_KEY: 'yang_game_state'
    };

    let gameState = {
        isPlaying: false,
        isPaused: false,
        cards: [],
        slots: [],
        timeLeft: CONFIG.DEFAULT_TIME,
        totalCards: 0,
        remainingCards: 0,
        highScore: 0,
        timerId: null,
        selectedCard: null,
        level: 1,
        startTime: 0
    };

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const cardCountEl = document.getElementById('cardCount');
    const highScoreEl = document.getElementById('highScore');
    const timerEl = document.getElementById('timer');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const restartBtn = document.getElementById('restartBtn');
    const startOverlay = document.getElementById('startOverlay');
    const winOverlay = document.getElementById('winOverlay');
    const loseOverlay = document.getElementById('loseOverlay');
    const pauseOverlay = document.getElementById('pauseOverlay');
    const startGameBtn = document.getElementById('startGameBtn');
    const winRestartBtn = document.getElementById('winRestartBtn');
    const loseRestartBtn = document.getElementById('loseRestartBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const winTimeEl = document.getElementById('winTime');
    const loseReasonEl = document.getElementById('loseReason');
    const slotContainer = document.getElementById('slotContainer');

    function init() {
        loadHighScore();
        updateHighScoreDisplay();
        bindEvents();
        loadGameState();
        if (!gameState.isPlaying) {
            showOverlay('start');
        } else {
            render();
            if (!gameState.isPaused) {
                startTimer();
            } else {
                showOverlay('pause');
            }
        }
    }

    function bindEvents() {
        startBtn.addEventListener('click', startGame);
        pauseBtn.addEventListener('click', togglePause);
        restartBtn.addEventListener('click', restartGame);
        startGameBtn.addEventListener('click', startGame);
        winRestartBtn.addEventListener('click', restartGame);
        loseRestartBtn.addEventListener('click', restartGame);
        resumeBtn.addEventListener('click', resumeGame);
        canvas.addEventListener('click', handleCanvasClick);
        window.addEventListener('beforeunload', saveGameState);
    }

    function generateLevel() {
        const totalCardCount = 18 * 3;
        const cardTypeCount = Math.min(12, 6 + Math.floor(gameState.level * 0.5));
        const usedTypes = CARD_TYPES.slice(0, cardTypeCount);
        
        const cardPool = [];
        usedTypes.forEach(type => {
            for (let i = 0; i < 3; i++) {
                cardPool.push({ ...type });
            }
        });
        
        while (cardPool.length < totalCardCount) {
            const randomType = usedTypes[Math.floor(Math.random() * usedTypes.length)];
            cardPool.push({ ...randomType });
        }
        
        const excess = cardPool.length - totalCardCount;
        if (excess > 0) {
            cardPool.splice(0, excess);
        }
        
        shuffleArray(cardPool);
        
        gameState.cards = [];
        
        const layerConfigs = [
            { rows: 4, cols: 5, offsetX: 40, offsetY: 40, layer: 0 },
            { rows: 3, cols: 4, offsetX: 70, offsetY: 70, layer: 1 },
            { rows: 2, cols: 3, offsetX: 100, offsetY: 120, layer: 2 }
        ];
        
        let poolIndex = 0;
        
        for (let layerIdx = 0; layerIdx < CONFIG.LAYERS; layerIdx++) {
            const config = layerConfigs[layerIdx];
            const layerOffsetX = config.offsetX;
            const layerOffsetY = config.offsetY;
            
            for (let row = 0; row < config.rows; row++) {
                for (let col = 0; col < config.cols; col++) {
                    if (poolIndex >= cardPool.length) break;
                    
                    const cardType = cardPool[poolIndex];
                    const card = {
                        id: `card_${layerIdx}_${row}_${col}_${Date.now()}`,
                        type: cardType,
                        x: layerOffsetX + col * (CONFIG.CARD_WIDTH + 8),
                        y: layerOffsetY + row * (CONFIG.CARD_HEIGHT + 8),
                        layer: layerIdx,
                        row: row,
                        col: col,
                        isSelected: false,
                        isRemoved: false,
                        isClickable: true
                    };
                    gameState.cards.push(card);
                    poolIndex++;
                }
            }
        }
        
        gameState.totalCards = gameState.cards.length;
        gameState.remainingCards = gameState.totalCards;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawBackground();
        
        const sortedCards = [...gameState.cards].sort((a, b) => {
            if (a.layer !== b.layer) return a.layer - b.layer;
            if (a.isSelected && !b.isSelected) return 1;
            if (!a.isSelected && b.isSelected) return -1;
            return 0;
        });
        
        sortedCards.forEach(card => {
            if (!card.isRemoved) {
                drawCard(card);
            }
        });
        
        updateCardCountDisplay();
        renderSlots();
    }

    function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#fff9fb');
        gradient.addColorStop(1, '#fff5fb');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.globalAlpha = 0.1;
        ctx.font = '40px Arial';
        ctx.fillStyle = '#f8bbd0';
        for (let i = 0; i < 5; i++) {
            const x = 50 + i * 100;
            const y = 450 + (i % 2) * 30;
            ctx.fillText('🐑', x, y);
        }
        ctx.globalAlpha = 1;
    }

    function drawCard(card) {
        const isClickable = isCardClickable(card);
        const isDimmed = !isClickable && !card.isSelected;
        
        ctx.save();
        
        if (isDimmed) {
            ctx.globalAlpha = 0.5;
        }
        
        const x = card.x;
        const y = card.y;
        const width = CONFIG.CARD_WIDTH;
        const height = CONFIG.CARD_HEIGHT;
        
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 10);
        ctx.fillStyle = card.isSelected ? '#ffebf0' : '#ffffff';
        ctx.fill();
        
        ctx.strokeStyle = card.isSelected ? '#f48fb1' : (isClickable ? '#f8bbd0' : '#e0e0e0');
        ctx.lineWidth = card.isSelected ? 3 : 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 4, width - 8, height - 8, 8);
        ctx.fillStyle = card.type.color;
        ctx.fill();
        
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.type.emoji, x + width / 2, y + height / 2);
        
        if (card.isSelected) {
            ctx.shadowColor = '#f48fb1';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, 10);
            ctx.strokeStyle = '#e91e63';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.shadowColor = 'transparent';
        }
        
        ctx.restore();
    }

    function isCardClickable(card) {
        if (card.isRemoved || card.isSelected) return false;
        
        const hasBlockingCard = gameState.cards.some(other => {
            if (other.isRemoved || other.isSelected) return false;
            if (other.layer <= card.layer) return false;
            
            const overlap = isOverlapping(card, other);
            return overlap;
        });
        
        return !hasBlockingCard;
    }

    function isOverlapping(card1, card2) {
        const padding = 10;
        return !(card1.x + CONFIG.CARD_WIDTH - padding < card2.x ||
                 card2.x + CONFIG.CARD_WIDTH - padding < card1.x ||
                 card1.y + CONFIG.CARD_HEIGHT - padding < card2.y ||
                 card2.y + CONFIG.CARD_HEIGHT - padding < card1.y);
    }

    function handleCanvasClick(e) {
        if (!gameState.isPlaying || gameState.isPaused) return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const clickableCards = gameState.cards.filter(card => 
            !card.isRemoved && !card.isSelected && isCardClickable(card)
        );
        
        clickableCards.sort((a, b) => b.layer - a.layer);
        
        for (const card of clickableCards) {
            if (x >= card.x && x <= card.x + CONFIG.CARD_WIDTH &&
                y >= card.y && y <= card.y + CONFIG.CARD_HEIGHT) {
                selectCard(card);
                break;
            }
        }
    }

    function selectCard(card) {
        if (gameState.slots.length >= CONFIG.MAX_SLOTS) return;
        
        card.isSelected = true;
        animateCardToSlot(card, () => {
            moveCardToSlot(card);
        });
    }

    function animateCardToSlot(card, callback) {
        const startX = card.x;
        const startY = card.y;
        const targetSlotIndex = gameState.slots.length;
        const slotWidth = 56;
        const gap = 8;
        const containerWidth = (slotWidth + gap) * CONFIG.MAX_SLOTS - gap;
        const startOffsetX = (slotContainer.clientWidth - containerWidth) / 2;
        const targetX = startOffsetX + targetSlotIndex * (slotWidth + gap) + slotWidth / 2 - CONFIG.CARD_WIDTH / 2;
        const targetY = canvas.height + 20;
        
        const duration = 300;
        const startTime = Date.now();
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            card.x = startX + (targetX - startX) * easeProgress;
            card.y = startY + (targetY - startY) * easeProgress;
            
            render();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                callback();
            }
        }
        
        animate();
    }

    function moveCardToSlot(card) {
        card.isRemoved = true;
        gameState.slots.push(card.type);
        gameState.remainingCards--;
        
        saveGameState();
        render();
        checkForMatches();
        checkGameEnd();
    }

    function checkForMatches() {
        const typeCounts = {};
        gameState.slots.forEach((type, index) => {
            if (!typeCounts[type.name]) {
                typeCounts[type.name] = [];
            }
            typeCounts[type.name].push(index);
        });
        
        let matchFound = false;
        for (const name in typeCounts) {
            if (typeCounts[name].length >= 3) {
                const indices = typeCounts[name].slice(0, 3);
                indices.sort((a, b) => b - a);
                
                indices.forEach(index => {
                    gameState.slots.splice(index, 1);
                });
                
                matchFound = true;
                break;
            }
        }
        
        if (matchFound) {
            saveGameState();
            render();
            animateMatch();
        }
    }

    function animateMatch() {
        const slotElements = slotContainer.querySelectorAll('.slot');
        slotElements.forEach(slot => {
            if (slot.classList.contains('has-card')) {
                slot.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    slot.style.transform = 'scale(1)';
                }, 200);
            }
        });
    }

    function renderSlots() {
        const slotElements = slotContainer.querySelectorAll('.slot');
        slotElements.forEach((slot, index) => {
            slot.innerHTML = '';
            slot.classList.remove('has-card');
            
            if (index < gameState.slots.length) {
                const cardType = gameState.slots[index];
                slot.classList.add('has-card');
                
                const cardCanvas = document.createElement('canvas');
                cardCanvas.width = 44;
                cardCanvas.height = 52;
                const cardCtx = cardCanvas.getContext('2d');
                
                const gradient = cardCtx.createLinearGradient(0, 0, 44, 52);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(1, '#fff9fb');
                cardCtx.fillStyle = gradient;
                cardCtx.beginPath();
                cardCtx.roundRect(0, 0, 44, 52, 8);
                cardCtx.fill();
                
                cardCtx.strokeStyle = '#f8bbd0';
                cardCtx.lineWidth = 2;
                cardCtx.stroke();
                
                cardCtx.beginPath();
                cardCtx.roundRect(3, 3, 38, 46, 6);
                cardCtx.fillStyle = cardType.color;
                cardCtx.fill();
                
                cardCtx.font = '26px Arial';
                cardCtx.textAlign = 'center';
                cardCtx.textBaseline = 'middle';
                cardCtx.fillText(cardType.emoji, 22, 26);
                
                slot.appendChild(cardCanvas);
            }
        });
    }

    function checkGameEnd() {
        if (gameState.remainingCards === 0 && gameState.slots.length === 0) {
            handleWin();
            return;
        }
        
        if (gameState.slots.length >= CONFIG.MAX_SLOTS) {
            const canMatch = checkCanMatch();
            if (!canMatch) {
                handleLose('槽位已满，无法消除！');
            }
        }
    }

    function checkCanMatch() {
        const typeCounts = {};
        gameState.slots.forEach(type => {
            if (!typeCounts[type.name]) {
                typeCounts[type.name] = 0;
            }
            typeCounts[type.name]++;
        });
        
        for (const name in typeCounts) {
            if (typeCounts[name] >= 3) {
                return true;
            }
        }
        
        return false;
    }

    function handleWin() {
        stopTimer();
        gameState.isPlaying = false;
        
        const timeUsed = CONFIG.DEFAULT_TIME - gameState.timeLeft;
        if (gameState.highScore === 0 || timeUsed < gameState.highScore) {
            gameState.highScore = timeUsed;
            saveHighScore();
        }
        
        const minutes = Math.floor(timeUsed / 60);
        const seconds = timeUsed % 60;
        winTimeEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        clearGameState();
        showOverlay('win');
    }

    function handleLose(reason) {
        stopTimer();
        gameState.isPlaying = false;
        loseReasonEl.textContent = reason;
        clearGameState();
        showOverlay('lose');
    }

    function startGame() {
        hideAllOverlays();
        gameState.isPlaying = true;
        gameState.isPaused = false;
        gameState.slots = [];
        gameState.timeLeft = CONFIG.DEFAULT_TIME;
        gameState.startTime = Date.now();
        
        generateLevel();
        saveGameState();
        updateButtons();
        render();
        startTimer();
    }

    function restartGame() {
        stopTimer();
        hideAllOverlays();
        clearGameState();
        startGame();
    }

    function togglePause() {
        if (gameState.isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }

    function pauseGame() {
        if (!gameState.isPlaying) return;
        gameState.isPaused = true;
        stopTimer();
        saveGameState();
        updateButtons();
        showOverlay('pause');
    }

    function resumeGame() {
        gameState.isPaused = false;
        hideAllOverlays();
        startTimer();
        saveGameState();
        updateButtons();
    }

    function startTimer() {
        stopTimer();
        gameState.timerId = setInterval(() => {
            if (gameState.isPlaying && !gameState.isPaused) {
                gameState.timeLeft--;
                updateTimerDisplay();
                
                if (gameState.timeLeft <= 0) {
                    handleLose('时间到了！');
                }
                
                saveGameState();
            }
        }, 1000);
    }

    function stopTimer() {
        if (gameState.timerId) {
            clearInterval(gameState.timerId);
            gameState.timerId = null;
        }
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(gameState.timeLeft / 60);
        const seconds = gameState.timeLeft % 60;
        timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function updateCardCountDisplay() {
        cardCountEl.textContent = gameState.remainingCards;
    }

    function updateHighScoreDisplay() {
        highScoreEl.textContent = gameState.highScore > 0 
            ? formatTime(gameState.highScore) 
            : '0';
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function updateButtons() {
        startBtn.disabled = gameState.isPlaying;
        pauseBtn.disabled = !gameState.isPlaying;
        pauseBtn.textContent = gameState.isPaused ? '继续' : '暂停';
        restartBtn.disabled = !gameState.isPlaying;
    }

    function showOverlay(type) {
        hideAllOverlays();
        switch (type) {
            case 'start':
                startOverlay.classList.remove('hidden');
                break;
            case 'win':
                winOverlay.classList.remove('hidden');
                break;
            case 'lose':
                loseOverlay.classList.remove('hidden');
                break;
            case 'pause':
                pauseOverlay.classList.remove('hidden');
                break;
        }
    }

    function hideAllOverlays() {
        startOverlay.classList.add('hidden');
        winOverlay.classList.add('hidden');
        loseOverlay.classList.add('hidden');
        pauseOverlay.classList.add('hidden');
    }

    function saveGameState() {
        try {
            const stateToSave = {
                isPlaying: gameState.isPlaying,
                isPaused: gameState.isPaused,
                cards: gameState.cards.map(function(card) {
                    return {
                        id: card.id,
                        type: card.type,
                        x: card.x,
                        y: card.y,
                        layer: card.layer,
                        row: card.row,
                        col: card.col,
                        isSelected: card.isSelected,
                        isRemoved: card.isRemoved,
                        isClickable: card.isClickable
                    };
                }),
                slots: gameState.slots.map(function(slot) {
                    return {
                        emoji: slot.emoji,
                        name: slot.name,
                        color: slot.color
                    };
                }),
                timeLeft: gameState.timeLeft,
                totalCards: gameState.totalCards,
                remainingCards: gameState.remainingCards,
                level: gameState.level,
                startTime: gameState.startTime,
                savedAt: Date.now()
            };
            
            const jsonString = JSON.stringify(stateToSave);
            localStorage.setItem(CONFIG.STORAGE_KEY, jsonString);
            
            console.log('[状态保存] 成功保存游戏状态:', {
                isPlaying: stateToSave.isPlaying,
                cardsCount: stateToSave.cards.length,
                slotsCount: stateToSave.slots.length,
                timeLeft: stateToSave.timeLeft,
                remainingCards: stateToSave.remainingCards
            });
            
        } catch (e) {
            console.error('[状态保存] 保存失败:', e);
            console.error('[状态保存] 错误详情:', e.message);
        }
    }

    function isValidGameState(state) {
        console.log('[状态验证] 开始验证状态...');
        
        if (!state) {
            console.log('[状态验证] 状态为空');
            return false;
        }
        
        console.log('[状态验证] 检查 isPlaying:', state.isPlaying, '类型:', typeof state.isPlaying);
        if (typeof state.isPlaying !== 'boolean') {
            console.log('[状态验证] isPlaying 不是布尔值');
            return false;
        }
        
        console.log('[状态验证] 检查 cards 是否为数组:', Array.isArray(state.cards));
        if (!Array.isArray(state.cards)) {
            console.log('[状态验证] cards 不是数组');
            return false;
        }
        
        console.log('[状态验证] 检查 slots 是否为数组:', Array.isArray(state.slots));
        if (!Array.isArray(state.slots)) {
            console.log('[状态验证] slots 不是数组');
            return false;
        }
        
        console.log('[状态验证] 检查 timeLeft:', state.timeLeft, '类型:', typeof state.timeLeft);
        if (typeof state.timeLeft !== 'number') {
            console.log('[状态验证] timeLeft 不是数字');
            return false;
        }
        
        console.log('[状态验证] 检查 remainingCards:', state.remainingCards, '类型:', typeof state.remainingCards);
        if (typeof state.remainingCards !== 'number') {
            console.log('[状态验证] remainingCards 不是数字');
            return false;
        }
        
        if (state.cards.length > 0) {
            const firstCard = state.cards[0];
            console.log('[状态验证] 检查第一张卡牌:', firstCard);
            
            if (typeof firstCard.x === 'undefined' || 
                typeof firstCard.y === 'undefined' ||
                typeof firstCard.layer === 'undefined' ||
                typeof firstCard.isRemoved === 'undefined') {
                console.log('[状态验证] 卡牌缺少必要属性');
                return false;
            }
        }
        
        console.log('[状态验证] 验证通过！');
        return true;
    }

    function loadGameState() {
        console.log('========================================');
        console.log('[状态加载] 开始加载游戏状态...');
        console.log('========================================');
        
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
            
            if (!saved) {
                console.log('[状态加载] localStorage 中没有找到保存的状态');
                console.log('[状态加载] CONFIG.STORAGE_KEY:', CONFIG.STORAGE_KEY);
                return;
            }
            
            console.log('[状态加载] 找到保存的状态，长度:', saved.length);
            console.log('[状态加载] 状态内容前500字符:', saved.substring(0, 500));
            
            const state = JSON.parse(saved);
            
            console.log('[状态加载] 解析成功！');
            console.log('[状态加载] isPlaying:', state.isPlaying);
            console.log('[状态加载] isPaused:', state.isPaused);
            console.log('[状态加载] cards 数量:', state.cards ? state.cards.length : 0);
            console.log('[状态加载] slots 数量:', state.slots ? state.slots.length : 0);
            console.log('[状态加载] timeLeft:', state.timeLeft);
            console.log('[状态加载] remainingCards:', state.remainingCards);
            
            if (!isValidGameState(state)) {
                console.warn('[状态加载] 状态验证失败，清除旧状态');
                clearGameState();
                return;
            }
            
            console.log('[状态加载] 状态验证通过！');
            
            if (state.isPlaying === true) {
                console.log('[状态加载] 开始恢复游戏状态...');
                
                gameState.isPlaying = true;
                gameState.isPaused = state.isPaused === true;
                gameState.cards = state.cards;
                gameState.slots = state.slots;
                gameState.timeLeft = state.timeLeft;
                gameState.totalCards = state.totalCards || (state.cards ? state.cards.length : 0);
                gameState.remainingCards = state.remainingCards;
                gameState.level = state.level || 1;
                gameState.startTime = state.startTime || Date.now();
                
                console.log('[状态加载] 游戏状态恢复完成！');
                console.log('[状态加载] gameState.isPlaying:', gameState.isPlaying);
                console.log('[状态加载] gameState.isPaused:', gameState.isPaused);
                console.log('[状态加载] gameState.cards.length:', gameState.cards.length);
                console.log('[状态加载] gameState.slots.length:', gameState.slots.length);
                console.log('[状态加载] gameState.timeLeft:', gameState.timeLeft);
                console.log('[状态加载] gameState.remainingCards:', gameState.remainingCards);
                
                updateButtons();
                updateTimerDisplay();
                updateCardCountDisplay();
                
                console.log('========================================');
                console.log('[状态加载] 游戏状态恢复成功！');
                console.log('========================================');
                
            } else {
                console.log('[状态加载] 保存的状态中 isPlaying 为 false，不恢复游戏');
                clearGameState();
            }
            
        } catch (e) {
            console.error('[状态加载] 加载失败:', e);
            console.error('[状态加载] 错误详情:', e.message);
            console.error('[状态加载] 错误堆栈:', e.stack);
            clearGameState();
        }
    }

    function clearGameState() {
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            gameState.isPlaying = false;
            gameState.isPaused = false;
            gameState.cards = [];
            gameState.slots = [];
            gameState.timeLeft = CONFIG.DEFAULT_TIME;
            gameState.totalCards = 0;
            gameState.remainingCards = 0;
            gameState.level = 1;
            gameState.startTime = 0;
        } catch (e) {
            console.error('清除游戏状态失败:', e);
        }
    }

    function saveHighScore() {
        try {
            localStorage.setItem('yang_high_score', gameState.highScore.toString());
            updateHighScoreDisplay();
        } catch (e) {
            console.error('保存最高纪录失败:', e);
        }
    }

    function loadHighScore() {
        try {
            const saved = localStorage.getItem('yang_high_score');
            if (saved) {
                gameState.highScore = parseInt(saved, 10) || 0;
            }
        } catch (e) {
            console.error('加载最高纪录失败:', e);
            gameState.highScore = 0;
        }
    }

    if (!ctx.roundRect) {
        ctx.roundRect = function(x, y, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        };
    }

    init();
})();
