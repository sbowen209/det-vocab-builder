import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Check, X as XIcon, ArrowRight, NotebookPen, CheckCircle2, XCircle } from 'lucide-react';
import { REAL_WORDS, FAKE_WORDS } from './data/words';
import { TopBar } from './components/TopBar';
import { FeedbackBanner } from './components/FeedbackBanner';
import { useSpeech } from './hooks/useSpeech';

export default function App() {
  const [gameState, setGameState] = useState('START'); // START, P1_Q, P1_A, P2_Q, P2_A, SUMMARY
  const [roundIndex, setRoundIndex] = useState(0);
  const [currentPool, setCurrentPool] = useState([]);
  const [p2Words, setP2Words] = useState([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [scores, setScores] = useState({});
  const [timer, setTimer] = useState(5);
  const [userAnswer, setUserAnswer] = useState(null);
  const [p2Input, setP2Input] = useState('');
  const inputRef = useRef(null);

  const { speak } = useSpeech();

  const [roundScores, setRoundScores] = useState(() => {
    const saved = localStorage.getItem('detVocabScores');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return {}; }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('detVocabScores', JSON.stringify(roundScores));
  }, [roundScores]);

  useEffect(() => {
    if (gameState === 'SUMMARY') {
      let p1Score = 0;
      let p2Score = 0;
      currentPool.forEach(wordObj => {
        if (scores[wordObj.word]?.p1) p1Score += 1;
        if (wordObj.isReal && scores[wordObj.word]?.p2) p2Score += 2;
      });
      const totalScore = p1Score + p2Score;
      setRoundScores(prev => ({ ...prev, [roundIndex]: totalScore }));
    }
  }, [gameState, currentPool, roundIndex, scores]);

  const startRound = (rIndex) => {
    const realStart = (rIndex * 10) % REAL_WORDS.length;
    const fakeStart = (rIndex * 10) % FAKE_WORDS.length;
    let roundReal = REAL_WORDS.slice(realStart, realStart + 10);
    let roundFake = FAKE_WORDS.slice(fakeStart, fakeStart + 10);
    const combined = [...roundReal, ...roundFake].sort(() => Math.random() - 0.5);
    
    setRoundIndex(rIndex);
    setCurrentPool(combined);
    setP2Words(combined.filter(w => w.isReal));
    setWordIndex(0);
    setTimer(5);
    setScores({});
    setGameState('P1_Q');
  };

  useEffect(() => {
    let interval;
    if (gameState === 'P1_Q' && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (gameState === 'P1_Q' && timer === 0) {
      handleP1Answer(null);
    }
    return () => clearInterval(interval);
  }, [gameState, timer]);

  const getPrefixLength = (word) => {
    if (word.length <= 4) return 1;
    if (word.length <= 8) return 2;
    return 3;
  };

  useEffect(() => {
    if (gameState === 'P2_Q' && p2Words[wordIndex]) {
      const targetWord = p2Words[wordIndex].word;
      const pLen = getPrefixLength(targetWord);
      setP2Input(targetWord.substring(0, pLen));
      setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 50);
    }
  }, [gameState, wordIndex, p2Words]);

  const handleP1Answer = (choice) => {
    const currentWord = currentPool[wordIndex];
    let isCorrect = false;
    if (choice === 'yes' && currentWord.isReal) isCorrect = true;
    if (choice === 'no' && !currentWord.isReal) isCorrect = true;

    setUserAnswer({ choice, isCorrect });
    setScores(prev => ({ ...prev, [currentWord.word]: { ...prev[currentWord.word], p1: isCorrect } }));
    setGameState('P1_A');
    
    if (currentWord.isReal) speak(currentWord.word);
  };

  const nextP1Question = () => {
    if (wordIndex < currentPool.length - 1) {
      setWordIndex(prev => prev + 1);
      setTimer(5);
      setGameState('P1_Q');
    } else {
      setWordIndex(0);
      setGameState('P2_Q');
    }
  };

  const handleP2Submit = (e) => {
    e.preventDefault();
    const currentWord = p2Words[wordIndex];
    const prefixLen = getPrefixLength(currentWord.word);
    
    if (p2Input.length <= prefixLen) return;

    const isCorrect = p2Input.trim().toLowerCase() === currentWord.word.toLowerCase();
    setUserAnswer({ choice: p2Input, isCorrect });
    setScores(prev => ({ ...prev, [currentWord.word]: { ...prev[currentWord.word], p2: isCorrect } }));
    setGameState('P2_A');
    speak(currentWord.word);
  };

  const nextP2Question = () => {
    if (wordIndex < p2Words.length - 1) {
      setWordIndex(prev => prev + 1);
      setGameState('P2_Q');
    } else {
      setGameState('SUMMARY');
    }
  };

  const renderSentenceWithBlanks = (wordObj, inputValue, isAnswered) => {
    if (!wordObj) return null;
    const root = wordObj.word.length > 4 ? wordObj.word.substring(0, 4) : wordObj.word.substring(0, 3);
    const regex = new RegExp(`\\b${root}\\w*\\b`, 'i');
    const match = wordObj.sent.match(regex);

    let beforeText = wordObj.sent;
    let afterText = "";

    if (match) {
      const index = match.index;
      beforeText = wordObj.sent.substring(0, index);
      afterText = wordObj.sent.substring(index + match[0].length);
    } else {
      beforeText = wordObj.sent + " ";
    }

    const prefixLen = getPrefixLength(wordObj.word);
    const boxes = Array.from({ length: wordObj.word.length }).map((_, i) => {
      const letter = inputValue[i] || '';
      const isPrefix = i < prefixLen;
      let borderClass = 'border-[#e5e5e5] bg-white text-gray-800';
      
      if (isAnswered) {
        if (inputValue.toLowerCase() === wordObj.word.toLowerCase()) {
          borderClass = 'border-[#58A700] bg-[#E5F8E5] text-[#58A700]';
        } else {
          borderClass = 'border-[#EA4335] bg-[#FFE5E5] text-[#EA4335]';
        }
      } else if (isPrefix) {
        borderClass = 'border-[#e5e5e5] bg-gray-50 text-gray-700';
      }

      return (
        <div key={i} className={`w-8 h-10 sm:w-[42px] sm:h-[48px] border-2 flex items-center justify-center font-semibold text-lg sm:text-xl uppercase transition-colors rounded-lg ${borderClass}`}>
          {letter}
        </div>
      );
    });

    return (
      <div className="text-xl sm:text-[22px] font-normal text-[#4b4b4b] leading-[3rem] text-center sm:text-left break-words w-full">
        <span>{beforeText}</span>
        <span className="inline-flex relative align-middle mx-1 sm:mx-2 top-[-2px]">
          <input
            ref={inputRef}
            type="text"
            disabled={isAnswered}
            value={inputValue}
            onChange={(e) => {
              let val = e.target.value;
              const prefix = wordObj.word.substring(0, prefixLen);
              if (val.length < prefixLen) {
                val = prefix;
              } else if (!val.toLowerCase().startsWith(prefix.toLowerCase())) {
                val = prefix + val.substring(prefixLen);
              }
              if (val.length > wordObj.word.length) {
                val = val.substring(0, wordObj.word.length);
              }
              setP2Input(val);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && e.target.selectionStart === prefixLen && e.target.selectionEnd === prefixLen) {
                e.preventDefault();
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
            autoComplete="off"
            spellCheck="false"
          />
          <div className="flex gap-1 pointer-events-none">{boxes}</div>
        </span>
        <span>{afterText}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#3F3F3F] font-sans overflow-hidden flex flex-col relative selection:bg-blue-100">
      
      {gameState === 'START' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 overflow-y-auto">
          <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 my-8">
            <div className="bg-[#1CB0F6] p-10 text-center text-white">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-90" />
              <h1 className="text-3xl sm:text-4xl font-black mb-2">DET Vocabulary Builder</h1>
              <p className="text-lg opacity-90">Master all 200 high-frequency words for the Duolingo English Test.</p>
            </div>
            <div className="p-6 sm:p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <div className="bg-white p-2 rounded-full mr-4 text-[#1CB0F6] shadow-sm font-bold">P1</div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">Read & Select</h3>
                    <p className="text-gray-500 text-sm">Quickly identify if the word is a real English word. Watch out for fake DET traps!</p>
                  </div>
                </div>
                <div className="flex items-start bg-green-50 p-4 rounded-2xl border border-green-100">
                  <div className="bg-white p-2 rounded-full mr-4 text-[#58A700] shadow-sm font-bold">P2</div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">Fill in the Blanks</h3>
                    <p className="text-gray-500 text-sm">Read the sentence and definition, then type the missing letters to complete the target word.</p>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-700 text-center uppercase tracking-widest pt-4 border-t border-gray-100">Select a Round</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => {
                  const score = roundScores[i];
                  const hasScore = score !== undefined;
                  const pct = hasScore ? Math.round((score / 40) * 100) : 0;
                  return (
                    <button
                      key={i}
                      onClick={() => startRound(i)}
                      className={`p-4 rounded-2xl border-b-4 transition-all flex flex-col items-center justify-center ${hasScore ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-white border-gray-200 hover:border-[#1CB0F6] hover:shadow-md'}`}
                    >
                      <span className="font-bold text-lg text-gray-700 mb-1">Round {i + 1}</span>
                      {hasScore ? (
                        <div className="text-center">
                          <div className="text-[#58A700] font-black text-xl">{score} <span className="text-xs font-bold text-gray-400">/ 40</span></div>
                          <div className="text-xs text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded-full mt-1">{pct}%</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs font-bold uppercase mt-2">Not Played</span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {Object.keys(roundScores).length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to reset all your progress? This cannot be undone.')) {
                        setRoundScores({});
                        localStorage.removeItem('detVocabScores');
                      }
                    }}
                    className="text-gray-400 hover:text-red-500 font-bold text-sm uppercase tracking-wider transition-colors"
                  >
                    Reset All Progress
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {(gameState === 'P1_Q' || gameState === 'P1_A') && (
        <div className="flex-1 flex flex-col relative bg-white">
          <TopBar showTimer={gameState === 'P1_Q'} timer={timer} onSkip={() => setGameState('SUMMARY')} resetToStart={() => setGameState('START')} />
          <div className="flex-1 flex flex-col items-center justify-center p-6 pb-40">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-700 mb-8 sm:mb-12">Is this a real English word?</h2>
            <div className="text-5xl sm:text-7xl font-semibold tracking-wide text-gray-900 mb-16 text-center break-all">
              {currentPool[wordIndex]?.word}
            </div>
            <div className="flex space-x-6 sm:space-x-10">
              <button
                disabled={gameState === 'P1_A'}
                onClick={() => handleP1Answer('yes')}
                className={`flex flex-col items-center justify-center w-36 h-36 sm:w-48 sm:h-48 border-[3px] rounded-3xl transition-all ${gameState === 'P1_A' && userAnswer?.choice !== 'yes' ? 'opacity-40 bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm active:transform active:scale-95'}`}
              >
                <Check className="w-16 h-16 sm:w-20 sm:h-20 text-[#1CB0F6] mb-3" />
                <span className="font-bold text-xl text-gray-600 uppercase tracking-widest">Yes</span>
              </button>
              <button
                disabled={gameState === 'P1_A'}
                onClick={() => handleP1Answer('no')}
                className={`flex flex-col items-center justify-center w-36 h-36 sm:w-48 sm:h-48 border-[3px] rounded-3xl transition-all ${gameState === 'P1_A' && userAnswer?.choice !== 'no' ? 'opacity-40 bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm active:transform active:scale-95'}`}
              >
                <XIcon className="w-16 h-16 sm:w-20 sm:h-20 text-[#1CB0F6] mb-3" />
                <span className="font-bold text-xl text-gray-600 uppercase tracking-widest">No</span>
              </button>
            </div>
          </div>
          {gameState === 'P1_A' && <FeedbackBanner isCorrect={userAnswer?.isCorrect} currentWord={currentPool[wordIndex]} isPhase1={true} onNext={nextP1Question} />}
        </div>
      )}

      {(gameState === 'P2_Q' || gameState === 'P2_A') && (
        <div className="flex-1 flex flex-col relative bg-white">
          <TopBar showTimer={false} onSkip={() => setGameState('SUMMARY')} resetToStart={() => setGameState('START')} />
          <div className="flex-1 flex flex-col items-center justify-center p-6 pb-48 max-w-4xl mx-auto w-full">
            <h2 className="text-2xl sm:text-[28px] font-bold text-[#4b4b4b] mb-12 text-center w-full">
              Complete the sentence with the correct word
            </h2>
            <div className="w-full flex flex-col items-center">
              <form onSubmit={handleP2Submit} className="w-full relative flex flex-col items-center max-w-3xl">
                {renderSentenceWithBlanks(p2Words[wordIndex], p2Input, gameState === 'P2_A')}
                {gameState === 'P2_Q' && (
                  <button
                    type="submit"
                    disabled={p2Input.length <= getPrefixLength(p2Words[wordIndex]?.word || '')}
                    className="mt-12 bg-[#1CB0F6] hover:bg-[#1899D6] border-b-4 border-[#1899D6] text-white font-bold text-lg px-12 py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Answer
                  </button>
                )}
              </form>
              <div className="mt-14 max-w-2xl w-full bg-gray-50 rounded-2xl p-6 border border-gray-200 text-left shadow-sm">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Word Clues</h4>
                <div className="space-y-2">
                  <p className="text-gray-800 text-lg">
                    <span className="font-bold text-gray-500 mr-2">Definition:</span>
                    {p2Words[wordIndex]?.def}
                  </p>
                  <p className="text-gray-800 text-lg">
                    <span className="font-bold text-gray-500 mr-2">Vietnamese:</span>
                    {p2Words[wordIndex]?.vn}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {gameState === 'P2_A' && <FeedbackBanner isCorrect={userAnswer?.isCorrect} currentWord={p2Words[wordIndex]} isPhase1={false} onNext={nextP2Question} />}
        </div>
      )}

      {gameState === 'SUMMARY' && (
        <div className="flex-1 flex flex-col bg-gray-50 h-screen overflow-y-auto">
          <TopBar showTimer={false} resetToStart={() => setGameState('START')} />
          <div className="max-w-4xl mx-auto w-full p-6 py-12">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-[#1CB0F6] p-8 text-white text-center">
                <h2 className="text-3xl font-black mb-2">Round {roundIndex + 1} Complete!</h2>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <span className="text-lg opacity-90">Your Score:</span>
                  <span className="text-3xl font-bold bg-white text-[#1CB0F6] px-4 py-1 rounded-full shadow-sm">{roundScores[roundIndex]} / 40</span>
                </div>
              </div>
              <div className="p-0 sm:p-6 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-100 text-gray-500 uppercase tracking-wider text-sm">
                      <th className="p-4 font-bold rounded-tl-xl">Word</th>
                      <th className="p-4 font-bold text-center">Read & Select</th>
                      <th className="p-4 font-bold text-center">Spelling</th>
                      <th className="p-4 font-bold rounded-tr-xl">Review Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPool.map((wordObj, i) => {
                      const p1Correct = scores[wordObj.word]?.p1;
                      const p2Correct = scores[wordObj.word]?.p2;
                      const needsReview = p1Correct === false || p2Correct === false || p1Correct === undefined;
                      return (
                        <tr key={i} className={`border-b border-gray-100 last:border-0 ${needsReview ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                          <td className="p-4">
                            <span className="font-bold text-lg text-gray-800">{wordObj.word}</span>
                            {!wordObj.isReal && <span className="ml-2 text-xs font-bold px-2 py-1 bg-gray-200 text-gray-600 rounded-lg uppercase">Fake</span>}
                          </td>
                          <td className="p-4 text-center">
                            {p1Correct === true ? <CheckCircle2 className="w-6 h-6 text-[#58A700] mx-auto" /> : p1Correct === false ? <XCircle className="w-6 h-6 text-[#EA4335] mx-auto" /> : '-'}
                          </td>
                          <td className="p-4 text-center">
                            {wordObj.isReal ? (
                              p2Correct === true ? <CheckCircle2 className="w-6 h-6 text-[#58A700] mx-auto" /> : p2Correct === false ? <XCircle className="w-6 h-6 text-[#EA4335] mx-auto" /> : '-'
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </td>
                          <td className="p-4">
                            {needsReview ? (
                              <div className="flex items-start text-sm text-[#EA4335] bg-white p-3 rounded-xl border border-red-100 shadow-sm">
                                <NotebookPen className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold block mb-1">Add to Notebook:</span>
                                  {wordObj.isReal ? `${wordObj.word} - ${wordObj.def} (${wordObj.vn})` : `Fake word trap imitating: ${wordObj.imitating}`}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[#58A700] font-medium flex items-center text-sm">
                                <Check className="w-4 h-4 mr-1" /> Mastered
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setGameState('START')}
                  className="bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-bold text-lg px-8 py-4 rounded-2xl transition-all shadow-sm flex items-center justify-center"
                >
                  Back to Home
                </button>
                {roundIndex < 9 && (
                  <button
                    onClick={() => startRound(roundIndex + 1)}
                    className="bg-[#1CB0F6] hover:bg-[#1899D6] border-b-4 border-[#1899D6] text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all transform hover:scale-105 shadow-md flex items-center justify-center"
                  >
                    Start Round {roundIndex + 2} <ArrowRight className="w-6 h-6 ml-2" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}