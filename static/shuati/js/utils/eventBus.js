const EventBus = {
    events: {},

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        
        return () => this.off(event, callback);
    },

    off(event, callback) {
        if (!this.events[event]) return;
        
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    },

    emit(event, ...args) {
        if (!this.events[event]) return;
        
        this.events[event].forEach(callback => {
            try {
                callback(...args);
            } catch (e) {
                console.error(`EventBus error for event "${event}":`, e);
            }
        });
    },

    once(event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback(...args);
        };
        return this.on(event, wrapper);
    },

    clear(event) {
        if (event) {
            delete this.events[event];
        } else {
            this.events = {};
        }
    }
};

window.EventBus = EventBus;

EventBus.EVENTS = {
    QUESTION_ANSWERED: 'question:answered',
    QUESTION_MARKED: 'question:marked',
    BANK_UPDATED: 'bank:updated',
    BANK_DELETED: 'bank:deleted',
    SETTINGS_UPDATED: 'settings:updated',
    DAILY_PLAN_UPDATED: 'dailyPlan:updated',
    STUDY_COMPLETED: 'study:completed',
    REVIEW_READY: 'review:ready',
    WRONG_QUESTION_ADDED: 'wrongQuestion:added',
    WRONG_QUESTION_REMOVED: 'wrongQuestion:removed',
    FAVORITE_ADDED: 'favorite:added',
    FAVORITE_REMOVED: 'favorite:removed'
};
