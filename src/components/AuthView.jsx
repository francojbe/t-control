import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, CheckSquare, Square, User } from 'lucide-react';
import { supabase } from '../supabaseClient';

const AuthView = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [showForm, setShowForm] = useState(false);

    // Secuencia de animación inicial
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowForm(true);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    const getErrorText = (msg) => {
        if (msg.includes("Invalid login credentials")) return "Credenciales incorrectas. Verifica tu correo y contraseña.";
        if (msg.includes("User already registered")) return "Este correo ya está registrado. Intenta iniciar sesión.";
        if (msg.includes("Rate limit exceeded")) return "Demasiados intentos. Espera unos segundos.";
        return "Ha ocurrido un error. Inténtalo de nuevo.";
    };

    const handleInputChange = (setter) => (e) => {
        setErrorMessage('');
        setter(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage('');

        if (!supabase) {
            setErrorMessage("Error de conexión. Contacta a soporte.");
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                // --- LOGIN REAL ---
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;
            } else {
                // --- REGISTRO REAL ---
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        },
                    },
                });

                if (error) throw error;
                alert('Registro exitoso! Revisa tu correo o ingresa si no requeriste confirmación.');
            }
        } catch (error) {
            setErrorMessage(getErrorText(error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider) => {
        if (!supabase) {
            alert("Necesitas configurar Supabase.");
            return;
        }
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error) {
            alert("Error: " + error.message);
        }
    };

    // Variantes de animación
    const containerVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 260, damping: 20, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans p-4">
            <div className="w-full max-w-[400px] bg-[#f3f4f6] rounded-[40px] shadow-2xl overflow-hidden relative min-h-[850px] flex flex-col justify-center p-6">

                {/* Pastel Gradient Background (Inside the 'Phone') */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-yellow-50 to-emerald-100 opacity-90" />

                {/* Blurry Orbs for atmosphere */}
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />

                {/* FASE 1: ANIMACIÓN INICIAL DEL LOGO */}
                <AnimatePresence mode="wait">
                    {!showForm && (
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <motion.div
                                initial={{ y: -500, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{
                                    type: "spring",
                                    damping: 12,
                                    stiffness: 200,
                                    mass: 1.5,
                                    duration: 0.8
                                }}
                            >
                                <motion.div
                                    layoutId="shared-logo"
                                    className="w-80 flex items-center justify-center filter drop-shadow-2xl"
                                    transition={{ duration: 0.8, type: "spring" }}
                                >
                                    <img
                                        src="/logo_final.png"
                                        alt="Tecnicuentas Logo"
                                        className="w-full h-auto object-contain"
                                    />
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>


                {/* FASE 2: FORMULARIO (Se muestra después de la animación) */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            className="w-full max-w-md z-10 p-2"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {/* Header Section */}
                            <div className="text-center mb-8">
                                <motion.div
                                    layoutId="shared-logo"
                                    className="w-24 mx-auto mb-4 filter drop-shadow-lg"
                                    transition={{ duration: 0.8, type: "spring" }}
                                >
                                    <img src="/logo_final.png" alt="Logo" className="w-full h-auto" />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <h1 className="text-4xl font-sans font-extrabold text-gray-900 mb-2 tracking-tighter">
                                        {isLogin ? 'T-Control' : 'Únete a T-Control'}
                                    </h1>
                                    <p className="text-gray-600 text-sm px-8 font-medium">
                                        {isLogin
                                            ? 'Administra tus servicios y maximiza tus ganancias.'
                                            : 'Regístrate para potenciar tus finanzas hoy mismo.'}
                                    </p>
                                </motion.div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">

                                {/* Name Field (Only for Signup) */}
                                <AnimatePresence>
                                    {!isLogin && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-2 overflow-hidden"
                                        >
                                            <label className="text-xs font-bold text-gray-700 ml-1">Nombre</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={handleInputChange(setName)}
                                                    className="w-full bg-white/60 border border-gray-200 backdrop-blur-sm rounded-full py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all font-medium text-gray-800 text-sm placeholder:text-gray-400"
                                                    placeholder="Tu nombre completo"
                                                    required={!isLogin}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 ml-1">Correo electrónico</label>
                                    <motion.div variants={itemVariants} className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={handleInputChange(setEmail)}
                                            className="w-full bg-white/60 border border-gray-200 backdrop-blur-sm rounded-full py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all font-medium text-gray-800 text-sm placeholder:text-gray-400"
                                            placeholder="ejemplo@correo.com"
                                            required
                                        />
                                    </motion.div>
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 ml-1">Contraseña</label>
                                    <motion.div variants={itemVariants} className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={handleInputChange(setPassword)}
                                            className="w-full bg-white/60 border border-gray-200 backdrop-blur-sm rounded-full py-3.5 pl-11 pr-11 outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all font-medium text-gray-800 text-sm placeholder:text-gray-400"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </motion.div>

                                    {/* Biometric Login Shortcut */}

                                </div>

                                {/* ERROR MESSAGE DISPLAY */}
                                <AnimatePresence>
                                    {errorMessage && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, height: 0 }}
                                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                                            exit={{ opacity: 0, y: -10, height: 0 }}
                                            className="text-center overflow-hidden"
                                        >
                                            <p className="text-red-500 text-xs font-medium bg-red-50 py-2 px-4 rounded-lg inline-block border border-red-100">
                                                {errorMessage}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Remember & Forgot */}
                                {isLogin && (
                                    <div className="flex items-center justify-between text-xs px-1">
                                        <div className="flex items-center gap-2 cursor-pointer group">
                                            <div className="w-4 h-4 border-2 border-gray-300 rounded-[4px] group-hover:border-gray-500 transition-colors" />
                                            <span className="text-gray-500 font-medium">Recordarme</span>
                                        </div>
                                        <span className="text-gray-900 font-bold cursor-pointer hover:underline">¿Olvidaste tu contraseña?</span>
                                    </div>
                                )}

                                {/* Main Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-black text-white py-4 rounded-full font-bold text-sm shadow-xl shadow-black/10 hover:shadow-black/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
                                </motion.button>
                            </form>

                            {/* Divider */}
                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300/50"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-[#f2f4f6] px-2 text-gray-400 font-medium">O continúa con</span>
                                </div>
                            </div>

                            {/* Social Buttons (Side by Side Pills) */}
                            <div className="flex gap-4">
                                <button type="button" onClick={() => handleSocialLogin('google')} className="flex-1 bg-white border border-gray-200 rounded-full py-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                                    <span className="text-xs font-bold text-gray-700">Google</span>
                                </button>
                                <button type="button" onClick={() => handleSocialLogin('apple')} className="flex-1 bg-white border border-gray-200 rounded-full py-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="black"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.23 4.41-1.23 1.25.04 2.67.57 3.53 1.34-3.08 1.58-2.62 6.53.5 7.63-.69 1.98-1.78 3.32-3.5 4.48zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>
                                    <span className="text-xs font-bold text-gray-700">Apple</span>
                                </button>
                            </div>

                            {/* Toggle Bottom */}
                            <div className="mt-8 text-center text-xs text-gray-500 font-medium">
                                {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                                <button
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-black font-bold hover:underline"
                                >
                                    {isLogin ? 'Crea una cuenta' : 'Inicia sesión aquí'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AuthView;
