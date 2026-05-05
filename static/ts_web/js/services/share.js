const ShareService = {
    user: null,
    record: null,
    type: null,
    canvas: null,
    imageDataURL: null,
    modal: null,

    showShareModal(options) {
        this.user = options.user || {};
        this.record = options.record || null;
        this.type = options.type || 'profile';
        this.imageDataURL = null;

        this.createModal();
        this.initPreview();
    },

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'share-modal-overlay';

        this.modal.innerHTML = `
            <div class="share-modal">
                <div class="share-modal-header">
                    <div class="share-modal-title">分享战绩</div>
                    <button class="share-modal-close" data-action="close">×</button>
                </div>

                <div class="share-modal-preview">
                    <div class="share-preview-loading" id="share-preview-loading">
                        <div class="share-preview-logo">🏃</div>
                        <div class="share-preview-text">生成分享图片中...</div>
                    </div>
                    <img id="share-preview-img" style="display: none; max-width: 240px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                    <canvas id="share-canvas" style="display: none;"></canvas>
                </div>

                <div class="share-modal-actions">
                    <button class="share-action-btn" data-action="share">
                        <div class="share-action-icon">📤</div>
                        <div class="share-action-text">分享</div>
                    </button>
                    <button class="share-action-btn" data-action="copy">
                        <div class="share-action-icon">📋</div>
                        <div class="share-action-text">复制</div>
                    </button>
                    <button class="share-action-btn" data-action="image">
                        <div class="share-action-icon">💾</div>
                        <div class="share-action-text">保存</div>
                    </button>
                </div>

                <div class="share-modal-tip">
                    💡 保存图片后可分享到微信、朋友圈等平台
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.bindEvents();
    },

    bindEvents() {
        this.modal.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;

            if (action === 'close' || e.target === this.modal) {
                this.close();
                return;
            }

            if (action === 'share') {
                this.doShare();
            } else if (action === 'copy') {
                this.doCopy();
            } else if (action === 'image') {
                this.doSaveImage();
            }
        });
    },

    async initPreview() {
        try {
            const canvas = document.getElementById('share-canvas');
            await this.generateShareImage(canvas, {
                user: this.user,
                record: this.record,
                type: this.type
            });

            this.imageDataURL = canvas.toDataURL('image/png');

            const loadingEl = document.getElementById('share-preview-loading');
            const imgEl = document.getElementById('share-preview-img');

            if (loadingEl) loadingEl.style.display = 'none';
            if (imgEl) {
                imgEl.src = this.imageDataURL;
                imgEl.style.display = 'block';
            }
        } catch (error) {
            console.error('Generate preview error:', error);
            const loadingEl = document.getElementById('share-preview-loading');
            if (loadingEl) {
                loadingEl.innerHTML = `
                    <div class="share-preview-logo">❌</div>
                    <div class="share-preview-text">图片生成失败</div>
                `;
            }
        }
    },

    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    },

    getShareText() {
        const user = this.user;
        if (this.type === 'record' && this.record) {
            const count = this.record.count || 0;
            const calories = this.record.calories || 0;
            return {
                title: `${user.nickname || '用户'} 完成了 ${count} 次跳绳！`,
                text: `🏃 我在「跃动人生」完成了 ${count} 次跳绳，消耗了 ${calories.toFixed(0)} kcal！来和我一起运动吧！`
            };
        } else {
            return {
                title: `${user.nickname || '用户'} 的运动战绩`,
                text: `🏃 我在「跃动人生」累计跳绳 ${Utils.formatNumber(user.total_count || 0)} 次，连续打卡 ${user.streak_days || 0} 天，消耗 ${(user.total_calories || 0).toFixed(0)} kcal！来和我一起运动吧！`
            };
        }
    },

    async doShare() {
        const { title, text } = this.getShareText();

        if (navigator.share) {
            try {
                if (this.imageDataURL && navigator.canShare) {
                    try {
                        const blob = await this.dataURLToBlob(this.imageDataURL);
                        const file = new File([blob], 'share.png', { type: 'image/png' });

                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                title: title,
                                text: text,
                                files: [file]
                            });
                            Utils.showToast('分享成功');
                            this.close();
                            return;
                        }
                    } catch (e) {
                        console.log('Share with file failed, try text only');
                    }
                }

                await navigator.share({
                    title: title,
                    text: text
                });
                Utils.showToast('分享成功');
                this.close();
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Share error:', error);
                    Utils.showToast('分享失败，请尝试复制或保存图片');
                }
            }
        } else {
            Utils.showToast('您的浏览器不支持直接分享，请复制文案或保存图片');
        }
    },

    async doCopy() {
        const { text } = this.getShareText();

        try {
            await navigator.clipboard.writeText(text);
            Utils.showToast('文案已复制');
        } catch (error) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            textarea.style.top = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();

            try {
                document.execCommand('copy');
                Utils.showToast('文案已复制');
            } catch (e) {
                Utils.showToast('复制失败，请手动复制');
            }

            document.body.removeChild(textarea);
        }
    },

    async doSaveImage() {
        if (!this.imageDataURL) {
            Utils.showToast('图片正在生成中，请稍候');
            return;
        }

        try {
            const link = document.createElement('a');
            link.download = `跃动人生_${Utils.formatDate(new Date(), 'YYYYMMDD')}_${Date.now()}.png`;
            link.href = this.imageDataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            Utils.showToast('图片已保存');
        } catch (error) {
            console.error('Save image error:', error);

            try {
                window.open(this.imageDataURL, '_blank');
                Utils.showToast('图片已在新窗口打开');
            } catch (e) {
                Utils.showToast('保存失败，请长按图片保存');
            }
        }
    },

    async dataURLToBlob(dataURL) {
        return new Promise((resolve) => {
            const arr = dataURL.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            resolve(new Blob([u8arr], { type: mime }));
        });
    },

    async generateShareImage(canvas, data) {
        const ctx = canvas.getContext('2d');
        const width = 600;
        const height = 900;

        canvas.width = width;
        canvas.height = height;

        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(0.5, '#8b5cf6');
        gradient.addColorStop(1, '#a855f7');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 40 + 20;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#ffffff';
        this.roundRect(ctx, 40, 40, width - 80, height - 80, 20);
        ctx.fill();

        ctx.fillStyle = '#6366f1';
        this.roundRect(ctx, 40, 40, width - 80, 140, [20, 20, 0, 0]);
        ctx.fill();

        ctx.font = 'bold 44px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('🏃 跃动人生', width / 2, 125);

        ctx.font = '18px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText('记录每一次跳跃，遇见更好的自己', width / 2, 160);

        const user = data.user || {};
        const nickname = user.nickname || '用户';

        ctx.font = 'bold 26px Arial';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'left';
        ctx.fillText(nickname, 70, 250);

        ctx.font = '16px Arial';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`总计: ${Utils.formatNumber(user.total_count || 0)} 次`, 70, 280);

        if (data.type === 'record' && data.record) {
            const record = data.record;
            const count = record.count || 0;
            const calories = record.calories || 0;

            ctx.fillStyle = '#f0fdf4';
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            this.roundRect(ctx, 70, 320, width - 140, 180, 16);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#065f46';
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🎉 完成训练！', width / 2, 380);

            ctx.font = 'bold 42px Arial';
            ctx.fillStyle = '#10b981';
            ctx.textAlign = 'left';
            ctx.fillText(`${Utils.formatNumber(count)} 个`, 100, 450);

            ctx.font = '18px Arial';
            ctx.fillStyle = '#059669';
            ctx.fillText(`消耗 ${calories.toFixed(0)} kcal`, width - 200, 450);

        } else {
            const stats = [
                { label: '总次数', value: Utils.formatNumber(user.total_count || 0), icon: '🏃', color: '#6366f1' },
                { label: '连续打卡', value: `${user.streak_days || 0} 天`, icon: '🔥', color: '#f59e0b' },
                { label: '消耗卡路里', value: `${(user.total_calories || 0).toFixed(0)} kcal`, icon: '💪', color: '#10b981' }
            ];

            stats.forEach((stat, index) => {
                const y = 320 + index * 150;

                ctx.fillStyle = '#f8fafc';
                ctx.strokeStyle = '#e2e8f0';
                ctx.lineWidth = 2;
                this.roundRect(ctx, 70, y, width - 140, 120, 12);
                ctx.fill();
                ctx.stroke();

                ctx.font = '36px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(stat.icon, 100, y + 82);

                ctx.font = 'bold 26px Arial';
                ctx.fillStyle = stat.color;
                ctx.textAlign = 'right';
                ctx.fillText(stat.value, width - 100, y + 82);

                ctx.font = '14px Arial';
                ctx.fillStyle = '#94a3b8';
                ctx.fillText(stat.label, width - 100, y + 105);
            });
        }

        ctx.fillStyle = '#f1f5f9';
        this.roundRect(ctx, 40, height - 160, width - 80, 80, [0, 0, 20, 20]);
        ctx.fill();

        ctx.fillStyle = '#334155';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('扫码下载「跃动人生」一起运动', width / 2, height - 115);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Arial';
        ctx.fillText('记录每一次跳跃，遇见更好的自己', width / 2, height - 90);

        return canvas;
    },

    roundRect(ctx, x, y, width, height, radius) {
        const r = typeof radius === 'number' ? radius : 0;
        const radii = Array.isArray(radius) ? radius : [r, r, r, r];
        const [tl, tr, br, bl] = radii;

        ctx.beginPath();
        ctx.moveTo(x + tl, y);
        ctx.lineTo(x + width - tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + tr);
        ctx.lineTo(x + width, y + height - br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - br, y + height);
        ctx.lineTo(x + bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - bl);
        ctx.lineTo(x, y + tl);
        ctx.quadraticCurveTo(x, y, x + tl, y);
        ctx.closePath();
    }
};

window.ShareService = ShareService;
