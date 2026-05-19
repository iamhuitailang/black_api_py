const Item = (function() {
    let items = [];
    let spawnTimer = 0;
    
    function init() {
        items = [];
        spawnTimer = 0;
    }
    
    function spawn() {
        const types = Object.values(Config.ITEM_TYPES);
        const totalProb = types.reduce((sum, t) => sum + t.probability, 0);
        
        let rand = Math.random() * totalProb;
        let selectedType = types[0];
        
        for (const type of types) {
            rand -= type.probability;
            if (rand <= 0) {
                selectedType = type;
                break;
            }
        }
        
        const x = Math.random() * (Config.CANVAS_WIDTH - 100) + 50;
        
        items.push({
            type: selectedType,
            x: x,
            y: -50,
            width: selectedType.width,
            height: selectedType.height,
            collected: false,
            bobOffset: Math.random() * Math.PI * 2
        });
    }
    
    function update(speed, deltaTime) {
        spawnTimer += deltaTime;
        const spawnInterval = 3000;
        
        if (spawnTimer >= spawnInterval) {
            spawn();
            spawnTimer = 0;
        }
        
        for (let i = items.length - 1; i >= 0; i--) {
            items[i].y += speed;
            items[i].bobOffset += 0.1;
            
            if (items[i].y > Config.CANVAS_HEIGHT + 100) {
                items.splice(i, 1);
            }
        }
    }
    
    function checkCollision(playerBounds) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.collected) continue;
            
            const itemBounds = {
                x: item.x - item.width / 2,
                y: item.y - item.height / 2,
                width: item.width,
                height: item.height
            };
            
            if (isColliding(playerBounds, itemBounds)) {
                item.collected = true;
                return { hit: true, type: item.type, item: item };
            }
        }
        return { hit: false };
    }
    
    function isColliding(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    function applyEffect(type) {
        if (type.effect === 'random') {
            const effects = ['speed_multiplier', 'shield', 'heal', 'score'];
            const randomEffect = effects[Math.floor(Math.random() * effects.length)];
            
            switch (randomEffect) {
                case 'speed_multiplier':
                    Player.setSpeedBoost(1.5, 5000);
                    break;
                case 'shield':
                    Player.setShield();
                    break;
                case 'heal':
                    Player.heal(1);
                    break;
                case 'score':
                    return { score: 300 };
            }
            return { effect: randomEffect };
        }
        
        switch (type.effect) {
            case 'speed_multiplier':
                Player.setSpeedBoost(type.value, type.duration);
                break;
            case 'shield':
                Player.setShield();
                break;
            case 'heal':
                Player.heal(type.value);
                break;
            case 'score':
                return { score: type.value };
        }
        
        return { effect: type.effect };
    }
    
    function draw(ctx) {
        items.forEach(item => {
            if (item.collected) return;
            
            const bobY = Math.sin(item.bobOffset) * 5;
            
            ctx.save();
            ctx.translate(item.x, item.y + bobY);
            
            ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
            ctx.shadowBlur = 15;
            
            ctx.font = `${item.height}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.type.emoji, 0, 0);
            
            ctx.restore();
        });
    }
    
    function getState() {
        return {
            items: items.map(i => ({
                typeId: i.type.id,
                x: i.x,
                y: i.y,
                width: i.width,
                height: i.height,
                collected: i.collected,
                bobOffset: i.bobOffset
            })),
            spawnTimer
        };
    }
    
    function loadState(state) {
        const typeMap = {};
        Object.values(Config.ITEM_TYPES).forEach(t => {
            typeMap[t.id] = t;
        });
        
        items = state.items.map(i => ({
            type: typeMap[i.typeId],
            x: i.x,
            y: i.y,
            width: i.width,
            height: i.height,
            collected: i.collected,
            bobOffset: i.bobOffset
        }));
        spawnTimer = state.spawnTimer;
    }
    
    return {
        init,
        update,
        checkCollision,
        applyEffect,
        draw,
        getState,
        loadState,
        getItems: () => items
    };
})();
