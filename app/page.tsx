'use client';

import { useState, useRef, useEffect } from 'react';
import { useHandTracking } from '@/hooks/useHandTracking';
import { PuzzlePiece, GamePhase } from '@/types';
import { AnimatePresence } from 'framer-motion';
import CapturePhase from '@/components/CapturePhase';
import PlayingPhase from '@/components/PlayingPhase';
import CompletedPhase from '@/components/CompletedPhase';

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>('CAPTURE');
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [timeMs, setTimeMs] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handState = useHandTracking(videoRef, canvasRef);

  // Timer logic for playing phase
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'PLAYING') {
      interval = setInterval(() => {
        setTimeMs((t) => t + 100);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [phase]);

  const handleCapture = (capturedPieces: PuzzlePiece[]) => {
    setPieces(capturedPieces);
    setPhase('PLAYING');
    setTimeMs(0);
  };

  const handleComplete = () => {
    setPhase('COMPLETED');
  };

  const handleRestart = () => {
    setPieces([]);
    setTimeMs(0);
    setPhase('CAPTURE');
  };

  return (
    <main className="min-h-screen bg-transparent flex items-center justify-center relative overflow-hidden">
      
      {/* 
        We keep the video and canvas at the top level so MediaPipe doesn't re-initialize.
        We only show them fully in the CAPTURE phase.
        In other phases, we keep them running but hidden so we still get handState!
      */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] transition-opacity duration-1000 ${phase === 'CAPTURE' ? 'opacity-100 z-0' : 'opacity-0 -z-50 pointer-events-none'}`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1] rounded-2xl shadow-[0_0_50px_rgba(181,255,74,0.1)] border border-white/10"
        />
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="absolute top-0 left-0 w-full h-full scale-x-[-1] rounded-2xl pointer-events-none z-10"
        />
      </div>

      <AnimatePresence>
        {phase === 'CAPTURE' && (
          <CapturePhase 
            key="capture"
            handState={handState} 
            videoRef={videoRef} 
            onCapture={handleCapture} 
          />
        )}

        {(phase === 'PLAYING' || phase === 'COMPLETED') && (
          <PlayingPhase 
            key="playing"
            handState={handState} 
            pieces={pieces} 
            setPieces={setPieces}
            onComplete={handleComplete} 
            timeMs={timeMs}
            isCompleted={phase === 'COMPLETED'}
          />
        )}

        {phase === 'COMPLETED' && (
          <CompletedPhase 
            key="completed"
            handState={handState}
            timeMs={timeMs} 
            onRestart={handleRestart} 
          />
        )}
      </AnimatePresence>

    </main>
  );
}
