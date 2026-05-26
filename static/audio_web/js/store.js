const { reactive } = Vue;

const AudioStore = {
    state: reactive({
        currentSong: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 0.8,
        playMode: 'sequence',
        playList: [],
        currentIndex: -1,
        showPlaylist: false,
        favoriteIds: [],
        genres: [],
        hotSearches: [],
        searchHistory: [],
        searchKeyword: '',
        searchType: 'song',
        currentRoute: 'home',
        selectedPlaylistId: null,
        currentPlaylist: null
    }),

    setState(updates) {
        Object.assign(this.state, updates);
    },

    parseDuration(durationStr) {
        if (!durationStr) return 0;
        const parts = durationStr.split(':');
        if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
        return 0;
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    playSong(song, index = -1) {
        if (!song) return;
        this.state.currentSong = song;
        this.state.isPlaying = true;
        this.state.currentTime = 0;
        this.state.duration = this.parseDuration(song.duration);
        this.state.currentIndex = index;
        this.recordPlayHistory(song.id);
    },

    togglePlay() {
        this.state.isPlaying = !this.state.isPlaying;
    },

    playNext() {
        if (this.state.playList.length === 0) return;
        let nextIndex;
        if (this.state.playMode === 'random') {
            nextIndex = Math.floor(Math.random() * this.state.playList.length);
        } else if (this.state.playMode === 'single') {
            nextIndex = this.state.currentIndex;
        } else {
            nextIndex = (this.state.currentIndex + 1) % this.state.playList.length;
        }
        this.playSong(this.state.playList[nextIndex], nextIndex);
    },

    playPrev() {
        if (this.state.playList.length === 0) return;
        let prevIndex;
        if (this.state.playMode === 'random') {
            prevIndex = Math.floor(Math.random() * this.state.playList.length);
        } else if (this.state.playMode === 'single') {
            prevIndex = this.state.currentIndex;
        } else {
            prevIndex = (this.state.currentIndex - 1 + this.state.playList.length) % this.state.playList.length;
        }
        this.playSong(this.state.playList[prevIndex], prevIndex);
    },

    setPlayMode(mode) {
        this.state.playMode = mode;
    },

    setVolume(volume) {
        this.state.volume = Math.max(0, Math.min(1, volume));
    },

    setCurrentTime(time) {
        this.state.currentTime = time;
    },

    setPlayList(list) {
        this.state.playList = [...list];
    },

    toggleShowPlaylist() {
        this.state.showPlaylist = !this.state.showPlaylist;
    },

    async toggleFavorite(songId) {
        const res = await AudioAPI.favorite.toggle(songId);
        if (res.code === 0) {
            const isFav = res.data?.favorited;
            let newIds = [...this.state.favoriteIds];
            if (isFav) {
                if (!newIds.includes(songId)) newIds.push(songId);
            } else {
                newIds = newIds.filter(id => id !== songId);
            }
            this.state.favoriteIds = newIds;
        }
    },

    async loadFavoriteIds() {
        const res = await AudioAPI.favorite.ids();
        if (res.code === 0) {
            this.state.favoriteIds = res.data || [];
        }
    },

    async recordPlayHistory(songId) {
        try {
            await AudioAPI.playHistory.record(songId);
        } catch (e) {}
    },

    async loadGenres() {
        const res = await AudioAPI.song.genres();
        if (res.code === 0) {
            this.state.genres = res.data || [];
        }
    },

    async loadHotSearches() {
        const res = await AudioAPI.song.hotSearches();
        if (res.code === 0) {
            this.state.hotSearches = res.data || [];
        }
    },

    async loadSearchHistory() {
        const res = await AudioAPI.searchHistory.list();
        if (res.code === 0) {
            this.state.searchHistory = res.data || [];
        }
    },

    setRoute(route) {
        this.state.currentRoute = route;
        this.state.selectedPlaylistId = null;
    },

    setCurrentPlaylist(playlist) {
        this.state.currentPlaylist = playlist;
        this.state.selectedPlaylistId = playlist?.id || null;
        this.state.currentRoute = 'playlist';
    },

    setSelectedPlaylist(id) {
        this.state.selectedPlaylistId = id;
        this.state.currentRoute = 'playlist-detail';
    },

    setSearchKeyword(keyword) {
        this.state.searchKeyword = keyword;
    },

    setSearchType(type) {
        this.state.searchType = type;
    }
};