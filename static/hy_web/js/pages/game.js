import { apiService } from '../services/api.js';
import { toast } from '../utils/toast.js';
import { audioEngine } from '../utils/audio.js';

const DEFAULT_CREATURES = [
    { id: 1, name: '小丑鱼', is_dangerous: false, min_depth: 0, max_depth: 300, coins_value: 10, rarity: 'common' },
    { id: 2, name: '蓝唐王鱼', is_dangerous: false, min_depth: 0, max_depth: 400, coins_value: 15, rarity: 'common' },
    { id: 3, name: '狮子鱼', is_dangerous: true, min_depth: 30, max_depth: 600, coins_value: 30, rarity: 'uncommon' },
    { id: 4, name: '水母', is_dangerous: true, min_depth: 50, max_depth: 700, coins_value: 25, rarity: 'uncommon' },
    { id: 5, name: '巨型章鱼', is_dangerous: true, min_depth: 150, max_depth: 900, coins_value: 50, rarity: 'rare' },
    { id: 6, name: '大王乌贼', is_dangerous: true, min_depth: 250, max_depth: 1000, coins_value: 80, rarity: 'rare' },
    { id: 7, name: '灯笼鱼', is_dangerous: false, min_depth: 100, max_depth: 800, coins_value: 35, rarity: 'uncommon' },
    { id: 8, name: '吞噬鳗', is_dangerous: true, min_depth: 400, max_depth: 1000, coins_value: 100, rarity: 'epic' }
];

const DEFAULT_TREASURES = [
    { id: 1, name: '金币袋', min_depth: 0, max_depth: 400, coins_value: 50, rarity: 'common' },
    { id: 2, name: '珍珠', min_depth: 30, max_depth: 600, coins_value: 100, rarity: 'uncommon' },
    { id: 3, name: '海盗宝箱', min_depth: 80, max_depth: 700, coins_value: 200, rarity: 'rare' },
    { id: 4, name: '古代金币', min_depth: 150, max_depth: 900, coins_value: 150, rarity: 'uncommon' },
    { id: 5, name: '海洋之心', min_depth: 300, max_depth: 1000, coins_value: 500, rarity: 'epic' },
    { id: 6, name: '沉船遗骸', min_depth: 200, max_depth: 1000, coins_value: 300, rarity: 'rare' }
];

const CREATURE_EMOJIS = {
    '小丑鱼': '🐠', '蓝唐王鱼': '🐟', '狮子鱼': '🦑',
    '水母': '🪼', '巨型章鱼': '🐙', '大王乌贼': '🦑',
    '灯笼鱼': '🐡', '吞噬鳗': '🐍'
};

const TREASURE_EMOJIS = {
    '金币袋': '💰', '珍珠': '🔮', '海盗宝箱': '📦',
    '古代金币': '🪙', '海洋之心': '💎', '沉船遗骸': '🚢'
};

const MUSIC_LIST = [
    { name: '海洋晨曦', bpm: 80, mood: 'calm' },
    { name: '珊瑚之舞', bpm: 120, mood: 'playful' },
    { name: '深海低语', bpm: 60, mood: 'mysterious' },
    { name: '暗流涌动', bpm: 140, mood: 'intense' },
    { name: '海底赞歌', bpm: 100, mood: 'epic' }
];

const GAME_STATE_KEY = 'hy_game_state';

function loadGameState() {
    try {
        const saved = localStorage.getItem(GAME_STATE_KEY);
        if (saved) {
            const state = JSON.parse(saved);
            console.log('【加载】读取存档:', state);
            return state;
        }
    } catch (e) {
        console.error('【加载】失败:', e);
    }
    return null;
}

function saveGameState(state) {
    try {
        const toSave = { ...state, savedAt: Date.now() };
        localStorage.setItem(GAME_STATE_KEY, JSON.stringify(toSave));
        console.log('【保存】写入存档:', toSave);
    } catch (e) {
        console.error('【保存】失败:', e);
    }
}

