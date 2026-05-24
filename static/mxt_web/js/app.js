const App = {
    state: {
        jobs: [],
        hotJobs: [],
        welfares: [],
        currentJob: null,
        currentApplication: null,
        currentCard: null,
        userKey: localStorage.getItem('mxt_user_key') || 'user_' + Math.random().toString(36).substr(2, 9),
        coinBalance: 0,
        coinConfig: {},
        isSubmitting: false,
        isSharing: false,
        isGeneratingCard: false,
        typeWriterTimer: null
    },

    init() {
        localStorage.setItem('mxt_user_key', this.state.userKey);
        this.loadData();
        this.bindStaticEvents();
        this.checkDailyLogin();
    },

    async loadData() {
        try {
            const result = await ApiService.getHome();
            if (result.code === 0) {
                this.state.jobs = result.data.jobs || [];
                this.state.hotJobs = result.data.hot_jobs?.jobs || [];
                this.state.welfares = result.data.welfares || [];
                this.state.coinConfig = result.data.coin_config || {};
                this.renderJobs();
                this.renderHotJobs();
                this.renderWelfares();
                this.updateRefreshButton();
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            this.showToast('加载数据失败', 'error');
        }
        this.loadCoins();
    },

    async loadCoins() {
        try {
            const result = await ApiService.getUserCoins(this.state.userKey);
            if (result.code === 0) {
                this.state.coinBalance = result.data.balance || 0;
                this.updateCoinDisplay();
            }
        } catch (error) {
            console.error('加载金币失败:', error);
        }
    },

    updateCoinDisplay() {
        const coinElement = document.getElementById('coinBalance');
        if (coinElement) {
            coinElement.textContent = this.state.coinBalance;
            coinElement.style.animation = 'none';
            setTimeout(() => {
                coinElement.style.animation = 'coin-spin 0.5s ease';
            }, 10);
        }
    },

    updateRefreshButton() {
        const btn = document.getElementById('refreshHotBtn');
        if (btn && this.state.coinConfig.refresh_hot) {
            btn.textContent = `🔄 刷新今日推荐 (${this.state.coinConfig.refresh_hot}金币)`;
        }
    },

    renderJobs() {
        const container = document.getElementById('jobsContainer');
        if (!container) return;

        const hotJobIds = (this.state.hotJobs || []).map(j => j.id);

        container.innerHTML = this.state.jobs.map(job => {
            const isHot = hotJobIds.includes(job.id);
            return `
                <div class="job-card" data-id="${job.id}">
                    ${isHot ? '<span class="hot-badge">🔥急招</span>' : ''}
                    <div class="job-icon">${job.icon}</div>
                    <h3 class="job-name">${job.name}</h3>
                    <p class="job-desc">${job.description}</p>
                    <p class="job-req">🎭 ${job.requirements}</p>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.job-card').forEach(card => {
            card.addEventListener('click', () => {
                const jobId = parseInt(card.dataset.id);
                SoundManager.playClick();
                this.openJobModal(jobId);
            });
        });
    },

    renderHotJobs() {
        const container = document.getElementById('hotJobsContainer');
        if (!container) return;

        container.innerHTML = this.state.hotJobs.map(job => `
            <div class="hot-job-card" data-id="${job.id}">
                <span class="hot-badge">🔥</span>
                <div class="job-icon">${job.icon}</div>
                <h3 class="job-name">${job.name}</h3>
            </div>
        `).join('');

        container.querySelectorAll('.hot-job-card').forEach(card => {
            card.addEventListener('click', () => {
                const jobId = parseInt(card.dataset.id);
                SoundManager.playClick();
                this.openJobModal(jobId);
            });
        });
    },

    renderWelfares() {
        const container = document.getElementById('welfareContainer');
        if (!container) return;

        container.innerHTML = this.state.welfares.map(welfare => `
            <div class="welfare-card">
                <div class="welfare-icon">${welfare.icon}</div>
                <h3 class="welfare-title">${welfare.title}</h3>
                <p class="welfare-desc">${welfare.description}</p>
            </div>
        `).join('');
    },

    bindStaticEvents() {
        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                SoundManager.playClick();
                this.closeJobModal();
            });
        }

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                SoundManager.playClick();
                this.closeJobModal();
            });
        }

        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!this.state.isSubmitting) {
                    this.submitApplication();
                }
            });
        }

        const fakeUploadBtn = document.getElementById('fakeUploadBtn');
        if (fakeUploadBtn) {
            fakeUploadBtn.addEventListener('click', () => {
                this.showFakeUpload();
            });
        }

        const urgentApply = document.getElementById('urgentApply');
        if (urgentApply) {
            urgentApply.addEventListener('change', () => {
                SoundManager.playClick();
            });
        }

        const applicantAge = document.getElementById('applicantAge');
        if (applicantAge) {
            applicantAge.addEventListener('input', (e) => {
                const display = document.getElementById('ageDisplay');
                if (display) display.textContent = e.target.value;
            });
        }

        const applicantReason = document.getElementById('applicantReason');
        if (applicantReason) {
            applicantReason.addEventListener('input', (e) => {
                const count = document.getElementById('charCount');
                if (count) count.textContent = `${e.target.value.length}/100`;
            });
        }

        const resultClose = document.getElementById('resultClose');
        if (resultClose) {
            resultClose.addEventListener('click', () => {
                SoundManager.playClick();
                this.closeResultModal();
            });
        }

        const cardClose = document.getElementById('cardClose');
        if (cardClose) {
            cardClose.addEventListener('click', () => {
                SoundManager.playClick();
                this.closeCardModal();
            });
        }

        const closeCardBtn = document.getElementById('closeCardBtn');
        if (closeCardBtn) {
            closeCardBtn.addEventListener('click', () => {
                SoundManager.playClick();
                this.closeCardModal();
            });
        }

        const shareCardBtn = document.getElementById('shareCardBtn');
        if (shareCardBtn) {
            shareCardBtn.addEventListener('click', () => {
                if (!this.state.isSharing) {
                    this.shareEmployeeCard();
                }
            });
        }

        const downloadCardBtn = document.getElementById('downloadCardBtn');
        if (downloadCardBtn) {
            downloadCardBtn.addEventListener('click', () => {
                this.downloadCardImage();
            });
        }

        const refreshHotBtn = document.getElementById('refreshHotBtn');
        if (refreshHotBtn) {
            refreshHotBtn.addEventListener('click', () => {
                this.refreshHotJobs();
            });
        }

        const dailyLoginBtn = document.getElementById('dailyLoginBtn');
        if (dailyLoginBtn) {
            dailyLoginBtn.addEventListener('click', () => {
                this.dailyLogin();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeJobModal();
                this.closeResultModal();
                this.closeCardModal();
            }
        });
    },

    bindGenerateCardButton() {
        const generateBtn = document.getElementById('generateCardBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                if (!this.state.isGeneratingCard) {
                    this.generateEmployeeCard();
                }
            });
        }
    },

    async openJobModal(jobId) {
        try {
            const result = await ApiService.getJob(jobId);
            if (result.code === 0) {
                this.state.currentJob = result.data;
                this.showJobModal();
            }
        } catch (error) {
            console.error('获取职位详情失败:', error);
            this.showToast('获取职位详情失败', 'error');
        }
    },

    showJobModal() {
        const job = this.state.currentJob;
        if (!job) return;

        document.getElementById('modalJobIcon').textContent = job.icon;
        document.getElementById('modalJobName').textContent = job.name;
        document.getElementById('modalJobDesc').textContent = job.description;
        document.getElementById('modalJobReq').textContent = job.requirements;

        document.getElementById('applicantName').value = '';
        document.getElementById('applicantAge').value = 25;
        document.getElementById('ageDisplay').textContent = '25';
        document.getElementById('applicantReason').value = '';
        document.getElementById('charCount').textContent = '0/100';
        document.getElementById('urgentApply').checked = false;

        const expRadios = document.querySelectorAll('input[name="experience"]');
        if (expRadios[0]) expRadios[0].checked = true;

        document.querySelectorAll('input[name="specialty"]').forEach(cb => cb.checked = false);

        const modal = document.getElementById('jobModal');
        modal.classList.add('show');
        SoundManager.playPop();
    },

    closeJobModal() {
        const modal = document.getElementById('jobModal');
        if (modal) modal.classList.remove('show');
        this.state.isSubmitting = false;
        this.state.isGeneratingCard = false;
    },

    showFakeUpload() {
        this.showToast('其实不需要，我们相信你！😂', 'info');
        SoundManager.playLaugh();
    },

    async submitApplication() {
        if (this.state.isSubmitting) {
            console.log('提交被阻止：isSubmitting = true');
            return;
        }
        this.state.isSubmitting = true;

        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn?.querySelector('.btn-text');
        
        if (!submitBtn || !this.state.currentJob) {
            this.state.isSubmitting = false;
            this.showToast('页面状态异常，请刷新重试', 'error');
            return;
        }

        const nameInput = document.getElementById('applicantName');
        const ageInput = document.getElementById('applicantAge');
        const reasonInput = document.getElementById('applicantReason');
        const urgentInput = document.getElementById('urgentApply');

        const name = nameInput.value.trim();
        const age = parseInt(ageInput.value) || 25;
        const hasExperience = document.querySelector('input[name="experience"]:checked')?.value === '1' ? 1 : 0;
        const specialties = Array.from(document.querySelectorAll('input[name="specialty"]:checked'))
            .map(cb => cb.value).join(',');
        const reason = reasonInput.value.trim();
        const isUrgent = urgentInput.checked ? 1 : 0;

        if (!name) {
            this.showToast('请填写你的名字！', 'warning');
            SoundManager.playFunnyFail();
            this.state.isSubmitting = false;
            return;
        }

        if (isUrgent && this.state.coinBalance < 10) {
            this.showToast('金币不足，无法加急处理！', 'warning');
            SoundManager.playFunnyFail();
            this.state.isSubmitting = false;
            return;
        }

        submitBtn.disabled = true;
        if (btnText) btnText.textContent = '📨 投递中...';
        submitBtn.classList.add('btn-loading');

        this.playEnvelopeAnimation();

        try {
            const submitData = {
                job_id: this.state.currentJob.id,
                applicant_name: name,
                age: age,
                has_experience: hasExperience,
                specialties: specialties,
                reason: reason,
                is_urgent: isUrgent,
                user_key: this.state.userKey
            };
            
            console.log('提交数据:', submitData);
            
            const result = await ApiService.submitApplication(submitData);
            console.log('API返回结果:', result);

            if (result.code === 0 && result.data) {
                this.state.currentApplication = result.data;
                const delay = isUrgent ? 800 : 2000;
                setTimeout(() => {
                    try {
                        this.showResult(result.data, isUrgent);
                        this.loadCoins();
                    } catch (e) {
                        console.error('显示结果失败:', e);
                        this.showToast('显示结果失败，请刷新页面', 'error');
                    } finally {
                        this.state.isSubmitting = false;
                        submitBtn.disabled = false;
                        if (btnText) btnText.textContent = '📨 投递简历';
                        submitBtn.classList.remove('btn-loading');
                    }
                }, delay);
            } else {
                console.error('投递失败:', result.message);
                this.showToast(result.message || '投递失败', 'error');
                SoundManager.playFunnyFail();
                this.state.isSubmitting = false;
                submitBtn.disabled = false;
                if (btnText) btnText.textContent = '📨 投递简历';
                submitBtn.classList.remove('btn-loading');
            }
        } catch (error) {
            console.error('投递异常:', error);
            this.showToast('网络错误，请重试', 'error');
            SoundManager.playFunnyFail();
            this.state.isSubmitting = false;
            submitBtn.disabled = false;
            if (btnText) btnText.textContent = '📨 投递简历';
            submitBtn.classList.remove('btn-loading');
        }
    },

    playEnvelopeAnimation() {
        const envelope = document.createElement('div');
        envelope.className = 'envelope-animation';
        envelope.textContent = '✉️';
        document.body.appendChild(envelope);
        SoundManager.playSlideDown();
        setTimeout(() => envelope.remove(), 1500);
    },

    showResult(application, isUrgent) {
        this.closeJobModal();

        if (this.state.typeWriterTimer) {
            clearInterval(this.state.typeWriterTimer);
            this.state.typeWriterTimer = null;
        }

        const resultModal = document.getElementById('resultModal');
        const resultIcon = document.getElementById('resultIcon');
        const resultStatus = document.getElementById('resultStatus');
        const resultReply = document.getElementById('resultReply');
        const resultFooter = document.getElementById('resultFooter');

        if (!resultModal || !resultIcon || !resultStatus || !resultReply || !resultFooter) {
            console.error('结果弹窗元素未找到');
            return;
        }

        const statusConfig = {
            hired: { icon: '🎉', status: '恭喜你！被录用了！', sound: 'playFunnySuccess' },
            rejected: { icon: '😢', status: '很遗憾，被拒绝了...', sound: 'playFunnyFail' },
            backup: { icon: '🤔', status: '进入备胎名单！', sound: 'playFunnyBoing' }
        };

        const config = statusConfig[application.status] || statusConfig.backup;

        resultIcon.textContent = config.icon;
        resultStatus.textContent = config.status;
        resultStatus.className = 'result-status ' + (application.status || 'backup');
        resultReply.innerHTML = '<div class="loading-spinner"></div>';

        resultFooter.innerHTML = '';

        if (application.status === 'hired') {
            resultFooter.innerHTML = `
                <button type="button" class="btn btn-primary" id="generateCardBtn">
                    🎪 生成员工证
                </button>
            `;
        }

        resultModal.classList.add('show');
        SoundManager[config.sound]();

        if (application.status === 'hired') {
            this.createConfetti();
            SoundManager.playTrumpet();
        }

        if (application.status === 'hired') {
            this.bindGenerateCardButton();
        }

        setTimeout(() => {
            const hrReply = application.hr_reply || '（HR暂时没有回复）';
            this.typeWriter(resultReply, hrReply, isUrgent ? 30 : 50);
        }, 500);
    },

    typeWriter(element, text, speed) {
        if (!element) return;
        element.innerHTML = '';
        let i = 0;
        const chars = Array.from(text || '');
        if (chars.length === 0) {
            element.textContent = text || '';
            return;
        }
        this.state.typeWriterTimer = setInterval(() => {
            if (i < chars.length) {
                element.textContent += chars[i];
                i++;
            } else {
                clearInterval(this.state.typeWriterTimer);
                this.state.typeWriterTimer = null;
            }
        }, speed || 50);
    },

    closeResultModal() {
        const modal = document.getElementById('resultModal');
        if (modal) modal.classList.remove('show');
        if (this.state.typeWriterTimer) {
            clearInterval(this.state.typeWriterTimer);
            this.state.typeWriterTimer = null;
        }
        this.state.isGeneratingCard = false;
    },

    async generateEmployeeCard() {
        if (this.state.isGeneratingCard) return;
        if (!this.state.currentApplication) return;

        this.state.isGeneratingCard = true;

        const btn = document.getElementById('generateCardBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '🎪 生成中...';
        }

        try {
            const result = await ApiService.generateEmployeeCard(this.state.currentApplication.id);
            console.log('生成员工证结果:', result);
            if (result.code === 0) {
                this.showEmployeeCard(result.data);
                this.closeResultModal();
            } else {
                this.showToast(result.message || '生成失败', 'error');
            }
        } catch (error) {
            console.error('生成员工证异常:', error);
            this.showToast('生成员工证失败', 'error');
        } finally {
            this.state.isGeneratingCard = false;
            if (btn) {
                btn.disabled = false;
                btn.textContent = '🎪 生成员工证';
            }
        }
    },

    showEmployeeCard(cardData) {
        document.getElementById('cardName').textContent = cardData.applicant_name;
        document.getElementById('cardJob').textContent = cardData.job_name;
        document.getElementById('cardNo').textContent = cardData.employee_no;
        document.getElementById('cardValid').textContent = cardData.valid_period;

        this.state.currentCard = cardData;

        const shareBtn = document.getElementById('shareCardBtn');
        if (cardData.is_shared) {
            shareBtn.textContent = '✅ 已分享';
            shareBtn.disabled = true;
        } else {
            shareBtn.textContent = '📤 分享 (+5金币)';
            shareBtn.disabled = false;
        }

        this.updateDownloadButton(cardData.id);

        const modal = document.getElementById('cardModal');
        modal.classList.add('show');
        SoundManager.playCoinSound();
        SoundManager.playFunnySuccess();
    },

    updateDownloadButton(cardId) {
        const downloadBtn = document.getElementById('downloadCardBtn');
        if (!downloadBtn) return;
        
        const downloadKey = `mxt_card_download_${cardId}`;
        const downloadCount = parseInt(localStorage.getItem(downloadKey) || '0');
        const maxDownloads = 3;
        const remaining = maxDownloads - downloadCount;
        
        if (remaining <= 0) {
            downloadBtn.textContent = '📥 已达下载上限';
            downloadBtn.disabled = true;
            downloadBtn.classList.add('btn-disabled');
        } else {
            downloadBtn.textContent = `📥 保存图片 (${remaining}/${maxDownloads})`;
            downloadBtn.disabled = false;
            downloadBtn.classList.remove('btn-disabled');
        }
    },

    closeCardModal() {
        const modal = document.getElementById('cardModal');
        if (modal) modal.classList.remove('show');
        this.state.isSharing = false;
    },

    async shareEmployeeCard() {
        if (this.state.isSharing) {
            console.log('分享被阻止：isSharing = true');
            return;
        }
        if (!this.state.currentCard) {
            this.showToast('员工证不存在', 'error');
            return;
        }

        this.state.isSharing = true;

        const shareBtn = document.getElementById('shareCardBtn');
        if (shareBtn) {
            shareBtn.disabled = true;
            shareBtn.textContent = '📤 分享中...';
        }

        try {
            console.log('开始分享，卡片ID:', this.state.currentCard.id, '用户:', this.state.userKey);
            const result = await ApiService.shareEmployeeCard(this.state.currentCard.id, this.state.userKey);
            console.log('分享API返回:', result);

            if (result.code === 0) {
                const wasNewlyShared = result.data?.was_newly_shared;
                if (wasNewlyShared) {
                    this.showToast('分享成功！获得5金币 🪙', 'success');
                    SoundManager.playCoinSound();
                    this.loadCoins();
                } else {
                    this.showToast('已分享过，不再重复获得金币', 'info');
                }
                this.state.currentCard.is_shared = 1;
                if (shareBtn) {
                    shareBtn.textContent = '✅ 已分享';
                    shareBtn.disabled = true;
                }
            } else {
                console.error('分享失败:', result.message);
                this.showToast(result.message || '分享失败', 'error');
                if (shareBtn) {
                    shareBtn.disabled = false;
                    shareBtn.textContent = '📤 分享 (+5金币)';
                }
            }
        } catch (error) {
            console.error('分享异常:', error);
            this.showToast('分享失败，请重试', 'error');
            if (shareBtn) {
                shareBtn.disabled = false;
                shareBtn.textContent = '📤 分享 (+5金币)';
            }
        } finally {
            this.state.isSharing = false;
        }
    },

    downloadCardImage() {
        if (!this.state.currentCard) {
            this.showToast('员工证不存在', 'error');
            return;
        }

        const cardId = this.state.currentCard.id;
        const downloadKey = `mxt_card_download_${cardId}`;
        const downloadCount = parseInt(localStorage.getItem(downloadKey) || '0');
        const maxDownloads = 3;

        if (downloadCount >= maxDownloads) {
            this.showToast(`下载次数已达上限(${maxDownloads}次)`, 'warning');
            SoundManager.playFunnyFail();
            return;
        }

        try {
            const card = this.state.currentCard;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const scale = 2;
            const width = 400 * scale;
            const height = 500 * scale;
            canvas.width = width;
            canvas.height = height;

            ctx.scale(scale, scale);

            const gradient = ctx.createLinearGradient(0, 0, 400, 500);
            gradient.addColorStop(0, '#ffecd2');
            gradient.addColorStop(1, '#fcb69f');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 400, 500);

            ctx.strokeStyle = '#e85d04';
            ctx.lineWidth = 4;
            ctx.strokeRect(20, 20, 360, 460);

            ctx.font = 'bold 36px serif';
            ctx.fillStyle = '#d62828';
            ctx.textAlign = 'center';
            ctx.fillText('🎪', 200, 70);

            ctx.font = 'bold 24px sans-serif';
            ctx.fillStyle = '#004e89';
            ctx.fillText('马戏团员工证', 200, 110);

            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(40, 140);
            ctx.lineTo(360, 140);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.textAlign = 'left';
            const labels = ['姓名', '职位', '员工编号', '有效期'];
            const values = [card.applicant_name, card.job_name, card.employee_no, card.valid_period];
            const colors = ['#d62828', '#004e89', '#e85d04', '#2a9d8f'];

            labels.forEach((label, i) => {
                const y = 180 + i * 60;
                ctx.font = 'bold 16px sans-serif';
                ctx.fillStyle = '#666';
                ctx.fillText(label, 50, y);

                ctx.font = 'bold 20px sans-serif';
                ctx.fillStyle = colors[i] || '#333';
                ctx.fillText(values[i] || '-', 50, y + 28);

                ctx.setLineDash([3, 3]);
                ctx.strokeStyle = '#ddd';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(50, y + 45);
                ctx.lineTo(350, y + 45);
                ctx.stroke();
                ctx.setLineDash([]);
            });

            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(40, 420);
            ctx.lineTo(360, 420);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText('马戏团人力资源部', 200, 450);
            ctx.fillText('签发日期: ' + new Date().toLocaleDateString('zh-CN'), 200, 470);

            ctx.save();
            ctx.translate(340, 440);
            ctx.rotate(-0.2);
            ctx.font = 'bold 14px sans-serif';
            ctx.fillStyle = 'rgba(214, 40, 40, 0.6)';
            ctx.strokeStyle = 'rgba(214, 40, 40, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillText('马戏团', -20, 5);
            ctx.restore();

            try {
                const link = document.createElement('a');
                link.download = '马戏团员工证_' + (card.employee_no || 'card') + '.png';
                link.href = canvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                const newCount = downloadCount + 1;
                localStorage.setItem(downloadKey, newCount.toString());
                this.updateDownloadButton(cardId);
                
                if (newCount >= maxDownloads) {
                    this.showToast('图片已保存！已达下载上限', 'success');
                } else {
                    this.showToast(`图片已保存！还剩${maxDownloads - newCount}次下载机会`, 'success');
                }
                SoundManager.playCoinSound();
            } catch (e) {
                console.error('保存图片失败:', e);
                this.showToast('保存失败，请截图保存', 'error');
            }
        } catch (e) {
            console.error('生成图片失败:', e);
            this.showToast('生成图片失败，请重试', 'error');
        }
    },

    async refreshHotJobs() {
        const cost = this.state.coinConfig.refresh_hot || 5;
        if (this.state.coinBalance < cost) {
            this.showToast('金币不足！需要' + cost + '金币', 'warning');
            SoundManager.playFunnyFail();
            return;
        }

        const btn = document.getElementById('refreshHotBtn');
        btn.disabled = true;
        btn.textContent = '🔄 刷新中...';

        try {
            const result = await ApiService.refreshHotJobs(this.state.userKey);
            if (result.code === 0) {
                this.state.hotJobs = result.data.jobs || [];
                this.renderHotJobs();
                this.renderJobs();
                this.loadCoins();
                this.showToast('今日热招已刷新！🔥', 'success');
                SoundManager.playFunnySuccess();
            } else {
                this.showToast(result.message || '刷新失败', 'error');
                SoundManager.playFunnyFail();
            }
        } catch (error) {
            console.error('刷新失败:', error);
            this.showToast('刷新失败', 'error');
        } finally {
            btn.disabled = false;
            this.updateRefreshButton();
        }
    },

    async checkDailyLogin() {
        try {
            const result = await ApiService.getUserCoins(this.state.userKey);
            if (result.code === 0) {
                const today = new Date().toISOString().split('T')[0];
                const lastLogin = result.data.last_login_date;
                const btn = document.getElementById('dailyLoginBtn');
                const hint = document.getElementById('loginHint');

                if (lastLogin === today) {
                    btn.disabled = true;
                    btn.textContent = '✅ 今日已签到';
                    if (hint) hint.textContent = '明天再来领取奖励吧~';
                }
            }
        } catch (error) {
            console.error('检查签到状态失败:', error);
        }
    },

    async dailyLogin() {
        const btn = document.getElementById('dailyLoginBtn');
        btn.disabled = true;
        btn.textContent = '🎁 领取中...';

        try {
            const result = await ApiService.dailyLogin(this.state.userKey);
            if (result.code === 0) {
                if (result.data.added > 0) {
                    this.showToast('签到成功！获得' + result.data.added + '金币 🪙', 'success');
                    SoundManager.playCoinSound();
                    SoundManager.playFunnySuccess();
                    this.createConfetti();
                    this.loadCoins();
                } else {
                    this.showToast('今日已领取过奖励', 'info');
                }
                btn.textContent = '✅ 今日已签到';
                const hint = document.getElementById('loginHint');
                if (hint) hint.textContent = '明天再来领取奖励吧~';
            } else {
                this.showToast(result.message || '签到失败', 'error');
                btn.disabled = false;
                btn.textContent = '🎉 领取每日奖励 (+3金币)';
            }
        } catch (error) {
            console.error('签到异常:', error);
            this.showToast('签到失败', 'error');
            btn.disabled = false;
            btn.textContent = '🎉 领取每日奖励 (+3金币)';
        }
    },

    createConfetti() {
        const container = document.getElementById('confettiContainer');
        if (!container) return;

        const colors = ['#ff6b35', '#f7c59f', '#efefd0', '#004e89', '#ef476f', '#06d6a0', '#ffd166'];

        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                confetti.style.animationDelay = Math.random() * 0.5 + 's';

                if (Math.random() > 0.5) {
                    confetti.style.borderRadius = '50%';
                } else {
                    confetti.style.width = '8px';
                    confetti.style.height = '15px';
                }

                container.appendChild(confetti);
                setTimeout(() => confetti.remove(), 4000);
            }, i * 30);
        }
    },

    showToast(message, type) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast ' + (type || 'info');
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
