import React, { useState, useMemo } from 'react';
import { Plus, Briefcase, Wallet, ChevronLeft, ChevronRight, Calendar, ArrowDownLeft, ArrowUpRight, CheckCircle } from 'lucide-react';
import SummaryCard from './SummaryCard';
import JobCard from './JobCard';

const HomeView = ({ jobs, onOpenForm, onEditJob, onDeleteJob, settings = { techCommissionPct: 50 } }) => {
    // Estado para el mes seleccionado (YYYY-MM)
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    // Estado para Filtros
    const [activeFilter, setActiveFilter] = useState('all');

    // Funciones para navegar entre meses
    const changeMonth = (increment) => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const date = new Date(year, month - 1 + increment, 1);
        setSelectedMonth(date.toISOString().slice(0, 7));
    };

    const formatMonthDisplay = (yyyyMM) => {
        const [year, month] = yyyyMM.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        // Capitalizar primera letra
        const str = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // --- FILTRADO POR MES Y TIPO ---
    const filteredJobs = useMemo(() => {
        let result = jobs.filter(job => job.date.startsWith(selectedMonth));

        // Aplicar Filtro de Tipo
        if (activeFilter !== 'all') {
            result = result.filter(job => {
                const income = (job.transfer || 0) + (job.cash || 0) + (job.link_payment || 0);

                if (activeFilter === 'cash') return (job.cash || 0) > 0;
                if (activeFilter === 'transfer') return (job.transfer || 0) > 0;
                if (activeFilter === 'link') return (job.link_payment || 0) > 0;
                if (activeFilter === 'pending') return income === 0;
                return true;
            });
        }

        return result.sort((a, b) => new Date(b.date) - new Date(a.date)); // Ordenar por fecha desc
    }, [jobs, selectedMonth, activeFilter]);

    // Cálculos de Resumen para el mes seleccionado
    const { totalIncomeMonth, totalCashMonth, totalTechMonth, totalExpenseMonth } = useMemo(() => {
        let income = 0;
        let cashMonth = 0;
        let techTotal = 0;
        let expenseTotal = 0;

        filteredJobs.forEach(job => {
            // Ingresos Brutos
            const jobIncome = (parseFloat(job.transfer) || 0) + (parseFloat(job.cash) || 0) + (parseFloat(job.link_payment) || 0);
            income += jobIncome;

            // Efectivo (para saber cuánto tiene el técnico en mano)
            cashMonth += (parseFloat(job.cash) || 0);

            // Gastos
            const jobExpense = (parseFloat(job.expenseCompany) || 0) + (parseFloat(job.expenseTech) || 0);
            expenseTotal += jobExpense;

            // --- CÁLCULO REAL DE GANANCIA TÉCNICO (Replica JobCard) ---

            // 1. Descontar Fee de Tarjeta si es Link
            const isLink = parseFloat(job.link_payment) > 0;
            const cardFeePct = settings.cardFeePct || 0; // Usar setting global actual
            const linkFee = isLink ? (jobIncome * (cardFeePct / 100)) : 0;

            // 2. Neto Real
            const profitWithFee = (jobIncome - linkFee) - jobExpense;

            // 3. Comisión Específica
            const commissionPct = job.appliedCommission !== undefined ? job.appliedCommission : (settings.techCommissionPct || 50);

            // 4. Parte del Técnico (+ su reembolso)
            const techShare = profitWithFee * (commissionPct / 100);
            const techReimbursement = parseFloat(job.expenseTech) || 0;

            techTotal += (techShare + techReimbursement);
        });

        return {
            totalIncomeMonth: income,
            totalCashMonth: cashMonth,
            totalTechMonth: techTotal,
            totalExpenseMonth: expenseTotal
        };
    }, [filteredJobs, settings]);

    // --- PAGINACIÓN ---
    const PAGE_SIZE = 5;
    const [currentPage, setCurrentPage] = useState(1);

    // Resetear página al cambiar de mes o filtro
    useMemo(() => {
        setCurrentPage(1);
    }, [selectedMonth, activeFilter]);

    const paginatedJobs = filteredJobs.slice(0, currentPage * PAGE_SIZE);
    const hasMore = paginatedJobs.length < filteredJobs.length;

    // Filter Options
    const filters = [
        { id: 'all', label: 'Todos' },
        { id: 'cash', label: 'Efectivo' },
        { id: 'transfer', label: 'Transf.' },
        { id: 'link', label: 'Link' },
        { id: 'pending', label: 'Pendientes' },
    ];

    return (
        <div className="space-y-6 animate-fadeIn pb-24">

            {/* Selector de Mes */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400 transition-colors">
                    <ChevronLeft size={20} />
                </button>

                <div
                    className="relative flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => document.getElementById('month-picker').showPicker()}
                >
                    <Calendar size={18} className="text-pink-500" />
                    <span className="text-gray-800 dark:text-white font-bold capitalize select-none transition-colors">
                        {new Date(selectedMonth + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </span>
                    <input
                        id="month-picker"
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full pointer-events-none"
                    />
                </div>

                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400 transition-colors">
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* BARRA DE FILTROS (Horizonal Scroll) */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-2 px-2">
                {filters.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setActiveFilter(f.id)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${activeFilter === f.id
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md transform scale-105'
                                : 'bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Resumen Cards */}
            <div className="grid grid-cols-2 gap-3">
                <SummaryCard
                    title="Ganancia Mes"
                    amount={totalTechMonth}
                    titleColor="text-blue-200"
                    amountColor="text-white"
                    icon={Briefcase}
                    colorClass="bg-slate-800 dark:bg-slate-900 transition-colors"
                />
                <SummaryCard
                    title="Efectivo (Mes)"
                    amount={totalCashMonth}
                    icon={Wallet}
                    colorClass="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white transition-colors"
                    titleColor="text-gray-600 dark:text-gray-400"
                    amountColor="text-gray-900 dark:text-white"
                />

                {/* Balance Card - Full Width */}
                <div className="col-span-2">
                    <div className={`p-4 rounded-[24px] relative flex items-center justify-between shadow-xl transition-all overflow-hidden ${(totalTechMonth - totalCashMonth) > 0
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800 shadow-indigo-200 dark:shadow-indigo-900/40'
                        : (totalTechMonth - totalCashMonth) < 0
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800 shadow-orange-200 dark:shadow-orange-900/40'
                            : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800 shadow-green-200 dark:shadow-green-900/40'
                        }`}>

                        {/* Shimmer Effect Overlay */}
                        <div className="absolute inset-0 z-0 pointer-events-none">
                            <div className="absolute inset-0 translate-x-[-100%] animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent"></div>
                        </div>

                        <div className="relative z-10">
                            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${(totalTechMonth - totalCashMonth) > 0 ? 'text-indigo-600 dark:text-indigo-400' :
                                (totalTechMonth - totalCashMonth) < 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
                                }`}>
                                {(totalTechMonth - totalCashMonth) > 0 ? 'Pago a Recibir' :
                                    (totalTechMonth - totalCashMonth) < 0 ? 'Pago a Realizar' : 'Cuentas Saldadas'}
                            </p>
                            <p className={`text-2xl font-bold tracking-tight ${(totalTechMonth - totalCashMonth) > 0 ? 'text-indigo-700 dark:text-indigo-300' :
                                (totalTechMonth - totalCashMonth) < 0 ? 'text-orange-700 dark:text-orange-300' : 'text-green-700 dark:text-green-300'
                                }`}>
                                ${Math.abs(totalTechMonth - totalCashMonth).toLocaleString('es-CL')}
                            </p>
                        </div>
                        <div className={`relative z-10 p-3 rounded-full ${(totalTechMonth - totalCashMonth) > 0 ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-200' :
                            (totalTechMonth - totalCashMonth) < 0 ? 'bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-200' : 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-200'
                            }`}>
                            {(totalTechMonth - totalCashMonth) > 0 ? <ArrowDownLeft size={24} /> :
                                (totalTechMonth - totalCashMonth) < 0 ? <ArrowUpRight size={24} /> : <CheckCircle size={24} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Título Lista */}
            <div className="flex justify-between items-center px-1">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white transition-colors">Movimientos</h2>
                <span className="text-xs text-gray-400 font-medium">{filteredJobs.length} trabajos</span>
            </div>

            {/* Lista de Trabajos Paginada */}
            <div className="space-y-3">
                {paginatedJobs.length > 0 ? (
                    <>
                        {paginatedJobs.map(job => (
                            <div key={job.id} className="group relative">
                                <div className="absolute left-[-18px] top-6 w-px h-full bg-gray-200 dark:bg-gray-800 group-last:hidden transition-colors"></div>
                                <div className="absolute left-[-22px] top-6 w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700 border-2 border-white dark:border-gray-950 group-hover:bg-pink-500 transition-colors"></div>
                                <JobCard
                                    job={job}
                                    onEdit={() => onEditJob(job)}
                                    onDelete={() => onDeleteJob(job.id)}
                                    settings={settings}
                                />
                            </div>
                        ))}

                        {/* Botón Ver Más */}
                        {hasMore && (
                            <button
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="w-full py-3 mt-4 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                                Ver más trabajos ({filteredJobs.length - paginatedJobs.length} restantes)
                                <ChevronRight className="rotate-90" size={16} />
                            </button>
                        )}
                    </>
                ) : (
                    <div className="text-center py-10 opacity-50">
                        <Briefcase className="mx-auto mb-2 text-gray-300 dark:text-gray-600" size={48} />
                        <p className="text-gray-400 dark:text-gray-500 text-sm">No hay trabajos en este mes</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default HomeView;
