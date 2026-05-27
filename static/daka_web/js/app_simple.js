(function() {
const { createApp, ref, onMounted, computed, h } = Vue;
const { createRouter, createWebHashHistory, RouterView, RouterLink } = VueRouter;

const LoginPage = {
    emits: ['login-success'],
    setup(props, { emit }) {
        const isLogin = ref(true);
        const loading = ref(false);
        const form = ref({
            phone: '',
            password: '',
            nickname: ''
        });

        const toggleMode = () => {
            isLogin.value = !isLogin.value;
        };

        const handleSubmit = async () => {
            if (!form.value.phone) {
                Toast.error('请输入手机号');
                return;
            }
            if (!form.value.password) {
                Toast.error('请输入密码');
                return;
            }
            if (form.value.phone.length !== 11) {
                Toast.error('手机号格式不正确');
                return;
            }
            if (form.value.password.length < 6) {
                Toast.error('密码至少6位');
                return;
            }

            loading.value = true;
            try {
                let result;
                if (isLogin.value) {
                    result = await Api.user.login(form.value.phone, form.value.password);
                } else {
                    result = await Api.user.register(
                        form.value.phone,
                        form.value.password,
                        form.value.nickname || form.value.phone
                    );
                }

                if (result.code === 0) {
                    Storage.setToken(result.data.token);
                    Storage.setUser(result.data.user);
                    Toast.success(isLogin.value ? '登录成功' : '注册成功');
                    emit('login-success', result.data.user);
                } else {
                    Toast.error(result.msg);
                }
            } catch (e) {
                Toast.error(isLogin.value ? '登录失败，请稍后重试' : '注册失败，请稍后重试');
            } finally {
                loading.value = false;
            }
        };

        return () => {
            return h('div', { class: 'login-page' }, [
                h('div', { class: 'login-container' }, [
                    h('div', { class: 'login-logo' }, '🌱'),
                    h('h1', { class: 'login-title' }, '每日打卡'),
                    h('p', { class: 'login-subtitle' }, '自律养成好习惯'),
                    h('div', { class: 'login-tabs' }, [
                        h('div', {
                            class: ['login-tab', { active: isLogin.value }],
                            onClick: () => { isLogin.value = true; }
                        }, '登录'),
                        h('div', {
                            class: ['login-tab', { active: !isLogin.value }],
                            onClick: () => { isLogin.value = false; }
                        }, '注册')
                    ]),
                    h('div', { class: 'login-form' }, [
                        h('div', { class: 'form-group' }, [
                            h('input', {
                                type: 'tel',
                                class: 'form-input',
                                placeholder: '请输入手机号',
                                maxlength: 11,
                                value: form.value.phone,
                                onInput: (e) => { form.value.phone = e.target.value; }
                            })
                        ]),
                        !isLogin.value ? h('div', { class: 'form-group' }, [
                            h('input', {
                                type: 'text',
                                class: 'form-input',
                                placeholder: '请输入昵称（选填）',
                                value: form.value.nickname,
                                onInput: (e) => { form.value.nickname = e.target.value; }
                            })
                        ]) : null,
                        h('div', { class: 'form-group' }, [
                            h('input', {
                                type: 'password',
                                class: 'form-input',
                                placeholder: '请输入密码',
                                value: form.value.password,
                                onInput: (e) => { form.value.password = e.target.value; }
                            })
                        ]),
                        h('button', {
                            class: 'btn btn-primary btn-block btn-login',
                            onClick: handleSubmit,
                            disabled: loading.value
                        }, loading.value ? '请稍候...' : (isLogin.value ? '登录' : '注册'))
                    ]),
                    h('div', { class: 'login-tip' }, [
                        h('span', {}, isLogin.value ? '还没有账号？' : '已有账号？'),
                        h('a', { onClick: toggleMode, style: 'color: #4CAF50; cursor: pointer;' }, 
                            isLogin.value ? '立即注册' : '去登录')
                    ])
                ])
            ]);
        };
    }
};

const HomePage = {
    props: ['user-info'],
    emits: ['user-updated'],
    setup(props, { emit }) {
        const todayData = ref(null);
        const loading = ref(true);
        const showInputTaskId = ref(null);
        const inputValue = ref(0);
        const showCheckinAnimation = ref(false);

        const greeting = computed(() => {
            const hour = new Date().getHours();
            if (hour < 6) return '夜深了';
            if (hour < 12) return '早上好';
            if (hour < 14) return '中午好';
            if (hour < 18) return '下午好';
            return '晚上好';
        });

        const currentDate = computed(() => {
            const now = new Date();
            const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            return now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 ' + weekDays[now.getDay()];
        });

        const userName = computed(() => {
            return props.userInfo && props.userInfo.nickname ? props.userInfo.nickname : '朋友';
        });

        const motivationMessage = computed(() => {
            return todayData.value && todayData.value.motivation_message 
                ? todayData.value.motivation_message 
                : '今天也要加油哦！';
        });

        const loadTodayData = async () => {
            loading.value = true;
            try {
                const result = await Api.record.getToday();
                if (result.code === 0) {
                    todayData.value = result.data;
                }
            } catch (e) {
                console.error(e);
            } finally {
                loading.value = false;
            }
        };

        const showQuickInput = (task) => {
            showInputTaskId.value = task.id;
            inputValue.value = task.current_value || 0;
            setTimeout(() => {
                const input = document.querySelector('.quick-input input');
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 50);
        };

        const submitQuickInput = async (task) => {
            const inputEl = document.querySelector('.quick-input input');
            const val = inputEl ? parseInt(inputEl.value) || 0 : inputValue.value;
            if (val <= 0) {
                Toast.warning('请输入有效的数值');
                return;
            }
            showInputTaskId.value = null;
            inputValue.value = 0;
            await handleCheckin(task, val);
        };

        const handleCheckin = async (task, currentValue = null) => {
            try {
                const result = await Api.record.checkin(task.id, currentValue);
                if (result.code === 0) {
                    if (result.data.is_completed) {
                        showCheckinAnimation.value = true;
                        
                        if (result.data.new_achievements && result.data.new_achievements.length > 0) {
                            setTimeout(() => {
                                result.data.new_achievements.forEach(ach => {
                                    Toast.success('解锁成就：' + ach.name);
                                });
                            }, 800);
                        }
                        
                        if (result.data.points_earned) {
                            Toast.success('+' + result.data.points_earned + '积分 ' + result.data.motivation_message);
                        } else {
                            Toast.success(result.data.motivation_message);
                        }
                    } else {
                        Toast.success('进度已更新');
                    }
                    loadTodayData();
                    emit('user-updated');
                } else {
                    Toast.error(result.msg);
                }
            } catch (e) {
                Toast.error('打卡失败，请稍后重试');
            }
        };

        onMounted(() => {
            loadTodayData();
        });

        return () => {
            const renderWelcomeCard = () => {
                return h('div', { class: 'welcome-card' }, [
                    h('div', { class: 'welcome-content' }, [
                        h('div', { class: 'welcome-greeting' }, greeting.value + '，' + userName.value + '！'),
                        h('div', { class: 'welcome-date' }, currentDate.value),
                        h('div', { class: 'welcome-motivation' }, '"' + motivationMessage.value + '"')
                    ])
                ]);
            };

            const renderStatsOverview = () => {
                const completedTasks = todayData.value ? (todayData.value.completed_tasks || 0) : 0;
                const totalTasks = todayData.value ? (todayData.value.total_tasks || 0) : 0;
                const currentStreak = props.userInfo ? (props.userInfo.current_streak || 0) : 0;
                const overallProgress = todayData.value ? (todayData.value.overall_progress || 0) : 0;

                return h('div', { class: 'stats-overview' }, [
                    h('div', { class: 'stat-item' }, [
                        h('div', { class: 'stat-value' }, completedTasks),
                        h('div', { class: 'stat-label' }, '已完成')
                    ]),
                    h('div', { class: 'stat-item' }, [
                        h('div', { class: 'stat-value' }, totalTasks),
                        h('div', { class: 'stat-label' }, '总任务')
                    ]),
                    h('div', { class: 'stat-item orange' }, [
                        h('div', { class: 'stat-value' }, currentStreak),
                        h('div', { class: 'stat-label' }, '连续天数')
                    ]),
                    h('div', { class: 'stat-item orange' }, [
                        h('div', { class: 'stat-value' }, overallProgress + '%'),
                        h('div', { class: 'stat-label' }, '完成度')
                    ])
                ]);
            };

            const renderTaskCard = (task) => {
                const progress = task.progress || 0;
                const isCompleted = task.is_completed === 1;
                const showInput = showInputTaskId.value === task.id;

                const elements = [
                    h('div', { class: 'task-header' }, [
                        h('div', { class: 'task-info' }, [
                            h('div', { class: 'task-icon' }, task.icon),
                            h('div', { class: 'task-content' }, [
                                h('div', { class: 'task-name' }, task.name),
                                h('div', { class: 'task-meta' }, [
                                    h('span', { class: 'task-type-tag' }, task.type_text),
                                    h('span', { class: 'streak-badge' }, '连续' + (task.current_streak || 0) + '天'),
                                    task.target_value > 1 ? h('span', { style: 'color: #999;' }, ' 目标: ' + task.target_value + task.unit) : null
                                ])
                            ])
                        ])
                    ])
                ];

                if (task.target_value > 1) {
                    elements.push(h('div', { class: 'task-progress' }, [
                        h('div', { class: 'progress-bar' }, [
                            h('div', { class: 'progress-fill', style: 'width: ' + progress + '%;' })
                        ]),
                        h('div', { class: 'progress-text' }, [
                            h('span', {}, (task.current_value || 0) + ' / ' + task.target_value + ' ' + task.unit),
                            h('span', {}, progress + '%')
                        ])
                    ]));
                }

                const renderActions = () => {
                    if (task.target_value > 1 && !isCompleted) {
                        return h('button', {
                            class: 'checkin-btn pending',
                            onClick: () => showQuickInput(task)
                        }, '记录进度');
                    } else if (isCompleted) {
                        return h('button', {
                            class: 'checkin-btn completed',
                            disabled: true
                        }, '已完成');
                    } else {
                        return h('button', {
                            class: 'checkin-btn pending',
                            onClick: () => handleCheckin(task)
                        }, '立即打卡');
                    }
                };

                elements.push(h('div', { class: 'task-actions' }, [renderActions()]));

                if (showInput) {
                    elements.push(h('div', { class: 'quick-input' }, [
                        h('input', {
                            type: 'number',
                            placeholder: '请输入' + task.unit + '数',
                            min: 0,
                            max: task.target_value * 2,
                            value: inputValue.value
                        }),
                        h('button', {
                            class: 'btn btn-primary btn-sm',
                            onClick: () => submitQuickInput(task)
                        }, '确定')
                    ]));
                }

                return h('div', { class: 'task-card', key: task.id }, elements);
            };

            const renderTaskList = () => {
                if (loading.value) {
                    return h('div', { class: 'empty-state' }, [
                        h('div', { class: 'empty-icon' }, '加载中...')
                    ]);
                }

                if (!todayData.value || !todayData.value.tasks || todayData.value.tasks.length === 0) {
                    return h('div', { class: 'empty-state' }, [
                        h('div', { class: 'empty-icon' }, '暂无任务')
                    ]);
                }

                return h('div', {}, todayData.value.tasks.map(task => renderTaskCard(task)));
            };

            const renderCheckinAnimation = () => {
                if (!showCheckinAnimation.value) return null;
                
                return h('div', { class: 'checkin-animation' }, [
                    h('div', { class: 'checkmark-circle' }, [
                        h('span', { class: 'checkmark' }, '✓')
                    ])
                ]);
            };

            return h('div', { class: 'home-page' }, [
                renderWelcomeCard(),
                renderStatsOverview(),
                h('div', { class: 'card' }, [
                    h('div', { class: 'card-title' }, '今日任务'),
                    renderTaskList()
                ]),
                renderCheckinAnimation()
            ]);
        };
    }
};

const HistoryPage = {
    props: ['user-info'],
    setup(props) {
        const historyData = ref(null);
        const loading = ref(true);

        const loadHistory = async () => {
            loading.value = true;
            try {
                const result = await Api.record.getHistory(1, 20);
                if (result.code === 0) {
                    historyData.value = result.data;
                }
            } catch (e) {
                console.error(e);
            } finally {
                loading.value = false;
            }
        };

        onMounted(() => {
            loadHistory();
        });

        return () => {
            if (loading.value) {
                return h('div', { class: 'empty-state' }, [
                    h('div', { class: 'empty-icon' }, '⏳'),
                    h('div', { class: 'empty-text' }, '加载中...')
                ]);
            }

            const items = historyData.value?.items || [];

            if (items.length === 0) {
                return h('div', { class: 'empty-state' }, [
                    h('div', { class: 'empty-icon' }, '📝'),
                    h('div', { class: 'empty-text' }, '暂无打卡记录')
                ]);
            }

            return h('div', { class: 'history-page' }, [
                h('div', { class: 'card' }, [
                    h('div', { class: 'card-title' }, '打卡历史'),
                    h('div', {}, items.map(item => 
                        h('div', { class: 'history-record', key: item.id }, [
                            h('div', { class: 'history-icon' }, item.task_icon || '✅'),
                            h('div', { class: 'history-content' }, [
                                h('div', { class: 'history-task-name' }, item.task_name),
                                h('div', { class: 'history-meta' }, [
                                    item.checkin_time + ' · ' + item.current_value + (item.unit || ''),
                                    item.streak_days > 0 ? ' · 🔥' + item.streak_days + '天' : '',
                                    item.points_earned > 0 ? ' · +' + item.points_earned + '积分' : ''
                                ].join(''))
                            ]),
                            h('div', { 
                                class: ['history-status', item.is_completed ? 'completed' : 'partial']
                            }, item.is_completed ? '已完成' : '进行中')
                        ])
                    ))
                ])
            ]);
        };
    }
};

const StatisticsPage = {
    props: ['user-info'],
    setup(props) {
        const statsData = ref(null);
        const heatmapData = ref(null);
        const loading = ref(true);

        const loadStats = async () => {
            loading.value = true;
            try {
                const [statsResult, heatmapResult] = await Promise.all([
                    Api.record.getStatistics(),
                    Api.record.getHeatmap(6)
                ]);
                if (statsResult.code === 0) {
                    statsData.value = statsResult.data;
                }
                if (heatmapResult.code === 0) {
                    heatmapData.value = heatmapResult.data;
                }
            } catch (e) {
                console.error(e);
            } finally {
                loading.value = false;
            }
        };

        const generateHeatmapCells = () => {
            if (!heatmapData.value || !heatmapData.value.heatmap) return [];
            
            const heatmap = heatmapData.value.heatmap;
            const today = new Date();
            const cells = [];
            
            for (let i = 180; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const count = heatmap[dateStr] || 0;
                
                let level = 0;
                if (count > 0) level = 1;
                if (count >= 3) level = 2;
                if (count >= 6) level = 3;
                if (count >= 10) level = 4;
                
                cells.push({ date: dateStr, count, level });
            }
            
            return cells;
        };

        onMounted(() => {
            loadStats();
        });

        return () => {
            if (loading.value) {
                return h('div', { class: 'empty-state' }, [
                    h('div', { class: 'empty-icon' }, '⏳'),
                    h('div', { class: 'empty-text' }, '加载中...')
                ]);
            }

            const data = statsData.value || {};
            const cells = generateHeatmapCells();

            return h('div', { class: 'statistics-page' }, [
                h('div', { class: 'card' }, [
                    h('div', { class: 'card-title' }, '数据统计'),
                    h('div', { class: 'stats-grid' }, [
                        h('div', { class: 'stat-card' }, [
                            h('div', { class: 'stat-icon' }, '📅'),
                            h('div', { class: 'stat-number' }, data.total_days || 0),
                            h('div', { class: 'stat-label' }, '总打卡天数')
                        ]),
                        h('div', { class: 'stat-card' }, [
                            h('div', { class: 'stat-icon' }, '✅'),
                            h('div', { class: 'stat-number' }, data.total_records || 0),
                            h('div', { class: 'stat-label' }, '总打卡次数')
                        ]),
                        h('div', { class: 'stat-card' }, [
                            h('div', { class: 'stat-icon' }, '🔥'),
                            h('div', { class: 'stat-number' }, data.max_streak || 0),
                            h('div', { class: 'stat-label' }, '最长连续')
                        ]),
                        h('div', { class: 'stat-card' }, [
                            h('div', { class: 'stat-icon' }, '⭐'),
                            h('div', { class: 'stat-number' }, data.total_points || 0),
                            h('div', { class: 'stat-label' }, '总积分')
                        ])
                    ])
                ]),
                h('div', { class: 'card' }, [
                    h('div', { class: 'card-title' }, '打卡热力图'),
                    h('div', { class: 'heatmap-container' }, [
                        h('div', { class: 'heatmap-grid' }, cells.map(cell => 
                            h('div', {
                                class: ['heatmap-cell', 'level-' + cell.level],
                                title: cell.date + ': ' + cell.count + '次打卡'
                            })
                        ))
                    ]),
                    h('div', { class: 'heatmap-legend' }, [
                        h('span', { style: 'font-size: 12px; color: #999;' }, '少'),
                        h('div', { class: 'heatmap-cell level-0' }),
                        h('div', { class: 'heatmap-cell level-1' }),
                        h('div', { class: 'heatmap-cell level-2' }),
                        h('div', { class: 'heatmap-cell level-3' }),
                        h('div', { class: 'heatmap-cell level-4' }),
                        h('span', { style: 'font-size: 12px; color: #999;' }, '多')
                    ])
                ])
            ]);
        };
    }
};

const AchievementsPage = {
    props: ['user-info'],
    setup(props) {
        const achievements = ref([]);
        const loading = ref(true);

        const loadAchievements = async () => {
            loading.value = true;
            try {
                const result = await Api.achievement.getUserList();
                if (result.code === 0) {
                    achievements.value = result.data.items || result.data || [];
                }
            } catch (e) {
                console.error(e);
            } finally {
                loading.value = false;
            }
        };

        onMounted(() => {
            loadAchievements();
        });

        return () => {
            if (loading.value) {
                return h('div', { class: 'empty-state' }, [
                    h('div', { class: 'empty-icon' }, '⏳'),
                    h('div', { class: 'empty-text' }, '加载中...')
                ]);
            }

            return h('div', { class: 'achievements-page' }, [
                h('div', { class: 'card' }, [
                    h('div', { class: 'card-title' }, '成就徽章'),
                    achievements.value.length === 0 
                        ? h('div', { class: 'empty-state' }, [
                            h('div', { class: 'empty-icon' }, '🏆'),
                            h('div', { class: 'empty-text' }, '暂无成就，继续加油！')
                        ])
                        : h('div', { class: 'achievements-grid' }, achievements.value.map(ach => 
                            h('div', { 
                                class: ['achievement-card', { unlocked: ach.is_unlocked }],
                                key: ach.id || ach.name
                            }, [
                                h('div', { class: 'achievement-icon' }, ach.icon || '🏆'),
                                h('div', { class: 'achievement-name' }, ach.name),
                                h('div', { class: 'achievement-desc' }, ach.description || '')
                            ])
                        ))
                ])
            ]);
        };
    }
};

const ProfilePage = {
    props: ['user-info'],
    emits: ['logout', 'user-updated'],
    setup(props, { emit }) {
        const showEditProfile = ref(false);
        const showReminderModal = ref(false);
        const showShareModal = ref(false);
        const editForm = ref({ nickname: '' });
        const saving = ref(false);
        const reminders = ref([]);
        const loadingReminders = ref(false);

        const handleLogout = () => {
            if (confirm('确定要退出登录吗？')) {
                Storage.clear();
                emit('logout');
            }
        };

        const saveProfile = async () => {
            if (!editForm.value.nickname) {
                Toast.error('昵称不能为空');
                return;
            }

            saving.value = true;
            try {
                const result = await Api.user.updateProfile({ nickname: editForm.value.nickname });
                if (result.code === 0) {
                    Storage.setUser(result.data);
                    emit('user-updated');
                    Toast.success('保存成功');
                    showEditProfile.value = false;
                } else {
                    Toast.error(result.msg);
                }
            } catch (e) {
                Toast.error('保存失败');
            } finally {
                saving.value = false;
            }
        };

        const loadReminders = async () => {
            loadingReminders.value = true;
            try {
                const result = await Api.reminder.getList();
                if (result.code === 0) {
                    reminders.value = result.data.items || result.data || [];
                }
            } catch (e) {
                console.error(e);
            } finally {
                loadingReminders.value = false;
            }
        };

        const toggleReminder = async (reminderId) => {
            try {
                const result = await Api.reminder.toggle(reminderId);
                if (result.code === 0) {
                    Toast.success('已更新提醒状态');
                    loadReminders();
                }
            } catch (e) {
                Toast.error('操作失败');
            }
        };

        const deleteReminder = async (reminderId) => {
            if (!confirm('确定要删除这个提醒吗？')) return;
            try {
                const result = await Api.reminder.delete(reminderId);
                if (result.code === 0) {
                    Toast.success('删除成功');
                    loadReminders();
                }
            } catch (e) {
                Toast.error('删除失败');
            }
        };

        const shareApp = () => {
            const shareText = '我正在使用「每日打卡」APP，每天坚持打卡，养成好习惯！一起来吧！';
            if (navigator.share) {
                navigator.share({
                    title: '每日打卡',
                    text: shareText,
                    url: window.location.href
                }).catch(() => {});
            } else {
                const input = document.createElement('input');
                input.value = shareText + ' ' + window.location.href;
                document.body.appendChild(input);
                input.select();
                try {
                    document.execCommand('copy');
                    Toast.success('分享内容已复制到剪贴板');
                } catch (e) {
                    Toast.info(shareText);
                }
                document.body.removeChild(input);
            }
            showShareModal.value = false;
        };

        onMounted(() => {
            if (props.userInfo) {
                editForm.value.nickname = props.userInfo.nickname || '';
            }
        });

        return () => {
            const user = props.userInfo || {};

            return h('div', { class: 'profile-page' }, [
                h('div', { class: 'profile-header' }, [
                    h('div', { class: 'profile-avatar' }, (user.nickname || '👤').charAt(0)),
                    h('div', { class: 'profile-info' }, [
                        h('div', { class: 'profile-name' }, user.nickname || '用户'),
                        h('div', { class: 'profile-phone' }, user.phone || ''),
                        h('div', { class: 'profile-stats' }, [
                            h('div', { class: 'profile-stat' }, [
                                h('div', { class: 'profile-stat-value' }, user.total_days || 0),
                                h('div', { class: 'profile-stat-label' }, '总打卡')
                            ]),
                            h('div', { class: 'profile-stat' }, [
                                h('div', { class: 'profile-stat-value' }, user.current_streak || 0),
                                h('div', { class: 'profile-stat-label' }, '连续天数')
                            ]),
                            h('div', { class: 'profile-stat' }, [
                                h('div', { class: 'profile-stat-value' }, user.points || 0),
                                h('div', { class: 'profile-stat-label' }, '积分')
                            ])
                        ])
                    ])
                ]),
                h('div', { class: 'menu-list' }, [
                    h('div', { class: 'menu-item', onClick: () => { showEditProfile.value = true; } }, [
                        h('span', { class: 'menu-icon' }, '✏️'),
                        h('span', { class: 'menu-text' }, '编辑资料'),
                        h('span', { class: 'menu-arrow' }, '›')
                    ]),
                    h('div', { class: 'menu-item', onClick: () => { showReminderModal.value = true; loadReminders(); } }, [
                        h('span', { class: 'menu-icon' }, '⏰'),
                        h('span', { class: 'menu-text' }, '提醒设置'),
                        h('span', { class: 'menu-arrow' }, '›')
                    ]),
                    h('div', { class: 'menu-item', onClick: () => { showShareModal.value = true; } }, [
                        h('span', { class: 'menu-icon' }, '📤'),
                        h('span', { class: 'menu-text' }, '分享给朋友'),
                        h('span', { class: 'menu-arrow' }, '›')
                    ]),
                    h('div', { class: 'menu-item', onClick: () => Toast.success('每日打卡 v1.0.0') }, [
                        h('span', { class: 'menu-icon' }, 'ℹ️'),
                        h('span', { class: 'menu-text' }, '关于'),
                        h('span', { class: 'menu-arrow' }, '›')
                    ]),
                    h('div', { 
                        class: 'menu-item', 
                        style: 'color: #F44336;',
                        onClick: handleLogout 
                    }, [
                        h('span', { class: 'menu-icon' }, '🚪'),
                        h('span', { class: 'menu-text' }, '退出登录'),
                        h('span', { class: 'menu-arrow' }, '›')
                    ])
                ]),
                showEditProfile.value ? h('div', { 
                    class: 'modal-overlay', 
                    onClick: (e) => { if (e.target === e.currentTarget) showEditProfile.value = false; }
                }, [
                    h('div', { class: 'modal-content' }, [
                        h('div', { class: 'modal-header' }, [
                            h('div', { class: 'modal-title' }, '编辑资料'),
                            h('button', { 
                                class: 'modal-close', 
                                onClick: () => { showEditProfile.value = false; }
                            }, '×')
                        ]),
                        h('div', { class: 'modal-body' }, [
                            h('div', { class: 'form-group' }, [
                                h('label', { class: 'form-label' }, '昵称'),
                                h('input', {
                                    type: 'text',
                                    class: 'form-input',
                                    placeholder: '请输入昵称',
                                    value: editForm.value.nickname,
                                    onInput: (e) => { editForm.value.nickname = e.target.value; }
                                })
                            ])
                        ]),
                        h('div', { class: 'modal-footer' }, [
                            h('button', {
                                class: 'btn btn-outline btn-block',
                                onClick: () => { showEditProfile.value = false; }
                            }, '取消'),
                            h('button', {
                                class: 'btn btn-primary btn-block',
                                onClick: saveProfile,
                                disabled: saving.value
                            }, saving.value ? '保存中...' : '保存')
                        ])
                    ])
                ]) : null,
                showReminderModal.value ? h('div', { 
                    class: 'modal-overlay', 
                    onClick: (e) => { if (e.target === e.currentTarget) showReminderModal.value = false; }
                }, [
                    h('div', { class: 'modal-content modal-large' }, [
                        h('div', { class: 'modal-header' }, [
                            h('div', { class: 'modal-title' }, '提醒设置'),
                            h('button', { 
                                class: 'modal-close', 
                                onClick: () => { showReminderModal.value = false; }
                            }, '×')
                        ]),
                        h('div', { class: 'modal-body' }, [
                            loadingReminders.value 
                                ? h('div', { class: 'empty-state' }, [
                                    h('div', { class: 'empty-icon' }, '⏳'),
                                    h('div', { class: 'empty-text' }, '加载中...')
                                ])
                                : reminders.value.length === 0
                                    ? h('div', { class: 'empty-state' }, [
                                        h('div', { class: 'empty-icon' }, '⏰'),
                                        h('div', { class: 'empty-text' }, '暂无提醒设置')
                                    ])
                                    : h('div', { class: 'reminder-list' }, reminders.value.map(reminder => 
                                        h('div', { class: 'reminder-item', key: reminder.id }, [
                                            h('div', { class: 'reminder-info' }, [
                                                h('div', { class: 'reminder-task' }, reminder.task_name || '未命名任务'),
                                                h('div', { class: 'reminder-time' }, 
                                                    '⏰ ' + (reminder.remind_time || '') + 
                                                    (reminder.repeat_text ? ' · ' + reminder.repeat_text : '')
                                                )
                                            ]),
                                            h('div', { class: 'reminder-actions' }, [
                                                h('label', { class: 'switch' }, [
                                                    h('input', {
                                                        type: 'checkbox',
                                                        checked: reminder.is_enabled === 1,
                                                        onChange: () => toggleReminder(reminder.id)
                                                    }),
                                                    h('span', { class: 'slider' })
                                                ]),
                                                h('button', {
                                                    class: 'btn btn-danger btn-sm',
                                                    onClick: () => deleteReminder(reminder.id),
                                                    style: 'margin-left: 8px;'
                                                }, '删除')
                                            ])
                                        ])
                                    ))
                        ])
                    ])
                ]) : null,
                showShareModal.value ? h('div', { 
                    class: 'modal-overlay', 
                    onClick: (e) => { if (e.target === e.currentTarget) showShareModal.value = false; }
                }, [
                    h('div', { class: 'modal-content' }, [
                        h('div', { class: 'modal-header' }, [
                            h('div', { class: 'modal-title' }, '分享给朋友'),
                            h('button', { 
                                class: 'modal-close', 
                                onClick: () => { showShareModal.value = false; }
                            }, '×')
                        ]),
                        h('div', { class: 'modal-body' }, [
                            h('div', { class: 'share-content' }, [
                                h('div', { class: 'share-icon' }, '🌱'),
                                h('div', { class: 'share-title' }, '每日打卡'),
                                h('div', { class: 'share-desc' }, '每天坚持打卡，养成好习惯！')
                            ]),
                            h('div', { class: 'share-actions' }, [
                                h('button', {
                                    class: 'btn btn-primary btn-block',
                                    onClick: shareApp
                                }, '复制分享内容')
                            ])
                        ])
                    ])
                ]) : null
            ]);
        };
    }
};

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/', redirect: '/home' },
        { path: '/home', component: HomePage },
        { path: '/history', component: HistoryPage },
        { path: '/statistics', component: StatisticsPage },
        { path: '/achievements', component: AchievementsPage },
        { path: '/profile', component: ProfilePage }
    ]
});

