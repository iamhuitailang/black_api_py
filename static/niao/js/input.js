class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.jumpCallback = null;
        this.pauseCallback = null;
        this.isInitialized = false;
    }
    
    init(jumpCallback, pauseCallback) {
        if (this.isInitialized) return;
        
        this.jumpCallback = jumpCallback;
        this.pauseCallback = pauseCallback;
        
        this.bindKeyboardEvents();
        this.bindTouchEvents();
        this.bindMouseEvents();
        
        this.isInitialized = true;
    }
    
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                e.preventDefault();
                if (this.jumpCallback) {
                    this.jumpCallback();
                }
            }
            if (e.code === 'Escape' || e.code === 'KeyP') {
                e.preventDefault();
                if (this.pauseCallback) {
                    this.pauseCallback();
                }
            }
        });
    }
    
    bindTouchEvents() {
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.jumpCallback) {
                this.jumpCallback();
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
    
    bindMouseEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                e.preventDefault();
                if (this.jumpCallback) {
                    this.jumpCallback();
                }
            }
        });
    }
    
    destroy() {
        this.jumpCallback = null;
        this.pauseCallback = null;
        this.isInitialized = false;
    }
}
