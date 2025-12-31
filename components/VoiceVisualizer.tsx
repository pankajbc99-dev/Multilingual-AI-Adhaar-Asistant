
import React, { useEffect, useRef } from 'react';

interface Props {
  isRecording: boolean;
}

const VoiceVisualizer: React.FC<Props> = ({ isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isRecording) {
      startVisualizer();
    } else {
      stopVisualizer();
    }
    return () => stopVisualizer();
  }, [isRecording]);

  const startVisualizer = async () => {
    try {
      // Ensure any previous session is fully cleaned up
      stopVisualizer();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
      
      const source = audioCtxRef.current!.createMediaStreamSource(stream);
      analyzerRef.current = audioCtxRef.current!.createAnalyser();
      analyzerRef.current.fftSize = 64;
      source.connect(analyzerRef.current);
      draw();
    } catch (e) {
      console.error("Mic error", e);
    }
  };

  const stopVisualizer = () => {
    // Stop the animation loop
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Stop microphone stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close the audio context safely
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(err => console.warn("Error closing AudioContext:", err));
      }
      audioCtxRef.current = null;
    }
    
    analyzerRef.current = null;
  };

  const draw = () => {
    if (!canvasRef.current || !analyzerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyzerRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      if (!analyzerRef.current) return;
      
      animationRef.current = requestAnimationFrame(renderFrame);
      analyzerRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        // Vibrant blue color with frequency-based alpha
        ctx.fillStyle = `rgba(37, 99, 235, ${Math.max(0.2, dataArray[i] / 255)})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    renderFrame();
  };

  return (
    <canvas 
      ref={canvasRef} 
      width={120} 
      height={40} 
      className={`rounded-xl transition-opacity duration-300 pointer-events-none ${isRecording ? 'opacity-100' : 'opacity-0'}`} 
    />
  );
};

export default VoiceVisualizer;
