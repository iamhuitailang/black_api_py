import { GAME_CONFIG, GAME_STATE, INPUT_KEYS, SKILL_DATA, CHARACTER_DATA } from './config.js';
import { Character, CharacterState } from './character.js';
import { AIController } from './ai.js';
import { Input } from './input.js';
import { Storage } from './storage.js';

export class Game {
    constructor(canvas, ui, renderer) {
        this.canvas = canvas;
        this.ui = ui;
        this.renderer = renderer;
        
        this.state = GAME_STATE.MENU;
        this.selectedCharacter = 'qinglong';
        
        this.player = null;
        this.enemy = null;
        this.ai = null;
        
        this.round = 1;
        this.playerWins = 0;
        this.enemyWins = 0;
        
        this.lastTime = 0;
        this.deltaTime = 0;
        this.animationId = null;
        this.saveTimer = 0;
        
        this.playerCharacter = 'qinglong';
        this.enemyCharacter = 'zhuque';
    }

    init() {
        Input.init();
        this.ui.updateCharacterSelection(this.selectedCharacter);
        
        const hasSave = Storage.hasSave();
        this.ui.showStartScreen(hasSave);
        
        if (hasSave) {
            const saveData = Storage.load();
            if (saveData) {
                this.playerCharacter = saveData.playerCharacter;
                this.enemyCharacter = saveData.enemyCharacter;
                this.selectedCharacter = saveData.playerCharacter;
                this.ui.updateCharacterSelection(saveData.playerCharacter);
            }
        }
        
        this.lastTime = performance.now();
        this.gameLoop();
    }

    selectCharacter(charId) {
        this.selectedCharacter = charId;
        this.playerCharacter = charId;
        
        const enemies = ['qinglong', 'zhuque', 'xuanwu'].filter(c => c !== charId);
        this.enemyCharacter = enemies[Math.floor(Math.random() * enemies.length)];
    }

    startGame() {
        this.round = 1;
        this.playerWins = 0;
        this.enemyWins = 0;
        this.createCharacters();
        this.startMatch();
    }

    continueGame() {
        const saveData = Storage.load();
        if (!saveData) {
            this.startGame();
            return;
        }
        
        this.playerCharacter = saveData.playerCharacter;
        this.enemyCharacter = saveData.enemyCharacter;
        this.round = saveData.round;
        this.playerWins = saveData.playerWins;
        this.enemyWins = saveData.enemyWins;
        
        this.createCharacters();
        
        this.player.hp = saveData.playerHp;
        this.enemy.hp = saveData.enemyHp;
        this.player.energy = saveData.playerEnergy;
        this.enemy.energy = saveData.enemyEnergy;
        this.player.x = saveData.playerX;
        this.player.y = saveData.playerY;
        this.enemy.x = saveData.enemyX;
        this.enemy.y = saveData.enemyY;
        this.player.facing = saveData.playerFacing;
        this.enemy.facing = saveData.enemyFacing;
        
        this.startMatch(true);
    }

    createCharacters() {
        this.player = new Character(this.playerCharacter, true, 200);
        this.enemy = new Character(this.enemyCharacter, false, 760);
        this.ai = new AIController(this.enemy, this.player);
    }

    startMatch(isContinue = false) {
        this.state = GAME_STATE.PLAYING;
        this.ui.hideAllScreens();
        this.ui.showHUD();
        this.ui.updateHUD(this.player, this.enemy, this.round, this.playerWins, this.enemyWins);
        
        if (!isContinue) {
            this.player.reset(200);
            this.enemy.reset(760);
            this.ai.reset();
        }
        
        this.lastTime = performance.now();
    }

    gameLoop() {
        const now = performance.now();
        this.deltaTime = Math.min(now - this.lastTime, 50);
        this.lastTime = now;
        
        if (this.state === GAME_STATE.PLAYING) {
            this.update(this.deltaTime);
        } else {
            this.handleGlobalInput();
        }
        
        Input.clearPressed();
        
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        this.handleInput();
        
        if (this.ai) {
            this.ai.update(deltaTime);
        }
        
        if (this.player) {
            this.player.update(deltaTime, this.enemy);
            this.player.updateEffects(deltaTime);
        }
        
        if (this.enemy) {
            this.enemy.update(deltaTime, this.player);
            this.enemy.updateEffects(deltaTime);
        }
        
        this.checkRoundEnd();
        
        this.ui.updateHUD(this.player, this.enemy, this.round, this.playerWins, this.enemyWins);
        
        this.saveTimer += deltaTime;
        if (this.saveTimer >= 1000) {
            this.saveTimer = 0;
            this.saveGame();
        }
    }

    handleGlobalInput() {
        if (Input.wasPressed(INPUT_KEYS.PAUSE)) {
            if (this.state === GAME_STATE.PAUSED) {
                this.resumeGame();
            }
        }
    }

