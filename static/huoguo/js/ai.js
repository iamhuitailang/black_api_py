const AI = (function() {
    let aiState = {
        currentAction: 'idle',
        actionTimer: 0,
        decisionInterval: 60,
        difficulty: 1
    };

    function reset() {
        aiState = {
            currentAction: 'idle',
            actionTimer: 0,
            decisionInterval: 60,
            difficulty: 1
        };
    }

    function makeDecision(enemy, player) {
        aiState.actionTimer++;
        
        if (aiState.actionTimer >= aiState.decisionInterval) {
            aiState.actionTimer = 0;
            
            const distance = Math.abs(enemy.x - player.x);
            const healthPercent = enemy.health / enemy.maxHealth;
            const energyFull = Characters.canUseUltimate(enemy);
            
            if (energyFull && distance < 400 && Math.random() < 0.7) {
                aiState.currentAction = 'ultimate';
            } else if (distance < 100) {
                const choices = ['melee', 'roll', 'backward', 'jump'];
                const weights = [0.3, 0.2, 0.25, 0.25];
                aiState.currentAction = weightedChoice(choices, weights);
            } else if (distance < 300) {
                const choices = ['smallAttack', 'bigAttack', 'forward', 'jump', 'crouch'];
                const weights = [0.3, 0.2, 0.2, 0.15, 0.15];
                aiState.currentAction = weightedChoice(choices, weights);
            } else {
                const choices = ['forward', 'smallAttack', 'jump'];
                const weights = [0.5, 0.35, 0.15];
                aiState.currentAction = weightedChoice(choices, weights);
            }

            if (healthPercent < 0.3) {
                if (Math.random() < 0.4) {
                    aiState.currentAction = 'backward';
                }
            }

            aiState.decisionInterval = 30 + Math.random() * 60;
        }
    }

    function weightedChoice(choices, weights) {
        const total = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        
        for (let i = 0; i < choices.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return choices[i];
            }
        }
        return choices[0];
    }

    function executeAction(enemy, player) {
        switch (aiState.currentAction) {
            case 'idle':
                break;
            case 'forward':
                if (enemy.x > player.x) {
                    Physics.moveLeft(enemy);
                } else {
                    Physics.moveRight(enemy);
                }
                break;
            case 'backward':
                if (enemy.x > player.x) {
                    Physics.moveRight(enemy);
                } else {
                    Physics.moveLeft(enemy);
                }
                break;
            case 'jump':
                Physics.jump(enemy);
                break;
            case 'crouch':
                Physics.crouch(enemy);
                setTimeout(() => {
                    if (enemy.crouching) {
                        Physics.standUp(enemy);
                    }
                }, 500);
                break;
            case 'smallAttack':
                Combat.smallIngredientAttack(enemy);
                break;
            case 'bigAttack':
                Combat.bigIngredientAttack(enemy);
                break;
            case 'melee':
                Combat.meleeAttack(enemy, player);
                break;
            case 'roll':
                Combat.rollAttack(enemy);
                break;
            case 'ultimate':
                Combat.ultimateAttack(enemy);
                break;
        }
    }

    function update(enemy, player) {
        makeDecision(enemy, player);
        executeAction(enemy, player);
    }

    function setDifficulty(level) {
        aiState.difficulty = level;
    }

    return {
        update,
        reset,
        setDifficulty
    };
})();
