import React, { useState, useEffect, useMemo } from 'react';
import { getEventos, getFornecedores } from '../api';
import { useAuth } from '../context/AuthContext';
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, FileText, Download, FileDown, Filter, X, Music, Eye, EyeOff } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const monthNamesFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR');

// Terra Parque brand colors
const TP = {
  green: [20, 83, 45],
  greenLight: [34, 139, 87],
  greenDark: [13, 54, 29],
  gold: [197, 168, 66],
  cream: [248, 246, 238],
  dark: [30, 30, 30],
  gray: [120, 120, 120],
  lightGray: [240, 238, 235],
};

export default function Relatorios() {
  const { isAdmin, permissions } = useAuth();
  const canSeeFinanceiro = isAdmin || permissions.viewFinanceiro;
  const [allEventos, setAllEventos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  // Show/hide financial values toggle - admin can choose, viewer forced off
  const [showValues, setShowValues] = useState(canSeeFinanceiro);

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
  const clearFilters = () => { setDateFrom(''); setDateTo(''); setStatusFilter('all'); setLocalFilter('all'); setFornecedorFilter('all'); };

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando relatórios...</div>;

  const displayValues = canSeeFinanceiro && showValues;

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
    const headers = displayValues 
      ? ['Titulo', 'Data', 'Horario', 'Artista', 'Local', 'Valor', 'Status', 'Tema']
      : ['Titulo', 'Data', 'Horario', 'Artista', 'Local', 'Status', 'Tema'];
    const rows = eventos.map(e => displayValues 
      ? [e.titulo, e.data?.substring(0, 10), e.horario, e.artista_nome, e.local, e.valor, e.status, e.tema_mes]
      : [e.titulo, e.data?.substring(0, 10), e.horario, e.artista_nome, e.local, e.status, e.tema_mes]
    );
    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'relatorio_gestao_musical.csv'; a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const pageH = 297;
    const margin = 14;
    const now = new Date();
    const nowStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const valStr = displayValues ? 'com valores' : 'sem valores';

    // ========== HEADER / TIMBRADO ==========
    // Top green bar
    doc.setFillColor(...TP.green);
    doc.rect(0, 0, pageW, 35, 'F');

    // Gold accent line
    doc.setFillColor(...TP.gold);
    doc.rect(0, 35, pageW, 1.5, 'F');

    // Music note icon (simple shapes)
    doc.setFillColor(...TP.gold);
    doc.circle(margin + 4, 14, 2.5, 'F');
    doc.rect(margin + 6, 6, 1, 10, 'F');
    doc.setFillColor(...TP.gold);
    doc.circle(margin + 13, 11, 2.5, 'F');
    doc.rect(margin + 15, 3, 1, 10, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('TERRA PARQUE ECO RESORT', margin + 24, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...TP.gold);
    doc.text('Gestão Musical • Relatório de Programação', margin + 24, 20);

    // Right side - report info
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Relatório ${valStr}`, pageW - margin, 12, { align: 'right' });
    doc.text(`Gerado: ${nowStr}`, pageW - margin, 18, { align: 'right' });
    doc.text(`${eventos.length} eventos • ${fornecedores.length} fornecedores`, pageW - margin, 24, { align: 'right' });

    let y = 42;

    // ========== FILTERS APPLIED ==========
    if (hasActiveFilters) {
      const filterItems = [
        dateFrom && `De: ${formatDate(dateFrom)}`,
        dateTo && `Até: ${formatDate(dateTo)}`,
        statusFilter !== 'all' && `Status: ${statusLabels[statusFilter]}`,
        localFilter !== 'all' && `Local: ${localFilter}`,
        fornecedorFilter !== 'all' && `Fornecedor: ${fornecedorFilter}`,
      ].filter(Boolean);

      doc.setFillColor(...TP.cream);
      doc.rect(margin, y, pageW - margin * 2, 8, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...TP.gray);
      doc.text(`Filtros: ${filterItems.join('  |  ')}`, margin + 2, y + 5);
      y += 12;
    }

    // ========== SUMMARY SECTION ==========
    doc.setFillColor(...TP.green);
    doc.roundedRect(margin, y, pageW - margin * 2, 7, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('📊  RESUMO EXECUTIVO', margin + 3, y + 5);
    y += 10;

    const summaryBody = [
      ['Total de Eventos', String(eventos.length)],
      ['Fornecedores Cadastrados', String(fornecedores.length)],
      ['Eventos Pendentes', String(byStatus.pendente)],
      ['Eventos Confirmados', String(byStatus.confirmado)],
      ['Eventos Realizados', String(byStatus.realizado)],
      ['Eventos Cancelados', String(byStatus.cancelado)],
    ];

    if (displayValues) {
      summaryBody.unshift(
        ['Investimento Total', formatCurrency(totalInvestido)],
        ['Ticket Médio por Evento', formatCurrency(ticketMedio)],
      );
    }

    autoTable(doc, {
      startY: y,
      body: summaryBody,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: TP.green, cellWidth: 80 },
        1: { halign: 'right', textColor: TP.dark, fontStyle: 'bold' },
      },
      headStyles: { fillColor: TP.green },
      alternateRowStyles: { fillColor: TP.cream },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 8;

    // ========== EVENTS TABLE ==========
    doc.setFillColor(...TP.greenLight);
    doc.roundedRect(margin, y, pageW - margin * 2, 7, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('🎵  PROGRAMAÇÃO MUSICAL', margin + 3, y + 5);
    y += 10;

    const eventHeaders = displayValues
      ? [['Data', 'Artista / Título', 'Local', 'Valor', 'Status']]
      : [['Data', 'Artista / Título', 'Local', 'Status']];

    const eventRows = eventos.map(e => {
      const row = [
        e.data ? formatDate(e.data) : '',
        (e.artista_nome || e.titulo || '').substring(0, 35),
        (e.local || '').substring(0, 20),
      ];
      if (displayValues) row.push(formatCurrency(e.valor));
      row.push(e.status || '');
      return row;
    });

    autoTable(doc, {
      startY: y,
      head: eventHeaders,
      body: eventRows,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.5, lineColor: [220, 220, 220], lineWidth: 0.1 },
      headStyles: { fillColor: TP.green, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: TP.lightGray },
      columnStyles: displayValues
        ? { 0: { cellWidth: 22 }, 1: { cellWidth: 70 }, 2: { cellWidth: 40 }, 3: { cellWidth: 30, halign: 'right' }, 4: { cellWidth: 24 } }
        : { 0: { cellWidth: 25 }, 1: { cellWidth: 80 }, 2: { cellWidth: 50 }, 3: { cellWidth: 30 } },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 6;

    if (eventos.length > 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(...TP.gray);
      doc.text(`Exibindo ${eventos.length} evento(s) no período filtrado.`, margin, y);
      y += 6;
    }

    // ========== MONTHLY BREAKDOWN ==========
    if (y > pageH - 60) { doc.addPage(); y = 20; }

    doc.setFillColor(...TP.greenLight);
    doc.roundedRect(margin, y, pageW - margin * 2, 7, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('📅  ANÁLISE MENSAL', margin + 3, y + 5);
    y += 10;

    const monthHeaders = displayValues
      ? [['Mês', 'Eventos', 'Investimento', 'Média/Evento']]
      : [['Mês', 'Eventos']];

    const monthRows = monthData.map(m => {
      const row = [`${monthNamesFull[m.month]} ${m.year}`, String(m.count)];
      if (displayValues) {
        row.push(formatCurrency(m.valor), formatCurrency(m.count > 0 ? m.valor / m.count : 0));
      }
      return row;
    });

    autoTable(doc, {
      startY: y,
      head: monthHeaders,
      body: monthRows,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: TP.green, textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: TP.cream },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 8;

    // ========== TOP FORNECEDORES ==========
    if (y > pageH - 60) { doc.addPage(); y = 20; }

    doc.setFillColor(...TP.greenLight);
    doc.roundedRect(margin, y, pageW - margin * 2, 7, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('🎤  TOP FORNECEDORES', margin + 3, y + 5);
    y += 10;

    const fornHeaders = displayValues
      ? [['Fornecedor', 'Eventos', 'Investimento Total']]
      : [['Fornecedor', 'Eventos']];

    const fornRows = topFornecedores.map(([name, data]) => {
      const row = [name.substring(0, 40), String(data.count)];
      if (displayValues) row.push(formatCurrency(data.valor));
      return row;
    });

    autoTable(doc, {
      startY: y,
      head: fornHeaders,
      body: fornRows,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: TP.green, textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: TP.cream },
      margin: { left: margin, right: margin },
    });

    // ========== FOOTER on each page ==========
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      // Footer line
      doc.setDrawColor(...TP.gold);
      doc.setLineWidth(0.5);
      doc.line(margin, pageH - 15, pageW - margin, pageH - 15);

      // Footer text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...TP.gray);
      doc.text('Terra Parque Eco Resort • Gestão Musical • Documento gerado automaticamente', margin, pageH - 10);
      doc.text(`Página ${i} de ${pageCount}`, pageW - margin, pageH - 10, { align: 'right' });
    }

    const fileName = displayValues
      ? 'relatorio_gestao_musical_com_valores.pdf'
      : 'relatorio_gestao_musical_sem_valores.pdf';
    doc.save(fileName);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          ...(displayValues ? [{ label: 'Total Investido', value: formatCurrency(totalInvestido), icon: DollarSign, color: 'emerald' }] : []),
          { label: 'Total Eventos', value: eventos.length, icon: Calendar, color: 'blue' },
          { label: 'Fornecedores', value: fornecedores.length, icon: Users, color: 'amber' },
          ...(displayValues ? [{ label: 'Ticket Médio', value: formatCurrency(ticketMedio), icon: TrendingUp, color: 'slate' }] : []),
          ...(!displayValues ? [{ label: 'Realizados', value: byStatus.realizado, icon: FileText, color: 'emerald' }] : []),
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

        {/* Show/Hide Values toggle - only for users with financeiro permission */}
        {canSeeFinanceiro && (
          <button
            onClick={() => setShowValues(!showValues)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${showValues ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
          >
            {showValues ? <><Eye className="h-4 w-4" /> Valores visíveis</> : <><EyeOff className="h-4 w-4" /> Valores ocultos</>}
          </button>
        )}

        <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-slate-600 text-sm font-medium border border-slate-200 hover:bg-slate-50 transition-colors">
          <Download className="h-4 w-4" /> CSV
        </button>
        <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
          <FileDown className="h-4 w-4" /> Exportar PDF {canSeeFinanceiro && <span className="text-[10px] opacity-70">({showValues ? 'com valores' : 'sem valores'})</span>}
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

          {/* Values toggle inside filter panel */}
          {canSeeFinanceiro && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showValues} onChange={(e) => setShowValues(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500" />
                <span className="text-sm font-medium text-slate-600">Mostrar valores financeiros no relatório</span>
              </label>
              <span className={`text-xs px-2 py-0.5 rounded-full ${showValues ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                {showValues ? 'Com valores' : 'Sem valores'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Investment by month - only show if displayValues */}
      {displayValues && (
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
      )}

      {/* Events count by month - always show */}
      {!displayValues && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-emerald-600" /> Eventos por Mês</h3>
          <div className="space-y-2">
            {monthData.map((m, i) => (
              <div key={i} className="flex items-center gap-2 md:gap-3">
                <span className="text-xs md:text-sm font-medium text-slate-600 w-20 md:w-24">{monthNames[m.month]}/{String(m.year).slice(-2)}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-6 md:h-7 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full flex items-center justify-end pr-2" style={{ width: `${(m.count / Math.max(...monthData.map(m => m.count), 1)) * 100}%` }}>
                    <span className="text-[10px] md:text-xs text-white font-medium">{m.count} ev</span>
                  </div>
                </div>
                <span className="text-xs md:text-sm font-semibold text-slate-700 w-8 text-right">{m.count}</span>
              </div>
            ))}
            {monthData.length === 0 && <p className="text-slate-400 text-sm">Nenhum dado para o período filtrado.</p>}
          </div>
        </div>
      )}

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
              <th className="px-2 py-2 font-semibold text-xs">Fornecedor</th>
              <th className="px-2 py-2 font-semibold text-xs text-center">Eventos</th>
              {displayValues && <th className="px-2 py-2 font-semibold text-xs text-right">Investimento</th>}
            </tr>
          </thead>
          <tbody>
            {topFornecedores.map(([name, data], i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-2 py-2 text-slate-700 font-medium">{name}</td>
                <td className="px-2 py-2 text-slate-600 text-center">{data.count}</td>
                {displayValues && <td className="px-2 py-2 text-slate-700 font-semibold text-right">{formatCurrency(data.valor)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
