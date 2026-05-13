const Renderer = {
    ctx: null,
    
    init(canvas) {
        this.ctx = canvas.getContext('2d');
    },
    
    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    },
    
    render() {
        this.clear();
        
        LevelManager.draw(this.ctx);
        
        for (const enemy of LevelManager.enemies) {
            enemy.draw(this.ctx);
        }
        
        Game.player.draw(this.ctx);
        
        CombatManager.draw(this.ctx);
    }
};