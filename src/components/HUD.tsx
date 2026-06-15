import { Heart, Crosshair, RefreshCw, Pause } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { MAX_LIVES, MAX_MAGAZINE } from '@/constants/gameConfig';

interface HUDProps {
  onPause: () => void;
  onReload: () => void;
}

export default function HUD({ onPause, onReload }: HUDProps) {
  const {
    currentWave,
    lives,
    score,
    magazine,
    isReloading,
    reloadProgress,
    getRemainingZombies,
    headshots,
    totalShots,
  } = useGameStore();

  const remaining = getRemainingZombies();
  const headshotRate = totalShots > 0 ? Math.round((headshots / totalShots) * 100) : 0;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-4 left-4 pointer-events-auto">
        <div
          className="rounded-lg px-4 py-3 border"
          style={{
            background: 'linear-gradient(135deg, rgba(20,10,10,0.85), rgba(30,15,15,0.9))',
            borderColor: 'rgba(180,50,50,0.3)',
            boxShadow: '0 0 15px rgba(180,50,50,0.1), inset 0 0 20px rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="font-bold text-lg tracking-wider"
            style={{ color: '#e63946', textShadow: '0 0 8px rgba(230,57,70,0.4)' }}
          >
            第 {currentWave} 波
          </div>
          <div className="text-gray-400 text-sm mt-1">
            剩余: <span className="text-red-400 font-bold">{remaining}</span>
          </div>
          <div className="text-gray-500 text-xs mt-1">
            爆头率: <span className="text-green-400">{headshotRate}%</span>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 pointer-events-auto">
        <div
          className="rounded-lg px-4 py-3 border"
          style={{
            background: 'linear-gradient(135deg, rgba(20,10,10,0.85), rgba(30,15,15,0.9))',
            borderColor: 'rgba(180,50,50,0.3)',
            boxShadow: '0 0 15px rgba(180,50,50,0.1), inset 0 0 20px rgba(0,0,0,0.3)',
          }}
        >
          <div className="flex items-center gap-1.5">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <Heart
                key={i}
                size={22}
                className={`transition-all duration-300 ${
                  i < lives
                    ? 'text-red-500 fill-red-500'
                    : 'text-gray-700'
                }`}
                style={i < lives ? { filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.6))' } : {}}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <button
          onClick={(e) => { e.stopPropagation(); onPause(); }}
          className="rounded-lg p-3 border transition-colors"
          style={{
            background: 'rgba(20,10,10,0.8)',
            borderColor: 'rgba(100,100,100,0.3)',
          }}
        >
          <Pause size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="absolute bottom-6 left-6 pointer-events-none">
        <div
          className="rounded-lg px-5 py-3 border"
          style={{
            background: 'linear-gradient(135deg, rgba(20,15,5,0.85), rgba(30,20,5,0.9))',
            borderColor: 'rgba(200,150,50,0.3)',
            boxShadow: '0 0 15px rgba(200,150,50,0.08), inset 0 0 20px rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="font-mono text-2xl font-bold tracking-wider"
            style={{ color: '#daa520', textShadow: '0 0 8px rgba(218,165,32,0.3)' }}
          >
            {score.toString().padStart(6, '0')}
          </div>
          <div className="text-gray-500 text-xs mt-0.5">得分</div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 pointer-events-auto">
        <div
          className="rounded-lg px-4 py-3 border"
          style={{
            background: 'linear-gradient(135deg, rgba(10,20,10,0.85), rgba(15,30,15,0.9))',
            borderColor: 'rgba(50,150,50,0.3)',
            boxShadow: '0 0 15px rgba(50,150,50,0.08), inset 0 0 20px rgba(0,0,0,0.3)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Crosshair size={16} style={{ color: '#4ade80' }} />
              <span
                className="font-mono text-xl font-bold"
                style={{ color: '#e0e0e0' }}
              >
                {magazine}
                <span className="text-gray-600">/{MAX_MAGAZINE}</span>
              </span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onReload(); }}
              disabled={isReloading || magazine >= MAX_MAGAZINE}
              className={`px-3 py-2 rounded-md font-bold text-sm transition-all flex items-center gap-2 border ${
                isReloading || magazine >= MAX_MAGAZINE
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed border-gray-700'
                  : 'text-white border-green-600/50 hover:border-green-500/80'
              }`}
              style={!isReloading && magazine < MAX_MAGAZINE ? {
                background: 'linear-gradient(135deg, #1a4a1a, #2d5a2d)',
                boxShadow: '0 0 10px rgba(50,150,50,0.15)',
              } : {}}
            >
              <RefreshCw
                size={14}
                className={isReloading ? 'animate-spin' : ''}
              />
              换弹
            </button>
          </div>
          {isReloading && (
            <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-75"
                style={{
                  width: `${reloadProgress * 100}%`,
                  background: 'linear-gradient(90deg, #2d5a2d, #4ade80)',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
