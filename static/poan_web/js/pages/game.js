const GamePage = {
    caseId: null,
    caseData: null,
    progress: null,
    clues: [],
    characters: [],
    currentTab: 'clues',
    currentCharacter: null,
    dialogues: [],
    currentScene: null,
    dialogueHistory: [],

    async render() {
        const app = document.getElementById('app');
        const params = Router.getParams();
        this.caseId = params.case_id;

        if (!this.caseId) {
            Router.navigate('home');
            return;
        }

        this._restoreLocalState();

        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <header class="header">
                    <div class="header-back" onclick="Router.back()">←</div>
                    <h1 class="header-title">案件调查中</h1>
                    <div class="header-action" onclick="GamePage.showMenu()">菜单</div>
                </header>

                <div class="game-container" id="gameContainer">
                    <div class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <div class="empty-state-title">加载案件数据<span class="loading-dots"></span></div>
                    </div>
                </div>
            </div>
        `;

        await this.loadGameData();
    },

    _restoreLocalState() {
        const saved = Storage.getGameState(this.caseId);
        if (saved) {
            this.currentTab = saved.currentTab || 'clues';
            this.currentCharacter = saved.currentCharacter || null;
            this.dialogueHistory = saved.dialogueHistory || [];
        }
    },

    _saveLocalState() {
        if (!this.caseId) return;
        Storage.setGameState(this.caseId, {
            currentTab: this.currentTab,
            currentCharacter: this.currentCharacter ? {
                id: this.currentCharacter.id,
                name: this.currentCharacter.name,
                role: this.currentCharacter.role,
                description: this.currentCharacter.description
            } : null,
            dialogueHistory: this.dialogueHistory.slice(-50),
            caseId: this.caseId
        });
    },

    async loadGameData() {
        try {
            const [progressResult, cluesResult, charactersResult, caseResult] = await Promise.all([
                PoanApi.getGameProgress(this.caseId),
                PoanApi.getClues(this.caseId),
                PoanApi.getCharacters(this.caseId),
                PoanApi.getCaseDetail(this.caseId)
            ]);

            if (progressResult.code === 0) {
                this.progress = progressResult.data;
            }

            if (cluesResult.code === 0) {
                this.clues = cluesResult.data || [];
            }

            if (charactersResult.code === 0) {
                this.characters = charactersResult.data || [];
                if (this.currentCharacter) {
                    const restored = this.characters.find(c => c.id === this.currentCharacter.id);
                    if (restored) {
                        this.currentCharacter = restored;
                    } else {
                        this.currentCharacter = null;
                    }
                }
            }

            if (caseResult.code === 0) {
                this.caseData = caseResult.data;
                this.currentScene = {
                    icon: Utils.getEraIcon(caseResult.data.era),
                    name: Utils.getEraName(caseResult.data.era),
                    description: caseResult.data.background || '案件正在调查中...'
                };
            }

            if (this.currentCharacter && this.currentTab === 'dialogue') {
                this.dialogues = this.dialogueHistory.filter(d =>
                    d.characterId === this.currentCharacter.id
                );
                if (this.dialogues.length === 0) {
                    await this.loadDialogues();
                }
            }

            this._saveLocalState();
            this.renderGame();
        } catch (error) {
            console.error('加载游戏数据失败:', error);
            document.getElementById('gameContainer').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <div class="empty-state-title">加载失败</div>
                    <div class="empty-state-text">点击重试</div>
                </div>
            `;
            document.getElementById('gameContainer').querySelector('.empty-state').onclick = () => this.loadGameData();
        }
    },

    renderGame() {
        const progress = this.progress || {};
        const collectedCount = this.clues.filter(c => c.collected).length;
        const totalClues = this.clues.length;
        const progressPercent = totalClues > 0 ? Math.floor((collectedCount / totalClues) * 100) : 0;

        const container = document.getElementById('gameContainer');
        container.innerHTML = `
            <div class="game-header">
                <div class="game-case-title">${this.caseData?.title || '案件调查'}</div>
                <div class="game-progress">
                    <span class="game-progress-label">调查进度</span>
                    <div class="game-progress-bar">
                        <div class="game-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <span class="game-progress-text">${collectedCount}/${totalClues}</span>
                </div>
            </div>

            <div class="game-content">
                <div class="game-scene">
                    <div class="game-scene-title">
                        <div class="game-scene-icon">${this.currentScene?.icon || '🏛️'}</div>
                        ${this.currentScene?.name || '案发现场'}
                    </div>
                    <div class="game-scene-desc">
                        ${this.currentScene?.description || '这里是案发现场，仔细搜寻线索...'}
                    </div>
                </div>

                <div class="game-actions">
                    <div class="game-actions-title">调查操作</div>
                    <div class="game-action-grid">
                        <div class="game-action-item" onclick="GamePage.navigateTo('evidence')">
                            <div class="game-action-icon">📋</div>
                            <div class="game-action-text">证据板</div>
                        </div>
                        <div class="game-action-item" onclick="GamePage.navigateTo('timeline')">
                            <div class="game-action-icon">⏱️</div>
                            <div class="game-action-text">时间线</div>
                        </div>
                        <div class="game-action-item" onclick="GamePage.navigateTo('quiz')">
                            <div class="game-action-icon">❓</div>
                            <div class="game-action-text">知识问答</div>
                        </div>
                        <div class="game-action-item" onclick="GamePage.showEndingOptions()">
                            <div class="game-action-icon">🏁</div>
                            <div class="game-action-text">提交推理</div>
                        </div>
                    </div>
                </div>

                <div class="game-tabs">
                    <div class="game-tab ${this.currentTab === 'clues' ? 'active' : ''}" onclick="GamePage.switchTab('clues')">
                        线索 (${collectedCount}/${totalClues})
                    </div>
                    <div class="game-tab ${this.currentTab === 'characters' ? 'active' : ''}" onclick="GamePage.switchTab('characters')">
                        角色 (${this.characters.length})
                    </div>
                    <div class="game-tab ${this.currentTab === 'dialogue' ? 'active' : ''}" onclick="GamePage.switchTab('dialogue')">
                        对话记录
                    </div>
                </div>

                <div class="game-panel ${this.currentTab === 'clues' ? 'active' : ''}" id="panelClues">
                    ${this.renderCluesPanel()}
                </div>

                <div class="game-panel ${this.currentTab === 'characters' ? 'active' : ''}" id="panelCharacters">
                    ${this.renderCharactersPanel()}
                </div>

                <div class="game-panel ${this.currentTab === 'dialogue' ? 'active' : ''}" id="panelDialogue">
                    ${this.renderDialoguePanel()}
                </div>
            </div>
        `;
    },

    renderCluesPanel() {
        if (this.clues.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-title">暂无线索</div>
                    <div class="empty-state-text">继续探索场景以发现线索</div>
                </div>
            `;
        }

        return this.clues.map(clue => {
            const clueIcon = Utils.getClueIcon(clue.type);
            const typeName = Utils.getClueTypeName(clue.type);
            const collectedClass = clue.collected ? 'collected' : '';
            const statusText = clue.collected ? '✓ 已收集' : '点击收集';

            return `
                <div class="clue-item ${collectedClass}" data-id="${clue.id}" onclick="GamePage.handleClueClick(${clue.id})">
                    <div class="clue-icon">${clueIcon}</div>
                    <div class="clue-content">
                        <div class="clue-title">${clue.name || '未知线索'}</div>
                        <div class="clue-desc">${clue.collected ? (clue.description || '线索详情') : '??? 尚未收集'}</div>
                        <div class="clue-status">
                            <span>${typeName}</span>
                            <span>·</span>
                            <span>${statusText}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderCharactersPanel() {
        if (this.characters.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">👤</div>
                    <div class="empty-state-title">暂无角色</div>
                    <div class="empty-state-text">继续调查以发现相关人物</div>
                </div>
            `;
        }

        return this.characters.map(char => {
            const charIcon = Utils.getCharacterIcon(char.role);
            const roleName = Utils.getRoleName(char.role);
            const roleClass = Utils.getRoleClass(char.role);

            return `
                <div class="character-item" data-id="${char.id}" onclick="GamePage.handleCharacterClick(${char.id})">
                    <div class="character-avatar">${charIcon}</div>
                    <div class="character-info">
                        <div class="character-name">${char.name || '未知角色'}</div>
                        <div class="character-role">
                            <span class="badge ${roleClass}">${roleName}</span>
                            ${char.description || ''}
                        </div>
                    </div>
                    <div class="character-arrow">→</div>
                </div>
            `;
        }).join('');
    },

    renderDialoguePanel() {
        if (!this.currentCharacter) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">💬</div>
                    <div class="empty-state-title">选择角色开始对话</div>
                    <div class="empty-state-text">点击"角色"标签选择要询问的对象</div>
                </div>
            `;
        }

        const char = this.currentCharacter;
        const charIcon = Utils.getCharacterIcon(char.role);

        const dialogueHtml = this.dialogues.length > 0
            ? this.dialogues.map(d => this.renderDialogueItem(d)).join('')
            : `
                <div class="dialogue-item">
                    <div class="dialogue-bubble dialogue-npc">
                        <div class="dialogue-speaker">${char.name}</div>
                        你好，侦探。有什么想询问的吗？
                    </div>
                </div>
            `;

        return `
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-card); border-radius: var(--radius-md); margin-bottom: 16px;">
                <div class="character-avatar" style="width: 44px; height: 44px; font-size: 22px;">${charIcon}</div>
                <div>
                    <div style="font-weight: 600; color: var(--text-primary);">${char.name}</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">${Utils.getRoleName(char.role)}</div>
                </div>
                <button class="btn btn-sm btn-outline" style="margin-left: auto;" onclick="GamePage.closeDialogue()">关闭</button>
            </div>

            <div style="flex: 1; overflow-y: auto; padding: 0 4px;" id="dialogueList">
                ${dialogueHtml}
            </div>

            <div class="dialogue-input">
                <textarea class="dialogue-textarea" id="dialogueInput" placeholder="输入你想询问的问题..." rows="1"></textarea>
                <button class="dialogue-send" onclick="GamePage.sendMessage()">发送</button>
            </div>
        `;
    },

    renderDialogueItem(d) {
        if (d.is_player) {
            return `
                <div class="dialogue-item">
                    <div class="dialogue-bubble dialogue-player">
                        ${d.content}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="dialogue-item">
                    <div class="dialogue-bubble dialogue-npc">
                        <div class="dialogue-speaker">${d.speaker || this.currentCharacter?.name}</div>
                        ${d.content}
                    </div>
                </div>
            `;
        }
    },

    switchTab(tab) {
        this.currentTab = tab;
        this._saveLocalState();
        document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.game-panel').forEach(p => p.classList.remove('active'));
        const tabEl = document.querySelector('.game-tab[onclick="GamePage.switchTab(\'' + tab + '\')"]');
        if (tabEl) tabEl.classList.add('active');
        const panelEl = document.getElementById('panel' + tab.charAt(0).toUpperCase() + tab.slice(1));
        if (panelEl) panelEl.classList.add('active');

        if (tab === 'dialogue' && this.currentCharacter) {
            this.loadDialogues();
        }
    },

    async handleClueClick(clueId) {
        const clue = this.clues.find(c => c.id === clueId);
        if (!clue) return;

        if (clue.collected) {
            Toast.info('该线索已收集');
            return;
        }

        Loading.show();
        try {
            const result = await PoanApi.collectClue(this.caseId, clueId);
            if (result.code === 0) {
                clue.collected = true;
                if (result.data?.clue?.description) {
                    clue.description = result.data.clue.description;
                }
                this._saveLocalState();
                Toast.success('线索收集成功！');
                this.renderGame();
            } else {
                Toast.error(result.msg || '收集失败');
            }
        } catch (error) {
            console.error('收集线索失败:', error);
            Toast.error('收集失败，请检查网络');
        } finally {
            Loading.hide();
        }
    },

    async handleCharacterClick(characterId) {
        const character = this.characters.find(c => c.id === characterId);
        if (!character) return;

        this.currentCharacter = character;
        this.currentTab = 'dialogue';
        this.dialogues = this.dialogueHistory.filter(d =>
            d.characterId === characterId
        );

        this._saveLocalState();
        this.renderGame();

        if (this.dialogues.length === 0) {
            await this.loadDialogues();
        }
    },

    async loadDialogues() {
        if (!this.currentCharacter) return;

        try {
            const result = await PoanApi.getDialogues(this.currentCharacter.id, this.caseId);
            if (result.code === 0) {
                const rawDialogues = result.data || [];
                this.dialogues = rawDialogues.map(d => ({
                    id: d.id,
                    characterId: this.currentCharacter.id,
                    is_player: false,
                    speaker: this.currentCharacter.name,
                    content: d.answer || d.content || '(暂无对话内容)'
                }));
                this.dialogueHistory = this.dialogueHistory.filter(d =>
                    d.characterId !== this.currentCharacter.id
                ).concat(this.dialogues);
                this._saveLocalState();
                this.updateDialogueList();
            }
        } catch (error) {
            console.error('加载对话失败:', error);
        }
    },

    updateDialogueList() {
        const list = document.getElementById('dialogueList');
        if (!list) return;

        if (this.dialogues.length === 0) {
            list.innerHTML = `
                <div class="dialogue-item">
                    <div class="dialogue-bubble dialogue-npc">
                        <div class="dialogue-speaker">${this.currentCharacter.name}</div>
                        你好，侦探。有什么想询问的吗？
                    </div>
                </div>
            `;
        } else {
            list.innerHTML = this.dialogues.map(d => this.renderDialogueItem(d)).join('');
        }

        list.scrollTop = list.scrollHeight;
    },

    closeDialogue() {
        this.currentCharacter = null;
        this.dialogues = [];
        this.currentTab = 'characters';
        this._saveLocalState();
        this.renderGame();
    },

    async sendMessage() {
        const input = document.getElementById('dialogueInput');
        const message = input?.value?.trim();

        if (!message || !this.currentCharacter) return;

        const playerMsg = {
            id: Date.now(),
            characterId: this.currentCharacter.id,
            is_player: true,
            content: message,
            created_at: new Date().toISOString()
        };
        this.dialogues.push(playerMsg);
        this.dialogueHistory.push(playerMsg);
        input.value = '';
        this.updateDialogueList();

        try {
            const result = await PoanApi.talkToCharacter(this.caseId, this.currentCharacter.id, message);
            if (result.code === 0 && result.data) {
                const npcMsg = {
                    id: Date.now() + 1,
                    characterId: this.currentCharacter.id,
                    is_player: false,
                    speaker: this.currentCharacter.name,
                    content: result.data.reply || '...',
                    created_at: new Date().toISOString()
                };
                this.dialogues.push(npcMsg);
                this.dialogueHistory.push(npcMsg);

                this._saveLocalState();
                this.updateDialogueList();
            } else {
                Toast.error(result.msg || '发送失败');
            }
        } catch (error) {
            console.error('发送消息失败:', error);
            Toast.error('发送失败，请检查网络');
        }
    },

    navigateTo(page) {
        Router.navigate(page, { case_id: this.caseId });
    },

    showEndingOptions() {
        const collectedCount = this.clues.filter(c => c.collected).length;
        const totalClues = this.clues.length;

        if (collectedCount < Math.ceil(totalClues * 0.5)) {
            Toast.warning('您只收集了 ' + collectedCount + '/' + totalClues + ' 条线索，建议收集更多线索后再提交推理');
        }

        Router.navigate('ending', { case_id: this.caseId });
    },

    showMenu() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width: 300px;">
                <div class="modal-header">
                    <h3 class="modal-title">游戏菜单</h3>
                    <div class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</div>
                </div>
                <div class="modal-body">
                    <div class="profile-menu-item" onclick="GamePage.handleRestart()">
                        <div class="profile-menu-icon">🔄</div>
                        <div class="profile-menu-content">
                            <div class="profile-menu-title">重新开始</div>
                            <div class="profile-menu-desc">重置当前案件进度</div>
                        </div>
                    </div>
                    <div class="profile-menu-item" onclick="GamePage.handleExit()">
                        <div class="profile-menu-icon">🚪</div>
                        <div class="profile-menu-content">
                            <div class="profile-menu-title">退出案件</div>
                            <div class="profile-menu-desc">返回案件列表</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    handleRestart() {
        document.querySelector('.modal-overlay')?.remove();
        if (confirm('确定要重新开始吗？当前进度将会丢失。')) {
            Storage.removeGameState(this.caseId);
            Router.navigate('case_detail', { case_id: this.caseId });
        }
    },

    handleExit() {
        document.querySelector('.modal-overlay')?.remove();
        Router.navigate('home');
    }
};

window.GamePage = GamePage;
