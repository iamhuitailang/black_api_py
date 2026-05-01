const PoemGenerator = (function() {
    'use strict';

    const LINE_COUNT = 4;

    const commonFiveCharLines = {
        "爱": ["爱意满心间", "爱如春水长", "爱在不言中", "爱似海深洋"],
        "情": ["情意两缠绵", "情深意更浓", "情丝绕指柔", "情定三生缘"],
        "友": ["友谊天长久", "友情深似海", "友爱满人间", "友伴度春秋"],
        "事": ["事在人为先", "事业步步高", "事事皆如意", "事成在今朝"],
        "生": ["生逢盛世好", "生机满乾坤", "生当作人杰", "生世永相伴"],
        "日": ["日照山河明", "日月同光辉", "日暖春风和", "日久见人心"],
        "快": ["快意人生路", "快乐似神仙", "快马加鞭行", "快意在心中"],
        "乐": ["乐享太平年", "乐在不言中", "乐事满人间", "乐游天地间"],
        "平": ["平安喜乐长", "平步青云上", "平安度春秋", "平心静气和"],
        "安": ["安然岁月悠", "安居乐业好", "安康福满堂", "安心度日常"],
        "喜": ["喜看人间美", "喜事临门来", "喜笑颜开时", "喜气满乾坤"],
        "节": ["节至喜洋洋", "节日乐融融", "节节步步高", "节庆共欢腾"],
        "祝": ["祝福满人间", "祝愿常相伴", "祝君前程好", "祝寿比南山"],
        "福": ["福气满门庭", "福如东海水", "福星高高照", "福寿乐安康"],
        "幸": ["幸福常相伴", "幸运常相随", "幸福满人间", "幸会在今朝"],
        "美": ["美景入画来", "美酒邀明月", "美人颜如玉", "美意延年寿"]
    };

    const commonSevenCharLines = {
        "爱": ["爱意绵绵似水长", "爱如潮水涌心头", "爱在心头口难开", "爱满人间春意浓"],
        "情": ["情意绵绵无尽期", "情到深处自然浓", "情丝万缕绕心头", "情定三生石上缘"],
        "友": ["友谊天长地久时", "友情深似海汪洋", "友爱互助暖人心", "友伴同行人生路"],
        "事": ["事在人为莫等闲", "事业有成步步高", "事事顺心皆如意", "事成于思败于随"],
        "生": ["生逢盛世沐春风", "生机盎然满乾坤", "生当作人杰英豪", "生生世世永相伴"],
        "日": ["日照山河万里红", "日月同辉照九州", "日暖花开春意闹", "日久见人心情真"],
        "快": ["快意人生须尽欢", "快乐无忧度春秋", "快马加鞭奔前程", "快意恩仇江湖行"],
        "乐": ["乐享太平盛世年", "乐在其中笑开颜", "乐事连连喜盈门", "乐游山水心自在"],
        "平": ["平安喜乐常相伴", "平步青云上九天", "平安度日心自在", "平心静气养天年"],
        "安": ["安然岁月度春秋", "安居乐业福满堂", "安康顺遂人长久", "安心乐道度平生"],
        "喜": ["喜看人间烟火色", "喜事临门笑颜开", "喜气洋洋满堂春", "喜上眉梢乐开怀"],
        "节": ["节日快乐喜洋洋", "节庆团圆乐融融", "节节高升创辉煌", "节物风光不相待"],
        "祝": ["祝福声声传万家", "祝愿如意事事顺", "祝君前程似锦绣", "祝寿延年福无边"],
        "福": ["福气盈门喜满堂", "福如东海长流水", "福星高照运亨通", "福寿安康乐无边"],
        "幸": ["幸福美满度春秋", "幸运常伴笑开怀", "幸福花开满人间", "幸甚至哉歌以咏"],
        "美": ["美景如画入眼帘", "美酒佳肴邀明月", "美人如玉笑嫣然", "美意延年寿长春"]
    };

    function filterChineseChars(str) {
        const chineseRegex = /[\u4e00-\u9fa5]/g;
        const matches = str.match(chineseRegex);
        return matches ? matches.join('') : '';
    }

    function validateKeywords(keywords) {
        if (!keywords || keywords.trim() === '') {
            return { valid: false, message: '请输入关键词' };
        }
        
        const filtered = filterChineseChars(keywords.trim());
        
        if (!filtered) {
            return { valid: false, message: '请输入中文字符' };
        }
        
        if (filtered.length < 2) {
            return { valid: false, message: '关键词至少需要2个中文字' };
        }
        if (filtered.length > 8) {
            return { valid: false, message: '关键词最多8个中文字' };
        }
        
        return { valid: true, keywords: filtered };
    }

    function getHideWords(keywords) {
        const chars = keywords.split('');
        const hideWords = [];
        
        for (let i = 0; i < LINE_COUNT; i++) {
            hideWords.push(chars[i % chars.length]);
        }
        
        return hideWords;
    }

    function generateLineByTemplate(hideWord, template, form) {
        const lineLength = form === 'five' ? 5 : 7;
        return hideWord + template.substring(1);
    }

    function generateLineFromWords(hideWord, form, style) {
        const lineLength = form === 'five' ? 5 : 7;
        let line = hideWord;
        
        for (let i = 1; i < lineLength; i++) {
            line += PoemData.getRandomWord(form, style, i);
        }
        
        return line;
    }

    function findInCommonLines(hideWord, form) {
        const commonLines = form === 'five' ? commonFiveCharLines : commonSevenCharLines;
        
        if (commonLines[hideWord]) {
            const lines = commonLines[hideWord];
            return lines[Math.floor(Math.random() * lines.length)];
        }
        
        return null;
    }

    function findMatchingTemplate(hideWord, form, style) {
        const commonLine = findInCommonLines(hideWord, form);
        if (commonLine) {
            return commonLine;
        }

        const data = PoemData.getPoemData(form, style);
        const templates = data.templates;
        
        const matchingLines = [];
        for (const template of templates) {
            for (const line of template) {
                if (line.charAt(0) === hideWord) {
                    matchingLines.push(line);
                }
            }
        }
        
        if (matchingLines.length > 0) {
            return matchingLines[Math.floor(Math.random() * matchingLines.length)];
        }
        
        const allStyles = ['classical', 'modern', 'funny'];
        for (const s of allStyles) {
            if (s === style) continue;
            
            const otherData = PoemData.getPoemData(form, s);
            for (const template of otherData.templates) {
                for (const line of template) {
                    if (line.charAt(0) === hideWord) {
                        matchingLines.push(line);
                    }
                }
            }
        }
        
        if (matchingLines.length > 0) {
            return matchingLines[Math.floor(Math.random() * matchingLines.length)];
        }
        
        return null;
    }

    function generateSmartLine(hideWord, form, style) {
        const smartTemplates = {
            five: {
                classical: [
                    hideWord + "风拂柳绿",
                    hideWord + "月照花明",
                    hideWord + "山云为伴",
                    hideWord + "水入耳清",
                    hideWord + "花开满院",
                    hideWord + "叶落秋风",
                    hideWord + "春归似锦",
                    hideWord + "秋至如金"
                ],
                modern: [
                    hideWord + "光洒满夜",
                    hideWord + "色透窗纱",
                    hideWord + "吹思念起",
                    hideWord + "打寂寞花",
                    hideWord + "跳的节奏",
                    hideWord + "魂的共鸣",
                    hideWord + "想在远方",
                    hideWord + "望在心中"
                ],
                funny: [
                    hideWord + "饭不挑食",
                    hideWord + "觉睡得香",
                    hideWord + "班不摸鱼",
                    hideWord + "班就狂欢",
                    hideWord + "包空荡荡",
                    hideWord + "里发慌慌",
                    hideWord + "天不想动",
                    hideWord + "想躺平躺"
                ]
            },
            seven: {
                classical: [
                    hideWord + "风拂面柳丝长",
                    hideWord + "月映池桂花香",
                    hideWord + "高路远云为伴",
                    hideWord + "阔天空雁一行",
                    hideWord + "开富贵满庭芳",
                    hideWord + "落知秋夜渐凉",
                    hideWord + "回大地万物苏",
                    hideWord + "高气爽稻谷熟"
                ],
                modern: [
                    hideWord + "光璀璨夜未央",
                    hideWord + "色朦胧入梦乡",
                    hideWord + "吹落叶思往事",
                    hideWord + "滴梧桐断人肠",
                    hideWord + "跳加速遇见你",
                    hideWord + "魂共鸣心相印",
                    hideWord + "想起航在今朝",
                    hideWord + "望之光心中照"
                ],
                funny: [
                    hideWord + "饭睡觉打豆豆",
                    hideWord + "班摸鱼乐悠悠",
                    hideWord + "资到手就花光",
                    hideWord + "光族里我最强",
                    hideWord + "包空空如也慌",
                    hideWord + "呗借呗还不上",
                    hideWord + "天不想去上班",
                    hideWord + "想在家躺平躺"
                ]
            }
        };

        const templates = smartTemplates[form][style] || smartTemplates[form].classical;
        return templates[Math.floor(Math.random() * templates.length)];
    }

    function generateSingleLine(hideWord, form, style, usedLines = []) {
        const matchingLine = findMatchingTemplate(hideWord, form, style);
        
        if (matchingLine && !usedLines.includes(matchingLine)) {
            return matchingLine;
        }
        
        const smartLine = generateSmartLine(hideWord, form, style);
        if (!usedLines.includes(smartLine)) {
            return smartLine;
        }
        
        return generateLineFromWords(hideWord, form, style);
    }

    function generatePoem(keywords, form, style) {
        const validation = validateKeywords(keywords);
        if (!validation.valid) {
            return {
                success: false,
                message: validation.message
            };
        }

        const hideWords = getHideWords(validation.keywords);
        const usedLines = [];
        const lines = [];

        for (let i = 0; i < LINE_COUNT; i++) {
            const line = generateSingleLine(hideWords[i], form, style, usedLines);
            lines.push(line);
            usedLines.push(line);
        }

        return {
            success: true,
            keywords: validation.keywords,
            form: form,
            style: style,
            lines: lines,
            hideWords: hideWords,
            formName: PoemData.getFormName(form),
            styleName: PoemData.getStyleName(style)
        };
    }

    function reGeneratePoem(originalPoem) {
        return generatePoem(
            originalPoem.keywords,
            originalPoem.form,
            originalPoem.style
        );
    }

    function formatPoem(poem) {
        if (!poem.success) {
            return poem.message;
        }
        
        return poem.lines.join('\n');
    }

    function formatPoemWithHighlight(poem) {
        if (!poem.success) {
            return [];
        }
        
        return poem.lines.map((line, index) => {
            const hideWord = poem.hideWords[index];
            return {
                text: line,
                hideWord: hideWord,
                hideIndex: 0
            };
        });
    }

    return {
        generatePoem,
        reGeneratePoem,
        formatPoem,
        formatPoemWithHighlight,
        validateKeywords,
        getHideWords,
        LINE_COUNT
    };
})();
