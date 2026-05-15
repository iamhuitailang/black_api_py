let game;

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('=== Motorcycle Stunt Game Initializing ===');
        
        game = new Game();
        
        console.log('Game initialized successfully!');
        console.log('Controls:');
        console.log('  ↑ / W - Accelerate');
        console.log('  ↓ / S - Brake');
        console.log('  ← / A - Wheelie (lift front)');
        console.log('  → / D - Stoppie (lift rear)');
        console.log('  R - Reset motorcycle');
        console.log('  ESC - Pause');
        
        document.getElementById('startBtn').addEventListener('click', () => {
            console.log('Start button clicked!');
            const savedState = storage.loadGameState();
            game.start(savedState !== null);
        });
        
        document.addEventListener('keydown', (e) => {
            if (game.gameState === 'playing') {
                if (e.key === 'Escape') {
                    game.pause();
                }
            } else if (game.gameState === 'paused') {
                if (e.key === 'Escape') {
                    game.resume();
                }
            }
        });
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        console.error(error.stack);
        alert('游戏初始化失败! 请按F12查看控制台错误详情。');
    }
});