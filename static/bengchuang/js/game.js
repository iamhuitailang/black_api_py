const Game = (function() {
    let gameState = GAME_STATES.CHARACTER_SELECT;
    let selectedCharacter = null;
    let player1 = null;
    let player2 = null;
    let aiController = null;
    let lastTime = 0;
    let animationId = null;
    let winner = null;

    const keys = {
        left: false,
        right: false,
        up: false,
        down: false,
        z: false,
        x: false,
        c: false
    };

    function init() {
        setupEventListeners();
        loadSavedState();
    }

    function setupEventListeners() {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    }

    function handleKeyDown(e) {
        switch (e.key) {
            case 'ArrowLeft':
                keys.left = true;
                break;
            case 'ArrowRight':
                keys.right = true;
                break;
            case 'ArrowUp':
                keys.up = true;
                break;
            case 'ArrowDown':
                keys.down = true;
                break;
            case 'z':
            case 'Z':
                keys.z = true;
                break;
            case 'x':
            case 'X':
                keys.x = true;
                break;
            case 'c':
            case 'C':
                keys.c = true;
                break;
        }
    }

    function handleKeyUp(e) {
        switch (e.key) {
            case 'ArrowLeft':
                keys.left = false;
                break;
            case 'ArrowRight':
                keys.right = false;
                break;
            case 'ArrowUp':
                keys.up = false;
                break;
            case 'ArrowDown':
                keys.down = false;
                break;
            case 'z':
            case 'Z':
                keys.z = false;
                break;
            case 'x':
            case 'X':
                keys.x = false;
                break;
            case 'c':
            case 'C':
                keys.c = false;
                break;
        }
    }

    function loadSavedState() {
        const savedState = Storage.load();
        
        if (savedState.gameState === GAME_STATES.PLAYING && savedState.player1State && savedState.player2State) {
            selectedCharacter = savedState.selectedCharacter;
            restoreGameState(savedState);
        } else if (savedState.selectedCharacter) {
            selectedCharacter = savedState.selectedCharacter;
        }
    }

    function restoreGameState(savedState) {
        player1 = Character.deserialize(savedState.player1State, true);
        player2 = Character.deserialize(savedState.player2State, false);
        
        if (savedState.aiState) {
            aiController = AI.AIController.deserialize(savedState.aiState, player2);
        } else {
            aiController = new AI.AIController(player2);
        }

        gameState = GAME_STATES.PLAYING;
        winner = savedState.winner;
        lastTime = performance.now();
        
        if (winner) {
            gameState = GAME_STATES.GAME_OVER;
        }
    }

    function selectCharacter(charType) {
        selectedCharacter = charType;
        Storage.saveGameProgress(GAME_STATES.CHARACTER_SELECT, charType, null, null, null, null);
    }

    function getRandomAICharacter() {
        const charKeys = Object.keys(CHARACTERS);
        const availableChars = charKeys.filter(c => c !== selectedCharacter);
        return availableChars[Math.floor(Math.random() * availableChars.length)];
    }

    function startGame() {
        if (!selectedCharacter) return;

        const aiChar = getRandomAICharacter();
        
        player1 = new Character(selectedCharacter, true);
        player2 = new Character(aiChar, false);
        
        aiController = new AI.AIController(player2);
        gameState = GAME_STATES.PLAYING;
        winner = null;
        lastTime = performance.now();

        Storage.saveGameProgress(gameState, selectedCharacter, aiChar, player1, player2, aiController);

        gameLoop();
    }

    function gameLoop(currentTime = performance.now()) {
        if (gameState !== GAME_STATES.PLAYING) {
            return;
        }

        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        update(deltaTime);
        render(deltaTime);
        savePeriodically();

        animationId = requestAnimationFrame(gameLoop);
    }

    function update(deltaTime) {
        handlePlayerInput();
        aiController.update(deltaTime, player1);

        player1.updateTimers(deltaTime);
        player2.updateTimers(deltaTime);

        Physics.updatePhysics(player1);
        Physics.updatePhysics(player2);

        if (Physics.checkCharacterCollision(player1, player2)) {
            Physics.resolveCharacterCollision(player1, player2);
        }

        const combatResult = Combat.updateCombat(player1, player2, deltaTime);
        
        if (combatResult.winner) {
            endGame(combatResult.winner);
        }
    }

    let jumpKeyPressed = false;
    let attackKeyPressed = { z: false, x: false, c: false };

    function handlePlayerInput() {
        if (!player1) return;

        if (keys.left) {
            player1.moveLeft();
        }
        if (keys.right) {
            player1.moveRight();
        }

        if (keys.up) {
            player1.setJumpHeight(1.3);
        } else if (keys.down) {
            player1.setJumpHeight(0.8);
        } else {
            player1.setJumpHeight(1);
        }

        const jumpKeyDown = keys.up || keys.down;
        if (jumpKeyDown && !jumpKeyPressed) {
            player1.jump(keys.up);
        }
        jumpKeyPressed = jumpKeyDown;

        if (keys.z && !attackKeyPressed.z) {
            player1.attack('charge');
        }
        attackKeyPressed.z = keys.z;
        
        if (keys.x && !attackKeyPressed.x) {
            player1.attack('kick');
        }
        attackKeyPressed.x = keys.x;
        
        if (keys.c && !attackKeyPressed.c) {
            player1.attack('special');
        }
        attackKeyPressed.c = keys.c;
    }

    function render(deltaTime) {
        Renderer.render(player1, player2, gameState, winner);
        updateUI();
    }

    function updateUI() {
        if (!player1 || !player2) return;

        const p1StaminaPercent = (player1.stamina / player1.maxStamina) * 100;
        const p2StaminaPercent = (player2.stamina / player2.maxStamina) * 100;

        const p1StaminaBar = document.getElementById('player1Stamina');
        const p2StaminaBar = document.getElementById('player2Stamina');
        
        if (p1StaminaBar) {
            p1StaminaBar.style.width = p1StaminaPercent + '%';
            p1StaminaBar.style.backgroundColor = getStaminaColor(p1StaminaPercent);
        }
        if (p2StaminaBar) {
            p2StaminaBar.style.width = p2StaminaPercent + '%';
            p2StaminaBar.style.backgroundColor = getStaminaColor(p2StaminaPercent);
        }

        const p1Status = document.getElementById('player1Status');
        const p2Status = document.getElementById('player2Status');
        
        if (p1Status) {
            p1Status.textContent = player1.isOut ? '出局!' : '在场';
            p1Status.className = 'hud-status' + (player1.isOut ? ' out' : '');
        }
        if (p2Status) {
            p2Status.textContent = player2.isOut ? '出局!' : '在场';
            p2Status.className = 'hud-status' + (player2.isOut ? ' out' : '');
        }

        const p1Name = document.getElementById('player1Name');
        const p2Name = document.getElementById('player2Name');
        
        if (p1Name) {
            p1Name.textContent = player1.emoji + ' ' + player1.name;
        }
        if (p2Name) {
            p2Name.textContent = player2.emoji + ' ' + player2.name;
        }
    }

    function getStaminaColor(percent) {
        if (percent > 60) return '#4CAF50';
        if (percent > 30) return '#FFC107';
        return '#F44336';
    }

    let saveTimer = 0;
    function savePeriodically() {
        saveTimer += 16;
        if (saveTimer >= 2000) {
            saveTimer = 0;
            if (gameState === GAME_STATES.PLAYING) {
                Storage.saveGameProgress(
                    gameState,
                    selectedCharacter,
                    player2 ? player2.charType : null,
                    player1,
                    player2,
                    aiController,
                    winner
                );
            }
        }
    }

    function endGame(winnerType) {
        winner = winnerType;
        gameState = GAME_STATES.GAME_OVER;
        
        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        Storage.saveGameProgress(
            gameState,
            selectedCharacter,
            player2 ? player2.charType : null,
            player1,
            player2,
            aiController,
            winner
        );
    }

    function restartGame() {
        startGame();
    }

    function getState() {
        return {
            gameState,
            selectedCharacter,
            player1,
            player2,
            winner
        };
    }

    function getSelectedCharacter() {
        return selectedCharacter;
    }

    return {
        init,
        selectCharacter,
        startGame,
        restartGame,
        getState,
        getSelectedCharacter,
        gameLoop
    };
})();