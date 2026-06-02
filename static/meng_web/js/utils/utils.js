const Toast = {
    show(message, duration = 2000, type = 'info') {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            toast.style.transform = 'translateY(-10px) scale(0.95)';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, duration);
    },

    success(message, duration = 2000) {
        this.show(message, duration, 'success');
    },

    error(message, duration = 2000) {
        this.show(message, duration, 'error');
    },

    info(message, duration = 2000) {
        this.show(message, duration, 'info');
    },

    warning(message, duration = 2000) {
        this.show(message, duration, 'warning');
    }
};

const Loading = {
    show() {
        let mask = document.getElementById('loadingMask');
        if (mask) return;

        mask = document.createElement('div');
        mask.id = 'loadingMask';
        mask.className = 'loading-mask';
        mask.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(mask);
    },

    hide() {
        const mask = document.getElementById('loadingMask');
        if (mask) {
            mask.style.opacity = '0';
            mask.style.transition = 'opacity 0.2s ease';
            setTimeout(() => {
                if (mask.parentNode) {
                    mask.parentNode.removeChild(mask);
                }
            }, 200);
        }
    }
};

const FormValidator = {
    rules: {
        required: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        phone: (value) => /^1[3-9]\d{9}$/.test(value),
        username: (value) => /^[a-zA-Z0-9_]{3,20}$/.test(value),
        password: (value) => value && value.length >= 6 && value.length <= 20,
        minLength: (value, min) => value && value.length >= min,
        maxLength: (value, max) => value && value.length <= max,
        numeric: (value) => !isNaN(parseFloat(value)) && isFinite(value),
        integer: (value) => /^-?\d+$/.test(value),
        positive: (value) => parseFloat(value) > 0,
        url: (value) => /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(value)
    },

    validate(value, rules) {
        const errors = [];
        
        for (const rule of rules) {
            let ruleName, params;
            
            if (typeof rule === 'string') {
                ruleName = rule;
                params = [];
            } else if (Array.isArray(rule)) {
                ruleName = rule[0];
                params = rule.slice(1);
            } else {
                continue;
            }

            const validator = this.rules[ruleName];
            if (validator && !validator(value, ...params)) {
                errors.push(this.getErrorMessage(ruleName, params));
            }
        }
        
        return errors;
    },

    validateForm(data, schema) {
        const errors = {};
        let isValid = true;

        for (const [field, rules] of Object.entries(schema)) {
            const fieldErrors = this.validate(data[field], rules);
            if (fieldErrors.length > 0) {
                errors[field] = fieldErrors;
                isValid = false;
            }
        }

        return { isValid, errors };
    },

    getErrorMessage(ruleName, params) {
        const messages = {
            required: '此项为必填项',
            email: '请输入有效的邮箱地址',
            phone: '请输入有效的手机号码',
            username: '用户名只能包含字母、数字和下划线，长度3-20位',
            password: '密码长度需在6-20位之间',
            minLength: `最少需要${params[0]}个字符`,
            maxLength: `最多允许${params[0]}个字符`,
            numeric: '请输入有效的数字',
            integer: '请输入整数',
            positive: '请输入正数',
            url: '请输入有效的网址'
        };
        return messages[ruleName] || '输入格式不正确';
    }
};

