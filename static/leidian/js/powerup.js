const PowerUp = (() => {
    let powerUps = [];
    
    const types = Object.keys(Config.POWERUP_TYPES);
    
    const create = (x, y) => {
        const typeKey = types[Math.floor(Math.random() * types.length)];
        const config = Config.POWERUP_TYPES[typeKey];
        return {
            type: typeKey,
            x,
            y,
            width: 24,
            height: 24,
            speed: 2,
            color: config.color,
            effect: config.effect,
            value: config.value || 0
        };
    };
    
    const add = (powerUp) => {
        powerUps.push(powerUp);
    };
    
    const update = () => {
        powerUps = powerUps.filter(powerUp => {
            powerUp.y += powerUp.speed;
            return powerUp.y < Config.CANVAS_HEIGHT + powerUp.height;
        });
    };
    
    const draw = (ctx) => {
        powerUps.forEach(powerUp => {
            ctx.save();
            ctx.fillStyle = powerUp.color;
            ctx.shadowColor = powerUp.color;
            ctx.shadowBlur = 15;
            
            ctx.beginPath();
            ctx.arc(powerUp.x + powerUp.width / 2, 
                    powerUp.y + powerUp.height / 2, 
                    powerUp.width / 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            let symbol = '?';
            switch (powerUp.effect) {
                case 'health':
                    symbol = '❤';
                    break;
                case 'doubleShot':
                    symbol = '⚡';
                    break;
                case 'speed':
                    symbol = '»';
                    break;
                case 'damage':
                    symbol = '✦';
                    break;
                case 'score':
                    symbol = '$';
                    break;
            }
            
            ctx.fillText(symbol, powerUp.x + powerUp.width / 2, 
                                  powerUp.y + powerUp.height / 2);
            
            ctx.restore();
        });
    };
    
    const clear = () => {
        powerUps = [];
    };
    
    const getPowerUps = () => powerUps;
    
    const remove = (index) => {
        powerUps.splice(index, 1);
    };
    
    const getState = () => ({
        powerUps: JSON.parse(JSON.stringify(powerUps))
    });
    
    const restoreState = (state) => {
        powerUps = state.powerUps || [];
    };
    
    return {
        create,
        add,
        update,
        draw,
        clear,
        getPowerUps,
        remove,
        getState,
        restoreState
    };
})();
