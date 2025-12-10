import React, { useState, useEffect } from 'react';
import { X, ChevronDown, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const JobForm = ({ isOpen, onClose, onAddJob, initialData, settings = { techCommissionPct: 50 } }) => {
    const [client, setClient] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');

    // Datos de Ingreso (Combo box)
    const [incomeType, setIncomeType] = useState('transfer');
    const [incomeAmount, setIncomeAmount] = useState('');

    // Datos de Gasto (Combo box)
    const [expenseType, setExpenseType] = useState('none');
    const [expenseAmount, setExpenseAmount] = useState('');

    // --- EFECTO: CARGAR DATOS AL ABRIR ---
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // MODO EDICIÓN
                setClient(initialData.client);
                setDate(initialData.date);
                setDescription(initialData.description);

                // Determinar tipo de ingreso
                const transferVal = parseFloat(initialData.transfer) || 0;
                const cashVal = parseFloat(initialData.cash) || 0;

                if (transferVal > 0) {
                    setIncomeType('transfer');
                    setIncomeAmount(transferVal.toString()); // Nota: esto incluye el gasto, así que está bien
                } else if (cashVal > 0) {
                    setIncomeType('cash');
                    setIncomeAmount(cashVal.toString());
                } else {
                    setIncomeType('transfer'); // default
                    setIncomeAmount('');
                }

                // Determinar tipo de gasto
                const expCompany = parseFloat(initialData.expenseCompany) || 0;
                const expTech = parseFloat(initialData.expenseTech) || 0;

                if (expCompany > 0) {
                    setExpenseType('company');
                    setExpenseAmount(expCompany.toString());
                } else if (expTech > 0) {
                    setExpenseType('tech');
                    setExpenseAmount(expTech.toString());
                } else {
                    setExpenseType('none');
                    setExpenseAmount('');
                }

            } else {
                // MODO NUEVO (RESET)
                setClient('');
                setDate(new Date().toISOString().split('T')[0]);
                setDescription('');
                setIncomeAmount('');
                setExpenseAmount('');
                setIncomeType('transfer');
                setExpenseType('none');
            }
        }
    }, [isOpen, initialData]);

    // NOTE: Need to import useEffect for this to work


    // Cálculo en vivo para el formulario (Preview)
    const currentIncome = parseFloat(incomeAmount) || 0;
    const currentExpense = parseFloat(expenseAmount) || 0;

    // Si no hay gasto seleccionado, el gasto es 0 para el cálculo
    const effectiveExpense = expenseType === 'none' ? 0 : currentExpense;

    // --- CÁLCULO DE COMISIÓN LINK DE PAGO ---
    // Si es pago con Link, se descuenta la comisión DEL TOTAL antes de nada.
    const isLinkPayment = incomeType === 'link';
    const cardFeePct = settings.cardFeePct || 0;
    const linkFeeAmount = isLinkPayment ? (currentIncome * (cardFeePct / 100)) : 0;

    // El Ingreso Neto Real es (Total - Comisión Tarjeta)
    const netIncomeAfterLinkFee = currentIncome - linkFeeAmount;

    // Lógica corregida para coincidir con JobCard:
    // 1. Neto = (Ingreso Total - Comisión Link) - Gasto Operativo
    const formProfit = netIncomeAfterLinkFee - effectiveExpense;

    // Lógica de distribución para el preview
    const commissionFactor = settings.techCommissionPct / 100;

    // Cálculo de partes base (Ganancia Pura)
    const techBaseShare = formProfit * commissionFactor;
    const companyBaseShare = formProfit * (1 - commissionFactor);

    // Sumar reembolsos si aplican
    const techPart = techBaseShare + (expenseType === 'tech' ? effectiveExpense : 0);
    const companyPart = companyBaseShare + (expenseType === 'company' ? effectiveExpense : 0);

    const handleSubmit = () => {
        if (!client || !description) return;

        onAddJob({
            client,
            date,
            description,
            incomeType,
            incomeAmount,
            expenseType,
            expenseAmount,
            linkFeeAmount // Optional: pass this if needed, but simple saving logic in App calculates it or ignores it. 
            // Better to rely on App logic, but App currently doesn't re-calculate fee on save, it just sets `link_payment`.
            // Wait, if I save `link_payment` as the FULL amount in App.jsx, I need to make sure 
            // the display logic in JobCard ALSO does this fee subtraction.
            // OR I save the NET amount in `link_payment`? 
            // No, better save GROSS and subtract fee in display/calc to keep data true.
        });

        // Reset fields
        setClient('');
        setDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        setIncomeAmount('');
        setExpenseAmount('');
        setIncomeType('transfer');
        setExpenseType('none');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-white dark:bg-gray-900 w-full h-full sm:h-auto sm:max-w-[400px] sm:rounded-[40px] p-6 shadow-2xl relative z-10 transition-colors overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Nuevo Trabajo</h2>
                            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <X size={20} className="text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Cliente</label>
                                    <input
                                        type="text"
                                        placeholder="Nombre"
                                        value={client}
                                        onChange={(e) => setClient(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-pink-500 dark:text-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Fecha</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-pink-500 dark:text-white transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Descripción</label>
                                <input
                                    type="text"
                                    placeholder="¿Qué trabajo se realizó?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-pink-500 dark:text-white transition-colors"
                                />
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-gray-800 my-2 transition-colors"></div>

                            <p className="text-sm font-bold text-gray-800 dark:text-white">Detalle Económico</p>

                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl space-y-4 border border-gray-100 dark:border-gray-700 transition-colors">

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Tipo de Ingreso</label>
                                    <div className="flex gap-2">
                                        <div className="relative w-1/2">
                                            <select
                                                value={incomeType}
                                                onChange={(e) => setIncomeType(e.target.value)}
                                                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-xl p-3 pr-8 text-sm focus:ring-2 focus:ring-blue-500 appearance-none font-medium transition-colors"
                                            >
                                                <option value="transfer">Transferencia</option>
                                                <option value="cash">Efectivo</option>
                                                <option value="link">Link de Pago</option>
                                            </select>
                                            <ChevronDown size={16} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                                        </div>
                                        <div className="relative w-1/2">
                                            <DollarSign size={14} className="absolute left-3 top-3.5 text-gray-400" />
                                            <input
                                                type="number"
                                                placeholder="Monto"
                                                value={incomeAmount}
                                                onChange={(e) => setIncomeAmount(e.target.value)}
                                                onWheel={(e) => e.target.blur()}
                                                className={`w-full border-none rounded-xl py-3 pl-8 pr-3 text-sm focus:ring-2 font-bold transition-colors ${incomeType === 'choice' ? 'bg-gray-50' : // Fallback
                                                    incomeType === 'link' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 focus:ring-indigo-500' :
                                                        incomeType === 'transfer' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 focus:ring-blue-500' :
                                                            'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 focus:ring-green-500'}`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Gastos Asociados</label>
                                    <div className="flex gap-2">
                                        <div className="relative w-1/2">
                                            <select
                                                value={expenseType}
                                                onChange={(e) => {
                                                    setExpenseType(e.target.value);
                                                    if (e.target.value === 'none') setExpenseAmount('');
                                                }}
                                                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-xl p-3 pr-8 text-sm focus:ring-2 focus:ring-red-500 appearance-none font-medium transition-colors"
                                            >
                                                <option value="none">Sin Gastos</option>
                                                <option value="company">Gasto Empresa</option>
                                                <option value="tech">Gasto Técnico</option>
                                            </select>
                                            <ChevronDown size={16} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                                        </div>
                                        <div className="relative w-1/2">
                                            <DollarSign size={14} className="absolute left-3 top-3.5 text-gray-400" />
                                            <input
                                                type="number"
                                                placeholder="Monto"
                                                value={expenseAmount}
                                                disabled={expenseType === 'none'}
                                                onChange={(e) => setExpenseAmount(e.target.value)}
                                                onWheel={(e) => e.target.blur()}
                                                className={`w-full border-none rounded-xl py-3 pl-8 pr-3 text-sm font-bold transition-colors ${expenseType === 'none' ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 focus:ring-2 focus:ring-red-500'}`}
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-2xl p-4 mt-2 transition-colors">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-xs text-gray-400 hover:text-gray-500 font-bold uppercase tracking-wider">Resultado Estimado</p>
                                    <div className="text-right">
                                        <span className="block text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500 dark:text-gray-300 transition-colors">
                                            Utilidad: ${formProfit.toLocaleString()}
                                        </span>
                                        {isLinkPayment && linkFeeAmount > 0 && (
                                            <span className="block text-[10px] text-red-400 mt-1 mr-1">
                                                - ${linkFeeAmount.toLocaleString()} (Comisión Link)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <div className="flex-1 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl flex flex-col items-center justify-center border border-green-100 dark:border-green-800/30 transition-colors">
                                        <p className="text-green-600 dark:text-green-400 text-[10px] font-bold uppercase mb-1">Mi Ganancia</p>
                                        <p className="font-bold text-green-700 dark:text-green-300 text-xl">${techPart.toLocaleString()}</p>
                                    </div>
                                    <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl flex flex-col items-center justify-center border border-purple-100 dark:border-purple-800/30 transition-colors">
                                        <p className="text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase mb-1">Margen Negocio</p>
                                        <p className="font-bold text-purple-700 dark:text-purple-300 text-xl">${companyPart.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                className="w-full bg-gray-900 dark:bg-pink-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all hover:bg-gray-800 dark:hover:bg-pink-700"
                            >
                                Guardar Trabajo
                            </button>
                            <div className="h-6"></div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default JobForm;