const IdGenerator = {
    generate(prefix = '') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return prefix + timestamp + random;
    },

    uuid() {
        if (crypto && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    shortId() {
        return Math.random().toString(36).substr(2, 8);
    },

    snowflake() {
        const epoch = 1609459200000;
        const timestamp = (Date.now() - epoch).toString(2).padStart(41, '0');
        const datacenter = Math.floor(Math.random() * 5).toString(2).padStart(5, '0');
        const worker = Math.floor(Math.random() * 5).toString(2).padStart(5, '0');
        const sequence = Math.floor(Math.random() * 4096).toString(2).padStart(12, '0');
        return BigInt('0b' + timestamp + datacenter + worker + sequence).toString();
    }
};

const CoordTransform = {
    worldToScreen(x, y, z, camera) {
        const { x: cx, y: cy, z: cz, fov } = camera;
        const dx = x - cx;
        const dy = y - cy;
        const dz = z - cz;
        
        if (dz <= 0) return null;
        
        const scale = fov / dz;
        return {
            x: dx * scale,
            y: dy * scale,
            scale: scale
        };
    },

    screenToWorld(screenX, screenY, z, camera) {
        const { x: cx, y: cy, z: cz, fov } = camera;
        const dz = z - cz;
        const scale = dz / fov;
        return {
            x: screenX * scale + cx,
            y: -screenY * scale + cy,
            z: z
        };
    },

    isometricToScreen(x, y, z, tileWidth = 64, tileHeight = 32) {
        return {
            x: (x - y) * (tileWidth / 2),
            y: (x + y) * (tileHeight / 2) - z * tileHeight
        };
    },

    screenToIsometric(screenX, screenY, tileWidth = 64, tileHeight = 32) {
        const halfWidth = tileWidth / 2;
        const halfHeight = tileHeight / 2;
        return {
            x: (screenX / halfWidth + screenY / halfHeight) / 2,
            y: (screenY / halfHeight - screenX / halfWidth) / 2
        };
    },

    gridToPixel(gridX, gridY, cellSize = 32) {
        return {
            x: gridX * cellSize,
            y: gridY * cellSize
        };
    },

    pixelToGrid(pixelX, pixelY, cellSize = 32) {
        return {
            x: Math.floor(pixelX / cellSize),
            y: Math.floor(pixelY / cellSize)
        };
    },

    latLngToTile(lat, lng, zoom) {
        const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
        const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
        return { x, y, z: zoom };
    },

    tileToLatLng(x, y, zoom) {
        const n = Math.pow(2, zoom);
        const lng = x / n * 360 - 180;
        const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
        return { lat, lng };
    },

    distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },

    distance3d(x1, y1, z1, x2, y2, z2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));
    },

    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
};

