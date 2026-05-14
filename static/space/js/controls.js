const Controls = (function() {
    const { Vector3 } = Engine3D;

    class OrbitControls {
        constructor(camera, canvas) {
            this.camera = camera;
            this.canvas = canvas;
            
            this.angleX = 0.3;
            this.angleY = 0;
            this.distance = 300;
            this.target = new Vector3(0, 0, 0);
            
            this.minDistance = 150;
            this.maxDistance = 600;
            this.minPolarAngle = -Math.PI / 2 + 0.1;
            this.maxPolarAngle = Math.PI / 2 - 0.1;
            
            this.isDragging = false;
            this.lastX = 0;
            this.lastY = 0;
            
            this.zoomLevel = 1.0;
            
            this.initEventListeners();
            this.updateCamera();
        }

        initEventListeners() {
            this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
            this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
            this.canvas.addEventListener('mouseup', () => this.onMouseUp());
            this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
            this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
            
            this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
            this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
            this.canvas.addEventListener('touchend', () => this.onTouchEnd());
            
            document.addEventListener('keydown', (e) => this.onKeyDown(e));
        }

        onMouseDown(e) {
            this.isDragging = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        }

        onMouseMove(e) {
            if (!this.isDragging) return;
            
            const deltaX = e.clientX - this.lastX;
            const deltaY = e.clientY - this.lastY;
            
            this.angleY += deltaX * 0.005;
            this.angleX += deltaY * 0.005;
            
            this.angleX = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.angleX));
            
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            
            this.updateCamera();
        }

        onMouseUp() {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        }

        onWheel(e) {
            e.preventDefault();
            
            const delta = e.deltaY > 0 ? 1.1 : 0.9;
            this.zoomLevel *= delta;
            this.zoomLevel = Math.max(0.5, Math.min(2.0, this.zoomLevel));
            
            this.distance = 300 / this.zoomLevel;
            this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
            
            this.updateCamera();
        }

        onTouchStart(e) {
            if (e.touches.length === 1) {
                e.preventDefault();
                this.isDragging = true;
                this.lastX = e.touches[0].clientX;
                this.lastY = e.touches[0].clientY;
            }
        }

        onTouchMove(e) {
            if (!this.isDragging || e.touches.length !== 1) return;
            e.preventDefault();
            
            const deltaX = e.touches[0].clientX - this.lastX;
            const deltaY = e.touches[0].clientY - this.lastY;
            
            this.angleY += deltaX * 0.005;
            this.angleX += deltaY * 0.005;
            
            this.angleX = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.angleX));
            
            this.lastX = e.touches[0].clientX;
            this.lastY = e.touches[0].clientY;
            
            this.updateCamera();
        }

        onTouchEnd() {
            this.isDragging = false;
        }

        onKeyDown(e) {
            const rotateSpeed = 0.05;
            const zoomSpeed = 0.1;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.angleY -= rotateSpeed;
                    break;
                case 'ArrowRight':
                    this.angleY += rotateSpeed;
                    break;
                case 'ArrowUp':
                    this.angleX = Math.max(this.minPolarAngle, this.angleX - rotateSpeed);
                    break;
                case 'ArrowDown':
                    this.angleX = Math.min(this.maxPolarAngle, this.angleX + rotateSpeed);
                    break;
                case '+':
                case '=':
                    this.zoomLevel = Math.min(2.0, this.zoomLevel + zoomSpeed);
                    this.distance = 300 / this.zoomLevel;
                    break;
                case '-':
                case '_':
                    this.zoomLevel = Math.max(0.5, this.zoomLevel - zoomSpeed);
                    this.distance = 300 / this.zoomLevel;
                    break;
                case 'r':
                case 'R':
                    this.reset();
                    break;
            }
            
            this.updateCamera();
        }

        updateCamera() {
            const x = this.distance * Math.sin(this.angleY) * Math.cos(this.angleX);
            const y = this.distance * Math.sin(this.angleX);
            const z = this.distance * Math.cos(this.angleY) * Math.cos(this.angleX);
            
            this.camera.position = new Vector3(x, y, z);
        }

        reset() {
            this.angleX = 0.3;
            this.angleY = 0;
            this.distance = 300;
            this.zoomLevel = 1.0;
            this.updateCamera();
        }

        setZoomLevel(level) {
            this.zoomLevel = level;
            this.distance = 300 / this.zoomLevel;
            this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
            this.updateCamera();
        }

        getState() {
            return {
                angleX: this.angleX,
                angleY: this.angleY,
                distance: this.distance,
                zoomLevel: this.zoomLevel
            };
        }

        setState(state) {
            if (state.angleX !== undefined) this.angleX = state.angleX;
            if (state.angleY !== undefined) this.angleY = state.angleY;
            if (state.distance !== undefined) this.distance = state.distance;
            if (state.zoomLevel !== undefined) this.zoomLevel = state.zoomLevel;
            this.updateCamera();
        }
    }

    return OrbitControls;
})();
