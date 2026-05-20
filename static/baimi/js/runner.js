const Runner = (() => {
    const opponentTypes = [
        {
            id: 'novice',
            name: '新手跑者',
            difficulty: 0.7,
            minTime: 13.5,
            maxTime: 15.0,
            startReaction: { min: 0.4, max: 0.7 },
            speedProfile: 'steady_slow',
            description: '起跑慢，匀速跑'
        },
        {
            id: 'amateur',
            name: '业余跑者',
            difficulty: 0.85,
            minTime: 12.0,
            maxTime: 13.5,
            startReaction: { min: 0.3, max: 0.5 },
            speedProfile: 'fade_late',
            description: '中等，后程掉速'
        },
        {
            id: 'professional',
            name: '职业选手',
            difficulty: 1.0,
            minTime: 11.0,
            maxTime: 12.0,
            startReaction: { min: 0.2, max: 0.35 },
            speedProfile: 'steady_fast',
            description: '起跑快，全程稳定'
        },
        {
            id: 'champion',
            name: '奥运冠军',
            difficulty: 1.15,
            minTime: 10.2,
            maxTime: 11.0,
            startReaction: { min: 0.15, max: 0.25 },
            speedProfile: 'sprint_burst',
            description: '极快，冲刺爆发'
        },
        {
            id: 'world_record',
            name: '世界纪录保持者',
            difficulty: 1.3,
            minTime: 9.8,
            maxTime: 10.2,
            startReaction: { min: 0.12, max: 0.2 },
            speedProfile: 'perfect',
            description: '完美起跑+冲刺'
        }
    ];

    const runnerColors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    const namePrefixes = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
    const nameSuffixes = ['明', '华', '强', '磊', '军', '洋', '勇', '杰', '涛', '超', '飞', '伟', '宁', '浩', '宇'];

    const generateChineseName = () => {
        const prefix = namePrefixes[Math.floor(Math.random() * namePrefixes.length)];
        const suffix = nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)];
        return prefix + suffix;
    };

    const createPlayer = (lane) => {
        return {
            id: 'player',
            name: '你',
            type: 'player',
            lane: lane,
            color: '#FFD700',
            position: 0,
            speed: 0,
            maxSpeed: 15,
            stamina: 100,
            isFinished: false,
            finishTime: null,
            reactionTime: null,
            hasStarted: false,
            clickTimes: [],
            isFalseStart: false
        };
    };

    const createOpponent = (type, lane, modeId = 'friendly') => {
        const opponentType = opponentTypes.find(t => t.id === type) || opponentTypes[0];
        const name = generateChineseName();
        
        let actualType = opponentType;
        if (modeId === 'olympic') {
            const strongTypes = ['professional', 'champion', 'world_record'];
            const weights = [0.4, 0.35, 0.25];
            const rand = Math.random();
            let cumulative = 0;
            let selectedType = strongTypes[0];
            for (let i = 0; i < weights.length; i++) {
                cumulative += weights[i];
                if (rand <= cumulative) {
                    selectedType = strongTypes[i];
                    break;
                }
            }
            actualType = opponentTypes.find(t => t.id === selectedType);
        } else if (modeId === 'tournament') {
            const types = ['amateur', 'professional', 'champion'];
            actualType = opponentTypes.find(t => t.id === types[Math.floor(Math.random() * types.length)]);
        }

        return {
            id: `opponent_${lane}_${Date.now()}_${Math.random()}`,
            name: name,
            type: 'opponent',
            opponentType: actualType.id,
            lane: lane,
            color: runnerColors[lane % runnerColors.length],
            position: 0,
            speed: 0,
            maxSpeed: 7 + actualType.difficulty * 2.0,
            stamina: 100,
            isFinished: false,
            finishTime: null,
            reactionTime: null,
            hasStarted: false,
            targetTime: actualType.minTime + Math.random() * (actualType.maxTime - actualType.minTime),
            startReaction: actualType.startReaction.min + Math.random() * (actualType.startReaction.max - actualType.startReaction.min),
            speedProfile: actualType.speedProfile,
            difficulty: actualType.difficulty,
            typeName: actualType.name,
            description: actualType.description,
            isFalseStart: false
        };
    };

    const createRandomOpponents = (count, modeId) => {
        const opponents = [];
        const availableTypes = modeId === 'olympic' 
            ? ['professional', 'champion', 'world_record']
            : modeId === 'tournament'
            ? ['amateur', 'professional', 'champion']
            : ['novice', 'amateur', 'professional'];

        for (let i = 0; i < count; i++) {
            const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            opponents.push(createOpponent(type, i + 1, modeId));
        }
        return opponents;
    };

    const getSpeedAtDistance = (opponent, distance, weatherMultiplier) => {
        const progress = distance / 100;
        let baseSpeed = opponent.maxSpeed;
        
        switch (opponent.speedProfile) {
            case 'steady_slow':
                baseSpeed *= 0.75;
                break;
            case 'steady_fast':
                baseSpeed *= 0.85;
                break;
            case 'fade_late':
                if (progress > 0.6) {
                    baseSpeed *= 0.8 - (progress - 0.6) * 0.4;
                } else {
                    baseSpeed *= 0.85;
                }
                break;
            case 'sprint_burst':
                if (progress < 0.3) {
                    baseSpeed *= 0.75 + progress * 0.5;
                } else if (progress > 0.85) {
                    baseSpeed *= 1.05;
                } else {
                    baseSpeed *= 0.9;
                }
                break;
            case 'perfect':
                if (progress < 0.2) {
                    baseSpeed *= 0.85 + progress * 0.4;
                } else if (progress > 0.75) {
                    baseSpeed *= 1.1;
                } else {
                    baseSpeed *= 0.95;
                }
                break;
        }
        
        return baseSpeed * weatherMultiplier;
    };

    const updateOpponent = (opponent, deltaTime, raceTime, weatherMultiplier) => {
        if (opponent.isFinished || opponent.isFalseStart) return;

        if (!opponent.hasStarted) {
            if (raceTime >= opponent.startReaction) {
                opponent.hasStarted = true;
                opponent.reactionTime = opponent.startReaction;
            }
            return;
        }

        const currentSpeed = getSpeedAtDistance(opponent, opponent.position, weatherMultiplier);
        opponent.speed = opponent.speed + (currentSpeed - opponent.speed) * 0.1;
        opponent.position += opponent.speed * deltaTime;

        if (opponent.position >= 100) {
            opponent.position = 100;
            opponent.isFinished = true;
            opponent.finishTime = raceTime;
        }
    };

    const updatePlayer = (player, deltaTime, raceTime, weatherMultiplier) => {
        if (player.isFinished || player.isFalseStart) return;

        if (!player.hasStarted) return;

        const now = Date.now();
        const recentClicks = player.clickTimes.filter(t => now - t < 400);
        const clickRate = recentClicks.length / 0.4;
        
        let targetSpeed = Math.min(clickRate * 2.8, player.maxSpeed);
        
        const staminaFactor = player.stamina / 100;
        targetSpeed *= (0.4 + staminaFactor * 0.6);
        
        targetSpeed *= weatherMultiplier;
        
        player.speed = player.speed + (targetSpeed - player.speed) * 0.15;
        
        player.position += player.speed * deltaTime;
        
        if (player.speed > 7) {
            player.stamina = Math.max(0, player.stamina - deltaTime * 8);
        } else if (player.speed < 5) {
            player.stamina = Math.min(100, player.stamina + deltaTime * 20);
        } else {
            player.stamina = Math.min(100, player.stamina + deltaTime * 10);
        }

        if (player.position >= 100) {
            player.position = 100;
            player.isFinished = true;
            player.finishTime = raceTime;
        }
    };

    const getOpponentType = (typeId) => {
        return opponentTypes.find(t => t.id === typeId) || opponentTypes[0];
    };

    const getAllOpponentTypes = () => {
        return [...opponentTypes];
    };

    return {
        createPlayer,
        createOpponent,
        createRandomOpponents,
        updateOpponent,
        updatePlayer,
        getOpponentType,
        getAllOpponentTypes
    };
})();
