class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.time = 0;
    this.lightFlicker = {};
    this.selectedNode = null;
    this.hoveredTower = null;
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    this.ctx.fillStyle = '#0a0e1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render(levelMap, towers, enemies, effects) {
    this.time += 0.016;
    this.clear();
    this.drawMap(levelMap);
    this.drawDeployNodes(levelMap, towers);
    this.drawEnemies(enemies);
    this.drawTowers(towers);
    this.drawAttackEffects(towers);
    this.drawStatusEffects(enemies, towers);
    this.drawScanlines();
  }

  drawMap(levelMap) {
    var ctx = this.ctx;
    for (var y = 0; y < levelMap.height; y++) {
      for (var x = 0; x < levelMap.width; x++) {
        var cell = levelMap.grid[y][x];
        var px = x * CELL_SIZE;
        var py = y * CELL_SIZE;

        if (cell === 1) {
          ctx.fillStyle = '#1a1f2e';
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
          ctx.strokeStyle = 'rgba(100,120,150,0.1)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
        } else if (cell === 2) {
          ctx.fillStyle = '#080b14';
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
        } else {
          ctx.fillStyle = '#0e1220';
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    this.drawCorridorLights(levelMap);
  }

  drawCorridorLights(levelMap) {
    var ctx = this.ctx;
    for (var y = 0; y < levelMap.height; y++) {
      for (var x = 0; x < levelMap.width; x++) {
        if (levelMap.grid[y][x] !== 1) continue;
        var px = x * CELL_SIZE;
        var py = y * CELL_SIZE;
        var key = x + ',' + y;
        if (!this.lightFlicker[key]) {
          this.lightFlicker[key] = Math.random() * Math.PI * 2;
        }
        var alpha = 0.3 + 0.2 * Math.sin(this.time * 2 + this.lightFlicker[key]);

        if (x > 0 && levelMap.grid[y][x - 1] !== 1) {
          ctx.strokeStyle = 'rgba(0,229,255,' + alpha + ')';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, py + CELL_SIZE);
          ctx.stroke();
        }
        if (x < levelMap.width - 1 && levelMap.grid[y][x + 1] !== 1) {
          ctx.strokeStyle = 'rgba(0,229,255,' + alpha + ')';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px + CELL_SIZE, py);
          ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE);
          ctx.stroke();
        }
        if (y > 0 && levelMap.grid[y - 1][x] !== 1) {
          ctx.strokeStyle = 'rgba(0,229,255,' + alpha + ')';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + CELL_SIZE, py);
          ctx.stroke();
        }
        if (y < levelMap.height - 1 && levelMap.grid[y + 1][x] !== 1) {
          ctx.strokeStyle = 'rgba(0,229,255,' + alpha + ')';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px, py + CELL_SIZE);
          ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE);
          ctx.stroke();
        }
      }
    }
  }

  drawDeployNodes(levelMap, towers) {
    var ctx = this.ctx;
    for (var i = 0; i < levelMap.deployNodes.length; i++) {
      var node = levelMap.deployNodes[i];
      var px = node.x * CELL_SIZE + CELL_SIZE / 2;
      var py = node.y * CELL_SIZE + CELL_SIZE / 2;
      var deployed = this.getTowerAt(towers, node.x, node.y);
      var isSelected = this.selectedNode && this.selectedNode.x === node.x && this.selectedNode.y === node.y;

      if (!deployed) {
        this.drawHexagon(ctx, px, py, 16, isSelected ? '#00e5ff' : 'rgba(0,229,255,0.4)', isSelected);
      }
    }
  }

  drawHexagon(ctx, cx, cy, radius, color, filled) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var angle = Math.PI / 3 * i - Math.PI / 6;
      var hx = cx + radius * Math.cos(angle);
      var hy = cy + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();

    if (filled) {
      var r = 0, g = 229, b = 255;
      if (color.charAt(0) === '#' && color.length === 7) {
        r = parseInt(color.slice(1, 3), 16);
        g = parseInt(color.slice(3, 5), 16);
        b = parseInt(color.slice(5, 7), 16);
      }
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.15)';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.shadowBlur = 0;
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
  }

  getTowerAt(towers, gx, gy) {
    for (var i = 0; i < towers.length; i++) {
      if (towers[i].gx === gx && towers[i].gy === gy) return towers[i];
    }
    return null;
  }

  drawTowers(towers) {
    var ctx = this.ctx;
    for (var i = 0; i < towers.length; i++) {
      var t = towers[i];
      var isHovered = this.hoveredTower === t;

      if (isHovered) {
        this.drawRange(t);
      }

      switch (t.type) {
        case 'electromagnetic': this.drawElectromagneticTower(ctx, t); break;
        case 'laser': this.drawLaserTower(ctx, t); break;
        case 'flame': this.drawFlameTower(ctx, t); break;
        case 'freeze': this.drawFreezeTower(ctx, t); break;
      }

      if (t.level > 1) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '10px Rajdhani';
        ctx.textAlign = 'center';
        for (var s = 0; s < t.level - 1; s++) {
          ctx.fillText('★', t.x - 6 + s * 12, t.y - 16);
        }
      }
    }
  }

  drawElectromagneticTower(ctx, t) {
    ctx.fillStyle = '#1a0a2e';
    ctx.beginPath();
    ctx.arc(t.x, t.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9c27b0';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#9c27b0';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#e1bee7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(t.x - 4, t.y - 7);
    ctx.lineTo(t.x + 2, t.y - 1);
    ctx.lineTo(t.x - 2, t.y + 1);
    ctx.lineTo(t.x + 4, t.y + 7);
    ctx.stroke();
  }

  drawLaserTower(ctx, t) {
    ctx.fillStyle = '#2e0a0a';
    ctx.beginPath();
    ctx.moveTo(t.x, t.y - 14);
    ctx.lineTo(t.x + 14, t.y + 10);
    ctx.lineTo(t.x - 14, t.y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ff1744';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ff5252';
    ctx.beginPath();
    ctx.arc(t.x, t.y + 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFlameTower(ctx, t) {
    ctx.fillStyle = '#2e1a0a';
    ctx.fillRect(t.x - 12, t.y - 12, 24, 24);
    ctx.strokeStyle = '#ff6d00';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff6d00';
    ctx.shadowBlur = 8;
    ctx.strokeRect(t.x - 12, t.y - 12, 24, 24);
    ctx.shadowBlur = 0;

    var nx = t.x + Math.cos(t.angle) * 10;
    var ny = t.y + Math.sin(t.angle) * 10;
    ctx.fillStyle = '#ff8f00';
    ctx.beginPath();
    ctx.arc(nx, ny, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFreezeTower(ctx, t) {
    ctx.fillStyle = '#0a1a2e';
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var angle = Math.PI / 3 * i - Math.PI / 6;
      var hx = t.x + 14 * Math.cos(angle);
      var hy = t.y + 14 * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#00b0ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00b0ff';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#80d8ff';
    ctx.lineWidth = 1.5;
    for (var i = 0; i < 3; i++) {
      var a = (Math.PI * 2 / 3) * i;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x + Math.cos(a) * 8, t.y + Math.sin(a) * 8);
      ctx.stroke();
    }
  }

  drawRange(tower) {
    var ctx = this.ctx;
    var range = tower.getRange();
    var r = parseInt(tower.color.slice(1, 3), 16);
    var g = parseInt(tower.color.slice(3, 5), 16);
    var b = parseInt(tower.color.slice(5, 7), 16);
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, range, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawEnemies(enemies) {
    var ctx = this.ctx;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.isDead()) continue;

      var glowAlpha = 0.5 + 0.5 * Math.sin(e.pulsePhase);

      switch (e.type) {
        case 'normal': this.drawNormalBug(ctx, e, glowAlpha); break;
        case 'acid': this.drawAcidBug(ctx, e, glowAlpha); break;
        case 'shell': this.drawShellBug(ctx, e, glowAlpha); break;
        case 'mother': this.drawMotherBug(ctx, e, glowAlpha); break;
      }

      this.drawHealthBar(ctx, e);
    }
  }

  drawNormalBug(ctx, e, glowAlpha) {
    ctx.fillStyle = e.bodyColor;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = e.glowColor;
    ctx.globalAlpha = glowAlpha;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = e.glowColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, 10, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    this.drawLegs(ctx, e, 6, 9);

    ctx.globalAlpha = 1;
  }

  drawAcidBug(ctx, e, glowAlpha) {
    ctx.fillStyle = e.bodyColor;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = e.glowColor;
    ctx.globalAlpha = glowAlpha;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = e.glowColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, 10, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    this.drawLegs(ctx, e, 6, 9);

    var dripAlpha = 0.4 + 0.3 * Math.sin(this.time * 4);
    ctx.fillStyle = 'rgba(168,255,0,' + dripAlpha + ')';
    for (var d = 0; d < 3; d++) {
      var dx = -6 + d * 6;
      var dy = 7 + Math.abs(Math.sin(this.time * 3 + d)) * 4;
      ctx.beginPath();
      ctx.ellipse(e.x + dx, e.y + dy, 2, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  drawShellBug(ctx, e, glowAlpha) {
    ctx.fillStyle = '#2a1a0a';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#5d3a1a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(e.x - 8, e.y);
    ctx.lineTo(e.x + 8, e.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.x - 6, e.y - 4);
    ctx.lineTo(e.x + 6, e.y + 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.x - 6, e.y + 4);
    ctx.lineTo(e.x + 6, e.y - 4);
    ctx.stroke();

    ctx.strokeStyle = e.glowColor;
    ctx.globalAlpha = glowAlpha;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = e.glowColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, 12, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    this.drawLegs(ctx, e, 6, 11);

    ctx.globalAlpha = 1;
  }

  drawMotherBug(ctx, e, glowAlpha) {
    var pulse = 1 + 0.1 * Math.sin(this.time * 2);
    ctx.fillStyle = e.bodyColor;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + 2, 14 * pulse, 10 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3a1a4a';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y - 4, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = e.glowColor;
    ctx.globalAlpha = glowAlpha;
    ctx.lineWidth = 2;
    ctx.shadowColor = e.glowColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + 2, 14 * pulse, 10 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(e.x, e.y - 4, 10, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    this.drawLegs(ctx, e, 8, 13);

    ctx.globalAlpha = 1;
  }

  drawLegs(ctx, e, count, bodyRadius) {
    ctx.strokeStyle = 'rgba(100,120,80,0.6)';
    ctx.lineWidth = 1;
    for (var l = 0; l < count; l++) {
      var angle = (Math.PI * 2 / count) * l + Math.sin(e.legPhase + l) * 0.15;
      var startDist = bodyRadius * 0.6;
      var endDist = bodyRadius + 5;
      var sx = e.x + Math.cos(angle) * startDist;
      var sy = e.y + Math.sin(angle) * startDist;
      var ex = e.x + Math.cos(angle) * endDist;
      var ey = e.y + Math.sin(angle) * endDist;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
  }

  drawHealthBar(ctx, e) {
    var barWidth = 20;
    var barHeight = 3;
    var x = e.x - barWidth / 2;
    var y = e.y - 16;
    var hpRatio = e.hp / e.maxHp;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y, barWidth, barHeight);

    var barColor = hpRatio > 0.5 ? '#39ff14' : hpRatio > 0.25 ? '#ffab00' : '#ff1744';
    ctx.fillStyle = barColor;
    ctx.fillRect(x, y, barWidth * hpRatio, barHeight);
  }

  drawAttackEffects(towers) {
    var ctx = this.ctx;
    for (var i = 0; i < towers.length; i++) {
      var t = towers[i];
      if (!t.attackEffect || t.attackEffectTimer <= 0) continue;
      var eff = t.attackEffect;
      var alpha = t.attackEffectTimer / 0.2;

      switch (t.type) {
        case 'electromagnetic': this.drawLightningChain(ctx, t, eff, alpha); break;
        case 'laser': this.drawLaserBeam(ctx, t, eff, alpha); break;
        case 'flame': this.drawFlameCone(ctx, t, eff, alpha); break;
        case 'freeze': this.drawIceCrystal(ctx, eff, alpha); break;
      }
    }
  }

  drawLightningChain(ctx, tower, eff, alpha) {
    ctx.strokeStyle = 'rgba(156,39,176,' + alpha + ')';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#9c27b0';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(tower.x, tower.y);

    var dx = eff.targetX - tower.x;
    var dy = eff.targetY - tower.y;
    var steps = 6;
    for (var i = 1; i <= steps; i++) {
      var ratio = i / steps;
      var lx = tower.x + dx * ratio + (Math.random() - 0.5) * 15;
      var ly = tower.y + dy * ratio + (Math.random() - 0.5) * 15;
      if (i === steps) {
        lx = eff.targetX;
        ly = eff.targetY;
      }
      ctx.lineTo(lx, ly);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawLaserBeam(ctx, tower, eff, alpha) {
    ctx.strokeStyle = 'rgba(255,23,68,' + alpha + ')';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(tower.x, tower.y);
    ctx.lineTo(eff.targetX, eff.targetY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,' + (alpha * 0.5) + ')';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tower.x, tower.y);
    ctx.lineTo(eff.targetX, eff.targetY);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawFlameCone(ctx, tower, eff, alpha) {
    var coneAngle = 22.5 * Math.PI / 180;
    var range = tower.getRange();

    ctx.fillStyle = 'rgba(255,109,0,' + (alpha * 0.4) + ')';
    ctx.beginPath();
    ctx.moveTo(tower.x, tower.y);
    ctx.arc(tower.x, tower.y, range, tower.angle - coneAngle, tower.angle + coneAngle);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255,200,0,' + (alpha * 0.3) + ')';
    ctx.beginPath();
    ctx.moveTo(tower.x, tower.y);
    ctx.arc(tower.x, tower.y, range * 0.6, tower.angle - coneAngle * 0.7, tower.angle + coneAngle * 0.7);
    ctx.closePath();
    ctx.fill();
  }

  drawIceCrystal(ctx, eff, alpha) {
    var radius = 30 + 20 * (1 - alpha);
    ctx.strokeStyle = 'rgba(0,176,255,' + alpha + ')';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00b0ff';
    ctx.shadowBlur = 10;

    for (var i = 0; i < 6; i++) {
      var angle = Math.PI / 3 * i + this.time;
      ctx.beginPath();
      ctx.moveTo(eff.targetX, eff.targetY);
      ctx.lineTo(
        eff.targetX + Math.cos(angle) * radius,
        eff.targetY + Math.sin(angle) * radius
      );
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(eff.targetX, eff.targetY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,176,255,' + (alpha * 0.5) + ')';
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawStatusEffects(enemies, towers) {
    var ctx = this.ctx;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.isDead()) continue;

      if (e.slowFactor > 0 && e.slowTimer > 0) {
        ctx.strokeStyle = 'rgba(0,176,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 14, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (e.burnTimer > 0) {
        for (var p = 0; p < 3; p++) {
          var px = e.x + (Math.random() - 0.5) * 16;
          var py = e.y - Math.random() * 12;
          ctx.fillStyle = 'rgba(255,109,0,' + (0.5 + Math.random() * 0.5) + ')';
          ctx.beginPath();
          ctx.arc(px, py, 1.5 + Math.random() * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    for (var i = 0; i < towers.length; i++) {
      var t = towers[i];
      if (t.acidCorrosion > 0 && t.acidTimer > 0) {
        for (var d = 0; d < 2; d++) {
          var dx = (Math.random() - 0.5) * 20;
          var dy = Math.random() * 10;
          ctx.fillStyle = 'rgba(168,255,0,' + (0.3 + Math.random() * 0.3) + ')';
          ctx.beginPath();
          ctx.ellipse(t.x + dx, t.y + dy, 2, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  drawScanlines() {
    var ctx = this.ctx;
    var offset = (this.time * 30) % 4;
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (var y = offset; y < this.canvas.height; y += 4) {
      ctx.fillRect(0, y, this.canvas.width, 1);
    }
  }
}
