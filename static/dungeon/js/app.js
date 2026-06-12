const { createApp, ref, reactive, computed, onMounted, onUnmounted, nextTick } = Vue;

const API_BASE = '/api';

const app = createApp({
    setup() {
        const GRID_SIZE = 8;
        const CELL_SIZE = 48;
        
        const game = new DungeonGame();
        const gameState = reactive(game.getState());
        const combatLogs = ref([]);
        const floatingTexts = ref([]);
        const floatingTextId = ref(0);
        
        const showLeaderboard = ref(false);
        const showRestartConfirm = ref(false);
        const leaderboardSort = ref('gold');
        const leaderboardData = ref([]);
        const playerName = ref('');
        const scoreSubmitted = ref(false);
        
        const visibleGrid = computed(() => {
            const flat = [];
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    if (gameState.grid[y] && gameState.grid[y][x]) {
                        flat.push(gameState.grid[y][x]);
                    }
                }
            }
            return flat;
        });
        
        function getCellClass(cell) {
            const classes = [];
            if (cell.visible) {
                classes.push('tile-' + cell.tile);
                if (cell.explored && !cell.visible) {
                    classes.push('explored');
                }
            }
            return classes;
        }
        
        function getItemIcon(item) {
            if (!item) return '';
            switch (item.type) {
                case 'potion': return '🧪';
                case 'weapon': return '⚔️';
                case 'armor': return '🛡️';
                case 'gold': return '💰';
                default: return '❓';
            }
        }
        
        function addFloatingText(x, y, text, type) {
            const id = floatingTextId.value++;
            const cellX = (x % GRID_SIZE) * CELL_SIZE + CELL_SIZE / 2;
            const cellY = Math.floor(x / GRID_SIZE) * CELL_SIZE + CELL_SIZE / 2;
            
            floatingTexts.value.push({
                id,
                x: cellX,
                y: cellY,
                text,
                type
            });
            
            setTimeout(() => {
                floatingTexts.value = floatingTexts.value.filter(t => t.id !== id);
            }, 1000);
        }
        
        function addCombatLog(message, type = 'info') {
            combatLogs.value.push({ message, type, timestamp: Date.now() });
            nextTick(() => {
                const logContainer = document.querySelector('.combat-log');
                if (logContainer) {
                    logContainer.scrollTop = logContainer.scrollHeight;
                }
            });
        }
        
        function handleMove(dx, dy) {
            if (!gameState.gameStarted || gameState.gameOver) return;
            
            const flatIndex = gameState.player.y * GRID_SIZE + gameState.player.x;
            
            const result = game.movePlayer(dx, dy);
            Object.assign(gameState, game.getState());
            
            if (result.combat) {
                const enemyFlatIndex = result.enemy.y * GRID_SIZE + result.enemy.x;
                addFloatingText(enemyFlatIndex, 0, `-${result.damage}`, 'damage');
                addCombatLog(`你攻击${result.enemy.name}，造成 ${result.damage} 点伤害！`, 'attack');
                
                if (result.enemyKilled) {
                    addCombatLog(`你击败了${result.enemy.name}！`, 'kill');
                }
            }
            
            if (result.trap && !result.chest) {
                addFloatingText(flatIndex, 0, `-${result.damage}`, 'damage');
                addCombatLog(`你踩到了陷阱，受到 ${result.damage} 点伤害！`, 'damage');
            }
            
            if (result.chest && result.loot) {
                if (result.loot.type === 'trap') {
                    addFloatingText(flatIndex, 0, `-${result.damage}`, 'damage');
                    addCombatLog(`宝箱是个陷阱！你受到 ${result.damage} 点伤害！`, 'damage');
                } else if (result.loot.type === 'gold') {
                    addFloatingText(flatIndex, 0, `+${result.loot.value}💰`, 'gold');
                    addCombatLog(`打开宝箱获得 ${result.loot.value} 金币！`, 'loot');
                } else {
                    addFloatingText(flatIndex, 0, '📦', 'loot');
                    addCombatLog(`打开宝箱获得 ${result.loot.name}！`, 'loot');
                }
            }
            
            if (result.stairs) {
                addCombatLog('你发现了通往下一层的楼梯！', 'info');
                setTimeout(() => {
                    game.nextFloor();
                    Object.assign(gameState, game.getState());
                    if (game.combatLogs) {
                        game.combatLogs.forEach(log => addCombatLog(log.message, log.type));
                        game.combatLogs = [];
                    }
                }, 500);
            }
            
            if (result.gameOver || gameState.gameOver) {
                addCombatLog('你被击败了...', 'death');
            }
        }
        
        function useItem(index) {
            if (!gameState.gameStarted || gameState.gameOver) return;
            
            const result = game.useItem(index);
            if (!result) return;
            
            Object.assign(gameState, game.getState());
            
            const flatIndex = gameState.player.y * GRID_SIZE + gameState.player.x;
            
            if (result.heal) {
                addFloatingText(flatIndex, 0, `+${result.heal}`, 'heal');
                addCombatLog(`使用${result.item.name}，恢复 ${result.heal} 点生命！`, 'heal');
            } else if (result.equipped) {
                addCombatLog(`装备了${result.item.name}！`, 'info');
            } else if (result.gold) {
                addFloatingText(flatIndex, 0, `+${result.gold}💰`, 'gold');
                addCombatLog(`拾取 ${result.gold} 金币！`, 'loot');
            }
        }
        
        function waitTurn() {
            if (!gameState.gameStarted || gameState.gameOver) return;
            
            game.waitTurn();
            Object.assign(gameState, game.getState());
            addCombatLog('你原地等待...', 'info');
        }
        
        function handleKeydown(e) {
            if (!gameState.gameStarted || gameState.gameOver) return;
            if (showLeaderboard.value || showRestartConfirm.value) return;
            
            switch (e.key) {
                case 'w':
                case 'W':
                case 'ArrowUp':
                    e.preventDefault();
                    handleMove(0, -1);
                    break;
                case 's':
                case 'S':
                case 'ArrowDown':
                    e.preventDefault();
                    handleMove(0, 1);
                    break;
                case 'a':
                case 'A':
                case 'ArrowLeft':
                    e.preventDefault();
                    handleMove(-1, 0);
                    break;
                case 'd':
                case 'D':
                case 'ArrowRight':
                    e.preventDefault();
                    handleMove(1, 0);
                    break;
                case ' ':
                    e.preventDefault();
                    waitTurn();
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                    e.preventDefault();
                    useItem(parseInt(e.key) - 1);
                    break;
            }
        }
        
        function startGame() {
            game.gameStarted = true;
            game.combatLogs = [];
            game.generateDungeon(1);
            Object.assign(gameState, game.getState());
            combatLogs.value = [];
            addCombatLog('欢迎来到地牢！找到楼梯前往下一层。', 'info');
        }
        
        function restartGame() {
            game.depth = 1;
            game.gold = 0;
            game.kills = 0;
            game.gameOver = false;
            game.gameStarted = true;
            game.combatLogs = [];
            game.player = null;
            game.generateDungeon(1);
            Object.assign(gameState, game.getState());
            combatLogs.value = [];
            showRestartConfirm.value = false;
            scoreSubmitted.value = false;
            playerName.value = '';
            addCombatLog('新的冒险开始了！', 'info');
        }
        
        async function submitScore() {
            if (scoreSubmitted.value) return;
            
            const name = playerName.value.trim() || '冒险者';
            
            try {
                const response = await fetch(`${API_BASE}/dungeon/score/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        player_name: name,
                        depth: gameState.depth,
                        kills: gameState.kills,
                        gold: gameState.gold
                    })
                });
                
                const data = await response.json();
                if (data.code === 0) {
                    scoreSubmitted.value = true;
                    addCombatLog('分数已提交！', 'info');
                }
            } catch (e) {
                console.error('Failed to submit score:', e);
            }
        }
        
        async function loadLeaderboard() {
            try {
                const response = await fetch(
                    `${API_BASE}/dungeon/score/getlist?limit=20&sort_by=${leaderboardSort.value}`
                );
                const data = await response.json();
                if (data.code === 0 && data.data) {
                    leaderboardData.value = data.data.scores || [];
                }
            } catch (e) {
                console.error('Failed to load leaderboard:', e);
                leaderboardData.value = [];
            }
        }
        
        onMounted(() => {
            window.addEventListener('keydown', handleKeydown);
        });
        
        onUnmounted(() => {
            window.removeEventListener('keydown', handleKeydown);
        });
        
        return {
            GRID_SIZE,
            gameState,
            visibleGrid,
            combatLogs,
            floatingTexts,
            showLeaderboard,
            showRestartConfirm,
            leaderboardSort,
            leaderboardData,
            playerName,
            scoreSubmitted,
            getCellClass,
            getItemIcon,
            useItem,
            startGame,
            restartGame,
            submitScore,
            loadLeaderboard
        };
    }
});

app.mount('#app');
