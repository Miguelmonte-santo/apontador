
import React from 'react';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="w-full mt-6">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-semibold text-brand-purple">Processando Scraping...</span>
        <span className="text-sm font-bold text-brand-purple">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-white rounded-full h-4 overflow-hidden border-2 border-brand-purple p-0.5">
        <div 
          className="bg-brand-purple h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
