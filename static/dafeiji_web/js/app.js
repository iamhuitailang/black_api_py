var App = Vue.createApp({
  data: function() {
    return {
      currentUser: null,
      currentPage: 'login',
      isAdmin: false,
      toasts: [],
      loading: false
    };
  },

  computed: {
    isLoggedIn: function() {
      return !!this.currentUser;
    },
    userNavLinks: function() {
      return [
        { page: 'game', label: '开始游戏' },
        { page: 'leaderboard', label: '排行榜' },
        { page: 'achievement', label: '成就' },
        { page: 'profile', label: '个人中心' }
      ];
    },
    adminNavLinks: function() {
      return [
        { page: 'admin-dashboard', label: '数据面板' },
        { page: 'admin-users', label: '用户管理' },
        { page: 'admin-aircraft', label: '飞机管理' },
        { page: 'admin-waves', label: '关卡管理' },
        { page: 'admin-items', label: '道具管理' },
        { page: 'admin-achievements', label: '成就管理' }
      ];
    },
    navLinks: function() {
      if (this.isAdmin) {
        return this.adminNavLinks;
      }
      return this.userNavLinks;
    },
    isAuthPage: function() {
      return this.currentPage === 'login' || this.currentPage === 'register';
    },
    isAdminPage: function() {
      return this.currentPage && this.currentPage.startsWith('admin-');
    }
  },

  methods: {
    navigate: function(page) {
      Router.navigate(page);
    },

    login: function(userData, token) {
      GameStorage.setToken(token);
      GameStorage.setUser(userData);
      this.currentUser = userData;
      this.isAdmin = userData.role === 'admin';
      Router.navigate('game');
      Utils.showToast('登录成功', 'success');
    },

    logout: function() {
      var self = this;
      Api.auth.logout().catch(function() {}).finally(function() {
        GameStorage.clearAll();
        self.currentUser = null;
        self.isAdmin = false;
        Router.navigate('login');
        Utils.showToast('已退出登录', 'info');
      });
    },

    checkAuth: function() {
      var self = this;
      var token = GameStorage.getToken();
      if (!token) {
        return;
      }
      Api.auth.getCurrentUser().then(function(res) {
        if (res.data) {
          self.currentUser = res.data;
          self.isAdmin = res.data.role === 'admin';
          GameStorage.setUser(res.data);
        }
      }).catch(function(err) {
        if (err.code === 401 || (err.message && err.message.indexOf('401') !== -1)) {
          GameStorage.clearAll();
          self.currentUser = null;
          self.isAdmin = false;
          Router.navigate('login');
        }
      });
    },

    addToast: function(message, type) {
      var self = this;
      var toast = { message: message, type: type || 'info', id: Date.now() };
      this.toasts.push(toast);
      setTimeout(function() {
        var index = self.toasts.findIndex(function(t) { return t.id === toast.id; });
        if (index > -1) {
          self.toasts.splice(index, 1);
        }
      }, 3000);
    },

    isActive: function(page) {
      return this.currentPage === page;
    },

    handleRouteChange: function(page) {
      this.currentPage = page;
      window.scrollTo(0, 0);
    }
  },

  mounted: function() {
    var self = this;
    var savedUser = GameStorage.getUser();
    var savedToken = GameStorage.getToken();
    if (savedUser && savedToken) {
      self.currentUser = savedUser;
      self.isAdmin = savedUser.role === 'admin';
    }
    this.currentPage = Router.getCurrentPage();
    Router.onRouteChange(function(page) {
      self.handleRouteChange(page);
    });
    if (!window.location.hash || window.location.hash === '#') {
      Router.navigate(Router.getDefaultPage());
    }
    this.checkAuth();
  }
});

App.component('page-login', {
  template: '#page-login-template',
  data: function() {
    return {
      form: { username: '', password: '' },
      loading: false
    };
  },
  methods: {
    submit: function() {
      var self = this;
      if (!this.form.username || !this.form.password) {
        Utils.showToast('请填写用户名和密码', 'error');
        return;
      }
      this.loading = true;
      Api.auth.login(this.form).then(function(res) {
        if (res.data) {
          self.$root.login(res.data.user || res.data, res.data.token);
        }
      }).catch(function(err) {
        Utils.showToast(err.message || '登录失败', 'error');
      }).finally(function() {
        self.loading = false;
      });
    },
    goToRegister: function() {
      Router.navigate('register');
    }
  }
});

