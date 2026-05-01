const FortuneData = {
    fortuneLevels: [
        { id: 'greatGood', name: '大吉', displayName: '大 吉', probability: 10, colors: ['#FFD700', '#DC143C'], bgColors: ['#FFF8DC', '#FFF0F5'], description: '事事顺遂' },
        { id: 'middleGood', name: '中吉', displayName: '中 吉', probability: 20, colors: ['#FFB6C1', '#FFA500'], bgColors: ['#FFF0F5', '#FFFAF0'], description: '好事将至' },
        { id: 'smallGood', name: '小吉', displayName: '小 吉', probability: 30, colors: ['#90EE90', '#3CB371'], bgColors: ['#F0FFF0', '#E8F5E9'], description: '小确幸' },
        { id: 'lastGood', name: '末吉', displayName: '末 吉', probability: 20, colors: ['#87CEEB', '#4682B4'], bgColors: ['#F0F8FF', '#E3F2FD'], description: '平常心' },
        { id: 'smallBad', name: '小凶', displayName: '小 凶', probability: 10, colors: ['#808080', '#696969'], bgColors: ['#F5F5F5', '#E0E0E0'], description: '注意小人' },
        { id: 'lastBad', name: '末凶', displayName: '末 凶', probability: 7, colors: ['#4A4A4A', '#2F2F2F'], bgColors: ['#E8E8E8', '#D3D3D3'], description: '宜静不宜动' },
        { id: 'greatBad', name: '大凶', displayName: '大 凶', probability: 3, colors: ['#8B0000', '#660000'], bgColors: ['#FFE4E1', '#FFCDD2'], description: '万事小心' }
    ],

    fortuneTexts: {
        greatGood: [
            { text: '云开见日，枯木逢春', interpretation: '今日运势极佳，诸事皆宜，万事亨通' },
            { text: '金玉满堂，吉星高照', interpretation: '财运亨通，贵人相助，前程似锦' },
            { text: '春风得意，马蹄疾奔', interpretation: '事业蒸蒸日上，爱情甜蜜美满' },
            { text: '龙凤呈祥，天地同庆', interpretation: '今日大喜，适合做重大决定' },
            { text: '旭日东升，光芒万丈', interpretation: '运势如日中天，一切向好发展' }
        ],
        middleGood: [
            { text: '月移花影，风送暗香', interpretation: '今日运势上升，适合开启新计划' },
            { text: '柳暗花明，渐入佳境', interpretation: '事情有转机，保持耐心终有回报' },
            { text: '瑞雪兆丰年，春来花自开', interpretation: '好事将至，只需静待时机' },
            { text: '乘风破浪，直挂云帆', interpretation: '运势向好，可大胆尝试新事物' },
            { text: '鸟语花香，春意盎然', interpretation: '心情愉悦，人际关系和谐' }
        ],
        smallGood: [
            { text: '清茶一盏，好书半卷', interpretation: '今日有小确幸，适合享受生活' },
            { text: '清风徐来，水波不兴', interpretation: '平淡中见真情，小事见温馨' },
            { text: '采菊东篱，悠然见山', interpretation: '心境平和，适合反思与休息' },
            { text: '小雨初晴，空气清新', interpretation: '小好运降临，心情舒畅' },
            { text: '花开两朵，各表一枝', interpretation: '双喜临门，虽小但值得开心' }
        ],
        lastGood: [
            { text: '宠辱不惊，去留无意', interpretation: '保持平常心，顺其自然最好' },
            { text: '山高水长，前路漫漫', interpretation: '稳步前行，不宜急于求成' },
            { text: '静如止水，动如脱兔', interpretation: '以静制动，等待最佳时机' },
            { text: '日出而作，日落而息', interpretation: '按部就班，平常心对待' },
            { text: '知足常乐，无欲则刚', interpretation: '满足现状，不宜过多奢求' }
        ],
        smallBad: [
            { text: '风起云涌，暗流涌动', interpretation: '注意小人，谨言慎行' },
            { text: '雾里看花，水中望月', interpretation: '事情不明朗，不宜做决定' },
            { text: '山雨欲来，风满楼', interpretation: '可能有小麻烦，提前做好准备' },
            { text: '落花有意，流水无情', interpretation: '感情或事业可能遇到小挫折' },
            { text: '树欲静而风不止', interpretation: '外界干扰较多，保持内心平静' }
        ],
        lastBad: [
            { text: '静以修身，俭以养德', interpretation: '宜静不宜动，修身养性最佳' },
            { text: '韬光养晦，以待天时', interpretation: '收敛锋芒，不宜出头' },
            { text: '闭门思过，三省吾身', interpretation: '适合反思，不宜外出或冒险' },
            { text: '守株待兔，以不变应万变', interpretation: '保持现状，不宜主动出击' },
            { text: '静观其变，伺机而动', interpretation: '等待时机，不要轻举妄动' }
        ],
        greatBad: [
            { text: '如履薄冰，谨慎行事', interpretation: '万事小心，宜低调行事' },
            { text: '祸从口出，言多必失', interpretation: '谨言慎行，避免与人争执' },
            { text: '居安思危，有备无患', interpretation: '做好最坏打算，凡事留后路' },
            { text: '塞翁失马，焉知非福', interpretation: '坏事可能变好事，保持乐观' },
            { text: '三思而后行，谋定而后动', interpretation: '任何决定都要深思熟虑' }
        ]
    },

    luckyNumbers: [
        [1, 6, 8], [2, 5, 9], [3, 7, 8], [1, 4, 9],
        [2, 6, 7], [3, 5, 8], [1, 7, 9], [4, 6, 8],
        [2, 3, 9], [5, 7, 8], [1, 3, 8], [2, 4, 7],
        [3, 6, 9], [1, 5, 7], [2, 8, 9], [4, 5, 6],
        [1, 2, 9], [3, 4, 8], [5, 6, 7], [1, 8, 9],
        [2, 3, 7], [4, 5, 9], [1, 3, 5], [2, 6, 8],
        [3, 7, 9], [1, 4, 7], [2, 5, 8], [4, 6, 9],
        [1, 2, 8], [3, 5, 7], [1, 6, 9], [2, 4, 6]
    ],

    luckyColors: [
        ['暖金色', '米白色'], ['粉红色', '橙色'], ['天蓝色', '薄荷绿'],
        ['紫色', '淡粉色'], ['红色', '金色'], ['蓝色', '白色'],
        ['绿色', '黄色'], ['橙色', '棕色'], ['金色', '黑色'],
        ['粉色', '灰色'], ['青色', '桃色'], ['琥珀色', '象牙白'],
        ['靛蓝色', '银灰色'], ['珊瑚色', '奶白色'], ['橄榄绿', '卡其色'],
        ['酒红色', '香槟金'], ['天青色', '烟灰色'], ['玫瑰红', '珍珠白'],
        ['翡翠绿', '湖蓝色'], ['朱砂红', '鹅黄色']
    ],

    luckyDirections: ['正东方', '正南方', '正西方', '正北方', '东北方', '东南方', '西北方', '西南方'],

    luckyConstellations: [
        ['白羊座', '狮子座'], ['金牛座', '处女座'], ['双子座', '天秤座'],
        ['巨蟹座', '天蝎座'], ['狮子座', '射手座'], ['处女座', '摩羯座'],
        ['天秤座', '水瓶座'], ['天蝎座', '双鱼座'], ['射手座', '白羊座'],
        ['摩羯座', '金牛座'], ['水瓶座', '双子座'], ['双鱼座', '巨蟹座'],
        ['白羊座', '天秤座'], ['金牛座', '天蝎座'], ['双子座', '射手座'],
        ['巨蟹座', '摩羯座'], ['狮子座', '水瓶座'], ['处女座', '双鱼座']
    ],

    luckyItems: [
        ['水晶', '银饰'], ['玉石', '金饰'], ['桃木', '佛珠'],
        ['铜器', '翡翠'], ['玛瑙', '琥珀'], ['珍珠', '珊瑚'],
        ['琉璃', '陶瓷'], ['木质', '竹制'], ['丝线', '荷包'],
        ['香炉', '古币'], ['玉佩', '玉坠'], ['金箔', '银箔'],
        ['朱砂', '雄黄'], ['艾草', '菖蒲'], ['铜镜', '罗盘'],
        ['香囊', '香包'], ['毛笔', '宣纸'], ['古琴', '宝剑']
    ],

    suggestions: {
        greatGood: [
            '穿亮色衣服，佩戴金色饰品',
            '适合签合同、谈生意',
            '可大胆表白，成功率极高',
            '适合投资理财，财运亨通'
        ],
        middleGood: [
            '穿暖色调衣服，心情更愉悦',
            '适合学习新技能，提升自我',
            '可约朋友聚会，增进感情',
            '适合短途旅行，放松心情'
        ],
        smallGood: [
            '穿舒适休闲装，享受生活',
            '适合看书、品茶，修身养性',
            '可做些自己喜欢的小事',
            '适合整理房间，清理杂物'
        ],
        lastGood: [
            '穿素色衣服，保持低调',
            '适合按部就班工作，不宜冒险',
            '保持平常心，不要急于求成',
            '适合反思总结，规划未来'
        ],
        smallBad: [
            '穿深色衣服，低调行事',
            '避免与人争执，多听少说',
            '不宜做重大决定，暂缓为宜',
            '注意交通安全，小心行事'
        ],
        lastBad: [
            '穿朴素衣服，不宜张扬',
            '宜静不宜动，在家休息最好',
            '避免投资和冒险行为',
            '适合看书学习，提升内涵'
        ],
        greatBad: [
            '穿深暗色衣服，极度低调',
            '凡事三思而后行，不可冲动',
            '避免外出，尤其是远途',
            '注意身体健康，多喝温水'
        ]
    },

    notes: {
        greatGood: [
            '虽运势极佳，但仍需保持谦虚',
            '得意时不要忘形，善待他人',
            '好运时更要积德行善'
        ],
        middleGood: [
            '把握机会，但不要贪心',
            '好事将近，保持耐心',
            '运势上升，也要稳扎稳打'
        ],
        smallGood: [
            '小确幸也是福，懂得感恩',
            '不要忽视小事中的快乐',
            '知足常乐，幸福就在身边'
        ],
        lastGood: [
            '平常心是道，顺其自然',
            '不要强求，是你的总会来',
            '稳扎稳打，厚积薄发'
        ],
        smallBad: [
            '谨言慎行，避免口舌之争',
            '小心身边可能的小人',
            '遇事冷静，不要冲动'
        ],
        lastBad: [
            '以静制动，等待时机',
            '不要冒险，保守为上',
            '修身养性，提升自我'
        ],
        greatBad: [
            '万事小心，安全第一',
            '避免与人冲突，忍一时风平浪静',
            '多行善事，积累福报'
        ]
    },

    getFortuneLevelById(id) {
        return this.fortuneLevels.find(level => level.id === id);
    },

    getRandomFortuneText(levelId) {
        const texts = this.fortuneTexts[levelId];
        return texts[Math.floor(Math.random() * texts.length)];
    },

    getRandomLuckyNumbers(seed) {
        const index = Math.floor(Math.abs(seed) % this.luckyNumbers.length);
        return this.luckyNumbers[index];
    },

    getRandomLuckyColors(seed) {
        const index = Math.floor(Math.abs(seed) % this.luckyColors.length);
        return this.luckyColors[index];
    },

    getRandomLuckyDirection(seed) {
        const index = Math.floor(Math.abs(seed) % this.luckyDirections.length);
        return this.luckyDirections[index];
    },

    getRandomLuckyConstellations(seed) {
        const index = Math.floor(Math.abs(seed) % this.luckyConstellations.length);
        return this.luckyConstellations[index];
    },

    getRandomLuckyItems(seed) {
        const index = Math.floor(Math.abs(seed) % this.luckyItems.length);
        return this.luckyItems[index];
    },

    getRandomSuggestion(levelId, seed) {
        const suggestions = this.suggestions[levelId];
        const index = Math.floor(Math.abs(seed) % suggestions.length);
        return suggestions[index];
    },

    getRandomNote(levelId, seed) {
        const notes = this.notes[levelId];
        const index = Math.floor(Math.abs(seed) % notes.length);
        return notes[index];
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FortuneData;
}
