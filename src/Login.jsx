import { useState } from 'react';
import { supabase } from './supabase';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, Sun, Moon, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from './hooks/useTheme.js';

export default function Login({ isSettingPassword = false, onPasswordSaved = () => {} }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { modoOscuro, toggleTheme } = useTheme();

    // Reglas de validación para nueva contraseña
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isMatch = password === confirmPassword && password.length > 0;
    const isFormValid = hasMinLength && hasUpperCase && hasNumber && hasSpecialChar && isMatch;

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast.error('Credenciales incorrectas o usuario no encontrado.');
        } else {
            toast.success('¡Bienvenido de vuelta!');
        }
        setLoading(false);
    };

    const handleSetPassword = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            toast.error('Error al configurar la contraseña: ' + error.message);
        } else {
            toast.success('¡Contraseña configurada exitosamente!');
            onPasswordSaved();
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
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
            <button
                onClick={toggleTheme}
                className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform"
                title="Alternar tema"
            >
                {modoOscuro ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-cosechas-rojo via-cosechas-rosa to-cosechas-purpura dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 overflow-hidden items-center justify-center transition-colors duration-500"
            >
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-white/10 blur-3xl mix-blend-overlay"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] rounded-full bg-cosechas-amarillo/20 blur-3xl mix-blend-overlay"></div>
                
                <div className="relative z-10 p-12 text-center text-white flex flex-col items-center">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="w-48 h-48 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-8 shadow-2xl p-6 ring-4 ring-white/20 dark:ring-slate-700/50 transition-colors"
                    >
                        <img src="/isotipo_positivo.png" alt="Cosechas" className="w-full h-full object-contain drop-shadow-sm dark:hidden" />
                        <img src="/isotipo_negativo.png" alt="Cosechas" className="w-full h-full object-contain drop-shadow-sm hidden dark:block" />
                    </motion.div>
                    <motion.h1 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="text-5xl font-sans font-bold tracking-wider mb-4 drop-shadow-lg"
                    >
                        Centro Operativo
                    </motion.h1>
                    <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="text-lg font-secondary text-white/95 max-w-md mx-auto leading-relaxed drop-shadow"
                    >
                        Gestión inteligente de novedades y control de calidad.
                    </motion.p>
                </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12"
            >
                <div className="w-full max-w-md space-y-10">
                    <div className="text-center lg:text-left">
                        <div className="lg:hidden w-32 h-12 flex items-center justify-center mx-auto mb-8">
                            <img src="/logotipo_principal.png" alt="Cosechas" className="w-full h-full object-contain dark:hidden" />
                            <img src="/logotipo_alterno.png" alt="Cosechas" className="w-full h-full object-contain hidden dark:block" />
                        </div>
                        <h2 className="text-3xl font-sans font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {isSettingPassword ? 'Configurar Contraseña' : 'Iniciar Sesión'}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-secondary font-medium">
                            {isSettingPassword 
                                ? 'Crea una contraseña segura para tu nueva cuenta corporativa.' 
                                : 'Ingresa tus credenciales corporativas para continuar.'}
                        </p>
                    </div>

                    {!isSettingPassword ? (
                        <form className="space-y-6" onSubmit={handleLogin}>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                    Correo Electrónico
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cosechas-verde transition-colors">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-dark-border text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cosechas-verde/50 focus:border-cosechas-verde transition-all duration-300 shadow-sm font-secondary"
                                        placeholder="coordinador@cosechas.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                    Contraseña
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cosechas-rojo transition-colors">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-dark-border text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cosechas-rojo/50 focus:border-cosechas-rojo transition-all duration-300 shadow-sm font-secondary"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl text-sm font-bold font-sans text-white bg-cosechas-verde hover:bg-cosechas-verde-alt dark:bg-cosechas-rojo dark:hover:bg-cosechas-magenta focus:outline-none focus:ring-4 focus:ring-cosechas-verde/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(158,202,58,0.5)] dark:shadow-[0_8px_20px_-6px_rgba(237,22,80,0.5)] hover:-translate-y-0.5"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Verificando...
                                    </>
                                ) : (
                                    'Acceder al Panel'
                                )}
                            </button>
                        </form>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSetPassword}>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                    Nueva Contraseña
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cosechas-verde transition-colors">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-dark-border text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cosechas-verde/50 focus:border-cosechas-verde transition-all duration-300 shadow-sm font-secondary"
                                        placeholder="Crea una contraseña"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Requisitos de seguridad</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <ValidationItem isValid={hasMinLength} text="Mínimo 8 caracteres" />
                                    <ValidationItem isValid={hasUpperCase} text="Una mayúscula" />
                                    <ValidationItem isValid={hasNumber} text="Un número" />
                                    <ValidationItem isValid={hasSpecialChar} text="Un símbolo (!@#$)" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                    Confirmar Contraseña
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cosechas-verde transition-colors">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`block w-full pl-11 pr-4 py-3.5 border rounded-xl bg-slate-50/50 dark:bg-dark-border text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 shadow-sm font-secondary ${
                                            confirmPassword.length > 0
                                                ? isMatch
                                                    ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                                                    : 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-slate-200 dark:border-slate-700 focus:border-cosechas-verde focus:ring-cosechas-verde/50'
                                        }`}
                                        placeholder="Repite tu contraseña"
                                    />
                                </div>
                                {confirmPassword.length > 0 && !isMatch && (
                                    <p className="text-xs font-bold text-red-500 mt-2 ml-1">Las contraseñas no coinciden</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={!isFormValid || loading}
                                className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl text-sm font-bold font-sans text-white bg-cosechas-verde hover:bg-cosechas-verde-alt dark:bg-cosechas-rojo dark:hover:bg-cosechas-magenta focus:outline-none focus:ring-4 focus:ring-cosechas-verde/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(158,202,58,0.5)] dark:shadow-[0_8px_20px_-6px_rgba(237,22,80,0.5)] hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Guardar y Entrar'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
