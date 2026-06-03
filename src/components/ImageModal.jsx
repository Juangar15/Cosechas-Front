import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ImageModal = ({ fotoModal, setFotoModal }) => {
  return (
    <AnimatePresence>
      {fotoModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4"
          onClick={() => setFotoModal(null)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 bg-black/60 hover:bg-cosechas-rojo text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors z-10"
              onClick={() => setFotoModal(null)}
            >
              ✕
            </button>
            <img
              src={fotoModal}
              alt="Evidencia Ampliada"
              className="max-w-full max-h-[85vh] rounded-xl object-contain"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageModal;
