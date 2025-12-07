import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Wifi, WifiOff } from 'lucide-react';

export default function RealtimeIndicator({ isConnected = true, showPulse = true }) {
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    if (!showPulse) return;
    
    const interval = setInterval(() => {
      setPulseCount(prev => prev + 1);
    }, 5000); // Pulse toutes les 5 secondes (correspond au polling CRITICAL)

    return () => clearInterval(interval);
  }, [showPulse]);

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence>
        {showPulse && (
          <motion.div
            key={pulseCount}
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute w-3 h-3 bg-green-400 rounded-full"
          />
        )}
      </AnimatePresence>
      
      <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} relative z-10`} />
      
      {isConnected ? (
        <Activity className="w-4 h-4 text-green-600 animate-pulse" />
      ) : (
        <WifiOff className="w-4 h-4 text-red-600" />
      )}
      
      <span className="text-xs text-gray-600 font-medium">
        {isConnected ? 'Temps réel' : 'Hors-ligne'}
      </span>
    </div>
  );
}