const StarField = (function() {
    const { Vector3 } = Engine3D;

    class Star {
        constructor(x, y, z, size, brightness, starType) {
            this.position = new Vector3(x, y, z);
            this.size = size;
            this.brightness = brightness;
            this.twinkleSpeed = 0.3 + Math.random() * 1.5;
            this.twinkleOffset = Math.random() * Math.PI * 2;
            this.starType = starType;
            this.color = this.getStarColor();
        }

        getStarColor() {
            const colors = {
                O: { r: 155, g: 176, b: 255 },
                B: { r: 170, g: 191, b: 255 },
                A: { r: 213, g: 224, b: 255 },
                F: { r: 255, g: 251, b: 236 },
                G: { r: 255, g: 244, b: 204 },
                K: { r: 255, g: 210, b: 161 },
                M: { r: 255, g: 167, b: 116 }
            };
            return colors[this.starType];
        }

        getColor(time) {
            const twinkle = 0.6 + 0.4 * Math.sin(time * this.twinkleSpeed + this.twinkleOffset);
            const b = this.brightness * twinkle;
            return `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${b})`;
        }

        getSize(time) {
            const twinkle = 0.85 + 0.15 * Math.sin(time * this.twinkleSpeed + this.twinkleOffset);
            return this.size * twinkle;
        }
    }

    class Nebula {
        constructor(x, y, z, radius, color, rotation) {
            this.position = new Vector3(x, y, z);
            this.radius = radius;
            this.color = color;
            this.rotation = rotation;
        }
    }

    class StarFieldRenderer {
        constructor() {
            this.stars = [];
            this.nebulae = [];
            this.starCount = 2000;
            this.enabled = true;
            this.generateStars();
            this.generateNebulae();
        }

        generateStars() {
            this.stars = [];
            const distance = 800;
            const starTypes = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
            const starWeights = [0.00003, 0.13, 0.6, 3, 7.6, 12, 76];
            const totalWeight = starWeights.reduce((a, b) => a + b, 0);
            
            for (let i = 0; i < this.starCount; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = distance + Math.random() * 600;
                
                const x = r * Math.sin(phi) * Math.cos(theta);
                const y = r * Math.sin(phi) * Math.sin(theta);
                const z = r * Math.cos(phi);
                
                let rand = Math.random() * totalWeight;
                let starType = 'M';
                let weightSum = 0;
                for (let j = 0; j < starTypes.length; j++) {
                    weightSum += starWeights[j];
                    if (rand < weightSum) {
                        starType = starTypes[j];
                        break;
                    }
                }
                
                const baseSize = starType === 'O' ? 2.5 : starType === 'B' ? 2 : starType === 'A' ? 1.5 : 1;
                const size = baseSize * (0.5 + Math.random() * 1);
                const brightness = 0.2 + Math.random() * 0.8;
                
                this.stars.push(new Star(x, y, z, size, brightness, starType));
            }
        }

        generateNebulae() {
            this.nebulae = [];
            
            const nebulaConfigs = [
                { x: 600, y: 350, z: -700, radius: 250, color: { r: 120, g: 60, b: 180 }, rotation: 0 },
                { x: -500, y: -250, z: -600, radius: 200, color: { r: 60, g: 120, b: 180 }, rotation: 0.5 },
                { x: 250, y: -450, z: -800, radius: 220, color: { r: 180, g: 80, b: 120 }, rotation: 1 },
                { x: -650, y: 200, z: -550, radius: 180, color: { r: 100, g: 150, b: 100 }, rotation: 1.5 },
                { x: 400, y: -100, z: -900, radius: 300, color: { r: 80, g: 100, b: 160 }, rotation: 2 }
            ];
            
            nebulaConfigs.forEach(config => {
                this.nebulae.push(new Nebula(
                    config.x, config.y, config.z,
                    config.radius, config.color, config.rotation
                ));
            });
        }

        setStarCount(count) {
            this.starCount = count;
            this.generateStars();
        }

        render(renderer, time) {
            if (!this.enabled) return;

            this.nebulae.forEach(nebula => {
                const projected = renderer.projectPoint(nebula.position);
                if (projected) {
                    const scale = 500 / Math.max(projected.z, 100);
                    const radius = nebula.radius * scale;
                    
                    for (let i = 3; i >= 0; i--) {
                        const r = radius * (0.4 + i * 0.2);
                        const alpha = 0.1 - i * 0.02;
                        
                        const gradient = renderer.ctx.createRadialGradient(
                            projected.x, projected.y, 0,
                            projected.x, projected.y, r
                        );
                        gradient.addColorStop(0, `rgba(${nebula.color.r}, ${nebula.color.g}, ${nebula.color.b}, ${alpha * 2})`);
                        gradient.addColorStop(0.5, `rgba(${nebula.color.r + 30}, ${nebula.color.g + 30}, ${nebula.color.b + 30}, ${alpha})`);
                        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                        
                        renderer.ctx.fillStyle = gradient;
                        renderer.ctx.beginPath();
                        renderer.ctx.arc(projected.x, projected.y, r, 0, Math.PI * 2);
                        renderer.ctx.fill();
                    }
                }
            });

            const sortedStars = this.stars.map(star => {
                const projected = renderer.projectPoint(star.position);
                return { star, projected };
            }).filter(s => s.projected).sort((a, b) => b.projected.z - a.projected.z);

            sortedStars.forEach(({ star, projected }) => {
                const size = star.getSize(time);
                const color = star.getColor(time);
                
                renderer.ctx.fillStyle = color;
                renderer.ctx.beginPath();
                renderer.ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
                renderer.ctx.fill();
                
                if (star.brightness > 0.6 && star.size > 1.5) {
                    const glowSize = size * 3;
                    const glowGradient = renderer.ctx.createRadialGradient(
                        projected.x, projected.y, 0,
                        projected.x, projected.y, glowSize
                    );
                    glowGradient.addColorStop(0, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, 0.3)`);
                    glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    
                    renderer.ctx.fillStyle = glowGradient;
                    renderer.ctx.beginPath();
                    renderer.ctx.arc(projected.x, projected.y, glowSize, 0, Math.PI * 2);
                    renderer.ctx.fill();
                }
            });
        }
    }

    return StarFieldRenderer;
})();
