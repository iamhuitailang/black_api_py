const AudioAPI = {
    baseURL: '/api',

    async request(url, options = {}) {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        const data = await response.json();
        return data;
    },

    get(url, params = {}) {
        const query = new URLSearchParams(params).toString();
        const fullUrl = query ? `${url}?${query}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },

    post(url, body = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    song: {
        list(params = {}) {
            return AudioAPI.get(`${AudioAPI.baseURL}/audio/song/list/get`, params);
        },
        search(params) {
            return AudioAPI.get(`${AudioAPI.baseURL}/audio/song/search/get`, params);
        },
        genres() {
            return AudioAPI.get(`${AudioAPI.baseURL}/audio/song/genre/get`);
        },
        hotSearches() {
            return AudioAPI.get(`${AudioAPI.baseURL}/audio/song/hotsearch/get`);
        },
        detail(songId) {
            return AudioAPI.get(`${AudioAPI.baseURL}/audio/song/detail/get`, { song_id: songId });
        },
        batch(ids) {
            return AudioAPI.get(`${AudioAPI.baseURL}/audio/song/batch/get`, { ids: ids.join(',') });
        },
        create(data) {
            return AudioAPI.post(`${AudioAPI.baseURL}/audio/song/create`, data);
        },
        update(songId, data) {
            return AudioAPI.post(`${AudioAPI.baseURL}/audio/song/update?song_id=${songId}`, data);
        },
        delete(songId) {
            return AudioAPI.post(`${AudioAPI.baseURL}/audio/song/delete?song_id=${songId}`);
        }
    },

    playlist: {
        list(params = {}) {
            return AudioAPI.get(`${AudioAPI.baseURL}/audio/playlist/list/get`, params);
        },
        detail(playlistId) {
            return AudioAPI.get(`${AudioAPI.baseURL}/audio/playlist/detail/get`, { playlist_id: playlistId });
        },
        create(data) {
            return AudioAPI.post(`${AudioAPI.baseURL}/audio/playlist/create`, data);
        },
        update(playlistId, data) {
            return AudioAPI.post(`${AudioAPI.baseURL}/audio/playlist/update?playlist_id=${playlistId}`, data);
        },
        delete(playlistId) {
            return AudioAPI.post(`${AudioAPI.baseURL}/audio/playlist/delete?playlist_id=${playlistId}`);
        },
        addSongs(playlistId, songIds) {
            return AudioAPI.post(`${AudioAPI.baseURL}/audio/playlist/addsong?playlist_id=${playlistId}`, { song_ids: songIds });
        },
        removeSong(playlistId, songId) {
            return AudioAPI.post(`${AudioAPI.baseURL}/audio/playlist/removesong?playlist_id=${playlistId}&song_id=${songId}`);
        },
        reorder(playlistId, orderList) {
            return AudioAPI.post(`${AudioAPI.baseURL}/audio/playlist/reorder?playlist_id=${playlistId}`, { order_list: orderList });
        },
        stats() {
            return AudioAPI.get(`${AudioAPI.baseURL}/audio/playlist/stats/get`);
        }
    },

    favorite: {
        list(params = {}) {
            return AudioAPI.get(`${AudioAPI.baseURL}/audio/favorite/list/get`, params);
        },
        toggle(songId) {
            return AudioAPI.post(`${AudioAPI.baseURL}/audio/favorite/toggle?song_id=${songId}`);
        },
        check(songId) {
            return AudioAPI.get(`${AudioAPI.baseURL}/audio/favorite/check/get`, { song_id: songId });
        },
        ids() {
            return AudioAPI.get(`${AudioAPI.baseURL}/audio/favorite/ids/get`);
        },
        count() {
            return AudioAPI.get(`${AudioAPI.baseURL}/audio/favorite/count/get`);
        }
    },

    playHistory: {
        list(params = {}) {
            return AudioAPI.get(`${AudioAPI.baseURL}/audio/playhistory/list/get`, params);
        },
        record(songId) {
            return AudioAPI.post(`${AudioAPI.baseURL}/audio/playhistory/record?song_id=${songId}`);
        },
        clear() {
            return AudioAPI.post(`${AudioAPI.baseURL}/audio/playhistory/clear`);
        },
        count() {
            return AudioAPI.get(`${AudioAPI.baseURL}/audio/playhistory/count/get`);
        }
    },

    searchHistory: {
        list() {
            return AudioAPI.get(`${AudioAPI.baseURL}/audio/searchhistory/list/get`);
        },
        record(keyword, searchType = 'song') {
            return AudioAPI.post(`${AudioAPI.baseURL}/audio/searchhistory/record`, { keyword, search_type: searchType });
        },
        delete(keyword, searchType = 'song') {
            return AudioAPI.post(`${AudioAPI.baseURL}/audio/searchhistory/delete`, { keyword, search_type: searchType });
        },
        clear() {
            return AudioAPI.post(`${AudioAPI.baseURL}/audio/searchhistory/clear`);
        }
    }
};