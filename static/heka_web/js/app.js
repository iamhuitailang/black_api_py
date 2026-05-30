const { createApp, ref, reactive, computed, onMounted, nextTick, watch } = Vue;

const STORAGE_KEY = 'heka_card_draft';

createApp({
    setup() {
        const currentStep = ref(1);
        const holidays = ref([]);
        const templates = ref([]);
        const stickers = ref([]);
        const backgrounds = ref([]);
        
        const selectedHoliday = ref(null);
        const selectedTemplate = ref(null);
        const selectedBackground = ref(null);
        
        const cardCanvas = ref(null);
        const canvasWrapper = ref(null);
        const canvasWidth = 500;
        const canvasHeight = 600;
        
        const cardConfig = reactive({
            title: '',
            message: '',
            signature: '',
            date: '',
            fontFamily: 'Microsoft YaHei',
            fontSize: 24,
            fontColor: '#333333'
        });
        
        const cardStickers = ref([]);
        const hasDraft = ref(false);
        const lastSaved = ref('');
        const saveTimer = ref(null);
        
        const forceSaveDraft = () => {
            if (!selectedHoliday.value) return;
            if (currentStep.value >= 2 && !selectedTemplate.value) return;
            
            const draft = {
                holiday: selectedHoliday.value,
                template: selectedTemplate.value,
                background: selectedBackground.value,
                config: {
                    title: cardConfig.title,
                    message: cardConfig.message,
                    signature: cardConfig.signature,
                    date: cardConfig.date,
                    fontFamily: cardConfig.fontFamily,
                    fontSize: cardConfig.fontSize,
                    fontColor: cardConfig.fontColor
                },
                stickers: [...cardStickers.value],
                timestamp: Date.now(),
                step: currentStep.value
            };
            
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
                hasDraft.value = true;
                lastSaved.value = new Date().toLocaleTimeString();
                console.log('草稿已保存', draft);
            } catch (e) {
                console.error('保存草稿失败:', e);
            }
        };
        
        const debouncedSaveDraft = () => {
            if (saveTimer.value) {
                clearTimeout(saveTimer.value);
            }
            saveTimer.value = setTimeout(() => {
                forceSaveDraft();
            }, 300);
        };
        
        const restoreDraft = () => {
            try {
                const draftStr = localStorage.getItem(STORAGE_KEY);
                if (!draftStr) {
                    console.log('没有找到草稿');
                    return false;
                }
                
                const draft = JSON.parse(draftStr);
                if (!draft || !draft.holiday) {
                    console.log('草稿数据不完整');
                    return false;
                }
                
                const hoursSinceSaved = (Date.now() - draft.timestamp) / (1000 * 60 * 60);
                if (hoursSinceSaved > 24) {
                    clearDraft();
                    console.log('草稿已过期');
                    return false;
                }
                
                selectedHoliday.value = draft.holiday;
                selectedTemplate.value = draft.template;
                selectedBackground.value = draft.background;
                
                if (draft.config) {
                    cardConfig.title = draft.config.title || '';
                    cardConfig.message = draft.config.message || '';
                    cardConfig.signature = draft.config.signature || '';
                    cardConfig.date = draft.config.date || '';
                    cardConfig.fontFamily = draft.config.fontFamily || 'Microsoft YaHei';
                    cardConfig.fontSize = draft.config.fontSize || 24;
                    cardConfig.fontColor = draft.config.fontColor || '#333333';
                }
                if (draft.stickers) {
                    cardStickers.value = draft.stickers;
                }
                
                loadTemplates(draft.holiday.id);
                loadStickers(draft.holiday.id);
                loadBackgrounds(draft.holiday.id);
                
                currentStep.value = draft.step || 1;
                hasDraft.value = true;
                
                console.log('草稿已恢复', draft);
                
                if (currentStep.value === 3) {
                    nextTick(() => {
                        renderCanvas();
                    });
                }
                
                return true;
            } catch (e) {
                console.error('恢复草稿失败:', e);
                return false;
            }
        };
        
        const clearDraft = () => {
            try {
                localStorage.removeItem(STORAGE_KEY);
                hasDraft.value = false;
                lastSaved.value = '';
                console.log('草稿已清除');
            } catch (e) {
                console.error('清除草稿失败:', e);
            }
        };
        
        const checkDraft = () => {
            try {
                const draftStr = localStorage.getItem(STORAGE_KEY);
                if (draftStr) {
                    const draft = JSON.parse(draftStr);
                    const hoursSinceSaved = (Date.now() - draft.timestamp) / (1000 * 60 * 60);
                    hasDraft.value = hoursSinceSaved < 24;
                } else {
                    hasDraft.value = false;
                }
            } catch {
                hasDraft.value = false;
            }
            return hasDraft.value;
        };
        
        const autoRestoreOnLoad = () => {
            if (checkDraft()) {
                const draftStr = localStorage.getItem(STORAGE_KEY);
                const draft = JSON.parse(draftStr);
                if (draft && draft.step >= 2) {
                    const stepText = draft.step === 2 ? '已选择节日和模板' : '正在编辑贺卡';
                    const confirmed = confirm(`检测到未完成的贺卡草稿（${stepText}），是否继续编辑？\n\n点击"确定"恢复草稿\n点击"取消"重新开始`);
                    if (confirmed) {
                        restoreDraft();
                    } else {
                        clearDraft();
                    }
                }
            }
        };
        
        const colorOptions = [
            '#000000', '#333333', '#666666', '#ffffff',
            '#ff0000', '#ff6b6b', '#ffd700', '#ff8c00',
            '#008000', '#00bfff', '#667eea', '#764ba2',
            '#ff69b4', '#ff1493', '#8b4513', '#2f4f4f'
        ];
        
        const showShareModal = ref(false);
        const shareCode = ref('');
        const shareLinkInput = ref(null);
        
        const isDragging = ref(false);
        const dragIndex = ref(-1);
        const dragStartPos = reactive({ x: 0, y: 0 });
        const dragStickerOffset = reactive({ x: 0, y: 0 });
        
        const currentDate = computed(() => {
            const now = new Date();
            return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
        });
        
        const shareLink = computed(() => {
            return `${window.location.origin}/static/heka_web/view.html?code=${shareCode.value}`;
        });
        
        const templateStyles = [
            { angle: 135, type: 'linear' },
            { angle: 45, type: 'linear' },
            { angle: 90, type: 'linear' },
            { angle: 180, type: 'linear' },
            { angle: 225, type: 'radial' },
            { angle: 315, type: 'linear' }
        ];
        
        const defaultGreetings = {
            1: ['新春快乐', '万事如意', '恭喜发财', '岁岁平安', '阖家幸福'],
            2: ['圣诞快乐', 'Merry Christmas', '平安喜乐', '幸福美满'],
            3: ['生日快乐', 'Happy Birthday', '心想事成', '美梦成真', '青春永驻'],
            4: ['情人节快乐', '我爱你', '永远在一起', '甜蜜幸福'],
            5: ['感恩节快乐', '感谢有你', '感恩陪伴', '幸福安康'],
            6: ['复活节快乐', '新生喜悦', '充满希望', '幸福美满'],
            7: ['国庆节快乐', '祖国万岁', '繁荣昌盛', '国泰民安']
        };
        
        const stickerEmojis = {
            1: ['🏮', '🧨', '🧧', '🐉', '💰', '🎊'],
            2: ['🎄', '❄️', '🎁', '🦌', '🎅', '🔔'],
            3: ['🎂', '🎈', '🎁', '🎀', '🕯️', '🎉'],
            4: ['❤️', '🌹', '🧸', '🍫', '💍', '💕'],
            5: ['🎃', '🍁', '🦃', '🌽', '🍂', '🥧'],
            6: ['🥚', '🐰', '🌸', '🧺', '🌷', '🦋'],
            7: ['🇨🇳', '🎆', '🏛️', '🕊️', '🌟', '🎇']
        };
        
        const loadHolidays = async () => {
            try {
                const response = await fetch('/api/heka/holiday/list/get');
                const data = await response.json();
                if (data.code === 0) {
                    holidays.value = data.data;
                }
            } catch (e) {
                console.error('加载节日列表失败', e);
                loadDefaultHolidays();
            }
        };
        
        const loadDefaultHolidays = () => {
            holidays.value = [
                { id: 1, name: '春节', emoji: '🧧', primary_color: '#FF0000', secondary_color: '#FFD700', elements: '灯笼、鞭炮、福字、生肖' },
                { id: 2, name: '圣诞节', emoji: '🎄', primary_color: '#FF0000', secondary_color: '#008000', elements: '圣诞树、雪花、礼物、驯鹿' },
                { id: 3, name: '生日', emoji: '🎂', primary_color: '#FF69B4', secondary_color: '#87CEEB', elements: '蛋糕、气球、礼物、彩带' },
                { id: 4, name: '情人节', emoji: '💕', primary_color: '#FF69B4', secondary_color: '#FF0000', elements: '爱心、玫瑰、小熊' },
                { id: 5, name: '感恩节', emoji: '🦃', primary_color: '#FF8C00', secondary_color: '#8B4513', elements: '南瓜、枫叶、火鸡' },
                { id: 6, name: '复活节', emoji: '🐰', primary_color: '#FFB6C1', secondary_color: '#FFFFE0', elements: '彩蛋、兔子、花朵' },
                { id: 7, name: '国庆节', emoji: '🇨🇳', primary_color: '#FF0000', secondary_color: '#FFD700', elements: '国旗、烟花、天安门' }
            ];
        };
        
        const loadTemplates = async (holidayId) => {
            try {
                const response = await fetch(`/api/heka/template/list/get?holiday_id=${holidayId}`);
                const data = await response.json();
                if (data.code === 0 && data.data.length > 0) {
                    templates.value = data.data;
                } else {
                    loadDefaultTemplates(holidayId);
                }
            } catch (e) {
                loadDefaultTemplates(holidayId);
            }
        };
        
        const loadDefaultTemplates = (holidayId) => {
            const count = holidayId <= 3 ? 6 : (holidayId === 4 ? 5 : 4);
            templates.value = [];
            for (let i = 1; i <= count; i++) {
                templates.value.push({
                    id: i,
                    holiday_id: holidayId,
                    name: `模板${i}`,
                    width: 500,
                    height: 600
                });
            }
        };
        
        const loadStickers = async (holidayId) => {
            try {
                const response = await fetch(`/api/heka/sticker/list/get?holiday_id=${holidayId}`);
                const data = await response.json();
                if (data.code === 0 && data.data.length > 0) {
                    stickers.value = data.data;
                } else {
                    loadDefaultStickers(holidayId);
                }
            } catch (e) {
                loadDefaultStickers(holidayId);
            }
        };
        
        const loadDefaultStickers = (holidayId) => {
            const emojis = stickerEmojis[holidayId] || ['⭐', '✨', '💫', '🌟'];
            stickers.value = emojis.map((emoji, idx) => ({
                id: idx + 1,
                holiday_id: holidayId,
                name: emoji,
                emoji: emoji
            }));
        };
        
        const loadBackgrounds = async (holidayId) => {
            try {
                const response = await fetch(`/api/heka/background/list/get?holiday_id=${holidayId}`);
                const data = await response.json();
                if (data.code === 0 && data.data.length > 0) {
                    backgrounds.value = data.data;
                } else {
                    loadDefaultBackgrounds(holidayId);
                }
            } catch (e) {
                loadDefaultBackgrounds(holidayId);
            }
        };
        
        const loadDefaultBackgrounds = (holidayId) => {
            const colors = {
                1: ['#FF0000', '#FFD700', '#FF6B6B', '#FFE4E1'],
                2: ['#FF0000', '#008000', '#FFFFFF', '#C41E3A'],
                3: ['#FF69B4', '#87CEEB', '#FFD700', '#98FB98'],
                4: ['#FF69B4', '#FF1493', '#FFB6C1', '#FFC0CB'],
                5: ['#FF8C00', '#8B4513', '#DAA520', '#CD853F'],
                6: ['#FFB6C1', '#FFFFE0', '#98FB98', '#87CEEB'],
                7: ['#FF0000', '#FFD700', '#DC143C', '#FF6347']
            };
            const bgColors = colors[holidayId] || ['#FFFFFF', '#F0F0F0', '#E8E8E8', '#D0D0D0'];
            backgrounds.value = bgColors.map((color, idx) => ({
                id: idx + 1,
                holiday_id: holidayId,
                name: `背景${idx + 1}`,
                color: color
            }));
        };
        
        const selectHoliday = (holiday) => {
            selectedHoliday.value = holiday;
            selectedTemplate.value = null;
            loadTemplates(holiday.id);
            loadStickers(holiday.id);
            loadBackgrounds(holiday.id);
            currentStep.value = 2;
            nextTick(() => {
                forceSaveDraft();
            });
        };
        
        const selectTemplate = (template) => {
            selectedTemplate.value = template;
            nextTick(() => {
                forceSaveDraft();
            });
        };
        
        const selectBackground = (bg) => {
            selectedBackground.value = bg;
            nextTick(() => {
                renderCanvas();
                forceSaveDraft();
            });
        };
        
        const selectFontColor = (color) => {
            cardConfig.fontColor = color;
            nextTick(() => {
                renderCanvas();
                forceSaveDraft();
            });
        };
        
        const goToEditor = () => {
            if (!selectedTemplate.value) return;
            
            const greetings = defaultGreetings[selectedHoliday.value.id] || ['节日快乐'];
            cardConfig.title = greetings[0];
            cardConfig.message = '愿你节日快乐，幸福安康！';
            cardConfig.signature = '';
            cardConfig.date = currentDate.value;
            cardConfig.fontFamily = 'Microsoft YaHei';
            cardConfig.fontSize = 24;
            cardConfig.fontColor = '#333333';
            cardStickers.value = [];
            
            if (backgrounds.value.length > 0) {
                selectedBackground.value = backgrounds.value[0];
            }
            
            currentStep.value = 3;
            nextTick(() => {
                renderCanvas();
                forceSaveDraft();
            });
        };
        
        const goBack = () => {
            if (currentStep.value === 3) {
                forceSaveDraft();
                const confirmed = confirm('确定要返回吗？当前内容已自动保存，下次可以继续编辑。');
                if (confirmed) {
                    currentStep.value = 2;
                    nextTick(() => {
                        forceSaveDraft();
                    });
                }
            } else if (currentStep.value === 2) {
                const clearConfirmed = confirm('是否要清除之前的草稿内容？\n\n点击"确定"清除草稿\n点击"取消"保留草稿');
                if (clearConfirmed) {
                    clearDraft();
                } else {
                    forceSaveDraft();
                }
                currentStep.value = 1;
            }
        };
        
        const getTemplateStyle = (template) => {
            const holiday = selectedHoliday.value;
            if (!holiday) return {};
            
            const styleIndex = (template.id - 1) % templateStyles.length;
            const style = templateStyles[styleIndex];
            const c1 = holiday.primary_color;
            const c2 = holiday.secondary_color;
            const c3 = lightenColor(c1, 30);
            const c4 = darkenColor(c2, 20);
            
            let background = '';
            if (style.type === 'radial') {
                background = `radial-gradient(circle at 30% 30%, ${c3} 0%, ${c1} 50%, ${c4} 100%)`;
            } else {
                const patterns = [
                    `linear-gradient(${style.angle}deg, ${c1} 0%, ${c2} 50%, ${c3} 100%)`,
                    `linear-gradient(${style.angle}deg, ${c4} 0%, ${c1} 30%, ${c2} 70%, ${c3} 100%)`,
                    `linear-gradient(${style.angle}deg, ${c1} 0%, ${c3} 25%, ${c2} 50%, ${c4} 75%, ${c1} 100%)`,
                    `linear-gradient(${style.angle}deg, ${c2} 0%, ${c1} 40%, ${c3} 100%)`,
                    `linear-gradient(${style.angle}deg, ${c3} 0%, ${c1} 30%, ${c2} 70%, ${c4} 100%)`,
                    `linear-gradient(${style.angle}deg, ${c4} 0%, ${c2} 20%, ${c1} 60%, ${c3} 100%)`
                ];
                background = patterns[styleIndex % patterns.length];
            }
            
            return {
                background: background,
                position: 'relative',
                overflow: 'hidden'
            };
        };
        
        const lightenColor = (color, amount) => {
            const hex = color.replace('#', '');
            const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
            const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
            const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        };
        
        const darkenColor = (color, amount) => {
            const hex = color.replace('#', '');
            const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
            const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
            const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        };
        
        const getStickerEmoji = (sticker) => {
            if (sticker.emoji) return sticker.emoji;
            const emojis = stickerEmojis[sticker.holiday_id || selectedHoliday.value?.id] || ['⭐'];
            const idx = (sticker.id - 1) % emojis.length;
            return emojis[idx];
        };
        
        const addSticker = (sticker) => {
            cardStickers.value.push({
                id: sticker.id,
                holiday_id: sticker.holiday_id,
                name: sticker.name,
                emoji: getStickerEmoji(sticker),
                x: Math.random() * (canvasWidth - 80) + 20,
                y: Math.random() * (canvasHeight - 120) + 50,
                scale: 1
            });
            nextTick(() => {
                forceSaveDraft();
            });
        };
        
        const removeSticker = (index) => {
            cardStickers.value.splice(index, 1);
            nextTick(() => {
                forceSaveDraft();
            });
        };
        
        const startStickerDrag = (event, index) => {
            event.preventDefault();
            event.stopPropagation();
            isDragging.value = true;
            dragIndex.value = index;
            
            const sticker = cardStickers.value[index];
            dragStartPos.x = event.clientX;
            dragStartPos.y = event.clientY;
            dragStickerOffset.x = event.clientX - sticker.x;
            dragStickerOffset.y = event.clientY - sticker.y;
        };
        
        const startDrag = (event) => {
        };
        
        const onDrag = (event) => {
            if (!isDragging.value || dragIndex.value < 0) return;
            
            const wrapper = canvasWrapper.value;
            if (!wrapper) return;
            
            const rect = wrapper.getBoundingClientRect();
            const scaleX = canvasWidth / rect.width;
            const scaleY = canvasHeight / rect.height;
            
            const clientX = event.touches ? event.touches[0].clientX : event.clientX;
            const clientY = event.touches ? event.touches[0].clientY : event.clientY;
            
            let x = (clientX - dragStickerOffset.x) * scaleX;
            let y = (clientY - dragStickerOffset.y) * scaleY;
            
            x = Math.max(0, Math.min(canvasWidth - 60, x));
            y = Math.max(0, Math.min(canvasHeight - 60, y));
            
            cardStickers.value[dragIndex.value].x = x;
            cardStickers.value[dragIndex.value].y = y;
            
            dragStartPos.x = clientX;
            dragStartPos.y = clientY;
        };
        
        const stopDrag = () => {
            if (isDragging.value && dragIndex.value >= 0) {
                forceSaveDraft();
            }
            isDragging.value = false;
            dragIndex.value = -1;
        };
        
        watch(cardConfig, () => {
            if (currentStep.value === 3) {
                nextTick(() => {
                    renderCanvas();
                    debouncedSaveDraft();
                });
            }
        }, { deep: true });
        
        watch(cardStickers, () => {
            if (currentStep.value === 3) {
                debouncedSaveDraft();
            }
        }, { deep: true });
        
        watch(selectedBackground, () => {
            if (currentStep.value === 3) {
                debouncedSaveDraft();
            }
        });
        
        const renderCanvas = () => {
            const canvas = cardCanvas.value;
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            
            if (selectedBackground.value) {
                ctx.fillStyle = selectedBackground.value.color || '#FFFFFF';
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            } else {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            }
            
            drawDecorativeBorder(ctx);
            
            ctx.font = `bold ${cardConfig.fontSize + 8}px ${cardConfig.fontFamily}`;
            ctx.fillStyle = cardConfig.fontColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cardConfig.title, canvasWidth / 2, 80);
            
            ctx.font = `${cardConfig.fontSize}px ${cardConfig.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.fillStyle = cardConfig.fontColor;
            
            const messageLines = wrapText(ctx, cardConfig.message, canvasWidth - 80);
            const lineHeight = cardConfig.fontSize * 1.5;
            const startY = 150;
            
            messageLines.forEach((line, index) => {
                ctx.fillText(line, canvasWidth / 2, startY + index * lineHeight);
            });
            
            const signatureY = canvasHeight - 120;
            ctx.font = `${cardConfig.fontSize - 2}px ${cardConfig.fontFamily}`;
            ctx.textAlign = 'right';
            ctx.fillText(cardConfig.signature, canvasWidth - 50, signatureY);
            
            ctx.font = `${cardConfig.fontSize - 6}px ${cardConfig.fontFamily}`;
            ctx.fillStyle = adjustColor(cardConfig.fontColor, 50);
            ctx.fillText(cardConfig.date, canvasWidth - 50, signatureY + 35);
        };
        
        const drawDecorativeBorder = (ctx) => {
            const holiday = selectedHoliday.value;
            if (!holiday) return;
            
            ctx.strokeStyle = holiday.primary_color;
            ctx.lineWidth = 3;
            ctx.strokeRect(15, 15, canvasWidth - 30, canvasHeight - 30);
            
            ctx.strokeStyle = holiday.secondary_color;
            ctx.lineWidth = 1;
            ctx.strokeRect(22, 22, canvasWidth - 44, canvasHeight - 44);
            
            drawCornerDecoration(ctx, 25, 25, holiday.primary_color);
            drawCornerDecoration(ctx, canvasWidth - 25, 25, holiday.primary_color);
            drawCornerDecoration(ctx, 25, canvasHeight - 25, holiday.primary_color);
            drawCornerDecoration(ctx, canvasWidth - 25, canvasHeight - 25, holiday.primary_color);
        };
        
        const drawCornerDecoration = (ctx, x, y, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
        };
        
        const wrapText = (ctx, text, maxWidth) => {
            const words = text.split('');
            const lines = [];
            let currentLine = '';
            
            for (let i = 0; i < words.length; i++) {
                const testLine = currentLine + words[i];
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > maxWidth && currentLine !== '') {
                    lines.push(currentLine);
                    currentLine = words[i];
                } else {
                    currentLine = testLine;
                }
            }
            
            if (currentLine) {
                lines.push(currentLine);
            }
            
            return lines;
        };
        
        const adjustColor = (color, amount) => {
            const hex = color.replace('#', '');
            const r = Math.min(255, Math.max(0, parseInt(hex.substr(0, 2), 16) + amount));
            const g = Math.min(255, Math.max(0, parseInt(hex.substr(2, 2), 16) + amount));
            const b = Math.min(255, Math.max(0, parseInt(hex.substr(4, 2), 16) + amount));
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        };
        
        const resetCard = () => {
            cardConfig.title = '';
            cardConfig.message = '';
            cardConfig.signature = '';
            cardConfig.date = currentDate.value;
            cardConfig.fontFamily = 'Microsoft YaHei';
            cardConfig.fontSize = 24;
            cardConfig.fontColor = '#333333';
            cardStickers.value = [];
            if (backgrounds.value.length > 0) {
                selectedBackground.value = backgrounds.value[0];
            }
            nextTick(() => {
                renderCanvas();
                forceSaveDraft();
            });
        };
        
        const downloadCard = () => {
            const canvas = cardCanvas.value;
            if (!canvas) return;
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvasWidth;
            tempCanvas.height = canvasHeight;
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCtx.drawImage(canvas, 0, 0);
            
            cardStickers.value.forEach(sticker => {
                tempCtx.font = '40px serif';
                tempCtx.textAlign = 'center';
                tempCtx.textBaseline = 'middle';
                tempCtx.fillText(sticker.emoji, sticker.x + 30, sticker.y + 30);
            });
            
            const link = document.createElement('a');
            link.download = `贺卡_${Date.now()}.png`;
            link.href = tempCanvas.toDataURL('image/png');
            link.click();
        };
        
        const saveAndShare = async () => {
            const canvas = cardCanvas.value;
            if (!canvas) return;
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvasWidth;
            tempCanvas.height = canvasHeight;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(canvas, 0, 0);
            
            cardStickers.value.forEach(sticker => {
                tempCtx.font = '40px serif';
                tempCtx.textAlign = 'center';
                tempCtx.textBaseline = 'middle';
                tempCtx.fillText(sticker.emoji, sticker.x + 30, sticker.y + 30);
            });
            
            const imageUrl = tempCanvas.toDataURL('image/png');
            
            try {
                const response = await fetch('/api/heka/card/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        holiday_id: selectedHoliday.value.id,
                        template_id: selectedTemplate.value.id,
                        background_id: selectedBackground.value?.id || 0,
                        title: cardConfig.title,
                        message: cardConfig.message,
                        signature: cardConfig.signature,
                        date: cardConfig.date,
                        font_family: cardConfig.fontFamily,
                        font_size: cardConfig.fontSize,
                        font_color: cardConfig.fontColor,
                        stickers: cardStickers.value.map(s => ({
                            id: s.id,
                            x: Math.round(s.x),
                            y: Math.round(s.y),
                            scale: 1.0
                        })),
                        image_url: imageUrl
                    })
                });
                
                const data = await response.json();
                if (data.code === 0) {
                    shareCode.value = data.data.share_code;
                    showShareModal.value = true;
                    clearDraft();
                } else {
                    shareCode.value = generateShareCode();
                    showShareModal.value = true;
                    clearDraft();
                }
            } catch (e) {
                shareCode.value = generateShareCode();
                showShareModal.value = true;
                clearDraft();
            }
        };
        
        const generateShareCode = () => {
            return Math.random().toString(36).substring(2, 14);
        };
        
        const closeShareModal = () => {
            showShareModal.value = false;
        };
        
        const copyShareLink = async () => {
            try {
                await navigator.clipboard.writeText(shareLink.value);
                alert('链接已复制到剪贴板！');
            } catch (e) {
                if (shareLinkInput.value) {
                    shareLinkInput.value.select();
                    document.execCommand('copy');
                    alert('链接已复制到剪贴板！');
                }
            }
        };
        
        onMounted(() => {
            loadHolidays();
            setTimeout(() => {
                autoRestoreOnLoad();
            }, 500);
        });
        
        window.addEventListener('beforeunload', (event) => {
            if (currentStep.value >= 2) {
                forceSaveDraft();
            }
        });
        
        return {
            currentStep,
            holidays,
            templates,
            stickers,
            backgrounds,
            selectedHoliday,
            selectedTemplate,
            selectedBackground,
            cardCanvas,
            canvasWrapper,
            canvasWidth,
            canvasHeight,
            cardConfig,
            cardStickers,
            colorOptions,
            showShareModal,
            shareCode,
            shareLinkInput,
            hasDraft,
            lastSaved,
            currentDate,
            shareLink,
            selectHoliday,
            selectTemplate,
            selectBackground,
            selectFontColor,
            goToEditor,
            goBack,
            getTemplateStyle,
            getStickerEmoji,
            addSticker,
            removeSticker,
            startStickerDrag,
            startDrag,
            onDrag,
            stopDrag,
            resetCard,
            downloadCard,
            saveAndShare,
            closeShareModal,
            copyShareLink,
            restoreDraft,
            clearDraft
        };
    }
}).mount('#app');
