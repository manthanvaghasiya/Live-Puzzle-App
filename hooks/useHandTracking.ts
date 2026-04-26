import { useEffect, useRef, useState } from 'react';

// Use any to bypass strict type checking for window globals since we removed the types
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}
export type HandState = {
  x: number;
  y: number;
  isPinching: boolean;
};

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

export function useHandTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onResultsCallback?: (results: any) => void
) {
  const [handState, setHandState] = useState<HandState>({ x: 0, y: 0, isPinching: false });
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    let handsInstance: any = null;

    if (!videoRef.current || !canvasRef.current) return;

    const initMediaPipe = () => {
      if (!isMounted) return;

      handsInstance = new window.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      handsInstance.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      handsInstance.onResults((results: any) => {
        const canvasCtx = canvasRef.current?.getContext('2d');
        if (!canvasCtx || !canvasRef.current) return;

        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        let currentHandState: HandState = { x: 0, y: 0, isPinching: false };

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];

          // Calculate pinch first to determine state
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];

          const dx = thumbTip.x - indexTip.x;
          const dy = thumbTip.y - indexTip.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          const isPinching = distance <= 0.05;
          // Flip X here by subtracting from 1
          const midpointX = 1 - ((thumbTip.x + indexTip.x) / 2);
          const midpointY = (thumbTip.y + indexTip.y) / 2;

          // Draw custom skeleton
          canvasCtx.save();
          canvasCtx.lineWidth = 1.5;
          canvasCtx.strokeStyle = 'white';
          canvasCtx.fillStyle = 'white';

          for (const connection of HAND_CONNECTIONS) {
            const start = landmarks[connection[0]];
            const end = landmarks[connection[1]];
            
            canvasCtx.beginPath();
            canvasCtx.moveTo(start.x * canvasRef.current.width, start.y * canvasRef.current.height);
            canvasCtx.lineTo(end.x * canvasRef.current.width, end.y * canvasRef.current.height);
            canvasCtx.stroke();
          }

          for (const landmark of landmarks) {
            canvasCtx.beginPath();
            canvasCtx.arc(landmark.x * canvasRef.current.width, landmark.y * canvasRef.current.height, 2, 0, 2 * Math.PI);
            canvasCtx.fill();
          }
          canvasCtx.restore();

          currentHandState = { x: midpointX, y: midpointY, isPinching };

          if (isPinching) {
            canvasCtx.save();
            canvasCtx.beginPath();
            // Important: we use the un-flipped coordinates to draw ON the mirrored canvas overlay!
            const canvasMidX = (thumbTip.x + indexTip.x) / 2;
            canvasCtx.arc(canvasMidX * canvasRef.current.width, midpointY * canvasRef.current.height, 8, 0, 2 * Math.PI);
            canvasCtx.fillStyle = '#b5ff4a';
            canvasCtx.fill();
            canvasCtx.restore();
          }
        }

        setHandState(currentHandState);
        
        if (onResultsCallback) {
          onResultsCallback(results);
        }
      });

      if (videoRef.current) {
        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && handsInstance) {
              await handsInstance.send({ image: videoRef.current });
            }
          },
          width: 800,
          height: 600,
        });
        camera.start();
        cameraRef.current = camera;
      }
    };

    if (window.Hands && window.Camera) {
      initMediaPipe();
    } else {
      const interval = setInterval(() => {
        if (window.Hands && window.Camera) {
          clearInterval(interval);
          initMediaPipe();
        }
      }, 500);
      
      return () => {
        isMounted = false;
        clearInterval(interval);
        if (handsInstance) handsInstance.close();
        if (cameraRef.current) cameraRef.current.stop();
      };
    }

    return () => {
      isMounted = false;
      if (handsInstance) handsInstance.close();
      if (cameraRef.current) cameraRef.current.stop();
    };
  }, [videoRef, canvasRef]); // removed onResultsCallback from deps to avoid re-renders

  return handState;
}
