class UIManager {
    constructor() {
        this.gameUI = null;
        this.skillIcons = {};
    }

    init() {
        this.createGameUI();
    }

    createGameUI() {
        const container = document.getElementById('game-container');
        
        this.gameUI = document.createElement('div');
        this.gameUI.id = 'game-ui';
        this.gameUI.style.display = 'none';
        
        this.gameUI.innerHTML = `
            <div class="ui-panel-left">
                <div class="ui-panel">
                    <div class="ui-row">
                        <span class="ui-label">🍌</span>
                        <span class="ui-value" id="player-bananas">0</span>
                    </div>
                    <div class="ui-row">
                        <span class="ui-label">❤️</span>
                        <div class="hp-bar">
                            <div class="hp-fill high" id="player-hp-fill" style="width: 100%"></div>
                        </div>
                        <span class="ui-value" id="player-hp">100</span>
                    </div>
                    <div class="skill-icons" id="player-skills"></div>
                </div>
            </div>
            <div class="ui-panel-center">
                <div class="ui-panel">
                    <div class="ui-row">
                        <span class="ui-label">⏱️</span>
                        <span class="ui-value" id="game-timer">2:00</span>
                    </div>
                </div>
            </div>
            <div class="ui-panel-right">
                <div class="ui-panel">
                    <div class="ui-row">
                        <span class="ui-label">🙊</span>
                        <span class="ui-value" id="ai-bananas">0</span>
                    </div>
                    <div class="ui-row">
                        <span class="ui-label">❤️</span>
                        <div class="hp-bar">
                            <div class="hp-fill high" id="ai-hp-fill" style="width: 100%"></div>
                        </div>
                        <span class="ui-value" id="ai-hp">100</span>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(this.gameUI);
        this.createSkillIcons();
    }

    createSkillIcons() {
        const skillsContainer = document.getElementById('player-skills');
        skillsContainer.innerHTML = '';
        
        this.skillIcons = {};
        
        const skills = [
            { id: 'quickGrab', emoji: '⚡', key: '空格' },
            { id: 'glide', emoji: '🪂', key: '↑' },
            { id: 'shield', emoji: '🛡️', key: 'Shift' }
        ];
        
        for (let skill of skills) {
            const icon = document.createElement('div');
            icon.className = 'skill-icon';
            icon.id = `skill-${skill.id}`;
            icon.innerHTML = `
                <span>${skill.emoji}</span>
                <div class="cooldown-text" id="cooldown-${skill.id}" style="display:none;"></div>
            `;
            icon.title = `${skill.key} 键`;
            skillsContainer.appendChild(icon);
            this.skillIcons[skill.id] = icon;
        }
    }

    show() {
        if (this.gameUI) {
            this.gameUI.style.display = 'flex';
        }
    }

    hide() {
        if (this.gameUI) {
            this.gameUI.style.display = 'none';
        }
    }

    update(game) {
        const player = game.player;
        const ai = game.ai;
        
        document.getElementById('player-bananas').textContent = player.bananaCount;
        document.getElementById('player-hp').textContent = player.hp;
        
        const playerHpFill = document.getElementById('player-hp-fill');
        const playerHpPercent = (player.hp / player.maxHp) * 100;
        playerHpFill.style.width = playerHpPercent + '%';
        playerHpFill.className = 'hp-fill ' + this.getHpClass(playerHpPercent);
        
        document.getElementById('ai-bananas').textContent = ai.bananaCount;
        document.getElementById('ai-hp').textContent = ai.hp;
        
        const aiHpFill = document.getElementById('ai-hp-fill');
        const aiHpPercent = (ai.hp / ai.maxHp) * 100;
        aiHpFill.style.width = aiHpPercent + '%';
        aiHpFill.className = 'hp-fill ' + this.getHpClass(aiHpPercent);
        
        const minutes = Math.floor(game.timeLeft / 60000);
        const seconds = Math.floor((game.timeLeft % 60000) / 1000);
        document.getElementById('game-timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        this.updateSkillCooldowns(player);
    }

    updateSkillCooldowns(player) {
        const skills = ['quickGrab', 'glide', 'shield'];
        
        for (let skillId of skills) {
            const icon = this.skillIcons[skillId];
            const cooldownText = document.getElementById(`cooldown-${skillId}`);
            
            if (!icon || !cooldownText) continue;
            
            if (skillId === 'quickGrab') {
                const cooldown = player.getSkillCooldown('quickGrab');
                if (cooldown > 0) {
                    icon.classList.add('on-cooldown');
                    cooldownText.style.display = 'block';
                    cooldownText.textContent = Math.ceil(cooldown / 1000) + 's';
                } else {
                    icon.classList.remove('on-cooldown');
                    cooldownText.style.display = 'none';
                }
            } else if (skillId === 'shield') {
                const cooldown = player.getSkillCooldown('shield');
                if (cooldown > 0) {
                    icon.classList.add('on-cooldown');
                    cooldownText.style.display = 'block';
                    cooldownText.textContent = Math.ceil(cooldown / 1000) + 's';
                } else {
                    icon.classList.remove('on-cooldown');
                    cooldownText.style.display = 'none';
                }
            }
        }
    }

    getHpClass(percent) {
        if (percent > 60) return 'high';
        if (percent > 30) return 'medium';
        return '';
    }

    showPauseOverlay() {
        let overlay = document.getElementById('pause-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'pause-overlay';
            overlay.innerHTML = '<div class="pause-text">⏸️ 游戏暂停</div>';
            document.getElementById('game-container').appendChild(overlay);
        }
        overlay.classList.add('active');
    }

    hidePauseOverlay() {
        const overlay = document.getElementById('pause-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
}
