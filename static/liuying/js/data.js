const ClothingData = (function() {
    const clothes = [
        { id: 1, name: '白衬衫', icon: '👔', color: '白色', material: '棉', temp: '温水', wash: '机洗', dry: '中温', difficulty: 1 },
        { id: 2, name: '红袜子', icon: '🧦', color: '红色', material: '棉', temp: '温水', wash: '机洗', dry: '中温', difficulty: 1 },
        { id: 3, name: '羊毛衫', icon: '🧥', color: '浅色', material: '羊毛', temp: '冷水', wash: '手洗', dry: '风干', difficulty: 3 },
        { id: 4, name: '牛仔裤', icon: '👖', color: '深色', material: '棉', temp: '冷水', wash: '机洗', dry: '中温', difficulty: 2 },
        { id: 5, name: '丝绸连衣裙', icon: '👗', color: '浅色', material: '丝绸', temp: '冷水', wash: '干洗', dry: '风干', difficulty: 4 },
        { id: 6, name: '深色T恤', icon: '👕', color: '深色', material: '化纤', temp: '温水', wash: '机洗', dry: '中温', difficulty: 1 },
        { id: 7, name: '白色毛巾', icon: '🧻', color: '白色', material: '棉', temp: '热水', wash: '机洗', dry: '高温', difficulty: 2 },
        { id: 8, name: '西装外套', icon: '🧥', color: '深色', material: '羊毛', temp: '干洗', wash: '干洗', dry: '风干', difficulty: 4 },
        { id: 9, name: '运动服', icon: '🎽', color: '深色', material: '化纤', temp: '冷水', wash: '机洗', dry: '中温', difficulty: 2 },
        { id: 10, name: '真丝睡衣', icon: '🛏️', color: '浅色', material: '丝绸', temp: '冷水', wash: '手洗', dry: '风干', difficulty: 4 },
        { id: 11, name: '红色卫衣', icon: '👚', color: '红色', material: '棉', temp: '温水', wash: '机洗', dry: '中温', difficulty: 2 },
        { id: 12, name: '羊绒围巾', icon: '🧣', color: '浅色', material: '羊毛', temp: '冷水', wash: '手洗', dry: '风干', difficulty: 3 },
        { id: 13, name: '白色床单', icon: '🛏️', color: '白色', material: '棉', temp: '热水', wash: '机洗', dry: '高温', difficulty: 2 },
        { id: 14, name: '黑色西装裤', icon: '👖', color: '深色', material: '化纤', temp: '温水', wash: '机洗', dry: '中温', difficulty: 2 },
        { id: 15, name: '蕾丝内衣', icon: '👙', color: '浅色', material: '丝绸', temp: '冷水', wash: '手洗', dry: '风干', difficulty: 4 }
    ];

    const dimensions = {
        color: {
            label: '颜色',
            icon: '🎨',
            options: ['白色', '浅色', '深色', '红色']
        },
        material: {
            label: '材质',
            icon: '🧩',
            options: ['棉', '羊毛', '化纤', '丝绸']
        },
        temp: {
            label: '水温',
            icon: '🌡️',
            options: ['冷水', '温水', '热水']
        },
        wash: {
            label: '洗涤方式',
            icon: '🮐',
            options: ['手洗', '机洗', '干洗']
        },
        dry: {
            label: '烘干方式',
            icon: '🔄',
            options: ['低温', '中温', '高温', '风干']
        }
    };

    const modes = {
        learn: {
            name: '学习模式',
            icon: '🎓',
            description: '不扣分，显示正确答案',
            unlocked: true,
            unlockLevel: 0
        },
        challenge: {
            name: '限时挑战',
            icon: '⏱️',
            description: '60秒内尽可能多分类',
            unlocked: false,
            unlockLevel: 3
        },
        endless: {
            name: '无尽模式',
            icon: '🎯',
            description: '无限衣物，生命3条',
            unlocked: false,
            unlockLevel: 5
        },
        level: {
            name: '闯关模式',
            icon: '🏆',
            description: '每关10件，正确率≥80%',
            unlocked: true,
            unlockLevel: 0
        }
    };

    function getAllClothes() {
        return [...clothes];
    }

    function getRandomClothes() {
        return clothes[Math.floor(Math.random() * clothes.length)];
    }

    function getClothesById(id) {
        return clothes.find(c => c.id === id);
    }

    function getDimension(dimKey) {
        return dimensions[dimKey] || null;
    }

    function getAllDimensions() {
        return { ...dimensions };
    }

    function getMode(modeKey) {
        return modes[modeKey] || null;
    }

    function getAllModes() {
        return { ...modes };
    }

    function getDifficultyStars(level) {
        return '⭐'.repeat(level);
    }

    function getRandomClothesExcluding(excludeIds = []) {
        const available = clothes.filter(c => !excludeIds.includes(c.id));
        if (available.length === 0) return getRandomClothes();
        return available[Math.floor(Math.random() * available.length)];
    }

    return {
        getAllClothes,
        getRandomClothes,
        getClothesById,
        getDimension,
        getAllDimensions,
        getMode,
        getAllModes,
        getDifficultyStars,
        getRandomClothesExcluding
    };
})();
