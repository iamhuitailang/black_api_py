const APP_STATE = {
    temperature: 20,
    weather: 'sunny',
    style: 'female',
    seed: 0
};

const WEATHER_NAMES = {
    sunny: '晴天',
    cloudy: '多云',
    rainy: '雨天',
    snowy: '雪天',
    windy: '大风'
};

const STYLE_NAMES = {
    female: '女性',
    male: '男性',
    child: '儿童'
};

const TEMPERATURE_RANGES = [
    {
        min: -Infinity,
        max: -10,
        tag: '极寒',
        message: '今天超级冷！一定要穿得厚厚的哦，注意保暖！',
        outfits: {
            female: {
                tops: ['长款羽绒服', '加厚羽绒服', '羽绒内胆'],
                baseLayers: ['保暖内衣套装', '加绒秋衣秋裤', '发热内衣'],
                midLayers: ['高领厚毛衣', '羊毛衫', '羊绒衫'],
                bottoms: ['加绒加厚打底裤', '羽绒裤', '厚毛裤'],
                shoes: ['雪地靴', '加绒短靴', '厚棉靴'],
                accessories: ['围巾+帽子+手套', '厚围巾+护耳帽', '羽绒手套+围脖']
            },
            male: {
                tops: ['长款羽绒服', '加厚冲锋衣', '羽绒大衣'],
                baseLayers: ['保暖内衣套装', '加绒秋衣秋裤'],
                midLayers: ['厚羊毛衫', '高领毛衣', '抓绒衣'],
                bottoms: ['加绒休闲裤', '羽绒裤', '厚毛裤'],
                shoes: ['雪地靴', '加绒工装靴', '厚棉鞋'],
                accessories: ['围巾+帽子+手套', '厚围巾+针织帽']
            },
            child: {
                tops: ['卡通羽绒服', '加厚棉服', '羽绒连体衣'],
                baseLayers: ['加绒秋衣秋裤', '保暖内衣套装'],
                midLayers: ['厚毛衣', '抓绒卫衣', '羊毛衫'],
                bottoms: ['加绒棉裤', '羽绒裤', '厚打底裤'],
                shoes: ['卡通雪地靴', '加绒棉鞋', '厚靴子'],
                accessories: ['卡通围巾+帽子+手套', '护耳帽+围脖']
            }
        },
        canvasColors: {
            outer: '#4A90D9',
            inner: '#E8F4F8',
            bottom: '#5B7BA8',
            shoes: '#8B6F6D'
        }
    },
    {
        min: -9,
        max: 0,
        tag: '寒冷',
        message: '今天有点冷哦，记得穿上厚外套，别着凉啦！',
        outfits: {
            female: {
                tops: ['中长款羽绒服', '厚棉服', '毛呢大衣'],
                baseLayers: ['保暖内衣', '加绒秋衣'],
                midLayers: ['厚毛衣', '针织衫', '羊绒衫'],
                bottoms: ['加绒打底裤', '厚毛裤', '加绒牛仔裤'],
                shoes: ['加绒短靴', '厚皮靴', '雪地靴'],
                accessories: ['围巾+帽子', '厚围巾', '针织帽']
            },
            male: {
                tops: ['羽绒服', '厚棉服', '呢子大衣'],
                baseLayers: ['保暖内衣', '秋衣秋裤'],
                midLayers: ['羊毛衫', '厚毛衣', '抓绒'],
                bottoms: ['加绒休闲裤', '厚牛仔裤', '毛裤'],
                shoes: ['加绒皮鞋', '工装靴', '短靴'],
                accessories: ['围巾+帽子', '厚围巾']
            },
            child: {
                tops: ['羽绒服', '厚棉服', '卡通大衣'],
                baseLayers: ['加绒秋衣秋裤', '保暖内衣'],
                midLayers: ['厚毛衣', '卫衣'],
                bottoms: ['加绒棉裤', '厚打底裤', '加绒牛仔裤'],
                shoes: ['加绒棉鞋', '卡通短靴'],
                accessories: ['卡通围巾+帽子', '护耳帽']
            }
        },
        canvasColors: {
            outer: '#6BA3D9',
            inner: '#E0F0F8',
            bottom: '#6A8FB0',
            shoes: '#9B7F7D'
        }
    },
    {
        min: 1,
        max: 5,
        tag: '冷',
        message: '今天有点冷，记得穿上外套，围巾也可以安排上哦！',
        outfits: {
            female: {
                tops: ['棉服', '呢子大衣', '派克服'],
                baseLayers: ['秋衣', '薄保暖内衣'],
                midLayers: ['卫衣', '薄毛衣', '针织衫'],
                bottoms: ['厚长裤', '加绒牛仔裤', '毛呢裙'],
                shoes: ['短靴', '加绒皮鞋', '马丁靴'],
                accessories: ['围巾', '薄围巾', '针织帽']
            },
            male: {
                tops: ['棉服', '夹克大衣', '厚风衣'],
                baseLayers: ['秋衣', '长袖T恤'],
                midLayers: ['卫衣', '薄毛衣', '针织衫'],
                bottoms: ['厚休闲裤', '牛仔裤', '西裤'],
                shoes: ['短靴', '休闲皮鞋', '马丁靴'],
                accessories: ['围巾', '薄围巾']
            },
            child: {
                tops: ['棉服', '厚外套', '卡通大衣'],
                baseLayers: ['秋衣秋裤', '长袖T恤'],
                midLayers: ['卫衣', '薄毛衣'],
                bottoms: ['厚长裤', '加绒牛仔裤'],
                shoes: ['短靴', '加绒运动鞋'],
                accessories: ['围巾', '卡通围巾']
            }
        },
        canvasColors: {
            outer: '#8BB8D9',
            inner: '#D8ECF8',
            bottom: '#7A9FB8',
            shoes: '#AB8F8D'
        }
    },
    {
        min: 6,
        max: 10,
        tag: '偏冷',
        message: '今天天气偏凉，穿上风衣或外套就刚刚好哦！',
        outfits: {
            female: {
                tops: ['风衣', '薄外套', '牛仔外套'],
                baseLayers: ['长袖T恤', '衬衫'],
                midLayers: ['针织衫', '薄毛衣'],
                bottoms: ['长裤', '牛仔裤', '连衣裙'],
                shoes: ['运动鞋', '小白鞋', '休闲鞋'],
                accessories: ['薄围巾', '丝巾', '无']
            },
            male: {
                tops: ['风衣', '夹克', '薄外套'],
                baseLayers: ['长袖T恤', '衬衫'],
                midLayers: ['薄针织衫', '卫衣'],
                bottoms: ['休闲裤', '牛仔裤', '西裤'],
                shoes: ['运动鞋', '休闲皮鞋', '板鞋'],
                accessories: ['薄围巾', '无']
            },
            child: {
                tops: ['薄外套', '风衣', '牛仔外套'],
                baseLayers: ['长袖T恤', '衬衫'],
                midLayers: ['针织衫', '卫衣'],
                bottoms: ['长裤', '牛仔裤'],
                shoes: ['运动鞋', '休闲鞋'],
                accessories: ['薄围巾', '无']
            }
        },
        canvasColors: {
            outer: '#A8C8D9',
            inner: '#D0E8F8',
            bottom: '#8AAFBE',
            shoes: '#BB9F9D'
        }
    },
    {
        min: 11,
        max: 15,
        tag: '微凉',
        message: '今天天气微凉，穿件开衫或薄外套就很舒服啦！',
        outfits: {
            female: {
                tops: ['针织开衫', '薄外套', '牛仔外套'],
                baseLayers: ['长袖T恤', '衬衫', '打底衫'],
                midLayers: [],
                bottoms: ['牛仔裤', '休闲裤', '半身裙'],
                shoes: ['休闲鞋', '帆布鞋', '小白鞋'],
                accessories: ['薄帽', '丝巾', '无']
            },
            male: {
                tops: ['薄外套', '针织开衫', '牛仔外套'],
                baseLayers: ['长袖T恤', '衬衫', 'POLO衫'],
                midLayers: [],
                bottoms: ['牛仔裤', '休闲裤', '西裤'],
                shoes: ['休闲鞋', '板鞋', '帆布鞋'],
                accessories: ['薄帽', '无']
            },
            child: {
                tops: ['薄外套', '针织开衫', '卫衣'],
                baseLayers: ['长袖T恤', '衬衫'],
                midLayers: [],
                bottoms: ['牛仔裤', '休闲裤'],
                shoes: ['运动鞋', '帆布鞋'],
                accessories: ['卡通帽子', '无']
            }
        },
        canvasColors: {
            outer: '#C0D8D9',
            inner: '#C8E4F8',
            bottom: '#9ABFC8',
            shoes: '#CBAFAD'
        }
    },
    {
        min: 16,
        max: 20,
        tag: '舒适',
        message: '今天天气舒适，适合轻装上阵，心情也会美美哒！',
        outfits: {
            female: {
                tops: ['薄外套', '卫衣', '牛仔外套'],
                baseLayers: ['T恤', '衬衫', '针织衫'],
                midLayers: [],
                bottoms: ['长裤', '牛仔裤', '长裙'],
                shoes: ['帆布鞋', '小白鞋', '单鞋'],
                accessories: ['无', '棒球帽', '丝巾']
            },
            male: {
                tops: ['薄外套', '卫衣', '夹克'],
                baseLayers: ['T恤', '衬衫', 'POLO衫'],
                midLayers: [],
                bottoms: ['长裤', '牛仔裤', '休闲裤'],
                shoes: ['板鞋', '帆布鞋', '休闲鞋'],
                accessories: ['无', '棒球帽']
            },
            child: {
                tops: ['薄外套', '卫衣', '针织开衫'],
                baseLayers: ['T恤', '衬衫'],
                midLayers: [],
                bottoms: ['长裤', '牛仔裤'],
                shoes: ['运动鞋', '帆布鞋'],
                accessories: ['无', '卡通帽子']
            }
        },
        canvasColors: {
            outer: '#D0E8D9',
            inner: '#C0E0F8',
            bottom: '#A8CFC8',
            shoes: '#DBBFBD'
        }
    },
    {
        min: 21,
        max: 25,
        tag: '温暖',
        message: '今天温暖宜人，穿得清爽一些就很舒服啦！',
        outfits: {
            female: {
                tops: ['长袖T恤', '薄针织衫', '衬衫'],
                baseLayers: [],
                midLayers: [],
                bottoms: ['薄长裤', '长裙', '短裙'],
                shoes: ['单鞋', '帆布鞋', '小白鞋'],
                accessories: ['无', '发饰', '手链']
            },
            male: {
                tops: ['长袖T恤', '衬衫', 'POLO衫'],
                baseLayers: [],
                midLayers: [],
                bottoms: ['薄长裤', '休闲裤', '牛仔裤'],
                shoes: ['板鞋', '帆布鞋', '休闲鞋'],
                accessories: ['无', '手表']
            },
            child: {
                tops: ['长袖T恤', '薄卫衣', '衬衫'],
                baseLayers: [],
                midLayers: [],
                bottoms: ['长裤', '中裤'],
                shoes: ['运动鞋', '帆布鞋'],
                accessories: ['无', '卡通发饰']
            }
        },
        canvasColors: {
            outer: '#E0F0D9',
            inner: '#B8DCF8',
            bottom: '#B8D8C8',
            shoes: '#EBCECD'
        }
    },
    {
        min: 26,
        max: 30,
        tag: '热',
        message: '今天有点热，穿得凉快一些，注意防晒哦！',
        outfits: {
            female: {
                tops: ['短袖T恤', '衬衫', '雪纺衫'],
                baseLayers: [],
                midLayers: [],
                bottoms: ['短裤', '短裙', '七分裤'],
                shoes: ['凉鞋', '帆布鞋', '拖鞋'],
                accessories: ['帽子', '墨镜', '遮阳伞']
            },
            male: {
                tops: ['短袖T恤', '短袖衬衫', 'POLO衫'],
                baseLayers: [],
                midLayers: [],
                bottoms: ['短裤', '七分裤', '薄长裤'],
                shoes: ['凉鞋', '板鞋', '帆布鞋'],
                accessories: ['帽子', '墨镜']
            },
            child: {
                tops: ['短袖T恤', '卡通短袖', '无袖T恤'],
                baseLayers: [],
                midLayers: [],
                bottoms: ['短裤', '中裤'],
                shoes: ['凉鞋', '洞洞鞋', '帆布鞋'],
                accessories: ['卡通帽子', '太阳镜']
            }
        },
        canvasColors: {
            outer: '#F0F8D9',
            inner: '#B0D8F8',
            bottom: '#C8E0C8',
            shoes: '#FBDEDD'
        }
    },
    {
        min: 31,
        max: 35,
        tag: '很热',
        message: '今天超级热！一定要穿得清凉，多喝水，注意防暑！',
        outfits: {
            female: {
                tops: ['背心', '吊带', '无袖T恤'],
                baseLayers: [],
                midLayers: [],
                bottoms: ['短裤', '短裙', '热裤'],
                shoes: ['凉拖', '凉鞋', '人字拖'],
                accessories: ['帽子+墨镜', '遮阳伞', '冰袖']
            },
            male: {
                tops: ['背心', '无袖T恤', '短袖T恤'],
                baseLayers: [],
                midLayers: [],
                bottoms: ['短裤', '运动短裤'],
                shoes: ['凉拖', '凉鞋', '人字拖'],
                accessories: ['帽子+墨镜', '冰袖']
            },
            child: {
                tops: ['背心', '无袖T恤', '卡通短袖'],
                baseLayers: [],
                midLayers: [],
                bottoms: ['短裤', '开裆裤'],
                shoes: ['凉拖', '洞洞鞋', '凉鞋'],
                accessories: ['卡通帽子+墨镜', '小风扇']
            }
        },
        canvasColors: {
            outer: '#FFF8D9',
            inner: '#A8D4F8',
            bottom: '#D8E8C8',
            shoes: '#FFE8E7'
        }
    },
    {
        min: 36,
        max: Infinity,
        tag: '极热',
        message: '今天太热了！一定要做好防晒，尽量待在凉爽的地方哦！',
        outfits: {
            female: {
                tops: ['防晒衣+背心', '薄外套+吊带', '透气T恤'],
                baseLayers: [],
                midLayers: [],
                bottoms: ['短裤', '短裙', '热裤'],
                shoes: ['凉拖', '凉鞋', '人字拖'],
                accessories: ['遮阳帽+冰袖', '墨镜+遮阳伞', '防晒口罩']
            },
            male: {
                tops: ['防晒衣+背心', '透气短袖', '速干T恤'],
                baseLayers: [],
                midLayers: [],
                bottoms: ['短裤', '速干短裤'],
                shoes: ['凉拖', '凉鞋', '人字拖'],
                accessories: ['遮阳帽+冰袖', '墨镜']
            },
            child: {
                tops: ['防晒衣+背心', '透气短袖', '卡通速干衣'],
                baseLayers: [],
                midLayers: [],
                bottoms: ['短裤', '速干短裤'],
                shoes: ['凉拖', '洞洞鞋'],
                accessories: ['卡通遮阳帽+冰袖', '小风扇+墨镜']
            }
        },
        canvasColors: {
            outer: '#FFF0D9',
            inner: '#A0D0F8',
            bottom: '#E8F0C8',
            shoes: '#FFEDE7'
        }
    }
];

