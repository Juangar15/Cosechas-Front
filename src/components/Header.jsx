import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, RefreshCw, Sun, Moon, Citrus } from 'lucide-react';

const Header = ({ modoOscuro, toggleTheme, cargarTickets, signOut }) => {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-40 shadow-sm transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 flex items-center justify-center">
            {/* Logo Responsivo para Modo Claro y Oscuro */}
            <img src="/isotipo_positivo.png" alt="Cosechas Logo" className="w-full h-full object-contain drop-shadow-sm dark:hidden" />
            <img src="/isotipo_negativo.png" alt="Cosechas Logo" className="w-full h-full object-contain drop-shadow-sm hidden dark:block" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-sans text-slate-800 dark:text-white tracking-wider leading-tight">Cosechas</h1>
            <p className="text-xs font-bold text-cosechas-verde uppercase tracking-widest font-sans">Centro Operativo</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm border border-slate-200 dark:border-slate-700 hover:rotate-12"
            title="Alternar tema"
          >
            {modoOscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={() => cargarTickets(true)} 
            className="flex items-center gap-2 bg-cosechas-verde hover:bg-cosechas-verde-alt text-white px-4 py-2.5 rounded-full font-bold text-sm shadow-[0_4px_15px_-3px_rgba(158,202,58,0.4)] transition-all hover:-translate-y-0.5 active:translate-y-0 font-sans"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
          
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>
          
          <button
            onClick={signOut}
            className="p-2.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 transition-colors border border-red-200 dark:border-red-800 shadow-sm hover:scale-105"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
