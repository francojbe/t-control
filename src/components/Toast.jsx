import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const toastVariants = {
    initial: { opacity: 0, y: -20, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

const Toast = ({ id, message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, 4000);
        return () => clearTimeout(timer);
    }, [id, onClose]);

    const styles = {
        success: {
            bg: 'bg-white dark:bg-gray-800',
            border: 'border-green-500/50',
            text: 'text-gray-800 dark:text-white',
            iconColor: 'text-green-500',
            Icon: CheckCircle
        },
        error: {
            bg: 'bg-white dark:bg-gray-800',
            border: 'border-red-500/50',
            text: 'text-gray-800 dark:text-white',
            iconColor: 'text-red-500',
            Icon: AlertCircle
        },
        info: {
            bg: 'bg-white dark:bg-gray-800',
            border: 'border-blue-500/50',
            text: 'text-gray-800 dark:text-white',
            iconColor: 'text-blue-500',
            Icon: Info
        }
    };

    const style = styles[type] || styles.success;
    const Icon = style.Icon;

    return (
        <motion.div
            layout
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`
                pointer-events-auto w-full max-w-sm rounded-2xl shadow-2xl 
                flex items-center gap-3 p-4 border ${style.border} ${style.bg}
                backdrop-blur-md bg-opacity-95 dark:bg-opacity-95
            `}
        >
            <div className={`p-2 rounded-full bg-opacity-10 ${style.iconColor.replace('text', 'bg')}`}>
                <Icon size={20} className={style.iconColor} />
            </div>

            <p className={`flex-1 text-sm font-medium ${style.text}`}>
                {message}
            </p>

            <button
                onClick={() => onClose(id)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <X size={16} className="text-gray-400" />
            </button>
        </motion.div>
    );
};

export default Toast;
