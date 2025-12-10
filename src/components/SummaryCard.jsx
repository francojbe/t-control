import React from 'react';

const SummaryCard = ({ title, amount, icon: Icon, colorClass, titleColor, amountColor }) => (
    <div className={`p-4 rounded-[24px] relative flex flex-col justify-between h-32 ${colorClass}`}>
        <div className="flex justify-between items-start">
            <div className={`p-2 rounded-full shadow-sm ${colorClass.includes('bg-slate-800') ? 'bg-white/10' : 'bg-white/90'}`}>
                <Icon size={18} className={colorClass.includes('bg-slate-800') ? 'text-white' : 'text-gray-700'} />
            </div>
        </div>
        <div>
            <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${titleColor || 'text-gray-600'}`}>{title}</p>
            <p className={`text-2xl font-bold tracking-tight ${amountColor || 'text-gray-900'}`}>
                ${amount.toLocaleString('es-CL')}
            </p>
        </div>
    </div>
);

export default SummaryCard;
