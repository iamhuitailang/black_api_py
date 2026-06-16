const GRID_COLS = 10;
const GRID_ROWS = 8;
const CELL_SIZE = 80;
const SAVE_KEY = 'factory_game_save_v1';

const RESOURCE_COLORS = {
    iron_ore: '#a0a0a0',
    copper_ore: '#cd7f32',
    coal: '#2d2d2d',
    gear: '#60a5fa',
    circuit: '#34d399',
    steel: '#c0c0c0'
};

const RESOURCE_ICONS = {
    iron_ore: '🪨',
    copper_ore: '🟠',
    coal: '⬛',
    gear: '⚙️',
    circuit: '🔌',
    steel: '🔩'
};

const RECIPES = {
    gear: { inputs: { iron_ore: 1 }, output: 'gear', time: 2000 },
    circuit: { inputs: { copper_ore: 1, coal: 1 }, output: 'circuit', time: 3000 },
    steel: { inputs: { iron_ore: 3 }, output: 'steel', time: 4000 }
};

const PRODUCT_PRICES = {
    gear: 20,
    circuit: 50,
    steel: 80
};

const MACHINE_COSTS = {
    miner: 100,
    conveyor: 10,
    assembler: 150,
    warehouse: 80
};

const TECH_TREE = [
    { level: 1, name: '矿机效率I', desc: '矿机速度+20%', cost: 100, time: 30000, effect: { minerSpeed: 0.2 } },
    { level: 2, name: '传送带升级I', desc: '传送带速度+15%', cost: 150, time: 35000, effect: { conveyorSpeed: 0.15 } },
    { level: 3, name: '齿轮优化', desc: '齿轮生产时间-20%', cost: 200, time: 40000, effect: { gearSpeed: 0.2 } },
    { level: 4, name: '初始资金', desc: '立即获得200金币', cost: 100, time: 20000, effect: { instantGold: 200 } },
    { level: 5, name: '双路传送带', desc: '传送带容量+100%', cost: 300, time: 45000, effect: { conveyorCapacity: 1.0 } },
    { level: 6, name: '矿机效率II', desc: '矿机速度+25%', cost: 250, time: 40000, effect: { minerSpeed: 0.25 } },
    { level: 7, name: '电路优化', desc: '电路生产时间-20%', cost: 350, time: 50000, effect: { circuitSpeed: 0.2 } },
    { level: 8, name: '传送带升级II', desc: '传送带速度+20%', cost: 300, time: 45000, effect: { conveyorSpeed: 0.2 } },
    { level: 9, name: '仓库升级I', desc: '仓库容量+50%', cost: 400, time: 50000, effect: { warehouseCapacity: 0.5 } },
    { level: 10, name: '加工台效率', desc: '所有加工台速度+30%', cost: 500, time: 60000, effect: { assemblerSpeed: 0.3 } },
    { level: 11, name: '矿机效率III', desc: '矿机速度+30%', cost: 450, time: 55000, effect: { minerSpeed: 0.3 } },
    { level: 12, name: '钢材优化', desc: '钢材生产时间-25%', cost: 500, time: 60000, effect: { steelSpeed: 0.25 } },
    { level: 13, name: '传送带升级III', desc: '传送带速度+25%', cost: 500, time: 60000, effect: { conveyorSpeed: 0.25 } },
    { level: 14, name: '产品增值I', desc: '产品售价+15%', cost: 600, time: 65000, effect: { sellPrice: 0.15 } },
    { level: 15, name: '仓库扩容', desc: '仓库容量×2', cost: 800, time: 70000, effect: { warehouseCapacity: 1.0 } },
    { level: 16, name: '矿机效率IV', desc: '矿机速度+35%', cost: 700, time: 70000, effect: { minerSpeed: 0.35 } },
    { level: 17, name: '加工台效率II', desc: '所有加工台速度+25%', cost: 800, time: 75000, effect: { assemblerSpeed: 0.25 } },
    { level: 18, name: '产品增值II', desc: '产品售价+20%', cost: 900, time: 80000, effect: { sellPrice: 0.2 } },
    { level: 19, name: '终极传送带', desc: '传送带速度+30%，容量+50%', cost: 1000, time: 85000, effect: { conveyorSpeed: 0.3, conveyorCapacity: 0.5 } },
    { level: 20, name: '全自动工厂', desc: '全效率+50%', cost: 2000, time: 120000, effect: { allSpeed: 0.5 } }
];

