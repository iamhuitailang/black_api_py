interface ReloadOverlayProps {
  progress: number;
}

export default function ReloadOverlay({ progress }: ReloadOverlayProps) {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
      <div
        className="relative px-8 py-4 rounded-lg border"
        style={{
          background: 'rgba(0,0,0,0.8)',
          borderColor: 'rgba(200,150,50,0.5)',
          boxShadow: '0 0 20px rgba(200,150,50,0.15)',
        }}
      >
        <div
          className="text-yellow-400 font-bold text-lg tracking-wider"
          style={{ animation: 'pulse 0.8s ease-in-out infinite' }}
        >
          换弹中...
        </div>
        <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden" style={{ width: '160px' }}>
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, #b8860b, #daa520, #ffd700)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
