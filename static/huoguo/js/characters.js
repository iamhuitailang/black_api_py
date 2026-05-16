const Characters = (function() {
    const characterData = {
        spicy: {
            name: '麻辣锅',
            emoji: '🍲',
            type: '攻击型',
            maxHealth: 95,
            attack: 15,
            defense: 3,
            speed: 5,
            ultimateDamage: 30,
            color: '#ff4400',
            glowColor: 'rgba(255, 68, 0, 0.6)',
            ingredients: ['🌶️', '🥩', '🧄'],
            ultimateName: '烈焰辣椒雨'
        },
        clear: {
            name: '清汤锅',
            emoji: '🥔',
            type: '均衡型',
            maxHealth: 100,
            attack: 12,
            defense: 5,
            speed: 5,
            ultimateDamage: 25,
            color: '#e8d4a8',
            glowColor: 'rgba(232, 212, 168, 0.6)',
            ingredients: ['🍄', '🥬', '🧅'],
            ultimateName: '滋补丸子阵'
        },
        tomato: {
            name: '番茄锅',
            emoji: '🦐',
            type: '速度型',
            maxHealth: 90,
            attack: 10,
            defense: 4,
            speed: 7,
            ultimateDamage: 22,
            color: '#ff6b6b',
            glowColor: 'rgba(255, 107, 107, 0.6)',
            ingredients: ['🍅', '🦐', '🥕'],
            ultimateName: '酸甜番茄弹'
        }
    };

    function createCharacter(type, isPlayer) {
        const data = characterData[type];
        const canvas = document.getElementById('game-canvas');
        const groundY = canvas ? canvas.height - 100 : 500;
        
        return {
            type: type,
            name: data.name,
            emoji: data.emoji,
            maxHealth: data.maxHealth,
            health: data.maxHealth,
            energy: 0,
            maxEnergy: 100,
            attack: data.attack,
            defense: data.defense,
            speed: data.speed,
            ultimateDamage: data.ultimateDamage,
            color: data.color,
            glowColor: data.glowColor,
            ingredients: data.ingredients,
            ultimateName: data.ultimateName,
            isPlayer: isPlayer,
            x: isPlayer ? 150 : (canvas ? canvas.width - 150 : 850),
            y: groundY,
            width: 80,
            height: 100,
            velocityX: 0,
            velocityY: 0,
            facing: isPlayer ? 1 : -1,
            isJumping: false,
            crouching: false,
            isAttacking: false,
            attackType: null,
            attackFrame: 0,
            isHurt: false,
            hurtFrame: 0,
            isInvincible: false,
            invincibleFrame: 0,
            attackCooldown: 0,
            combo: []
        };
    }

    function getCharacterData(type) {
        return characterData[type];
    }

    function updateCharacter(character, deltaTime, groundY) {
        character.x += character.velocityX;
        character.y += character.velocityY;

        if (character.y >= groundY) {
            character.y = groundY;
            character.velocityY = 0;
            character.isJumping = false;
        } else {
            character.velocityY += 0.8;
        }

        character.velocityX *= 0.85;

        if (Math.abs(character.velocityX) < 0.1) {
            character.velocityX = 0;
        }

        if (character.attackCooldown > 0) {
            character.attackCooldown -= deltaTime;
        }

        if (character.isAttacking) {
            character.attackFrame++;
            if (character.attackFrame > 30) {
                character.isAttacking = false;
                character.attackFrame = 0;
                character.attackType = null;
            }
        }

        if (character.isHurt) {
            character.hurtFrame++;
            if (character.hurtFrame > 20) {
                character.isHurt = false;
                character.hurtFrame = 0;
            }
        }

        if (character.isInvincible) {
            character.invincibleFrame++;
            if (character.invincibleFrame > 60) {
                character.isInvincible = false;
                character.invincibleFrame = 0;
            }
        }
    }

    function takeDamage(character, damage) {
        if (character.isInvincible) return 0;
        
        const actualDamage = Math.max(1, damage - character.defense);
        character.health -= actualDamage;
        character.isHurt = true;
        character.hurtFrame = 0;
        character.isInvincible = true;
        character.invincibleFrame = 0;

        if (character.health <= 0) {
            character.health = 0;
        }

        return actualDamage;
    }

    function addEnergy(character, amount) {
        character.energy = Math.min(character.maxEnergy, character.energy + amount);
    }

    function canUseUltimate(character) {
        return character.energy >= character.maxEnergy;
    }

    return {
        createCharacter,
        getCharacterData,
        updateCharacter,
        takeDamage,
        addEnergy,
        canUseUltimate
    };
})();
