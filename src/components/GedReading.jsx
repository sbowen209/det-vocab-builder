import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, XCircle, Flag, BookOpen, GripVertical, HelpCircle, X as XIcon, Clock } from 'lucide-react';

export default function GedReading({ lessonData, onComplete, onQuit }) {
  // Phases: 0 = Overview, 1 = Timed Testing, 2 = Review & Grade, 3 = Vocabulary Study
  const [phase, setPhase] = useState(0);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  const [userAnswers, setUserAnswers] = useState({}); 
  const [flagged, setFlagged] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); 
  const [activeTerm, setActiveTerm] = useState(null);

  const gradedQuestions = lessonData.questions || [];
  const isSubmitGate = currentQIndex === gradedQuestions.length;

  // --- 15 MINUTE TIMED COUNTDOWN ---
  useEffect(() => {
    if (phase !== 1) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          alert("Time is up! Submitting your test for grading.");
          setPhase(2);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const formatTimer = () => {
    const mins = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
    const secs = (timeRemaining % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleMCQSelect = (qId, val) => {
    if (phase !== 1) return;
    setUserAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const toggleFlag = (qId) => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  // --- GRADING SYSTEM ---
  const checkQuestionCorrectness = (q) => {
    const answer = userAnswers[q.id];
    if (!answer) return false;

    if (q.type === 'mcq') return answer === q.correct;

    if (q.type === 'dnd') {
      let isAllCorrect = true;
      for (const claim of q.claims) {
        const userVals = claim.dropzones.map(dz => answer[dz]).filter(Boolean);
        const correctVals = q.correctSets[claim.id];
        const matching = userVals.length === correctVals.length && correctVals.every(v => userVals.includes(v));
        if (!matching) {
          isAllCorrect = false;
          break;
        }
      }
      return isAllCorrect;
    }
    return false;
  };

  const calculateFinalScore = () => {
    if (gradedQuestions.length === 0) return 0;
    let rawCorrect = 0;
    gradedQuestions.forEach(q => {
      if (checkQuestionCorrectness(q)) rawCorrect++;
    });
    return Math.round((rawCorrect / gradedQuestions.length) * 10);
  };

  const getAnsweredCount = () => {
    let count = 0;
    gradedQuestions.forEach(q => {
      const ans = userAnswers[q.id];
      if (q.type === 'mcq' && ans) count++;
      if (q.type === 'dnd' && ans) {
        const expectedDz = q.claims.reduce((sum, c) => sum + c.dropzones.length, 0);
        if (Object.keys(ans).length === expectedDz) count++;
      }
    });
    return count;
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e, val) => {
    if (phase !== 1) return;
    e.dataTransfer.setData("text/plain", val);
  };

  const handleDropOnZone = (e, qId, dzId) => {
    if (phase !== 1) return;
    e.preventDefault();
    const val = e.dataTransfer.getData("text/plain");
    if (!val) return;

    setUserAnswers(prev => {
      const qAns = prev[qId] || {};
      const cleanAns = { ...qAns };
      Object.keys(cleanAns).forEach(k => { if (cleanAns[k] === val) delete cleanAns[k]; });
      return { ...prev, [qId]: { ...cleanAns, [dzId]: val } };
    });
  };

  const handleDropOnBank = (e, qId) => {
    if (phase !== 1) return;
    e.preventDefault();
    const val = e.dataTransfer.getData("text/plain");
    if (!val) return;

    setUserAnswers(prev => {
      const qAns = { ...prev[qId] };
      Object.keys(qAns).forEach(k => { if (qAns[k] === val) delete qAns[k]; });
      return { ...prev, [qId]: qAns };
    });
  };

  // --- DET TOP BAR REPLICA ---
  const renderTopBar = () => {
    const progress = phase === 1 ? (currentQIndex / gradedQuestions.length) * 100 : 100;
    
    return (
      <div className="flex justify-between items-center p-4 border-b-2 border-gray-200 bg-white shadow-sm z-20 relative h-20 shrink-0">
        <div className="flex items-center text-gray-700 font-bold text-xl w-1/4">
          <button onClick={onQuit} className="hover:bg-gray-100 p-2 rounded-xl mr-2 transition-colors text-gray-400 hover:text-gray-600">
            <XIcon className="w-7 h-7" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 mx-4 max-w-2xl hidden md:block">
          <div className="w-full bg-gray-200 rounded-full h-4 border-2 border-gray-200 overflow-hidden">
            <div className={`h-full transition-all duration-500 rounded-full ${phase === 1 ? 'bg-[#58A700]' : 'bg-[#1CB0F6]'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="flex items-center justify-end w-1/4">
          {phase === 1 ? (
            <div className={`flex items-center font-black text-xl px-5 py-2 rounded-2xl border-2 ${timeRemaining <= 60 ? 'text-[#EA4335] bg-red-50 border-red-200 animate-pulse' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
              <Clock className="w-6 h-6 mr-2 opacity-80" />
              {formatTimer()}
            </div>
          ) : (
            <div className="font-black text-sm px-5 py-2.5 rounded-2xl border-2 border-gray-200 bg-gray-50 uppercase tracking-widest text-[#1CB0F6]">
              {phase === 2 ? 'Review Mode' : phase === 3 ? 'Study Mode' : 'Overview'}
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- INTERACTIVE HIGHLIGHTER PARSER ---
  const renderInteractiveParagraphs = (paragraphs) => {
    if (!paragraphs) return null;
    return paragraphs.map((para, pIdx) => {
      const parts = para.split(/({.*?})/);
      return (
        <div key={pIdx} className="flex items-start gap-4 mb-6">
          <span className="font-bold text-gray-400 select-none text-sm pt-1">{pIdx + 1}</span>
          <p className="font-serif text-[1.1rem] text-gray-700 leading-[1.8] flex-1">
            {parts.map((part, partIdx) => {
              if (part.startsWith('{') && part.endsWith('}')) {
                const term = part.slice(1, -1);
                const isActive = phase === 3;
                return (
                  <span
                    key={partIdx}
                    onClick={() => isActive && setActiveTerm(term)}
                    className={`${
                      isActive 
                        ? 'bg-yellow-100 hover:bg-yellow-200 border-b-[3px] border-yellow-300 cursor-pointer text-gray-900 px-1.5 py-0.5 rounded-md transition-all font-bold' 
                        : 'text-gray-800 font-serif'
                    }`}
                  >
                    {term}
                  </span>
                );
              }
              return part;
            })}
          </p>
        </div>
      );
    });
  };

  // --- DYNAMIC BOUNCY QUESTION RENDERER ---
  const renderActiveQuestionView = (q) => {
    if (q.type === 'mcq') {
      return (
        <div className="space-y-4 mt-6">
          {q.options.map((opt) => {
            const isSelected = userAnswers[q.id] === opt.val;
            return (
              <label 
                key={opt.val} 
                onClick={() => handleMCQSelect(q.id, opt.val)}
                className={`group flex items-start p-5 rounded-[1.25rem] border-2 transition-all cursor-pointer select-none ${
                  isSelected 
                    ? 'border-[#1CB0F6] bg-[#ddf4ff] border-b-4' 
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 border-b-4 active:border-b-2 active:translate-y-[2px]'
                }`}
              >
                <div className={`shrink-0 w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center mt-0.5 transition-colors ${
                  isSelected ? 'border-[#1CB0F6] bg-[#1CB0F6]' : 'border-gray-300 bg-white group-hover:border-gray-400'
                }`}>
                  {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </div>
                <span className={`font-medium text-[16px] leading-relaxed ${isSelected ? 'text-[#1CB0F6]' : 'text-gray-700'}`}>{opt.text}</span>
              </label>
            );
          })}
        </div>
      );
    }

    if (q.type === 'dnd') {
      const currentAns = userAnswers[q.id] || {};
      const itemsInDropzones = Object.values(currentAns);
      const availableBankItems = q.bank.filter(b => !itemsInDropzones.includes(b.val));

      return (
        <div className="space-y-6 mt-6">
          {/* Options Bank */}
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDropOnBank(e, q.id)}
            className="p-5 bg-gray-100 border-2 border-gray-200 rounded-[1.5rem] min-h-[120px] flex flex-wrap gap-3 items-center justify-center"
          >
            {availableBankItems.length === 0 && <span className="text-gray-400 font-bold text-sm w-full text-center uppercase tracking-widest">All options placed</span>}
            {availableBankItems.map((item) => (
              <div
                key={item.val}
                draggable
                onDragStart={(e) => handleDragStart(e, item.val)}
                className="bg-white border-2 border-gray-200 border-b-4 rounded-xl p-3 px-4 shadow-sm cursor-grab active:cursor-grabbing flex items-center gap-2 font-bold text-sm text-gray-700 hover:border-[#1CB0F6] hover:text-[#1CB0F6] transition-colors active:border-b-2 active:translate-y-[2px]"
              >
                <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Target Dropzones */}
          <div className="grid grid-cols-1 gap-5">
            {q.claims.map((claim) => (
              <div key={claim.id} className="bg-white border-2 border-gray-200 rounded-[1.5rem] p-6 shadow-sm">
                <h4 className="font-black text-gray-800 text-lg mb-4 text-center">{claim.text}</h4>
                <div className="space-y-3">
                  {claim.dropzones.map((dzId, dzIdx) => {
                    const filledVal = currentAns[dzId];
                    const itemData = q.bank.find(b => b.val === filledVal);

                    return (
                      <div
                        key={dzId}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropOnZone(e, q.id, dzId)}
                        className={`border-2 rounded-xl p-4 min-h-[70px] flex items-center justify-center transition-all ${
                          filledVal ? 'border-[#1CB0F6] bg-[#ddf4ff]' : 'border-dashed border-gray-300 bg-gray-50'
                        }`}
                      >
                        {itemData ? (
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, itemData.val)}
                            className="bg-white border-2 border-[#1CB0F6] border-b-4 rounded-xl p-3 px-4 shadow-sm cursor-grab active:cursor-grabbing w-full flex items-center gap-2 text-sm font-bold text-[#1CB0F6]"
                          >
                            <GripVertical className="w-4 h-4 opacity-50 shrink-0" />
                            <span>{itemData.text}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs font-black uppercase tracking-widest select-none">Drop Option Here</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  // ==========================================
  // PHASE 0: OVERVIEW
  // ==========================================
  if (phase === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans h-screen overflow-hidden text-gray-800">
        {renderTopBar()}
        <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-[2rem] shadow-xl p-10 max-w-xl w-full border-2 border-gray-100 text-center">
            <div className="w-24 h-24 bg-[#ddf4ff] text-[#1CB0F6] rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform rotate-3">
              <BookOpen className="w-12 h-12" strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-black mb-4 tracking-tight text-gray-800">{lessonData.title}</h2>
            <p className="text-gray-500 font-medium mb-8 text-lg">Test your reading comprehension using standard GED formatting and logic.</p>
            
            <div className="space-y-4 bg-gray-50 rounded-[1.5rem] p-6 border-2 border-gray-200 text-left mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1CB0F6] text-white font-black flex items-center justify-center shrink-0 shadow-sm text-lg">1</div>
                <div><span className="font-black text-gray-800 text-lg block">Timed Test</span><span className="text-sm text-gray-500 font-medium">15 minutes to complete {gradedQuestions.length} questions.</span></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1CB0F6] text-white font-black flex items-center justify-center shrink-0 shadow-sm text-lg">2</div>
                <div><span className="font-black text-gray-800 text-lg block">Score & Review</span><span className="text-sm text-gray-500 font-medium">See your grade and bilingual explanations.</span></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1CB0F6] text-white font-black flex items-center justify-center shrink-0 shadow-sm text-lg">3</div>
                <div><span className="font-black text-gray-800 text-lg block">Vocab Study</span><span className="text-sm text-gray-500 font-medium">Deep-dive interactive dictionary.</span></div>
              </div>
            </div>

            <button 
              onClick={() => { setPhase(1); setCurrentQIndex(0); }}
              className="w-full bg-[#58A700] hover:bg-[#468500] text-white font-black py-5 rounded-2xl shadow-sm uppercase tracking-widest text-lg transition-all border-b-4 border-[#468500] active:border-b-0 active:translate-y-[4px]"
            >
              Start Practice Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHASE 2: REVIEW & GRADE
  // ==========================================
  if (phase === 2) {
    const finalScore = calculateFinalScore();
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans h-screen overflow-hidden">
        {renderTopBar()}
        
        <div className="max-w-4xl mx-auto w-full p-6 space-y-8 flex-1 overflow-y-auto pb-32">
          <div className="bg-white rounded-[2rem] p-10 border-2 border-gray-100 shadow-sm text-center">
            <div className="w-24 h-24 bg-[#d7ffd7] text-[#58A700] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-14 h-14" strokeWidth={3} />
            </div>
            <h3 className="text-3xl font-black text-gray-800 mb-2">Practice Complete!</h3>
            <div className="text-6xl font-black text-[#1CB0F6] my-6">{finalScore} <span className="text-2xl text-gray-400">/ 10</span></div>
            <div className="text-gray-400 font-black uppercase tracking-widest text-sm">Total Mastery Score</div>
          </div>
          
          {gradedQuestions.map((q, idx) => {
            const isCorrect = checkQuestionCorrectness(q);
            const userAns = userAnswers[q.id];

            return (
              <div key={q.id} className={`bg-white rounded-[2rem] p-8 border-2 shadow-sm ${isCorrect ? 'border-[#B3E6B3]' : 'border-[#FFCCCC]'}`}>
                <h4 className="font-black text-gray-800 text-xl mb-6">{idx + 1}. {q.title}</h4>
                
                {/* MCQ Review */}
                {q.type === 'mcq' && (
                  <div className="space-y-3 mb-8">
                    {q.options.map(opt => {
                      const isTargetCorrect = opt.val === q.correct;
                      const isTargetUserSelected = userAns === opt.val;
                      let bgClass = "bg-white border-gray-200 text-gray-600";
                      if (isTargetCorrect) bgClass = "bg-[#d7ffd7] border-[#58A700] border-2 text-[#468500] font-bold";
                      if (isTargetUserSelected && !isTargetCorrect) bgClass = "bg-[#ffdfe0] border-[#EA4335] border-2 text-[#C9362A] line-through";

                      return (
                        <div key={opt.val} className={`p-4 rounded-xl text-[15px] font-medium flex items-start gap-3 border-2 ${bgClass}`}>
                          {isTargetCorrect && <CheckCircle className="w-6 h-6 shrink-0" />}
                          {isTargetUserSelected && !isTargetCorrect && <XCircle className="w-6 h-6 shrink-0" />}
                          {!isTargetCorrect && !isTargetUserSelected && <div className="w-6 h-6 shrink-0 border-2 border-gray-300 rounded-full" />}
                          <span className="mt-0.5">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* DnD Review */}
                {q.type === 'dnd' && (
                  <div className="space-y-4 mb-8">
                    {q.claims.map(claim => {
                      const claimUserVals = claim.dropzones.map(dz => (userAns || {})[dz]).filter(Boolean);
                      const claimCorrectVals = q.correctSets[claim.id];
                      const userStrings = claimUserVals.map(v => q.bank.find(b => b.val === v)?.text || v).join(" AND ");
                      const correctStrings = claimCorrectVals.map(v => q.bank.find(b => b.val === v)?.text || v).join(" AND ");
                      const isClaimCorrect = claimUserVals.length === claimCorrectVals.length && claimCorrectVals.every(v => claimUserVals.includes(v));

                      return (
                        <div key={claim.id} className={`p-6 rounded-2xl border-2 space-y-3 ${isClaimCorrect ? 'bg-[#d7ffd7] border-[#B3E6B3]' : 'bg-[#ffdfe0] border-[#FFCCCC]'}`}>
                          <div className="font-black text-gray-800 text-lg">{claim.text}</div>
                          <div className={`font-bold text-[15px] ${isClaimCorrect ? 'text-[#468500]' : 'text-[#C9362A]'}`}>
                            Your Choice: <span className="font-medium bg-white/50 px-2 py-1 rounded ml-1">{userStrings || "None"}</span>
                          </div>
                          {!isClaimCorrect && (
                            <div className="font-bold text-[#468500] text-[15px] pt-3 border-t border-black/10 mt-2">
                              Correct Answer: <span className="font-medium bg-white/50 px-2 py-1 rounded ml-1">{correctStrings}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Feedback Banner Style inside Review */}
                <div className={`rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-4 ${isCorrect ? 'bg-[#d7ffd7] text-[#468500]' : 'bg-[#ffdfe0] text-[#C9362A]'}`}>
                  <div className="shrink-0 mt-1">
                    {isCorrect ? <CheckCircle className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                  </div>
                  <div className="space-y-3 font-medium text-lg leading-relaxed">
                    <span className="font-black text-xl uppercase tracking-wider block mb-2">{isCorrect ? 'Correct!' : 'Incorrect'}</span>
                    <p className="text-gray-800">{q.expEn}</p>
                    <p className="italic opacity-90 text-[16px] border-t border-black/10 pt-3">"{q.expVn}"</p>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => setPhase(3)}
            className="w-full bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-black py-5 rounded-2xl shadow-sm uppercase tracking-widest text-lg transition-all border-b-4 border-[#1899D6] active:border-b-0 active:translate-y-[4px] mt-8"
          >
            Start Vocabulary Study
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHASE 3: VOCABULARY STUDY (Single Column)
  // ==========================================
  if (phase === 3) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans h-screen overflow-hidden relative">
        {renderTopBar()}
        
        {/* Single Centered Column for Reading */}
        <div className="flex-1 overflow-y-auto pb-48 p-4 sm:p-8">
          <div className="max-w-4xl mx-auto space-y-10 bg-white p-8 sm:p-12 rounded-[2rem] shadow-sm border-2 border-gray-100">
            <div className="text-center mb-10 border-b-2 border-gray-100 pb-8">
              <h2 className="text-3xl sm:text-4xl font-black text-gray-800 mb-6">{lessonData.passageTitle}</h2>
              <div className="bg-[#fff9e6] border-2 border-[#ffc800] p-5 rounded-[1.5rem] text-[15px] font-bold text-yellow-800 shadow-sm inline-block">
                Click on the <span className="bg-[#ffc800] text-white px-2 py-1 rounded-md mx-1 uppercase tracking-wider">highlighted words</span> to study their definitions.
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-400 font-black uppercase tracking-widest mb-6">{lessonData.passage1Meta}</p>
              <div className="mt-4">{renderInteractiveParagraphs(lessonData.passage1Paragraphs)}</div>
            </div>

            <div className="pt-10 border-t-2 border-dashed border-gray-200">
              <p className="text-sm text-gray-400 font-black uppercase tracking-widest mb-6">{lessonData.passage2Meta}</p>
              <div className="mt-4">{renderInteractiveParagraphs(lessonData.passage2Paragraphs)}</div>
            </div>

            <button
              onClick={() => onComplete(calculateFinalScore())}
              className="w-full bg-[#58A700] hover:bg-[#468500] text-white font-black py-5 rounded-2xl shadow-sm uppercase tracking-widest text-lg transition-all border-b-4 border-[#468500] active:border-b-0 active:translate-y-[4px] mt-12"
            >
              Finish & Save Score
            </button>
          </div>
        </div>

        {/* DET-Style Feedback Bottom Banner */}
        {activeTerm && lessonData.glossary[activeTerm] && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1CB0F6] text-white border-t-2 border-[#1899D6] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] p-6 md:px-10 animate-in slide-in-from-bottom-full duration-300">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              
              <div className="flex-1 w-full">
                <div className="flex items-center mb-4">
                  <div className="bg-white/20 p-3 rounded-full mr-4">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <span className="font-black text-4xl capitalize tracking-tight drop-shadow-sm">{activeTerm}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mt-4 bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/20">
                  <div>
                    <span className="font-black uppercase tracking-widest text-xs text-blue-200 block mb-2">English Meaning</span>
                    <p className="font-bold text-xl leading-snug text-white">{lessonData.glossary[activeTerm].def}</p>
                  </div>
                  <div className="sm:border-l sm:border-white/20 sm:pl-8">
                    <span className="font-black uppercase tracking-widest text-xs text-blue-200 block mb-2">Vietnamese Meaning</span>
                    <p className="font-black text-2xl leading-snug text-white mb-1">{lessonData.glossary[activeTerm].vn}</p>
                    <p className="font-medium italic text-[16px] text-blue-100 leading-snug">"{lessonData.glossary[activeTerm].vnDef}"</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setActiveTerm(null)} 
                className="w-full md:w-auto px-12 py-5 bg-white text-[#1CB0F6] hover:bg-gray-50 rounded-2xl font-black uppercase tracking-widest text-lg transition-all shadow-sm border-b-4 border-gray-200 active:border-b-0 active:translate-y-[4px] shrink-0"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // PHASE 1: SPLIT SCREEN TIMED TESTING
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans h-screen overflow-hidden text-gray-800">
      {renderTopBar()}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1600px] mx-auto w-full">
        {/* Left Passage Module */}
        <div className="lg:w-1/2 bg-white p-6 lg:p-12 overflow-y-auto border-b-2 lg:border-b-0 lg:border-r-2 border-gray-200 z-10">
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-2xl font-black text-gray-800 border-b-2 border-gray-100 pb-4 mb-8">{lessonData.passageTitle}</h2>
            <div>
              <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-6">{lessonData.passage1Meta}</p>
              <div className="mt-4">{renderInteractiveParagraphs(lessonData.passage1Paragraphs)}</div>
            </div>

            <div className="pt-8 border-t-2 border-dashed border-gray-200">
              <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-6">{lessonData.passage2Meta}</p>
              <div className="mt-4">{renderInteractiveParagraphs(lessonData.passage2Paragraphs)}</div>
            </div>
          </div>
        </div>

        {/* Right Active Interaction Panel */}
        <div className="lg:w-1/2 bg-slate-50 p-6 lg:p-10 flex flex-col overflow-y-auto relative">
          <div className="flex-1 max-w-xl mx-auto w-full flex flex-col">
            
            {!isSubmitGate ? (
              <div className="flex-1 flex flex-col pb-10">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-gray-400 text-xs font-black uppercase tracking-widest block mb-2">
                      {gradedQuestions[currentQIndex].type === 'mcq' ? 'Select the correct answer' : 'Drag & Drop to Categorize'}
                    </span>
                    <h3 className="text-2xl font-black text-gray-800 leading-snug">{gradedQuestions[currentQIndex].title}</h3>
                  </div>
                  <button 
                    onClick={() => toggleFlag(gradedQuestions[currentQIndex].id)}
                    className={`flex items-center justify-center w-14 h-14 rounded-2xl border-2 border-b-4 active:border-b-2 active:translate-y-[2px] transition-all shrink-0 ${
                      flagged.has(gradedQuestions[currentQIndex].id) 
                        ? 'bg-[#ffdfe0] border-[#EA4335] text-[#C9362A]' 
                        : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <Flag className={`w-6 h-6 ${flagged.has(gradedQuestions[currentQIndex].id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="flex-1">{renderActiveQuestionView(gradedQuestions[currentQIndex])}</div>
              </div>
            ) : (
              <div className="space-y-6 flex-1 flex flex-col justify-center">
                <div className="w-24 h-24 bg-[#ddf4ff] text-[#1CB0F6] rounded-full flex items-center justify-center mx-auto mb-2">
                   <CheckCircle className="w-12 h-12" strokeWidth={3} />
                </div>
                <h3 className="text-3xl font-black text-gray-800 text-center mb-4">Ready to Submit?</h3>
                
                <div className="bg-white border-2 border-gray-200 rounded-[2rem] p-8 shadow-sm divide-y-2 divide-gray-100">
                  {gradedQuestions.map((q, idx) => {
                    const ans = userAnswers[q.id];
                    let isFilled = !!ans;
                    if (q.type === 'dnd' && ans) {
                      const totalDz = q.claims.reduce((sum, c) => sum + c.dropzones.length, 0);
                      isFilled = Object.keys(ans).length === totalDz;
                    }

                    return (
                      <div key={q.id} className="py-4 flex items-center justify-between font-bold text-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-700">Question {idx + 1}</span>
                          {flagged.has(q.id) && <span className="bg-[#ffdfe0] text-[#C9362A] border border-[#EA4335] text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex items-center gap-1"><Flag className="w-3 h-3 fill-current" /> Flagged</span>}
                        </div>
                        <span className={`font-black uppercase tracking-widest text-sm ${isFilled ? 'text-[#58A700]' : 'text-[#EA4335]'}`}>
                          {isFilled ? 'Answered' : 'Empty'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPhase(2)}
                  disabled={getAnsweredCount() !== gradedQuestions.length}
                  className={`w-full font-black py-5 rounded-2xl shadow-sm uppercase tracking-widest text-lg transition-all border-b-4 active:border-b-0 active:translate-y-[4px] mt-6
                    ${getAnsweredCount() === gradedQuestions.length 
                      ? 'bg-[#1CB0F6] hover:bg-[#1899D6] border-[#1899D6] text-white' 
                      : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'}`}
                >
                  {getAnsweredCount() === gradedQuestions.length ? 'Submit Final Test' : `Answer all questions (${getAnsweredCount()}/${gradedQuestions.length})`}
                </button>
              </div>
            )}
          </div>

          {/* Bottom Control Bar */}
          <div className="shrink-0 flex justify-between items-center max-w-xl mx-auto w-full pt-6">
            <button
              onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
              className={`flex items-center px-6 py-4 font-black rounded-2xl uppercase tracking-widest text-sm transition-all border-2 border-b-4 active:border-b-2 active:translate-y-[2px]
                ${currentQIndex === 0 ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
            >
              <ChevronLeft className="w-5 h-5 mr-1" strokeWidth={3} /> Back
            </button>
            
            <div className="text-sm font-black text-gray-300 uppercase tracking-widest select-none hidden sm:block">
              {isSubmitGate ? "Review Terminal" : `Task ${currentQIndex + 1} of ${gradedQuestions.length}`}
            </div>

            <button
              onClick={() => setCurrentQIndex(prev => Math.min(gradedQuestions.length, prev + 1))}
              disabled={isSubmitGate}
              className={`flex items-center px-6 py-4 font-black rounded-2xl uppercase tracking-widest text-sm transition-all border-2 border-b-4 active:border-b-2 active:translate-y-[2px]
                ${isSubmitGate ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed' : 'bg-[#1CB0F6] hover:bg-[#1899D6] text-white border-[#1899D6]'}`}
            >
              Next <ChevronRight className="w-5 h-5 ml-1" strokeWidth={3} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}