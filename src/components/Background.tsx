import { useMemo } from 'react';

export default function Background() {
  const stars = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      w: 1 + Math.random() * 2,
      left: Math.random() * 100,
      top: Math.random() * 55,
      opacity: 0.2 + Math.random() * 0.5,
    }));
  }, []);

  const fogLayers = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      bottom: 10 + i * 8,
      opacity: 0.03 + i * 0.02,
    }));
  }, []);

  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0a0a15 0%, #111125 20%, #1a1a2e 40%, #1d2618 70%, #1a1a12 100%)',
        }}
      />
      <div className="absolute inset-0 opacity-30">
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute bg-gray-400 rounded-full"
            style={{
              width: `${s.w}px`,
              height: `${s.w}px`,
              left: `${s.left}%`,
              top: `${s.top}%`,
              opacity: s.opacity,
            }}
          />
        ))}
      </div>
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 85%, rgba(180,80,40,0.08) 0%, transparent 60%)',
        }}
      />
      {fogLayers.map((f) => (
        <div
          key={f.id}
          className="absolute left-0 right-0"
          style={{
            bottom: `${f.bottom}%`,
            height: '80px',
            background: `linear-gradient(180deg, transparent, rgba(80,100,80,${f.opacity}), transparent)`,
          }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(100,120,100,0.03) 1px, transparent 1px)',
          backgroundSize: '4px 4px',
        }}
      />
    </div>
  );
}
