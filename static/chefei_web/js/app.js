const { createApp, ref, reactive, computed, onMounted, onUnmounted, watch } = Vue;

const App = {
    setup() {
        const currentTab = ref('entry');
        const tabs = [
            { key: 'entry', label: '车辆入场', icon: '🚗' },
            { key: 'exit', label: '车辆出场', icon: '💰' },
            { key: 'parking', label: '在场车辆', icon: '🚙' },
            { key: 'history', label: '历史记录', icon: '📋' }
        ];

        const vehicleTypes = ref([]);
        const parkingList = ref([]);
        const historyList = reactive({
            items: [],
            total: 0,
            page: 1,
            page_size: 20,
            total_pages: 0
        });

        const plateValidation = ref(null);
        const statistics = ref(null);

        const entryForm = reactive({
            plate_number: '',
            vehicle_type_code: 'small'
        });

        const exitSearch = ref('');
        const selectedParking = ref(null);
        const feePreview = ref(null);

        const historyFilter = reactive({
            plate_number: '',
            start_date: '',
            end_date: ''
        });

        const toast = reactive({
            show: false,
            message: '',
            type: 'success'
        });

        const modal = reactive({
            show: false,
            title: '',
            type: '',
            data: null
        });

        let refreshInterval = null;

        const canEntry = computed(() => {
            return entryForm.plate_number.trim() !== '' && entryForm.vehicle_type_code !== '';
        });

        const filteredParkingList = computed(() => {
            const list = parkingList.value.map(item => ({
                ...item,
                vehicle_type_icon: getVehicleIcon(item.vehicle_type_code)
            }));
            
            if (!exitSearch.value.trim()) {
                return list;
            }
            const search = exitSearch.value.trim().toUpperCase();
            return list.filter(item => 
                item.plate_number.toUpperCase().includes(search)
            );
        });

        function showToast(message, type = 'success') {
            toast.message = message;
            toast.type = type;
            toast.show = true;
            setTimeout(() => {
                toast.show = false;
            }, 3000);
        }

        function switchTab(tab) {
            currentTab.value = tab;
            if (tab === 'exit') {
                selectedParking.value = null;
                feePreview.value = null;
                exitSearch.value = '';
            }
            if (tab === 'history') {
                loadHistory(1);
            }
        }

        function getVehicleIcon(code) {
            const icons = {
                'small': '🚗',
                'large': '🚐',
                'motorcycle': '🏍️',
                'bicycle': '🚲'
            };
            return icons[code] || '🚗';
        }

        function formatTime(time) {
            return Utils.formatTime(time);
        }

        function formatDuration(minutes) {
            return Utils.formatDuration(minutes);
        }

        async function loadVehicleTypes() {
            const result = await ApiService.getVehicleTypes();
            if (result.code === 0 && result.data) {
                vehicleTypes.value = result.data;
            }
        }

        async function loadParkingList() {
            const result = await ApiService.getParkingList();
            if (result.code === 0 && result.data) {
                parkingList.value = result.data;
            }
        }

        async function loadStatistics() {
            const result = await ApiService.getStatistics();
            if (result.code === 0 && result.data) {
                statistics.value = result.data;
            }
        }

        async function loadHistory(page) {
            const params = {
                page: page,
                page_size: 20,
                plate_number: historyFilter.plate_number,
                start_date: historyFilter.start_date ? historyFilter.start_date + ' 00:00:00' : undefined,
                end_date: historyFilter.end_date ? historyFilter.end_date + ' 23:59:59' : undefined
            };
            
            const result = await ApiService.getHistoryList(params);
            if (result.code === 0 && result.data) {
                Object.assign(historyList, result.data);
            }
        }

        function validatePlateNumber(plate) {
            if (!plate || !plate.trim()) {
                return { valid: false, message: '请输入车牌号' };
            }
            
            plate = plate.trim().toUpperCase();
            
            if (plate.length < 5 || plate.length > 10) {
                return { valid: false, message: '车牌号长度不正确' };
            }
            
            const patterns = [
                /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]?$/,
                /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,6}$/,
                /^WJ[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领]?[0-9]{4,5}[0-9A-Z]$/,
                /^[A-Z]{2}[0-9]{5}$/,
                /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z0-9]{5,6}$/
            ];
            
            for (const pattern of patterns) {
                if (pattern.test(plate)) {
                    return { valid: true, plate: plate };
                }
            }
            
            return { valid: false, message: '请输入正确的车牌号格式' };
        }

        async function handleEntry() {
            if (!canEntry.value) return;

            const validation = validatePlateNumber(entryForm.plate_number);
            if (!validation.valid) {
                showToast(validation.message, 'error');
                return;
            }

            const result = await ApiService.vehicleEntry({
                plate_number: entryForm.plate_number.trim(),
                vehicle_type_code: entryForm.vehicle_type_code
            });

            if (result.code === 0) {
                showToast('入场成功！', 'success');
                entryForm.plate_number = '';
                entryForm.vehicle_type_code = 'small';
                await loadParkingList();
                await loadStatistics();
            } else {
                showToast(result.message || '入场失败', 'error');
            }
        }

        async function selectParkingForExit(parking) {
            selectedParking.value = parking;
            
            try {
                const result = await ApiService.calculateFeePreview({
                    record_id: parking.id
                });

                if (result.code === 0 && result.data) {
                    feePreview.value = result.data;
                } else {
                    showToast(result.message || '费用计算失败', 'error');
                }
            } catch (e) {
                showToast('费用计算失败', 'error');
            }
        }

        function quickExit(parking) {
            modal.show = true;
            modal.title = '确认出场';
            modal.type = 'exit_confirm';
            modal.data = {
                id: parking.id,
                plate_number: parking.plate_number,
                total_fee: parking.current_fee
            };
        }

        async function handleExit() {
            if (!selectedParking.value) return;

            modal.show = true;
            modal.title = '确认出场';
            modal.type = 'exit_confirm';
            modal.data = {
                id: selectedParking.value.id,
                plate_number: feePreview.value.plate_number,
                total_fee: feePreview.value.total_fee
            };
        }

        async function confirmExit(recordId) {
            const result = await ApiService.vehicleExit({
                record_id: recordId
            });

            if (result.code === 0) {
                showToast('出场成功！', 'success');
                selectedParking.value = null;
                feePreview.value = null;
                exitSearch.value = '';
                await loadParkingList();
                await loadStatistics();
                if (currentTab.value === 'history') {
                    await loadHistory(1);
                }
            } else {
                showToast(result.message || '出场失败', 'error');
            }
        }

        function closeModal() {
            modal.show = false;
            modal.type = '';
            modal.data = null;
        }

        async function confirmModal() {
            if (modal.type === 'exit_confirm' && modal.data) {
                await confirmExit(modal.data.id);
            }
            closeModal();
        }

        function startAutoRefresh() {
            refreshInterval = setInterval(async () => {
                await loadParkingList();
                await loadStatistics();
                
                if (selectedParking.value) {
                    const result = await ApiService.calculateFeePreview({
                        record_id: selectedParking.value.id
                    });
                    if (result.code === 0 && result.data) {
                        feePreview.value = result.data;
                    }
                }
            }, 5000);
        }

        function stopAutoRefresh() {
            if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
            }
        }

        onMounted(async () => {
            try {
                document.body.classList.add('vue-ready');
                const appElement = document.getElementById('app');
                if (appElement) {
                    appElement.classList.remove('loading');
                }
                
                await loadVehicleTypes();
                await loadParkingList();
                await loadStatistics();
                startAutoRefresh();
            } catch (e) {
                console.error('初始化失败:', e);
                document.body.classList.add('vue-ready');
                const appElement = document.getElementById('app');
                if (appElement) {
                    appElement.classList.remove('loading');
                }
            }
        });

        onUnmounted(() => {
            stopAutoRefresh();
        });

        return {
            currentTab,
            tabs,
            vehicleTypes,
            parkingList,
            historyList,
            statistics,
            entryForm,
            exitSearch,
            selectedParking,
            feePreview,
            historyFilter,
            toast,
            modal,
            canEntry,
            filteredParkingList,
            switchTab,
            getVehicleIcon,
            formatTime,
            formatDuration,
            loadHistory,
            handleEntry,
            selectParkingForExit,
            quickExit,
            handleExit,
            closeModal,
            confirmModal
        };
    }
};

const app = createApp(App);

app.config.errorHandler = function(err, vm, info) {
    console.error('Vue Error:', err, info);
};

app.config.warnHandler = function(msg, vm, trace) {
    console.warn('Vue Warn:', msg, trace);
};

app.mount('#app');
