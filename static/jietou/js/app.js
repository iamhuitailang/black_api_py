document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    canvas.width = 1280;
    canvas.height = 720;

    const game = new Game(canvas);
    game.init();
});