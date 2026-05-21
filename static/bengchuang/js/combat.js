const Combat = (function() {
    const attackEffects = [];

    function checkAttackHit(attacker, defender) {
        if (!attacker.isAttacking()) return false;
        
        const hitbox = attacker.getAttackHitbox();
        if (!hitbox) return false;

        const defenderHitbox = {
            x: defender.x,
            y: defender.y,
            width: defender.width,
            height: defender.height
        };

        return hitbox.x < defenderHitbox.x + defenderHitbox.width &&
               hitbox.x + hitbox.width > defenderHitbox.x &&
               hitbox.y < defenderHitbox.y + defenderHitbox.height &&
               hitbox.y + hitbox.height > defenderHitbox.y;
    }

    function calculateKnockback(attacker, defender, move) {
        let knockbackForce = move.knockback;
        
        if (move.name === '特技甩击') {
            knockbackForce += attacker.specialKnockback - 20;
        }

        if (attacker.onTrampoline) {
            knockbackForce *= 1.3;
        }

        if (defender.onEdge) {
            knockbackForce *= 1.5;
        }

        const heightAboveGround = GROUND_Y - attacker.y - attacker.height;
        if (heightAboveGround > 200) {
            knockbackForce *= 1.2;
        }

        return knockbackForce;
    }

    function executeAttack(attacker, defender) {
        if (!attacker.isAttacking()) return null;
        if (attacker.hasHit) return null;

        if (!checkAttackHit(attacker, defender)) return null;

        const move = MOVES[attacker.currentAttack];
        const knockbackForce = calculateKnockback(attacker, defender, move);

        defender.takeDamage(attacker, move.damage, knockbackForce);

        attacker.hasHit = true;

        addAttackEffect(
            defender.getCenterX(),
            defender.getCenterY(),
            move.color,
            move.name
        );

        if (typeof Renderer !== 'undefined' && Renderer.createHitParticles) {
            Renderer.createHitParticles(defender.getCenterX(), defender.getCenterY(), move.color);
        }

        return {
            move: move.name,
            damage: move.damage,
            knockback: knockbackForce,
            direction: attacker.facingRight ? 1 : -1
        };
    }

    function addAttackEffect(x, y, color, text) {
        attackEffects.push({
            x: x,
            y: y,
            color: color,
            text: text,
            alpha: 1,
            scale: 1,
            timer: 500
        });
    }

    function updateAttackEffects(deltaTime) {
        for (let i = attackEffects.length - 1; i >= 0; i--) {
            const effect = attackEffects[i];
            effect.timer -= deltaTime;
            effect.y -= 1;
            effect.scale += 0.02;
            effect.alpha = effect.timer / 500;

            if (effect.timer <= 0) {
                attackEffects.splice(i, 1);
            }
        }
    }

    function getAttackEffects() {
        return attackEffects;
    }

    function resetAttackHit(character) {
        if (!character.isAttacking()) {
            character.hasHit = false;
        }
    }

    function checkVictory(player1, player2) {
        const p1Out = Physics.checkArenaBounds(player1);
        const p2Out = Physics.checkArenaBounds(player2);

        if (p1Out && p2Out) {
            const p1Y = player1.y;
            const p2Y = player2.y;
            return p1Y > p2Y ? 'ai' : 'player';
        }

        if (p1Out) return 'ai';
        if (p2Out) return 'player';

        return null;
    }

    function updateCombat(player1, player2, deltaTime) {
        updateAttackEffects(deltaTime);

        resetAttackHit(player1);
        resetAttackHit(player2);

        const p1Hit = executeAttack(player1, player2);
        const p2Hit = executeAttack(player2, player1);

        const winner = checkVictory(player1, player2);

        return {
            p1Hit,
            p2Hit,
            winner
        };
    }

    return {
        checkAttackHit,
        calculateKnockback,
        executeAttack,
        addAttackEffect,
        updateAttackEffects,
        getAttackEffects,
        resetAttackHit,
        checkVictory,
        updateCombat
    };
})();