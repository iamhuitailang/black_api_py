
window.SushiData = (function() {
    const INGREDIENTS = {
        RICE: [
            { id: 'vinegar_rice', name: '醋饭', icon: '🍚', unlockScore: 0, category: 'rice' },
            { id: 'sushi_rice', name: '寿司饭', icon: '🍙', unlockScore: 100, category: 'rice' }
        ],
        MAIN: [
            { id: 'salmon', name: '三文鱼', icon: '🐟', unlockScore: 0, category: 'main' },
            { id: 'tuna', name: '金枪鱼', icon: '🐟', unlockScore: 0, category: 'main' },
            { id: 'eel', name: '烤鳗鱼', icon: '🐟', unlockScore: 200, category: 'main' },
            { id: 'shrimp', name: '鲜虾', icon: '🦐', unlockScore: 150, category: 'main' },
            { id: 'tamago', name: '玉子烧', icon: '🥚', unlockScore: 0, category: 'main' },
            { id: 'crab', name: '蟹肉棒', icon: '🦀', unlockScore: 300, category: 'main' }
        ],
        TOPPING: [
            { id: 'wasabi', name: '芥末', icon: '🟢', unlockScore: 0, category: 'topping' },
            { id: 'sauce', name: '酱汁', icon: '🟤', unlockScore: 0, category: 'topping' },
            { id: 'mayo', name: '蛋黄酱', icon: '⚪', unlockScore: 150, category: 'topping' },
            { id: 'avocado', name: '牛油果', icon: '🥑', unlockScore: 250, category: 'topping' },
            { id: 'cucumber', name: '黄瓜', icon: '🥒', unlockScore: 250, category: 'topping' },
            { id: 'nori', name: '海苔', icon: '🌿', unlockScore: 0, category: 'topping' }
        ]
    };

    const SUSHI_TYPES = [
        {
            id: 'salmon_sushi',
            name: '三文鱼寿司',
            icon: '🍣',
            rice: ['vinegar_rice', 'sushi_rice'],
            main: ['salmon'],
            toppings: ['wasabi'],
            difficulty: 1,
            baseScore: 10,
            description: '经典三文鱼搭配芥末'
        },
        {
            id: 'tuna_sushi',
            name: '金枪鱼寿司',
            icon: '🍣',
            rice: ['vinegar_rice', 'sushi_rice'],
            main: ['tuna'],
            toppings: ['wasabi'],
            difficulty: 1,
            baseScore: 10,
            description: '新鲜金枪鱼配芥末'
        },
        {
            id: 'eel_sushi',
            name: '鳗鱼寿司',
            icon: '🍣',
            rice: ['vinegar_rice', 'sushi_rice'],
            main: ['eel'],
            toppings: ['sauce'],
            difficulty: 2,
            baseScore: 15,
            description: '烤鳗鱼配酱汁'
        },
        {
            id: 'shrimp_sushi',
            name: '虾寿司',
            icon: '🍣',
            rice: ['vinegar_rice', 'sushi_rice'],
            main: ['shrimp'],
            toppings: ['mayo'],
            difficulty: 2,
            baseScore: 15,
            description: '鲜虾配蛋黄酱'
        },
        {
            id: 'tamago_sushi',
            name: '玉子寿司',
            icon: '🍣',
            rice: ['vinegar_rice', 'sushi_rice'],
            main: ['tamago'],
            toppings: ['nori'],
            difficulty: 1,
            baseScore: 10,
            description: '玉子烧配海苔'
        },
        {
            id: 'california_roll',
            name: '加州卷',
            icon: '🍣',
            rice: ['vinegar_rice', 'sushi_rice'],
            main: ['crab'],
            toppings: ['avocado', 'cucumber'],
            difficulty: 3,
            baseScore: 25,
            description: '蟹肉棒配牛油果和黄瓜'
        },
        {
            id: 'sashimi_platter',
            name: '刺身拼盘',
            icon: '🍣',
            rice: [],
            main: ['salmon', 'tuna', 'shrimp'],
            toppings: ['cucumber', 'wasabi'],
            difficulty: 3,
            baseScore: 30,
            description: '多种鱼生拼盘'
        }
    ];

    const CUSTOMERS = ['👧', '👨', '👩', '🧓', '👴', '👦', '👰', '🤵', '🧑', '👱'];

    return {
        getAllIngredients: function() {
            return [...INGREDIENTS.RICE, ...INGREDIENTS.MAIN, ...INGREDIENTS.TOPPING];
        },

        getIngredientsByCategory: function(category) {
            switch(category) {
                case 'rice': return INGREDIENTS.RICE;
                case 'main': return INGREDIENTS.MAIN;
                case 'topping': return INGREDIENTS.TOPPING;
                default: return [];
            }
        },

        getSushiTypes: function() {
            return SUSHI_TYPES;
        },

        getSushiById: function(id) {
            return SUSHI_TYPES.find(s => s.id === id);
        },

        getIngredientById: function(id) {
            return this.getAllIngredients().find(i => i.id === id);
        },

        getRandomCustomer: function() {
            return CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
        },

        getAvailableSushi: function(totalScore) {
            return SUSHI_TYPES.filter(sushi => {
                const allIngredients = [...sushi.rice, ...sushi.main, ...sushi.toppings];
                return allIngredients.every(ingId => {
                    const ing = this.getIngredientById(ingId);
                    return ing && totalScore >= ing.unlockScore;
                });
            });
        },

        getUnlocks: function(previousScore, currentScore) {
            const previous = this.getAllIngredients().filter(i => i.unlockScore <= previousScore);
            const current = this.getAllIngredients().filter(i => i.unlockScore <= currentScore);
            return current.filter(i => !previous.includes(i));
        }
    };
})();
