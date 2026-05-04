const Utils = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds}秒`;
        } else if (seconds < 3600) {
            return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}小时${minutes}分`;
        }
    },

    relativeTime(date) {
        const now = new Date();
        const target = new Date(date);
        const diff = now - target;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        if (days < 30) return `${Math.floor(days / 7)}周前`;
        if (days < 365) return `${Math.floor(days / 30)}个月前`;
        return `${Math.floor(days / 365)}年前`;
    },

    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    },

    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
        return obj;
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    parseQuestionsFromText(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const questions = [];
        let currentQuestion = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            const questionMatch = line.match(/^(\d+)[\.、\s]+(.+)$/);
            if (questionMatch) {
                if (currentQuestion) {
                    questions.push(currentQuestion);
                }
                currentQuestion = {
                    content: questionMatch[2],
                    type: 'single',
                    options: [],
                    answer: [],
                    explanation: ''
                };
                continue;
            }

            if (!currentQuestion) continue;

            const optionMatch = line.match(/^([A-Z])[\.、\s]+(.+)$/);
            if (optionMatch) {
                currentQuestion.options.push({
                    label: optionMatch[1],
                    content: optionMatch[2]
                });
                continue;
            }

            const answerMatch = line.match(/^答案[：:]\s*([A-Z,，\s]+)/);
            if (answerMatch) {
                const answers = answerMatch[1].replace(/[,，\s]+/g, '').split('');
                currentQuestion.answer = answers;
                if (answers.length > 1) {
                    currentQuestion.type = 'multiple';
                }
                continue;
            }

            const explanationMatch = line.match(/^解析[：:]\s*(.+)$/);
            if (explanationMatch) {
                currentQuestion.explanation = explanationMatch[1];
            }
        }

        if (currentQuestion) {
            questions.push(currentQuestion);
        }

        return questions;
    },

    parseQuestionsFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (Array.isArray(data)) {
                return data.map(item => this.normalizeQuestion(item));
            }
            
            if (data.questions && Array.isArray(data.questions)) {
                return data.questions.map(item => this.normalizeQuestion(item));
            }

            return [];
        } catch (e) {
            console.error('JSON解析错误:', e);
            return [];
        }
    },

    normalizeQuestion(item) {
        const typeMap = {
            'single': 'single',
            '单选': 'single',
            'multiple': 'multiple',
            '多选': 'multiple',
            'true-false': 'true-false',
            '判断': 'true-false',
            'fill': 'fill',
            '填空': 'fill',
            'essay': 'essay',
            '简答': 'essay'
        };

        const type = typeMap[item.type] || 'single';
        
        let options = item.options || [];
        if (type === 'true-false' && options.length === 0) {
            options = [
                { label: 'A', content: '正确' },
                { label: 'B', content: '错误' }
            ];
        }

        let answer = item.answer || [];
        if (typeof answer === 'string') {
            answer = answer.split('').filter(c => /[A-Z]/.test(c));
        }

        return {
            id: item.id || this.generateId(),
            content: item.content || item.question || '',
            type: type,
            options: options,
            answer: answer,
            explanation: item.explanation || item.parse || '',
            tags: item.tags || [],
            difficulty: item.difficulty || 1,
            createdAt: item.createdAt || Date.now()
        };
    },

    exportQuestionsToJSON(questions, bankName = '') {
        const data = {
            version: '1.0',
            bankName: bankName,
            exportDate: new Date().toISOString(),
            questions: questions.map(q => ({
                id: q.id,
                content: q.content,
                type: q.type,
                options: q.options,
                answer: q.answer,
                explanation: q.explanation,
                tags: q.tags,
                difficulty: q.difficulty,
                createdAt: q.createdAt
            }))
        };
        return JSON.stringify(data, null, 2);
    },

    exportQuestionsToText(questions) {
        let text = '';
        
        questions.forEach((q, index) => {
            text += `${index + 1}. ${q.content}\n\n`;
            
            if (q.options && q.options.length > 0) {
                q.options.forEach(opt => {
                    text += `${opt.label}. ${opt.content}\n`;
                });
                text += '\n';
            }

            if (q.answer && q.answer.length > 0) {
                text += `答案：${q.answer.join('')}\n`;
            }

            if (q.explanation) {
                text += `解析：${q.explanation}\n`;
            }

            text += '\n' + '-'.repeat(50) + '\n\n';
        });

        return text;
    },

    downloadFile(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    },

    async readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const questions = this.parseExcelData(data);
                    resolve(questions);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    },

    parseExcelData(data) {
        const questions = [];
        
        const view = new DataView(data);
        let pos = 0;
        
        if (view.getUint16(0, true) !== 0x0409) {
            console.warn('Excel格式可能不兼容，尝试简单解析');
        }

        const text = new TextDecoder('utf-8').decode(data);
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length > 0) {
            const header = lines[0].split(/[,\t]/);
            const contentIdx = header.findIndex(h => h.includes('题目') || h.includes('内容') || h.includes('question'));
            const typeIdx = header.findIndex(h => h.includes('类型') || h.includes('type'));
            const optionsIdx = header.findIndex(h => h.includes('选项') || h.includes('options'));
            const answerIdx = header.findIndex(h => h.includes('答案') || h.includes('answer'));
            const explanationIdx = header.findIndex(h => h.includes('解析') || h.includes('explanation'));

            for (let i = 1; i < lines.length; i++) {
                const cells = lines[i].split(/[,\t]/);
                if (cells.length < 2) continue;

                const question = {
                    content: cells[contentIdx] || cells[0] || '',
                    type: 'single',
                    options: [],
                    answer: [],
                    explanation: ''
                };

                if (typeIdx >= 0 && cells[typeIdx]) {
                    const type = cells[typeIdx].trim();
                    if (type.includes('多')) question.type = 'multiple';
                    else if (type.includes('判断')) question.type = 'true-false';
                    else if (type.includes('填空')) question.type = 'fill';
                    else if (type.includes('简答')) question.type = 'essay';
                }

                if (optionsIdx >= 0 && cells[optionsIdx]) {
                    const optionsText = cells[optionsIdx];
                    const optionMatches = optionsText.match(/([A-Z][\.、\s][^A-Z]+)/g);
                    if (optionMatches) {
                        question.options = optionMatches.map(opt => {
                            const match = opt.match(/([A-Z])[\.、\s](.+)/);
                            if (match) {
                                return { label: match[1], content: match[2].trim() };
                            }
                            return { label: '', content: opt.trim() };
                        });
                    }
                }

                if (answerIdx >= 0 && cells[answerIdx]) {
                    const answerText = cells[answerIdx].trim();
                    question.answer = answerText.split('').filter(c => /[A-Z]/.test(c));
                    if (question.answer.length > 1) {
                        question.type = 'multiple';
                    }
                }

                if (explanationIdx >= 0 && cells[explanationIdx]) {
                    question.explanation = cells[explanationIdx].trim();
                }

                if (question.content) {
                    questions.push(question);
                }
            }
        }

        return questions;
    },

    applyTheme(darkMode) {
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    },

    applyFontSize(size) {
        document.body.classList.remove('font-small', 'font-large');
        if (size === 'small') {
            document.body.classList.add('font-small');
        } else if (size === 'large') {
            document.body.classList.add('font-large');
        }
    },

    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            return false;
        }
        
        if (Notification.permission === 'granted') {
            return true;
        }
        
        if (Notification.permission === 'denied') {
            return false;
        }
        
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    },

    sendNotification(title, options = {}) {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return null;
        }
        
        return new Notification(title, {
            icon: '📚',
            badge: '📚',
            ...options
        });
    },

    getDaysInRange(startDate, endDate) {
        const days = [];
        const current = new Date(startDate);
        const end = new Date(endDate);
        
        while (current <= end) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        
        return days;
    },

    isSameDay(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    },

    getTodayStart() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    },

    getTodayEnd() {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return today;
    },

    safeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    truncate(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    },

    calculateAccuracy(correct, total) {
        if (total === 0) return 0;
        return Math.round((correct / total) * 100);
    },

    calculateMastery(question) {
        if (!question.studyStats) return 0;
        
        const { correctCount, totalCount, lastReviewTime } = question.studyStats;
        if (totalCount === 0) return 0;
        
        const accuracy = correctCount / totalCount;
        const recency = lastReviewTime ? 
            Math.min(1, (Date.now() - lastReviewTime) / (7 * 24 * 60 * 60 * 1000)) : 1;
        
        const mastery = accuracy * (1 - recency * 0.3);
        return Math.round(mastery * 100);
    },

    getQuestionTypeLabel(type) {
        const labels = {
            'single': '单选题',
            'multiple': '多选题',
            'true-false': '判断题',
            'fill': '填空题',
            'essay': '简答题'
        };
        return labels[type] || '未知';
    },

    getDifficultyLabel(difficulty) {
        const labels = {
            1: '简单',
            2: '中等',
            3: '困难'
        };
        return labels[difficulty] || '未知';
    }
};

window.Utils = Utils;
