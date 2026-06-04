window.GameEngine = (function () {
  var Hamster = GameEntities.Hamster;
  var Snowball = GameEntities.Snowball;
  var PropEntity = GameEntities.PropEntity;
  var MapPickup = GameEntities.MapPickup;
  var HazardEntity = GameEntities.HazardEntity;
  var AIController = GameAI.AIController;
  var AI_NAMES = GameAI.AI_NAMES;

  var AI_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  var AI_SKINS = ['default', 'polar', 'ninja', 'santa'];
  var PROP_KEY_MAP = { '1': 'freeze', '2': 'speed', '3': 'split', '4': 'obstacle', '5': 'invisible' };
  var PROP_ENTITY_TYPE = { freeze: 'freeze_ray', speed: 'speed_boost', split: 'split_bomb', obstacle: 'obstacle_block', invisible: 'invisible_cloak' };
  var PROP_VALUE_TO_KEY = { freeze_ray: 'freeze', speed_boost: 'speed', split_bomb: 'split', obstacle_block: 'obstacle', invisible_cloak: 'invisible' };
  var DIR_VEC = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  var PROP_COOLDOWN = 8;
  var _propUid = 0;

  function dist(x1, y1, x2, y2) {
    var dx = x1 - x2, dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  class GameEngine {
    constructor(canvas, mapId, difficulty, playerSkin, playerSnowballEffect) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.mapId = mapId;
      this.difficulty = difficulty;
      this.playerSkin = playerSkin;
      this.playerSnowballEffect = playerSnowballEffect;
      this.map = null;
      this.width = 800;
      this.height = 600;
      this.hamsters = [];
      this.player = null;
      this.aiControllers = [];
      this.hazards = [];
      this.pickups = [];
      this.propEntities = [];
      this.gameObjects = [];
      this.gameState = 'countdown';
      this.timeRemaining = 90;
      this.countdownTimer = 3;
      this.pickupSpawnTimer = 0;
      this._nextPickupSpawn = 8 + Math.random() * 4;
      this.specialGuestTimer = 0;
      this.specialGuestActive = false;
      this.specialGuestEntity = null;
      this.gameTime = 0;
      this.keys = {};
      this.animationId = null;
      this.lastTime = 0;
      this.onGameEnd = null;
      this.onGameUpdate = null;
      this._metGuestId = null;
      this._resultsComputed = false;
      this._cachedResults = null;
      this._keyDownHandler = null;
      this._keyUpHandler = null;
    }

    init() {
      var map = GameMaps.getMap(this.mapId);
      if (!map) return;
      this.map = map;
      this.width = map.width;
      this.height = map.height;
      this.canvas.width = this.width;
      this.canvas.height = this.height;

      var skinColor = GameStore.SKINS[this.playerSkin] ? GameStore.SKINS[this.playerSkin].color : '#F4A460';
      if (skinColor === 'rainbow') skinColor = '#F4A460';
      var p = new Hamster('player', map.spawnPoints[0].x, map.spawnPoints[0].y, skinColor, true, GameStore.get('playerName'), this.playerSkin);
      p.snowball.effect = GameStore.SNOWBALL_EFFECTS[this.playerSnowballEffect] ? GameStore.SNOWBALL_EFFECTS[this.playerSnowballEffect].effect : 'none';
      this.player = p;
      this.hamsters.push(p);

      var names = shuffle(AI_NAMES[this.difficulty] || AI_NAMES.normal);
      var colors = shuffle(AI_COLORS);
      var skins = shuffle(AI_SKINS);
      for (var i = 0; i < 3; i++) {
        var sp = map.spawnPoints[i + 1];
        var ai = new Hamster('ai_' + i, sp.x, sp.y, colors[i], false, names[i], skins[i]);
        ai.props = Object.keys(PROP_ENTITY_TYPE).map(function (t) { return { type: t }; });
        this.hamsters.push(ai);
        this.aiControllers.push(new AIController(ai, this.difficulty));
      }

      if (map.hazards) {
        for (var i = 0; i < map.hazards.length; i++) {
          this.hazards.push(new HazardEntity(map.hazards[i]));
        }
      }

      this.gameObjects = [];
      if (map.obstacles) {
        for (var i = 0; i < map.obstacles.length; i++) {
          var o = map.obstacles[i];
          this.gameObjects.push({ x: o.x, y: o.y, w: o.width, h: o.height, type: o.type });
        }
      }

      this._spawnInitialPickups();

      var self = this;
      this._keyDownHandler = function (e) {
        self.keys[e.key] = true;
        if (PROP_KEY_MAP[e.key]) self._handlePropKey(e.key);
      };
      this._keyUpHandler = function (e) { self.keys[e.key] = false; };
      document.addEventListener('keydown', this._keyDownHandler);
      document.addEventListener('keyup', this._keyUpHandler);

      this.start();
    }

    _spawnInitialPickups() {
      var pos = this._randomPositions(5, 30);
      this.pickups.push(new MapPickup(pos[0].x, pos[0].y, 'coin'));
      this.pickups.push(new MapPickup(pos[1].x, pos[1].y, 'coin'));
      this.pickups.push(new MapPickup(pos[2].x, pos[2].y, 'coin'));
      this.pickups.push(new MapPickup(pos[3].x, pos[3].y, 'prop_box'));
      this.pickups.push(new MapPickup(pos[4].x, pos[4].y, 'snow_boost'));
    }

    _randomPositions(count, minDist) {
      var result = [], attempts = 0;
      while (result.length < count && attempts < 300) {
        var x = 40 + Math.random() * (this.width - 80);
        var y = 40 + Math.random() * (this.height - 80);
        var ok = true;
        for (var i = 0; i < result.length; i++) {
          if (dist(x, y, result[i].x, result[i].y) < minDist) { ok = false; break; }
        }
        if (ok) result.push({ x: x, y: y });
        attempts++;
      }
      while (result.length < count) {
        result.push({ x: 40 + Math.random() * (this.width - 80), y: 40 + Math.random() * (this.height - 80) });
      }
      return result;
    }

    start() {
      this.lastTime = performance.now();
      var self = this;
      (function loop(ts) {
        self.gameLoop(ts);
        self.animationId = requestAnimationFrame(loop);
      })(this.lastTime);
    }

    stop() {
      if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
      if (this._keyDownHandler) document.removeEventListener('keydown', this._keyDownHandler);
      if (this._keyUpHandler) document.removeEventListener('keyup', this._keyUpHandler);
    }

    gameLoop(timestamp) {
      var dt = (timestamp - this.lastTime) / 1000;
      this.lastTime = timestamp;
      if (dt > 0.05) dt = 0.05;
      switch (this.gameState) {
        case 'countdown': this.updateCountdown(dt); break;
        case 'playing': this.updatePlaying(dt); break;
        case 'gameover': this.updateGameOver(dt); break;
        case 'paused': break;
      }
      this.render();
    }

    updateCountdown(dt) {
      this.countdownTimer -= dt;
      if (this.countdownTimer <= 0) { this.countdownTimer = 0; this.gameState = 'playing'; }
    }

    updatePlaying(dt) {
      this.timeRemaining -= dt;
      this.gameTime += dt;
      if (this.timeRemaining <= 0) { this.timeRemaining = 0; this.gameState = 'gameover'; return; }

      var dx = 0, dy = 0;
      if (this.keys['w'] || this.keys['W'] || this.keys['ArrowUp']) dy = -1;
      if (this.keys['s'] || this.keys['S'] || this.keys['ArrowDown']) dy = 1;
      if (this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft']) dx = -1;
      if (this.keys['d'] || this.keys['D'] || this.keys['ArrowRight']) dx = 1;
      this.player.move(dx, dy, this.width, this.height, this.gameObjects);

      var gs = {
        mapWidth: this.width, mapHeight: this.height,
        hamsters: this.hamsters,
        snowPatches: this.map.snowPatches || [],
        pickups: this.pickups.filter(function (p) { return p.active; }),
        hazards: this.hazards
      };
      for (var i = 0; i < this.aiControllers.length; i++) {
        var cmd = this.aiControllers[i].update(dt, gs);
        var h = this.aiControllers[i].hamster;
        h.move(cmd.dx, cmd.dy, this.width, this.height, this.gameObjects);
        if (cmd.useProp && h.propCooldowns[cmd.useProp] <= 0) {
          this._useProp(h, cmd.useProp, false);
        }
      }

      for (var i = 0; i < this.hamsters.length; i++) this.hamsters[i].update(dt);
      for (var i = 0; i < this.hamsters.length; i++) {
        var h = this.hamsters[i];
        h.snowball.update(h.x, h.y, h.direction);
      }

      if (this.map.snowPatches) {
        for (var i = 0; i < this.hamsters.length; i++) {
          var sb = this.hamsters[i].snowball;
          for (var j = 0; j < this.map.snowPatches.length; j++) {
            var sp = this.map.snowPatches[j];
            if (dist(sb.x, sb.y, sp.x, sp.y) < sp.radius + sb.size) {
              sb.grow(sb.growthRate * dt * 60 * 0.5);
            }
          }
        }
      }

      for (var i = 0; i < this.hamsters.length; i++) {
        for (var j = i + 1; j < this.hamsters.length; j++) {
          var sb1 = this.hamsters[i].snowball, sb2 = this.hamsters[j].snowball;
          if (dist(sb1.x, sb1.y, sb2.x, sb2.y) < sb1.size + sb2.size) {
            if (sb1.size > sb2.size) {
              var a = sb2.size * 0.2; sb1.grow(a); sb2.shrink(a);
            } else if (sb2.size > sb1.size) {
              var a = sb1.size * 0.2; sb2.grow(a); sb1.shrink(a);
            } else {
              var h1 = this.hamsters[i], h2 = this.hamsters[j];
              var bx = h1.x - h2.x, by = h1.y - h2.y;
              var bl = Math.sqrt(bx * bx + by * by) || 1;
              h1.vx += (bx / bl) * 2; h1.vy += (by / bl) * 2;
              h2.vx -= (bx / bl) * 2; h2.vy -= (by / bl) * 2;
            }
          }
        }
      }

      for (var i = 0; i < this.hamsters.length; i++) {
        var h = this.hamsters[i];
        for (var j = this.pickups.length - 1; j >= 0; j--) {
          var pk = this.pickups[j];
          if (!pk.active) continue;
          if (dist(h.x, h.y, pk.x, pk.y) < h.radius + pk.radius) {
            pk.active = false;
            if (pk.type === 'coin') { h.score += pk.value; }
            else if (pk.type === 'snow_boost') { h.snowball.grow(pk.value); }
            else if (pk.type === 'prop_box') {
              var key = PROP_VALUE_TO_KEY[pk.value];
              if (h.isPlayer) { GameStore.addProp(key, 1); }
              else { if (!h.props) h.props = []; h.props.push({ type: key }); }
            }
          }
        }
      }

      for (var i = 0; i < this.hazards.length; i++) {
        this.hazards[i].update(dt, this.width, this.height);
        for (var j = 0; j < this.hamsters.length; j++) {
          var h = this.hamsters[j];
          if (dist(h.x, h.y, this.hazards[i].x, this.hazards[i].y) < h.radius + this.hazards[i].radius) {
            h.freeze(3000);
            h.snowball.shrink(h.snowball.size * 0.1);
          }
        }
      }

      for (var i = this.propEntities.length - 1; i >= 0; i--) {
        var pe = this.propEntities[i];
        pe.update(dt);
        if (!pe.active) {
          if (pe.type === 'obstacle_block') {
            for (var k = this.gameObjects.length - 1; k >= 0; k--) {
              if (this.gameObjects[k]._propUid === pe._uid) { this.gameObjects.splice(k, 1); break; }
            }
          }
          this.propEntities.splice(i, 1);
          continue;
        }
        for (var j = 0; j < this.hamsters.length; j++) {
          var h = this.hamsters[j];
          if (h.id === pe.ownerId) continue;
          if (dist(h.x, h.y, pe.x, pe.y) < h.radius + pe.radius) {
            if (pe.type === 'freeze_ray') { h.freeze(3000); pe.active = false; }
            else if (pe.type === 'split_bomb') { h.snowball.shrink(h.snowball.size * 0.5); pe.active = false; }
          }
        }
      }

      this.pickupSpawnTimer += dt;
      if (this.pickupSpawnTimer >= this._nextPickupSpawn) {
        this.pickupSpawnTimer = 0;
        this._nextPickupSpawn = 8 + Math.random() * 4;
        var types = ['coin', 'coin', 'coin', 'prop_box', 'snow_boost'];
        var p = this._randomPositions(1, 20)[0];
        this.pickups.push(new MapPickup(p.x, p.y, types[Math.floor(Math.random() * types.length)]));
      }
      for (var i = this.pickups.length - 1; i >= 0; i--) {
        this.pickups[i].update(dt);
        if (!this.pickups[i].active) this.pickups.splice(i, 1);
      }

      this.specialGuestTimer += dt;
      if (!this.specialGuestActive && this.specialGuestTimer >= 30 && this.map.specialGuest) {
        this.specialGuestTimer = 0;
        if (Math.random() < this.map.specialGuest.spawnChance) this._spawnSpecialGuest();
      }
      if (this.specialGuestActive && this.specialGuestEntity) {
        var sg = this.specialGuestEntity;
        sg.timer += dt;
        sg.x += sg.vx * dt * 60; sg.y += sg.vy * dt * 60;
        if (sg.x < 20 || sg.x > this.width - 20) sg.vx *= -1;
        if (sg.y < 20 || sg.y > this.height - 20) sg.vy *= -1;
        if (dist(this.player.snowball.x, this.player.snowball.y, sg.x, sg.y) < this.player.snowball.size + sg.radius) {
          sg.collected = true; this.specialGuestActive = false;
          GameStore.addCoins(500);
          GameStore.metSpecialGuest(sg.id);
          GameStore.unlockSkin('special_' + sg.id);
          this._metGuestId = sg.id;
        }
        if (sg.timer >= 15) this.specialGuestActive = false;
      }

      if (this.map.icePatches) {
        for (var i = 0; i < this.hamsters.length; i++) {
          var h = this.hamsters[i];
          for (var j = 0; j < this.map.icePatches.length; j++) {
            var ice = this.map.icePatches[j];
            if (h.x > ice.x && h.x < ice.x + ice.width && h.y > ice.y && h.y < ice.y + ice.height) {
              h.vx *= 1.05; h.vy *= 1.05;
            }
          }
        }
      }

      if (this.onGameUpdate) {
        var self = this;
        var hamstersInfo = this.hamsters.map(function (h) {
          return { id: h.id, name: h.name, snowballSize: h.snowball.size, isPlayer: h.isPlayer };
        });
        var sorted = hamstersInfo.slice().sort(function (a, b) { return b.snowballSize - a.snowballSize; });
        var playerRank = 1;
        for (var pi = 0; pi < sorted.length; pi++) { if (sorted[pi].isPlayer) { playerRank = pi + 1; break; } }
        var playerInfo = this.hamsters.find(function (h) { return h.isPlayer; });
        this.onGameUpdate({
          timeRemaining: this.timeRemaining,
          hamsters: hamstersInfo,
          gameState: this.gameState,
          specialGuestActive: this.specialGuestActive,
          playerRank: playerRank,
          playerSnowballSize: playerInfo ? playerInfo.snowball.size : 10,
          playerCooldowns: playerInfo ? playerInfo.propCooldowns : {}
        });
      }
    }

    updateGameOver() {
      if (!this._resultsComputed) {
        this._resultsComputed = true;
        this._cachedResults = this._getResults();
        GameStore.addCoins(this._cachedResults.coinsEarned);
        GameStore.addExp(this._cachedResults.expEarned);
        GameStore.updateStats({ won: this._cachedResults.playerRank === 1, snowballSize: this._cachedResults.playerSnowballSize, coinsEarned: this._cachedResults.coinsEarned });
        if (this._metGuestId) { GameStore.metSpecialGuest(this._metGuestId); GameStore.unlockSkin('special_' + this._metGuestId); }
        if (this.onGameEnd) this.onGameEnd(this._cachedResults);
      }
    }

    _handlePropKey(key) {
      if (this.gameState !== 'playing') return;
      var propId = PROP_KEY_MAP[key];
      if (!propId) return;
      if (this.player.propCooldowns[propId] > 0) return;
      if (!GameStore.useProp(propId)) return;
      this._useProp(this.player, propId, true);
    }

    _useProp(hamster, propId, isPlayer) {
      hamster.propCooldowns[propId] = PROP_COOLDOWN;
      var dv = DIR_VEC[hamster.direction] || { x: 0, y: 1 };
      switch (propId) {
        case 'freeze': {
          var pe = new PropEntity('freeze_ray', hamster.x, hamster.y, hamster.id);
          pe.vx = dv.x * 8; pe.vy = dv.y * 8;
          this.propEntities.push(pe);
          break;
        }
        case 'speed': hamster.activateSpeed(5000); break;
        case 'split': {
          var pe = new PropEntity('split_bomb', hamster.x, hamster.y, hamster.id);
          pe.vx = dv.x * 8; pe.vy = dv.y * 8;
          this.propEntities.push(pe);
          break;
        }
        case 'obstacle': {
          var ox = hamster.x + dv.x * 40, oy = hamster.y + dv.y * 40;
          var pe = new PropEntity('obstacle_block', ox, oy, hamster.id);
          pe._uid = ++_propUid;
          this.propEntities.push(pe);
          this.gameObjects.push({ x: ox - pe.radius, y: oy - pe.radius, w: pe.radius * 2, h: pe.radius * 2, type: 'obstacle', _propUid: pe._uid });
          break;
        }
        case 'invisible': hamster.activateInvisible(4000); break;
      }
    }

    _spawnSpecialGuest() {
      var g = this.map.specialGuest;
      this.specialGuestActive = true;
      this.specialGuestEntity = {
        id: g.id, name: g.name, x: 100 + Math.random() * (this.width - 200), y: 100 + Math.random() * (this.height - 200),
        vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, radius: 20, timer: 0, collected: false
      };
    }

    _getResults() {
      var sorted = this.hamsters.slice().sort(function (a, b) { return b.snowball.size - a.snowball.size; });
      var stats = sorted.map(function (h, i) { return { name: h.name, snowballSize: Math.round(h.snowball.size), rank: i + 1 }; });
      var playerRank = sorted.indexOf(this.player) + 1;
      var pSize = this.player.snowball.size;
      var coinMult = [0, 2, 1, 0.5, 0.25];
      var coinBase = [0, 200, 100, 50, 25];
      var expBase = [0, 50, 30, 20, 10];
      var coinsEarned = Math.round(coinBase[playerRank] + pSize * coinMult[playerRank]);
      var expEarned = expBase[playerRank];
      return {
        winner: sorted[0], playerRank: playerRank, playerSnowballSize: Math.round(pSize),
        coinsEarned: coinsEarned, expEarned: expEarned, metSpecialGuest: this._metGuestId,
        hamsterStats: stats
      };
    }

    render() {
      var ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);
      ctx.fillStyle = this.map.bgColor;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = this.map.groundColor;
      ctx.fillRect(0, 0, this.width, this.height);

      var patches = this.map.snowPatches || [];
      for (var i = 0; i < patches.length; i++) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(patches[i].x, patches[i].y, patches[i].radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fill();
        ctx.restore();
      }

      var ices = this.map.icePatches || [];
      for (var i = 0; i < ices.length; i++) {
        ctx.save();
        ctx.fillStyle = 'rgba(173,216,230,0.4)';
        ctx.fillRect(ices[i].x, ices[i].y, ices[i].width, ices[i].height);
        ctx.strokeStyle = 'rgba(100,149,237,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(ices[i].x, ices[i].y, ices[i].width, ices[i].height);
        ctx.restore();
      }

      var decs = this.map.decorations || [];
      for (var i = 0; i < decs.length; i++) { this._drawDecoration(ctx, decs[i]); }

      var obs = this.map.obstacles || [];
      for (var i = 0; i < obs.length; i++) { this._drawObstacle(ctx, obs[i]); }

      for (var i = 0; i < this.hazards.length; i++) this.hazards[i].draw(ctx);
      for (var i = 0; i < this.pickups.length; i++) this.pickups[i].draw(ctx, this.gameTime);
      for (var i = 0; i < this.propEntities.length; i++) this.propEntities[i].draw(ctx);

      for (var i = 0; i < this.hamsters.length; i++) {
        var h = this.hamsters[i];
        h.snowball.draw(ctx, h.snowball.effect);
        h.draw(ctx);
      }

      if (this.specialGuestActive && this.specialGuestEntity) this._drawSpecialGuest(ctx);

      this._drawHUD(ctx);
      if (this.gameState === 'countdown') this._drawCountdown(ctx);
      if (this.gameState === 'gameover') this._drawGameOver(ctx);
    }

    _drawDecoration(ctx, d) {
      ctx.save();
      switch (d.type) {
        case 'pine':
          ctx.fillStyle = '#8B4513'; ctx.fillRect(d.x - 3, d.y, 6, 15);
          ctx.beginPath(); ctx.moveTo(d.x, d.y - 18); ctx.lineTo(d.x - 12, d.y + 2); ctx.lineTo(d.x + 12, d.y + 2); ctx.closePath();
          ctx.fillStyle = '#2d6a4f'; ctx.fill();
          break;
        case 'snowman':
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(d.x, d.y, 10, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(d.x, d.y - 14, 7, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(d.x, d.y - 24, 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#000';
          ctx.beginPath(); ctx.arc(d.x - 2, d.y - 25, 1, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(d.x + 2, d.y - 25, 1, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#f90';
          ctx.beginPath(); ctx.moveTo(d.x, d.y - 23); ctx.lineTo(d.x + 4, d.y - 22); ctx.lineTo(d.x, d.y - 21); ctx.closePath(); ctx.fill();
          break;
        case 'flag':
          ctx.fillStyle = '#888'; ctx.fillRect(d.x - 1, d.y - 20, 2, 25);
          ctx.fillStyle = '#e74c3c'; ctx.fillRect(d.x + 1, d.y - 20, 14, 10);
          break;
        case 'crystal':
          ctx.beginPath(); ctx.moveTo(d.x, d.y - 12); ctx.lineTo(d.x + 8, d.y); ctx.lineTo(d.x, d.y + 12); ctx.lineTo(d.x - 8, d.y); ctx.closePath();
          ctx.fillStyle = 'rgba(52,152,219,0.7)'; ctx.fill();
          ctx.strokeStyle = 'rgba(41,128,185,0.9)'; ctx.lineWidth = 1; ctx.stroke();
          break;
        case 'igloo':
          ctx.beginPath(); ctx.arc(d.x, d.y, 14, Math.PI, 0); ctx.closePath();
          ctx.fillStyle = 'rgba(200,220,240,0.8)'; ctx.fill();
          ctx.strokeStyle = 'rgba(150,180,210,0.8)'; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillStyle = 'rgba(100,140,180,0.6)'; ctx.fillRect(d.x - 4, d.y - 6, 8, 6);
          break;
        case 'candy':
          for (var ci = 0; ci < 3; ci++) {
            ctx.fillStyle = ci % 2 === 0 ? '#e74c3c' : '#fff';
            ctx.fillRect(d.x - 5 + ci * 4, d.y - 8, 4, 16);
          }
          ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 1; ctx.strokeRect(d.x - 5, d.y - 8, 12, 16);
          break;
      }
      ctx.restore();
    }

    _drawObstacle(ctx, o) {
      ctx.save();
      switch (o.type) {
        case 'rock':
          ctx.fillStyle = '#78909c';
          ctx.beginPath();
          var rx = o.x + o.width / 2, ry = o.y + o.height / 2, rr = Math.min(o.width, o.height) / 2;
          ctx.ellipse(rx, ry, o.width / 2, o.height / 2, 0, 0, Math.PI * 2);
          ctx.fill(); ctx.strokeStyle = '#546e7a'; ctx.lineWidth = 1; ctx.stroke();
          break;
        case 'tree':
          ctx.fillStyle = '#8B4513'; ctx.fillRect(o.x + o.width / 2 - 3, o.y + o.height * 0.4, 6, o.height * 0.6);
          ctx.beginPath(); ctx.moveTo(o.x + o.width / 2, o.y); ctx.lineTo(o.x, o.y + o.height * 0.5); ctx.lineTo(o.x + o.width, o.y + o.height * 0.5); ctx.closePath();
          ctx.fillStyle = '#2d6a4f'; ctx.fill();
          break;
        case 'ice':
          ctx.fillStyle = 'rgba(173,216,230,0.7)'; ctx.fillRect(o.x, o.y, o.width, o.height);
          ctx.strokeStyle = 'rgba(100,149,237,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(o.x, o.y, o.width, o.height);
          break;
      }
      ctx.restore();
    }

    _drawSpecialGuest(ctx) {
      var sg = this.specialGuestEntity;
      ctx.save();
      ctx.beginPath(); ctx.arc(sg.x, sg.y, sg.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD700'; ctx.fill();
      ctx.strokeStyle = '#FFA000'; ctx.lineWidth = 2; ctx.stroke();
      var sparkCount = 8;
      for (var i = 0; i < sparkCount; i++) {
        var a = (Math.PI * 2 / sparkCount) * i + Date.now() * 0.003;
        var sr = sg.radius + 6 + Math.sin(Date.now() * 0.005 + i) * 4;
        var sx = sg.x + Math.cos(a) * sr, sy = sg.y + Math.sin(a) * sr;
        ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF'; ctx.fill();
      }
      ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.strokeText(sg.name, sg.x, sg.y - sg.radius - 6);
      ctx.fillText(sg.name, sg.x, sg.y - sg.radius - 6);
      ctx.restore();
    }

    _drawHUD(ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, this.width, 28);
      ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      var m = Math.floor(this.timeRemaining / 60), s = Math.floor(this.timeRemaining % 60);
      ctx.fillText((m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s, this.width / 2, 18);

      ctx.textAlign = 'left'; ctx.font = '11px sans-serif';
      var xOff = 10;
      for (var i = 0; i < this.hamsters.length; i++) {
        var h = this.hamsters[i];
        var label = h.name + ': ' + Math.round(h.snowball.size);
        ctx.fillStyle = h.isPlayer ? '#FFD700' : '#ccc';
        ctx.fillText(label, xOff, 18);
        xOff += ctx.measureText(label).width + 15;
      }

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, this.height - 30, this.width, 30);
      var props = GameStore.get('props') || {};
      var propKeys = ['freeze', 'speed', 'split', 'obstacle', 'invisible'];
      var propIcons = ['\u2744', '\u26A1', '\uD83D\uDCA5', '\uD83E\uDEA8', '\uD83D\uDC7B'];
      var propColors = ['#4fc3f7', '#ffeb3b', '#f44336', '#78909c', '#9c27b0'];
      for (var i = 0; i < propKeys.length; i++) {
        var px = 10 + i * 60, py = this.height - 26;
        var count = props[propKeys[i]] || 0;
        var cd = this.player.propCooldowns[propKeys[i]];
        ctx.fillStyle = count > 0 && cd <= 0 ? propColors[i] : 'rgba(100,100,100,0.5)';
        ctx.fillRect(px, py, 52, 22);
        ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
        ctx.fillText(i + 1 + ':' + propIcons[i] + count, px + 26, py + 15);
        if (cd > 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(px, py, 52 * (cd / PROP_COOLDOWN), 22);
        }
      }
      ctx.restore();
    }

    _drawCountdown(ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.font = 'bold 80px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
      var num = Math.ceil(this.countdownTimer);
      if (num <= 0) num = 1;
      ctx.strokeText(num, this.width / 2, this.height / 2);
      ctx.fillText(num, this.width / 2, this.height / 2);
      ctx.restore();
    }

    _drawGameOver(ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFD700';
      ctx.fillText('游戏结束!', this.width / 2, 80);

      var sorted = this.hamsters.slice().sort(function (a, b) { return b.snowball.size - a.snowball.size; });
      ctx.font = '18px sans-serif';
      var rankColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#888'];
      for (var i = 0; i < sorted.length; i++) {
        var h = sorted[i];
        var y = 130 + i * 35;
        ctx.fillStyle = rankColors[i] || '#888';
        ctx.fillText((i + 1) + '. ' + h.name + ' - 雪球: ' + Math.round(h.snowball.size), this.width / 2, y);
        if (h.isPlayer) {
          ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
          ctx.strokeRect(this.width / 2 - 140, y - 18, 280, 26);
        }
      }

      var res = this._cachedResults || this._getResults();
      ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#fff';
      ctx.fillText('排名: 第' + res.playerRank + '名', this.width / 2, 290);
      ctx.fillText('获得金币: ' + res.coinsEarned, this.width / 2, 320);
      ctx.fillText('获得经验: ' + res.expEarned, this.width / 2, 350);
      if (this._metGuestId) {
        ctx.fillStyle = '#FFD700';
        ctx.fillText('遇见特殊嘉宾!', this.width / 2, 390);
      }
      ctx.font = '14px sans-serif'; ctx.fillStyle = '#aaa';
      ctx.fillText('按任意键返回', this.width / 2, this.height - 40);
      ctx.restore();
    }
  }

  return { GameEngine: GameEngine };
})();
