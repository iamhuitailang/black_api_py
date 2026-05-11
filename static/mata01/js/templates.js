const PosterTemplates = (function() {
    const styles = [
        {
            id: 'dreamy',
            name: '梦幻星空 🌙',
            description: '深蓝紫色渐变 + 星星 + 月亮',
            colors: {
                primary: '#6C5CE7',
                secondary: '#0984E3',
                text: '#FFF9E6'
            },
            background: {
                type: 'gradient',
                stops: ['#0c0d23', '#1a1a4e', '#2d1b4e']
            }
        },
        {
            id: 'vintage',
            name: '复古版画 📜',
            description: '米黄纸张纹理 + 旧纸效果',
            colors: {
                primary: '#8B4513',
                secondary: '#DAA520',
                text: '#3D2914'
            },
            background: {
                type: 'paper',
                baseColor: '#F5E6C8'
            }
        },
        {
            id: 'classic',
            name: '经典红黄 🎪',
            description: '红黄渐变 + 马戏团帐篷条纹',
            colors: {
                primary: '#E74C3C',
                secondary: '#F39C12',
                text: '#FFFFFF'
            },
            background: {
                type: 'stripes',
                colors: ['#E74C3C', '#FFFFFF']
            }
        },
        {
            id: 'neon',
            name: '霓虹霓虹 ✨',
            description: '霓虹灯光 + 赛博朋克风格',
            colors: {
                primary: '#FF00FF',
                secondary: '#00FFFF',
                text: '#FFFFFF'
            },
            background: {
                type: 'gradient',
                stops: ['#0a0a0a', '#1a0a2e', '#0a1a2e']
            }
        },
        {
            id: 'nature',
            name: '丛林冒险 🌴',
            description: '绿色森林 + 自然风格',
            colors: {
                primary: '#27AE60',
                secondary: '#2ECC71',
                text: '#F1C40F'
            },
            background: {
                type: 'gradient',
                stops: ['#1a3a1a', '#2d5a2d', '#1e4620']
            }
        }
    ];

    const characters = [
        { id: 'clown', name: '小丑', emoji: '🤡', color: '#FF6B6B' },
        { id: 'lion', name: '狮子', emoji: '🦁', color: '#F39C12' },
        { id: 'elephant', name: '大象', emoji: '🐘', color: '#95A5A6' },
        { id: 'magician', name: '魔术师', emoji: '🎩', color: '#34495E' }
    ];

    const defaultState = {
        styleId: 'classic',
        title: '马戏团之夜',
        subtitle: '精彩绝伦的表演等你来',
        date: '2026年6月1日 19:00',
        location: '梦想大剧院',
        price: '¥99 起',
        characterId: 'clown',
        customColors: null,
        decorations: {
            showFlags: true,
            showStars: true,
            showLights: true,
            showQR: true
        },
        backgroundImage: null,
        qrLink: 'https://example.com/circus'
    };

    function getStyleById(id) {
        return styles.find(s => s.id === id) || styles[2];
    }

    function getCharacterById(id) {
        return characters.find(c => c.id === id) || characters[0];
    }

    function getAllStyles() {
        return styles;
    }

    function getAllCharacters() {
        return characters;
    }

    function getDefaultState() {
        return JSON.parse(JSON.stringify(defaultState));
    }

    return {
        getStyleById,
        getCharacterById,
        getAllStyles,
        getAllCharacters,
        getDefaultState
    };
})();
