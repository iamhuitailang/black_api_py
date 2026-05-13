const CHINA_MAP_DATA = {
    width: 800,
    height: 600,
    provinces: [
        {
            id: 'heilongjiang',
            name: '黑龙江省',
            short: '黑',
            capital: '哈尔滨',
            region: 'dongbei',
            path: 'M680,50 L750,60 L780,100 L760,150 L720,180 L660,170 L640,130 L650,80 Z',
            center: { x: 700, y: 110 }
        },
        {
            id: 'jilin',
            name: '吉林省',
            short: '吉',
            capital: '长春',
            region: 'dongbei',
            path: 'M640,130 L660,170 L620,200 L560,190 L540,150 L580,120 Z',
            center: { x: 600, y: 155 }
        },
        {
            id: 'liaoning',
            name: '辽宁省',
            short: '辽',
            capital: '沈阳',
            region: 'dongbei',
            path: 'M540,150 L560,190 L520,230 L460,220 L440,180 L480,150 Z',
            center: { x: 500, y: 185 }
        },
        {
            id: 'neimenggu',
            name: '内蒙古自治区',
            short: '内蒙古',
            capital: '呼和浩特',
            region: 'huabei',
            path: 'M200,80 L440,80 L480,150 L440,180 L380,200 L300,210 L220,190 L180,150 L160,100 Z',
            center: { x: 320, y: 145 }
        },
        {
            id: 'beijing',
            name: '北京市',
            short: '京',
            capital: '北京',
            region: 'huabei',
            path: 'M420,160 L440,155 L445,175 L430,180 L415,170 Z',
            center: { x: 430, y: 168 }
        },
        {
            id: 'tianjin',
            name: '天津市',
            short: '津',
            capital: '天津',
            region: 'huabei',
            path: 'M445,175 L460,170 L465,185 L450,190 L440,180 Z',
            center: { x: 452, y: 180 }
        },
        {
            id: 'hebei',
            name: '河北省',
            short: '冀',
            capital: '石家庄',
            region: 'huabei',
            path: 'M380,200 L440,180 L460,220 L420,260 L360,250 L340,210 Z',
            center: { x: 400, y: 225 }
        },
        {
            id: 'shanxi',
            name: '山西省',
            short: '晋',
            capital: '太原',
            region: 'huabei',
            path: 'M300,210 L340,210 L360,250 L320,290 L280,270 L260,230 Z',
            center: { x: 310, y: 250 }
        },
        {
            id: 'shaanxi',
            name: '陕西省',
            short: '陕或秦',
            capital: '西安',
            region: 'xibei',
            path: 'M260,230 L280,270 L320,290 L310,340 L260,360 L220,330 L200,280 L220,240 Z',
            center: { x: 260, y: 300 }
        },
        {
            id: 'ningxia',
            name: '宁夏回族自治区',
            short: '宁',
            capital: '银川',
            region: 'xibei',
            path: 'M200,280 L220,270 L230,300 L210,320 L190,300 Z',
            center: { x: 210, y: 295 }
        },
        {
            id: 'gansu',
            name: '甘肃省',
            short: '甘或陇',
            capital: '兰州',
            region: 'xibei',
            path: 'M100,200 L200,180 L220,240 L200,280 L160,300 L80,280 L60,240 L70,200 Z',
            center: { x: 140, y: 240 }
        },
        {
            id: 'qinghai',
            name: '青海省',
            short: '青',
            capital: '西宁',
            region: 'xibei',
            path: 'M60,240 L80,280 L160,300 L180,350 L120,380 L40,350 L20,290 Z',
            center: { x: 100, y: 315 }
        },
        {
            id: 'xinjiang',
            name: '新疆维吾尔自治区',
            short: '新',
            capital: '乌鲁木齐',
            region: 'xibei',
            path: 'M20,150 L160,120 L200,180 L160,240 L60,240 L10,200 Z',
            center: { x: 100, y: 180 }
        },
        {
            id: 'xizang',
            name: '西藏自治区',
            short: '藏',
            capital: '拉萨',
            region: 'xinan',
            path: 'M20,290 L40,350 L120,380 L200,420 L180,480 L80,460 L10,400 Z',
            center: { x: 110, y: 400 }
        },
        {
            id: 'sichuan',
            name: '四川省',
            short: '川或蜀',
            capital: '成都',
            region: 'xinan',
            path: 'M180,350 L260,360 L300,400 L280,460 L200,480 L180,420 L160,380 Z',
            center: { x: 230, y: 410 }
        },
        {
            id: 'chongqing',
            name: '重庆市',
            short: '渝',
            capital: '重庆',
            region: 'xinan',
            path: 'M300,400 L340,390 L350,430 L320,460 L280,460 L280,420 Z',
            center: { x: 315, y: 425 }
        },
        {
            id: 'guizhou',
            name: '贵州省',
            short: '贵或黔',
            capital: '贵阳',
            region: 'xinan',
            path: 'M320,460 L380,450 L400,490 L360,520 L300,510 L280,470 Z',
            center: { x: 340, y: 485 }
        },
        {
            id: 'yunnan',
            name: '云南省',
            short: '云或滇',
            capital: '昆明',
            region: 'xinan',
            path: 'M200,480 L280,470 L300,510 L280,560 L220,580 L160,540 L180,480 Z',
            center: { x: 230, y: 520 }
        },
        {
            id: 'guangxi',
            name: '广西壮族自治区',
            short: '桂',
            capital: '南宁',
            region: 'huanan',
            path: 'M360,520 L440,510 L460,550 L420,580 L360,570 L340,530 Z',
            center: { x: 400, y: 545 }
        },
        {
            id: 'guangdong',
            name: '广东省',
            short: '粤',
            capital: '广州',
            region: 'huanan',
            path: 'M440,510 L520,490 L540,530 L500,570 L460,580 L420,550 Z',
            center: { x: 480, y: 530 }
        },
        {
            id: 'hainan',
            name: '海南省',
            short: '琼',
            capital: '海口',
            region: 'huanan',
            path: 'M440,590 L470,585 L480,605 L455,615 L435,605 Z',
            center: { x: 455, y: 600 }
        },
        {
            id: 'hongkong',
            name: '香港特别行政区',
            short: '港',
            capital: '香港',
            region: 'huanan',
            path: 'M510,555 L525,550 L530,565 L520,570 L510,565 Z',
            center: { x: 518, y: 560 }
        },
        {
            id: 'macau',
            name: '澳门特别行政区',
            short: '澳',
            capital: '澳门',
            region: 'huanan',
            path: 'M490,565 L500,562 L505,572 L495,575 L488,570 Z',
            center: { x: 495, y: 568 }
        },
        {
            id: 'hunan',
            name: '湖南省',
            short: '湘',
            capital: '长沙',
            region: 'huazhong',
            path: 'M380,450 L450,440 L470,480 L430,510 L360,520 L350,480 Z',
            center: { x: 410, y: 475 }
        },
        {
            id: 'hubei',
            name: '湖北省',
            short: '鄂',
            capital: '武汉',
            region: 'huazhong',
            path: 'M350,390 L430,380 L460,420 L430,450 L360,460 L340,420 Z',
            center: { x: 395, y: 415 }
        },
        {
            id: 'henan',
            name: '河南省',
            short: '豫',
            capital: '郑州',
            region: 'huazhong',
            path: 'M360,290 L440,280 L470,320 L440,360 L380,370 L340,330 Z',
            center: { x: 405, y: 325 }
        },
        {
            id: 'shandong',
            name: '山东省',
            short: '鲁',
            capital: '济南',
            region: 'huadong',
            path: 'M460,280 L540,270 L560,310 L520,350 L460,340 L440,300 Z',
            center: { x: 500, y: 310 }
        },
        {
            id: 'jiangsu',
            name: '江苏省',
            short: '苏',
            capital: '南京',
            region: 'huadong',
            path: 'M520,350 L580,340 L600,380 L570,410 L520,400 L510,370 Z',
            center: { x: 555, y: 375 }
        },
        {
            id: 'anhui',
            name: '安徽省',
            short: '皖',
            capital: '合肥',
            region: 'huadong',
            path: 'M470,360 L520,350 L530,390 L500,420 L450,410 L440,380 Z',
            center: { x: 485, y: 385 }
        },
        {
            id: 'zhejiang',
            name: '浙江省',
            short: '浙',
            capital: '杭州',
            region: 'huadong',
            path: 'M570,410 L620,400 L630,440 L600,470 L560,460 L550,430 Z',
            center: { x: 590, y: 435 }
        },
        {
            id: 'jiangxi',
            name: '江西省',
            short: '赣',
            capital: '南昌',
            region: 'huadong',
            path: 'M500,420 L560,410 L570,450 L540,490 L480,480 L470,450 Z',
            center: { x: 525, y: 450 }
        },
        {
            id: 'fujian',
            name: '福建省',
            short: '闽',
            capital: '福州',
            region: 'huadong',
            path: 'M560,460 L620,450 L630,490 L600,520 L560,510 L550,480 Z',
            center: { x: 585, y: 485 }
        },
        {
            id: 'taiwan',
            name: '台湾省',
            short: '台',
            capital: '台北',
            region: 'huadong',
            path: 'M640,500 L670,495 L680,535 L660,555 L645,545 L635,520 Z',
            center: { x: 655, y: 520 }
        },
        {
            id: 'shanghai',
            name: '上海市',
            short: '沪',
            capital: '上海',
            region: 'huadong',
            path: 'M600,395 L615,392 L620,405 L610,410 L600,405 Z',
            center: { x: 608, y: 400 }
        }
    ]
};