const WEATHER_MODIFIERS = {
    rainy: {
        messageAdd: ' 今天下雨，记得带伞，穿防水鞋哦！',
        accessories: ['雨伞+', '雨衣+', '雨披+']
    },
    snowy: {
        messageAdd: ' 今天下雪，注意防滑，多穿点保暖！',
        accessories: ['防滑鞋套+', '围巾+帽子+', '手套+']
    },
    windy: {
        messageAdd: ' 今天风大，记得戴上帽子围巾，别被吹感冒啦！',
        accessories: ['帽子+', '围巾+', '防风外套+']
    },
    cloudy: {
        messageAdd: ' 今天多云，温度适中，穿搭可以随意一些~',
        accessories: []
    },
    sunny: {
        messageAdd: ' 今天阳光明媚，注意防晒哦！',
        accessories: ['墨镜+', '遮阳伞+', '防晒帽+']
    }
};

function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function pickRandom(array, seed) {
    if (!array || array.length === 0) return null;
    if (array.length === 1) return array[0];
    const index = Math.floor(seededRandom(seed) * array.length);
    return array[index];
}

function getTemperatureRange(temp) {
    return TEMPERATURE_RANGES.find(range => temp >= range.min && temp <= range.max);
}

function generateOutfit(temp, weather, style, seed) {
    const range = getTemperatureRange(temp);
    const outfitBase = range.outfits[style];
    const weatherModifier = WEATHER_MODIFIERS[weather];
    
    let currentSeed = seed;
    
    const topOptions = outfitBase.tops;
    let top = pickRandom(topOptions, currentSeed);
    currentSeed += 1;
    
    if (outfitBase.midLayers && outfitBase.midLayers.length > 0) {
        const midLayer = pickRandom(outfitBase.midLayers, currentSeed);
        currentSeed += 1;
        if (midLayer) {
            top = midLayer + ' + ' + top;
        }
    }
    
    if (outfitBase.baseLayers && outfitBase.baseLayers.length > 0 && temp < 10) {
        const baseLayer = pickRandom(outfitBase.baseLayers, currentSeed);
        currentSeed += 1;
        if (baseLayer) {
            top = baseLayer + ' + ' + top;
        }
    }
    
    const bottom = pickRandom(outfitBase.bottoms, currentSeed);
    currentSeed += 1;
    
    const shoes = pickRandom(outfitBase.shoes, currentSeed);
    currentSeed += 1;
    
    let accessories = pickRandom(outfitBase.accessories, currentSeed);
    currentSeed += 1;
    
    if (weatherModifier.accessories && weatherModifier.accessories.length > 0 && accessories === '无') {
        const weatherAccessory = pickRandom(weatherModifier.accessories, currentSeed);
        if (weatherAccessory) {
            accessories = weatherAccessory.replace('+', '');
        }
    }
    
    const message = range.message + (weatherModifier.messageAdd || '');
    
    return {
        tempTag: range.tag,
        message: message,
        top: top,
        bottom: bottom,
        shoes: shoes,
        accessories: accessories,
        canvasColors: range.canvasColors,
        style: style
    };
}

