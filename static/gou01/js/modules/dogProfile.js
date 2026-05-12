const DogProfile = {
    profile: null,
    isEditing: false,

    avatars: ['🐕', '🐶', '🐩', '🦮', '🐕‍🦺', '🐾'],

    init() {
        this.profile = Storage.loadProfile();
        this.isEditing = Storage.load('dog_profile_editing', false);
        if (this.isEditing) {
            this.restoreTempAvatar();
        }
    },

    render() {
        const hasProfile = this.profile.name.trim() !== '';
        
        if (hasProfile && !this.isEditing) {
            return this.renderProfileView();
        } else {
            return this.renderProfileForm();
        }
    },

    renderProfileView() {
        const p = this.profile;
        return `
            <div class="bone-card">
                <div class="dog-info">
                    <div class="dog-avatar">${p.avatar || '🐕'}</div>
                    <div class="dog-details">
                        <h2 class="dog-name">${p.name}</h2>
                        <div class="dog-stats">
                            <span>🐾 ${p.breed || '未知品种'}</span>
                            <span>📅 ${p.age || '未知年龄'}岁</span>
                            <span>⚖️ ${p.weight || '未知体重'}kg</span>
                        </div>
                    </div>
                </div>
                <br>
                <div class="grid-2">
                    <div class="form-group">
                        <label class="form-label">💩 排便习惯</label>
                        <p>${p.poopHabits || '未设置'}</p>
                    </div>
                    <div class="form-group">
                        <label class="form-label">💧 排尿习惯</label>
                        <p>${p.peeHabits || '未设置'}</p>
                    </div>
                </div>
                <br>
                <button class="bone-btn" onclick="DogProfile.showEditForm()">✏️ 编辑资料</button>
            </div>
        `;
    },

    renderProfileForm() {
        const p = this.profile;
        return `
            <div class="bone-card">
                <h2 style="margin-bottom: 20px;">🐕 添加狗狗资料</h2>
                <form id="profileForm">
                    <div class="form-group">
                        <label class="form-label">选择头像</label>
                        <div class="weather-options">
                            ${this.avatars.map(avatar => `
                                <button type="button" class="option-btn ${p.avatar === avatar ? 'selected' : ''}" 
                                        onclick="DogProfile.selectAvatar('${avatar}', this)">
                                    ${avatar}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label">狗狗名字</label>
                            <input type="text" class="form-input" id="dogName" value="${p.name}" placeholder="给狗狗起个名字">
                        </div>
                        <div class="form-group">
                            <label class="form-label">品种</label>
                            <input type="text" class="form-input" id="dogBreed" value="${p.breed}" placeholder="例如：金毛、泰迪">
                        </div>
                        <div class="form-group">
                            <label class="form-label">年龄（岁）</label>
                            <input type="number" class="form-input" id="dogAge" value="${p.age}" min="0" step="0.5">
                        </div>
                        <div class="form-group">
                            <label class="form-label">体重（kg）</label>
                            <input type="number" class="form-input" id="dogWeight" value="${p.weight}" min="0" step="0.1">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">💩 排便习惯</label>
                        <textarea class="form-textarea" id="poopHabits" placeholder="例如：每天早晚各一次，喜欢在草地排便...">${p.poopHabits}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">💧 排尿习惯</label>
                        <textarea class="form-textarea" id="peeHabits" placeholder="例如：每次出门都会尿尿，喜欢在树边...">${p.peeHabits}</textarea>
                    </div>
                    <button type="button" class="bone-btn" onclick="DogProfile.saveProfile()">💾 保存资料</button>
                </form>
            </div>
        `;
    },

    selectAvatar(avatar, btn) {
        this.profile.avatar = avatar;
        Storage.save('dog_profile_temp_avatar', avatar);
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    },

    restoreTempAvatar() {
        const tempAvatar = Storage.load('dog_profile_temp_avatar');
        if (tempAvatar) {
            this.profile.avatar = tempAvatar;
        }
    },

    clearTempAvatar() {
        Storage.remove('dog_profile_temp_avatar');
    },

    showEditForm() {
        this.isEditing = true;
        Storage.save('dog_profile_editing', true);
        App.renderPage('profile');
    },

    saveProfile() {
        this.profile.name = document.getElementById('dogName').value.trim();
        this.profile.breed = document.getElementById('dogBreed').value.trim();
        this.profile.age = document.getElementById('dogAge').value;
        this.profile.weight = document.getElementById('dogWeight').value;
        this.profile.poopHabits = document.getElementById('poopHabits').value.trim();
        this.profile.peeHabits = document.getElementById('peeHabits').value.trim();

        if (!this.profile.name) {
            App.showNotification('请输入狗狗名字！', 'error');
            return;
        }

        Storage.saveProfile(this.profile);
        this.isEditing = false;
        Storage.save('dog_profile_editing', false);
        this.clearTempAvatar();
        App.showNotification('狗狗资料保存成功！🐕');
        App.renderPage('profile');
    }
};