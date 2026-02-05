import { memo, useMemo } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

interface SparkParticlesProps {
  count?: number;
  className?: string;
}

// Memoized component to prevent re-initialization on parent re-renders
export const SparkParticles = memo(function SparkParticles({ count = 12, className = "" }: SparkParticlesProps) {
  const particles = useMemo(() => {
    const colors = [
      "hsl(var(--accent))",
      "hsl(var(--warning))",
      "hsl(45 100% 70%)",
      "hsl(25 100% 65%)",
    ];

    return Array.from({ length: count }, (_, i): Particle => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 2,
      duration: Math.random() * 3 + 3,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full will-change-transform"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1.2, 0],
            y: [0, -30, -60, -100],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 3,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
});

// Memoized welding arc flash effect
export const WeldingArc = memo(function WeldingArc({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`absolute pointer-events-none will-change-transform ${className}`}
      style={{
        width: 60,
        height: 60,
        background: "radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)",
        filter: "blur(2px)",
      }}
      animate={{
        opacity: [0.3, 0.8, 0.4, 0.9, 0.3],
        scale: [0.8, 1.2, 0.9, 1.1, 0.8],
      }}
      transition={{
        duration: 0.5,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      }}
    />
  );
});
