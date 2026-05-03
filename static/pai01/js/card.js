class Card {
    constructor(id, pairId, color, shape, specialType = null) {
        this.id = id;
        this.pairId = pairId;
        this.color = color;
        this.shape = shape;
        this.specialType = specialType;
        this.state = CONSTANTS.CARD_STATE.FACE_DOWN;
        this.animationProgress = 0;
        this.isAnimating = false;
        this.owner = null;
        this.row = 0;
        this.col = 0;
    }
    
    static fromJSON(json) {
        const card = new Card(
            json.id,
            json.pairId,
            json.color,
            json.shape,
            json.specialType
        );
        card.state = json.state;
        card.owner = json.owner;
        card.row = json.row;
        card.col = json.col;
        return card;
    }
    
    toJSON() {
        return {
            id: this.id,
            pairId: this.pairId,
            color: this.color,
            shape: this.shape,
            specialType: this.specialType,
            state: this.state,
            owner: this.owner,
            row: this.row,
            col: this.col
        };
    }
    
    isFaceDown() {
        return this.state === CONSTANTS.CARD_STATE.FACE_DOWN;
    }
    
    isFaceUp() {
        return this.state === CONSTANTS.CARD_STATE.FACE_UP;
    }
    
    isMatched() {
        return this.state === CONSTANTS.CARD_STATE.MATCHED;
    }
    
    canFlip() {
        return this.isFaceDown() && !this.isAnimating;
    }
    
    flip() {
        if (this.isFaceDown()) {
            this.state = CONSTANTS.CARD_STATE.FACE_UP;
            this.isAnimating = true;
            return true;
        }
        return false;
    }
    
    flipBack() {
        if (this.isFaceUp()) {
            this.state = CONSTANTS.CARD_STATE.FACE_DOWN;
            this.isAnimating = true;
            return true;
        }
        return false;
    }
    
    match(playerIndex = null) {
        this.state = CONSTANTS.CARD_STATE.MATCHED;
        this.owner = playerIndex;
    }
    
    hasSpecialEffect() {
        return this.specialType !== null && this.specialType !== CONSTANTS.CARD_TYPE.NORMAL;
    }
    
    getSpecialTypeName() {
        if (!this.specialType) return null;
        return CONSTANTS.SPECIAL_CARD_NAMES[this.specialType] || null;
    }
    
    getSpecialEmoji() {
        if (!this.specialType) return null;
        return CONSTANTS.SPECIAL_CARD_EMOJIS[this.specialType] || null;
    }
}
