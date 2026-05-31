const HomePage = {
    template: `
        <div class="container">
            <h1 class="page-title">发现 TA</h1>
            
            <div class="search-bar">
                <input type="text" v-model="keyword" placeholder="搜索用户昵称、职业...">
                <button @click="searchUsers">搜索</button>
            </div>

            <div v-if="users.length === 0 && !loading" class="empty-state">
                <div class="empty-state-icon">💔</div>
                <p>暂无匹配的用户</p>
            </div>

            <div v-else>
                <div v-for="user in users" :key="user.id" class="user-card" @click="viewUser(user.id)">
                    <div class="user-avatar-large">
                        {{ user.nickname.charAt(0) }}
                    </div>
                    <div class="user-info">
                        <div class="user-name">
                            {{ user.nickname }}
                            <span :class="['gender-badge', user.gender === 1 ? 'gender-male' : 'gender-female']">
                                {{ user.gender_text }}
                            </span>
                        </div>
                        <div class="user-meta">
                            <span v-if="user.age">{{ user.age }}岁</span>
                            <span v-if="user.age && user.height"> · </span>
                            <span v-if="user.height">{{ user.height }}cm</span>
                            <span v-if="user.city"> · {{ user.city }}</span>
                        </div>
                        <div class="user-meta">
                            <span v-if="user.education">{{ user.education }}</span>
                            <span v-if="user.occupation"> · {{ user.occupation }}</span>
                        </div>
                        <p class="user-bio" v-if="user.introduction">{{ user.introduction }}</p>
                    </div>
                    <div class="user-actions">
                        <button class="btn-small btn-heart" @click.stop="sendHeart(user.id)">❤️ 心动</button>
                    </div>
                </div>

                <div class="pagination" v-if="totalPages > 1">
                    <button @click="changePage(page - 1)" :disabled="page <= 1">上一页</button>
                    <button v-for="p in totalPages" :key="p" 
                            :class="{ active: p === page }"
                            @click="changePage(p)">{{ p }}</button>
                    <button @click="changePage(page + 1)" :disabled="page >= totalPages">下一页</button>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            users: [],
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0,
            keyword: '',
            loading: false
        };
    },
    mounted() {
        this.loadUsers();
    },
    methods: {
        async loadUsers() {
            this.loading = true;
            const result = await Api.get('/jaoyou/user/list/get', {
                page: this.page,
                page_size: this.pageSize,
                keyword: this.keyword
            });
            this.loading = false;

            if (result.code === 0) {
                this.users = result.data.items;
                this.total = result.data.total;
                this.totalPages = result.data.total_pages;
            }
        },
        searchUsers() {
            this.page = 1;
            this.loadUsers();
        },
        changePage(newPage) {
            if (newPage >= 1 && newPage <= this.totalPages) {
                this.page = newPage;
                this.loadUsers();
            }
        },
        viewUser(userId) {
            this.$router.push(`/user/${userId}`);
        },
        async sendHeart(userId) {
            const result = await Api.post('/jaoyou/heart/send', { to_user_id: userId });
            if (result.code === 0) {
                alert('心动发送成功！');
            } else {
                alert(result.msg);
            }
        }
    }
};
