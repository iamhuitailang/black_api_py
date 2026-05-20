console.log('Loading app.js...');

var App = {
    init: function() {
        console.log('App.init called');
        
        try {
            console.log('Initializing Game...');
            Game.init();
            
            console.log('Initializing UISystem...');
            UISystem.init();
            
            console.log('Initializing InputSystem...');
            InputSystem.init();
            
            console.log('Initializing WeatherSystem...');
            WeatherSystem.init();
            
            console.log('Initializing EffectSystem...');
            EffectSystem.clear();
            
            console.log('All systems initialized');
            
            console.log('Starting game loop...');
            Game.startLoop();
            
            console.log('Binding events...');
            this.bindEvents();
            
            console.log('App init complete');
            
            setTimeout(function() {
                console.log('Showing menu...');
                App.showMenu();
            }, 100);
            
        } catch (e) {
            console.error('App init error:', e, e.stack);
        }
    },
    
    bindEvents: function() {
        InputSystem.onJump = function() {
            App.handleJumpStart();
        };
        InputSystem.onJumpRelease = function() {
            App.handleJumpEnd();
        };
        InputSystem.onPostureLeft = function() {
            App.handlePosture(-1);
        };
        InputSystem.onPostureRight = function() {
            App.handlePosture(1);
        };
        InputSystem.onReset = function() {
            App.handleReset();
        };
        
        UISystem.bindModeSelect(function(mode) {
            App.startGame(mode);
        });
        UISystem.bindContinue(function() {
            Game.continueGame();
        });
        UISystem.bindRestart(function() {
            Game.restartGame();
        });
        UISystem.bindMenu(function() {
            Game.backToMenu();
        });
        UISystem.bindPause(function() {
            App.handlePause();
        });
    },
    
    showMenu: function() {
        console.log('App.showMenu called');
        UISystem.showStartScreen(true);
        UISystem.showPauseButton(false);
    },
    
    startGame: function(mode) {
        console.log('App.startGame called with mode:', mode);
        try {
            UISystem.showStartScreen(false);
            UISystem.showPauseButton(true);
            UISystem.hideResultScreen();
            
            Game.startGame(mode);
            
            var modeConfig = CONFIG.MODES[mode];
            UISystem.updateInfo({
                currentHeight: Game.state.currentHeight,
                bestHeight: Game.state.bestHeight,
                successfulJumps: Game.state.successfulJumps,
                totalJumps: Game.state.totalJumps,
                rank: Game.state.rank,
                weather: WeatherSystem.getIcon()
            });
            
            UISystem.showHint(modeConfig.name + ' - 长按蓄力起跳', 2500);
            console.log('Game started successfully');
        } catch (e) {
            console.error('Error in startGame:', e, e.stack);
        }
    },
    
    handleJumpStart: function() {
        if (!Game.state || Game.state.gameState !== 'ready') return;
        Game.state.playerState.isCharging = true;
    },
    
    handleJumpEnd: function() {
        if (!Game.state) return;
        
        if (Game.state.gameState === 'charging') {
            Game.state.playerState.isCharging = false;
        } else if (Game.state.gameState === 'ready') {
            Game.state.playerState.isCharging = false;
        }
    },
    
    handlePosture: function(direction) {
        if (!Game.state) return;
        Game.adjustPosture(direction);
    },
    
    handleReset: function() {
        if (!Game.state) return;
        Game.resetAttempt();
    },
    
    handlePause: function() {
        if (!Game.state || Game.state.gameState === 'menu') return;
        
        var isPaused = Game.togglePause();
        if (isPaused) {
            UISystem.showHint('已暂停 - 点击继续', 0);
        } else {
            UISystem.hideHint();
        }
    }
};

window.addEventListener('load', function() {
    console.log('Window loaded, starting app');
    App.init();
});

window.addEventListener('beforeunload', function() {
    if (Game.state) {
        Game.save();
    }
});

console.log('app.js loaded successfully');
