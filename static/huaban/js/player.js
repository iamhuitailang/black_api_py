const Player = (function() {
    const CHARACTERS = {
        beginner: {
            id: 'beginner',
            name: '街头新手',
            icon: '🛹',
            speed: 5,
            jumpHeight: 1,
            trickBonus: 1,
            landingBonus: 1,
            boostBonus: 1,
            unlockCondition: '初始角色',
            color: '#4CAF50'
        },
        speedster: {
            id: 'speedster',
            name: '速滑选手',
            icon: '⚡',
            speed: 6.5,
            jumpHeight: 0.85,
            trickBonus: 1,
            landingBonus: 1,
            boostBonus: 1.2,
            unlockCondition: '完成第2关',
            color: '#FF9800'
        },
        technician: {
            id: 'technician',
            name: '技术大师',
            icon: '🎯',
            speed: 5,
            jumpHeight: 1.15,
            trickBonus: 1.3,
            landingBonus: 1,
            boostBonus: 1,
            unlockCondition: '完成第5关',
            color: '#9C27B0'
        },
        balance: {
            id: 'balance',
            name: '平衡之王',
            icon: '⚖️',
            speed: 5,
            jumpHeight: 1,
            trickBonus: 1,
            landingBonus: 1.2,
            boostBonus: 1,
            unlockCondition: '完成10次完美落地',
            color: '#2196F3'
        },
        legend: {
            id: 'legend',
            name: '传奇滑手',
            icon: '👑',
            speed: 6,
            jumpHeight: 1.1,
            trickBonus: 1.1,
            landingBonus: 1.1,
            boostBonus: 1.1,
            unlockCondition: '困难难度通关',
            color: '#FFD700'
        }
    };
    
    function createPlayer(characterId, x, y) {
        const character = CHARACTERS[characterId] || CHARACTERS.beginner;
        
        return {
            x: x,
            y: y,
            width: 40,
            height: 60,
            vx: 0,
            vy: 0,
            speed: character.speed,
            baseSpeed: character.speed,
            maxSpeed: character.speed * 2,
            
            isGrounded: true,
            isJumping: false,
            isGrinding: false,
            isCrouching: false,
            isFalling: false,
            isDead: false,
            
            rotation: 0,
            angularVelocity: 0,
            
            jumpPower: 0,
            maxJumpPower: 12 * character.jumpHeight,
            jumpHoldTime: 0,
            maxJumpHoldTime: 300,
            
            boost: 0,
            maxBoost: 100,
            boostActive: false,
            boostTimer: 0,
            
            airTime: 0,
            jumpTime: 0,
            
            onRail: null,
            onPlatform: null,
            onRamp: null,
            rampAngle: 0,
            
            character: character,
            characterId: characterId,
            
            animationFrame: 0,
            animationTimer: 0,
            
            trick1Pressed: false,
            trick2Pressed: false,
            leftPressed: false,
            rightPressed: false,
            grindPressed: false,
            
            stunTimer: 0,
            invulnerableTimer: 0
        };
    }
    
    function update(player, deltaTime, input, physics) {
        if (player.isDead) return;
        
        if (player.stunTimer > 0) {
            player.stunTimer -= deltaTime;
            player.vx *= 0.95;
            player.vy *= 0.95;
            return;
        }
        
        if (player.invulnerableTimer > 0) {
            player.invulnerableTimer -= deltaTime;
        }
        
        if (player.boostActive) {
            player.boostTimer -= deltaTime;
            if (player.boostTimer <= 0) {
                player.boostActive = false;
                player.speed = player.baseSpeed;
            }
        }
        
        if (!player.isGrinding) {
            player.vx = player.speed;
        }
        
        if (player.leftPressed) {
            if (!player.isGrounded) {
                physics.addSpin(player, -1, 0.15);
            } else if (!player.isGrinding) {
                player.x -= 2;
            }
        }
        
        if (player.rightPressed) {
            if (!player.isGrounded) {
                physics.addSpin(player, 1, 0.15);
            } else if (!player.isGrinding) {
                player.x += 2;
            }
        }
        
        if (player.isJumping && player.jumpHoldTime > 0) {
            player.jumpHoldTime -= deltaTime;
            if (player.jumpHoldTime > 0 && player.vy < 0) {
                player.vy -= 0.3;
            }
        }
        
        physics.applyGravity(player, deltaTime / 16.67);
        physics.applyRotation(player, deltaTime / 16.67);
        physics.applyVelocity(player, deltaTime / 16.67);
        physics.updateAirTime(player, deltaTime);
        
        if (player.isGrounded) {
            player.rotation *= 0.9;
            if (Math.abs(player.rotation) < 0.05) {
                player.rotation = 0;
            }
        }
        
        if (player.isGrinding && player.onRail) {
            player.y = player.onRail.y - player.height;
            player.vy = 0;
            player.rotation = 0;
        }
        
        player.animationTimer += deltaTime;
        if (player.animationTimer > 100) {
            player.animationTimer = 0;
            player.animationFrame = (player.animationFrame + 1) % 4;
        }
    }
    
    function jump(player) {
        if (player.isGrounded || player.isGrinding) {
            const jumpPower = player.isCrouching ? player.maxJumpPower * 1.3 : player.maxJumpPower;
            physics.jump(player, jumpPower / 12);
            player.jumpHoldTime = player.maxJumpHoldTime;
            player.isCrouching = false;
            Tricks.init();
            return true;
        }
        return false;
    }
    
    function crouch(player, isCrouching) {
        if (player.isGrounded) {
            player.isCrouching = isCrouching;
            if (isCrouching) {
                player.height = 40;
            } else {
                player.height = 60;
            }
        }
    }
    
    function doTrick1(player) {
        if (!player.isGrounded && !player.isGrinding && player.isJumping) {
            if (player.leftPressed || player.rightPressed) {
                Tricks.startTrick(Tricks.TRICK_TYPES.MELON_GRAB, player);
            } else {
                Tricks.startTrick(Tricks.TRICK_TYPES.INDY_GRAB, player);
            }
            player.trick1Pressed = true;
            return true;
        }
        return false;
    }
    
    function doTrick2(player) {
        if (!player.isGrounded && !player.isGrinding && player.isJumping) {
            if (player.leftPressed) {
                Tricks.startTrick(Tricks.TRICK_TYPES.HEELFLIP, player);
            } else if (player.rightPressed) {
                Tricks.startTrick(Tricks.TRICK_TYPES.KICKFLIP, player);
            } else {
                Tricks.startTrick(Tricks.TRICK_TYPES.KICKFLIP, player);
            }
            player.trick2Pressed = true;
            
            if (player.trick1Pressed) {
                Tricks.startTrick(Tricks.TRICK_TYPES.FLIP_360, player);
            }
            return true;
        }
        return false;
    }
    
    function startGrind(player, rail) {
        if (!player.isGrinding) {
            player.isGrinding = true;
            player.onRail = rail;
            player.vy = 0;
            Tricks.startGrind(rail);
            return true;
        }
        return false;
    }
    
    function endGrind(player) {
        if (player.isGrinding) {
            const score = Tricks.endGrind();
            player.isGrinding = false;
            player.onRail = null;
            player.isGrounded = false;
            player.isJumping = true;
            player.vy = -5;
            return score;
        }
        return 0;
    }
    
    function land(player, landingQuality) {
        player.isGrounded = true;
        player.isJumping = false;
        player.airTime = 0;
        
        if (landingQuality.quality === 'fail') {
            player.stunTimer = 1500;
            player.speed = player.baseSpeed * 0.3;
            player.isFalling = true;
            Tricks.failTricks();
            return { success: false, score: 0 };
        } else {
            player.speed = player.baseSpeed;
            player.isFalling = false;
            
            if (landingQuality.quality === 'perfect') {
                Storage.addPerfectLanding();
            }
            
            const result = Tricks.completeTricks(player, landingQuality);
            const finalScore = Math.floor(result.score * player.character.trickBonus);
            
            return { success: true, score: finalScore, tricks: result.tricks, combo: result.combo };
        }
    }
    
    function hitObstacle(player) {
        if (player.invulnerableTimer > 0) return false;
        
        player.stunTimer = 2000;
        player.speed = player.baseSpeed * 0.2;
        player.vy = -8;
        player.isGrounded = false;
        player.isJumping = true;
        player.isFalling = true;
        player.invulnerableTimer = 1000;
        Tricks.failTricks();
        
        return true;
    }
    
    function addBoost(player, amount) {
        player.boost = Math.min(player.boost + amount, player.maxBoost);
    }
    
    function activateBoost(player) {
        if (player.boost >= player.maxBoost && !player.boostActive) {
            player.boost = 0;
            player.boostActive = true;
            player.boostTimer = 3000;
            player.speed = player.baseSpeed * 1.8;
            return true;
        }
        return false;
    }
    
    function draw(ctx, player, cameraX) {
        ctx.save();
        
        const screenX = player.x - cameraX;
        const centerX = screenX + player.width / 2;
        const centerY = player.y + player.height / 2;
        
        ctx.translate(centerX, centerY);
        ctx.rotate(player.rotation);
        
        if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        drawSkateboard(ctx, player);
        drawCharacter(ctx, player);
        
        ctx.restore();
    }
    
    function drawSkateboard(ctx, player) {
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.roundRect(-25, player.height / 2 - 8, 50, 12, 4);
        ctx.fill();
        
        ctx.fillStyle = '#D2691E';
        ctx.beginPath();
        ctx.roundRect(-23, player.height / 2 - 6, 46, 8, 3);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-18, player.height / 2 + 4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(18, player.height / 2 + 4, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(-18, player.height / 2 + 4, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(18, player.height / 2 + 4, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawCharacter(ctx, player) {
        const charColor = player.character.color;
        
        if (player.isCrouching) {
            ctx.fillStyle = charColor;
            ctx.beginPath();
            ctx.ellipse(0, 0, 18, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FFDAB9';
            ctx.beginPath();
            ctx.arc(0, -12, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#333';
            ctx.fillRect(-8, -5, 16, 3);
        } else {
            ctx.fillStyle = charColor;
            ctx.beginPath();
            ctx.roundRect(-12, -20, 24, 30, 5);
            ctx.fill();
            
            ctx.fillStyle = '#FFDAB9';
            ctx.beginPath();
            ctx.arc(0, -28, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(-4, -30, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(4, -30, 2, 0, Math.PI * 2);
            ctx.fill();
            
            const legOffset = player.isGrounded ? Math.sin(player.animationFrame * Math.PI / 2) * 3 : 5;
            
            ctx.fillStyle = '#333';
            ctx.fillRect(-10, 10, 6, 15 + legOffset);
            ctx.fillRect(4, 10, 6, 15 - legOffset);
            
            if (player.isJumping) {
                ctx.fillStyle = '#FFDAB9';
                ctx.fillRect(-18, -15, 6, 12);
                ctx.fillRect(12, -15, 6, 12);
            } else {
                ctx.fillStyle = '#FFDAB9';
                ctx.fillRect(-16, -15, 5, 15);
                ctx.fillRect(11, -15, 5, 15);
            }
        }
    }
    
    function getCharacter(id) {
        return CHARACTERS[id] || CHARACTERS.beginner;
    }
    
    function getAllCharacters() {
        return { ...CHARACTERS };
    }
    
    function getUnlockedCharacters() {
        const unlocked = Storage.get('unlockedCharacters') || ['beginner'];
        return unlocked.map(id => CHARACTERS[id]).filter(Boolean);
    }
    
    return {
        CHARACTERS,
        createPlayer,
        update,
        jump,
        crouch,
        doTrick1,
        doTrick2,
        startGrind,
        endGrind,
        land,
        hitObstacle,
        addBoost,
        activateBoost,
        draw,
        getCharacter,
        getAllCharacters,
        getUnlockedCharacters
    };
})();
