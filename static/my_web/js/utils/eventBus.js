class EventBus {
  constructor() {
    this.events = {};
    this.onceEvents = {};
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    return () => this.off(eventName, callback);
  }

  once(eventName, callback) {
    if (!this.onceEvents[eventName]) {
      this.onceEvents[eventName] = [];
    }
    this.onceEvents[eventName].push(callback);
  }

  off(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
    if (this.onceEvents[eventName]) {
      this.onceEvents[eventName] = this.onceEvents[eventName].filter(cb => cb !== callback);
    }
  }

  emit(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`Error in event handler for ${eventName}:`, e);
        }
      });
    }

    if (this.onceEvents[eventName]) {
      const callbacks = [...this.onceEvents[eventName]];
      this.onceEvents[eventName] = [];
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`Error in once event handler for ${eventName}:`, e);
        }
      });
    }
  }

  clear() {
    this.events = {};
    this.onceEvents = {};
  }
}

const eventBus = new EventBus();
