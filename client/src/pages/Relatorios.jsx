import React, { useState, useEffect, useMemo } from 'react';
import { getEventos, getFornecedores } from '../api';
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, FileText, Download, FileDown, Filter, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const monthNamesFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR');

export default function Relatorios() {
  const [allEventos, setAllEventos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [localFilter, setLocalFilter] = useState('all');
  const [fornecedorFilter, setFornecedorFilter] = useState('all');

  useEffect(() => {
    Promise.all([getEventos(), getFornecedores()]).then(([e, f]) => {
      setAllEventos(e); setFornecedores(f); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Apply filters
  const eventos = useMemo(() => {
    return allEventos.filter(e => {
      if (dateFrom && new Date(e.data) < new Date(dateFrom)) return false;
      if (dateTo && new Date(e.data) > new Date(dateTo + 'T23:59:59')) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (localFilter !== 'all' && (e.local || '').toUpperCase() !== localFilter) return false;
      if (fornecedorFilter !== 'all' && e.artista_nome !== fornecedorFilter) return false;
      return true;
    });
  }, [allEventos, dateFrom, dateTo, statusFilter, localFilter, fornecedorFilter]);

  const locais = useMemo(() => {
    const set = new Set(allEventos.map(e => (e.local || '').toUpperCase()).filter(Boolean));
    return Array.from(set).sort();
  }, [allEventos]);

  const fornecedorNames = useMemo(() => {
    const set = new Set(allEventos.map(e => e.artista_nome).filter(Boolean));
    return Array.from(set).sort();
  }, [allEventos]);

  const hasActiveFilters = dateFrom || dateTo || statusFilter !== 'all' || localFilter !== 'all' || fornecedorFilter !== 'all';

  const clearFilters = () => {
    setDateFrom(''); setDateTo(''); setStatusFilter('all'); setLocalFilter('all'); setFornecedorFilter('all');
  };

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
    const headers = ['Titulo', 'Data', 'Horario', 'Artista', 'Local', 'Valor', 'Status', 'Tema'];
    const rows = eventos.map(e => [e.titulo, e.data?.substring(0, 10), e.horario, e.artista_nome, e.local, e.valor, e.status, e.tema_mes]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'relatorio_gestao_musical.csv'; a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleDateString('pt-BR');

    // Title
    doc.setFontSize(16);
    doc.setTextColor(20, 83, 45);
    doc.text('Relatório Gestão Musical - Terra Parque', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${now}`, 14, 27);
    doc.text(`Total de eventos: ${eventos.length} | Total investido: ${formatCurrency(totalInvestido)}`, 14, 33);

    let y = 42;

    // Summary
    autoTable(doc, {
      startY: y,
      head: [['Indicador', 'Valor']],
      body: [
        ['Total Investido', formatCurrency(totalInvestido)],
        ['Total de Eventos', String(eventos.length)],
        ['Fornecedores', String(fornecedores.length)],
        ['Ticket Médio', formatCurrency(ticketMedio)],
        ['Eventos Pendentes', String(byStatus.pendente)],
        ['Eventos Confirmados', String(byStatus.confirmado)],
        ['Eventos Realizados', String(byStatus.realizado)],
        ['Eventos Cancelados', String(byStatus.cancelado)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [20, 83, 45], textColor: 255 },
    });

    // Events table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Data', 'Artista', 'Local', 'Valor', 'Status']],
      body: eventos.slice(0, 40).map(e => [
        e.data ? formatDate(e.data) : '',
        e.artista_nome || e.titulo || '',
        e.local || '',
        formatCurrency(e.valor),
        e.status || '',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [20, 83, 45], textColor: 255 },
    });

    if (eventos.length > 40) {
      doc.text(`... e mais ${eventos.length - 40} eventos (exibindo os primeiros 40)`, 14, doc.lastAutoTable.finalY + 7);
    }

    // By month
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      head: [['Mês', 'Eventos', 'Total', 'Média']],
      body: monthData.map(m => [`${monthNames[m.month]}/${m.year}`, String(m.count), formatCurrency(m.valor), formatCurrency(m.count > 0 ? m.valor / m.count : 0)]),
      theme: 'striped',
      headStyles: { fillColor: [20, 83, 45], textColor: 255 },
    });

    // Top fornecedores
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Fornecedor', 'Eventos', 'Valor Total']],
      body: topFornecedores.map(([name, data]) => [name, String(data.count), formatCurrency(data.valor)]),
      theme: 'striped',
      headStyles: { fillColor: [20, 83, 45], textColor: 255 },
    });

    // Filters applied
    if (hasActiveFilters) {
      const filterText = [
        dateFrom && `De: ${dateFrom}`,
        dateTo && `Até: ${dateTo}`,
        statusFilter !== 'all' && `Status: ${statusLabels[statusFilter]}`,
        localFilter !== 'all' && `Local: ${localFilter}`,
        fornecedorFilter !== 'all' && `Fornecedor: ${fornecedorFilter}`,
      ].filter(Boolean).join(' | ');
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Filtros aplicados: ${filterText}`, 14, doc.lastAutoTable.finalY + 7);
    }

    doc.save('relatorio_gestao_musical.pdf');
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total Investido', value: formatCurrency(totalInvestido), icon: DollarSign, color: 'emerald' },
          { label: 'Total Eventos', value: eventos.length, icon: Calendar, color: 'blue' },
          { label: 'Fornecedores', value: fornecedores.length, icon: Users, color: 'amber' },
          { label: 'Ticket Médio', value: formatCurrency(ticketMedio), icon: TrendingUp, color: 'slate' },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">{c.label}</p>
                  <p className="text-lg md:text-2xl font-bold text-slate-800 mt-1">{c.value}</p>
                </div>
                <div className={`p-2 md:p-3 rounded-xl bg-${c.color}-50`}>
                  <Icon className={`h-5 w-5 md:h-6 md:w-6 text-${c.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter + Export bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${showFilters || hasActiveFilters ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
          <Filter className="h-4 w-4" /> Filtros {hasActiveFilters && <span className="bg-emerald-500 text-white text-xs px-1.5 rounded-full">●</span>}
        </button>
        <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-slate-600 text-sm font-medium border border-slate-200 hover:bg-slate-50 transition-colors">
          <Download className="h-4 w-4" /> CSV
        </button>
        <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
          <FileDown className="h-4 w-4" /> Exportar PDF
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 transition-colors">
            <X className="h-4 w-4" /> Limpar
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Data inicial</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Data final</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none">
                <option value="all">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="confirmado">Confirmado</option>
                <option value="realizado">Realizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Local</label>
              <select value={localFilter} onChange={(e) => setLocalFilter(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none">
                <option value="all">Todos</option>
                {locais.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Fornecedor</label>
              <select value={fornecedorFilter} onChange={(e) => setFornecedorFilter(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none">
                <option value="all">Todos</option>
                {fornecedorNames.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Investment by month */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-emerald-600" /> Investimento por Mês</h3>
        <div className="space-y-2">
          {monthData.map((m, i) => (
            <div key={i} className="flex items-center gap-2 md:gap-3">
              <span className="text-xs md:text-sm font-medium text-slate-600 w-14 md:w-16">{monthNames[m.month]}/{String(m.year).slice(-2)}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-6 md:h-7 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full flex items-center justify-end pr-2" style={{ width: `${(m.valor / maxMonthValor) * 100}%` }}>
                  <span className="text-[10px] md:text-xs text-white font-medium">{m.count} ev</span>
                </div>
              </div>
              <span className="text-xs md:text-sm font-semibold text-slate-700 w-24 md:w-28 text-right">{formatCurrency(m.valor)}</span>
            </div>
          ))}
          {monthData.length === 0 && <p className="text-slate-400 text-sm">Nenhum dado para o período filtrado.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Events by status */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-emerald-600" /> Eventos por Status</h3>
          <div className="space-y-3">
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-xs md:text-sm mb-1">
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
        <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-emerald-600" /> Eventos por Local</h3>
          <div className="space-y-2">
            {localData.map(([local, data], i) => (
              <div key={i} className="flex items-center gap-2 md:gap-3">
                <span className="text-xs md:text-sm text-slate-600 w-24 md:w-32 truncate">{local}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-5 md:h-6 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(data.count / maxLocalCount) * 100}%` }} />
                </div>
                <span className="text-xs md:text-sm font-semibold text-slate-700 w-6 text-right">{data.count}</span>
              </div>
            ))}
            {localData.length === 0 && <p className="text-slate-400 text-sm">Sem dados.</p>}
          </div>
        </div>
      </div>

      {/* Top fornecedores */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm overflow-x-auto">
        <h3 className="font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-emerald-600" /> Top 10 Fornecedores</h3>
        <table className="w-full text-sm min-w-[400px]">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-2 pr-4">#</th><th className="pb-2 pr-4">Fornecedor</th><th className="pb-2 pr-4 text-center">Ev</th><th className="pb-2 pr-4">Valor</th><th className="pb-2 w-20 md:w-32">Proporção</th>
            </tr>
          </thead>
          <tbody>
            {topFornecedores.map(([name, data], i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-semibold text-slate-400">{i + 1}</td>
                <td className="py-2 pr-4 font-medium text-slate-800 truncate max-w-[120px]">{name}</td>
                <td className="py-2 pr-4 text-center text-slate-600">{data.count}</td>
                <td className="py-2 pr-4 font-semibold text-slate-700">{formatCurrency(data.valor)}</td>
                <td className="py-2"><div className="bg-slate-100 rounded-full h-2 overflow-hidden"><div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(data.valor / maxFornValor) * 100}%` }} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {topFornecedores.length === 0 && <p className="text-slate-400 text-sm mt-3">Sem dados para exibir.</p>}
      </div>
    </div>
  );
}
