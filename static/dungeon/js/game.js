const GRID_SIZE = 8;
const TILE_TYPES = {
    WALL: 'wall',
    FLOOR: 'floor',
    CORRIDOR: 'corridor',
    TRAP: 'trap',
    CHEST: 'chest',
    STAIRS: 'stairs'
};

const ENEMY_TYPES = {
    SKELETON: {
        type: 'skeleton',
        name: '骷髅',
        hp: 20,
        attack: 8,
        color: '#f0f0f0'
    },
    SLIME: {
        type: 'slime',
        name: '史莱姆',
        hp: 10,
        attack: 5,
        color: '#4ade80'
    },
    MAGE: {
        type: 'mage',
        name: '暗影法师',
        hp: 15,
        attack: 15,
        color: '#a855f7',
        range: 3
    }
};

const ITEM_TYPES = {
    POTION: { type: 'potion', name: '治疗药水', heal: 30 },
    GOLD_SMALL: { type: 'gold', name: '小袋金币', value: 10 },
    GOLD_MEDIUM: { type: 'gold', name: '金币袋', value: 25 },
    GOLD_LARGE: { type: 'gold', name: '宝箱金币', value: 50 },
    WEAPON_IRON: { type: 'weapon', name: '铁剑', attack: 3 },
    WEAPON_STEEL: { type: 'weapon', name: '钢剑', attack: 6 },
    WEAPON_MAGIC: { type: 'weapon', name: '魔法剑', attack: 10 },
    ARMOR_LEATHER: { type: 'armor', name: '皮甲', defense: 2 },
    ARMOR_CHAIN: { type: 'armor', name: '锁子甲', defense: 4 },
    ARMOR_PLATE: { type: 'armor', name: '板甲', defense: 7 },
    TRAP_ITEM: { type: 'trap', name: '陷阱', damage: 10 }
};

class DungeonGame {
    constructor() {
        this.grid = [];
        this.player = null;
        this.enemies = [];
        this.depth = 1;
        this.gold = 0;
        this.kills = 0;
        this.gameOver = false;
        this.gameStarted = false;
    }

    createPlayer() {
        return {
            x: 0,
            y: 0,
            hp: 100,
            maxHp: 100,
            baseAttack: 10,
            baseDefense: 5,
            attack: 10,
            defense: 5,
            facing: 'down',
            inventory: [],
            equipment: {
                weapon: null,
                armor: null
            }
        };
    }

    generateDungeon(depth) {
        this.grid = [];
        this.enemies = [];
        
        for (let y = 0; y < GRID_SIZE; y++) {
            this.grid[y] = [];
            for (let x = 0; x < GRID_SIZE; x++) {
                this.grid[y][x] = {
                    tile: TILE_TYPES.WALL,
                    visible: false,
                    explored: false,
                    enemy: null,
                    player: false,
                    opened: false
                };
            }
        }

        this.generateRoomsAndCorridors();
        this.placeSpecialTiles(depth);
        this.spawnEnemies(depth);
        this.placePlayerAtStart();
        this.updateVisibility();
    }

    generateRoomsAndCorridors() {
        const rooms = [];
        const roomCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < roomCount; i++) {
            const roomWidth = 2 + Math.floor(Math.random() * 3);
            const roomHeight = 2 + Math.floor(Math.random() * 3);
            const roomX = 1 + Math.floor(Math.random() * (GRID_SIZE - roomWidth - 2));
            const roomY = 1 + Math.floor(Math.random() * (GRID_SIZE - roomHeight - 2));
            
            let overlaps = false;
            for (const room of rooms) {
                if (this.roomsOverlap(roomX, roomY, roomWidth, roomHeight, room)) {
                    overlaps = true;
                    break;
                }
            }
            
            if (!overlaps) {
                rooms.push({ x: roomX, y: roomY, width: roomWidth, height: roomHeight });
                this.carveRoom(roomX, roomY, roomWidth, roomHeight);
            }
        }
        
        for (let i = 1; i < rooms.length; i++) {
            const room1 = rooms[i - 1];
            const room2 = rooms[i];
            this.connectRooms(room1, room2);
        }

        if (rooms.length === 0) {
            this.carveRoom(1, 1, GRID_SIZE - 2, GRID_SIZE - 2);
        }