App.component('page-register', {
  template: '#page-register-template',
  data: function() {
    return {
      form: { username: '', password: '', confirmPassword: '', nickname: '' },
      loading: false
    };
  },
  methods: {
    submit: function() {
      var self = this;
      if (!this.form.username || !this.form.password) {
        Utils.showToast('请填写用户名和密码', 'error');
        return;
      }
      if (this.form.password !== this.form.confirmPassword) {
        Utils.showToast('两次密码不一致', 'error');
        return;
      }
      this.loading = true;
      Api.auth.register({
        username: this.form.username,
        password: this.form.password,
        nickname: this.form.nickname || this.form.username
      }).then(function(res) {
        Utils.showToast('注册成功，请登录', 'success');
        Router.navigate('login');
      }).catch(function(err) {
        Utils.showToast(err.message || '注册失败', 'error');
      }).finally(function() {
        self.loading = false;
      });
    },
    goToLogin: function() {
      Router.navigate('login');
    }
  }
});

App.component('page-game', {
  template: '#page-game-template',
  data: function() {
    return {
      Utils: Utils,
      uiState: 'select',
      aircraftList: [],
      selectedAircraft: null,
      loadingAircraft: false,
      hasSavedState: false,
      savedState: null,
      score: 0,
      wave: 1,
      hp: 100,
      maxHp: 100,
      lives: 3,
      weaponLevel: 1,
      gameOverData: {
        score: 0,
        wave: 1,
        enemiesKilled: 0,
        itemsCollected: 0,
        playTime: 0
      },
      isNewRecord: false,
      engine: null,
      joystickActive: false,
      joystickX: 0,
      joystickY: 0,
      joystickRadius: 50,
      lastJoystickTime: 0,
      resizeHandler: null,
      keyHandler: null,
      joystickAnimationId: null
    };
  },
  computed: {
    hpPercent: function() {
      if (this.maxHp <= 0) return 0;
      return Math.max(0, Math.min(100, (this.hp / this.maxHp) * 100));
    },
    joystickStyle: function() {
      var maxDist = this.joystickRadius;
      var dist = Math.sqrt(this.joystickX * this.joystickX + this.joystickY * this.joystickY);
      if (dist > maxDist) {
        var ratio = maxDist / dist;
        return 'transform: translate(' + (this.joystickX * ratio) + 'px, ' + (this.joystickY * ratio) + 'px)';
      }
      return 'transform: translate(' + this.joystickX + 'px, ' + this.joystickY + 'px)';
    }
  },
  mounted: function() {
    var self = this;
    self.loadAircraft();
    self.checkSavedState();
    self.resizeHandler = Utils.throttle(function() {
      self.resizeCanvas();
    }, 100);
    window.addEventListener('resize', self.resizeHandler);
    self.keyHandler = function(e) {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (self.uiState === 'playing' || self.uiState === 'paused') {
          self.togglePause();
        }
      }
    };
    window.addEventListener('keydown', self.keyHandler);
  },
  beforeUnmount: function() {
    var self = this;
    if (self.engine) {
      self.engine.destroy();
      self.engine = null;
    }
    if (self.resizeHandler) {
      window.removeEventListener('resize', self.resizeHandler);
    }
    if (self.keyHandler) {
      window.removeEventListener('keydown', self.keyHandler);
    }
    if (self.joystickAnimationId) {
      cancelAnimationFrame(self.joystickAnimationId);
    }
  },
  methods: {
    loadAircraft: function() {
      var self = this;
      self.loadingAircraft = true;
      Api.aircraft.getAircraftAll().then(function(res) {
        self.aircraftList = res.data || [];
        var defaultCraft = self.aircraftList.find(function(c) {
          return c.is_default === 1;
        });
        if (defaultCraft) {
          self.selectedAircraft = defaultCraft;
        } else if (self.aircraftList.length > 0) {
          self.selectedAircraft = self.aircraftList[0];
        }
      }).catch(function(err) {
        Utils.showToast(err.message || '加载飞机列表失败', 'error');
      }).finally(function() {
        self.loadingAircraft = false;
      });
    },
    checkSavedState: function() {
      var self = this;
      var localState = GameStorage.getGameState();
      self.savedState = localState;
      self.hasSavedState = !!localState;
      Api.game.loadGameState().then(function(res) {
        if (res.data) {
          self.savedState = res.data;
          self.hasSavedState = true;
        }
      }).catch(function() {});
    },
    selectAircraft: function(craft) {
      this.selectedAircraft = craft;
    },
    startGame: function() {
      var self = this;
      try {
        if (!self.selectedAircraft) {
          Utils.showToast('请先选择战机', 'error');
          return;
        }
        self.initEngine(false);
      } catch (e) {
        Utils.showToast('启动游戏失败: ' + e.message, 'error');
      }
    },
    continueGame: function() {
      var self = this;
      try {
        if (!self.savedState || !self.savedState.aircraft_id) {
          Utils.showToast('没有可继续的存档', 'error');
          return;
        }
        self.selectedAircraft = self.aircraftList.find(function(c) {
          return c.id === self.savedState.aircraft_id;
        }) || self.aircraftList[0];
        self.initEngine(true);
      } catch (e) {
        Utils.showToast('继续游戏失败: ' + e.message, 'error');
      }
    },
    initEngine: function(loadSaved) {
      var self = this;
      self.uiState = 'playing';
      self.$nextTick(function() {
        try {
          var canvas = self.$refs.gameCanvas;
          if (!canvas) {
            throw new Error('Canvas not found');
          }

          canvas.width = 480;
          canvas.height = 720;
          var wrapper = canvas.parentElement;
          if (wrapper) {
            var maxWidth = Math.min(wrapper.clientWidth, 480);
            var ratio = 720 / 480;
            var width = maxWidth;
            var height = Math.min(width * ratio, 600);
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
          }

          var callbacks = {
            onScoreUpdate: function(score) {
              self.score = score;
            },
            onStateChange: function(data) {
              if (data.wave) {
                self.wave = data.wave;
              }
              if (data.state === 'autosave' && data.data) {
                self.saveGameState(data.data);
              }
              if (self.engine) {
                self.hp = self.engine.player.hp;
                self.maxHp = self.engine.player.maxHp;
                self.lives = self.engine.player.lives;
                self.weaponLevel = self.engine.player.weaponLevel;
              }
            },
            onGameOver: function(data) {
              self.uiState = 'gameOver';
              self.gameOverData = data;
              self.handleGameOver(data);
            },
            onAchievementUnlock: function(type, value) {
              self.checkAchievements();
            }
          };

          if (!window.DafeijiEngine) {
            throw new Error('Game engine not loaded');
          }

          self.engine = new DafeijiEngine(canvas, callbacks);
          self.engine.setAircraft(self.selectedAircraft);

          if (loadSaved && self.savedState) {
            self.engine.loadState(self.savedState);
            self.score = self.engine.score;
            self.wave = self.engine.wave;
            self.hp = self.engine.player.hp;
            self.maxHp = self.engine.player.maxHp;
            self.lives = self.engine.player.lives;
            self.weaponLevel = self.engine.player.weaponLevel;
          }

          self.engine.start();
          self.startHudUpdate();
          self.startJoystickLoop();
        } catch (e) {
          console.error('Game init error:', e);
          Utils.showToast('游戏启动失败: ' + e.message, 'error');
          self.uiState = 'select';
          if (self.engine) {
            try { self.engine.destroy(); } catch (err) {}
            self.engine = null;
          }
        }
      });
    },
    resizeCanvas: function() {
      var self = this;
      var canvas = self.$refs.gameCanvas;
      if (!canvas) return;
      canvas.width = 480;
      canvas.height = 720;
      var wrapper = canvas.parentElement;
      if (!wrapper) return;
      var maxWidth = Math.min(wrapper.clientWidth, 480);
      var ratio = 720 / 480;
      var width = maxWidth;
      var height = Math.min(width * ratio, 600);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
    },
    startHudUpdate: function() {
      var self = this;
      var updateHud = function() {
        if (self.engine && (self.uiState === 'playing' || self.uiState === 'paused')) {
          self.hp = self.engine.player.hp;
          self.maxHp = self.engine.player.maxHp;
          self.lives = self.engine.player.lives;
          self.weaponLevel = self.engine.player.weaponLevel;
          requestAnimationFrame(updateHud);
        }
      };
      requestAnimationFrame(updateHud);
    },
    saveGameState: function(stateData) {
      var self = this;
      GameStorage.setGameState(stateData);
      Api.game.saveGameState(stateData).catch(function() {});
    },
    togglePause: function() {
      var self = this;
      if (!self.engine) return;
      if (self.uiState === 'playing') {
        self.engine.pause();
        self.uiState = 'paused';
      } else if (self.uiState === 'paused') {
        self.engine.resume();
        self.uiState = 'playing';
      }
    },
    backToMenu: function() {
      var self = this;
      if (self.engine) {
        if (self.engine.state === 'playing') {
          self.saveGameState(self.engine.saveState());
        }
        self.engine.destroy();
        self.engine = null;
      }
      if (self.joystickAnimationId) {
        cancelAnimationFrame(self.joystickAnimationId);
        self.joystickAnimationId = null;
      }
      self.uiState = 'select';
      self.score = 0;
      self.wave = 1;
      self.hp = 100;
      self.maxHp = 100;
      self.lives = 3;
      self.weaponLevel = 1;
      self.checkSavedState();
    },
    playAgain: function() {
      var self = this;
      self.uiState = 'select';
      self.score = 0;
      self.wave = 1;
      self.hp = 100;
      self.maxHp = 100;
      self.lives = 3;
      self.weaponLevel = 1;
      GameStorage.removeGameState();
      self.hasSavedState = false;
      self.savedState = null;
    },
    handleGameOver: function(data) {
      var self = this;
      GameStorage.removeGameState();
      self.hasSavedState = false;
      self.savedState = null;

      Api.leaderboard.getUserBest().then(function(res) {
        if (res.data && res.data.score !== undefined) {
          self.isNewRecord = data.score > res.data.score;
        } else {
          self.isNewRecord = true;
        }
      }).catch(function() {
        self.isNewRecord = true;
      });

      Api.game.submitScore(data).then(function() {
        if (self.isNewRecord) {
          Utils.showToast('新纪录！得分已提交', 'success');
        } else {
          Utils.showToast('得分已提交', 'info');
        }
      }).catch(function(err) {
        Utils.showToast(err.message || '提交分数失败', 'error');
      });

      self.checkAchievements();
    },
    checkAchievements: function() {
      Api.achievement.checkAchievements().then(function(res) {
        if (res.data && res.data.unlocked && res.data.unlocked.length > 0) {
          res.data.unlocked.forEach(function(ach) {
            Utils.showToast('成就解锁: ' + ach.name, 'success');
          });
        }
      }).catch(function() {});
    },
    onJoystickStart: function(e) {
      var self = this;
      if (self.uiState !== 'playing') return;
      self.joystickActive = true;
      var touch = e.touches[0];
      var joystick = self.$refs.joystick;
      if (!joystick) return;
      var rect = joystick.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;
      self.joystickX = touch.clientX - centerX;
      self.joystickY = touch.clientY - centerY;
    },
    onJoystickMove: function(e) {
      var self = this;
      if (!self.joystickActive || self.uiState !== 'playing') return;
      var touch = e.touches[0];
      var joystick = self.$refs.joystick;
      if (!joystick) return;
      var rect = joystick.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;
      self.joystickX = touch.clientX - centerX;
      self.joystickY = touch.clientY - centerY;
    },
    onJoystickEnd: function() {
      var self = this;
      self.joystickActive = false;
      self.joystickX = 0;
      self.joystickY = 0;
    },
    startJoystickLoop: function() {
      var self = this;
      var lastTime = performance.now();
      var loop = function(timestamp) {
        if (self.engine && self.joystickActive) {
          var dt = (timestamp - lastTime) / 16.67;
          lastTime = timestamp;
          var maxDist = self.joystickRadius;
          var dist = Math.sqrt(self.joystickX * self.joystickX + self.joystickY * self.joystickY);
          if (dist > 0) {
            var clampedDist = Math.min(dist, maxDist);
            var dx = (self.joystickX / dist) * (clampedDist / maxDist);
            var dy = (self.joystickY / dist) * (clampedDist / maxDist);
            self.engine.movePlayer(dx, dy, dt);
          }
        } else {
          lastTime = timestamp;
        }
        if (self.engine && (self.uiState === 'playing' || self.uiState === 'paused')) {
          self.joystickAnimationId = requestAnimationFrame(loop);
        }
      };
      self.joystickAnimationId = requestAnimationFrame(loop);
    }
  }
});

