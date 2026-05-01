import { uiManager } from './ui.js';
import { sloganGenerator } from './generator.js';
import { storageManager } from './storage.js';
import { imageGenerator, imageTemplates } from './imageGenerator.js';
import { styleTemplates, industryData } from './data.js';

class App {
    constructor() {
        this.currentSlogans = [];
        this.lastKeywords = '';
        this.lastOptions = {};
    }
    
    init() {
        uiManager.init();
        this.loadSavedData();
        this.bindAppEvents();
    }
    
    loadSavedData() {
        this.renderHistory();
        this.renderFavorites();
        
        const settings = storageManager.getSettings();
        if (settings) {
            this.applySettings(settings);
        }
        
        this.loadCurrentResults();
        this.loadKeywordsInput();
    }
    
    loadCurrentResults() {
        const savedResults = storageManager.getCurrentResults();
        
        if (savedResults.slogans && savedResults.slogans.length > 0) {
            this.currentSlogans = savedResults.slogans;
            this.lastKeywords = savedResults.keywords || '';
            this.lastOptions = savedResults.options || {};
            
            const slogansWithFavorite = this.currentSlogans.map(slogan => ({
                ...slogan,
                isFavorite: storageManager.isFavorite(slogan.text, slogan.keywords || '')
            }));
            
            uiManager.renderSlogans(slogansWithFavorite, {
                onCopy: (slogan) => this.handleCopy(slogan),
                onFavorite: (slogan) => this.handleFavorite(slogan),
                onRating: (slogan, rating) => this.handleRating(slogan, rating),
                onGenerateImage: (slogan) => this.handleGenerateImage(slogan)
            });
            
            uiManager.enableRefreshButton(true);
        }
    }
    
    loadKeywordsInput() {
        const savedKeywords = storageManager.getKeywords();
        if (savedKeywords) {
            const keywordsInput = document.getElementById('keywords');
            keywordsInput.value = savedKeywords;
        }
    }
    
    applySettings(settings) {
        const { style, industry, length } = settings;
        
        if (style) {
            const styleBtn = document.querySelector(`#style-options [data-style="${style}"]`);
            if (styleBtn) {
                styleBtn.click();
            }
        }
        
        if (industry) {
            const industryBtn = document.querySelector(`#industry-options [data-industry="${industry}"]`);
            if (industryBtn) {
                industryBtn.click();
            }
        }
        
        if (length) {
            const lengthBtn = document.querySelector(`#length-options [data-length="${length}"]`);
            if (lengthBtn) {
                lengthBtn.click();
            }
        }
    }
    
    bindAppEvents() {
        const generateBtn = document.getElementById('generate-btn');
        generateBtn.addEventListener('click', () => this.handleGenerate());
        
        const refreshBtn = document.getElementById('refresh-btn');
        refreshBtn.addEventListener('click', () => this.handleRefresh());
        
        const exportResultsBtn = document.getElementById('export-results-btn');
        exportResultsBtn.addEventListener('click', () => this.handleExportResults());
        
        const keywordsInput = document.getElementById('keywords');
        keywordsInput.addEventListener('input', (e) => {
            storageManager.saveKeywords(e.target.value);
        });
    }
    
    async handleGenerate() {
        const keywordsInput = document.getElementById('keywords');
        const keywords = keywordsInput.value.trim();
        
        if (!keywords) {
            uiManager.showToast('请输入至少一个关键词', 'error');
            keywordsInput.focus();
            return;
        }
        
        const options = uiManager.getSelectedOptions();
        
        storageManager.saveSettings(options);
        
        uiManager.setGenerateButtonLoading(true);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const result = sloganGenerator.generate(keywords, {
            style: options.style,
            industry: options.industry,
            length: options.length,
            count: 10
        });
        
        uiManager.setGenerateButtonLoading(false);
        
        if (!result.success) {
            uiManager.showToast(result.message, 'error');
            return;
        }
        
        this.currentSlogans = result.slogans;
        this.lastKeywords = keywords;
        this.lastOptions = options;
        
        const slogansWithFavorite = this.currentSlogans.map(slogan => ({
            ...slogan,
            isFavorite: storageManager.isFavorite(slogan.text, result.keywords.join(', '))
        }));
        
        uiManager.renderSlogans(slogansWithFavorite, {
            onCopy: (slogan) => this.handleCopy(slogan),
            onFavorite: (slogan) => this.handleFavorite(slogan),
            onRating: (slogan, rating) => this.handleRating(slogan, rating),
            onGenerateImage: (slogan) => this.handleGenerateImage(slogan)
        });
        
        storageManager.addHistory({
            keywords: result.keywords.join(', '),
            style: result.style,
            industry: result.industry,
            length: result.length,
            slogans: result.slogans
        });
        
        this.renderHistory();
        
        storageManager.saveCurrentResults({
            slogans: this.currentSlogans,
            keywords: this.lastKeywords,
            options: this.lastOptions
        });
        
        storageManager.saveKeywords(keywords);
        
        uiManager.enableRefreshButton(true);
        uiManager.showToast(result.message, 'success');
    }
    