export default {
    template: `
        <div class="game-canvas-container">
            <div class="game-canvas" ref="gameCanvas">
                <div class="submarine" :style="submarineStyle">
                    <div class="submarine-body"></div>
                    <div class="submarine-window"></div>
                </div>
                
                <div 
                    v-for="creature in creatures" 
                    :key="'creature-' + creature.uid"
                    class="creature"
                    :class="{ dangerous: creature.is_dangerous }"
                    :style="{ left: creature.x + 'px', top: creature.y + 'px', width: creature.size + 'px', height: creature.size + 'px', background: creature.is_dangerous ? 'rgba(255, 100, 100, 0.3)' : 'rgba(100, 200, 255, 0.3)' }"
                    @click="tryCollect(creature)"
                >
                    {{ creature.emoji }}
                </div>
                
                <div 
                    v-for="treasure in treasures" 
                    :key="'treasure-' + treasure.uid"
                    class="treasure"
                    :style="{ left: treasure.x + 'px', top: treasure.y + 'px' }"
                    @click="tryCollect(treasure)"
                >
                    {{ treasure.emoji }}
                </div>
                
                <div class="game-hud">
                    <div class="hud-left">
                        <div class="depth-meter">
                            <span class="depth-label">当前深度</span>
                            <span class="depth-value">{{ currentDepth.toFixed(0) }} 米</span>
                            <div class="pressure-bar">
                                <div class="pressure-fill" :style="{ width: pressurePercent + '%' }"></div>
                            </div>
                            <span class="depth-label" style="margin-top: 5px;">压力: {{ (currentPressure * 100).toFixed(0) }}%</span>
                        </div>
                    </div>
                    <div class="hud-right">
                        <div>💰 金币: {{ coins }}</div>
                        <div>📦 收集: {{ collected }}</div>
                    </div>
                </div>
                
                <div v-if="showWarning" class="depth-warning">
                    ⚠️ 警告：压力过大！请上升！
                </div>
                
                <div class="music-player">
                    <div class="music-info">
                        <div class="music-title">🎵 {{ currentMusicName }}</div>
                        <div class="music-bpm">BPM: {{ currentMusicBpm }}</div>
                    </div>
                    <div class="music-controls">
                        <button class="music-btn" @click="toggleMusic">{{ isMusicPlaying ? '⏸' : '▶' }}</button>
                        <button class="music-btn" @click="switchMusic">🔄</button>
                    </div>
                </div>
                
                <div class="controls-hint">
                    ⬆️⬇️⬅️➡️ 或 WASD 移动 | 🖱️ 点击收集
                </div>
            </div>
        </div>
    `,
    data() {
        const saved = loadGameState();
        return {
            submarineX: saved?.submarineX ?? 400,
            submarineY: saved?.submarineY ?? 300,
            currentDepth: saved?.currentDepth ?? 0,
            maxDepth: 1000,
            coins: saved?.coins ?? 0,
            collected: saved?.collected ?? 0,
            health: saved?.health ?? 100,
            creatures: [],
            treasures: [],
            keys: {},
            showWarning: false,
            warningCooldown: 0,
            spawnCooldown: 0,
            uidCounter: 0,
            isMusicPlaying: false,
            currentMusicIndex: 0,
            currentMusicName: '海洋晨曦',
            currentMusicBpm: 80,
            gameLoop: null,
            saveTimer: null,
            canvasWidth: 800,
            canvasHeight: 600,
            allCreatures: DEFAULT_CREATURES,
            allTreasures: DEFAULT_TREASURES,
            savePending: false
        };
    },
    computed: {
        submarineStyle() {
            return {
                left: this.submarineX + 'px',
                top: this.submarineY + 'px'
            };
        },
        currentPressure() {
            return Math.min(this.currentDepth / this.maxDepth, 1);
        },
        pressurePercent() {
            return this.currentPressure * 100;
        }
    },
    mounted() {
        console.log('【Game组件】已加载，初始状态:', {
            x: this.submarineX,
            y: this.submarineY,
            depth: this.currentDepth,
            coins: this.coins
        });
        
        this.$nextTick(() => {
            this.initCanvas();
            this.spawnInitialEntities();
        });
        
        this.startGameLoop();
        this.startMusic();
        this.startAutoSave();
        this.bindEvents();
    },
    beforeUnmount() {
        this.cleanup();
    },
    methods: {
        initCanvas() {
            const canvas = this.$refs.gameCanvas;
            if (canvas) {
                this.canvasWidth = Math.max(canvas.offsetWidth, 800);
                this.canvasHeight = Math.max(canvas.offsetHeight, 600);
            }
            console.log('Canvas尺寸:', this.canvasWidth, 'x', this.canvasHeight);
        },
        
        getCreaturesForDepth(depth) {
            return this.allCreatures.filter(c => 
                c.min_depth <= depth && c.max_depth >= depth
            );
        },
        
        getTreasuresForDepth(depth) {
            return this.allTreasures.filter(t => 
                t.min_depth <= depth && t.max_depth >= depth
            );
        },
        
        spawnInitialEntities() {
            const depthCreatures = this.getCreaturesForDepth(this.currentDepth);
            const depthTreasures = this.getTreasuresForDepth(this.currentDepth);
            
            console.log(`当前深度: ${this.currentDepth}m, 可生成生物: ${depthCreatures.length}种, 宝藏: ${depthTreasures.length}种`);
            
            this.creatures = depthCreatures.slice(0, 5).map(c => this.createCreatureInstance(c));
            this.treasures = depthTreasures.slice(0, 3).map(t => this.createTreasureInstance(t));
            
            console.log(`已生成生物: ${this.creatures.length}, 宝藏: ${this.treasures.length}`);
            
            if (this.creatures.length === 0 && depthCreatures.length > 0) {
                const c = depthCreatures[0];
                this.creatures = [this.createCreatureInstance(c)];
                console.log('保底生成1个生物');
            }
        },
        
        createCreatureInstance(creature) {
            return {
                ...creature,
                uid: ++this.uidCounter,
                x: Math.random() * (this.canvasWidth - 100) + 50,
                y: Math.random() * (this.canvasHeight - 100) + 50,
                size: creature.is_dangerous ? 50 : 40,
                emoji: CREATURE_EMOJIS[creature.name] || '🐟',
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                type: 'creature'
            };
        },
        
        createTreasureInstance(treasure) {
            return {
                ...treasure,
                uid: ++this.uidCounter,
                x: Math.random() * (this.canvasWidth - 100) + 50,
                y: Math.random() * (this.canvasHeight - 100) + 50,
                emoji: TREASURE_EMOJIS[treasure.name] || '💎',
                type: 'treasure'
            };
        },
        
        bindEvents() {
            this.handleKeyDown = this.handleKeyDown.bind(this);
            this.handleKeyUp = this.handleKeyUp.bind(this);
            this.handlePageHide = this.handlePageHide.bind(this);
            
            window.addEventListener('keydown', this.handleKeyDown);
            window.addEventListener('keyup', this.handleKeyUp);
            window.addEventListener('beforeunload', this.handlePageHide);
            window.addEventListener('pagehide', this.handlePageHide);
            
            this.visibilityHandler = () => {
                if (document.visibilityState === 'hidden') {
                    this.saveState();
                }
            };
            document.addEventListener('visibilitychange', this.visibilityHandler);
        },
        
        startGameLoop() {
            this.gameLoop = setInterval(() => this.updateGame(), 50);
        },
        
        startAutoSave() {
            this.saveTimer = setInterval(() => {
                this.saveState();
            }, 3000);
        },
        
        saveState() {
            if (this.savePending) return;
            this.savePending = true;
            
            const state = {
                submarineX: this.submarineX,
                submarineY: this.submarineY,
                currentDepth: this.currentDepth,
                coins: this.coins,
                collected: this.collected,
                health: this.health
            };
            saveGameState(state);
            
            this.savePending = false;
            
            if (apiService.token) {
                try {
                    apiService.saveGameState(state).catch(() => {});
                    apiService.updateDepth(Math.floor(this.currentDepth)).catch(() => {});
                } catch (e) {}
            }
        },
        
        updateGame() {
            this.handleMovement();
            this.updateCreatures();
            this.updateSpawn();
            this.updateWarning();
        },
        
        handleMovement() {
            const speed = 5;
            let moved = false;
            
            if (this.keys['ArrowUp'] || this.keys['KeyW']) {
                this.submarineY = Math.max(20, this.submarineY - speed);
                this.currentDepth = Math.max(0, this.currentDepth - 2);
                moved = true;
            }
            if (this.keys['ArrowDown'] || this.keys['KeyS']) {
                this.submarineY = Math.min(this.canvasHeight - 60, this.submarineY + speed);
                this.currentDepth = Math.min(this.maxDepth, this.currentDepth + 2);
                moved = true;
            }
            if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
                this.submarineX = Math.max(20, this.submarineX - speed);
                moved = true;
            }
            if (this.keys['ArrowRight'] || this.keys['KeyD']) {
                this.submarineX = Math.min(this.canvasWidth - 100, this.submarineX + speed);
                moved = true;
            }
            
            if (moved) {
                this.checkDepthChange();
            }
        },
        
        updateCreatures() {
            this.creatures.forEach(c => {
                c.x += c.vx;
                c.y += c.vy;
                if (c.x < 10 || c.x > this.canvasWidth - 60) c.vx *= -1;
                if (c.y < 10 || c.y > this.canvasHeight - 60) c.vy *= -1;
                c.x = Math.max(10, Math.min(this.canvasWidth - 60, c.x));
                c.y = Math.max(10, Math.min(this.canvasHeight - 60, c.y));
            });
        },
        
        updateSpawn() {
            this.spawnCooldown++;
            if (this.spawnCooldown >= 150) {
                this.spawnCooldown = 0;
                this.respawnEntity();
            }
        },
        
        updateWarning() {
            this.warningCooldown = Math.max(0, this.warningCooldown - 1);
            if (this.currentPressure > 0.9 && this.warningCooldown <= 0) {
                this.showWarning = true;
                this.warningCooldown = 100;
                setTimeout(() => { this.showWarning = false; }, 2000);
            }
        },
        
        checkDepthChange() {
            const depthCreatures = this.getCreaturesForDepth(this.currentDepth);
            const existingIds = this.creatures.map(c => c.id);
            const missing = depthCreatures.filter(c => !existingIds.includes(c.id));
            
            if (missing.length > 0 && this.creatures.length < 6) {
                this.respawnEntity();
            }
        },
        
        respawnEntity() {
            const depthCreatures = this.getCreaturesForDepth(this.currentDepth);
            const depthTreasures = this.getTreasuresForDepth(this.currentDepth);
            
            if (this.creatures.length < 6 && depthCreatures.length > 0) {
                const c = depthCreatures[Math.floor(Math.random() * depthCreatures.length)];
                this.creatures.push(this.createCreatureInstance(c));
            }
            
            if (this.treasures.length < 4 && depthTreasures.length > 0) {
                const t = depthTreasures[Math.floor(Math.random() * depthTreasures.length)];
                this.treasures.push(this.createTreasureInstance(t));
            }
        },
        
        handleKeyDown(e) {
            this.keys[e.code] = true;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        },
        
        handleKeyUp(e) {
            this.keys[e.code] = false;
        },
        
        handlePageHide() {
            console.log('【页面关闭】立即保存');
            this.saveState();
        },
        
        startMusic() {
            const track = MUSIC_LIST[this.currentMusicIndex];
            audioEngine.playTrack(track);
            this.isMusicPlaying = true;
            this.currentMusicName = track.name;
            this.currentMusicBpm = track.bpm;
        },
        
        stopMusic() {
            audioEngine.stop();
            this.isMusicPlaying = false;
        },
        
        toggleMusic() {
            if (this.isMusicPlaying) {
                this.stopMusic();
            } else {
                this.startMusic();
            }
        },
        
        switchMusic() {
            this.currentMusicIndex = (this.currentMusicIndex + 1) % MUSIC_LIST.length;
            const track = MUSIC_LIST[this.currentMusicIndex];
            audioEngine.playTrack(track);
            this.isMusicPlaying = true;
            this.currentMusicName = track.name;
            this.currentMusicBpm = track.bpm;
            toast.info(`切换音乐：${track.name}`);
        },
        
        tryCollect(entity) {
            const distance = Math.sqrt(
                Math.pow(this.submarineX - entity.x, 2) + 
                Math.pow(this.submarineY - entity.y, 2)
            );
            
            if (distance > 200) {
                toast.info('太远了，靠近一点！');
                return;
            }
            
            if (entity.type === 'creature') {
                this.collectCreature(entity);
            } else if (entity.type === 'treasure') {
                this.collectTreasure(entity);
            }
        },
        
        async collectCreature(creature) {
            if (creature.is_dangerous) {
                this.health = Math.max(0, this.health - 20);
                this.currentDepth = Math.max(0, this.currentDepth - 30);
                audioEngine.playDanger();
                toast.error(`危险！被${creature.name}攻击了！-20HP`);
                this.creatures = this.creatures.filter(c => c.uid !== creature.uid);
                this.saveState();
                return;
            }
            
            this.coins += creature.coins_value || 10;
            this.collected++;
            audioEngine.playCollect();
            toast.success(`收集了 ${creature.name}！+${creature.coins_value || 10}金币`);
            this.creatures = this.creatures.filter(c => c.uid !== creature.uid);
            this.saveState();
            
            try {
                await apiService.collectCreature(creature.id);
            } catch (error) {}
        },
        
        async collectTreasure(treasure) {
            this.coins += treasure.coins_value || 50;
            this.collected++;
            audioEngine.playDiscover();
            toast.success(`发现了 ${treasure.name}！+${treasure.coins_value || 50}金币`);
            this.treasures = this.treasures.filter(t => t.uid !== treasure.uid);
            this.saveState();
            
            try {
                await apiService.collectTreasure(treasure.id);
            } catch (error) {}
        },
        
        cleanup() {
            this.saveState();
            
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = null;
            }
            if (this.saveTimer) {
                clearInterval(this.saveTimer);
                this.saveTimer = null;
            }
            
            this.stopMusic();
            
            window.removeEventListener('keydown', this.handleKeyDown);
            window.removeEventListener('keyup', this.handleKeyUp);
            window.removeEventListener('beforeunload', this.handlePageHide);
            window.removeEventListener('pagehide', this.handlePageHide);
            document.removeEventListener('visibilitychange', this.visibilityHandler);
        }
    }
};
