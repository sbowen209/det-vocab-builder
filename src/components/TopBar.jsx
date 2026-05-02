import React from 'react';
import { Clock, BookOpen, FastForward, X } from 'lucide-react';

export const TopBar = ({ showTimer, timer, onSkip, resetToStart }) => {
  return (
    <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white shadow-sm z-20 relative">
      <div className="flex items-center text-gray-700 font-bold text-lg">
        {showTimer ? (
          <>
            <Clock className="w-6 h-6 mr-2 text-gray-500" />
            <span className={timer <= 2 ? 'text-red-500 animate-pulse' : ''}>0:0{timer}</span>
            <span className="font-normal text-sm ml-2 text-gray-400 uppercase tracking-widest hidden sm:inline">for this question</span>
          </>
        ) : (
          <div className="flex items-center text-[#1CB0F6]">
            <BookOpen className="w-6 h-6 mr-2" />
            DET Vocabulary Builder
          </div>
        )}
      </div>
      <div className="flex items-center">
        {onSkip && (
          <button onClick={onSkip} className="flex items-center text-gray-400 hover:text-gray-600 mr-4 font-bold text-sm uppercase tracking-wider transition-colors active:scale-95">
            Skip <FastForward className="w-5 h-5 ml-1" />
          </button>
        )}
        {resetToStart && (
          <button onClick={resetToStart} className="text-gray-400 hover:text-[#EA4335] transition-colors bg-gray-50 hover:bg-red-50 p-1.5 rounded-full">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};