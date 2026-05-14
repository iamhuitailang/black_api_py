const Lighting = (function() {
    const { Vector3 } = Engine3D;

    class LensFlare {
        constructor() {
            this.enabled = true;
            this.sunPosition = new Vector3(500, 150, -300);
            this.elements = [];
            this.initElements();
        }

        initElements() {
            this.elements = [
                { size: 100, color: { r: 255, g: 200, b: 100 }, alpha: 0.9, distance: 0 },
                { size: 30, color: { r: 255, g: 220, b: 150 }, alpha: 0.5, distance: 0.2 },
                { size: 50, color: { r: 200, g: 150, b: 255 }, alpha: 0.3, distance: 0.4 },
                { size: 20, color: { r: 255, g: 180, b: 100 }, alpha: 0.4, distance: 0.6 },
                { size: 40, color: { r: 150, g: 200, b: 255 }, alpha: 0.25, distance: 0.8 },
                { size: 15, color: { r: 255, g: 255, b: 200 }, alpha: 0.35, distance: 1.0 },
                { size: 25, color: { r: 200, g: 100, b: 255 }, alpha: 0.2, distance: 1.2 }
            ];
        }

        render(renderer) {
            if (!this.enabled) return;

            const projected = renderer.projectPoint(this.sunPosition);
            if (!projected) return;

            const centerX = renderer.width / 2;
            const centerY = renderer.height / 2;
            
            const dirX = centerX - projected.x;
            const dirY = centerY - projected.y;

            this.elements.forEach(element => {
                const x = projected.x + dirX * element.distance;
                const y = projected.y + dirY * element.distance;
                
                const gradient = renderer.ctx.createRadialGradient(x, y, 0, x, y, element.size);
                gradient.addColorStop(0, `rgba(${element.color.r}, ${element.color.g}, ${element.color.b}, ${element.alpha})`);
                gradient.addColorStop(0.5, `rgba(${element.color.r}, ${element.color.g}, ${element.color.b}, ${element.alpha * 0.3})`);
                gradient.addColorStop(1, `rgba(${element.color.r}, ${element.color.g}, ${element.color.b}, 0)`);
                
                renderer.ctx.fillStyle = gradient;
                renderer.ctx.beginPath();
                renderer.ctx.arc(x, y, element.size, 0, Math.PI * 2);
                renderer.ctx.fill();
            });

            const mainGlow = renderer.ctx.createRadialGradient(
                projected.x, projected.y, 0,
                projected.x, projected.y, 200
            );
            mainGlow.addColorStop(0, 'rgba(255, 255, 255, 1)');
            mainGlow.addColorStop(0.1, 'rgba(255, 250, 200, 0.8)');
            mainGlow.addColorStop(0.3, 'rgba(255, 200, 100, 0.4)');
            mainGlow.addColorStop(0.6, 'rgba(255, 150, 50, 0.1)');
            mainGlow.addColorStop(1, 'rgba(255, 100, 0, 0)');
            
            renderer.ctx.fillStyle = mainGlow;
            renderer.ctx.beginPath();
            renderer.ctx.arc(projected.x, projected.y, 200, 0, Math.PI * 2);
            renderer.ctx.fill();

            renderer.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            renderer.ctx.lineWidth = 2;
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const innerR = 30;
                const outerR = 80;
                
                renderer.ctx.beginPath();
                renderer.ctx.moveTo(
                    projected.x + Math.cos(angle) * innerR,
                    projected.y + Math.sin(angle) * innerR
                );
                renderer.ctx.lineTo(
                    projected.x + Math.cos(angle) * outerR,
                    projected.y + Math.sin(angle) * outerR
                );
                renderer.ctx.stroke();
            }
        }

        setEnabled(enabled) {
            this.enabled = enabled;
        }
    }

    class AtmosphereLighting {
        constructor() {
            this.enabled = true;
        }

        renderTerminator(renderer, earthRenderer) {
            if (!this.enabled) return;

            const center = new Vector3(0, 0, 0);
            const projected = renderer.projectPoint(center);
            if (!projected) return;

            const scale = 300 / projected.z;
            const pixelRadius = earthRenderer.radius * scale;

            const sunDir = earthRenderer.sunDirection;
            const angle = Math.atan2(sunDir.z, sunDir.x);

            renderer.ctx.save();
            renderer.ctx.translate(projected.x, projected.y);
            renderer.ctx.rotate(angle);

            const terminatorGradient = renderer.ctx.createLinearGradient(-pixelRadius, 0, pixelRadius, 0);
            terminatorGradient.addColorStop(0.45, 'rgba(255, 150, 50, 0)');
            terminatorGradient.addColorStop(0.5, 'rgba(255, 100, 50, 0.15)');
            terminatorGradient.addColorStop(0.55, 'rgba(100, 50, 150, 0.1)');
            terminatorGradient.addColorStop(1, 'rgba(50, 0, 100, 0)');

            renderer.ctx.globalCompositeOperation = 'screen';
            renderer.ctx.fillStyle = terminatorGradient;
            renderer.ctx.beginPath();
            renderer.ctx.arc(0, 0, pixelRadius, 0, Math.PI * 2);
            renderer.ctx.fill();
            renderer.ctx.restore();
        }
    }

    return {
        LensFlare,
        AtmosphereLighting
    };
})();
