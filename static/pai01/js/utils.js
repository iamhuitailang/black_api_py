const Utils = {
    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    formatTimeLimit(seconds) {
        if (seconds <= 0) return '0s';
        return `${seconds}s`;
    },
    
    getRandomColor() {
        return CONSTANTS.COLORS[Math.floor(Math.random() * CONSTANTS.COLORS.length)];
    },
    
    getRandomShape() {
        return CONSTANTS.SHAPES[Math.floor(Math.random() * CONSTANTS.SHAPES.length)];
    },
    
    generateCardPairs(count) {
        const pairs = [];
        const usedColors = new Set();
        const usedShapes = new Set();
        
        for (let i = 0; i < count; i++) {
            let color, shape;
            do {
                color = this.getRandomColor();
            } while (usedColors.has(color) && usedColors.size < CONSTANTS.COLORS.length);
            
            do {
                shape = this.getRandomShape();
            } while (usedShapes.has(shape) && usedShapes.size < CONSTANTS.SHAPES.length);
            
            usedColors.add(color);
            usedShapes.add(shape);
            
            pairs.push({
                id: i,
                color,
                shape,
                specialType: null
            });
        }
        
        return pairs;
    },
    
    addSpecialCards(cardPairs, specialCount) {
        const specialTypes = [
            CONSTANTS.CARD_TYPE.SHUFFLE,
            CONSTANTS.CARD_TYPE.PEEK,
            CONSTANTS.CARD_TYPE.FREEZE,
            CONSTANTS.CARD_TYPE.TRAP
        ];
        
        const availableIndices = cardPairs.map((_, idx) => idx);
        const shuffledIndices = this.shuffle(availableIndices);
        
        for (let i = 0; i < Math.min(specialCount, cardPairs.length, specialTypes.length); i++) {
            const pairIndex = shuffledIndices[i];
            cardPairs[pairIndex].specialType = specialTypes[i];
        }
        
        return cardPairs;
    },
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
};
