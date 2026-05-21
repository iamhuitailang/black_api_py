class Item {
    constructor(options = {}) {
        this.type = options.type || 'boost';
        this.lane = options.lane || Utils.randomInt(0, CONFIG.GAME.LANES - 1);
        this.distance = options.distance || 0;
        this.collected = false;
        this.width = 40;
        this.height = 40;
    }

    getIcon() {
        const icons = {
            boost: '⚡',
            shield: '🛡️',
            bomb: '💣',
            trap: '🕳️'
        };
        return icons[this.type] || '?';
    }

    getColor() {
        const colors = {
            boost: '#FFD700',
            shield: '#4FC3F7',
            bomb: '#EF5350',
            trap: '#66BB6A'
        };
        return colors[this.type] || '#888';
    }
}

class ItemManager {
    constructor() {
        this.items = [];
        this.spawnTimer = 0;
        this.placedTraps = [];
    }

    update(deltaTime, players, cameraDistance) {
        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0 && this.items.length < CONFIG.ITEMS.MAX_ON_TRACK) {
            this.spawnItem(cameraDistance);
            this.spawnTimer = CONFIG.ITEMS.SPAWN_INTERVAL;
        }

        this.checkCollisions(players);
        this.cleanup(cameraDistance);
        this.updateTraps(deltaTime, players);
    }

    spawnItem(cameraDistance) {
        const types = ['boost', 'shield', 'bomb', 'trap'];
        const item = new Item({
            type: Utils.randomChoice(types),
            lane: Utils.randomInt(0, CONFIG.GAME.LANES - 1),
            distance: cameraDistance + Utils.random(500, 1000)
        });
        this.items.push(item);
    }

    checkCollisions(players) {
        for (const player of players) {
            if (player.finished) continue;

            for (const item of this.items) {
                if (item.collected) continue;

                const distDiff = Math.abs(item.distance - player.distance);
                const laneDiff = Math.abs(Math.round(player.lane) - item.lane);

                if (distDiff < 30 && laneDiff < 1) {
                    if (player.pickupItem(item.type)) {
                        item.collected = true;
                    }
                }
            }
        }
    }

    updateTraps(deltaTime, players) {
        this.placedTraps = this.placedTraps.filter(trap => {
            trap.lifetime -= deltaTime;
            
            for (const player of players) {
                if (player.finished || trap.owner === player) continue;

                const distDiff = Math.abs(trap.distance - player.distance);
                const laneDiff = Math.abs(Math.round(player.lane) - trap.lane);

                if (distDiff < 25 && laneDiff < 1 && !trap.triggered) {
                    player.hitObstacle('barrier');
                    trap.triggered = true;
                }
            }

            return trap.lifetime > 0 && !trap.triggered;
        });
    }

    placeTrap(owner) {
        this.placedTraps.push({
            owner,
            lane: Math.round(owner.lane),
            distance: owner.distance - 50,
            lifetime: 10000,
            triggered: false
        });
    }

    useBomb(user, allPlayers) {
        for (const player of allPlayers) {
            if (player === user || player.finished) continue;
            const distDiff = Math.abs(player.distance - user.distance);
            if (distDiff < 200) {
                player.hitObstacle('wind');
            }
        }
    }

    cleanup(cameraDistance) {
        this.items = this.items.filter(item => 
            !item.collected && item.distance > cameraDistance - 200
        );
    }

    getState() {
        return {
            items: this.items.map(i => ({
                type: i.type,
                lane: i.lane,
                distance: i.distance,
                collected: i.collected
            })),
            placedTraps: [...this.placedTraps]
        };
    }

    loadState(state) {
        this.items = state.items.map(i => new Item(i));
        this.placedTraps = state.placedTraps || [];
    }
}
