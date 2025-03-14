
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
        // Générer une valeur aléatoire pour l'audio qui dépend de l'état
        let randomLevel;
        
        if (agentState === 'speaking') {
          // Plus d'amplitude quand l'agent parle
          randomLevel = (Math.random() - 0.3) * 1.5;
          // Occasionnellement simuler des pauses dans la parole
          if (Math.random() > 0.9) randomLevel *= 0.2;
        } else if (agentState === 'listening') {
          // Moins d'amplitude mais des pics occasionnels quand l'agent écoute
          randomLevel = (Math.random() - 0.5) * 0.8;
          // Occasionnellement simuler des pics audio
          if (Math.random() > 0.93) randomLevel *= 2.5;
        } else {
          // Très peu d'activité pour les autres états
          randomLevel = (Math.random() - 0.5) * 0.3;
        }
        
        setAudioLevel(randomLevel);
        
        // Changer d'état occasionnellement pour démontrer les différentes couleurs
        if (Math.random() > 0.97) {
          const states: Array<'disconnected' | 'connecting' | 'initializing' | 'listening' | 'thinking' | 'speaking'> = [
            'disconnected', 'connecting', 'initializing', 'listening', 'thinking', 'speaking'
          ];
          
          // Favoriser les états d'écoute et de parole pour la démo
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
  }, [agentState]);

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
