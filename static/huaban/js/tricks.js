const Tricks = (function() {
    const TRICK_TYPES = {
        OLLIE: {
            id: 'ollie',
            name: '豚跳',
            baseScore: 50,
            rotationBonus: 10,
            description: '基础跳跃',
            difficulty: 1
        },
        KICKFLIP: {
            id: 'kickflip',
            name: '踢翻',
            baseScore: 100,
            rotationBonus: 20,
            description: '滑板横向旋转',
            difficulty: 2
        },
        HEELFLIP: {
            id: 'heelflip',
            name: '跟翻',
            baseScore: 100,
            rotationBonus: 20,
            description: '与踢翻方向相反',
            difficulty: 2
        },
        INDY_GRAB: {
            id: 'indy_grab',
            name: 'Indy抓板',
            baseScore: 80,
            rotationBonus: 15,
            description: '前手抓板',
            difficulty: 2
        },
        MELON_GRAB: {
            id: 'melon_grab',
            name: 'Melon抓板',
            baseScore: 80,
            rotationBonus: 15,
            description: '后手抓板',
            difficulty: 2
        },
        FLIP_360: {
            id: '360_flip',
            name: '360度翻转',
            baseScore: 200,
            rotationBonus: 30,
            description: '高难度组合技',
            difficulty: 3
        },
        SPIN: {
            id: 'spin',
            name: '空中转体',
            baseScore: 30,
            rotationBonus: 10,
            description: '空中旋转',
            difficulty: 1
        },
        GRIND: {
            id: 'grind',
            name: '磨板',
            baseScore: 10,
            rotationBonus: 0,
            description: '在栏杆上滑行',
            difficulty: 2,
            isContinuous: true
        }
    };
    
    let activeTricks = [];
    let currentCombo = 0;
    let comboMultiplier = 1;
    let totalRotation = 0;
    let lastRotation = 0;
    
    function init() {
        activeTricks = [];
        currentCombo = 0;
        comboMultiplier = 1;
        totalRotation = 0;
        lastRotation = 0;
    }
    
    function startTrick(trickType, player) {
        if (!player.isJumping || player.isGrinding) return null;
        
        const trick = {
            ...trickType,
            startTime: Date.now(),
            startRotation: player.rotation,
            rotation: 0,
            completed: false,
            failed: false
        };
        
        const existing = activeTricks.find(t => t.id === trick.id);
        if (!existing) {
            activeTricks.push(trick);
        }
        
        return trick;
    }
    
    function startGrind(rail) {
        const trick = {
            ...TRICK_TYPES.GRIND,
            startTime: Date.now(),
            rail: rail,
            score: 0,
            completed: false
        };
        activeTricks.push(trick);
        return trick;
    }
    
    function updateTricks(player, deltaTime) {
        const currentRotation = player.rotation;
        let rotationDelta = currentRotation - lastRotation;
        
        if (rotationDelta > Math.PI) rotationDelta -= Math.PI * 2;
        if (rotationDelta < -Math.PI) rotationDelta += Math.PI * 2;
        
        totalRotation += Math.abs(rotationDelta);
        lastRotation = currentRotation;
        
        for (const trick of activeTricks) {
            if (!trick.completed && !trick.failed) {
                if (trick.isContinuous) {
                    trick.score += trick.baseScore * deltaTime * 0.06;
                } else {
                    trick.rotation = Math.abs(currentRotation - trick.startRotation);
                }
            }
        }
        
        if (Math.abs(rotationDelta) > 0.05 && !hasTrickType('spin')) {
            const spinTrick = {
                ...TRICK_TYPES.SPIN,
                startTime: Date.now(),
                startRotation: player.rotation,
                rotation: 0,
                completed: false,
                failed: false
            };
            activeTricks.push(spinTrick);
        }
    }
    
    function hasTrickType(trickId) {
        return activeTricks.some(t => t.id === trickId && !t.completed && !t.failed);
    }
    
    function completeTricks(player, landingQuality) {
        let totalScore = 0;
        const completedTricks = [];
        
        for (const trick of activeTricks) {
            if (!trick.completed && !trick.failed) {
                trick.completed = true;
                trick.endTime = Date.now();
                
                let trickScore = trick.baseScore || 0;
                
                if (trick.rotation !== undefined) {
                    const rotationDegrees = (trick.rotation * 180) / Math.PI;
                    const rotationUnits = Math.floor(Math.abs(rotationDegrees) / 90);
                    trickScore += rotationUnits * trick.rotationBonus;
                }
                
                if (trick.isContinuous && trick.score) {
                    trickScore = Math.floor(trick.score);
                }
                
                if (landingQuality) {
                    trickScore *= landingQuality.scoreMultiplier || 1;
                }
                
                trickScore = Math.floor(trickScore * comboMultiplier);
                
                trick.finalScore = trickScore;
                totalScore += trickScore;
                completedTricks.push(trick);
            }
        }
        
        if (completedTricks.length > 0) {
            currentCombo++;
            comboMultiplier = 1 + (currentCombo - 1) * 0.2;
        }
        
        activeTricks = activeTricks.filter(t => !t.completed);
        
        return {
            score: totalScore,
            tricks: completedTricks,
            combo: currentCombo,
            comboMultiplier: comboMultiplier
        };
    }
    
    function failTricks() {
        const failedTricks = [...activeTricks];
        activeTricks = [];
        resetCombo();
        return failedTricks;
    }
    
    function resetCombo() {
        currentCombo = 0;
        comboMultiplier = 1;
        totalRotation = 0;
        lastRotation = 0;
    }
    
    function endGrind() {
        let score = 0;
        const grindTricks = activeTricks.filter(t => t.id === 'grind');
        
        for (const trick of grindTricks) {
            trick.completed = true;
            score += Math.floor(trick.score || 0);
            activeTricks = activeTricks.filter(t => t !== trick);
        }
        
        if (score > 0) {
            currentCombo++;
            comboMultiplier = 1 + (currentCombo - 1) * 0.2;
        }
        
        return score;
    }
    
    function getCurrentCombo() {
        return currentCombo;
    }
    
    function getComboMultiplier() {
        return comboMultiplier;
    }
    
    function getActiveTricks() {
        return [...activeTricks];
    }
    
    function getTotalRotation() {
        return totalRotation;
    }
    
    function calculateTrickScore(trick, landingQuality = { scoreMultiplier: 1 }) {
        let score = trick.baseScore;
        
        if (trick.rotation) {
            const rotationDegrees = (trick.rotation * 180) / Math.PI;
            const rotationUnits = Math.floor(Math.abs(rotationDegrees) / 90);
            score += rotationUnits * trick.rotationBonus;
        }
        
        score *= landingQuality.scoreMultiplier;
        score *= comboMultiplier;
        
        return Math.floor(score);
    }
    
    function getAllTrickTypes() {
        return { ...TRICK_TYPES };
    }
    
    function getTrickById(id) {
        return TRICK_TYPES[id.toUpperCase()] || null;
    }
    
    return {
        TRICK_TYPES,
        init,
        startTrick,
        startGrind,
        updateTricks,
        completeTricks,
        failTricks,
        resetCombo,
        endGrind,
        getCurrentCombo,
        getComboMultiplier,
        getActiveTricks,
        getTotalRotation,
        calculateTrickScore,
        getAllTrickTypes,
        getTrickById,
        hasTrickType
    };
})();
