const Share = {
    currentGifts: [],
    currentSelections: {},
    shareUrl: '',

    init() {
        this.bindEvents();
        this.checkUrlParams();
    },

    bindEvents() {
        Utils.$('#share-btn')?.addEventListener('click', () => {
            this.showShareModal();
        });

        Utils.$('#share-modal-close')?.addEventListener('click', () => {
            this.hideShareModal();
        });

        Utils.$('#share-copy-link')?.addEventListener('click', () => {
            this.copyShareLink();
        });

        Utils.$('#share-copy-text')?.addEventListener('click', () => {
            this.copyShareText();
        });

        Utils.$('#share-generate-image')?.addEventListener('click', () => {
            this.generateShareImage();
        });

        Utils.$('#copy-link-btn')?.addEventListener('click', () => {
            this.copyShareLink();
        });

        Utils.$('#download-image-btn')?.addEventListener('click', () => {
            this.downloadShareImage();
        });
    },

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareData = urlParams.get('s');
        
        if (shareData) {
            try {
                const decoded = this.decodeParams(shareData);
                if (decoded) {
                    console.log('📦 从URL加载分享数据:', decoded);
                    this.applyShareParams(decoded);
                }
            } catch (e) {
                console.warn('解析分享参数失败:', e);
            }
        }
    },

    encodeParams(selections) {
        const data = {
            r: selections.relationship || '',
            g: selections.gender || 'any',
            a: selections.age || '',
            b: selections.budget || '',
            i: selections.interests || [],
            o: selections.occasion || ''
        };
        
        const jsonStr = JSON.stringify(data);
        return btoa(encodeURIComponent(jsonStr));
    },

    decodeParams(encoded) {
        try {
            const decoded = decodeURIComponent(atob(encoded));
            const data = JSON.parse(decoded);
            
            return {
                relationship: data.r || '',
                gender: data.g || 'any',
                age: data.a || '',
                budget: data.b || '',
                interests: data.i || [],
                occasion: data.o || ''
            };
        } catch (e) {
            return null;
        }
    },

    applyShareParams(params) {
        UI.selections = {
            relationship: params.relationship || '',
            gender: params.gender || 'any',
            age: params.age || '',
            budget: params.budget || '',
            interests: params.interests || [],
            occasion: params.occasion || ''
        };
        
        UI.applySelections();
        UI.saveSelections();
        
        setTimeout(() => {
            UI.showToast('已加载分享的推荐条件，点击开始推荐查看礼物', 'info');
        }, 500);
    },

    showShareModal() {
        if (UI.currentRecommendations.length === 0) {
            UI.showToast('请先获取推荐结果', 'warning');
            return;
        }

        this.currentGifts = UI.currentRecommendations.slice(0, 6);
        this.currentSelections = { ...UI.selections };
        
        this.renderSharePreview();
        this.generateShareUrl();
        
        Utils.$('#share-link-section')?.classList.remove('hidden');
        Utils.$('#share-image-section')?.classList.add('hidden');
        
        this.setActiveShareMethod('link');
        UI.showModal('share-modal');
    },

    hideShareModal() {
        UI.hideModal('share-modal');
    },

    renderSharePreview() {
        const infoContainer = Utils.$('#share-preview-info');
        const giftsContainer = Utils.$('#share-preview-gifts');
        
        if (!infoContainer || !giftsContainer) return;

        const tags = [];
        if (this.currentSelections.relationship) {
            tags.push(Config.getLabel('relationship', this.currentSelections.relationship));
        }
        if (this.currentSelections.gender && this.currentSelections.gender !== 'any') {
            tags.push(Config.getLabel('gender', this.currentSelections.gender));
        }
        if (this.currentSelections.age) {
            tags.push(Config.getLabel('age', this.currentSelections.age));
        }
        if (this.currentSelections.budget) {
            tags.push(Config.getLabel('budget', this.currentSelections.budget));
        }
        if (this.currentSelections.interests && this.currentSelections.interests.length > 0) {
            this.currentSelections.interests.forEach(i => {
                tags.push(Config.getLabel('interest', i));
            });
        }
        if (this.currentSelections.occasion) {
            tags.push(Config.getLabel('occasion', this.currentSelections.occasion));
        }

        infoContainer.innerHTML = tags.map(tag => 
            `<span class="share-preview-tag">${tag}</span>`
        ).join('');

        giftsContainer.innerHTML = this.currentGifts.map(gift => {
            const icon = Config.CATEGORY_ICONS[gift.category] || '🎁';
            return `
                <div class="share-preview-gift">
                    <span class="share-preview-gift-icon">${icon}</span>
                    <div class="share-preview-gift-info">
                        <div class="share-preview-gift-name">${gift.name}</div>
                        <div class="share-preview-gift-price">${Utils.formatPrice(gift.price)}</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    generateShareUrl() {
        const encoded = this.encodeParams(this.currentSelections);
        const baseUrl = window.location.origin + window.location.pathname;
        this.shareUrl = `${baseUrl}?s=${encoded}`;
        
        const input = Utils.$('#share-link-input');
        if (input) {
            input.value = this.shareUrl;
        }
        
        return this.shareUrl;
    },

    async copyShareLink() {
        try {
            await navigator.clipboard.writeText(this.shareUrl);
            UI.showToast('链接已复制到剪贴板', 'success');
            this.setActiveShareMethod('link');
        } catch (e) {
            const input = Utils.$('#share-link-input');
            if (input) {
                input.select();
                document.execCommand('copy');
                UI.showToast('链接已复制到剪贴板', 'success');
            } else {
                UI.showToast('复制失败，请手动复制', 'error');
            }
        }
    },

    generateShareText() {
        const lines = [];
        lines.push('🎁 为你精选的礼物推荐');
        lines.push('');

        const tags = [];
        if (this.currentSelections.relationship) {
            tags.push(Config.getLabel('relationship', this.currentSelections.relationship));
        }
        if (this.currentSelections.gender && this.currentSelections.gender !== 'any') {
            tags.push(Config.getLabel('gender', this.currentSelections.gender));
        }
        if (this.currentSelections.age) {
            tags.push(Config.getLabel('age', this.currentSelections.age));
        }
        if (this.currentSelections.budget) {
            tags.push(Config.getLabel('budget', this.currentSelections.budget));
        }
        
        if (tags.length > 0) {
            lines.push(`📍 ${tags.join(' · ')}`);
            lines.push('');
        }

        this.currentGifts.forEach((gift, index) => {
            const icon = Config.CATEGORY_ICONS[gift.category] || '🎁';
            lines.push(`${index + 1}. ${icon} ${gift.name}`);
            lines.push(`   ${Utils.formatPrice(gift.price)}`);
            if (gift.brand) {
                lines.push(`   ${gift.brand}`);
            }
            lines.push('');
        });

        lines.push('━━━━━━━━━━━━━━━━━━━━');
        lines.push('🔗 查看完整推荐:');
        lines.push(this.shareUrl);

        return lines.join('\n');
    },

    async copyShareText() {
        const text = this.generateShareText();
        this.setActiveShareMethod('text');
        
        try {
            await navigator.clipboard.writeText(text);
            UI.showToast('文字已复制到剪贴板', 'success');
        } catch (e) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            UI.showToast('文字已复制到剪贴板', 'success');
        }
    },

    setActiveShareMethod(method) {
        Utils.$$('.share-method-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        if (method === 'link') {
            Utils.$('#share-copy-link')?.classList.add('active');
            Utils.$('#share-link-section')?.classList.remove('hidden');
            Utils.$('#share-image-section')?.classList.add('hidden');
        } else if (method === 'text') {
            Utils.$('#share-copy-text')?.classList.add('active');
            Utils.$('#share-link-section')?.classList.add('hidden');
            Utils.$('#share-image-section')?.classList.add('hidden');
        } else if (method === 'image') {
            Utils.$('#share-generate-image')?.classList.add('active');
            Utils.$('#share-link-section')?.classList.add('hidden');
            Utils.$('#share-image-section')?.classList.remove('hidden');
        }
    },

    generateShareImage() {
        this.setActiveShareMethod('image');
        
        const canvas = Utils.$('#share-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = 600;
        const height = 800;
        
        canvas.width = width;
        canvas.height = height;

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#FFF8E7');
        gradient.addColorStop(1, '#FFF3E0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#FF8A65';
        ctx.fillRect(0, 0, width, 10);

        ctx.fillStyle = '#FF8A65';
        ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎁 礼物推荐器', width / 2, 60);

        ctx.fillStyle = '#757575';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('为你精选的礼物推荐', width / 2, 85);

        const tags = [];
        if (this.currentSelections.relationship) {
            tags.push(Config.getLabel('relationship', this.currentSelections.relationship));
        }
        if (this.currentSelections.gender && this.currentSelections.gender !== 'any') {
            tags.push(Config.getLabel('gender', this.currentSelections.gender));
        }
        if (this.currentSelections.age) {
            tags.push(Config.getLabel('age', this.currentSelections.age));
        }
        if (this.currentSelections.budget) {
            tags.push(Config.getLabel('budget', this.currentSelections.budget));
        }

        const tagStr = tags.join(' · ');
        if (tagStr) {
            ctx.fillStyle = '#FFF3E0';
            this.roundRect(ctx, width / 2 - ctx.measureText(tagStr).width / 2 - 20, 100, 
                ctx.measureText(tagStr).width + 40, 32, 16);
            ctx.fill();
            
            ctx.fillStyle = '#FF8A65';
            ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillText(tagStr, width / 2, 122);
        }

        this.currentGifts.forEach((gift, index) => {
            const y = 160 + index * 100;
            
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = 'rgba(255, 138, 101, 0.15)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 4;
            this.roundRect(ctx, 30, y, width - 60, 80, 12);
            ctx.fill();
            ctx.shadowColor = 'transparent';

            const icon = Config.CATEGORY_ICONS[gift.category] || '🎁';
            ctx.fillStyle = '#FF8A65';
            ctx.font = '36px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(icon, 50, y + 52);

            ctx.fillStyle = '#4A4A4A';
            ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillText(gift.name, 110, y + 40);

            ctx.fillStyle = '#FF8A65';
            ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillText(Utils.formatPrice(gift.price), 110, y + 65);

            if (gift.brand) {
                ctx.fillStyle = '#9E9E9E';
                ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
                ctx.fillText(gift.brand, 200, y + 67);
            }
        });

        ctx.fillStyle = '#FFE0B2';
        ctx.fillRect(30, height - 80, width - 60, 1);

        ctx.fillStyle = '#757575';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('扫码或打开链接查看完整推荐', width / 2, height - 55);
        
        ctx.fillStyle = '#FF8A65';
        ctx.font = '12px monospace';
        ctx.fillText(window.location.origin + window.location.pathname, width / 2, height - 35);

        UI.showToast('图片已生成，点击下载保存', 'success');
    },

    roundRect(ctx, x, y, width, height, radius) {
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
    },

    downloadShareImage() {
        const canvas = Utils.$('#share-canvas');
        if (!canvas) {
            this.generateShareImage();
            return;
        }

        const link = document.createElement('a');
        link.download = `礼物推荐_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        UI.showToast('图片已下载', 'success');
    }
};

window.Share = Share;
