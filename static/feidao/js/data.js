const GameData = {
    getInitialState: function() {
        return {
            gameStatus: 'menu',
            currentScene: 'street',
            currentLevel: 1,
            score: 0,
            totalScore: 0,
            highScore: 0,
            knivesLeft: GameConfig.INITIAL_KNIVES,
            currentKnifeType: 'normal',
            throwStrength: 'medium',
            angle: 45,
            power: 50,
            isCharging: false,
            chargeStartTime: 0,
            knives: [],
            targets: [],
            obstacles: [],
            particles: [],
            fireworks: [],
            dustParticles: [],
            unlockedScenes: ['street'],
            selectedKnife: 'normal',
            unlockedKnives: ['normal'],
            targetState: 'static',
            round: 1,
            targetHits: 0
        };
    },

    getSceneConfig: function(sceneId) {
        const scenes = Object.values(GameConfig.SCENES);
        return scenes.find(s => s.id === sceneId) || GameConfig.SCENES.STREET;
    },

    getKnifeConfig: function(knifeId) {
        const knives = Object.values(GameConfig.KNIFE_TYPES);
        return knives.find(k => k.id === knifeId) || GameConfig.KNIFE_TYPES.NORMAL;
    },

    getThrowConfig: function(strengthId) {
        const strengths = Object.values(GameConfig.THROW_STRENGTH);
        return strengths.find(s => s.id === strengthId) || GameConfig.THROW_STRENGTH.MEDIUM;
    },

    getTargetScoreZones: function() {
        return [
            { radius: 15, score: 50, color: '#FFD700', name: '靶心' },
            { radius: 30, score: 30, color: '#FF4500', name: '内圈' },
            { radius: 45, score: 20, color: '#FF6347', name: '中圈' },
            { radius: 60, score: 10, color: '#FFFFFF', name: '外圈' }
        ];
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameData;
}
