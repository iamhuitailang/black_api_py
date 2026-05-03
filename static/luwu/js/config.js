const Config = {
    STORAGE_KEYS: {
        GIFTS: 'luwu_gifts',
        FAVORITES: 'luwu_favorites',
        CUSTOM_GIFTS: 'luwu_custom_gifts',
        LAST_RECOMMEND: 'luwu_last_recommend'
    },

    DEFAULT_SELECTIONS: {
        relationship: '',
        gender: 'any',
        age: '',
        budget: '',
        interests: [],
        occasion: ''
    },

    RELATIONSHIPS: [
        { value: 'lover', label: '恋人/配偶', icon: '💕' },
        { value: 'parent', label: '父母', icon: '👨‍👩‍👧' },
        { value: 'child', label: '子女', icon: '👶' },
        { value: 'friend', label: '朋友', icon: '🤝' },
        { value: 'colleague', label: '同事', icon: '💼' },
        { value: 'elder', label: '长辈', icon: '👴' },
        { value: 'junior', label: '晚辈', icon: '🧒' }
    ],

    GENDERS: [
        { value: 'male', label: '男', icon: '♂️' },
        { value: 'female', label: '女', icon: '♀️' },
        { value: 'any', label: '不限', icon: '🎭' }
    ],

    AGE_GROUPS: [
        { value: 'child', label: '儿童', sub: '0-12岁', icon: '🧸' },
        { value: 'teen', label: '青少年', sub: '13-18岁', icon: '🎮' },
        { value: 'young', label: '青年', sub: '19-30岁', icon: '💪' },
        { value: 'middle', label: '中年', sub: '31-50岁', icon: '👔' },
        { value: 'elder', label: '老年', sub: '50+岁', icon: '👵' }
    ],

    BUDGETS: [
        { value: 'under100', label: '100元以下', icon: '💰', min: 0, max: 100 },
        { value: '100-300', label: '100-300元', icon: '💵', min: 100, max: 300 },
        { value: '300-500', label: '300-500元', icon: '💶', min: 300, max: 500 },
        { value: '500-1000', label: '500-1000元', icon: '💷', min: 500, max: 1000 },
        { value: 'over1000', label: '1000元以上', icon: '💎', min: 1000, max: Infinity }
    ],

    INTERESTS: [
        { value: 'reading', label: '阅读', icon: '📚' },
        { value: 'sports', label: '运动', icon: '⚽' },
        { value: 'beauty', label: '美妆', icon: '💄' },
        { value: 'tech', label: '数码', icon: '📱' },
        { value: 'food', label: '美食', icon: '🍰' },
        { value: 'music', label: '音乐', icon: '🎵' },
        { value: 'travel', label: '旅行', icon: '✈️' },
        { value: 'home', label: '居家', icon: '🏠' },
        { value: 'office', label: '办公', icon: '💻' }
    ],

    OCCASIONS: [
        { value: 'birthday', label: '生日', icon: '🎂' },
        { value: 'valentine', label: '情人节', icon: '💌' },
        { value: 'mothersday', label: '母亲节', icon: '👩' },
        { value: 'fathersday', label: '父亲节', icon: '👨' },
        { value: 'christmas', label: '圣诞节', icon: '🎄' },
        { value: 'newyear', label: '新年', icon: '🧧' },
        { value: 'anniversary', label: '纪念日', icon: '💍' }
    ],

    CATEGORIES: [
        '鲜花', '美妆', '数码', '阅读', '美食', '玩具',
        '家居', '运动', '服饰', '首饰', '健康', '乐器',
        '户外', '浪漫', '实用', '创意', '轻奢', '其他'
    ],

    CATEGORY_ICONS: {
        '鲜花': '💐', '美妆': '💄', '数码': '📱', '阅读': '📚',
        '美食': '🍰', '玩具': '🧸', '家居': '🏠', '运动': '⚽',
        '服饰': '👗', '首饰': '💍', '健康': '💊', '乐器': '🎸',
        '户外': '🏕️', '浪漫': '💕', '实用': '🛠️', '创意': '🎨',
        '轻奢': '👜', '其他': '🎁'
    },

    getLabel(type, value) {
        const map = {
            'relationship': this.RELATIONSHIPS,
            'gender': this.GENDERS,
            'age': this.AGE_GROUPS,
            'budget': this.BUDGETS,
            'interest': this.INTERESTS,
            'occasion': this.OCCASIONS
        };
        const items = map[type];
        if (!items) return value;
        const item = items.find(i => i.value === value);
        return item ? item.label : value;
    },

    getBudgetRange(value) {
        const budget = this.BUDGETS.find(b => b.value === value);
        return budget ? { min: budget.min, max: budget.max } : { min: 0, max: Infinity };
    }
};

window.Config = Config;
