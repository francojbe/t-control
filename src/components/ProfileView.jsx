import React, { useState, useRef, useEffect } from 'react';
import { Check, Camera, Pencil, TrendingUp, ArrowUpRight, LogOut, Moon, Sun, Settings, X } from 'lucide-react';
import { supabase } from '../supabaseClient';

const ProfileView = ({ className, user, jobs, settings, onUpdateSettings }) => {
    const [profileImage, setProfileImage] = useState(
        user?.user_metadata?.avatar_url ||
        "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg?w=740&t=st=1709135000~exp=1709135600~hmac=e2b61070529606555180630773030302"
    );

    // Retrieve name from user_metadata (Supabase standard)
    const [userName, setUserName] = useState(user?.user_metadata?.name || "Técnico"); // Pre-load if available

    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingCommission, setIsEditingCommission] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Export Modal State
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportMonth, setExportMonth] = useState(new Date().getMonth());
    const [exportYear, setExportYear] = useState(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState([new Date().getFullYear()]);

    // Effect to get available years from jobs
    useEffect(() => {
        if (jobs && jobs.length > 0) {
            const uniqueYears = [...new Set(jobs.map(j => new Date(j.date + 'T12:00:00').getFullYear()))];
            uniqueYears.sort((a, b) => b - a);
            if (uniqueYears.length > 0) {
                setAvailableYears(uniqueYears);
                setExportYear(uniqueYears[0]); // Default to latest year
            }
        }
    }, [jobs]);

    // CSV Generation Logic
    const generateCSV = (data, filenameSuffix) => {
        if (!data || data.length === 0) {
            alert("No hay datos para exportar en este periodo.");
            return;
        }
        const headers = ["Fecha", "Cliente", "Descripción", "Ingreso Total", "Gasto Empresa", "Gasto Técnico", "Comisión (%)", "Tipo Ingreso"];
        const csvContent = [
            headers.join(","),
            ...data.map(job => {
                const income = (job.transfer || 0) + (job.cash || 0) + (job.link_payment || 0);
                let type = "N/A";
                if (job.transfer > 0) type = "Transferencia";
                if (job.cash > 0) type = "Efectivo";
                if (job.link_payment > 0) type = "Link Pago";
                return [
                    `"${job.date}"`,
                    `"${job.client || ''}"`,
                    `"${job.description || ''}"`,
                    income,
                    job.expense_company || 0,
                    job.expense_tech || 0,
                    job.applied_commission || 50,
                    `"${type}"`
                ].join(",");
            })
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_${filenameSuffix}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportModal(false);
    };

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    // Load initial state from DOM/Storage
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // If we access this component, we check if the global 'dark' class is present
        return document.documentElement.classList.contains('dark');
    }); // Dark mode state

    const fileInputRef = useRef(null);
    const nameInputRef = useRef(null);

    // Handler for Logout - updated to use calling prop if available or direct
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error logging out:', error);
    };

    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    // Update local state when user prop changes (e.g. after asynchronous data load)
    useEffect(() => {
        if (user?.user_metadata?.name) {
            setUserName(user.user_metadata.name);
        }
        if (user?.user_metadata?.avatar_url) {
            // Only update if it's different and we are NOT currently uploading (to avoid race conditions)
            if (!uploading && user.user_metadata.avatar_url !== profileImage) {
                setProfileImage(user.user_metadata.avatar_url);
            }
        }
    }, [user, uploading]); // Add uploading to dependencies

    const updateUserName = async (newName) => {
        try {
            const { error } = await supabase.auth.updateUser({
                data: { name: newName }
            });
            if (error) throw error;
        } catch (error) {
            console.error("Error updating name:", error);
            // Optional: Show error toast
        }
    };

    const handleImageClick = () => fileInputRef.current.click();

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file || !user) return;

        try {
            setUploading(true);

            // 1. Upload to Supabase Storage with explicit upsert
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: file.type // Verify content type
                });

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const finalUrl = `${publicUrl}?v=${Date.now()}`; // Force cache bust
            console.log("Imagen subida con éxito. URL:", finalUrl);

            // 3. Update User Metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: finalUrl }
            });

            if (updateError) throw updateError;

            // 4. Update Local State immediately
            setProfileImage(finalUrl);

        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error al subir imagen: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleEditClick = () => {
        if (isEditingName) setIsEditingName(false);
        else setIsEditingName(true);
    };

    return (
        <div className={`animate-fadeIn relative flex flex-col items-center ${className}`}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

            {/* Avatar Section */}
            <div className="relative mb-2">
                <div className="absolute top-4 left-0 z-20 bg-pink-500 text-white p-2 rounded-full shadow-lg transform -rotate-12 pointer-events-none">
                    <Check size={16} strokeWidth={4} />
                </div>
                <div
                    onClick={handleImageClick}
                    className="w-48 h-48 rounded-full overflow-hidden relative z-10 bg-pink-50 cursor-pointer group"
                >
                    <img
                        src={profileImage}
                        alt="Avatar"
                        onError={(e) => {
                            console.error("Error loading image source:", profileImage);
                            // Avoid infinite loop if placeholder fails
                            e.target.onerror = null;
                            e.target.src = "https://ui-avatars.com/api/?name=User&background=random";
                            // Only alert if it's NOT the default placeholder, to avoid spamming alerts on initial load if something is weird
                            if (profileImage && !profileImage.includes("freepik")) {
                                alert("¡Aviso! La imagen se subió, pero no se puede ver.\n\nEs probable que el 'Bucket' de Supabase no sea PÚBLICO.\nVe al editor SQL de Supabase y ejecuta el script que te preparé.");
                            }
                        }}
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${uploading ? 'opacity-50 blur-sm' : ''}`}
                    />

                    {/* LOADING SPINNER */}
                    {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center z-50">
                            <div className="w-10 h-10 border-4 border-white border-t-pink-500 rounded-full animate-spin"></div>
                        </div>
                    )}

                    {/* Overlay de Hover (Cámara) */}
                    {!uploading && (
                        <div className="absolute inset-0 bg-transparent group-hover:bg-black/20 flex items-center justify-center transition-all duration-300">
                            <Camera className="text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 drop-shadow-md" size={32} />
                        </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none"></div>
                </div>
            </div>

            {/* Name Section */}
            <div className="text-center w-full relative -mt-4 z-20 mb-6">
                <div className="flex justify-center items-end gap-2 w-full">
                    {isEditingName ? (
                        <input
                            ref={nameInputRef}
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            onBlur={() => {
                                setIsEditingName(false);
                                if (userName !== user?.user_metadata?.name) {
                                    updateUserName(userName);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setIsEditingName(false);
                                    if (userName !== user?.user_metadata?.name) {
                                        updateUserName(userName);
                                    }
                                }
                            }}
                            className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-pink-500 focus:outline-none max-w-[200px] text-center"
                            autoFocus
                        />
                    ) : (
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">{userName}</h2>
                    )}
                    <button onClick={handleEditClick} className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:text-pink-500 mb-4 transition-colors">
                        {isEditingName ? <Check size={14} /> : <Pencil size={14} />}
                    </button>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">Técnico Principal</p>
            </div>

            {/* Grid Cards Profile */}
            <div className="w-full grid grid-cols-2 gap-4 mb-6">
                <div
                    className="bg-gray-50 dark:bg-gray-900 p-5 rounded-[24px] relative flex flex-col justify-between h-40 transition-colors"
                >
                    <div className="flex justify-between items-start">
                        <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-[10px] font-bold text-gray-600 dark:text-gray-300 shadow-sm transition-colors">Configurar</span>
                        <Pencil
                            size={18}
                            className="text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
                            onClick={() => setIsEditingCommission(!isEditingCommission)}
                        />
                    </div>
                    <div>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mb-1">Mi Comisión Actual</p>
                        {isEditingCommission ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    className="w-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 text-lg font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-pink-500"
                                    autoFocus
                                    defaultValue={settings?.techCommissionPct || 50}
                                    onBlur={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val) && val >= 0 && val <= 100) {
                                            onUpdateSettings({ techCommissionPct: val });
                                        }
                                        setIsEditingCommission(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.target.blur();
                                        }
                                    }}
                                />
                                <span className="text-xl font-bold text-gray-800 dark:text-white">%</span>
                            </div>
                        ) : (
                            <p
                                className="text-gray-800 dark:text-white font-bold text-2xl leading-tight cursor-pointer hover:opacity-70 transition-colors"
                                onClick={() => setIsEditingCommission(true)}
                            >
                                {settings?.techCommissionPct || 50}%
                            </p>
                        )}
                    </div>
                </div>

                <div
                    onClick={() => setShowExportModal(true)}
                    className="bg-gray-50 dark:bg-gray-900 p-5 rounded-[24px] relative flex flex-col justify-between h-40 transition-all cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-[1.02]"
                >
                    <div className="flex justify-between items-start w-full">
                        <p className="text-gray-800 dark:text-white font-medium leading-tight">Exportar Datos</p>
                        <div className="bg-white dark:bg-gray-800 p-1.5 rounded-full shadow-sm text-gray-800 dark:text-white transition-colors"><ArrowUpRight size={14} /></div>
                    </div>
                    <div>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mb-1">Descargar Excel</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{jobs?.length || 0} <span className="text-sm font-medium text-gray-400">registros</span></p>
                    </div>
                </div>
            </div>

            {/* General Settings Section */}
            <div className="w-full space-y-3 mb-24">
                <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider ml-2">General</p>

                {/* Configuración de Comisiones */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm mb-6 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-full text-pink-600 dark:text-pink-400">
                            <Settings size={20} />
                        </div>
                        <h3 className="font-bold text-gray-800 dark:text-white">Configuración de Negocio</h3>
                    </div>

                    <div className="space-y-4">


                        {/* Comisión Link de Pago (Transbank/MercadoPago) */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl flex items-center justify-between border border-gray-100 dark:border-gray-700">
                            <div>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Comisión Link Pago</p>
                                <p className="text-xs text-gray-400 dark:text-gray-400">Descuento por tarjeta</p>
                            </div>
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600">
                                <input
                                    type="number"
                                    value={settings.cardFeePct || 0}
                                    onChange={(e) => onUpdateSettings({ cardFeePct: parseFloat(e.target.value) || 0 })}
                                    className="w-12 text-center font-bold text-gray-800 dark:text-white bg-transparent outline-none"
                                />
                                <span className="text-gray-400 font-bold">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Section (Biometrics) */}




                {/* Dark Mode Toggle */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-200 shadow-sm transition-colors">
                            {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-200">Modo Oscuro</span>
                    </div>
                    <button
                        onClick={toggleDarkMode}
                        className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 flex items-center ${isDarkMode ? 'bg-pink-500' : 'bg-gray-300'}`}
                    >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors active:scale-95"
                >
                    <LogOut size={20} />
                    Cerrar Sesión
                </button>
            </div>


            {/* EXPORT DATA MODAL */}
            {
                showExportModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowExportModal(false); }}>
                        <div className="bg-white dark:bg-gray-900 rounded-[32px] w-full max-w-sm p-6 shadow-2xl animate-slideUp">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Exportar Reporte</h3>
                                <button onClick={() => setShowExportModal(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><X size={20} /></button>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Seleccionar Mes</label>
                                    <select
                                        value={exportMonth}
                                        onChange={(e) => setExportMonth(parseInt(e.target.value))}
                                        className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-gray-800 dark:text-white font-medium outline-none focus:ring-2 focus:ring-pink-500"
                                    >
                                        {months.map((m, idx) => (
                                            <option key={idx} value={idx}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Seleccionar Año</label>
                                    <select
                                        value={exportYear}
                                        onChange={(e) => setExportYear(parseInt(e.target.value))}
                                        className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-gray-800 dark:text-white font-medium outline-none focus:ring-2 focus:ring-pink-500"
                                    >
                                        {availableYears.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        if (!jobs) return;
                                        const filtered = jobs.filter(j => {
                                            const d = new Date(j.date + 'T12:00:00');
                                            return d.getMonth() === exportMonth && d.getFullYear() === exportYear;
                                        });
                                        generateCSV(filtered, `${months[exportMonth]}_${exportYear}`);
                                    }}
                                    className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3.5 rounded-xl hover:opacity-90 active:scale-95 transition-all text-sm"
                                >
                                    Descargar {months[exportMonth]} {exportYear}
                                </button>
                                <button
                                    onClick={() => generateCSV(jobs, "historico_completo")}
                                    className="w-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white font-bold py-3.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all text-sm"
                                >
                                    Descargar Todo el Historial
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ProfileView;
