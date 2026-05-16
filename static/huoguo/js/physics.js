const Physics = (function() {
    function moveLeft(character) {
        character.velocityX = -character.speed;
        character.facing = -1;
    }

    function moveRight(character) {
        character.velocityX = character.speed;
        character.facing = 1;
    }

    function jump(character) {
        if (!character.isJumping) {
            character.velocityY = -15;
            character.isJumping = true;
        }
    }

    function crouch(character) {
        if (!character.isJumping) {
            character.crouching = true;
            character.height = 60;
        }
    }

    function standUp(character) {
        character.crouching = false;
        character.height = 100;
    }

    function checkCollision(a, b) {
        const aHeight = a.crouching ? 60 : 100;
        const bHeight = b.crouching ? 60 : 100;
        
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + bHeight &&
               a.y + aHeight > b.y;
    }

    function checkProjectileCollision(projectile, target) {
        const targetHeight = target.crouching ? 60 : 100;
        
        return projectile.x < target.x + target.width &&
               projectile.x + projectile.size > target.x &&
               projectile.y < target.y + targetHeight &&
               projectile.y + projectile.size > target.y;
    }

    function keepInBounds(character, canvasWidth, groundY) {
        const charHeight = character.crouching ? 60 : 100;
        
        if (character.x < 0) {
            character.x = 0;
            character.velocityX = 0;
        }
        if (character.x + character.width > canvasWidth) {
            character.x = canvasWidth - character.width;
            character.velocityX = 0;
        }
        if (character.y > groundY) {
            character.y = groundY;
            character.velocityY = 0;
            character.isJumping = false;
        }
    }

    function applyKnockback(character, direction, force) {
        character.velocityX = direction * force;
        character.velocityY = -5;
    }

    return {
        moveLeft,
        moveRight,
        jump,
        crouch,
        standUp,
        checkCollision,
        checkProjectileCollision,
        keepInBounds,
        applyKnockback
    };
})();
