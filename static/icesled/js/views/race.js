const RACE_STORAGE_KEY = 'icesled_race_state';

const RaceView = {
  props: ['trackId'],
  template: `
    <div>
      <div v-if="phase === 'setup'" class="race-layout">
        <aside class="race-sidebar">
          <div class="card setup-form">
            <div class="card-title">⚙️ 比赛设置</div>
            <div class="form-group">
              <label>玩家昵称</label>
              <input v-model="playerName" maxlength="12" placeholder="输入你的昵称" />
            </div>
            <div class="form-group">
              <label>选择赛道</label>
              <select v-model="selectedTrackId">
                <option value="">🎲 随机赛道</option>
                <option v-for="t in trackList" :key="t.id" :value="t.id">
                  {{ t.name }} · {{ getDiffLabel(t.difficulty) }} · {{ t.total_length }}m
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>赛道难度（随机时生效）</label>
              <select v-model="difficulty">
                <option value="easy">🌱 新手级</option>
                <option value="normal">🏔️ 标准级</option>
                <option value="hard">🗻 大师级</option>
              </select>
            </div>
            <button class="btn btn-primary btn-block btn-lg"
                    :disabled="racing"
                    @click="startRace">
              🚀 开始比赛
            </button>
          </div>

          <div class="card">
            <div class="card-title">🤖 参赛对手</div>
            <div class="opponents-list">
              <div class="opponent-item">
                <div class="opponent-avatar" style="background:#fce7f3;">👤</div>
                <div class="opponent-info">
                  <h4>{{ playerName || '玩家' }}</h4>
                  <p>（你）初始速度 60 km/h</p>
                </div>
              </div>
              <div class="opponent-item">
                <div class="opponent-avatar type-aggressive">🔥</div>
                <div class="opponent-info">
                  <h4>疾风·雷德</h4>
                  <p>激进型 · 高风险高回报，速度+4%</p>
                </div>
              </div>
              <div class="opponent-item">
                <div class="opponent-avatar type-steady">🛡️</div>
                <div class="opponent-info">
                  <h4>稳如·老狗</h4>
                  <p>稳健型 · 稳扎稳打，失误极少</p>
                </div>
              </div>
              <div class="opponent-item">
                <div class="opponent-avatar type-random">🎲</div>
                <div class="opponent-info">
                  <h4>天选·欧皇</h4>
                  <p>随机型 · 全凭运气，上限极高</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-title">💡 操作提示</div>
            <div style="font-size: 13px; color: var(--text-light); line-height: 1.8;">
              <p>🎯 游戏为 <strong>自动模拟</strong> 模式</p>
              <p>🧠 AI 和玩家决策均由后端引擎模拟</p>
              <p>⏱️ 比赛结束后可查看详细成绩与事件</p>
            </div>
          </div>
        </aside>

        <section>
          <div v-if="currentTrack" class="race-canvas-container">
            <div class="race-canvas-header">
              <h2 style="font-size:20px; font-weight:800;">
                🛤️ {{ currentTrack.name }}
              </h2>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <span class="race-info-badge">📏 {{ currentTrack.total_length }}m</span>
                <span class="race-info-badge">🌀 {{ (currentTrack.curve_ratio * 100).toFixed(1) }}%弯道</span>
                <span class="difficulty-badge" :class="getDiffClass(currentTrack.difficulty)">
                  {{ getDiffLabel(currentTrack.difficulty) }}
                </span>
              </div>
            </div>
            <TrackVisual :segments="currentTrack.segments"
                         :total-length="currentTrack.total_length" />
          </div>

          <div v-else class="card">
            <div class="empty-state" style="padding:80px 24px;">
              <div class="empty-state-icon">🎿</div>
              <p style="font-size:16px; font-weight:600;">选择赛道或直接开始比赛！</p>
              <p>系统将自动为你生成一条充满挑战的冰川赛道</p>
            </div>
          </div>
        </section>
      </div>

      <div v-if="phase === 'racing' || phase === 'finished'" class="race-layout">
        <aside class="race-sidebar">
          <div class="card">
            <div class="card-title">🏁 比赛实况</div>
            <div class="stats-grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom:0;">
              <div class="stat-card">
                <div class="stat-value" style="font-size:24px;">{{ currentTime.toFixed(1) }}s</div>
                <div class="stat-label">当前用时</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" style="font-size:24px;">
                  {{ finishedCount }}/{{ raceData ? raceData.results.length : 4 }}
                </div>
                <div class="stat-label">到达终点</div>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-title">📊 实时排名</div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <div v-for="(r, idx) in liveRank" :key="r.name"
                   style="padding:10px 12px; border-radius:8px;"
                   :style="{ background: idx === 0 ? 'var(--ice)' : 'var(--snow)'}">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                  <span style="font-weight:700; font-size:13px;">
                    {{ idx + 1 }}. {{ r.name }}
                  </span>
                  <span style="font-size:12px; color: var(--primary-dark); font-weight:600;">
                    {{ formatSpeed(r.speed) }}
                  </span>
                </div>
                <div style="font-size:11px; color: var(--text-lighter); margin-top:2px;">
                  进度 {{ getProgress(r.position) }}%
                </div>
              </div>
              <div v-if="liveRank.length === 0" style="text-align:center; padding:20px; color:var(--text-lighter);">
                即将开始...
              </div>
            </div>
          </div>
        </aside>

        <section>
          <div class="race-canvas-container">
            <div class="race-canvas-header">
              <h2 style="font-size:20px; font-weight:800;">
                🏂 {{ raceData ? raceData.track.name : '加载中...' }}
              </h2>
              <span v-if="raceData" class="race-info-badge">
                🎬 帧 {{ currentFrame }} / {{ raceData.frame_count }}
              </span>
            </div>

            <div class="race-stage">
              <div v-if="countdown > 0 && phase === 'racing'" class="countdown">
                <div class="countdown-text" :key="countdown">
                  {{ countdown }}
                </div>
              </div>

              <div v-if="raceData">
                <RaceProgress
                  :states="displayStates"
                  :total-length="raceData.track.total_length"
                  :segments="raceData.track.segments"
                  :finished="phase === 'finished'" />
              </div>

              <div v-else style="padding:60px; text-align:center; color:var(--text-lighter);">
                正在加载比赛数据...
              </div>
            </div>
          </div>
        </section>
      </div>

      <div v-if="phase === 'finished' && raceData">
        <div class="results-panel">
          <div class="winner-banner">
            <h2>🏆 {{ raceData.winner_name }} 获得冠军！</h2>
            <p>
              {{ raceData.winner_type === 'player' ? '🎉 恭喜玩家获胜！' : 'AI 对手力压群雄' }}
              · 总用时 {{ formatTime(raceData.total_time) }}
            </p>
          </div>

          <div class="card-title">📋 完整排名</div>
          <table class="results-table">
            <thead>
              <tr>
                <th style="width:60px;">名次</th>
                <th>选手</th>
                <th style="width:140px;">用时</th>
                <th style="width:120px;">最终速度</th>
                <th style="width:100px;">积分</th>
                <th>事故统计</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in raceData.results" :key="r.name"
                  :class="'rank-' + r.rank">
                <td>
                  <span class="rank-medal" :class="'rank-' + r.rank + '-medal'">
                    {{ r.rank }}
                  </span>
                </td>
                <td>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:18px;">{{ getTypeIcon(r.strategy_type) }}</span>
                    <div>
                      <div style="font-weight:700;">
                        {{ r.name }}
                        <span v-if="r.racer_type === 'player'"
                              style="font-size:10px; padding:2px 6px; border-radius:4px;
                                     background:var(--accent); color:white; margin-left:6px;">你</span>
                      </div>
                      <div style="font-size:11px; color: var(--text-light);">
                        {{ getTypeLabel(r.strategy_type) }}
                      </div>
                    </div>
                  </div>
                </td>
                <td style="font-family:monospace; font-weight:700; color:var(--primary-dark);">
                  {{ formatTime(r.total_time) }}
                </td>
                <td>{{ formatSpeed(r.final_speed || r.speed) }}</td>
                <td>
                  <span class="score-badge" :class="{ zero: r.score === 0 }">
                    +{{ r.score }}
                  </span>
                </td>
                <td>
                  <div class="event-counts">
                    <span class="event-tag wall" v-if="r.wall_hit_count">
                      🧱 撞墙 {{ r.wall_hit_count }}
                    </span>
                    <span class="event-tag crack" v-if="r.crack_fall_count">
                      ⏱️ 掉缝 {{ r.crack_fall_count }}
                    </span>
                    <span class="event-tag boost" v-if="r.boost_count">
                      ⚡ 加速 {{ r.boost_count }}
                    </span>
                    <span v-if="!r.wall_hit_count && !r.crack_fall_count && !r.boost_count"
                          style="font-size:12px; color: var(--text-lighter);">
                      无特殊事件
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-title">🛤️ 赛道信息</div>
          <TrackVisual :segments="raceData.track.segments"
                       :total-length="raceData.track.total_length" />
        </div>

        <div style="display:flex; gap:12px; justify-content:center; margin-top:24px; flex-wrap:wrap;">
          <button class="btn btn-primary btn-lg" @click="restartSame">
            🔄 再赛一场（同赛道）
          </button>
          <button class="btn btn-secondary btn-lg" @click="restartNew">
            🎲 换条赛道
          </button>
          <button class="btn btn-secondary btn-lg" @click="backToSetup">
            ⚙️ 重新设置
          </button>
          <button class="btn btn-secondary btn-lg" @click="$router.push('/history')">
            📜 查看历史
          </button>
        </div>
      </div>

      <div v-if="racing && !raceData && phase === 'setup'" class="loading card" style="margin-top:20px;">
        <div class="loading-spinner"></div>
        <p>正在模拟比赛，请稍候...</p>
        <p style="font-size:12px; color: var(--text-lighter); margin-top:8px;">
          后端正在为4位选手计算每一个决策
        </p>
      </div>
    </div>
  `,
  setup(props) {
    const { trackId } = props;
    const phase = ref('setup');
    const racing = ref(false);
    const playerName = ref(appState.playerName || '玩家');
    const selectedTrackId = ref(trackId || '');
    const difficulty = ref('normal');
    const trackList = ref([]);
    const currentTrack = ref(null);
    const raceData = ref(null);
    const currentFrame = ref(0);
    const countdown = ref(0);
    const currentTime = ref(0);
    const liveStates = ref([]);
    const finishedCount = ref(0);
    let animTimer = null;
    let cdTimer = null;

    const displayStates = computed(() => {
      if (liveStates.value && liveStates.value.length > 0) {
        return liveStates.value;
      }
      if (raceData.value && raceData.value.frames && raceData.value.frames.length > 0) {
        return raceData.value.frames[0] || [];
      }
      return [];
    });

    const liveRank = computed(() => {
      const states = displayStates.value;
      if (!states || states.length === 0) return [];
      return [...states].sort((a, b) => {
        if (a.finished !== b.finished) return a.finished ? -1 : 1;
        return b.position - a.position;
      });
    });

    const getProgress = (pos) => {
      if (!raceData.value) return 0;
      return Math.min(100, (pos / raceData.value.track.total_length * 100)).toFixed(1);
    };

    const loadTrackList = async () => {
      try {
        const res = await IceSledAPI.getTrackList();
        if (res.code === 0 && res.data) {
          trackList.value = res.data.items || [];
        }
      } catch {}
    };

    const loadPreviewTrack = async () => {
      if (selectedTrackId.value) {
        try {
          const r = await IceSledAPI.getTrack(selectedTrackId.value);
          if (r.code === 0) currentTrack.value = r.data;
        } catch {}
      } else {
        try {
          const r = await IceSledAPI.getTrack();
          if (r.code === 0 && r.data) {
            currentTrack.value = r.data;
          }
        } catch {}
      }
    };

    const saveRaceState = () => {
      try {
        const state = {
          phase: phase.value,
          raceData: raceData.value,
          currentFrame: currentFrame.value,
          currentTime: currentTime.value,
          liveStates: liveStates.value,
          finishedCount: finishedCount.value,
          playerName: playerName.value,
          selectedTrackId: selectedTrackId.value,
          difficulty: difficulty.value,
          timestamp: Date.now()
        };
        localStorage.setItem(RACE_STORAGE_KEY, JSON.stringify(state));
      } catch (e) {}
    };

    const loadRaceState = () => {
      try {
        const raw = localStorage.getItem(RACE_STORAGE_KEY);
        if (!raw) return false;
        const state = JSON.parse(raw);
        if (!state || !state.raceData) return false;
        const age = Date.now() - (state.timestamp || 0);
        if (age > 10 * 60 * 1000) {
          localStorage.removeItem(RACE_STORAGE_KEY);
          return false;
        }

        raceData.value = state.raceData;
        playerName.value = state.playerName || '玩家';
        selectedTrackId.value = state.selectedTrackId || '';
        difficulty.value = state.difficulty || 'normal';

        if (state.phase === 'finished') {
          phase.value = 'finished';
          currentFrame.value = state.raceData.frame_count - 1;
          currentTime.value = state.raceData.total_time;
          liveStates.value = state.raceData.frames[state.raceData.frames.length - 1] || [];
          finishedCount.value = state.raceData.results.length;
          return true;
        }

        if (state.phase === 'racing') {
          phase.value = 'finished';
          currentFrame.value = state.raceData.frame_count - 1;
          currentTime.value = state.raceData.total_time;
          liveStates.value = state.raceData.frames[state.raceData.frames.length - 1] || [];
          finishedCount.value = state.raceData.results.length;
          Utils.showToast('检测到未完成的比赛，已跳转到结果页', 'info', 3000);
          return true;
        }

        return false;
      } catch (e) {
        return false;
      }
    };

    const startRace = async () => {
      if (racing.value) return;
      appState.playerName = playerName.value;
      racing.value = true;
      phase.value = 'setup';

      try {
        const payload = {
          player_name: playerName.value,
          difficulty: difficulty.value,
          auto_simulate: true
        };
        if (selectedTrackId.value) {
          payload.track_id = Number(selectedTrackId.value);
        }
        const res = await IceSledAPI.startRace(payload);
        if (res.code === 0 && res.data) {
          raceData.value = res.data;
          liveStates.value = res.data.frames[0] || [];
          currentTime.value = 0;
          finishedCount.value = 0;
          saveRaceState();
          runCountdown();
        } else {
          Utils.showToast(res.message || '开始失败', 'error');
          racing.value = false;
        }
      } catch (e) {
        Utils.showToast('网络错误', 'error');
        racing.value = false;
      }
    };

    const runCountdown = () => {
      countdown.value = 3;
      phase.value = 'racing';
      cdTimer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
          clearInterval(cdTimer);
          cdTimer = null;
          startAnimation();
        }
      }, 800);
    };

    const startAnimation = () => {
      currentFrame.value = 0;
      const total = raceData.value.frames.length;
      if (total === 0) {
        finishRace();
        return;
      }

      const targetDuration = 8000;
      const interval = Math.max(10, Math.floor(targetDuration / total));

      animTimer = setInterval(() => {
        if (currentFrame.value >= total) {
          clearInterval(animTimer);
          animTimer = null;
          finishRace();
          return;
        }
        const frameData = raceData.value.frames[currentFrame.value];
        if (frameData) {
          liveStates.value = frameData;
          currentTime.value = Math.max(...frameData.map(s => s.total_time));
          finishedCount.value = frameData.filter(s => s.finished).length;
        }
        currentFrame.value++;
        saveRaceState();
      }, interval);
    };

    const finishRace = () => {
      if (raceData.value && raceData.value.frames) {
        const lastFrame = raceData.value.frames[raceData.value.frames.length - 1] || [];
        liveStates.value = lastFrame;
      }
      currentTime.value = raceData.value.total_time;
      finishedCount.value = raceData.value.results.length;
      currentFrame.value = raceData.value.frame_count;
      phase.value = 'finished';
      racing.value = false;
      saveRaceState();
    };

    const restartSame = () => {
      if (raceData.value && raceData.value.track && raceData.value.track.id) {
        selectedTrackId.value = raceData.value.track.id;
      }
      cleanupRace();
      setTimeout(startRace, 50);
    };

    const restartNew = () => {
      selectedTrackId.value = '';
      cleanupRace();
      setTimeout(startRace, 50);
    };

    const backToSetup = () => {
      cleanupRace();
      phase.value = 'setup';
      loadPreviewTrack();
    };

    const cleanupRace = () => {
      if (animTimer) {
        clearInterval(animTimer);
        animTimer = null;
      }
      if (cdTimer) {
        clearInterval(cdTimer);
        cdTimer = null;
      }
      raceData.value = null;
      currentFrame.value = 0;
      currentTime.value = 0;
      liveStates.value = [];
      finishedCount.value = 0;
      countdown.value = 0;
      localStorage.removeItem(RACE_STORAGE_KEY);
    };

    onMounted(() => {
      const restored = loadRaceState();
      if (!restored) {
        loadTrackList();
        loadPreviewTrack();
      }
    });

    onBeforeUnmount(() => {
      if (animTimer) clearInterval(animTimer);
      if (cdTimer) clearInterval(cdTimer);
    });

    watch(selectedTrackId, () => {
      if (phase.value === 'setup') {
        loadPreviewTrack();
      }
    });

    return {
      phase, racing, playerName, selectedTrackId, difficulty,
      trackList, currentTrack, raceData,
      currentFrame, countdown, currentTime, liveStates, displayStates, finishedCount,
      liveRank,
      startRace, restartSame, restartNew, backToSetup,
      formatTime: Utils.formatTime,
      formatSpeed: Utils.formatSpeed,
      getTypeLabel: Utils.getTypeLabel,
      getTypeIcon: Utils.getTypeIcon,
      getDiffLabel: Utils.getDifficultyLabel,
      getDiffClass: Utils.getDifficultyClass,
      getProgress,
    };
  }
};

