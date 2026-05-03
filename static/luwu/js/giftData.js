const GiftData = {
    builtInGifts: [],

    init() {
        this.builtInGifts = this.generateBuiltInGifts();
    },

    generateBuiltInGifts() {
        return [
            { id: 'gf_001', name: '红玫瑰鲜花礼盒', category: '鲜花', price: 158, brand: '', image: '', description: '精选红玫瑰11支，搭配满天星和精美包装，传递浓浓爱意。适合表白、纪念日、情人节等浪漫场合。', relationships: ['lover'], genders: ['female'], ages: ['young', 'middle'], interests: ['home'], occasions: ['valentine', 'birthday', 'anniversary'] },
            { id: 'gf_002', name: '粉色玫瑰礼盒', category: '鲜花', price: 198, brand: '', image: '', description: '粉色玫瑰代表初恋、甜蜜和温馨，适合送给恋人或表达好感。', relationships: ['lover', 'friend'], genders: ['female'], ages: ['young', 'middle'], interests: ['home'], occasions: ['valentine', 'birthday'] },
            { id: 'gf_003', name: '向日葵花束', category: '鲜花', price: 128, brand: '', image: '', description: '向日葵象征阳光、活力和希望，适合送给朋友或庆祝重要时刻。', relationships: ['friend', 'lover', 'colleague'], genders: ['any'], ages: ['young', 'middle'], interests: ['home'], occasions: ['birthday', 'anniversary'] },
            { id: 'gf_004', name: '康乃馨花束', category: '鲜花', price: 98, brand: '', image: '', description: '康乃馨代表母爱、尊敬和感谢，是母亲节的经典之选。', relationships: ['parent', 'elder'], genders: ['female'], ages: ['middle', 'elder'], interests: ['home'], occasions: ['mothersday', 'birthday'] },
            { id: 'gf_005', name: '百合鲜花礼盒', category: '鲜花', price: 168, brand: '', image: '', description: '百合象征纯洁、高贵和祝福，适合送给长辈或重要场合。', relationships: ['elder', 'parent', 'friend'], genders: ['any'], ages: ['middle', 'elder'], interests: ['home'], occasions: ['birthday', 'newyear'] },
            { id: 'gf_006', name: 'Dior口红999', category: '美妆', price: 320, brand: 'Dior', image: '', description: '经典正红色，滋润显色，气场全开。适合日常和重要场合使用。', relationships: ['lover', 'friend'], genders: ['female'], ages: ['young', 'middle'], interests: ['beauty'], occasions: ['birthday', 'valentine', 'anniversary'] },
            { id: 'gf_007', name: 'YSL小金条口红', category: '美妆', price: 380, brand: 'YSL', image: '', description: '丝绒质地，高级感十足，色号丰富，持久显色。', relationships: ['lover', 'friend'], genders: ['female'], ages: ['young', 'middle'], interests: ['beauty'], occasions: ['birthday', 'valentine'] },
            { id: 'gf_008', name: 'Mac子弹头口红', category: '美妆', price: 170, brand: 'MAC', image: '', description: '经典色号Chili、Ruby Woo等，性价比高，适合美妆入门。', relationships: ['lover', 'friend'], genders: ['female'], ages: ['young'], interests: ['beauty'], occasions: ['birthday'] },
            { id: 'gf_009', name: '兰蔻小黑瓶精华', category: '美妆', price: 1080, brand: 'Lancome', image: '', description: '肌底精华，修护维稳，提升肌肤吸收力，适合各种肤质。', relationships: ['lover', 'parent'], genders: ['female'], ages: ['young', 'middle'], interests: ['beauty'], occasions: ['birthday', 'anniversary', 'mothersday'] },
            { id: 'gf_010', name: 'SK-II神仙水', category: '美妆', price: 1590, brand: 'SK-II', image: '', description: 'PITERA精华，调节肌肤水油平衡，改善肤质，护肤界的明星产品。', relationships: ['lover', 'parent'], genders: ['female'], ages: ['young', 'middle'], interests: ['beauty'], occasions: ['birthday', 'anniversary'] },
            { id: 'gf_011', name: '雅诗兰黛小棕瓶', category: '美妆', price: 760, brand: 'Estee Lauder', image: '', description: '夜间修护精华，淡化细纹，提亮肤色，经典抗老产品。', relationships: ['lover', 'parent'], genders: ['female'], ages: ['middle'], interests: ['beauty'], occasions: ['birthday', 'anniversary', 'mothersday'] },
            { id: 'gf_012', name: '香奈儿5号香水', category: '美妆', price: 1280, brand: 'Chanel', image: '', description: '经典中的经典，优雅花香调，持久留香，彰显女性魅力。', relationships: ['lover'], genders: ['female'], ages: ['young', 'middle'], interests: ['beauty'], occasions: ['birthday', 'anniversary', 'valentine'] },
            { id: 'gf_013', name: '祖玛珑蓝风铃香水', category: '美妆', price: 600, brand: 'Jo Malone', image: '', description: '清新花香调，适合春夏，留香持久，可叠香使用。', relationships: ['lover', 'friend'], genders: ['female'], ages: ['young', 'middle'], interests: ['beauty'], occasions: ['birthday', 'valentine'] },
            { id: 'gf_014', name: '迪奥花漾甜心', category: '美妆', price: 980, brand: 'Dior', image: '', description: '甜美花香调，适合年轻女孩，展现甜美可爱的气质。', relationships: ['lover', 'friend'], genders: ['female'], ages: ['young'], interests: ['beauty'], occasions: ['birthday', 'valentine'] },
            { id: 'gf_015', name: '纪梵希四宫格散粉', category: '美妆', price: 550, brand: 'Givenchy', image: '', description: '细腻轻盈，控油持久，四色搭配，打造雾面妆效。', relationships: ['lover', 'friend'], genders: ['female'], ages: ['young', 'middle'], interests: ['beauty'], occasions: ['birthday'] },
            { id: 'gf_016', name: 'NARS腮红', category: '美妆', price: 300, brand: 'NARS', image: '', description: '经典色号Orgasm、Deep Throat，显色度高，持久不脱妆。', relationships: ['lover', 'friend'], genders: ['female'], ages: ['young'], interests: ['beauty'], occasions: ['birthday'] },
            { id: 'gf_017', name: 'Benefit眉笔', category: '美妆', price: 220, brand: 'Benefit', image: '', description: '砍刀眉笔，易上手，持久不脱妆，新手友好。', relationships: ['lover', 'friend'], genders: ['female'], ages: ['young'], interests: ['beauty'], occasions: ['birthday'] },
            { id: 'gf_018', name: 'Urban Decay眼影盘', category: '美妆', price: 420, brand: 'Urban Decay', image: '', description: 'Naked系列眼影盘，配色实用，粉质细腻，适合各种场合。', relationships: ['lover', 'friend'], genders: ['female'], ages: ['young'], interests: ['beauty'], occasions: ['birthday'] },
            { id: 'gf_019', name: 'SK-II护肤礼盒', category: '美妆', price: 2980, brand: 'SK-II', image: '', description: '神仙水+洁面+面霜的完美组合，全方位呵护肌肤，送礼有面子。', relationships: ['lover', 'parent'], genders: ['female'], ages: ['young', 'middle'], interests: ['beauty'], occasions: ['birthday', 'anniversary', 'mothersday'] },
            { id: 'gf_020', name: '兰蔻护肤套装', category: '美妆', price: 1680, brand: 'Lancome', image: '', description: '小黑瓶精华+粉水+眼霜的经典组合，适合各种肤质。', relationships: ['lover', 'parent'], genders: ['female'], ages: ['young', 'middle'], interests: ['beauty'], occasions: ['birthday', 'mothersday'] },
            { id: 'gf_021', name: 'Cherry樱桃轴机械键盘', category: '数码', price: 899, brand: 'Cherry', image: '', description: '德国原厂Cherry轴体，手感极佳，适合程序员和游戏玩家。', relationships: ['lover', 'friend'], genders: ['male'], ages: ['young'], interests: ['tech'], occasions: ['birthday', 'anniversary'] },
            { id: 'gf_022', name: '罗技G Pro X键盘', category: '数码', price: 1299, brand: 'Logitech', image: '', description: '专业级游戏键盘，热插拔轴体，RGB灯效，适合电竞爱好者。', relationships: ['lover', 'friend'], genders: ['male'], ages: ['young'], interests: ['tech'], occasions: ['birthday'] },
            { id: 'gf_023', name: '雷蛇黑寡妇蜘蛛', category: '数码', price: 599, brand: 'Razer', image: '', description: '经典游戏键盘，绿轴手感清脆，RGB灯效炫酷。', relationships: ['lover', 'friend'], genders: ['male'], ages: ['young'], interests: ['tech'], occasions: ['birthday'] },
            { id: 'gf_024', name: 'HHKB Professional', category: '数码', price: 2199, brand: 'HHKB', image: '', description: '静电容键盘，极致手感，程序员神器，长期打字福音。', relationships: ['lover', 'colleague'], genders: ['male'], ages: ['young', 'middle'], interests: ['tech', 'office'], occasions: ['birthday', 'anniversary'] },
            { id: 'gf_025', name: 'Apple AirPods Pro 2', category: '数码', price: 1899, brand: 'Apple', image: '', description: '主动降噪，空间音频，续航持久，Apple生态必备。', relationships: ['lover', 'friend', 'colleague'], genders: ['any'], ages: ['young', 'middle'], interests: ['tech', 'music'], occasions: ['birthday', 'anniversary'] },
            { id: 'gf_026', name: '索尼WH-1000XM5', category: '数码', price: 2499, brand: 'Sony', image: '', description: '业界顶级降噪，30小时续航，音质出色，商务人士首选。', relationships: ['lover', 'colleague'], genders: ['any'], ages: ['young', 'middle'], interests: ['tech', 'music', 'travel'], occasions: ['birthday', 'anniversary'] },
            { id: 'gf_027', name: 'Bose QuietComfort 45', category: '数码', price: 2299, brand: 'Bose', image: '', description: '舒适佩戴，优秀降噪，适合长途旅行和日常通勤。', relationships: ['lover', 'colleague'], genders: ['any'], ages: ['young', 'middle'], interests: ['tech', 'music', 'travel'], occasions: ['birthday'] },
            { id: 'gf_028', name: 'Beats Studio Buds', category: '数码', price: 899, brand: 'Beats', image: '', description: '真无线降噪耳机，潮流外观，适合年轻人和运动场景。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young'], interests: ['tech', 'music', 'sports'], occasions: ['birthday'] },
            { id: 'gf_029', name: 'Apple Watch Series 9', category: '数码', price: 2999, brand: 'Apple', image: '', description: '智能手表，健康监测，运动追踪，Apple生态完美搭配。', relationships: ['lover', 'friend', 'colleague'], genders: ['any'], ages: ['young', 'middle'], interests: ['tech', 'sports', 'health'], occasions: ['birthday', 'anniversary'] },
            { id: 'gf_030', name: '华为Watch GT4', category: '数码', price: 1488, brand: 'Huawei', image: '', description: '长续航智能手表，精准健康监测，适合Android用户。', relationships: ['lover', 'friend', 'colleague'], genders: ['any'], ages: ['young', 'middle'], interests: ['tech', 'sports', 'health'], occasions: ['birthday'] },
            { id: 'gf_031', name: '小米手环8', category: '数码', price: 249, brand: 'Xiaomi', image: '', description: '性价比之王，运动追踪，心率监测，续航14天。', relationships: ['friend', 'junior', 'colleague'], genders: ['any'], ages: ['young', 'middle'], interests: ['tech', 'sports'], occasions: ['birthday'] },
            { id: 'gf_032', name: 'Apple iPad Air', category: '数码', price: 4599, brand: 'Apple', image: '', description: 'M1芯片，轻薄便携，适合学习、娱乐和轻度办公。', relationships: ['lover', 'child', 'friend'], genders: ['any'], ages: ['teen', 'young', 'middle'], interests: ['tech', 'reading', 'office'], occasions: ['birthday', 'newyear'] },
            { id: 'gf_033', name: 'Kindle Paperwhite', category: '数码', price: 1099, brand: 'Amazon', image: '', description: '电子阅读器，护眼屏幕，续航持久，阅读爱好者必备。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['reading'], occasions: ['birthday', 'anniversary'] },
            { id: 'gf_034', name: '任天堂Switch OLED', category: '数码', price: 2599, brand: 'Nintendo', image: '', description: '掌上游戏机，OLED屏幕，多人同乐，家庭聚会神器。', relationships: ['lover', 'child', 'friend'], genders: ['any'], ages: ['teen', 'young'], interests: ['tech'], occasions: ['birthday', 'newyear'] },
            { id: 'gf_035', name: '索尼PS5', category: '数码', price: 3899, brand: 'Sony', image: '', description: '次世代主机，4K画质，光追技术，游戏爱好者终极梦想。', relationships: ['lover', 'friend'], genders: ['male'], ages: ['young'], interests: ['tech'], occasions: ['birthday', 'anniversary'] },
            { id: 'gf_036', name: '戴森V15吸尘器', category: '数码', price: 5490, brand: 'Dyson', image: '', description: '激光检测灰尘，强劲吸力，HEPA过滤，居家清洁神器。', relationships: ['lover', 'parent'], genders: ['any'], ages: ['middle'], interests: ['tech', 'home'], occasions: ['birthday', 'anniversary', 'newyear'] },
            { id: 'gf_037', name: '戴森吹风机HD15', category: '数码', price: 3190, brand: 'Dyson', image: '', description: '高速气流，温控精准，护发科技，呵护秀发。', relationships: ['lover', 'parent'], genders: ['female'], ages: ['young', 'middle'], interests: ['tech', 'beauty'], occasions: ['birthday', 'anniversary', 'mothersday'] },
            { id: 'gf_038', name: '戴森空气净化器', category: '数码', price: 5990, brand: 'Dyson', image: '', description: '净化+加湿+凉风三合一，守护全家呼吸健康。', relationships: ['lover', 'parent'], genders: ['any'], ages: ['middle'], interests: ['tech', 'home', 'health'], occasions: ['newyear', 'birthday'] },
            { id: 'gf_039', name: '飞利浦电动牙刷', category: '数码', price: 499, brand: 'Philips', image: '', description: '声波震动，清洁彻底，多种模式，呵护口腔健康。', relationships: ['lover', 'friend', 'parent'], genders: ['any'], ages: ['young', 'middle'], interests: ['tech', 'health'], occasions: ['birthday'] },
            { id: 'gf_040', name: '博朗剃须刀9系', category: '数码', price: 1999, brand: 'Braun', image: '', description: '顶级电动剃须刀，智能剃须系统，舒适贴面，适合送礼。', relationships: ['lover', 'parent'], genders: ['male'], ages: ['young', 'middle'], interests: ['tech'], occasions: ['birthday', 'anniversary', 'fathersday'] },
            { id: 'gf_041', name: '《百年孤独》精装版', category: '阅读', price: 55, brand: '南海出版公司', image: '', description: '马尔克斯经典之作，魔幻现实主义巅峰，文学爱好者必读。', relationships: ['friend', 'lover'], genders: ['any'], ages: ['young', 'middle'], interests: ['reading'], occasions: ['birthday'] },
            { id: 'gf_042', name: '《三体》典藏版', category: '阅读', price: 168, brand: '重庆出版社', image: '', description: '中国科幻巅峰之作，刘慈欣代表作，雨果奖获奖作品。', relationships: ['friend', 'lover'], genders: ['any'], ages: ['young', 'middle'], interests: ['reading'], occasions: ['birthday'] },
            { id: 'gf_043', name: '村上春树作品集', category: '阅读', price: 298, brand: '南海出版公司', image: '', description: '包含《挪威的森林》《海边的卡夫卡》等经典作品。', relationships: ['friend', 'lover'], genders: ['any'], ages: ['young', 'middle'], interests: ['reading'], occasions: ['birthday'] },
            { id: 'gf_044', name: '《人类简史》精装版', category: '阅读', price: 68, brand: '中信出版社', image: '', description: '尤瓦尔·赫拉利畅销作品，重新认识人类发展历程。', relationships: ['friend', 'lover', 'colleague'], genders: ['any'], ages: ['young', 'middle'], interests: ['reading'], occasions: ['birthday'] },
            { id: 'gf_045', name: '《小王子》珍藏本', category: '阅读', price: 45, brand: '人民文学出版社', image: '', description: '经典童话，献给曾经是孩子的大人，温暖治愈。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['reading'], occasions: ['birthday', 'valentine'] },
            { id: 'gf_046', name: 'Kindle电子书礼品卡', category: '阅读', price: 100, brand: 'Amazon', image: '', description: '可购买Kindle商店任意电子书，灵活实用。', relationships: ['friend', 'lover'], genders: ['any'], ages: ['young', 'middle'], interests: ['reading', 'tech'], occasions: ['birthday'] },
            { id: 'gf_047', name: '豆瓣阅读年卡', category: '阅读', price: 148, brand: '豆瓣', image: '', description: '畅读豆瓣阅读万本好书，手机电脑同步阅读。', relationships: ['friend', 'lover'], genders: ['any'], ages: ['young', 'middle'], interests: ['reading', 'tech'], occasions: ['birthday'] },
            { id: 'gf_048', name: '西西弗书店储值卡', category: '阅读', price: 500, brand: '西西弗', image: '', description: '实体书店购书卡，支持咖啡消费，文艺青年最爱。', relationships: ['friend', 'lover'], genders: ['any'], ages: ['young', 'middle'], interests: ['reading'], occasions: ['birthday', 'newyear'] },
            { id: 'gf_049', name: '《明朝那些事儿》', category: '阅读', price: 199, brand: '浙江人民出版社', image: '', description: '当年明月经典作品，通俗讲史，历史入门必读。', relationships: ['friend', 'colleague'], genders: ['any'], ages: ['young', 'middle'], interests: ['reading'], occasions: ['birthday'] },
            { id: 'gf_050', name: '《活着》精装版', category: '阅读', price: 39, brand: '作家出版社', image: '', description: '余华代表作，讲述生命的意义，感人至深。', relationships: ['friend', 'lover'], genders: ['any'], ages: ['young', 'middle'], interests: ['reading'], occasions: ['birthday'] },
            { id: 'gf_051', name: '费列罗巧克力礼盒', category: '美食', price: 128, brand: 'Ferrero', image: '', description: '金莎巧克力，经典口味，精美礼盒，送礼体面。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['food'], occasions: ['birthday', 'valentine', 'newyear'] },
            { id: 'gf_052', name: 'Godiva巧克力礼盒', category: '美食', price: 298, brand: 'Godiva', image: '', description: '比利时皇室御用巧克力，口感丝滑，高端礼盒。', relationships: ['lover'], genders: ['any'], ages: ['young', 'middle'], interests: ['food'], occasions: ['birthday', 'valentine', 'anniversary'] },
            { id: 'gf_053', name: '瑞士莲巧克力礼盒', category: '美食', price: 188, brand: 'Lindt', image: '', description: '瑞士经典巧克力，软心系列，入口即化。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['food'], occasions: ['birthday', 'newyear'] },
            { id: 'gf_054', name: '三只松鼠坚果礼盒', category: '美食', price: 158, brand: '三只松鼠', image: '', description: '精选坚果组合，健康美味，适合全家分享。', relationships: ['friend', 'parent'], genders: ['any'], ages: ['young', 'middle', 'elder'], interests: ['food'], occasions: ['newyear', 'birthday'] },
            { id: 'gf_055', name: '良品铺子零食大礼包', category: '美食', price: 128, brand: '良品铺子', image: '', description: '多种美味零食组合，追剧必备，性价比高。', relationships: ['friend', 'lover'], genders: ['any'], ages: ['young'], interests: ['food'], occasions: ['birthday'] },
            { id: 'gf_056', name: '曲奇饼干礼盒', category: '美食', price: 88, brand: '丹麦蓝罐', image: '', description: '经典丹麦曲奇，香酥脆口，适合下午茶。', relationships: ['parent', 'elder', 'friend'], genders: ['any'], ages: ['middle', 'elder'], interests: ['food'], occasions: ['newyear', 'mothersday'] },
            { id: 'gf_057', name: '星巴克星享卡', category: '美食', price: 108, brand: 'Starbucks', image: '', description: '星巴克会员储值卡，全国通用，咖啡爱好者首选。', relationships: ['lover', 'friend', 'colleague'], genders: ['any'], ages: ['young', 'middle'], interests: ['food'], occasions: ['birthday'] },
            { id: 'gf_058', name: '喜茶礼品卡', category: '美食', price: 100, brand: '喜茶', image: '', description: '喜茶储值卡，年轻人的最爱，送闺蜜送朋友。', relationships: ['friend', 'lover'], genders: ['any'], ages: ['young'], interests: ['food'], occasions: ['birthday'] },
            { id: 'gf_059', name: '月饼礼盒（中秋限定）', category: '美食', price: 258, brand: '美心', image: '', description: '香港美心流心奶黄月饼，中秋送礼佳品。', relationships: ['parent', 'elder', 'colleague'], genders: ['any'], ages: ['middle', 'elder'], interests: ['food'], occasions: ['newyear', 'birthday'] },
            { id: 'gf_060', name: '进口红酒礼盒', category: '美食', price: 398, brand: '奔富', image: '', description: '澳洲奔富红酒，品质保证，商务宴请必备。', relationships: ['colleague', 'elder'], genders: ['male'], ages: ['middle'], interests: ['food'], occasions: ['newyear', 'birthday'] },
            { id: 'gf_061', name: '乐高城市系列', category: '玩具', price: 399, brand: 'LEGO', image: '', description: '经典积木玩具，培养创造力，适合各年龄段。', relationships: ['child', 'junior'], genders: ['any'], ages: ['child', 'teen'], interests: [], occasions: ['birthday', 'newyear', 'christmas'] },
            { id: 'gf_062', name: '乐高哈利波特', category: '玩具', price: 599, brand: 'LEGO', image: '', description: '霍格沃茨城堡、对角巷等经典场景，魔法迷收藏必备。', relationships: ['child', 'friend'], genders: ['any'], ages: ['teen', 'young'], interests: [], occasions: ['birthday'] },
            { id: 'gf_063', name: '泡泡玛特盲盒套装', category: '玩具', price: 399, brand: 'POP MART', image: '', description: '潮流玩具，惊喜拆盒，年轻人的收藏新宠。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['teen', 'young'], interests: [], occasions: ['birthday', 'valentine'] },
            { id: 'gf_064', name: 'Line Friends公仔', category: '玩具', price: 299, brand: 'Line Friends', image: '', description: '布朗熊、可妮兔等经典角色，可爱治愈，适合女生。', relationships: ['lover', 'friend'], genders: ['female'], ages: ['young'], interests: [], occasions: ['birthday', 'valentine'] },
            { id: 'gf_065', name: '迪士尼毛绒公仔', category: '玩具', price: 199, brand: 'Disney', image: '', description: '米奇、米妮、草莓熊等，可爱陪伴，童心未泯。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['child', 'teen', 'young'], interests: [], occasions: ['birthday', 'christmas'] },
            { id: 'gf_066', name: '高达模型', category: '玩具', price: 299, brand: 'Bandai', image: '', description: '机动战士高达拼装模型，动手乐趣满满，男生最爱。', relationships: ['lover', 'friend'], genders: ['male'], ages: ['teen', 'young'], interests: ['tech'], occasions: ['birthday'] },
            { id: 'gf_067', name: '变形金刚模型', category: '玩具', price: 399, brand: 'Hasbro', image: '', description: '经典变形金刚，汽车人变形，男孩童年回忆。', relationships: ['lover', 'friend'], genders: ['male'], ages: ['teen', 'young'], interests: ['tech'], occasions: ['birthday'] },
            { id: 'gf_068', name: '遥控无人机', category: '玩具', price: 899, brand: 'DJI', image: '', description: '入门级航拍无人机，拍摄美好瞬间，适合摄影爱好者。', relationships: ['lover', 'friend'], genders: ['male'], ages: ['young', 'middle'], interests: ['tech', 'travel'], occasions: ['birthday'] },
            { id: 'gf_069', name: '智能机器人', category: '玩具', price: 1999, brand: '优必选', image: '', description: '可编程机器人，学习编程，培养逻辑思维。', relationships: ['child'], genders: ['any'], ages: ['child', 'teen'], interests: ['tech'], occasions: ['birthday', 'newyear'] },
            { id: 'gf_070', name: '任天堂健身环', category: '玩具', price: 499, brand: 'Nintendo', image: '', description: '体感健身游戏，边玩边运动，适合全家同乐。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['sports', 'tech'], occasions: ['birthday'] },
            { id: 'gf_071', name: '祖玛珑香薰礼盒', category: '家居', price: 680, brand: 'Jo Malone', image: '', description: '英国梨与小苍兰等经典香调，营造温馨家居氛围。', relationships: ['lover', 'friend', 'parent'], genders: ['female'], ages: ['young', 'middle'], interests: ['home'], occasions: ['birthday', 'anniversary', 'newyear'] },
            { id: 'gf_072', name: 'Diptyque香薰蜡烛', category: '家居', price: 450, brand: 'Diptyque', image: '', description: '法国经典香氛品牌，浆果、玫瑰等热门香型。', relationships: ['lover', 'friend'], genders: ['female'], ages: ['young', 'middle'], interests: ['home'], occasions: ['birthday', 'valentine'] },
            { id: 'gf_073', name: '野兽派香薰礼盒', category: '家居', price: 520, brand: 'THE BEAST', image: '', description: '国内高端香氛品牌，精美包装，适合送礼。', relationships: ['lover'], genders: ['female'], ages: ['young', 'middle'], interests: ['home'], occasions: ['birthday', 'valentine', 'anniversary'] },
            { id: 'gf_074', name: '无印良品超声波香薰机', category: '家居', price: 499, brand: 'MUJI', image: '', description: '简约设计，加湿+香薰二合一，改善室内环境。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['home'], occasions: ['birthday'] },
            { id: 'gf_075', name: '北欧风格台灯', category: '家居', price: 299, brand: 'IKEA', image: '', description: '简约北欧设计，护眼照明，适合床头、书桌。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['home', 'office'], occasions: ['birthday'] },
            { id: 'gf_076', name: '马歇尔蓝牙音箱', category: '家居', price: 1899, brand: 'Marshall', image: '', description: '复古摇滚风格，音质出色，家居装饰+音乐享受。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['home', 'music'], occasions: ['birthday', 'anniversary'] },
            { id: 'gf_077', name: '极米投影仪', category: '家居', price: 2999, brand: 'XGIMI', image: '', description: '家用投影仪，巨幕观影，打造家庭影院。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['home', 'tech'], occasions: ['birthday', 'anniversary', 'newyear'] },
            { id: 'gf_078', name: '小米空气净化器', category: '家居', price: 899, brand: 'Xiaomi', image: '', description: '高性价比，高效除醛除霾，守护家人健康。', relationships: ['lover', 'parent'], genders: ['any'], ages: ['middle'], interests: ['home', 'health'], occasions: ['newyear', 'birthday'] },
            { id: 'gf_079', name: '戴森空气净化风扇', category: '家居', price: 4990, brand: 'Dyson', image: '', description: '净化+凉风二合一，无叶设计安全美观。', relationships: ['lover', 'parent'], genders: ['any'], ages: ['middle'], interests: ['home', 'health', 'tech'], occasions: ['birthday', 'newyear'] },
            { id: 'gf_080', name: '扫地机器人', category: '家居', price: 2999, brand: '科沃斯', image: '', description: '智能扫拖一体，解放双手，让家务更轻松。', relationships: ['lover', 'parent'], genders: ['any'], ages: ['young', 'middle'], interests: ['home', 'tech'], occasions: ['birthday', 'anniversary', 'newyear'] },
            { id: 'gf_081', name: 'Nike Air Max运动鞋', category: '运动', price: 899, brand: 'Nike', image: '', description: '经典气垫运动鞋，舒适潮流，日常穿搭必备。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['sports'], occasions: ['birthday', 'anniversary'] },
            { id: 'gf_082', name: 'Adidas Ultraboost', category: '运动', price: 1099, brand: 'Adidas', image: '', description: '专业跑步鞋，Boost中底科技，缓震出色。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['sports'], occasions: ['birthday'] },
            { id: 'gf_083', name: 'New Balance复古跑鞋', category: '运动', price: 799, brand: 'New Balance', image: '', description: '复古休闲风格，舒适耐穿，日常搭配首选。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['sports'], occasions: ['birthday'] },
            { id: 'gf_084', name: 'Lululemon瑜伽垫', category: '运动', price: 580, brand: 'Lululemon', image: '', description: '高端瑜伽品牌，专业防滑，瑜伽爱好者必备。', relationships: ['lover', 'friend'], genders: ['female'], ages: ['young', 'middle'], interests: ['sports'], occasions: ['birthday', 'valentine'] },
            { id: 'gf_085', name: 'Keep会员年卡', category: '运动', price: 248, brand: 'Keep', image: '', description: '健身教学+社区互动，在家也能专业健身。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['sports', 'tech'], occasions: ['birthday'] },
            { id: 'gf_086', name: 'Wilson网球拍', category: '运动', price: 1299, brand: 'Wilson', image: '', description: '专业网球品牌，费德勒同款，网球爱好者首选。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['sports'], occasions: ['birthday'] },
            { id: 'gf_087', name: 'Yonex羽毛球拍', category: '运动', price: 899, brand: 'Yonex', image: '', description: '日本专业品牌，轻巧耐用，适合业余和专业选手。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['sports'], occasions: ['birthday'] },
            { id: 'gf_088', name: '迪卡侬健身套装', category: '运动', price: 399, brand: 'Decathlon', image: '', description: '高性价比，包含健身垫、哑铃、弹力带等。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['sports'], occasions: ['birthday'] },
            { id: 'gf_089', name: 'Apple Watch Ultra', category: '运动', price: 6499, brand: 'Apple', image: '', description: '户外运动版，钛合金表壳，精准定位，极限运动首选。', relationships: ['lover'], genders: ['any'], ages: ['young', 'middle'], interests: ['sports', 'tech'], occasions: ['birthday', 'anniversary'] },
            { id: 'gf_090', name: 'Garmin运动手表', category: '运动', price: 3280, brand: 'Garmin', image: '', description: '专业运动手表，多运动模式，精准数据监测。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['sports', 'tech'], occasions: ['birthday'] },
            { id: 'gf_091', name: 'UGG经典雪地靴', category: '服饰', price: 1580, brand: 'UGG', image: '', description: '澳洲品牌，羊毛材质，温暖舒适，冬季必备。', relationships: ['lover', 'friend'], genders: ['female'], ages: ['young', 'middle'], interests: [], occasions: ['birthday', 'newyear'] },
            { id: 'gf_092', name: 'Coach经典围巾', category: '服饰', price: 890, brand: 'Coach', image: '', description: '轻奢品牌，经典图案，温暖百搭，秋冬必备。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: [], occasions: ['birthday', 'newyear', 'mothersday'] },
            { id: 'gf_093', name: 'Gucci丝巾', category: '服饰', price: 2980, brand: 'Gucci', image: '', description: '经典老花图案，多种系法，轻奢之选。', relationships: ['lover'], genders: ['female'], ages: ['young', 'middle'], interests: [], occasions: ['birthday', 'anniversary', 'mothersday'] },
            { id: 'gf_094', name: 'Levis经典牛仔裤', category: '服饰', price: 799, brand: 'Levis', image: '', description: '经典牛仔品牌，版型百搭，耐穿舒适。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: [], occasions: ['birthday'] },
            { id: 'gf_095', name: '优衣库Heattech保暖内衣', category: '服饰', price: 199, brand: 'UNIQLO', image: '', description: '黑科技保暖内衣，轻薄保暖，冬季居家必备。', relationships: ['lover', 'parent'], genders: ['any'], ages: ['young', 'middle'], interests: [], occasions: ['birthday', 'newyear'] },
            { id: 'gf_096', name: 'Tiffany经典银饰', category: '首饰', price: 1899, brand: 'Tiffany', image: '', description: '经典蓝色礼盒，简约设计，永恒经典，表白神器。', relationships: ['lover'], genders: ['female'], ages: ['young', 'middle'], interests: [], occasions: ['birthday', 'valentine', 'anniversary'] },
            { id: 'gf_097', name: '施华洛世奇水晶项链', category: '首饰', price: 899, brand: 'Swarovski', image: '', description: '闪耀水晶设计，精致优雅，适合日常佩戴。', relationships: ['lover', 'friend'], genders: ['female'], ages: ['young', 'middle'], interests: [], occasions: ['birthday', 'valentine'] },
            { id: 'gf_098', name: '潘多拉手链', category: '首饰', price: 699, brand: 'Pandora', image: '', description: '可自由搭配串饰，记录美好瞬间，送礼有心意。', relationships: ['lover', 'friend'], genders: ['female'], ages: ['young'], interests: [], occasions: ['birthday', 'valentine'] },
            { id: 'gf_099', name: 'DW经典手表', category: '首饰', price: 1299, brand: 'Daniel Wellington', image: '', description: '北欧简约设计，百搭时尚，情侣表首选。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: [], occasions: ['birthday', 'anniversary'] },
            { id: 'gf_100', name: '卡西欧G-Shock', category: '首饰', price: 899, brand: 'Casio', image: '', description: '运动风格手表，耐用防摔，适合男生和运动爱好者。', relationships: ['lover', 'friend'], genders: ['male'], ages: ['teen', 'young'], interests: ['sports', 'tech'], occasions: ['birthday'] },
            { id: 'gf_101', name: 'SKG颈椎按摩仪', category: '健康', price: 499, brand: 'SKG', image: '', description: 'EMS脉冲按摩，多模式可选，缓解颈椎疲劳。', relationships: ['lover', 'parent', 'colleague'], genders: ['any'], ages: ['young', 'middle'], interests: ['health', 'tech'], occasions: ['birthday', 'anniversary', 'fathersday', 'mothersday'] },
            { id: 'gf_102', name: '倍轻松眼部按摩仪', category: '健康', price: 599, brand: 'Breo', image: '', description: '热敷+按摩，缓解眼疲劳，适合办公族和学生党。', relationships: ['lover', 'friend', 'colleague'], genders: ['any'], ages: ['young', 'middle'], interests: ['health', 'tech'], occasions: ['birthday'] },
            { id: 'gf_103', name: '飞利浦眼部按摩仪', category: '健康', price: 899, brand: 'Philips', image: '', description: '冷热敷交替，智能放松，高端护眼之选。', relationships: ['lover', 'parent'], genders: ['any'], ages: ['young', 'middle'], interests: ['health', 'tech'], occasions: ['birthday', 'anniversary'] },
            { id: 'gf_104', name: '欧姆龙血压计', category: '健康', price: 399, brand: 'Omron', image: '', description: '日本品牌，精准测量，守护家人健康。', relationships: ['parent', 'elder'], genders: ['any'], ages: ['middle', 'elder'], interests: ['health'], occasions: ['birthday', 'newyear', 'mothersday', 'fathersday'] },
            { id: 'gf_105', name: '华为体脂秤', category: '健康', price: 199, brand: 'Huawei', image: '', description: '精准测量体脂，连接APP记录，健康管理好帮手。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['health', 'sports', 'tech'], occasions: ['birthday'] },
            { id: 'gf_106', name: '雅马哈FG800吉他', category: '乐器', price: 1999, brand: 'Yamaha', image: '', description: '入门级民谣吉他，音质稳定，性价比高。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['teen', 'young'], interests: ['music'], occasions: ['birthday'] },
            { id: 'gf_107', name: '卡西欧电子琴', category: '乐器', price: 1299, brand: 'Casio', image: '', description: '入门级电子琴，多种音色，适合初学和儿童。', relationships: ['child', 'friend'], genders: ['any'], ages: ['child', 'teen'], interests: ['music'], occasions: ['birthday', 'newyear'] },
            { id: 'gf_108', name: '罗兰电鼓', category: '乐器', price: 4999, brand: 'Roland', image: '', description: '电子架子鼓，静音设计，在家练习不扰民。', relationships: ['lover', 'friend'], genders: ['male'], ages: ['teen', 'young'], interests: ['music'], occasions: ['birthday'] },
            { id: 'gf_109', name: 'Ukulele尤克里里', category: '乐器', price: 399, brand: 'Uma', image: '', description: '小巧易上手，适合新手，入门最佳选择。', relationships: ['friend', 'child'], genders: ['any'], ages: ['child', 'teen', 'young'], interests: ['music'], occasions: ['birthday'] },
            { id: 'gf_110', name: '口琴套装', category: '乐器', price: 299, brand: 'Hohner', image: '', description: '德国品牌，品质保证，便携易带，音乐爱好者入门。', relationships: ['friend', 'lover'], genders: ['any'], ages: ['young', 'middle'], interests: ['music'], occasions: ['birthday'] },
            { id: 'gf_111', name: 'North Face冲锋衣', category: '户外', price: 1299, brand: 'The North Face', image: '', description: '专业户外品牌，防风防水，登山徒步必备。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['outdoor', 'sports'], occasions: ['birthday'] },
            { id: 'gf_112', name: '哥伦比亚登山鞋', category: '户外', price: 899, brand: 'Columbia', image: '', description: '防水耐磨，抓地力强，专业户外鞋。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['outdoor', 'sports'], occasions: ['birthday'] },
            { id: 'gf_113', name: '始祖鸟背包', category: '户外', price: 1899, brand: 'Arc\'teryx', image: '', description: '加拿大顶级户外品牌，背负系统出色，品质卓越。', relationships: ['lover'], genders: ['any'], ages: ['young', 'middle'], interests: ['outdoor', 'sports'], occasions: ['birthday', 'anniversary'] },
            { id: 'gf_114', name: '牧高笛帐篷', category: '户外', price: 1299, brand: '牧高笛', image: '', description: '性价比之王，易搭建，防水耐用，适合入门露营。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['outdoor', 'sports'], occasions: ['birthday'] },
            { id: 'gf_115', name: 'Black Diamond登山杖', category: '户外', price: 899, brand: 'Black Diamond', image: '', description: '专业登山杖品牌，轻量化设计，保护膝盖。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: ['outdoor', 'sports'], occasions: ['birthday'] },
            { id: 'gf_116', name: 'roseonly永生花', category: '浪漫', price: 1314, brand: 'roseonly', image: '', description: '厄瓜多尔进口玫瑰，永生工艺，一生只送一人。', relationships: ['lover'], genders: ['female'], ages: ['young', 'middle'], interests: ['home'], occasions: ['valentine', 'anniversary', 'birthday'] },
            { id: 'gf_117', name: 'DR钻戒（入门款）', category: '浪漫', price: 5999, brand: 'DR', image: '', description: '男士一生仅能定制一枚，求婚表白终极浪漫。', relationships: ['lover'], genders: ['female'], ages: ['young', 'middle'], interests: [], occasions: ['anniversary', 'birthday', 'valentine'] },
            { id: 'gf_118', name: '定制情侣对戒', category: '浪漫', price: 2999, brand: '周大福', image: '', description: '可刻字定制，专属你们的爱情信物。', relationships: ['lover'], genders: ['any'], ages: ['young', 'middle'], interests: [], occasions: ['anniversary', 'birthday', 'valentine'] },
            { id: 'gf_119', name: '浪漫星空投影仪', category: '浪漫', price: 299, brand: '世嘉', image: '', description: '在家也能看星空，营造浪漫氛围，约会神器。', relationships: ['lover'], genders: ['any'], ages: ['young'], interests: ['home'], occasions: ['birthday', 'valentine', 'anniversary'] },
            { id: 'gf_120', name: '私人定制相册', category: '浪漫', price: 199, brand: '', image: '', description: '打印美好回忆，亲手制作，心意满满。', relationships: ['lover', 'friend'], genders: ['any'], ages: ['young', 'middle'], interests: [], occasions: ['birthday', 'anniversary', 'valentine'] }
        ];
    },

    getAllGifts() {
        const builtIn = this.builtInGifts;
        const custom = Storage.getCustomGifts();
        return [...builtIn, ...custom];
    },

    getGiftById(id) {
        const allGifts = this.getAllGifts();
        return allGifts.find(g => g.id === id);
    },

    getGiftsByIds(ids) {
        const allGifts = this.getAllGifts();
        return ids.map(id => allGifts.find(g => g.id === id)).filter(Boolean);
    },

    getBuiltInGifts() {
        return [...this.builtInGifts];
    },

    getCustomGifts() {
        return Storage.getCustomGifts();
    },

    getCategories() {
        const allGifts = this.getAllGifts();
        const categories = new Set(allGifts.map(g => g.category));
        return Array.from(categories).sort();
    },

    getPriceRanges() {
        return [
            { label: '全部价格', value: 'all' },
            { label: '100元以下', value: 'under100', min: 0, max: 100 },
            { label: '100-300元', value: '100-300', min: 100, max: 300 },
            { label: '300-500元', value: '300-500', min: 300, max: 500 },
            { label: '500-1000元', value: '500-1000', min: 500, max: 1000 },
            { label: '1000元以上', value: 'over1000', min: 1000, max: Infinity }
        ];
    },

    getStats() {
        const builtIn = this.builtInGifts.length;
        const custom = Storage.getCustomGifts().length;
        const favorites = Storage.getFavorites().length;
        const categories = this.getCategories().length;

        return { builtIn, custom, favorites, categories, total: builtIn + custom };
    },

    validateGift(gift) {
        const errors = [];
        if (!gift.name || gift.name.trim() === '') {
            errors.push('礼物名称不能为空');
        }
        if (!gift.price || gift.price <= 0) {
            errors.push('价格必须大于0');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

window.GiftData = GiftData;
