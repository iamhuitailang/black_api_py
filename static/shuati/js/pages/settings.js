const SettingsPage = {
    render() {
        const settings = Storage.getSettings();
        const dailyPlan = DailyPlanModel.getPlan();

        const html = `
            <div class="page-container">
                <div class="page-header">
                    <h1 class="page-title">⚙️ 设置</h1>
                    <p class="page-subtitle">个性化你的学习体验</p>
                </div>

                <div class="card mb-20">
                    <div class="card-header">
                        <h2 class="card-title">🎨 外观设置</h2>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label">主题模式</label>
                            <div class="flex" style="gap: 12px;">
                                <button class="btn ${!settings.darkMode ? 'btn-primary' : 'btn-outline'}" 
                                    onclick="SettingsPage.setTheme(false)" style="flex: 1;">
                                    ☀️ 浅色模式
                                </button>
                                <button class="btn ${settings.darkMode ? 'btn-primary' : 'btn-outline'}" 
                                    onclick="SettingsPage.setTheme(true)" style="flex: 1;">
                                    🌙 深色模式
                                </button>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">字体大小</label>
                            <div class="flex" style="gap: 12px;">
                                <button class="btn ${settings.fontSize === 'small' ? 'btn-primary' : 'btn-outline'}" 
                                    onclick="SettingsPage.setFontSize('small')" style="flex: 1;">
                                    A 小
                                </button>
                                <button class="btn ${settings.fontSize === 'medium' ? 'btn-primary' : 'btn-outline'}" 
                                    onclick="SettingsPage.setFontSize('medium')" style="flex: 1;">
                                    A 中
                                </button>
                                <button class="btn ${settings.fontSize === 'large' ? 'btn-primary' : 'btn-outline'}" 
                                    onclick="SettingsPage.setFontSize('large')" style="flex: 1;">
                                    A 大
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card mb-20">
                    <div class="card-header">
                        <h2 class="card-title">📅 每日学习计划</h2>
                    </div>
                    <div class="card-body">
                        <div class="grid grid-cols-2 gap-20">
                            <div class="form-group">
                                <label class="form-label">每日新题数量</label>
                                <input type="number" class="form-input" id="daily-new-count" 
                                    value="${dailyPlan.dailyNewQuestions}" min="0" max="100"
                                    onchange="SettingsPage.updateDailyPlan()">
                                <p class="form-hint">每天计划学习的新题目数量</p>
                            </div>
                            <div class="form-group">
                                <label class="form-label">每日复习数量</label>
                                <input type="number" class="form-input" id="daily-review-count" 
                                    value="${dailyPlan.dailyReviewQuestions}" min="0" max="100"
                                    onchange="SettingsPage.updateDailyPlan()">
                                <p class="form-hint">每天计划复习的题目数量</p>
                            </div>
                        </div>

                        <div class="mt-16" style="padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                            <p style="font-size: 14px; color: var(--text-secondary);">
                                💡 根据艾宾浩斯记忆曲线，建议每天复习题数约为新题数的 1.5-2 倍
                            </p>
                        </div>
                    </div>
                </div>

                <div class="card mb-20">
                    <div class="card-header">
                        <h2 class="card-title">🔔 提醒设置</h2>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <div class="flex-between">
                                <div>
                                    <label class="form-label">浏览器通知</label>
                                    <p class="form-hint">开启后，每天会收到学习提醒</p>
                                </div>
                                <button class="btn ${Utils.isNotificationEnabled() ? 'btn-success' : 'btn-outline'}" 
                                    onclick="SettingsPage.toggleNotifications()" id="notification-btn">
                                    ${Utils.isNotificationEnabled() ? '✅ 已开启' : '🔔 开启通知'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card mb-20">
                    <div class="card-header">
                        <h2 class="card-title">💾 数据管理</h2>
                    </div>
                    <div class="card-body">
                        <div class="grid grid-cols-2 gap-16">
                            <div>
                                <button class="btn btn-primary w-100" onclick="SettingsPage.exportAllData()">
                                    📤 导出所有数据
                                </button>
                                <p class="form-hint mt-8">将所有学习数据导出为 JSON 文件</p>
                            </div>
                            <div>
                                <button class="btn btn-secondary w-100" onclick="SettingsPage.importAllData()">
                                    📥 导入数据
                                </button>
                                <p class="form-hint mt-8">从 JSON 文件恢复学习数据</p>
                            </div>
                        </div>

                        <input type="file" id="import-file" style="display: none;" accept=".json"
                            onchange="SettingsPage.handleImportFile(this)">

                        <div class="mt-20" style="padding: 16px; background: var(--danger-bg); border-radius: 8px;">
                            <h4 style="color: var(--danger-color); margin-bottom: 8px;">⚠️ 危险操作</h4>
                            <div class="flex" style="gap: 12px; flex-wrap: wrap;">
                                <button class="btn btn-danger" onclick="SettingsPage.clearStudyRecords()">
                                    清除学习记录
                                </button>
                                <button class="btn btn-danger" onclick="SettingsPage.clearAllData()">
                                    清除所有数据
                                </button>
                            </div>
                            <p class="form-hint mt-8" style="color: var(--danger-color);">
                                这些操作不可恢复，请谨慎操作
                            </p>
                        </div>
                    </div>
                </div>

                <div class="card mb-20">
                    <div class="card-header">
                        <h2 class="card-title">ℹ️ 关于</h2>
                    </div>
                    <div class="card-body">
                        <div class="flex" style="align-items: center; gap: 16px; margin-bottom: 16px;">
                            <div style="font-size: 48px;">📚</div>
                            <div>
                                <h3 style="font-size: 20px; font-weight: 600; color: var(--text-primary);">背题神器</h3>
                                <p style="color: var(--text-secondary);">版本 1.0.0</p>
                            </div>
                        </div>
                        <p style="color: var(--text-secondary); line-height: 1.6;">
                            一个专注、高效、科学记忆的背题工具，支持多种刷题模式、艾宾浩斯记忆提醒，
                            帮助用户快速掌握知识点。所有数据存储在本地浏览器中，保护您的隐私安全。
                        </p>
                        <div class="mt-12" style="padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                            <p style="font-size: 14px; color: var(--text-secondary);">
                                💡 快捷键提示：在学习页面按 <kbd style="padding: 2px 6px; background: var(--bg-tertiary); border-radius: 4px;">空格</kbd> 显示答案，
                                按 <kbd style="padding: 2px 6px; background: var(--bg-tertiary); border-radius: 4px;">1</kbd> 标记会了，
                                按 <kbd style="padding: 2px 6px; background: var(--bg-tertiary); border-radius: 4px;">2</kbd> 标记不会
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        App.renderMainContent(html);
    },

    setTheme(isDark) {
        const settings = Storage.getSettings();
        settings.darkMode = isDark;
        Storage.setSettings(settings);
        EventBus.emit(EventBus.EVENTS.SETTINGS_UPDATED, settings);
        this.render();
    },

    setFontSize(size) {
        const settings = Storage.getSettings();
        settings.fontSize = size;
        Storage.setSettings(settings);
        EventBus.emit(EventBus.EVENTS.SETTINGS_UPDATED, settings);
        this.render();
    },

    updateDailyPlan() {
        const newCount = parseInt(document.getElementById('daily-new-count')?.value || 0);
        const reviewCount = parseInt(document.getElementById('daily-review-count')?.value || 0);

        DailyPlanModel.setPlan({
            dailyNewQuestions: Math.max(0, Math.min(100, newCount)),
            dailyReviewQuestions: Math.max(0, Math.min(100, reviewCount))
        });

        Toast.show('已保存学习计划', 'success');
    },

    async toggleNotifications() {
        const enabled = await Utils.requestNotificationPermission();
        const btn = document.getElementById('notification-btn');
        if (btn) {
            if (enabled) {
                btn.className = 'btn btn-success';
                btn.textContent = '✅ 已开启';
            } else {
                btn.className = 'btn btn-outline';
                btn.textContent = '🔔 开启通知';
            }
        }
        Toast.show(enabled ? '通知已开启' : '通知权限被拒绝', enabled ? 'success' : 'warning');
    },

    exportAllData() {
        const data = {
            exportTime: Date.now(),
            version: '1.0.0',
            banks: BankModel.getAll(),
            questions: QuestionModel.getAll(),
            studyRecords: StudyRecordModel.getAll(),
            dailyPlan: DailyPlanModel.getPlan(),
            settings: Storage.getSettings()
        };

        Utils.downloadJSON(data, `shuati-backup-${Utils.formatDate(Date.now())}.json`);
        Toast.show('数据导出成功', 'success');
    },

    importAllData() {
        const fileInput = document.getElementById('import-file');
        if (fileInput) {
            fileInput.click();
        }
    },

    async handleImportFile(input) {
        const file = input.files[0];
        if (!file) return;

        try {
            const text = await Utils.readFileAsText(file);
            const data = JSON.parse(text);

            if (!data.banks || !data.questions) {
                throw new Error('无效的数据文件');
            }

            const confirmed = await App.confirm(
                '导入数据将覆盖现有数据，确定要继续吗？',
                '确认导入'
            );

            if (confirmed) {
                Storage.set('banks', data.banks);
                Storage.set('questions', data.questions);
                if (data.studyRecords) {
                    Storage.set('studyRecords', data.studyRecords);
                }
                if (data.dailyPlan) {
                    Storage.set('dailyPlan', data.dailyPlan);
                }
                if (data.settings) {
                    Storage.setSettings(data.settings);
                }

                Toast.show('数据导入成功', 'success');
                EventBus.emit(EventBus.EVENTS.BANK_UPDATED);
                this.render();
            }
        } catch (e) {
            Toast.show('导入失败：' + e.message, 'error');
        }

        input.value = '';
    },

    async clearStudyRecords() {
        const confirmed = await App.confirm(
            '确定要清除所有学习记录吗？题库和题目数据会保留。',
            '确认清除'
        );

        if (confirmed) {
            Storage.set('studyRecords', []);
            Storage.set('dailyStudy', null);

            const questions = QuestionModel.getAll();
            questions.forEach(q => {
                if (q.studyStats) {
                    q.studyStats = {
                        totalCount: 0,
                        correctCount: 0,
                        wrongCount: 0,
                        lastStudyTime: null,
                        nextReviewTime: null,
                        interval: 1,
                        easeFactor: 2.5,
                        repetitions: 0
                    };
                }
            });
            Storage.set('questions', questions);

            Toast.show('学习记录已清除', 'success');
            this.render();
        }
    },

    async clearAllData() {
        const confirmed = await App.confirm(
            '确定要清除所有数据吗？这包括所有题库、题目、学习记录，此操作不可恢复！',
            '确认清除'
        );

        if (confirmed) {
            const keys = ['banks', 'questions', 'studyRecords', 'dailyPlan', 'dailyStudy', 'studyState', 'settings'];
            keys.forEach(key => {
                localStorage.removeItem(Storage.PREFIX + key);
            });

            Toast.show('所有数据已清除', 'success');
            EventBus.emit(EventBus.EVENTS.BANK_DELETED);
            Router.navigate('home');
        }
    }
};

window.SettingsPage = SettingsPage;