const TrackVisual = {
  props: ['segments', 'totalLength'],
  template: `
    <div class="track-visual" style="height: 120px; position:relative;">
      <div style="position:absolute; inset:0; display:flex; align-items:stretch; border-radius:8px; overflow:hidden;">
        <div v-for="(seg, i) in segments" :key="i"
             style="display:flex; align-items:center; justify-content:center;
                    border-right:1px solid rgba(255,255,255,0.5);
                    color:white; font-weight:700; font-size:12px;
                    transition: all 0.2s;"
             :style="{ width: (seg.length / totalLength * 100) + '%',
                      background: getColor(seg.type),
                      opacity: 0.92 }"
             :title="getTitle(seg)">
          <span style="text-shadow:0 1px 2px rgba(0,0,0,0.3);">
            {{ getIcon(seg.type) }} {{ seg.length }}m
          </span>
        </div>
      </div>
      <div style="position:absolute; bottom:6px; left:0; right:0; display:flex; padding:0 8px;">
        <div v-for="(seg, i) in segments" :key="'label-' + i"
             style="text-align:center; font-size:10px; color:var(--text-light);
                    padding:0 2px; overflow:hidden; white-space:nowrap;
                    text-overflow:ellipsis; flex:1;">
          {{ getShort(seg) }}
        </div>
      </div>
    </div>
  `,
  setup() {
    return {
      getColor: Utils.getSegmentColor,
      getIcon(t) {
        return { straight: '➡️', curve: '🌀', crack: '🕳️', boost: '⚡' }[t] || '';
      },
      getShort(seg) {
        if (seg.type === 'curve') return `${seg.direction === 'left' ? '左弯' : '右弯'}`;
        if (seg.type === 'crack') return `${seg.crack_count}缝`;
        if (seg.type === 'boost') return `+${seg.boost_power}`;
        return '直';
      },
      getTitle(seg) {
        const map = {
          straight: '直道',
          curve: `弯道(${seg.direction}) - 难度${seg.difficulty}`,
          crack: `冰裂区 - ${seg.crack_count}处裂缝`,
          boost: `加速坡 - +${seg.boost_power}km/h`
        };
        return `${seg.length}米 ${map[seg.type] || ''}`;
      }
    };
  }
};

