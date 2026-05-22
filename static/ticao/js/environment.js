const Environment = {
    currentEnvironment: null,

    init() {
        this.rollEnvironment();
    },

    rollEnvironment() {
        const random = Math.random();
        let cumulative = 0;
        
        for (const [key, env] of Object.entries(GameData.environments)) {
            cumulative += env.probability;
            if (random <= cumulative) {
                this.currentEnvironment = { ...env, key };
                return this.currentEnvironment;
            }
        }
        
        this.currentEnvironment = { ...GameData.environments.indoor, key: 'indoor' };
        return this.currentEnvironment;
    },

    getEnvironment() {
        return this.currentEnvironment;
    },

    getErrorRate() {
        if (!this.currentEnvironment) return 0;
        return this.currentEnvironment.errorBonus || 0;
    },

    isAffected() {
        if (!this.currentEnvironment) return false;
        return this.currentEnvironment.errorBonus > 0;
    },

    getEnvironmentName() {
        if (!this.currentEnvironment) return '室内';
        return this.currentEnvironment.name;
    },

    getEnvironmentEffect() {
        if (!this.currentEnvironment) return '无影响';
        return this.currentEnvironment.effect;
    },

    reset() {
        this.rollEnvironment();
    }
};
