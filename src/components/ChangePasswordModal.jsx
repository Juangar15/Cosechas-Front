import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase.js';
import { Lock, X, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChangePasswordModal({ isOpen, onClose, isMandatory = false }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Reglas de validación
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isMatch = password === confirmPassword && password.length > 0;
  
  const isFormValid = hasMinLength && hasUpperCase && hasNumber && hasSpecialChar && isMatch;

  // Resetear estados al cerrar
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setConfirmPassword('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error('Error al actualizar la contraseña: ' + error.message);
    } else {
      toast.success('¡Contraseña actualizada correctamente!');
      localStorage.removeItem('necesita_password');
      if (isMandatory) {
        // En caso obligatorio, forzamos recarga para que el estado de sesión de Auth se refresque bien
        window.location.reload();
      } else {
        onClose();
      }
    }
    setLoading(false);
  };

  const ValidationItem = ({ isValid, text }) => (
    <div className={`flex items-center gap-2 text-sm transition-colors ${isValid ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
      {isValid ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      <span>{text}</span>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={isMandatory ? undefined : onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-slate-200/50 dark:border-slate-700/50 flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cosechas-verde/20 flex items-center justify-center text-cosechas-verde">
                  <Lock className="w-4 h-4" />
                </div>
                Configuración de Seguridad
              </h2>
              {!isMandatory && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Establece una contraseña segura para tu cuenta. Si fuiste invitado recientemente, esto te permitirá iniciar sesión directamente con tu correo en el futuro.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cosechas-verde focus:border-cosechas-verde dark:text-white transition-all outline-none font-medium"
                    placeholder="Ingresa tu contraseña"
                    required
                  />
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-2">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Requisitos de seguridad</p>
                  <div className="grid grid-cols-2 gap-2">
                    <ValidationItem isValid={hasMinLength} text="Mínimo 8 caracteres" />
                    <ValidationItem isValid={hasUpperCase} text="Una mayúscula" />
                    <ValidationItem isValid={hasNumber} text="Un número" />
                    <ValidationItem isValid={hasSpecialChar} text="Un símbolo (!@#$)" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-xl focus:ring-2 transition-all outline-none font-medium dark:text-white ${
                      confirmPassword.length > 0 
                        ? isMatch 
                          ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20' 
                          : 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-cosechas-verde focus:ring-cosechas-verde'
                    }`}
                    placeholder="Repite tu contraseña"
                    required
                  />
                  {confirmPassword.length > 0 && !isMatch && (
                    <p className="text-xs font-bold text-red-500 mt-2 ml-1">Las contraseñas no coinciden</p>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 shrink-0">
                {!isMandatory && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                  >
                    Más tarde
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-cosechas-verde hover:bg-cosechas-verde-alt text-white text-sm font-bold rounded-xl shadow-lg shadow-cosechas-verde/30 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Guardar Contraseña
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
