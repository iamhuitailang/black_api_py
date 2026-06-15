interface MuzzleFlashProps {
  intensity: number;
  x: number;
  y: number;
}

export default function MuzzleFlash({ intensity, x, y }: MuzzleFlashProps) {
  if (intensity <= 0) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
        opacity: intensity,
        zIndex: 55,
      }}
    >
      <div className="relative">
        <div
          className="rounded-full blur-2xl"
          style={{
            width: '120px',
            height: '120px',
            background:
              'radial-gradient(circle, rgba(255,220,100,0.9) 0%, rgba(255,150,50,0.5) 40%, transparent 70%)',
            transform: 'translateY(-10%)',
          }}
        />
        <div
          className="rounded-full blur-md"
          style={{
            width: '30px',
            height: '30px',
            background: 'rgba(255,255,255,0.95)',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
    </div>
  );
}
