const RARITY_COLORS = {
    common: '#8899aa',
    uncommon: '#4a7c59',
    rare: '#3b82f6',
    epic: '#a020f0',
    legendary: '#ffa500'
};

const RARITY_TEXTS = {
    common: '普通',
    uncommon: '优秀',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
};

const WEAPON_TYPE_TEXTS = {
    pistol: '手枪',
    rifle: '步枪',
    sniper: '狙击枪',
    shotgun: '霰弹枪',
    smg: '冲锋枪'
};

const TERRAIN_TEXTS = {
    forest: '丛林',
    desert: '沙漠',
    city: '城市',
    island: '海岛'
};

function formatTime(time) {
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
    } else if (diff < 604800000) {
        return `${Math.floor(diff / 86400000)}天前`;
    } else {
        return `${date.getMonth() + 1}-${date.getDate()}`;
    }
}

function formatDate(time) {
    if (!time) return '-';
    const date = new Date(time);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
}

function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return String(num);
}

function validateUsername(username) {
    if (!username) return false;
    if (username.length < 3 || username.length > 20) return false;
    const pattern = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
    return pattern.test(username);
}

function validatePassword(password) {
    if (!password) return false;
    if (password.length < 6) return false;
    return true;
}

function showToast(message, duration = 2000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300);
    }, duration);
}

function showLoading() {
    let mask = document.getElementById('loadingMask');
    if (mask) return;

    mask = document.createElement('div');
    mask.id = 'loadingMask';
    mask.className = 'loading-mask';
    mask.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(mask);
}

function hideLoading() {
    const mask = document.getElementById('loadingMask');
    if (mask) {
        mask.remove();
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateKD(kills, deaths) {
    if (!deaths || deaths === 0) {
        return kills ? kills.toFixed(2) : '0.00';
    }
    return (kills / deaths).toFixed(2);
}

function rarityColor(rarity) {
    return RARITY_COLORS[rarity] || RARITY_COLORS.common;
}

function rarityText(rarity) {
    return RARITY_TEXTS[rarity] || RARITY_TEXTS.common;
}

function weaponTypeText(type) {
    return WEAPON_TYPE_TEXTS[type] || '未知';
}

function terrainText(terrain) {
    return TERRAIN_TEXTS[terrain] || '未知';
}

const Utils = {
    formatTime,
    formatDate,
    formatNumber,
    validateUsername,
    validatePassword,
    showToast,
    showLoading,
    hideLoading,
    sleep,
    randomInt,
    calculateKD,
    rarityColor,
    rarityText,
    weaponTypeText,
    terrainText,
    RARITY_COLORS,
    RARITY_TEXTS,
    WEAPON_TYPE_TEXTS,
    TERRAIN_TEXTS
};

window.Utils = Utils;
window.formatTime = formatTime;
window.formatDate = formatDate;
window.formatNumber = formatNumber;
window.validateUsername = validateUsername;
window.validatePassword = validatePassword;
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.sleep = sleep;
window.randomInt = randomInt;
window.calculateKD = calculateKD;
window.rarityColor = rarityColor;
window.rarityText = rarityText;
window.weaponTypeText = weaponTypeText;
window.terrainText = terrainText;

const Tabbar = {
    render(active = 'home') {
        return `
            <nav class="tabbar">
                <div class="tabbar-item ${active === 'home' ? 'active' : ''}" onclick="Router.navigate('home')">
                    <span class="tabbar-icon">🏠</span>
                    <span class="tabbar-text">大厅</span>
                </div>
                <div class="tabbar-item ${active === 'leaderboard' ? 'active' : ''}" onclick="Router.navigate('leaderboard')">
                    <span class="tabbar-icon">🏆</span>
                    <span class="tabbar-text">排行</span>
                </div>
                <div class="tabbar-item ${active === 'achievements' ? 'active' : ''}" onclick="Router.navigate('achievements')">
                    <span class="tabbar-icon">🎖️</span>
                    <span class="tabbar-text">成就</span>
                </div>
                <div class="tabbar-item ${active === 'profile' ? 'active' : ''}" onclick="Router.navigate('profile')">
                    <span class="tabbar-icon">👤</span>
                    <span class="tabbar-text">我的</span>
                </div>
            </nav>
        `;
    }
};
