(function () {
    'use strict';

    const API_BASE = '/api';
    const CLIENT_KEY = 'course_eval_client_id';
    const VOTED_KEY = 'course_eval_voted';
    const TOKEN_KEY = 'course_eval_token';
    const USER_KEY = 'course_eval_user';
    const FORM_KEY = 'course_eval_form';

    function getClientId() {
        let id = localStorage.getItem(CLIENT_KEY);
        if (!id) {
            id = 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem(CLIENT_KEY, id);
        }
        return id;
    }

    function getVotedSet() {
        try {
            return new Set(JSON.parse(localStorage.getItem(VOTED_KEY) || '[]'));
        } catch (e) {
            return new Set();
        }
    }

    function saveVoted(id) {
        const s = getVotedSet();
        s.add(id);
        localStorage.setItem(VOTED_KEY, JSON.stringify([...s]));
    }

    function getToken() {
        return localStorage.getItem(TOKEN_KEY) || '';
    }
    function saveToken(token, user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user || {}));
    }
    function clearToken() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }
    function getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
        } catch (e) { return null; }
    }

    function saveFormData(form) {
        try {
            localStorage.setItem(FORM_KEY, JSON.stringify(form));
        } catch (e) {}
    }
    function loadFormData() {
        try {
            const raw = localStorage.getItem(FORM_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) { return null; }
    }
    function clearFormData() {
        try { localStorage.removeItem(FORM_KEY); } catch (e) {}
        if (State && State.reviewForm) {
            State.reviewForm = {
                semester: '', teacher: '', course_name: '',
                content_quality: 0, clarity: 0, homework: 0, grading: 0,
                tags: [], comment: ''
            };
        }
    }

    function _getHeaders(auth) {
        const h = { 'X-Client-ID': getClientId() };
        if (auth) {
            const token = getToken();
            if (token) h['Authorization'] = 'Bearer ' + token;
        }
        return h;
    }

    function apiGet(path, params, auth) {
        let url = API_BASE + path;
        if (params) {
            const qs = Object.keys(params)
                .filter(k => params[k] !== null && params[k] !== undefined && params[k] !== '')
                .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
                .join('&');
            if (qs) url += '?' + qs;
        }
        return fetch(url, { headers: _getHeaders(auth) })
            .then(r => r.json());
    }

    function apiPost(path, data, auth) {
        const headers = _getHeaders(auth);
        headers['Content-Type'] = 'application/json';
        return fetch(API_BASE + path, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data || {})
        }).then(r => r.json());
    }

    function formatDate(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return iso;
        const p = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    }

    function h(tag, attrs, children) {
        const el = document.createElement(tag);
        if (attrs) {
            for (const k in attrs) {
                if (k === 'class') el.className = attrs[k];
                else if (k === 'style' && typeof attrs[k] === 'object') {
                    for (const sk in attrs[k]) el.style[sk] = attrs[k][sk];
                }
                else if (k.startsWith('on') && typeof attrs[k] === 'function') {
                    el.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
                }
                else if (k === 'html') el.innerHTML = attrs[k];
                else el.setAttribute(k, attrs[k]);
            }
        }
        if (children !== undefined && children !== null) {
            const add = c => {
                if (c === null || c === undefined) return;
                if (Array.isArray(c)) c.forEach(add);
                else if (c instanceof Node) el.appendChild(c);
                else el.appendChild(document.createTextNode(String(c)));
            };
            add(children);
        }
        return el;
    }

    function clearEl(el) {
        while (el.firstChild) el.removeChild(el.firstChild);
    }

    function renderStars(value, options) {
        options = options || {};
        const size = options.size || 18;
        const readonly = options.readonly !== false;
        const onChange = options.onChange || null;
        const container = h('div', {
            class: 'star-render',
            style: { display: 'inline-flex', gap: '2px', alignItems: 'center' }
        });
        const hoverVal = { v: 0 };
        for (let i = 1; i <= 5; i++) {
            const star = h('span', {
                style: {
                    fontSize: size + 'px',
                    cursor: readonly ? 'default' : 'pointer',
                    color: i <= (hoverVal.v || value || 0) ? '#FFC107' : '#e0e0e0',
                    transition: 'color 0.15s',
                    userSelect: 'none',
                    lineHeight: 1
                }
            }, '★');
            if (!readonly) {
                star.addEventListener('mouseenter', function () {
                    hoverVal.v = i;
                    updateColors();
                });
                star.addEventListener('mouseleave', function () {
                    hoverVal.v = 0;
                    updateColors();
                });
                star.addEventListener('click', function () {
                    if (onChange) onChange(i);
                });
            }
            container.appendChild(star);
        }
        function updateColors() {
            const display = hoverVal.v || value || 0;
            Array.prototype.forEach.call(container.children, function (s, idx) {
                s.style.color = (idx + 1) <= display ? '#FFC107' : '#e0e0e0';
            });
        }
        return container;
    }

    function renderRadarChart(scores, size) {
        size = size || 240;
        const cx = size / 2;
        const cy = size / 2;
        const radius = size * 0.35;
        const labels = ['内容质量', '讲课清晰度', '作业合理度', '给分友好度'];
        const vals = [scores.content_quality || 0, scores.clarity || 0,
            scores.homework || 0, scores.grading || 0];
        const n = labels.length;

        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);

        function point(angle, r) {
            return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
        }

        const startAngle = -Math.PI / 2;
        for (let lv = 1; lv <= 5; lv++) {
            const r = radius * lv / 5;
            const pts = [];
            for (let i = 0; i < n; i++) {
                const a = startAngle + (Math.PI * 2 * i) / n;
                const [px, py] = point(a, r);
                pts.push(px.toFixed(1) + ',' + py.toFixed(1));
            }
            const poly = document.createElementNS(svgNS, 'polygon');
            poly.setAttribute('points', pts.join(' '));
            poly.setAttribute('fill', 'none');
            poly.setAttribute('stroke', '#d0e5d0');
            poly.setAttribute('stroke-width', '1');
            svg.appendChild(poly);
        }

        for (let i = 0; i < n; i++) {
            const a = startAngle + (Math.PI * 2 * i) / n;
            const [px, py] = point(a, radius);
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', cx);
            line.setAttribute('y1', cy);
            line.setAttribute('x2', px);
            line.setAttribute('y2', py);
            line.setAttribute('stroke', '#d0e5d0');
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);
        }

        const dataPts = [];
        for (let i = 0; i < n; i++) {
            const a = startAngle + (Math.PI * 2 * i) / n;
            const r = radius * Math.min(5, Math.max(0, vals[i])) / 5;
            const [px, py] = point(a, r);
            dataPts.push(px.toFixed(1) + ',' + py.toFixed(1));
        }
        const dataPoly = document.createElementNS(svgNS, 'polygon');
        dataPoly.setAttribute('points', dataPts.join(' '));
        dataPoly.setAttribute('fill', 'rgba(76, 175, 80, 0.25)');
        dataPoly.setAttribute('stroke', 'rgba(76, 175, 80, 1)');
        dataPoly.setAttribute('stroke-width', '2');
        svg.appendChild(dataPoly);

        for (let i = 0; i < n; i++) {
            const a = startAngle + (Math.PI * 2 * i) / n;
            const r = radius * Math.min(5, Math.max(0, vals[i])) / 5;
            const [px, py] = point(a, r);
            const dot = document.createElementNS(svgNS, 'circle');
            dot.setAttribute('cx', px);
            dot.setAttribute('cy', py);
            dot.setAttribute('r', '3.5');
            dot.setAttribute('fill', '#4CAF50');
            svg.appendChild(dot);
        }

        for (let i = 0; i < n; i++) {
            const a = startAngle + (Math.PI * 2 * i) / n;
            const lr = radius + 22;
            const [px, py] = point(a, lr);
            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x', px);
            text.setAttribute('y', py);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('font-size', '12');
            text.setAttribute('fill', '#2E3B2E');
            text.textContent = labels[i];
            svg.appendChild(text);
        }

        const wrapper = h('div', { class: 'radar-wrapper', style: { display: 'flex', justifyContent: 'center', width: '100%' } });
        wrapper.appendChild(svg);
        return wrapper;
    }

    const TAG_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#795548', '#607D8B'];
    function getTagColor(idx) { return TAG_COLORS[idx % TAG_COLORS.length]; }
    function getTagSize(count) { return Math.min(26, 12 + count * 2); }
    function getMedal(rank) {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return String(rank);
    }

    function _loadFormOrDefault() {
        try {
            const raw = localStorage.getItem(FORM_KEY);
            if (raw) {
                const saved = JSON.parse(raw);
                return Object.assign({
                    semester: '', teacher: '', course_name: '',
                    content_quality: 0, clarity: 0, homework: 0, grading: 0,
                    tags: [], comment: ''
                }, saved);
            }
        } catch (e) {}
        return {
            semester: '', teacher: '', course_name: '',
            content_quality: 0, clarity: 0, homework: 0, grading: 0,
            tags: [], comment: ''
        };
    }

    const State = {
        semesters: [],
        currentPage: 'home',
        pageParams: {},
        courses: [],
        courseDetail: null,
        searchSemester: '',
        searchKeyword: '',
        rankingSemester: '',
        rankingData: { good: [], bad: [] },
        reviewForm: _loadFormOrDefault(),
        submitTeachers: [],
        submitCourses: [],
        submitMsg: null,
        adminReviews: [],
        hideReasons: {},
        currentUser: null,
        loginForm: { username: '', password: '' },
        loginMsg: null
    };

    const container = function () {
        const el = document.getElementById('page-container');
        if (!el) {
            const d = document.createElement('div');
            d.id = 'page-container';
            document.body.appendChild(d);
            return d;
        }
        return el;
    };

    function setPage(name, params) {
        State.currentPage = name;
        State.pageParams = params || {};
        document.querySelectorAll('[data-page]').forEach(a => {
            a.classList.toggle('active', a.getAttribute('data-page') === name);
        });
        if (window.location.hash.slice(1) !== name) {
            window.location.hash = name;
        }
        window.scrollTo(0, 0);
        if (name === 'detail' && params && params.courseId) {
            State.courseDetail = null;
            render();
            loadCourseDetail(params.courseId);
            return;
        }
        if (name === 'ranking') { loadRankings(); return; }
        if (name === 'admin') {
            if (!State.currentUser) {
                State.loginForm = { username: '', password: '' };
                State.loginMsg = null;
            } else {
                loadAdminReviews();
                return;
            }
        }
        if (name === 'submit') {
            const saved = loadFormData();
            if (saved) {
                State.reviewForm = Object.assign({
                    semester: '', teacher: '', course_name: '',
                    content_quality: 0, clarity: 0, homework: 0, grading: 0,
                    tags: [], comment: ''
                }, saved);
                if (State.reviewForm.semester && State.semesters.length) {
                    loadSubmitTeachers().then(function () {
                        if (State.reviewForm.teacher) loadSubmitCourses();
                        else render();
                    });
                }
            } else {
                State.reviewForm = {
                    semester: '', teacher: '', course_name: '',
                    content_quality: 0, clarity: 0, homework: 0, grading: 0,
                    tags: [], comment: ''
                };
            }
            State.submitMsg = null;
        }
        render();
    }

    function loadingEl() {
        return h('div', { class: 'loading' }, '加载中...');
    }
    function emptyEl(text) {
        return h('div', { class: 'empty' }, text || '暂无数据');
    }

    function renderHomePage() {
        const root = h('div', { class: 'page' });

        const searchCard = h('div', { class: 'card search-card' }, [
            h('h2', null, '🔍 搜索课程'),
            h('div', { class: 'search-row' }, [
                (function () {
                    const sel = h('select', null, [
                        h('option', { value: '' }, '全部学期')
                    ]);
                    State.semesters.forEach(s => sel.appendChild(h('option', { value: s }, s)));
                    sel.value = State.searchSemester;
                    sel.addEventListener('change', function () {
                        State.searchSemester = this.value;
                        loadCourses();
                    });
                    return sel;
                })(),
                (function () {
                    const inp = h('input', { type: 'text', placeholder: '搜索课程名/老师/院系' });
                    inp.value = State.searchKeyword;
                    let timer = null;
                    inp.addEventListener('input', function () {
                        State.searchKeyword = this.value;
                        if (timer) clearTimeout(timer);
                        timer = setTimeout(loadCourses, 300);
                    });
                    return inp;
                })()
            ])
        ]);
        root.appendChild(searchCard);

        if (State.courses === null) {
            root.appendChild(loadingEl());
            return root;
        }
        if (State.courses.length === 0) {
            root.appendChild(emptyEl('暂无课程数据'));
            return root;
        }

        const grid = h('div', { class: 'course-grid' });
        State.courses.forEach(c => {
            const card = h('div', { class: 'card course-card' }, [
                h('div', { class: 'course-header' }, [
                    h('span', { class: 'course-name' }, c.name),
                    c.review_count > 0
                        ? h('span', { class: 'score-badge' }, '⭐ ' + Number(c.avg_score).toFixed(1))
                        : h('span', { class: 'score-badge empty' }, '暂无评分')
                ]),
                h('div', { class: 'course-teacher' }, '👨‍🏫 ' + c.teacher),
                h('div', { class: 'course-meta' }, [
                    h('span', { class: 'tag-sm' }, c.department),
                    h('span', { class: 'tag-sm' }, c.semester),
                    h('span', { class: 'tag-sm review-count' }, c.review_count + '条评价')
                ])
            ]);
            card.addEventListener('click', function () {
                setPage('detail', { courseId: c.id });
            });
            grid.appendChild(card);
        });
        root.appendChild(grid);
        return root;
    }

    function renderDetailPage() {
        const root = h('div', { class: 'page' });
        const backBtn = h('button', { class: 'back-btn' }, '← 返回列表');
        backBtn.addEventListener('click', function () { setPage('home'); });
        root.appendChild(backBtn);

        if (!State.courseDetail) {
            root.appendChild(loadingEl());
            return root;
        }
        const d = State.courseDetail;
        const c = d.course;
        const s = d.scores;

        const infoCard = h('div', { class: 'card' }, [
            h('h2', { class: 'detail-title' }, c.name),
            h('div', { class: 'detail-subtitle' }, [
                h('span', null, '👨‍🏫 ' + c.teacher),
                h('span', null, '🏛 ' + c.department),
                h('span', null, '📅 ' + c.semester),
                s.review_count > 0
                    ? h('span', null, '⭐ 综合 ' + Number(s.overall).toFixed(2) + ' (' + s.review_count + '条评价)')
                    : null
            ])
        ]);
        root.appendChild(infoCard);

        const grid = h('div', { class: 'detail-grid' });

        const chartCard = h('div', { class: 'card chart-card' }, [
            h('h3', null, '📊 评分雷达图'),
            h('div', { class: 'chart-container' }, renderRadarChart(s, 260)),
            (function () {
                const wrap = h('div', { class: 'score-items' });
                [
                    ['内容质量', s.content_quality],
                    ['讲课清晰度', s.clarity],
                    ['作业合理度', s.homework],
                    ['给分友好度', s.grading]
                ].forEach(function (pair) {
                    wrap.appendChild(h('div', { class: 'score-item' }, [
                        h('span', null, pair[0]),
                        renderStars(pair[1], { readonly: true, size: 14 }),
                        h('span', { class: 'score-num' }, Number(pair[1]).toFixed(1))
                    ]));
                });
                return wrap;
            })()
        ]);
        grid.appendChild(chartCard);

        const tagsCard = h('div', { class: 'card tags-card' }, [
            h('h3', null, '🏷 标签词云')
        ]);
        if (!d.tags_frequency || d.tags_frequency.length === 0) {
            tagsCard.appendChild(emptyEl('暂无标签'));
        } else {
            const wc = h('div', { class: 'wordcloud' });
            d.tags_frequency.forEach(function (tf, idx) {
                wc.appendChild(h('span', {
                    class: 'cloud-tag',
                    style: {
                        fontSize: getTagSize(tf.count) + 'px',
                        backgroundColor: getTagColor(idx)
                    }
                }, tf.tag + ' (' + tf.count + ')'));
            });
            tagsCard.appendChild(wc);
        }
        grid.appendChild(tagsCard);
        root.appendChild(grid);

        const reviewsCard = h('div', { class: 'card' }, [
            h('h3', null, ['💬 评价列表 ', h('span', { class: 'sub-hint' }, '（按点赞数排序）')])
        ]);
        if (!d.reviews || d.reviews.length === 0) {
            reviewsCard.appendChild(emptyEl('暂无评价，快来写第一条吧！'));
        } else {
            const list = h('div', { class: 'review-list' });
            const votedSet = getVotedSet();
            d.reviews.forEach(function (r) {
                const item = h('div', { class: 'review-item' });
                if (r.hidden) {
                    item.appendChild(h('div', { class: 'hidden-review' },
                        '⚠️ 该评价已被管理隐藏' + (r.hidden_reason ? '（' + r.hidden_reason + '）' : '')));
                } else {
                    const scores = h('div', { class: 'review-scores' }, []);
                    [
                        [r.content_quality, '内容'],
                        [r.clarity, '清晰'],
                        [r.homework, '作业'],
                        [r.grading, '给分']
                    ].forEach(function (pair) {
                        scores.appendChild(renderStars(pair[0], { readonly: true, size: 12 }));
                        scores.appendChild(h('span', { class: 'review-score-label' }, pair[1]));
                    });
                    item.appendChild(scores);

                    if (r.tags && r.tags.length) {
                        const tagsWrap = h('div', { class: 'review-tags' });
                        r.tags.forEach(function (t) {
                            tagsWrap.appendChild(h('span', { class: 'pill-tag' }, t));
                        });
                        item.appendChild(tagsWrap);
                    }

                    if (r.comment) {
                        item.appendChild(h('div', { class: 'review-comment' }, r.comment));
                    }

                    const voted = votedSet.has(r.id);
                    const btn = h('button', {
                        class: 'upvote-btn' + (voted ? ' voted' : '')
                    }, '👍 有用 (' + r.upvotes + ')');
                    if (!voted) {
                        btn.addEventListener('click', function () { doUpvote(r.id, btn); });
                    }
                    item.appendChild(h('div', { class: 'review-footer' }, [
                        h('span', { class: 'review-date' }, formatDate(r.created_at)),
                        btn
                    ]));
                }
                list.appendChild(item);
            });
            reviewsCard.appendChild(list);
        }
        root.appendChild(reviewsCard);
        return root;
    }

    function renderRankingPage() {
        const root = h('div', { class: 'page' });

        const header = h('div', { class: 'card' }, [
            h('h2', null, '🏆 排行榜'),
            (function () {
                const row = h('div', { class: 'ranking-header' });
                const sel = h('select', null);
                State.semesters.forEach(function (s) {
                    const opt = h('option', { value: s }, s);
                    if (s === State.rankingSemester) opt.selected = true;
                    sel.appendChild(opt);
                });
                sel.addEventListener('change', function () {
                    State.rankingSemester = this.value;
                    loadRankings();
                });
                row.appendChild(sel);
                row.appendChild(h('span', { class: 'hint' }, '仅展示至少5条评价的课程'));
                return row;
            })()
        ]);
        root.appendChild(header);

        const grid = h('div', { class: 'ranking-grid' });

        function renderCard(title, list, good) {
            const card = h('div', { class: 'card ranking-card ' + (good ? 'good' : 'bad') }, [
                h('h3', null, title)
            ]);
            if (!list) {
                card.appendChild(loadingEl());
            } else if (list.length === 0) {
                card.appendChild(emptyEl('暂无数据'));
            } else {
                const rl = h('div', { class: 'ranking-list' });
                list.forEach(function (item) {
                    const el = h('div', { class: 'ranking-item' }, [
                        h('span', { class: 'rank-badge ' + (good ? 'good-rank' : 'bad-rank') }, getMedal(item.rank)),
                        h('div', { class: 'rank-info' }, [
                            h('div', { class: 'rank-name' }, item.name),
                            h('div', { class: 'rank-teacher' }, item.teacher + ' · ' + item.department)
                        ]),
                        h('div', { class: 'rank-score' + (good ? '' : ' bad') }, [
                            '⭐ ' + Number(item.avg_score).toFixed(2),
                            h('div', { class: 'rank-count' }, item.review_count + '条')
                        ])
                    ]);
                    el.addEventListener('click', function () {
                        setPage('detail', { courseId: item.course_id });
                    });
                    rl.appendChild(el);
                });
                card.appendChild(rl);
            }
            return card;
        }

        grid.appendChild(renderCard('🥇 好评榜 TOP10', State.rankingData.good, true));
        grid.appendChild(renderCard('⚠️ 避雷榜 TOP10', State.rankingData.bad, false));
        root.appendChild(grid);
        return root;
    }

    function renderSubmitPage() {
        const root = h('div', { class: 'page' });
        const card = h('div', { class: 'card submit-card' });
        const form = h('form', null);

        function addFormRow(labelText, inputEl, required) {
            const row = h('div', { class: 'form-row' }, [
                h('label', null, [labelText, required ? h('span', { class: 'required' }, ' *') : null])
            ]);
            row.appendChild(inputEl);
            return row;
        }

        const semSel = h('select', { required: 'required' }, [h('option', { value: '' }, '请选择学期')]);
        State.semesters.forEach(function (s) {
            const o = h('option', { value: s }, s);
            if (State.reviewForm.semester === s) o.selected = true;
            semSel.appendChild(o);
        });
        semSel.addEventListener('change', function () {
            State.reviewForm.semester = this.value;
            State.reviewForm.teacher = '';
            State.reviewForm.course_name = '';
            State.submitCourses = [];
            saveFormData(State.reviewForm);
            loadSubmitTeachers();
        });
        form.appendChild(addFormRow('学期', semSel, true));

        const teacherSel = h('select', { required: 'required' }, [h('option', { value: '' }, '请先选择学期')]);
        if (!State.reviewForm.semester) teacherSel.disabled = true;
        State.submitTeachers.forEach(function (t) {
            const o = h('option', { value: t }, t);
            if (State.reviewForm.teacher === t) o.selected = true;
            teacherSel.appendChild(o);
        });
        teacherSel.addEventListener('change', function () {
            State.reviewForm.teacher = this.value;
            State.reviewForm.course_name = '';
            saveFormData(State.reviewForm);
            loadSubmitCourses();
        });
        form.appendChild(addFormRow('教师', teacherSel, true));

        const courseSel = h('select', { required: 'required' }, [h('option', { value: '' }, '请先选择教师')]);
        if (!State.reviewForm.teacher) courseSel.disabled = true;
        State.submitCourses.forEach(function (n) {
            const o = h('option', { value: n }, n);
            if (State.reviewForm.course_name === n) o.selected = true;
            courseSel.appendChild(o);
        });
        courseSel.addEventListener('change', function () {
            State.reviewForm.course_name = this.value;
            saveFormData(State.reviewForm);
        });
        form.appendChild(addFormRow('课程', courseSel, true));

        const ratingSection = h('div', { class: 'rating-section' });
        const ratingLabels = [
            ['content_quality', '内容质量'],
            ['clarity', '讲课清晰度'],
            ['homework', '作业合理度'],
            ['grading', '给分友好度']
        ];
        ratingLabels.forEach(function (pair) {
            const key = pair[0];
            const row = h('div', { class: 'rating-row' }, [
                h('label', null, [pair[1], h('span', { class: 'required' }, ' *')])
            ]);
            const stars = renderStars(State.reviewForm[key], {
                readonly: false,
                size: 22,
                onChange: function (v) {
                    State.reviewForm[key] = v;
                    saveFormData(State.reviewForm);
                    render();
                }
            });
            row.appendChild(stars);
            ratingSection.appendChild(row);
        });
        form.appendChild(ratingSection);

        const AVAILABLE = ['干货多', 'PPT念稿', '作业多', '给分好', '点名频繁'];
        const tagWrap = h('div', { class: 'tag-select' });
        AVAILABLE.forEach(function (tag) {
            const checked = State.reviewForm.tags.indexOf(tag) >= 0;
            const lbl = h('label', { class: 'tag-option' });
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = tag;
            cb.checked = checked;
            cb.addEventListener('change', function () {
                if (this.checked) {
                    if (State.reviewForm.tags.indexOf(tag) < 0) State.reviewForm.tags.push(tag);
                } else {
                    State.reviewForm.tags = State.reviewForm.tags.filter(function (t) { return t !== tag; });
                }
                saveFormData(State.reviewForm);
            });
            lbl.appendChild(cb);
            lbl.appendChild(h('span', null, tag));
            if (checked) lbl.classList.add('checked');
            tagWrap.appendChild(lbl);
        });
        form.appendChild(addFormRow('标签（可多选）', tagWrap, false));

        const textArea = h('textarea', { maxlength: '300', rows: '4', placeholder: '分享一下这门课的体验...' });
        textArea.value = State.reviewForm.comment;
        textArea.addEventListener('input', function () {
            State.reviewForm.comment = this.value;
            counter.textContent = State.reviewForm.comment.length + '/300';
            saveFormData(State.reviewForm);
        });
        const textWrap = h('div', null, [textArea]);
        const counter = h('div', { class: 'char-count' }, State.reviewForm.comment.length + '/300');
        textWrap.appendChild(counter);
        form.appendChild(addFormRow('文字评论（限300字）', textWrap, false));

        const submitBtn = h('button', { type: 'submit', class: 'submit-btn' }, '匿名提交评价');
        form.appendChild(submitBtn);

        if (State.submitMsg) {
            form.appendChild(h('div', { class: 'msg ' + State.submitMsg.type }, State.submitMsg.text));
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            doSubmit();
        });

        card.appendChild(form);
        root.appendChild(card);
        return root;
    }

    function renderAdminPage() {
        const root = h('div', { class: 'page' });

        if (!State.currentUser) {
            const card = h('div', { class: 'card submit-card' });
            const form = h('form', null, [
                h('h2', { style: { marginBottom: '20px' } }, '🔐 管理员登录'),
                (function () {
                    const row = h('div', { class: 'form-row' }, [h('label', null, ['用户名', h('span', { class: 'required' }, ' *')])]);
                    const inp = h('input', { type: 'text', required: 'required', placeholder: 'admin' });
                    inp.value = State.loginForm.username;
                    inp.addEventListener('input', function () { State.loginForm.username = this.value; });
                    row.appendChild(inp);
                    return row;
                })(),
                (function () {
                    const row = h('div', { class: 'form-row' }, [h('label', null, ['密码', h('span', { class: 'required' }, ' *')])]);
                    const inp = h('input', { type: 'password', required: 'required', placeholder: 'admin123' });
                    inp.value = State.loginForm.password;
                    inp.addEventListener('input', function () { State.loginForm.password = this.value; });
                    row.appendChild(inp);
                    return row;
                })(),
                h('button', { type: 'submit', class: 'submit-btn' }, '登录'),
                State.loginMsg ? h('div', { class: 'msg ' + State.loginMsg.type }, State.loginMsg.text) : null,
                h('p', { class: 'hint', style: { marginTop: '16px', textAlign: 'center' } }, '默认账号：admin / admin123')
            ]);
            form.addEventListener('submit', function (e) { e.preventDefault(); doLogin(); });
            card.appendChild(form);
            root.appendChild(card);
            return root;
        }

        root.appendChild(h('div', { class: 'card' }, [
            h('h2', null, ['🛠 管理面板', h('span', { style: { float: 'right', fontSize: '14px', fontWeight: 'normal' } }, [
                '👤 ' + State.currentUser.username + '　',
                (function () {
                    const b = h('a', { style: { color: '#f44336', cursor: 'pointer', textDecoration: 'underline' } }, '退出登录');
                    b.addEventListener('click', doLogout);
                    return b;
                })()
            ])]),
            h('p', { class: 'hint' }, '可隐藏违规评价，被隐藏的评价对普通用户显示"该评价已被管理隐藏"')
        ]));

        const listCard = h('div', { class: 'card' }, [
            h('h3', null, '📋 全部评价')
        ]);
        if (State.adminReviews === null) {
            listCard.appendChild(loadingEl());
        } else if (State.adminReviews.length === 0) {
            listCard.appendChild(emptyEl('暂无评价'));
        } else {
            const list = h('div', { class: 'admin-review-list' });
            State.adminReviews.forEach(function (r) {
                const item = h('div', { class: 'admin-review-item' + (r.hidden ? ' hidden' : '') });
                const header = h('div', { class: 'admin-review-header' }, [
                    h('span', { class: 'admin-course-id' }, '课程ID: ' + r.course_id)
                ]);
                if (r.hidden) {
                    header.appendChild(h('span', { class: 'hidden-tag' }, '已隐藏' + (r.hidden_reason ? '（' + r.hidden_reason + '）' : '')));
                }
                item.appendChild(header);

                const scores = h('div', { class: 'review-scores' });
                [
                    [r.content_quality, '内容'],
                    [r.clarity, '清晰'],
                    [r.homework, '作业'],
                    [r.grading, '给分']
                ].forEach(function (pair) {
                    scores.appendChild(renderStars(pair[0], { readonly: true, size: 12 }));
                    scores.appendChild(h('span', { class: 'review-score-label' }, pair[1]));
                });
                scores.appendChild(h('span', { class: 'upvote-count' }, '👍 ' + r.upvotes));
                item.appendChild(scores);

                if (r.tags && r.tags.length) {
                    const tw = h('div', { class: 'review-tags' });
                    r.tags.forEach(function (t) { tw.appendChild(h('span', { class: 'pill-tag' }, t)); });
                    item.appendChild(tw);
                }
                if (r.comment) item.appendChild(h('div', { class: 'review-comment' }, r.comment));

                const footer = h('div', { class: 'admin-review-footer' }, [
                    h('span', null, formatDate(r.created_at))
                ]);
                if (!r.hidden) {
                    const actions = h('div', { class: 'admin-actions' });
                    const inp = h('input', {
                        type: 'text',
                        class: 'hide-reason-input',
                        placeholder: '隐藏理由'
                    });
                    inp.value = State.hideReasons[r.id] || '';
                    inp.addEventListener('input', function () {
                        State.hideReasons[r.id] = this.value;
                    });
                    actions.appendChild(inp);
                    const hideBtn = h('button', { class: 'admin-btn hide' }, '隐藏');
                    hideBtn.addEventListener('click', function () { doHide(r.id); });
                    actions.appendChild(hideBtn);
                    footer.appendChild(actions);
                } else {
                    const restBtn = h('button', { class: 'admin-btn restore' }, '恢复');
                    restBtn.addEventListener('click', function () { doRestore(r.id); });
                    footer.appendChild(restBtn);
                }
                item.appendChild(footer);
                list.appendChild(item);
            });
            listCard.appendChild(list);
        }
        root.appendChild(listCard);
        return root;
    }

    function render() {
        const c = container();
        clearEl(c);
        let content;
        switch (State.currentPage) {
            case 'detail': content = renderDetailPage(); break;
            case 'ranking': content = renderRankingPage(); break;
            case 'submit': content = renderSubmitPage(); break;
            case 'admin': content = renderAdminPage(); break;
            case 'home':
            default: content = renderHomePage(); break;
        }
        c.appendChild(content);
    }

    function loadCourses() {
        State.courses = null;
        render();
        apiGet('/course/list/get', {
            semester: State.searchSemester,
            keyword: State.searchKeyword
        }).then(function (res) {
            if (res.code === 0) State.courses = res.data.items || [];
            else State.courses = [];
            render();
        }).catch(function () { State.courses = []; render(); });
    }

    function loadCourseDetail(id) {
        State.courseDetail = null;
        render();
        apiGet('/course/detail/get', { id: id }).then(function (res) {
            if (res.code === 0) State.courseDetail = res.data;
            render();
        }).catch(function () { render(); });
    }

    function loadRankings() {
        State.rankingData = { good: null, bad: null };
        render();
        apiGet('/ranking/list/get', {
            semester: State.rankingSemester,
            min_reviews: 5
        }).then(function (res) {
            if (res.code === 0) {
                State.rankingData = { good: res.data.good || [], bad: res.data.bad || [] };
                if (!State.rankingSemester && res.data.current_semester) {
                    State.rankingSemester = res.data.current_semester;
                }
            } else {
                State.rankingData = { good: [], bad: [] };
            }
            render();
        }).catch(function () { State.rankingData = { good: [], bad: [] }; render(); });
    }

    function loadSubmitTeachers() {
        if (!State.reviewForm.semester) {
            State.submitTeachers = [];
            render();
            return Promise.resolve();
        }
        return apiGet('/course/teachers/get', { semester: State.reviewForm.semester }).then(function (res) {
            if (res.code === 0) State.submitTeachers = res.data.teachers || [];
            else State.submitTeachers = [];
            render();
        }).catch(function () { State.submitTeachers = []; render(); });
    }

    function loadSubmitCourses() {
        if (!State.reviewForm.teacher) {
            State.submitCourses = [];
            render();
            return;
        }
        apiGet('/course/names/get', {
            semester: State.reviewForm.semester,
            teacher: State.reviewForm.teacher
        }).then(function (res) {
            if (res.code === 0) State.submitCourses = res.data.names || [];
            else State.submitCourses = [];
            render();
        }).catch(function () { State.submitCourses = []; render(); });
    }

    function loadAdminReviews() {
        State.adminReviews = null;
        render();
        apiGet('/admin/review/list/get', {}, true).then(function (res) {
            if (res.code === 401) {
                clearToken();
                State.currentUser = null;
                State.loginMsg = { type: 'error', text: res.message || '登录已过期，请重新登录' };
                render();
                return;
            }
            if (res.code === 0) State.adminReviews = res.data.items || [];
            else State.adminReviews = [];
            render();
        }).catch(function () { State.adminReviews = []; render(); });
    }

    function doUpvote(reviewId, btnEl) {
        apiPost('/review/upvote', { review_id: reviewId }).then(function (res) {
            if (res.code === 0) {
                saveVoted(reviewId);
                if (State.courseDetail) {
                    const r = State.courseDetail.reviews.find(function (x) { return x.id === reviewId; });
                    if (r) r.upvotes = res.data.upvotes;
                }
                render();
            } else {
                alert(res.message);
            }
        });
    }

    function doSubmit() {
        const f = State.reviewForm;
        if (!f.semester || !f.teacher || !f.course_name) {
            State.submitMsg = { type: 'error', text: '请选择学期、教师和课程' };
            render();
            return;
        }
        if (!f.content_quality || !f.clarity || !f.homework || !f.grading) {
            State.submitMsg = { type: 'error', text: '请完成所有四项评分' };
            render();
            return;
        }
        State.submitMsg = null;
        apiPost('/review/submit', {
            semester: f.semester,
            course_name: f.course_name,
            teacher: f.teacher,
            content_quality: f.content_quality,
            clarity: f.clarity,
            homework: f.homework,
            grading: f.grading,
            comment: f.comment,
            tags: f.tags
        }).then(function (res) {
            if (res.code === 0) {
                clearFormData();
                State.submitMsg = { type: 'success', text: '评价提交成功！感谢您的分享。' };
                render();
                const cid = res.data.course_id;
                setTimeout(function () { setPage('detail', { courseId: cid }); }, 1500);
            } else {
                State.submitMsg = { type: 'error', text: res.message || '提交失败' };
                render();
            }
        }).catch(function () {
            State.submitMsg = { type: 'error', text: '网络错误，请重试' };
            render();
        });
    }

    function doHide(id) {
        const reason = (State.hideReasons[id] || '').trim();
        if (!reason) { alert('请填写隐藏理由'); return; }
        apiPost('/admin/review/hide', { review_id: id, reason: reason }, true).then(function (res) {
            if (res.code === 401) {
                clearToken();
                State.currentUser = null;
                State.loginMsg = { type: 'error', text: res.message || '登录已过期，请重新登录' };
                render();
                return;
            }
            if (res.code === 0) { loadAdminReviews(); }
            else { alert(res.message); }
        });
    }

    function doRestore(id) {
        apiPost('/admin/review/restore', { review_id: id }, true).then(function (res) {
            if (res.code === 401) {
                clearToken();
                State.currentUser = null;
                State.loginMsg = { type: 'error', text: res.message || '登录已过期，请重新登录' };
                render();
                return;
            }
            if (res.code === 0) { loadAdminReviews(); }
            else { alert(res.message); }
        });
    }

    function doLogin() {
        if (!State.loginForm.username || !State.loginForm.password) {
            State.loginMsg = { type: 'error', text: '请输入用户名和密码' };
            render();
            return;
        }
        State.loginMsg = null;
        apiPost('/auth/login', {
            username: State.loginForm.username.trim(),
            password: State.loginForm.password
        }).then(function (res) {
            if (res.code === 0) {
                saveToken(res.data.token, res.data.user);
                State.currentUser = res.data.user;
                State.loginMsg = { type: 'success', text: '登录成功' };
                render();
                setTimeout(function () { loadAdminReviews(); }, 500);
            } else {
                State.loginMsg = { type: 'error', text: res.message || '登录失败' };
                render();
            }
        }).catch(function () {
            State.loginMsg = { type: 'error', text: '网络错误，请重试' };
            render();
        });
    }

    function doLogout() {
        const token = getToken();
        clearToken();
        State.currentUser = null;
        State.adminReviews = [];
        if (token) {
            apiPost('/auth/logout', {}).catch(function () {});
        }
        State.loginForm = { username: '', password: '' };
        State.loginMsg = { type: 'success', text: '已退出登录' };
        render();
    }

    function init() {
        document.querySelectorAll('[data-nav]').forEach(function (el) {
            el.addEventListener('click', function () {
                const target = el.getAttribute('data-nav');
                setPage(target);
            });
        });

        State.currentUser = getCurrentUser();

        const initialHash = window.location.hash.slice(1);

        apiGet('/course/filter/options/get').then(function (res) {
            if (res.code === 0 && res.data) {
                State.semesters = res.data.semesters || [];
                if (State.semesters.length && !State.rankingSemester) {
                    State.rankingSemester = State.semesters[0];
                }
            }

            if (initialHash && initialHash !== 'home') {
                setPage(initialHash);
            } else {
                State.courses = null;
                render();
                loadCourses();
            }
        }).catch(function () {
            State.courses = [];
            if (initialHash && initialHash !== 'home') {
                setPage(initialHash);
            } else {
                render();
            }
        });

        window.addEventListener('hashchange', function () {
            const hash = window.location.hash.slice(1);
            if (hash && hash !== State.currentPage) {
                setPage(hash);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
