const UI = {
    elements: {},

    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadSavedForm();
        this.renderHistory();
    },

    cacheElements() {
        this.elements = {
            senderProvinceSelect: document.querySelector('[data-type="sender"].province-select'),
            senderCitySelect: document.querySelector('[data-type="sender"].city-select'),
            senderDistrictSelect: document.querySelector('[data-type="sender"].district-select'),
            receiverProvinceSelect: document.querySelector('[data-type="receiver"].province-select'),
            receiverCitySelect: document.querySelector('[data-type="receiver"].city-select'),
            receiverDistrictSelect: document.querySelector('[data-type="receiver"].district-select'),
            weightInput: document.getElementById('weight'),
            weightUnitSelect: document.getElementById('weightUnit'),
            lengthInput: document.getElementById('length'),
            widthInput: document.getElementById('width'),
            heightInput: document.getElementById('height'),
            billingTypeSelect: document.getElementById('billingType'),
            calculateBtn: document.getElementById('calculateBtn'),
            resultContainer: document.getElementById('resultContainer'),
            historyList: document.getElementById('historyList'),
            toast: document.getElementById('toast')
        };
    },

    bindEvents() {
        this.elements.senderProvinceSelect.addEventListener('change', (e) => {
            this.updateCities(e.target.value, 'sender');
            this.saveForm();
        });
        this.elements.senderCitySelect.addEventListener('change', (e) => {
            this.updateDistricts(e.target.value, 'sender');
            this.saveForm();
        });
        this.elements.senderDistrictSelect.addEventListener('change', () => this.saveForm());

        this.elements.receiverProvinceSelect.addEventListener('change', (e) => {
            this.updateCities(e.target.value, 'receiver');
            this.saveForm();
        });
        this.elements.receiverCitySelect.addEventListener('change', (e) => {
            this.updateDistricts(e.target.value, 'receiver');
            this.saveForm();
        });
        this.elements.receiverDistrictSelect.addEventListener('change', () => this.saveForm());

        this.elements.weightInput.addEventListener('input', () => this.saveForm());
        this.elements.weightUnitSelect.addEventListener('change', () => this.saveForm());
        this.elements.lengthInput.addEventListener('input', () => this.saveForm());
        this.elements.widthInput.addEventListener('input', () => this.saveForm());
        this.elements.heightInput.addEventListener('input', () => this.saveForm());
        this.elements.billingTypeSelect.addEventListener('change', () => this.saveForm());

        this.elements.calculateBtn.addEventListener('click', () => this.handleCalculate());
    },

    initProvinces(type) {
        const select = type === 'sender' ? 
            this.elements.senderProvinceSelect : 
            this.elements.receiverProvinceSelect;
        
        select.innerHTML = '<option value="">选择省份</option>';
        RegionData.provinces.forEach(province => {
            select.innerHTML += `<option value="${province.code}">${province.name}</option>`;
        });
    },

    updateCities(provinceCode, type) {
        const citySelect = type === 'sender' ? 
            this.elements.senderCitySelect : 
            this.elements.receiverCitySelect;
        const districtSelect = type === 'sender' ? 
            this.elements.senderDistrictSelect : 
            this.elements.receiverDistrictSelect;

        citySelect.innerHTML = '<option value="">选择城市</option>';
        districtSelect.innerHTML = '<option value="">选择区县</option>';

        if (!provinceCode) return;

        const province = RegionData.provinces.find(p => p.code === provinceCode);
        if (province) {
            province.cities.forEach(city => {
                citySelect.innerHTML += `<option value="${city.code}">${city.name}</option>`;
            });
        }
    },

    updateDistricts(cityCode, type) {
        const provinceSelect = type === 'sender' ? 
            this.elements.senderProvinceSelect : 
            this.elements.receiverProvinceSelect;
        const districtSelect = type === 'sender' ? 
            this.elements.senderDistrictSelect : 
            this.elements.receiverDistrictSelect;

        districtSelect.innerHTML = '<option value="">选择区县</option>';

        if (!cityCode) return;

        const province = RegionData.provinces.find(p => p.code === provinceSelect.value);
        if (province) {
            const city = province.cities.find(c => c.code === cityCode);
            if (city) {
                city.districts.forEach(district => {
                    districtSelect.innerHTML += `<option value="${district.code}">${district.name}</option>`;
                });
            }
        }
    },

    getFormData() {
        return {
            senderProvince: this.elements.senderProvinceSelect.value,
            senderCity: this.elements.senderCitySelect.value,
            senderDistrict: this.elements.senderDistrictSelect.value,
            receiverProvince: this.elements.receiverProvinceSelect.value,
            receiverCity: this.elements.receiverCitySelect.value,
            receiverDistrict: this.elements.receiverDistrictSelect.value,
            weight: parseFloat(this.elements.weightInput.value) || 0,
            weightUnit: this.elements.weightUnitSelect.value,
            length: parseFloat(this.elements.lengthInput.value) || 0,
            width: parseFloat(this.elements.widthInput.value) || 0,
            height: parseFloat(this.elements.heightInput.value) || 0,
            billingType: this.elements.billingTypeSelect.value
        };
    },

    validateForm(data) {
        if (!data.senderProvince) {
            this.showToast('请选择寄件省份', 'error');
            return false;
        }
        if (!data.senderCity) {
            this.showToast('请选择寄件城市', 'error');
            return false;
        }
        if (!data.receiverProvince) {
            this.showToast('请选择收件省份', 'error');
            return false;
        }
        if (!data.receiverCity) {
            this.showToast('请选择收件城市', 'error');
            return false;
        }
        if (!data.weight || data.weight <= 0) {
            this.showToast('请输入有效的包裹重量', 'error');
            return false;
        }
        return true;
    },

    handleCalculate() {
        const formData = this.getFormData();
        
        if (!this.validateForm(formData)) {
            return;
        }

        const results = Calculator.calculateAll(formData);
        this.renderResults(results);
        
        Storage.saveCalculationResults(results);
        
        const historyItem = {
            ...formData,
            results: results,
            bestPrice: results[0].finalPrice
        };
        Storage.addHistoryItem(historyItem);
        this.renderHistory();
        
        this.showToast('计算完成！', 'success');
    },

    renderResults(results) {
        if (!results || results.length === 0) {
            this.elements.resultContainer.innerHTML = `
                <div class="empty-state">
                    <span class="icon">📊</span>
                    <p>暂无计算结果</p>
                </div>
            `;
            return;
        }

        let html = '';
        results.forEach((result, index) => {
            const isBest = index === 0;
            html += `
                <div class="result-card ${isBest ? 'best-price' : ''}">
                    <div class="result-card-header">
                        <span class="result-card-name">
                            ${result.company.icon} ${result.company.name}
                            ${isBest ? '<span class="best-price-badge">最优惠</span>' : ''}
                        </span>
                        <span class="result-card-price">
                            ¥${result.finalPrice}
                            ${result.discount < 1 ? `<small>(${result.discountText})</small>` : ''}
                        </span>
                    </div>
                    <div class="result-card-info">
                        <span class="result-tag time">⏱️ ${result.deliveryTime}</span>
                        <span class="result-tag type">📦 ${Calculator.getBillingTypeName(result.billingType)}</span>
                        ${result.discount < 1 ? `<span class="result-tag discount">💰 ${result.discountText}</span>` : ''}
                    </div>
                    <div style="margin-top: 10px; font-size: 12px; color: #666;">
                        计费重量: ${result.calculatedWeight.toFixed(2)}kg | 
                        地域系数: ${result.zoneMultiplier}x
                    </div>
                </div>
            `;
        });

        this.elements.resultContainer.innerHTML = html;
    },

    renderHistory() {
        const history = Storage.loadHistory();
        
        if (!history || history.length === 0) {
            this.elements.historyList.innerHTML = `
                <div class="empty-state">
                    <span class="icon">📋</span>
                    <p>暂无查询记录</p>
                </div>
            `;
            return;
        }

        let html = '';
        history.forEach(item => {
            const senderProvinceName = this.getProvinceName(item.senderProvince);
            const receiverProvinceName = this.getProvinceName(item.receiverProvince);
            const senderCityName = this.getCityName(item.senderProvince, item.senderCity);
            const receiverCityName = this.getCityName(item.receiverProvince, item.receiverCity);
            
            html += `
                <div class="history-item" data-id="${item.id}">
                    <div class="history-item-header">
                        <span class="history-item-route">
                            ${senderProvinceName}${senderCityName} → ${receiverProvinceName}${receiverCityName}
                        </span>
                        <span class="history-item-price">¥${item.bestPrice}</span>
                    </div>
                    <div class="history-item-detail">
                        ${item.weight}${item.weightUnit}
                        ${item.length > 0 ? ` | ${item.length}×${item.width}×${item.height}cm` : ''}
                    </div>
                    <div class="history-item-time">
                        ${Storage.formatTime(item.timestamp)}
                    </div>
                </div>
            `;
        });

        this.elements.historyList.innerHTML = html;
        
        this.elements.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                const historyItem = history.find(h => h.id === id);
                if (historyItem) {
                    this.fillForm(historyItem);
                }
            });
        });
    },

    getProvinceName(code) {
        const province = RegionData.provinces.find(p => p.code === code);
        return province ? province.name : '';
    },

    getCityName(provinceCode, cityCode) {
        const province = RegionData.provinces.find(p => p.code === provinceCode);
        if (!province) return '';
        const city = province.cities.find(c => c.code === cityCode);
        return city ? city.name : '';
    },

    fillForm(data) {
        this.elements.senderProvinceSelect.value = data.senderProvince;
        this.updateCities(data.senderProvince, 'sender');
        this.elements.senderCitySelect.value = data.senderCity;
        this.updateDistricts(data.senderCity, 'sender');
        this.elements.senderDistrictSelect.value = data.senderDistrict;

        this.elements.receiverProvinceSelect.value = data.receiverProvince;
        this.updateCities(data.receiverProvince, 'receiver');
        this.elements.receiverCitySelect.value = data.receiverCity;
        this.updateDistricts(data.receiverCity, 'receiver');
        this.elements.receiverDistrictSelect.value = data.receiverDistrict;

        this.elements.weightInput.value = data.weight;
        this.elements.weightUnitSelect.value = data.weightUnit;
        this.elements.lengthInput.value = data.length || '';
        this.elements.widthInput.value = data.width || '';
        this.elements.heightInput.value = data.height || '';
        this.elements.billingTypeSelect.value = data.billingType;

        this.saveForm();
        this.showToast('已加载历史记录，可直接重新计算', 'success');
    },

    saveForm() {
        const formData = this.getFormData();
        Storage.saveFormData(formData);
    },

    loadSavedForm() {
        this.initProvinces('sender');
        this.initProvinces('receiver');
        
        const savedData = Storage.loadFormData();
        if (savedData) {
            this.fillForm(savedData);
        }
        
        const savedResults = Storage.loadCalculationResults();
        if (savedResults && savedResults.length > 0) {
            this.renderResults(savedResults);
        }
    },

    showToast(message, type = 'default') {
        const toast = this.elements.toast;
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }
};