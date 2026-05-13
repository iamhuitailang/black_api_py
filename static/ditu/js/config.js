const CONFIG = {
    STORAGE_KEY: 'china_map_quiz',
    MIN_SCALE: 0.5,
    MAX_SCALE: 3,
    SCALE_STEP: 0.1,
    BASE_SCORE: 100,
    STREAK_BONUS: 20,
    TIME_BONUS_MULTIPLIER: 0.5,
    MAX_HINTS: 2,
    PASS_ACCURACY: 0.8,
    WARNING_TIME: 60,
    LEVELS: {
        huabei: { name: '华北地区', provinces: ['北京市', '天津市', '河北省', '山西省', '内蒙古自治区'], time: 300 },
        huadong: { name: '华东地区', provinces: ['上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '台湾省'], time: 360 },
        huanan: { name: '华南地区', provinces: ['广东省', '广西壮族自治区', '海南省', '香港特别行政区', '澳门特别行政区'], time: 300 },
        xinan: { name: '西南地区', provinces: ['重庆市', '四川省', '贵州省', '云南省', '西藏自治区'], time: 300 },
        xibei: { name: '西北地区', provinces: ['陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区'], time: 300 },
        dongbei: { name: '东北地区', provinces: ['辽宁省', '吉林省', '黑龙江省'], time: 240 },
        all: { name: '全国综合', provinces: null, time: 600 }
    }
};
