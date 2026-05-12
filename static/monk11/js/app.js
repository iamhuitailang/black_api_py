const Game = {
    playerData: null,
    selectedMage: null,

    init: function() {
        console.log('游戏初始化中...');
        
        this.loadGame();
        this.setupUICallbacks();
        
        Renderer.init();
        UI.init();
        
        this.restoreScreen();
        this.startGameLoop();
        
        console.log('游戏初始化完成！');
    },

    startGameLoop: function() {
        const loop = () => {
            this.updateBattleCharacters();
            requestAnimationFrame(loop);
        };
        loop();
    },

    loadGame: function() {
        try {
            const saveData = Storage.load();
            this.playerData = saveData.player;
            console.log('加载玩家数据:', this.playerData);
            
            if (saveData.battle && saveData.battle.player && saveData.battle.enemy) {
                BattleSystem.player = saveData.battle.player;
                BattleSystem.enemy = saveData.battle.enemy;
                BattleSystem.isPlayerTurn = saveData.battle.isPlayerTurn || true;
                BattleSystem.battleLog = saveData.battle.battleLog || [];
                this.selectedMage = GameData.mages.find(m => m.id === saveData.player.selectedMage);
            }
        } catch (e) {
            console.error('加载游戏失败:', e);
            this.playerData = Storage.getDefaultSave().player;
        }
    },

    saveGame: function() {
        const battleState = BattleSystem.getBattleState();
        Storage.saveBattle(battleState);
        Storage.savePlayer(this.playerData);
    },

    restoreScreen: function() {
        const savedScreen = Storage.load().currentScreen;
        console.log('恢复屏幕:', savedScreen);
        
        if (savedScreen === 'battle' && BattleSystem.player) {
            UI.showScreen('battle');
            UI.updateBattleUI(BattleSystem.getBattleState());
        } else if (savedScreen === 'characterSelect') {
            this.showCharacterSelect();
        } else {
            UI.showScreen('mainMenu');
        }
    },

    setupUICallbacks: function() {
        UI.onSelectMage = (mage) => {
            console.log('选择法师:', mage.name);
            this.startBattle(mage);
        };
        
        UI.onUnlockMage = (mageId, cost) => this.unlockMage(mageId, cost);
        UI.onCastSpell = (spellId) => this.castSpell(spellId);
        UI.onBasicAttack = () => this.basicAttack();
        BattleSystem.onBasicAttack = () => this.basicAttack();
        UI.onPause = () => BattleSystem.pause();
        UI.onResume = () => BattleSystem.resume();
        UI.onRestartBattle = () => this.restartBattle();
        UI.onQuitBattle = () => this.quitBattle();
        UI.onContinue = () => this.nextBattle();
        UI.onRetry = () => this.restartBattle();
        
        BattleSystem.onTurnEnd = () => {
            console.log('回合结束，更新UI');
            UI.updateBattleUI(BattleSystem.getBattleState());
            this.saveGame();
        };
    },

    basicAttack: function() {
        console.log('执行普通攻击');
        if (!BattleSystem.isPlayerTurn || BattleSystem.isPaused) return;
        
        const result = BattleSystem.playerBasicAttack();
        
        if (result === false) return;
        
        const startX = Renderer.width * 0.25;
        const startY = Renderer.height * 0.4;
        const targetX = Renderer.width * 0.75;
        const targetY = Renderer.height * 0.4;
        
        Renderer.showSpellEffect('earth', startX, startY, targetX, targetY, () => {
            this.updateBattleUI();
        });
        
        if (result === 'victory') {
            setTimeout(() => this.handleVictory(), 500);
        }
    },

    showCharacterSelect: function() {
        console.log('显示角色选择界面');
        UI.renderCharacterSelect(GameData.mages, this.playerData.unlockedMages, this.playerData.gold);
        UI.showScreen('characterSelect');
    },

    unlockMage: function(mageId, cost) {
        if (this.playerData.gold >= cost) {
            this.playerData.gold -= cost;
            this.playerData.unlockedMages.push(mageId);
            Storage.savePlayer(this.playerData);
            UI.renderCharacterSelect(GameData.mages, this.playerData.unlockedMages, this.playerData.gold);
        }
    },

    startBattle: function(mage) {
        console.log('开始战斗，法师:', mage.name);
        this.selectedMage = mage;
        this.playerData.selectedMage = mage.id;
        Storage.savePlayer(this.playerData);
        
        BattleSystem.init(mage, this.playerData.spellLevels);
        UI.showScreen('battle');
        UI.updateBattleUI(BattleSystem.getBattleState());
        this.saveGame();
    },

    castSpell: function(spellId) {
        const spell = GameData.spells[spellId];
        console.log('释放法术:', spell.name);
        
        const result = BattleSystem.castPlayerSpell(spellId);
        
        if (result === false) return;

        if (spell.type !== 'heal' && spell.type !== 'shield') {
            const startX = Renderer.width * 0.25;
            const startY = Renderer.height * 0.4;
            const targetX = Renderer.width * 0.75;
            const targetY = Renderer.height * 0.4;
            
            Renderer.showSpellEffect(spell.element, startX, startY, targetX, targetY, () => {
                this.updateBattleUI();
            });
        } else {
            Renderer.addExplosion(Renderer.width * 0.25, Renderer.height * 0.4, spell.element, 20);
            this.updateBattleUI();
        }

        if (result === 'victory') {
            setTimeout(() => this.handleVictory(), 500);
        }
    },

    updateBattleUI: function() {
        UI.updateBattleUI(BattleSystem.getBattleState());
        this.saveGame();

        if (BattleSystem.player && BattleSystem.player.currentHealth <= 0) {
            setTimeout(() => this.handleDefeat(), 500);
        }
    },

    handleVictory: function() {
        const rewards = BattleSystem.getRewards();
        this.playerData.gold += rewards.gold;
        this.playerData.exp += rewards.exp;

        const expForNextLevel = GameData.getExpForLevel(this.playerData.level);
        if (this.playerData.exp >= expForNextLevel) {
            this.playerData.level++;
            this.playerData.exp -= expForNextLevel;
            setTimeout(() => UI.showLevelUp(this.playerData.level), 1500);
        }

        Storage.savePlayer(this.playerData);
        UI.showVictory(rewards);
    },

    handleDefeat: function() {
        UI.showDefeat();
    },

    nextBattle: function() {
        BattleSystem.init(this.selectedMage, this.playerData.spellLevels);
        UI.showScreen('battle');
        UI.updateBattleUI(BattleSystem.getBattleState());
        this.saveGame();
    },

    restartBattle: function() {
        document.getElementById('pause-menu').classList.add('hidden');
        BattleSystem.init(this.selectedMage, this.playerData.spellLevels);
        UI.showScreen('battle');
        UI.updateBattleUI(BattleSystem.getBattleState());
        this.saveGame();
    },

    quitBattle: function() {
        document.getElementById('pause-menu').classList.add('hidden');
        UI.showScreen('mainMenu');
        Storage.saveBattle(null);
    },

    updateBattleCharacters: function() {
        if (UI.currentScreen === 'battle' && BattleSystem.player && BattleSystem.enemy) {
            Renderer.drawBattleCharacter(
                BattleSystem.player.element,
                Renderer.width * 0.25,
                Renderer.height * 0.4,
                1.5,
                false
            );
            Renderer.drawBattleCharacter(
                BattleSystem.enemy.element,
                Renderer.width * 0.75,
                Renderer.height * 0.4,
                BattleSystem.enemy.isBoss ? 2 : 1.5,
                true
            );
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，初始化游戏...');
    Game.init();
});
