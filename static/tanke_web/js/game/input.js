const Input = {
    keys: {},
    mobileControls: {},
    keyDownHandlers: {},
    keyUpHandlers: {},

    init() {
        this.keys = {};
        this.mobileControls = {
            left: false,
            right: false,
            fire: false
        };

        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        this.initMobileControls();
    },

    initMobileControls() {
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        const btnFire = document.getElementById('btn-fire');

        if (btnLeft) {
            btnLeft.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobileControls.left = true;
            });
            btnLeft.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mobileControls.left = false;
            });
        }

        if (btnRight) {
            btnRight.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobileControls.right = true;
            });
            btnRight.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mobileControls.right = false;
            });
        }

        if (btnFire) {
            btnFire.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobileControls.fire = true;
            });
            btnFire.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mobileControls.fire = false;
            });
        }
    },

    handleKeyDown(e) {
        if (this.keys[e.code]) return;
        
        this.keys[e.code] = true;

        if (this.keyDownHandlers[e.code]) {
            this.keyDownHandlers[e.code](e);
        }

        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyP'].includes(e.code)) {
            e.preventDefault();
        }
    },

    handleKeyUp(e) {
        this.keys[e.code] = false;

        if (this.keyUpHandlers[e.code]) {
            this.keyUpHandlers[e.code](e);
        }
    },

    onKeyDown(code, handler) {
        this.keyDownHandlers[code] = handler;
    },

    onKeyUp(code, handler) {
        this.keyUpHandlers[code] = handler;
    },

    isKeyPressed(code) {
        return this.keys[code] === true;
    },

    isLeftPressed() {
        return this.isKeyPressed('ArrowLeft') || this.mobileControls.left;
    },

    isRightPressed() {
        return this.isKeyPressed('ArrowRight') || this.mobileControls.right;
    },

    isFirePressed() {
        return this.isKeyPressed('ArrowUp') || this.isKeyPressed('Space') || this.mobileControls.fire;
    },

    isPausePressed() {
        return this.isKeyPressed('KeyP');
    },

    clearPauseState() {
        this.keys['KeyP'] = false;
    },

    reset() {
        this.keys = {};
        this.mobileControls = {
            left: false,
            right: false,
            fire: false
        };
    }
};

window.Input = Input;
