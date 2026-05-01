const Lottery = {
    getFortuneLevelBySeed(seed) {
        const totalProbability = FortuneData.fortuneLevels.reduce((sum, level) => sum + level.probability, 0);
        const randomValue = (seed % totalProbability);
        
        let cumulative = 0;
        for (const level of FortuneData.fortuneLevels) {
            cumulative += level.probability;
            if (randomValue < cumulative) {
                return level;
            }
        }
        
        return FortuneData.fortuneLevels[0];
    },

    getDeterministicIndex(seed, arrayLength, offset = 0) {
        const value = Math.abs(seed + offset);
        return value % arrayLength;
    },

    generateDailyFortune() {
        const today = Storage.getTodayString();
        const seed = Storage.getDateSeed(today);
        
        const level = this.getFortuneLevelBySeed(seed);
        
        const texts = FortuneData.fortuneTexts[level.id];
        const textIndex = this.getDeterministicIndex(seed, texts.length, 1000);
        const fortuneText = texts[textIndex];
        
        return this.buildFortuneData(level, fortuneText, seed);
    },

    generateManualFortune() {
        const randomSeed = Math.floor(Math.random() * 1000000);
        
        const level = this.getRandomFortuneLevel();
        
        const texts = FortuneData.fortuneTexts[level.id];
        const textIndex = Math.floor(Math.random() * texts.length);
        const fortuneText = texts[textIndex];
        
        return this.buildFortuneData(level, fortuneText, randomSeed);
    },

    getRandomFortuneLevel() {
        const totalProbability = FortuneData.fortuneLevels.reduce((sum, level) => sum + level.probability, 0);
        let randomValue = Math.random() * totalProbability;
        
        let cumulative = 0;
        for (const level of FortuneData.fortuneLevels) {
            cumulative += level.probability;
            if (randomValue < cumulative) {
                return level;
            }
        }
        
        return FortuneData.fortuneLevels[0];
    },

    buildFortuneData(level, fortuneText, seed) {
        return {
            level: {
                id: level.id,
                name: level.name,
                displayName: level.displayName,
                colors: level.colors,
                bgColors: level.bgColors,
                description: level.description,
                probability: level.probability
            },
            text: fortuneText.text,
            interpretation: fortuneText.interpretation,
            luckyNumbers: FortuneData.getRandomLuckyNumbers(seed),
            luckyColors: FortuneData.getRandomLuckyColors(seed + 1),
            luckyDirection: FortuneData.getRandomLuckyDirection(seed + 2),
            luckyConstellations: FortuneData.getRandomLuckyConstellations(seed + 3),
            luckyItems: FortuneData.getRandomLuckyItems(seed + 4),
            suggestion: FortuneData.getRandomSuggestion(level.id, seed + 5),
            note: FortuneData.getRandomNote(level.id, seed + 6)
        };
    },

    getOrCreateDailyFortune() {
        const saved = Storage.loadFortune();
        
        if (saved && saved.date === Storage.getTodayString()) {
            return saved.fortune;
        }
        
        const fortune = this.generateDailyFortune();
        Storage.saveFortune(fortune, false);
        return fortune;
    },

    drawManualFortune() {
        const fortune = this.generateManualFortune();
        Storage.saveFortune(fortune, true);
        Storage.saveHistory(fortune);
        return fortune;
    },

    canDrawManual() {
        return true;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Lottery;
}
