(function() {
    'use strict';
    
    const STORAGE_KEYS = {
        PRIZES: 'dazhuanpan_prizes',
        NAMES: 'dazhuanpan_names',
        HISTORY: 'dazhuanpan_history',
        SETTINGS: 'dazhuanpan_settings',
        USED_ITEMS: 'dazhuanpan_used_items'
    };
    
    const DEFAULT_PRIZES = [
        { name: '一等奖', color: '#FFD700', weight: 15 },
        { name: '二等奖', color: '#FF4444', weight: 20 },
        { name: '三等奖', color: '#44DD44', weight: 30 },
        { name: '谢谢惠顾', color: '#4488FF', weight: 35 }
    ];
    
    let state = {
        mode: 'prize',
        prizes: [...DEFAULT_PRIZES],
        names: [],
        history: [],
        settings: {
            allowRepeat: true,
            autoStopTime: 3,
            manualStop: false,
            enableSound: true
        },
        usedItems: [],
        isSpinning: false,
        currentRotation: 0
    };
    
    let audioContext = null;
    let spinOscillator = null;
    let spinGainNode = null;
    
    const elements = {
        canvas: document.getElementById('wheelCanvas'),
        spinBtn: document.getElementById('spinBtn'),
        centerCircle: document.querySelector('.center-circle'),
        prizeInput: document.getElementById('prizeInput'),
        nameInput: document.getElementById('nameInput'),
        applyPrizes: document.getElementById('applyPrizes'),
        applyNames: document.getElementById('applyNames'),
        prizeForm: document.getElementById('prize-form'),
        nameForm: document.getElementById('name-form'),
        allowRepeat: document.getElementById('allowRepeat'),
        manualStop: document.getElementById('manualStop'),
        enableSound: document.getElementById('enableSound'),
        clearHistory: document.getElementById('clearHistory'),
        historyList: document.getElementById('historyList'),
        resultDisplay: document.getElementById('resultDisplay'),
        resultModal: document.getElementById('resultModal'),
        modalTitle: document.getElementById('modalTitle'),
        modalResult: document.getElementById('modalResult'),
        closeModal: document.getElementById('closeModal'),
        spotlight: document.getElementById('spotlight'),
        confettiContainer: document.getElementById('confettiContainer'),
        danmakuContainer: document.getElementById('danmakuContainer'),
        particlesContainer: document.getElementById('particles'),
        lightRing: document.getElementById('lightRing'),
        modeBtns: document.querySelectorAll('.mode-btn'),
        timeBtns: document.querySelectorAll('.time-btn')
    };
    
    function init() {
        loadState();
        initCanvas();
        initEventListeners();
        initParticles();
        renderWheel();
        renderHistory();
        updateUI();
    }
    
    function loadState() {
        try {
            const prizes = localStorage.getItem(STORAGE_KEYS.PRIZES);
            if (prizes) {
                state.prizes = JSON.parse(prizes);
            }
            
            const names = localStorage.getItem(STORAGE_KEYS.NAMES);
            if (names) {
                state.names = JSON.parse(names);
            }
            
            const history = localStorage.getItem(STORAGE_KEYS.HISTORY);
            if (history) {
                state.history = JSON.parse(history);
            }
            
            const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (settings) {
                state.settings = JSON.parse(settings);
            }
            
            const usedItems = localStorage.getItem(STORAGE_KEYS.USED_ITEMS);
            if (usedItems) {
                state.usedItems = JSON.parse(usedItems);
            }
        } catch (e) {
            console.error('加载状态失败:', e);
        }
    }
    
    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEYS.PRIZES, JSON.stringify(state.prizes));
            localStorage.setItem(STORAGE_KEYS.NAMES, JSON.stringify(state.names));
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
            localStorage.setItem(STORAGE_KEYS.USED_ITEMS, JSON.stringify(state.usedItems));
        } catch (e) {
            console.error('保存状态失败:', e);
        }
    }
    
    function initCanvas() {
        const ctx = elements.canvas.getContext('2d');
        const size = Math.min(window.innerWidth * 0.8, 380);
        elements.canvas.width = size;
        elements.canvas.height = size;
    }
    
    function initEventListeners() {
        elements.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                playClickSound();
                setMode(btn.dataset.mode);
            });
        });
        
        elements.timeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                playClickSound();
                setAutoStopTime(parseInt(btn.dataset.time));
            });
        });
        
        elements.applyPrizes.addEventListener('click', () => {
            playClickSound();
            applyPrizes();
        });
        
        elements.applyNames.addEventListener('click', () => {
            playClickSound();
            applyNames();
        });
        
        elements.spinBtn.addEventListener('click', () => {
            playClickSound();
            handleSpin();
        });
        
        if (elements.centerCircle) {
            elements.centerCircle.addEventListener('click', () => {
                playClickSound();
                handleSpin();
            });
        }
        
        elements.allowRepeat.addEventListener('change', (e) => {
            playClickSound();
            state.settings.allowRepeat = e.target.checked;
            saveState();
        });
        
        elements.manualStop.addEventListener('change', (e) => {
            playClickSound();
            state.settings.manualStop = e.target.checked;
            saveState();
        });
        
        elements.enableSound.addEventListener('change', (e) => {
            playClickSound();
            state.settings.enableSound = e.target.checked;
            saveState();
        });
        
        elements.clearHistory.addEventListener('click', () => {
            playClickSound();
            if (confirm('确定要清空所有抽奖记录吗？')) {
                state.history = [];
                state.usedItems = [];
                saveState();
                renderHistory();
            }
        });
        
        elements.closeModal.addEventListener('click', () => {
            playClickSound();
            hideModal();
        });
        
        elements.resultModal.addEventListener('click', (e) => {
            if (e.target === elements.resultModal) {
                hideModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideModal();
            }
            if (e.key === ' ' && !state.isSpinning) {
                e.preventDefault();
                handleSpin();
            }
        });
        
        window.addEventListener('resize', () => {
            initCanvas();
            renderWheel();
        });
    }
    
    function setMode(mode) {
        state.mode = mode;
        elements.modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        elements.prizeForm.style.display = mode === 'prize' ? 'block' : 'none';
        elements.nameForm.style.display = mode === 'name' ? 'block' : 'none';
        
        saveState();
        renderWheel();
    }
    
    function setAutoStopTime(time) {
        state.settings.autoStopTime = time;
        elements.timeBtns.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.time) === time);
        });
        saveState();
    }
    
    function applyPrizes() {
        const text = elements.prizeInput.value.trim();
        if (!text) {
            alert('请输入奖品列表');
            return;
        }
        
        const lines = text.split('\n').filter(line => line.trim());
        const newPrizes = [];
        
        for (const line of lines) {
            const parts = line.split(',').map(p => p.trim());
            if (parts.length >= 1) {
                const name = parts[0];
                const color = parts[1] || getRandomColor();
                const weight = parseInt(parts[2]) || 25;
                
                if (name) {
                    newPrizes.push({ name, color, weight });
                }
            }
        }
        
        if (newPrizes.length === 0) {
            alert('请输入有效的奖品');
            return;
        }
        
        state.prizes = newPrizes;
        state.usedItems = [];
        saveState();
        renderWheel();
        alert('奖品已更新！');
    }
    
    function applyNames() {
        const text = elements.nameInput.value.trim();
        if (!text) {
            alert('请输入抽奖名单');
            return;
        }
        
        const names = text.split('\n').map(n => n.trim()).filter(n => n);
        
        if (names.length === 0) {
            alert('请输入有效的名字');
            return;
        }
        
        state.names = names;
        state.usedItems = [];
        saveState();
        renderWheel();
        alert('名单已更新！');
    }
    
    function getRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
            '#BB8FCE', '#85C1E9'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    function renderWheel() {
        const canvas = elements.canvas;
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let items = [];
        if (state.mode === 'prize') {
            items = state.prizes;
        } else {
            if (state.names.length === 0) {
                drawEmptyWheel(ctx, centerX, centerY, radius);
                return;
            }
            items = state.names.map((name, index) => ({
                name,
                color: getHSLColor(index, state.names.length),
                weight: 1
            }));
        }
        
        if (items.length === 0) {
            drawEmptyWheel(ctx, centerX, centerY, radius);
            return;
        }
        
        const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
        let startAngle = -Math.PI / 2;
        
        items.forEach((item, index) => {
            const weight = item.weight || 1;
            const sliceAngle = (weight / totalWeight) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            
            const gradient = ctx.createRadialGradient(
                centerX, centerY, radius * 0.3,
                centerX, centerY, radius
            );
            gradient.addColorStop(0, lightenColor(item.color, 30));
            gradient.addColorStop(0.7, item.color);
            gradient.addColorStop(1, darkenColor(item.color, 20));
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            drawSectorText(ctx, centerX, centerY, radius, item.name, startAngle, sliceAngle, item.color);
            
            startAngle = endAngle;
        });
        
        drawOuterRing(ctx, centerX, centerY, radius);
    }
    
    function drawEmptyWheel(ctx, centerX, centerY, radius) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        
        ctx.font = 'bold 18px Microsoft YaHei, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText('请先设置奖品/名单', centerX, centerY);
        
        drawOuterRing(ctx, centerX, centerY, radius);
    }
    
    function drawOuterRing(ctx, centerX, centerY, radius) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 6;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 12;
        ctx.stroke();
    }
    
    function getHSLColor(index, total) {
        const hue = (index / total) * 360;
        return `hsl(${hue}, 70%, 55%)`;
    }
    
    function lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `rgb(${R}, ${G}, ${B})`;
    }
    
    function darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `rgb(${R}, ${G}, ${B})`;
    }
    
    function isLightColor(color) {
        let r, g, b;
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        } else if (color.startsWith('rgb')) {
            const match = color.match(/\d+/g);
            if (match) {
                r = parseInt(match[0]);
                g = parseInt(match[1]);
                b = parseInt(match[2]);
            }
        } else if (color.startsWith('hsl')) {
            return true;
        }
        
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128;
    }
    
    function drawSectorText(ctx, centerX, centerY, radius, name, startAngle, sliceAngle, color) {
        const sliceDegrees = sliceAngle * (180 / Math.PI);
        
        if (sliceDegrees < 18) {
            return;
        }
        
        const textAngle = startAngle + sliceAngle / 2;
        const charCount = name.length;
        
        const textRadius = radius * 0.62;
        
        const availableArcLength = sliceAngle * textRadius * 0.7;
        
        let fontSize;
        let maxDisplayChars;
        
        if (sliceDegrees >= 70) {
            fontSize = Math.min(22, radius / 17);
            maxDisplayChars = Math.min(6, Math.floor(availableArcLength / (fontSize * 0.8)));
        } else if (sliceDegrees >= 50) {
            fontSize = Math.min(18, radius / 20);
            maxDisplayChars = Math.min(5, Math.floor(availableArcLength / (fontSize * 0.8)));
        } else if (sliceDegrees >= 35) {
            fontSize = Math.min(16, radius / 22);
            maxDisplayChars = Math.min(4, Math.floor(availableArcLength / (fontSize * 0.8)));
        } else if (sliceDegrees >= 25) {
            fontSize = Math.min(14, radius / 25);
            maxDisplayChars = Math.min(3, Math.floor(availableArcLength / (fontSize * 0.8)));
        } else if (sliceDegrees >= 18) {
            fontSize = Math.min(12, radius / 28);
            maxDisplayChars = Math.min(2, Math.floor(availableArcLength / (fontSize * 0.8)));
        } else {
            return;
        }
        
        fontSize = Math.max(10, fontSize);
        maxDisplayChars = Math.max(1, maxDisplayChars);
        
        ctx.font = `bold ${fontSize}px Microsoft YaHei, sans-serif`;
        
        const textMetrics = ctx.measureText(name);
        const singleCharWidth = textMetrics.width / charCount;
        
        let displayName = name;
        
        if (charCount > maxDisplayChars) {
            if (maxDisplayChars >= 2) {
                displayName = name.substring(0, maxDisplayChars - 1) + '…';
            } else {
                displayName = name.substring(0, maxDisplayChars);
            }
        }
        
        const finalMetrics = ctx.measureText(displayName);
        if (finalMetrics.width > availableArcLength * 0.85) {
            const ratio = (availableArcLength * 0.85) / finalMetrics.width;
            const newFontSize = Math.max(10, fontSize * ratio * 0.9);
            fontSize = newFontSize;
            ctx.font = `bold ${fontSize}px Microsoft YaHei, sans-serif`;
        }
        
        const textX = centerX + Math.cos(textAngle) * textRadius;
        const textY = centerY + Math.sin(textAngle) * textRadius;
        
        ctx.save();
        ctx.translate(textX, textY);
        ctx.rotate(textAngle + Math.PI / 2);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
        ctx.lineWidth = 3.5;
        ctx.lineJoin = 'round';
        ctx.strokeText(displayName, 0, 0);
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.fillStyle = isLightColor(color) ? '#000' : '#ffffff';
        ctx.fillText(displayName, 0, 0);
        
        ctx.restore();
    }
    
    function handleSpin() {
        if (state.isSpinning || isSlowDownPhase) {
            if (state.settings.manualStop && state.isSpinning) {
                stopSpinning();
            }
            return;
        }
        
        let availableItems = [];
        if (state.mode === 'prize') {
            if (!state.prizes || state.prizes.length === 0) {
                alert('请先设置奖品列表！');
                return;
            }
            
            const validPrizes = state.prizes.filter(p => p.name && p.name.trim());
            if (validPrizes.length === 0) {
                alert('奖品列表中没有有效的奖品！');
                return;
            }
            
            availableItems = validPrizes;
        } else {
            if (!state.names || state.names.length === 0) {
                alert('请先设置抽奖名单');
                return;
            }
            
            const validNames = state.names.filter(n => n && n.trim());
            if (validNames.length === 0) {
                alert('名单中没有有效的名字！');
                return;
            }
            
            if (state.settings.allowRepeat) {
                availableItems = validNames.map(name => ({
                    name,
                    color: getRandomColor(),
                    weight: 1
                }));
            } else {
                availableItems = validNames
                    .filter(name => !state.usedItems.includes(name))
                    .map(name => ({
                        name,
                        color: getRandomColor(),
                        weight: 1
                    }));
                
                if (availableItems.length === 0) {
                    alert('所有人都已被抽中，无法继续抽奖！');
                    return;
                }
            }
        }
        
        if (!availableItems || availableItems.length === 0) {
            alert('没有可用的奖品/名单');
            return;
        }
        
        state.isSpinning = true;
        elements.spinBtn.textContent = state.settings.manualStop ? '停止抽奖' : '抽奖中...';
        elements.spinBtn.disabled = !state.settings.manualStop;
        
        startLightAnimation();
        playStartSound();
        
        const result = selectRandomItem(availableItems);
        startSpinning(result);
    }
    
    function selectRandomItem(items) {
        const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
        let random = Math.random() * totalWeight;
        
        for (const item of items) {
            random -= (item.weight || 1);
            if (random <= 0) {
                return item;
            }
        }
        
        return items[items.length - 1];
    }
    
    let spinAnimation = null;
    let spinStartTime = 0;
    let spinTargetItem = null;
    let spinTotalRotation = 0;
    let isSlowDownPhase = false;
    let slowDownStartTime = 0;
    let slowDownStartRotation = 0;
    let slowDownTargetRotation = 0;
    
    function startSpinning(targetItem) {
        spinTargetItem = targetItem;
        spinStartTime = Date.now();
        isSlowDownPhase = false;
        
        const canvas = elements.canvas;
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        let items = state.mode === 'prize' ? state.prizes : state.names.map((name, index) => ({
            name,
            color: getHSLColor(index, state.names.length),
            weight: 1
        }));
        
        const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
        let startAngle = -Math.PI / 2;
        let targetStartAngle = 0;
        let targetEndAngle = 0;
        
        for (const item of items) {
            const weight = item.weight || 1;
            const sliceAngle = (weight / totalWeight) * 2 * Math.PI;
            
            if (item.name === targetItem.name) {
                targetStartAngle = startAngle;
                targetEndAngle = startAngle + sliceAngle;
                break;
            }
            
            startAngle += sliceAngle;
        }
        
        const targetSliceCenter = (targetStartAngle + targetEndAngle) / 2;
        const pointerAngle = -Math.PI / 2;
        
        const fullRotations = 5 + Math.floor(Math.random() * 5);
        const angleDiff = (pointerAngle - targetSliceCenter + 2 * Math.PI) % (2 * Math.PI);
        const randomOffset = (Math.random() - 0.5) * 0.2;
        
        spinTotalRotation = fullRotations * 2 * Math.PI + angleDiff + randomOffset;
        
        playSpinSound();
        animateSpin();
    }
    
    function animateSpin() {
        const elapsed = (Date.now() - spinStartTime) / 1000;
        const duration = state.settings.autoStopTime + 1;
        const slowDownDuration = 2;
        
        let currentRotation;
        
        if (state.settings.manualStop) {
            if (isSlowDownPhase) {
                const slowDownElapsed = (Date.now() - slowDownStartTime) / 1000;
                const progress = Math.min(1, slowDownElapsed / slowDownDuration);
                const easeOut = 1 - Math.pow(1 - progress, 3);
                currentRotation = slowDownStartRotation + easeOut * (slowDownTargetRotation - slowDownStartRotation);
                
                if (progress >= 1) {
                    finishSpinning();
                    return;
                }
            } else {
                const spinSpeed = 12;
                currentRotation = elapsed * spinSpeed;
            }
        } else {
            const progress = Math.min(1, elapsed / duration);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            currentRotation = easeOut * spinTotalRotation;
        }
        
        const canvas = elements.canvas;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(currentRotation);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        
        renderWheelStatic(ctx, canvas);
        
        ctx.restore();
        
        if (state.settings.manualStop) {
            if (state.isSpinning || isSlowDownPhase) {
                spinAnimation = requestAnimationFrame(animateSpin);
            }
        } else {
            if (elapsed < duration && state.isSpinning) {
                spinAnimation = requestAnimationFrame(animateSpin);
            } else {
                finishSpinning();
            }
        }
    }
    
    function renderWheelStatic(ctx, canvas) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        
        let items = [];
        if (state.mode === 'prize') {
            items = state.prizes;
        } else {
            if (state.names.length === 0) return;
            items = state.names.map((name, index) => ({
                name,
                color: getHSLColor(index, state.names.length),
                weight: 1
            }));
        }
        
        if (items.length === 0) return;
        
        const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
        let startAngle = -Math.PI / 2;
        
        items.forEach((item) => {
            const weight = item.weight || 1;
            const sliceAngle = (weight / totalWeight) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            
            const gradient = ctx.createRadialGradient(
                centerX, centerY, radius * 0.3,
                centerX, centerY, radius
            );
            gradient.addColorStop(0, lightenColor(item.color, 30));
            gradient.addColorStop(0.7, item.color);
            gradient.addColorStop(1, darkenColor(item.color, 20));
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            drawSectorText(ctx, centerX, centerY, radius, item.name, startAngle, sliceAngle, item.color);
            
            startAngle = endAngle;
        });
        
        drawOuterRing(ctx, centerX, centerY, radius);
    }
    
    function stopSpinning() {
        if (!state.isSpinning && !isSlowDownPhase) return;
        
        if (state.settings.manualStop && !isSlowDownPhase) {
            state.isSpinning = false;
            isSlowDownPhase = true;
            slowDownStartTime = Date.now();
            
            const elapsed = (slowDownStartTime - spinStartTime) / 1000;
            const spinSpeed = 12;
            slowDownStartRotation = elapsed * spinSpeed;
            
            const fullRotations = 3 + Math.floor(Math.random() * 3);
            const currentMod = slowDownStartRotation % (2 * Math.PI);
            const targetMod = spinTotalRotation % (2 * Math.PI);
            
            let additionalRotation = targetMod - currentMod;
            if (additionalRotation < 0) {
                additionalRotation += 2 * Math.PI;
            }
            
            slowDownTargetRotation = slowDownStartRotation + fullRotations * 2 * Math.PI + additionalRotation;
            
            elements.spinBtn.textContent = '减速中...';
            elements.spinBtn.disabled = true;
            
            return;
        }
        
        state.isSpinning = false;
        isSlowDownPhase = false;
        if (spinAnimation) {
            cancelAnimationFrame(spinAnimation);
        }
        
        finishSpinning();
    }
    
    function finishSpinning() {
        state.isSpinning = false;
        isSlowDownPhase = false;
        stopSpinSound();
        stopLightAnimation();
        
        playWinSound();
        
        showSpotlight();
        createConfetti();
        createDanmaku();
        
        const historyItem = {
            id: Date.now(),
            mode: state.mode,
            prize: spinTargetItem.name,
            color: spinTargetItem.color,
            timestamp: new Date().toISOString()
        };
        
        state.history.unshift(historyItem);
        
        if (state.mode === 'name' && !state.settings.allowRepeat) {
            state.usedItems.push(spinTargetItem.name);
        }
        
        if (state.history.length > 100) {
            state.history = state.history.slice(0, 100);
        }
        
        saveState();
        
        showResult(spinTargetItem);
        renderHistory();
        
        elements.spinBtn.textContent = '开始抽奖';
        elements.spinBtn.disabled = false;
        
        setTimeout(() => {
            hideSpotlight();
        }, 3000);
    }
    
    function showResult(item) {
        elements.resultDisplay.innerHTML = `
            <div class="result-content">
                <div class="prize-title">🎉 ${item.name}</div>
                <div class="prize-winner">${state.mode === 'prize' ? '恭喜获得奖品！' : '恭喜被抽中！'}</div>
            </div>
        `;
        
        elements.modalTitle.textContent = state.mode === 'prize' ? '恭喜中奖！' : '恭喜被抽中！';
        elements.modalResult.textContent = item.name;
        showModal();
    }
    
    function renderHistory() {
        if (state.history.length === 0) {
            elements.historyList.innerHTML = '<div class="empty-history">暂无抽奖记录</div>';
            return;
        }
        
        const html = state.history.map(item => {
            const date = new Date(item.timestamp);
            const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            
            return `
                <div class="history-item">
                    <div>
                        <span class="prize-name">${item.prize}</span>
                        <span class="winner-name" style="margin-left: 10px;">${item.mode === 'prize' ? '奖品' : '名单'}</span>
                    </div>
                    <span class="time">${timeStr}</span>
                </div>
            `;
        }).join('');
        
        elements.historyList.innerHTML = html;
    }
    
    function updateUI() {
        if (state.mode === 'name' && state.names.length > 0) {
            elements.nameInput.value = state.names.join('\n');
        }
        
        elements.allowRepeat.checked = state.settings.allowRepeat;
        elements.manualStop.checked = state.settings.manualStop;
        elements.enableSound.checked = state.settings.enableSound;
        
        elements.timeBtns.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.time) === state.settings.autoStopTime);
        });
        
        elements.modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === state.mode);
        });
        
        elements.prizeForm.style.display = state.mode === 'prize' ? 'block' : 'none';
        elements.nameForm.style.display = state.mode === 'name' ? 'block' : 'none';
        
        if (state.history.length > 0) {
            const lastItem = state.history[0];
            elements.resultDisplay.innerHTML = `
                <div class="result-content">
                    <div class="prize-title">${lastItem.prize}</div>
                    <div class="prize-winner">上一次抽奖结果</div>
                </div>
            `;
        }
    }
    
    function initParticles() {
        const container = elements.particlesContainer;
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 6}s`;
            particle.style.animationDuration = `${5 + Math.random() * 5}s`;
            container.appendChild(particle);
        }
    }
    
    let lightInterval = null;
    
    function startLightAnimation() {
        const dots = elements.lightRing.querySelectorAll('.light-dot');
        let index = 0;
        
        lightInterval = setInterval(() => {
            dots.forEach(dot => dot.classList.remove('active'));
            
            dots[index].classList.add('active');
            dots[(index + 3) % dots.length].classList.add('active');
            dots[(index + 6) % dots.length].classList.add('active');
            dots[(index + 9) % dots.length].classList.add('active');
            
            index = (index + 1) % dots.length;
        }, 100);
    }
    
    function stopLightAnimation() {
        if (lightInterval) {
            clearInterval(lightInterval);
            lightInterval = null;
        }
        
        const dots = elements.lightRing.querySelectorAll('.light-dot');
        dots.forEach(dot => dot.classList.remove('active'));
    }
    
    function showSpotlight() {
        elements.spotlight.style.opacity = '1';
    }
    
    function hideSpotlight() {
        elements.spotlight.style.opacity = '0';
    }
    
    function createConfetti() {
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#96CEB4', '#DDA0DD', '#85C1E9'];
        const container = elements.confettiContainer;
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = `${2 + Math.random() * 3}s`;
            confetti.style.animationDelay = `${Math.random() * 0.5}s`;
            confetti.style.width = `${5 + Math.random() * 10}px`;
            confetti.style.height = `${5 + Math.random() * 10}px`;
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            
            container.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
    }
    
    function createDanmaku() {
        const container = elements.danmakuContainer;
        const messages = [
            '恭喜！🎉',
            '太棒了！🌟',
            '幸运儿！🍀',
            '恭喜中奖！🎊',
            '太幸运了！✨',
            '恭喜！👏',
            '好运连连！🎁',
            '恭喜恭喜！🥳'
        ];
        
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const danmaku = document.createElement('div');
                danmaku.className = 'danmaku';
                danmaku.textContent = messages[Math.floor(Math.random() * messages.length)];
                danmaku.style.top = `${10 + Math.random() * 60}%`;
                danmaku.style.animationDuration = `${3 + Math.random() * 2}s`;
                danmaku.style.fontSize = `${24 + Math.random() * 20}px`;
                
                container.appendChild(danmaku);
                
                setTimeout(() => {
                    danmaku.remove();
                }, 5000);
            }, i * 300);
        }
    }
    
    function showModal() {
        elements.resultModal.classList.add('show');
    }
    
    function hideModal() {
        elements.resultModal.classList.remove('show');
    }
    
    function initAudio() {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('音频不支持:', e);
            }
        }
    }
    
    function playClickSound() {
        if (!state.settings.enableSound || !audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
    
    function playStartSound() {
        if (!state.settings.enableSound || !audioContext) return;
        
        const playDrum = (delay, freq) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.value = freq;
            osc.type = 'sine';
            
            const startTime = audioContext.currentTime + delay;
            gain.gain.setValueAtTime(0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
            
            osc.start(startTime);
            osc.stop(startTime + 0.15);
        };
        
        playDrum(0, 200);
        playDrum(0.2, 200);
        playDrum(0.4, 300);
    }
    
    function playSpinSound() {
        if (!state.settings.enableSound || !audioContext) return;
        
        spinOscillator = audioContext.createOscillator();
        spinGainNode = audioContext.createGain();
        
        spinOscillator.connect(spinGainNode);
        spinGainNode.connect(audioContext.destination);
        
        spinOscillator.frequency.value = 400;
        spinOscillator.type = 'sawtooth';
        
        spinGainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        
        spinOscillator.start(audioContext.currentTime);
    }
    
    function stopSpinSound() {
        if (spinOscillator) {
            spinGainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
            setTimeout(() => {
                spinOscillator.stop();
                spinOscillator = null;
            }, 200);
        }
    }
    
    function playWinSound() {
        if (!state.settings.enableSound || !audioContext) return;
        
        const notes = [523.25, 659.25, 783.99, 1046.50];
        
        notes.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            
            const startTime = audioContext.currentTime + index * 0.15;
            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.5);
        });
        
        setTimeout(() => {
            const cheerOsc = audioContext.createOscillator();
            const cheerGain = audioContext.createGain();
            
            cheerOsc.connect(cheerGain);
            cheerGain.connect(audioContext.destination);
            
            cheerOsc.frequency.setValueAtTime(300, audioContext.currentTime);
            cheerOsc.frequency.linearRampToValueAtTime(600, audioContext.currentTime + 0.3);
            cheerOsc.type = 'triangle';
            
            cheerGain.gain.setValueAtTime(0.2, audioContext.currentTime);
            cheerGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
            
            cheerOsc.start(audioContext.currentTime);
            cheerOsc.stop(audioContext.currentTime + 0.8);
        }, 0.6);
    }
    
    document.addEventListener('click', () => {
        initAudio();
    }, { once: true });
    
    init();
})();
