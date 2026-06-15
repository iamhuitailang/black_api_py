const API_BASE = '/api';

const songs = [
    { id: 'song1', name: '夜色初章', bpm: 100, difficulty: 'Easy', difficultyLabel: '简单' },
    { id: 'song2', name: '霓虹狂奔', bpm: 130, difficulty: 'Normal', difficultyLabel: '普通' },
    { id: 'song3', name: '极速都市', bpm: 160, difficulty: 'Hard', difficultyLabel: '困难' }
];

let game = null;
let selectedSong = null;
let playerName = '';
let currentStats = null;

const STORAGE_KEY = 'rhythm_run_player_name';
const SONG_STORAGE_KEY = 'rhythm_run_selected_song';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    game = new RhythmRunGame(canvas);

    const savedName = localStorage.getItem(STORAGE_KEY);
    if (savedName) {
        playerName = savedName;
        document.getElementById('player-name').value = savedName;
    }

    initSongList();

    const savedSong = localStorage.getItem(SONG_STORAGE_KEY);
    if (savedSong) {
        selectSong(savedSong);
    }

    bindEvents();
    setupGameCallbacks();

    window.addEventListener('beforeunload', (e) => {
        if (game && game.gameState === 'playing') {
            e.preventDefault();
            e.returnValue = '游戏正在进行中，刷新页面将丢失当前进度，确定要刷新吗？';
            return e.returnValue;
        }
    });
});

function initSongList() {
    const songList = document.getElementById('song-list');
    songList.innerHTML = '';

    songs.forEach((song, index) => {
        const div = document.createElement('div');
        div.className = 'song-item' + (index === 0 ? ' selected' : '');
        div.dataset.songId = song.id;
        div.innerHTML = `
            <div class="song-name">${song.name}</div>
            <div class="song-info">
                <span class="difficulty-${song.difficulty.toLowerCase()}">${song.difficultyLabel}</span>
                · ${song.bpm} BPM
            </div>
        `;
        div.addEventListener('click', () => selectSong(song.id));
        songList.appendChild(div);
    });

    selectedSong = songs[0];
}

function selectSong(songId) {
    selectedSong = songs.find(s => s.id === songId);

    document.querySelectorAll('.song-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.songId === songId);
    });

    localStorage.setItem(SONG_STORAGE_KEY, songId);
}

function bindEvents() {
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('show-leaderboard-btn').addEventListener('click', showLeaderboard);
    document.getElementById('retry-btn').addEventListener('click', retryGame);
    document.getElementById('back-btn').addEventListener('click', backToSelect);
    document.getElementById('lb-back-btn').addEventListener('click', backToSelect);

    document.querySelectorAll('.lb-song-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.lb-song-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            loadLeaderboard(e.target.dataset.song);
        });
    });

    document.getElementById('player-name').addEventListener('input', (e) => {
        playerName = e.target.value.trim();
        clearError();
    });
}

function setupGameCallbacks() {
    game.onScoreUpdate = (score) => {
        document.getElementById('score-display').textContent = score.toLocaleString();
    };

    game.onComboUpdate = (combo) => {
        const comboEl = document.getElementById('combo-count');
        comboEl.textContent = combo;
        if (combo > 0 && combo % 50 === 0) {
            comboEl.classList.add('pulse');
            setTimeout(() => comboEl.classList.remove('pulse'), 200);
            showCelebration(combo);
        }
    };

    game.onJudgement = (judgement) => {
        showJudgementPopup(judgement);
    };

    game.onProgressUpdate = (progress) => {
        document.getElementById('progress-fill').style.width = (progress * 100) + '%';
    };

    game.onGameEnd = (stats) => {
        currentStats = stats;
        showResult(stats);
        submitScore(stats);
    };
}

function showJudgementPopup(judgement) {
    const gameScreen = document.getElementById('game-screen');
    const popup = document.createElement('div');
    popup.className = `judgement-popup ${judgement}`;
    popup.textContent = judgement.toUpperCase();
    gameScreen.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 600);
}

function showCelebration(combo) {
    const gameScreen = document.getElementById('game-screen');
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    celebration.textContent = `${combo} COMBO!`;
    gameScreen.appendChild(celebration);

    setTimeout(() => {
        celebration.remove();
    }, 1000);
}

