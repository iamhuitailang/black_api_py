class CharacterSelect {
    constructor(onSelect) {
        this.onSelect = onSelect;
        this.selectedCharacter = null;
    }

    init() {
        this.selectedCharacter = Storage.getSelectedCharacter();
        this.renderCharacterList();
        this.bindEvents();
    }

    renderCharacterList() {
        const container = document.getElementById('character-list');
        container.innerHTML = '';
        
        for (let character of GameConfig.CHARACTERS) {
            const card = document.createElement('button');
            card.className = 'character-card';
            card.type = 'button';
            card.dataset.characterId = character.id;
            card.setAttribute('aria-label', character.name);
            card.style.background = 'none';
            card.style.border = 'none';
            card.style.padding = '0';
            card.style.cursor = 'pointer';
            card.style.font = 'inherit';
            card.style.color = 'inherit';
            
            if (this.selectedCharacter === character.id) {
                card.classList.add('selected');
            }
            
            card.innerHTML = `
                <div class="character-avatar">${character.emoji}</div>
                <div class="character-name">${character.name}</div>
                <div class="character-skill">${this.getSkillName(character.skill)}</div>
                <div class="character-desc">${character.description}</div>
            `;
            
            card.addEventListener('click', () => {
                this.selectCharacter(character.id);
            });
            
            container.appendChild(card);
        }
    }

    getSkillName(skillId) {
        const skillMap = {
            'grab': '⚡ 极速抓取',
            'glide': '🪂 高空滑翔',
            'shield': '🛡️ 护盾格挡'
        };
        return skillMap[skillId] || skillId;
    }

    selectCharacter(characterId) {
        this.selectedCharacter = characterId;
        
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.characterId === characterId) {
                card.classList.add('selected');
            }
        });
        
        Storage.saveSelectedCharacter(characterId);
        
        setTimeout(() => {
            if (this.onSelect) {
                const character = GameConfig.CHARACTERS.find(c => c.id === characterId);
                this.onSelect(character);
            }
        }, 300);
    }

    bindEvents() {
        document.getElementById('btn-back-start').addEventListener('click', () => {
            App.showScreen('start');
        });
        
        window.addEventListener('keydown', (e) => {
            if (App.currentScreen !== 'character_select') return;
            if (e.key === '1') this.selectCharacter('xiaoxing');
            if (e.key === '2') this.selectCharacter('jinjin');
            if (e.key === '3') this.selectCharacter('baibai');
        });
    }

    getSelectedCharacter() {
        if (!this.selectedCharacter) {
            return GameConfig.CHARACTERS[0];
        }
        return GameConfig.CHARACTERS.find(c => c.id === this.selectedCharacter) || GameConfig.CHARACTERS[0];
    }
}
