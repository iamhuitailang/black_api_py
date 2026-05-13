const CHINA_MAP_DATA = {
    width: 1200,
    height: 900,
    provinces: [
        {
            id: 'heilongjiang',
            name: '黑龙江省',
            short: '黑',
            capital: '哈尔滨',
            region: 'dongbei',
            points: [
                [960, 50], [1000, 60], [1010, 90], [1000, 130], [980, 150],
                [950, 160], [920, 150], [900, 120], [910, 90], [940, 60]
            ],
            center: { x: 955, y: 105 }
        },
        {
            id: 'jilin',
            name: '吉林省',
            short: '吉',
            capital: '长春',
            region: 'dongbei',
            points: [
                [900, 120], [920, 150], [900, 190], [850, 200], [820, 180], [840, 140]
            ],
            center: { x: 865, y: 165 }
        },
        {
            id: 'liaoning',
            name: '辽宁省',
            short: '辽',
            capital: '沈阳',
            region: 'dongbei',
            points: [
                [820, 180], [850, 200], [840, 240], [790, 250], [770, 230], [790, 200]
            ],
            center: { x: 810, y: 215 }
        },
        {
            id: 'neimenggu',
            name: '内蒙古自治区',
            short: '内蒙古',
            capital: '呼和浩特',
            region: 'huabei',
            points: [
                [320, 80], [420, 70], [550, 75], [650, 85], [750, 100],
                [780, 130], [760, 170], [700, 190], [600, 200],
                [500, 210], [400, 220], [320, 210], [300, 180], [310, 120]
            ],
            center: { x: 540, y: 150 }
        },
        {
            id: 'beijing',
            name: '北京市',
            short: '京',
            capital: '北京',
            region: 'huabei',
            points: [
                [590, 195], [610, 190], [615, 205], [600, 210], [585, 205]
            ],
            center: { x: 600, y: 200 }
        },
        {
            id: 'tianjin',
            name: '天津市',
            short: '津',
            capital: '天津',
            region: 'huabei',
            points: [
                [615, 205], [635, 200], [640, 215], [625, 222], [615, 215]
            ],
            center: { x: 627, y: 210 }
        },
        {
            id: 'hebei',
            name: '河北省',
            short: '冀',
            capital: '石家庄',
            region: 'huabei',
            points: [
                [550, 210], [615, 200], [650, 220], [660, 260], [630, 290],
                [580, 300], [540, 280], [540, 240]
            ],
            center: { x: 595, y: 255 }
        },
        {
            id: 'shanxi',
            name: '山西省',
            short: '晋',
            capital: '太原',
            region: 'huabei',
            points: [
                [480, 220], [540, 230], [550, 270], [540, 310], [490, 320],
                [460, 290], [470, 250]
            ],
            center: { x: 510, y: 270 }
        },
        {
            id: 'shaanxi',
            name: '陕西省',
            short: '陕或秦',
            capital: '西安',
            region: 'xibei',
            points: [
                [400, 270], [460, 260], [480, 300], [490, 350], [450, 380],
                [400, 370], [380, 330], [385, 290]
            ],
            center: { x: 435, y: 320 }
        },
        {
            id: 'ningxia',
            name: '宁夏回族自治区',
            short: '宁',
            capital: '银川',
            region: 'xibei',
            points: [
                [360, 290], [385, 285], [395, 310], [380, 325], [365, 315]
            ],
            center: { x: 377, y: 305 }
        },
        {
            id: 'gansu',
            name: '甘肃省',
            short: '甘或陇',
            capital: '兰州',
            region: 'xibei',
            points: [
                [180, 180], [280, 170], [360, 190], [370, 240],
                [360, 280], [310, 290], [240, 280], [200, 250], [190, 210]
            ],
            center: { x: 280, y: 235 }
        },
        {
            id: 'qinghai',
            name: '青海省',
            short: '青',
            capital: '西宁',
            region: 'xibei',
            points: [
                [160, 300], [240, 290], [290, 310], [300, 360],
                [260, 390], [200, 380], [160, 340]
            ],
            center: { x: 230, y: 340 }
        },
        {
            id: 'xinjiang',
            name: '新疆维吾尔自治区',
            short: '新',
            capital: '乌鲁木齐',
            region: 'xibei',
            points: [
                [40, 140], [160, 130], [200, 170], [210, 230],
                [170, 280], [100, 270], [60, 240], [50, 190]
            ],
            center: { x: 130, y: 205 }
        },
        {
            id: 'xizang',
            name: '西藏自治区',
            short: '藏',
            capital: '拉萨',
            region: 'xinan',
            points: [
                [80, 360], [160, 350], [240, 380], [270, 440],
                [240, 510], [160, 520], [100, 480], [90, 420]
            ],
            center: { x: 175, y: 440 }
        },
        {
            id: 'sichuan',
            name: '四川省',
            short: '川或蜀',
            capital: '成都',
            region: 'xinan',
            points: [
                [270, 380], [360, 370], [400, 400], [410, 450],
                [370, 480], [310, 480], [280, 450], [270, 410]
            ],
            center: { x: 335, y: 430 }
        },
        {
            id: 'chongqing',
            name: '重庆市',
            short: '渝',
            capital: '重庆',
            region: 'xinan',
            points: [
                [410, 405], [450, 400], [460, 430], [440, 455], [415, 450], [405, 425]
            ],
            center: { x: 430, y: 427 }
        },
        {
            id: 'guizhou',
            name: '贵州省',
            short: '贵或黔',
            capital: '贵阳',
            region: 'xinan',
            points: [
                [440, 460], [500, 450], [520, 490], [500, 530], [440, 540], [420, 505]
            ],
            center: { x: 470, y: 495 }
        },
        {
            id: 'yunnan',
            name: '云南省',
            short: '云或滇',
            capital: '昆明',
            region: 'xinan',
            points: [
                [310, 480], [400, 470], [420, 520], [410, 590],
                [350, 620], [300, 590], [300, 530]
            ],
            center: { x: 355, y: 545 }
        },
        {
            id: 'guangxi',
            name: '广西壮族自治区',
            short: '桂',
            capital: '南宁',
            region: 'huanan',
            points: [
                [500, 530], [570, 520], [590, 560], [570, 600], [510, 610], [490, 575]
            ],
            center: { x: 540, y: 565 }
        },
        {
            id: 'guangdong',
            name: '广东省',
            short: '粤',
            capital: '广州',
            region: 'huanan',
            points: [
                [570, 520], [640, 510], [660, 550], [630, 590], [590, 600], [575, 565]
            ],
            center: { x: 610, y: 555 }
        },
        {
            id: 'hainan',
            name: '海南省',
            short: '琼',
            capital: '海口',
            region: 'huanan',
            points: [
                [530, 640], [565, 635], [575, 660], [555, 675], [535, 670]
            ],
            center: { x: 552, y: 655 }
        },
        {
            id: 'hongkong',
            name: '香港特别行政区',
            short: '港',
            capital: '香港',
            region: 'huanan',
            points: [
                [635, 595], [648, 592], [650, 605], [640, 610], [632, 605]
            ],
            center: { x: 641, y: 601 }
        },
        {
            id: 'macau',
            name: '澳门特别行政区',
            short: '澳',
            capital: '澳门',
            region: 'huanan',
            points: [
                [615, 605], [625, 602], [628, 612], [618, 615], [610, 610]
            ],
            center: { x: 619, y: 608 }
        },
        {
            id: 'hunan',
            name: '湖南省',
            short: '湘',
            capital: '长沙',
            region: 'huazhong',
            points: [
                [510, 460], [570, 450], [590, 490], [570, 530], [520, 540], [500, 505]
            ],
            center: { x: 540, y: 495 }
        },
        {
            id: 'hubei',
            name: '湖北省',
            short: '鄂',
            capital: '武汉',
            region: 'huazhong',
            points: [
                [500, 400], [570, 390], [600, 420], [590, 460], [540, 470], [500, 440]
            ],
            center: { x: 545, y: 430 }
        },
        {
            id: 'henan',
            name: '河南省',
            short: '豫',
            capital: '郑州',
            region: 'huazhong',
            points: [
                [540, 330], [610, 320], [640, 360], [630, 400], [580, 410], [550, 375]
            ],
            center: { x: 585, y: 365 }
        },
        {
            id: 'shandong',
            name: '山东省',
            short: '鲁',
            capital: '济南',
            region: 'huadong',
            points: [
                [660, 300], [730, 290], [750, 330], [730, 370], [680, 380], [660, 345]
            ],
            center: { x: 705, y: 335 }
        },
        {
            id: 'jiangsu',
            name: '江苏省',
            short: '苏',
            capital: '南京',
            region: 'huadong',
            points: [
                [730, 370], [790, 360], [810, 400], [790, 430], [740, 440], [730, 405]
            ],
            center: { x: 765, y: 400 }
        },
        {
            id: 'anhui',
            name: '安徽省',
            short: '皖',
            capital: '合肥',
            region: 'huadong',
            points: [
                [680, 410], [730, 400], [745, 440], [720, 470], [680, 475], [670, 440]
            ],
            center: { x: 705, y: 440 }
        },
        {
            id: 'zhejiang',
            name: '浙江省',
            short: '浙',
            capital: '杭州',
            region: 'huadong',
            points: [
                [745, 440], [795, 430], [815, 470], [795, 510], [755, 515], [745, 480]
            ],
            center: { x: 775, y: 472 }
        },
        {
            id: 'jiangxi',
            name: '江西省',
            short: '赣',
            capital: '南昌',
            region: 'huadong',
            points: [
                [680, 475], [740, 465], [760, 500], [750, 540], [710, 550], [695, 515]
            ],
            center: { x: 720, y: 510 }
        },
        {
            id: 'fujian',
            name: '福建省',
            short: '闽',
            capital: '福州',
            region: 'huadong',
            points: [
                [760, 510], [795, 500], [815, 540], [800, 580], [755, 585], [740, 550]
            ],
            center: { x: 775, y: 545 }
        },
        {
            id: 'taiwan',
            name: '台湾省',
            short: '台',
            capital: '台北',
            region: 'huadong',
            points: [
                [840, 560], [870, 555], [880, 595], [860, 615], [840, 605], [835, 580]
            ],
            center: { x: 858, y: 582 }
        },
        {
            id: 'shanghai',
            name: '上海市',
            short: '沪',
            capital: '上海',
            region: 'huadong',
            points: [
                [795, 415], [810, 412], [815, 425], [805, 430], [795, 425]
            ],
            center: { x: 804, y: 420 }
        }
    ]
};