function startGame() {
    const nameInput = document.getElementById('player-name');
    playerName = nameInput.value.trim();

    if (!playerName) {
        showError('请输入玩家名称后再开始游戏');
        nameInput.focus();
        return;
    }

    if (playerName.length < 2) {
        showError('玩家名称至少需要2个字符');
        nameInput.focus();
        return;
    }

    if (playerName.length > 20) {
        showError('玩家名称不能超过20个字符');
        nameInput.focus();
        return;
    }

    localStorage.setItem(STORAGE_KEY, playerName);

    game.setSong(selectedSong);

    document.getElementById('song-info-display').textContent = selectedSong.name;
    document.getElementById('score-display').textContent = '0';
    document.getElementById('combo-count').textContent = '0';
    document.getElementById('progress-fill').style.width = '0%';

    showScreen('game-screen');
    game.start();
}

function showError(message) {
    clearError();
    const playerInput = document.querySelector('.player-input');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = '#ff6b6b';
    errorDiv.style.fontSize = '13px';
    errorDiv.style.marginTop = '8px';
    errorDiv.style.textAlign = 'center';
    playerInput.appendChild(errorDiv);

    const nameInput = document.getElementById('player-name');
    nameInput.style.borderColor = '#ff6b6b';
    nameInput.style.boxShadow = '0 0 10px rgba(255, 107, 107, 0.3)';
}

function clearError() {
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    const nameInput = document.getElementById('player-name');
    nameInput.style.borderColor = '';
    nameInput.style.boxShadow = '';
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showResult(stats) {
    const total = stats.perfectCount + stats.goodCount + stats.missCount;
    let rating = 'C';
    if (total > 0) {
        const perfectRate = stats.perfectCount / total;
        if (perfectRate >= 0.95) rating = 'S';
        else if (perfectRate >= 0.80) rating = 'A';
        else if (perfectRate >= 0.60) rating = 'B';
    }

    const ratingEl = document.getElementById('rating-display');
    ratingEl.textContent = rating;
    ratingEl.className = `rating-display rating-${rating}`;

    document.getElementById('result-score').textContent = stats.score.toLocaleString();
    document.getElementById('result-combo').textContent = stats.maxCombo;
    document.getElementById('result-perfect').textContent = stats.perfectCount;
    document.getElementById('result-good').textContent = stats.goodCount;
    document.getElementById('result-miss').textContent = stats.missCount;

    showScreen('result-screen');
}

function submitScore(stats) {
    const total = stats.perfectCount + stats.goodCount + stats.missCount;
    let rating = 'C';
    if (total > 0) {
        const perfectRate = stats.perfectCount / total;
        if (perfectRate >= 0.95) rating = 'S';
        else if (perfectRate >= 0.80) rating = 'A';
        else if (perfectRate >= 0.60) rating = 'B';
    }

    fetch(`${API_BASE}/rhythmrunsummary/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            player_name: playerName,
            song: selectedSong.id,
            score: stats.score,
            max_combo: stats.maxCombo,
            perfect_count: stats.perfectCount,
            good_count: stats.goodCount,
            miss_count: stats.missCount
        })
    }).catch(err => console.error('Failed to submit score:', err));
}

function retryGame() {
    showScreen('game-screen');
    game.setSong(selectedSong);
    document.getElementById('score-display').textContent = '0';
    document.getElementById('combo-count').textContent = '0';
    document.getElementById('progress-fill').style.width = '0%';
    game.start();
}

function backToSelect() {
    game.stop();
    showScreen('start-screen');
}

function showLeaderboard() {
    showScreen('leaderboard-screen');
    loadLeaderboard('song1');
}

function loadLeaderboard(songId) {
    fetch(`${API_BASE}/rhythmrunleaderboard/get?song=${songId}&limit=20`)
        .then(res => res.json())
        .then(data => {
            if (data.code === 0) {
                renderLeaderboard(data.data.items);
            }
        })
        .catch(err => {
            console.error('Failed to load leaderboard:', err);
            renderLeaderboard([]);
        });
}

function renderLeaderboard(items) {
    const listEl = document.getElementById('leaderboard-list');

    if (!items || items.length === 0) {
        listEl.innerHTML = '<div class="lb-empty">暂无记录，快来创造第一个吧！</div>';
        return;
    }

    let html = '';
    items.forEach((item, index) => {
        const rankClass = index < 3 ? `rank-${index + 1}` : '';
        html += `
            <div class="lb-item">
                <div class="lb-rank ${rankClass}">#${item.rank}</div>
                <div class="lb-player">${escapeHtml(item.player_name)}</div>
                <div class="lb-score">${item.score.toLocaleString()}</div>
                <div class="lb-rating rating-${item.rating}">${item.rating}</div>
            </div>
        `;
    });

    listEl.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