App.component('page-leaderboard', {
  template: '#page-leaderboard-template',
  data: function() {
    return {
      topPlayers: [],
      userRank: null,
      userBest: null,
      loading: false
    };
  },
  mounted: function() {
    this.loadData();
  },
  methods: {
    loadData: function() {
      var self = this;
      this.loading = true;
      Api.leaderboard.getTopPlayers(20).then(function(res) {
        self.topPlayers = res.data || [];
      }).catch(function() {});
      Api.leaderboard.getUserRank().then(function(res) {
        self.userRank = res.data;
      }).catch(function() {});
      Api.leaderboard.getUserBest().then(function(res) {
        self.userBest = res.data;
      }).catch(function() {}).finally(function() {
        self.loading = false;
      });
    },
    getRankClass: function(index) {
      if (index === 0) return 'gold';
      if (index === 1) return 'silver';
      if (index === 2) return 'bronze';
      return 'normal';
    }
  }
});

App.component('page-achievement', {
  template: '#page-achievement-template',
  data: function() {
    return {
      achievements: [],
      userAchievements: [],
      loading: false
    };
  },
  mounted: function() {
    this.loadData();
  },
  methods: {
    loadData: function() {
      var self = this;
      this.loading = true;
      Api.achievement.getAchievementList(1, 100).then(function(res) {
        self.achievements = res.data && res.data.items ? res.data.items : [];
      }).catch(function() {});
      Api.achievement.getUserAchievements().then(function(res) {
        self.userAchievements = (res.data || []).map(function(a) { return a.id || a.achievement_id; });
      }).catch(function() {}).finally(function() {
        self.loading = false;
      });
    },
    isUnlocked: function(achievement) {
      return this.userAchievements.indexOf(achievement.id) > -1;
    }
  }
});

