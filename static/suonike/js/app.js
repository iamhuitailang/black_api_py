document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const game = new Game(canvas);

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
        }
    });

    window.addEventListener('resize', () => {
        const container = document.getElementById('game-container');
        const aspectRatio = CONFIG.CANVAS_WIDTH / CONFIG.CANVAS_HEIGHT;
        
        let width = window.innerWidth;
        let height = window.innerHeight;
        
        if (width / height > aspectRatio) {
            width = height * aspectRatio;
        } else {
            height = width / aspectRatio;
        }
        
        container.style.width = `${width}px`;
        container.style.height = `${height}px`;
    });
});
