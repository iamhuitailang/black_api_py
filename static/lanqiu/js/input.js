const Input = {
    canvas: null,
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    power: 0,
    angle: 45,
    powerPercent: 0,
    onShoot: null,
    onSkill: null,
    onAimStart: null,
    onAimUpdate: null,
    onAimEnd: null,

    init: function(canvas) {
        this.canvas = canvas;
        this.bindEvents();
    },

    bindEvents: function() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    },

    handleMouseDown: function(e) {
        const pos = Utils.getMousePosition(this.canvas, e);
        this.startDrag(pos.x, pos.y);
    },

    handleMouseMove: function(e) {
        if (!this.isDragging) return;
        
        const pos = Utils.getMousePosition(this.canvas, e);
        this.updateDrag(pos.x, pos.y);
    },

    handleMouseUp: function(e) {
        if (!this.isDragging) return;
        
        const pos = Utils.getMousePosition(this.canvas, e);
        this.endDrag(pos.x, pos.y);
    },

    handleMouseLeave: function(e) {
        if (this.isDragging) {
            const pos = Utils.getMousePosition(this.canvas, e);
            this.endDrag(pos.x, pos.y);
        }
    },

    handleTouchStart: function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const pos = Utils.getMousePosition(this.canvas, touch);
        this.startDrag(pos.x, pos.y);
    },

    handleTouchMove: function(e) {
        e.preventDefault();
        if (!this.isDragging) return;
        
        const touch = e.touches[0];
        const pos = Utils.getMousePosition(this.canvas, touch);
        this.updateDrag(pos.x, pos.y);
    },

    handleTouchEnd: function(e) {
        e.preventDefault();
        if (!this.isDragging) return;
        
        this.endDrag(this.currentX, this.currentY);
    },

    handleKeyDown: function(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            if (this.onSkill) {
                this.onSkill();
            }
        }
    },

    startDrag: function(x, y) {
        this.isDragging = true;
        this.startX = x;
        this.startY = y;
        this.currentX = x;
        this.currentY = y;
        this.power = 0;
        this.angle = 45;
        this.powerPercent = 0;
        
        if (this.onAimStart) {
            this.onAimStart(x, y);
        }
    },

    updateDrag: function(x, y) {
        this.currentX = x;
        this.currentY = y;
        
        const dx = this.startX - x;
        const dy = this.startY - y;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.power = Utils.clamp(
            distance * CONSTANTS.PHYSICS.POWER_SCALE,
            CONSTANTS.PHYSICS.MIN_POWER,
            CONSTANTS.PHYSICS.MAX_POWER
        );
        
        this.powerPercent = ((this.power - CONSTANTS.PHYSICS.MIN_POWER) / 
                            (CONSTANTS.PHYSICS.MAX_POWER - CONSTANTS.PHYSICS.MIN_POWER)) * 100;
        
        if (dx > 0) {
            const angleRad = Math.atan2(dy, dx);
            let angleDeg = Utils.radiansToDegrees(angleRad);
            
            angleDeg = Utils.clamp(angleDeg, CONSTANTS.ANGLE.MIN, CONSTANTS.ANGLE.MAX);
            this.angle = angleDeg;
        } else {
            this.angle = 45;
        }
        
        if (this.onAimUpdate) {
            this.onAimUpdate({
                power: this.power,
                powerPercent: this.powerPercent,
                angle: this.angle,
                startX: this.startX,
                startY: this.startY,
                currentX: this.currentX,
                currentY: this.currentY
            });
        }
    },

    endDrag: function(x, y) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        if (this.power > CONSTANTS.PHYSICS.MIN_POWER + 2) {
            if (this.onShoot) {
                this.onShoot({
                    power: this.power,
                    powerPercent: this.powerPercent,
                    angle: this.angle
                });
            }
        }
        
        if (this.onAimEnd) {
            this.onAimEnd();
        }
    },

    isAiming: function() {
        return this.isDragging;
    },

    getAimData: function() {
        return {
            isDragging: this.isDragging,
            power: this.power,
            powerPercent: this.powerPercent,
            angle: this.angle,
            startX: this.startX,
            startY: this.startY,
            currentX: this.currentX,
            currentY: this.currentY
        };
    },

    reset: function() {
        this.isDragging = false;
        this.power = 0;
        this.angle = 45;
        this.powerPercent = 0;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Input;
}
