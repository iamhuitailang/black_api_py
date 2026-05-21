const Game = (function() {
    let currentLevel = null;
    let levelData = null;
    let solvedPuzzles = [];
    let gameState = 'menu';
    let animationFrame = null;
    let autoSaveInterval = null;
    
    function init() {
        const canvas = document.getElementById('game-canvas');
        Renderer.init(canvas);
        Puzzles.init();
        Inventory.init({
            onSelect: openItemModal
        });
        
        setupEventListeners();
        updateStartScreen();
    }
    
    function setupEventListeners() {
        const canvas = Renderer.getCanvas();
        
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('click', handleClick);
        
        document.getElementById('new-game-btn').addEventListener('click', () => startNewGame(1));
        document.getElementById('continue-btn').addEventListener('click', continueGame);
        
        document.getElementById('pause-btn').addEventListener('click', pauseGame);
        document.getElementById('resume-btn').addEventListener('click', resumeGame);
        document.getElementById('restart-btn').addEventListener('click', restartLevel);
        document.getElementById('quit-btn').addEventListener('click', quitToMenu);
        
        document.getElementById('hint-btn').addEventListener('click', showHint);
        
        document.getElementById('next-level-btn').addEventListener('click', goToNextLevel);
        document.getElementById('replay-btn').addEventListener('click', restartLevel);
        document.getElementById('victory-quit-btn').addEventListener('click', quitToMenu);
        
        document.getElementById('retry-btn').addEventListener('click', restartLevel);
        document.getElementById('gameover-quit-btn').addEventListener('click', quitToMenu);
        
        document.getElementById('close-item-btn').addEventListener('click', closeItemModal);
        document.getElementById('use-item-btn').addEventListener('click', useSelectedItem);
        document.getElementById('combine-item-btn').addEventListener('click', () => {
            closeItemModal();
            Inventory.startCombineMode();
        });
    }
    
    function startNewGame(levelId) {
        currentLevel = levelId;
        levelData = Levels.getLevel(levelId);
        solvedPuzzles = [];
        
        if (!levelData) {
            Utils.showMessage('关卡不存在！', 'danger');
            return;
        }
        
        Inventory.clear();
        Inventory.setCallbacks({
            onSelect: openItemModal
        });
        
        Timer.init(levelData.timeLimit, {
            onTick: handleTimerTick,
            onComplete: handleGameOver
        });
        
        Renderer.setLevel(levelData);
        updateLevelDisplay();
        
        hideAllModals();
        gameState = 'playing';
        
        Utils.showMessage(levelData.startMessage, 'info', 4000);
        
        Timer.start();
        startGameLoop();
        startAutoSave();
        
        saveGameState();
    }
    
    function continueGame() {
        const savedGame = Storage.loadGame();
        if (!savedGame) {
            Utils.showMessage('没有保存的游戏进度！', 'warning');
            return;
        }
        
        restoreGameState(savedGame);
    }
    
    function restoreGameState(savedState) {
        currentLevel = savedState.level;
        levelData = Levels.getLevel(currentLevel);
        solvedPuzzles = savedState.solvedPuzzles || [];
        
        if (savedState.objects) {
            levelData.objects = savedState.objects;
        }
        
        Timer.init(levelData.timeLimit, {
            onTick: handleTimerTick,
            onComplete: handleGameOver
        });
        
        Timer.reset(savedState.remainingTime || levelData.timeLimit);
        
        Inventory.restoreState(savedState.inventory);
        Inventory.setCallbacks({
            onSelect: openItemModal
        });
        
        Renderer.setLevel(levelData);
        updateLevelDisplay();
        
        hideAllModals();
        gameState = 'playing';
        
        Timer.start();
        startGameLoop();
        startAutoSave();
        
        Utils.showMessage('游戏进度已恢复！', 'success');
    }
    
    function pauseGame() {
        if (gameState !== 'playing') return;
        
        Timer.pause();
        gameState = 'paused';
        document.getElementById('pause-screen').style.display = 'flex';
        
        saveGameState();
    }
    
    function resumeGame() {
        if (gameState !== 'paused') return;
        
        document.getElementById('pause-screen').style.display = 'none';
        gameState = 'playing';
        Timer.resume();
    }
    
    function restartLevel() {
        hideAllModals();
        startNewGame(currentLevel);
    }
    
    function quitToMenu() {
        stopGameLoop();
        stopAutoSave();
        Timer.stop();
        Inventory.clear();
        
        hideAllModals();
        gameState = 'menu';
        document.getElementById('start-screen').style.display = 'flex';
        
        updateStartScreen();
    }
    
    function goToNextLevel() {
        const nextLevel = currentLevel + 1;
        if (nextLevel <= Levels.getTotalLevels()) {
            Storage.unlockLevel(nextLevel);
            hideAllModals();
            startNewGame(nextLevel);
        } else {
            Utils.showMessage('恭喜你通关了所有关卡！', 'success');
            quitToMenu();
        }
    }
    
    function startGameLoop() {
        function gameLoop() {
            if (gameState === 'playing') {
                render();
            }
            animationFrame = requestAnimationFrame(gameLoop);
        }
        gameLoop();
    }
    
    function stopGameLoop() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    }
    
    function render() {
        if (!levelData) return;
        
        Renderer.clear();
        Renderer.renderObjects(levelData.objects, solvedPuzzles);
    }
    
    function handleMouseMove(e) {
        if (gameState !== 'playing' || !levelData) return;
        
        const pos = Renderer.screenToGame(e.clientX, e.clientY);
        const hoveredObj = findObjectAtPosition(pos);
        
        Renderer.setHoveredObject(hoveredObj);
        
        const canvas = Renderer.getCanvas();
        canvas.style.cursor = hoveredObj ? 'pointer' : 'default';
    }
    
    function handleClick(e) {
        if (gameState !== 'playing' || !levelData) return;
        
        const pos = Renderer.screenToGame(e.clientX, e.clientY);
        const clickedObj = findObjectAtPosition(pos);
        
        if (clickedObj) {
            handleObjectClick(clickedObj);
        }
    }
    
    function findObjectAtPosition(pos) {
        for (let i = levelData.objects.length - 1; i >= 0; i--) {
            const obj = levelData.objects[i];
            
            if (obj.revealCondition && !solvedPuzzles.includes(obj.revealCondition.replace('_solved', ''))) continue;
            if (obj.hidden && !obj.revealed && obj.type !== 'clue') continue;
            
            if (Utils.isPointInRect(pos, obj)) {
                if (obj.children) {
                    for (let j = obj.children.length - 1; j >= 0; j--) {
                        const child = obj.children[j];
                        const childPos = {
                            x: pos.x - obj.x,
                            y: pos.y - obj.y
                        };
                        if (Utils.isPointInRect(childPos, child)) {
                            return { ...child, parentId: obj.id, isChild: true };
                        }
                    }
                }
                return obj;
            }
        }
        return null;
    }
    
    function handleObjectClick(obj) {
        switch (obj.type) {
            case 'item':
                pickupItem(obj);
                break;
            case 'clue':
                revealClue(obj);
                break;
            case 'trap':
                triggerTrap(obj);
                break;
            case 'lock':
            case 'drawer':
                openPuzzle(obj);
                break;
            case 'puzzle_trigger':
                handlePuzzleTrigger(obj);
                break;
            case 'compartment':
                handleCompartment(obj);
                break;
            case 'exit':
                handleExit(obj);
                break;
            case 'interactive':
            case 'area':
                Utils.showMessage(obj.description || obj.name, 'info');
                break;
            default:
                Utils.showMessage(obj.name, 'info');
        }
    }
    
    function pickupItem(obj) {
        if (obj.collected) {
            Utils.showMessage('已经拾取过了', 'info');
            return;
        }
        
        const item = Items.getItem(obj.itemId);
        if (item) {
            const added = Inventory.addItem(obj.itemId);
            if (added) {
                obj.collected = true;
                obj.hidden = true;
                Utils.showMessage(`获得了 ${item.name}！`, 'success');
                saveGameState();
            }
        }
    }
    
    function revealClue(obj) {
        if (obj.revealed && obj.contentShown) {
            Utils.showMessage(obj.content, 'info', 5000);
            return;
        }
        
        obj.revealed = true;
        obj.contentShown = true;
        Utils.showMessage(`发现线索：${obj.content}`, 'success', 5000);
        saveGameState();
    }
    
    function triggerTrap(obj) {
        if (obj.triggered) {
            Utils.showMessage('这个陷阱已经触发过了', 'info');
            return;
        }
        
        obj.triggered = true;
        Timer.subtractTime(obj.timePenalty || 20);
        Utils.showMessage(obj.message || '触发了陷阱！', 'danger');
        saveGameState();
    }
    
    function openPuzzle(obj) {
        if (solvedPuzzles.includes(obj.puzzle)) {
            Utils.showMessage('这个谜题已经解开了', 'info');
            return;
        }
        
        const puzzleConfig = levelData.puzzles[obj.puzzle];
        if (!puzzleConfig) {
            Utils.showMessage('谜题配置错误', 'danger');
            return;
        }
        
        Timer.pause();
        
        const callbacks = {
            onSuccess: () => {
                solvePuzzle(obj.puzzle, puzzleConfig);
                Timer.resume();
            },
            onFail: () => {
                Utils.showMessage('谜题失败，再试一次！', 'warning');
            }
        };
        
        switch (puzzleConfig.type) {
            case 'number':
                Puzzles.openNumberPuzzle(puzzleConfig, callbacks);
                break;
            case 'pattern':
                Puzzles.openPatternPuzzle(puzzleConfig, callbacks);
                break;
            case 'light':
                Puzzles.openLightPuzzle(puzzleConfig, callbacks);
                break;
            case 'drawer':
                Puzzles.openDrawerPuzzle(puzzleConfig, callbacks);
                break;
            default:
                Utils.showMessage('未知谜题类型', 'danger');
                Timer.resume();
        }
    }
    
    function solvePuzzle(puzzleId, puzzleConfig) {
        solvedPuzzles.push(puzzleId);
        Utils.showMessage('谜题解开了！', 'success');
        
        if (puzzleConfig.reward) {
            setTimeout(() => {
                const rewardItem = Items.getItem(puzzleConfig.reward);
                if (rewardItem) {
                    Inventory.addItem(puzzleConfig.reward);
                    Utils.showMessage(`获得奖励：${rewardItem.name}！`, 'success');
                }
            }, 500);
        }
        
        if (puzzleConfig.unlocks) {
            puzzleConfig.unlocks.forEach(objId => {
                const obj = findObjectById(objId);
                if (obj) {
                    obj.locked = false;
                }
            });
        }
        
        levelData.objects.forEach(obj => {
            if (obj.revealCondition === puzzleId + '_solved') {
                obj.revealed = true;
            }
        });
        
        saveGameState();
    }
    
    function handlePuzzleTrigger(obj) {
        if (obj.locked && obj.requiredItem) {
            const selectedItem = Inventory.getSelectedItem();
            if (selectedItem && selectedItem.id === obj.requiredItem) {
                obj.locked = false;
                Inventory.removeItem(obj.requiredItem);
                Utils.showMessage('使用道具成功！机关已解锁！', 'success');
                saveGameState();
            } else {
                const requiredItem = Items.getItem(obj.requiredItem);
                Utils.showMessage(`需要 ${requiredItem ? requiredItem.name : '特定道具'} 才能解锁`, 'warning');
            }
            return;
        }
        
        if (!solvedPuzzles.includes(obj.puzzle)) {
            openPuzzle(obj);
        } else {
            Utils.showMessage('这个机关已经解开了', 'info');
        }
    }
    
    function handleCompartment(obj) {
        if (obj.locked) {
            const selectedItem = Inventory.getSelectedItem();
            if (selectedItem && selectedItem.id === obj.requiredItem) {
                obj.locked = false;
                Inventory.removeItem(obj.requiredItem);
                Utils.showMessage('使用钥匙打开了！', 'success');
                
                if (obj.contains && obj.contains.length > 0) {
                    obj.contains.forEach(itemId => {
                        const item = Items.getItem(itemId);
                        if (item) {
                            Inventory.addItem(itemId);
                            Utils.showMessage(`发现了 ${item.name}！`, 'success');
                        }
                    });
                }
                saveGameState();
            } else {
                const requiredItem = Items.getItem(obj.requiredItem);
                Utils.showMessage(`需要 ${requiredItem ? requiredItem.name : '钥匙'} 才能打开`, 'warning');
                openItemModal(selectedItem);
            }
        } else {
            Utils.showMessage('这个暗格已经被打开过了', 'info');
        }
    }
    
    function handleExit(obj) {
        const canExit = checkCanExit(obj);
        
        if (!canExit) {
            if (obj.requiredItem) {
                const requiredItem = Items.getItem(obj.requiredItem);
                Utils.showMessage(`需要 ${requiredItem ? requiredItem.name : '特殊道具'} 才能打开出口`, 'warning');
            } else if (obj.requiredPuzzles) {
                Utils.showMessage('还有谜题没有解开，无法离开！', 'warning');
            }
            return;
        }
        
        if (obj.requiredItem) {
            const selectedItem = Inventory.getSelectedItem();
            if (selectedItem && selectedItem.id === obj.requiredItem) {
                Inventory.removeItem(obj.requiredItem);
                handleVictory();
            } else {
                Utils.showMessage('选择正确的道具后点击出口！', 'info');
            }
        } else {
            handleVictory();
        }
    }
    
    function checkCanExit(exitObj) {
        if (exitObj.requiredItem) {
            return Inventory.hasItem(exitObj.requiredItem);
        }
        if (exitObj.requiredPuzzles) {
            return exitObj.requiredPuzzles.every(p => solvedPuzzles.includes(p));
        }
        return !exitObj.locked;
    }
    
    function handleVictory() {
        stopGameLoop();
        stopAutoSave();
        Timer.stop();
        
        const elapsedTime = Timer.getElapsedTime();
        const isNewRecord = Storage.setBestRecord(currentLevel, elapsedTime);
        
        const nextLevel = currentLevel + 1;
        if (nextLevel <= Levels.getTotalLevels()) {
            Storage.unlockLevel(nextLevel);
        }
        
        gameState = 'victory';
        
        document.getElementById('victory-level').textContent = levelData.victoryMessage;
        document.getElementById('victory-time').textContent = Utils.formatTime(elapsedTime);
        document.getElementById('new-record').style.display = isNewRecord ? 'block' : 'none';
        
        const nextLevelBtn = document.getElementById('next-level-btn');
        if (currentLevel >= Levels.getTotalLevels()) {
            nextLevelBtn.style.display = 'none';
        } else {
            nextLevelBtn.style.display = 'block';
        }
        
        document.getElementById('victory-screen').style.display = 'flex';
        
        Storage.clearSavedGame();
    }
    
    function handleGameOver() {
        stopGameLoop();
        stopAutoSave();
        gameState = 'gameover';
        document.getElementById('gameover-screen').style.display = 'flex';
        Storage.clearSavedGame();
    }
    
    function handleTimerTick(remainingTime) {
        saveGameState();
    }
    
    function showHint() {
        const unsolvedClues = levelData.objects.filter(
            obj => obj.type === 'clue' && obj.hidden && !obj.revealed
        );
        
        if (unsolvedClues.length > 0) {
            const clue = unsolvedClues[0];
            Utils.showMessage(`💡 提示：${clue.hint}`, 'info', 5000);
        } else {
            const unsolvedPuzzles = Object.keys(levelData.puzzles).filter(
                p => !solvedPuzzles.includes(p)
            );
            
            if (unsolvedPuzzles.length > 0) {
                const puzzleId = unsolvedPuzzles[0];
                const puzzle = levelData.puzzles[puzzleId];
                Utils.showMessage(`💡 提示：${puzzle.hint}`, 'info', 5000);
            } else {
                Utils.showMessage('💡 收集所有道具，找到出口！', 'info');
            }
        }
    }
    
    function findObjectById(objId) {
        for (const obj of levelData.objects) {
            if (obj.id === objId) return obj;
            if (obj.children) {
                for (const child of obj.children) {
                    if (child.id === objId) return child;
                }
            }
        }
        return null;
    }
    
    function openItemModal(item) {
        if (!item) return;
        
        document.getElementById('item-image').textContent = item.icon;
        document.getElementById('item-name').textContent = item.name;
        document.getElementById('item-desc').textContent = item.description;
        
        document.getElementById('item-modal').style.display = 'flex';
    }
    
    function closeItemModal() {
        document.getElementById('item-modal').style.display = 'none';
    }
    
    function useSelectedItem() {
        const item = Inventory.getSelectedItem();
        if (item) {
            closeItemModal();
            Utils.showMessage(`已选择 ${item.name}，点击场景中的物体使用`, 'info');
        }
    }
    
    function updateLevelDisplay() {
        document.getElementById('level-text').textContent = 
            `第${currentLevel}关：${levelData.name}`;
    }
    
    function updateStartScreen() {
        const hasSavedGame = Storage.hasSavedGame();
        document.getElementById('continue-btn').style.display = 
            hasSavedGame ? 'block' : 'none';
        
        const totalLevels = Levels.getTotalLevels();
        const levelButtons = document.getElementById('level-buttons');
        levelButtons.innerHTML = '';
        
        for (let i = 1; i <= totalLevels; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.textContent = i;
            
            const isUnlocked = Storage.isLevelUnlocked(i);
            const bestRecord = Storage.getBestRecord(i);
            
            if (isUnlocked) {
                btn.classList.add('unlocked');
                btn.title = bestRecord 
                    ? `最佳记录: ${Utils.formatTime(bestRecord)}`
                    : '未通关';
                btn.addEventListener('click', () => startNewGame(i));
            } else {
                btn.classList.add('locked');
                btn.innerHTML = '🔒';
                btn.title = '未解锁';
            }
            
            levelButtons.appendChild(btn);
        }
        
        const overallBest = getOverallBestRecord();
        if (overallBest) {
            document.getElementById('best-record-display').innerHTML = 
                `<p>🏆 最快通关记录：${Utils.formatTime(overallBest)}</p>`;
        }
    }
    
    function getOverallBestRecord() {
        const data = Storage.load();
        const records = data.bestRecords;
        const levelCount = Levels.getTotalLevels();
        
        let total = 0;
        for (let i = 1; i <= levelCount; i++) {
            if (!records[i]) return null;
            total += records[i];
        }
        return total;
    }
    
    function hideAllModals() {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('pause-screen').style.display = 'none';
        document.getElementById('puzzle-modal').style.display = 'none';
        document.getElementById('item-modal').style.display = 'none';
        document.getElementById('victory-screen').style.display = 'none';
        document.getElementById('gameover-screen').style.display = 'none';
    }
    
    function saveGameState() {
        const state = {
            level: currentLevel,
            remainingTime: Timer.getRemainingTime(),
            solvedPuzzles: [...solvedPuzzles],
            objects: levelData.objects,
            inventory: Inventory.getState()
        };
        Storage.saveGame(state);
    }
    
    function startAutoSave() {
        stopAutoSave();
        autoSaveInterval = setInterval(() => {
            if (gameState === 'playing') {
                saveGameState();
            }
        }, 5000);
    }
    
    function stopAutoSave() {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
        }
    }
    
    function getState() {
        return {
            currentLevel,
            gameState,
            solvedPuzzles: [...solvedPuzzles]
        };
    }
    
    return {
        init,
        startNewGame,
        continueGame,
        pauseGame,
        resumeGame,
        restartLevel,
        quitToMenu,
        getState
    };
})();
