const AISystem = {
    updateAIPlayer(player, game, deltaTime) {
        if (player.isStunned || player.isEliminated) return;
        
        const incomingItem = this.findIncomingItem(player, game);
        
        if (incomingItem) {
            this.handleIncomingItem(player, incomingItem, game);
        } else {
            this.handleIdleMovement(player, game);
        }
        
        this.tryThrow(player, game, deltaTime);
        this.maybeUseSkill(player, game);
    },
    
    findIncomingItem(player, game) {
        return game.items.find(item => 
            item.isActive && 
            item.toPlayer === player.id &&
            item.vy > 0
        );
    },
    
    handleIncomingItem(player, item, game) {
        const predictedX = this.predictItemLandingX(item, player, game);
        
        const tolerance = GameConfig.GAME.catchRadius * player.catchTolerance;
        const dx = predictedX - player.x;
        
        if (Math.abs(dx) > tolerance * 0.3) {
            player.targetX = predictedX;
        }
        
        const timeToCatch = this.getTimeToLand(item, game);
        if (timeToCatch < GameConfig.AI.reactionTime && Math.random() < GameConfig.AI.accuracy) {
            this.tryCatch(player, item, game);
        }
    },
    
    predictItemLandingX(item, player, game) {
        const gravity = GameConfig.GAME.gravity;
        const groundY = game.groundY || (game.canvas.height - 100);
        
        const timeToLand = this.getTimeToLand(item, game);
        let predictedX = item.x + item.vx * timeToLand;
        
        if (player.type === 'girl' && player.canUseSkill()) {
            predictedX += (Math.random() - 0.5) * 20;
        }
        
        return predictedX;
    },
    
    getTimeToLand(item, game) {
        const gravity = GameConfig.GAME.gravity;
        const groundY = game.groundY || (game.canvas.height - 100);
        
        if (item.vy <= 0) return Infinity;
        
        const dy = groundY - item.y;
        const discriminant = item.vy * item.vy + 2 * gravity * dy;
        if (discriminant < 0) return Infinity;
        
        return (-item.vy + Math.sqrt(discriminant)) / gravity;
    },
    
    tryCatch(player, item, game) {
        const distance = Math.abs(item.x - player.x);
        const catchRadius = GameConfig.GAME.catchRadius * player.catchTolerance;
        
        if (distance < catchRadius) {
            game.handleCatch(player, item);
        }
    },
    
    handleIdleMovement(player, game) {
        if (Math.random() < 0.005) {
            const bounds = game.getPlayerBounds(player);
            const range = bounds.maxX - bounds.minX;
            player.targetX = bounds.minX + Math.random() * range;
        }
    },
    
    tryThrow(player, game, deltaTime) {
        if (game.currentThrower !== player.id) return;
        if (game.throwCooldown > 0) return;
        
        const activeItems = game.items.filter(i => i.isActive);
        if (activeItems.length >= 3) return;
        
        if (!player.aiThrowTimer) {
            player.aiThrowTimer = 0;
        }
        
        player.aiThrowTimer += deltaTime;
        
        const throwDelay = 500 + Math.random() * 1000;
        
        if (player.aiThrowTimer >= throwDelay) {
            player.aiThrowTimer = 0;
            const targetPlayer = this.chooseTargetPlayer(player, game);
            if (targetPlayer) {
                const throwType = Math.random() < 0.7 ? 'normal' : 'fast';
                game.handleThrow(player, targetPlayer, throwType);
            }
        }
    },
    
    chooseTargetPlayer(currentPlayer, game) {
        const validTargets = game.players.filter(p => 
            p.id !== currentPlayer.id && 
            !p.isEliminated && 
            !p.isStunned
        );
        
        if (validTargets.length === 0) return null;
        
        const humanTarget = validTargets.find(p => !p.isAI);
        if (humanTarget && Math.random() < 0.5) {
            return humanTarget;
        }
        
        const weakTarget = validTargets.reduce((weakest, p) => 
            p.hp < weakest.hp ? p : weakest
        );
        
        if (Math.random() < 0.5 && weakTarget) {
            return weakTarget;
        }
        
        return validTargets[Math.floor(Math.random() * validTargets.length)];
    },
    
    maybeUseSkill(player, game) {
        if (!player.canUseSkill()) return;
        
        const dangerItems = game.items.filter(item => 
            item.isActive && 
            item.config.type === 'danger' &&
            item.toPlayer === player.id
        );
        
        if (dangerItems.length > 0 && Math.random() < 0.6) {
            game.handleSkill(player);
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AISystem;
}