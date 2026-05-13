const InputManager = {
    keys: {},
    mouse: { x: 0, y: 0, pressed: false, clicked: false },
    
    init() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Escape') {
                Game.togglePause();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.pressed = true;
                this.mouse.clicked = true;
            }
        });
        
        canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.pressed = false;
            }
        });
        
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    },
    
    isKeyPressed(key) {
        return this.keys[key] === true;
    },
    
    update() {
        this.mouse.clicked = false;
    }
};