App.component('page-profile', {
  template: '#page-profile-template',
  data: function() {
    return {
      user: null,
      editMode: false,
      form: { nickname: '', email: '' },
      passwordForm: { oldPassword: '', newPassword: '', confirmPassword: '' },
      showPasswordForm: false,
      loading: false
    };
  },
  mounted: function() {
    this.user = this.$root.currentUser ? Object.assign({}, this.$root.currentUser) : null;
    if (this.user) {
      this.form.nickname = this.user.nickname || '';
      this.form.email = this.user.email || '';
    }
  },
  methods: {
    updateProfile: function() {
      var self = this;
      this.loading = true;
      Api.auth.updateProfile(this.form).then(function(res) {
        Utils.showToast('更新成功', 'success');
        self.$root.checkAuth();
        self.editMode = false;
      }).catch(function(err) {
        Utils.showToast(err.message || '更新失败', 'error');
      }).finally(function() {
        self.loading = false;
      });
    },
    changePassword: function() {
      var self = this;
      if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
        Utils.showToast('两次密码不一致', 'error');
        return;
      }
      this.loading = true;
      Api.auth.changePassword({
        old_password: this.passwordForm.oldPassword,
        new_password: this.passwordForm.newPassword
      }).then(function(res) {
        Utils.showToast('密码修改成功', 'success');
        self.showPasswordForm = false;
        self.passwordForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
      }).catch(function(err) {
        Utils.showToast(err.message || '修改失败', 'error');
      }).finally(function() {
        self.loading = false;
      });
    }
  }
});

