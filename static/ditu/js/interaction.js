const Interaction = {
    map: null,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    isPinging: false,
    pinchStartDistance: 0,
    onClickCallback: null,

    init(mapRenderer, onClickCallback) {
        this.map = mapRenderer;
        this.onClickCallback = onClickCallback;
        this.setupMouseEvents();
        this.setupTouchEvents();
        this.setupKeyboardEvents();
    },

    setupMouseEvents() {
        const canvas = this.map.canvas;

        canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            canvas.style.cursor = 'grabbing';
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const province = this.map.getProvinceAt(x, y);
            this.map.highlightedProvince = province ? province.id : null;

            if (this.isDragging) {
                const dx = e.clientX - this.lastX;
                const dy = e.clientY - this.lastY;
                this.map.pan(dx, dy);
                this.lastX = e.clientX;
                this.lastY = e.clientY;
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            if (this.isDragging) {
                const dx = Math.abs(e.clientX - this.lastX);
                const dy = Math.abs(e.clientY - this.lastY);
                if (dx < 5 && dy < 5) {
                    this.handleClick(e);
                }
            }
            this.isDragging = false;
            canvas.style.cursor = 'grab';
        });

        canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.map.highlightedProvince = null;
            canvas.style.cursor = 'grab';
        });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.map.zoom(-Math.sign(e.deltaY), x, y);
        });
    },

    setupTouchEvents() {
        const canvas = this.map.canvas;

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length === 1) {
                this.isDragging = true;
                this.lastX = e.touches[0].clientX;
                this.lastY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                this.isPinging = true;
                this.pinchStartDistance = this.getTouchDistance(e.touches);
            }
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isPinging && e.touches.length === 2) {
                const currentDistance = this.getTouchDistance(e.touches);
                const delta = currentDistance - this.pinchStartDistance;
                const rect = canvas.getBoundingClientRect();
                const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
                const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
                this.map.zoom(Math.sign(delta) * 0.5, centerX, centerY);
                this.pinchStartDistance = currentDistance;
            } else if (this.isDragging && e.touches.length === 1) {
                const dx = e.touches[0].clientX - this.lastX;
                const dy = e.touches[0].clientY - this.lastY;
                this.map.pan(dx, dy);
                this.lastX = e.touches[0].clientX;
                this.lastY = e.touches[0].clientY;
            }
        });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (e.touches.length === 0 && !this.isPinging) {
                const dx = Math.abs(e.changedTouches[0].clientX - this.lastX);
                const dy = Math.abs(e.changedTouches[0].clientY - this.lastY);
                if (dx < 10 && dy < 10) {
                    this.handleClick(e.changedTouches[0]);
                }
            }
            this.isDragging = false;
            this.isPinging = false;
        });
    },

    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Alt' && this.onClickCallback) {
                e.preventDefault();
                this.onClickCallback('hint');
            }
        });
    },

    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    },

    handleClick(e) {
        const rect = this.map.canvas.getBoundingClientRect();
        const x = (e.clientX || e.pageX) - rect.left;
        const y = (e.clientY || e.pageY) - rect.top;

        const province = this.map.getProvinceAt(x, y);
        if (province && this.onClickCallback) {
            this.onClickCallback(province);
            Sound.playClick();
        }
    }
};
