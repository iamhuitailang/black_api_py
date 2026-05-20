const MBTIRenderer = (function() {
    let canvas, ctx;
    let width, height;
    let particles = [];
    let animationId = null;
    let currentScreen = 'welcome';
    let state = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let interactiveElements = [];

    function init(canvasElement, appState) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        state = appState;
        resize();
        window.addEventListener('resize', resize);
        initParticles();
        setupEventListeners();
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function initParticles() {
        particles = [];
        const count = Math.min(80, Math.floor((width * height) / 15000));
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2 + 1,
                alpha: Math.random() * 0.5 + 0.2,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }

    function drawBackground() {
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height)
        );
        gradient.addColorStop(0, '#1a1535');
        gradient.addColorStop(0.5, '#0f0a25');
        gradient.addColorStop(1, '#050515');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.twinkle += 0.02;

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            const alpha = p.alpha * (0.5 + 0.5 * Math.sin(p.twinkle));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180, 160, 255, ${alpha})`;
            ctx.fill();
        });

        drawMysticalSymbols();
    }

    function drawMysticalSymbols() {
        ctx.save();
        ctx.globalAlpha = 0.08;
        
        const symbols = ['✦', '✧', '⬡', '◇', '✷', '❋'];
        const time = Date.now() * 0.0001;

        for (let i = 0; i < 6; i++) {
            const x = (Math.sin(time * 0.5 + i) * 0.4 + 0.5) * width;
            const y = (Math.cos(time * 0.3 + i * 1.5) * 0.4 + 0.5) * height;
            const size = 30 + Math.sin(time * 2 + i) * 10;

            ctx.font = `${size}px serif`;
            ctx.fillStyle = '#a080e0';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(symbols[i], x, y);
        }

        ctx.restore();
    }

    function drawWelcomeScreen() {
        interactiveElements = [];
        ctx.textBaseline = 'alphabetic';

        const centerX = width / 2;
        const centerY = height / 2;

        ctx.save();
        ctx.shadowBlur = 30;
        ctx.shadowColor = 'rgba(160, 120, 220, 0.5)';
        ctx.font = 'bold 48px serif';
        ctx.fillStyle = '#e0d0ff';
        ctx.textAlign = 'center';
        ctx.fillText('MBTI 人格测试', centerX, centerY - 120);
        ctx.restore();

        ctx.font = '18px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.fillText('探索你内心深处的神秘力量', centerX, centerY - 70);

        const description = [
            '通过12道简单问题，发现你的人格类型',
            '了解你的性格特征、适合职业和人际建议',
            '数据保存在本地，完全隐私安全'
        ];

        description.forEach((text, i) => {
            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#8070a0';
            ctx.fillText(text, centerX, centerY - 20 + i * 24);
        });

        const buttonY = centerY + 80;
        const buttonWidth = 200;
        const buttonHeight = 50;
        drawButton(centerX - buttonWidth / 2, buttonY, buttonWidth, buttonHeight, '开始测试', 'primary', () => {
            startTest();
        });

        const history = MBTIStorage.loadHistory();
        if (history.length > 0) {
            drawButton(centerX - buttonWidth / 2, buttonY + 70, buttonWidth, 40, '查看历史记录', 'normal', () => {
                showHistory();
            });
        }
    }

    function drawQuestionScreen() {
        interactiveElements = [];
        ctx.textBaseline = 'alphabetic';

        const question = MBTIData.questions[state.currentQuestionIndex];
        const progress = MBTIScoring.getProgress(state.answers);

        drawProgressBar(progress.percentage);
        drawQuestionNumber(state.currentQuestionIndex + 1, MBTIData.questions.length);

        const centerX = width / 2;
        const questionY = height * 0.25;

        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(160, 120, 220, 0.3)';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#e0d0ff';
        ctx.textAlign = 'center';
        const lines = wrapText(question.text, width * 0.8);
        lines.forEach((line, i) => {
            ctx.fillText(line, centerX, questionY + i * 32);
        });
        ctx.restore();

        const dimensionText = `维度: ${MBTIData.dimensions[question.dimension].leftName} / ${MBTIData.dimensions[question.dimension].rightName}`;
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#706090';
        ctx.fillText(dimensionText, centerX, questionY + lines.length * 32 + 20);

        const optionsStartY = height * 0.45;
        const optionWidth = Math.min(400, width * 0.8);
        const optionHeight = 60;
        const optionGap = 16;

        question.options.forEach((option, i) => {
            const optionY = optionsStartY + i * (optionHeight + optionGap);
            const isSelected = state.answers[question.id] === i;
            drawOptionButton(
                centerX - optionWidth / 2,
                optionY,
                optionWidth,
                optionHeight,
                option.text,
                isSelected,
                () => selectOption(i)
            );
        });

        drawNavigationButtons();

        if (MBTIScoring.canSubmit(state.answers)) {
            const submitBtnWidth = 160;
            const submitBtnHeight = 45;
            drawButton(
                centerX - submitBtnWidth / 2,
                height - 100,
                submitBtnWidth,
                submitBtnHeight,
                '查看结果',
                'primary',
                () => submitTest()
            );
        }
    }

    function drawResultScreen() {
        interactiveElements = [];
        ctx.textBaseline = 'alphabetic';

        const result = state.result;
        const centerX = width / 2;

        if (!result || !result.typeInfo) {
            ctx.font = 'bold 24px sans-serif';
            ctx.fillStyle = '#e0d0ff';
            ctx.textAlign = 'center';
            ctx.fillText('结果解析中...', centerX, height / 2);
            return;
        }

        const scrollY = Math.max(0, state.scrollY || 0);
        const contentStartY = 380;
        const contentEndY = height - 90;

        let contentY = contentStartY + 30 - scrollY;

        drawResultSectionTitle(centerX, contentY, '性格特征');
        contentY += 35;
        result.typeInfo.traits.forEach((trait, i) => {
            drawResultText(centerX, contentY + i * 26, `✦ ${trait}`);
        });
        contentY += result.typeInfo.traits.length * 26 + 35;

        drawResultSectionTitle(centerX, contentY, '人格描述');
        contentY += 35;
        const descLines = wrapText(result.typeInfo.description, width * 0.7);
        descLines.forEach((line, i) => {
            drawResultText(centerX, contentY + i * 24, line);
        });
        contentY += descLines.length * 24 + 35;

        drawResultSectionTitle(centerX, contentY, '适合职业');
        contentY += 35;
        const careerLines = wrapText(result.typeInfo.careers.join('、'), width * 0.7);
        careerLines.forEach((line, i) => {
            drawResultText(centerX, contentY + i * 24, line);
        });
        contentY += careerLines.length * 24 + 35;

        drawResultSectionTitle(centerX, contentY, '人际建议');
        contentY += 35;
        const adviceLines = wrapText(result.typeInfo.advice, width * 0.7);
        adviceLines.forEach((line, i) => {
            drawResultText(centerX, contentY + i * 24, line);
        });

        drawHeaderOverlay(centerX, result, contentStartY);

        drawResultActions(centerX, height - 60);
    }

    function drawHeaderOverlay(centerX, result, contentStartY) {
        ctx.save();

        const overlayGradient = ctx.createLinearGradient(0, contentStartY - 100, 0, contentStartY);
        overlayGradient.addColorStop(0, '#0f0a25');
        overlayGradient.addColorStop(0.8, '#0f0a25');
        overlayGradient.addColorStop(1, 'rgba(15, 10, 37, 0.85)');
        ctx.fillStyle = overlayGradient;
        ctx.fillRect(0, 0, width, contentStartY + 20);

        ctx.shadowBlur = 40;
        ctx.shadowColor = 'rgba(180, 140, 255, 0.5)';
        ctx.font = 'bold 64px serif';
        const gradient = ctx.createLinearGradient(centerX - 150, 0, centerX + 150, 0);
        gradient.addColorStop(0, '#c0a0ff');
        gradient.addColorStop(0.5, '#a080e0');
        gradient.addColorStop(1, '#e0c0ff');
        ctx.fillStyle = gradient;
        ctx.textAlign = 'center';
        ctx.fillText(result.typeCode, centerX, 100);
        ctx.shadowBlur = 0;

        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = '#e0d0ff';
        ctx.textAlign = 'center';
        ctx.fillText(result.typeInfo.name, centerX, 150);

        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.fillText(result.typeInfo.nickname, centerX, 185);

        drawDimensionBars(centerX, 220, result.dimensions);

        drawScrollIndicator(contentStartY);

        ctx.restore();
    }

    function drawScrollIndicator(contentStartY) {
        const scrollY = Math.max(0, state.scrollY || 0);
        const maxScroll = 600;
        const scrollPercentage = Math.min(1, scrollY / maxScroll);

        const indicatorX = width - 12;
        const indicatorTop = contentStartY + 10;
        const indicatorHeight = height - contentStartY - 110;
        const thumbHeight = Math.max(40, indicatorHeight * 0.3);
        const thumbY = indicatorTop + scrollPercentage * (indicatorHeight - thumbHeight);

        ctx.fillStyle = 'rgba(60, 50, 100, 0.4)';
        roundRect(indicatorX, indicatorTop, 4, indicatorHeight, 2);
        ctx.fill();

        if (maxScroll > 0) {
            ctx.fillStyle = 'rgba(150, 130, 220, 0.6)';
            roundRect(indicatorX, thumbY, 4, thumbHeight, 2);
            ctx.fill();
        }

        if (scrollY < 20) {
            ctx.font = '11px sans-serif';
            ctx.fillStyle = 'rgba(150, 130, 200, 0.6)';
            ctx.textAlign = 'center';
            ctx.fillText('↓ 向下滚动查看更多', width / 2, contentStartY - 5);
        }
    }

    function drawResultSectionTitle(centerX, y, text) {
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#d0c0f0';
        ctx.textAlign = 'left';
        ctx.fillText(text, centerX - 200, y);
    }

    function drawResultText(centerX, y, text) {
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#b0a0d0';
        ctx.textAlign = 'left';
        ctx.fillText(text, centerX - 180, y);
    }

    function drawDimensionBars(centerX, startY, dimensions) {
        const barWidth = 300;
        const barHeight = 12;
        const gap = 40;

        Object.entries(dimensions).forEach(([key, dim], i) => {
            const baseY = startY + i * gap;
            const textY = baseY + 10;
            const barY = baseY + 18;

            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#8070a0';
            ctx.textBaseline = 'alphabetic';
            ctx.textAlign = 'right';
            ctx.fillText(dim.leftName, centerX - barWidth / 2 - 10, textY);
            ctx.textAlign = 'left';
            ctx.fillText(dim.rightName, centerX + barWidth / 2 + 10, textY);

            ctx.fillStyle = 'rgba(60, 50, 100, 0.5)';
            ctx.fillRect(centerX - barWidth / 2, barY, barWidth, barHeight);

            if (dim.score !== 0) {
                const percentage = dim.percentage / 100;
                let fillWidth = (barWidth / 2) * percentage;
                let fillX;

                if (dim.score > 0) {
                    fillX = centerX - fillWidth;
                    const gradient = ctx.createLinearGradient(fillX, barY, centerX, barY);
                    gradient.addColorStop(0, '#a080e0');
                    gradient.addColorStop(1, '#6040a0');
                    ctx.fillStyle = gradient;
                } else {
                    fillX = centerX;
                    const gradient = ctx.createLinearGradient(centerX, barY, centerX + fillWidth, barY);
                    gradient.addColorStop(0, '#a080e0');
                    gradient.addColorStop(1, '#e0a0ff');
                    ctx.fillStyle = gradient;
                }

                ctx.fillRect(fillX, barY, fillWidth, barHeight);
            }

            ctx.fillStyle = 'rgba(150, 130, 200, 0.5)';
            ctx.fillRect(centerX - 1, barY - 2, 2, barHeight + 4);

            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = '#c0a0ff';
            ctx.textAlign = 'center';
            ctx.fillText(`${dim.score > 0 ? dim.left : dim.score < 0 ? dim.right : '-'} ${dim.percentage}%`, centerX, barY - 6);
        });
    }

    function drawResultActions(centerX, y) {
        const buttonWidth = 140;
        const buttonHeight = 40;
        const gap = 20;

        drawButton(
            centerX - buttonWidth - gap / 2,
            y,
            buttonWidth,
            buttonHeight,
            '重新测试',
            'normal',
            () => resetTest()
        );

        drawButton(
            centerX + gap / 2,
            y,
            buttonWidth,
            buttonHeight,
            '分享结果',
            'primary',
            () => shareResult()
        );
    }

    function drawHistoryScreen() {
        interactiveElements = [];
        ctx.textBaseline = 'alphabetic';

        const history = MBTIStorage.loadHistory();
        const centerX = width / 2;

        ctx.font = 'bold 32px sans-serif';
        ctx.fillStyle = '#e0d0ff';
        ctx.textAlign = 'center';
        ctx.fillText('历史记录', centerX, 80);

        if (history.length === 0) {
            ctx.font = '16px sans-serif';
            ctx.fillStyle = '#8070a0';
            ctx.fillText('暂无测试记录', centerX, height / 2);
        } else {
            const cardWidth = Math.min(400, width * 0.8);
            const cardHeight = 100;
            const gap = 20;
            const startY = 150;

            history.forEach((record, i) => {
                const y = startY + i * (cardHeight + gap);
                drawHistoryCard(centerX - cardWidth / 2, y, cardWidth, cardHeight, record);
            });
        }

        drawButton(centerX - 80, height - 100, 160, 40, '返回', 'normal', () => {
            if (state.isCompleted) {
                currentScreen = 'result';
            } else {
                currentScreen = 'welcome';
            }
        });
    }

    function drawHistoryCard(x, y, w, h, record) {
        ctx.fillStyle = 'rgba(40, 35, 80, 0.7)';
        ctx.strokeStyle = 'rgba(150, 130, 220, 0.4)';
        ctx.lineWidth = 1;
        roundRect(x, y, w, h, 12);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 28px serif';
        ctx.fillStyle = '#c0a0ff';
        ctx.textAlign = 'left';
        ctx.fillText(record.typeCode, x + 20, y + 40);

        if (record.typeInfo) {
            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#a090c0';
            ctx.fillText(record.typeInfo.name, x + 20, y + 65);
        }

        const date = new Date(record.date);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#706090';
        ctx.textAlign = 'right';
        ctx.fillText(date.toLocaleDateString(), x + w - 20, y + 40);
        ctx.fillText(date.toLocaleTimeString(), x + w - 20, y + 60);

        interactiveElements.push({
            x, y, w, h,
            onClick: () => viewHistoryRecord(record)
        });
    }

    function drawProgressBar(percentage) {
        const barWidth = Math.min(400, width * 0.6);
        const barHeight = 6;
        const x = (width - barWidth) / 2;
        const y = 40;

        ctx.fillStyle = 'rgba(60, 50, 100, 0.5)';
        roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();

        const fillWidth = (percentage / 100) * barWidth;
        if (fillWidth > 0) {
            const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
            gradient.addColorStop(0, '#8060c0');
            gradient.addColorStop(1, '#c0a0f0');
            ctx.fillStyle = gradient;
            roundRect(x, y, fillWidth, barHeight, 3);
            ctx.fill();
        }

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#8070a0';
        ctx.textAlign = 'right';
        ctx.fillText(`${percentage}%`, x + barWidth, y - 8);
    }

    function drawQuestionNumber(current, total) {
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.textAlign = 'left';
        ctx.fillText(`第 ${current} / ${total} 题`, 40, 50);
    }

    function drawNavigationButtons() {
        const btnSize = 40;
        const btnY = height - 50;

        if (state.currentQuestionIndex > 0) {
            drawButton(40, btnY, btnSize, btnSize, '←', 'normal', () => prevQuestion());
        }

        if (state.currentQuestionIndex < MBTIData.questions.length - 1) {
            drawButton(width - 40 - btnSize, btnY, btnSize, btnSize, '→', 'normal', () => nextQuestion());
        }
    }

    function drawButton(x, y, w, h, text, type, onClick) {
        const isPrimary = type === 'primary';
        
        ctx.save();
        ctx.shadowBlur = isPrimary ? 15 : 8;
        ctx.shadowColor = isPrimary ? 'rgba(180, 120, 220, 0.4)' : 'rgba(100, 80, 180, 0.3)';

        const gradient = ctx.createLinearGradient(x, y, x, y + h);
        if (isPrimary) {
            gradient.addColorStop(0, 'rgba(180, 120, 220, 0.9)');
            gradient.addColorStop(1, 'rgba(140, 80, 180, 0.95)');
        } else {
            gradient.addColorStop(0, 'rgba(100, 80, 180, 0.8)');
            gradient.addColorStop(1, 'rgba(60, 40, 120, 0.9)');
        }
        ctx.fillStyle = gradient;
        roundRect(x, y, w, h, 8);
        ctx.fill();

        ctx.strokeStyle = isPrimary ? 'rgba(220, 180, 255, 0.6)' : 'rgba(180, 160, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#e8e8ff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w / 2, y + h / 2);

        interactiveElements.push({ x, y, w, h, onClick });
    }

    function drawOptionButton(x, y, w, h, text, isSelected, onClick) {
        ctx.save();
        
        if (isSelected) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'rgba(150, 120, 220, 0.5)';
        }

        const gradient = ctx.createLinearGradient(x, y, x, y + h);
        if (isSelected) {
            gradient.addColorStop(0, 'rgba(100, 80, 180, 0.8)');
            gradient.addColorStop(1, 'rgba(80, 60, 160, 0.9)');
        } else {
            gradient.addColorStop(0, 'rgba(50, 40, 90, 0.7)');
            gradient.addColorStop(1, 'rgba(35, 25, 70, 0.8)');
        }
        ctx.fillStyle = gradient;
        roundRect(x, y, w, h, 12);
        ctx.fill();

        ctx.strokeStyle = isSelected ? 'rgba(200, 180, 255, 0.9)' : 'rgba(150, 130, 220, 0.4)';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();
        ctx.restore();

        if (isSelected) {
            ctx.beginPath();
            ctx.arc(x + 25, y + h / 2, 8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(180, 140, 240, 0.8)';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 25, y + h / 2, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(x + 25, y + h / 2, 8, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(150, 130, 200, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.font = '15px sans-serif';
        ctx.fillStyle = isSelected ? '#ffffff' : '#d0d0f0';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + 50, y + h / 2);

        interactiveElements.push({ x, y, w, h, onClick });
    }

    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function wrapText(text, maxWidth) {
        const words = text.split('');
        const lines = [];
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
            const testLine = currentLine + words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine !== '') {
            lines.push(currentLine);
        }
        return lines;
    }

    function setupEventListeners() {
        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('wheel', handleWheel);
    }

    function handleClick(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        handleInteraction(x, y);
    }

    function handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchEndX = touch.clientX;
        touchEndY = touch.clientY;
    }

    function handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        touchEndX = touch.clientX;
        touchEndY = touch.clientY;

        if (currentScreen === 'result') {
            const deltaY = touchStartY - touchEndY;
            if (Math.abs(deltaY) > 5) {
                const maxScroll = 600;
                state.scrollY = (state.scrollY || 0) + deltaY * 0.8;
                state.scrollY = Math.max(0, Math.min(maxScroll, state.scrollY));
                touchStartY = touchEndY;
            }
        }
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.changedTouches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const swipeDistanceX = touchEndX - touchStartX;
        const swipeDistanceY = touchEndY - touchStartY;

        if (currentScreen === 'result' && Math.abs(swipeDistanceY) > 10) {
            MBTIStorage.saveState(state);
        }

        if (Math.abs(swipeDistanceX) > 50 && Math.abs(swipeDistanceX) > Math.abs(swipeDistanceY)) {
            if (swipeDistanceX > 0) {
                handleSwipeLeft();
            } else {
                handleSwipeRight();
            }
        } else if (Math.abs(swipeDistanceX) < 10 && Math.abs(swipeDistanceY) < 10) {
            handleInteraction(x, y);
        }
    }

    function handleWheel(e) {
        if (currentScreen === 'result') {
            const maxScroll = 600;
            state.scrollY = (state.scrollY || 0) + e.deltaY;
            state.scrollY = Math.max(0, Math.min(maxScroll, state.scrollY));
            MBTIStorage.saveState(state);
        }
    }

    function handleInteraction(x, y) {
        for (const el of interactiveElements) {
            if (x >= el.x && x <= el.x + el.w && y >= el.y && y <= el.y + el.h) {
                if (el.onClick) {
                    el.onClick();
                }
                break;
            }
        }
    }

    function handleSwipeLeft() {
        if (currentScreen === 'question' && state.currentQuestionIndex > 0) {
            prevQuestion();
        }
    }

    function handleSwipeRight() {
        if (currentScreen === 'question' && state.currentQuestionIndex < MBTIData.questions.length - 1) {
            nextQuestion();
        }
    }

    function startTest() {
        currentScreen = 'question';
    }

    function selectOption(optionIndex) {
        const question = MBTIData.questions[state.currentQuestionIndex];
        state = MBTIStorage.setAnswer(question.id, optionIndex);
    }

    function prevQuestion() {
        if (state.currentQuestionIndex > 0) {
            state = MBTIStorage.setCurrentQuestion(state.currentQuestionIndex - 1);
        }
    }

    function nextQuestion() {
        if (state.currentQuestionIndex < MBTIData.questions.length - 1) {
            state = MBTIStorage.setCurrentQuestion(state.currentQuestionIndex + 1);
        }
    }

    function submitTest() {
        const result = MBTIScoring.calculateResult(state.answers);
        state = MBTIStorage.completeTest(result);
        state.scrollY = 0;
        currentScreen = 'result';
    }

    function resetTest() {
        state = MBTIStorage.resetTest();
        state.scrollY = 0;
        currentScreen = 'question';
    }

    function shareResult() {
        MBTIShare.generateShareCard(state.result);
    }

    function showHistory() {
        currentScreen = 'history';
    }

    function viewHistoryRecord(record) {
        state.result = record;
        state.scrollY = 0;
        currentScreen = 'result';
    }

    function setState(newState) {
        state = newState;
        if (state.isCompleted) {
            currentScreen = 'result';
        } else if (Object.keys(state.answers || {}).length > 0) {
            currentScreen = 'question';
        } else {
            currentScreen = 'welcome';
        }
    }

    function render() {
        drawBackground();

        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'start';

        switch (currentScreen) {
            case 'welcome':
                drawWelcomeScreen();
                break;
            case 'question':
                drawQuestionScreen();
                break;
            case 'result':
                drawResultScreen();
                break;
            case 'history':
                drawHistoryScreen();
                break;
        }

        animationId = requestAnimationFrame(render);
    }

    function start() {
        if (!animationId) {
            render();
        }
    }

    function stop() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    return {
        init,
        start,
        stop,
        setState,
        startTest,
        resetTest,
        showHistory
    };
})();
