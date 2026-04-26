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

  // Map handState to screen coordinates
  useEffect(() => {
    // 1 - x because the video is mirrored horizontally
    const x = (1 - handState.x) * window.innerWidth;
    const y = handState.y * window.innerHeight;
    setCursorPos({ x, y });
  }, [handState.x, handState.y]);

  // Handle Pinch Start / End
  useEffect(() => {
    if (isCompleted) return;

    const isPinching = handState.isPinching;

    if (isPinching && !wasPinching.current) {
      // Pinch started
      const el = document.elementFromPoint(cursorPos.x, cursorPos.y);
      const pieceId = el?.getAttribute('data-piece-id');
      if (pieceId) {
        setActivePieceId(pieceId);
      }
    } else if (!isPinching && wasPinching.current) {
      // Pinch ended
      if (activePieceId) {
        const el = document.elementFromPoint(cursorPos.x, cursorPos.y);
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
      }
    }

    wasPinching.current = isPinching;
  }, [handState.isPinching, cursorPos, activePieceId, setPieces]);

  // Check win condition
  useEffect(() => {
    if (pieces.length === 0) return;
    const isWin = pieces.every(p => p.originalIndex === p.currentIndex);
    if (isWin && activePieceId === null) {
      onComplete();
    }
  }, [pieces, activePieceId, onComplete]);

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
      <div className="absolute top-8 text-neon-green font-mono text-4xl font-bold bg-black/50 px-6 py-2 rounded-xl border border-neon-green/30 shadow-[0_0_15px_rgba(181,255,74,0.3)]">
        {formatTime(timeMs)}
      </div>

      {/* Grid Container */}
      <div className="relative w-[600px] h-[600px] bg-zinc-900 border border-zinc-700 shadow-2xl rounded-xl p-2 pointer-events-auto">
        <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-2 relative">
          
          {/* Render 9 slots */}
          {Array.from({ length: 9 }).map((_, i) => (
            <div 
              key={`slot-${i}`} 
              data-slot-index={i}
              className="w-full h-full bg-zinc-800/50 rounded-lg flex items-center justify-center overflow-hidden relative"
            >
              {/* Find the piece that belongs in this slot */}
              {pieces.filter(p => p.currentIndex === i && p.id !== activePieceId).map(p => (
                <motion.div
                  key={p.id}
                  layoutId={p.id}
                  data-piece-id={p.id}
                  className="absolute inset-0 cursor-pointer overflow-hidden rounded-lg hover:scale-[1.02] transition-transform duration-200"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <img src={p.imageSliceDataUrl} className="w-full h-full object-cover" alt="" pointer-events="none" />
                </motion.div>
              ))}
            </div>
          ))}

        </div>
      </div>

      {/* Render Active Piece outside the grid to follow cursor */}
      <AnimatePresence>
        {activePieceId && (
          <motion.div
            key={activePieceId}
            layoutId={activePieceId}
            className="fixed z-50 rounded-lg shadow-2xl pointer-events-none overflow-hidden"
            style={{
              width: 190, // approx slot size
              height: 190,
              left: cursorPos.x - 95,
              top: cursorPos.y - 95,
            }}
            initial={{ scale: 1.1, opacity: 0.9 }}
            animate={{ scale: 1.1, opacity: 0.9 }}
            exit={{ scale: 1, opacity: 1 }}
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

      {/* Virtual Cursor - only show if not completed */}
      {!isCompleted && (
        <div 
          className="fixed z-[100] w-6 h-6 rounded-full border-2 border-white pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-colors duration-150 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            backgroundColor: handState.isPinching ? '#b5ff4a' : 'transparent',
            borderColor: handState.isPinching ? '#b5ff4a' : 'white',
            boxShadow: handState.isPinching ? '0 0 20px rgba(181,255,74,0.8)' : '0 0 10px rgba(255,255,255,0.5)',
          }}
        />
      )}
    </div>
  );
}
