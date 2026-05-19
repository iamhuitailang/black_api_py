const Input = {
    keys: {},
    mouse: {
        x: 0,
        y: 0,
        worldX: 0,
        worldY: 0,
        down: false,
        clicked: false
    },
    canvas: null,
    camera: null,

    init(canvas, camera) {
        this.canvas = canvas;
        this.camera = camera;
        
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Escape'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
            this.mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
            this.updateMouseWorld();
        });

        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.down = true;
                this.mouse.clicked = true;
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.down = false;
            }
        });

        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    },

    updateMouseWorld() {
        if (this.camera) {
            this.mouse.worldX = this.mouse.x + this.camera.x;
            this.mouse.worldY = this.mouse.y + this.camera.y;
        }
    },

    isKeyDown(code) {
        return !!this.keys[code];
    },

    wasKeyPressed(code) {
        const pressed = !!this.keys[code];
        return pressed;
    },

    consumeClick() {
        const clicked = this.mouse.clicked;
        this.mouse.clicked = false;
        return clicked;
    },

    getMoveVector() {
        let dx = 0;
        let dy = 0;
        
        if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;
        
        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }
        
        return { x: dx, y: dy };
    },

    getWeaponSwitch() {
        if (this.keys['Digit1']) return 'pistol';
        if (this.keys['Digit2']) return 'rifle';
        if (this.keys['Digit3']) return 'shotgun';
        return null;
    },

    isReloadPressed() {
        return !!this.keys['KeyR'];
    },

    reset() {
        this.keys = {};
        this.mouse.down = false;
        this.mouse.clicked = false;
    }
};
