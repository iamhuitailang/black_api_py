const PixelData = (function() {
    const skinColors = [
        { id: 'light', name: '浅色', color: '#F5D6BA' },
        { id: 'warm', name: '暖黄', color: '#E8C097' },
        { id: 'wheat', name: '小麦色', color: '#D4A574' },
        { id: 'brown', name: '棕色', color: '#A67C52' },
        { id: 'dark', name: '深棕', color: '#8B5A2B' },
        { id: 'green', name: '绿色', color: '#7CB342' },
        { id: 'gray', name: '灰色', color: '#9E9E9E' }
    ];

    const hairColors = [
        { id: 'black', name: '黑色', color: '#2C2C2C' },
        { id: 'brown', name: '棕色', color: '#4A3728' },
        { id: 'gold', name: '金色', color: '#D4A574' },
        { id: 'red', name: '红色', color: '#C0392B' },
        { id: 'pink', name: '粉色', color: '#FFB6C1' },
        { id: 'blue', name: '蓝色', color: '#3498DB' },
        { id: 'green', name: '绿色', color: '#27AE60' },
        { id: 'white', name: '白色', color: '#F5F5F5' },
        { id: 'purple', name: '紫色', color: '#9B59B6' }
    ];

    const faceTemplates = [
        {
            id: 'round',
            name: '圆形脸',
            description: '可爱风格',
            style: '可爱、儿童'
        },
        {
            id: 'square',
            name: '方形脸',
            description: '经典RPG角色',
            style: '勇者、战士'
        },
        {
            id: 'pointed',
            name: '尖下巴',
            description: '修长脸型',
            style: '精灵、魔法师'
        },
        {
            id: 'cat',
            name: '猫头',
            description: '动物头',
            style: '兽人、吉祥物'
        },
        {
            id: 'dog',
            name: '狗头',
            description: '动物头',
            style: '兽人、吉祥物'
        },
        {
            id: 'bear',
            name: '熊头',
            description: '动物头',
            style: '兽人、吉祥物'
        },
        {
            id: 'fox',
            name: '狐狸头',
            description: '动物头',
            style: '兽人、吉祥物'
        },
        {
            id: 'rabbit',
            name: '兔子头',
            description: '动物头',
            style: '兽人、吉祥物'
        },
        {
            id: 'blank',
            name: '无脸模板',
            description: '仅轮廓留空',
            style: '高阶用户'
        }
    ];

    const hairstyles = [
        { id: 'short', name: '短发' },
        { id: 'long', name: '长发' },
        { id: 'ponytail', name: '马尾' },
        { id: 'buzz', name: '寸头' },
        { id: 'twintail', name: '双马尾' },
        { id: 'bald', name: '光头' },
        { id: 'mohawk', name: '莫西干' },
        { id: 'curly', name: '卷发' }
    ];

    const eyes = [
        { id: 'round', name: '圆眼' },
        { id: 'bean', name: '豆豆眼' },
        { id: 'dead', name: '死鱼眼' },
        { id: 'star', name: '星星眼' },
        { id: 'squint', name: '眯眯眼' },
        { id: 'wink', name: 'wink眨眼' },
        { id: 'eyepatch', name: '单眼罩' }
    ];

    const eyebrows = [
        { id: 'normal', name: '平眉' },
        { id: 'down', name: '八字眉' },
        { id: 'up', name: '竖眉' },
        { id: 'none', name: '无眉' },
        { id: 'thick', name: '粗眉' },
        { id: 'thin', name: '细眉' }
    ];

    const mouths = [
        { id: 'smile', name: '微笑' },
        { id: 'laugh', name: '张嘴笑' },
        { id: 'sad', name: '不开心' },
        { id: 'surprised', name: 'O型嘴' },
        { id: 'neutral', name: '一字嘴' },
        { id: 'teeth', name: '露牙' },
        { id: 'rose', name: '叼玫瑰' }
    ];

    const noses = [
        { id: 'small', name: '小圆鼻' },
        { id: 'triangle', name: '三角形' },
        { id: 'none', name: '无鼻' }
    ];

    const blushes = [
        { id: 'none', name: '无' },
        { id: 'circle', name: '圆形腮红' },
        { id: 'slash', name: '斜线腮红' }
    ];

    const shirts = [
        { id: 'none', name: '无' },
        { id: 'tshirt', name: 'T恤' },
        { id: 'armor', name: '铠甲' },
        { id: 'robe', name: '长袍' },
        { id: 'vest', name: '背心' },
        { id: 'hoodie', name: '卫衣' }
    ];

    const headwears = [
        { id: 'none', name: '无' },
        { id: 'cap', name: '棒球帽' },
        { id: 'wizard', name: '巫师帽' },
        { id: 'crown', name: '王冠' },
        { id: 'helmet', name: '骑士头盔' },
        { id: 'bow', name: '蝴蝶结' },
        { id: 'headband', name: '发带' },
        { id: 'headphone', name: '耳机' }
    ];

    const faceAccessories = [
        { id: 'none', name: '无' },
        { id: 'round_glasses', name: '圆框眼镜' },
        { id: 'square_glasses', name: '方框眼镜' },
        { id: 'sunglasses', name: '墨镜' },
        { id: 'mask', name: '面罩' },
        { id: 'scar', name: '伤疤' },
        { id: 'beard', name: '胡须' },
        { id: 'bandaid', name: '创可贴' }
    ];

    const backgrounds = [
        { id: 'transparent', name: '透明' },
        { id: 'solid', name: '纯色块' },
        { id: 'clouds', name: '像素云朵' },
        { id: 'stars', name: '星星' },
        { id: 'grid', name: '简单网格' }
    ];

    const shirtColors = [
        '#E94560', '#3498DB', '#27AE60', '#F39C12',
        '#9B59B6', '#1ABC9C', '#E67E22', '#34495E',
        '#FFFFFF', '#2C3E50'
    ];

    const backgroundColors = [
        '#2A2A4E', '#16213E', '#0F3460', '#1A1A2E',
        '#E94560', '#F5D6BA', '#7CB342', '#3498DB',
        '#9B59B6', '#F39C12'
    ];

    return {
        skinColors,
        hairColors,
        faceTemplates,
        hairstyles,
        eyes,
        eyebrows,
        mouths,
        noses,
        blushes,
        shirts,
        headwears,
        faceAccessories,
        backgrounds,
        shirtColors,
        backgroundColors
    };
})();