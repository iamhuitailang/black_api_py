/**
 * 咯咯农场 - 鸡只管理模块
 * 负责鸡的生命周期管理：成长、产蛋、老化、淘汰
 */

const ChickenManager = (function() {
    function createChicken(typeId) {
        const chickenType = getChickenTypeById(typeId);
        const now = Date.now();
        
        return {
            id: generateId(),
            type: typeId,
            name: chickenType.name,
            status: CHICKEN_STATUS.CHICK,
            ageMs: 0,
            birthTime: now,
            lastLayTime: now,
            eggsLaid: 0,
            position: {
                x: Math.random() * 0.8 + 0.1,
                y: Math.random() * 0.6 + 0.2,
                targetX: null,
                targetY: null,
                moveStartTime: null
            },
            animation: {
                frame: 0,
                direction: 1,
                isMoving: false,
                action: 'idle'
            }
        };
    }
    
    function updateChicken(chicken, deltaTimeMs, gameState) {
        const chickenType = getChickenTypeById(chicken.type);
        const now = Date.now();
        
        chicken.ageMs += deltaTimeMs;
        
        const growthTimeMs = minutesToMs(chickenType.growthTimeMinutes);
        const seniorAgeMs = hoursToMs(CONFIG.SENIOR_AGE_HOURS);
        
        let newStatus = chicken.status;
        if (chicken.ageMs < growthTimeMs) {
            newStatus = CHICKEN_STATUS.CHICK;
        } else if (chicken.ageMs >= seniorAgeMs) {
            newStatus = CHICKEN_STATUS.SENIOR;
        } else {
            newStatus = CHICKEN_STATUS.ADULT;
        }
        
        chicken.status = newStatus;
        
        if (newStatus === CHICKEN_STATUS.ADULT || newStatus === CHICKEN_STATUS.SENIOR) {
            const result = checkLayEgg(chicken, chickenType, gameState, now);
            if (result.laidEgg) {
                return {
                    laidEgg: true,
                    eggCount: result.eggCount,
                    eggValue: chickenType.eggValue,
                    chicken: chicken
                };
            }
        }
        
        updateChickenMovement(chicken, deltaTimeMs);
        
        return {
            laidEgg: false,
            chicken: chicken
        };
    }
    
    function checkLayEgg(chicken, chickenType, gameState, now) {
        let layIntervalMs = secondsToMs(chickenType.layIntervalSeconds);
        
        if (chicken.status === CHICKEN_STATUS.SENIOR) {
            layIntervalMs = layIntervalMs / CONFIG.SENIOR_PRODUCTION_RATE;
        }
        
        const productionReduction = getActiveEffectValue(gameState, 'reduce_production');
        if (productionReduction > 0) {
            layIntervalMs = layIntervalMs / (1 - productionReduction);
        }
        
        const timeSinceLastLay = now - chicken.lastLayTime;
        
        if (timeSinceLastLay >= layIntervalMs) {
            chicken.lastLayTime = now;
            chicken.eggsLaid++;
            
            let eggCount = 1;
            
            const doubleYolkEvent = RANDOM_EVENTS.find(e => e.id === 'double_yolk');
            if (Math.random() < doubleYolkEvent.probability) {
                eggCount = 2;
            }
            
            return {
                laidEgg: true,
                eggCount: eggCount
            };
        }
        
        return {
            laidEgg: false
        };
    }
    
    function updateChickenMovement(chicken, deltaTimeMs) {
        if (!chicken.animation.isMoving) {
            if (Math.random() < 0.01) {
                chicken.position.targetX = Math.random() * 0.8 + 0.1;
                chicken.position.targetY = Math.random() * 0.6 + 0.2;
                chicken.position.moveStartTime = Date.now();
                chicken.animation.isMoving = true;
                
                if (chicken.position.targetX > chicken.position.x) {
                    chicken.animation.direction = 1;
                } else {
                    chicken.animation.direction = -1;
                }
                
                chicken.animation.action = 'walk';
            }
        } else {
            const moveDuration = 2000;
            const elapsed = Date.now() - chicken.position.moveStartTime;
            const progress = Math.min(elapsed / moveDuration, 1);
            
            if (progress < 1) {
                const startX = chicken.position.targetX - (chicken.position.targetX - chicken.position.x) * (1 - progress);
                const startY = chicken.position.targetY - (chicken.position.targetY - chicken.position.y) * (1 - progress);
                
                chicken.position.x = chicken.position.x + (chicken.position.targetX - chicken.position.x) * 0.05;
                chicken.position.y = chicken.position.y + (chicken.position.targetY - chicken.position.y) * 0.05;
            } else {
                chicken.position.x = chicken.position.targetX;
                chicken.position.y = chicken.position.targetY;
                chicken.animation.isMoving = false;
                chicken.animation.action = 'idle';
                chicken.position.targetX = null;
                chicken.position.targetY = null;
            }
        }
        
        chicken.animation.frame = (chicken.animation.frame + 0.1) % 2;
    }
    
    function slaughterChicken(chicken) {
        const chickenType = getChickenTypeById(chicken.type);
        const value = Math.floor(chickenType.price * CONFIG.SLAUGHTER_VALUE_RATE);
        return {
            chickenId: chicken.id,
            goldValue: value
        };
    }
    
    function isChickenSenior(chicken) {
        return chicken.status === CHICKEN_STATUS.SENIOR;
    }
    
    function getChickenGrowthProgress(chicken) {
        const chickenType = getChickenTypeById(chicken.type);
        const growthTimeMs = minutesToMs(chickenType.growthTimeMinutes);
        
        if (chicken.status === CHICKEN_STATUS.CHICK) {
            return Math.min(chicken.ageMs / growthTimeMs, 1);
        }
        return 1;
    }
    
    function getNextLayTimeRemaining(chicken) {
        const chickenType = getChickenTypeById(chicken.type);
        let layIntervalMs = secondsToMs(chickenType.layIntervalSeconds);
        
        if (chicken.status === CHICKEN_STATUS.SENIOR) {
            layIntervalMs = layIntervalMs / CONFIG.SENIOR_PRODUCTION_RATE;
        }
        
        const now = Date.now();
        const timeSinceLastLay = now - chicken.lastLayTime;
        const remaining = Math.max(0, layIntervalMs - timeSinceLastLay);
        
        return remaining;
    }
    
    function getActiveEffectValue(gameState, effectType) {
        const now = Date.now();
        for (const effect of gameState.activeEffects) {
            if (effect.type === effectType && effect.endTime > now) {
                return effect.value || 0;
            }
        }
        return 0;
    }
    
    function getChickensByStatus(chickens, status) {
        return chickens.filter(c => c.status === status);
    }
    
    function getChickensByType(chickens, typeId) {
        return chickens.filter(c => c.type === typeId);
    }
    
    function countEggsPerHour(chickens, gameState) {
        let totalEggsPerHour = 0;
        
        for (const chicken of chickens) {
            if (chicken.status === CHICKEN_STATUS.CHICK) {
                continue;
            }
            
            const chickenType = getChickenTypeById(chicken.type);
            let layIntervalMs = secondsToMs(chickenType.layIntervalSeconds);
            
            if (chicken.status === CHICKEN_STATUS.SENIOR) {
                layIntervalMs = layIntervalMs / CONFIG.SENIOR_PRODUCTION_RATE;
            }
            
            const laysPerHour = (60 * 60 * 1000) / layIntervalMs;
            totalEggsPerHour += laysPerHour;
        }
        
        return Math.floor(totalEggsPerHour);
    }
    
    function countGoldPerHour(chickens, gameState) {
        const eggsPerHour = countEggsPerHour(chickens, gameState);
        let eggValueMultiplier = 1;
        
        const eggPriceEffect = gameState.activeEffects.find(
            e => e.type === 'increase_egg_price' && e.endTime > Date.now()
        );
        if (eggPriceEffect) {
            eggValueMultiplier = eggPriceEffect.value || 1.5;
        }
        
        return Math.floor(eggsPerHour * CONFIG.EGG_PRICE * eggValueMultiplier);
    }
    
    return {
        createChicken,
        updateChicken,
        slaughterChicken,
        isChickenSenior,
        getChickenGrowthProgress,
        getNextLayTimeRemaining,
        getChickensByStatus,
        getChickensByType,
        countEggsPerHour,
        countGoldPerHour
    };
})();
