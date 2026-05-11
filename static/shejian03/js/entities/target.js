const Target = function(type, x, y, radius) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.hit = false;
    this.direction = 1;
    this.speed = 1;
    this.moveRange = 100;
};

Target.create = function(type, x, y, sizeMultiplier = 1) {
    const targetType = Constants.TARGET_TYPES[type.toUpperCase()];
    if (!targetType) return null;
    
    return new Target(
        type,
        x,
        y,
        targetType.radius * sizeMultiplier
    );
};

window.Target = Target;