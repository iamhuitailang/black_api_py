const API_BASE = '/api';

const SkateApi = {
    async getTracks() {
        const res = await fetch(`${API_BASE}/skate/track/list/get`);
        return res.json();
    },

    async getTrackDetail(id) {
        const res = await fetch(`${API_BASE}/skate/track/detail/get?id=${id}`);
        return res.json();
    },

    async getTopScores(trackId = null, limit = 50) {
        let url = `${API_BASE}/skate/score/top/get?limit=${limit}`;
        if (trackId) url += `&track_id=${trackId}`;
        const res = await fetch(url);
        return res.json();
    },

    async addScore(data) {
        const res = await fetch(`${API_BASE}/skate/score/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    }
};
