const AIManager = {
  update(ai, player, deltaTime) {
    if (ai.isDead || !player) return;

    if (ai.isAttacking || ai.isHurt) return;

    const distance = Math.abs(ai.x - player.x);
    const playerOnRight = player.x > ai.x;

    if (player.isAttacking && distance < 150) {
      if (Math.random() < CONFIG.AI.BLOCK_CHANCE * 2) {
        ai.block();
        return;
      } else if (Math.random() < CONFIG.AI.MOVE_CHANCE * 3) {
        if (playerOnRight) {
          ai.moveLeft();
        } else {
          ai.moveRight();
        }
        return;
      }
    }

    ai.stopBlock();

    if (distance < 80) {
      const attackRoll = Math.random();
      if (attackRoll < CONFIG.AI.ATTACK_CHANCE) {
        const attacks = ['lightPunch', 'heavyPunch', 'lightKick', 'heavyKick'];
        const attackType = attacks[Math.floor(Math.random() * attacks.length)];
        ai.attack(attackType);
        return;
      }

      if (Math.random() < CONFIG.AI.ATTACK_CHANCE * 0.5 && ai.mp >= 30 && ai.skillCooldown <= 0) {
        ai.useSkill(Math.floor(Math.random() * ai.skills.length));
        return;
      }

      if (Math.random() < CONFIG.AI.MOVE_CHANCE) {
        if (playerOnRight) {
          ai.moveLeft();
        } else {
          ai.moveRight();
        }
      }
    } else if (distance < 200) {
      if (Math.random() < CONFIG.AI.MOVE_CHANCE * 2) {
        if (playerOnRight) {
          ai.moveRight();
        } else {
          ai.moveLeft();
        }
      }

      const attackRoll = Math.random();
      if (attackRoll < CONFIG.AI.ATTACK_CHANCE * 0.5) {
        const attacks = ['heavyKick', 'lightKick'];
        const attackType = attacks[Math.floor(Math.random() * attacks.length)];
        ai.attack(attackType);
      }
    } else {
      if (Math.random() < CONFIG.AI.MOVE_CHANCE * 3) {
        if (playerOnRight) {
          ai.moveRight();
        } else {
          ai.moveLeft();
        }
      }

      if (Math.random() < CONFIG.AI.MOVE_CHANCE * 0.5 && ai.isGrounded) {
        ai.jump();
      }
    }

    if (Math.random() < CONFIG.AI.MOVE_CHANCE * 0.3 && ai.isGrounded && distance < 100) {
      if (player.isAttacking) {
        ai.crouch();
      } else {
        ai.standUp();
      }
    } else {
      ai.standUp();
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIManager;
}
