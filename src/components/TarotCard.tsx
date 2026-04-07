import { motion, AnimatePresence } from 'motion/react';
import React from 'react';
import { CARD_BACK_URL } from '../constants';

interface TarotCardProps {
  card?: {
    name: string;
    image: string;
    description: string;
  };
  isFlipped: boolean;
  isPicked: boolean;
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
  isHovered?: boolean;
}

export const TarotCard: React.FC<TarotCardProps> = ({
  card,
  isFlipped,
  isPicked,
  x,
  y,
  rotation,
  zIndex,
  isHovered,
}) => {
  return (
    <motion.div
      className="absolute w-48 h-80 cursor-pointer preserve-3d"
      initial={false}
      animate={{
        x,
        y,
        rotateZ: rotation,
        scale: isPicked ? 1.1 : isHovered ? 1.05 : 1,
        zIndex,
      }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Proximity Glow */}
      <AnimatePresence>
        {(isHovered || isPicked) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: isPicked ? [0.2, 0.5, 0.2] : 1, 
              scale: isPicked ? [1.2, 1.4, 1.2] : 1.2 
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={isPicked ? { repeat: Infinity, duration: 2 } : {}}
            className={`absolute inset-0 ${isPicked ? 'bg-amber-400/40' : 'bg-amber-500/20'} blur-3xl rounded-full`}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Card Back */}
        <div
          className="absolute inset-0 w-full h-full rounded-xl border-2 border-amber-200/30 overflow-hidden backface-hidden shadow-2xl"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <img
            src={CARD_BACK_URL}
            alt="Card Back"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Card Front */}
        <div
          className="absolute inset-0 w-full h-full rounded-xl border-2 border-amber-400/50 bg-neutral-900 overflow-hidden shadow-2xl"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Flip Pulse Effect */}
          <AnimatePresence>
            {isFlipped && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.5, 0], scale: [1, 2, 3] }}
                transition={{ duration: 1, times: [0, 0.5, 1] }}
                className="absolute inset-0 bg-amber-400/30 blur-2xl rounded-full z-10 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {card && (
            <div className="flex flex-col h-full">
              <div className="relative flex-1 overflow-hidden">
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
              </div>
              <div className="p-4 bg-neutral-900 text-center">
                <h3 className="text-amber-400 font-serif text-lg font-bold tracking-widest uppercase">
                  {card.name}
                </h3>
                <p className="text-amber-200/70 text-xs mt-1 italic">
                  {card.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
