/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Results } from '@mediapipe/hands';
import { TarotCard } from './components/TarotCard';
import { MagicTrail } from './components/MagicTrail';
import { useHandTracking } from './hooks/useHandTracking';
import { TAROT_CARDS } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, Hand, Info, Settings, Sparkles } from 'lucide-react';

interface CardState {
  id: number;
  data?: typeof TAROT_CARDS[0];
  isFlipped: boolean;
  isPicked: boolean;
  isHovered: boolean;
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
}

export default function App() {
  const [cards, setCards] = useState<CardState[]>([
    { id: 0, isFlipped: false, isPicked: false, x: -250, y: 0, rotation: -5, zIndex: 1 },
    { id: 1, isFlipped: false, isPicked: false, x: 0, y: 0, rotation: 0, zIndex: 2 },
    { id: 2, isFlipped: false, isPicked: false, x: 250, y: 0, rotation: 5, zIndex: 3 },
  ]);

  const [handPos, setHandPos] = useState({ x: 0.5, y: 0.5 });
  const [isFingerUp, setIsFingerUp] = useState(false);
  const [isFist, setIsFist] = useState(false);
  const [pickedCardId, setPickedCardId] = useState<number | null>(null);
  const [showCamera, setShowCamera] = useState(true);
  const [debugMode, setDebugMode] = useState(false);

  const lastFingerState = useRef(false);
  const lastFistState = useRef(false);

  const onResults = useCallback((results: Results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      // Palm center (average of some key points)
      const palmX = (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3;
      const palmY = (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3;
      setHandPos({ x: palmX, y: palmY });

      // Index finger detection (Landmark 8 is tip, 6 is PIP, 5 is MCP)
      // In MediaPipe, y is 0 at top, 1 at bottom. So smaller y means higher.
      const fingerUp = landmarks[8].y < landmarks[6].y - 0.05;
      setIsFingerUp(fingerUp);

      // Fist detection (all fingertips close to palm)
      const fingertips = [8, 12, 16, 20];
      const fist = fingertips.every(idx => {
        const dist = Math.sqrt(
          Math.pow(landmarks[idx].x - landmarks[0].x, 2) +
          Math.pow(landmarks[idx].y - landmarks[0].y, 2)
        );
        return dist < 0.15;
      });
      setIsFist(fist);

      // Logic for picking and flipping
      if (fingerUp && !lastFingerState.current) {
        // Finger just went up -> Pick a random card if none picked
        setCards(prev => {
          const hasPicked = prev.some(c => c.isPicked);
          if (hasPicked) return prev;

          const randomIndex = Math.floor(Math.random() * prev.length);
          const randomData = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
          
          return prev.map((c, i) => ({
            ...c,
            isPicked: i === randomIndex,
            data: i === randomIndex ? randomData : c.data,
            zIndex: i === randomIndex ? 10 : c.zIndex,
          }));
        });
        setPickedCardId(prev => (prev === null ? Math.floor(Math.random() * 3) : prev));
      } else if (!fingerUp && lastFingerState.current) {
        // Finger just bent -> Flip the picked card
        setCards(prev => prev.map(c => ({
          ...c,
          isFlipped: c.isPicked ? true : c.isFlipped,
        })));
      }

      lastFingerState.current = fingerUp;
      lastFistState.current = fist;
    }
  }, []);

  const { videoRef, isLoaded, error } = useHandTracking(onResults);

  // Shuffling effect based on hand position
  useEffect(() => {
    setCards(prev => prev.map((c, i) => {
      if (c.isPicked) {
        // Picked card moves to center and stays there
        return { ...c, x: 0, y: -100, rotation: 0, isHovered: false };
      }
      
      // Other cards "shuffle" or move based on hand X and Y
      const offset = (i - 1) * 220;
      const handInfluenceX = (handPos.x - 0.5) * 500;
      const handInfluenceY = (handPos.y - 0.5) * 200;
      
      // Calculate distance to hand for hover effect
      const cardScreenX = (window.innerWidth / 2) + offset + handInfluenceX;
      const handScreenX = handPos.x * window.innerWidth;
      const dist = Math.abs(cardScreenX - handScreenX);
      const isHovered = dist < 150;

      // Add some "fanning" effect
      const fanRotation = (i - 1) * 15 + (handPos.x - 0.5) * 30;
      
      return {
        ...c,
        x: offset + handInfluenceX,
        y: handInfluenceY + Math.abs(handPos.x - 0.5) * 100,
        rotation: fanRotation,
        zIndex: i + (handPos.x > 0.5 ? i : -i), // Dynamic z-index for overlapping
        isHovered,
      };
    }));
  }, [handPos, pickedCardId]);

  const reset = useCallback(() => {
    setCards([
      { id: 0, isFlipped: false, isPicked: false, isHovered: false, x: -250, y: 0, rotation: -5, zIndex: 1 },
      { id: 1, isFlipped: false, isPicked: false, isHovered: false, x: 0, y: 0, rotation: 0, zIndex: 2 },
      { id: 2, isFlipped: false, isPicked: false, isHovered: false, x: 250, y: 0, rotation: 5, zIndex: 3 },
    ]);
    setPickedCardId(null);
    lastFingerState.current = false;
  }, []);

  // Fist reset effect
  useEffect(() => {
    if (isFist) {
      const timer = setTimeout(() => {
        reset();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isFist, reset]);

  return (
    <div className="relative w-full h-screen bg-neutral-950 overflow-hidden flex flex-col items-center justify-center font-sans text-amber-50">
      {/* Magic Particle Trail */}
      <MagicTrail x={handPos.x} y={handPos.y} />

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(45,26,10,0.3)_0%,_transparent_70%)]" />
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }} />

      {/* Camera Preview */}
      <AnimatePresence>
        {showCamera && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-6 right-6 w-48 h-36 rounded-2xl border-2 border-amber-500/30 overflow-hidden shadow-2xl z-50 bg-black"
          >
            <video
              ref={videoRef}
              className="w-full h-full object-cover scale-x-[-1]"
              autoPlay
              playsInline
              muted
            />
            {!isLoaded && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 p-2 text-center text-[10px]">
                {error}
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${isLoaded ? 'bg-green-500' : 'bg-red-500'}`} />
              {isLoaded ? 'Tracking Active' : 'Initializing...'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Stage */}
      <div className="relative w-full max-w-5xl h-[600px] flex items-center justify-center">
        {cards.map((card) => (
          <TarotCard key={card.id} {...card} />
        ))}
      </div>

      {/* Instructions Overlay */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <motion.div
          animate={{ opacity: pickedCardId === null ? 1 : 0.3 }}
          className="space-y-2"
        >
          <p className="text-amber-200/60 text-sm tracking-[0.2em] uppercase font-light">
            Move your palm to shuffle
          </p>
          <div className="flex items-center justify-center gap-8 mt-4">
            <div className="flex flex-col items-center gap-2">
              <div className={`p-3 rounded-full border ${isFingerUp ? 'bg-amber-500/20 border-amber-500' : 'border-amber-500/20'}`}>
                <Hand className={`w-6 h-6 ${isFingerUp ? 'text-amber-400' : 'text-amber-700'}`} />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-amber-500/50">Stand Finger to Pick</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className={`p-3 rounded-full border ${!isFingerUp && pickedCardId !== null ? 'bg-amber-500/20 border-amber-500' : 'border-amber-500/20'}`}>
                <RefreshCw className={`w-6 h-6 ${!isFingerUp && pickedCardId !== null ? 'text-amber-400' : 'text-amber-700'}`} />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-amber-500/50">Bend Finger to Flip</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className={`p-3 rounded-full border ${isFist ? 'bg-amber-500/20 border-amber-500' : 'border-amber-500/20'}`}>
                <Sparkles className={`w-6 h-6 ${isFist ? 'text-amber-400' : 'text-amber-700'}`} />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-amber-500/50">Fist to Reset</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Global Controls */}
      <div className="absolute bottom-8 flex items-center gap-4 px-6 py-3 bg-neutral-900/50 backdrop-blur-md rounded-full border border-amber-500/20 shadow-xl">
        <button 
          onClick={reset}
          className="p-2 hover:bg-amber-500/10 rounded-full transition-colors group"
          title="Reset Deck"
        >
          <RefreshCw className="w-5 h-5 text-amber-400 group-hover:rotate-180 transition-transform duration-500" />
        </button>
        <div className="w-px h-4 bg-amber-500/20" />
        <button 
          onClick={() => setShowCamera(!showCamera)}
          className={`p-2 rounded-full transition-colors ${showCamera ? 'text-amber-400 bg-amber-500/10' : 'text-amber-700'}`}
          title="Toggle Camera"
        >
          <Camera className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setDebugMode(!debugMode)}
          className={`p-2 rounded-full transition-colors ${debugMode ? 'text-amber-400 bg-amber-500/10' : 'text-amber-700'}`}
          title="Toggle Debug Info"
        >
          <Info className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-amber-500/10 rounded-full transition-colors text-amber-700 hover:text-amber-400">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Debug Info */}
      {debugMode && (
        <div className="absolute top-6 left-6 p-4 bg-black/80 rounded-xl border border-amber-500/30 text-xs font-mono text-amber-400/70 space-y-1">
          <p>Hand X: {handPos.x.toFixed(3)}</p>
          <p>Hand Y: {handPos.y.toFixed(3)}</p>
          <p>Finger Up: {isFingerUp ? 'YES' : 'NO'}</p>
          <p>Picked ID: {pickedCardId ?? 'None'}</p>
        </div>
      )}

      {/* Title */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center">
        <h1 className="text-4xl font-serif font-bold tracking-[0.3em] text-amber-500 uppercase drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
          Mystic Hand
        </h1>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-2" />
      </div>
    </div>
  );
}
