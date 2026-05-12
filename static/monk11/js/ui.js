const UI = {
    screens: {},
    currentScreen: null,
    selectedMage: null,
    onSelectMage: null,
    onUnlockMage: null,
    onCastSpell: null,
    onPause: null,
    onResume: null,
    onRestartBattle: null,
    onQuitBattle: null,
    onContinue: null,
    onRetry: null,

    init: function() {
        this.screens = {
            mainMenu: document.getElementById('main-menu'),
            characterSelect: document.getElementById('character-select'),
            battle: document.getElementById('battle-screen'),
            victory: document.getElementById('victory-screen'),
            defeat: document.getElementById('defeat-screen'),
            levelUp: document.getElementById('levelup-screen')
        };

        this.bindStartButton();
        this.setupOtherEventListeners();
    },

    bindStartButton: function() {
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.onclick = () => {
                if (Game && Game.showCharacterSelect) {
                    Game.showCharacterSelect();
                } else {
                    this.showScreen('characterSelect');
                }
            };
        }
    },

    setupOtherEventListeners: function() {
        const backBtn = document.getElementById('back-to-menu-btn');
        if (backBtn) {
            backBtn.onclick = () => this.showScreen('mainMenu');
        }

        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.onclick = () => this.togglePauseMenu();
        }

        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) {
            resumeBtn.onclick = () => this.togglePauseMenu();
        }

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.onclick = () => this.onRestartBattle && this.onRestartBattle();
        }

        const quitBtn = document.getElementById('quit-btn');
        if (quitBtn) {
            quitBtn.onclick = () => this.onQuitBattle && this.onQuitBattle();
        }

        const continueBtn = document.getElementById('continue-btn');
        if (continueBtn) {
            continueBtn.onclick = () => this.onContinue && this.onContinue();
        }

        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.onclick = () => this.onRetry && this.onRetry();
        }

        const toMenuBtn = document.getElementById('to-menu-btn');
        if (toMenuBtn) {
            toMenuBtn.onclick = () => this.showScreen('mainMenu');
        }

        const levelupOkBtn = document.getElementById('levelup-ok-btn');
        if (levelupOkBtn) {
            levelupOkBtn.onclick = () => this.hideScreen('levelUp');
        }
    },

    showScreen: function(screenName) {
        for (const key in this.screens) {
            this.screens[key].classList.add('hidden');
        }
        this.screens[screenName].classList.remove('hidden');
        this.currentScreen = screenName;
        if (Storage && Storage.saveScreen) {
            Storage.saveScreen(screenName);
        }
    },

    hideScreen: function(screenName) {
        this.screens[screenName].classList.add('hidden');
    },

    renderCharacterSelect: function(mages, unlockedMages, playerGold) {
        const container = document.getElementById('character-list');
        const infoPanel = document.getElementById('character-info');
        
        if (!container) {
            console.error('找不到 character-list 元素');
            return;
        }

        container.innerHTML = '';
        this.selectedMage = null;
        if (infoPanel) infoPanel.classList.add('hidden');

        mages.forEach((mage) => {
            const isUnlocked = unlockedMages.includes(mage.id);
            const canUnlock = !isUnlocked && playerGold >= mage.cost;

            const card = document.createElement('div');
            card.className = `character-card ${isUnlocked ? '' : 'locked'}`;
            card.innerHTML = `
                <div class="element-icon">${GameData.elementIcons[mage.element]}</div>
                <div class="name">${mage.name}</div>
                <div class="stats-mini">
                    <div>生命: ${mage.maxHealth}</div>
                    <div>魔力: ${mage.maxMana}</div>
                    ${!isUnlocked ? `<div style="color: #ffd700;">💰 ${mage.cost} 金币</div>` : ''}
                </div>
            `;

            if (isUnlocked) {
                card.onclick = () => {
                    document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    this.selectedMage = mage;
                    this.showCharacterInfo(mage);
                };
            } else if (canUnlock) {
                card.onclick = () => {
                    this.onUnlockMage && this.onUnlockMage(mage.id, mage.cost);
                };
            }

            container.appendChild(card);
        });
    },

    showCharacterInfo: function(mage) {
        const infoPanel = document.getElementById('character-info');
        const content = infoPanel.querySelector('.info-content');

        if (!infoPanel || !content) return;

        content.innerHTML = `
            <h3>${GameData.elementIcons[mage.element]} ${mage.name}</h3>
            <p>${mage.description}</p>
            <div style="margin: 15px 0;">
                <strong>法术:</strong>
                <ul style="text-align: left; margin: 10px 0 0 20px;">
                    ${mage.spells.map(s => {
                        const spell = GameData.spells[s];
                        return spell ? `<li>${spell.name} - ${spell.description}</li>` : '';
                    }).join('')}
                </ul>
            </div>
        `;

        infoPanel.classList.remove('hidden');

        const confirmBtn = document.getElementById('confirm-char-btn');
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                if (this.selectedMage && this.onSelectMage) {
                    this.onSelectMage(this.selectedMage);
                }
            };
        }
    },

    updateBattleUI: function(battleState) {
        const { player, enemy, isPlayerTurn, battleLog } = battleState;

        const playerHealthBar = document.getElementById('player-health-bar');
        const playerHealthText = document.getElementById('player-health-text');
        const playerManaBar = document.getElementById('player-mana-bar');
        const playerManaText = document.getElementById('player-mana-text');
        const enemyHealthBar = document.getElementById('enemy-health-bar');
        const enemyHealthText = document.getElementById('enemy-health-text');

        if (playerHealthBar) playerHealthBar.style.width = `${(player.currentHealth / player.maxHealth) * 100}%`;
        if (playerHealthText) playerHealthText.textContent = `${Math.floor(player.currentHealth)}/${player.maxHealth}`;
        if (playerManaBar) playerManaBar.style.width = `${(player.currentMana / player.maxMana) * 100}%`;
        if (playerManaText) playerManaText.textContent = `${Math.floor(player.currentMana)}/${player.maxMana}`;

        if (enemyHealthBar) enemyHealthBar.style.width = `${(enemy.currentHealth / enemy.maxHealth) * 100}%`;
        if (enemyHealthText) enemyHealthText.textContent = `${Math.floor(enemy.currentHealth)}/${enemy.maxHealth}`;

        const playerDisplay = document.getElementById('player-display');
        const enemyDisplay = document.getElementById('enemy-display');
        if (playerDisplay) playerDisplay.innerHTML = GameData.elementIcons[player.element];
        if (enemyDisplay) enemyDisplay.innerHTML = GameData.elementIcons[enemy.element];

        const logContent = document.querySelector('#battle-log .log-content');
        if (logContent) {
            logContent.innerHTML = battleLog.map(log => `<p>${log}</p>`).join('');
            logContent.scrollTop = logContent.scrollHeight;
        }

        this.renderSpells(player, isPlayerTurn);
    },

    renderSpells: function(player, isPlayerTurn) {
        const spellsList = document.getElementById('spells-list');
        if (!spellsList) return;
        
        spellsList.innerHTML = '';

        const attackCard = document.createElement('div');
        attackCard.className = `spell-card ${isPlayerTurn ? '' : 'disabled'}`;
        attackCard.style.cursor = isPlayerTurn ? 'pointer' : 'not-allowed';
        attackCard.innerHTML = `
            <div class="spell-name">⚔️ 法杖攻击</div>
            <div class="spell-cost">无消耗</div>
            <div class="spell-effect">普通攻击 8-12 伤害</div>
        `;

        attackCard.addEventListener('click', () => {
            if (isPlayerTurn) {
                if (this.onBasicAttack) {
                    this.onBasicAttack();
                } else if (BattleSystem.onBasicAttack) {
                    BattleSystem.onBasicAttack();
                }
            }
        });

        spellsList.appendChild(attackCard);

        player.spells.forEach(spellId => {
            const spell = GameData.spells[spellId];
            if (!spell) return;

            const canCast = isPlayerTurn && player.currentMana >= spell.cost;

            const spellCard = document.createElement('div');
            spellCard.className = `spell-card ${canCast ? '' : 'disabled'}`;
            spellCard.innerHTML = `
                <div class="spell-name">${GameData.elementIcons[spell.element]} ${spell.name}</div>
                <div class="spell-cost">魔力: ${spell.cost}</div>
                <div class="spell-effect">${spell.description}</div>
            `;

            if (canCast) {
                spellCard.onclick = () => {
                    this.onCastSpell && this.onCastSpell(spellId);
                };
            }

            spellsList.appendChild(spellCard);
        });
    },

    togglePauseMenu: function() {
        const pauseMenu = document.getElementById('pause-menu');
        if (!pauseMenu) return;
        
        const isHidden = pauseMenu.classList.contains('hidden');
        
        if (isHidden) {
            pauseMenu.classList.remove('hidden');
            this.onPause && this.onPause();
        } else {
            pauseMenu.classList.add('hidden');
            this.onResume && this.onResume();
        }
    },

    showVictory: function(rewards) {
        const expEl = document.getElementById('exp-reward');
        const goldEl = document.getElementById('gold-reward');
        if (expEl) expEl.textContent = rewards.exp;
        if (goldEl) goldEl.textContent = rewards.gold;
        this.showScreen('victory');
    },

    showDefeat: function() {
        this.showScreen('defeat');
    },

    showLevelUp: function(newLevel) {
        const levelEl = document.querySelector('#levelup-screen h2 + p span');
        if (levelEl) levelEl.textContent = newLevel;
        this.showScreen('levelUp');
    }
};
