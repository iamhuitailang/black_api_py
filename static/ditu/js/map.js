const MapRenderer = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    provinces: [],
    highlightedProvince: null,

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.generateMapData();
        this.centerMap();
    },

    resize() {
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.ctx.scale(dpr, dpr);
    },

    generateMapData() {
        this.provinces = CHINA_MAP_DATA.provinces.map(province => ({
            ...province,
            status: 'unknown',
            hintsUsed: 0,
            path2D: this.createPathFromPoints(province.points)
        }));
    },

    createPathFromPoints(points) {
        const path = new Path2D();
        if (points.length > 0) {
            path.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < points.length; i++) {
                path.lineTo(points[i][0], points[i][1]);
            }
            path.closePath();
        }
        return path;
    },

    centerMap() {
        const mapWidth = CHINA_MAP_DATA.width;
        const mapHeight = CHINA_MAP_DATA.height;
        this.scale = Math.min(this.width / mapWidth, this.height / mapHeight) * 0.9;
        this.offsetX = (this.width - mapWidth * this.scale) / 2;
        this.offsetY = (this.height - mapHeight * this.scale) / 2;
    },

    screenToWorld(x, y) {
        return {
            x: (x - this.offsetX) / this.scale,
            y: (y - this.offsetY) / this.scale
        };
    },

    worldToScreen(x, y) {
        return {
            x: x * this.scale + this.offsetX,
            y: y * this.scale + this.offsetY
        };
    },

    getProvinceAt(x, y) {
        const worldPos = this.screenToWorld(x, y);
        for (const province of this.provinces) {
            if (province.path2D && this.ctx.isPointInPath(province.path2D, worldPos.x, worldPos.y)) {
                return province;
            }
        }
        return null;
    },

    setProvinceStatus(provinceId, status) {
        const province = this.provinces.find(p => p.id === provinceId);
        if (province) {
            province.status = status;
        }
    },

    resetProvinces(region = 'all') {
        const regionMap = {
            'dongbei': ['heilongjiang', 'jilin', 'liaoning'],
            'huabei': ['neimenggu', 'beijing', 'tianjin', 'hebei', 'shanxi'],
            'huadong': ['shandong', 'jiangsu', 'anhui', 'zhejiang', 'jiangxi', 'fujian', 'taiwan', 'shanghai'],
            'huanan': ['guangdong', 'guangxi', 'hainan', 'hongkong', 'macau'],
            'huazhong': ['henan', 'hubei', 'hunan'],
            'xinan': ['sichuan', 'chongqing', 'guizhou', 'yunnan', 'xizang'],
            'xibei': ['shaanxi', 'ningxia', 'gansu', 'qinghai', 'xinjiang']
        };

        let targetIds = [];
        if (region === 'all') {
            targetIds = this.provinces.map(p => p.id);
        } else if (regionMap[region]) {
            targetIds = regionMap[region];
        } else {
            const regionProvinces = getProvincesByRegion(region);
            targetIds = regionProvinces.map(p => p.id);
        }

        this.provinces.forEach(province => {
            if (targetIds.includes(province.id)) {
                province.status = 'blank';
                province.hintsUsed = 0;
            } else {
                province.status = 'known';
                province.hintsUsed = 0;
            }
        });
    },

    render() {
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();

        const bgGradient = ctx.createLinearGradient(0, 0, this.width, this.height);
        bgGradient.addColorStop(0, '#f0f8ff');
        bgGradient.addColorStop(0.5, '#e6f3ff');
        bgGradient.addColorStop(1, '#d4e8f7');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);

        this.provinces.forEach(province => {
            this.drawProvince(ctx, province);
        });

        ctx.restore();
    },

    drawProvince(ctx, province) {
        let fillColor, strokeColor, gradient;
        switch (province.status) {
            case 'blank':
                fillColor = '#f8f9fa';
                strokeColor = '#888';
                break;
            case 'correct':
                fillColor = '#4CAF50';
                strokeColor = '#2E7D32';
                break;
            case 'wrong':
                fillColor = '#F44336';
                strokeColor = '#C62828';
                break;
            case 'known':
            default:
                fillColor = '#BBDEFB';
                strokeColor = '#1976D2';
        }

        if (this.highlightedProvince === province.id) {
            fillColor = this.lightenColor(fillColor, 20);
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }

        ctx.lineWidth = 1.2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        if (province.path2D) {
            const bounds = this.getPathBounds(province.points);
            gradient = ctx.createLinearGradient(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
            gradient.addColorStop(0, fillColor);
            gradient.addColorStop(1, this.darkenColor(fillColor, 12));
            ctx.fillStyle = gradient;
            ctx.fill(province.path2D);

            ctx.strokeStyle = strokeColor;
            ctx.stroke(province.path2D);
        }

        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        if (province.status === 'known' || province.status === 'correct') {
            ctx.fillStyle = '#1a1a1a';
            ctx.font = 'bold 14px "Microsoft YaHei", "PingFang SC", "Heiti SC", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const displayName = province.name.length > 4 ? province.name.substring(0, 2) : province.name;
            ctx.fillText(displayName, province.center.x, province.center.y);
        }
    },

    getPathBounds(points) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        points.forEach(p => {
            minX = Math.min(minX, p[0]);
            minY = Math.min(minY, p[1]);
            maxX = Math.max(maxX, p[0]);
            maxY = Math.max(maxY, p[1]);
        });
        return { minX, minY, maxX, maxY };
    },

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    },

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    },

    zoom(direction, centerX, centerY) {
        const oldScale = this.scale;
        if (direction > 0) {
            this.scale = Math.min(this.scale + CONFIG.SCALE_STEP, CONFIG.MAX_SCALE);
        } else {
            this.scale = Math.max(this.scale - CONFIG.SCALE_STEP, CONFIG.MIN_SCALE);
        }

        const scaleRatio = this.scale / oldScale;
        this.offsetX = centerX - (centerX - this.offsetX) * scaleRatio;
        this.offsetY = centerY - (centerY - this.offsetY) * scaleRatio;
    },

    pan(dx, dy) {
        this.offsetX += dx;
        this.offsetY += dy;
    },

    focusOnProvince(provinceId) {
        const province = this.provinces.find(p => p.id === provinceId);
        if (province) {
            this.scale = 1.5;
            this.offsetX = this.width / 2 - province.center.x * this.scale;
            this.offsetY = this.height / 2 - province.center.y * this.scale;
        }
    },

    getState() {
        return {
            scale: this.scale,
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            provinces: this.provinces.map(p => ({
                id: p.id,
                status: p.status,
                hintsUsed: p.hintsUsed
            }))
        };
    },

    restoreState(state) {
        if (typeof state.scale === 'number') this.scale = state.scale;
        if (typeof state.offsetX === 'number') this.offsetX = state.offsetX;
        if (typeof state.offsetY === 'number') this.offsetY = state.offsetY;
        if (Array.isArray(state.provinces)) {
            state.provinces.forEach(saved => {
                const province = this.provinces.find(p => p.id === saved.id);
                if (province) {
                    province.status = saved.status;
                    province.hintsUsed = saved.hintsUsed || 0;
                }
            });
        }
    }
};