    handleInput() {
        if (!this.player || this.player.state === CharacterState.DEAD) return;
        
        if (Input.wasPressed(INPUT_KEYS.PAUSE)) {
            this.togglePause();
            return;
        }
        
        if (this.state !== GAME_STATE.PLAYING) return;
        
        const dir = Input.getDirection();
        let moveDir = 0;
        if (dir.left) moveDir -= 1;
        if (dir.right) moveDir += 1;
        
        if (moveDir !== 0) {
            this.player.move(moveDir);
        }
        
        if (Input.wasPressed(INPUT_KEYS.UP)) {
            this.player.jump();
        }
        
        this.player.crouch(dir.down);
        
        if (Input.wasPressed(INPUT_KEYS.LIGHT)) {
            let usedSkill = false;
            
            if (this.player.type === 'water') {
                if (Input.checkCommand(['down', 'right', 'light'])) {
                    this.player.useSkill('waterWave');
                    Input.clearBuffer();
                    usedSkill = true;
                } else if (Input.checkCommand(['right', 'down', 'light'])) {
                    this.player.useSkill('dragonRush');
                    Input.clearBuffer();
                    usedSkill = true;
                }
            }
            
            if (!usedSkill) {
                if (!this.player.isGrounded) {
                    this.player.attack('airLight');
                } else {
                    this.player.attack('light');
                }
            }
        }
        
        if (Input.wasPressed(INPUT_KEYS.HEAVY)) {
            let usedSkill = false;
            
            if (this.player.type === 'fire') {
                if (Input.checkCommand(['down', 'left', 'heavy'])) {
                    this.player.useSkill('flameSpin');
                    Input.clearBuffer();
                    usedSkill = true;
                }
            } else if (this.player.type === 'earth') {
                if (Input.checkCommand(['down', 'heavy'])) {
                    this.player.useSkill('stoneShield');
                    Input.clearBuffer();
                    usedSkill = true;
                } else if (Input.checkCommand(['down', 'up', 'heavy'])) {
                    this.player.useSkill('quake');
                    Input.clearBuffer();
                    usedSkill = true;
                }
            }
            
            if (!usedSkill) {
                if (!this.player.isGrounded) {
                    this.player.attack('airHeavy');
                } else {
                    this.player.attack('heavy');
                }
            }
        }
        
        if (Input.wasPressed(INPUT_KEYS.ULTIMATE)) {
            if (this.player.energy >= this.player.maxEnergy) {
                let ultimateSkill = null;
                if (this.player.type === 'water') {
                    ultimateSkill = 'dragonRush';
                } else if (this.player.type === 'fire') {
                    ultimateSkill = 'flameSpin';
                } else if (this.player.type === 'earth') {
                    ultimateSkill = 'quake';
                }
                
                if (ultimateSkill) {
                    this.player.useUltimate(ultimateSkill);
                }
            }
        }
    }

    checkRoundEnd() {
        if (!this.player || !this.enemy) return;
        
        if (this.player.hp <= 0 || this.enemy.hp <= 0) {
            const playerWon = this.enemy.hp <= 0;
            
            if (playerWon) {
                this.playerWins++;
            } else {
                this.enemyWins++;
            }
            
            this.renderer.addScreenShake(300, 10);
            
            if (this.playerWins >= GAME_CONFIG.ROUND_MAX || this.enemyWins >= GAME_CONFIG.ROUND_MAX) {
                this.endGame(this.playerWins >= GAME_CONFIG.ROUND_MAX);
            } else {
                this.state = GAME_STATE.ROUND_END;
                setTimeout(() => {
                    this.nextRound();
                }, 2000);
            }
        }
    }

    nextRound() {
        this.round++;
        this.player.reset(200);
        this.enemy.reset(760);
        this.ai.reset();
        this.state = GAME_STATE.PLAYING;
        this.ui.updateRound(this.round, this.playerWins, this.enemyWins);
    }

    endGame(playerWon) {
        this.state = GAME_STATE.GAME_OVER;
        Storage.clear();
        setTimeout(() => {
            this.ui.showResultScreen(playerWon);
            this.ui.hideHUD();
        }, 1000);
    }

    render() {
        this.renderer.clear();
        this.renderer.render(this);
    }

    togglePause() {
        if (this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.PAUSED;
            this.ui.showPauseScreen();
        } else if (this.state === GAME_STATE.PAUSED) {
            this.resumeGame();
        }
    }

    resumeGame() {
        this.state = GAME_STATE.PLAYING;
        this.ui.hidePauseScreen();
        this.lastTime = performance.now();
    }

    restartGame() {
        Storage.clear();
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.startGame();
    }

    quitToMenu() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.state = GAME_STATE.MENU;
        this.ui.showStartScreen(Storage.hasSave());
    }

    saveGame() {
        if (this.state !== GAME_STATE.PLAYING) return;
        Storage.save(this);
    }
}
