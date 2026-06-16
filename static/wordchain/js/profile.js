document.addEventListener('DOMContentLoaded', function() {
    if (!api.token) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(localStorage.getItem('wordchain_user') || '{}');
    const username = user.username || '玩家';
    
    document.getElementById('profileUsername').textContent = username;
    document.getElementById('userAvatar').textContent = username.charAt(0).toUpperCase();

    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'game.html';
    });

    document.getElementById('playBtn').addEventListener('click', () => {
        window.location.href = 'game.html';
    });

    document.getElementById('logoutBtn').addEventListener('click', logout);

    loadUserStats();
});

async function loadUserStats() {
    const result = await api.getUserStats();
    
    if (result.code === 0 && result.data) {
        const stats = result.data.stats;
        const firstCharStats = result.data.first_char_stats;
        
        if (stats) {
            document.getElementById('totalGames').textContent = stats.total_games || 0;
            
            const winRate = stats.win_rate ? (stats.win_rate * 100).toFixed(1) + '%' : '0%';
            document.getElementById('winRate').textContent = winRate;
            
            document.getElementById('maxStreak').textContent = stats.max_winning_streak || 0;
            document.getElementById('bestScore').textContent = stats.best_score || 0;
        }
        
        if (firstCharStats && firstCharStats.length > 0) {
            renderChart(firstCharStats);
        }
    } else {
        showToast('加载统计数据失败', 'error');
    }
}

function renderChart(data) {
    const container = document.getElementById('chartContainer');
    container.innerHTML = '';
    
    const maxCount = Math.max(...data.map(item => item.count));
    
    data.forEach(item => {
        const percentage = (item.count / maxCount) * 100;
        
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.innerHTML = `
            <div class="bar-wrapper">
                <div class="bar" style="height: ${percentage}%;">
                    <span class="bar-value">${item.count}</span>
                </div>
            </div>
            <div class="bar-label">${item.first_char}</div>
        `;
        container.appendChild(bar);
    });
}

async function logout() {
    await api.logout();
    api.clearToken();
    localStorage.removeItem('wordchain_user');
    window.location.href = 'index.html';
}