const App = {
    setup() {
        const router = VueRouter.useRouter();
        const route = VueRouter.useRoute();
        
        const userInfo = ref(Storage.getUser());
        const isLoggedIn = ref(!!Storage.getToken());

        const handleLoginSuccess = (user) => {
            userInfo.value = user;
            isLoggedIn.value = true;
        };

        const handleLogout = () => {
            Storage.clear();
            userInfo.value = null;
            isLoggedIn.value = false;
        };

        const handleUserUpdated = () => {
            userInfo.value = Storage.getUser();
        };

        const tabs = [
            { key: 'home', icon: '🏠', label: '首页', path: '/home' },
            { key: 'history', icon: '📅', label: '历史', path: '/history' },
            { key: 'stats', icon: '📊', label: '统计', path: '/statistics' },
            { key: 'achievements', icon: '🏆', label: '成就', path: '/achievements' },
            { key: 'profile', icon: '👤', label: '我的', path: '/profile' }
        ];

        return () => {
            if (!isLoggedIn.value) {
                return h(LoginPage, {
                    onLoginSuccess: handleLoginSuccess
                });
            }

            const currentPath = route.path;
            const activeTab = tabs.find(tab => tab.path === currentPath)?.key || 'home';

            return h('div', { class: 'app-container' }, [
                h('div', { class: 'app-header' }, [
                    h('div', { class: 'header-title' }, '每日打卡'),
                    h('div', { class: 'header-user' }, [
                        h('span', {}, userInfo.value?.nickname || '用户'),
                        h('span', { 
                            class: 'logout-btn',
                            onClick: handleLogout
                        }, '退出')
                    ])
                ]),
                h('div', { class: 'app-content' }, [
                    h(VueRouter.RouterView, {
                        userInfo: userInfo.value,
                        onUserUpdated: handleUserUpdated,
                        onLogout: handleLogout
                    })
                ]),
                h('div', { class: 'app-tabbar' }, tabs.map(tab => 
                    h('div', {
                        class: ['tabbar-item', { active: activeTab === tab.key }],
                        onClick: () => {
                            router.push(tab.path);
                        }
                    }, [
                        h('div', { class: 'tabbar-icon' }, tab.icon),
                        h('div', { class: 'tabbar-label' }, tab.label)
                    ])
                ))
            ]);
        };
    }
};

const app = createApp(App);
app.use(router);
app.mount('#app');
})();