const RaceProgress = {
  props: ['states', 'totalLength', 'segments', 'finished'],
  template: `
    <div style="padding: 20px 8px;">
      <div style="display:flex; justify-content:space-between; padding:0 112px 8px 112px;
                  font-size:11px; color: var(--text-lighter); font-weight:600;">
        <span>🏁 起点</span>
        <span>🏁 终点 ({{ totalLength }}m)</span>
      </div>
      <div v-for="(racer, idx) in sortedRacers" :key="racer.name"
           class="racer-row"
           :class="{ player: racer.racer_type === 'player', 'animate-finish': racer.finished && justFinished }">
        <div class="racer-name-col">
          <span style="font-size:18px;">{{ getIcon(racer.strategy_type) }}</span>
          <span>{{ racer.name }}</span>
          <span v-if="racer.racer_type === 'player'"
                style="font-size:9px; padding:1px 4px; border-radius:4px;
                       background:var(--accent); color:white;">YOU</span>
        </div>
        <div class="progress-wrap">
          <div class="progress-bar"
               :class="{ 'player-bar': racer.racer_type === 'player' }"
               :style="{ width: getPct(racer.position) + '%' }">
            <span v-if="getPct(racer.position) > 8" class="racer-rank-badge">
              {{ getRank(racer) }}
            </span>
            <span class="racer-icon">🛷</span>
          </div>
        </div>
        <div class="racer-speed-col">
          {{ (racer.speed || 0).toFixed(0) }}<small style="font-size:10px; font-weight:500;">km/h</small>
        </div>
      </div>

      <div style="margin-top:20px; padding:0 112px; height: 40px; position:relative;">
        <div style="position:absolute; inset:0; display:flex; align-items:stretch;
                    border-radius:6px; overflow:hidden; opacity:0.6;">
          <div v-for="(seg, i) in segments" :key="i"
               :style="{ width: (seg.length / totalLength * 100) + '%',
                        background: getColor(seg.type) }"></div>
        </div>
      </div>

      <div style="margin-top:8px; padding:0 100px; display:flex; justify-content:space-between;
                  font-size:10px; color:var(--text-lighter);">
        <span>起点</span>
        <template v-for="(seg, i) in segmentMarkers" :key="'m-'+i">
          <span :style="{ marginLeft: seg.offset + '%', transform: 'translateX(-50%)', position:'absolute',
                         left: (seg.position / totalLength * 100) + '%' }">
            {{ seg.label }}
          </span>
        </template>
        <span>终点</span>
      </div>
    </div>
  `,
  setup(props) {
    const justFinished = ref(false);

    const sortedRacers = computed(() => {
      if (!props.states || props.states.length === 0) return [];
      return [...props.states].sort((a, b) => {
        if (a.racer_type === 'player') return -1;
        if (b.racer_type === 'player') return 1;
        return a.name.localeCompare(b.name);
      });
    });

    const segmentMarkers = computed(() => {
      if (!props.segments) return [];
      return props.segments
        .filter(s => s.type !== 'straight')
        .map(s => ({
          position: s.start_position + s.length / 2,
          label: s.type === 'curve' ? '🌀弯' : s.type === 'crack' ? '🕳️裂' : '⚡加'
        }));
    });

    watch(() => props.finished, (v) => {
      if (v) {
        justFinished.value = true;
        setTimeout(() => justFinished.value = false, 800);
      }
    });

    return {
      sortedRacers, segmentMarkers, justFinished,
      getIcon: Utils.getTypeIcon,
      getColor: Utils.getSegmentColor,
      getPct(p) { return Math.min(100, (p / props.totalLength * 100)); },
      getRank(r) {
        if (!props.states) return 0;
        const list = [...props.states].sort((a, b) => {
          if (a.finished !== b.finished) return a.finished ? -1 : 1;
          return b.position - a.position;
        });
        return list.findIndex(x => x.name === r.name) + 1;
      }
    };
  }
};

RaceView.components = { TrackVisual, RaceProgress };
