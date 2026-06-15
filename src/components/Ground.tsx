export default function Ground() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[70%] overflow-hidden">
      <div
        className="absolute w-full h-full"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(30,40,25,0.2) 20%, rgba(25,35,20,0.5) 50%, rgba(20,28,18,0.7) 100%)',
          transform: 'rotateX(65deg)',
          transformOrigin: 'top center',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(80,100,70,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(80,100,70,0.15) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            transform: 'translateY(40%)',
          }}
        />
      </div>
      <div
        className="absolute bottom-[22%] left-0 right-0 h-[2px] z-10"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(220,50,50,0.4) 20%, rgba(220,50,50,0.6) 50%, rgba(220,50,50,0.4) 80%, transparent 100%)',
          boxShadow: '0 0 8px rgba(220,50,50,0.3), 0 0 20px rgba(220,50,50,0.15)',
        }}
      />
      <div
        className="absolute bottom-[19%] left-1/2 -translate-x-1/2 text-red-500/40 text-xs font-bold tracking-[0.3em] z-10"
        style={{ textShadow: '0 0 6px rgba(220,50,50,0.5)' }}
      >
        ⚠ 防线 ⚠
      </div>
    </div>
  );
}
