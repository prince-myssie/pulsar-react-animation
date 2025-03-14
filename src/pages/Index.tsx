
import React, { useState, useEffect } from 'react';
import CanvasComp from '../components/CanvasComp';
import { toast } from 'sonner';

const Index = (): JSX.Element => {
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [agentState, setAgentState] = useState<'disconnected' | 'connecting' | 'initializing' | 'listening' | 'thinking' | 'speaking'>('disconnected');
  const [micAccess, setMicAccess] = useState<boolean>(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);
  
  // Request microphone access
  useEffect(() => {
    const requestMicrophoneAccess = async (): Promise<void> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Create AudioContext
        const context = new AudioContext();
        const analyser = context.createAnalyser();
        
        // Connect the microphone stream to the analyser
        const source = context.createMediaStreamSource(stream);
        source.connect(analyser);
        
        // Configure the analyser
        analyser.fftSize = 256;
        
        setAudioContext(context);
        setAudioAnalyser(analyser);
        setMicAccess(true);
        setAgentState('listening');
        
        toast.success("Microphone activated successfully!");
      } catch (error) {
        console.error("Error accessing microphone:", error);
        toast.error("Microphone access denied. Using simulated audio.");
        // If mic access is denied, fall back to simulation
        startAudioSimulation();
      }
    };
    
    requestMicrophoneAccess();
    
    return (): void => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);
  
  // Process microphone input or simulate audio
  useEffect(() => {
    if (!micAccess) return;
    
    if (audioAnalyser) {
      // Use real microphone data
      const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount);
      let animationFrame: number;
      
      const updateAudioLevel = (): void => {
        audioAnalyser.getByteFrequencyData(dataArray);
        
        // Calculate average frequency amplitude
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        // Normalize to range between -1 and 1 that our component expects
        // Map 0-255 to -1 to 1 with some scaling for better visual effect
        const normalizedLevel = ((average / 128) - 0.5) * 1.5;
        
        setAudioLevel(normalizedLevel);
        
        animationFrame = requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
      
      return (): void => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }
  }, [micAccess, audioAnalyser]);
  
  // Simulate audio levels for demo (used when mic access is denied)
  const startAudioSimulation = (): void => {
    let interval: number | null = null;
    
    const simulateAudio = (): void => {
      interval = window.setInterval(() => {
        // Generate a random audio level based on state
        let randomLevel;
        
        if (agentState === 'speaking') {
          // More amplitude when agent is speaking
          randomLevel = (Math.random() - 0.3) * 1.5;
          // Occasionally simulate pauses in speech
          if (Math.random() > 0.9) randomLevel *= 0.2;
        } else if (agentState === 'listening') {
          // Less amplitude but occasional peaks when agent is listening
          randomLevel = (Math.random() - 0.5) * 0.8;
          // Occasionally simulate audio peaks
          if (Math.random() > 0.93) randomLevel *= 2.5;
        } else {
          // Very little activity for other states
          randomLevel = (Math.random() - 0.5) * 0.3;
        }
        
        setAudioLevel(randomLevel);
        
        // Occasionally change state to demonstrate different colors
        if (Math.random() > 0.97) {
          const states: Array<'disconnected' | 'connecting' | 'initializing' | 'listening' | 'thinking' | 'speaking'> = [
            'disconnected', 'connecting', 'initializing', 'listening', 'thinking', 'speaking'
          ];
          
          // Favor listening and speaking states for the demo
          const weightedStates = [...states, 'listening', 'listening', 'speaking', 'speaking'];
          const randomState = weightedStates[Math.floor(Math.random() * weightedStates.length)] as 'disconnected' | 'connecting' | 'initializing' | 'listening' | 'thinking' | 'speaking';
          setAgentState(randomState);
        }
      }, 100);
    };
    
    simulateAudio();
    
    return (): void => {
      if (interval !== null) {
        clearInterval(interval);
      }
    };
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-3xl font-medium mb-8 text-gray-800">Assistant Vocal Visualisation</h1>
      
      <div className="relative w-[300px] h-[300px] flex items-center justify-center mb-8">
        <CanvasComp 
          size={300} 
          state={agentState} 
          audioLevel={audioLevel}
        />
      </div>
      
      <div className="mb-4 text-gray-600">
        <p>État actuel: <span className="font-semibold">{agentState}</span></p>
        <p>Niveau audio: <span className="font-semibold">{audioLevel.toFixed(2)}</span></p>
        <p>Microphone: <span className="font-semibold">{micAccess ? 'Activé ✓' : 'Simulation ⚠️'}</span></p>
      </div>
      
      <p className="text-sm text-gray-500 max-w-md text-center">
        Cette visualisation représente un assistant vocal avec une sphère abstraite, lumineuse et colorée 
        qui réagit au son et change d'apparence selon l'état de l'assistant.
      </p>
    </div>
  );
};

export default Index;
