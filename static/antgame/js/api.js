const API_BASE = '/api';

class AntGameAPI {
    async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        if (options.body && typeof options.body === 'object') {
            mergedOptions.body = JSON.stringify(options.body);
        }
        
        const response = await fetch(`${API_BASE}${url}`, mergedOptions);
        const data = await response.json();
        return data;
    }

    getSaveList() {
        return this.request('/antgame/savolist/get');
    }

    getGameState(saveId) {
        return this.request(`/antgame/state/get?save_id=${saveId}`);
    }

    createNewGame(saveName = '新存档') {
        return this.request('/antgame/new', {
            method: 'POST',
            body: { save_name: saveName }
        });
    }

    tick(saveId) {
        return this.request(`/antgame/tick?save_id=${saveId}`, {
            method: 'POST'
        });
    }

    dig(saveId, gridX, gridY) {
        return this.request('/antgame/dig', {
            method: 'POST',
            body: { save_id: saveId, grid_x: gridX, grid_y: gridY }
        });
    }

    build(saveId, gridX, gridY, roomType) {
        return this.request('/antgame/build', {
            method: 'POST',
            body: { save_id: saveId, grid_x: gridX, grid_y: gridY, room_type: roomType }
        });
    }

    spawnAnt(saveId, antType) {
        return this.request('/antgame/spawn', {
            method: 'POST',
            body: { save_id: saveId, ant_type: antType }
        });
    }

    togglePause(saveId) {
        return this.request(`/antgame/pause?save_id=${saveId}`, {
            method: 'POST'
        });
    }

    deleteSave(saveId) {
        return this.request(`/antgame/delete?save_id=${saveId}`, {
            method: 'DELETE'
        });
    }
}

const api = new AntGameAPI();
