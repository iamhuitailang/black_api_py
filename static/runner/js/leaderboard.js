document.addEventListener('DOMContentLoaded', () => {
    const leaderboardBody = document.getElementById('leaderboardBody');
    const emptyState = document.getElementById('emptyState');
    const backBtn = document.getElementById('backBtn');
    const refreshBtn = document.getElementById('refreshBtn');

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getRankClass(rank) {
        if (rank === 1) return 'rank-1';
        if (rank === 2) return 'rank-2';
        if (rank === 3) return 'rank-3';
        return '';
    }

    function getRankEmoji(rank) {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return rank;
    }

    async function loadLeaderboard() {
        leaderboardBody.innerHTML = '<tr class="loading-row"><td colspan="5">加载中...</td></tr>';
        emptyState.style.display = 'none';

        try {
            const response = await fetch('/api/runner/scores/get?limit=10');
            const result = await response.json();

            if (result.code === 0 && result.data && result.data.length > 0) {
                const html = result.data.map(item => `
                    <tr>
                        <td class="col-rank">
                            <span class="rank-badge ${getRankClass(item.rank)}">${getRankEmoji(item.rank)}</span>
                        </td>
                        <td class="col-name">${escapeHtml(item.player_name)}</td>
                        <td class="col-distance">${item.distance} m</td>
                        <td class="col-rings">${item.rings}</td>
                        <td class="col-date">${formatDate(item.created_at)}</td>
                    </tr>
                `).join('');
                leaderboardBody.innerHTML = html;
            } else {
                leaderboardBody.innerHTML = '';
                emptyState.style.display = 'block';
            }
        } catch (error) {
            leaderboardBody.innerHTML = '<tr class="loading-row"><td colspan="5">加载失败，请点击刷新重试</td></tr>';
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    backBtn.addEventListener('click', () => {
        window.location.href = '/';
    });

    refreshBtn.addEventListener('click', () => {
        loadLeaderboard();
    });

    loadLeaderboard();
});
