class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    render(game) {
        this.clear();
        
        if (!game.currentLevel) return;
        
        game.currentLevel.drawBackground(this.ctx);
        game.currentLevel.drawPlayerReflection(this.ctx, game.player);
        
        game.items.forEach(item => item.draw(this.ctx));
        
        game.enemies.forEach(enemy => enemy.draw(this.ctx));
        
        if (game.boss) {
            game.boss.draw(this.ctx);
        }
        
        game.player.draw(this.ctx);
        
        game.floatingTexts.forEach(text => text.draw(this.ctx));
        
        particleSystem.draw(this.ctx);
        
        game.currentLevel.drawForeground(this.ctx);
    }
}