class FactoryGame {
    constructor() {
        this.canvas = document.getElementById('factory-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.grid = [];
        this.conveyors = [];
        this.machines = [];
        this.items = [];
        this.resources = {
            iron_ore: 0,
            copper_ore: 0,
            coal: 0,
            gear: 0,
            circuit: 0,
            steel: 0
        };
        
        this.gold = 500;
        this.currentTool = 'select';
        this.selectedCell = null;
        this.conveyorStart = null;
        this.conveyorPath = [];
        this.isDrawingConveyor = false;
        this.mouseGridX = -1;
        this.mouseGridY = -1;
        
        this.unlockedTech = new Set();
        this.currentResearch = null;
        this.researchProgress = 0;
        this.totalOutputValue = 0;
        
        this.lastTime = performance.now();
        this.minerTimer = 0;
        this.conveyorTimer = 0;
        
        this.effects = {
            minerSpeed: 0,
            conveyorSpeed: 0,
            assemblerSpeed: 0,
            gearSpeed: 0,
            circuitSpeed: 0,
            steelSpeed: 0,
            warehouseCapacity: 0,
            conveyorCapacity: 0,
            sellPrice: 0,
            allSpeed: 0
        };
        
        this.init();
    }
    
    init() {
        this.load();
        this.initGrid();
        this.bindEvents();
        this.renderTechTree();
        this.updateUI();
        this.gameLoop();
        this.showToast('欢迎来到工厂自动化大亨！', 'info');
        if (this.gold === 500 && this.machines.length === 0) {
            this.showToast('初始金币500，开始建造你的工厂吧！', 'success');
        }
    }
    
    initGrid() {
        for (let y = 0; y < GRID_ROWS; y++) {
            this.grid[y] = [];
            for (let x = 0; x < GRID_COLS; x++) {
                this.grid[y][x] = null;
            }
        }
        for (const m of this.machines) {
            if (this.grid[m.y] && this.grid[m.y][m.x] !== undefined) {
                this.grid[m.y][m.x] = m;
            }
        }
        for (const c of this.conveyors) {
            if (this.grid[c.y] && this.grid[c.y][c.x] !== undefined) {
                this.grid[c.y][c.x] = c;
            }
        }
    }
    
    bindEvents() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTool(btn.dataset.tool);
            });
        });
        
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.mouseGridX = -1;
            this.mouseGridY = -1;
            this.isDrawingConveyor = false;
            this.conveyorPath = [];
        });
        
        document.getElementById('btn-save').addEventListener('click', () => this.save());
        document.getElementById('btn-reset').addEventListener('click', () => this.reset());
        document.getElementById('sell-all').addEventListener('click', () => this.sellAllProducts());
        
        document.querySelectorAll('.sell-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = btn.dataset.item;
                const price = parseInt(btn.dataset.price);
                this.sellProduct(item, price);
            });
        });
    }
    
    setTool(tool) {
        this.currentTool = tool;
        this.isDrawingConveyor = false;
        this.conveyorStart = null;
        this.conveyorPath = [];
        this.selectedCell = null;
        
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        
        const toolNames = {
            'select': '选择/删除',
            'conveyor': '传送带',
            'miner_iron': '铁矿机',
            'miner_copper': '铜矿机',
            'miner_coal': '煤矿机',
            'assembler_gear': '齿轮加工台',
            'assembler_circuit': '电路加工台',
            'assembler_steel': '钢材加工台',
            'warehouse': '仓库'
        };
        document.getElementById('current-tool').textContent = toolNames[tool] || tool;
        this.updateSelectedInfo();
    }
    
    getGridPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
        const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
        return { x, y };
    }
    
    handleClick(e) {
        const { x, y } = this.getGridPos(e);
        if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return;
        
        if (this.currentTool === 'select') {
            this.selectedCell = { x, y };
            this.updateSelectedInfo();
            return;
        }
        
        if (this.currentTool === 'conveyor') {
            if (!this.conveyorStart) {
                this.conveyorStart = { x, y };
                this.isDrawingConveyor = true;
                this.conveyorPath = [{ x, y }];
                this.showToast('请选择传送带终点（可经过中间点转弯）', 'info');
            } else {
                this.conveyorPath = this.calculateConveyorPath(this.conveyorStart, { x, y });
                this.placeConveyorPath();
            }
            return;
        }
        
        this.placeMachine(x, y, this.currentTool);
    }
    
    handleRightClick(e) {
        e.preventDefault();
        const { x, y } = this.getGridPos(e);
        if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return;
        
        if (this.currentTool === 'conveyor') {
            this.conveyorStart = null;
            this.isDrawingConveyor = false;
            this.conveyorPath = [];
            this.showToast('已取消传送带放置', 'info');
            return;
        }
        
        this.removeAt(x, y);
    }
    
    handleMouseMove(e) {
        const { x, y } = this.getGridPos(e);
        this.mouseGridX = x;
        this.mouseGridY = y;
        
        if (this.isDrawingConveyor && this.conveyorStart) {
            this.conveyorPath = this.calculateConveyorPath(this.conveyorStart, { x, y });
        }
    }
    
    calculateConveyorPath(start, end) {
        const path = [];
        let cx = start.x, cy = start.y;
        path.push({ x: cx, y: cy });
        
        const dx = Math.sign(end.x - cx);
        while (cx !== end.x) {
            cx += dx;
            path.push({ x: cx, y: cy });
        }
        
        const dy = Math.sign(end.y - cy);
        while (cy !== end.y) {
            cy += dy;
            path.push({ x: cx, y: cy });
        }
        
        return path;
    }
    
    placeConveyorPath() {
        if (this.conveyorPath.length < 2) {
            this.showToast('传送带至少需要2格', 'error');
            this.conveyorStart = null;
            this.isDrawingConveyor = false;
            this.conveyorPath = [];
            return;
        }
        
        const validPath = [];
        for (let i = 0; i < this.conveyorPath.length; i++) {
            const pos = this.conveyorPath[i];
            const cell = this.grid[pos.y][pos.x];
            if (cell && cell.type !== 'conveyor') {
                this.showToast(`位置 (${pos.x},${pos.y}) 已被占用`, 'error');
                this.conveyorStart = null;
                this.isDrawingConveyor = false;
                this.conveyorPath = [];
                return;
            }
            if (!cell) validPath.push(pos);
        }
        
        const cost = validPath.length * MACHINE_COSTS.conveyor;
        if (this.gold < cost) {
            this.showToast(`金币不足！需要 ${cost} 金币`, 'error');
            this.conveyorStart = null;
            this.isDrawingConveyor = false;
            this.conveyorPath = [];
            return;
        }
        
        for (let i = 0; i < validPath.length; i++) {
            const pos = validPath[i];
            const nextPos = this.conveyorPath[this.conveyorPath.indexOf(pos) + 1];
            const prevPos = this.conveyorPath[this.conveyorPath.indexOf(pos) - 1];
            
            let dir = 'right';
            if (nextPos) {
                if (nextPos.x > pos.x) dir = 'right';
                else if (nextPos.x < pos.x) dir = 'left';
                else if (nextPos.y > pos.y) dir = 'down';
                else if (nextPos.y < pos.y) dir = 'up';
            } else if (prevPos) {
                if (prevPos.x > pos.x) dir = 'left';
                else if (prevPos.x < pos.x) dir = 'right';
                else if (prevPos.y > pos.y) dir = 'up';
                else if (prevPos.y < pos.y) dir = 'down';
            }
            
            const conveyor = {
                id: 'conv_' + Date.now() + '_' + i,
                type: 'conveyor',
                x: pos.x,
                y: pos.y,
                direction: dir,
                items: []
            };
            this.conveyors.push(conveyor);
            this.grid[pos.y][pos.x] = conveyor;
            this.gold -= MACHINE_COSTS.conveyor;
        }
        
        this.showToast(`放置了 ${validPath.length} 格传送带，花费 ${cost} 金币`, 'success');
        this.conveyorStart = null;
        this.isDrawingConveyor = false;
        this.conveyorPath = [];
        this.updateUI();
    }
    
    placeMachine(x, y, toolType) {
        if (this.grid[y][x]) {
            this.showToast('该位置已被占用', 'error');
            return;
        }
        
        let machineType, resource, recipe;
        let cost = 0;
        
        if (toolType.startsWith('miner_')) {
            machineType = 'miner';
            resource = toolType.replace('miner_', '') + '_ore';
            cost = MACHINE_COSTS.miner;
        } else if (toolType.startsWith('assembler_')) {
            machineType = 'assembler';
            recipe = toolType.replace('assembler_', '');
            cost = MACHINE_COSTS.assembler;
        } else if (toolType === 'warehouse') {
            machineType = 'warehouse';
            cost = MACHINE_COSTS.warehouse;
        }
        
        if (this.gold < cost) {
            this.showToast(`金币不足！需要 ${cost} 金币`, 'error');
            return;
        }
        
        const machine = {
            id: 'mach_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type: machineType,
            subType: toolType,
            x, y,
            resource: resource || null,
            recipe: recipe || null,
            progress: 0,
            buffer: {},
            active: true
        };
        
        if (machineType === 'assembler') {
            Object.keys(RECIPES[recipe].inputs).forEach(r => {
                machine.buffer[r] = 0;
            });
        }
        
        this.machines.push(machine);
        this.grid[y][x] = machine;
        this.gold -= cost;
        
        const typeNames = {
            miner: '矿机',
            assembler: '加工台',
            warehouse: '仓库'
        };
        this.showToast(`放置了${typeNames[machineType]}，花费 ${cost} 金币`, 'success');
        this.updateUI();
    }
    
    removeAt(x, y) {
        const cell = this.grid[y][x];
        if (!cell) return;
        
        if (cell.type === 'conveyor') {
            const idx = this.conveyors.findIndex(c => c.id === cell.id);
            if (idx >= 0) this.conveyors.splice(idx, 1);
        } else {
            const idx = this.machines.findIndex(m => m.id === cell.id);
            if (idx >= 0) {
                const refund = Math.floor((MACHINE_COSTS[cell.type] || 0) * 0.5);
                this.gold += refund;
                this.machines.splice(idx, 1);
                if (refund > 0) {
                    this.showToast(`拆除成功，回收 ${refund} 金币`, 'info');
                }
            }
        }
        
        this.grid[y][x] = null;
        this.items = this.items.filter(item => {
            if (item.currentConveyor) {
                const conv = this.conveyors.find(c => c.id === item.currentConveyor);
                return conv !== undefined;
            }
            return true;
        });
        
        this.updateUI();
    }
    
    getMinerSpeed() {
        const base = 3000;
        const bonus = this.effects.minerSpeed + this.effects.allSpeed;
        return base / (1 + bonus);
    }
    
    getConveyorSpeed() {
        const base = 500;
        const bonus = this.effects.conveyorSpeed + this.effects.allSpeed;
        return base / (1 + bonus);
    }
    
    getAssemblerSpeed(recipeType) {
        const base = RECIPES[recipeType].time;
        let bonus = this.effects.assemblerSpeed + this.effects.allSpeed;
        if (recipeType === 'gear') bonus += this.effects.gearSpeed;
        if (recipeType === 'circuit') bonus += this.effects.circuitSpeed;
        if (recipeType === 'steel') bonus += this.effects.steelSpeed;
        return base / (1 + bonus);
    }
    
    getWarehouseCapacity() {
        return Math.floor(200 * (1 + this.effects.warehouseCapacity));
    }
    
    getConveyorCapacity() {
        return Math.floor(2 * (1 + this.effects.conveyorCapacity));
    }
    
    getSellPrice(item) {
        const base = PRODUCT_PRICES[item] || 0;
        return Math.floor(base * (1 + this.effects.sellPrice));
    }
    
    getTotalStorage() {
        return Object.values(this.resources).reduce((a, b) => a + b, 0);
    }
    
    gameLoop = () => {
        const now = performance.now();
        const dt = now - this.lastTime;
        this.lastTime = now;
        
        this.update(dt);
        this.render();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    update(dt) {
        this.minerTimer += dt;
        this.conveyorTimer += dt;
        
        if (this.currentResearch) {
            this.researchProgress += dt;
            if (this.researchProgress >= this.currentResearch.time) {
                this.completeResearch();
            }
        }
        
        const minerInterval = this.getMinerSpeed();
        if (this.minerTimer >= minerInterval) {
            this.minerTimer = 0;
            this.tickMiners();
        }
        
        const conveyorInterval = this.getConveyorSpeed();
        if (this.conveyorTimer >= conveyorInterval) {
            this.conveyorTimer = 0;
            this.tickConveyors();
            this.tickAssemblers();
        }
        
        this.updateItems(dt);
        this.updateUI();
    }
    
    tickMiners() {
        for (const miner of this.machines.filter(m => m.type === 'miner')) {
            if (this.getTotalStorage() >= this.getWarehouseCapacity()) {
                miner.active = false;
                continue;
            }
            miner.active = true;
            const outputConveyor = this.findAdjacentConveyor(miner.x, miner.y);
            if (outputConveyor) {
                if (outputConveyor.items.length < this.getConveyorCapacity()) {
                    this.spawnItem(miner.resource, outputConveyor);
                }
            } else {
                if (this.resources[miner.resource] !== undefined) {
                    this.resources[miner.resource]++;
                }
            }
        }
    }
    
    findAdjacentConveyor(x, y) {
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        for (const [dx, dy] of dirs) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < GRID_COLS && ny >= 0 && ny < GRID_ROWS) {
                const cell = this.grid[ny][nx];
                if (cell && cell.type === 'conveyor') {
                    return cell;
                }
            }
        }
        return null;
    }
    
    findAdjacentMachine(x, y, machineType) {
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        for (const [dx, dy] of dirs) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < GRID_COLS && ny >= 0 && ny < GRID_ROWS) {
                const cell = this.grid[ny][nx];
                if (cell && cell.type === machineType) {
                    return cell;
                }
            }
        }
        return null;
    }
    
    spawnItem(resourceType, conveyor) {
        const item = {
            id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            resource: resourceType,
            currentConveyor: conveyor.id,
            progress: 0
        };
        conveyor.items.push(item.id);
        this.items.push(item);
    }
    
    tickConveyors() {
        const maxCapacity = this.getConveyorCapacity();
        
        for (let i = this.conveyors.length - 1; i >= 0; i--) {
            const conveyor = this.conveyors[i];
            if (conveyor.items.length === 0) continue;
            
            const nextConveyor = this.getNextConveyor(conveyor);
            
            while (conveyor.items.length > 0) {
                const itemId = conveyor.items[conveyor.items.length - 1];
                const item = this.items.find(it => it.id === itemId);
                if (!item) {
                    conveyor.items.shift();
                    continue;
                }
                
                let delivered = false;
                
                const adjacentWarehouse = this.findAdjacentMachine(conveyor.x, conveyor.y, 'warehouse');
                if (adjacentWarehouse && !nextConveyor) {
                    if (this.getTotalStorage() < this.getWarehouseCapacity()) {
                        this.resources[item.resource]++;
                        this.totalOutputValue += PRODUCT_PRICES[item.resource] || 0;
                        conveyor.items.pop();
                        const idx = this.items.findIndex(it => it.id === itemId);
                        if (idx >= 0) this.items.splice(idx, 1);
                        delivered = true;
                    }
                    break;
                }
                
                const adjacentAssembler = this.findAdjacentMachine(conveyor.x, conveyor.y, 'assembler');
                if (adjacentAssembler && !nextConveyor) {
                    const recipe = RECIPES[adjacentAssembler.recipe];
                    if (recipe && recipe.inputs[item.resource] !== undefined) {
                        if (adjacentAssembler.buffer[item.resource] < recipe.inputs[item.resource] * 2) {
                            adjacentAssembler.buffer[item.resource]++;
                            conveyor.items.pop();
                            const idx = this.items.findIndex(it => it.id === itemId);
                            if (idx >= 0) this.items.splice(idx, 1);
                            delivered = true;
                        }
                    }
                    if (!delivered) break;
                    continue;
                }
                
                if (nextConveyor && nextConveyor.items.length < maxCapacity) {
                    const itemToMove = conveyor.items.pop();
                    nextConveyor.items.unshift(itemToMove);
                    const itm = this.items.find(it => it.id === itemToMove);
                    if (itm) {
                        itm.currentConveyor = nextConveyor.id;
                        itm.progress = 0;
                    }
                    delivered = true;
                } else {
                    break;
                }
            }
        }
    }
    
    getNextConveyor(conveyor) {
        const dirMap = {
            right: [1, 0],
            left: [-1, 0],
            up: [0, -1],
            down: [0, 1]
        };
        const [dx, dy] = dirMap[conveyor.direction] || [1, 0];
        const nx = conveyor.x + dx;
        const ny = conveyor.y + dy;
        
        if (nx >= 0 && nx < GRID_COLS && ny >= 0 && ny < GRID_ROWS) {
            const cell = this.grid[ny][nx];
            if (cell && cell.type === 'conveyor') {
                return cell;
            }
        }
        return null;
    }
    
    tickAssemblers() {
        for (const assembler of this.machines.filter(m => m.type === 'assembler')) {
            const recipe = RECIPES[assembler.recipe];
            if (!recipe) continue;
            
            let hasAllInputs = true;
            for (const [res, count] of Object.entries(recipe.inputs)) {
                if ((assembler.buffer[res] || 0) < count) {
                    hasAllInputs = false;
                    break;
                }
            }
            
            if (hasAllInputs && assembler.progress === 0) {
                for (const [res, count] of Object.entries(recipe.inputs)) {
                    assembler.buffer[res] -= count;
                }
                assembler.progress = 0.001;
                assembler.active = true;
            }
            
            if (assembler.progress > 0) {
                const speed = this.getAssemblerSpeed(assembler.recipe);
                assembler.progress += 500 / speed;
                
                if (assembler.progress >= 1) {
                    assembler.progress = 0;
                    const outputConveyor = this.findAdjacentConveyor(assembler.x, assembler.y);
                    if (outputConveyor && outputConveyor.items.length < this.getConveyorCapacity()) {
                        this.spawnItem(recipe.output, outputConveyor);
                    } else if (this.getTotalStorage() < this.getWarehouseCapacity()) {
                        this.resources[recipe.output]++;
                        this.totalOutputValue += PRODUCT_PRICES[recipe.output] || 0;
                    }
                }
            }
        }
    }
    
    updateItems(dt) {
        for (const item of this.items) {
            item.progress = Math.min(1, (item.progress || 0) + dt / this.getConveyorSpeed());
        }
    }
    
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGrid();
        
        if (this.isDrawingConveyor && this.conveyorPath.length > 0) {
            this.drawConveyorPathPreview();
        }
        
        if (this.mouseGridX >= 0 && this.mouseGridY < GRID_COLS && 
            this.mouseGridY >= 0 && this.mouseGridY < GRID_ROWS &&
            this.currentTool !== 'select' && this.currentTool !== 'conveyor') {
            this.drawHoverPreview();
        }
        
        this.drawConveyors();
        this.drawMachines();
        this.drawItems();
        this.drawSelection();
    }
    
    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = '#2d4359';
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= GRID_COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * CELL_SIZE, 0);
            ctx.lineTo(x * CELL_SIZE, GRID_ROWS * CELL_SIZE);
            ctx.stroke();
        }
        
        for (let y = 0; y <= GRID_ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * CELL_SIZE);
            ctx.lineTo(GRID_COLS * CELL_SIZE, y * CELL_SIZE);
            ctx.stroke();
        }
    }
    
    drawHoverPreview() {
        const ctx = this.ctx;
        const x = this.mouseGridX * CELL_SIZE;
        const y = this.mouseGridY * CELL_SIZE;
        const cell = this.grid[this.mouseGridY][this.mouseGridX];
        
        ctx.fillStyle = cell ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)';
        ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    }
    
    drawConveyorPathPreview() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.lineWidth = 2;
        
        for (const pos of this.conveyorPath) {
            const cell = this.grid[pos.y]?.[pos.x];
            if (!cell || cell.type === 'conveyor') {
                ctx.fillRect(pos.x * CELL_SIZE + 4, pos.y * CELL_SIZE + 4, CELL_SIZE - 8, CELL_SIZE - 8);
                ctx.strokeRect(pos.x * CELL_SIZE + 4, pos.y * CELL_SIZE + 4, CELL_SIZE - 8, CELL_SIZE - 8);
            }
        }
    }
    
    drawConveyors() {
        const ctx = this.ctx;
        
        for (const conveyor of this.conveyors) {
            const x = conveyor.x * CELL_SIZE;
            const y = conveyor.y * CELL_SIZE;
            
            const gradient = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
            gradient.addColorStop(0, '#3b4f66');
            gradient.addColorStop(1, '#2a3d52');
            ctx.fillStyle = gradient;
            ctx.fillRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
            
            ctx.strokeStyle = '#4a6fa5';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
            
            ctx.save();
            ctx.translate(x + CELL_SIZE / 2, y + CELL_SIZE / 2);
            
            const rotations = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
            ctx.rotate(rotations[conveyor.direction] || 0);
            
            ctx.fillStyle = '#5a7a9a';
            ctx.beginPath();
            ctx.moveTo(15, -8);
            ctx.lineTo(25, 0);
            ctx.lineTo(15, 8);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = 'rgba(90, 122, 154, 0.5)';
            ctx.fillRect(-20, -2, 30, 4);
            
            ctx.restore();
        }
    }
    
    drawMachines() {
        const ctx = this.ctx;
        
        for (const machine of this.machines) {
            const x = machine.x * CELL_SIZE;
            const y = machine.y * CELL_SIZE;
            
            if (machine.type === 'miner') {
                this.drawMiner(ctx, x, y, machine);
            } else if (machine.type === 'assembler') {
                this.drawAssembler(ctx, x, y, machine);
            } else if (machine.type === 'warehouse') {
                this.drawWarehouse(ctx, x, y, machine);
            }
        }
    }
    
    drawMiner(ctx, x, y, machine) {
        const colors = {
            iron_ore: ['#6b7280', '#9ca3af'],
            copper_ore: ['#92400e', '#cd7f32'],
            coal: ['#1f2937', '#374151']
        };
        const [c1, c2] = colors[machine.resource] || colors.iron_ore;
        
        const gradient = ctx.createLinearGradient(x, y, x, y + CELL_SIZE);
        gradient.addColorStop(0, c2);
        gradient.addColorStop(1, c1);
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 6, y + 6, CELL_SIZE - 12, CELL_SIZE - 12);
        
        ctx.strokeStyle = c2;
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 6, y + 6, CELL_SIZE - 12, CELL_SIZE - 12);
        
        ctx.fillStyle = machine.active ? '#22c55e' : '#6b7280';
        ctx.beginPath();
        ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = c2;
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(RESOURCE_ICONS[machine.resource] || '⛏️', x + CELL_SIZE / 2, y + CELL_SIZE / 2);
        
        if (machine.active) {
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
            ctx.lineWidth = 2;
            const t = performance.now() / 200;
            for (let i = 0; i < 3; i++) {
                const offset = ((t + i * 20) % 60);
                ctx.globalAlpha = 1 - offset / 60;
                ctx.beginPath();
                ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 12 + offset, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
    }
    
    drawAssembler(ctx, x, y, machine) {
        const colors = {
            gear: ['#1e40af', '#3b82f6'],
            circuit: ['#065f46', '#10b981'],
            steel: ['#374151', '#6b7280']
        };
        const [c1, c2] = colors[machine.recipe] || colors.gear;
        
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
        
        const gradient = ctx.createLinearGradient(x + 10, y + 10, x + CELL_SIZE - 10, y + CELL_SIZE - 10);
        gradient.addColorStop(0, c2);
        gradient.addColorStop(1, c1);
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 10, y + 10, CELL_SIZE - 20, CELL_SIZE - 20);
        
        ctx.strokeStyle = c2;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
        ctx.strokeRect(x + 10, y + 10, CELL_SIZE - 20, CELL_SIZE - 20);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icons = { gear: '⚙️', circuit: '🔌', steel: '🔩' };
        ctx.fillText(icons[machine.recipe] || '🔧', x + CELL_SIZE / 2, y + CELL_SIZE / 2 - 5);
        
        if (machine.progress > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(x + 10, y + CELL_SIZE - 18, CELL_SIZE - 20, 10);
            
            const progGradient = ctx.createLinearGradient(x + 10, 0, x + CELL_SIZE - 10, 0);
            progGradient.addColorStop(0, c2);
            progGradient.addColorStop(1, '#22c55e');
            ctx.fillStyle = progGradient;
            ctx.fillRect(x + 11, y + CELL_SIZE - 17, (CELL_SIZE - 22) * machine.progress, 8);
        }
    }
    
    drawWarehouse(ctx, x, y, machine) {
        const gradient = ctx.createLinearGradient(x, y, x, y + CELL_SIZE);
        gradient.addColorStop(0, '#7c3aed');
        gradient.addColorStop(1, '#5b21b6');
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
        
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
        
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(x + 12, y + 12, CELL_SIZE - 24, CELL_SIZE - 24);
        
        ctx.fillStyle = '#5b21b6';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📦', x + CELL_SIZE / 2, y + CELL_SIZE / 2);
        
        const ratio = this.getTotalStorage() / this.getWarehouseCapacity();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x + 8, y + CELL_SIZE - 14, CELL_SIZE - 16, 8);
        ctx.fillStyle = ratio > 0.9 ? '#ef4444' : ratio > 0.7 ? '#f59e0b' : '#22c55e';
        ctx.fillRect(x + 9, y + CELL_SIZE - 13, (CELL_SIZE - 18) * Math.min(1, ratio), 6);
    }
    
    drawItems() {
        const ctx = this.ctx;
        const dirMap = {
            right: [1, 0],
            left: [-1, 0],
            up: [0, -1],
            down: [0, 1]
        };
        
        for (const item of this.items) {
            const conveyor = this.conveyors.find(c => c.id === item.currentConveyor);
            if (!conveyor) continue;
            
            const [dx, dy] = dirMap[conveyor.direction] || [1, 0];
            const progress = Math.min(1, item.progress || 0);
            
            const itemX = conveyor.x * CELL_SIZE + CELL_SIZE / 2 + dx * (progress - 0.5) * CELL_SIZE;
            const itemY = conveyor.y * CELL_SIZE + CELL_SIZE / 2 + dy * (progress - 0.5) * CELL_SIZE;
            
            ctx.shadowColor = RESOURCE_COLORS[item.resource] || '#fff';
            ctx.shadowBlur = 10;
            
            ctx.fillStyle = RESOURCE_COLORS[item.resource] || '#fff';
            ctx.beginPath();
            ctx.arc(itemX, itemY, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.arc(itemX + 2, itemY + 2, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = RESOURCE_COLORS[item.resource] || '#fff';
            ctx.beginPath();
            ctx.arc(itemX, itemY, 7, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.arc(itemX - 2, itemY - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawSelection() {
        if (!this.selectedCell) return;
        const ctx = this.ctx;
        const x = this.selectedCell.x * CELL_SIZE;
        const y = this.selectedCell.y * CELL_SIZE;
        
        ctx.strokeStyle = '#ffc107';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        ctx.setLineDash([]);
    }
    
    sellProduct(item, basePrice) {
        if (this.resources[item] <= 0) {
            this.showToast('没有可出售的产品', 'error');
            return;
        }
        const price = this.getSellPrice(item);
        this.resources[item]--;
        this.gold += price;
        this.showToast(`出售了 1 个${this.getProductName(item)}，获得 ${price} 金币`, 'success');
        this.updateUI();
    }
    
    sellAllProducts() {
        let totalGold = 0;
        let totalItems = 0;
        
        for (const item of Object.keys(PRODUCT_PRICES)) {
            const count = this.resources[item] || 0;
            if (count > 0) {
                const price = this.getSellPrice(item);
                totalGold += count * price;
                totalItems += count;
                this.resources[item] = 0;
            }
        }
        
        if (totalItems === 0) {
            this.showToast('没有可出售的产品', 'warning');
            return;
        }
        
        this.gold += totalGold;
        this.showToast(`出售了 ${totalItems} 个产品，获得 ${totalGold} 金币`, 'success');
        this.updateUI();
    }
    
    getProductName(item) {
        const names = {
            gear: '齿轮',
            circuit: '电路',
            steel: '钢材',
            iron_ore: '铁矿石',
            copper_ore: '铜矿石',
            coal: '煤'
        };
        return names[item] || item;
    }
    
    renderTechTree() {
        const container = document.getElementById('tech-tree');
        container.innerHTML = '';
        
        for (const tech of TECH_TREE) {
            const div = document.createElement('div');
            const isResearched = this.unlockedTech.has(tech.level);
            const isResearching = this.currentResearch?.level === tech.level;
            const prevUnlocked = tech.level === 1 || this.unlockedTech.has(tech.level - 1);
            const canResearch = prevUnlocked && !isResearched && !isResearching && !this.currentResearch;
            
            div.className = 'tech-item';
            if (isResearched) div.classList.add('researched');
            else if (isResearching) div.classList.add('researching');
            else if (!prevUnlocked) div.classList.add('locked');
            
            div.innerHTML = `
                <div class="tech-level">${tech.level}</div>
                <div class="tech-info">
                    <div class="tech-name">${tech.name}</div>
                    <div class="tech-desc">${tech.desc}</div>
                </div>
                <div class="tech-cost">
                    ${isResearched ? '已完成' : isResearching ? '研发中...' : `💰${tech.cost}`}
                </div>
            `;
            
            if (canResearch) {
                div.addEventListener('click', () => this.startResearch(tech.level));
            }
            
            container.appendChild(div);
        }
        
        this.updateResearchProgress();
    }
    
    startResearch(level) {
        const tech = TECH_TREE.find(t => t.level === level);
        if (!tech) return;
        
        if (this.currentResearch) {
            this.showToast('已有科技正在研发中', 'warning');
            return;
        }
        
        if (this.unlockedTech.has(level)) {
            this.showToast('该科技已解锁', 'warning');
            return;
        }
        
        if (level > 1 && !this.unlockedTech.has(level - 1)) {
            this.showToast('请先解锁前一级科技', 'warning');
            return;
        }
        
        if (this.gold < tech.cost) {
            this.showToast(`金币不足！需要 ${tech.cost} 金币`, 'error');
            return;
        }
        
        this.gold -= tech.cost;
        this.currentResearch = tech;
        this.researchProgress = 0;
        
        this.showToast(`开始研发: ${tech.name}`, 'info');
        this.renderTechTree();
        this.updateUI();
    }
    
    completeResearch() {
        if (!this.currentResearch) return;
        
        const tech = this.currentResearch;
        this.unlockedTech.add(tech.level);
        
        if (tech.effect.minerSpeed) this.effects.minerSpeed += tech.effect.minerSpeed;
        if (tech.effect.conveyorSpeed) this.effects.conveyorSpeed += tech.effect.conveyorSpeed;
        if (tech.effect.assemblerSpeed) this.effects.assemblerSpeed += tech.effect.assemblerSpeed;
        if (tech.effect.gearSpeed) this.effects.gearSpeed += tech.effect.gearSpeed;
        if (tech.effect.circuitSpeed) this.effects.circuitSpeed += tech.effect.circuitSpeed;
        if (tech.effect.steelSpeed) this.effects.steelSpeed += tech.effect.steelSpeed;
        if (tech.effect.warehouseCapacity) this.effects.warehouseCapacity += tech.effect.warehouseCapacity;
        if (tech.effect.conveyorCapacity) this.effects.conveyorCapacity += tech.effect.conveyorCapacity;
        if (tech.effect.sellPrice) this.effects.sellPrice += tech.effect.sellPrice;
        if (tech.effect.allSpeed) this.effects.allSpeed += tech.effect.allSpeed;
        if (tech.effect.instantGold) this.gold += tech.effect.instantGold;
        
        this.currentResearch = null;
        this.researchProgress = 0;
        
        this.showToast(`科技 ${tech.name} 研发完成！`, 'success');
        this.renderTechTree();
        this.updateUI();
    }
    
    updateResearchProgress() {
        const container = document.getElementById('tech-progress');
        if (!this.currentResearch) {
            container.classList.remove('active');
            return;
        }
        
        container.classList.add('active');
        const progress = (this.researchProgress / this.currentResearch.time) * 100;
        const remaining = Math.max(0, Math.ceil((this.currentResearch.time - this.researchProgress) / 1000));
        
        container.innerHTML = `
            <div class="tech-progress-text">
                <span>正在研发: ${this.currentResearch.name}</span>
                <span>${remaining}秒</span>
            </div>
            <div class="tech-progress-bar">
                <div class="tech-progress-fill" style="width: ${progress}%"></div>
            </div>
        `;
    }
    
    updateSelectedInfo() {
        const info = document.getElementById('selected-info');
        if (!this.selectedCell) {
            info.textContent = '';
            return;
        }
        
        const { x, y } = this.selectedCell;
        const cell = this.grid[y]?.[x];
        if (!cell) {
            info.textContent = ` | 位置: (${x}, ${y}) - 空`;
            return;
        }
        
        if (cell.type === 'conveyor') {
            const dirNames = { right: '右', left: '左', up: '上', down: '下' };
            info.textContent = ` | 位置: (${x}, ${y}) - 传送带 (${dirNames[cell.direction]})`;
        } else if (cell.type === 'miner') {
            const resNames = { iron_ore: '铁矿', copper_ore: '铜矿', coal: '煤矿' };
            info.textContent = ` | 位置: (${x}, ${y}) - ${resNames[cell.resource] || '矿机'}`;
        } else if (cell.type === 'assembler') {
            const recipeNames = { gear: '齿轮', circuit: '电路', steel: '钢材' };
            info.textContent = ` | 位置: (${x}, ${y}) - ${recipeNames[cell.recipe]}加工台`;
        } else if (cell.type === 'warehouse') {
            info.textContent = ` | 位置: (${x}, ${y}) - 仓库`;
        }
    }
    
    updateUI() {
        document.getElementById('gold').textContent = Math.floor(this.gold);
        
        const totalStorage = this.getTotalStorage();
        const maxStorage = this.getWarehouseCapacity();
        document.getElementById('storage-display').textContent = `${totalStorage}/${maxStorage}`;
        
        document.getElementById('tech-level').textContent = this.unlockedTech.size;
        
        for (const [res, count] of Object.entries(this.resources)) {
            const el = document.getElementById(`res-${res}`);
            if (el) el.textContent = count;
        }
        
        document.querySelectorAll('.sell-btn').forEach(btn => {
            const item = btn.dataset.item;
            const price = this.getSellPrice(item);
            btn.textContent = `卖 💰${price}`;
            btn.disabled = (this.resources[item] || 0) <= 0;
        });
        
        document.querySelectorAll('.tool-btn').forEach(btn => {
            const cost = parseInt(btn.dataset.cost) || 0;
            if (cost > 0) {
                btn.disabled = this.gold < cost;
            }
        });
        
        document.getElementById('stat-miners').textContent = this.machines.filter(m => m.type === 'miner').length;
        document.getElementById('stat-conveyors').textContent = this.conveyors.length;
        document.getElementById('stat-assemblers').textContent = this.machines.filter(m => m.type === 'assembler').length;
        document.getElementById('stat-warehouses').textContent = this.machines.filter(m => m.type === 'warehouse').length;
        document.getElementById('stat-total-output').textContent = `💰${this.totalOutputValue}`;
        
        this.updateResearchProgress();
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `<span>${icons[type] || '📢'}</span><span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    save() {
        const saveData = {
            gold: this.gold,
            machines: this.machines,
            conveyors: this.conveyors.map(c => ({
                id: c.id, type: c.type, x: c.x, y: c.y, direction: c.direction, items: []
            })),
            resources: this.resources,
            unlockedTech: Array.from(this.unlockedTech),
            effects: this.effects,
            totalOutputValue: this.totalOutputValue,
            savedAt: Date.now()
        };
        
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
            this.showToast('游戏已保存！', 'success');
        } catch (e) {
            this.showToast('保存失败: ' + e.message, 'error');
        }
    }
    
    load() {
        try {
            const data = localStorage.getItem(SAVE_KEY);
            if (!data) return false;
            
            const saveData = JSON.parse(data);
            this.gold = saveData.gold ?? 500;
            this.machines = saveData.machines || [];
            this.conveyors = saveData.conveyors || [];
            this.resources = saveData.resources || this.resources;
            this.unlockedTech = new Set(saveData.unlockedTech || []);
            this.effects = saveData.effects || this.effects;
            this.totalOutputValue = saveData.totalOutputValue || 0;
            
            this.conveyors.forEach(c => c.items = []);
            this.items = [];
            
            if (saveData.savedAt) {
                const savedTime = new Date(saveData.savedAt).toLocaleString('zh-CN');
                setTimeout(() => {
                    this.showToast(`已读取存档 (保存于 ${savedTime})`, 'info');
                }, 500);
            }
            
            return true;
        } catch (e) {
            console.error('加载存档失败:', e);
            return false;
        }
    }
    
    reset() {
        if (!confirm('确定要重置游戏吗？所有进度将丢失！')) return;
        
        localStorage.removeItem(SAVE_KEY);
        
        this.gold = 500;
        this.machines = [];
        this.conveyors = [];
        this.items = [];
        this.resources = { iron_ore: 0, copper_ore: 0, coal: 0, gear: 0, circuit: 0, steel: 0 };
        this.unlockedTech = new Set();
        this.currentResearch = null;
        this.researchProgress = 0;
        this.totalOutputValue = 0;
        this.effects = {
            minerSpeed: 0, conveyorSpeed: 0, assemblerSpeed: 0,
            gearSpeed: 0, circuitSpeed: 0, steelSpeed: 0,
            warehouseCapacity: 0, conveyorCapacity: 0, sellPrice: 0, allSpeed: 0
        };
        
        this.initGrid();
        this.renderTechTree();
        this.setTool('select');
        this.updateUI();
        this.showToast('游戏已重置！', 'success');
    }
}

const autoSaveInterval = setInterval(() => {
    if (window.game) {
        try {
            const saveData = {
                gold: window.game.gold,
                machines: window.game.machines,
                conveyors: window.game.conveyors.map(c => ({
                    id: c.id, type: c.type, x: c.x, y: c.y, direction: c.direction, items: []
                })),
                resources: window.game.resources,
                unlockedTech: Array.from(window.game.unlockedTech),
                effects: window.game.effects,
                totalOutputValue: window.game.totalOutputValue,
                savedAt: Date.now()
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        } catch (e) {
        }
    }
}, 15000);

document.addEventListener('DOMContentLoaded', () => {
    window.game = new FactoryGame();
});

window.addEventListener('beforeunload', () => {
    if (window.game) {
        window.game.save();
    }
});
