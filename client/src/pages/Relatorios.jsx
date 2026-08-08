import React, { useState, useEffect } from 'react';
import { getEventos, getFornecedores } from '../api';
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, FileText, Download } from 'lucide-react';

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export default function Relatorios() {
  const [eventos, setEventos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getEventos(), getFornecedores()]).then(([e, f]) => {
      setEventos(e); setFornecedores(f); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando relatórios...</div>;

  const totalInvestido = eventos.reduce((s, e) => s + (e.valor || 0), 0);
  const ticketMedio = eventos.length > 0 ? totalInvestido / eventos.length : 0;

  // By month
  const byMonth = {};
  eventos.forEach(e => {
    if (!e.data) return;
    const d = new Date(e.data);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!byMonth[key]) byMonth[key] = { count: 0, valor: 0, month: d.getMonth(), year: d.getFullYear() };
    byMonth[key].count++;
    byMonth[key].valor += e.valor || 0;
  });
  const monthData = Object.values(byMonth).sort((a, b) => a.year - b.year || a.month - b.month);
  const maxMonthValor = Math.max(...monthData.map(m => m.valor), 1);

  // By status
  const byStatus = { pendente: 0, confirmado: 0, realizado: 0, cancelado: 0 };
  eventos.forEach(e => { if (byStatus.hasOwnProperty(e.status)) byStatus[e.status]++; });
  const statusColors = { pendente: 'bg-amber-500', confirmado: 'bg-blue-500', realizado: 'bg-emerald-500', cancelado: 'bg-rose-500' };
  const statusLabels = { pendente: 'Pendentes', confirmado: 'Confirmados', realizado: 'Realizados', cancelado: 'Cancelados' };

  // Top fornecedores
  const byFornecedor = {};
  eventos.forEach(e => {
    const name = e.artista_nome || 'N/A';
    if (!byFornecedor[name]) byFornecedor[name] = { count: 0, valor: 0 };
    byFornecedor[name].count++;
    byFornecedor[name].valor += e.valor || 0;
  });
  const topFornecedores = Object.entries(byFornecedor).sort((a, b) => b[1].valor - a[1].valor).slice(0, 10);
  const maxFornValor = Math.max(...topFornecedores.map(f => f[1].valor), 1);

  // By local
  const byLocal = {};
  eventos.forEach(e => {
    const l = (e.local || 'N/A').trim().toUpperCase();
    if (!byLocal[l]) byLocal[l] = { count: 0, valor: 0 };
    byLocal[l].count++;
    byLocal[l].valor += e.valor || 0;
  });
  const localData = Object.entries(byLocal).sort((a, b) => b[1].count - a[1].count).slice(0, 8);
  const maxLocalCount = Math.max(...localData.map(l => l[1].count), 1);

  const exportCSV = () => {
    const headers = ['Titulo', 'Data', 'Horario', 'Artista', 'Local', 'Valor', 'Status', 'Tema', 'Observacoes'];
    const rows = eventos.map(e => [e.titulo, e.data?.substring(0, 10), e.horario, e.artista_nome, e.local, e.valor, e.status, e.tema_mes, e.observacoes]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'relatorio_gestao_musical.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Investido', value: formatCurrency(totalInvestido), icon: DollarSign, color: 'emerald' },
          { label: 'Total de Eventos', value: eventos.length, icon: Calendar, color: 'blue' },
          { label: 'Fornecedores', value: fornecedores.length, icon: Users, color: 'amber' },
          { label: 'Ticket Médio', value: formatCurrency(ticketMedio), icon: TrendingUp, color: 'slate' },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">{c.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{c.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-${c.color}-50`}>
                  <Icon className={`h-6 w-6 text-${c.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Export button */}
      <div className="flex justify-end">
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      {/* Investment by month */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-emerald-600" /> Investimento por Mês</h3>
        <div className="space-y-2">
          {monthData.map((m, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600 w-16">{monthNames[m.month]}/{String(m.year).slice(-2)}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-7 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full flex items-center justify-end pr-2 transition-all" style={{ width: `${(m.valor / maxMonthValor) * 100}%` }}>
                  <span className="text-xs text-white font-medium">{m.count} eventos</span>
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-700 w-28 text-right">{formatCurrency(m.valor)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events by status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-emerald-600" /> Eventos por Status</h3>
          <div className="space-y-3">
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{statusLabels[status]}</span>
                  <span className="font-semibold text-slate-700">{count} ({eventos.length > 0 ? Math.round(count / eventos.length * 100) : 0}%)</span>
                </div>
                <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className={`h-full rounded-full ${statusColors[status]}`} style={{ width: `${eventos.length > 0 ? (count / eventos.length) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Events by local */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-emerald-600" /> Eventos por Local</h3>
          <div className="space-y-2">
            {localData.map(([local, data], i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-32 truncate">{local}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(data.count / maxLocalCount) * 100}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-700 w-8 text-right">{data.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top fornecedores */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-emerald-600" /> Top 10 Fornecedores por Valor</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 pr-4">#</th>
                <th className="pb-2 pr-4">Fornecedor</th>
                <th className="pb-2 pr-4 text-center">Eventos</th>
                <th className="pb-2 pr-4">Valor Total</th>
                <th className="pb-2 w-32">Proporção</th>
              </tr>
            </thead>
            <tbody>
              {topFornecedores.map(([name, data], i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2.5 pr-4 font-semibold text-slate-400">{i + 1}</td>
                  <td className="py-2.5 pr-4 font-medium text-slate-800">{name}</td>
                  <td className="py-2.5 pr-4 text-center text-slate-600">{data.count}</td>
                  <td className="py-2.5 pr-4 font-semibold text-slate-700">{formatCurrency(data.valor)}</td>
                  <td className="py-2.5">
                    <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(data.valor / maxFornValor) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-emerald-600" /> Resumo Mensal</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 pr-4">Mês</th>
                <th className="pb-2 pr-4 text-center">Eventos</th>
                <th className="pb-2 pr-4">Total</th>
                <th className="pb-2 pr-4">Média</th>
              </tr>
            </thead>
            <tbody>
              {monthData.map((m, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2.5 pr-4 font-medium text-slate-800">{monthNames[m.month]} {m.year}</td>
                  <td className="py-2.5 pr-4 text-center text-slate-600">{m.count}</td>
                  <td className="py-2.5 pr-4 font-semibold text-slate-700">{formatCurrency(m.valor)}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{formatCurrency(m.count > 0 ? m.valor / m.count : 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
