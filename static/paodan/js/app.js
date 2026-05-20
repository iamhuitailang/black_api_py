window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');

    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    canvas.width = GameConfig.CANVAS_WIDTH;
    canvas.height = GameConfig.CANVAS_HEIGHT;

    Game.init(canvas);

    console.log('🎪 人间大炮 · 炮弹飞人 游戏已加载完成!');
    console.log('操作说明: ↑↓调整角度 | 长按空格蓄力 | 松开发射 | ESC暂停');
});

window.addEventListener('beforeunload', (e) => {
    if (Game.gameState === 'playing') {
        Game.saveGame();
    }
});