        this.ensureStartAndEnd();
    }

    roomsOverlap(x1, y1, w1, h1, room2) {
        return x1 < room2.x + room2.width + 1 &&
               x1 + w1 + 1 > room2.x &&
               y1 < room2.y + room2.height + 1 &&
               y1 + h1 + 1 > room2.y;
    }

    carveRoom(x, y, width, height) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                if (y + dy > 0 && y + dy < GRID_SIZE - 1 && x + dx > 0 && x + dx < GRID_SIZE - 1) {
                    this.grid[y + dy][x + dx].tile = TILE_TYPES.FLOOR;
                }
            }
        }
    }

    connectRooms(room1, room2) {
        let x1 = Math.floor(room1.x + room1.width / 2);
        let y1 = Math.floor(room1.y + room1.height / 2);
        let x2 = Math.floor(room2.x + room2.width / 2);
        let y2 = Math.floor(room2.y + room2.height / 2);
        
        while (x1 !== x2) {
            if (y1 > 0 && y1 < GRID_SIZE - 1 && x1 > 0 && x1 < GRID_SIZE - 1) {
                if (this.grid[y1][x1].tile === TILE_TYPES.WALL) {
                    this.grid[y1][x1].tile = TILE_TYPES.CORRIDOR;
                }
            }
            x1 += x1 < x2 ? 1 : -1;
        }
        
        while (y1 !== y2) {
            if (y1 > 0 && y1 < GRID_SIZE - 1 && x1 > 0 && x1 < GRID_SIZE - 1) {
                if (this.grid[y1][x1].tile === TILE_TYPES.WALL) {
                    this.grid[y1][x1].tile = TILE_TYPES.CORRIDOR;
                }
            }
            y1 += y1 < y2 ? 1 : -1;
        }
    }

    ensureStartAndEnd() {
        this.grid[0][0].tile = TILE_TYPES.FLOOR;
        this.grid[0][1].tile = TILE_TYPES.FLOOR;
        this.grid[1][0].tile = TILE_TYPES.FLOOR;
        this.grid[GRID_SIZE - 1][GRID_SIZE - 1].tile = TILE_TYPES.FLOOR;
        this.grid[GRID_SIZE - 1][GRID_SIZE - 2].tile = TILE_TYPES.FLOOR;
        this.grid[GRID_SIZE - 2][GRID_SIZE - 1].tile = TILE_TYPES.FLOOR;
    }

    placeSpecialTiles(depth) {
        const floorTiles = this.getFloorTiles();
        const shuffled = [...floorTiles].sort(() => Math.random() - 0.5);
        
        let index = 0;
        
        const stairsIndex = shuffled.findIndex(t => 
            t.x >= GRID_SIZE - 3 && t.y >= GRID_SIZE - 3
        );
        if (stairsIndex >= 0) {
            const stairsTile = shuffled.splice(stairsIndex, 1)[0];
            this.grid[stairsTile.y][stairsTile.x].tile = TILE_TYPES.STAIRS;
        } else if (shuffled.length > 0) {
            const stairsTile = shuffled.pop();
            this.grid[stairsTile.y][stairsTile.x].tile = TILE_TYPES.STAIRS;
        }
        
        const trapCount = 1 + depth;
        for (let i = 0; i < trapCount && shuffled.length > 0; i++) {
            const tile = shuffled.pop();
            if (!(tile.x === 0 && tile.y === 0)) {
                this.grid[tile.y][tile.x].tile = TILE_TYPES.TRAP;
            }
        }
        
        const chestCount = 2 + Math.floor(depth / 2);
        for (let i = 0; i < chestCount && shuffled.length > 0; i++) {
            const tile = shuffled.pop();
            if (!(tile.x === 0 && tile.y === 0)) {
                this.grid[tile.y][tile.x].tile = TILE_TYPES.CHEST;
            }
        }
    }

    getFloorTiles() {
        const tiles = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this.grid[y][x].tile === TILE_TYPES.FLOOR || 
                    this.grid[y][x].tile === TILE_TYPES.CORRIDOR) {
                    tiles.push({ x, y });
                }
            }
        }
        return tiles;
    }

    spawnEnemies(depth) {
        const enemyCount = 2 + depth * 2;
        const floorTiles = this.getFloorTiles().filter(t => 
            !(t.x <= 1 && t.y <= 1) && 
            !(t.x >= GRID_SIZE - 2 && t.y >= GRID_SIZE - 2)
        );
        const shuffled = [...floorTiles].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < enemyCount && shuffled.length > 0; i++) {
            const tile = shuffled.pop();
            const enemyType = this.getRandomEnemyType(depth);
            const enemy = {
                id: Date.now() + Math.random(),
                ...enemyType,
                maxHp: enemyType.hp,
                x: tile.x,
                y: tile.y,
                isSmall: false
            };
            this.enemies.push(enemy);
            this.grid[tile.y][tile.x].enemy = enemy;
        }
    }

    getRandomEnemyType(depth) {
        const rand = Math.random();
        if (depth >= 3 && rand < 0.2) {
            return { ...ENEMY_TYPES.MAGE };
        } else if (rand < 0.5) {
            return { ...ENEMY_TYPES.SKELETON };
        } else {
            return { ...ENEMY_TYPES.SLIME };
        }
    }

    placePlayerAtStart() {
        if (!this.player) {
            this.player = this.createPlayer();
        }
        this.player.x = 0;
        this.player.y = 0;
        this.grid[0][0].player = true;
    }

    updateVisibility() {
        const viewRange = this.depth >= 5 ? 3 : GRID_SIZE;
        
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const distance = Math.max(
                    Math.abs(x - this.player.x),
                    Math.abs(y - this.player.y)
                );
                
                if (this.depth >= 5) {
                    this.grid[y][x].visible = distance <= viewRange;
                } else {
                    this.grid[y][x].visible = true;
                }
                
                if (this.grid[y][x].visible) {
                    this.grid[y][x].explored = true;
                }
            }
        }
    }

    movePlayer(dx, dy) {
        if (this.gameOver) return { moved: false };
        
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        if (dx > 0) this.player.facing = 'right';
        else if (dx < 0) this.player.facing = 'left';
        else if (dy > 0) this.player.facing = 'down';
        else if (dy < 0) this.player.facing = 'up';
        
        if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
            return { moved: false };
        }
        
        const targetCell = this.grid[newY][newX];
        
        if (targetCell.tile === TILE_TYPES.WALL) {
            return { moved: false };
        }
        
        if (targetCell.enemy) {
            const damage = this.player.attack;
            targetCell.enemy.hp -= damage;
            
            const result = {
                moved: false,
                combat: true,
                damage: damage,
                enemy: targetCell.enemy
            };
            
            if (targetCell.enemy.hp <= 0) {
                result.enemyKilled = true;
                this.kills++;
                this.enemies = this.enemies.filter(e => e.id !== targetCell.enemy.id);
                
                if (targetCell.enemy.type === 'slime' && !targetCell.enemy.isSmall) {
                    this.splitSlime(targetCell.enemy);
                }
                
                targetCell.enemy = null;
            }
            
            this.enemyTurn();
            this.updateVisibility();
            
            return result;
        }
        
        this.grid[this.player.y][this.player.x].player = false;
        this.player.x = newX;
        this.player.y = newY;
        this.grid[newY][newX].player = true;
        
        const stepResult = this.handleStepOnTile(newX, newY);
        
        this.enemyTurn();
        this.updateVisibility();
        
        return { moved: true, ...stepResult };
    }

    handleStepOnTile(x, y) {
        const cell = this.grid[y][x];
        const result = {};
        
        if (cell.tile === TILE_TYPES.TRAP) {
            const damage = 10;
            this.player.hp -= damage;
            result.trap = true;
            result.damage = damage;
            
            if (this.player.hp <= 0) {
                this.gameOver = true;
                result.gameOver = true;
            }
        } else if (cell.tile === TILE_TYPES.CHEST && !cell.opened) {
            cell.opened = true;
            const loot = this.openChest();
            result.chest = true;
            result.loot = loot;
            
            if (loot.type === 'trap') {
                this.player.hp -= loot.damage;
                result.trap = true;
                result.damage = loot.damage;
                
                if (this.player.hp <= 0) {
                    this.gameOver = true;
                    result.gameOver = true;
                }
            } else if (loot.type === 'gold') {
                this.gold += loot.value;
            } else if (loot.type === 'potion') {
                if (this.player.inventory.length < 4) {
                    this.player.inventory.push(loot);
                }
            } else if (loot.type === 'weapon' || loot.type === 'armor') {
                if (this.player.inventory.length < 4) {
                    this.player.inventory.push(loot);
                }
            }
        } else if (cell.tile === TILE_TYPES.STAIRS) {
            result.stairs = true;
        }
        
        return result;
    }

    openChest() {
        const depthBonus = Math.min(this.depth * 5, 30);
        const rand = Math.random() * 100;
        
        if (rand < 15) {
            return { ...ITEM_TYPES.TRAP_ITEM };
        } else if (rand < 35) {
            return { ...ITEM_TYPES.GOLD_SMALL };
        } else if (rand < 50) {
            return { ...ITEM_TYPES.GOLD_MEDIUM };
        } else if (rand < 55 + depthBonus / 2) {
            return { ...ITEM_TYPES.GOLD_LARGE };
        } else if (rand < 65 + depthBonus / 2) {
            return { ...ITEM_TYPES.POTION };
        } else if (rand < 75 + depthBonus) {
            const weaponRand = Math.random();
            if (weaponRand < 0.6) return { ...ITEM_TYPES.WEAPON_IRON };
            else if (weaponRand < 0.9) return { ...ITEM_TYPES.WEAPON_STEEL };
            else return { ...ITEM_TYPES.WEAPON_MAGIC };
        } else {
            const armorRand = Math.random();
            if (armorRand < 0.6) return { ...ITEM_TYPES.ARMOR_LEATHER };
            else if (armorRand < 0.9) return { ...ITEM_TYPES.ARMOR_CHAIN };
            else return { ...ITEM_TYPES.ARMOR_PLATE };
        }
    }

    useItem(index) {
        if (this.gameOver) return null;
        if (index < 0 || index >= this.player.inventory.length) return null;
        
        const item = this.player.inventory[index];
        const result = { item };
        
        if (item.type === 'potion') {
            const healAmount = Math.min(item.heal, this.player.maxHp - this.player.hp);
            this.player.hp += healAmount;
            result.heal = healAmount;
            this.player.inventory.splice(index, 1);
        } else if (item.type === 'weapon') {
            const oldWeapon = this.player.equipment.weapon;
            this.player.equipment.weapon = item;
            this.player.inventory.splice(index, 1);
            if (oldWeapon) {
                this.player.inventory.push(oldWeapon);
            }
            this.updatePlayerStats();
            result.equipped = true;
        } else if (item.type === 'armor') {
            const oldArmor = this.player.equipment.armor;
            this.player.equipment.armor = item;
            this.player.inventory.splice(index, 1);
            if (oldArmor) {
                this.player.inventory.push(oldArmor);
            }
            this.updatePlayerStats();
            result.equipped = true;
        } else if (item.type === 'gold') {
            this.gold += item.value;
            this.player.inventory.splice(index, 1);
            result.gold = item.value;
        }
        
        return result;
    }

    updatePlayerStats() {
        this.player.attack = this.player.baseAttack;
        this.player.defense = this.player.baseDefense;
        
        if (this.player.equipment.weapon) {
            this.player.attack += this.player.equipment.weapon.attack;
        }
        if (this.player.equipment.armor) {
            this.player.defense += this.player.equipment.armor.defense;
        }
    }

    enemyTurn() {
        for (const enemy of this.enemies) {
            if (this.gameOver) break;
            
            if (enemy.type === 'skeleton') {
                this.moveSkeleton(enemy);
            } else if (enemy.type === 'slime') {
                this.moveSlime(enemy);
            } else if (enemy.type === 'mage') {
                this.moveMage(enemy);
            }
        }
    }

    moveSkeleton(enemy) {
        const dx = Math.sign(this.player.x - enemy.x);
        const dy = Math.sign(this.player.y - enemy.y);
        
        let moved = false;
        
        if (Math.abs(this.player.x - enemy.x) > Math.abs(this.player.y - enemy.y)) {
            moved = this.tryMoveEnemy(enemy, dx, 0);
            if (!moved && dy !== 0) {
                moved = this.tryMoveEnemy(enemy, 0, dy);
            }
        } else {
            moved = this.tryMoveEnemy(enemy, 0, dy);
            if (!moved && dx !== 0) {
                moved = this.tryMoveEnemy(enemy, dx, 0);
            }
        }
        
        if (!moved) {
            this.enemyAttackPlayer(enemy);
        }
    }

    moveSlime(enemy) {
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 0 }
        ];
        
        const dir = directions[Math.floor(Math.random() * directions.length)];
        
        if (dir.dx === 0 && dir.dy === 0) return;
        
        const moved = this.tryMoveEnemy(enemy, dir.dx, dir.dy);
        if (!moved) {
            this.enemyAttackPlayer(enemy);
        }
    }

    moveMage(enemy) {
        const distance = Math.max(
            Math.abs(this.player.x - enemy.x),
            Math.abs(this.player.y - enemy.y)
        );
        
        if (distance <= enemy.range) {
            const damage = Math.max(0, enemy.attack - this.player.defense);
            this.player.hp -= damage;
            this.addCombatLog(`${enemy.name}发射魔法弹，造成 ${damage} 点伤害！`, 'damage');
            
            if (this.player.hp <= 0) {
                this.gameOver = true;
            }
            
            if (distance < 2) {
                const dx = Math.sign(enemy.x - this.player.x);
                const dy = Math.sign(enemy.y - this.player.y);
                this.tryMoveEnemy(enemy, dx, dy);
            }
        } else {
            const dx = Math.sign(this.player.x - enemy.x);
            const dy = Math.sign(this.player.y - enemy.y);
            
            if (Math.abs(this.player.x - enemy.x) > Math.abs(this.player.y - enemy.y)) {
                this.tryMoveEnemy(enemy, dx, 0);
            } else {
                this.tryMoveEnemy(enemy, 0, dy);
            }
        }
    }

    tryMoveEnemy(enemy, dx, dy) {
        const newX = enemy.x + dx;
        const newY = enemy.y + dy;
        
        if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
            return false;
        }
        
        const targetCell = this.grid[newY][newX];
        
        if (targetCell.tile === TILE_TYPES.WALL) {
            return false;
        }
        
        if (targetCell.player) {
            this.enemyAttackPlayer(enemy);
            return true;
        }
        
        if (targetCell.enemy) {
            return false;
        }
        
        this.grid[enemy.y][enemy.x].enemy = null;
        enemy.x = newX;
        enemy.y = newY;
        this.grid[newY][newX].enemy = enemy;
        
        return true;
    }

    enemyAttackPlayer(enemy) {
        const damage = Math.max(0, enemy.attack - this.player.defense);
        this.player.hp -= damage;
        this.addCombatLog(`${enemy.name}攻击你，造成 ${damage} 点伤害！`, 'damage');
        
        if (this.player.hp <= 0) {
            this.gameOver = true;
        }
    }

    splitSlime(parentSlime) {
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];
        
        let spawned = 0;
        
        for (const dir of directions) {
            if (spawned >= 2) break;
            
            const newX = parentSlime.x + dir.dx;
            const newY = parentSlime.y + dir.dy;
            
            if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) continue;
            
            const cell = this.grid[newY][newX];
            if (cell.tile === TILE_TYPES.WALL || cell.enemy || cell.player) continue;
            
            const smallSlime = {
                id: Date.now() + Math.random(),
                ...ENEMY_TYPES.SLIME,
                maxHp: 5,
                hp: 5,
                attack: 3,
                x: newX,
                y: newY,
                isSmall: true,
                name: '小史莱姆'
            };
            
            this.enemies.push(smallSlime);
            this.grid[newY][newX].enemy = smallSlime;
            spawned++;
        }
        
        if (spawned > 0) {
            this.addCombatLog(`史莱姆分裂成了 ${spawned} 个小史莱姆！`, 'info');
        }
    }

    nextFloor() {
        this.depth++;
        this.generateDungeon(this.depth);
        this.addCombatLog(`你进入了第 ${this.depth} 层地牢！`, 'info');
        
        if (this.depth === 5) {
            this.addCombatLog('黑暗笼罩了地牢，你的视野受限...', 'warning');
        }
    }

    waitTurn() {
        if (this.gameOver) return;
        this.enemyTurn();
        this.updateVisibility();
    }

    addCombatLog(message, type = 'info') {
        if (!this.combatLogs) this.combatLogs = [];
        this.combatLogs.push({ message, type, timestamp: Date.now() });
    }

    getState() {
        return {
            grid: this.grid,
            player: this.player,
            enemies: this.enemies,
            depth: this.depth,
            gold: this.gold,
            kills: this.kills,
            gameOver: this.gameOver,
            gameStarted: this.gameStarted
        };
    }
}
