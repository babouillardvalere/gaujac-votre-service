import React from 'react';
import { useNavigate } from 'react-router-dom';
import { setLanguage } from '../components/translations';
import Logo from '../components/Logo';
import { motion } from 'framer-motion';

export default function ChoixLangue() {
  const navigate = useNavigate();

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    navigate('/Home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 flex flex-col">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-sky-200/30 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-200/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
      
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Logo className="h-32 md:h-40 mb-12" />
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-2xl md:text-3xl font-light text-slate-700 mb-12 text-center"
        >
          Bienvenue / Welcome
        </motion.h1>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLanguageSelect('fr')}
            className="flex-1 group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-slate-100"
          >
            <div className="flex flex-col items-center gap-5">
              <div className="w-20 h-14 rounded-lg overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Flag_of_France.svg"
                  alt="Français"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-medium text-slate-700 group-hover:text-sky-600 transition-colors">
                Français
              </span>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLanguageSelect('en')}
            className="flex-1 group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-slate-100"
          >
            <div className="flex flex-col items-center gap-5">
              <div className="w-20 h-14 rounded-lg overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/8/83/Flag_of_the_United_Kingdom_%283-5%29.svg"
                  alt="English"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-medium text-slate-700 group-hover:text-sky-600 transition-colors">
                English
              </span>
            </div>
          </motion.button>
        </div>
      </div>

      <footer className="py-6 text-center text-slate-400 text-sm">
        © {new Date().getFullYear()} Camping Paradis - Domaine de Gaujac
      </footer>
    </div>
  );
}