const PetsPage = {
    pets: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page no-tabbar has-header">
                <header class="header">
                    <div class="header-back" onclick="Router.back()">←</div>
                    <h1 class="header-title">我的宠物</h1>
                    <div class="header-action" id="addPetBtn">+ 添加</div>
                </header>
                <div id="petList"><div class="empty-state"><div class="empty-state-icon">🐾</div><div class="empty-state-text">加载中...</div></div></div>
            </div>
        `;
        document.getElementById('addPetBtn').addEventListener('click', () => this.showPetForm());
        await this.loadPets();
    },

    async loadPets() {
        const list = document.getElementById('petList');
        try {
            const result = await ApiService.get('/chongwu09/pet/my/list/get');
            if (result.code === 0) {
                this.pets = result.data || [];
                if (this.pets.length === 0) {
                    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🐾</div><div class="empty-state-text">暂无宠物，点击右上角添加</div></div>';
                    return;
                }
                list.innerHTML = this.pets.map(p => `
                    <div class="pet-item">
                        <div class="pet-icon">${Utils.getPetIcon(p.pet_type)}</div>
                        <div class="pet-info">
                            <div class="pet-name">${p.name}</div>
                            <div class="pet-detail">${p.pet_type_name} · ${p.breed || '未知品种'} · ${p.gender || '未知性别'}</div>
                            <div class="pet-detail">${p.age ? p.age + '岁' : ''} ${p.weight ? p.weight + 'kg' : ''} ${p.vaccine_status ? '✅已免疫' : '❌未免疫'}</div>
                        </div>
                        <button class="btn btn-outline btn-sm" data-delete="${p.id}" style="color:var(--danger-color);border-color:var(--danger-color)">删除</button>
                    </div>
                `).join('');
                document.querySelectorAll('[data-delete]').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (!confirm('确定删除该宠物？')) return;
                        try {
                            const result = await ApiService.post('/chongwu09/pet/delete', { pet_id: parseInt(btn.dataset.delete) });
                            if (result.code === 0) { Toast.success('删除成功'); this.loadPets(); }
                            else { Toast.error(result.msg); }
                        } catch (e) { Toast.error('删除失败'); }
                    });
                });
            }
        } catch (e) { list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">加载失败</div></div>'; }
    },

    showPetForm() {
        const modal = document.createElement('div');
        modal.id = 'petModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:flex-end';
        modal.innerHTML = `
            <div style="background:var(--card-bg);border-radius:16px 16px 0 0;padding:20px;width:100%;max-height:80vh;overflow-y:auto">
                <h3 style="margin-bottom:16px">添加宠物</h3>
                <div class="form-group"><label class="form-label">宠物名称</label><input type="text" class="form-control" id="petName" placeholder="请输入宠物名称"></div>
                <div class="form-group"><label class="form-label">宠物类型</label>
                    <select class="form-control" id="petType">
                        <option value="dog">犬类</option><option value="cat">猫类</option>
                        <option value="bird">鸟类</option><option value="fish">鱼类</option>
                        <option value="other">其他</option>
                    </select>
                </div>
                <div class="form-group"><label class="form-label">品种</label><input type="text" class="form-control" id="petBreed" placeholder="如金毛、英短"></div>
                <div class="form-group"><label class="form-label">年龄</label><input type="text" class="form-control" id="petAge" placeholder="如2岁"></div>
                <div class="form-group"><label class="form-label">体重</label><input type="text" class="form-control" id="petWeight" placeholder="如5kg"></div>
                <div class="form-group"><label class="form-label">性别</label>
                    <select class="form-control" id="petGender"><option value="公">公</option><option value="母">母</option><option value="未知">未知</option></select>
                </div>
                <div class="form-group"><label class="form-label">健康信息</label><textarea class="form-control" id="petHealth" placeholder="如已绝育、需要特殊饮食等"></textarea></div>
                <div class="form-group"><label class="form-label">疫苗状态</label>
                    <select class="form-control" id="petVaccine"><option value="0">未接种</option><option value="1">已接种</option></select>
                </div>
                <div style="display:flex;gap:12px">
                    <button class="btn btn-outline btn-block" id="cancelPet">取消</button>
                    <button class="btn btn-primary btn-block" id="savePet">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        document.getElementById('cancelPet').addEventListener('click', () => modal.remove());
        document.getElementById('savePet').addEventListener('click', async () => {
            const name = document.getElementById('petName').value.trim();
            if (!name) { Toast.error('请输入宠物名称'); return; }
            try {
                const result = await ApiService.post('/chongwu09/pet/create', {
                    name,
                    pet_type: document.getElementById('petType').value,
                    breed: document.getElementById('petBreed').value.trim(),
                    age: document.getElementById('petAge').value.trim(),
                    weight: document.getElementById('petWeight').value.trim(),
                    gender: document.getElementById('petGender').value,
                    health_info: document.getElementById('petHealth').value.trim(),
                    vaccine_status: parseInt(document.getElementById('petVaccine').value)
                });
                if (result.code === 0) { Toast.success('添加成功'); modal.remove(); this.loadPets(); }
                else { Toast.error(result.msg); }
            } catch (e) { Toast.error('添加失败'); }
        });
    }
};
