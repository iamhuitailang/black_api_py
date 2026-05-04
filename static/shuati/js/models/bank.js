const BankModel = {
    getAll() {
        return Storage.get('banks', []);
    },

    getById(id) {
        const banks = this.getAll();
        return banks.find(b => b.id === id) || null;
    },

    create(data) {
        const banks = this.getAll();
        const bank = {
            id: Utils.generateId(),
            name: data.name || '未命名题库',
            description: data.description || '',
            icon: data.icon || '📚',
            color: data.color || '#6366f1',
            tags: data.tags || [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            questionCount: 0,
            masteryRate: 0,
            lastStudyTime: null
        };
        
        banks.push(bank);
        Storage.set('banks', banks);
        
        EventBus.emit(EventBus.EVENTS.BANK_UPDATED, bank);
        return bank;
    },

    update(id, data) {
        const banks = this.getAll();
        const index = banks.findIndex(b => b.id === id);
        
        if (index === -1) return null;
        
        banks[index] = {
            ...banks[index],
            ...data,
            updatedAt: Date.now()
        };
        
        Storage.set('banks', banks);
        EventBus.emit(EventBus.EVENTS.BANK_UPDATED, banks[index]);
        return banks[index];
    },

    delete(id) {
        const banks = this.getAll();
        const index = banks.findIndex(b => b.id === id);
        
        if (index === -1) return false;
        
        banks.splice(index, 1);
        Storage.set('banks', banks);
        
        QuestionModel.deleteByBankId(id);
        StudyRecordModel.deleteByBankId(id);
        
        EventBus.emit(EventBus.EVENTS.BANK_DELETED, id);
        return true;
    },

    updateStats(bankId) {
        const bank = this.getById(bankId);
        if (!bank) return;
        
        const questions = QuestionModel.getByBankId(bankId);
        const totalQuestions = questions.length;
        
        let correctTotal = 0;
        let totalAttempts = 0;
        
        questions.forEach(q => {
            if (q.studyStats) {
                correctTotal += q.studyStats.correctCount || 0;
                totalAttempts += q.studyStats.totalCount || 0;
            }
        });
        
        const masteryRate = totalQuestions > 0 
            ? Math.round((correctTotal / Math.max(totalAttempts, totalQuestions)) * 100)
            : 0;
        
        this.update(bankId, {
            questionCount: totalQuestions,
            masteryRate: masteryRate
        });
    },

    getTotalQuestions() {
        const banks = this.getAll();
        return banks.reduce((total, bank) => total + (bank.questionCount || 0), 0);
    },

    getMasteryOverall() {
        const banks = this.getAll();
        if (banks.length === 0) return 0;
        
        const totalMastery = banks.reduce((total, bank) => total + (bank.masteryRate || 0), 0);
        return Math.round(totalMastery / banks.length);
    },

    search(keyword) {
        const banks = this.getAll();
        if (!keyword) return banks;
        
        const lowerKeyword = keyword.toLowerCase();
        return banks.filter(bank => 
            bank.name.toLowerCase().includes(lowerKeyword) ||
            bank.description.toLowerCase().includes(lowerKeyword) ||
            (bank.tags && bank.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)))
        );
    }
};

window.BankModel = BankModel;
