class FinalLunarGenerator {
    constructor(seed = 42) {
        this.seed = seed;
        this.perm = new Uint8Array(512);
        this.gradP = new Array(512);
        this.initPermutation();
        this.precomputeGeologicalFeatures();
    }
    
    initPermutation() {
        const grad3 = [
            [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
            [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
            [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
        ];
        
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;
        
        let n = this.seed;
        for (let i = 255; i > 0; i--) {
            n = (n * 16807) % 2147483647;
            const j = n % (i + 1);
            [p[i], p[j]] = [p[j], p[i]];
        }
        
        for (let i = 0; i < 512; i++) {
            this.perm[i] = p[i & 255];
            this.gradP[i] = grad3[this.perm[i] % 12];
        }
    }
    
    dot3(g, x, y, z) {
        return g[0] * x + g[1] * y + g[2] * z;
    }
    
    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(a, b, t) { return a + t * (b - a); }
    
    noise3D(x, y, z) {
        const F3 = 1/3, G3 = 1/6;
        const s = (x + y + z) * F3;
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        const k = Math.floor(z + s);
        
        const t = (i + j + k) * G3;
        const x0 = x - (i - t);
        const y0 = y - (j - t);
        const z0 = z - (k - t);
        
        let i1, j1, k1, i2, j2, k2;
        if (x0 >= y0) {
            if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
            else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
            else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
        } else {
            if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
            else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
            else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
        }
        
        const perm = this.perm;
        const gradP = this.gradP;
        const ii = i & 255, jj = j & 255, kk = k & 255;
        
        const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
        const x2 = x0 - i2 + 2*G3, y2 = y0 - j2 + 2*G3, z2 = z0 - k2 + 2*G3;
        const x3 = x0 - 1 + 3*G3, y3 = y0 - 1 + 3*G3, z3 = z0 - 1 + 3*G3;
        
        const gi0 = gradP[ii + perm[jj + perm[kk]]];
        const gi1 = gradP[ii + i1 + perm[jj + j1 + perm[kk + k1]]];
        const gi2 = gradP[ii + i2 + perm[jj + j2 + perm[kk + k2]]];
        const gi3 = gradP[ii + 1 + perm[jj + 1 + perm[kk + 1]]];
        
        let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
        let n0 = t0 < 0 ? 0 : (t0 *= t0, t0 * t0 * this.dot3(gi0, x0, y0, z0));
        
        let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
        let n1 = t1 < 0 ? 0 : (t1 *= t1, t1 * t1 * this.dot3(gi1, x1, y1, z1));
        
        let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
        let n2 = t2 < 0 ? 0 : (t2 *= t2, t2 * t2 * this.dot3(gi2, x2, y2, z2));
        
        let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
        let n3 = t3 < 0 ? 0 : (t3 *= t3, t3 * t3 * this.dot3(gi3, x3, y3, z3));
        
        return 32 * (n0 + n1 + n2 + n3);
    }
    
    fbm(x, y, z, octaves = 8, persistence = 0.5, lacunarity = 2.0) {
        let total = 0, freq = 1, amp = 1, maxAmp = 0;
        for (let i = 0; i < octaves; i++) {
            total += this.noise3D(x * freq, y * freq, z * freq) * amp;
            maxAmp += amp;
            amp *= persistence;
            freq *= lacunarity;
        }
        return total / maxAmp;
    }
    
    ridged(x, y, z, octaves = 6) {
        let total = 0, freq = 1, amp = 1, maxAmp = 0, prev = 0;
        for (let i = 0; i < octaves; i++) {
            let n = Math.abs(this.noise3D(x * freq, y * freq, z * freq));
            n = 1 - n * n;
            total += n * amp * (1 + prev * 0.5);
            prev = n;
            maxAmp += amp;
            amp *= 0.5;
            freq *= 2;
        }
        return total / maxAmp;
    }
    
    precomputeGeologicalFeatures() {
        this.basins = [
            { lat: 35, lng: -15, radius: 0.28, name: "Imbrium", depth: 0.5, isMare: true },
            { lat: 10, lng: -55, radius: 0.22, name: "Oceanus Procellarum", depth: 0.42, isMare: true },
            { lat: 28, lng: -3, radius: 0.16, name: "Mare Serenitatis", depth: 0.38, isMare: true },
            { lat: 8, lng: 30, radius: 0.14, name: "Mare Tranquillitatis", depth: 0.35, isMare: true },
            { lat: -4, lng: 50, radius: 0.13, name: "Mare Fecunditatis", depth: 0.32, isMare: true },
            { lat: -22, lng: -17, radius: 0.12, name: "Mare Nubium", depth: 0.3, isMare: true },
            { lat: 15, lng: 60, radius: 0.10, name: "Mare Crisium", depth: 0.28, isMare: true },
            { lat: 45, lng: -30, radius: 0.08, name: "Mare Frigoris", depth: 0.25, isMare: true },
            { lat: -42, lng: 15, radius: 0.10, name: "Mare Nectaris", depth: 0.32, isMare: true },
            { lat: -12, lng: -45, radius: 0.09, name: "Mare Humorum", depth: 0.28, isMare: true },
        ];
        
        this.largeCraters = [
            { lat: -43, lng: -11, radius: 0.045, name: "Tycho", depth: 0.85, rays: true, centralPeak: true },
            { lat: 10, lng: -20, radius: 0.038, name: "Copernicus", depth: 0.8, rays: true, centralPeak: true },
            { lat: 32, lng: -38, radius: 0.032, name: "Kepler", depth: 0.75, rays: true, centralPeak: true },
            { lat: 24, lng: -47, radius: 0.028, name: "Aristarchus", depth: 0.9, rays: false, centralPeak: true },
            { lat: -17, lng: 40, radius: 0.035, name: "Gassendi", depth: 0.65, rays: false, centralPeak: true },
            { lat: -9, lng: 61, radius: 0.022, name: "Langrenus", depth: 0.7, rays: false, centralPeak: true },
            { lat: 29, lng: -4, radius: 0.024, name: "Archimedes", depth: 0.6, rays: false, centralPeak: false },
            { lat: 26, lng: -13, radius: 0.020, name: "Timocharis", depth: 0.55, rays: false, centralPeak: false },
            { lat: 34, lng: 1, radius: 0.018, name: "Aristillus", depth: 0.65, rays: false, centralPeak: true },
            { lat: -25, lng: 60, radius: 0.028, name: "Petavius", depth: 0.7, rays: false, centralPeak: true },
            { lat: -5, lng: 20, radius: 0.018, name: "Theophilus", depth: 0.65, rays: false, centralPeak: true },
            { lat: -11, lng: 17, radius: 0.015, name: "Cyrillus", depth: 0.55, rays: false, centralPeak: true },
        ];
        
        const seed2 = this.seed * 2;
        this.mediumCraters = [];
        this.smallCraters = [];
        this.tinyCraters = [];
        this.microCraters = [];
        
        const rng = this.seededRandom(seed2);
        
        for (let i = 0; i < 200; i++) {
            const lat = (rng() - 0.5) * 180;
            const lng = (rng() - 0.5) * 360;
            this.mediumCraters.push({
                lat, lng,
                radius: 0.006 + rng() * 0.018,
                depth: 0.3 + rng() * 0.4,
                centralPeak: rng() > 0.7
            });
        }
        
        for (let i = 0; i < 800; i++) {
            const lat = (rng() - 0.5) * 180;
            const lng = (rng() - 0.5) * 360;
            this.smallCraters.push({
                lat, lng,
                radius: 0.002 + rng() * 0.005,
                depth: 0.2 + rng() * 0.3
            });
        }
        
        for (let i = 0; i < 3000; i++) {
            const lat = (rng() - 0.5) * 180;
            const lng = (rng() - 0.5) * 360;
            this.tinyCraters.push({
                lat, lng,
                radius: 0.0008 + rng() * 0.0015,
                depth: 0.1 + rng() * 0.2
            });
        }
        
        for (let i = 0; i < 10000; i++) {
            const lat = (rng() - 0.5) * 180;
            const lng = (rng() - 0.5) * 360;
            this.microCraters.push({
                lat, lng,
                radius: 0.0002 + rng() * 0.0005,
                depth: 0.05 + rng() * 0.1
            });
        }
    }
    
    seededRandom(seed) {
        let s = seed;
        return () => {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }
    
    latLngToCartesian(lat, lng, radius = 1) {
        const phi = (90 - lat) * Math.PI / 180;
        const theta = lng * Math.PI / 180;
        return {
            x: radius * Math.sin(phi) * Math.cos(theta),
            y: radius * Math.cos(phi),
            z: radius * Math.sin(phi) * Math.sin(theta)
        };
    }
    
    sphericalDistance(a, b) {
        const dot = a.x * b.x + a.y * b.y + a.z * b.z;
        const clampedDot = Math.max(-1, Math.min(1, dot));
        return Math.acos(clampedDot) / Math.PI;
    }
    
    craterProfile(normalizedDist, radius, depth, hasCentralPeak) {
        if (normalizedDist >= 1.5) return 0;
        
        let elevation = 0;
        
        if (normalizedDist < 1) {
            const floorDepth = -depth * 0.6;
            const wallStart = 0.7;
            
            if (normalizedDist < wallStart) {
                elevation = floorDepth + (normalizedDist / wallStart) * depth * 0.1;
                
                if (hasCentralPeak && normalizedDist < 0.25) {
                    const peakDist = normalizedDist / 0.25;
                    const peakHeight = depth * 0.35 * Math.sin(peakDist * Math.PI);
                    elevation += peakHeight;
                }
            } else {
                const wallProgress = (normalizedDist - wallStart) / (1 - wallStart);
                const wallCurve = Math.sin(wallProgress * Math.PI);
                elevation = floorDepth + wallCurve * depth * 0.25;
            }
        } else if (normalizedDist < 1.15) {
            const rimProgress = (normalizedDist - 1) / 0.15;
            const rimHeight = depth * 0.15 * Math.sin(rimProgress * Math.PI);
            elevation = rimHeight;
        } else if (normalizedDist < 1.5) {
            const outerProgress = (normalizedDist - 1.15) / 0.35;
            const outerDepth = -depth * 0.06 * Math.sin(outerProgress * Math.PI);
            elevation = outerDepth;
        }
        
        return elevation;
    }
    
    getCraterElevation(cart, craterList, scale = 1) {
        let totalElev = 0;
        
        for (const crater of craterList) {
            const craterCart = this.latLngToCartesian(crater.lat, crater.lng);
            const dist = this.sphericalDistance(cart, craterCart);
            const normalizedDist = dist / crater.radius;
            
            if (normalizedDist < 1.5) {
                const elev = this.craterProfile(
                    normalizedDist,
                    crater.radius,
                    crater.depth * scale,
                    crater.centralPeak || false
                );
                totalElev += elev;
            }
        }
        
        return totalElev;
    }
    
    getBasinEffect(cart) {
        let totalDepth = 0;
        let isMare = false;
        let mareIntensity = 0;
        
        for (const basin of this.basins) {
            const basinCart = this.latLngToCartesian(basin.lat, basin.lng);
            const dist = this.sphericalDistance(cart, basinCart);
            const normalizedDist = dist / basin.radius;
            
            if (normalizedDist < 1.3) {
                if (normalizedDist < 1) {
                    const depth = basin.depth * Math.pow(1 - normalizedDist, 0.6);
                    if (depth > totalDepth) {
                        totalDepth = depth;
                        isMare = basin.isMare;
                        mareIntensity = Math.min(1, depth / 0.35);
                    }
                } else if (normalizedDist < 1.2) {
                    const rim = basin.depth * 0.15 * Math.sin((normalizedDist - 1) / 0.2 * Math.PI);
                    totalDepth = Math.max(totalDepth, -rim * 0.2);
                }
            }
        }
        
        return { depth: totalDepth, isMare, mareIntensity };
    }
    
    getRayBrightness(cart, crater, rayNoise) {
        const craterCart = this.latLngToCartesian(crater.lat, crater.lng);
        const dist = this.sphericalDistance(cart, craterCart);
        
        if (dist > crater.radius && dist < crater.radius * 10) {
            const angle = Math.atan2(cart.z - craterCart.z, cart.x - craterCart.x);
            const rayPattern = Math.abs(Math.sin(angle * 8)) * 0.5 + Math.abs(Math.sin(angle * 13)) * 0.3;
            
            const intensity = (1 - dist / (crater.radius * 10)) * crater.depth * 0.3;
            const rayIntensity = intensity * rayPattern * (rayNoise * 2);
            
            return Math.max(0, rayIntensity);
        }
        return 0;
    }
    
    generateFinalTextures(texWidth, texHeight) {
        console.log(`Generating FINAL ${texWidth}x${texHeight} lunar texture...`);
        
        const canvas = document.createElement('canvas');
        canvas.width = texWidth;
        canvas.height = texHeight;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(texWidth, texHeight);
        const data = imageData.data;
        
        const halfWidth = Math.floor(texWidth / 2);
        const halfHeight = Math.floor(texHeight / 2);
        
        const bumpCanvas = document.createElement('canvas');
        bumpCanvas.width = halfWidth;
        bumpCanvas.height = halfHeight;
        const bumpCtx = bumpCanvas.getContext('2d');
        const bumpImageData = bumpCtx.createImageData(halfWidth, halfHeight);
        const bumpData = bumpImageData.data;
        
        const normalCanvas = document.createElement('canvas');
        normalCanvas.width = halfWidth;
        normalCanvas.height = halfHeight;
        const normalCtx = normalCanvas.getContext('2d');
        const normalImageData = normalCtx.createImageData(halfWidth, halfHeight);
        const normalData = normalImageData.data;
        
        const roughnessCanvas = document.createElement('canvas');
        roughnessCanvas.width = halfWidth;
        roughnessCanvas.height = halfHeight;
        const roughCtx = roughnessCanvas.getContext('2d');
        const roughImageData = roughCtx.createImageData(halfWidth, halfHeight);
        const roughData = roughImageData.data;
        
        const heightMap = new Float32Array(texWidth * texHeight);
        
        for (let y = 0; y < texHeight; y++) {
            if (y % Math.floor(texHeight / 20) === 0) {
                console.log(`Texture progress: ${Math.floor((y / texHeight) * 100)}%`);
            }
            
            const v = y / texHeight;
            const phi = v * Math.PI;
            
            for (let x = 0; x < texWidth; x++) {
                const idx = (y * texWidth + x) * 4;
                const u = x / texWidth;
                const theta = u * Math.PI * 2;
                
                const cart = {
                    x: Math.sin(phi) * Math.cos(theta),
                    y: Math.cos(phi),
                    z: Math.sin(phi) * Math.sin(theta)
                };
                
                const baseNoise = this.fbm(cart.x * 0.4, cart.y * 0.4, cart.z * 0.4, 10, 0.55, 2.0);
                const midNoise = this.fbm(cart.x * 2, cart.y * 2, cart.z * 2, 8, 0.5, 2.1);
                const fineNoise = this.fbm(cart.x * 10, cart.y * 10, cart.z * 10, 6, 0.45, 2.2);
                const microNoise = this.fbm(cart.x * 45, cart.y * 45, cart.z * 45, 5, 0.4, 2.3);
                const nanoNoise = this.fbm(cart.x * 150, cart.y * 150, cart.z * 150, 4, 0.35, 2.4);
                
                const basinEffect = this.getBasinEffect(cart);
                
                let rayBrightness = 0;
                for (const crater of this.largeCraters) {
                    if (crater.rays) {
                        const rayNoise = this.fbm(
                            cart.x * 2 + cart.x * 50,
                            cart.y * 2 + cart.y * 50,
                            cart.z * 2,
                            3, 0.5, 2.0
                        );
                        rayBrightness = Math.max(rayBrightness, this.getRayBrightness(cart, crater, rayNoise));
                    }
                }
                
                let totalElevation = 0;
                totalElevation += this.getCraterElevation(cart, this.largeCraters, 1.2);
                totalElevation += this.getCraterElevation(cart, this.mediumCraters, 1.0);
                totalElevation += this.getCraterElevation(cart, this.smallCraters, 0.8);
                totalElevation += this.getCraterElevation(cart, this.tinyCraters, 0.6);
                totalElevation += this.getCraterElevation(cart, this.microCraters, 0.4);
                
                const ridgeNoise = this.ridged(cart.x * 3, cart.y * 3, cart.z * 3, 6);
                
                let r, g, b;
                let baseGray;
                let roughness;
                
                if (basinEffect.isMare) {
                    const mareBase = 45 + baseNoise * 12;
                    baseGray = mareBase + midNoise * 6 + fineNoise * 4 + microNoise * 2;
                    baseGray -= basinEffect.mareIntensity * 18;
                    baseGray += totalElevation * 10;
                    baseGray += (ridgeNoise - 0.5) * 8;
                    
                    r = baseGray;
                    g = baseGray - 4;
                    b = baseGray - 8;
                    
                    r *= (1 - basinEffect.mareIntensity * 0.08);
                    g *= (1 - basinEffect.mareIntensity * 0.1);
                    b *= (1 - basinEffect.mareIntensity * 0.13);
                    
                    const crackNoise = this.billowed(cart.x * 12, cart.y * 12, cart.z * 12, 4);
                    if (crackNoise > 0.72) {
                        const crackAmount = (crackNoise - 0.72) * 3;
                        r -= crackAmount * 12;
                        g -= crackAmount * 12;
                        b -= crackAmount * 12;
                    }
                    
                    roughness = 0.85 + microNoise * 0.1;
                } else {
                    const highlandBase = 110 + baseNoise * 35;
                    baseGray = highlandBase + midNoise * 20 + fineNoise * 14 + microNoise * 7 + nanoNoise * 4;
                    baseGray += totalElevation * 12;
                    baseGray += (ridgeNoise - 0.5) * 10;
                    
                    r = baseGray;
                    g = baseGray - 2;
                    b = baseGray - 5;
                    
                    roughness = 0.95 + microNoise * 0.05;
                }
                
                if (rayBrightness > 0) {
                    const brighten = rayBrightness * 60;
                    r += brighten;
                    g += brighten * 0.96;
                    b += brighten * 0.9;
                }
                
                if (totalElevation < -0.15) {
                    const darken = Math.abs(totalElevation) * 30;
                    r -= darken;
                    g -= darken * 0.96;
                    b -= darken * 0.9;
                } else if (totalElevation > 0.05) {
                    const lighten = totalElevation * 40;
                    r += lighten;
                    g += lighten * 0.98;
                    b += lighten * 0.95;
                }
                
                const regolith = microNoise * 3 + nanoNoise * 2;
                r += regolith;
                g += regolith * 0.9;
                b += regolith * 0.75;
                
                r = Math.max(18, Math.min(230, r));
                g = Math.max(15, Math.min(225, g));
                b = Math.max(12, Math.min(220, b));
                
                data[idx] = Math.floor(r);
                data[idx + 1] = Math.floor(g);
                data[idx + 2] = Math.floor(b);
                data[idx + 3] = 255;
                
                const elev = baseGray + totalElevation * 30 - (basinEffect.isMare ? basinEffect.mareIntensity * 25 : 0);
                heightMap[y * texWidth + x] = elev;
                
                if (x % 2 === 0 && y % 2 === 0) {
                    const halfX = Math.floor(x / 2);
                    const halfY = Math.floor(y / 2);
                    const halfIdx = (halfY * halfWidth + halfX) * 4;
                    
                    let bumpElev = 128;
                    bumpElev += baseNoise * 22;
                    bumpElev += midNoise * 12;
                    bumpElev += fineNoise * 6;
                    bumpElev += totalElevation * 25;
                    
                    if (basinEffect.isMare) {
                        bumpElev -= basinEffect.mareIntensity * 20;
                    }
                    
                    bumpElev = Math.max(20, Math.min(235, bumpElev));
                    
                    bumpData[halfIdx] = Math.floor(bumpElev);
                    bumpData[halfIdx + 1] = Math.floor(bumpElev);
                    bumpData[halfIdx + 2] = Math.floor(bumpElev);
                    bumpData[halfIdx + 3] = 255;
                    
                    const roughVal = Math.floor(roughness * 255);
                    roughData[halfIdx] = roughVal;
                    roughData[halfIdx + 1] = roughVal;
                    roughData[halfIdx + 2] = roughVal;
                    roughData[halfIdx + 3] = 255;
                }
            }
        }
        
        console.log('Generating normal map...');
        for (let halfY = 0; halfY < halfHeight; halfY++) {
            for (let halfX = 0; halfX < halfWidth; halfX++) {
                const x = halfX * 2;
                const y = halfY * 2;
                
                const getHeight = (px, py) => {
                    px = ((px % texWidth) + texWidth) % texWidth;
                    py = Math.max(0, Math.min(texHeight - 1, py));
                    return heightMap[py * texWidth + px];
                };
                
                const scale = 8;
                const hL = getHeight(x - 1, y);
                const hR = getHeight(x + 1, y);
                const hU = getHeight(x, y - 1);
                const hD = getHeight(x, y + 1);
                
                let nx = (hL - hR) * scale;
                let ny = (hU - hD) * scale;
                let nz = 1;
                
                const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
                if (len > 0) {
                    nx /= len;
                    ny /= len;
                    nz /= len;
                }
                
                const halfIdx = (halfY * halfWidth + halfX) * 4;
                normalData[halfIdx] = Math.floor(((nx + 1) / 2) * 255);
                normalData[halfIdx + 1] = Math.floor(((ny + 1) / 2) * 255);
                normalData[halfIdx + 2] = Math.floor(nz * 255);
                normalData[halfIdx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        bumpCtx.putImageData(bumpImageData, 0, 0);
        normalCtx.putImageData(normalImageData, 0, 0);
        roughCtx.putImageData(roughImageData, 0, 0);
        
        const createTexture = (canvasElement, anisotropy = 16) => {
            const texture = new THREE.CanvasTexture(canvasElement);
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.anisotropy = anisotropy;
            texture.generateMipmaps = true;
            return texture;
        };
        
        console.log('FINAL texture generation complete!');
        
        return {
            colorTexture: createTexture(canvas, 16),
            bumpTexture: createTexture(bumpCanvas, 8),
            normalTexture: createTexture(normalCanvas, 8),
            roughnessTexture: createTexture(roughnessCanvas, 8)
        };
    }
}

class Moon3DViewer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.moon = null;
        this.markers = [];
        this.markerObjects = [];
        this.raycaster = null;
        this.mouse = null;
        
        this.isRotating = false;
        this.isZooming = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.spherical = { radius: 6, theta: 0, phi: Math.PI / 2 };
        
        this.isAddMarkerMode = false;
        this.showMarkers = true;
        this.selectedMarker = null;
        this.pendingMarkerPosition = null;
        
        this.markerColor = '#ff4444';
        this.markerSize = 3;
        
        this.autoRotate = true;
        
        this.init();
    }
    
    async init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createLights();
        this.createStars();
        await this.createFinalMoon();
        this.loadMarkers();
        this.createRaycaster();
        this.setupEventListeners();
        this.setupUI();
        this.animate();
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000003);
    }
    
    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            25,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.updateCameraPosition();
    }
    
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
    }
    
    createLights() {
        const ambientLight = new THREE.AmbientLight(0x181828, 0.2);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffffee, 3.2);
        sunLight.position.set(18, 8, 15);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 80;
        sunLight.shadow.camera.left = -25;
        sunLight.shadow.camera.right = 25;
        sunLight.shadow.camera.top = 25;
        sunLight.shadow.camera.bottom = -25;
        sunLight.shadow.bias = -0.00003;
        sunLight.shadow.radius = 4;
        this.scene.add(sunLight);
        
        const fillLight = new THREE.DirectionalLight(0x446688, 0.18);
        fillLight.position.set(-15, -5, -12);
        this.scene.add(fillLight);
        
        const rimLight = new THREE.DirectionalLight(0x5566aa, 0.12);
        rimLight.position.set(0, 20, -18);
        this.scene.add(rimLight);
        
        const bottomLight = new THREE.DirectionalLight(0x223344, 0.05);
        bottomLight.position.set(0, -18, 0);
        this.scene.add(bottomLight);
    }
    
    createStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.035,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.9
        });
        
        const starsVertices = [];
        const starsColors = [];
        
        for (let i = 0; i < 50000; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 90 + Math.random() * 110;
            
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.cos(phi);
            const z = r * Math.sin(phi) * Math.sin(theta);
            
            starsVertices.push(x, y, z);
            
            const colorType = Math.random();
            if (colorType < 0.6) {
                starsColors.push(1, 1, 1);
            } else if (colorType < 0.8) {
                starsColors.push(1, 0.95, 0.88);
            } else if (colorType < 0.92) {
                starsColors.push(0.85, 0.9, 1);
            } else if (colorType < 0.98) {
                starsColors.push(1, 0.8, 0.7);
            } else {
                starsColors.push(0.7, 0.8, 1);
            }
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starsColors, 3));
        starsMaterial.vertexColors = true;
        
        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
    }
    
    async createFinalMoon() {
        console.log('='.repeat(60));
        console.log('Creating FINAL high-quality lunar model...');
        console.log('='.repeat(60));
        
        const geometry = new THREE.SphereGeometry(2, 768, 768);
        
        console.log('Initializing FINAL texture generator...');
        const generator = new FinalLunarGenerator(12345);
        
        console.log('Generating FINAL textures (4096x2048)...');
        const textures = generator.generateFinalTextures(4096, 2048);
        
        console.log('Creating PBR material with normal map...');
        
        const material = new THREE.MeshStandardMaterial({
            map: textures.colorTexture,
            normalMap: textures.normalTexture,
            normalScale: new THREE.Vector2(0.15, 0.15),
            roughnessMap: textures.roughnessTexture,
            roughness: 0.9,
            metalness: 0.02,
            flatShading: false
        });
        
        this.moon = new THREE.Mesh(geometry, material);
        this.moon.receiveShadow = true;
        this.moon.castShadow = true;
        this.scene.add(this.moon);
        
        const glowGeometry = new THREE.SphereGeometry(2.18, 128, 128);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x151528,
            transparent: true,
            opacity: 0.04,
            side: THREE.BackSide
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.scene.add(glowMesh);
        
        const innerGlowGeometry = new THREE.SphereGeometry(2.05, 256, 256);
        const innerGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x1a1a2a,
            transparent: true,
            opacity: 0.025,
            side: THREE.BackSide
        });
        const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
        this.scene.add(innerGlow);
        
        console.log('='.repeat(60));
        console.log('FINAL lunar model creation complete!');
        console.log('='.repeat(60));
    }
    
    createRaycaster() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }
    
    setupEventListeners() {
        const canvas = this.renderer.domElement;
        
        canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        canvas.addEventListener('wheel', this.onMouseWheel.bind(this), { passive: false });
        canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
        
        canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
        
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }
    
    onMouseDown(event) {
        if (event.button === 0) {
            this.isRotating = true;
            this.autoRotate = false;
            this.previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        }
    }
    
    onMouseMove(event) {
        if (this.isRotating) {
            const deltaX = event.clientX - this.previousMousePosition.x;
            const deltaY = event.clientY - this.previousMousePosition.y;
            
            this.spherical.theta -= deltaX * 0.004;
            this.spherical.phi = Math.max(0.02, Math.min(Math.PI - 0.02, this.spherical.phi + deltaY * 0.004));
            
            this.updateCameraPosition();
            this.previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        }
    }
    
    onMouseUp(event) {
        if (this.isRotating) {
            this.isRotating = false;
            
            const deltaMove = Math.abs(event.clientX - this.previousMousePosition.x) + 
                             Math.abs(event.clientY - this.previousMousePosition.y);
            
            if (deltaMove < 5) {
                this.handleClick(event);
            }
        }
    }
    
    onMouseWheel(event) {
        event.preventDefault();
        
        const delta = event.deltaY > 0 ? 1 : -1;
        const zoomSpeed = 0.1;
        
        this.spherical.radius = Math.max(2.1, Math.min(18, this.spherical.radius + delta * zoomSpeed));
        this.updateCameraPosition();
        this.saveMarkers();
    }
    
    onTouchStart(event) {
        event.preventDefault();
        
        if (event.touches.length === 1) {
            this.isRotating = true;
            this.autoRotate = false;
            this.previousMousePosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        } else if (event.touches.length === 2) {
            this.isZooming = true;
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            this.previousPinchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
        }
    }
    
    onTouchMove(event) {
        event.preventDefault();
        
        if (this.isRotating && event.touches.length === 1) {
            const deltaX = event.touches[0].clientX - this.previousMousePosition.x;
            const deltaY = event.touches[0].clientY - this.previousMousePosition.y;
            
            this.spherical.theta -= deltaX * 0.004;
            this.spherical.phi = Math.max(0.02, Math.min(Math.PI - 0.02, this.spherical.phi + deltaY * 0.004));
            
            this.updateCameraPosition();
            this.previousMousePosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        }
        
        if (this.isZooming && event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            const delta = this.previousPinchDistance - currentDistance;
            this.spherical.radius = Math.max(2.1, Math.min(18, this.spherical.radius + delta * 0.012));
            this.updateCameraPosition();
            
            this.previousPinchDistance = currentDistance;
        }
    }
    
    onTouchEnd(event) {
        if (event.touches.length === 0) {
            this.isRotating = false;
            this.isZooming = false;
            this.saveMarkers();
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    updateCameraPosition() {
        const x = this.spherical.radius * Math.sin(this.spherical.phi) * Math.cos(this.spherical.theta);
        const y = this.spherical.radius * Math.cos(this.spherical.phi);
        const z = this.spherical.radius * Math.sin(this.spherical.phi) * Math.sin(this.spherical.theta);
        
        this.camera.position.set(x, y, z);
        this.camera.lookAt(0, 0, 0);
    }
    
    resetView() {
        this.spherical = { radius: 6, theta: 0, phi: Math.PI / 2 };
        this.autoRotate = true;
        this.updateCameraPosition();
        this.saveMarkers();
    }
    
    handleClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        if (this.isAddMarkerMode && this.moon) {
            const intersects = this.raycaster.intersectObject(this.moon);
            if (intersects.length > 0) {
                this.showAddMarkerPanel(intersects[0].point);
            }
        } else {
            const allMarkerMeshes = [];
            this.markerObjects.forEach(obj => {
                obj.traverse((child) => {
                    if (child.isMesh) {
                        allMarkerMeshes.push(child);
                    }
                });
            });
            
            const markerIntersects = this.raycaster.intersectObjects(allMarkerMeshes);
            
            if (markerIntersects.length > 0) {
                const clickedMesh = markerIntersects[0].object;
                
                for (let i = 0; i < this.markerObjects.length; i++) {
                    let found = false;
                    this.markerObjects[i].traverse((child) => {
                        if (child === clickedMesh) {
                            found = true;
                        }
                    });
                    
                    if (found) {
                        this.selectedMarker = this.markers[i];
                        this.showMarkerInfo(this.selectedMarker, i);
                        break;
                    }
                }
            }
        }
    }
    
    worldToSpherical(point) {
        const radius = point.length();
        const theta = Math.atan2(point.z, point.x);
        const phi = Math.acos(point.y / radius);
        
        let lat = 90 - (phi * 180 / Math.PI);
        let lng = theta * 180 / Math.PI;
        
        if (lng > 180) lng -= 360;
        if (lng < -180) lng += 360;
        
        return { lat, lng, radius };
    }
    
    sphericalToWorld(lat, lng, radius = 2.03) {
        const phi = (90 - lat) * Math.PI / 180;
        const theta = lng * Math.PI / 180;
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        return new THREE.Vector3(x, y, z);
    }
    
    createMarkerObject(marker) {
        const group = new THREE.Group();
        
        const baseSize = 0.022 * marker.size;
        
        const glowGeometry = new THREE.SphereGeometry(baseSize * 2, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(marker.color),
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);
        
        const mainGeometry = new THREE.SphereGeometry(baseSize, 48, 48);
        const mainMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(marker.color),
            transparent: true,
            opacity: 0.95,
            emissive: new THREE.Color(marker.color),
            emissiveIntensity: 0.3,
            metalness: 0.3,
            roughness: 0.4
        });
        const mainSphere = new THREE.Mesh(mainGeometry, mainMaterial);
        group.add(mainSphere);
        
        const highlightGeometry = new THREE.SphereGeometry(baseSize * 0.45, 24, 24);
        const highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.65
        });
        const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
        highlight.position.set(-baseSize * 0.25, baseSize * 0.35, baseSize * 0.55);
        group.add(highlight);
        
        const ringGeometry = new THREE.RingGeometry(baseSize * 1.3, baseSize * 1.6, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(marker.color),
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        group.add(ring);
        
        const innerRingGeometry = new THREE.RingGeometry(baseSize * 0.8, baseSize * 0.95, 48);
        const innerRingMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide
        });
        const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
        group.add(innerRing);
        
        const position = this.sphericalToWorld(marker.lat, marker.lng, 2.03);
        group.position.copy(position);
        
        group.lookAt(0, 0, 0);
        
        group.userData = { isMarker: true, marker: marker };
        
        return group;
    }
    
    addMarker(marker) {
        this.markers.push(marker);
        const markerObj = this.createMarkerObject(marker);
        this.markerObjects.push(markerObj);
        this.scene.add(markerObj);
        this.saveMarkers();
    }
    
    removeMarker(index) {
        if (index >= 0 && index < this.markers.length) {
            const obj = this.markerObjects[index];
            this.scene.remove(obj);
            
            obj.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            
            this.markers.splice(index, 1);
            this.markerObjects.splice(index, 1);
            this.saveMarkers();
        }
    }
    
    updateMarker(index, updates) {
        if (index >= 0 && index < this.markers.length) {
            Object.assign(this.markers[index], updates);
            
            const oldObj = this.markerObjects[index];
            this.scene.remove(oldObj);
            
            oldObj.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            
            const newObj = this.createMarkerObject(this.markers[index]);
            this.markerObjects[index] = newObj;
            this.scene.add(newObj);
            
            this.saveMarkers();
        }
    }
    
    toggleMarkers(show) {
        this.showMarkers = show;
        this.markerObjects.forEach(obj => {
            obj.visible = show;
        });
    }
    
    saveMarkers() {
        try {
            localStorage.setItem('moon_markers', JSON.stringify(this.markers));
            localStorage.setItem('moon_view', JSON.stringify(this.spherical));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }
    
    loadMarkers() {
        try {
            const savedMarkers = localStorage.getItem('moon_markers');
            if (savedMarkers) {
                this.markers = JSON.parse(savedMarkers);
                this.markers.forEach(marker => {
                    const markerObj = this.createMarkerObject(marker);
                    this.markerObjects.push(markerObj);
                    this.scene.add(markerObj);
                });
            }
            
            const savedView = localStorage.getItem('moon_view');
            if (savedView) {
                this.spherical = JSON.parse(savedView);
                this.autoRotate = false;
                this.updateCameraPosition();
            }
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            this.markers = [];
        }
    }
    
    showMarkerInfo(marker, index) {
        const panel = document.getElementById('marker-info');
        const coordsSpan = document.getElementById('info-coords');
        const nameInput = document.getElementById('info-name');
        const descInput = document.getElementById('info-desc');
        
        coordsSpan.textContent = `纬度: ${marker.lat.toFixed(4)}°, 经度: ${marker.lng.toFixed(4)}°`;
        nameInput.value = marker.name || '';
        descInput.value = marker.description || '';
        
        panel.classList.remove('hidden');
        panel.dataset.index = index;
    }
    
    hideMarkerInfo() {
        document.getElementById('marker-info').classList.add('hidden');
        this.selectedMarker = null;
    }
    
    showAddMarkerPanel(position) {
        this.pendingMarkerPosition = position;
        const spherical = this.worldToSpherical(position);
        
        const panel = document.getElementById('add-marker-panel');
        const coordsSpan = document.getElementById('add-coords');
        const nameInput = document.getElementById('add-name');
        const descInput = document.getElementById('add-desc');
        
        coordsSpan.textContent = `纬度: ${spherical.lat.toFixed(4)}°, 经度: ${spherical.lng.toFixed(4)}°`;
        nameInput.value = '';
        descInput.value = '';
        
        panel.classList.remove('hidden');
    }
    
    hideAddMarkerPanel() {
        document.getElementById('add-marker-panel').classList.add('hidden');
        this.pendingMarkerPosition = null;
    }
    
    setupUI() {
        document.getElementById('reset-view').addEventListener('click', () => {
            this.resetView();
        });
        
        const toggleBtn = document.getElementById('toggle-markers');
        toggleBtn.addEventListener('click', () => {
            this.showMarkers = !this.showMarkers;
            this.toggleMarkers(this.showMarkers);
            toggleBtn.textContent = this.showMarkers ? '隐藏标记点' : '显示标记点';
            toggleBtn.classList.toggle('active', this.showMarkers);
        });
        
        const addModeBtn = document.getElementById('add-marker-mode');
        addModeBtn.addEventListener('click', () => {
            this.isAddMarkerMode = !this.isAddMarkerMode;
            addModeBtn.classList.toggle('active', this.isAddMarkerMode);
            addModeBtn.textContent = this.isAddMarkerMode ? '取消添加模式' : '添加标记点模式';
            
            const indicator = document.getElementById('mode-indicator');
            if (this.isAddMarkerMode) {
                indicator.classList.remove('hidden');
            } else {
                indicator.classList.add('hidden');
                this.hideAddMarkerPanel();
            }
        });
        
        document.getElementById('exit-mode').addEventListener('click', () => {
            this.isAddMarkerMode = false;
            document.getElementById('add-marker-mode').classList.remove('active');
            document.getElementById('add-marker-mode').textContent = '添加标记点模式';
            document.getElementById('mode-indicator').classList.add('hidden');
            this.hideAddMarkerPanel();
        });
        
        document.getElementById('marker-color').addEventListener('input', (e) => {
            this.markerColor = e.target.value;
        });
        
        document.getElementById('marker-size').addEventListener('input', (e) => {
            this.markerSize = parseInt(e.target.value);
        });
        
        document.getElementById('save-marker').addEventListener('click', () => {
            const panel = document.getElementById('marker-info');
            const index = parseInt(panel.dataset.index);
            const name = document.getElementById('info-name').value;
            const desc = document.getElementById('info-desc').value;
            
            this.updateMarker(index, {
                name: name,
                description: desc
            });
            
            this.hideMarkerInfo();
        });
        
        document.getElementById('delete-marker').addEventListener('click', () => {
            const panel = document.getElementById('marker-info');
            const index = parseInt(panel.dataset.index);
            
            if (confirm('确定要删除这个标记点吗？')) {
                this.removeMarker(index);
                this.hideMarkerInfo();
            }
        });
        
        document.getElementById('close-info').addEventListener('click', () => {
            this.hideMarkerInfo();
        });
        
        document.getElementById('confirm-add').addEventListener('click', () => {
            if (this.pendingMarkerPosition) {
                const spherical = this.worldToSpherical(this.pendingMarkerPosition);
                const name = document.getElementById('add-name').value || `标记点 ${this.markers.length + 1}`;
                const desc = document.getElementById('add-desc').value;
                
                const marker = {
                    id: Date.now(),
                    lat: spherical.lat,
                    lng: spherical.lng,
                    name: name,
                    description: desc,
                    color: this.markerColor,
                    size: this.markerSize,
                    createdAt: new Date().toISOString()
                };
                
                this.addMarker(marker);
                this.hideAddMarkerPanel();
            }
        });
        
        document.getElementById('cancel-add').addEventListener('click', () => {
            this.hideAddMarkerPanel();
        });
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        if (this.autoRotate && this.moon) {
            this.spherical.theta += 0.0005;
            this.updateCameraPosition();
        }
        
        if (this.stars) {
            this.stars.rotation.y += 0.00001;
        }
        
        this.markerObjects.forEach((obj, index) => {
            if (obj.visible) {
                const marker = this.markers[index];
                if (marker) {
                    const position = this.sphericalToWorld(marker.lat, marker.lng, 2.03);
                    obj.position.copy(position);
                    obj.lookAt(0, 0, 0);
                }
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Moon3DViewer();
});
