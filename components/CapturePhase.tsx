import { useEffect, useState } from 'react';
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

    onCapture(shuffledPieces);
  };

  return (
    <div className="relative w-[800px] h-[600px] z-20 pointer-events-none flex items-center justify-center">
      {/* Target Box UI overlay */}
      <div 
        className={`w-[450px] h-[450px] border-4 ${
          hasCaptured ? 'border-neon-green bg-neon-green/20' : 'border-white border-dashed'
        }`}
      />
    </div>
  );
}
