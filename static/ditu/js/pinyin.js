const PINYIN_MAP = {
    '北': 'bei', '京': 'jing', '天': 'tian', '津': 'jin', '河': 'he', '北': 'bei', '山': 'shan', '西': 'xi',
    '内': 'nei', '蒙': 'meng', '古': 'gu', '自': 'zi', '治': 'zhi', '区': 'qu', '辽': 'liao', '宁': 'ning',
    '吉': 'ji', '林': 'lin', '黑': 'hei', '龙': 'long', '江': 'jiang', '上': 'shang', '海': 'hai',
    '苏': 'su', '浙': 'zhe', '安': 'an', '徽': 'hui', '福': 'fu', '建': 'jian', '江': 'jiang', '西': 'xi',
    '山': 'shan', '东': 'dong', '台': 'tai', '湾': 'wan', '广': 'guang', '东': 'dong', '西': 'xi',
    '壮': 'zhuang', '族': 'zu', '海': 'hai', '南': 'nan', '香': 'xiang', '港': 'gang', '澳': 'ao', '门': 'men',
    '特': 'te', '别': 'bie', '行': 'xing', '政': 'zheng', '湖': 'hu', '南': 'nan', '北': 'bei', '重': 'chong',
    '庆': 'qing', '四': 'si', '川': 'chuan', '贵': 'gui', '州': 'zhou', '云': 'yun', '西': 'xi', '藏': 'zang',
    '陕': 'shan', '甘': 'gan', '肃': 'su', '青': 'qing', '宁': 'ning', '夏': 'xia', '新': 'xin', '疆': 'jiang',
    '乌': 'wu', '鲁': 'lu', '木': 'mu', '齐': 'qi', '兰': 'lan', '州': 'zhou', '西': 'xi', '安': 'an',
    '成': 'cheng', '都': 'du', '昆': 'kun', '明': 'ming', '拉': 'la', '萨': 'sa', '银': 'yin', '川': 'chuan',
    '西': 'xi', '宁': 'ning', '长': 'chang', '春': 'chun', '沈': 'shen', '阳': 'yang', '哈': 'ha', '尔': 'er',
    '滨': 'bin', '石': 'shi', '家': 'jia', '庄': 'zhuang', '太': 'tai', '原': 'yuan', '济': 'ji', '南': 'nan',
    '合': 'he', '肥': 'fei', '杭': 'hang', '州': 'zhou', '南': 'nan', '京': 'jing', '福': 'fu', '州': 'zhou',
    '广': 'guang', '州': 'zhou', '南': 'nan', '宁': 'ning', '海': 'hai', '口': 'kou', '长': 'chang', '沙': 'sha',
    '武': 'wu', '汉': 'han', '郑': 'zheng', '州': 'zhou', '南': 'nan', '昌': 'chang', '贵': 'gui', '阳': 'yang'
};

function toPinyin(text) {
    let result = '';
    for (let char of text) {
        result += PINYIN_MAP[char] || char;
    }
    return result;
}

function getSuggestions(input, type) {
    if (!input || input.length < 1) return [];
    
    const inputLower = input.toLowerCase();
    const suggestions = new Set();
    
    PROVINCE_DATA.forEach(province => {
        let target = '';
        switch (type) {
            case 'name': target = province.name; break;
            case 'short': target = province.short; break;
            case 'capital': target = province.capital; break;
        }
        
        if (target.includes(input)) {
            suggestions.add(target);
        }
        
        const pinyin = toPinyin(target);
        if (pinyin.includes(inputLower)) {
            suggestions.add(target);
        }
        
        const firstLetters = target.split('').map(c => PINYIN_MAP[c]?.[0] || c).join('');
        if (firstLetters.includes(inputLower)) {
            suggestions.add(target);
        }
    });
    
    return Array.from(suggestions).slice(0, 5);
}

function normalizeAnswer(answer) {
    return answer.trim().replace(/[省市区县镇特别行政自治维吾尔壮族回族]+$/, '');
}

function checkAnswer(userAnswer, correctAnswer, type) {
    const normalizedUser = normalizeAnswer(userAnswer).toLowerCase();
    const correctAnswers = [correctAnswer.toLowerCase()];
    
    if (type === 'short' && correctAnswer.includes('或')) {
        correctAnswers.push(...correctAnswer.split('或'));
    }
    
    if (type === 'name') {
        correctAnswers.push(correctAnswer.replace(/[省市区特别行政区自治区维吾尔壮族回族]+$/, ''));
    }
    
    return correctAnswers.some(ans => 
        normalizedUser === ans || 
        normalizedUser === normalizeAnswer(ans).toLowerCase()
    );
}
