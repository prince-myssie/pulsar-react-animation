
import React, { useState, useEffect } from 'react';
import CanvasComp from '../components/CanvasComp';

const Index = (): JSX.Element => {
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [agentState, setAgentState] = useState<'disconnected' | 'connecting' | 'initializing' | 'listening' | 'thinking' | 'speaking'>('listening');
  
  // Simulation d'un niveau audio qui fluctue pour démonstration
  useEffect(() => {
    let interval: number | null = null;
    
    const simulateAudio = (): void => {
      interval = window.setInterval(() => {
        // Générer une valeur aléatoire entre -0.5 et 0.5
        const randomLevel = (Math.random() - 0.5) * 1.0;
        setAudioLevel(randomLevel);
        
        // Changer d'état occasionnellement pour démontrer les différentes couleurs
        if (Math.random() > 0.95) {
          const states: Array<'disconnected' | 'connecting' | 'initializing' | 'listening' | 'thinking' | 'speaking'> = [
            'disconnected', 'connecting', 'initializing', 'listening', 'thinking', 'speaking'
          ];
          const randomState = states[Math.floor(Math.random() * states.length)];
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
  }, []);

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
      </div>
      
      <p className="text-sm text-gray-500 max-w-md text-center">
        Cette visualisation représente un assistant vocal avec une sphère abstraite, lumineuse et colorée 
        qui réagit au son et change d'apparence selon l'état de l'assistant.
      </p>
    </div>
  );
};

export default Index;
