export type GamePhase = 'CAPTURE' | 'PLAYING' | 'COMPLETED';

export type PuzzlePiece = {
  id: string;
  originalIndex: number;
  currentIndex: number;
  imageSliceDataUrl: string;
};

export type HandState = {
  x: number;
  y: number;
  isPinching: boolean;
};
