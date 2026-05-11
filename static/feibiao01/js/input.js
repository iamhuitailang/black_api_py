const InputManager = {
    init(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.isDragging = false;
        
        this.bindEvents();
    },
    
    bindEvents() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
        
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this));
        
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    },
    
    getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    },
    
    getTouchPos(event) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = event.touches[0] || event.changedTouches[0];
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    },
    
    handleMouseDown(event) {
        if (this.game.state.state !== GameConfig.GameState.PLAYING) return;
        if (this.game.state.dartState !== GameConfig.GameState.DART_READY) return;
        
        event.preventDefault();
        const pos = this.getMousePos(event);
        this.startDrag(pos);
    },
    
    handleMouseMove(event) {
        if (!this.isDragging) return;
        if (this.game.state.dartState !== GameConfig.GameState.DART_POWERING) return;
        
        event.preventDefault();
        const pos = this.getMousePos(event);
        this.updateDrag(pos);
    },
    
    handleMouseUp(event) {
        if (!this.isDragging) return;
        if (this.game.state.dartState !== GameConfig.GameState.DART_POWERING) return;
        
        event.preventDefault();
        this.endDrag();
    },
    
    handleTouchStart(event) {
        if (this.game.state.state !== GameConfig.GameState.PLAYING) return;
        if (this.game.state.dartState !== GameConfig.GameState.DART_READY) return;
        
        event.preventDefault();
        const pos = this.getTouchPos(event);
        this.startDrag(pos);
    },
    
    handleTouchMove(event) {
        if (!this.isDragging) return;
        if (this.game.state.dartState !== GameConfig.GameState.DART_POWERING) return;
        
        event.preventDefault();
        const pos = this.getTouchPos(event);
        this.updateDrag(pos);
    },
    
    handleTouchEnd(event) {
        if (!this.isDragging) return;
        if (this.game.state.dartState !== GameConfig.GameState.DART_POWERING) return;
        
        event.preventDefault();
        this.endDrag();
    },
    
    handleKeyDown(event) {
        if (event.key === 'Escape') {
            if (this.game.state.state === GameConfig.GameState.PLAYING) {
                this.game.pauseGame();
            } else if (this.game.state.state === GameConfig.GameState.PAUSED) {
                this.game.resumeGame();
            }
        }
        
        if (event.key === 'r' || event.key === 'R') {
            if (this.game.state.state === GameConfig.GameState.PLAYING || 
                this.game.state.state === GameConfig.GameState.PAUSED) {
                this.game.restartGame();
            }
        }
    },
    
    startDrag(pos) {
        const state = this.game.state;
        const baseX = this.canvas.width * 0.15;
        const baseY = this.canvas.height * 0.5;
        
        const distance = Physics.distance(pos.x, pos.y, baseX, baseY);
        
        if (distance < 100) {
            this.isDragging = true;
            state.dartState = GameConfig.GameState.DART_POWERING;
            state.pullStart = { x: pos.x, y: pos.y };
            state.pullCurrent = { x: pos.x, y: pos.y };
            state.pullDistance = 0;
            state.power = GameConfig.Dart.baseSpeed;
        }
    },
    
    updateDrag(pos) {
        const state = this.game.state;
        
        state.pullCurrent = { x: pos.x, y: pos.y };
        
        state.pullDistance = Physics.distance(
            state.pullStart.x, state.pullStart.y,
            state.pullCurrent.x, state.pullCurrent.y
        );
        
        state.power = Physics.calculatePower(state.pullDistance);
    },
    
    endDrag() {
        const state = this.game.state;
        
        this.isDragging = false;
        
        if (state.pullDistance > 20) {
            const baseX = this.canvas.width * 0.15;
            const baseY = this.canvas.height * 0.5;
            const targetX = this.game.state.target.x;
            const targetY = this.game.state.target.y;
            
            const dragDirection = {
                x: state.pullCurrent.x - state.pullStart.x,
                y: state.pullCurrent.y - state.pullStart.y
            };
            
            const baseToTarget = {
                x: targetX - baseX,
                y: targetY - baseY
            };
            
            const dotProduct = dragDirection.x * baseToTarget.x + dragDirection.y * baseToTarget.y;
            let angle;
            
            if (dotProduct <= 0) {
                angle = Math.atan2(
                    baseY - state.pullCurrent.y,
                    baseX - state.pullCurrent.x
                );
            } else {
                const oppositePoint = {
                    x: baseX - (state.pullCurrent.x - baseX),
                    y: baseY - (state.pullCurrent.y - baseY)
                };
                angle = Math.atan2(
                    targetY - oppositePoint.y,
                    targetX - oppositePoint.x
                );
            }
            
            const baseAngle = Math.atan2(targetY - baseY, targetX - baseX);
            const maxDeviation = Math.PI / 4;
            let angleDiff = angle - baseAngle;
            
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            if (Math.abs(angleDiff) > maxDeviation) {
                angle = baseAngle + (angleDiff > 0 ? maxDeviation : -maxDeviation);
            }
            
            Physics.launchDart(
                state.dart,
                baseX,
                baseY,
                angle,
                state.power
            );
            
            state.dartState = GameConfig.GameState.DART_FLYING;
            this.game.saveState();
        } else {
            state.dartState = GameConfig.GameState.DART_READY;
            state.pullDistance = 0;
            state.power = GameConfig.Dart.baseSpeed;
        }
    }
};

if (typeof window !== 'undefined') {
    window.InputManager = InputManager;
}
