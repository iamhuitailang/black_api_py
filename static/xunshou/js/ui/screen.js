const ScreenManager = {
    currentScreen: 'menu',
    screens: {},

    init() {
        this.screens = {
            menu: MenuUI,
            battle: BattleUI,
            exploration: ExplorationUI,
            stages: ExplorationUI,
            team: TrainingUI,
            collection: CollectionUI,
            shop: ShopUI
        };

        MenuUI.init();
        BattleUI.init();
        ExplorationUI.init();
        TrainingUI.init();
        CollectionUI.init();
        ShopUI.init();

        BattleSystem.onBattleEnd = (result) => {
            this.handleBattleEnd(result);
        };
    },

    render() {
        const screen = GameState.state.ui.currentScreen;
        
        if (screen !== this.currentScreen) {
            this.currentScreen = screen;
            this.initCurrentScreen();
        }

        switch (screen) {
            case 'menu':
                MenuUI.render();
                break;
            case 'battle':
                BattleUI.render();
                break;
            case 'exploration':
                ExplorationUI.render();
                break;
            case 'stages':
                ExplorationUI.renderStages();
                break;
            case 'team':
                TrainingUI.render();
                break;
            case 'collection':
                CollectionUI.render();
                break;
            case 'shop':
                ShopUI.render();
                break;
            default:
                MenuUI.render();
        }

        this.drawNotification();
    },

    initCurrentScreen() {
        switch (this.currentScreen) {
            case 'menu':
                MenuUI.init();
                break;
            case 'battle':
                BattleUI.init();
                break;
            case 'exploration':
            case 'stages':
                ExplorationUI.init();
                break;
            case 'team':
                TrainingUI.init();
                break;
            case 'collection':
                CollectionUI.init();
                break;
            case 'shop':
                ShopUI.init();
                break;
        }
    },

    handleClick(x, y) {
        const screen = GameState.state.ui.currentScreen;

        switch (screen) {
            case 'menu':
                return MenuUI.handleClick(x, y);
            case 'battle':
                return BattleUI.handleClick(x, y);
            case 'exploration':
            case 'stages':
                return ExplorationUI.handleClick(x, y);
            case 'team':
                return TrainingUI.handleClick(x, y);
            case 'collection':
                return CollectionUI.handleClick(x, y);
            case 'shop':
                return ShopUI.handleClick(x, y);
            default:
                return false;
        }
    },

    handleMouseMove(x, y) {
        const screen = GameState.state.ui.currentScreen;

        switch (screen) {
            case 'menu':
                MenuUI.handleMouseMove(x, y);
                break;
            case 'battle':
                BattleUI.handleMouseMove(x, y);
                break;
            case 'exploration':
            case 'stages':
                ExplorationUI.handleMouseMove(x, y);
                break;
            case 'team':
                TrainingUI.handleMouseMove(x, y);
                break;
            case 'collection':
                CollectionUI.handleMouseMove(x, y);
                break;
            case 'shop':
                ShopUI.handleMouseMove(x, y);
                break;
        }
    },

    handleBattleEnd(result) {
        GameState.setCurrentScreen('menu');
        
        if (result.victory) {
            GameState.showNotification(`战斗胜利! 获得 ${result.exp} 经验和 ${result.coins} 金币!`);
        } else {
            GameState.showNotification('战斗失败...');
            TrainingSystem.healAllMonsters();
        }
    },

    drawNotification() {
        GameState.clearNotification();
        const notification = GameState.state.ui.notification;
        
        if (notification) {
            const x = CanvasUtils.width / 2;
            const y = 30;
            
            CanvasUtils.drawRect(x - 200, y, 400, 40, 'rgba(0, 0, 0, 0.8)', 10);
            CanvasUtils.drawText(notification.message, x, y + 20, {
                fontSize: 14,
                color: '#fff',
                align: 'center',
                baseline: 'middle',
                bold: true
            });
        }
    }
};
