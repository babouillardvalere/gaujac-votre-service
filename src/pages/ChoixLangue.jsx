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
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Logo className="h-32 md:h-40 mb-8" />
        </motion.div>

        {/* Titre */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10"
        >
          <h1 className="font-handwritten text-4xl text-[#00AEEF] mb-2">
            Bienvenue !
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#FFD700]">⭐</span>
            <p className="font-handwritten text-2xl text-[#0077A8]">Welcome!</p>
            <span className="text-[#FFD700]">⭐</span>
          </div>
        </motion.div>

        {/* Boutons de sélection de langue */}
        <div className="flex flex-col sm:flex-row gap-6 w-full">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLanguageSelect('fr')}
            className="flex-1 group bg-white rounded-xl border-2 border-[#00AEEF] shadow-md hover:shadow-lg transition-all duration-300 p-6"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-14 rounded-lg overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Flag_of_France.svg"
                  alt="Français"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-heading text-xl text-[#0077A8] group-hover:text-[#00AEEF] transition-colors">
                Français
              </span>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLanguageSelect('en')}
            className="flex-1 group bg-white rounded-xl border-2 border-[#00AEEF] shadow-md hover:shadow-lg transition-all duration-300 p-6"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-14 rounded-lg overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/8/83/Flag_of_the_United_Kingdom_%283-5%29.svg"
                  alt="English"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-heading text-xl text-[#0077A8] group-hover:text-[#00AEEF] transition-colors">
                English
              </span>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="font-body text-[#0077A8] text-sm">
          © {new Date().getFullYear()} Camping Paradis - Domaine de Gaujac
        </p>
      </footer>
    </div>
  );
}