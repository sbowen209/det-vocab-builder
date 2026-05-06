import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Info } from 'lucide-react';
import { TopBar } from './TopBar';
import { FeedbackBanner } from './FeedbackBanner';

export default function ContextualSpelling({ pool, onComplete, onQuit }) {
  const realWords = useMemo(() => pool.filter(w => w.isReal), [pool]);
  const [wordIndex, setWordIndex] = useState(0);
  const [gameState, setGameState] = useState('Q');
  const [userAnswer, setUserAnswer] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const inputRef = useRef(null);

  const getPrefixLength = (word) => {
    if (word.length <= 4) return 1;
    if (word.length <= 8) return 2;
    return 3;
  };

  useEffect(() => {
    if (gameState === 'Q' && realWords[wordIndex]) {
      const targetWord = realWords[wordIndex].word;
      setUserInput(targetWord.substring(0, getPrefixLength(targetWord)));
      setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 100);
    }
  }, [gameState, wordIndex, realWords]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const targetWord = realWords[wordIndex].word;
    if (userInput.length <= getPrefixLength(targetWord)) return;

    const isCorrect = userInput.trim().toLowerCase() === targetWord.toLowerCase();
    if (isCorrect) setScore(s => s + 1);

    setUserAnswer({ choice: userInput, isCorrect });
    setGameState('A');
  };

  const handleNext = useCallback(() => {
    if (gameState !== 'A') return;
    if (wordIndex < realWords.length - 1) {
      setWordIndex(w => w + 1);
      setGameState('Q');
    } else {
      onComplete(score);
    }
  }, [gameState, wordIndex, realWords.length, score, onComplete]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState === 'A' && e.key === 'Enter') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleNext]);

  const renderSentenceWithBlanks = () => {
    const wordObj = realWords[wordIndex];
    if (!wordObj) return null;

    const root = wordObj.word.length > 4 ? wordObj.word.substring(0, 4) : wordObj.word.substring(0, 3);
    const regex = new RegExp(`\\b${root}\\w*\\b`, 'i');
    const match = wordObj.sent.match(regex);

    let beforeText = wordObj.sent;
    let afterText = "";

    if (match) {
      const index = match.index;
      const matchedWord = match[0];
      beforeText = wordObj.sent.substring(0, index);
      let trailing = "";
      if (matchedWord.length > wordObj.word.length && matchedWord.toLowerCase().startsWith(wordObj.word.toLowerCase())) {
          trailing = matchedWord.substring(wordObj.word.length);
      }
      afterText = trailing + wordObj.sent.substring(index + match[0].length);
    } else {
      beforeText = wordObj.sent + " ";
    }

    const prefixLen = getPrefixLength(wordObj.word);
    const isAnswered = gameState === 'A';

    const boxes = Array.from({ length: wordObj.word.length }).map((_, i) => {
      const isPrefix = i < prefixLen;
      let letter = isPrefix ? wordObj.word[i] : (userInput[i] || '');
      let borderClass = 'border-gray-300 bg-white text-gray-800 shadow-sm';
      if (isAnswered) {
        if (userInput.toLowerCase() === wordObj.word.toLowerCase()) {
          borderClass = 'border-[#58A700] bg-[#E5F8E5] text-[#58A700]';
        } else {
          borderClass = 'border-[#EA4335] bg-[#FFE5E5] text-[#EA4335]';
        }
      } else if (isPrefix) {
        borderClass = 'border-gray-200 bg-gray-50 text-gray-500';
      } else if (i === userInput.length && !isAnswered) {
        borderClass = 'border-[#1CB0F6] bg-blue-50/50 text-gray-900 ring-[1.5px] ring-[#1CB0F6]';
      }

      return (
        <div key={i} className={`w-[22px] h-[30px] sm:w-[26px] sm:h-[34px] border flex items-center justify-center font-bold text-[15px] sm:text-[17px] lowercase transition-all rounded-[4px] ${borderClass}`}>
          {letter}
        </div>
      );
    });

    return (
      <div className="text-[17px] sm:text-[19px] font-medium text-gray-700 leading-[2.5rem] sm:leading-[3rem] text-center w-full">
        <span>{beforeText}</span>
        <span className="inline-flex relative align-middle mx-[3px] top-[-2px]">
          <input
            ref={inputRef}
            type="text"
            disabled={isAnswered}
            value={userInput}
            maxLength={wordObj.word.length} 
            onChange={(e) => {
              let val = e.target.value.replace(/[^a-zA-Z]/g, ''); 
              const prefix = wordObj.word.substring(0, prefixLen);
              if (!val.toLowerCase().startsWith(prefix.toLowerCase())) {
                 val = prefix + val.substring(prefixLen);
              }
              setUserInput(val);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-text z-50"
            autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck="false" autoFocus
          />
          <div className="flex gap-[3px] pointer-events-none relative z-10">{boxes}</div>
        </span>
        <span>{afterText}</span>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col relative bg-slate-50 min-h-screen">
      <TopBar 
        showTimer={false} 
        currentScore={score}
        totalAttempted={gameState === 'A' ? wordIndex + 1 : wordIndex}
        progress={Math.round((wordIndex / realWords.length) * 100)}
        onSkip={() => onComplete(score)}
        resetToStart={onQuit} 
      />
      
      <div 
        className="flex-1 flex flex-col items-center py-10 px-6 pb-48 max-w-4xl mx-auto w-full cursor-text"
        onClick={(e) => {
          if (gameState === 'Q' && e.target.tagName !== 'BUTTON') inputRef.current?.focus();
        }}
      >
        <h2 className="text-2xl sm:text-3xl font-black text-gray-800 mb-8 text-center tracking-tight cursor-default">
          Type the missing letters
        </h2>
        <div className="w-full flex flex-col items-center">
          <form onSubmit={handleSubmit} className="w-full relative flex flex-col items-center bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200">
            {renderSentenceWithBlanks()}
            {gameState === 'Q' && (
              <button type="submit" disabled={userInput.length <= getPrefixLength(realWords[wordIndex]?.word || '')} className="mt-12 bg-[#1CB0F6] text-white font-black text-lg px-16 py-3.5 rounded-2xl transition-all border-b-[6px] border-[#1899D6] hover:bg-[#1899D6] active:border-b-0 active:translate-y-[6px] disabled:opacity-50 disabled:border-b-4 disabled:active:translate-y-0 disabled:cursor-not-allowed">
                SUBMIT
              </button>
            )}
          </form>
          
          {/* Enhanced Info Box with Vietnamese Sentence Context */}
          <div className="mt-8 w-full bg-white rounded-3xl p-6 sm:p-8 border-2 border-gray-100 shadow-sm cursor-default flex items-start">
            <div className="bg-blue-100 text-[#1CB0F6] p-3 rounded-2xl mr-6 hidden sm:block">
              <Info className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <div className="space-y-5 flex-1">
              <div>
                <p className="text-gray-800 text-lg font-bold">
                  <span className="text-gray-400 uppercase tracking-widest text-xs block mb-1">English Definition</span>
                  {realWords[wordIndex]?.def}
                </p>
              </div>
              
              <div className="border-t border-gray-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="text-gray-400 uppercase tracking-widest text-xs font-bold block mb-1">Vietnamese Meaning</span>
                  <p className="text-gray-800 text-lg font-bold">{realWords[wordIndex]?.vn}</p>
                  <p className="text-gray-500 font-medium mt-1 leading-snug">{realWords[wordIndex]?.vnDef}</p>
                </div>
                <div>
                  <span className="text-gray-400 uppercase tracking-widest text-xs font-bold block mb-1">Vietnamese Sentence</span>
                  <p className="text-gray-700 text-[16px] font-medium italic mt-1 leading-relaxed">
                    "{realWords[wordIndex]?.vnSent}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* The Universal Feedback Banner already handles the side-by-side sentence translation beautifully! */}
      {gameState === 'A' && (
        <FeedbackBanner 
          isCorrect={userAnswer?.isCorrect} 
          currentWord={realWords[wordIndex]} 
          isWordRecognition={false} 
          shouldChime={false} 
          onNext={handleNext} 
        />
      )}
    </div>
  );
}