const VaultAPI = {
    async request(path, options = {}) {
        const url = `/api${path}`;
        const defaultHeaders = {
            'Content-Type': 'application/json'
        };
        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...(options.headers || {})
            }
        });
        return await response.json();
    },

    newGame(name) {
        return this.request('/vault/newgame', {
            method: 'POST',
            body: JSON.stringify({ name: name || 'Vault 101' })
        });
    },

    listSaves() {
        return this.request('/vault/getsaves');
    },

    getState(saveId) {
        return this.request(`/vault/getstate?save_id=${saveId}`);
    },

    assignResident(saveId, residentId, assignment) {
        return this.request('/vault/assign', {
            method: 'POST',
            body: JSON.stringify({
                save_id: saveId,
                resident_id: residentId,
                assignment: assignment
            })
        });
    },

    upgradeFacility(saveId, facilityType) {
        return this.request('/vault/upgrade', {
            method: 'POST',
            body: JSON.stringify({
                save_id: saveId,
                facility_type: facilityType
            })
        });
    },

    advanceDay(saveId) {
        return this.request(`/vault/advanceday?save_id=${saveId}`);
    },

    handleWanderer(saveId, wanderer, accept) {
        return this.request('/vault/wanderer', {
            method: 'POST',
            body: JSON.stringify({
                save_id: saveId,
                wanderer_name: wanderer.name,
                hunger: wanderer.hunger,
                health: wanderer.health,
                mood: wanderer.mood,
                accept: accept
            })
        });
    },

    deleteSave(saveId) {
        return this.request(`/vault/deletesave?save_id=${saveId}`);
    }
};
