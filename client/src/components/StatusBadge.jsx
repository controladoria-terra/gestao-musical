import React from 'react';

const statusConfig = {
  pendente: {
    label: 'Pendente',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500'
  },
  confirmado: {
    label: 'Confirmado',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    dotClass: 'bg-blue-500'
  },
  realizado: {
    label: 'Realizado',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500'
  },
  cancelado: {
    label: 'Cancelado',
    className: 'bg-rose-100 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500'
  }
};

export default function StatusBadge({ status = 'pendente', size = 'md' }) {
  const normalizedStatus = String(status).toLowerCase();
  const config = statusConfig[normalizedStatus] || {
    label: status || 'Desconhecido',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400'
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${config.className} ${sizeClasses}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`}></span>
      <span>{config.label}</span>
    </span>
  );
}
