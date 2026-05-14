const Renderer = {
    canvas: null,
    ctx: null,
    theme: null,
    buttons: [],
    scale: 2,

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        const dpr = window.devicePixelRatio || 1;
        this.scale = dpr;
        
        this.canvas.width = CONFIG.CANVAS_WIDTH * dpr;
        this.canvas.height = CONFIG.CANVAS_HEIGHT * dpr;
        this.canvas.style.width = CONFIG.CANVAS_WIDTH + 'px';
        this.canvas.style.height = CONFIG.CANVAS_HEIGHT + 'px';
        
        this.ctx.scale(dpr, dpr);
        
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    },

    setTheme(themeName) {
        this.theme = CONFIG.THEMES[themeName];
        document.body.className = `theme-${themeName}`;
    },

    clear() {
        this.ctx.fillStyle = this.theme.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    drawRoundRect(x, y, width, height, radius, fillColor, strokeColor = null) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        
        if (fillColor) {
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
        }
        if (strokeColor) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    },

    drawButton(x, y, width, height, text, color, id, emoji = '') {
        this.drawRoundRect(x, y, width, height, 10, color);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const displayText = emoji ? `${emoji} ${text}` : text;
        this.ctx.fillText(displayText, Math.round(x + width / 2), Math.round(y + height / 2));

        this.buttons.push({ x, y, width, height, id });
    },

    drawText(text, x, y, size, color, align = 'center') {
        this.ctx.fillStyle = color;
        this.ctx.font = `bold ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, Math.round(x), Math.round(y));
    },

    drawMenu(gameData) {
        this.buttons = [];
        
        this.drawText('🎲 口算练习器', 400, 70, 32, this.theme.primary);
        this.drawText('算术挑战', 400, 115, 20, '#666666');

        this.drawText('选择难度', 400, 170, 20, this.theme.primary);
        const difficulties = Object.keys(CONFIG.DIFFICULTIES);
        difficulties.forEach((diff, index) => {
            const config = CONFIG.DIFFICULTIES[diff];
            const x = 100 + index * 220;
            const isSelected = gameData.difficulty === diff;
            const color = isSelected ? config.color : '#E0E0E0';
            this.drawButton(x, 195, 180, 45, config.name, color, `diff_${diff}`, config.emoji);
        });

        this.drawText('选择主题', 400, 275, 20, this.theme.primary);
        const themes = Object.keys(CONFIG.THEMES);
        themes.forEach((theme, index) => {
            const config = CONFIG.THEMES[theme];
            const x = 100 + index * 220;
            const isSelected = gameData.theme === theme;
            const color = isSelected ? config.primary : '#E0E0E0';
            this.drawButton(x, 300, 180, 45, config.name, color, `theme_${theme}`, config.emoji);
        });

        this.drawButton(250, 420, 300, 55, '开始练习', this.theme.accent, 'start', '🚀');
    },

    drawPlaying(gameData) {
        this.buttons = [];
        
        const progress = (gameData.questionIndex / CONFIG.TARGET_QUESTIONS) * 100;
        this.drawRoundRect(50, 15, 700, 14, 7, '#E0E0E0');
        if (progress > 0) {
            const progressWidth = Math.max(14, 7 * progress);
            this.drawRoundRect(50, 15, progressWidth, 14, 7, this.theme.accent);
        }
        
        this.drawText(`第 ${gameData.questionIndex + 1} / ${CONFIG.TARGET_QUESTIONS} 题`, 400, 52, 16, '#666666');

        const stats = gameData.statistics;
        this.drawText(`✅ ${stats.correct}`, 150, 82, 16, '#4CAF50');
        this.drawText(`❌ ${stats.wrong}`, 250, 82, 16, '#F44336');
        this.drawText(`⏱️ ${Timer.formatTime(Timer.getTotalTime())}`, 650, 82, 16, '#666666');

        if (gameData.currentQuestion) {
            const question = gameData.currentQuestion;
            this.drawRoundRect(100, 110, 600, 75, 14, this.theme.secondary);
            this.drawText(question.display.replace(' = ?', ''), 400, 148, 34, this.theme.primary);
        }

        this.drawRoundRect(100, 205, 600, 48, 10, '#FFFFFF', this.theme.primary);
        const answerText = gameData.userAnswer || '请输入答案';
        const answerColor = gameData.userAnswer ? '#333333' : '#CCCCCC';
        this.drawText(answerText, 400, 229, 22, answerColor);

        if (gameData.isAnswered) {
            const resultColor = gameData.lastAnswerCorrect ? this.theme.correct : this.theme.wrong;
            const resultText = gameData.lastAnswerCorrect ? '✅ 正确！' : `❌ 错误！正确答案: ${gameData.currentQuestion.answer}`;
            this.drawText(resultText, 400, 272, 17, resultColor);
        }

        this.drawNumpad();

        if (gameData.isAnswered) {
            if (gameData.questionIndex + 1 >= CONFIG.TARGET_QUESTIONS) {
                this.drawButton(250, 520, 300, 42, '查看结果', this.theme.accent, 'showResult', '📊');
            } else {
                this.drawButton(250, 520, 300, 42, '下一题', this.theme.accent, 'nextQuestion', '➡️');
            }
        } else {
            this.drawButton(550, 520, 150, 42, '提交', this.theme.accent, 'submit', '✓');
        }
        
        this.drawButton(100, 520, 120, 42, '返回', '#9E9E9E', 'backToMenu', '🏠');
    },

    drawNumpad() {
        const numpadX = 150;
        const numpadY = 305;
        const btnSize = 42;
        const gap = 7;

        const nums = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '←'];
        
        nums.forEach((num, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const x = numpadX + col * (btnSize + gap);
            const y = numpadY + row * (btnSize + gap);
            
            const color = num === 'C' ? '#FF6B6B' : num === '←' ? '#FFB74D' : '#90CAF9';
            this.drawButton(x, y, btnSize, btnSize, num, color, `num_${num}`);
        });
    },

    drawResult(gameData) {
        this.buttons = [];
        
        const stats = gameData.statistics;
        const grade = Statistics.getGrade();
        const accuracy = Statistics.getAccuracy();

        this.drawText('📊 练习完成！', 400, 60, 32, this.theme.primary);
        
        this.drawRoundRect(250, 100, 300, 120, 16, this.theme.secondary);
        this.drawText(`${grade.emoji} ${grade.grade}`, 400, 145, 44, grade.color);
        this.drawText(`正确率: ${accuracy.toFixed(1)}%`, 400, 195, 20, '#666666');

        this.drawRoundRect(50, 240, 700, 110, 12, '#FFFFFF', this.theme.primary);
        this.drawText(`✅ 正确: ${stats.correct} 题`, 200, 275, 20, '#4CAF50', 'left');
        this.drawText(`❌ 错误: ${stats.wrong} 题`, 200, 320, 20, '#F44336', 'left');
        this.drawText(`⏱️ 总用时: ${Timer.formatTime(stats.totalTime)}`, 450, 275, 20, '#2196F3', 'left');
        this.drawText(`⏱️ 平均: ${Statistics.getAverageTime().toFixed(1)}秒/题`, 450, 320, 20, '#9C27B0', 'left');

        if (gameData.history && gameData.history.length > 0) {
            this.drawText('答题记录:', 400, 380, 16, '#666666');
            let historyText = gameData.history.map((h, i) => {
                return h.correct ? '✅' : '❌';
            }).join(' ');
            this.drawText(historyText, 400, 410, 14, '#888888');
        }

        this.drawButton(150, 500, 200, 45, '再来一次', this.theme.accent, 'restart', '🔄');
        this.drawButton(450, 500, 200, 45, '返回菜单', '#9E9E9E', 'backToMenu', '🏠');
    },

    getClickedButton(mouseX, mouseY) {
        for (const btn of this.buttons) {
            if (mouseX >= btn.x && mouseX <= btn.x + btn.width &&
                mouseY >= btn.y && mouseY <= btn.y + btn.height) {
                return btn.id;
            }
        }
        return null;
    }
};