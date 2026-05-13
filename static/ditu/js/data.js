const PROVINCE_DATA = [
    { id: 'beijing', name: '北京市', short: '京', capital: '北京', center: [116.4074, 39.9042], region: 'huabei' },
    { id: 'tianjin', name: '天津市', short: '津', capital: '天津', center: [117.2009, 39.0842], region: 'huabei' },
    { id: 'hebei', name: '河北省', short: '冀', capital: '石家庄', center: [114.5148, 38.0423], region: 'huabei' },
    { id: 'shanxi', name: '山西省', short: '晋', capital: '太原', center: [112.5489, 37.8706], region: 'huabei' },
    { id: 'neimenggu', name: '内蒙古自治区', short: '内蒙古', capital: '呼和浩特', center: [111.7519, 40.8414], region: 'huabei' },
    { id: 'liaoning', name: '辽宁省', short: '辽', capital: '沈阳', center: [123.4328, 41.8086], region: 'dongbei' },
    { id: 'jilin', name: '吉林省', short: '吉', capital: '长春', center: [125.3245, 43.8868], region: 'dongbei' },
    { id: 'heilongjiang', name: '黑龙江省', short: '黑', capital: '哈尔滨', center: [126.5349, 45.8038], region: 'dongbei' },
    { id: 'shanghai', name: '上海市', short: '沪', capital: '上海', center: [121.4737, 31.2304], region: 'huadong' },
    { id: 'jiangsu', name: '江苏省', short: '苏', capital: '南京', center: [118.7969, 32.0603], region: 'huadong' },
    { id: 'zhejiang', name: '浙江省', short: '浙', capital: '杭州', center: [120.1551, 30.2741], region: 'huadong' },
    { id: 'anhui', name: '安徽省', short: '皖', capital: '合肥', center: [117.2272, 31.8206], region: 'huadong' },
    { id: 'fujian', name: '福建省', short: '闽', capital: '福州', center: [119.2965, 26.0745], region: 'huadong' },
    { id: 'jiangxi', name: '江西省', short: '赣', capital: '南昌', center: [115.8921, 28.6769], region: 'huadong' },
    { id: 'shandong', name: '山东省', short: '鲁', capital: '济南', center: [117.0204, 36.6683], region: 'huadong' },
    { id: 'taiwan', name: '台湾省', short: '台', capital: '台北', center: [121.5654, 25.0330], region: 'huadong' },
    { id: 'guangdong', name: '广东省', short: '粤', capital: '广州', center: [113.2644, 23.1291], region: 'huanan' },
    { id: 'guangxi', name: '广西壮族自治区', short: '桂', capital: '南宁', center: [108.3661, 22.8170], region: 'huanan' },
    { id: 'hainan', name: '海南省', short: '琼', capital: '海口', center: [110.3311, 20.0174], region: 'huanan' },
    { id: 'hongkong', name: '香港特别行政区', short: '港', capital: '香港', center: [114.1694, 22.3193], region: 'huanan' },
    { id: 'macau', name: '澳门特别行政区', short: '澳', capital: '澳门', center: [113.5491, 22.1987], region: 'huanan' },
    { id: 'henan', name: '河南省', short: '豫', capital: '郑州', center: [113.6654, 34.7579], region: 'huazhong' },
    { id: 'hubei', name: '湖北省', short: '鄂', capital: '武汉', center: [114.3054, 30.5931], region: 'huazhong' },
    { id: 'hunan', name: '湖南省', short: '湘', capital: '长沙', center: [112.9388, 28.2282], region: 'huazhong' },
    { id: 'chongqing', name: '重庆市', short: '渝', capital: '重庆', center: [106.5516, 29.5630], region: 'xinan' },
    { id: 'sichuan', name: '四川省', short: '川或蜀', capital: '成都', center: [104.0668, 30.5728], region: 'xinan' },
    { id: 'guizhou', name: '贵州省', short: '贵或黔', capital: '贵阳', center: [106.6302, 26.6477], region: 'xinan' },
    { id: 'yunnan', name: '云南省', short: '云或滇', capital: '昆明', center: [102.8329, 24.8801], region: 'xinan' },
    { id: 'xizang', name: '西藏自治区', short: '藏', capital: '拉萨', center: [91.1172, 29.6469], region: 'xinan' },
    { id: 'shaanxi', name: '陕西省', short: '陕或秦', capital: '西安', center: [108.9398, 34.3416], region: 'xibei' },
    { id: 'gansu', name: '甘肃省', short: '甘或陇', capital: '兰州', center: [103.8236, 36.0581], region: 'xibei' },
    { id: 'qinghai', name: '青海省', short: '青', capital: '西宁', center: [101.7782, 36.6171], region: 'xibei' },
    { id: 'ningxia', name: '宁夏回族自治区', short: '宁', capital: '银川', center: [106.2731, 38.4682], region: 'xibei' },
    { id: 'xinjiang', name: '新疆维吾尔自治区', short: '新', capital: '乌鲁木齐', center: [87.6177, 43.8266], region: 'xibei' }
];

function getProvinceById(id) {
    return PROVINCE_DATA.find(p => p.id === id);
}

function getProvincesByRegion(region) {
    if (region === 'all') return PROVINCE_DATA;
    return PROVINCE_DATA.filter(p => p.region === region || 
        (region === 'huazhong' && ['河南省', '湖北省', '湖南省'].includes(p.name)));
}

function getRegionByProvinceId(id) {
    const province = getProvinceById(id);
    return province ? province.region : null;
}
