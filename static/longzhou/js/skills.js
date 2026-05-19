const SkillSystem = {
    updateSkillUI(player) {
        const sprintCooldownEl = document.getElementById('sprint-cooldown');
        const shieldCooldownEl = document.getElementById('shield-cooldown');
        const sprintItem = sprintCooldownEl?.closest('.skill-item');
        const shieldItem = shieldCooldownEl?.closest('.skill-item');

        if (sprintCooldownEl) {
            const sprintPercent = player.getSprintCooldownPercent() * 100;
            sprintCooldownEl.style.height = sprintPercent + '%';
            
            if (sprintItem) {
                if (player.sprintCooldown <= 0) {
                    sprintItem.classList.add('ready');
                } else {
                    sprintItem.classList.remove('ready');
                }
            }
        }

        if (shieldCooldownEl) {
            const shieldPercent = player.getShieldCooldownPercent() * 100;
            shieldCooldownEl.style.height = shieldPercent + '%';
            
            if (shieldItem) {
                if (player.shieldCooldown <= 0) {
                    shieldItem.classList.add('ready');
                } else {
                    shieldItem.classList.remove('ready');
                }
            }
        }
    },

    showComboEffect(quality, combo) {
        const comboDisplay = document.getElementById('combo-display');
        const comboText = document.getElementById('combo-text');
        
        if (!comboDisplay || !comboText) return;

        let text = '';
        let color = '#ffd700';
        
        if (quality === 'perfect') {
            text = '完美!';
            color = '#ffd700';
            if (combo > 0) {
                text += ` ${combo}连击!`;
            }
        } else if (quality === 'good') {
            text = '不错!';
            color = '#4CAF50';
        } else if (quality === 'miss') {
            text = '失误...';
            color = '#f44336';
        } else if (quality === 'sprint') {
            text = '⚡ 破浪冲刺!';
            color = '#ff9800';
        } else if (quality === 'shield') {
            text = '🛡️ 水浪护盾!';
            color = '#2196F3';
        }

        comboText.textContent = text;
        comboText.style.color = color;
        comboDisplay.classList.remove('hidden');
        
        comboDisplay.style.animation = 'none';
        comboDisplay.offsetHeight;
        comboDisplay.style.animation = 'comboPopup 0.8s ease-out forwards';

        setTimeout(() => {
            comboDisplay.classList.add('hidden');
        }, 800);
    },

    updateRhythmIndicator(player) {
        const indicator = document.getElementById('rhythm-indicator');
        if (indicator) {
            indicator.style.left = (player.rhythmPosition * 100) + '%';
        }
    }
};
