const Utils = {
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    lerp(start, end, t) {
        return start + (end - start) * t;
    },
    
    rand(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    randInt(min, max) {
        return Math.floor(this.rand(min, max + 1));
    },
    
    degToRad(degrees) {
        return degrees * (Math.PI / 180);
    },
    
    radToDeg(radians) {
        return radians * (180 / Math.PI);
    },
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    },
    
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = Math.round(this.clamp(x, 0, 255)).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    },
    
    rotatePoint3D(x, y, z, rotX, rotY) {
        let cosY = Math.cos(rotY);
        let sinY = Math.sin(rotY);
        let x1 = x * cosY - z * sinY;
        let z1 = x * sinY + z * cosY;
        
        let cosX = Math.cos(rotX);
        let sinX = Math.sin(rotX);
        let y1 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;
        
        return { x: x1, y: y1, z: z2 };
    },
    
    project3D(x, y, z, width, height, zoom, fov = 400) {
        const factor = fov / (fov + z * zoom);
        return {
            x: width / 2 + x * zoom * factor,
            y: height / 2 - y * zoom * factor,
            z: z,
            factor: factor
        };
    },
    
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    getRandomBasePair() {
        return BASE_PAIRS[Math.floor(Math.random() * BASE_PAIRS.length)];
    },
    
    generateBasePairs(count) {
        const pairs = [];
        for (let i = 0; i < count; i++) {
            pairs.push(this.getRandomBasePair());
        }
        return pairs;
    }
};
