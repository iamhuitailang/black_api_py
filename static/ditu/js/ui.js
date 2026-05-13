const UI = {
    updateScore(score) {
        document.getElementById('score').textContent = score;
    },

    updateStreak(streak) {
        document.getElementById('streak').textContent = streak;
    },

    updateAccuracy(accuracy) {
        document.getElementById('accuracy').textContent = accuracy + '%';
    },

    updateTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timeStr = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        document.getElementById('time').textContent = timeStr;
        
        const timerElement = document.querySelector('.timer');
        if (seconds <= CONFIG.WARNING_TIME) {
            timerElement.classList.add('warning');
        } else {
            timerElement.classList.remove('warning');
        }
    },

    showInputModal(province, type) {
        const modal = document.getElementById('inputModal');
        const title = document.getElementById('questionTitle');
        const input = document.getElementById('answerInput');
        const suggestions = document.getElementById('pinyinSuggestions');
        
        let titleText = '';
        switch (type) {
            case 'name': titleText = '请输入省份名称'; break;
            case 'short': titleText = '请输入省份简称'; break;
            case 'capital': titleText = '请输入省会/首府'; break;
        }
        title.textContent = titleText;
        
        input.value = '';
        suggestions.classList.add('hidden');
        
        document.getElementById('hintCount').textContent = CONFIG.MAX_HINTS - (province.hintsUsed || 0);
        
        modal.classList.remove('hidden');
        setTimeout(() => input.focus(), 100);
    },

    hideInputModal() {
        document.getElementById('inputModal').classList.add('hidden');
    },

    updateHintCount(count) {
        document.getElementById('hintCount').textContent = count;
    },

    showSuggestions(suggestions) {
        const container = document.getElementById('pinyinSuggestions');
        if (suggestions.length === 0) {
            container.classList.add('hidden');
            return;
        }
        
        container.innerHTML = suggestions.map(s => 
            `<div class="suggestion-item" data-value="${s}">${s}</div>`
        ).join('');
        
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                document.getElementById('answerInput').value = item.dataset.value;
                container.classList.add('hidden');
            });
        });
        
        container.classList.remove('hidden');
    },

    showStartScreen() {
        const resumeBtn = document.getElementById('resumeBtn');
        if (Storage.hasSavedGame()) {
            resumeBtn.classList.remove('hidden');
        } else {
            resumeBtn.classList.add('hidden');
        }
        document.getElementById('startScreen').classList.remove('hidden');
    },

    hideStartScreen() {
        document.getElementById('startScreen').classList.add('hidden');
    },

    showPauseScreen() {
        document.getElementById('pauseScreen').classList.remove('hidden');
    },

    hidePauseScreen() {
        document.getElementById('pauseScreen').classList.add('hidden');
    },

    showResultScreen(victory, stats) {
        const title = document.getElementById('resultTitle');
        title.textContent = victory ? '🎉 通关成功！' : '😢 挑战失败';
        
        document.getElementById('finalScore').textContent = stats.score;
        document.getElementById('finalAccuracy').textContent = stats.accuracy + '%';
        
        const minutes = Math.floor(stats.time / 60);
        const secs = stats.time % 60;
        document.getElementById('finalTime').textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
        
        document.getElementById('resultScreen').classList.remove('hidden');
    },

    hideResultScreen() {
        document.getElementById('resultScreen').classList.add('hidden');
    },

    init() {
        this.showStartScreen();
        
        document.getElementById('resumeGameBtn').addEventListener('click', () => {
            Game.resumeFromPause();
        });

        document.getElementById('resumeBtn').addEventListener('click', () => {
            Game.resumeGame();
        });
    }
};
