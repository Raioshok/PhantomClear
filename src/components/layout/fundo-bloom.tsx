import { PonyAtmosphere } from './pony-atmosphere'

export function FundoBloom() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="bloom-verde bloom-1" />
      <div className="bloom-verde bloom-2" />
      <div className="bloom-verde bloom-3" />
      <div className="bloom-verde bloom-4" />
      <div className="bloom-verde bloom-5" />
      
      <div 
        className="bloom-grade absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(color-mix(in srgb, var(--primary) 12%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in srgb, var(--primary) 12%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at 50% 30%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, black 30%, transparent 80%)',
        }}
      />

      <div className="theme-bg-overlay absolute inset-0" />
      <PonyAtmosphere />
    </div>
  )
}
