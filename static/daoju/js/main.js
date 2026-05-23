window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    
    const dpr = Math.round(window.devicePixelRatio || 1);
    const displayWidth = GameConfig.CANVAS_WIDTH;
    const displayHeight = GameConfig.CANVAS_HEIGHT;
    
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.textBaseline = 'alphabetic';
    
    const game = new Game(canvas, ctx, displayWidth, displayHeight, dpr);
    
    game.start();
    
    window.game = game;
});
