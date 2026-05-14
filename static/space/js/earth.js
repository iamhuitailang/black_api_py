const Earth = (function() {
    const { Vector3, Matrix4 } = Engine3D;

    class SimplexNoise {
        constructor(seed = Math.random()) {
            this.p = new Uint8Array(256);
            this.perm = new Uint8Array(512);
            this.permMod12 = new Uint8Array(512);
            
            for (let i = 0; i < 256; i++) {
                this.p[i] = i;
            }
            
            let n, q;
            for (let i = 255; i > 0; i--) {
                seed = (seed * 16807) % 2147483647;
                n = seed % (i + 1);
                q = this.p[i];
                this.p[i] = this.p[n];
                this.p[n] = q;
            }
            
            for (let i = 0; i < 512; i++) {
                this.perm[i] = this.p[i & 255];
                this.permMod12[i] = this.perm[i] % 12;
            }
            
            this.grad3 = [
                [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
                [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
                [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
            ];
        }
        
        noise2D(x, y) {
            const F2 = 0.5 * (Math.sqrt(3) - 1);
            const G2 = (3 - Math.sqrt(3)) / 6;
            
            let s = (x + y) * F2;
            let i = Math.floor(x + s);
            let j = Math.floor(y + s);
            let t = (i + j) * G2;
            let X0 = i - t;
            let Y0 = j - t;
            let x0 = x - X0;
            let y0 = y - Y0;
            
            let i1, j1;
            if (x0 > y0) { i1 = 1; j1 = 0; }
            else { i1 = 0; j1 = 1; }
            
            let x1 = x0 - i1 + G2;
            let y1 = y0 - j1 + G2;
            let x2 = x0 - 1 + 2 * G2;
            let y2 = y0 - 1 + 2 * G2;
            
            let ii = i & 255;
            let jj = j & 255;
            
            let n0, n1, n2;
            let t0 = 0.5 - x0*x0 - y0*y0;
            if (t0 < 0) n0 = 0;
            else {
                t0 *= t0;
                let gi0 = this.permMod12[ii + this.perm[jj]];
                n0 = t0 * t0 * (this.grad3[gi0][0]*x0 + this.grad3[gi0][1]*y0);
            }
            
            let t1 = 0.5 - x1*x1 - y1*y1;
            if (t1 < 0) n1 = 0;
            else {
                t1 *= t1;
                let gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
                n1 = t1 * t1 * (this.grad3[gi1][0]*x1 + this.grad3[gi1][1]*y1);
            }
            
            let t2 = 0.5 - x2*x2 - y2*y2;
            if (t2 < 0) n2 = 0;
            else {
                t2 *= t2;
                let gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];
                n2 = t2 * t2 * (this.grad3[gi2][0]*x2 + this.grad3[gi2][1]*y2);
            }
            
            return 70 * (n0 + n1 + n2);
        }
        
        fbm(x, y, octaves = 6) {
            let value = 0;
            let amplitude = 1;
            let frequency = 1;
            let maxValue = 0;
            
            for (let i = 0; i < octaves; i++) {
                value += amplitude * this.noise2D(x * frequency, y * frequency);
                maxValue += amplitude;
                amplitude *= 0.5;
                frequency *= 2;
            }
            
            return value / maxValue;
        }
    }

    const noise = new SimplexNoise(42);
    const cloudNoise = new SimplexNoise(54321);

    function generateEarthTextureData(width, height) {
        const data = new Uint8Array(width * height * 3);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const nx = x / width * 4;
                const ny = y / height * 2.5;
                
                let continentNoise = noise.fbm(nx, ny, 6);
                continentNoise += noise.fbm(nx * 2.5, ny * 2.5, 5) * 0.25;
                continentNoise += noise.fbm(nx * 5, ny * 5, 4) * 0.1;
                
                const lat = y / height;
                const latFactor = Math.abs(lat - 0.5) * 2;
                const iceFactor = Math.pow(Math.max(0, latFactor - 0.72), 2) * 3;
                
                const landThreshold = -0.08;
                
                let r, g, b;
                
                if (iceFactor > 0.5) {
                    r = 245; g = 250; b = 255;
                } else if (continentNoise > landThreshold) {
                    const elevation = (continentNoise - landThreshold) / (0.6 - landThreshold);
                    const detail = noise.fbm(nx * 12, ny * 12, 4) * 0.15;
                    
                    if (elevation > 0.8) {
                        r = Math.floor(180 + detail * 50);
                        g = Math.floor(170 + detail * 50);
                        b = Math.floor(160 + detail * 50);
                    } else if (elevation > 0.55) {
                        r = Math.floor(120 + detail * 40);
                        g = Math.floor(100 + detail * 40);
                        b = Math.floor(80 + detail * 40);
                    } else if (elevation > 0.35) {
                        r = Math.floor(60 + detail * 50);
                        g = Math.floor(100 + detail * 40);
                        b = Math.floor(40 + detail * 30);
                    } else if (elevation > 0.18) {
                        r = Math.floor(80 + detail * 60);
                        g = Math.floor(130 + detail * 50);
                        b = Math.floor(50 + detail * 40);
                    } else {
                        const coastVar = noise.fbm(nx * 8, ny * 8, 3) * 0.2;
                        r = Math.floor(210 + coastVar * 30);
                        g = Math.floor(190 + coastVar * 25);
                        b = Math.floor(140 + coastVar * 20);
                    }
                } else {
                    const depth = Math.abs(continentNoise - landThreshold);
                    const depthFactor = Math.min(depth * 2.5, 1);
                    const oceanVar = noise.fbm(nx * 3, ny * 3, 3) * 0.15;
                    
                    r = Math.floor(10 - depthFactor * 10 + oceanVar * 20);
                    g = Math.floor(40 - depthFactor * 30 + oceanVar * 25);
                    b = Math.floor(120 - depthFactor * 50 + oceanVar * 35);
                }
                
                if (iceFactor > 0.3 && continentNoise > landThreshold) {
                    const iceBlend = Math.min(iceFactor * 1.5, 1);
                    r = Math.floor(r * (1 - iceBlend) + 240 * iceBlend);
                    g = Math.floor(g * (1 - iceBlend) + 245 * iceBlend);
                    b = Math.floor(b * (1 - iceBlend) + 255 * iceBlend);
                }
                
                const idx = (y * width + x) * 3;
                data[idx] = Math.min(255, Math.max(0, r));
                data[idx + 1] = Math.min(255, Math.max(0, g));
                data[idx + 2] = Math.min(255, Math.max(0, b));
            }
        }
        
        return { data, width, height };
    }

    function generateCloudTextureData(width, height) {
        const data = new Uint8Array(width * height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const nx = x / width * 8;
                const ny = y / height * 6;
                
                let cloudValue = cloudNoise.fbm(nx, ny, 6);
                cloudValue += cloudNoise.fbm(nx * 2, ny * 2, 4) * 0.2;
                cloudValue = (cloudValue + 1) / 2;
                
                const threshold = 0.52;
                let alpha = 0;
                if (cloudValue > threshold) {
                    alpha = Math.min(Math.pow((cloudValue - threshold) / (1 - threshold), 0.5), 1) * 200;
                }
                
                const idx = y * width + x;
                data[idx] = Math.floor(alpha);
            }
        }
        
        return { data, width, height };
    }

    class EarthRenderer {
        constructor() {
            this.radius = 100;
            this.rotation = 0;
            this.rotationSpeed = 0.5;
            this.autoRotate = true;
            
            this.showAtmosphere = true;
            this.showClouds = true;
            this.cloudDensity = 50;
            this.cloudRotation = 0;
            
            this.sunDirection = new Vector3(1, 0.3, 0.5).normalize();
            
            this.earthTexture = generateEarthTextureData(256, 128);
            this.cloudTexture = generateCloudTextureData(128, 64);
            
            this.segments = 50;
            this.rings = 35;
            this.vertices = [];
            this.faces = [];
            this.uvs = [];
            
            this.generateGeometry();
        }

        generateGeometry() {
            this.vertices = [];
            this.faces = [];
            this.uvs = [];
            
            for (let ring = 0; ring <= this.rings; ring++) {
                const phi = (ring / this.rings) * Math.PI;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                for (let seg = 0; seg <= this.segments; seg++) {
                    const theta = (seg / this.segments) * Math.PI * 2;
                    const sinTheta = Math.sin(theta);
                    const cosTheta = Math.cos(theta);
                    
                    const x = cosTheta * sinPhi;
                    const y = cosPhi;
                    const z = sinTheta * sinPhi;
                    
                    this.vertices.push(new Vector3(x * this.radius, y * this.radius, z * this.radius));
                    this.uvs.push({ u: seg / this.segments, v: ring / this.rings });
                }
            }
            
            for (let ring = 0; ring < this.rings; ring++) {
                for (let seg = 0; seg < this.segments; seg++) {
                    const i1 = ring * (this.segments + 1) + seg;
                    const i2 = i1 + 1;
                    const i3 = i1 + this.segments + 1;
                    const i4 = i3 + 1;
                    
                    this.faces.push([i1, i3, i2]);
                    this.faces.push([i2, i3, i4]);
                }
            }
        }

        getTextureColor(u, v) {
            const x = Math.floor(((u % 1) + 1) % 1 * this.earthTexture.width);
            const y = Math.floor(Math.max(0, Math.min(0.999, v)) * this.earthTexture.height);
            const idx = (y * this.earthTexture.width + x) * 3;
            return {
                r: this.earthTexture.data[idx],
                g: this.earthTexture.data[idx + 1],
                b: this.earthTexture.data[idx + 2]
            };
        }

        getCloudAlpha(u, v) {
            const x = Math.floor(((u % 1) + 1) % 1 * this.cloudTexture.width);
            const y = Math.floor(Math.max(0, Math.min(0.999, v)) * this.cloudTexture.height);
            const idx = y * this.cloudTexture.width + x;
            return this.cloudTexture.data[idx] / 255 * (this.cloudDensity / 100);
        }

        calculateLighting(normal) {
            const dot = normal.dot(this.sunDirection);
            const diffuse = Math.max(0, dot);
            const ambient = 0.12;
            
            let lighting = ambient + (1 - ambient) * diffuse;
            
            if (dot > 0.93) {
                const specular = Math.pow((dot - 0.93) / 0.07, 2) * 0.18;
                lighting += specular;
            }
            
            return lighting;
        }

        render(renderer) {
            const facesToRender = [];
            
            const rotMatrix = Matrix4.rotateY(this.rotation);
            const cloudRotMatrix = Matrix4.rotateY(this.rotation + this.cloudRotation);
            
            this.faces.forEach(face => {
                const v1 = rotMatrix.transformVector(this.vertices[face[0]]);
                const v2 = rotMatrix.transformVector(this.vertices[face[1]]);
                const v3 = rotMatrix.transformVector(this.vertices[face[2]]);
                
                const edge1 = v2.sub(v1);
                const edge2 = v3.sub(v1);
                const normal = edge1.cross(edge2).normalize();
                
                const center = v1.add(v2).add(v3).mul(1/3);
                const viewDir = center.normalize();
                if (viewDir.dot(normal) <= 0) return;
                
                const p1 = renderer.projectPoint(v1);
                const p2 = renderer.projectPoint(v2);
                const p3 = renderer.projectPoint(v3);
                
                if (!p1 || !p2 || !p3) return;
                
                const avgZ = (p1.z + p2.z + p3.z) / 3;
                
                const uv1 = this.uvs[face[0]];
                const uv2 = this.uvs[face[1]];
                const uv3 = this.uvs[face[2]];
                
                const avgU = (uv1.u + uv2.u + uv3.u) / 3;
                const avgV = (uv1.v + uv2.v + uv3.v) / 3;
                
                facesToRender.push({
                    p1, p2, p3,
                    normal,
                    avgZ,
                    avgU,
                    avgV
                });
            });
            
            facesToRender.sort((a, b) => b.avgZ - a.avgZ);
            
            const center = new Vector3(0, 0, 0);
            const projectedCenter = renderer.projectPoint(center);
            
            if (projectedCenter && this.showAtmosphere) {
                const scale = 300 / projectedCenter.z;
                const pixelRadius = this.radius * scale;
                this.renderAtmosphere(renderer, projectedCenter.x, projectedCenter.y, pixelRadius);
            }
            
            facesToRender.forEach(face => {
                const lighting = this.calculateLighting(face.normal);
                const color = this.getTextureColor(face.avgU, face.avgV);
                
                let r = Math.floor(color.r * lighting);
                let g = Math.floor(color.g * lighting);
                let b = Math.floor(color.b * lighting);
                
                if (lighting > 1) {
                    const spec = (lighting - 1) * 255;
                    r = Math.min(255, r + spec);
                    g = Math.min(255, g + spec);
                    b = Math.min(255, b + spec);
                }
                
                renderer.drawTriangle(
                    face.p1, face.p2, face.p3,
                    `rgb(${r}, ${g}, ${b})`
                );
            });
            
            if (this.showClouds && projectedCenter) {
                const scale = 300 / projectedCenter.z;
                const cloudRadius = this.radius * scale * 1.02;
                this.renderClouds(renderer, projectedCenter.x, projectedCenter.y, cloudRadius, cloudRotMatrix);
            }
        }

        renderClouds(renderer, cx, cy, radius, cloudRotMatrix) {
            const cloudPoints = [];
            const step = Math.PI / 20;
            
            for (let phi = 0; phi < Math.PI; phi += step) {
                for (let theta = 0; theta < Math.PI * 2; theta += step) {
                    const x = Math.sin(phi) * Math.cos(theta);
                    const y = Math.cos(phi);
                    const z = Math.sin(phi) * Math.sin(theta);
                    
                    const v = new Vector3(x * this.radius * 1.02, y * this.radius * 1.02, z * this.radius * 1.02);
                    const transformed = cloudRotMatrix.transformVector(v);
                    const projected = renderer.projectPoint(transformed);
                    
                    if (projected) {
                        const normal = new Vector3(x, y, z);
                        const lighting = this.calculateLighting(normal);
                        const u = theta / (Math.PI * 2);
                        const vCoord = phi / Math.PI;
                        const alpha = this.getCloudAlpha(u, vCoord) * lighting * 0.5;
                        
                        if (alpha > 0.08) {
                            cloudPoints.push({
                                x: projected.x,
                                y: projected.y,
                                z: projected.z,
                                alpha: alpha,
                                size: 2.5 + alpha * 3
                            });
                        }
                    }
                }
            }
            
            cloudPoints.sort((a, b) => b.z - a.z);
            
            cloudPoints.forEach(p => {
                renderer.ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
                renderer.ctx.beginPath();
                renderer.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                renderer.ctx.fill();
            });
        }

        renderAtmosphere(renderer, cx, cy, pixelRadius) {
            const gradient = renderer.ctx.createRadialGradient(
                cx, cy, pixelRadius * 0.85,
                cx, cy, pixelRadius
            );
            gradient.addColorStop(0, 'rgba(100, 180, 255, 0)');
            gradient.addColorStop(0.5, 'rgba(100, 180, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(100, 180, 255, 0.4)');
            
            renderer.ctx.fillStyle = gradient;
            renderer.ctx.beginPath();
            renderer.ctx.arc(cx, cy, pixelRadius, 0, Math.PI * 2);
            renderer.ctx.fill();
            
            const edgeGlow = renderer.ctx.createRadialGradient(
                cx, cy, 0,
                cx, cy, pixelRadius * 1.15
            );
            edgeGlow.addColorStop(0.82, 'rgba(80, 180, 255, 0)');
            edgeGlow.addColorStop(0.92, 'rgba(80, 180, 255, 0.25)');
            edgeGlow.addColorStop(1, 'rgba(80, 180, 255, 0)');
            
            renderer.ctx.fillStyle = edgeGlow;
            renderer.ctx.beginPath();
            renderer.ctx.arc(cx, cy, pixelRadius * 1.15, 0, Math.PI * 2);
            renderer.ctx.fill();
        }

        update(deltaTime) {
            if (this.autoRotate) {
                this.rotation += this.rotationSpeed * deltaTime * 0.001;
            }
            this.cloudRotation += this.rotationSpeed * deltaTime * 0.0003;
        }

        setRotationSpeed(speed) {
            this.rotationSpeed = speed;
        }

        setAutoRotate(enabled) {
            this.autoRotate = enabled;
        }

        setShowAtmosphere(enabled) {
            this.showAtmosphere = enabled;
        }

        setShowClouds(enabled) {
            this.showClouds = enabled;
        }

        setCloudDensity(density) {
            this.cloudDensity = density;
        }
    }

    return EarthRenderer;
})();
