const UI = {
    elements: {},
    game: null,

    init: function(game) {
        this.game = game;
        this.cacheElements();
        this.bindEvents();
    },

    cacheElements: function() {
        this.elements = {
            startScreen: document.getElementById('start-screen'),
            pauseScreen: document.getElementById('pause-screen'),
            gameoverScreen: document.getElementById('gameover-screen'),
            gameHud: document.getElementById('game-hud'),
            gameControls: document.getElementById('game-controls'),
            
            score: document.getElementById('score'),
            combo: document.getElementById('combo'),
            time: document.getElementById('time'),
            energyFill: document.getElementById('energy-fill'),
            
            powerBar: document.getElementById('power-bar'),
            powerFill: document.getElementById('power-fill'),
            angleIndicator: document.getElementById('angle-indicator'),
            angleValue: document.getElementById('angle-value'),
            
            finalScore: document.getElementById('final-score'),
            finalCombo: document.getElementById('final-combo'),
            
            startBtn: document.getElementById('start-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            resumeBtn: document.getElementById('resume-btn'),
            restartBtn: document.getElementById('restart-btn'),
            quitBtn: document.getElementById('quit-btn'),
            playagainBtn: document.getElementById('playagain-btn'),
            backBtn: document.getElementById('back-btn')
        };
    },

    bindEvents: function() {
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => {
                if (this.game) {
                    this.game.startGame();
                }
            });
        }
        
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.addEventListener('click', () => {
                if (this.game) {
                    this.game.pauseGame();
                }
            });
        }
        
        if (this.elements.resumeBtn) {
            this.elements.resumeBtn.addEventListener('click', () => {
                if (this.game) {
                    this.game.resumeGame();
                }
            });
        }
        
        if (this.elements.restartBtn) {
            this.elements.restartBtn.addEventListener('click', () => {
                if (this.game) {
                    this.game.restartGame();
                }
            });
        }
        
        if (this.elements.quitBtn) {
            this.elements.quitBtn.addEventListener('click', () => {
                if (this.game) {
                    this.game.quitGame();
                }
            });
        }
        
        if (this.elements.playagainBtn) {
            this.elements.playagainBtn.addEventListener('click', () => {
                if (this.game) {
                    this.game.restartGame();
                }
            });
        }
        
        if (this.elements.backBtn) {
            this.elements.backBtn.addEventListener('click', () => {
                if (this.game) {
                    this.game.showMenu();
                }
            });
        }
    },

    showScreen: function(screenName) {
        this.hideAllScreens();
        
        switch (screenName) {
            case 'start':
                if (this.elements.startScreen) {
                    this.elements.startScreen.classList.remove('hidden');
                }
                this.hideGameUI();
                break;
                
            case 'pause':
                if (this.elements.pauseScreen) {
                    this.elements.pauseScreen.classList.remove('hidden');
                }
                break;
                
            case 'gameover':
                if (this.elements.gameoverScreen) {
                    this.elements.gameoverScreen.classList.remove('hidden');
                }
                this.hideGameUI();
                break;
                
            case 'playing':
                this.showGameUI();
                break;
        }
    },

    hideAllScreens: function() {
        if (this.elements.startScreen) {
            this.elements.startScreen.classList.add('hidden');
        }
        if (this.elements.pauseScreen) {
            this.elements.pauseScreen.classList.add('hidden');
        }
        if (this.elements.gameoverScreen) {
            this.elements.gameoverScreen.classList.add('hidden');
        }
    },

    showGameUI: function() {
        if (this.elements.gameHud) {
            this.elements.gameHud.classList.remove('hidden');
        }
        if (this.elements.gameControls) {
            this.elements.gameControls.classList.remove('hidden');
        }
    },

    hideGameUI: function() {
        if (this.elements.gameHud) {
            this.elements.gameHud.classList.add('hidden');
        }
        if (this.elements.gameControls) {
            this.elements.gameControls.classList.add('hidden');
        }
        this.hidePowerBar();
        this.hideAngleIndicator();
    },

    updateScore: function(score) {
        if (this.elements.score) {
            this.elements.score.textContent = score;
            this.animateElement(this.elements.score);
        }
    },

    updateCombo: function(combo) {
        if (this.elements.combo) {
            this.elements.combo.textContent = combo;
            if (combo > 0) {
                this.animateElement(this.elements.combo);
            }
        }
    },

    updateTime: function(time) {
        if (this.elements.time) {
            this.elements.time.textContent = Utils.formatTime(time);
            
            if (time <= 10) {
                this.elements.time.style.color = '#F44336';
            } else {
                this.elements.time.style.color = '#FFD700';
            }
        }
    },

    updateEnergy: function(energy) {
        if (this.elements.energyFill) {
            const percent = Math.min(100, Math.max(0, energy));
            this.elements.energyFill.style.width = percent + '%';
            
            if (percent >= 100) {
                this.elements.energyFill.style.boxShadow = '0 0 10px #FFD700';
            } else {
                this.elements.energyFill.style.boxShadow = 'none';
            }
        }
    },

    showPowerBar: function() {
        if (this.elements.powerBar) {
            this.elements.powerBar.classList.remove('hidden');
        }
    },

    hidePowerBar: function() {
        if (this.elements.powerBar) {
            this.elements.powerBar.classList.add('hidden');
        }
    },

    updatePowerBar: function(percent) {
        if (this.elements.powerFill) {
            this.elements.powerFill.style.width = percent + '%';
        }
    },

    showAngleIndicator: function() {
        if (this.elements.angleIndicator) {
            this.elements.angleIndicator.classList.remove('hidden');
        }
    },

    hideAngleIndicator: function() {
        if (this.elements.angleIndicator) {
            this.elements.angleIndicator.classList.add('hidden');
        }
    },

    updateAngleIndicator: function(angle) {
        if (this.elements.angleValue) {
            this.elements.angleValue.textContent = Math.round(angle) + '°';
            
            const inOptimal = angle >= CONSTANTS.ANGLE.OPTIMAL_MIN && 
                            angle <= CONSTANTS.ANGLE.OPTIMAL_MAX;
            this.elements.angleValue.style.color = inOptimal ? '#4CAF50' : '#FFFFFF';
        }
    },

    updateFinalStats: function(score, maxCombo) {
        if (this.elements.finalScore) {
            this.elements.finalScore.textContent = score;
        }
        if (this.elements.finalCombo) {
            this.elements.finalCombo.textContent = maxCombo;
        }
    },

    animateElement: function(element) {
        if (!element) return;
        
        element.style.transform = 'scale(1.2)';
        element.style.transition = 'transform 0.1s ease';
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 100);
    },

    drawAimLine: function(ctx, startX, startY, endX, endY) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        ctx.setLineDash([]);
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(endX, endY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },

    drawTrajectory: function(ctx, points, isInGreenZone) {
        if (!points || points.length < 2) return;
        
        ctx.save();
        ctx.strokeStyle = isInGreenZone ? '#4CAF50' : '#FF6B00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.globalAlpha = 0.7;
        
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        
        ctx.stroke();
        
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        
        for (let i = 0; i < points.length; i += 5) {
            const alpha = 1 - (i / points.length) * 0.7;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(points[i].x, points[i].y, 3, 0, Math.PI * 2);
            ctx.fillStyle = isInGreenZone ? '#4CAF50' : '#FF6B00';
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
        ctx.restore();
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}
