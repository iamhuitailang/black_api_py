import { Zombie, ZombieType } from '@/types/game';

interface ZombieSpriteProps {
  zombie: Zombie;
  sceneHeight: number;
}

export default function ZombieSprite({ zombie, sceneHeight }: ZombieSpriteProps) {
  const scale = Math.max(0.3, 1 - zombie.distance / 150);
  const size = 140 * zombie.size * scale;
  const width = 80 * zombie.size * scale;
  const bottomOffset = sceneHeight * 0.15;

  const opacity = zombie.isDead ? zombie.deathAnimation : 1;
  const filter = zombie.hitFlash > 0 ? 'brightness(2) saturate(2)' : 'none';

  const walkCycle = zombie.isDead ? 0 : Math.sin(Date.now() / 150) * (zombie.type === ZombieType.RUNNER ? 8 : zombie.type === ZombieType.TANK ? 3 : 5);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${zombie.x}%`,
        bottom: `${bottomOffset}px`,
        transform: `translateX(-50%)`,
        width: `${width}px`,
        height: `${size}px`,
        opacity,
        filter,
        zIndex: Math.floor(1000 - zombie.distance),
      }}
    >
      {zombie.type === ZombieType.WALKER && (
        <WalkerSVG walkCycle={walkCycle} />
      )}
      {zombie.type === ZombieType.RUNNER && (
        <RunnerSVG walkCycle={walkCycle} />
      )}
      {zombie.type === ZombieType.TANK && (
        <TankSVG walkCycle={walkCycle} />
      )}

      {!zombie.isDead && (
        <HealthBar health={zombie.health} maxHealth={zombie.maxHealth} />
      )}
    </div>
  );
}

function HealthBar({ health, maxHealth }: { health: number; maxHealth: number }) {
  const pct = (health / maxHealth) * 100;
  const color = pct > 50 ? '#4ade80' : pct > 25 ? '#fbbf24' : '#ef4444';

  return (
    <div
      className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gray-800 rounded-full overflow-hidden border border-gray-600"
      style={{ width: '4rem', height: '0.375rem' }}
    >
      <div
        className="h-full transition-all duration-100"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function WalkerSVG({ walkCycle }: { walkCycle: number }) {
  return (
    <svg
      viewBox="0 0 80 140"
      className="w-full h-full"
      style={{
        transform: 'none',
        transformOrigin: 'bottom center',
      }}
    >
      <ellipse cx="40" cy="55" rx="22" ry="35" fill="#4a6741" />
      <ellipse cx="40" cy="55" rx="18" ry="30" fill="#3d4f3d" />
      <rect
        x="30" y="85" width="8" height="45" rx="3" fill="#3d4f3d"
        style={{ transform: `rotate(${walkCycle}deg)`, transformOrigin: 'top center' }}
      />
      <rect
        x="42" y="85" width="8" height="45" rx="3" fill="#3d4f3d"
        style={{ transform: `rotate(${-walkCycle}deg)`, transformOrigin: 'top center' }}
      />
      <rect x="28" y="125" width="12" height="10" rx="2" fill="#2a2a2a" />
      <rect x="40" y="125" width="12" height="10" rx="2" fill="#2a2a2a" />
      <rect
        x="12" y="50" width="10" height="8" rx="3" fill="#4a6741"
        style={{ transform: `rotate(${-walkCycle * 1.5}deg)`, transformOrigin: 'right center' }}
      />
      <rect
        x="58" y="50" width="10" height="8" rx="3" fill="#4a6741"
        style={{ transform: `rotate(${walkCycle * 1.5}deg)`, transformOrigin: 'left center' }}
      />
      <rect
        x="8" y="45" width="6" height="20" rx="3" fill="#4a6741"
        style={{ transform: `rotate(${-10 + walkCycle}deg)`, transformOrigin: 'top right' }}
      />
      <rect
        x="66" y="45" width="6" height="20" rx="3" fill="#4a6741"
        style={{ transform: `rotate(${10 - walkCycle}deg)`, transformOrigin: 'top left' }}
      />
      <ellipse cx="40" cy="22" rx="18" ry="20" fill="#8b7355" />
      <ellipse cx="33" cy="20" rx="5" ry="6" fill="#1a1a1a" />
      <ellipse cx="47" cy="20" rx="5" ry="6" fill="#1a1a1a" />
      <ellipse cx="33" cy="20" rx="2" ry="3" fill="#e63946" />
      <ellipse cx="47" cy="20" rx="2" ry="3" fill="#e63946" />
      <path d="M 32 30 Q 40 36 48 30" stroke="#2a2a2a" strokeWidth="2" fill="none" />
      <path d="M 34 28 L 36 32 M 38 28 L 40 32 M 42 28 L 44 32" stroke="#fff" strokeWidth="1" />
      <path d="M 35 22 Q 40 25 45 22" stroke="#3d2b1f" strokeWidth="3" fill="none" />
      <ellipse cx="40" cy="28" rx="6" ry="2" fill="#3d2b1f" />
      <ellipse cx="40" cy="34" rx="8" ry="3" fill="#4a3528" />
      <rect x="28" y="50" width="24" height="3" fill="#5a4a3a" rx="1" />
    </svg>
  );
}

function RunnerSVG({ walkCycle }: { walkCycle: number }) {
  return (
    <svg
      viewBox="0 0 80 140"
      className="w-full h-full"
      style={{
        transform: 'none',
        transformOrigin: 'bottom center',
      }}
    >
      <ellipse cx="40" cy="55" rx="18" ry="28" fill="#6b8e6b" />
      <ellipse cx="40" cy="55" rx="14" ry="24" fill="#5a7a5a" />
      <rect
        x="32" y="80" width="7" height="40" rx="3" fill="#5a7a5a"
        style={{ transform: `rotate(${walkCycle * 1.5}deg)`, transformOrigin: 'top center' }}
      />
      <rect
        x="41" y="80" width="7" height="40" rx="3" fill="#5a7a5a"
        style={{ transform: `rotate(${-walkCycle * 1.5}deg)`, transformOrigin: 'top center' }}
      />
      <rect x="30" y="115" width="10" height="8" rx="2" fill="#1a1a1a" />
      <rect x="40" y="115" width="10" height="8" rx="2" fill="#1a1a1a" />
      <rect
        x="14" y="48" width="9" height="7" rx="3" fill="#6b8e6b"
        style={{ transform: `rotate(${-walkCycle * 2}deg)`, transformOrigin: 'right center' }}
      />
      <rect
        x="57" y="48" width="9" height="7" rx="3" fill="#6b8e6b"
        style={{ transform: `rotate(${walkCycle * 2}deg)`, transformOrigin: 'left center' }}
      />
      <rect
        x="10" y="43" width="5" height="22" rx="2" fill="#6b8e6b"
        style={{ transform: `rotate(${-20 + walkCycle * 2}deg)`, transformOrigin: 'top right' }}
      />
      <rect
        x="65" y="43" width="5" height="22" rx="2" fill="#6b8e6b"
        style={{ transform: `rotate(${20 - walkCycle * 2}deg)`, transformOrigin: 'top left' }}
      />
      <ellipse cx="40" cy="22" rx="15" ry="17" fill="#9b8b75" />
      <ellipse cx="34" cy="19" rx="4" ry="5" fill="#0d0d0d" />
      <ellipse cx="46" cy="19" rx="4" ry="5" fill="#0d0d0d" />
      <ellipse cx="34" cy="19" rx="2" ry="2.5" fill="#ff4444" />
      <ellipse cx="46" cy="19" rx="2" ry="2.5" fill="#ff4444" />
      <path d="M 33 28 L 47 28" stroke="#2a2a2a" strokeWidth="2" />
      <path d="M 35 26 L 37 30 M 39 26 L 41 30 M 43 26 L 45 30" stroke="#fff" strokeWidth="1" />
      <path d="M 35 20 Q 40 23 45 20" stroke="#2d1b0f" strokeWidth="2" fill="none" />
      <ellipse cx="40" cy="26" rx="5" ry="1.5" fill="#2d1b0f" />
      <ellipse cx="40" cy="32" rx="7" ry="2" fill="#3a2518" />
      <rect x="30" y="50" width="20" height="2.5" fill="#4a3a2a" rx="1" />
      <ellipse cx="40" cy="10" rx="6" ry="3" fill="#5a7a5a" />
    </svg>
  );
}

function TankSVG({ walkCycle }: { walkCycle: number }) {
  return (
    <svg
      viewBox="0 0 80 140"
      className="w-full h-full"
      style={{
        transform: 'none',
        transformOrigin: 'bottom center',
      }}
    >
      <ellipse cx="40" cy="52" rx="28" ry="38" fill="#3d5a3d" />
      <ellipse cx="40" cy="52" rx="24" ry="33" fill="#2d3f2d" />
      <ellipse cx="40" cy="52" rx="20" ry="28" fill="#3d5a3d" opacity="0.5" />
      <rect
        x="24" y="86" width="12" height="42" rx="4" fill="#2d3f2d"
        style={{ transform: `rotate(${walkCycle}deg)`, transformOrigin: 'top center' }}
      />
      <rect
        x="44" y="86" width="12" height="42" rx="4" fill="#2d3f2d"
        style={{ transform: `rotate(${-walkCycle}deg)`, transformOrigin: 'top center' }}
      />
      <rect x="22" y="122" width="16" height="12" rx="3" fill="#1a1a1a" />
      <rect x="42" y="122" width="16" height="12" rx="3" fill="#1a1a1a" />
      <rect
        x="4" y="42" width="14" height="12" rx="5" fill="#3d5a3d"
        style={{ transform: `rotate(${-walkCycle * 0.8}deg)`, transformOrigin: 'right center' }}
      />
      <rect
        x="62" y="42" width="14" height="12" rx="5" fill="#3d5a3d"
        style={{ transform: `rotate(${walkCycle * 0.8}deg)`, transformOrigin: 'left center' }}
      />
      <rect
        x="0" y="35" width="8" height="26" rx="4" fill="#3d5a3d"
        style={{ transform: `rotate(${-5 + walkCycle}deg)`, transformOrigin: 'top right' }}
      />
      <rect
        x="72" y="35" width="8" height="26" rx="4" fill="#3d5a3d"
        style={{ transform: `rotate(${5 - walkCycle}deg)`, transformOrigin: 'top left' }}
      />
      <ellipse cx="40" cy="20" rx="22" ry="22" fill="#7a6548" />
      <ellipse cx="30" cy="17" rx="7" ry="8" fill="#1a1a1a" />
      <ellipse cx="50" cy="17" rx="7" ry="8" fill="#1a1a1a" />
      <ellipse cx="30" cy="17" rx="3" ry="4" fill="#ff2222" />
      <ellipse cx="50" cy="17" rx="3" ry="4" fill="#ff2222" />
      <path d="M 28 30 Q 40 38 52 30" stroke="#2a2a2a" strokeWidth="3" fill="none" />
      <path d="M 30 28 L 33 34 M 36 28 L 39 34 M 42 28 L 45 34 M 48 28 L 51 34" stroke="#fff" strokeWidth="1.5" />
      <path d="M 28 18 Q 40 22 52 18" stroke="#2d1b0f" strokeWidth="4" fill="none" />
      <ellipse cx="40" cy="27" rx="8" ry="3" fill="#2d1b0f" />
      <ellipse cx="40" cy="34" rx="10" ry="4" fill="#3d2b1f" />
      <rect x="22" y="48" width="36" height="4" fill="#5a4a3a" rx="1" />
      <path d="M 20 5 L 24 0 L 28 5 M 52 5 L 56 0 L 60 5" stroke="#2d1b0f" strokeWidth="3" fill="none" />
      <rect x="26" y="60" width="28" height="5" rx="2" fill="#1a2a1a" />
    </svg>
  );
}
