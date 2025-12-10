import React, { useState, useMemo } from 'react';
import { ChevronDown, TrendingUp, Info } from 'lucide-react';

const StatisticsView = ({ jobs, settings }) => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // 1. Calculate Available Years
    const availableYears = useMemo(() => {
        const years = new Set(jobs.map(j => new Date(j.date + 'T12:00:00').getFullYear()));
        years.add(new Date().getFullYear()); // Ensure current year is always there
        return Array.from(years).sort((a, b) => b - a);
    }, [jobs]);

    // 2. Filter jobs by selected year
    const yearJobs = useMemo(() => {
        return jobs.filter(j => new Date(j.date + 'T12:00:00').getFullYear() === selectedYear);
    }, [jobs, selectedYear]);

    // 3. Calculate Monthly Data for Chart (Last 6 months from current date if current year, or all 12 if past year?)
    // User asked for "Last 3 or 6 months trend".
    // Let's basically show the breakdown of the selected year by month. That's usually what people want in "Annual Stats".
    // OR, we can strictly follow "Last 6 months" regardless of year selection.
    // The user asked for "Trend of Net Profit of last 3 or 6 months". This is specific.
    // AND "Summary of a full year".
    // So let's do:
    // Top Section: Trend Chart (Last 6 Months rolling).
    // Bottom Section: Annual Summary (Year Selector + Totals).

    // --- CHART DATA (Rolling 6 Months) ---
    const chartData = useMemo(() => {
        const today = new Date();
        const data = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
            const monthName = d.toLocaleDateString('es-ES', { month: 'short' });

            // Calculate Profit for this month
            const monthJobs = jobs.filter(j => j.date.startsWith(monthKey));
            const totalProfit = monthJobs.reduce((acc, job) => {
                const income = (job.transfer || 0) + (job.cash || 0) + (job.link_payment || 0);
                const expense = (job.expense_company || 0) + (job.expense_tech || 0);

                // Calculate Tech Share (Net Profit accurately)
                const isLink = (job.link_payment || 0) > 0;
                const linkFee = isLink ? (income * (settings.cardFeePct / 100)) : 0;
                const profitWithFee = (income - linkFee) - expense;

                const comm = job.applied_commission ?? settings.techCommissionPct;
                const techShare = profitWithFee * (comm / 100);
                const techReimb = job.expense_tech || 0;

                return acc + (techShare + techReimb);
            }, 0);

            data.push({ month: monthName, value: totalProfit, fullDate: monthKey });
        }
        return data;
    }, [jobs, settings]);

    const maxChartValue = Math.max(...chartData.map(d => d.value), 1000); // Avoid div by zero

    // --- ANNUAL DATA ---
    const annualStats = useMemo(() => {
        return yearJobs.reduce((acc, job) => {
            const income = (job.transfer || 0) + (job.cash || 0) + (job.link_payment || 0);
            const expense = (job.expense_company || 0) + (job.expense_tech || 0);

            // Tech Net Calc
            const isLink = (job.link_payment || 0) > 0;
            const linkFee = isLink ? (income * (settings.cardFeePct / 100)) : 0;
            const profitWithFee = (income - linkFee) - expense;

            const comm = job.applied_commission ?? settings.techCommissionPct;
            const techShare = profitWithFee * (comm / 100);
            const techReimb = job.expense_tech || 0;
            const finalProfit = techShare + techReimb;

            return {
                income: acc.income + income,
                profit: acc.profit + finalProfit,
                count: acc.count + 1
            };
        }, { income: 0, profit: 0, count: 0 });
    }, [yearJobs, settings]);

    return (
        <div className="space-y-8 animate-fadeIn pb-24">
            {/* Header */}
            <div>
                {/* This header logic moves to App.jsx usually, but we have content here */}
            </div>

            {/* CHART SECTION */}
            <div className="bg-white dark:bg-gray-900 rounded-[32px] p-6 shadow-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                        <TrendingUp size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white leading-tight">Tendencia Semestral</h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Últimos 6 meses de ganancia</p>
                    </div>
                </div>

                {/* CSS Bar Chart */}
                <div className="relative h-48 flex items-end gap-2 sm:gap-4 justify-between pt-6">
                    {/* Grid Lines (Optional, maybe too descriptive) */}

                    {chartData.map((d, i) => (
                        <div key={i} className="group relative flex-1 flex flex-col items-center justify-end h-full">
                            {/* Bar */}
                            <div
                                className="w-full max-w-[30px] sm:max-w-[40px] bg-indigo-200 dark:bg-indigo-900/50 rounded-t-lg relative transition-all duration-500 group-hover:bg-indigo-400 dark:group-hover:bg-indigo-600 overflow-hidden"
                                style={{ height: `${(d.value / maxChartValue) * 100}%` }}
                            >
                                {/* Fill Animation or inner gradient */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 dark:bg-indigo-400 opacity-50"></div>
                            </div>

                            {/* Label Month */}
                            <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 mt-2 capitalize">{d.month}</p>

                            {/* Tooltip / Floating Value */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                                ${d.value.toLocaleString('es-CL')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ANNUAL SUMMARY SECTION */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Resumen Anual</h3>

                    {/* Year Selector */}
                    <div className="relative">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="appearance-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-white font-bold py-2 pl-4 pr-9 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-500"
                        >
                            {availableYears.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {/* Card Ganancia Anual */}
                    <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-[28px] p-6 text-white shadow-lg shadow-pink-200 dark:shadow-none relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 transform rotate-12">
                            <TrendingUp size={120} />
                        </div>

                        <p className="text-pink-100 font-medium text-sm mb-1 uppercase tracking-wide">Ganancia Neta {selectedYear}</p>
                        <h2 className="text-4xl font-bold tracking-tight mb-4">${annualStats.profit.toLocaleString('es-CL')}</h2>

                        <div className="flex gap-4">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
                                <p className="text-[10px] text-pink-100 font-bold uppercase">Trabajos</p>
                                <p className="text-xl font-bold">{annualStats.count}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
                                <p className="text-[10px] text-pink-100 font-bold uppercase">Ingreso Bruto</p>
                                <p className="text-xl font-bold">${annualStats.income.toLocaleString('es-CL')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="flex gap-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <Info size={20} className="text-gray-400 shrink-0" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            Este resumen calcula tus ganancias basándose en la configuración de comisión histórica de cada trabajo registrado.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsView;
