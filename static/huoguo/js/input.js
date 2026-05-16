const Input = (function() {
    const keys = {};
    let player = null;
    let enemy = null;

    function init(playerCharacter, enemyCharacter) {
        player = playerCharacter;
        enemy = enemyCharacter;
        
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
    }

    function handleKeyDown(e) {
        keys[e.code] = true;
        
        if (e.code === 'KeyZ') {
            Combat.smallIngredientAttack(player);
        }
        if (e.code === 'KeyX') {
            Combat.bigIngredientAttack(player);
        }
        if (e.code === 'KeyC') {
            Combat.meleeAttack(player, enemy);
        }
        if (e.code === 'KeyV') {
            Combat.rollAttack(player);
        }
        if (e.code === 'Space') {
            e.preventDefault();
            Combat.ultimateAttack(player);
        }
    }

    function handleKeyUp(e) {
        keys[e.code] = false;
        
        if (e.code === 'ArrowDown') {
            Physics.standUp(player);
        }
    }

    function update() {
        if (!player) return;

        if (keys['ArrowLeft']) {
            Physics.moveLeft(player);
        }
        if (keys['ArrowRight']) {
            Physics.moveRight(player);
        }
        if (keys['ArrowUp']) {
            Physics.jump(player);
        }
        if (keys['ArrowDown']) {
            Physics.crouch(player);
        }
    }

    function isKeyPressed(keyCode) {
        return keys[keyCode] || false;
    }

    function destroy() {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    }

    return {
        init,
        update,
        isKeyPressed,
        destroy
    };
})();
