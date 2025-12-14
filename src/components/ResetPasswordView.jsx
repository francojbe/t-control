import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Save } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';

const ResetPasswordView = ({ onPasswordUpdated }) => {
    const { showToast } = useToast();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage('');

        if (password !== confirmPassword) {
            setErrorMessage("Las contraseñas no coinciden.");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password: password });
            if (error) throw error;

            showToast("Contraseña actualizada correctamente", "success");
            if (onPasswordUpdated) onPasswordUpdated();
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[400px] bg-white rounded-[40px] shadow-2xl overflow-hidden p-6"
            >
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Nueva Contraseña</h1>
                    <p className="text-gray-600 text-sm">Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 ml-1">Nueva Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-full py-3.5 pl-11 pr-11 outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all font-medium text-gray-800 text-sm"
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
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 ml-1">Confirmar Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-full py-3.5 pl-11 pr-11 outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all font-medium text-gray-800 text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="text-center">
                            <p className="text-red-500 text-xs font-medium bg-red-50 py-2 px-4 rounded-lg inline-block border border-red-100">
                                {errorMessage}
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-4 rounded-full font-bold text-sm shadow-xl shadow-black/10 hover:shadow-black/20 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Guardando...' : 'Actualizar Contraseña'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPasswordView;
