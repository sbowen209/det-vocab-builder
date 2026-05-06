import React from 'react';
import { Clock, BookOpen, FastForward, X as XIcon } from 'lucide-react';

export function TopBar({ showTimer, timer, onSkip, resetToStart, currentScore, totalAttempted, progress }) {
  return (
    <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white shadow-sm z-20 relative h-16">
      
      <div className="flex items-center text-gray-700 font-bold text-lg w-1/4">
        {showTimer ? (
          <>
            <Clock className="w-6 h-6 mr-2 text-gray-500" /> 
            <span className={timer <= 2 ? 'text-red-500 animate-pulse' : ''}>0:0{timer}</span>
          </>
        ) : (
          <div className="flex items-center text-[#1CB0F6]">
            <BookOpen className="w-6 h-6 mr-2" />
            <span className="hidden sm:inline whitespace-nowrap">DET Vocab Builder</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="flex-1 mx-4 max-w-md hidden md:block">
        {progress !== undefined && (
          <div className="w-full bg-gray-100 rounded-full h-3 border border-gray-200 overflow-hidden">
            <div className="bg-[#58A700] h-full transition-all duration-500 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end w-1/4 min-w-[140px]">
        {/* Fraction Score Visual */}
        {totalAttempted !== undefined && totalAttempted > 0 && (
          <div className="flex items-center space-x-1.5 font-black text-sm px-4 py-1.5 rounded-full border border-gray-200 bg-gray-50 uppercase tracking-widest mr-4">
            <span className="text-[#58A700]">{currentScore}</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-500">{totalAttempted}</span>
          </div>
        )}

        {onSkip && (
          <button onClick={onSkip} className="flex items-center text-gray-400 hover:text-gray-600 mr-4 font-bold text-sm uppercase tracking-wider transition-colors active:scale-95">
            Skip <FastForward className="w-5 h-5 ml-1" />
          </button>
        )}
        <button onClick={resetToStart} className="text-gray-400 hover:text-[#EA4335] transition-colors bg-gray-50 hover:bg-red-50 p-1.5 rounded-full">
          <XIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}