    handleRefresh() {
        if (!this.lastKeywords) {
            uiManager.showToast('请先生成 slogan', 'error');
            return;
        }
        
        const keywordsInput = document.getElementById('keywords');
        keywordsInput.value = this.lastKeywords;
        
        this.handleGenerate();
    }
    
    async handleCopy(slogan) {
        try {
            await sloganGenerator.copyToClipboard(slogan.text);
            uiManager.showToast('已复制到剪贴板', 'success');
        } catch (err) {
            uiManager.showToast('复制失败，请手动复制', 'error');
        }
    }
    
    handleFavorite(slogan) {
        const isFav = storageManager.isFavorite(slogan.text, slogan.keywords);
        
        if (isFav) {
            uiManager.showToast('该 slogan 已在收藏中', 'warning');
            return;
        }
        
        const result = storageManager.addFavorite({
            text: slogan.text,
            keywords: slogan.keywords,
            style: slogan.style,
            industry: slogan.industry,
            rating: slogan.rating
        });
        
        if (result) {
            uiManager.showToast('已添加到收藏', 'success');
            
            const index = this.currentSlogans.findIndex(s => s.id === slogan.id);
            if (index > -1) {
                this.currentSlogans[index].isFavorite = true;
            }
            
            this.refreshSlogansDisplay();
            this.renderFavorites();
        }
    }
    
    handleRating(slogan, rating) {
        storageManager.addRating(slogan.id, rating);
        
        const index = this.currentSlogans.findIndex(s => s.id === slogan.id);
        if (index > -1) {
            this.currentSlogans[index].rating = rating;
        }
        
        uiManager.showToast(`已标记为"${rating}"`, 'success');
        this.refreshSlogansDisplay();
        this.renderHistory();
    }
    
    refreshSlogansDisplay() {
        const slogansWithFavorite = this.currentSlogans.map(slogan => ({
            ...slogan,
            isFavorite: storageManager.isFavorite(slogan.text, slogan.keywords)
        }));
        
        uiManager.renderSlogans(slogansWithFavorite, {
            onCopy: (slogan) => this.handleCopy(slogan),
            onFavorite: (slogan) => this.handleFavorite(slogan),
            onRating: (slogan, rating) => this.handleRating(slogan, rating),
            onGenerateImage: (slogan) => this.handleGenerateImage(slogan)
        });
    }
    
    handleGenerateImage(slogan) {
        uiManager.createImageModal(
            slogan,
            imageTemplates,
            (sloganData, templateKey) => {
                return imageGenerator.generate(sloganData.text, {
                    keywords: sloganData.keywords || '',
                    styleName: sloganData.style || '',
                    templateKey: templateKey
                });
            },
            (dataUrl, sloganData) => {
                const filename = `slogan_${Date.now()}.png`;
                imageGenerator.download(dataUrl, filename);
                uiManager.showToast('图片下载成功', 'success');
            },
            () => {
            }
        );
    }
    
    renderHistory() {
        const history = storageManager.getHistory();
        uiManager.renderHistory(history, {
            onCopy: (slogan) => this.handleCopy(slogan),
            onFavorite: (slogan) => {
                const result = storageManager.addFavorite({
                    text: slogan.text,
                    keywords: slogan.keywords,
                    style: slogan.style
                });
                if (result) {
                    uiManager.showToast('已添加到收藏', 'success');
                    this.renderFavorites();
                } else {
                    uiManager.showToast('已在收藏中', 'warning');
                }
            },
            onRating: (slogan, rating) => this.handleRating(slogan, rating)
        });
    }
    
    renderFavorites() {
        const favorites = storageManager.getFavorites();
        uiManager.renderFavorites(favorites, {
            onCopy: (slogan) => this.handleCopy(slogan),
            onRemoveFavorite: (slogan) => {
                const result = storageManager.removeFavorite(slogan.id);
                if (result) {
                    uiManager.showToast('已取消收藏', 'success');
                    this.renderFavorites();
                    this.refreshSlogansDisplay();
                }
            },
            onRating: (slogan, rating) => this.handleRating(slogan, rating)
        });
    }
    
    handleExportResults() {
        if (this.currentSlogans.length === 0) {
            uiManager.showToast('暂无生成结果可导出', 'warning');
            return;
        }
        
        let content = '=== 生成结果 ===\n\n';
        this.currentSlogans.forEach((slogan, index) => {
            content += `${index + 1}. ${slogan.text}\n`;
            content += `   风格: ${slogan.style}\n`;
            if (slogan.industry) {
                content += `   行业: ${slogan.industry}\n`;
            }
            if (slogan.rating) {
                content += `   评分: ${slogan.rating}\n`;
            }
            content += '\n';
        });
        
        sloganGenerator.downloadAsText(content, `slogans_${Date.now()}.txt`);
        uiManager.showToast('导出成功', 'success');
    }
}

const app = new App();

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

export default app;
