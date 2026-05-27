(function() {
const { ref, onMounted, computed, h } = Vue;

const HomePage = {
    props: ['user-info'],
    emits: ['user-updated'],
    setup(props, { emit }) {
        const { useRouter } = VueRouter;
        const router = useRouter();
        
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
        };

        const submitQuickInput = async (task) => {
            if (inputValue.value <= 0) {
                Toast.warning('请输入有效的数值');
                return;
            }
            await handleCheckin(task, inputValue.value);
            showInputTaskId.value = null;
            inputValue.value = 0;
        };

        const handleCheckin = async (task, currentValue = null) => {
            try {
                const result = await Api.record.checkin(task.id, currentValue);
                if (result.code === 0) {
                    if (result.data.is_completed) {
                        playCheckinAnimation();
                        
                        if (result.data.new_achievements && result.data.new_achievements.length > 0) {
                            setTimeout(() => {
                                result.data.new_achievements.forEach(ach => {
                                    Toast.success('🎉 解锁成就：' + ach.name);
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

        const playCheckinAnimation = () => {
            showCheckinAnimation.value = true;
            createConfetti();
            setTimeout(() => {
                showCheckinAnimation.value = false;
            }, 1500);
        };

        const createConfetti = () => {
            const colors = ['#4CAF50', '#81C784', '#FF9800', '#FFB74D', '#E8F5E9', '#FFF3E0'];
            for (let i = 0; i < 30; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 3500);
            }
        };

        const goToCreateTask = () => {
            router.push('/create-task');
        };

        onMounted(() => {
            loadTodayData();
        });

        return {
            todayData,
            loading,
            greeting,
            currentDate,
            userName,
            motivationMessage,
            showInputTaskId,
            inputValue,
            showCheckinAnimation,
            showQuickInput,
            submitQuickInput,
            handleCheckin,
            goToCreateTask
        };
    },
    render() {
        const renderWelcomeCard = () => {
            return h('div', { class: 'welcome-card' }, [
                h('div', { class: 'welcome-content' }, [
                    h('div', { class: 'welcome-greeting' }, this.greeting + '，' + this.userName + '！'),
                    h('div', { class: 'welcome-date' }, this.currentDate),
                    h('div', { class: 'welcome-motivation' }, '"' + this.motivationMessage + '"')
                ])
            ]);
        };

        const renderStatsOverview = () => {
            const completedTasks = this.todayData ? (this.todayData.completed_tasks || 0) : 0;
            const totalTasks = this.todayData ? (this.todayData.total_tasks || 0) : 0;
            const currentStreak = this.userInfo ? (this.userInfo.current_streak || 0) : 0;
            const overallProgress = this.todayData ? (this.todayData.overall_progress || 0) : 0;

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

        const renderAllCompleted = () => {
            if (!this.todayData || !this.todayData.is_all_completed) return null;
            
            return h('div', { 
                class: 'card', 
                style: 'background: linear-gradient(135deg, #FFF3E0, #E8F5E9);' 
            }, [
                h('div', { style: 'text-align: center; padding: 20px 0;' }, [
                    h('div', { style: 'font-size: 48px; margin-bottom: 12px;' }, '🎉'),
                    h('div', { style: 'font-size: 18px; font-weight: 600; color: #4CAF50;' }, '今日完美完成！'),
                    h('div', { style: 'font-size: 14px; color: #666; margin-top: 8px;' }, '所有任务都已打卡，太棒了！')
                ])
            ]);
        };

        const renderTaskCard = (task) => {
            const progress = task.progress || 0;
            const isCompleted = task.is_completed === 1;
            const showInput = this.showInputTaskId === task.id;

            const elements = [
                h('div', { class: 'task-header' }, [
                    h('div', { class: 'task-info' }, [
                        h('div', { class: 'task-icon' }, task.icon),
                        h('div', { class: 'task-content' }, [
                            h('div', { class: 'task-name' }, task.name),
                            h('div', { class: 'task-meta' }, [
                                h('span', { class: 'task-type-tag' }, task.type_text),
                                h('span', { class: 'streak-badge' }, '🔥 连续' + (task.current_streak || 0) + '天'),
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
                        onClick: () => this.showQuickInput(task)
                    }, '记录进度');
                } else if (isCompleted) {
                    return h('button', {
                        class: 'checkin-btn completed',
                        disabled: true
                    }, '✓ 已完成');
                } else {
                    return h('button', {
                        class: 'checkin-btn pending',
                        onClick: () => this.handleCheckin(task)
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
                        value: this.inputValue,
                        onInput: (e) => { this.inputValue = parseInt(e.target.value) || 0; }
                    }),
                    h('button', {
                        class: 'btn btn-primary btn-sm',
                        onClick: () => this.submitQuickInput(task)
                    }, '确定')
                ]));
            }

            return h('div', { class: 'task-card', key: task.id }, elements);
        };

        const renderTaskList = () => {
            if (this.loading) {
                return h('div', { class: 'empty-state' }, [
                    h('div', { class: 'empty-icon' }, '⏳'),
                    h('div', { class: 'empty-text' }, '加载中...')
                ]);
            }

            if (!this.todayData || !this.todayData.tasks || this.todayData.tasks.length === 0) {
                return h('div', { class: 'empty-state' }, [
                    h('div', { class: 'empty-icon' }, '📋'),
                    h('div', { class: 'empty-text' }, '暂无任务')
                ]);
            }

            return h('div', {}, this.todayData.tasks.map(task => renderTaskCard(task)));
        };

        const renderCheckinAnimation = () => {
            if (!this.showCheckinAnimation) return null;
            
            return h('div', { class: 'checkin-animation' }, [
                h('div', { class: 'checkmark-circle' }, [
                    h('span', { class: 'checkmark' }, '✓')
                ])
            ]);
        };

        return h('div', { class: 'home-page' }, [
            renderWelcomeCard(),
            renderStatsOverview(),
            renderAllCompleted(),
            h('div', { class: 'card' }, [
                h('div', { class: 'card-title' }, '今日任务'),
                renderTaskList()
            ]),
            h('button', { class: 'floating-btn', onClick: this.goToCreateTask }, '+'),
            renderCheckinAnimation()
        ]);
    }
};

window.HomePage = HomePage;
})();
