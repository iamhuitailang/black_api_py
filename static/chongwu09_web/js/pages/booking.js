const BookingPage = {
    serviceId: null, pets: [], selectedPetId: null,

    async render() {
        const params = Router.getParams();
        this.serviceId = params.service_id;
        if (!this.serviceId) { Router.navigate('home'); return; }
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page no-tabbar has-header">
                <header class="header">
                    <div class="header-back" onclick="Router.back()">←</div>
                    <h1 class="header-title">预约寄养</h1>
                </header>
                <div style="padding:16px">
                    <form id="bookingForm">
                        <div class="form-group">
                            <label class="form-label">选择宠物</label>
                            <select class="form-control" id="petSelect">
                                <option value="">请选择宠物</option>
                            </select>
                            <div style="margin-top:8px"><a href="javascript:;" onclick="Router.navigate('pets')" style="font-size:13px;color:var(--primary-color)">+ 添加新宠物</a></div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">开始日期</label>
                            <input type="date" class="form-control" id="startDate">
                        </div>
                        <div class="form-group">
                            <label class="form-label">结束日期</label>
                            <input type="date" class="form-control" id="endDate">
                        </div>
                        <div class="form-group">
                            <label class="form-label">备注</label>
                            <textarea class="form-control" id="bookingNotes" placeholder="请输入特殊需求或备注(选填)"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="submitBtn">提交预约</button>
                    </form>
                </div>
            </div>
        `;
        await this.loadPets();
        document.getElementById('bookingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    },

    async loadPets() {
        try {
            const result = await ApiService.get('/chongwu09/pet/my/list/get');
            if (result.code === 0) {
                this.pets = result.data || [];
                const select = document.getElementById('petSelect');
                this.pets.forEach(pet => {
                    const opt = document.createElement('option');
                    opt.value = pet.id;
                    opt.textContent = `${pet.name} (${pet.pet_type_name} - ${pet.breed || '未知品种'})`;
                    select.appendChild(opt);
                });
            }
        } catch (e) {}
    },

    async handleSubmit() {
        const petId = document.getElementById('petSelect').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const notes = document.getElementById('bookingNotes').value.trim();
        const btn = document.getElementById('submitBtn');
        if (!petId) { Toast.error('请选择宠物'); return; }
        if (!startDate || !endDate) { Toast.error('请选择寄养日期'); return; }
        if (startDate > endDate) { Toast.error('结束日期不能早于开始日期'); return; }
        btn.disabled = true; btn.textContent = '提交中...';
        try {
            const result = await ApiService.post('/chongwu09/booking/create', {
                service_id: parseInt(this.serviceId),
                pet_id: parseInt(petId),
                start_date: startDate,
                end_date: endDate,
                notes
            });
            if (result.code === 0) { Toast.success('预约成功'); Router.navigate('myBookings'); }
            else { Toast.error(result.msg || '预约失败'); }
        } catch (e) { Toast.error('预约失败'); }
        finally { btn.disabled = false; btn.textContent = '提交预约'; }
    }
};
