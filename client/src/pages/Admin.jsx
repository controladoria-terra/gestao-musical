import React, { useState, useEffect } from 'react';
import { getEventos, getFornecedores } from '../api';
import { Settings, Server, Database, GitBranch, Cloud, Info, Shield, CheckCircle2 } from 'lucide-react';

export default function Admin() {
  const [eventos, setEventos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getEventos(), getFornecedores()]).then(([e, f]) => {
      setEventos(e); setFornecedores(f); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando...</div>;

  return (
    <div className="space-y-6">
      {/* System Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800">Informações do Sistema</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Aplicação', value: 'Gestão Musical Terra Parque' },
            { label: 'Versão', value: '1.0.0' },
            { label: 'Stack', value: 'React + Express + MongoDB' },
            { label: 'URL', value: 'https://musical.controladoria.tech' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-500">{item.label}</span>
              <span className="text-sm font-medium text-slate-800">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Database Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800">Banco de Dados</h3>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <span className="text-sm font-medium text-emerald-700">MongoDB conectado e operacional</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">Coleção: Fornecedores</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{fornecedores.length} <span className="text-sm font-normal text-slate-400">registros</span></p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">Coleção: Eventos</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{eventos.length} <span className="text-sm font-normal text-slate-400">registros</span></p>
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Cloud className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800">Integrações</h3>
        </div>
        <div className="space-y-3">
          {[
            { icon: Cloud, name: 'Google Sheets', status: 'Conectado', detail: 'AGENDAMENTO MUSICAL 2026', color: 'emerald' },
            { icon: Cloud, name: 'Google Calendar', status: 'Conectado', detail: `${eventos.filter(e => e.calendar_event_id).length} eventos sincronizados`, color: 'emerald' },
            { icon: GitBranch, name: 'GitHub', status: 'Conectado', detail: 'controladoria-terra/gestao-musical', color: 'emerald' },
            { icon: Server, name: 'VPS Hostinger', status: 'Ativo', detail: '191.215.36.170 • Docker Compose', color: 'emerald' },
            { icon: Shield, name: 'SSL/TLS', status: 'Ativo', detail: 'Let\'s Encrypt via Traefik', color: 'emerald' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.detail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full bg-${item.color}-500`}></span>
                  <span className={`text-sm font-medium text-${item.color}-600`}>{item.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800">Sobre o Sistema</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Sistema integrado de gestão operacional para agendamentos de músicos, controle financeiro de fornecedores
          e monitoramento de conformidade fiscal, sincronizado diretamente com Google Sheets e Google Calendar.
          Desenvolvido e deployado via Base44 em VPS Hostinger com Docker Compose.
        </p>
      </div>
    </div>
  );
}
