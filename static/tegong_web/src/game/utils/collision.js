export function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  )
}

export function checkDistance(obj1, obj2) {
  const dx = (obj1.x + obj1.width / 2) - (obj2.x + obj2.width / 2)
  const dy = (obj1.y + obj1.height / 2) - (obj2.y + obj2.height / 2)
  return Math.sqrt(dx * dx + dy * dy)
}

export function isWithinRange(obj1, obj2, range) {
  return checkDistance(obj1, obj2) <= range
}

export function checkPlatformCollision(player, platform) {
  const playerBottom = player.y + player.height
  const playerRight = player.x + player.width
  const platformBottom = platform.y + platform.height
  const platformRight = platform.x + platform.width

  if (playerRight <= platform.x || player.x >= platformRight) {
    return { collision: false, side: null }
  }

  if (playerBottom <= platform.y || player.y >= platformBottom) {
    return { collision: false, side: null }
  }

  const overlapTop = playerBottom - platform.y
  const overlapBottom = platformBottom - player.y
  const overlapLeft = playerRight - platform.x
  const overlapRight = platformRight - player.x

  const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight)

  if (minOverlap === overlapTop && player.velocityY >= 0) {
    return { collision: true, side: 'top' }
  }

  if (minOverlap === overlapBottom && player.velocityY < 0) {
    return { collision: true, side: 'bottom' }
  }

  if (minOverlap === overlapLeft && player.velocityX > 0) {
    return { collision: true, side: 'left' }
  }

  if (minOverlap === overlapRight && player.velocityX < 0) {
    return { collision: true, side: 'right' }
  }

  if (minOverlap === overlapTop) {
    return { collision: true, side: 'top' }
  }

  if (minOverlap === overlapBottom) {
    return { collision: true, side: 'bottom' }
  }

  if (minOverlap === overlapLeft) {
    return { collision: true, side: 'left' }
  }

  return { collision: true, side: 'right' }
}
