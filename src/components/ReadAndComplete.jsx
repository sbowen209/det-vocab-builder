import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Volume2, VolumeX, CheckCircle2, XCircle } from 'lucide-react';
import { TopBar } from './TopBar';
import { PASSAGES } from '../data/words';
import { playChime } from '../utils/sound';

export default function ReadAndComplete({ pool, levelIndex, onComplete, onQuit }) {
  const realWords = useMemo(() => pool.filter(w => w.isReal), [pool]);
  const [gameState, setGameState] = useState('Q'); 
  const [inputs, setInputs] = useState({});
  const [score, setScore] = useState(0);
  
  const audioRef = useRef(null);
  const inputRefs = useRef([]);

  const getPrefixLength = (word) => {
    if (word.length <= 4) return 1;
    if (word.length <= 8) return 2;
    return 3;
  };

  const passage = useMemo(() => {
    if (PASSAGES[levelIndex]) return PASSAGES[levelIndex];
    const sentences = realWords.map(w => w.sent.replace(new RegExp(`\\b${w.word}\\b`, 'i'), `{${w.word}}`));
    const vnSentences = realWords.map(w => w.vnSent);
    return { title: `Reading Comprehension: Level ${levelIndex + 1}`, text: sentences.join(" "), vnTitle: `Đọc hiểu: Cấp độ ${levelIndex + 1}`, vnText: vnSentences.join(" ") };
  }, [levelIndex, realWords]);

  const blankWords = useMemo(() => {
    return passage.text.match(/\{.*?\}/g)?.map(w => w.slice(1, -1)) || [];
  }, [passage.text]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, blankWords.length);
  }, [blankWords]);

  const playPassageAudio = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    const basePath = import.meta.env.BASE_URL || '/';
    audioRef.current = new Audio(`${basePath}audio/passage_level${levelIndex + 1}.mp3`);
    audioRef.current.play().catch(e => console.warn("Autoplay blocked:", e));
  }, [levelIndex]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
  }, []);

  useEffect(() => {
    if (gameState === 'Q') {
      const initial = {};
      blankWords.forEach((word, i) => {
        initial[i] = word.substring(0, getPrefixLength(word));
      });
      setInputs(initial);
    }
  }, [blankWords, gameState]);

  const handleSubmit = () => {
    let currentScore = 0;
    blankWords.forEach((word, i) => {
      if (inputs[i]?.toLowerCase() === word.toLowerCase()) currentScore += 1;
    });
    setScore(currentScore);
    setGameState('A');
    
    const isPass = currentScore / blankWords.length >= 0.7;
    playChime(isPass ? 'correct' : 'incorrect');

    setTimeout(() => playPassageAudio(), 600);
  };

  const handleNext = useCallback(() => {
    if (gameState !== 'A') return;
    stopAudio();
    onComplete(score);
  }, [gameState, score, stopAudio, onComplete]);

  const renderPassage = () => {
    const parts = passage.text.split(/(\{.*?\})/g);
    let blankIndex = 0;

    return parts.map((part, i) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        const targetWord = part.slice(1, -1);
        const currentIndex = blankIndex++;
        const userVal = inputs[currentIndex] || '';
        const isCorrect = userVal.toLowerCase() === targetWord.toLowerCase();

        if (gameState === 'A') {
          return (
            <span key={i} className={`font-bold px-1.5 py-0.5 mx-1 rounded-md ${isCorrect ? 'text-[#58A700] bg-[#E5F8E5] border border-[#58A700]/20' : 'text-[#EA4335] bg-[#FFE5E5] border border-[#EA4335]/20'}`}>
              {targetWord}
            </span>
          );
        }

        return (
          <BlankWord 
            key={i} 
            targetWord={targetWord} 
            value={userVal} 
            onChange={(val) => setInputs(prev => ({ ...prev, [currentIndex]: val }))}
            inputRef={(el) => inputRefs.current[currentIndex] = el}
            onEnterJump={() => {
              if (currentIndex < blankWords.length - 1) {
                inputRefs.current[currentIndex + 1]?.focus();
              } else {
                handleSubmit();
              }
            }}
          />
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const isPass = score / blankWords.length >= 0.7;

  return (
    <div className="flex-1 flex flex-col relative bg-slate-50 min-h-screen">
      <TopBar 
        showTimer={false} 
        currentScore={gameState === 'A' ? score : undefined}
        totalAttempted={gameState === 'A' ? blankWords.length : undefined}
        onSkip={() => { stopAudio(); onComplete(0); }}
        resetToStart={() => { stopAudio(); onQuit(); }} 
      />
      
      <div className="flex-1 flex flex-col items-center py-10 px-4 sm:px-6 pb-48 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-800 mb-8 text-center tracking-tight cursor-default">
          Complete the text with the correct words
        </h2>
        
        <div className="w-full bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-center text-gray-800 mb-6">{passage.title}</h3>
          <div className="text-[17px] sm:text-[19px] font-medium text-gray-700 leading-[2.5rem] sm:leading-[3rem] text-justify">
            {renderPassage()}
          </div>
          {gameState === 'A' && (
            <div className="mt-10 pt-8 border-t border-gray-100 animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Vietnamese Translation</h4>
                <div className="flex items-center space-x-6 mt-4 sm:mt-0">
                  <button onClick={() => { stopAudio(); playPassageAudio(); }} className="flex items-center text-[#1CB0F6] font-bold text-sm uppercase tracking-wider hover:text-[#1899D6] transition-colors"><Volume2 className="w-5 h-5 mr-1.5" /> Replay</button>
                  <button onClick={stopAudio} className="flex items-center text-gray-400 font-bold text-sm uppercase tracking-wider hover:text-[#EA4335] transition-colors"><VolumeX className="w-5 h-5 mr-1.5" /> Stop</button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{passage.vnTitle}</h3>
              <p className="text-gray-600 leading-relaxed text-[15px] sm:text-base">{passage.vnText}</p>
            </div>
          )}
        </div>

        {gameState === 'Q' && (
          <div className="mt-10 flex justify-center">
            <button onClick={handleSubmit} className="bg-[#1CB0F6] text-white font-black text-lg sm:text-xl px-16 py-3.5 rounded-2xl transition-all border-b-[6px] border-[#1899D6] hover:bg-[#1899D6] active:border-b-0 active:translate-y-[6px]">SUBMIT</button>
          </div>
        )}
      </div>
      
      {/* Visual Header matching the Recognition banner! */}
      {gameState === 'A' && (
        <div className={`fixed bottom-0 left-0 w-full p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center z-50 animate-in slide-in-from-bottom-4 duration-300 border-t-2 ${isPass ? 'bg-[#D7FFD7] border-[#B3E6B3]' : 'bg-[#FFE5E5] border-[#FFCCCC]'}`}>
          <div className="mb-6 sm:mb-0 max-w-3xl pt-2">
            <div className={`font-black text-2xl flex items-center mb-2 ${isPass ? 'text-[#58A700]' : 'text-[#EA4335]'}`}>
              {isPass ? <><CheckCircle2 className="w-7 h-7 mr-2 fill-current text-white" strokeWidth={2} /> Passage Passed!</> : <><XCircle className="w-7 h-7 mr-2 fill-current text-white" strokeWidth={2} /> Passage Failed</>}
            </div>
             <div className={`font-bold text-lg ${isPass ? 'text-[#3E7500]' : 'text-[#A32D23]'}`}>
              Final Score: {score} / {blankWords.length} Blanks Correct
            </div>
          </div>
          <button onClick={handleNext} className={`w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-white text-base uppercase tracking-widest transition-all active:scale-95 flex-shrink-0 self-end sm:self-center mt-6 sm:mt-0 shadow-sm ${isPass ? 'bg-[#58A700] hover:bg-[#468500]' : 'bg-[#EA4335] hover:bg-[#C9362A]'}`}>Continue</button>
        </div>
      )}
    </div>
  );
}

function BlankWord({ targetWord, value, onChange, inputRef, onEnterJump }) {
  const getPrefixLength = (word) => {
    if (word.length <= 4) return 1;
    if (word.length <= 8) return 2;
    return 3;
  };

  const prefixLen = getPrefixLength(targetWord);
  const prefix = targetWord.substring(0, prefixLen);

  const boxes = Array.from({ length: targetWord.length }).map((_, i) => {
    const isPrefix = i < prefixLen;
    let letter = isPrefix ? targetWord[i] : (value[i] || '');
    let borderClass = 'border-gray-300 bg-white text-gray-800 shadow-sm';
    if (isPrefix) borderClass = 'border-gray-200 bg-gray-50 text-gray-500';
    else if (i === value.length) borderClass = 'border-[#1CB0F6] bg-blue-50/50 text-gray-900 ring-[1.5px] ring-[#1CB0F6]';

    return (
      <div key={i} className={`w-[22px] h-[30px] sm:w-[26px] sm:h-[34px] border flex items-center justify-center font-bold text-[15px] sm:text-[17px] lowercase transition-all rounded-[4px] ${borderClass}`}>
        {letter}
      </div>
    );
  });

  return (
    <span className="inline-flex relative align-middle mx-[3px] top-[-2px]">
      <input
        ref={inputRef}
        type="text"
        value={value}
        maxLength={targetWord.length} 
        onChange={(e) => {
          let val = e.target.value.replace(/[^a-zA-Z]/g, ''); 
          if (val.length < prefixLen) {
            val = prefix;
          } else if (!val.toLowerCase().startsWith(prefix.toLowerCase())) {
            val = prefix + val.substring(prefixLen);
          }
          onChange(val);

          // NEW: Auto Jump when word is fully typed!
          if (val.length === targetWord.length) {
            setTimeout(() => onEnterJump(), 50); 
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (value.length === targetWord.length) onEnterJump();
          }
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text z-50"
        autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck="false"
      />
      <div className="flex gap-[3px] pointer-events-none relative z-10">{boxes}</div>
    </span>
  );
}