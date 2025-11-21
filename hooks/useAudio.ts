
import { useCallback } from 'react';

export const useAudio = () => {
  const playSound = useCallback(async (type: 'NEW' | 'CANCEL' = 'NEW') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'NEW') {
          // "Ding" effect (High pitch)
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);
          
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
          
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.5);
      } else {
          // "Bomp" effect (Low pitch) for cancellation
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
          
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
          
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.4);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  }, []);

  return { playSound };
};
