const { createApp, ref, computed, onMounted } = Vue;

const API_BASE = '/api';

const itemNames = {
    'key_fragment_1': '钥匙碎片·壹',
    'key_fragment_2': '钥匙碎片·贰',
    'key_fragment_3': '钥匙碎片·叁',
    'basement_key': '地下室钥匙',
    'study_key': '书房钥匙',
    'battery_1': '电池',
    'battery_2': '电池',
    'battery_3': '电池',
    'master_key': '庄园主钥匙',
    'escape_key': '逃生钥匙'
};

const roomNames = {
    'entrance_hall': '门厅',
    'living_room': '客厅',
    'dining_room': '餐厅',
    'kitchen': '厨房',
    'pantry': '储藏室',
    'staircase': '楼梯间',
    'library': '图书馆',
    'study': '书房',
    'upstairs_hall': '二楼走廊',
    'master_bedroom': '主卧室',
    'guest_room': '客房',
    'bathroom': '浴室',
    'basement_stairs': '地下室楼梯',
    'basement': '地下室',
    'secret_room': '密室'
};

const STORAGE_KEY = 'manor_game_player';

createApp({
    setup() {
        const playerName = ref('');
        const nameError = ref('');
        const gameStarted = ref(false);
        const isRestoring = ref(false);
        const gameStatus = ref('playing');
        const currentRoom = ref(null);
        const currentRoomId = ref('entrance_hall');
        const roomItems = ref([]);
        const lives = ref(3);
        const flashlightBattery = ref(100);
        const inventoryItems = ref([]);
        const unlockedRooms = ref([]);
        const mapRooms = ref([]);
        const ghostPosition = ref('basement');
        const messages = ref([]);
        const isMoving = ref(false);
        const showEncounter = ref(false);
        const flashlightMouseX = ref(0);
        const flashlightMouseY = ref(0);

        const connections = computed(() => {
            if (!currentRoom.value?.connections) return [];
            try {
                return typeof currentRoom.value.connections === 'string' 
                    ? JSON.parse(currentRoom.value.connections) 
                    : currentRoom.value.connections;
            } catch (e) {
                return [];
            }
        });

        const ghostInRoom = computed(() => {
            return ghostPosition.value === currentRoomId.value;
        });

        const emptySlots = computed(() => {
            const total = 8;
            return Math.max(0, total - inventoryItems.value.length);
        });

        const flashlightStyle = computed(() => {
            return {
                left: flashlightMouseX.value + 'px',
                top: flashlightMouseY.value + 'px'
            };
        });

        function addMessage(text, type = 'info') {
            messages.value.unshift({ text, type });
            if (messages.value.length > 50) {
                messages.value.pop();
            }
        }

        function getItemName(itemId) {
            return itemNames[itemId] || itemId;
        }

        function getItemType(itemId) {
            if (itemId.startsWith('key_fragment')) return 'key_fragment';
            if (itemId.includes('key')) return 'key';
            if (itemId.startsWith('battery')) return 'battery';
            return 'item';
        }

        function getItemIcon(type) {
            const icons = {
                'key_fragment': '🔑',
                'key': '🗝️',
                'battery': '🔋',
                'item': '📦'
            };
            return icons[type] || '📦';
        }

        function getRoomName(roomId) {
            return roomNames[roomId] || roomId;
        }

        function isRoomLocked(roomId) {
            const room = mapRooms.value.find(r => r.room_id === roomId);
            return room?.locked && !room?.unlocked;
        }

        function getPuzzleButtonText() {
            const puzzleType = currentRoom.value?.puzzle_type;
            const texts = {
                'painting_door': '检查墙上的画框',
                'bookshelf_lever': '搜索书架上的机关',
                'floor_trap': '检查地板上的暗门'
            };
            return texts[puzzleType] || '查看机关';
        }

        function savePlayerName(name) {
            try {
                localStorage.setItem(STORAGE_KEY, name);
            } catch (e) {}
        }

        function loadPlayerName() {
            try {
                return localStorage.getItem(STORAGE_KEY) || '';
            } catch (e) {
                return '';
            }
        }

        function clearPlayerName() {
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (e) {}
        }

        async function startGame() {
            const name = playerName.value.trim();
            if (!name) {
                nameError.value = '请输入你的名字才能进入庄园';
                return;
            }
            nameError.value = '';
            
            try {
                const response = await fetch(`${API_BASE}/manor/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ player_name: name })
                });
                const result = await response.json();
                
                if (result.code === 0) {
                    const data = result.data;
                    savePlayerName(name);
                    applyGameState(data);
                    
                    const mapResp = await fetch(`${API_BASE}/manor/map/get?player_name=${encodeURIComponent(name)}`);
                    const mapResult = await mapResp.json();
                    if (mapResult.code === 0 && mapResult.data) {
                        mapRooms.value = mapResult.data.rooms;
                    }
                    
                    gameStarted.value = true;
                    
                    addMessage('你推开了庄园沉重的大门，一股霉味扑面而来……', 'info');
                    addMessage('手电筒的光束在黑暗中摇曳，四周一片寂静。', 'info');
                }
            } catch (e) {
                console.error('Start game error:', e);
                addMessage('游戏启动失败，请刷新页面重试', 'danger');
            }
        }

        function applyGameState(data) {
            gameStatus.value = data.game_state.game_status;
            currentRoom.value = data.current_room;
            currentRoomId.value = data.current_room.room_id;
            roomItems.value = data.room_items || [];
            lives.value = data.game_state.lives;
            flashlightBattery.value = data.game_state.flashlight_battery;
            inventoryItems.value = data.game_state.collected_items || [];
            unlockedRooms.value = data.game_state.unlocked_rooms || [];
            ghostPosition.value = data.game_state.ghost_position;
        }

        async function restoreGame() {
            const savedName = loadPlayerName();
            if (!savedName) return;
            
            isRestoring.value = true;
            playerName.value = savedName;
            
            try {
                const [stateResult, mapResult] = await Promise.all([
                    fetch(`${API_BASE}/manor/state/get?player_name=${encodeURIComponent(savedName)}`).then(r => r.json()),
                    fetch(`${API_BASE}/manor/map/get?player_name=${encodeURIComponent(savedName)}`).then(r => r.json())
                ]);
                
                if (stateResult.code === 0 && stateResult.data) {
                    const data = stateResult.data;
                    if (data.game_state.game_status === 'playing') {
                        applyGameState(data);
                        gameStarted.value = true;
                        
                        if (mapResult.code === 0 && mapResult.data) {
                            mapRooms.value = mapResult.data.rooms;
                        }
                        
                        addMessage('你从上次的进度继续探索……', 'info');
                    } else {
                        clearPlayerName();
                    }
                } else {
                    clearPlayerName();
                }
            } catch (e) {
                console.error('Restore game error:', e);
                clearPlayerName();
            } finally {
                isRestoring.value = false;
            }
        }

        async function loadMap() {
            try {
                const response = await fetch(`${API_BASE}/manor/map/get?player_name=${encodeURIComponent(playerName.value)}`);
                const result = await response.json();
                if (result.code === 0) {
                    mapRooms.value = result.data.rooms;
                }
            } catch (e) {
                console.error('Load map error:', e);
            }
        }

        async function moveToRoom(targetRoom) {
            if (isMoving.value) return;
            
            isMoving.value = true;
            
            try {
                const response = await fetch(`${API_BASE}/manor/move`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        player_name: playerName.value,
                        target_room: targetRoom
                    })
                });
                const result = await response.json();
                
                if (result.code === 0) {
                    const data = result.data;
                    currentRoom.value = data.current_room;
                    currentRoomId.value = data.current_room.room_id;
                    roomItems.value = data.room_items || [];
                    lives.value = data.game_state.lives;
                    flashlightBattery.value = data.game_state.flashlight_battery;
                    inventoryItems.value = data.game_state.collected_items || [];
                    unlockedRooms.value = data.game_state.unlocked_rooms || [];
                    ghostPosition.value = data.game_state.ghost_position;
                    gameStatus.value = data.game_state.game_status;
                    
                    addMessage(`你来到了${data.current_room.name}。`, 'info');
                    
                    if (data.ghost_encounter) {
                        showEncounter.value = true;
                        addMessage('幽灵！你惊恐地后退，失去了一条命！', 'danger');
                        setTimeout(() => {
                            showEncounter.value = false;
                        }, 2000);
                    }
                    
                    if (data.ghost?.moved) {
                        addMessage('你听到远处传来了脚步声……', 'warning');
                    }
                    
                    loadMap();
                } else if (result.code === 5) {
                    addMessage(result.message, 'warning');
                } else {
                    addMessage(result.message, 'danger');
                }
            } catch (e) {
                console.error('Move error:', e);
                addMessage('移动失败', 'danger');
            }
            
            isMoving.value = false;
        }

        async function collectItem(itemId) {
            try {
                const response = await fetch(`${API_BASE}/manor/collect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        player_name: playerName.value,
                        item_id: itemId
                    })
                });
                const result = await response.json();
                
                if (result.code === 0) {
                    const data = result.data;
                    roomItems.value = data.room_items || [];
                    flashlightBattery.value = data.game_state.flashlight_battery;
                    inventoryItems.value = data.game_state.collected_items || [];
                    gameStatus.value = data.game_state.game_status;
                    
                    addMessage(`你拾取了${data.item.name}。`, 'success');
                    
                    if (data.item.item_type === 'battery') {
                        addMessage('手电筒电量恢复了！', 'success');
                    }
                    
                    if (data.item.item_type === 'key_fragment') {
                        const fragments = inventoryItems.value.filter(i => i.startsWith('key_fragment')).length;
                        const hasMaster = inventoryItems.value.includes('master_key');
                        if (hasMaster) {
                            addMessage('三块钥匙碎片合成了庄园主钥匙！', 'success');
                        } else {
                            addMessage(`已收集 ${fragments}/3 块钥匙碎片。`, 'info');
                        }
                    }
                    
                    if (itemId === 'escape_key') {
                        addMessage('你找到了逃生钥匙！快逃离这里！', 'success');
                    }
                } else {
                    addMessage(result.message, 'danger');
                }
            } catch (e) {
                console.error('Collect item error:', e);
                addMessage('拾取失败', 'danger');
            }
        }

        async function solvePuzzle() {
            const puzzleType = currentRoom.value?.puzzle_type;
            if (!puzzleType) return;
            
            try {
                const response = await fetch(`${API_BASE}/manor/puzzle`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        player_name: playerName.value,
                        puzzle_type: puzzleType
                    })
                });
                const result = await response.json();
                
                if (result.code === 0) {
                    const data = result.data;
                    
                    if (currentRoom.value) {
                        currentRoom.value.puzzle_solved = 1;
                    }
                    
                    addMessage('机关被触发了！', 'success');
                    if (data.reward) {
                        addMessage(data.reward, 'success');
                    }
                    
                    loadMap();
                } else {
                    addMessage(result.message, 'warning');
                }
            } catch (e) {
                console.error('Solve puzzle error:', e);
                addMessage('机关触发失败', 'danger');
            }
        }

        function restartGame() {
            gameStarted.value = false;
            gameStatus.value = 'playing';
            currentRoom.value = null;
            currentRoomId.value = 'entrance_hall';
            roomItems.value = [];
            lives.value = 3;
            flashlightBattery.value = 100;
            inventoryItems.value = [];
            unlockedRooms.value = [];
            mapRooms.value = [];
            ghostPosition.value = 'basement';
            messages.value = [];
            showEncounter.value = false;
            clearPlayerName();
        }

        function handleMouseMove(e) {
            flashlightMouseX.value = e.clientX;
            flashlightMouseY.value = e.clientY;
        }

        onMounted(() => {
            document.addEventListener('mousemove', handleMouseMove);
            restoreGame();
        });

        return {
            playerName,
            nameError,
            gameStarted,
            isRestoring,
            gameStatus,
            currentRoom,
            currentRoomId,
            roomItems,
            lives,
            flashlightBattery,
            inventoryItems,
            unlockedRooms,
            mapRooms,
            ghostPosition,
            messages,
            isMoving,
            showEncounter,
            connections,
            ghostInRoom,
            emptySlots,
            flashlightStyle,
            startGame,
            moveToRoom,
            collectItem,
            solvePuzzle,
            restartGame,
            getItemName,
            getItemType,
            getItemIcon,
            getRoomName,
            isRoomLocked,
            getPuzzleButtonText
        };
    }
}).mount('#app');
