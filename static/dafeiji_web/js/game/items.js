class DafeijiItem {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 24;
    this.type = type;
    this.speed = 1.2;
    this.alive = true;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.bobAmplitude = 3;
    this.baseY = y;
    this.glowPhase = Math.random() * Math.PI * 2;
    this.collectionFlash = 0;

    let typeConfig = DafeijiItem.TYPES[type] || DafeijiItem.TYPES.weapon;
    this.color = typeConfig.color;
    this.symbol = typeConfig.symbol;
    this.effect = typeConfig.effect;
  }
}

DafeijiItem.TYPES = {
  weapon: { color: '#FF6B35', symbol: 'W', effect: 'weaponUpgrade' },
  shield: { color: '#00E5FF', symbol: 'S', effect: 'shield' },
  health: { color: '#00E676', symbol: '+', effect: 'health' },
  speed: { color: '#FFD600', symbol: '>>', effect: 'speed' },
  bomb: { color: '#FF1744', symbol: 'X', effect: 'bomb' },
  magnet: { color: '#AA00FF', symbol: 'M', effect: 'magnet' }
};

DafeijiItem.prototype.update = function(dt) {
  this.y += this.speed * dt;
  this.bobPhase += 0.06 * dt;
  this.glowPhase += 0.08 * dt;
  this.baseY = this.y;
  if (this.collectionFlash > 0) this.collectionFlash--;
};

DafeijiItem.prototype.draw = function(ctx) {
  let cx = this.x + this.width / 2;
  let cy = this.y + this.height / 2 + Math.sin(this.bobPhase) * this.bobAmplitude;
  let r = Math.max(1, this.width / 2);
  let glowIntensity = Math.sin(this.glowPhase) * 0.3 + 0.7;

  ctx.save();

  ctx.shadowColor = this.color;
  ctx.shadowBlur = 10 * glowIntensity;

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    let angle = (Math.PI / 3) * i - Math.PI / 6;
    let px = cx + r * Math.cos(angle);
    let py = cy + r * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();

  let hexGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  hexGrad.addColorStop(0, this.color);
  hexGrad.addColorStop(0.7, this.color);
  hexGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = hexGrad;
  ctx.globalAlpha = glowIntensity;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = this.color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(this.symbol, cx, cy);

  let outerGlow = ctx.createRadialGradient(cx, cy, r, cx, cy, r + 6);
  outerGlow.addColorStop(0, this.color.replace(')', ',0.3)').replace('rgb', 'rgba').replace('#', ''));
  outerGlow.addColorStop(0, 'rgba(' + this._hexToRgb(this.color) + ',0.3)');
  outerGlow.addColorStop(1, 'rgba(' + this._hexToRgb(this.color) + ',0)');
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

DafeijiItem.prototype._hexToRgb = function(hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) : '255,255,255';
};

DafeijiItem.prototype.isOffScreen = function(canvasHeight) {
  return this.y > canvasHeight + 30;
};

DafeijiItem.prototype.getHitBox = function() {
  return { x: this.x - 4, y: this.y - 4, width: this.width + 8, height: this.height + 8 };
};

class DafeijiItemManager {
  constructor(canvasWidth, canvasHeight) {
    this.items = [];
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.itemsCollected = 0;
    this.magnetActive = false;
    this.magnetTimer = 0;
    this.magnetDuration = 300;
    this.magnetRange = 150;
  }

  spawnItem(x, y, forcedType) {
    let type;
    if (forcedType && DafeijiItem.TYPES[forcedType]) {
      type = forcedType;
    } else {
      let roll = Math.random();
      if (roll < 0.35) type = 'weapon';
      else if (roll < 0.55) type = 'shield';
      else if (roll < 0.75) type = 'health';
      else if (roll < 0.88) type = 'speed';
      else if (roll < 0.95) type = 'bomb';
      else type = 'magnet';
    }
    let item = new DafeijiItem(x, y, type);
    this.items.push(item);
  }

  tryDropItem(x, y, dropRate) {
    if (Math.random() < dropRate) {
      this.spawnItem(x, y);
    }
  }

  update(dt, playerX, playerY) {
    this.items.forEach(function(item) {
      item.update(dt);

      if (this.magnetActive) {
        let dx = playerX - (item.x + item.width / 2);
        let dy = playerY - (item.y + item.height / 2);
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.magnetRange && dist > 1) {
          item.x += (dx / dist) * 3 * dt;
          item.y += (dy / dist) * 3 * dt;
        }
      }
    }.bind(this));

    if (this.magnetActive) {
      this.magnetTimer--;
      if (this.magnetTimer <= 0) {
        this.magnetActive = false;
      }
    }

    this.items = this.items.filter(function(item) {
      return item.alive && !item.isOffScreen(this.canvasHeight);
    }.bind(this));
  }

  checkCollection(player) {
    let pBox = player.getHitBox();
    let collected = [];
    this.items = this.items.filter(function(item) {
      let iBox = item.getHitBox();
      if (pBox.x < iBox.x + iBox.width &&
          pBox.x + pBox.width > iBox.x &&
          pBox.y < iBox.y + iBox.height &&
          pBox.y + pBox.height > iBox.y) {
        collected.push(item);
        this.itemsCollected++;
        return false;
      }
      return true;
    }.bind(this));
    return collected;
  }

  applyItem(item, player) {
    switch (item.effect) {
      case 'weaponUpgrade':
        player.upgradeWeapon();
        break;
      case 'shield':
        player.activateShield(300);
        break;
      case 'health':
        player.heal(30);
        break;
      case 'speed':
        player.activateSpeedBoost(300);
        break;
      case 'bomb':
        return 'bomb';
      case 'magnet':
        this.magnetActive = true;
        this.magnetTimer = this.magnetDuration;
        break;
    }
    return item.effect;
  }

  activateMagnet(duration) {
    this.magnetActive = true;
    this.magnetTimer = duration || this.magnetDuration;
  }

  draw(ctx) {
    this.items.forEach(function(item) {
      item.draw(ctx);
    });
  }

  clear() {
    this.items = [];
    this.itemsCollected = 0;
  }
}

window.DafeijiItem = DafeijiItem;
window.DafeijiItemManager = DafeijiItemManager;
