
import React, { useRef } from 'react';
import { Calendar, TrendingUp, Pencil, Trash2, CreditCard } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

const JobCard = ({ job, onEdit, onDelete, settings = { techCommissionPct: 50, cardFeePct: 0 } }) => {
    // Ingresos
    // Ingresos
    const totalIncome = (parseFloat(job.transfer) || 0) + (parseFloat(job.cash) || 0) + (parseFloat(job.link_payment) || 0);

    // Gastos Operativos (DB keys are snake_case)
    const expenseCompany = parseFloat(job.expense_company) || 0;
    const expenseTech = parseFloat(job.expense_tech) || 0;
    const expenses = expenseCompany + expenseTech;

    // Calcular Comisión TARJETA/LINK si aplica
    const isLinkPayment = parseFloat(job.link_payment) > 0;
    const cardFeePct = settings.cardFeePct || 0;
    const linkFeeAmount = isLinkPayment ? (totalIncome * (cardFeePct / 100)) : 0;

    // GANANCIA NETA REAL = (Ingreso - Comisión Link) - Gastos Operativos
    const profit = (totalIncome - linkFeeAmount) - expenses;

    // Get Commission % (Default to 50 if not set)
    const commissionPct = job.applied_commission !== undefined ? job.applied_commission : 50;

    // Reparto de la Ganancia Neta
    const techShare = profit * (commissionPct / 100);
    const companyShare = profit * ((100 - commissionPct) / 100);

    // Pago final (+ Reembolsos)
    const techTotal = techShare + expenseTech;
    const companyTotal = companyShare + expenseCompany;

    const isTransfer = parseFloat(job.transfer) > 0;
    // isLinkPayment defined above
    const hasExpenseCompany = expenseCompany > 0;
    const hasExpenseTech = expenseTech > 0;

    // --- SWIPE LOGIC ---
    const x = useMotionValue(0);
    const cardRef = useRef(null);

    // Color de fondo dinámico basado en la dirección del arrastre
    // Delete: Rose-400 (#fb7185), Edit: Violet-400 (#a78bfa) - Tonos pasteles más suaves
    const background = useTransform(x, [-100, 0, 100], ["#fb7185", "#ffffff", "#a78bfa"]);

    // Icon scale/opacity linked to drag distance
    const iconScaleEdit = useTransform(x, [0, 50, 100], [0.5, 1, 1.2]);
    const iconScaleDelete = useTransform(x, [-100, -50, 0], [1.2, 1, 0.5]);
    const iconOpacityEdit = useTransform(x, [0, 50], [0, 1]);
    const iconOpacityDelete = useTransform(x, [-50, 0], [1, 0]);


    const handleDragEnd = (event, info) => {
        if (info.offset.x > 100) {
            onEdit();
        } else if (info.offset.x < -100) {
            onDelete();
        }
    };

    return (
        <div className="relative mb-3">
            {/* BACKGROUND ACTIONS LAYER */}
            <motion.div
                style={{ background }}
                className="absolute inset-0 rounded-[24px] flex items-center justify-between px-6 mb-3"
            >
                {/* EDIT ICON (Visible when dragging Right) */}
                <motion.div style={{ scale: iconScaleEdit, opacity: iconOpacityEdit }}>
                    <Pencil className="text-white w-8 h-8" strokeWidth={3} />
                </motion.div>

                {/* DELETE ICON (Visible when dragging Left) */}
                <motion.div style={{ scale: iconScaleDelete, opacity: iconOpacityDelete }}>
                    <Trash2 className="text-white w-8 h-8" strokeWidth={3} />
                </motion.div>
            </motion.div>

            {/* FOREGROUND CARD LAYER */}
            <motion.div
                style={{ x, touchAction: "pan-y" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={handleDragEnd}
                className="bg-white dark:bg-gray-900 p-5 rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-3 relative z-10 transition-colors"
                whileTap={{ cursor: "grabbing" }}
            >
                <div className="flex justify-between items-start select-none">
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg transition-colors">{job.client}</h3>
                        <p className="text-gray-400 dark:text-gray-500 text-xs flex items-center gap-1 transition-colors">
                            <Calendar size={12} /> {job.date}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center justify-center gap-1 ${isLinkPayment ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300' :
                            isTransfer ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300' :
                                'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300'
                            } `}>
                            {isLinkPayment && <CreditCard size={12} />}
                            ${totalIncome.toLocaleString()}
                        </span>

                        {isLinkPayment && linkFeeAmount > 0 && (
                            <p className="text-[9px] text-red-400 mt-0.5 font-medium">
                                -${linkFeeAmount.toLocaleString()} fee
                            </p>
                        )}

                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 uppercase font-medium transition-colors">
                            {isLinkPayment ? 'Link Pago' : isTransfer ? 'Transferencia' : 'Efectivo'}
                        </p>
                    </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-sm leading-snug bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg select-none transition-colors">
                    {job.description}
                </p>

                {(hasExpenseCompany || hasExpenseTech) && (
                    <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md w-fit transition-colors">
                        <TrendingUp size={12} />
                        <span>
                            Gasto: ${expenses.toLocaleString()} ({hasExpenseCompany && hasExpenseTech ? 'Mixto' : (hasExpenseCompany ? 'Empresa' : 'Técnico')})
                        </span>
                    </div>
                )}

                <div className="flex gap-2 mt-1 select-none">
                    <div className="flex-1 bg-green-50 dark:bg-green-900/20 p-2 rounded-xl text-center transition-colors">
                        <p className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase">Técnico</p>
                        <p className="font-bold text-green-700 dark:text-green-300">${techTotal.toLocaleString()}</p>
                    </div>
                    <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 p-2 rounded-xl text-center transition-colors">
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase">Empresa</p>
                        <p className="font-bold text-purple-700 dark:text-purple-300">${companyTotal.toLocaleString()}</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default JobCard;