App.component('page-admin-dashboard', {
  template: '#page-admin-dashboard-template',
  data: function() {
    return {
      overview: {},
      dailyStats: [],
      popularAircraft: [],
      topPlayers: [],
      loading: false
    };
  },
  mounted: function() {
    this.loadData();
  },
  methods: {
    formatNumber: Utils.formatScore,
    getRankClass: function(index) {
      if (index === 0) return 'gold';
      if (index === 1) return 'silver';
      if (index === 2) return 'bronze';
      return 'normal';
    },
    loadData: function() {
      var self = this;
      this.loading = true;
      Api.dashboard.getOverview().then(function(res) {
        self.overview = res.data || {};
      }).catch(function() {});
      Api.dashboard.getDailyStats(7).then(function(res) {
        self.dailyStats = res.data || [];
      }).catch(function() {});
      Api.dashboard.getPopularAircraft(5).then(function(res) {
        self.popularAircraft = res.data || [];
      }).catch(function() {});
      Api.dashboard.getTopPlayers(5).then(function(res) {
        self.topPlayers = res.data || [];
      }).catch(function() {}).finally(function() {
        self.loading = false;
      });
    }
  }
});

App.component('page-admin-users', {
  template: '#page-admin-users-template',
  data: function() {
    return { items: [], page: 1, pageSize: 10, total: 0, loading: false, keyword: '' };
  },
  mounted: function() { this.loadData(); },
  methods: {
    formatNumber: Utils.formatScore,
    loadData: function() {
      var self = this;
      this.loading = true;
      Api.auth.getUserList(this.page, this.pageSize, null, null, this.keyword).then(function(res) {
        self.items = res.data && res.data.items ? res.data.items : [];
        self.total = res.data && res.data.total ? res.data.total : 0;
      }).catch(function() {}).finally(function() { self.loading = false; });
    },
    toggleBan: function(user) {
      var self = this;
      if (user.status === 0) {
        Api.auth.banUser(user.id).then(function() {
          Utils.showToast('已封号', 'success');
          self.loadData();
        }).catch(function(err) { Utils.showToast(err.message || '操作失败', 'error'); });
      } else {
        Api.auth.unbanUser(user.id).then(function() {
          Utils.showToast('已解封', 'success');
          self.loadData();
        }).catch(function(err) { Utils.showToast(err.message || '操作失败', 'error'); });
      }
    },
    removeUser: function(user) {
      var self = this;
      if (!confirm('确定删除该用户？')) return;
      Api.auth.deleteUser(user.id).then(function() {
        Utils.showToast('删除成功', 'success');
        self.loadData();
      }).catch(function(err) { Utils.showToast(err.message || '删除失败', 'error'); });
    }
  }
});

