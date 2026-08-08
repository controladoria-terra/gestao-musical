import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, DollarSign, Clock, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { getDashboard, getEventos, getFornecedores } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAdmin, permissions } = useAuth();
  const canSeeFinanceiro = isAdmin || permissions.viewFinanceiro;
  const [stats, setStats] = useState({
    totalFornecedores: 0,
    totalEventos: 0,
    valorTotal: 0,
    proximosEventos: []
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboard();
      
      // If the backend returns standard dashboard data structure
      let totalFornecedores = data?.totalFornecedores ?? data?.total_fornecedores ?? 0;
      let totalEventos = data?.totalEventos ?? data?.total_eventos ?? 0;
      let valorTotal = data?.valorTotal ?? data?.valor_total ?? 0;
      let proximosEventos = data?.proximosEventos || data?.proximos_eventos || data?.events || [];

      // If backend returned empty or partial object, fetch directly from endpoints as fallback
      if (!data || (totalFornecedores === 0 && totalEventos === 0 && proximosEventos.length === 0)) {
        try {
          const [fornecedoresRes, eventosRes] = await Promise.all([
            getFornecedores(),
            getEventos()
          ]);

          const fornecedoresList = Array.isArray(fornecedoresRes) ? fornecedoresRes : (fornecedoresRes?.data || []);
          const eventosList = Array.isArray(eventosRes) ? eventosRes : (eventosRes?.data || []);

          totalFornecedores = fornecedoresList.length;
          totalEventos = eventosList.length;
          valorTotal = eventosList.reduce((sum, ev) => sum + (Number(ev.valor) || 0), 0);
          
          // Sort events by date ascending to get upcoming events
          const sorted = [...eventosList].sort((a, b) => new Date(a.data || 0) - new Date(b.data || 0));
          proximosEventos = sorted.slice(0, 5);
        } catch (fallbackErr) {
          console.warn('Fallback fetch error:', fallbackErr);
        }
      }

      setStats({
        totalFornecedores,
        totalEventos,
        valorTotal,
        proximosEventos: Array.isArray(proximosEventos) ? proximosEventos.slice(0, 5) : []
      });
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      // Fallback try direct APIs if /api/dashboard endpoint is not implemented or errors
      try {
        const [fornecedoresRes, eventosRes] = await Promise.all([
          getFornecedores(),
          getEventos()
        ]);
        const fornecedoresList = Array.isArray(fornecedoresRes) ? fornecedoresRes : (fornecedoresRes?.data || []);
        const eventosList = Array.isArray(eventosRes) ? eventosRes : (eventosRes?.data || []);

        const totalFornecedores = fornecedoresList.length;
        const totalEventos = eventosList.length;
        const valorTotal = eventosList.reduce((sum, ev) => sum + (Number(ev.valor) || 0), 0);
        const sorted = [...eventosList].sort((a, b) => new Date(a.data || 0) - new Date(b.data || 0));

        setStats({
          totalFornecedores,
          totalEventos,
          valorTotal,
          proximosEventos: sorted.slice(0, 5)
        });
      } catch (finalErr) {
        setError('Falha ao carregar os dados do dashboard. Verifique sua conexão com o servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(val) || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const dateParts = dateString.split('T')[0].split('-');
      if (dateParts.length === 3) {
        return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
      }
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
        <p className="font-medium text-sm">Carregando informações do dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="text-xs font-semibold bg-rose-100 hover:bg-rose-200 text-rose-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Fornecedores */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Fornecedores
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">{stats.totalFornecedores}</h3>
            <p className="text-xs text-slate-500 mt-1">Parceiros e prestadores cadastrados</p>
          </div>
        </div>

        {/* Card 2: Total Eventos */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total de Eventos
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">{stats.totalEventos}</h3>
            <p className="text-xs text-slate-500 mt-1">Apresentações registradas</p>
          </div>
        </div>

        {/* Card 3: Valor Total - hidden for viewers without financeiro permission */}
        {canSeeFinanceiro && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Valor Total
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(stats.valorTotal)}</h3>
            <p className="text-xs text-slate-500 mt-1">Investimento total contratado</p>
          </div>
        </div>
        )}

        {/* Card 4: Eventos Próximos */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Eventos Próximos
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">{stats.proximosEventos.length}</h3>
            <p className="text-xs text-slate-500 mt-1">Na agenda recente</p>
          </div>
        </div>
      </div>

      {/* Próximos Eventos Section */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Próximos Eventos</h3>
            <p className="text-xs text-slate-500 mt-0.5">Lista das 5 próximas atrações agendadas no resort</p>
          </div>
          <Link
            to="/eventos"
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-colors self-start sm:self-auto"
          >
            <span>Ver Todos os Eventos</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {stats.proximosEventos.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium text-base">Nenhum próximo evento agendado</p>
            <p className="text-slate-400 text-xs mt-1">Cadastre novos eventos na aba Eventos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Data</th>
                  <th scope="col" className="px-6 py-3.5">Título</th>
                  <th scope="col" className="px-6 py-3.5">Artista / Banda</th>
                  <th scope="col" className="px-6 py-3.5">Local</th>
                  {canSeeFinanceiro && <th scope="col" className="px-6 py-3.5">Valor</th>}
                  <th scope="col" className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.proximosEventos.map((evento, idx) => (
                  <tr key={evento.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                      {formatDate(evento.data)}
                      {evento.horario && <span className="block text-xs text-slate-400">{evento.horario}</span>}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {evento.titulo || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {evento.artista_nome || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {evento.local || '-'}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 whitespace-nowrap">
                      {canSeeFinanceiro ? formatCurrency(evento.valor) : ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={evento.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
