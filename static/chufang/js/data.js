const GAME_DATA = {
    gameTime: 60,
    comboMultipliers: [1, 1.5, 2, 3],
    penaltyScore: 50,
    timeBonusPerSecond: 2,
    
    dishes: [
        {
            id: 'burger',
            name: '汉堡',
            emoji: '🍔',
            baseScore: 100,
            ingredients: ['bread', 'patty', 'lettuce'],
            clicks: 3
        },
        {
            id: 'pizza',
            name: '披萨',
            emoji: '🍕',
            baseScore: 150,
            ingredients: ['dough', 'ketchup', 'cheese', 'sausage'],
            clicks: 4
        },
        {
            id: 'salad',
            name: '沙拉',
            emoji: '🥗',
            baseScore: 120,
            ingredients: ['lettuce', 'tomato', 'cucumber', 'salad_dressing'],
            clicks: 4
        },
        {
            id: 'ramen',
            name: '拉面',
            emoji: '🍜',
            baseScore: 140,
            ingredients: ['noodles', 'soup', 'charsiu', 'egg'],
            clicks: 4
        },
        {
            id: 'sandwich',
            name: '三明治',
            emoji: '🥪',
            baseScore: 110,
            ingredients: ['bread', 'ham', 'lettuce', 'bread'],
            clicks: 4
        },
        {
            id: 'sushi',
            name: '寿司',
            emoji: '🍣',
            baseScore: 130,
            ingredients: ['rice', 'fish', 'nori'],
            clicks: 3
        },
        {
            id: 'curry',
            name: '咖喱饭',
            emoji: '🥘',
            baseScore: 120,
            ingredients: ['rice', 'curry', 'chicken'],
            clicks: 3
        },
        {
            id: 'omelette',
            name: '蛋包饭',
            emoji: '🍳',
            baseScore: 100,
            ingredients: ['rice', 'egg', 'ketchup'],
            clicks: 3
        }
    ],
    
    ingredients: {
        bread: { name: '面包', emoji: '🍞' },
        patty: { name: '肉饼', emoji: '🥩' },
        lettuce: { name: '生菜', emoji: '🥬' },
        dough: { name: '面饼', emoji: '🫓' },
        ketchup: { name: '番茄酱', emoji: '🍅' },
        cheese: { name: '芝士', emoji: '🧀' },
        sausage: { name: '香肠', emoji: '🌭' },
        tomato: { name: '番茄', emoji: '🍎' },
        cucumber: { name: '黄瓜', emoji: '🥒' },
        salad_dressing: { name: '沙拉酱', emoji: '🥛' },
        noodles: { name: '面条', emoji: '🍝' },
        soup: { name: '汤底', emoji: '🍲' },
        charsiu: { name: '叉烧', emoji: '🍖' },
        egg: { name: '鸡蛋', emoji: '🥚' },
        ham: { name: '火腿', emoji: '🥓' },
        rice: { name: '米饭', emoji: '🍚' },
        fish: { name: '鱼生', emoji: '🐟' },
        nori: { name: '海苔', emoji: '🟢' },
        curry: { name: '咖喱', emoji: '🟤' },
        chicken: { name: '鸡肉', emoji: '🍗' }
    },
    
    customerEmojis: ['😊', '😋', '🤤', '😄', '🥰', '😍', '😁', '🙂'],
    orderTexts: [
        '请给我来一份',
        '我想要一份',
        '来一份',
        '给我一份',
        '我想吃'
    ]
};
