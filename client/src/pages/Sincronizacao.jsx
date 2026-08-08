import React, { useState, useEffect } from 'react';
import { getEventos, getFornecedores } from '../api';
import { RefreshCw, FileSpreadsheet, Calendar, CheckCircle2, AlertCircle, ExternalLink, Cloud } from 'lucide-react';

export default function Sincronizacao() {
  const [eventos, setEventos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getEventos(), getFornecedores()]).then(([e, f]) => {
      setEventos(e); setFornecedores(f); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando...</div>;

  const withCalendar = eventos.filter(e => e.calendar_event_id).length;
  const withoutCalendar = eventos.length - withCalendar;

  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1qJFH5I5_BupO69Xj4wWh6F4L6I644WoMTx8rAjM8fvs';

  return (
    <div className="space-y-6">
      {/* Sync status banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-4">
        <div className="p-3 bg-emerald-100 rounded-xl">
          <RefreshCw className="h-6 w-6 text-emerald-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="font-bold text-emerald-800">Sincronização Ativa</h3>
          </div>
          <p className="text-sm text-emerald-600 mt-1">A sincronização roda automaticamente a cada hora via workflow Base44</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-slate-500">Fornecedores</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{fornecedores.length}</p>
          <p className="text-xs text-slate-400 mt-1">Sincronizados</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            <span className="text-sm text-slate-500">Eventos</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{eventos.length}</p>
          <p className="text-xs text-slate-400 mt-1">Sincronizados</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-sm text-slate-500">Com Calendar</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{withCalendar}</p>
          <p className="text-xs text-slate-400 mt-1">Google Calendar</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span className="text-sm text-slate-500">Sem Calendar</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{withoutCalendar}</p>
          <p className="text-xs text-slate-400 mt-1">Pendentes</p>
        </div>
      </div>

      {/* Google Sheets section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800">Google Sheets</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Planilha: AGENDAMENTO MUSICAL 2026</p>
              <p className="text-xs text-slate-500">Importação automática de fornecedores e eventos</p>
            </div>
            <a href={SHEET_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-200 hover:bg-emerald-100 transition-colors">
              Abrir <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Aba: DADOS DO APP</p>
              <p className="text-xs text-slate-500">Exportação do app para a planilha</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Aba: FORNECEDORES</p>
              <p className="text-xs text-slate-500">Origem dos dados de fornecedores</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Google Calendar section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800">Google Calendar</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Eventos sincronizados</p>
              <p className="text-xs text-slate-500">{withCalendar} de {eventos.length} eventos no Google Calendar</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${eventos.length > 0 ? (withCalendar / eventos.length) * 100 : 0}%` }} />
              </div>
              <span className="text-sm font-semibold text-emerald-600">{eventos.length > 0 ? Math.round(withCalendar / eventos.length * 100) : 0}%</span>
            </div>
          </div>
          {withoutCalendar > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-700">{withoutCalendar} evento(s) serão sincronizados no próximo ciclo automático</p>
            </div>
          )}
        </div>
      </div>

      {/* Workflow info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Cloud className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800">Workflow de Sincronização</h3>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <p><span className="font-medium text-slate-700">Frequência:</span> A cada hora (cron: 0 * * * *)</p>
          <p><span className="font-medium text-slate-700">Direção:</span> Bidirecional (Planilha → App e App → Planilha + Calendar)</p>
          <p><span className="font-medium text-slate-700">Funções:</span></p>
          <ul className="ml-6 space-y-1 text-slate-500">
            <li>• <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">importFromSheets</code> — Importa dados da planilha para o app</li>
            <li>• <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">googleIntegration</code> — Exporta dados do app para planilha e Calendar</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
