import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Volume2, CheckCircle2, XCircle } from 'lucide-react';
import { TopBar } from './TopBar';
import { playChime } from '../utils/sound';

const calculateSimilarity = (str1, str2) => {
  const clean = (s) => s.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").replace(/\s{2,}/g, " ").trim();
  const a = clean(str1);
  const b = clean(str2);
  if (a.length === 0) return 0;
  if (a === b) return 1;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return (Math.max(a.length, b.length) - matrix[b.length][a.length]) / Math.max(a.length, b.length);
};

export default function Dictation({ pool, onComplete, onQuit }) {
  const realWords = useMemo(() => pool.filter(w => w.isReal), [pool]);
  const [wordIndex, setWordIndex] = useState(0);
  const [gameState, setGameState] = useState('Q'); // 'Q', 'A_FAIL', 'A_PASS'
  const [userAnswer, setUserAnswer] = useState(null);
  const [typedSentence, setTypedSentence] = useState('');
  const [score, setScore] = useState(0);
  
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const currentWordObj = realWords[wordIndex];

  const playAudio = useCallback(() => {
    if (!currentWordObj) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const basePath = import.meta.env.BASE_URL || '/';
    audioRef.current = new Audio(`${basePath}audio/sentence_${currentWordObj.word.toLowerCase()}.mp3`);
    audioRef.current.play().catch(e => console.warn("Autoplay blocked", e));
  }, [currentWordObj]);

  useEffect(() => {
    if (gameState === 'Q' && currentWordObj) {
      setTypedSentence('');
      playAudio();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [wordIndex, gameState, currentWordObj, playAudio]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!typedSentence.trim() || gameState !== 'Q') return;

    const similarity = calculateSimilarity(typedSentence, currentWordObj.sent);
    const percentage = Math.round(similarity * 20) * 5; 
    const isPass = percentage >= 85;
    
    if (isPass) setScore(s => s + 1);
    playChime(isPass ? 'correct' : 'incorrect');

    setUserAnswer({ percentage, isPass });
    setGameState(isPass ? 'A_PASS' : 'A_FAIL');
  };

  const handleNext = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
    if (wordIndex < realWords.length - 1) {
      setWordIndex(w => w + 1);
      setGameState('Q');
    } else {
      onComplete(score);
    }
  }, [wordIndex, realWords.length, score, onComplete]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (gameState === 'Q') handleSubmit();
        else if (gameState === 'A_PASS') handleNext();
        else if (gameState === 'A_FAIL' && calculateSimilarity(typedSentence, currentWordObj.sent) === 1) {
          setGameState('A_PASS');
          handleNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const isRetryCorrect = gameState === 'A_FAIL' && calculateSimilarity(typedSentence, currentWordObj?.sent) === 1;

  return (
    <div className="flex-1 flex flex-col relative bg-white min-h-screen">
      <TopBar 
        showTimer={false} 
        currentScore={score}
        totalAttempted={gameState === 'Q' ? wordIndex : wordIndex + 1}
        progress={Math.round((wordIndex / realWords.length) * 100)}
        onSkip={() => onComplete(score)}
        resetToStart={() => { if (audioRef.current) audioRef.current.pause(); onQuit(); }} 
      />
      
      <div className="flex-1 flex flex-col items-center pt-16 px-6 pb-48 max-w-3xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-gray-700 mb-8 text-center cursor-default">
          Type what you hear
        </h2>
        
        <div className="w-full flex flex-col items-center">
          <div className="flex flex-col items-center mb-10">
            <button
              onClick={playAudio}
              disabled={gameState === 'A_PASS'}
              className={`w-[110px] h-[110px] rounded-[1.5rem] flex items-center justify-center transition-all ${
                gameState !== 'A_PASS' ? 'bg-[#1CB0F6] hover:bg-[#1899D6] active:scale-95 shadow-sm' : 'bg-gray-200 cursor-not-allowed opacity-70'
              }`}
            >
              <Volume2 className="w-12 h-12 text-white" strokeWidth={3} />
            </button>
            {gameState !== 'A_PASS' && <div className="mt-4 text-[15px] font-bold text-[#1CB0F6]">Replay Audio</div>}
          </div>

          <form onSubmit={handleSubmit} className="w-full">
            <textarea
              ref={inputRef}
              disabled={gameState === 'A_PASS'}
              value={typedSentence}
              onChange={(e) => setTypedSentence(e.target.value)}
              className={`w-full p-6 text-[19px] text-gray-800 rounded-2xl transition-all outline-none min-h-[160px] resize-none leading-relaxed ${
                gameState === 'A_PASS' ? 'bg-green-50 border-2 border-[#B3E6B3] opacity-80' : 'bg-[#F7F7F7] border-2 border-gray-200 focus:bg-white focus:border-[#1CB0F6]'
              }`}
            />
            {gameState === 'Q' && (
              <div className="flex justify-end mt-6">
                <button type="submit" disabled={!typedSentence.trim()} className="bg-[#1CB0F6] text-white font-bold text-sm uppercase tracking-widest px-10 py-3.5 rounded-xl transition-all hover:bg-[#1899D6] active:scale-95 disabled:opacity-50">
                  Submit
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
      
      {(gameState === 'A_FAIL' || gameState === 'A_PASS') && (
        <div className={`fixed bottom-0 left-0 w-full p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center z-50 animate-in slide-in-from-bottom-4 duration-300 border-t-2 ${
          userAnswer?.isPass ? 'bg-[#D7FFD7] border-[#B3E6B3]' : 'bg-[#FFE5E5] border-[#FFCCCC]'
        }`}>
          <div className="mb-6 sm:mb-0 max-w-3xl pt-2">
            <div className={`font-black text-2xl flex items-center mb-4 ${userAnswer?.isPass ? 'text-[#58A700]' : 'text-[#EA4335]'}`}>
              {userAnswer?.isPass ? <><CheckCircle2 className="w-7 h-7 mr-2 fill-current text-white" strokeWidth={2} /> Correct!</> : <><XCircle className="w-7 h-7 mr-2 fill-current text-white" strokeWidth={2} /> Incorrect</>}
            </div>

            <div className={`font-bold text-lg mb-4 ${userAnswer?.isPass ? 'text-[#3E7500]' : 'text-[#A32D23]'}`}>
              Sentence Accuracy: {userAnswer?.percentage}%
            </div>
            
            <div className="flex flex-col space-y-4">
              
              {/* English Sentence Display */}
              <div className="text-[17px] text-gray-800">
                <span className={`font-bold block mb-1 ${gameState === 'A_FAIL' ? 'text-[#EA4335]' : 'text-[#3E7500]'}`}>
                  {gameState === 'A_FAIL' ? 'Retype exactly to continue:' : 'Target Sentence:'}
                </span>
                <p className="font-medium text-lg">{currentWordObj.sent}</p>
              </div>

              {/* Vietnamese Sentence Translation */}
              <div className={`pt-3 border-t ${userAnswer?.isPass ? 'border-[#B3E6B3]' : 'border-[#FFCCCC]'}`}>
                <span className={`font-bold uppercase tracking-widest text-xs block mb-1 ${userAnswer?.isPass ? 'text-[#468500]' : 'text-[#C9362A]'}`}>
                  Vietnamese Translation
                </span>
                <p className={`font-medium text-lg ${userAnswer?.isPass ? 'text-[#3E7500]/90' : 'text-[#A32D23]/90'}`}>
                  {currentWordObj.vnSent}
                </p>
              </div>
              
              {/* Target Word Display */}
              <div className={`pt-3 border-t ${userAnswer?.isPass ? 'border-[#B3E6B3]' : 'border-[#FFCCCC]'}`}>
                <span className={`font-bold uppercase tracking-widest text-xs block mb-1 ${userAnswer?.isPass ? 'text-[#468500]' : 'text-[#C9362A]'}`}>
                  Target Word Meaning
                </span>
                <p className={`font-medium text-lg ${userAnswer?.isPass ? 'text-[#3E7500]/90' : 'text-[#A32D23]/90'}`}>
                  <span className="font-black capitalize">{currentWordObj.word}</span>: {currentWordObj.vn}
                </p>
              </div>

            </div>
          </div>

          <button
            disabled={gameState === 'A_FAIL' && !isRetryCorrect}
            onClick={() => {
              if (gameState === 'A_FAIL') setGameState('A_PASS');
              handleNext();
            }}
            className={`w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-white text-base uppercase tracking-widest transition-all flex-shrink-0 self-end sm:self-center mt-6 sm:mt-0 shadow-sm
              ${gameState === 'A_FAIL' && !isRetryCorrect ? 'bg-gray-400 cursor-not-allowed opacity-50' 
              : userAnswer?.isPass || isRetryCorrect ? 'bg-[#58A700] hover:bg-[#468500] active:scale-95' : ''}`}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}