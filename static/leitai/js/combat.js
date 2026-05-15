const Combat = {
    startAttack(char, attack) {
        if (char.isAttacking || char.isHurt) return false;
        
        if (attack.isUltimate && char.ultimateGauge < char.maxUltimateGauge) {
            return false;
        }

        char.isAttacking = true;
        char.currentAttack = attack;
        char.attackTimer = attack.startup;
        char.attackPhase = 'startup';
        char.isAngry = true;
        
        return true;
    },

    updateAttack(char, deltaTime, state) {
        if (!char.isAttacking) return;

        char.attackTimer -= deltaTime;

        if (char.attackPhase === 'startup' && char.attackTimer <= 0) {
            char.attackPhase = 'hit';
            char.attackTimer = 0.1;
        } else if (char.attackPhase === 'hit' && char.attackTimer <= 0) {
            char.attackPhase = 'recovery';
            char.attackTimer = char.currentAttack.recovery;
            
            const defender = char.isPlayer ? state.enemy : state.player;
            if (Physics.checkAttackHit(char, defender, char.currentAttack)) {
                this.applyDamage(char, defender, state);
            }
        } else if (char.attackPhase === 'recovery' && char.attackTimer <= 0) {
            this.endAttack(char);
        }
    },

    applyDamage(attacker, defender, state) {
        const attack = attacker.currentAttack;
        let damage = attack.damage;

        if (attack.isUltimate) {
            damage = attacker.ultimateDamage;
            attacker.ultimateGauge = 0;
            state.screenShake.intensity = 1;
        }

        const actualDamage = Math.max(1, damage - Math.floor(defender.defense / 5));
        defender.rage = Math.max(0, defender.rage - actualDamage);
        defender.isHurt = true;
        defender.hurtTimer = 0.3;

        defender.vx = (attacker.facingRight ? 1 : -1) * 8;

        attacker.ultimateGauge = Math.min(attacker.maxUltimateGauge, attacker.ultimateGauge + actualDamage * 2);

        const hitX = (attacker.x + defender.x) / 2 + attacker.width / 2;
        const hitY = attacker.y - attacker.height / 2;
        state.effects.push(Physics.createHitEffect(hitX, hitY));
        
        const particles = Physics.createParticles(hitX, hitY, {r: 255, g: 100, b: 100}, 15);
        state.particles.push(...particles);

        if (!attack.isUltimate && !state.screenShake.intensity) {
            state.screenShake.intensity = 0.3;
        }
    },

    endAttack(char) {
        char.isAttacking = false;
        char.currentAttack = null;
        char.attackPhase = 'idle';
        char.attackTimer = 0;
        char.isAngry = false;
    },

    checkGameOver(state) {
        if (state.player.rage <= 0) {
            return { gameOver: true, playerWon: false, message: '你被跺认输了...' };
        }
        if (state.enemy.rage <= 0) {
            return { gameOver: true, playerWon: true, message: '对手被跺认输了！' };
        }
        if (state.timer <= 0) {
            if (state.player.rage > state.enemy.rage) {
                return { gameOver: true, playerWon: true, message: '时间到！你的怒气值更高！' };
            } else if (state.enemy.rage > state.player.rage) {
                return { gameOver: true, playerWon: false, message: '时间到！对手怒气值更高...' };
            } else {
                return { gameOver: true, playerWon: null, message: '时间到！平局！' };
            }
        }
        return { gameOver: false };
    }
};