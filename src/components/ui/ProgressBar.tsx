import React from 'react';

interface ProgressBarProps {
  progress: number;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

export default function ProgressBar({ progress, total, status, message }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;
  
  const colors = {
    pending: 'bg-gray-200',
    processing: 'bg-blue-600',
    completed: 'bg-green-600',
    error: 'bg-red-600'
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{message || `${progress} sur ${total}`}</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all ${colors[status]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}