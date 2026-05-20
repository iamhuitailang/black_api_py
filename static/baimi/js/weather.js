const Weather = (() => {
    const weatherTypes = [
        {
            id: 'sunny',
            name: '晴天',
            icon: '☀️',
            probability: 0.60,
            effects: {
                speedMultiplier: 1.0,
                reactionPenalty: 0
            },
            description: '无影响'
        },
        {
            id: 'tailwind',
            name: '顺风 (+2m/s)',
            icon: '🌬️',
            probability: 0.15,
            effects: {
                speedMultiplier: 1.05,
                reactionPenalty: 0
            },
            description: '速度 +5%'
        },
        {
            id: 'headwind',
            name: '逆风 (-2m/s)',
            icon: '🌪️',
            probability: 0.15,
            effects: {
                speedMultiplier: 0.95,
                reactionPenalty: 0
            },
            description: '速度 -5%'
        },
        {
            id: 'rainy',
            name: '雨天',
            icon: '🌧️',
            probability: 0.10,
            effects: {
                speedMultiplier: 1.0,
                reactionPenalty: 0.05
            },
            description: '起跑反应 +0.05秒'
        }
    ];

    const getRandomWeather = () => {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const weather of weatherTypes) {
            cumulative += weather.probability;
            if (rand <= cumulative) {
                return { ...weather };
            }
        }
        
        return { ...weatherTypes[0] };
    };

    const getWeatherById = (id) => {
        return weatherTypes.find(w => w.id === id) || weatherTypes[0];
    };

    const getAllWeathers = () => {
        return [...weatherTypes];
    };

    return {
        getRandomWeather,
        getWeatherById,
        getAllWeathers
    };
})();
