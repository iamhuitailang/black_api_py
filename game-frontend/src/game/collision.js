export function rectOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function rectOverlapWithMargin(a, b, margin) {
  return (
    a.x - margin < b.x + b.width &&
    a.x + a.width + margin > b.x &&
    a.y - margin < b.y + b.height &&
    a.y + a.height + margin > b.y
  );
}

export function pointInRect(px, py, rect) {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  );
}

export function resolveCollision(entity, platforms) {
  entity.prevY = entity.y;
  entity.prevX = entity.x;
  entity.onGround = false;

  for (const p of platforms) {
    if (!rectOverlap(entity, p)) continue;

    if (p.type === 'platform') {
      const prevBottom = entity.prevY + entity.height;
      const tolerance = Math.max(4, Math.abs(entity.vy) + 2);
      if (entity.vy >= 0 && prevBottom <= p.y + tolerance) {
        entity.y = p.y - entity.height;
        entity.vy = 0;
        entity.onGround = true;
      }
      continue;
    }

    const overlapLeft = entity.x + entity.width - p.x;
    const overlapRight = p.x + p.width - entity.x;
    const overlapTop = entity.y + entity.height - p.y;
    const overlapBottom = p.y + p.height - entity.y;

    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);

    if (minOverlapX < minOverlapY) {
      if (overlapLeft < overlapRight) {
        entity.x = p.x - entity.width;
      } else {
        entity.x = p.x + p.width;
      }
      entity.vx = 0;
    } else {
      if (overlapTop < overlapBottom) {
        entity.y = p.y - entity.height;
        entity.vy = 0;
        entity.onGround = true;
      } else {
        entity.y = p.y + p.height;
        entity.vy = 0;
      }
    }
  }
}

export function attackHitsSource(source, target, facing) {
  if (!source.attacking || source.attackFrame <= 0) return false;
  if (target.invincible) return false;

  const hitbox = {
    x: facing === 1 ? source.x + source.width : source.x - source.attackRange,
    y: source.y,
    width: source.attackRange,
    height: source.height,
  };

  return rectOverlap(hitbox, target);
}

export function stompCheck(player, enemy) {
  if (player.vy <= 0) return false;

  const playerBottom = player.y + player.height;
  const enemyTop = enemy.y;
  const prevBottom = playerBottom - player.vy;

  if (prevBottom > enemyTop + 4) return false;

  const xOverlap = player.x + player.width > enemy.x && player.x < enemy.x + enemy.width;
  if (!xOverlap) return false;

  return playerBottom >= enemyTop && playerBottom <= enemyTop + enemy.height * 0.5;
}

export function dashThroughCheck(dasher, target) {
  if (!dasher.dashing || dasher.invincible) return false;
  return rectOverlap(dasher, target);
}
