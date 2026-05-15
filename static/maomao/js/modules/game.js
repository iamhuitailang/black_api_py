import { GAME_STATES, CHARACTERS } from './constants.js';
import { Cat } from './cat.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { Storage } from './storage.js';

export class Game {
    constructor(canvas, uiElements) {
        this.renderer = new Renderer(canvas);
        this.input = new InputHandler();
        this.ui = uiElements;

        this.state = GAME_STATES.MENU;
        this.playerCat = null;
        this.enemyCat = null;
        this.selectedCharacterId = 'ragdoll';

        this.comboDisplay = null;
        this.comboTimer = 0;

        this.lastPlayerHitbox = null;
        this.lastEnemyHitbox = null;

        this.gameLoop = this.gameLoop.bind(this);
        this.setupUIListeners();
    }

    setupUIListeners() {
        this.ui.startBtn.addEventListener('click', () => this.startGame());
        this.ui.characterBtn.addEventListener('click', () => this.showCharacterSelect());
        this.ui.confirmCharacter.addEventListener('click', () => this.confirmCharacterSelect());
        this.ui.backToStart.addEventListener('click', () => this.showMenu());
        this.ui.pauseBtn.addEventListener('click', () => this.pauseGame());
        this.ui.resumeBtn.addEventListener('click', () => this.resumeGame());
        this.ui.restartBtn.addEventListener('click', () => this.restartGame());
        this.ui.exitBtn.addEventListener('click', () => this.exitToMenu());
        this.ui.playAgainBtn.addEventListener('click', () => this.restartGame());
        this.ui.backToMenuBtn.addEventListener('click', () => this.exitToMenu());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state === GAME_STATES.PLAYING) {
                this.pauseGame();
            }
        });
    }

    showMenu() {
        this.state = GAME_STATES.MENU;
        this.ui.startScreen.style.display = 'flex';
        this.ui.characterScreen.style.display = 'none';
        this.ui.gameScreen.style.display = 'none';
        this.ui.pauseMenu.style.display = 'none';
        this.ui.resultScreen.style.display = 'none';
    }

    showCharacterSelect() {
        this.state = GAME_STATES.CHARACTER_SELECT;
        this.ui.startScreen.style.display = 'none';
        this.ui.characterScreen.style.display = 'flex';
        this.renderCharacterList();
    }

    renderCharacterList() {
        this.ui.characterList.innerHTML = '';
        Object.values(CHARACTERS).forEach(char => {
            const card = document.createElement('div');
            card.className = `character-card${char.id === this.selectedCharacterId ? ' selected' : ''}`;
            card.innerHTML = `
                <div class="character-emoji">${char.emoji}</div>
                <h3>${char.name}</h3>
                <div class="character-type">${char.type}</div>
                <div class="character-stats">
                    生命: ${char.maxHealth} | 速度: ${char.speed} | 攻击: ${char.attackPower}
                </div>
                <div class="character-skill">特技: ${char.skills.join(', ')}</div>
            `;
            card.addEventListener('click', () => {
                this.selectedCharacterId = char.id;
                this.renderCharacterList();
            });
            this.ui.characterList.appendChild(card);
        });
    }

    confirmCharacterSelect() {
        this.startGame();
    }

    startGame() {
        this.state = GAME_STATES.PLAYING;
        this.ui.startScreen.style.display = 'none';
        this.ui.characterScreen.style.display = 'none';
        this.ui.gameScreen.style.display = 'block';

        const savedState = Storage.load();

        const playerChar = CHARACTERS[this.selectedCharacterId];
        const enemyCharId = this.getRandomEnemyId(this.selectedCharacterId);
        const enemyChar = CHARACTERS[enemyCharId];

        this.playerCat = new Cat(playerChar, 150, true);
        this.enemyCat = new Cat(enemyChar, 900, false);

        if (savedState && savedState.player && savedState.enemy) {
            this.playerCat.loadState(savedState.player);
            this.enemyCat.loadState(savedState.enemy);
        }

        this.updateUI();
        this.gameLoop();
    }

    getRandomEnemyId(playerId) {
        const ids = Object.keys(CHARACTERS).filter(id => id !== playerId);
        return ids[Math.floor(Math.random() * ids.length)];
    }

    pauseGame() {
        if (this.state !== GAME_STATES.PLAYING) return;
        this.state = GAME_STATES.PAUSED;
        this.ui.pauseMenu.style.display = 'flex';
        this.saveState();
    }

    resumeGame() {
        this.state = GAME_STATES.PLAYING;
        this.ui.pauseMenu.style.display = 'none';
        this.gameLoop();
    }

    restartGame() {
        Storage.clear();
        this.ui.pauseMenu.style.display = 'none';
        this.ui.resultScreen.style.display = 'none';
        this.startGame();
    }

    exitToMenu() {
        this.state = GAME_STATES.MENU;
        this.ui.pauseMenu.style.display = 'none';
        this.ui.resultScreen.style.display = 'none';
        this.ui.gameScreen.style.display = 'none';
        this.showMenu();
    }

    showResult(playerWon) {
        this.state = GAME_STATES.RESULT;
        this.ui.resultScreen.style.display = 'flex';
        this.ui.resultTitle.textContent = playerWon ? '🎉 胜利！' : '😿 失败...';
        this.ui.resultMessage.textContent = playerWon ? '你成为了喵界霸主！' : '再接再厉，下次一定能赢！';
        Storage.clear();
    }

    gameLoop() {
        if (this.state !== GAME_STATES.PLAYING) return;

        this.update();
        this.render();
        this.saveState();

        requestAnimationFrame(this.gameLoop);
    }

    update() {
        this.playerCat.update(this.input.keys, this.enemyCat);
        this.enemyCat.update({}, this.playerCat);

        const attackKey = this.input.getAttackKey();
        if (attackKey) {
            this.playerCat.attack(attackKey);
        }

        if (this.input.checkSpecialMove()) {
            if (this.playerCat.attack('special')) {
                this.showCombo('必杀技！');
                this.renderer.addSpecialEffect(this.playerCat.x, this.playerCat.y - 50);
            }
        }

        this.checkCollisions();
        this.updateUI();

        if (this.playerCat.health <= 0) {
            this.showResult(false);
        } else if (this.enemyCat.health <= 0) {
            this.showResult(true);
        }

        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) {
                this.ui.comboDisplay.classList.remove('show');
            }
        }
    }

    checkCollisions() {
        const playerHitbox = this.playerCat.getAttackHitbox();
        const enemyHitbox = this.enemyCat.getAttackHitbox();

        if (playerHitbox && this.hitboxChanged(playerHitbox, this.lastPlayerHitbox)) {
            if (this.checkHit(playerHitbox, this.enemyCat)) {
                const damage = this.enemyCat.takeDamage(this.playerCat.currentAttack, this.playerCat.attackPower);
                this.renderer.addDamageEffect(this.enemyCat.x + 60, this.enemyCat.y - 50, damage);
                this.showCombo(`-${damage}`);
            }
        }

        if (enemyHitbox && this.hitboxChanged(enemyHitbox, this.lastEnemyHitbox)) {
            if (this.checkHit(enemyHitbox, this.playerCat)) {
                const damage = this.playerCat.takeDamage(this.enemyCat.currentAttack, this.enemyCat.attackPower);
                this.renderer.addDamageEffect(this.playerCat.x + 60, this.playerCat.y - 50, damage);
            }
        }

        this.lastPlayerHitbox = playerHitbox ? { ...playerHitbox } : null;
        this.lastEnemyHitbox = enemyHitbox ? { ...enemyHitbox } : null;
    }

    hitboxChanged(hitbox, lastHitbox) {
        if (!hitbox || !lastHitbox) return true;
        return hitbox.x !== lastHitbox.x ||
               hitbox.y !== lastHitbox.y ||
               hitbox.width !== lastHitbox.width ||
               hitbox.height !== lastHitbox.height;
    }

    checkHit(hitbox, target) {
        const targetBox = {
            x: target.x,
            y: target.y - target.height,
            width: target.width,
            height: target.height
        };

        return hitbox.x < targetBox.x + targetBox.width &&
               hitbox.x + hitbox.width > targetBox.x &&
               hitbox.y < targetBox.y + targetBox.height &&
               hitbox.y + hitbox.height > targetBox.y;
    }

    showCombo(text) {
        this.ui.comboDisplay.textContent = text;
        this.ui.comboDisplay.classList.remove('show');
        void this.ui.comboDisplay.offsetWidth;
        this.ui.comboDisplay.classList.add('show');
        this.comboTimer = 30;
    }

    updateUI() {
        this.ui.player1Name.textContent = this.playerCat.character.name;
        this.ui.player2Name.textContent = this.enemyCat.character.name;

        const playerHealthPercent = (this.playerCat.health / this.playerCat.maxHealth) * 100;
        const enemyHealthPercent = (this.enemyCat.health / this.enemyCat.maxHealth) * 100;

        this.ui.player1Health.style.width = `${playerHealthPercent}%`;
        this.ui.player2Health.style.width = `${enemyHealthPercent}%`;
    }

    render() {
        this.renderer.clear();
        this.renderer.drawBackground();
        this.renderer.drawCat(this.playerCat);
        this.renderer.drawCat(this.enemyCat);
        this.renderer.drawParticles();
    }

    saveState() {
        const state = {
            player: this.playerCat.getState(),
            enemy: this.enemyCat.getState()
        };
        Storage.save(state);
    }
}
