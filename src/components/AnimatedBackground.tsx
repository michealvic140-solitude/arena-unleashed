// Animated luxury background with floating gun/skull/target SVG icons + particle dots
import { useMemo } from "react";

const ICONS = ["💀", "🎯", "🔫", "💎", "🏆", "⚡"];

interface Particle { left: number; top: number; size: number; delay: number; duration: number; icon: string; opacity: number }

export function AnimatedBackground() {
  const particles = useMemo<Particle[]>(() => {
    const arr: Particle[] = [];
    for (let i = 0; i < 22; i++) {
      arr.push({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 14 + Math.random() * 28,
        delay: Math.random() * 8,
        duration: 14 + Math.random() * 18,
        icon: ICONS[Math.floor(Math.random() * ICONS.length)],
        opacity: 0.05 + Math.random() * 0.10,
      });
    }
    return arr;
  }, []);

  const dots = useMemo(() => {
    const arr: { left: number; top: number; size: number; delay: number; duration: number }[] = [];
    for (let i = 0; i < 40; i++) {
      arr.push({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        delay: Math.random() * 10,
        duration: 8 + Math.random() * 14,
      });
    }
    return arr;
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Glow blobs */}
      <div className="absolute -top-20 -left-20 h-[36rem] w-[36rem] rounded-full bg-primary/10 blur-3xl animate-[float_18s_ease-in-out_infinite]" />
      <div className="absolute -bottom-32 -right-20 h-[40rem] w-[40rem] rounded-full bg-accent/10 blur-3xl animate-[float_22s_ease-in-out_infinite_reverse]" />
      <div className="absolute top-1/3 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

      {/* Particle dots */}
      {dots.map((d, i) => (
        <span key={i} className="absolute rounded-full bg-accent/60 particle-dot"
          style={{ left: `${d.left}%`, top: `${d.top}%`, width: d.size, height: d.size, animationDelay: `${d.delay}s`, animationDuration: `${d.duration}s` }} />
      ))}

      {/* Floating icons */}
      {particles.map((p, i) => (
        <span key={i} className="absolute select-none particle-float"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            fontSize: p.size,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            filter: "drop-shadow(0 0 8px oklch(0.83 0.16 88 / 0.4))",
          }}>
          {p.icon}
        </span>
      ))}

      {/* Subtle scan grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(to right, oklch(0.83 0.16 88) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.83 0.16 88) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
    </div>
  );
}
