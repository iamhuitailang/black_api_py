export class InputController {
    constructor() {
        this.keys = {};
        this.keyPressed = {};
        this.touchControls = {
            joystickX: 0,
            joystickY: 0,
            buttons: {}
        };
        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.keyPressed[e.code] = true;
            }
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keyPressed[e.code] = false;
        });

        this.initTouchControls();
    }

    initTouchControls() {
        const joystickBase = document.getElementById('joystickBase');
        const joystickHandle = document.getElementById('joystickHandle');
        
        if (!joystickBase || !joystickHandle) return;

        let joystickCenter = { x: 0, y: 0 };
        let isDragging = false;

        const updateJoystickCenter = () => {
            const rect = joystickBase.getBoundingClientRect();
            joystickCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        };

        joystickBase.addEventListener('touchstart', (e) => {
            e.preventDefault();
            updateJoystickCenter();
            isDragging = true;
        });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const dx = touch.clientX - joystickCenter.x;
            const dy = touch.clientY - joystickCenter.y;
            const maxDist = 35;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > maxDist) {
                const ratio = maxDist / dist;
                this.touchControls.joystickX = dx * ratio;
                this.touchControls.joystickY = dy * ratio;
            } else {
                this.touchControls.joystickX = dx;
                this.touchControls.joystickY = dy;
            }

            const handleX = (this.touchControls.joystickX / maxDist) * 35 + 60;
            const handleY = (this.touchControls.joystickY / maxDist) * 35 + 60;
            joystickHandle.style.left = handleX + 'px';
            joystickHandle.style.top = handleY + 'px';
        });

        document.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;
            this.touchControls.joystickX = 0;
            this.touchControls.joystickY = 0;
            joystickHandle.style.left = '50%';
            joystickHandle.style.top = '50%';
        });

        ['btnA', 'btnB', 'btnC', 'btnD', 'btnE'].forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.touchControls.buttons[btnId] = true;
                });
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.touchControls.buttons[btnId] = false;
                });
            }
        });
    }

    isKeyDown(code) {
        return this.keys[code] || false;
    }

    isKeyPressed(code) {
        const pressed = this.keyPressed[code];
        this.keyPressed[code] = false;
        return pressed || false;
    }

    getMoveDirection() {
        let dir = 0;
        if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) {
            dir = -1;
        }
        if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) {
            dir = 1;
        }
        
        if (Math.abs(this.touchControls.joystickX) > 10) {
            dir = this.touchControls.joystickX > 0 ? 1 : -1;
        }
        
        return dir;
    }

    isJump() {
        return this.isKeyPressed('KeyW') || 
               this.isKeyPressed('ArrowUp') || 
               this.touchControls.buttons['btnD_pressed'];
    }

    isLightAttack() {
        return this.isKeyPressed('KeyJ') || 
               this.touchControls.buttons['btnA_pressed'];
    }

    isHeavyAttack() {
        return this.isKeyPressed('KeyK') || 
               this.touchControls.buttons['btnB_pressed'];
    }

    isBlock() {
        return this.isKeyDown('KeyL') || 
               this.isKeyDown('ShiftLeft') || 
               this.isKeyDown('ShiftRight') ||
               this.touchControls.buttons['btnC'];
    }

    isUltimate() {
        return this.isKeyPressed('KeyU') || 
               this.isKeyPressed('Space') || 
               this.touchControls.buttons['btnE_pressed'];
    }

    update() {
        for (const key in this.keyPressed) {
            this.keyPressed[key] = false;
        }
        for (const btn in this.touchControls.buttons) {
            if (!this.touchControls.buttons[btn + '_prev']) {
                this.touchControls.buttons[btn + '_prev'] = false;
            }
            if (this.touchControls.buttons[btn] && !this.touchControls.buttons[btn + '_prev']) {
                this.touchControls.buttons[btn + '_pressed'] = true;
            } else {
                this.touchControls.buttons[btn + '_pressed'] = false;
            }
            this.touchControls.buttons[btn + '_prev'] = this.touchControls.buttons[btn];
        }
    }
}
