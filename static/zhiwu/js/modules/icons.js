(function(global) {
    'use strict';

    const PlantIcons = {
        icons: [
            {
                id: 'pothos',
                name: '绿萝',
                emoji: '🌿',
                color: '#4CAF50'
            },
            {
                id: 'spider',
                name: '吊兰',
                emoji: '🌾',
                color: '#8BC34A'
            },
            {
                id: 'ivy',
                name: '常春藤',
                emoji: '🍀',
                color: '#689F38'
            },
            {
                id: 'succulent',
                name: '多肉',
                emoji: '🌵',
                color: '#7CB342'
            },
            {
                id: 'cactus',
                name: '仙人掌',
                emoji: '🌵',
                color: '#558B2F'
            },
            {
                id: 'rose',
                name: '月季',
                emoji: '🌹',
                color: '#E91E63'
            },
            {
                id: 'orchid',
                name: '兰花',
                emoji: '🌸',
                color: '#9C27B0'
            },
            {
                id: 'peace_lily',
                name: '白掌',
                emoji: '🌼',
                color: '#FFEB3B'
            },
            {
                id: 'snake_plant',
                name: '虎皮兰',
                emoji: '🪴',
                color: '#2E7D32'
            },
            {
                id: 'monstera',
                name: '龟背竹',
                emoji: '🌴',
                color: '#1B5E20'
            },
            {
                id: 'fern',
                name: '蕨类',
                emoji: '🌲',
                color: '#33691E'
            },
            {
                id: 'lucky_bamboo',
                name: '富贵竹',
                emoji: '🎋',
                color: '#64DD17'
            }
        ],

        waterTypes: [
            {
                id: 'daily',
                name: '每天浇水',
                description: '水培植物、喜湿植物',
                examples: ['铜钱草', '薄荷']
            },
            {
                id: 'every_n_days',
                name: '每 N 天',
                description: '绿萝、吊兰、常春藤等',
                examples: ['绿萝', '吊兰', '常春藤']
            },
            {
                id: 'weekly_days',
                name: '每周特定日',
                description: '多肉、仙人掌等',
                examples: ['多肉', '仙人掌']
            },
            {
                id: 'every_n_weeks',
                name: '每 N 周',
                description: '大型多肉、耐旱植物',
                examples: ['大型多肉', '龙舌兰']
            },
            {
                id: 'monthly_days',
                name: '每月特定日',
                description: '仙人球、虎皮兰等',
                examples: ['仙人球', '虎皮兰']
            }
        ],

        defaultSettings: {
            daily: {},
            every_n_days: { days: 3 },
            weekly_days: { days: [1, 3] },
            every_n_weeks: { weeks: 2, weekday: 1 },
            monthly_days: { days: [1, 15] }
        },

        getIconById: function(id) {
            return this.icons.find(icon => icon.id === id) || this.icons[0];
        },

        getAllIcons: function() {
            return this.icons;
        },

        getWaterTypeById: function(id) {
            return this.waterTypes.find(type => type.id === id);
        },

        getDefaultSettings: function(waterTypeId) {
            return this.defaultSettings[waterTypeId] || {};
        },

        formatWaterSchedule: function(plant) {
            const waterType = plant.waterType;
            const settings = plant.waterSettings || {};

            switch (waterType) {
                case 'daily':
                    return '每天浇水';
                case 'every_n_days':
                    return `每 ${settings.days || 3} 天`;
                case 'weekly_days':
                    const weekDays = (settings.days || []).map(d => this.getWeekdayName(d));
                    return `每周 ${weekDays.join('、')}`;
                case 'every_n_weeks':
                    return `每 ${settings.weeks || 2} 周 ${this.getWeekdayName(settings.weekday || 1)}`;
                case 'monthly_days':
                    const monthDays = (settings.days || []).map(d => `${d}号`);
                    return `每月 ${monthDays.join('、')}`;
                default:
                    return '未设置';
            }
        },

        getWeekdayName: function(day) {
            const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            return names[day % 7];
        },

        getWeekdayNames: function() {
            return ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        }
    };

    global.IconsModule = PlantIcons;
})(window);
