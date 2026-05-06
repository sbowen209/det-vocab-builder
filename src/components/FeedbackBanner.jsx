import React, { useEffect, useRef } from 'react';
import { Volume2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { playChime } from '../utils/sound';

export function FeedbackBanner({ isCorrect, currentWord, isWordRecognition, shouldChime = false, onNext }) {
  const audioState = useRef(null);

  useEffect(() => {
    if (shouldChime) {
      playChime(isCorrect ? 'correct' : 'incorrect');
    }

    if (!currentWord?.isReal) return;

    const state = { isCancelled: false, currentAudio: null };
    audioState.current = state;
    const basePath = import.meta.env.BASE_URL || '/';

    const aWord = new Audio(`${basePath}audio/word_${currentWord.word.toLowerCase()}.mp3`);
    const aDef = new Audio(`${basePath}audio/def_${currentWord.word.toLowerCase()}.mp3`);
    const aSent = new Audio(`${basePath}audio/sentence_${currentWord.word.toLowerCase()}.mp3`);
    
    aWord.preload = 'auto';
    aDef.preload = 'auto';
    aSent.preload = 'auto';

    const playAudioObj = (audioObj) => new Promise((resolve, reject) => {
      state.currentAudio = audioObj;
      audioObj.onended = resolve;
      audioObj.onerror = reject;
      audioObj.play().catch(reject);
    });

    const runSequence = async () => {
      try {
        if (shouldChime) await new Promise(r => setTimeout(r, 200)); 
        if (state.isCancelled) return;

        if (isWordRecognition) {
          await playAudioObj(aWord);
          if (state.isCancelled) return;
          
          await playAudioObj(aDef);
          if (state.isCancelled) return;
        }

        await playAudioObj(aSent);
      } catch (e) {
        console.warn("Audio playback interrupted", e);
      }
    };

    runSequence();

    return () => {
      state.isCancelled = true;
      if (state.currentAudio) state.currentAudio.pause();
    };
  }, [isCorrect, currentWord, isWordRecognition, shouldChime]);

  const playManualAudio = (type) => {
    const basePath = import.meta.env.BASE_URL || '/';
    const a = new Audio(`${basePath}audio/${type}_${currentWord.word.toLowerCase()}.mp3`);
    a.play().catch(e => console.warn(e));
  };

  const btnClass = `p-3 mr-5 bg-white/90 border-2 rounded-full shadow-sm transition-all group flex-shrink-0 mt-1 ${
    isCorrect ? 'border-[#B3E6B3] hover:border-[#58A700] hover:bg-[#E5F8E5]' : 'border-[#FFCCCC] hover:border-[#EA4335] hover:bg-[#FFE5E5]'
  }`;
  const iconClass = `w-6 h-6 ${isCorrect ? 'text-[#58A700]' : 'text-[#EA4335]'}`;

  return (
    <div className={`fixed bottom-0 left-0 w-full p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center z-50 animate-in slide-in-from-bottom-4 duration-300 border-t-2 ${
      isCorrect ? 'bg-[#D7FFD7] border-[#B3E6B3]' : 'bg-[#FFE5E5] border-[#FFCCCC]'
    }`}>
      
      <div className="mb-6 sm:mb-0 max-w-5xl pt-2 w-full pr-4">
        
        <div className={`font-black text-2xl flex items-center mb-5 ${isCorrect ? 'text-[#58A700]' : 'text-[#EA4335]'}`}>
          {isCorrect ? (
            <><CheckCircle2 className="w-7 h-7 mr-2 fill-current text-white" strokeWidth={2} /> Correct!</>
          ) : (
            <><XCircle className="w-7 h-7 mr-2 fill-current text-white" strokeWidth={2} /> Incorrect</>
          )}
        </div>

        {currentWord?.isReal ? (
          <div className="flex flex-col space-y-4">
            
            {/* 1. Target Word */}
            <div className="flex items-start">
              <button onClick={() => playManualAudio('word')} className={btnClass}>
                <Volume2 className={iconClass} strokeWidth={2.5} />
              </button>
              <div className="pt-0.5 w-full">
                <span className={`text-xs font-bold uppercase tracking-widest block mb-0.5 ${isCorrect ? 'text-[#468500]' : 'text-[#C9362A]'}`}>
                  Target Word
                </span>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                  <span className={`text-2xl font-black capitalize leading-none ${isCorrect ? 'text-[#3E7500]' : 'text-[#A32D23]'}`}>
                    {currentWord.word}
                  </span>
                  <span className={`text-[15px] font-bold uppercase tracking-wider ${isCorrect ? 'text-[#58A700]' : 'text-[#EA4335]'}`}>
                    {currentWord.vn}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Side-by-Side Definition */}
            <div className={`pt-3 border-t ${isCorrect ? 'border-[#B3E6B3]' : 'border-[#FFCCCC]'} flex items-start`}>
              <button onClick={() => playManualAudio('def')} className={btnClass}>
                <Volume2 className={iconClass} strokeWidth={2.5} />
              </button>
              <div className="pt-1 w-full">
                <span className={`text-xs font-bold uppercase tracking-widest block mb-1.5 ${isCorrect ? 'text-[#468500]' : 'text-[#C9362A]'}`}>
                  Definition / Định nghĩa
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-6">
                  <p className={`text-lg font-medium leading-tight ${isCorrect ? 'text-[#3E7500]/90' : 'text-[#A32D23]/90'}`}>
                    {currentWord.def}
                  </p>
                  {currentWord.vnDef && (
                    <p className={`text-[16px] font-medium leading-tight ${isCorrect ? 'text-[#3E7500]/70' : 'text-[#A32D23]/70'}`}>
                      {currentWord.vnDef}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Side-by-Side Example Sentence */}
            <div className={`pt-3 border-t ${isCorrect ? 'border-[#B3E6B3]' : 'border-[#FFCCCC]'} flex items-start`}>
              <button onClick={() => playManualAudio('sentence')} className={btnClass}>
                <Volume2 className={iconClass} strokeWidth={2.5} />
              </button>
              <div className="pt-1 w-full">
                <span className={`text-xs font-bold uppercase tracking-widest block mb-1.5 ${isCorrect ? 'text-[#468500]' : 'text-[#C9362A]'}`}>
                  Example / Ví dụ
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-6">
                  <p className={`text-lg font-medium italic leading-tight ${isCorrect ? 'text-[#3E7500]/90' : 'text-[#A32D23]/90'}`}>
                    "{currentWord.sent}"
                  </p>
                  {currentWord.vnSent && (
                    <p className={`text-[16px] font-medium italic leading-tight ${isCorrect ? 'text-[#3E7500]/70' : 'text-[#A32D23]/70'}`}>
                      "{currentWord.vnSent}"
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>
        ) : (
          <p className="flex items-center text-xl text-[#A32D23] font-medium pt-2">
            <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0" />
            This is a fake word trying to imitate: <strong className="ml-2 font-black">{currentWord.imitating}</strong>
          </p>
        )}
      </div>

      <button onClick={onNext} className={`w-full sm:w-auto px-12 py-5 rounded-xl font-bold text-white text-lg uppercase tracking-widest transition-all active:scale-95 flex-shrink-0 self-end sm:self-center mt-6 sm:mt-0 shadow-sm ${isCorrect ? 'bg-[#58A700] hover:bg-[#468500]' : 'bg-[#EA4335] hover:bg-[#C9362A]'}`}>
        Continue
      </button>
    </div>
  );
}