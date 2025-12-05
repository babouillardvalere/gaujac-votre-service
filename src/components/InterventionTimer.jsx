import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function InterventionTimer({ startTime, isActive = true }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime || !isActive) return;

    const start = new Date(startTime).getTime();
    
    const updateElapsed = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - start) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startTime, isActive]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}min ${s.toString().padStart(2, '0')}s`;
  };

  if (!startTime) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isActive ? 'bg-blue-50 text-blue-700 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
      <Clock className="w-4 h-4" />
      <span className="font-mono font-heading text-sm">
        {formatTime(elapsed)}
      </span>
    </div>
  );
}