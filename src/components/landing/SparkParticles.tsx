import { motion } from "framer-motion";
import { useMemo } from "react";

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

export function SparkParticles({ count = 20, className = "" }: SparkParticlesProps) {
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
      size: Math.random() * 4 + 2,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}, 0 0 ${particle.size * 4}px ${particle.color}`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1.2, 0],
            y: [0, -30, -60, -100],
            x: [0, Math.random() * 20 - 10, Math.random() * 30 - 15],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 2,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Larger floating embers */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={`ember-${i}`}
          className="absolute w-1 h-1 rounded-full bg-accent"
          style={{
            left: `${20 + i * 15}%`,
            bottom: "10%",
            boxShadow: "0 0 10px hsl(var(--accent)), 0 0 20px hsl(var(--accent)), 0 0 30px hsl(var(--warning))",
          }}
          animate={{
            y: [0, -200, -400],
            x: [0, Math.sin(i) * 50, Math.cos(i) * 30],
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0],
          }}
          transition={{
            duration: 4 + i * 0.5,
            delay: i * 0.8,
            repeat: Infinity,
            repeatDelay: 1,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Spark trails */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`trail-${i}`}
          className="absolute"
          style={{
            left: `${30 + i * 20}%`,
            bottom: "5%",
          }}
        >
          {Array.from({ length: 4 }).map((_, j) => (
            <motion.div
              key={j}
              className="absolute w-0.5 h-0.5 rounded-full"
              style={{
                backgroundColor: j % 2 === 0 ? "hsl(var(--accent))" : "hsl(var(--warning))",
                boxShadow: `0 0 4px ${j % 2 === 0 ? "hsl(var(--accent))" : "hsl(var(--warning))"}`,
              }}
              animate={{
                y: [0, -150 - j * 30],
                x: [0, (i - 1) * 20 + Math.sin(j) * 10],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.3],
              }}
              transition={{
                duration: 2.5 + j * 0.3,
                delay: i * 0.5 + j * 0.15,
                repeat: Infinity,
                repeatDelay: 2,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.div>
      ))}
    </div>
  );
}

// Welding arc flash effect
export function WeldingArc({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
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
}