function getCharacterEmoji(style) {
    const emojis = {
        female: ['👩', '👩‍🦰', '👩‍🦱', '👧'],
        male: ['👨', '👨‍🦰', '👨‍🦱', '👦'],
        child: ['👧', '👦', '🧒', '👶']
    };
    return emojis[style][Math.floor(seededRandom(APP_STATE.seed) * emojis[style].length)];
}

function drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function drawOutfitCanvas(colors, style, temp) {
    const canvas = document.getElementById('outfitCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(255, 180, 190, 0.1)';
    ctx.beginPath();
    ctx.ellipse(centerX, 150, 80, 100, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    
    ctx.beginPath();
    ctx.arc(centerX, 50, 25, 0, Math.PI * 2);
    const faceGradient = ctx.createRadialGradient(centerX - 5, 45, 5, centerX, 50, 25);
    faceGradient.addColorStop(0, '#FFF0E5');
    faceGradient.addColorStop(1, '#FFE4C4');
    ctx.fillStyle = faceGradient;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(centerX, 50, 25, 0, Math.PI * 2);
    ctx.strokeStyle = '#E8C4A0';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    if (style === 'female') {
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(centerX, 30, 28, 20, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX - 20, 45, 8, 18, -0.3, 0, Math.PI * 2);
        ctx.ellipse(centerX + 20, 45, 8, 18, 0.3, 0, Math.PI * 2);
        ctx.fill();
    } else if (style === 'male') {
        ctx.fillStyle = '#4A4A4A';
        ctx.beginPath();
        ctx.ellipse(centerX, 28, 26, 18, 0, Math.PI, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillStyle = style === 'female' ? '#D4A574' : '#6B8E23';
        ctx.beginPath();
        if (style === 'female') {
            ctx.ellipse(centerX, 32, 22, 16, 0, Math.PI, Math.PI * 2);
            ctx.ellipse(centerX - 18, 42, 6, 14, -0.3, 0, Math.PI * 2);
            ctx.ellipse(centerX + 18, 42, 6, 14, 0.3, 0, Math.PI * 2);
        } else {
            ctx.arc(centerX, 40, 20, Math.PI, Math.PI * 2);
        }
        ctx.fill();
    }
    
    ctx.fillStyle = 'rgba(255, 180, 180, 0.3)';
    ctx.beginPath();
    ctx.ellipse(centerX - 15, 52, 8, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(centerX + 15, 52, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.ellipse(centerX - 8, 45, 4, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(centerX + 8, 45, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX - 9, 43, 1.5, 0, Math.PI * 2);
    ctx.arc(centerX + 7, 43, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#8D6E63';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX - 13, 39);
    ctx.quadraticCurveTo(centerX - 8, 37, centerX - 3, 39);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + 3, 39);
    ctx.quadraticCurveTo(centerX + 8, 37, centerX + 13, 39);
    ctx.stroke();
    
    ctx.strokeStyle = '#E91E63';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (style === 'female') {
        ctx.arc(centerX, 55, 7, 0.2, Math.PI - 0.2);
        ctx.stroke();
    } else if (style === 'child') {
        ctx.arc(centerX, 54, 5, 0, Math.PI);
        ctx.stroke();
    } else {
        ctx.moveTo(centerX - 5, 56);
        ctx.lineTo(centerX + 5, 56);
        ctx.stroke();
    }
    
    if (temp < 15) {
        ctx.fillStyle = style === 'female' ? '#D4A574' : (style === 'male' ? '#5D4037' : '#FFB6C1');
        ctx.beginPath();
        if (style === 'female') {
            ctx.ellipse(centerX, 33, 22, 15, 0, 0, Math.PI * 2);
        } else if (style === 'male') {
            drawRoundRect(ctx, centerX - 24, 20, 48, 22, 5);
        } else {
            ctx.ellipse(centerX, 30, 20, 13, 0, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.strokeStyle = style === 'female' ? '#B8956A' : (style === 'male' ? '#3E2723' : '#FF9EB3');
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        if (temp < 5) {
            ctx.fillStyle = '#FF9AA2';
            ctx.beginPath();
            ctx.moveTo(centerX - 18, 65);
            ctx.quadraticCurveTo(centerX, 72, centerX + 18, 65);
            ctx.lineTo(centerX + 15, 90);
            ctx.quadraticCurveTo(centerX, 95, centerX - 15, 90);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    let bodyTop, bodyBottom;
    if (temp < 15) {
        bodyTop = 75;
        bodyBottom = 160;
    } else if (temp < 26) {
        bodyTop = 75;
        bodyBottom = 150;
    } else {
        bodyTop = 75;
        bodyBottom = 140;
    }
    
    const bodyGradient = ctx.createLinearGradient(centerX - 25, bodyTop, centerX + 25, bodyBottom);
    bodyGradient.addColorStop(0, colors.outer);
    bodyGradient.addColorStop(1, lightenColor(colors.outer, 20));
    
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    
    if (temp < 15) {
        ctx.moveTo(centerX - 30, bodyTop);
        ctx.quadraticCurveTo(centerX - 25, bodyTop, centerX - 22, bodyTop + 5);
        ctx.lineTo(centerX - 18, bodyBottom);
        ctx.quadraticCurveTo(centerX - 18, bodyBottom + 5, centerX - 15, bodyBottom + 5);
        ctx.lineTo(centerX + 15, bodyBottom + 5);
        ctx.quadraticCurveTo(centerX + 18, bodyBottom + 5, centerX + 18, bodyBottom);
        ctx.lineTo(centerX + 22, bodyTop + 5);
        ctx.quadraticCurveTo(centerX + 25, bodyTop, centerX + 30, bodyTop);
        ctx.lineTo(centerX + 35, 80);
        ctx.quadraticCurveTo(centerX + 38, 100, centerX + 35, 120);
        ctx.lineTo(centerX + 30, 215);
        ctx.quadraticCurveTo(centerX + 25, 220, centerX, 220);
        ctx.quadraticCurveTo(centerX - 25, 220, centerX - 30, 215);
        ctx.lineTo(centerX - 35, 120);
        ctx.quadraticCurveTo(centerX - 38, 100, centerX - 35, 80);
        ctx.closePath();
    } else if (temp < 26) {
        ctx.moveTo(centerX - 25, bodyTop);
        ctx.quadraticCurveTo(centerX - 20, bodyTop, centerX - 18, bodyTop + 5);
        ctx.lineTo(centerX - 15, bodyBottom);
        ctx.quadraticCurveTo(centerX - 15, bodyBottom + 5, centerX - 12, bodyBottom + 5);
        ctx.lineTo(centerX + 12, bodyBottom + 5);
        ctx.quadraticCurveTo(centerX + 15, bodyBottom + 5, centerX + 15, bodyBottom);
        ctx.lineTo(centerX + 18, bodyTop + 5);
        ctx.quadraticCurveTo(centerX + 20, bodyTop, centerX + 25, bodyTop);
        ctx.lineTo(centerX + 30, 80);
        ctx.quadraticCurveTo(centerX + 33, 95, centerX + 30, 110);
        ctx.lineTo(centerX + 25, 205);
        ctx.quadraticCurveTo(centerX + 20, 210, centerX, 210);
        ctx.quadraticCurveTo(centerX - 20, 210, centerX - 25, 205);
        ctx.lineTo(centerX - 30, 110);
        ctx.quadraticCurveTo(centerX - 33, 95, centerX - 30, 80);
        ctx.closePath();
    } else {
        ctx.moveTo(centerX - 20, bodyTop);
        ctx.quadraticCurveTo(centerX - 16, bodyTop, centerX - 15, bodyTop + 3);
        ctx.lineTo(centerX - 12, bodyBottom);
        ctx.quadraticCurveTo(centerX - 12, bodyBottom + 3, centerX - 10, bodyBottom + 3);
        ctx.lineTo(centerX + 10, bodyBottom + 3);
        ctx.quadraticCurveTo(centerX + 12, bodyBottom + 3, centerX + 12, bodyBottom);
        ctx.lineTo(centerX + 15, bodyTop + 3);
        ctx.quadraticCurveTo(centerX + 16, bodyTop, centerX + 20, bodyTop);
        ctx.lineTo(centerX + 25, 80);
        ctx.quadraticCurveTo(centerX + 28, 90, centerX + 25, 100);
        ctx.lineTo(centerX + 20, 195);
        ctx.quadraticCurveTo(centerX + 15, 200, centerX, 200);
        ctx.quadraticCurveTo(centerX - 15, 200, centerX - 20, 195);
        ctx.lineTo(centerX - 25, 100);
        ctx.quadraticCurveTo(centerX - 28, 90, centerX - 25, 80);
        ctx.closePath();
    }
    ctx.fill();
    
    ctx.strokeStyle = lightenColor(colors.outer, 10);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    if (!(style === 'female' && temp >= 20)) {
        const pantsGradient = ctx.createLinearGradient(centerX - 15, bodyBottom, centerX + 15, bodyBottom + 60);
        pantsGradient.addColorStop(0, colors.bottom);
        pantsGradient.addColorStop(1, darkenColor(colors.bottom, 10));
        
        ctx.fillStyle = pantsGradient;
        ctx.beginPath();
        if (temp < 26) {
            ctx.moveTo(centerX - 15, bodyBottom);
            ctx.lineTo(centerX - 3, bodyBottom + 15);
            ctx.lineTo(centerX - 3, bodyBottom + 55);
            ctx.quadraticCurveTo(centerX - 3, bodyBottom + 60, centerX - 8, bodyBottom + 60);
            ctx.lineTo(centerX - 18, bodyBottom + 60);
            ctx.quadraticCurveTo(centerX - 22, bodyBottom + 60, centerX - 22, bodyBottom + 55);
            ctx.lineTo(centerX - 20, bodyBottom);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(centerX + 15, bodyBottom);
            ctx.lineTo(centerX + 3, bodyBottom + 15);
            ctx.lineTo(centerX + 3, bodyBottom + 55);
            ctx.quadraticCurveTo(centerX + 3, bodyBottom + 60, centerX + 8, bodyBottom + 60);
            ctx.lineTo(centerX + 18, bodyBottom + 60);
            ctx.quadraticCurveTo(centerX + 22, bodyBottom + 60, centerX + 22, bodyBottom + 55);
            ctx.lineTo(centerX + 20, bodyBottom);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.moveTo(centerX - 12, bodyBottom);
            ctx.lineTo(centerX - 2, bodyBottom + 10);
            ctx.lineTo(centerX - 2, bodyBottom + 45);
            ctx.quadraticCurveTo(centerX - 2, bodyBottom + 50, centerX - 6, bodyBottom + 50);
            ctx.lineTo(centerX - 15, bodyBottom + 50);
            ctx.quadraticCurveTo(centerX - 18, bodyBottom + 50, centerX - 18, bodyBottom + 45);
            ctx.lineTo(centerX - 16, bodyBottom);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(centerX + 12, bodyBottom);
            ctx.lineTo(centerX + 2, bodyBottom + 10);
            ctx.lineTo(centerX + 2, bodyBottom + 45);
            ctx.quadraticCurveTo(centerX + 2, bodyBottom + 50, centerX + 6, bodyBottom + 50);
            ctx.lineTo(centerX + 15, bodyBottom + 50);
            ctx.quadraticCurveTo(centerX + 18, bodyBottom + 50, centerX + 18, bodyBottom + 45);
            ctx.lineTo(centerX + 16, bodyBottom);
            ctx.closePath();
            ctx.fill();
        }
    } else {
        const skirtGradient = ctx.createRadialGradient(centerX, bodyBottom - 20, 5, centerX, bodyBottom + 20, 40);
        skirtGradient.addColorStop(0, lightenColor(colors.bottom, 10));
        skirtGradient.addColorStop(1, colors.bottom);
        
        ctx.fillStyle = skirtGradient;
        ctx.beginPath();
        ctx.moveTo(centerX - 15, bodyBottom - 10);
        ctx.quadraticCurveTo(centerX - 35, bodyBottom + 30, centerX - 30, bodyBottom + 70);
        ctx.quadraticCurveTo(centerX, bodyBottom + 80, centerX + 30, bodyBottom + 70);
        ctx.quadraticCurveTo(centerX + 35, bodyBottom + 30, centerX + 15, bodyBottom - 10);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = darkenColor(colors.bottom, 5);
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    let shoesY;
    if (style === 'female' && temp >= 20) {
        shoesY = bodyBottom + 70;
    } else if (temp < 26) {
        shoesY = bodyBottom + 60;
    } else {
        shoesY = bodyBottom + 50;
    }
    
    const shoeGradient = ctx.createLinearGradient(centerX - 15, shoesY - 8, centerX + 15, shoesY + 8);
    shoeGradient.addColorStop(0, lightenColor(colors.shoes, 15));
    shoeGradient.addColorStop(0.5, colors.shoes);
    shoeGradient.addColorStop(1, darkenColor(colors.shoes, 15));
    
    ctx.fillStyle = shoeGradient;
    ctx.beginPath();
    if (temp < 15) {
        ctx.ellipse(centerX - 13, shoesY, 16, 9, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX + 13, shoesY, 16, 9, 0, 0, Math.PI * 2);
    } else {
        ctx.ellipse(centerX - 11, shoesY, 13, 7, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX + 11, shoesY, 13, 7, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    
    ctx.restore();
    
    const characterEmoji = document.getElementById('characterEmoji');
    if (characterEmoji) {
        characterEmoji.style.display = 'none';
    }
}

function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function updateUI(outfit) {
    document.getElementById('tempTag').textContent = outfit.tempTag;
    document.getElementById('messageBox').textContent = outfit.message;
    document.getElementById('topDesc').textContent = outfit.top;
    document.getElementById('bottomDesc').textContent = outfit.bottom;
    document.getElementById('shoesDesc').textContent = outfit.shoes;
    document.getElementById('accessoriesDesc').textContent = outfit.accessories;
    document.getElementById('weatherLabel').textContent = WEATHER_NAMES[APP_STATE.weather];
    
    drawOutfitCanvas(outfit.canvasColors, outfit.style, APP_STATE.temperature);
    
    const resultSection = document.querySelector('.result-section');
    resultSection.classList.remove('fade-in');
    void resultSection.offsetWidth;
    resultSection.classList.add('fade-in');
}

function updateRecommendation() {
    const outfit = generateOutfit(
        APP_STATE.temperature,
        APP_STATE.weather,
        APP_STATE.style,
        APP_STATE.seed
    );
    updateUI(outfit);
    saveState();
}

function syncTemperatureInputs(value) {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(-10, Math.min(40, numValue));
    
    APP_STATE.temperature = clampedValue;
    
    document.getElementById('tempSlider').value = clampedValue;
    document.getElementById('tempInput').value = clampedValue;
    
    APP_STATE.seed = Date.now();
    updateRecommendation();
}

function selectWeather(weather) {
    APP_STATE.weather = weather;
    
    document.querySelectorAll('.weather-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.weather === weather);
    });
    
    const weatherBtn = document.querySelector(`.weather-btn[data-weather="${weather}"]`);
    if (weatherBtn) {
        weatherBtn.classList.remove('bounce');
        void weatherBtn.offsetWidth;
        weatherBtn.classList.add('bounce');
    }
    
    APP_STATE.seed = Date.now();
    updateRecommendation();
}

function selectStyle(style) {
    APP_STATE.style = style;
    
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.style === style);
    });
    
    const styleBtn = document.querySelector(`.style-btn[data-style="${style}"]`);
    if (styleBtn) {
        styleBtn.classList.remove('bounce');
        void styleBtn.offsetWidth;
        styleBtn.classList.add('bounce');
    }
    
    APP_STATE.seed = Date.now();
    updateRecommendation();
}

function randomOutfit() {
    APP_STATE.seed = Date.now();
    
    const randomBtn = document.getElementById('randomBtn');
    randomBtn.classList.remove('bounce');
    void randomBtn.offsetWidth;
    randomBtn.classList.add('bounce');
    
    updateRecommendation();
}

function saveState() {
    try {
        localStorage.setItem('chuanda_state', JSON.stringify(APP_STATE));
    } catch (e) {
        console.warn('Failed to save state to localStorage:', e);
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem('chuanda_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(APP_STATE, parsed);
            
            document.getElementById('tempSlider').value = APP_STATE.temperature;
            document.getElementById('tempInput').value = APP_STATE.temperature;
            
            selectWeather(APP_STATE.weather);
            selectStyle(APP_STATE.style);
            
            return true;
        }
    } catch (e) {
        console.warn('Failed to load state from localStorage:', e);
    }
    return false;
}

function initEventListeners() {
    const tempSlider = document.getElementById('tempSlider');
    const tempInput = document.getElementById('tempInput');
    
    tempSlider.addEventListener('input', (e) => {
        syncTemperatureInputs(e.target.value);
    });
    
    tempInput.addEventListener('change', (e) => {
        syncTemperatureInputs(e.target.value);
    });
    
    tempInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            syncTemperatureInputs(e.target.value);
        }
    });
    
    document.querySelectorAll('.weather-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectWeather(btn.dataset.weather);
        });
    });
    
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectStyle(btn.dataset.style);
        });
    });
    
    document.getElementById('randomBtn').addEventListener('click', randomOutfit);
}

function init() {
    initEventListeners();
    
    const hasSavedState = loadState();
    
    if (!hasSavedState) {
        APP_STATE.seed = Date.now();
        updateRecommendation();
    } else {
        const outfit = generateOutfit(
            APP_STATE.temperature,
            APP_STATE.weather,
            APP_STATE.style,
            APP_STATE.seed
        );
        updateUI(outfit);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
