(function(global) {
    'use strict';
    
    const Data = {
        defaultState: {
            maskShape: 'half',
            primaryColor: '#000000',
            secondaryColor: '#FFD700',
            texture: 'solid',
            eyeShape: 'almond',
            lensColor: 'transparent',
            decorations: [],
            selectedDecorationId: null,
            history: [],
            historyIndex: -1
        },
        
        maskShapes: [
            { id: 'half', name: '半脸面具', icon: '🎭', desc: '威尼斯风格' },
            { id: 'full', name: '全脸面具', icon: '👹', desc: '仪式风格' },
            { id: 'eye', name: '眼罩式', icon: '🦇', desc: '蝙蝠侠风格' },
            { id: 'animal', name: '动物轮廓', icon: '🦊', desc: '猫/狐狸' },
            { id: 'skull', name: '骷髅面具', icon: '💀', desc: '亡灵节' },
            { id: 'geo', name: '几何面具', icon: '🔷', desc: '赛博朋克' }
        ],
        
        presetColors: [
            '#000000', '#FFFFFF', '#FFD700', '#C0C0C0',
            '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4',
            '#10B981', '#F59E0B', '#6366F1', '#1E293B'
        ],
        
        textures: [
            { id: 'solid', name: '纯色' },
            { id: 'metallic', name: '金属' },
            { id: 'matte', name: '哑光' },
            { id: 'leather', name: '皮革' },
            { id: 'wood', name: '木质' },
            { id: 'glow', name: '荧光' }
        ],
        
        eyeShapes: [
            { id: 'almond', name: '杏仁形' },
            { id: 'round', name: '圆形' },
            { id: 'triangle', name: '三角形' },
            { id: 'none', name: '无眼孔' }
        ],
        
        lensColors: [
            { id: 'transparent', color: 'rgba(255,255,255,0)', name: '透明' },
            { id: 'black', color: 'rgba(0,0,0,0.6)', name: '半透黑' },
            { id: 'red', color: 'rgba(239,68,68,0.6)', name: '红色' },
            { id: 'blue', color: 'rgba(59,130,246,0.6)', name: '蓝色' },
            { id: 'gradient', color: 'linear', name: '渐变' }
        ],
        
        decorationCategories: [
            { id: 'feathers', name: '羽毛' },
            { id: 'gems', name: '宝石' },
            { id: 'patterns', name: '花纹' },
            { id: 'facepaint', name: '彩绘' },
            { id: 'headwear', name: '头饰' },
            { id: 'chains', name: '链条' },
            { id: 'effects', name: '特效' }
        ],
        
        decorations: {
            feathers: [
                { id: 'long_feather', name: '长羽毛', icon: '🪶', colorable: true },
                { id: 'short_feather', name: '短羽毛', icon: '🕊️', colorable: true },
                { id: 'colorful_feather', name: '彩羽', icon: '🦚', colorable: false }
            ],
            gems: [
                { id: 'gem_round', name: '圆形宝石', icon: '💎', colorable: true },
                { id: 'gem_drop', name: '水滴宝石', icon: '💧', colorable: true },
                { id: 'gem_square', name: '方形宝石', icon: '🔷', colorable: true },
                { id: 'gem_red', name: '红宝石', icon: '❤️', colorable: false },
                { id: 'gem_blue', name: '蓝宝石', icon: '💙', colorable: false },
                { id: 'gem_purple', name: '紫水晶', icon: '💜', colorable: false }
            ],
            patterns: [
                { id: 'vine', name: '藤蔓', icon: '🌿', colorable: true },
                { id: 'geoline', name: '几何线', icon: '📐', colorable: true },
                { id: 'dots', name: '波点', icon: '⚪', colorable: true },
                { id: 'stripes', name: '条纹', icon: '📏', colorable: true },
                { id: 'tribal', name: '部落', icon: '🗿', colorable: true }
            ],
            facepaint: [
                { id: 'tears', name: '眼泪', icon: '💧', colorable: true },
                { id: 'flame', name: '火焰', icon: '🔥', colorable: true },
                { id: 'lightning', name: '闪电', icon: '⚡', colorable: true },
                { id: 'star', name: '星星', icon: '⭐', colorable: true },
                { id: 'moon', name: '新月', icon: '🌙', colorable: true }
            ],
            headwear: [
                { id: 'crown', name: '皇冠', icon: '👑', colorable: true },
                { id: 'horns', name: '恶魔角', icon: '😈', colorable: true },
                { id: 'goat_horn', name: '山羊角', icon: '🐐', colorable: true },
                { id: 'cat_ears', name: '猫耳', icon: '🐱', colorable: true },
                { id: 'rabbit_ears', name: '兔耳', icon: '🐰', colorable: true },
                { id: 'flower', name: '花朵', icon: '🌸', colorable: false },
                { id: 'rose', name: '玫瑰', icon: '🌹', colorable: false }
            ],
            chains: [
                { id: 'side_chain', name: '侧链', icon: '⛓️', colorable: true },
                { id: 'forehead_chain', name: '额头链', icon: '📿', colorable: true },
                { id: 'tassel', name: '流苏', icon: '🎀', colorable: true }
            ],
            effects: [
                { id: 'glow_edge', name: '发光边', icon: '✨', colorable: true },
                { id: 'shadow', name: '阴影', icon: '🌑', colorable: false },
                { id: 'sparkle', name: '星光', icon: '💫', colorable: true }
            ]
        }
    };
    
    global.Data = Data;
})(window);