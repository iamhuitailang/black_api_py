document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init('game-board');
    game.loadHighScores();

    const restartBtn = document.getElementById('restart-btn');
    const hintBtn = document.getElementById('hint-btn');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const retryBtn = document.getElementById('retry-btn');

    restartBtn.addEventListener('click', () => {
        game.retryLevel();
    });

    hintBtn.addEventListener('click', () => {
        game.showHint();
    });

    nextLevelBtn.addEventListener('click', () => {
        game.nextLevel();
    });

    retryBtn.addEventListener('click', () => {
        game.retryLevel();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'r' || e.key === 'R') {
            game.retryLevel();
        } else if (e.key === 'h' || e.key === 'H') {
            game.showHint();
        } else if (e.key === 'n' || e.key === 'N') {
            if (game.score >= game.target) {
                game.nextLevel();
            }
        }
    });

    console.log('🎮 齿轮消除游戏已加载！');
    console.log('快捷键: R-重新开始, H-提示, N-下一关(过关后)');
});
