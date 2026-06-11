document.addEventListener('DOMContentLoaded', () => {
    const playerNameInput = document.getElementById('playerName');
    const startBtn = document.getElementById('startBtn');
    const leaderboardBtn = document.getElementById('leaderboardBtn');

    const savedName = localStorage.getItem('runner_player_name');
    if (savedName) {
        playerNameInput.value = savedName;
    }

    function startGame() {
        const playerName = playerNameInput.value.trim();
        if (!playerName) {
            playerNameInput.focus();
            playerNameInput.style.borderColor = '#FF4444';
            setTimeout(() => {
                playerNameInput.style.borderColor = '';
            }, 1000);
            return;
        }

        localStorage.setItem('runner_player_name', playerName);
        window.location.href = '/game';
    }

    function goToLeaderboard() {
        window.location.href = '/leaderboard';
    }

    startBtn.addEventListener('click', startGame);
    leaderboardBtn.addEventListener('click', goToLeaderboard);

    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startGame();
        }
    });
});
