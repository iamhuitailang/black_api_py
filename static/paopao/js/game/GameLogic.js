const GameLogic = {
    processBubbleLanding(gameState, bubble) {
        const emptyPos = gameState.grid.findEmptyPosition(bubble.x, bubble.y);
        
        if (emptyPos.row >= 0 && emptyPos.col >= 0 && emptyPos.col < CONSTANTS.GRID_COLS) {
            bubble.row = emptyPos.row;
            bubble.col = emptyPos.col;
            bubble.setPositionFromGrid();
            bubble.stop();
            gameState.grid.addBubble(bubble);
            
            gameState.activeBubble = null;
            gameState.shotsSinceLastRow++;
            
            const matches = gameState.grid.findMatches(bubble);
            
            if (matches.length > 0) {
                this.processMatches(gameState, matches);
            } else {
                gameState.resetCombo();
                
                if (gameState.levelConfig.addRowEvery > 0 && 
                    gameState.shotsSinceLastRow >= gameState.levelConfig.addRowEvery) {
                    for (let i = 0; i < gameState.levelConfig.rowsToAdd; i++) {
                        gameState.addRowOfBubbles();
                    }
                }
                
                gameState.isProcessing = false;
            }
            
            gameState.save();
            return true;
        }
        
        return false;
    },
    
    processMatches(gameState, matches) {
        gameState.isProcessing = true;
        gameState.addCombo();
        
        const allToPop = new Set();
        const centerBubble = matches[0];
        
        for (const bubble of matches) {
            allToPop.add(bubble);
            
            if (bubble.type !== 'normal') {
                this.processSpecialBubble(gameState, bubble, allToPop);
            }
        }
        
        const totalScore = this.calculateScore(gameState, Array.from(allToPop));
        gameState.addScore(totalScore, centerBubble.x, centerBubble.y);
        
        for (const bubble of allToPop) {
            this.popBubble(gameState, bubble);
        }
        
        setTimeout(() => {
            this.checkFloatingBubbles(gameState);
            
            gameState.isProcessing = false;
            
            if (gameState.checkLevelComplete()) {
                gameState.currentState = CONSTANTS.GAME_STATES.LEVEL_COMPLETE;
                Storage.updateHighScore(gameState.score);
            } else if (gameState.checkGameOver()) {
                gameState.currentState = CONSTANTS.GAME_STATES.GAME_OVER;
                Storage.updateHighScore(gameState.score);
            } else {
                if (gameState.levelConfig.addRowEvery > 0 && 
                    gameState.shotsSinceLastRow >= gameState.levelConfig.addRowEvery) {
                    for (let i = 0; i < gameState.levelConfig.rowsToAdd; i++) {
                        gameState.addRowOfBubbles();
                    }
                }
            }
            
            gameState.save();
        }, CONSTANTS.ANIMATION.POP_DURATION + 50);
    },
    
    processSpecialBubble(gameState, bubble, allToPop) {
        const config = bubble.config;
        
        switch (config.effect) {
            case 'explode':
                this.processExplosion(gameState, bubble, allToPop);
                break;
            case 'chain':
                this.processChain(gameState, bubble, allToPop);
                break;
            case 'burn':
                this.processBurn(gameState, bubble, allToPop);
                break;
            case 'pierce':
                this.processPierce(gameState, bubble, allToPop);
                break;
        }
    },
    
    processExplosion(gameState, centerBubble, allToPop) {
        const radius = centerBubble.config.explosionRadius || 2;
        const bubblesInRadius = gameState.grid.getBubblesInRadius(centerBubble, radius);
        
        for (const bubble of bubblesInRadius) {
            allToPop.add(bubble);
        }
        
        gameState.addScreenShake(15);
        this.createExplosionParticles(gameState, centerBubble.x, centerBubble.y);
    },
    
    processChain(gameState, startBubble, allToPop) {
        const chainCount = startBubble.config.chainCount || 3;
        let currentBubble = startBubble;
        
        for (let i = 0; i < chainCount; i++) {
            const neighbors = gameState.grid.getNeighbors(currentBubble);
            const differentColor = neighbors.find(n => n.color !== currentBubble.color && !allToPop.has(n));
            
            if (differentColor) {
                allToPop.add(differentColor);
                currentBubble = differentColor;
            } else {
                break;
            }
        }
    },
    
    processBurn(gameState, centerBubble, allToPop) {
        const radius = centerBubble.config.burnRadius || 1;
        const neighbors = gameState.grid.getNeighbors(centerBubble);
        
        for (const neighbor of neighbors) {
            allToPop.add(neighbor);
        }
        
        this.createFireParticles(gameState, centerBubble.x, centerBubble.y);
    },
    
    processPierce(gameState, bubble, allToPop) {
        const pierceCount = bubble.config.pierceCount || 2;
        const angle = Math.atan2(bubble.vy, bubble.vx);
        
        for (let i = 1; i <= pierceCount; i++) {
            const checkX = bubble.x + Math.cos(angle) * CONSTANTS.BUBBLE_DIAMETER * i;
            const checkY = bubble.y + Math.sin(angle) * CONSTANTS.BUBBLE_DIAMETER * i;
            
            const hitBubble = gameState.grid.findNearestBubble(checkX, checkY, CONSTANTS.BUBBLE_RADIUS * 1.5);
            if (hitBubble) {
                allToPop.add(hitBubble);
            }
        }
    },
    
    calculateScore(gameState, bubbles) {
        let totalScore = 0;
        
        for (const bubble of bubbles) {
            const baseScore = bubble.config.baseScore;
            if (bubble.type !== 'normal') {
                totalScore += gameState.launcher.specialBubbleScore;
            } else {
                totalScore += baseScore;
            }
        }
        
        return totalScore;
    },
    
    popBubble(gameState, bubble) {
        gameState.grid.removeBubble(bubble);
        bubble.startPop();
        
        this.createPopParticles(gameState, bubble);
        
        if (Math.random() < 0.1) {
            gameState.launcher.addSpecialBubble();
        }
    },
    
    checkFloatingBubbles(gameState) {
        const floating = gameState.grid.findFloatingBubbles();
        
        if (floating.length > 0) {
            gameState.addCombo();
            
            for (const bubble of floating) {
                gameState.grid.removeBubble(bubble);
                bubble.startDrop(CONSTANTS.CANVAS_HEIGHT + 100);
                gameState.addScore(bubble.config.baseScore * 2, bubble.x, bubble.y);
            }
            
            gameState.addScreenShake(5);
        }
    },
    
    createPopParticles(gameState, bubble) {
        const color = bubble.displayColor;
        const count = 12;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = Helpers.randomRange(2, 5);
            
            gameState.particles.push({
                x: bubble.x,
                y: bubble.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: Helpers.randomRange(4, 8),
                life: 500,
                maxLife: 500,
                alpha: 1
            });
        }
    },
    
    createExplosionParticles(gameState, x, y) {
        const colors = ['#FF6B6B', '#FF8C00', '#FFD700', '#FF4500'];
        const count = 30;
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Helpers.randomRange(3, 8);
            
            gameState.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Helpers.randomRange(6, 12),
                life: 800,
                maxLife: 800,
                alpha: 1
            });
        }
    },
    
    createFireParticles(gameState, x, y) {
        const colors = ['#FF4500', '#FF6347', '#FFD700', '#FFA500'];
        const count = 20;
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.random() - 0.5) * Math.PI;
            const speed = Helpers.randomRange(1, 4);
            
            gameState.particles.push({
                x: x + Helpers.randomRange(-10, 10),
                y: y + Helpers.randomRange(-10, 10),
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Helpers.randomRange(5, 10),
                life: 600,
                maxLife: 600,
                alpha: 1
            });
        }
    }
};
