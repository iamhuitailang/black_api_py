/**
 * 咯咯农场 - 随机事件系统
 * 负责随机事件的触发和效果处理
 */

const EventSystem = (function() {
    let eventListeners = [];
    
    function getCurrentTimePeriod(gameState) {
        if (!gameState || !gameState.timeSystem) {
            return TIME_PERIOD.DAY;
        }
        
        const dayDurationMs = secondsToMs(CONFIG.DAY_DURATION_SECONDS);
        const timeInCycle = gameState.timeSystem.elapsedTime % dayDurationMs;
        const percent = timeInCycle / dayDurationMs;
        
        if (percent >= CONFIG.NIGHT_START_PERCENT || percent < CONFIG.DAY_START_PERCENT) {
            return TIME_PERIOD.NIGHT;
        } else if (percent >= CONFIG.DAY_START_PERCENT && percent < CONFIG.DAY_START_PERCENT + 0.1) {
            return TIME_PERIOD.DAWN;
        } else if (percent >= CONFIG.NIGHT_START_PERCENT - 0.1 && percent < CONFIG.NIGHT_START_PERCENT) {
            return TIME_PERIOD.DUSK;
        } else {
            return TIME_PERIOD.DAY;
        }
    }
    
    function isNightTime(gameState) {
        const period = getCurrentTimePeriod(gameState);
        return period === TIME_PERIOD.NIGHT || period === TIME_PERIOD.DUSK;
    }
    
    function checkAndTriggerRandomEvent(gameState) {
        for (const event of RANDOM_EVENTS) {
            if (event.timeCondition) {
                const currentPeriod = getCurrentTimePeriod(gameState);
                if (currentPeriod !== event.timeCondition) {
                    continue;
                }
            }
            
            let probability = event.probability;
            
            if (event.id === 'weasel' && gameState.hasDog) {
                probability = probability * (1 - DOG_CONFIG.weaselReductionRate);
            }
            
            if (Math.random() < probability / 10) {
                return applyEvent(event, gameState);
            }
        }
        return null;
    }
    
    function applyEvent(event, gameState) {
        const result = {
            event: event,
            message: event.message,
            affected: null
        };
        
        const now = Date.now();
        
        switch (event.effect.type) {
            case 'multiply_lay':
                result.affected = '本次产蛋已翻倍';
                break;
                
            case 'lose_chickens':
                const minCount = event.effect.minCount || 1;
                const maxCount = event.effect.maxCount || 3;
                const actualMax = Math.min(maxCount, gameState.chickens.length);
                const countToLose = Math.floor(Math.random() * (actualMax - minCount + 1)) + minCount;
                
                if (countToLose > 0) {
                    const chickensToRemove = [];
                    const shuffled = [...gameState.chickens].sort(() => Math.random() - 0.5);
                    
                    for (let i = 0; i < countToLose && i < shuffled.length; i++) {
                        chickensToRemove.push(shuffled[i]);
                    }
                    
                    const idsToRemove = chickensToRemove.map(c => c.id);
                    gameState.chickens = gameState.chickens.filter(c => !idsToRemove.includes(c.id));
                    
                    result.message = event.message.replace('{count}', countToLose);
                    result.affected = `损失了 ${countToLose} 只鸡`;
                } else {
                    return null;
                }
                break;
                
            case 'reduce_production':
                const prodDuration = minutesToMs(event.effect.durationMinutes);
                gameState.activeEffects.push({
                    type: 'reduce_production',
                    value: event.effect.rate,
                    endTime: now + prodDuration,
                    eventId: event.id
                });
                result.affected = `产蛋速度 ${(1 - event.effect.rate) * 100}%，持续 ${event.effect.durationMinutes / 60} 小时`;
                break;
                
            case 'reduce_cost':
                const costDuration = minutesToMs(event.effect.durationMinutes);
                gameState.activeEffects.push({
                    type: 'reduce_cost',
                    value: event.effect.rate,
                    endTime: now + costDuration,
                    eventId: event.id
                });
                result.affected = `成本降低 ${event.effect.rate * 100}%，持续 ${event.effect.durationMinutes / 1440} 天`;
                break;
                
            case 'increase_egg_price':
                const priceDuration = minutesToMs(event.effect.durationMinutes);
                gameState.activeEffects.push({
                    type: 'increase_egg_price',
                    value: event.effect.multiplier,
                    endTime: now + priceDuration,
                    eventId: event.id
                });
                result.affected = `鸡蛋价格 +${(event.effect.multiplier - 1) * 100}%，持续 ${event.effect.durationMinutes / 60} 小时`;
                break;
                
            case 'free_chicken':
                const coop = getCoopTypeById(gameState.currentCoopId);
                if (gameState.chickens.length < coop.capacity) {
                    const chickenType = event.effect.chickenType || 'normal';
                    const chicken = ChickenManager.createChicken(chickenType);
                    gameState.chickens.push(chicken);
                    result.affected = `获得了1只 ${getChickenTypeById(chickenType).name}`;
                } else {
                    return null;
                }
                break;
        }
        
        notifyEventListeners(result);
        
        return result;
    }
    
    function getActiveEvents(gameState) {
        const now = Date.now();
        return gameState.activeEffects.filter(effect => effect.endTime > now);
    }
    
    function getEventTimeRemaining(effect) {
        const now = Date.now();
        return Math.max(0, effect.endTime - now);
    }
    
    function isEventActive(gameState, eventId) {
        const now = Date.now();
        return gameState.activeEffects.some(
            effect => effect.eventId === eventId && effect.endTime > now
        );
    }
    
    function addEventListener(callback) {
        eventListeners.push(callback);
    }
    
    function removeEventListener(callback) {
        eventListeners = eventListeners.filter(listener => listener !== callback);
    }
    
    function notifyEventListeners(eventResult) {
        for (const listener of eventListeners) {
            try {
                listener(eventResult);
            } catch (e) {
                console.error('事件监听器错误:', e);
            }
        }
    }
    
    function clearExpiredEvents(gameState) {
        const now = Date.now();
        gameState.activeEffects = gameState.activeEffects.filter(
            effect => effect.endTime > now
        );
    }
    
    return {
        checkAndTriggerRandomEvent,
        applyEvent,
        getActiveEvents,
        getEventTimeRemaining,
        isEventActive,
        addEventListener,
        removeEventListener,
        clearExpiredEvents,
        getCurrentTimePeriod,
        isNightTime
    };
})();
