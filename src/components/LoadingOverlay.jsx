import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Overlay de chargement global avec message personnalisé
 */
export default function LoadingOverlay({ isVisible, message, progress = null }) {
  const lang = sessionStorage.getItem('user_language') || 'fr';
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-live="polite"
          aria-busy="true"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4"
          >
            <div className="flex flex-col items-center space-y-4">
              {/* Spinner */}
              <div className="relative">
                <Loader2 className="w-16 h-16 text-[#00AEEF] animate-spin" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-[#00AEEF]/20 rounded-full" />
              </div>

              {/* Message */}
              <div className="text-center">
                <p className="font-heading text-lg text-[#0077A8] mb-2">
                  {message || (lang === 'fr' ? 'Chargement...' : 'Loading...')}
                </p>
                
                {/* Barre de progression (optionnelle) */}
                {progress !== null && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                        className="h-2 bg-gradient-to-r from-[#00AEEF] to-[#0077A8] rounded-full"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{progress}%</p>
                  </div>
                )}
              </div>

              {/* Indication de patience */}
              <p className="text-xs text-gray-500 text-center">
                {lang === 'fr' ? 'Veuillez patienter...' : 'Please wait...'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}