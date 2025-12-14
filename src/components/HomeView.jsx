import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Briefcase, Wallet, ChevronLeft, ChevronRight, Calendar, ArrowDownLeft, ArrowUpRight, CheckCircle } from 'lucide-react';
import SummaryCard from './SummaryCard';
import JobCard from './JobCard';

const HomeView = ({ jobs, onOpenForm, onEditJob, onDeleteJob, settings = { techCommissionPct: 50 } }) => {
    // --- ESTADO: SEMANA SELECCIONADA ---
    const [currentDate, setCurrentDate] = useState(new Date());
    // Filtro de estado
    const [activeFilter, setActiveFilter] = useState('all');

    // Helper: Obtener rango de la semana (Lunes a Domingo)
    const getWeekRange = (date) => {
        const d = new Date(date);
        const day = d.getDay(); // 0 is Sunday
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday

        const start = new Date(d);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    };

    const { start: startOfWeek, end: endOfWeek } = useMemo(() => getWeekRange(currentDate), [currentDate]);

    // Funciones para navegar entre semanas
    const changeWeek = (increment) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (increment * 7));
        setCurrentDate(newDate);
    };

    const formatWeekDisplay = (start, end) => {
        const options = { day: 'numeric', month: 'short' };
        const startStr = start.toLocaleDateString('es-ES', options);
        // Si es el mismo mes y año, podríamos abreviar, pero simple es mejor
        const endStr = end.toLocaleDateString('es-ES', options);
        return `${startStr} - ${endStr}`;
    };

    // --- FILTRADO POR SEMANA Y TIPO ---
    const filteredJobs = useMemo(() => {
        // Filtrar por rango de fechas
        let result = jobs.filter(job => {
            // job.date is YYYY-MM-DD (local time usually)
            // Create date object from string (mid-day to avoid timezone shifting issues)
            const jobDate = new Date(job.date + 'T12:00:00');
            return jobDate >= startOfWeek && jobDate <= endOfWeek;
        });

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
    }, [jobs, startOfWeek, endOfWeek, activeFilter]);

    // Cálculos de Resumen para la semana seleccionada
    const { totalIncomeWeek, totalCashWeek, totalTechWeek, totalExpenseWeek } = useMemo(() => {
        let income = 0;
        let cashWeek = 0;
        let techTotal = 0;
        let expenseTotal = 0;

        filteredJobs.forEach(job => {
            // Ingresos Brutos
            const jobIncome = (parseFloat(job.transfer) || 0) + (parseFloat(job.cash) || 0) + (parseFloat(job.link_payment) || 0);
            income += jobIncome;

            // Efectivo (para saber cuánto tiene el técnico en mano)
            cashWeek += (parseFloat(job.cash) || 0);

            // Gastos
            const expenseComp = parseFloat(job.expenseCompany) || parseFloat(job.expense_company) || 0;
            const expenseTech = parseFloat(job.expenseTech) || parseFloat(job.expense_tech) || 0;
            const jobExpense = expenseComp + expenseTech;
            expenseTotal += jobExpense;

            // --- CÁLCULO REAL DE GANANCIA TÉCNICO (Replica JobCard) ---

            // 1. Descontar Fee de Tarjeta si es Link
            const isLink = parseFloat(job.link_payment) > 0;
            const cardFeePct = settings.cardFeePct || 0; // Usar setting global actual
            const linkFee = isLink ? (jobIncome * (cardFeePct / 100)) : 0;

            // 2. Neto Real
            const profitWithFee = (jobIncome - linkFee) - jobExpense;

            // 3. Comisión Específica
            const commissionPct = job.appliedCommission !== undefined ? job.appliedCommission : (job.applied_commission !== undefined ? job.applied_commission : (settings.techCommissionPct || 50));

            // 4. Parte del Técnico (+ su reembolso)
            const techShare = profitWithFee * (commissionPct / 100);
            const techReimbursement = expenseTech;

            techTotal += (techShare + techReimbursement);
        });

        return {
            totalIncomeWeek: income,
            totalCashWeek: cashWeek,
            totalTechWeek: techTotal,
            totalExpenseWeek: expenseTotal
        };
    }, [filteredJobs, settings]);

    // --- PAGINACIÓN ---
    const PAGE_SIZE = 5;
    const [currentPage, setCurrentPage] = useState(1);

    // Resetear página al cambiar de mes o filtro
    // Resetear página al cambiar de semana o filtro
    useEffect(() => {
        setCurrentPage(1);
    }, [currentDate, activeFilter]);

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

            {/* Selector de Mes/Semana */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
                <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400 transition-colors">
                    <ChevronLeft size={20} />
                </button>

                <div className="relative flex items-center gap-2 p-2 rounded-lg transition-colors">
                    <Calendar size={18} className="text-pink-500" />
                    <span className="text-gray-800 dark:text-white font-bold capitalize select-none transition-colors">
                        {formatWeekDisplay(startOfWeek, endOfWeek)}
                    </span>
                    <p className="text-[10px] text-gray-400 font-medium ml-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Semana</p>
                </div>

                <button onClick={() => changeWeek(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400 transition-colors">
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
                    title="Ganancia Semana"
                    amount={totalTechWeek}
                    titleColor="text-blue-200"
                    amountColor="text-white"
                    icon={Briefcase}
                    colorClass="bg-slate-800 dark:bg-slate-900 transition-colors"
                />
                <SummaryCard
                    title="Efectivo (Semana)"
                    amount={totalCashWeek}
                    icon={Wallet}
                    colorClass="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white transition-colors"
                    titleColor="text-gray-600 dark:text-gray-400"
                    amountColor="text-gray-900 dark:text-white"
                />

                {/* Balance Card - Full Width */}
                <div className="col-span-2">
                    <div className={`p-4 rounded-[24px] relative flex items-center justify-between shadow-xl transition-all overflow-hidden ${(totalTechWeek - totalCashWeek) > 0
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800 shadow-indigo-200 dark:shadow-indigo-900/40'
                        : (totalTechWeek - totalCashWeek) < 0
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800 shadow-orange-200 dark:shadow-orange-900/40'
                            : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800 shadow-green-200 dark:shadow-green-900/40'
                        }`}>

                        {/* Shimmer Effect Overlay */}
                        <div className="absolute inset-0 z-0 pointer-events-none">
                            <div className="absolute inset-0 translate-x-[-100%] animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent"></div>
                        </div>

                        <div className="relative z-10">
                            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${(totalTechWeek - totalCashWeek) > 0 ? 'text-indigo-600 dark:text-indigo-400' :
                                (totalTechWeek - totalCashWeek) < 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
                                }`}>
                                {(totalTechWeek - totalCashWeek) > 0 ? 'Pago a Recibir' :
                                    (totalTechWeek - totalCashWeek) < 0 ? 'Pago a Realizar' : 'Cuentas Saldadas'}
                            </p>
                            <p className={`text-2xl font-bold tracking-tight ${(totalTechWeek - totalCashWeek) > 0 ? 'text-indigo-700 dark:text-indigo-300' :
                                (totalTechWeek - totalCashWeek) < 0 ? 'text-orange-700 dark:text-orange-300' : 'text-green-700 dark:text-green-300'
                                }`}>
                                ${Math.abs(totalTechWeek - totalCashWeek).toLocaleString('es-CL')}
                            </p>
                        </div>
                        <div className={`relative z-10 p-3 rounded-full ${(totalTechWeek - totalCashWeek) > 0 ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-200' :
                            (totalTechWeek - totalCashWeek) < 0 ? 'bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-200' : 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-200'
                            }`}>
                            {(totalTechWeek - totalCashWeek) > 0 ? <ArrowDownLeft size={24} /> :
                                (totalTechWeek - totalCashWeek) < 0 ? <ArrowUpRight size={24} /> : <CheckCircle size={24} />}
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
                        <p className="text-gray-400 dark:text-gray-500 text-sm">No hay trabajos en esta semana</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default HomeView;
