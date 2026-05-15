const Feathers = (() => {
    const feathers = [
        {
            id: 'white',
            name: '普通白羽',
            description: '适合新手，手感平衡',
            icon: '🪶',
            color: '#FFFFFF',
            secondaryColor: '#E0E0E0',
            fallSpeed: 1.0,
            windInfluence: 0.7,
            unlockLevel: 1
        },
        {
            id: 'colorful',
            name: '彩羽',
            description: '下落更慢，更轻盈',
            icon: '🌈',
            color: '#FF69B4',
            secondaryColor: '#FFB6C1',
            fallSpeed: 0.85,
            windInfluence: 0.6,
            unlockLevel: 3
        },
        {
            id: 'glow',
            name: '流光羽',
            description: '几乎不受风影响',
            icon: '✨',
            color: '#FFD700',
            secondaryColor: '#FFA500',
            fallSpeed: 0.95,
            windInfluence: 0.3,
            unlockLevel: 3
        }
    ];

    const getFeather = (id) => {
        return feathers.find(f => f.id === id);
    };

    const getAllFeathers = () => {
        return feathers;
    };

    const getUnlockedFeathers = (maxLevel) => {
        return feathers.filter(f => f.unlockLevel <= maxLevel);
    };

    return {
        getFeather,
        getAllFeathers,
        getUnlockedFeathers
    };
})();