const DateUtils = {
    formatTime(time, format = 'YYYY-MM-DD HH:mm:ss') {
        if (!time) return '-';
        const date = new Date(time);
        if (isNaN(date.getTime())) return '-';
        
        const map = {
            'YYYY': date.getFullYear(),
            'MM': String(date.getMonth() + 1).padStart(2, '0'),
            'DD': String(date.getDate()).padStart(2, '0'),
            'HH': String(date.getHours()).padStart(2, '0'),
            'mm': String(date.getMinutes()).padStart(2, '0'),
            'ss': String(date.getSeconds()).padStart(2, '0')
        };
        
        return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => map[match]);
    },

    timeAgo(time) {
        if (!time) return '-';
        const date = new Date(time);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) {
            return '刚刚';
        } else if (diff < 3600000) {
            return `${Math.floor(diff / 60000)}分钟前`;
        } else if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)}小时前`;
        } else if (diff < 2592000000) {
            return `${Math.floor(diff / 86400000)}天前`;
        } else if (diff < 31536000000) {
            return `${Math.floor(diff / 2592000000)}个月前`;
        } else {
            return `${Math.floor(diff / 31536000000)}年前`;
        }
    },

    getTodayRange() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return {
            start: today.getTime(),
            end: tomorrow.getTime()
        };
    },

    getWeekRange() {
        const now = new Date();
        const dayOfWeek = now.getDay() || 7;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek + 1);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        return {
            start: weekStart.getTime(),
            end: weekEnd.getTime()
        };
    },

    getMonthRange() {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return {
            start: monthStart.getTime(),
            end: monthEnd.getTime()
        };
    },

    isSameDay(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    },

    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    },

    addHours(date, hours) {
        const result = new Date(date);
        result.setHours(result.getHours() + hours);
        return result;
    }
};

const StringUtils = {
    truncate(str, maxLength = 50, suffix = '...') {
        if (!str) return '';
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength) + suffix;
    },

    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    camelToSnake(str) {
        return str.replace(/[A-Z]/g, (match) => '_' + match.toLowerCase());
    },

    snakeToCamel(str) {
        return str.replace(/_([a-z])/g, (_, match) => match.toUpperCase());
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    unescapeHtml(str) {
        const div = document.createElement('div');
        div.innerHTML = str;
        return div.textContent;
    },

    generateRandomString(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    formatNumber(num, decimals = 0) {
        if (isNaN(num)) return '0';
        return Number(num).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    maskPhone(phone) {
        if (!phone || phone.length < 11) return phone;
        return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    },

    maskEmail(email) {
        if (!email || !email.includes('@')) return email;
        const [name, domain] = email.split('@');
        const maskedName = name.length > 2 
            ? name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1)
            : name.charAt(0) + '*';
        return maskedName + '@' + domain;
    }
};

const ArrayUtils = {
    groupBy(arr, key) {
        return arr.reduce((groups, item) => {
            const groupKey = typeof key === 'function' ? key(item) : item[key];
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(item);
            return groups;
        }, {});
    },

    sortBy(arr, key, order = 'asc') {
        return [...arr].sort((a, b) => {
            const valA = typeof key === 'function' ? key(a) : a[key];
            const valB = typeof key === 'function' ? key(b) : b[key];
            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            return 0;
        });
    },

    unique(arr, key) {
        if (!key) return [...new Set(arr)];
        const seen = new Set();
        return arr.filter(item => {
            const val = typeof key === 'function' ? key(item) : item[key];
            if (seen.has(val)) return false;
            seen.add(val);
            return true;
        });
    },

    chunk(arr, size) {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    },

    shuffle(arr) {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    },

    sum(arr, key) {
        return arr.reduce((total, item) => {
            const val = typeof key === 'function' ? key(item) : item[key] ?? item;
            return total + (parseFloat(val) || 0);
        }, 0);
    },

    average(arr, key) {
        if (arr.length === 0) return 0;
        return this.sum(arr, key) / arr.length;
    },

    getRandomItem(arr) {
        if (arr.length === 0) return null;
        return arr[Math.floor(Math.random() * arr.length)];
    },

    intersect(arr1, arr2) {
        return arr1.filter(item => arr2.includes(item));
    },

    difference(arr1, arr2) {
        return arr1.filter(item => !arr2.includes(item));
    }
};

const ColorUtils = {
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    },

    hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    },

    rgbToHsl(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    },

    randomColor() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    },

    gradientColor(startColor, endColor, ratio) {
        const start = this.hexToRgb(startColor);
        const end = this.hexToRgb(endColor);
        if (!start || !end) return startColor;
        const r = Math.round(start.r + (end.r - start.r) * ratio);
        const g = Math.round(start.g + (end.g - start.g) * ratio);
        const b = Math.round(start.b + (end.b - start.b) * ratio);
        return this.rgbToHex(r, g, b);
    }
};

const Tabbar = {
    render(active = 'home') {
        return `
            <nav class="tabbar">
                <div class="tabbar-item ${active === 'home' ? 'active' : ''}" onclick="Router.navigate('home')">
                    <span class="tabbar-icon">🏠</span>
                    <span class="tabbar-text">首页</span>
                </div>
                <div class="tabbar-item ${active === 'game' ? 'active' : ''}" onclick="Router.navigate('game')">
                    <span class="tabbar-icon">🎮</span>
                    <span class="tabbar-text">游戏</span>
                </div>
                <div class="tabbar-item ${active === 'dream' ? 'active' : ''}" onclick="Router.navigate('dream')">
                    <span class="tabbar-icon">💫</span>
                    <span class="tabbar-text">梦境</span>
                </div>
                <div class="tabbar-item ${active === 'profile' ? 'active' : ''}" onclick="Router.navigate('profile')">
                    <span class="tabbar-icon">👤</span>
                    <span class="tabbar-text">我的</span>
                </div>
            </nav>
        `;
    }
};

const Utils = {
    ...DateUtils,
    ...StringUtils,
    ...ArrayUtils,
    ...ColorUtils,
    
    validateUsername(username) {
        if (!username) return false;
        return /^[a-zA-Z0-9_]{3,20}$/.test(username);
    },

    validatePassword(password) {
        if (!password) return false;
        return password.length >= 6 && password.length <= 20;
    },

    validateEmail(email) {
        if (!email) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    debounce(func, wait = 300) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    throttle(func, limit = 300) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    },

    copyToClipboard(text) {
        return new Promise((resolve, reject) => {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(resolve).catch(reject);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    resolve();
                } catch (e) {
                    reject(e);
                } finally {
                    document.body.removeChild(textarea);
                }
            }
        });
    },

    downloadFile(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    getQueryParams() {
        const params = {};
        const search = window.location.search.slice(1);
        if (!search) return params;
        search.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        });
        return params;
    },

    buildQueryString(params) {
        return Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
    },

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    retry(fn, retries = 3, delay = 1000) {
        return new Promise((resolve, reject) => {
            const attempt = async (remaining) => {
                try {
                    const result = await fn();
                    resolve(result);
                } catch (error) {
                    if (remaining <= 0) {
                        reject(error);
                    } else {
                        setTimeout(() => attempt(remaining - 1), delay);
                    }
                }
            };
            attempt(retries);
        });
    }
};

window.Toast = Toast;
window.Loading = Loading;
window.FormValidator = FormValidator;
window.IdGenerator = IdGenerator;
window.CoordTransform = CoordTransform;
window.DateUtils = DateUtils;
window.StringUtils = StringUtils;
window.ArrayUtils = ArrayUtils;
window.ColorUtils = ColorUtils;
window.Tabbar = Tabbar;
window.Utils = Utils;
