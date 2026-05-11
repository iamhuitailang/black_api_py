
window.CanvasManager = (function() {
    let canvas = null;
    let ctx = null;
    let animationId = null;

    return {
        init: function(canvasElement) {
            canvas = canvasElement;
            ctx = canvas.getContext('2d');
            this.resize();

            window.addEventListener('resize', () => {
                this.resize();
            });
        },

        resize: function() {
            if (!canvas) return;
            
            const container = document.getElementById('game-container');
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
            }

            if (window.EffectsManager) {
                EffectsManager.resize();
            }
        },

        clear: function() {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        },

        getCanvas: function() {
            return canvas;
        },

        getContext: function() {
            return ctx;
        }
    };
})();
