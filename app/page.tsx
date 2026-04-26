'use client';

import { useState, useRef, useEffect } from 'react';
import { useHandTracking } from '@/hooks/useHandTracking';
import { PuzzlePiece, GamePhase } from '@/types';
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
    <main className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center relative overflow-hidden font-mono">
      
      {/* Top Header */}
      <div className="absolute top-8 w-full text-center z-50">
        <h1 className="text-4xl font-bold text-[#b5ff4a] tracking-widest">LIVE PUZZLE</h1>
        <p className="text-white mt-2 text-sm tracking-widest">Frame in to Snap. Pinch & Drag to Swap.</p>
      </div>

      {/* Top Right Info Box */}
      <div className="absolute top-8 right-8 z-50 bg-zinc-800/80 border border-zinc-700 p-4 rounded-lg shadow-lg max-w-sm">
        {phase === 'CAPTURE' && (
          <p className="text-[#b5ff4a] text-sm leading-relaxed">
            PHASE 1: CAPTURE <br/>
            <span className="text-white">1. Hold a frame with the hands</span> <br/>
            <span className="text-white">2. Pinch index & thumb to snap.</span>
          </p>
        )}
        {(phase === 'PLAYING' || phase === 'COMPLETED') && (
          <p className="text-[#b5ff4a] text-sm leading-relaxed">
            PHASE 2: SOLVE <br/>
            <span className="text-white">1. Hover to grab</span> <br/>
            <span className="text-white">2. Drag & Drop to Swap.</span>
          </p>
        )}
      </div>
      
      {/* 
        CRITICAL: The <video> and <canvas> elements for MediaPipe must remain rendered in the DOM 
        at all times so tracking doesn't stop, but they should be hidden via CSS 
        (opacity-0 pointer-events-none) during the 'PLAYING' and 'COMPLETED' phases.
      */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] ${phase === 'CAPTURE' ? 'opacity-100 z-0' : 'opacity-0 -z-50 pointer-events-none'}`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1]"
        />
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="absolute top-0 left-0 w-full h-full scale-x-[-1] pointer-events-none z-10"
        />
      </div>

      {phase === 'CAPTURE' && (
        <CapturePhase 
          handState={handState} 
          videoRef={videoRef} 
          onCapture={handleCapture} 
        />
      )}

      {(phase === 'PLAYING' || phase === 'COMPLETED') && (
        <PlayingPhase 
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
          handState={handState}
          timeMs={timeMs} 
          onRestart={handleRestart} 
        />
      )}

    </main>
  );
}
