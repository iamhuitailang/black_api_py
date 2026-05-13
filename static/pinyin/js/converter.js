const Converter = (function() {
    const pinyinMap = PinyinData.pinyinMap;

    function isChineseChar(char) {
        return /[\u4e00-\u9fa5]/.test(char);
    }

    function charToPinyin(char, options = {}) {
        const { tone = true, caseMode = 'lower' } = options;
        let pinyin = pinyinMap[char] || char;
        
        if (!tone) {
            pinyin = PinyinData.removeTone(pinyin);
        }
        
        if (caseMode === 'first') {
            pinyin = PinyinData.capitalizeFirst(pinyin);
        } else if (caseMode === 'upper') {
            pinyin = PinyinData.capitalizeAll(pinyin);
        }
        
        return pinyin;
    }

    function convert(text, options = {}) {
        const {
            tone = true,
            separator = ' ',
            customSeparator = '-',
            caseMode = 'lower',
            polyphoneSelections = {}
        } = options;

        let result = [];
        let polyphones = [];

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (isChineseChar(char)) {
                let pinyin;
                if (polyphoneSelections && polyphoneSelections[i]) {
                    pinyin = polyphoneSelections[i];
                    if (!tone) {
                        pinyin = PinyinData.removeTone(pinyin);
                    }
                    if (caseMode === 'first') {
                        pinyin = PinyinData.capitalizeFirst(pinyin);
                    } else if (caseMode === 'upper') {
                        pinyin = PinyinData.capitalizeAll(pinyin);
                    }
                } else {
                    pinyin = charToPinyin(char, { tone, caseMode });
                }
                
                if (PolyphoneManager.isPolyphone(char)) {
                    polyphones.push({
                        index: i,
                        char: char,
                        currentPinyin: pinyin
                    });
                }
                
                result.push(pinyin);
            } else {
                result.push(char);
            }
        }

        let sep = separator === 'custom' ? customSeparator : separator;
        if (sep === 'none') sep = '';

        let output = '';
        for (let i = 0; i < result.length; i++) {
            output += result[i];
            if (i < result.length - 1 && 
                isChineseChar(text[i]) && 
                (isChineseChar(text[i+1]) || /\s/.test(text[i+1]))) {
                output += sep;
            }
        }

        return {
            result: output,
            polyphones: polyphones,
            charCount: text.split('').filter(c => isChineseChar(c)).length
        };
    }

    function formatPinyin(pinyin, options) {
        let result = pinyin;
        
        if (!options.tone) {
            result = PinyinData.removeTone(result);
        }
        
        if (options.caseMode === 'first') {
            result = PinyinData.capitalizeFirst(result);
        } else if (options.caseMode === 'upper') {
            result = PinyinData.capitalizeAll(result);
        }
        
        return result;
    }

    return {
        convert: convert,
        isChineseChar: isChineseChar,
        charToPinyin: charToPinyin,
        formatPinyin: formatPinyin
    };
})();