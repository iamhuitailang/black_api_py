document.addEventListener('DOMContentLoaded', () => {
    console.log('钢铁堡垒 · 坦克对战 游戏初始化...');
    
    UIManager.init();
    
    if (!Utils.isMobile()) {
        const mobileControls = document.getElementById('mobile-controls');
        if (mobileControls) {
            mobileControls.style.display = 'none';
        }
    }
    
    createBgParticles();
    
    console.log('游戏初始化完成，等待玩家操作...');
});

function createBgParticles() {
    const container = document.getElementById('bg-particles');
    if (!container) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'bg-particle';
        
        const size = Utils.random(2, 6);
        const duration = Utils.randomFloat(10, 30);
        const delay = Utils.randomFloat(0, 5);
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Utils.random(0, 100)}%`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.opacity = Utils.randomFloat(0.2, 0.6);
        
        container.appendChild(particle);
    }
}

window.addEventListener('resize', () => {
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen && gameScreen.style.display !== 'none') {
        const canvas = document.getElementById('game-canvas');
        if (canvas && GameManager.state === GameState.PLAYING) {
            const container = canvas.parentElement;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const scaleX = containerWidth / GameConfig.CANVAS_WIDTH;
            const scaleY = containerHeight / GameConfig.CANVAS_HEIGHT;
            const scale = Math.min(scaleX, scaleY, 1);
            canvas.style.transform = `scale(${scale})`;
            canvas.style.transformOrigin = 'center center';
        }
    }
});
