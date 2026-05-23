window.addEventListener('DOMContentLoaded', () => {
    Renderer.init();
    Input.init();
    Game.init();

    const savedState = Storage.loadGameState();

    if (savedState) {
        const startBtn = document.getElementById('start-btn');

        const resumeBtn = document.createElement('button');
        resumeBtn.id = 'resume-saved-btn';
        resumeBtn.className = 'btn-primary';
        resumeBtn.textContent = '继续游戏';
        resumeBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';

        resumeBtn.addEventListener('click', () => {
            Game.resumeSavedGame();
        });

        startBtn.parentNode.insertBefore(resumeBtn, startBtn.nextSibling);
    }

    Game.showScreen('start-screen');
});