let currentUser = null;
let currentPeriod = localStorage.getItem('ranking_period') || 'all';
let currentScore = 0;
let isGameActive = false;
let currentNavPage = localStorage.getItem('ranking_nav_page') || 'leaderboard-page';

document.addEventListener('DOMContentLoaded', async () => {
    initEventListeners();
    await checkAuth();
    loadLeaderboard();
});

async function checkAuth() {
    const result = await api.getCurrentUser();
    if (result.code === 0 && result.data) {
        currentUser = result.data;
        showLoggedInState();
    } else {
        showLoggedOutState();
    }
}

function showLoggedInState() {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));

    document.querySelector('.nav').style.display = 'flex';
    document.querySelector('.user-header').style.display = 'flex';
    document.querySelector('.username').textContent = currentUser.username;
    document.querySelector('.avatar').textContent = currentUser.username.charAt(0).toUpperCase();

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === currentPeriod) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === currentNavPage) {
            btn.classList.add('active');
        }
    });

    document.getElementById(currentNavPage).classList.add('active');
    loadUserStats();
    loadUserHistory();
}

function showLoggedOutState() {
    document.querySelectorAll('.main-page').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.auth-page').forEach(el => el.classList.add('active'));
    document.querySelector('.nav').style.display = 'none';
    document.querySelector('.user-header').style.display = 'none';
    currentUser = null;
}

function initEventListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(btn.dataset.page).classList.add('active');
            currentNavPage = btn.dataset.page;
            localStorage.setItem('ranking_nav_page', currentNavPage);
        });
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPeriod = btn.dataset.period;
            localStorage.setItem('ranking_period', currentPeriod);
            loadLeaderboard();
        });
    });

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    document.querySelectorAll('.switch-auth').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.auth-form').forEach(form => {
                form.style.display = form.style.display === 'none' ? 'block' : 'none';
            });
        });
    });

    document.querySelector('.logout-btn').addEventListener('click', handleLogout);

    document.getElementById('startGameBtn').addEventListener('click', startGame);
    document.getElementById('submitScoreBtn').addEventListener('click', submitCurrentScore);
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const result = await api.login(username, password);
    if (result.code === 0) {
        api.setToken(result.data.token);
        currentUser = result.data.user;
        showMessage('登录成功！', 'success');
        showLoggedInState();
    } else {
        showMessage(result.msg || '登录失败', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (password !== confirmPassword) {
        showMessage('两次输入的密码不一致', 'error');
        return;
    }

    const result = await api.register(username, password);
    if (result.code === 0) {
        api.setToken(result.data.token);
        currentUser = result.data.user;
        showMessage('注册成功！', 'success');
        showLoggedInState();
    } else {
        showMessage(result.msg || '注册失败', 'error');
    }
}

async function handleLogout() {
    await api.logout();
    api.clearToken();
    showLoggedOutState();
    showMessage('已退出登录', 'success');
}

async function loadLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">加载中...</div>';

    try {
        const result = await api.getLeaderboard('flappy_bird', currentPeriod, 50);

        if (result.code === 0 && result.data) {
            const scores = result.data.scores || [];
            leaderboardList.innerHTML = '';

            if (scores.length === 0) {
                leaderboardList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">暂无数据</div>';
                return;
            }

            scores.forEach((item, index) => {
                const rank = index + 1;
                let rankClass = 'rank-other';
                if (rank === 1) rankClass = 'rank-1';
                else if (rank === 2) rankClass = 'rank-2';
                else if (rank === 3) rankClass = 'rank-3';

                const div = document.createElement('div');
                div.className = 'leaderboard-item';
                div.innerHTML = `
                    <div class="rank ${rankClass}">${rank}</div>
                    <div class="player-info">
                        <div class="player-name">${item.username}</div>
                    </div>
                    <div class="player-score">${item.score.toLocaleString()}</div>
                `;
                leaderboardList.appendChild(div);
            });
        }
    } catch (error) {
        console.error('加载排行榜失败:', error);
        leaderboardList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--error-color);">加载失败，请重试</div>';
    }
}

async function loadUserStats() {
    const result = await api.getUserRank('flappy_bird', 'all');
    if (result.code === 0 && result.data) {
        document.getElementById('bestScore').textContent = result.data.best_score || 0;
        document.getElementById('currentRank').textContent = result.data.rank || '-';
    }
}

async function loadUserHistory() {
    const result = await api.getUserHistory(null, 10);
    const historyList = document.getElementById('historyList');

    if (result.code === 0 && result.data) {
        const history = result.data || [];
        historyList.innerHTML = '';

        if (history.length === 0) {
            historyList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">暂无历史记录</div>';
            return;
        }

        history.forEach(item => {
            const date = new Date(item.created_at).toLocaleString();
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div>
                    <div class="history-score">${item.score.toLocaleString()}</div>
                    <div class="history-date">${date}</div>
                </div>
            `;
            historyList.appendChild(div);
        });
    }
}

function startGame() {
    isGameActive = true;
    currentScore = 0;
    document.getElementById('currentScore').textContent = currentScore;
    document.getElementById('startGameBtn').style.display = 'none';
    document.getElementById('submitScoreBtn').style.display = 'inline-block';

    let gameInterval = setInterval(() => {
        if (!isGameActive) {
            clearInterval(gameInterval);
            return;
        }
        currentScore += Math.floor(Math.random() * 10) + 1;
        document.getElementById('currentScore').textContent = currentScore.toLocaleString();
    }, 500);

    setTimeout(() => {
        isGameActive = false;
        document.getElementById('startGameBtn').style.display = 'inline-block';
        document.getElementById('submitScoreBtn').style.display = 'none';
    }, 5000);
}

async function submitCurrentScore() {
    if (!currentScore) {
        showMessage('请先开始游戏', 'error');
        return;
    }

    const periods = ['daily', 'weekly', 'monthly', 'all'];
    let allSubmitted = true;

    for (const period of periods) {
        const result = await api.submitScore('flappy_bird', period, currentScore);
        if (result.code !== 0) {
            allSubmitted = false;
        }
    }

    if (allSubmitted) {
        showMessage('分数提交成功！', 'success');
        loadLeaderboard();
        loadUserStats();
        loadUserHistory();
    } else {
        showMessage('部分分数提交失败', 'error');
    }

    currentScore = 0;
    document.getElementById('currentScore').textContent = '0';
}

function showMessage(text, type = 'success') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type} show`;

    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 3000);
}
