const StatsPage = {
    render() {
        const stats = this.getOverallStats();
        const streak = DailyPlanModel.getStreakDays();
        const heatmapData = StudyRecordModel.getCalendarHeatmapData();
        const banks = BankModel.getAll();

        const html = `
            <div class="page-container">
                <div class="page-header flex-between">
                    <div>
                        <h1 class="page-title">📊 学习统计</h1>
                        <p class="page-subtitle">查看你的学习进度和数据</p>
                    </div>
                    <button class="btn btn-outline" onclick="StatsPage.showShareModal()">
                        📤 分享成绩
                    </button>
                </div>

                <div class="grid grid-cols-4 gap-16 mb-20">
                    <div class="card">
                        <div class="card-body" style="text-align: center; padding: 20px;">
                            <div style="font-size: 40px; margin-bottom: 8px;">📚</div>
                            <div style="font-size: 32px; font-weight: 700; color: var(--primary-color);">
                                ${stats.totalQuestions}
                            </div>
                            <div style="font-size: 14px; color: var(--text-secondary);">总题目数</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body" style="text-align: center; padding: 20px;">
                            <div style="font-size: 40px; margin-bottom: 8px;">✅</div>
                            <div style="font-size: 32px; font-weight: 700; color: var(--success-color);">
                                ${stats.totalCorrect}
                            </div>
                            <div style="font-size: 14px; color: var(--text-secondary);">正确次数</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body" style="text-align: center; padding: 20px;">
                            <div style="font-size: 40px; margin-bottom: 8px;">🔥</div>
                            <div style="font-size: 32px; font-weight: 700; color: var(--warning-color);">
                                ${streak}
                            </div>
                            <div style="font-size: 14px; color: var(--text-secondary);">连续天数</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body" style="text-align: center; padding: 20px;">
                            <div style="font-size: 40px; margin-bottom: 8px;">📈</div>
                            <div style="font-size: 32px; font-weight: 700; color: var(--primary-color);">
                                ${stats.averageAccuracy}%
                            </div>
                            <div style="font-size: 14px; color: var(--text-secondary);">平均正确率</div>
                        </div>
                    </div>
                </div>

                <div class="card mb-20">
                    <div class="card-header">
                        <h2 class="card-title">📅 学习热力图</h2>
                    </div>
                    <div class="card-body">
                        <canvas id="stats-heatmap" style="width: 100%; height: 150px;"></canvas>
                        <div class="flex mt-12" style="align-items: center; gap: 8px; justify-content: flex-end;">
                            <span style="font-size: 12px; color: var(--text-secondary);">少</span>
                            <div style="display: flex; gap: 4px;">
                                <div class="calendar-day level-0"></div>
                                <div class="calendar-day level-1"></div>
                                <div class="calendar-day level-2"></div>
                                <div class="calendar-day level-3"></div>
                                <div class="calendar-day level-4"></div>
                            </div>
                            <span style="font-size: 12px; color: var(--text-secondary);">多</span>
                        </div>
                    </div>
                </div>

                ${banks.length > 0 ? `
                    <div class="card mb-20">
                        <div class="card-header">
                            <h2 class="card-title">📁 题库掌握情况</h2>
                        </div>
                        <div class="card-body" style="padding: 0;">
                            ${banks.map(bank => {
                                const mastery = MemoryAlgorithm.getBankMastery(bank.id);
                                const masteryClass = mastery.averageMastery >= 60 ? 'success' : 
                                                    mastery.averageMastery >= 30 ? 'warning' : 'danger';
                                
                                return `
                                    <div class="question-item" style="border-bottom: 1px solid var(--border-color); padding: 16px;">
                                        <div class="flex-between">
                                            <div class="flex" style="align-items: center; gap: 16px; flex: 1;">
                                                <span style="font-size: 32px;">${bank.icon}</span>
                                                <div style="flex: 1;">
                                                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                                                        ${bank.name}
                                                    </div>
                                                    <div class="flex" style="gap: 16px; font-size: 12px; color: var(--text-secondary);">
                                                        <span>总题数: ${mastery.total}</span>
                                                        <span>已掌握: ${mastery.mastered}</span>
                                                        <span>学习中: ${mastery.learning}</span>
                                                        <span>未开始: ${mastery.new}</span>
                                                    </div>
                                                    <div class="mt-8">
                                                        <div class="flex-between mb-4" style="font-size: 12px;">
                                                            <span>掌握进度</span>
                                                            <span class="text-${masteryClass}">${mastery.averageMastery}%</span>
                                                        </div>
                                                        <div class="mastery-bar">
                                                            <div class="mastery-bar-fill mastery-${masteryClass === 'success' ? 'high' : masteryClass === 'warning' ? 'medium' : 'low'}" 
                                                                style="width: ${mastery.averageMastery}%"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <button class="btn btn-sm btn-primary" 
                                                onclick="Router.navigate('study', { bankId: '${bank.id}', mode: 'sequential' })">
                                                学习
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="grid grid-cols-2 gap-20">
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">📈 总体掌握进度</h2>
                        </div>
                        <div class="card-body">
                            <canvas id="mastery-progress" style="width: 100%; height: 200px;"></canvas>
                            <div class="grid grid-cols-3 gap-12 mt-16">
                                <div style="text-align: center;">
                                    <div style="font-size: 24px; font-weight: 700; color: var(--success-color);">
                                        ${stats.mastered}
                                    </div>
                                    <div style="font-size: 12px; color: var(--text-secondary);">已掌握</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 24px; font-weight: 700; color: var(--warning-color);">
                                        ${stats.learning}
                                    </div>
                                    <div style="font-size: 12px; color: var(--text-secondary);">学习中</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 24px; font-weight: 700; color: var(--text-secondary);">
                                        ${stats.notStarted}
                                    </div>
                                    <div style="font-size: 12px; color: var(--text-secondary);">未开始</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">📝 最近学习记录</h2>
                        </div>
                        <div class="card-body" style="padding: 0;">
                            ${this.renderRecentRecords()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        App.renderMainContent(html);
        this.initCharts();
    },

    getOverallStats() {
        const questions = QuestionModel.getAll();
        let totalCorrect = 0;
        let totalAttempted = 0;
        let mastered = 0;
        let learning = 0;
        let notStarted = 0;

        questions.forEach(q => {
            if (q.studyStats) {
                totalCorrect += q.studyStats.correctCount || 0;
                totalAttempted += q.studyStats.totalCount || 0;
            }

            const mastery = MemoryAlgorithm.calculateMasteryScore(q);
            if (mastery >= 80) {
                mastered++;
            } else if (mastery > 0) {
                learning++;
            } else {
                notStarted++;
            }
        });

        return {
            totalQuestions: questions.length,
            totalCorrect,
            averageAccuracy: totalAttempted > 0 ? Math.round(totalCorrect / totalAttempted * 100) : 0,
            mastered,
            learning,
            notStarted
        };
    },

    renderRecentRecords() {
        const records = StudyRecordModel.getRecent(10);

        if (records.length === 0) {
            return `
                <div style="padding: 24px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 8px;">📖</div>
                    <p style="color: var(--text-secondary);">还没有学习记录</p>
                    <button class="btn btn-primary mt-12" onclick="Router.navigate('bank')">
                        开始学习
                    </button>
                </div>
            `;
        }

        return records.map(record => {
            const question = QuestionModel.getById(record.questionId);
            const bank = record.bankId ? BankModel.getById(record.bankId) : null;

            return `
                <div class="question-item" style="border-bottom: 1px solid var(--border-color); padding: 12px 16px;">
                    <div class="flex-between">
                        <div>
                            <div class="flex" style="align-items: center; gap: 8px; margin-bottom: 4px;">
                                <span class="tag ${record.isCorrect ? 'tag-success' : 'tag-danger'}">
                                    ${record.isCorrect ? '✅ 正确' : '❌ 错误'}
                                </span>
                                ${bank ? `<span class="tag">${bank.icon} ${bank.name}</span>` : ''}
                            </div>
                            <div style="font-size: 14px; color: var(--text-primary); line-height: 1.4;">
                                ${question ? Utils.truncate(question.content, 50) : '题目已删除'}
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                ${Utils.formatDateTime(record.studyTime)}
                                ${record.isNew ? ' · 新题目' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    initCharts() {
        const heatmapCanvas = document.getElementById('stats-heatmap');
        if (heatmapCanvas) {
            const heatmapData = StudyRecordModel.getCalendarHeatmapData();
            CanvasUtils.drawCalendarHeatmap(heatmapCanvas, heatmapData);
        }

        const masteryCanvas = document.getElementById('mastery-progress');
        if (masteryCanvas) {
            const stats = this.getOverallStats();
            const percentage = stats.totalQuestions > 0 ? 
                Math.round((stats.mastered + stats.learning * 0.5) / stats.totalQuestions * 100) : 0;
            CanvasUtils.drawMasteryProgress(masteryCanvas, percentage);
        }
    },

    showShareModal() {
        const stats = ShareUtils.getShareStats();
        const streak = DailyPlanModel.getStreakDays();

        const modalContent = `
            <div class="modal-header">
                <h3 class="modal-title">📤 分享学习成绩</h3>
                <button class="modal-close" data-action="close">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">分享方式</label>
                    <div class="flex gap-12" style="flex-wrap: wrap;">
                        <button class="btn btn-outline" onclick="StatsPage.showCardPreview()">
                            🖼️ 生成分享卡片
                        </button>
                        <button class="btn btn-outline" onclick="StatsPage.shareNative()">
                            📲 系统分享
                        </button>
                        <button class="btn btn-outline" onclick="StatsPage.copyShareText()">
                            📋 复制文字
                        </button>
                    </div>
                </div>

                <div id="stats-card-preview" style="display: none; margin-top: 20px;">
                    <div style="text-align: center; margin-bottom: 12px;">
                        <span style="font-weight: 600; color: var(--text-primary);">分享卡片预览</span>
                    </div>
                    <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;">
                        <canvas id="stats-card-canvas" style="width: 100%; height: auto;"></canvas>
                    </div>
                    <div class="flex gap-12 mt-12" style="justify-content: center;">
                        <button class="btn btn-primary" onclick="StatsPage.downloadStatsCard()">
                            下载图片
                        </button>
                        <button class="btn btn-secondary" onclick="StatsPage.hideCardPreview()">
                            隐藏
                        </button>
                    </div>
                </div>

                <div class="mt-20" style="background: var(--bg-secondary); padding: 16px; border-radius: 8px;">
                    <h4 style="font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">📊 我的学习数据</h4>
                    <div class="grid grid-cols-2 gap-12">
                        <div style="padding: 8px; background: var(--bg-color); border-radius: 6px;">
                            <div style="font-size: 20px; font-weight: 700; color: var(--primary-color);">${stats.totalQuestions}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">总题目数</div>
                        </div>
                        <div style="padding: 8px; background: var(--bg-color); border-radius: 6px;">
                            <div style="font-size: 20px; font-weight: 700; color: var(--success-color);">${stats.mastered}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">已掌握</div>
                        </div>
                        <div style="padding: 8px; background: var(--bg-color); border-radius: 6px;">
                            <div style="font-size: 20px; font-weight: 700; color: var(--warning-color);">${stats.accuracy}%</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">正确率</div>
                        </div>
                        <div style="padding: 8px; background: var(--bg-color); border-radius: 6px;">
                            <div style="font-size: 20px; font-weight: 700; color: var(--danger-color);">${streak}天</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">连续学习</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        App.showModal(modalContent, { size: 'lg' });
    },

    showCardPreview() {
        const previewDiv = document.getElementById('stats-card-preview');
        if (previewDiv) {
            previewDiv.style.display = 'block';
        }

        setTimeout(() => {
            const canvas = document.getElementById('stats-card-canvas');
            if (canvas) {
                const stats = ShareUtils.getShareStats();
                const streak = DailyPlanModel.getStreakDays();
                
                ShareUtils.drawShareCard(canvas, {
                    title: '我的学习成绩',
                    subtitle: '来自背题神器',
                    icon: '📊',
                    stats: {
                        totalQuestions: stats.totalQuestions,
                        mastered: stats.mastered,
                        accuracy: stats.accuracy,
                        streak: streak
                    }
                });
            }
        }, 100);
    },

    hideCardPreview() {
        const previewDiv = document.getElementById('stats-card-preview');
        if (previewDiv) {
            previewDiv.style.display = 'none';
        }
    },

    downloadStatsCard() {
        const canvas = document.getElementById('stats-card-canvas');
        if (canvas) {
            const filename = `学习成绩_${Utils.formatDate(new Date())}.png`;
            ShareUtils.downloadCanvasAsImage(canvas, filename);
            Toast.success('卡片已下载');
        }
    },

    shareNative() {
        const stats = ShareUtils.getShareStats();
        const streak = DailyPlanModel.getStreakDays();
        
        const shareText = `🎯 我在背题神器的学习成绩：
📚 已学习 ${stats.totalQuestions} 道题目
✅ 已掌握 ${stats.mastered} 道
📈 正确率 ${stats.accuracy}%
🔥 连续学习 ${streak} 天

快来和我一起用背题神器高效学习吧！`;

        ShareUtils.shareNative(
            '我的学习成绩',
            shareText,
            window.location.href
        ).then(success => {
            if (!success) {
                this.copyShareText();
            }
        });
    },

    copyShareText() {
        const stats = ShareUtils.getShareStats();
        const streak = DailyPlanModel.getStreakDays();
        
        const shareText = `🎯 我在背题神器的学习成绩：
📚 已学习 ${stats.totalQuestions} 道题目
✅ 已掌握 ${stats.mastered} 道
📈 正确率 ${stats.accuracy}%
🔥 连续学习 ${streak} 天

快来和我一起用背题神器高效学习吧！
${window.location.href}`;

        ShareUtils.copyToClipboard(shareText).then(success => {
            if (success) {
                Toast.success('已复制到剪贴板');
            } else {
                Toast.error('复制失败');
            }
        });
    }
};

window.StatsPage = StatsPage;
