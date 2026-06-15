interface MuzzleFlashProps {
  intensity: number;
}

export default function MuzzleFlash({ intensity }: MuzzleFlashProps) {
  if (intensity <= 0) return null;

  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none">
      <div
        className="relative"
        style={{ opacity: intensity }}
      >
        <div
          className="rounded-full blur-2xl"
          style={{
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(255,220,100,0.8) 0%, rgba(255,150,50,0.4) 40%, transparent 70%)',
            transform: 'translateY(20%)',
          }}
        />
        <div
          className="rounded-full blur-xl"
          style={{
            width: '60px',
            height: '200px',
            background: 'linear-gradient(to top, rgba(255,200,80,0.3) 0%, transparent 100%)',
            position: 'absolute',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      </div>
    </div>
  );
}
