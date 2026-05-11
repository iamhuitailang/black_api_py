const Interaction = {
    canvas: null,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    camera: null,
    config: null,
    onChangeCallback: null,
    
    init(canvas, camera, config, onChangeCallback) {
        this.canvas = canvas;
        this.camera = camera;
        this.config = config;
        this.onChangeCallback = onChangeCallback;
        
        this.bindEvents();
    },
    
    bindEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', () => this.onMouseUp());
        
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        document.addEventListener('touchmove', (e) => this.onTouchMove(e));
        document.addEventListener('touchend', () => this.onMouseUp());
        
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
    },
    
    onMouseDown(e) {
        if (this.config.viewMode !== '3d') return;
        
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.canvas.style.cursor = 'grabbing';
    },
    
    onTouchStart(e) {
        if (this.config.viewMode !== '3d') return;
        if (e.touches.length !== 1) return;
        
        e.preventDefault();
        this.isDragging = true;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
    },
    
    onMouseMove(e) {
        if (!this.isDragging || this.config.viewMode !== '3d') return;
        
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;
        
        this.camera.rotationY += deltaX * 0.01;
        this.camera.rotationX += deltaY * 0.01;
        
        this.camera.rotationX = Utils.clamp(this.camera.rotationX, -Math.PI / 2, Math.PI / 2);
        
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        
        if (this.onChangeCallback) {
            this.onChangeCallback();
        }
    },
    
    onTouchMove(e) {
        if (!this.isDragging || this.config.viewMode !== '3d') return;
        if (e.touches.length !== 1) return;
        
        e.preventDefault();
        
        const deltaX = e.touches[0].clientX - this.lastMouseX;
        const deltaY = e.touches[0].clientY - this.lastMouseY;
        
        this.camera.rotationY += deltaX * 0.01;
        this.camera.rotationX += deltaY * 0.01;
        
        this.camera.rotationX = Utils.clamp(this.camera.rotationX, -Math.PI / 2, Math.PI / 2);
        
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
        
        if (this.onChangeCallback) {
            this.onChangeCallback();
        }
    },
    
    onMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    },
    
    onWheel(e) {
        if (this.config.viewMode !== '3d') return;
        
        e.preventDefault();
        
        const zoomSpeed = 0.001;
        this.camera.zoom += e.deltaY * zoomSpeed;
        
        this.camera.zoom = Utils.clamp(this.camera.zoom, 0.3, 3.0);
        
        if (this.onChangeCallback) {
            this.onChangeCallback();
        }
    },
    
    onKeyDown(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            this.config.display.autoRotate = !this.config.display.autoRotate;
            
            if (this.onChangeCallback) {
                this.onChangeCallback();
            }
        }
        
        if (this.config.viewMode !== '3d') return;
        
        const rotationSpeed = 0.05;
        const zoomSpeed = 0.1;
        
        switch (e.code) {
            case 'ArrowLeft':
                this.camera.rotationY -= rotationSpeed;
                break;
            case 'ArrowRight':
                this.camera.rotationY += rotationSpeed;
                break;
            case 'ArrowUp':
                if (e.shiftKey) {
                    this.camera.zoom += zoomSpeed;
                } else {
                    this.camera.rotationX -= rotationSpeed;
                }
                break;
            case 'ArrowDown':
                if (e.shiftKey) {
                    this.camera.zoom -= zoomSpeed;
                } else {
                    this.camera.rotationX += rotationSpeed;
                }
                break;
        }
        
        this.camera.rotationX = Utils.clamp(this.camera.rotationX, -Math.PI / 2, Math.PI / 2);
        this.camera.zoom = Utils.clamp(this.camera.zoom, 0.3, 3.0);
        
        if (this.onChangeCallback && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
            this.onChangeCallback();
        }
    },
    
    updateCamera(camera, config) {
        this.camera = camera;
        this.config = config;
    }
};
