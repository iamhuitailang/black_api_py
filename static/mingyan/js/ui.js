import { styleTemplates, industryData } from './data.js';

class UIManager {
    constructor() {
        this.elements = {};
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
    }
    
    init() {
        this.cacheElements();
        this.initCanvas();
        this.bindEvents();
        this.loadSettings();
    }
    
    cacheElements() {
        this.elements = {
            keywordsInput: document.getElementById('keywords'),
            generateBtn: document.getElementById('generate-btn'),
            refreshBtn: document.getElementById('refresh-btn'),
            styleOptions: document.getElementById('style-options'),
            industryOptions: document.getElementById('industry-options'),
            lengthOptions: document.getElementById('length-options'),
            slogansContainer: document.getElementById('slogans-container'),
            exportResultsBtn: document.getElementById('export-results-btn'),
            tabBtns: document.querySelectorAll('.tab-btn'),
            historyContent: document.getElementById('history-content'),
            favoritesContent: document.getElementById('favorites-content')
        };
    }
    
    initCanvas() {
        this.canvas = document.getElementById('canvas-bg');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.createParticles();
        this.animate();
    }
    
    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        this.particles = [];
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    animate() {
        if (!this.ctx || !this.canvas) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.speedX *= -1;
            }
            if (particle.y < 0 || particle.y > this.canvas.height) {
                particle.speedY *= -1;
            }
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(102, 126, 234, ${particle.opacity})`;
            this.ctx.fill();
        });
        
        this.particles.forEach((p1, i) => {
            this.particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(102, 126, 234, ${0.1 * (1 - distance / 100)})`;
                    this.ctx.stroke();
                }
            });
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    bindEvents() {
        this.elements.styleOptions.addEventListener('click', (e) => {
            if (e.target.classList.contains('option-btn')) {
                this.selectOption(this.elements.styleOptions, e.target);
            }
        });
        
        this.elements.industryOptions.addEventListener('click', (e) => {
            if (e.target.classList.contains('option-btn')) {
                this.toggleOption(this.elements.industryOptions, e.target);
            }
        });
        
        this.elements.lengthOptions.addEventListener('click', (e) => {
            if (e.target.classList.contains('option-btn')) {
                this.selectOption(this.elements.lengthOptions, e.target);
            }
        });
        
        this.elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn);
            });
        });
        
        this.elements.keywordsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.elements.generateBtn.click();
            }
        });
    }
    
    selectOption(container, targetBtn) {
        container.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        targetBtn.classList.add('active');
    }
    
    toggleOption(container, targetBtn) {
        const isActive = targetBtn.classList.contains('active');
        container.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        if (!isActive) {
            targetBtn.classList.add('active');
        }
    }
    
    switchTab(targetBtn) {
        this.elements.tabBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        targetBtn.classList.add('active');
        
        const tab = targetBtn.dataset.tab;
        if (tab === 'history') {
            this.elements.historyContent.classList.remove('hidden');
            this.elements.favoritesContent.classList.add('hidden');
        } else {
            this.elements.historyContent.classList.add('hidden');
            this.elements.favoritesContent.classList.remove('hidden');
        }
    }
    
    getSelectedOptions() {
        const styleBtn = this.elements.styleOptions.querySelector('.option-btn.active');
        const industryBtn = this.elements.industryOptions.querySelector('.option-btn.active');
        const lengthBtn = this.elements.lengthOptions.querySelector('.option-btn.active');
        
        return {
            style: styleBtn ? styleBtn.dataset.style : 'simple',
            industry: industryBtn ? industryBtn.dataset.industry : null,
            length: lengthBtn ? lengthBtn.dataset.length : 'medium'
        };
    }
    
    loadSettings() {
    }
    
    renderSlogans(slogans, onActions) {
        const { onCopy, onFavorite, onRating, onGenerateImage } = onActions;
        
        if (slogans.length === 0) {
            this.elements.slogansContainer.innerHTML = `
                <div class="empty-state">
                    <p>暂无生成结果</p>
                </div>
            `;
            return;
        }
        
        this.elements.slogansContainer.innerHTML = slogans.map(slogan => {
            const isFav = slogan.isFavorite || false;
            return `
                <div class="slogan-card" data-id="${slogan.id}">
                    <div class="slogan-text">${slogan.text}</div>
                    <div class="slogan-meta">
                        <span class="style-tag">${slogan.style}</span>
                        ${slogan.industry ? `<span class="industry-tag">${slogan.industry}</span>` : ''}
                    </div>
                    <div class="slogan-actions">
                        <button class="action-btn copy-btn" title="复制">
                            <span>📋</span> 复制
                        </button>
                        <button class="action-btn favorite-btn ${isFav ? 'active' : ''}" title="${isFav ? '取消收藏' : '收藏'}">
                            <span>${isFav ? '❤️' : '🤍'}</span> ${isFav ? '已收藏' : '收藏'}
                        </button>
                        <button class="action-btn image-btn" title="生成图片">
                            <span>🖼️</span> 生成图片
                        </button>
                        <div class="rating-group">
                            <button class="rating-btn good" data-rating="好" title="好">👍</button>
                            <button class="rating-btn medium" data-rating="一般" title="一般">😐</button>
                            <button class="rating-btn bad" data-rating="差" title="差">👎</button>
                        </div>
                    </div>
                    ${slogan.rating ? `<div class="rating-badge">评分: ${slogan.rating}</div>` : ''}
                </div>
            `;
        }).join('');
        
        this.elements.slogansContainer.querySelectorAll('.slogan-card').forEach(card => {
            const id = card.dataset.id;
            const slogan = slogans.find(s => s.id == id);
            
            card.querySelector('.copy-btn').addEventListener('click', () => {
                onCopy && onCopy(slogan);
            });
            
            card.querySelector('.favorite-btn').addEventListener('click', () => {
                onFavorite && onFavorite(slogan);
            });
            
            card.querySelector('.image-btn').addEventListener('click', () => {
                onGenerateImage && onGenerateImage(slogan);
            });
            
            card.querySelectorAll('.rating-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const rating = btn.dataset.rating;
                    onRating && onRating(slogan, rating);
                });
            });
        });
    }
    
    renderHistory(historyList, onActions) {
        const { onCopy, onFavorite, onRating } = onActions;
        
        if (historyList.length === 0) {
            this.elements.historyContent.innerHTML = `
                <div class="empty-state">
                    <p>暂无生成历史</p>
                </div>
            `;
            return;
        }
        
        this.elements.historyContent.innerHTML = historyList.map(item => {
            const date = new Date(item.createdAt).toLocaleString();
            return `
                <div class="history-item">
                    <div class="history-header">
                        <div class="history-info">
                            <span class="keywords">关键词: ${item.keywords}</span>
                            <span class="style">风格: ${styleTemplates[item.style]?.name || item.style}</span>
                            ${item.industry ? `<span class="industry">行业: ${industryData[item.industry]?.name || item.industry}</span>` : ''}
                        </div>
                        <span class="date">${date}</span>
                    </div>
                    <div class="history-slogans">
                        ${item.slogans.map(slogan => `
                            <div class="history-slogan">
                                <span class="text">${slogan.text}</span>
                                <div class="mini-actions">
                                    <button class="mini-btn copy-btn" data-text="${slogan.text}" title="复制">📋</button>
                                    <button class="mini-btn fav-btn" data-id="${slogan.id}" data-text="${slogan.text}" data-keywords="${item.keywords}" data-style="${item.style}" title="收藏">🤍</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
        
        this.elements.historyContent.querySelectorAll('.history-slogan .copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                onCopy && onCopy({ text: btn.dataset.text });
            });
        });
        
        this.elements.historyContent.querySelectorAll('.history-slogan .fav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const slogan = {
                    id: parseFloat(btn.dataset.id),
                    text: btn.dataset.text,
                    keywords: btn.dataset.keywords,
                    style: btn.dataset.style
                };
                onFavorite && onFavorite(slogan);
            });
        });
    }
    
    renderFavorites(favoritesList, onActions) {
        const { onCopy, onRemoveFavorite, onRating } = onActions;
        
        if (favoritesList.length === 0) {
            this.elements.favoritesContent.innerHTML = `
                <div class="empty-state">
                    <p>暂无收藏内容</p>
                </div>
            `;
            return;
        }
        
        this.elements.favoritesContent.innerHTML = favoritesList.map(item => {
            const date = new Date(item.createdAt).toLocaleString();
            return `
                <div class="favorite-item" data-id="${item.id}">
                    <div class="favorite-text">${item.text}</div>
                    <div class="favorite-meta">
                        <span>关键词: ${item.keywords}</span>
                        <span>风格: ${item.style}</span>
                        <span>收藏时间: ${date}</span>
                    </div>
                    <div class="favorite-actions">
                        <button class="action-btn copy-btn" title="复制">📋 复制</button>
                        <button class="action-btn remove-btn" title="取消收藏">🗑️ 取消收藏</button>
                        ${item.rating ? `<span class="rating-display">评分: ${item.rating}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        this.elements.favoritesContent.querySelectorAll('.favorite-item').forEach(item => {
            const id = parseFloat(item.dataset.id);
            const favorite = favoritesList.find(f => f.id === id);
            
            item.querySelector('.copy-btn').addEventListener('click', () => {
                onCopy && onCopy(favorite);
            });
            
            item.querySelector('.remove-btn').addEventListener('click', () => {
                onRemoveFavorite && onRemoveFavorite(favorite);
            });
        });
    }
    
    showToast(message, type = 'success') {
        const existing = document.querySelector('.toast');
        if (existing) {
            existing.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        toast.offsetHeight;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
    
    setGenerateButtonLoading(loading) {
        if (loading) {
            this.elements.generateBtn.disabled = true;
            this.elements.generateBtn.innerHTML = '生成中...';
        } else {
            this.elements.generateBtn.disabled = false;
            this.elements.generateBtn.innerHTML = '一键生成';
        }
    }
    
    enableRefreshButton(enable) {
        this.elements.refreshBtn.disabled = !enable;
    }
    
    createImageModal(slogan, templates, onGenerate, onDownload, onClose) {
        const existingModal = document.querySelector('.image-modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'image-modal-overlay';
        modal.innerHTML = `
            <div class="image-modal">
                <div class="modal-header">
                    <h3>生成名言图片</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-content">
                    <div class="slogan-preview">
                        <p class="preview-text">${slogan.text}</p>
                        ${slogan.keywords ? `<p class="preview-meta">关键词: ${slogan.keywords}</p>` : ''}
                        ${slogan.style ? `<p class="preview-meta">风格: ${slogan.style}</p>` : ''}
                    </div>
                    <div class="template-selector">
                        <label>选择样式模板</label>
                        <div class="template-grid">
                            ${Object.entries(templates).map(([key, template], index) => `
                                <div class="template-option ${index === 0 ? 'active' : ''}" data-template="${key}">
                                    <div class="template-preview" style="background: linear-gradient(135deg, ${template.bgGradient[0]} 0%, ${template.bgGradient[1]} 100%);">
                                        <span class="template-text">"${slogan.text.substring(0, 8)}..."</span>
                                    </div>
                                    <span class="template-name">${template.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="image-preview-container">
                        <label>图片预览</label>
                        <div class="image-preview">
                            <img id="preview-image" src="" alt="预览" class="loading">
                            <div class="loading-indicator">生成中...</div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="secondary-btn cancel-btn">取消</button>
                    <button class="primary-btn download-btn" disabled>下载图片</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        let selectedTemplate = Object.keys(templates)[0];
        let currentDataUrl = null;
        
        const templateOptions = modal.querySelectorAll('.template-option');
        templateOptions.forEach(option => {
            option.addEventListener('click', () => {
                templateOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                selectedTemplate = option.dataset.template;
                
                const previewImg = modal.querySelector('#preview-image');
                const loadingIndicator = modal.querySelector('.loading-indicator');
                const downloadBtn = modal.querySelector('.download-btn');
                
                previewImg.classList.add('loading');
                loadingIndicator.style.display = 'block';
                downloadBtn.disabled = true;
                
                setTimeout(() => {
                    const dataUrl = onGenerate(slogan, selectedTemplate);
                    if (dataUrl) {
                        currentDataUrl = dataUrl;
                        previewImg.src = dataUrl;
                        previewImg.classList.remove('loading');
                        loadingIndicator.style.display = 'none';
                        downloadBtn.disabled = false;
                    }
                }, 100);
            });
        });
        
        const initialDataUrl = onGenerate(slogan, selectedTemplate);
        if (initialDataUrl) {
            currentDataUrl = initialDataUrl;
            const previewImg = modal.querySelector('#preview-image');
            const loadingIndicator = modal.querySelector('.loading-indicator');
            const downloadBtn = modal.querySelector('.download-btn');
            
            previewImg.src = initialDataUrl;
            previewImg.classList.remove('loading');
            loadingIndicator.style.display = 'none';
            downloadBtn.disabled = false;
        }
        
        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            modal.remove();
            document.body.style.overflow = '';
            onClose && onClose();
        });
        
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.remove();
            document.body.style.overflow = '';
            onClose && onClose();
        });
        
        modal.querySelector('.download-btn').addEventListener('click', () => {
            if (currentDataUrl) {
                onDownload(currentDataUrl, slogan);
                modal.remove();
                document.body.style.overflow = '';
            }
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.style.overflow = '';
                onClose && onClose();
            }
        });
        
        return modal;
    }
}

export const uiManager = new UIManager();
