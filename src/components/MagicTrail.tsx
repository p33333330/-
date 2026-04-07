import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

export const MagicTrail: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticle = {
      id: Date.now(),
      x: x * window.innerWidth,
      y: y * window.innerHeight,
      size: Math.random() * 8 + 4,
      color: Math.random() > 0.5 ? '#fbbf24' : '#f59e0b', // amber-400 or amber-500
    };

    setParticles((prev) => [...prev.slice(-20), newParticle]);
  }, [x, y]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0.8, scale: 1, x: p.x, y: p.y }}
            animate={{ opacity: 0, scale: 0, y: p.y - 50 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute rounded-full blur-[1px]"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              boxShadow: `0 0 10px ${p.color}`,
              left: -p.size / 2,
              top: -p.size / 2,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
