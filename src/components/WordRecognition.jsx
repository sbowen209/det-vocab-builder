import React, { useState, useEffect, useCallback } from 'react';
import { Check, X as XIcon } from 'lucide-react';
import { TopBar } from './TopBar';
import { FeedbackBanner } from './FeedbackBanner';

export default function WordRecognition({ pool, onComplete, onQuit }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [timer, setTimer] = useState(5);
  const [gameState, setGameState] = useState('Q'); 
  const [userAnswer, setUserAnswer] = useState(null);
  const [score, setScore] = useState(0);

  const handleAnswer = useCallback((choice) => {
    if (gameState !== 'Q') return;
    const currentWord = pool[wordIndex];
    const isCorrect = (choice === 'yes' && currentWord.isReal) || (choice === 'no' && !currentWord.isReal);
    
    if (isCorrect) setScore(s => s + 1);
    setUserAnswer({ choice, isCorrect });
    setGameState('A');
  }, [gameState, pool, wordIndex]);

  const handleNext = useCallback(() => {
    if (gameState !== 'A') return;
    if (wordIndex < pool.length - 1) {
      setWordIndex(w => w + 1);
      setTimer(5);
      setGameState('Q');
    } else {
      onComplete(score);
    }
  }, [gameState, wordIndex, pool.length, score, onComplete]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState === 'Q') {
        if (e.key.toLowerCase() === 'y') handleAnswer('yes');
        if (e.key.toLowerCase() === 'n') handleAnswer('no');
      } else if (gameState === 'A') {
        if (e.key === 'Enter') handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleAnswer, handleNext]);

  useEffect(() => {
    let interval;
    if (gameState === 'Q' && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (gameState === 'Q' && timer === 0) {
      handleAnswer(null);
    }
    return () => clearInterval(interval);
  }, [gameState, timer, handleAnswer]);

  return (
    <div className="flex-1 flex flex-col relative bg-slate-50 min-h-screen font-sans">
      <TopBar 
        showTimer={gameState === 'Q'} 
        timer={timer} 
        currentScore={score}
        totalAttempted={gameState === 'A' ? wordIndex + 1 : wordIndex}
        progress={Math.round((wordIndex / pool.length) * 100)}
        onSkip={() => onComplete(score)}
        resetToStart={onQuit} 
      />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-40 max-w-3xl mx-auto w-full">
        <h2 className="text-3xl sm:text-4xl font-black text-gray-800 mb-12 text-center tracking-tight cursor-default">
          Is this a real English word?
        </h2>
        
        <div className="w-full bg-white rounded-[2rem] shadow-sm border-2 border-gray-100 py-20 px-8 flex items-center justify-center mb-16">
          <span className="text-5xl sm:text-7xl font-black tracking-wide text-gray-900 break-all text-center">
            {pool[wordIndex]?.word}
          </span>
        </div>
        
        <div className="flex space-x-6 sm:space-x-10 w-full justify-center">
          <button
            disabled={gameState === 'A'}
            onClick={() => handleAnswer('yes')}
            className={`group flex flex-col items-center justify-center w-36 h-36 sm:w-48 sm:h-48 border-2 rounded-[2rem] transition-all bg-white flex-shrink-0
              ${gameState === 'A' && userAnswer?.choice !== 'yes' ? 'opacity-40 border-gray-200 bg-gray-50 cursor-not-allowed' 
              : 'border-[#1CB0F6] border-b-[8px] hover:bg-blue-50 active:border-b-2 active:translate-y-[6px]'}`}
          >
            <Check className={`w-16 h-16 sm:w-20 sm:h-20 mb-3 transition-colors ${gameState === 'A' && userAnswer?.choice !== 'yes' ? 'text-gray-400' : 'text-[#1CB0F6] group-hover:text-[#1899D6]'}`} strokeWidth={3} />
            <span className={`font-black text-xl sm:text-2xl uppercase tracking-widest ${gameState === 'A' && userAnswer?.choice !== 'yes' ? 'text-gray-400' : 'text-[#1CB0F6]'}`}>Yes (Y)</span>
          </button>
          
          <button
            disabled={gameState === 'A'}
            onClick={() => handleAnswer('no')}
            className={`group flex flex-col items-center justify-center w-36 h-36 sm:w-48 sm:h-48 border-2 rounded-[2rem] transition-all bg-white flex-shrink-0
              ${gameState === 'A' && userAnswer?.choice !== 'no' ? 'opacity-40 border-gray-200 bg-gray-50 cursor-not-allowed' 
              : 'border-gray-300 border-b-[8px] hover:bg-gray-50 active:border-b-2 active:translate-y-[6px]'}`}
          >
            <XIcon className={`w-16 h-16 sm:w-20 sm:h-20 mb-3 transition-colors ${gameState === 'A' && userAnswer?.choice !== 'no' ? 'text-gray-400' : 'text-gray-500 group-hover:text-gray-700'}`} strokeWidth={3} />
            <span className={`font-black text-xl sm:text-2xl uppercase tracking-widest ${gameState === 'A' && userAnswer?.choice !== 'no' ? 'text-gray-400' : 'text-gray-600'}`}>No (N)</span>
          </button>
        </div>
      </div>
      
      {gameState === 'A' && (
        <FeedbackBanner 
          isCorrect={userAnswer?.isCorrect} 
          currentWord={pool[wordIndex]} 
          isWordRecognition={true} 
          shouldChime={!pool[wordIndex].isReal} 
          onNext={handleNext} 
        />
      )}
    </div>
  );
}