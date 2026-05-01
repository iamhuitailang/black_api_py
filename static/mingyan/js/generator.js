import { words, styleTemplates, industryData, lengthConfig, getRandomItem, getRandomItems } from './data.js';

class SloganGenerator {
    constructor() {
        this.generatedSlogans = new Set();
    }
    
    parseKeywords(input) {
        if (!input || input.trim() === '') {
            return [];
        }
        
        const parts = input.split(/[,\s，\s]+/);
        const keywords = parts
            .map(part => part.trim())
            .filter(part => part.length > 0)
            .slice(0, 3);
        
        return keywords;
    }
    
    getBrandName(keywords) {
        if (keywords.length === 0) {
            return '品牌';
        }
        return keywords[0];
    }
    
    fillTemplate(template, keywords, style, industry) {
        let result = template;
        const brandName = this.getBrandName(keywords);
        
        result = result.replace(/\[品牌\]/g, brandName);
        result = result.replace(/\[动词\]/g, () => getRandomItem(words.verbs));
        result = result.replace(/\[形容词\]/g, () => getRandomItem(words.adjectives));
        result = result.replace(/\[名词\]/g, () => {
            if (industry && industryData[industry]) {
                const industryKeywords = industryData[industry].keywords;
                if (Math.random() > 0.5) {
                    return getRandomItem(industryKeywords);
                }
            }
            if (keywords.length > 1 && Math.random() > 0.3) {
                return getRandomItem(keywords.slice(1));
            }
            return getRandomItem(words.nouns);
        });
        result = result.replace(/\[副词\]/g, () => getRandomItem(words.adverbs));
        
        return result;
    }
    
    generateByStyle(keywords, style, industry, length) {
        const styleData = styleTemplates[style];
        if (!styleData) {
            return [];
        }
        
        const patterns = styleData.patterns;
        const lengthLimit = lengthConfig[length] || lengthConfig.medium;
        const results = [];
        
        for (let i = 0; i < patterns.length; i++) {
            let slogan = this.fillTemplate(patterns[i], keywords, style, industry);
            
            while (slogan.length < lengthLimit.min) {
                const wordsList = [...words.adjectives, ...words.nouns, ...words.verbs];
                slogan = getRandomItem(wordsList) + slogan;
            }
            
            if (slogan.length > lengthLimit.max) {
                continue;
            }
            
            if (this.generatedSlogans.has(slogan)) {
                continue;
            }
            
            this.generatedSlogans.add(slogan);
            results.push({
                id: Date.now() + Math.random(),
                text: slogan,
                style: styleData.name,
                keywords: keywords.join(', '),
                industry: industry ? industryData[industry]?.name : null,
                rating: null
            });
        }
        
        return results;
    }
    
    generateIndustrySlogans(keywords, industry, length) {
        const industryInfo = industryData[industry];
        if (!industryInfo) {
            return [];
        }
        
        const lengthLimit = lengthConfig[length] || lengthConfig.medium;
        const results = [];
        
        for (let i = 0; i < industryInfo.templates.length; i++) {
            let slogan = this.fillTemplate(industryInfo.templates[i], keywords, 'industry', industry);
            
            while (slogan.length < lengthLimit.min) {
                const wordsList = [...words.adjectives, ...words.nouns];
                slogan = getRandomItem(wordsList) + slogan;
            }
            
            if (slogan.length > lengthLimit.max) {
                continue;
            }
            
            if (this.generatedSlogans.has(slogan)) {
                continue;
            }
            
            this.generatedSlogans.add(slogan);
            results.push({
                id: Date.now() + Math.random(),
                text: slogan,
                style: `${industryInfo.name}行业`,
                keywords: keywords.join(', '),
                industry: industryInfo.name,
                rating: null
            });
        }
        
        return results;
    }
    
    generate(keywordsInput, options = {}) {
        const {
            style = 'simple',
            industry = null,
            length = 'medium',
            count = 10
        } = options;
        
        const keywords = this.parseKeywords(keywordsInput);
        
        if (keywords.length === 0) {
            return {
                success: false,
                message: '请输入至少一个关键词',
                slogans: []
            };
        }
        
        this.generatedSlogans.clear();
        
        let allSlogans = [];
        
        const styleSlogans = this.generateByStyle(keywords, style, industry, length);
        allSlogans = [...allSlogans, ...styleSlogans];
        
        if (industry && industryData[industry]) {
            const industrySlogans = this.generateIndustrySlogans(keywords, industry, length);
            allSlogans = [...allSlogans, ...industrySlogans];
        }
        
        const otherStyles = Object.keys(styleTemplates).filter(s => s !== style);
        const randomStyles = getRandomItems(otherStyles, 2);
        
        for (let otherStyle of randomStyles) {
            const moreSlogans = this.generateByStyle(keywords, otherStyle, industry, length);
            allSlogans = [...allSlogans, ...moreSlogans];
        }
        
        allSlogans = allSlogans
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(count, allSlogans.length));
        
        if (allSlogans.length === 0) {
            return {
                success: false,
                message: '未能生成足够的 slogan，请尝试调整长度限制',
                slogans: []
            };
        }
        
        return {
            success: true,
            message: `成功生成 ${allSlogans.length} 条 slogan`,
            keywords: keywords,
            style: style,
            industry: industry,
            length: length,
            slogans: allSlogans
        };
    }
    
    refresh(keywordsInput, options = {}) {
        return this.generate(keywordsInput, options);
    }
    
    copyToClipboard(text) {
        return new Promise((resolve, reject) => {
            navigator.clipboard.writeText(text)
                .then(() => resolve(true))
                .catch(err => {
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-9999px';
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                        document.execCommand('copy');
                        resolve(true);
                    } catch (e) {
                        reject(e);
                    } finally {
                        document.body.removeChild(textArea);
                    }
                });
        });
    }
    
    downloadAsText(content, filename = 'slogans.txt') {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

export const sloganGenerator = new SloganGenerator();
