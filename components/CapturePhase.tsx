import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PuzzlePiece, HandState } from '../types';

interface CapturePhaseProps {
  handState: HandState;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onCapture: (pieces: PuzzlePiece[]) => void;
}

export default function CapturePhase({ handState, videoRef, onCapture }: CapturePhaseProps) {
  const [hasCaptured, setHasCaptured] = useState(false);

  useEffect(() => {
    if (hasCaptured || !videoRef.current || !handState.isPinching) return;

    const inBoxX = handState.x >= 0.21875 && handState.x <= 0.78125;
    const inBoxY = handState.y >= 0.125 && handState.y <= 0.875;

    if (inBoxX && inBoxY) {
      setHasCaptured(true);
      captureAndSlice();
    }
  }, [handState, hasCaptured]);

  const captureAndSlice = () => {
    const video = videoRef.current;
    if (!video) return;

    const vw = video.videoWidth || 800;
    const vh = video.videoHeight || 600;
    const size = Math.min(vw, vh) * 0.8; 

    const startX = (vw - size) / 2;
    const startY = (vh - size) / 2;

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = size;
    tmpCanvas.height = size;
    const ctx = tmpCanvas.getContext('2d');
    if (!ctx) return;

    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

    const pieceSize = size / 3;
    const pieces: PuzzlePiece[] = [];
    let idCounter = 0;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = pieceSize;
        sliceCanvas.height = pieceSize;
        const sliceCtx = sliceCanvas.getContext('2d');
        if (sliceCtx) {
          sliceCtx.drawImage(
            tmpCanvas,
            col * pieceSize, row * pieceSize, pieceSize, pieceSize,
            0, 0, pieceSize, pieceSize
          );
          pieces.push({
            id: `piece-${idCounter}`,
            originalIndex: idCounter,
            currentIndex: idCounter,
            imageSliceDataUrl: sliceCanvas.toDataURL('image/jpeg', 0.9)
          });
          idCounter++;
        }
      }
    }

    const shuffledPieces = [...pieces];
    for (let i = shuffledPieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffledPieces[i].currentIndex;
      shuffledPieces[i].currentIndex = shuffledPieces[j].currentIndex;
      shuffledPieces[j].currentIndex = temp;
    }

    setTimeout(() => {
      onCapture(shuffledPieces);
    }, 500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="relative w-[800px] h-[600px] z-20 pointer-events-none"
    >
      {/* Target Box UI overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[450px] h-[450px]">
          {/* Corner Brackets */}
          <div className={`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 transition-colors duration-300 ${hasCaptured ? 'border-neon-green' : 'border-white/60'}`} />
          <div className={`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 transition-colors duration-300 ${hasCaptured ? 'border-neon-green' : 'border-white/60'}`} />
          <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 transition-colors duration-300 ${hasCaptured ? 'border-neon-green' : 'border-white/60'}`} />
          <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 transition-colors duration-300 ${hasCaptured ? 'border-neon-green' : 'border-white/60'}`} />

          {/* Scanning Laser Line */}
          {!hasCaptured && (
            <div className="absolute top-0 left-0 w-full h-[2px] bg-neon-green shadow-[0_0_15px_#b5ff4a] animate-scan-line overflow-hidden" />
          )}

          {/* Capture Flash/Overlay */}
          <AnimatePresence>
            {hasCaptured && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-neon-green/30 backdrop-blur-sm flex items-center justify-center border border-neon-green/50"
              >
                <motion.span 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-neon-green font-mono text-2xl font-bold drop-shadow-[0_0_10px_rgba(181,255,74,0.8)]"
                >
                  CAPTURING...
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute bottom-10 w-full text-center">
        <motion.div 
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block"
        >
          <p className="font-mono text-neon-green bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-neon-green/30 shadow-[0_0_15px_rgba(181,255,74,0.2)]">
            <span className="font-bold text-white mr-2">ACTION:</span> Pinch inside the box to capture
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
