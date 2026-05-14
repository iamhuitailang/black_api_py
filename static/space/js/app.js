const App = (function() {
    const { Renderer } = Engine3D;
    const OrbitControls = Controls;
    const StarFieldRenderer = StarField;
    const EarthRenderer = Earth;
    const { LensFlare } = Lighting;
    const ControlPanel = UI;

    class SpaceApp {
        constructor() {
            this.canvas = document.getElementById('spaceCanvas');
            this.renderer = new Renderer(this.canvas);
            
            this.starField = new StarFieldRenderer();
            this.earth = new EarthRenderer();
            this.lensFlare = new LensFlare();
            
            this.controls = new OrbitControls(this.renderer.camera, this.canvas);
            
            this.controlPanel = new ControlPanel(
                this.earth,
                this.starField,
                this.lensFlare,
                this.controls,
                Storage
            );
            
            this.lastTime = 0;
            this.isRunning = false;
            
            this.init();
        }

        init() {
            this.loadSavedState();
            this.hideLoadingScreen();
            this.start();
            
            window.addEventListener('beforeunload', () => {
                this.controlPanel.saveCurrentState();
            });
        }

        loadSavedState() {
            const savedState = Storage.load();
            if (savedState) {
                this.controlPanel.loadState(savedState);
            }
        }

        hideLoadingScreen() {
            const loading = document.getElementById('loading');
            if (loading) {
                setTimeout(() => {
                    loading.classList.add('hidden');
                    setTimeout(() => {
                        loading.style.display = 'none';
                    }, 500);
                }, 500);
            }
        }

        start() {
            this.isRunning = true;
            this.animate();
        }

        stop() {
            this.isRunning = false;
        }

        animate(currentTime = 0) {
            if (!this.isRunning) return;
            
            requestAnimationFrame((t) => this.animate(t));
            
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.update(deltaTime);
            this.render();
        }

        update(deltaTime) {
            this.earth.update(deltaTime);
        }

        render() {
            this.renderer.clear();
            
            this.starField.render(this.renderer, this.lastTime / 1000);
            
            this.earth.render(this.renderer);
            
            this.lensFlare.render(this.renderer);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        new SpaceApp();
    });

    return SpaceApp;
})();
