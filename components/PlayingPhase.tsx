import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const wasPinching = useRef(false);

  // Map handState to screen coordinates. x is already flipped in useHandTracking.
  useEffect(() => {
    const x = handState.x * window.innerWidth;
    const y = handState.y * window.innerHeight;
    setCursorPos({ x, y });
  }, [handState.x, handState.y]);

  // Handle Pinch Start / End & Hover Logic
  useEffect(() => {
    if (isCompleted) return;

    const isPinching = handState.isPinching;
    
    // Temporarily hide the virtual cursor to allow elementFromPoint to see what's underneath it
    // Wait, the cursor is pointer-events-none, so elementFromPoint works fine.
    const el = document.elementFromPoint(cursorPos.x, cursorPos.y);

    if (isPinching && !wasPinching.current) {
      // Pinch started
      const pieceEl = el?.closest('[data-piece-id]');
      const pieceId = pieceEl?.getAttribute('data-piece-id');
      if (pieceId) {
        setActivePieceId(pieceId);
      }
    } else if (!isPinching && wasPinching.current) {
      // Pinch ended
      if (activePieceId) {
        const slotEl = el?.closest('[data-slot-index]');
        const slotIndexStr = slotEl?.getAttribute('data-slot-index');
        
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
      }
    }

    wasPinching.current = isPinching;
  }, [handState.isPinching, cursorPos, activePieceId, setPieces, isCompleted]);

  // Check win condition
  useEffect(() => {
    if (pieces.length === 0) return;
    const isWin = pieces.every(p => p.originalIndex === p.currentIndex);
    if (isWin && activePieceId === null && !isCompleted) {
      onComplete();
    }
  }, [pieces, activePieceId, onComplete, isCompleted]);

  // Format time
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 w-full h-full z-20 flex flex-col items-center justify-center pointer-events-none">
      
      {/* Timer UI */}
      <div className="absolute top-12 font-mono text-xl text-white">
        {formatTime(timeMs)}
      </div>

      {/* Grid Container */}
      <div className="relative w-[600px] h-[600px] bg-black pointer-events-auto">
        <div className="w-full h-full grid grid-cols-3 grid-rows-3 relative">
          
          {/* Render 9 slots */}
          {Array.from({ length: 9 }).map((_, i) => {
            return (
              <div 
                key={`slot-${i}`} 
                data-slot-index={i}
                className="w-full h-full flex items-center justify-center relative bg-black border border-zinc-800"
              >
                {/* Find the piece that belongs in this slot */}
                {pieces.filter(p => p.currentIndex === i && p.id !== activePieceId).map(p => (
                  <motion.div
                    key={p.id}
                    layoutId={p.id}
                    data-piece-id={p.id}
                    className="absolute inset-0 cursor-pointer overflow-hidden"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
            className="fixed z-50 pointer-events-none overflow-hidden shadow-2xl"
            style={{
              width: 200,
              height: 200,
              left: cursorPos.x - 100,
              top: cursorPos.y - 100,
            }}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1.1 }}
            exit={{ scale: 1 }}
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
          className="fixed z-[100] w-6 h-6 rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-colors duration-150"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            border: handState.isPinching ? 'none' : '2px solid white',
            backgroundColor: handState.isPinching ? '#b5ff4a' : 'transparent',
            boxShadow: handState.isPinching ? '0 0 15px rgba(181,255,74,0.8)' : 'none',
          }}
        />
      )}
    </div>
  );
}
