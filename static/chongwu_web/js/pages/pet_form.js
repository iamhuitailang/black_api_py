const PetFormPage = {
    editing: false,
    petId: null,
    formData: {
        nickname: '',
        species: 'other',
        breed: '',
        birthday: '',
        estimated_age: '',
        gender: 'unknown',
        weight: 0,
        weight_unit: 'kg',
        coat_color: '',
        chip_number: '',
        personality_tags: [],
        avatar: ''
    },

    speciesOptions: [
        { value: 'dog', label: '🐕 狗' },
        { value: 'cat', label: '🐱 猫' },
        { value: 'hamster', label: '🐹 仓鼠' },
        { value: 'rabbit', label: '🐰 兔子' },
        { value: 'bird', label: '🐦 鸟' },
        { value: 'fish', label: '🐠 鱼' },
        { value: 'other', label: '🐾 其他' }
    ],

    genderOptions: [
        { value: 'male', label: '男孩 ♂' },
        { value: 'female', label: '女孩 ♀' },
        { value: 'unknown', label: '未知' }
    ],

    tagOptions: ['活泼', '高冷', '粘人', '胆小', '贪吃', '爱睡'],

    render() {
        const params = Router.getParams();
        if (params && params.petId) {
            this.editing = true;
            this.petId = params.petId;
            this.loadPetData();
        } else {
            this.editing = false;
            this.petId = null;
        }

        this.renderForm();
    },

    async loadPetData() {
        try {
            const result = await ChongwuApi.getPet(this.petId);
            if (result.code === 0) {
                const pet = result.data;
                this.formData = { ...this.formData, ...pet };
                this.formData.personality_tags = pet.personality_tags || [];
                this.renderForm();
            }
        } catch (e) {
            console.error(e);
        }
    },

    renderForm() {
        const app = document.getElementById('app');
        const title = this.editing ? '编辑宠物信息' : '添加宠物';

        app.innerHTML = `
            <div class="paw-bg"></div>
            <div class="page has-header no-tabbar">
                <div class="header">
                    <div class="header-back" id="back-btn">←</div>
                    <div class="header-title">${title}</div>
                </div>

                <div class="card">
                    <div class="pet-avatar" id="pet-avatar-container">
                        <div id="avatar-preview">${this.getAvatarEmoji()}</div>
                        <div class="pet-avatar-upload" id="avatar-upload-btn">📷</div>
                    </div>
                    <input type="file" id="avatar-input" accept="image/*" style="display:none">

                    <div class="form-group">
                        <label class="form-label required">宠物昵称</label>
                        <input type="text" class="form-input" id="nickname" value="${this.formData.nickname}" placeholder="如：团团">
                    </div>

                    <div class="form-group">
                        <label class="form-label required">物种</label>
                        <div class="radio-group" id="species-group">
                            ${this.speciesOptions.map(opt => `
                                <label class="radio-item ${this.formData.species === opt.value ? 'active' : ''}">
                                    <input type="radio" name="species" value="${opt.value}" ${this.formData.species === opt.value ? 'checked' : ''}>
                                    ${opt.label}
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">品种</label>
                            <input type="text" class="form-input" id="breed" value="${this.formData.breed}" placeholder="如：金毛、布偶猫">
                        </div>
                        <div class="form-group">
                            <label class="form-label">毛色</label>
                            <input type="text" class="form-input" id="coat_color" value="${this.formData.coat_color}" placeholder="如：橘色、黑白">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">生日</label>
                            <input type="date" class="form-input" id="birthday" value="${this.formData.birthday}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">估计年龄</label>
                            <input type="text" class="form-input" id="estimated_age" value="${this.formData.estimated_age}" placeholder="如：2岁">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">性别</label>
                        <div class="radio-group" id="gender-group">
                            ${this.genderOptions.map(opt => `
                                <label class="radio-item ${this.formData.gender === opt.value ? 'active' : ''}">
                                    <input type="radio" name="gender" value="${opt.value}" ${this.formData.gender === opt.value ? 'checked' : ''}>
                                    ${opt.label}
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">体重</label>
                            <input type="number" step="0.01" class="form-input" id="weight" value="${this.formData.weight}" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">单位</label>
                            <select class="form-select" id="weight_unit">
                                <option value="kg" ${this.formData.weight_unit === 'kg' ? 'selected' : ''}>kg</option>
                                <option value="g" ${this.formData.weight_unit === 'g' ? 'selected' : ''}>g</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">芯片号</label>
                        <input type="text" class="form-input" id="chip_number" value="${this.formData.chip_number}" placeholder="选填">
                    </div>

                    <div class="form-group">
                        <label class="form-label">性格标签</label>
                        <div class="checkbox-group" id="tags-group">
                            ${this.tagOptions.map(tag => `
                                <label class="checkbox-item ${(this.formData.personality_tags || []).includes(tag) ? 'active' : ''}">
                                    <input type="checkbox" value="${tag}" ${(this.formData.personality_tags || []).includes(tag) ? 'checked' : ''}>
                                    ${tag}
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <button class="btn btn-primary btn-block" id="save-btn">
                        ${this.editing ? '保存修改' : '添加宠物'}
                    </button>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    getAvatarEmoji() {
        const icons = {
            dog: '🐕', cat: '🐱', hamster: '🐹',
            rabbit: '🐰', bird: '🐦', fish: '🐠', other: '🐾'
        };
        return icons[this.formData.species] || '🐾';
    },

    bindEvents() {
        document.getElementById('back-btn').addEventListener('click', () => {
            Router.back();
        });

        document.querySelectorAll('#species-group input[type="radio"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.formData.species = e.target.value;
                document.querySelectorAll('#species-group .radio-item').forEach(item => {
                    item.classList.toggle('active', item.querySelector('input').checked);
                });
                if (!this.formData.avatar) {
                    document.getElementById('avatar-preview').textContent = this.getAvatarEmoji();
                }
            });
        });

        document.querySelectorAll('#gender-group input[type="radio"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.formData.gender = e.target.value;
                document.querySelectorAll('#gender-group .radio-item').forEach(item => {
                    item.classList.toggle('active', item.querySelector('input').checked);
                });
            });
        });

        document.querySelectorAll('#tags-group input[type="checkbox"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const tag = e.target.value;
                let tags = this.formData.personality_tags || [];
                if (e.target.checked) {
                    if (!tags.includes(tag)) tags.push(tag);
                } else {
                    tags = tags.filter(t => t !== tag);
                }
                this.formData.personality_tags = tags;
                document.querySelectorAll('#tags-group .checkbox-item').forEach(item => {
                    item.classList.toggle('active', item.querySelector('input').checked);
                });
            });
        });

        document.getElementById('avatar-upload-btn').addEventListener('click', () => {
            document.getElementById('avatar-input').click();
        });

        document.getElementById('avatar-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    this.formData.avatar = ev.target.result;
                    document.getElementById('avatar-preview').innerHTML = `<img src="${ev.target.result}" alt="avatar">`;
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('save-btn').addEventListener('click', () => this.save());
    },

    collectFormData() {
        return {
            nickname: document.getElementById('nickname').value.trim(),
            species: this.formData.species,
            breed: document.getElementById('breed').value.trim(),
            coat_color: document.getElementById('coat_color').value.trim(),
            birthday: document.getElementById('birthday').value,
            estimated_age: document.getElementById('estimated_age').value.trim(),
            gender: this.formData.gender,
            weight: parseFloat(document.getElementById('weight').value) || 0,
            weight_unit: document.getElementById('weight_unit').value,
            chip_number: document.getElementById('chip_number').value.trim(),
            personality_tags: this.formData.personality_tags || [],
            avatar: this.formData.avatar || ''
        };
    },

    async save() {
        const data = this.collectFormData();

        if (!data.nickname) {
            Toast.error('请输入宠物昵称');
            return;
        }

        try {
            let result;
            if (this.editing) {
                result = await ChongwuApi.updatePet(this.petId, data);
            } else {
                result = await ChongwuApi.createPet(data);
            }

            if (result.code === 0) {
                Toast.success(this.editing ? '修改成功' : '添加成功');
                if (this.editing) {
                    Router.back();
                } else {
                    Router.navigate('home');
                }
            } else {
                Toast.error(result.msg || '保存失败');
            }
        } catch (e) {
            console.error(e);
            Toast.error('保存失败');
        }
    }
};