App.component('page-admin-aircraft', {
  template: '#page-admin-aircraft-template',
  data: function() {
    return { items: [], page: 1, pageSize: 10, total: 0, loading: false, showModal: false, editItem: null, form: {} };
  },
  mounted: function() { this.loadData(); },
  methods: {
    loadData: function() {
      var self = this;
      this.loading = true;
      Api.aircraft.getAircraftList(this.page, this.pageSize).then(function(res) {
        self.items = res.data && res.data.items ? res.data.items : [];
        self.total = res.data && res.data.total ? res.data.total : 0;
      }).catch(function() {}).finally(function() { self.loading = false; });
    },
    openCreate: function() {
      this.editItem = null;
      this.form = {};
      this.showModal = true;
    },
    openEdit: function(item) {
      this.editItem = item;
      this.form = Object.assign({}, item);
      this.showModal = true;
    },
    saveItem: function() {
      var self = this;
      if (this.editItem) {
        Api.aircraft.updateAircraft(this.form).then(function() {
          Utils.showToast('更新成功', 'success');
          self.showModal = false;
          self.loadData();
        }).catch(function(err) { Utils.showToast(err.message || '操作失败', 'error'); });
      } else {
        Api.aircraft.createAircraft(this.form).then(function() {
          Utils.showToast('创建成功', 'success');
          self.showModal = false;
          self.loadData();
        }).catch(function(err) { Utils.showToast(err.message || '操作失败', 'error'); });
      }
    },
    deleteItem: function(id) {
      var self = this;
      if (!confirm('确定删除？')) return;
      Api.aircraft.deleteAircraft(id).then(function() {
        Utils.showToast('删除成功', 'success');
        self.loadData();
      }).catch(function(err) { Utils.showToast(err.message || '删除失败', 'error'); });
    }
  }
});

App.component('page-admin-waves', {
  template: '#page-admin-waves-template',
  data: function() {
    return { items: [], page: 1, pageSize: 10, total: 0, loading: false, showModal: false, editItem: null, form: {} };
  },
  mounted: function() { this.loadData(); },
  methods: {
    loadData: function() {
      var self = this;
      this.loading = true;
      Api.wave.getWaveList(this.page, this.pageSize).then(function(res) {
        self.items = res.data && res.data.items ? res.data.items : [];
        self.total = res.data && res.data.total ? res.data.total : 0;
      }).catch(function() {}).finally(function() { self.loading = false; });
    },
    openCreate: function() {
      this.editItem = null;
      this.form = {};
      this.showModal = true;
    },
    openEdit: function(item) {
      this.editItem = item;
      this.form = Object.assign({}, item);
      this.showModal = true;
    },
    saveItem: function() {
      var self = this;
      if (this.editItem) {
        Api.wave.updateWave(this.form).then(function() {
          Utils.showToast('更新成功', 'success');
          self.showModal = false;
          self.loadData();
        }).catch(function(err) { Utils.showToast(err.message || '操作失败', 'error'); });
      } else {
        Api.wave.createWave(this.form).then(function() {
          Utils.showToast('创建成功', 'success');
          self.showModal = false;
          self.loadData();
        }).catch(function(err) { Utils.showToast(err.message || '操作失败', 'error'); });
      }
    },
    deleteItem: function(id) {
      var self = this;
      if (!confirm('确定删除？')) return;
      Api.wave.deleteWave(id).then(function() {
        Utils.showToast('删除成功', 'success');
        self.loadData();
      }).catch(function(err) { Utils.showToast(err.message || '删除失败', 'error'); });
    }
  }
});

