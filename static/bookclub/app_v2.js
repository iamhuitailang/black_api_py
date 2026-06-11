const { createApp, ref, computed, reactive, onMounted } = Vue;
const API = '/api';

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function todayStr() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()); }
function ymStr(y, m) { return y + '-' + pad(m+1); }
function ymDisplay(y, m) { return y + '年' + (m+1) + '月'; }

async function apiFetch(url, opts = {}) {
  try {
    const r = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    return await r.json();
  } catch (e) {
    return { code: 1, message: '网络错误：' + e.message, data: null };
  }
}

const App = {
  setup() {
    const page = ref('home');
    const previousPage = ref('home');
    const currentUser = ref(null);
    const loginNickname = ref('');
    const loginAvatar = ref('');
    const toast = ref('');
    const todayChecked = ref(false);
    const userStreak = ref(0);

    const now = new Date();
    const calendarYear = ref(now.getFullYear());
    const calendarMonth = ref(now.getMonth());
    const calendarDays = ref([]);
    const monthlyCheckinCount = ref(0);

    const lbYear = ref(now.getFullYear());
    const lbMonth = ref(now.getMonth());

    const homeStats = reactive({ total_books:0, reading_count:0, finished_count:0, monthly_finished:0, total_checkin_days:0, total_pages:0 });
    const homeActivity = ref([]);
    const topRankings = ref([]);

    const readingBooks = ref([]);
    const finishedBooks = ref([]);
    const myHomepage = reactive({
      user: null,
      stats: { total_books:0, reading_count:0, finished_count:0, monthly_finished:0, streak_days:0, total_checkin_days:0, total_pages:0 },
      get reading_books() { return readingBooks.value; },
      get finished_books() { return finishedBooks.value; }
    });

    const leaderboard = ref([]);
    const activityList = ref([]);

    const viewReadingBooks = ref([]);
    const viewFinishedBooks = ref([]);
    const viewUserId = ref(null);
    const viewHomepage = reactive({
      user: null,
      stats: { total_books:0, reading_count:0, finished_count:0, monthly_finished:0, streak_days:0, total_checkin_days:0, total_pages:0 },
      get reading_books() { return viewReadingBooks.value; },
      get finished_books() { return viewFinishedBooks.value; }
    });

    const showBookModal = ref(false);
    const showBookDetail = ref(false);
    const editBook = ref(null);
    const viewingOtherDetail = ref(false);
    const detailBook = ref({});
    const bookForm = reactive({
      title: '', author: '', pages: 0, start_date: '', end_date: '', rating: 0, review: ''
    });

    const currentYearMonth = computed(() => ymDisplay(calendarYear.value, calendarMonth.value));
    const lbYearMonth = computed(() => ymDisplay(lbYear.value, lbMonth.value));

    function showToast(msg) {
      toast.value = msg;
      setTimeout(() => toast.value = '', 2200);
    }

    function streakClass(days) {
      if (!days || days <= 0) return 'streak-gradient-1';
      if (days >= 100) return 'streak-gradient-100';
      if (days >= 60) return 'streak-gradient-60';
      if (days >= 30) return 'streak-gradient-30';
      if (days >= 14) return 'streak-gradient-14';
      if (days >= 7) return 'streak-gradient-7';
      if (days >= 3) return 'streak-gradient-3';
      return 'streak-gradient-1';
    }

    function bookColorIdx(title) {
      let sum = 0;
      const t = title || '书';
      for (let i = 0; i < t.length; i++) sum += t.charCodeAt(i);
      return sum % 8;
    }

    function buildCalendar(checkinDates) {
      const y = calendarYear.value;
      const m = calendarMonth.value;
      const first = new Date(y, m, 1);
      const startWeekday = first.getDay();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const daysInPrev = new Date(y, m, 0).getDate();
      const todayS = todayStr();
      const ym = ymStr(y, m);

      const dateSet = new Set(checkinDates || []);

      const list = [];
      for (let i = startWeekday - 1; i >= 0; i--) {
        const day = daysInPrev - i;
        const pm = m === 0 ? 11 : m - 1;
        const py = m === 0 ? y - 1 : y;
        list.push({ day, inMonth: false, date: ymStr(py, pm) + '-' + pad(day), isToday: false, checked: false });
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const ds = ym + '-' + pad(d);
        list.push({ day: d, inMonth: true, date: ds, isToday: ds === todayS, checked: dateSet.has(ds) });
      }
      while (list.length % 7 !== 0) {
        const idx = list.length - (startWeekday + daysInMonth) + 1;
        const nm = m === 11 ? 0 : m + 1;
        const ny = m === 11 ? y + 1 : y;
        list.push({ day: idx, inMonth: false, date: ymStr(ny, nm) + '-' + pad(idx), isToday: false, checked: false });
      }
      calendarDays.value = list;
      monthlyCheckinCount.value = list.filter(d => d.inMonth && d.checked).length;
      todayChecked.value = dateSet.has(todayS);
    }

    async function loadCalendar() {
      if (!currentUser.value) return;
      const res = await apiFetch(API + '/bookclub/calendar/get?user_id=' + currentUser.value.id + '&year_month=' + ymStr(calendarYear.value, calendarMonth.value));
      if (res.code === 0) {
        buildCalendar(res.data.checkin_dates || []);
      }
    }

    function changeMonth(delta) {
      let m = calendarMonth.value + delta;
      let y = calendarYear.value;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      calendarMonth.value = m;
      calendarYear.value = y;
      loadCalendar();
    }

    function goThisMonth() {
      const n = new Date();
      calendarYear.value = n.getFullYear();
      calendarMonth.value = n.getMonth();
      loadCalendar();
    }

    function changeLbMonth(delta) {
      let m = lbMonth.value + delta;
      let y = lbYear.value;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      lbMonth.value = m;
      lbYear.value = y;
      loadLeaderboard();
    }

    async function doLogin() {
      const nick = (loginNickname.value || '').trim();
      if (!nick) { showToast('请输入昵称'); return; }
      const ava = (loginAvatar.value || '').trim();
      const res = await apiFetch(API + '/bookclub/register', { method: 'POST', body: { nickname: nick, avatar_url: ava } });
      if (res.code === 0) {
        currentUser.value = res.data;
        localStorage.setItem('bc_user', JSON.stringify(res.data));
        showToast('欢迎，' + res.data.nickname);
        loginNickname.value = ''; loginAvatar.value = '';
        page.value = 'home';
        await loadHome();
      } else {
        showToast(res.message || '登录失败');
      }
    }

    function logout() {
      if (!confirm('确定退出登录吗？')) return;
      currentUser.value = null;
      localStorage.removeItem('bc_user');
    }

    async function loadHome() {
      if (!currentUser.value || !currentUser.value.id) return;
      buildCalendar([]);
      const results = await Promise.allSettled([
        loadCalendar(),
        loadMyHomepage(),
        loadLeaderboard(true),
        loadActivity(true)
      ]);
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        console.warn(failed + ' 个数据加载失败');
      }
      if (myHomepage.stats) Object.assign(homeStats, myHomepage.stats);
      userStreak.value = myHomepage.stats.streak_days || 0;
    }

    async function loadMyHomepage() {
      if (!currentUser.value || !currentUser.value.id) {
        showToast('用户信息异常，请重新登录');
        logout();
        return;
      }
      const res = await apiFetch(API + '/bookclub/homepage/get?user_id=' + currentUser.value.id);
      if (res.code === 0 && res.data) {
        myHomepage.user = res.data.user;
        if (res.data.stats) Object.assign(myHomepage.stats, res.data.stats);
        readingBooks.value = (res.data.reading_books || []).slice();
        finishedBooks.value = (res.data.finished_books || []).slice();
      } else {
        showToast(res.message || '加载书架失败');
      }
    }

    async function loadLeaderboard(forHome = false) {
      const ym = ymStr(lbYear.value, lbMonth.value);
      const res = await apiFetch(API + '/bookclub/leaderboard/get?year_month=' + ym);
      if (res.code === 0) {
        const all = res.data.rankings || [];
        if (forHome) {
          topRankings.value = all.slice(0, 5);
        } else {
          leaderboard.value = all;
        }
      }
    }

    async function loadActivity(forHome = false) {
      const limit = forHome ? 10 : 50;
      const res = await apiFetch(API + '/bookclub/recent/get?limit=' + limit);
      if (res.code === 0) {
        if (forHome) homeActivity.value = res.data || [];
        else activityList.value = res.data || [];
      }
    }

    async function doCheckin() {
      if (!currentUser.value) return;
      const res = await apiFetch(API + '/bookclub/checkin', { method: 'POST', body: { user_id: currentUser.value.id, date: todayStr() } });
      if (res.code === 0) {
        if (res.data && !res.data.already_checked) showToast('打卡成功！今天也努力读书了 🌟');
        else showToast('今日已打卡~');
        userStreak.value = (res.data && res.data.streak_days) || userStreak.value;
        await loadCalendar();
        await loadMyHomepage();
        Object.assign(homeStats, myHomepage.stats);
      } else {
        showToast(res.message || '打卡失败');
      }
    }

    function openAddBook() {
      editBook.value = null;
      bookForm.title = '';
      bookForm.author = '';
      bookForm.pages = 0;
      bookForm.start_date = todayStr();
      bookForm.end_date = '';
      bookForm.rating = 0;
      bookForm.review = '';
      showBookModal.value = true;
    }

    function editCurrentBook() {
      if (!detailBook.value || !detailBook.value.id) return;
      const b = detailBook.value;
      editBook.value = b.id;
      bookForm.title = b.title || '';
      bookForm.author = b.author || '';
      bookForm.pages = b.pages || 0;
      bookForm.start_date = b.start_date || '';
      bookForm.end_date = b.end_date || '';
      bookForm.rating = b.rating || 0;
      bookForm.review = b.review || '';
      showBookDetail.value = false;
      showBookModal.value = true;
    }

    function openBookDetail(b, isOther = false) {
      detailBook.value = { ...b };
      viewingOtherDetail.value = !!isOther;
      showBookDetail.value = true;
    }

    async function submitBook() {
      if (!currentUser.value) return;
      const title = (bookForm.title || '').trim();
      const author = (bookForm.author || '').trim();
      if (!title) { showToast('请输入书名'); return; }
      if (!author) { showToast('请输入作者'); return; }

      const body = {
        user_id: currentUser.value.id,
        title, author,
        pages: Number(bookForm.pages) || 0,
        start_date: bookForm.start_date || '',
        end_date: bookForm.end_date || '',
        rating: Math.min(5, Math.max(0, Number(bookForm.rating) || 0)),
        review: bookForm.review || ''
      };

      let res;
      if (editBook.value) {
        body.book_id = editBook.value;
        res = await apiFetch(API + '/bookclub/updatebook/put', { method: 'PUT', body });
      } else {
        res = await apiFetch(API + '/bookclub/addbook', { method: 'POST', body });
      }

      if (res.code === 0) {
        showToast(editBook.value ? '修改成功' : '已加入书房 📚');
        showBookModal.value = false;
        await Promise.all([loadMyHomepage(), loadActivity(true), loadLeaderboard(true)]);
        Object.assign(homeStats, myHomepage.stats);
      } else {
        showToast(res.message || '操作失败');
      }
    }

    async function deleteBook() {
      if (!detailBook.value || !detailBook.value.id) return;
      if (!confirm('确定要删除《' + detailBook.value.title + '》吗？')) return;
      const res = await apiFetch(API + '/bookclub/deletebook/delete?user_id=' + currentUser.value.id + '&book_id=' + detailBook.value.id, { method: 'DELETE' });
      if (res.code === 0) {
        showToast('已删除');
        showBookDetail.value = false;
        await Promise.all([loadMyHomepage(), loadActivity(true), loadLeaderboard(true)]);
        Object.assign(homeStats, myHomepage.stats);
      } else {
        showToast(res.message || '删除失败');
      }
    }

    async function viewUser(uid) {
      if (!uid) return;
      if (currentUser.value && uid === currentUser.value.id) {
        previousPage.value = page.value;
        page.value = 'bookshelf';
        return;
      }
      previousPage.value = page.value;
      viewUserId.value = uid;
      const res = await apiFetch(API + '/bookclub/homepage/get?user_id=' + uid);
      if (res.code === 0) {
        viewHomepage.user = res.data.user;
        if (res.data.stats) Object.assign(viewHomepage.stats, res.data.stats);
        viewReadingBooks.value = (res.data.reading_books || []).slice();
        viewFinishedBooks.value = (res.data.finished_books || []).slice();
        page.value = 'userhome';
      } else {
        showToast(res.message || '用户不存在');
      }
    }

    function goBackFromUser() {
      page.value = previousPage.value || 'home';
    }

    function goHome() {
      if (!currentUser.value) return;
      page.value = 'home';
      loadHome();
    }

    onMounted(async () => {
      try {
        const stored = localStorage.getItem('bc_user');
        if (stored) {
          const userData = JSON.parse(stored);
          if (userData && userData.id && userData.nickname) {
            currentUser.value = userData;
            await loadHome();
          } else {
            localStorage.removeItem('bc_user');
          }
        }
      } catch(e) {
        console.error('恢复用户数据失败:', e);
        localStorage.removeItem('bc_user');
        currentUser.value = null;
      }
    });

    Vue.watch(page, (p) => {
      if (p === 'bookshelf' && currentUser.value) loadMyHomepage();
      if (p === 'leaderboard') loadLeaderboard();
      if (p === 'activity') loadActivity();
    });

    return {
      page, currentUser, loginNickname, loginAvatar, toast, todayChecked, userStreak,
      calendarYear, calendarMonth, calendarDays, currentYearMonth, monthlyCheckinCount,
      lbYearMonth, lbYear, lbMonth,
      homeStats, homeActivity, topRankings,
      myHomepage, readingBooks, finishedBooks,
      leaderboard, activityList, viewHomepage, viewReadingBooks, viewFinishedBooks,
      showBookModal, showBookDetail, editBook, viewingOtherDetail, detailBook, bookForm,
      showToast, streakClass, bookColorIdx,
      changeMonth, goThisMonth, changeLbMonth,
      doLogin, logout, goHome,
      doCheckin,
      openAddBook, editCurrentBook, openBookDetail, submitBook, deleteBook,
      viewUser, goBackFromUser
    };
  },

  template: `
<div>
  <header class="header">
    <div class="header-inner">
      <div class="logo" @click="goHome">
        <span class="logo-icon">书</span>
        <span>读书会</span>
      </div>
      <nav class="nav-tabs" v-if="currentUser">
        <div class="nav-tab" :class="{active: page==='home'}" @click="page='home'">首页</div>
        <div class="nav-tab" :class="{active: page==='bookshelf'}" @click="page='bookshelf'">我的书架</div>
        <div class="nav-tab" :class="{active: page==='leaderboard'}" @click="page='leaderboard'">排行榜</div>
        <div class="nav-tab" :class="{active: page==='activity'}" @click="page='activity'">动态广场</div>
      </nav>
      <div class="user-area" v-if="currentUser" @click="logout" title="点击退出登录">
        <div style="position:relative">
          <div class="user-avatar">
            <img :src="currentUser.avatar_url" :alt="currentUser.nickname">
          </div>
          <div class="streak-badge" :class="streakClass(userStreak)" v-if="userStreak>0">
            🔥{{userStreak}}
          </div>
        </div>
        <div>
          <div class="user-nick">{{currentUser.nickname}}</div>
          <div style="font-size:11px;color:rgba(255,248,231,0.7)">点击退出</div>
        </div>
      </div>
    </div>
  </header>

  <div class="container">
    <div v-if="!currentUser" class="welcome-card">
      <div class="welcome-title">读书会 · 打卡</div>
      <div class="welcome-subtitle">书卷多情似故人，晨昏忧乐每相亲</div>
      <div style="margin-bottom: 20px; text-align: left">
        <label class="form-label">请输入昵称</label>
        <input type="text" class="input-field" v-model="loginNickname" placeholder="一个雅致的名字...">
      </div>
      <div style="margin-bottom: 24px; text-align: left">
        <label class="form-label">头像链接（可选）</label>
        <input type="text" class="input-field" v-model="loginAvatar" placeholder="https://...">
      </div>
      <button class="btn-primary" @click="doLogin">进 入 书 房</button>
      <div style="margin-top:24px;font-size:13px;color:#8B7355;line-height:1.8">
        💡 每月至少读两本书，每天打个卡记录阅读的脚步<br>
        书脊似故人，文字藏温凉
      </div>
    </div>

    <template v-else>
      <div v-if="page==='home'">
        <div class="user-profile-header">
          <div class="profile-avatar">
            <img :src="currentUser.avatar_url">
            <div class="streak-badge" :class="streakClass(userStreak)" v-if="userStreak>0">
              🔥{{userStreak}}
            </div>
          </div>
          <div class="profile-info">
            <div class="profile-name">{{currentUser.nickname}}</div>
            <div style="color:#8B7355;font-size:14px">「书山有路勤为径，学海无涯苦作舟」</div>
            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-val">{{homeStats.total_books}}</span>
                <span class="stat-label">我的藏书</span>
              </div>
              <div class="stat-item">
                <span class="stat-val">{{homeStats.finished_count}}</span>
                <span class="stat-label">已读完</span>
              </div>
              <div class="stat-item">
                <span class="stat-val" style="background:linear-gradient(90deg,#DAA520,#FF8C00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">{{homeStats.monthly_finished}}</span>
                <span class="stat-label">本月读完</span>
              </div>
              <div class="stat-item">
                <span class="stat-val">{{homeStats.total_checkin_days}}</span>
                <span class="stat-label">累计打卡</span>
              </div>
              <div class="stat-item">
                <span class="stat-val">{{homeStats.total_pages}}</span>
                <span class="stat-label">阅读页数</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div>
            <div class="calendar">
              <div class="cal-header">
                <div class="cal-title">📅 打卡日历</div>
                <div class="cal-nav">
                  <button class="cal-nav-btn" @click="changeMonth(-1)">‹</button>
                  <button class="cal-nav-btn" @click="goThisMonth" title="回到本月">●</button>
                  <button class="cal-nav-btn" @click="changeMonth(1)">›</button>
                </div>
              </div>
              <div style="font-size:18px;color:#8B6914;font-weight:bold;margin-bottom:12px;text-align:center;letter-spacing:3px">
                {{currentYearMonth}}
              </div>
              <div class="cal-weekdays">
                <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
              </div>
              <div class="cal-days">
                <div v-for="(d,i) in calendarDays" :key="i"
                     class="cal-day"
                     :class="{other:!d.inMonth, today:d.isToday, checked:d.checked}">
                  {{d.day}}
                  <span v-if="d.checked" class="dot"></span>
                </div>
              </div>
              <button class="btn-primary checkin-btn" :class="{done:todayChecked}" @click="doCheckin" :disabled="todayChecked">
                {{todayChecked ? '✓ 今日已打卡，继续加油' : '📖 今日打卡（记录读书的一天）'}}
              </button>
              <div style="margin-top:10px;font-size:12px;color:#8B7355;text-align:center">
                本月已打卡 {{monthlyCheckinCount}} 天，坚持就是胜利 🌿
              </div>
            </div>
          </div>
          <div>
            <div class="section-title">🏆 月度排行 Top 5</div>
            <div class="card" style="padding:12px">
              <div class="leaderboard-item" v-for="(item,idx) in topRankings" :key="item.user.id" @click="viewUser(item.user.id)">
                <div class="rank-number" :class="idx<3 ? 'rank-'+(idx+1) : 'rank-other'">
                  {{idx<3 ? ['🥇','🥈','🥉'][idx] : idx+1}}
                </div>
                <div style="position:relative">
                  <div class="lb-avatar">
                    <img :src="item.user.avatar_url">
                  </div>
                  <div v-if="item.streak_days>0" class="lb-streak-mini" :class="streakClass(item.streak_days)">
                    {{item.streak_days}}🔥
                  </div>
                </div>
                <div class="lb-info">
                  <div class="lb-name">{{item.user.nickname}}</div>
                  <div class="lb-sub">打卡 {{item.total_checkin_days}} 天</div>
                </div>
                <div class="lb-count">
                  {{item.finished_count}}<small> 本/月</small>
                </div>
              </div>
              <div v-if="topRankings.length===0" class="empty-tip">
                <span class="emoji">📚</span>暂无排行，快去读书吧
              </div>
            </div>
            <div class="section-title" style="margin-top:24px">📖 最近在读</div>
            <div class="card" style="padding:4px">
              <div class="activity-item" v-for="act in homeActivity" :key="act.book.id" @click="viewUser(act.user.id)">
                <div class="act-avatar">
                  <img :src="act.user.avatar_url">
                </div>
                <div class="act-content">
                  <div class="act-text">
                    <strong>{{act.user.nickname}}</strong>
                    {{act.book.end_date ? '读完了' : '在读'}}
                    <span class="act-book-tag">《{{act.book.title}}》</span>
                    <template v-if="act.book.rating>0">
                      <span style="color:#FFB800;margin-left:4px">{{'★'.repeat(act.book.rating)}}</span>
                    </template>
                  </div>
                  <div class="act-time">{{act.book.author}} · {{act.book.pages||'?'}}页</div>
                </div>
              </div>
              <div v-if="homeActivity.length===0" class="empty-tip">
                <span class="emoji">🌱</span>还没有动态，去添加第一本书吧
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="page==='bookshelf'">
        <div class="back-btn" @click="page='home'">← 返回首页</div>
        <div class="section-title">📚 我的书房</div>
        <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:28px">
          <div class="stat-item" style="padding:16px 24px">
            <span class="stat-val">{{myHomepage.stats.total_books}}</span>
            <span class="stat-label">全部</span>
          </div>
          <div class="stat-item" style="padding:16px 24px">
            <span class="stat-val" style="color:#CD853F">{{myHomepage.stats.reading_count}}</span>
            <span class="stat-label">在读</span>
          </div>
          <div class="stat-item" style="padding:16px 24px">
            <span class="stat-val" style="color:#6B8E23">{{myHomepage.stats.finished_count}}</span>
            <span class="stat-label">已读完</span>
          </div>
          <div class="stat-item" style="padding:16px 24px">
            <span class="stat-val" style="color:#8B4513">{{myHomepage.stats.total_pages}}</span>
            <span class="stat-label">总页数</span>
          </div>
        </div>
        <div class="bookshelf-title">📖 正在阅读</div>
        <div class="books-spine">
          <div class="book-spine"
               v-for="b in readingBooks"
               :key="b.id"
               :class="'book-color-'+(bookColorIdx(b.title))"
               @click="openBookDetail(b)">
            <div class="spine-title">{{b.title}}</div>
            <div class="spine-rating" style="writing-mode:horizontal-tb;font-size:10px">在读</div>
          </div>
          <div v-if="readingBooks.length===0" style="padding:60px 20px;color:#A0896C;font-size:14px;text-align:center;flex:1">
            还没有在读的书，开始读一本吧
          </div>
          <div class="add-book-spine" @click="openAddBook()" title="添加新书">+</div>
        </div>
        <div class="bookshelf-title">🏆 已读完</div>
        <div class="books-spine">
          <div class="book-spine"
               v-for="b in finishedBooks"
               :key="b.id"
               :class="'book-color-'+(bookColorIdx(b.title))"
               @click="openBookDetail(b)">
            <div class="spine-title">{{b.title}}</div>
            <div class="spine-rating">
              <span v-if="b.rating>0" style="color:#FFD700">{{'★'.repeat(b.rating)}}</span>
              <span v-else>✓</span>
            </div>
          </div>
          <div v-if="finishedBooks.length===0" style="padding:60px 20px;color:#A0896C;font-size:14px;text-align:center;flex:1">
            读完的书会出现在这里，加油！
          </div>
        </div>
      </div>

      <div v-else-if="page==='leaderboard'">
        <div class="back-btn" @click="page='home'">← 返回首页</div>
        <div class="cal-header" style="margin-bottom:18px">
          <div class="section-title" style="margin:0;border:none;padding:0">🏆 读书会月度排行榜</div>
          <div class="cal-nav">
            <button class="cal-nav-btn" @click="changeLbMonth(-1)">‹</button>
            <div style="font-size:16px;color:#8B6914;font-weight:bold;padding:0 16px;display:flex;align-items:center">{{lbYearMonth}}</div>
            <button class="cal-nav-btn" @click="changeLbMonth(1)">›</button>
          </div>
        </div>
        <div class="card">
          <div class="leaderboard-item" v-for="(item,idx) in leaderboard" :key="item.user.id" @click="viewUser(item.user.id)">
            <div class="rank-number" :class="idx<3 ? 'rank-'+(idx+1) : 'rank-other'">
              {{idx<3 ? ['🥇','🥈','🥉'][idx] : idx+1}}
            </div>
            <div style="position:relative">
              <div class="lb-avatar">
                <img :src="item.user.avatar_url">
              </div>
              <div v-if="item.streak_days>0" class="lb-streak-mini" :class="streakClass(item.streak_days)">
                {{item.streak_days}}🔥
              </div>
            </div>
            <div class="lb-info">
              <div class="lb-name">{{item.user.nickname}}</div>
              <div class="lb-sub">连续打卡 {{item.streak_days}} 天 · 累计 {{item.total_checkin_days}} 天</div>
            </div>
            <div class="lb-count">
              {{item.finished_count}}<small> 本</small>
            </div>
          </div>
          <div v-if="leaderboard.length===0" class="empty-tip">
            <span class="emoji">🌾</span>本月还没有榜单，期待第一位读者
          </div>
        </div>
      </div>

      <div v-else-if="page==='activity'">
        <div class="back-btn" @click="page='home'">← 返回首页</div>
        <div class="section-title">🌸 读书动态</div>
        <div class="card" style="padding:4px">
          <div class="activity-item" v-for="act in activityList" :key="act.book.id" @click="viewUser(act.user.id)">
            <div class="act-avatar">
              <img :src="act.user.avatar_url">
            </div>
            <div class="act-content">
              <div class="act-text">
                <strong>{{act.user.nickname}}</strong>
                {{act.book.end_date ? '读完了《'+act.book.title+'》' : '开始读《'+act.book.title+'》'}}
                <template v-if="act.book.rating>0">
                  <span style="color:#FFB800;margin-left:6px">{{'★'.repeat(act.book.rating)}}{{'☆'.repeat(5-act.book.rating)}}</span>
                </template>
              </div>
              <div class="act-time">
                {{act.book.author}} · {{act.book.pages||'?'}}页
                <template v-if="act.book.end_date"> · 读完于 {{act.book.end_date}}</template>
                <template v-else-if="act.book.start_date"> · 开始于 {{act.book.start_date}}</template>
              </div>
              <div v-if="act.book.review" style="margin-top:6px;font-size:13px;color:#6B4F2E;padding:8px 12px;background:rgba(245,230,200,0.5);border-radius:8px;border-left:3px solid #B8860B">
                {{act.book.review}}
              </div>
            </div>
          </div>
          <div v-if="activityList.length===0" class="empty-tip">
            <span class="emoji">🕊️</span>广场还很安静，添加一本书开启阅读之旅
          </div>
        </div>
      </div>

      <div v-else-if="page==='userhome'">
        <div class="back-btn" @click="goBackFromUser">← 返回</div>
        <div class="user-profile-header" v-if="viewHomepage.user">
          <div class="profile-avatar">
            <img :src="viewHomepage.user.avatar_url">
            <div class="streak-badge" :class="streakClass(viewHomepage.stats.streak_days)" v-if="viewHomepage.stats.streak_days>0">
              🔥{{viewHomepage.stats.streak_days}}
            </div>
          </div>
          <div class="profile-info">
            <div class="profile-name">{{viewHomepage.user.nickname}}</div>
            <div style="color:#8B7355;font-size:14px">「读万卷书，行万里路」</div>
            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-val">{{viewHomepage.stats.total_books}}</span>
                <span class="stat-label">藏书</span>
              </div>
              <div class="stat-item">
                <span class="stat-val">{{viewHomepage.stats.finished_count}}</span>
                <span class="stat-label">读完</span>
              </div>
              <div class="stat-item">
                <span class="stat-val" style="background:linear-gradient(90deg,#DAA520,#FF8C00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">{{viewHomepage.stats.monthly_finished}}</span>
                <span class="stat-label">本月</span>
              </div>
              <div class="stat-item">
                <span class="stat-val">{{viewHomepage.stats.total_checkin_days}}</span>
                <span class="stat-label">打卡</span>
              </div>
              <div class="stat-item">
                <span class="stat-val">{{viewHomepage.stats.total_pages}}</span>
                <span class="stat-label">页数</span>
              </div>
            </div>
          </div>
        </div>
        <div class="bookshelf-title">📖 在读</div>
        <div class="books-spine">
          <div class="book-spine"
               v-for="b in viewReadingBooks"
               :key="b.id"
               :class="'book-color-'+(bookColorIdx(b.title))"
               @click="openBookDetail(b, true)">
            <div class="spine-title">{{b.title}}</div>
            <div class="spine-rating" style="writing-mode:horizontal-tb;font-size:10px">在读</div>
          </div>
          <div v-if="viewReadingBooks.length===0" style="padding:40px 20px;color:#A0896C;font-size:14px;text-align:center;flex:1">暂无在读</div>
        </div>
        <div class="bookshelf-title">🏆 已读完</div>
        <div class="books-spine">
          <div class="book-spine"
               v-for="b in viewFinishedBooks"
               :key="b.id"
               :class="'book-color-'+(bookColorIdx(b.title))"
               @click="openBookDetail(b, true)">
            <div class="spine-title">{{b.title}}</div>
            <div class="spine-rating">
              <span v-if="b.rating>0" style="color:#FFD700">{{'★'.repeat(b.rating)}}</span>
              <span v-else>✓</span>
            </div>
          </div>
          <div v-if="viewFinishedBooks.length===0" style="padding:40px 20px;color:#A0896C;font-size:14px;text-align:center;flex:1">暂无已读完</div>
        </div>
      </div>
    </template>
  </div>

  <div v-if="showBookModal" class="modal-mask" @click.self="showBookModal=false">
    <div class="modal-box" style="max-width:560px">
      <div class="modal-title">{{editBook ? '📝 编辑书籍' : '✨ 添加书籍'}}</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">书名 *</label>
          <input class="input-field" v-model="bookForm.title" placeholder="如：百年孤独">
        </div>
        <div class="form-group">
          <label class="form-label">作者 *</label>
          <input class="input-field" v-model="bookForm.author" placeholder="如：马尔克斯">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">页数</label>
          <input type="number" class="input-field" v-model.number="bookForm.pages" min="0" placeholder="0">
        </div>
        <div class="form-group">
          <label class="form-label">评分</label>
          <div class="rating-stars">
            <span v-for="i in 5" :key="i" class="star" :class="{active:i<=bookForm.rating}" @click="bookForm.rating=i">
              {{i<=bookForm.rating ? '★' : '☆'}}
            </span>
          </div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">开始日期</label>
          <input type="date" class="input-field" v-model="bookForm.start_date">
        </div>
        <div class="form-group">
          <label class="form-label">读完日期</label>
          <input type="date" class="input-field" v-model="bookForm.end_date">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">短评</label>
        <textarea class="input-field" v-model="bookForm.review" placeholder="写下你的读后感...（500字以内）" maxlength="500"></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" @click="showBookModal=false">取消</button>
        <button class="btn-primary" @click="submitBook">{{editBook ? '保存修改' : '加入书房'}}</button>
      </div>
    </div>
  </div>

  <div v-if="showBookDetail" class="modal-mask" @click.self="showBookDetail=false">
    <div class="modal-box" style="max-width:560px">
      <div class="book-detail">
        <div class="bd-spine" :class="'book-color-'+(bookColorIdx(detailBook.title))">
          <div class="spine-title" style="flex:1">{{detailBook.title}}</div>
          <div class="spine-rating" style="writing-mode:horizontal-tb">
            <span v-if="detailBook.rating>0" style="color:#FFD700">{{'★'.repeat(detailBook.rating)}}</span>
            <span v-else>📖</span>
          </div>
        </div>
        <div class="bd-info">
          <div class="bd-title">《{{detailBook.title}}》</div>
          <div class="bd-author">✍️ {{detailBook.author}}</div>
          <div class="bd-meta">
            <span><b>页数：</b>{{detailBook.pages||'?'}} 页</span>
            <span><b>状态：</b>{{detailBook.end_date?'已读完':'在读'}}</span>
            <span><b>开始：</b>{{detailBook.start_date||'未填'}}</span>
            <span><b>读完：</b>{{detailBook.end_date||'未读完'}}</span>
          </div>
          <div v-if="detailBook.rating>0" style="margin-bottom:12px">
            <span style="color:#FFB800;font-size:22px;letter-spacing:3px">
              {{'★'.repeat(detailBook.rating)}}{{'☆'.repeat(5-detailBook.rating)}}
            </span>
            <span style="color:#8B7355;font-size:13px;margin-left:8px">{{detailBook.rating}} / 5 星</span>
          </div>
          <div class="bd-review">{{detailBook.review}}</div>
        </div>
      </div>
      <div class="bd-actions" v-if="!viewingOtherDetail">
        <button class="btn-danger" @click="deleteBook">🗑️ 删除</button>
        <button class="btn-secondary" @click="editCurrentBook">✏️ 编辑</button>
        <button class="btn-primary" @click="showBookDetail=false">关闭</button>
      </div>
      <div class="bd-actions" v-else>
        <button class="btn-primary" @click="showBookDetail=false">关闭</button>
      </div>
    </div>
  </div>

  <div v-if="toast" class="toast">{{toast}}</div>
</div>
  `
};

createApp(App).mount('#app');
