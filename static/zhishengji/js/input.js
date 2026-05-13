class InputManager {
    constructor() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            rope: false
        };
        
        this.virtualJoystick = {
            left: { x: 0, y: 0 },
            right: { x: 0, y: 0 }
        };
        
        this.ropeButtonPressed = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        this.setupKeyboard();
        this.setupTouch();
    }

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.up = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = true;
                    break;
                case 'Space':
                    this.keys.rope = true;
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.up = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = false;
                    break;
                case 'Space':
                    this.keys.rope = false;
                    break;
            }
        });
    }

    setupTouch() {
        const leftJoystickBase = document.querySelector('.left-joystick .joystick-base');
        const rightJoystickBase = document.querySelector('.right-joystick .joystick-base');
        const ropeButton = document.getElementById('rope-btn');
        
        if (leftJoystickBase) {
            this.setupJoystick(leftJoystickBase, 'left');
        }
        
        if (rightJoystickBase) {
            this.setupJoystick(rightJoystickBase, 'right');
        }
        
        if (ropeButton) {
            ropeButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.ropeButtonPressed = true;
            });
            
            ropeButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.ropeButtonPressed = false;
            });
            
            ropeButton.addEventListener('mousedown', () => {
                this.ropeButtonPressed = true;
            });
            
            ropeButton.addEventListener('mouseup', () => {
                this.ropeButtonPressed = false;
            });
        }
    }

    setupJoystick(baseElement, side) {
        const handle = baseElement.querySelector('.joystick-handle');
        const baseRect = baseElement.getBoundingClientRect();
        const centerX = baseRect.width / 2;
        const centerY = baseRect.height / 2;
        const maxDistance = baseRect.width / 3;
        
        let isDragging = false;
        
        const handleStart = (clientX, clientY) => {
            isDragging = true;
            const rect = baseElement.getBoundingClientRect();
            const startX = rect.left + rect.width / 2;
            const startY = rect.top + rect.height / 2;
        };
        
        const handleMove = (clientX, clientY) => {
            if (!isDragging) return;
            
            const rect = baseElement.getBoundingClientRect();
            const currentX = clientX - rect.left;
            const currentY = clientY - rect.top;
            
            const dx = currentX - centerX;
            const dy = currentY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > maxDistance) {
                const ratio = maxDistance / distance;
                const clampedX = dx * ratio;
                const clampedY = dy * ratio;
                
                handle.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
                this.virtualJoystick[side].x = clampedX / maxDistance;
                this.virtualJoystick[side].y = clampedY / maxDistance;
            } else {
                handle.style.transform = `translate(${dx}px, ${dy}px)`;
                this.virtualJoystick[side].x = dx / maxDistance;
                this.virtualJoystick[side].y = dy / maxDistance;
            }
        };
        
        const handleEnd = () => {
            isDragging = false;
            handle.style.transform = 'translate(-50%, -50%)';
            this.virtualJoystick[side].x = 0;
            this.virtualJoystick[side].y = 0;
        };
        
        baseElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleStart(touch.clientX, touch.clientY);
        });
        
        baseElement.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
        });
        
        baseElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleEnd();
        });
        
        baseElement.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleStart(e.clientX, e.clientY);
        });
        
        document.addEventListener('mousemove', (e) => {
            handleMove(e.clientX, e.clientY);
        });
        
        document.addEventListener('mouseup', handleEnd);
    }

    getInput() {
        return {
            up: this.keys.up || this.virtualJoystick.right.y < -0.3,
            down: this.keys.down || this.virtualJoystick.right.y > 0.3,
            left: this.keys.left || this.virtualJoystick.left.x < -0.3,
            right: this.keys.right || this.virtualJoystick.left.x > 0.3,
            rope: this.keys.rope || this.ropeButtonPressed
        };
    }

    reset() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            rope: false
        };
        this.virtualJoystick.left.x = 0;
        this.virtualJoystick.left.y = 0;
        this.virtualJoystick.right.x = 0;
        this.virtualJoystick.right.y = 0;
        this.ropeButtonPressed = false;
    }
}