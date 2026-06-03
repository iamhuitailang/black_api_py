const DwUtils = {
    showToast(message, type = 'info') {
        if (window.DwUI) {
            DwUI.showToast(message, type);
        }
    },

    formatNumber(n) {
        if (n === undefined || n === null) return '0';
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return String(n);
    },

    formatDate(d) {
        if (!d) return '';
        const date = new Date(d);
        const now = new Date();
        const diff = now - date;
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
        if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
        return date.toLocaleDateString('zh-CN');
    },

    formatTime(seconds) {
        if (!seconds || seconds <= 0) return '00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    },

    rarityColor(rarity) {
        const map = {
            common: 'badge-common',
            uncommon: 'badge-uncommon',
            rare: 'badge-rare',
            epic: 'badge-epic',
            legendary: 'badge-legendary'
        };
        return map[rarity] || 'badge-common';
    },

    rarityText(rarity) {
        const map = {
            common: '普通',
            uncommon: '优秀',
            rare: '稀有',
            epic: '史诗',
            legendary: '传说'
        };
        return map[rarity] || '普通';
    },

    statusText(status) {
        const map = {
            healthy: '健康',
            hungry: '饥饿',
            sick: '生病',
            breeding: '繁殖中',
            unhappy: '不开心',
            old: '年老'
        };
        return map[status] || status || '健康';
    },

    statusEmoji(status) {
        const map = {
            healthy: '💚',
            hungry: '🍽️',
            sick: '🤒',
            breeding: '🥚',
            unhappy: '😢',
            old: '👴'
        };
        return map[status] || '💚';
    },

    habitatTypeName(type) {
        const map = {
            forest: '森林',
            savanna: '草原',
            ocean: '海洋',
            desert: '沙漠',
            arctic: '极地',
            wetland: '湿地',
            mountain: '山地',
            rainforest: '热带雨林'
        };
        return map[type] || type || '未知';
    },

    habitatTypeEmoji(type) {
        const map = {
            forest: '🌲',
            savanna: '🌾',
            ocean: '🌊',
            desert: '🏜️',
            arctic: '❄️',
            wetland: '🐊',
            mountain: '⛰️',
            rainforest: '🌴'
        };
        return map[type] || '🏞️';
    },

    categoryText(category) {
        const map = {
            mammal: '哺乳动物',
            bird: '鸟类',
            reptile: '爬行动物',
            amphibian: '两栖动物',
            fish: '鱼类',
            insect: '昆虫'
        };
        return map[category] || category || '未知';
    },

    genderText(gender) {
        return gender === 'male' ? '♂️ 雄性' : gender === 'female' ? '♀️ 雌性' : '未知';
    },

    genderEmoji(gender) {
        return gender === 'male' ? '♂️' : gender === 'female' ? '♀️' : '❓';
    },

    healthColor(value) {
        if (value >= 80) return 'health';
        if (value >= 50) return 'hunger';
        return 'danger';
    },

    barColor(value) {
        if (value >= 70) return '#22c55e';
        if (value >= 40) return '#f59e0b';
        return '#ef4444';
    }
};