App.component('page-admin-items', {
  template: '#page-admin-items-template',
  data: function() {
    return { items: [], page: 1, pageSize: 10, total: 0, loading: false, showModal: false, editItem: null, form: {} };
  },
  mounted: function() { this.loadData(); },
  methods: {
    getItemTypeClass: function(type) {
      var map = { weapon: 'badge-orange', defense: 'badge-cyan', speed: 'badge-yellow', health: 'badge-green', special: 'badge-purple' };
      return map[type] || 'badge-cyan';
    },
    loadData: function() {
      var self = this;
      this.loading = true;
      Api.item.getItemList(this.page, this.pageSize).then(function(res) {
        self.items = res.data && res.data.items ? res.data.items : [];
        self.total = res.data && res.data.total ? res.data.total : 0;
      }).catch(function() {}).finally(function() { self.loading = false; });
    },
    openCreate: function() {
      this.editItem = null;
      this.form = {};
      this.showModal = true;
    },
    openEdit: function(item) {
      this.editItem = item;
      this.form = Object.assign({}, item);
      this.showModal = true;
    },
    saveItem: function() {
      var self = this;
      if (this.editItem) {
        Api.item.updateItem(this.form).then(function() {
          Utils.showToast('更新成功', 'success');
          self.showModal = false;
          self.loadData();
        }).catch(function(err) { Utils.showToast(err.message || '操作失败', 'error'); });
      } else {
        Api.item.createItem(this.form).then(function() {
          Utils.showToast('创建成功', 'success');
          self.showModal = false;
          self.loadData();
        }).catch(function(err) { Utils.showToast(err.message || '操作失败', 'error'); });
      }
    },
    deleteItem: function(id) {
      var self = this;
      if (!confirm('确定删除？')) return;
      Api.item.deleteItem(id).then(function() {
        Utils.showToast('删除成功', 'success');
        self.loadData();
      }).catch(function(err) { Utils.showToast(err.message || '删除失败', 'error'); });
    }
  }
});

App.component('page-admin-achievements', {
  template: '#page-admin-achievements-template',
  data: function() {
    return { items: [], page: 1, pageSize: 10, total: 0, loading: false, showModal: false, editItem: null, form: {} };
  },
  mounted: function() { this.loadData(); },
  methods: {
    loadData: function() {
      var self = this;
      this.loading = true;
      Api.achievement.getAchievementList(this.page, this.pageSize).then(function(res) {
        self.items = res.data && res.data.items ? res.data.items : [];
        self.total = res.data && res.data.total ? res.data.total : 0;
      }).catch(function() {}).finally(function() { self.loading = false; });
    },
    openCreate: function() {
      this.editItem = null;
      this.form = {};
      this.showModal = true;
    },
    openEdit: function(item) {
      this.editItem = item;
      this.form = Object.assign({}, item);
      this.showModal = true;
    },
    saveItem: function() {
      var self = this;
      if (this.editItem) {
        Api.achievement.updateAchievement(this.form).then(function() {
          Utils.showToast('更新成功', 'success');
          self.showModal = false;
          self.loadData();
        }).catch(function(err) { Utils.showToast(err.message || '操作失败', 'error'); });
      } else {
        Api.achievement.createAchievement(this.form).then(function() {
          Utils.showToast('创建成功', 'success');
          self.showModal = false;
          self.loadData();
        }).catch(function(err) { Utils.showToast(err.message || '操作失败', 'error'); });
      }
    },
    deleteItem: function(id) {
      var self = this;
      if (!confirm('确定删除？')) return;
      Api.achievement.deleteAchievement(id).then(function() {
        Utils.showToast('删除成功', 'success');
        self.loadData();
      }).catch(function(err) { Utils.showToast(err.message || '删除失败', 'error'); });
    }
  }
});
