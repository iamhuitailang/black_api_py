class GameRenderer {
  constructor(canvas, cellSize) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cellSize = cellSize;
    this.time = 0;
    this.screenShake = { active: false, intensity: 0, duration: 0, startTime: 0 };
    this.redFlash = { active: false, startTime: 0, duration: 0 };
    this.doorOpenProgress = 0;
  }

  setSize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  update(currentTime) {
    this.time = currentTime;

    if (this.screenShake.active) {
      const elapsed = currentTime - this.screenShake.startTime;
      if (elapsed >= this.screenShake.duration) {
        this.screenShake.active = false;
      }
    }

    if (this.redFlash.active) {
      const elapsed = currentTime - this.redFlash.startTime;
      if (elapsed >= this.redFlash.duration) {
        this.redFlash.active = false;
      }
    }
  }

  triggerScreenShake(duration = 200, intensity = 5) {
    this.screenShake = {
      active: true,
      intensity,
      duration,
      startTime: this.time,
    };
  }

  triggerRedFlash(duration = 300) {
    this.redFlash = {
      active: true,
      startTime: this.time,
      duration,
    };
  }

  render(gameState) {
    const { maze, player, guards, keys, fog } = gameState;
    const ctx = this.ctx;
    const cs = this.cellSize;

    ctx.save();

    if (this.screenShake.active) {
      const elapsed = this.time - this.screenShake.startTime;
      const progress = elapsed / this.screenShake.duration;
      const intensity = this.screenShake.intensity * (1 - progress);
      const offsetX = (Math.random() - 0.5) * intensity * 2;
      const offsetY = (Math.random() - 0.5) * intensity * 2;
      ctx.translate(offsetX, offsetY);
    }

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this._drawMaze(maze, fog);
    this._drawKeys(keys, fog);
    this._drawExit(maze, fog, gameState.doorOpen);
    this._drawGuards(guards, fog, maze);
    this._drawPlayer(player);
    this._drawTorchLight(player);
    this._drawFogOverlay(fog);

    ctx.restore();

    if (this.redFlash.active) {
      const elapsed = this.time - this.redFlash.startTime;
      const alpha = 0.5 * (1 - elapsed / this.redFlash.duration);
      ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  _drawMaze(maze, fog) {
    const ctx = this.ctx;
    const cs = this.cellSize;

    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const visibility = fog.getVisibilityAlpha(x, y);
        if (visibility <= 0) continue;

        const px = x * cs;
        const py = y * cs;

        if (maze.isWall(x, y)) {
          const brightness = Math.floor(60 * visibility);
          ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness + 20})`;
          ctx.fillRect(px, py, cs, cs);

          if (visibility > 0.5) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * visibility})`;
            ctx.fillRect(px, py, cs, 2);
            ctx.fillRect(px, py, 2, cs);
          }
        } else {
          const brightness = Math.floor(50 * visibility);
          ctx.fillStyle = `rgb(${brightness + 20}, ${brightness + 15}, ${brightness + 10})`;
          ctx.fillRect(px, py, cs, cs);

          ctx.strokeStyle = `rgba(0, 0, 0, ${0.2 * visibility})`;
          ctx.strokeRect(px + 0.5, py + 0.5, cs - 1, cs - 1);
        }
      }
    }
  }

  _drawKeys(keys, fog) {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const time = this.time / 1000;

    const keyColors = {
      red: '#ff4d4d',
      blue: '#4d79ff',
      green: '#4dff4d',
    };

    keys.forEach(key => {
      if (key.collected) return;
      if (!fog.isVisible(key.x, key.y)) return;

      const cx = key.x * cs + cs / 2;
      const cy = key.y * cs + cs / 2;
      const rotation = time * 2;
      const bobOffset = Math.sin(time * 3) * 2;

      ctx.save();
      ctx.translate(cx, cy + bobOffset);
      ctx.rotate(rotation);

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cs * 0.8);
      gradient.addColorStop(0, keyColors[key.color] + '80');
      gradient.addColorStop(1, keyColors[key.color] + '00');
      ctx.fillStyle = gradient;
      ctx.fillRect(-cs * 0.8, -cs * 0.8, cs * 1.6, cs * 1.6);

      ctx.fillStyle = keyColors[key.color];
      ctx.beginPath();
      ctx.arc(0, -cs * 0.15, cs * 0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillRect(-cs * 0.05, -cs * 0.15, cs * 0.1, cs * 0.35);
      ctx.fillRect(-cs * 0.15, cs * 0.12, cs * 0.12, cs * 0.06);
      ctx.fillRect(cs * 0.03, cs * 0.18, cs * 0.1, cs * 0.06);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(-cs * 0.05, -cs * 0.2, cs * 0.06, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  _drawExit(maze, fog, isOpen) {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const { x, y } = maze.exitPos;

    if (!fog.isExplored(x, y)) return;

    const px = x * cs;
    const py = y * cs;
    const visibility = fog.getVisibilityAlpha(x, y);
    const time = this.time / 1000;

    if (isOpen) {
      const gradient = ctx.createRadialGradient(
        px + cs / 2, py + cs / 2, 0,
        px + cs / 2, py + cs / 2, cs
      );
      gradient.addColorStop(0, `rgba(255, 215, 0, ${0.8 * visibility})`);
      gradient.addColorStop(0.5, `rgba(255, 215, 0, ${0.4 * visibility})`);
      gradient.addColorStop(1, `rgba(255, 215, 0, 0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(px - cs, py - cs, cs * 3, cs * 3);

      const pulseSize = 1 + Math.sin(time * 3) * 0.1;
      ctx.fillStyle = `rgba(255, 255, 200, ${0.9 * visibility})`;
      ctx.beginPath();
      ctx.arc(px + cs / 2, py + cs / 2, cs * 0.35 * pulseSize, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(80, 60, 40, ${visibility})`;
      ctx.fillRect(px + 2, py + 2, cs - 4, cs - 4);

      ctx.strokeStyle = `rgba(120, 90, 60, ${visibility})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 3, py + 3, cs - 6, cs - 6);

      ctx.fillStyle = `rgba(200, 170, 50, ${visibility})`;
      ctx.beginPath();
      ctx.arc(px + cs * 0.7, py + cs / 2, cs * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawGuards(guards, fog, maze) {
    const ctx = this.ctx;
    const cs = this.cellSize;

    guards.forEach(guard => {
      const visible = fog.isVisible(Math.floor(guard.renderX), Math.floor(guard.renderY));
      const explored = fog.isExplored(Math.floor(guard.renderX), Math.floor(guard.renderY));

      if (!visible && !explored) return;

      const alpha = visible ? 1 : 0.4;
      const gx = guard.renderX * cs + cs / 2;
      const gy = guard.renderY * cs + cs / 2;

      if (visible && guard.path && guard.path.length > 1) {
        ctx.strokeStyle = `rgba(255, 0, 0, 0.15)`;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        guard.path.forEach((p, i) => {
          const px = p.x * cs + cs / 2;
          const py = p.y * cs + cs / 2;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (visible) {
        this._drawGuardVision(guard, maze);
      }

      ctx.save();
      ctx.globalAlpha = alpha;

      ctx.fillStyle = guard.state === 'chase' ? '#ff3333' : '#cc2222';
      ctx.beginPath();
      ctx.arc(gx, gy, cs * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      const eyeOffsetX = Math.cos(guard.direction.angle) * cs * 0.12;
      const eyeOffsetY = Math.sin(guard.direction.angle) * cs * 0.12;
      ctx.beginPath();
      ctx.arc(gx + eyeOffsetX - cs * 0.07, gy + eyeOffsetY - cs * 0.04, cs * 0.06, 0, Math.PI * 2);
      ctx.arc(gx + eyeOffsetX + cs * 0.07, gy + eyeOffsetY - cs * 0.04, cs * 0.06, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(gx + eyeOffsetX - cs * 0.07, gy + eyeOffsetY - cs * 0.04, cs * 0.03, 0, Math.PI * 2);
      ctx.arc(gx + eyeOffsetX + cs * 0.07, gy + eyeOffsetY - cs * 0.04, cs * 0.03, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  _drawGuardVision(guard, maze) {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const gx = guard.renderX * cs + cs / 2;
    const gy = guard.renderY * cs + cs / 2;
    const viewDist = GameConstants.GUARD_VIEW_DISTANCE * cs;
    const viewAngle = GameConstants.GUARD_VIEW_ANGLE;
    const angle = guard.direction.angle;

    const steps = 20;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.moveTo(gx, gy);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const rayAngle = angle - viewAngle / 2 + viewAngle * t;
      let dist = viewDist;

      for (let d = 0; d < viewDist; d += cs * 0.2) {
        const rx = gx + Math.cos(rayAngle) * d;
        const ry = gy + Math.sin(rayAngle) * d;
        const mx = Math.floor(rx / cs);
        const my = Math.floor(ry / cs);

        if (maze.isWall(mx, my)) {
          dist = d;
          break;
        }
      }

      const ex = gx + Math.cos(rayAngle) * dist;
      const ey = gy + Math.sin(rayAngle) * dist;
      ctx.lineTo(ex, ey);
    }

    ctx.closePath();
    ctx.fill();
  }

  _drawPlayer(player) {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const px = player.renderX * cs + cs / 2;
    const py = player.renderY * cs + cs / 2;
    const time = this.time / 1000;

    ctx.save();

    ctx.fillStyle = '#4a9eff';
    ctx.beginPath();
    ctx.arc(px, py, cs * 0.32, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2a7edf';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    const eyeOffsetX = Math.cos(player.direction.angle) * cs * 0.1;
    const eyeOffsetY = Math.sin(player.direction.angle) * cs * 0.1;
    ctx.beginPath();
    ctx.arc(px + eyeOffsetX - cs * 0.06, py + eyeOffsetY - cs * 0.03, cs * 0.05, 0, Math.PI * 2);
    ctx.arc(px + eyeOffsetX + cs * 0.06, py + eyeOffsetY - cs * 0.03, cs * 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(px + eyeOffsetX - cs * 0.06, py + eyeOffsetY - cs * 0.03, cs * 0.025, 0, Math.PI * 2);
    ctx.arc(px + eyeOffsetX + cs * 0.06, py + eyeOffsetY - cs * 0.03, cs * 0.025, 0, Math.PI * 2);
    ctx.fill();

    const torchX = px + Math.cos(player.direction.angle) * cs * 0.3;
    const torchY = py + Math.sin(player.direction.angle) * cs * 0.3 - cs * 0.1;
    const flicker = 0.9 + Math.sin(time * 10) * 0.1;

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(torchX - 2, torchY, 4, cs * 0.2);

    ctx.fillStyle = `rgba(255, 150, 50, ${flicker})`;
    ctx.beginPath();
    ctx.ellipse(torchX, torchY - 2, cs * 0.08 * flicker, cs * 0.12 * flicker, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 220, 100, ${flicker})`;
    ctx.beginPath();
    ctx.ellipse(torchX, torchY - 2, cs * 0.04 * flicker, cs * 0.07 * flicker, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawTorchLight(player) {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const px = player.renderX * cs + cs / 2;
    const py = player.renderY * cs + cs / 2;
    const time = this.time / 1000;
    const flicker = 0.92 + Math.sin(time * 8) * 0.04 + Math.sin(time * 13) * 0.03;

    const gradient = ctx.createRadialGradient(px, py, 0, px, py, cs * 2.5 * flicker);
    gradient.addColorStop(0, 'rgba(255, 180, 80, 0.25)');
    gradient.addColorStop(0.5, 'rgba(255, 150, 60, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 100, 30, 0)');

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gradient;
    ctx.fillRect(px - cs * 3, py - cs * 3, cs * 6, cs * 6);
    ctx.globalCompositeOperation = 'source-over';
  }

  _drawFogOverlay(fog) {
    const ctx = this.ctx;
    const cs = this.cellSize;

    for (let y = 0; y < fog.height; y++) {
      for (let x = 0; x < fog.width; x++) {
        if (fog.isVisible(x, y)) continue;

        const px = x * cs;
        const py = y * cs;

        if (fog.isExplored(x, y)) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        } else {
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        }
        ctx.fillRect(px, py, cs, cs);
      }
    }

    this._drawSoftFogEdges(fog);
  }

  _drawSoftFogEdges(fog) {
    const ctx = this.ctx;
    const cs = this.cellSize;

    for (let y = 0; y < fog.height; y++) {
      for (let x = 0; x < fog.width; x++) {
        if (!fog.isVisible(x, y)) continue;

        const neighbors = [
          { dx: 0, dy: -1 },
          { dx: 0, dy: 1 },
          { dx: -1, dy: 0 },
          { dx: 1, dy: 0 },
        ];

        neighbors.forEach(({ dx, dy }) => {
          const nx = x + dx;
          const ny = y + dy;

          if (fog.isExplored(nx, ny) && !fog.isVisible(nx, ny)) {
            const px = x * cs;
            const py = y * cs;

            const gradient = ctx.createLinearGradient(
              px + (dx > 0 ? cs : 0), py + (dy > 0 ? cs : 0),
              px + (dx < 0 ? 0 : cs * dx), py + (dy < 0 ? 0 : cs * dy)
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');

            ctx.fillStyle = gradient;
            if (dx !== 0) {
              ctx.fillRect(dx > 0 ? px + cs * 0.7 : px, py, cs * 0.3, cs);
            } else {
              ctx.fillRect(px, dy > 0 ? py + cs * 0.7 : py, cs, cs * 0.3);
            }
          }
        });
      }
    }
  }

  drawMiniMap(miniCanvas, maze, player, guards, fog) {
    const ctx = miniCanvas.getContext('2d');
    const w = miniCanvas.width;
    const h = miniCanvas.height;
    const cellW = w / maze.width;
    const cellH = h / maze.height;

    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, w, h);

    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        if (!fog.isExplored(x, y)) continue;

        const px = x * cellW;
        const py = y * cellH;

        if (maze.isWall(x, y)) {
          ctx.fillStyle = '#333';
        } else {
          ctx.fillStyle = '#1a1a2e';
        }
        ctx.fillRect(px, py, cellW, cellH);
      }
    }

    if (fog.isExplored(maze.exitPos.x, maze.exitPos.y)) {
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(
        maze.exitPos.x * cellW,
        maze.exitPos.y * cellH,
        cellW, cellH
      );
    }

    guards.forEach(guard => {
      if (fog.isVisible(Math.floor(guard.renderX), Math.floor(guard.renderY))) {
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.arc(
          guard.renderX * cellW + cellW / 2,
          guard.renderY * cellH + cellH / 2,
          Math.max(cellW, cellH) * 0.4,
          0, Math.PI * 2
        );
        ctx.fill();
      }
    });

    ctx.fillStyle = '#4a9eff';
    ctx.beginPath();
    ctx.arc(
      player.renderX * cellW + cellW / 2,
      player.renderY * cellH + cellH / 2,
      Math.max(cellW, cellH) * 0.5,
      0, Math.PI * 2
    );
    ctx.fill();

    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }
}

if (typeof window !== 'undefined') {
  window.GameRenderer = GameRenderer;
}
