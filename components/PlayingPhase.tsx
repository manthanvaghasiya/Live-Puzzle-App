import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { PuzzlePiece, HandState } from '../types';

interface PlayingPhaseProps {
  handState: HandState;
  pieces: PuzzlePiece[];
  setPieces: React.Dispatch<React.SetStateAction<PuzzlePiece[]>>;
  onComplete: () => void;
  timeMs: number;
  isCompleted?: boolean;
}

export default function PlayingPhase({ handState, pieces, setPieces, onComplete, timeMs, isCompleted }: PlayingPhaseProps) {
  const [activePieceId, setActivePieceId] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const wasPinching = useRef(false);

  // Map handState to screen coordinates
  useEffect(() => {
    const x = (1 - handState.x) * window.innerWidth;
    const y = handState.y * window.innerHeight;
    setCursorPos({ x, y });
  }, [handState.x, handState.y]);

  // Handle Pinch Start / End & Hover Logic
  useEffect(() => {
    if (isCompleted) return;

    const isPinching = handState.isPinching;
    const el = document.elementFromPoint(cursorPos.x, cursorPos.y);

    // Hover logic for drop zone indication
    if (activePieceId && el) {
      const slotIndexStr = el.getAttribute('data-slot-index');
      if (slotIndexStr) {
        setHoveredSlot(parseInt(slotIndexStr, 10));
      } else {
        setHoveredSlot(null);
      }
    } else {
      setHoveredSlot(null);
    }

    if (isPinching && !wasPinching.current) {
      // Pinch started
      const pieceId = el?.getAttribute('data-piece-id');
      if (pieceId) {
        setActivePieceId(pieceId);
      }
    } else if (!isPinching && wasPinching.current) {
      // Pinch ended
      if (activePieceId) {
        const slotIndexStr = el?.getAttribute('data-slot-index');
        
        if (slotIndexStr !== null && slotIndexStr !== undefined) {
          const targetSlotIndex = parseInt(slotIndexStr, 10);
          
          setPieces(prev => {
            const newPieces = [...prev];
            const activePiece = newPieces.find(p => p.id === activePieceId);
            const targetPiece = newPieces.find(p => p.currentIndex === targetSlotIndex);

            if (activePiece && targetPiece && activePiece !== targetPiece) {
              // Swap
              const temp = activePiece.currentIndex;
              activePiece.currentIndex = targetPiece.currentIndex;
              targetPiece.currentIndex = temp;
            }
            return newPieces;
          });
        }
        setActivePieceId(null);
        setHoveredSlot(null);
      }
    }

    wasPinching.current = isPinching;
  }, [handState.isPinching, cursorPos, activePieceId, setPieces, isCompleted]);

  // Check win condition & trigger Confetti
  useEffect(() => {
    if (pieces.length === 0) return;
    const isWin = pieces.every(p => p.originalIndex === p.currentIndex);
    if (isWin && activePieceId === null && !isCompleted) {
      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#b5ff4a', '#ffffff', '#00f0ff']
      });
      onComplete();
    }
  }, [pieces, activePieceId, onComplete, isCompleted]);

  // Format time
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const msStr = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${msStr}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 w-full h-full z-20 flex flex-col items-center justify-center pointer-events-none"
    >
      
      {/* Timer UI */}
      <div className="absolute top-10 text-neon-green font-mono text-5xl tracking-tighter bg-black/40 backdrop-blur-md px-8 py-3 rounded-2xl border border-neon-green/30 shadow-[0_0_30px_rgba(181,255,74,0.15)] flex flex-col items-center">
        <span className="text-xs text-white tracking-widest uppercase mb-1 opacity-70">Elapsed Time</span>
        {formatTime(timeMs)}
      </div>

      {/* Grid Container */}
      <div className="relative w-[600px] h-[600px] bg-zinc-900/50 backdrop-blur-2xl border border-zinc-700/50 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-2xl p-3 pointer-events-auto">
        <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-3 relative">
          
          {/* Render 9 slots */}
          {Array.from({ length: 9 }).map((_, i) => {
            const isHovered = hoveredSlot === i;
            return (
              <div 
                key={`slot-${i}`} 
                data-slot-index={i}
                className={`w-full h-full rounded-xl flex items-center justify-center relative transition-all duration-300 ${
                  isHovered ? 'bg-neon-green/20 shadow-[inset_0_0_20px_rgba(181,255,74,0.5)] border-2 border-neon-green' : 'bg-zinc-800/40 border border-white/5'
                }`}
              >
                {/* Find the piece that belongs in this slot */}
                {pieces.filter(p => p.currentIndex === i && p.id !== activePieceId).map(p => (
                  <motion.div
                    key={p.id}
                    layoutId={p.id}
                    data-piece-id={p.id}
                    className="absolute inset-0 cursor-pointer overflow-hidden rounded-xl hover:scale-[1.03] hover:shadow-2xl transition-all duration-300 z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    whileHover={{ scale: 1.05, rotate: Math.random() * 2 - 1 }}
                  >
                    <img src={p.imageSliceDataUrl} className="w-full h-full object-cover" alt="" style={{ pointerEvents: 'none' }} />
                  </motion.div>
                ))}
              </div>
            );
          })}

        </div>
      </div>

      {/* Render Active Piece outside the grid to follow cursor */}
      <AnimatePresence>
        {activePieceId && (
          <motion.div
            key={activePieceId}
            layoutId={activePieceId}
            className="fixed z-50 rounded-xl pointer-events-none overflow-hidden border border-neon-green/50 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(181,255,74,0.3)]"
            style={{
              width: 190,
              height: 190,
              left: cursorPos.x - 95,
              top: cursorPos.y - 95,
            }}
            initial={{ scale: 1.1, opacity: 0.9, rotate: 5 }}
            animate={{ scale: 1.15, opacity: 0.95, rotate: 5 }}
            exit={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <img 
              src={pieces.find(p => p.id === activePieceId)?.imageSliceDataUrl} 
              className="w-full h-full object-cover" 
              alt="" 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Virtual Cursor */}
      {!isCompleted && (
        <div 
          className="fixed z-[100] w-8 h-8 rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-colors duration-150 backdrop-blur-sm"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            border: handState.isPinching ? '3px solid #b5ff4a' : '2px solid rgba(255,255,255,0.8)',
            backgroundColor: handState.isPinching ? 'rgba(181,255,74,0.3)' : 'transparent',
            boxShadow: handState.isPinching ? '0 0 25px rgba(181,255,74,0.9)' : '0 0 10px rgba(255,255,255,0.4)',
            transform: `translate(-50%, -50%) scale(${handState.isPinching ? 0.8 : 1})`,
          }}
        />
      )}
    </motion.div>
  );
}
