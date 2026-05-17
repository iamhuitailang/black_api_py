const App = (() => {
    let game = null;
    let canvas = null;

    const init = () => {
        canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        game = new Game(canvas);

        Input.init(canvas);

        Input.on('stroke', (data) => {
            if (game.state === 'playing') {
                game.playerStroke(data);
            }
        });

        Input.on('breathe', () => {
            if (game.state === 'playing') {
                game.playerBreathe();
            }
        });

        Input.on('pause', () => {
            if (game.state === 'playing') {
                game.pauseGame();
            } else if (game.state === 'paused') {
                game.resumeGame();
            }
        });

        UI.init(game);

        const savedState = Storage.loadGameState();
        if (savedState) {
            if (confirm('检测到未完成的游戏，是否继续？')) {
                resumeSavedGame();
            } else {
                Storage.clearGameState();
            }
        }

        const playerData = Storage.loadPlayerData();
        if (!playerData) {
            const defaultData = {
                stats: {
                    speed: Config.PLAYER.baseSpeed,
                    maxStamina: Config.PLAYER.baseStamina,
                    recovery: Config.PLAYER.baseRecovery,
                    turnSpeed: Config.PLAYER.baseTurnSpeed,
                    power: Config.PLAYER.basePower
                },
                totalRaces: 0,
                wins: 0,
                bestTime: null
            };
            Storage.savePlayerData(defaultData);
        }

        window.addEventListener('beforeunload', handleBeforeUnload);

        console.log('🏊 游泳竞速大赛 已加载完成！');
    };

    const resumeSavedGame = () => {
        if (game.loadState()) {
            game.state = 'playing';
            UI.showGameHUD();
            game.lastFrameTime = performance.now() / 1000;
            game.gameLoop();
        }
    };

    const handleBeforeUnload = (e) => {
        if (game && game.state === 'playing') {
            game.saveState();
            e.preventDefault();
            e.returnValue = '';
        }
    };

    const getGame = () => game;

    return {
        init,
        getGame
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'F5' || (e.ctrlKey && e.code === 'KeyR')) {
        const game = App.getGame();
        if (game && game.state === 'playing') {
            game.saveState();
        }
    }
});
