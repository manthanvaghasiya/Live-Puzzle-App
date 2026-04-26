import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, User, ArrowRight, Loader2 } from 'lucide-react';
import { HandState } from '../types';
import { submitScore } from '../src/actions/leaderboard';

interface CompletedPhaseProps {
  handState: HandState; // passed down if they still want hand tracking for the input, but standard DOM is fine
  timeMs: number;
  onRestart: () => void;
}

export default function CompletedPhase({ timeMs, onRestart }: CompletedPhaseProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString()}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await submitScore(name.trim(), timeMs);
      onRestart();
    } catch (err) {
      console.error('Error submitting score:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 w-full h-full flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto font-mono"
    >
      <div className="flex flex-col items-center max-w-md w-full px-6">
        {/* Trophy Icon */}
        <Trophy className="w-24 h-24 text-[#b5ff4a] mb-6" strokeWidth={1.5} />

        {/* Title */}
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
          COMPLETE!
        </h1>

        {/* Time */}
        <div className="text-2xl text-white mb-12 flex items-center gap-2">
          <span>⏱</span> {formatTime(timeMs)}
        </div>

        {/* Leaderboard Input */}
        <p className="text-zinc-400 text-sm mb-3">Enter your name for the leaderboard</p>
        
        <form onSubmit={handleSubmit} className="w-full flex items-center bg-zinc-800 rounded-full p-1.5 mb-6">
          <div className="pl-4 text-zinc-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name..."
            disabled={isSubmitting}
            className="flex-1 bg-transparent border-none outline-none text-white px-4 placeholder:text-zinc-500 disabled:opacity-50"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 ${
              name.trim() && !isSubmitting ? 'bg-[#b5ff4a] text-black' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </button>
        </form>

        {/* Play Again */}
        <button 
          onClick={onRestart}
          disabled={isSubmitting}
          className="text-zinc-500 hover:text-white transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Skip & Play Again
        </button>
      </div>
    </motion.div>
  );
}
