import { Game } from './modules/game.js';
import { InputController } from './modules/input.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        const input = new InputController();
        const game = new Game(canvas, input);

        const mainMenu = document.getElementById('main-menu');
        const characterSelect = document.getElementById('character-select');
        const gameHud = document.getElementById('game-hud');
        const pauseMenu = document.getElementById('pause-menu');
        const victoryScreen = document.getElementById('victory-screen');
        const defeatScreen = document.getElementById('defeat-screen');
        const gameCompleteScreen = document.getElementById('game-complete');

        const startBtn = document.getElementById('startBtn');
        const continueBtn = document.getElementById('continueBtn');
        const selectCharBtn = document.getElementById('selectCharBtn');
        const backToMenuBtn = document.getElementById('backToMenuBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const resumeBtn = document.getElementById('resumeBtn');
        const restartBtn = document.getElementById('restartBtn');
        const quitBtn = document.getElementById('quitBtn');
        const nextLevelBtn = document.getElementById('nextLevelBtn');
        const victoryQuitBtn = document.getElementById('victoryQuitBtn');
        const retryBtn = document.getElementById('retryBtn');
        const defeatQuitBtn = document.getElementById('defeatQuitBtn');
        const playAgainBtn = document.getElementById('playAgainBtn');

        const playerHealthBar = document.getElementById('playerHealth');
        const enemyHealthBar = document.getElementById('enemyHealth');
        const playerEnergyBar = document.getElementById('playerEnergy');
        const enemyEnergyBar = document.getElementById('enemyEnergy');
        const levelInfo = document.getElementById('levelInfo');
        const victoryMessage = document.getElementById('victoryMessage');
        const characterList = document.getElementById('character-list');

        let selectedCharId = game.getSelectedCharacter();

        function hideAllScreens() {
            mainMenu.style.display = 'none';
            characterSelect.style.display = 'none';
            gameHud.style.display = 'none';
            pauseMenu.style.display = 'none';
            victoryScreen.style.display = 'none';
            defeatScreen.style.display = 'none';
            gameCompleteScreen.style.display = 'none';
        }

        function showMainMenu() {
            hideAllScreens();
            mainMenu.style.display = 'flex';
            
            if (game.hasSavedGame()) {
                continueBtn.style.display = 'block';
            } else {
                continueBtn.style.display = 'none';
            }
        }

        function showCharacterSelect() {
            hideAllScreens();
            characterSelect.style.display = 'flex';
            renderCharacters();
        }

        function showGameHud() {
            hideAllScreens();
            gameHud.style.display = 'flex';
        }

        function showPauseMenu() {
            pauseMenu.style.display = 'flex';
        }

        function hidePauseMenu() {
            pauseMenu.style.display = 'none';
        }

        function showVictoryScreen(level) {
            hideAllScreens();
            victoryScreen.style.display = 'flex';
            victoryMessage.textContent = `恭喜通过第 ${level} 关!`;
        }

        function showDefeatScreen() {
            hideAllScreens();
            defeatScreen.style.display = 'flex';
        }

        function showGameCompleteScreen() {
            hideAllScreens();
            gameCompleteScreen.style.display = 'flex';
        }

        function renderCharacters() {
            const characters = game.getCharacters();
            const maxUnlocked = game.getMaxUnlockedLevel();
            
            characterList.innerHTML = '';
            
            characters.forEach(char => {
                const isUnlocked = maxUnlocked >= char.unlockLevel;
                const isSelected = char.id === selectedCharId;
                
                const card = document.createElement('div');
                card.className = `character-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
                card.innerHTML = `
                    <div class="character-icon">${char.icon}</div>
                    <div class="character-name">${char.name}</div>
                    <div class="character-desc">${isUnlocked ? char.desc : `第${char.unlockLevel}关解锁`}</div>
                `;
                
                if (isUnlocked) {
                    card.addEventListener('click', () => {
                        selectedCharId = char.id;
                        game.selectCharacter(char.id);
                        renderCharacters();
                    });
                }
                
                characterList.appendChild(card);
            });
        }

        function updateUI() {
            if (game.state === 'playing' && !game.isPaused) {
                playerHealthBar.style.width = `${game.getPlayerHealth()}%`;
                enemyHealthBar.style.width = `${game.getEnemyHealth()}%`;
                playerEnergyBar.style.width = `${game.getPlayerEnergy()}%`;
                enemyEnergyBar.style.width = `${game.getEnemyEnergy()}%`;
                levelInfo.textContent = `第 ${game.getCurrentLevel()} 关`;
            }
            
            requestAnimationFrame(updateUI);
        }

        startBtn.addEventListener('click', () => {
            game.init(false);
            showGameHud();
            game.start();
        });

        continueBtn.addEventListener('click', () => {
            game.init(true);
            showGameHud();
            game.start();
        });

        selectCharBtn.addEventListener('click', showCharacterSelect);

        backToMenuBtn.addEventListener('click', showMainMenu);

        pauseBtn.addEventListener('click', () => {
            game.pause();
            showPauseMenu();
        });

        resumeBtn.addEventListener('click', () => {
            game.resume();
            hidePauseMenu();
        });

        restartBtn.addEventListener('click', () => {
            game.restart();
            hidePauseMenu();
            showGameHud();
        });

        quitBtn.addEventListener('click', () => {
            game.quit();
            showMainMenu();
        });

        nextLevelBtn.addEventListener('click', () => {
            game.nextLevel();
            showGameHud();
        });

        victoryQuitBtn.addEventListener('click', showMainMenu);

        retryBtn.addEventListener('click', () => {
            game.restart();
            showGameHud();
        });

        defeatQuitBtn.addEventListener('click', showMainMenu);

        playAgainBtn.addEventListener('click', () => {
            game.currentLevel = 1;
            game.init(false);
            showGameHud();
            game.start();
        });

        game.onLevelComplete = (level) => {
            showVictoryScreen(level);
        };

        game.onDefeat = () => {
            showDefeatScreen();
        };

        game.onGameComplete = () => {
            showGameCompleteScreen();
        };

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && game.state === 'playing') {
                if (game.isPaused) {
                    game.resume();
                    hidePauseMenu();
                } else {
                    game.pause();
                    showPauseMenu();
                }
            }
        });

        showMainMenu();
        updateUI();
        
        console.log('Game initialized successfully!');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});
