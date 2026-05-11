const Bow = function(x, y) {
    this.x = x;
    this.y = y;
    this.currentArrowType = 'wood';
};

Bow.prototype.setArrowType = function(type) {
    this.currentArrowType = type;
};

Bow.prototype.getArrowType = function() {
    return this.currentArrowType;
};

Bow.prototype.shoot = function(angle, power) {
    const arrowType = Constants.ARROW_TYPES[this.currentArrowType.toUpperCase()];
    if (!arrowType) return null;
    
    return {
        x: this.x,
        y: this.y,
        type: this.currentArrowType,
        angle: angle,
        velocity: {
            x: Math.cos(angle) * power * arrowType.speedMultiplier,
            y: Math.sin(angle) * power * arrowType.speedMultiplier
        }
    };
};

window.Bow = Bow;