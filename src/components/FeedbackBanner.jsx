import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const FeedbackBanner = ({ isCorrect, currentWord, isPhase1, onNext }) => {
  return (
    <div className={`absolute bottom-0 left-0 w-full p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-all duration-300 z-50 ${isCorrect ? 'bg-[#E5F8E5]' : 'bg-[#FFE5E5]'}`}>
      <div className="mb-4 sm:mb-0">
        <div className={`font-black text-2xl flex items-center mb-3 ${isCorrect ? 'text-[#58A700]' : 'text-[#EA4335]'}`}>
          {isCorrect ? <CheckCircle2 className="w-8 h-8 mr-2" strokeWidth={3} /> : <XCircle className="w-8 h-8 mr-2" strokeWidth={3} />}
          {isCorrect ? 'Correct!' : 'Incorrect'}
        </div>
        
        <div className={`text-base sm:text-lg max-w-3xl ${isCorrect ? 'text-[#3E7500]' : 'text-[#A32D23]'}`}>
          {currentWord.isReal ? (
            <div className="space-y-1">
              <p><strong className="opacity-75">Word:</strong> <span className="font-bold">{currentWord.word}</span></p>
              {isPhase1 && (
                <>
                  <p><strong className="opacity-75">Definition:</strong> {currentWord.def}</p>
                  <p><strong className="opacity-75">Example:</strong> <em>"{currentWord.sent}"</em></p>
                  <p><strong className="opacity-75">Vietnamese:</strong> {currentWord.vn}</p>
                </>
              )}
            </div>
          ) : (
            <p className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              This is a fake word trying to imitate: <strong className="ml-2">{currentWord.imitating}</strong>
            </p>
          )}
        </div>
      </div>
      <button
        onClick={onNext}
        className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-white uppercase tracking-wider transition-all transform hover:scale-105 shadow-md ${isCorrect ? 'bg-[#58A700] hover:bg-[#468500] border-b-4 border-[#468500]' : 'bg-[#EA4335] hover:bg-[#C9362A] border-b-4 border-[#C9362A]'}`}
      >
        Got It
      </button>
    </div>
  );
};