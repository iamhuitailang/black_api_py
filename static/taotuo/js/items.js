const Items = (function() {
    const itemDefinitions = {
        brassKey: {
            id: 'brassKey',
            name: '黄铜小钥匙',
            icon: '🔑',
            description: '一把精致的黄铜小钥匙，可以打开普通的柜门和抽屉。',
            type: 'key',
            usable: true
        },
        passwordNote: {
            id: 'passwordNote',
            name: '密码纸条',
            icon: '📜',
            description: '一张破旧的纸条，上面写着：完整密码是 3747',
            type: 'clue',
            usable: false,
            content: '完整密码：3 7 4 7'
        },
        lightLens: {
            id: 'lightLens',
            name: '光影透镜',
            icon: '🔍',
            description: '神奇的透镜，可以改变光影，显现隐藏的线索。',
            type: 'tool',
            usable: true
        },
        magicGear: {
            id: 'magicGear',
            name: '魔法齿轮',
            icon: '⚙️',
            description: '精密的魔法齿轮，可用于组装机关装置。',
            type: 'tool',
            usable: true
        },
        mirrorCrystal: {
            id: 'mirrorCrystal',
            name: '镜面水晶',
            icon: '💎',
            description: '能反射和折射光线的神秘水晶。',
            type: 'tool',
            usable: true
        },
        magicCard: {
            id: 'magicCard',
            name: '魔术卡牌',
            icon: '🃏',
            description: '一张古老的魔术卡牌，似乎蕴含着特殊力量。',
            type: 'special',
            usable: true
        },
        escapeScepter: {
            id: 'escapeScepter',
            name: '逃脱魔术权杖',
            icon: '🪄',
            description: '传说中的魔术权杖，拥有打开最终之门的力量。',
            type: 'key',
            usable: true
        },
        lensGearCombo: {
            id: 'lensGearCombo',
            name: '光影机关装置',
            icon: '🔮',
            description: '透镜与齿轮的组合，可以破解镜面迷宫机关。',
            type: 'special',
            usable: true,
            combined: true
        },
        keyCardCombo: {
            id: 'keyCardCombo',
            name: '魔法钥匙组',
            icon: '✨',
            description: '钥匙与魔术卡牌的组合，可开启最终逃生大门。',
            type: 'key',
            usable: true,
            combined: true
        }
    };
    
    const combinations = [
        {
            items: ['lightLens', 'magicGear'],
            result: 'lensGearCombo',
            message: '透镜与齿轮组合成功！获得了光影机关装置！'
        },
        {
            items: ['brassKey', 'magicCard'],
            result: 'keyCardCombo',
            message: '钥匙与魔术卡牌融合！获得了魔法钥匙组！'
        }
    ];
    
    function getItem(itemId) {
        return itemDefinitions[itemId] ? { ...itemDefinitions[itemId] } : null;
    }
    
    function canCombine(item1Id, item2Id) {
        return combinations.some(combo => 
            (combo.items.includes(item1Id) && combo.items.includes(item2Id))
        );
    }
    
    function tryCombine(item1Id, item2Id) {
        const combo = combinations.find(c => 
            (c.items.includes(item1Id) && c.items.includes(item2Id))
        );
        
        if (combo) {
            return {
                success: true,
                result: combo.result,
                message: combo.message,
                consumed: combo.items
            };
        }
        
        return {
            success: false,
            message: '这两个道具无法组合...'
        };
    }
    
    function getAllItems() {
        return { ...itemDefinitions };
    }
    
    function getCombinations() {
        return [...combinations];
    }
    
    return {
        getItem,
        canCombine,
        tryCombine,
        getAllItems,
        getCombinations
    };
})();
