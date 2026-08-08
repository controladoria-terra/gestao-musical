import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Calendar, Filter, 
  DollarSign, RefreshCw, AlertTriangle, FileCheck, CheckCircle2
} from 'lucide-react';
import { useAuth } from "../context/AuthContext";
import { 
  getEventos, createEvento, updateEvento, deleteEvento, getFornecedores 
} from '../api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const initialFormState = {
  titulo: '',
  data: '',
  horario: '',
  perfil: '',
  periodo: '',
  fornecedor_id: '',
  artista_nome: '',
  local: '',
  valor: '',
  status: 'pendente',
  nf_entregue: false,
  nf_numero: '',
  recebedor: '',
  pix_key: '',
  telefone_pagamento: '',
  data_programado: '',
  calendar_event_id: '',
  tema_mes: '',
  observacoes: ''
};

export default function Eventos() {
  const { isAdmin } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Selection / Editing state
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  // Toast state
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchFornecedoresList = async () => {
    try {
      const res = await getFornecedores();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setFornecedores(list);
    } catch (err) {
      console.error('Erro ao carregar fornecedores para select:', err);
    }
  };

  const fetchEventos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const data = await getEventos(params);
      const list = Array.isArray(data) ? data : (data?.data || []);
      setEventos(list);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      showToast('Erro ao carregar lista de eventos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFornecedoresList();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEventos();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleOpenCreateModal = () => {
    setSelectedEvento(null);
    setFormData(initialFormState);
    setIsFormModalOpen(true);
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('T')) return dateStr.split('T')[0];
    return dateStr;
  };

  const handleOpenEditModal = (evento) => {
    setSelectedEvento(evento);
    setFormData({
      titulo: evento.titulo || '',
      data: formatDateForInput(evento.data),
      horario: evento.horario || '',
      perfil: evento.perfil || '',
      periodo: evento.periodo || '',
      fornecedor_id: evento.fornecedor_id ? String(evento.fornecedor_id) : '',
      artista_nome: evento.artista_nome || '',
      local: evento.local || '',
      valor: evento.valor !== undefined && evento.valor !== null ? evento.valor : '',
      status: evento.status || 'pendente',
      nf_entregue: Boolean(evento.nf_entregue),
      nf_numero: evento.nf_numero || '',
      recebedor: evento.recebedor || '',
      pix_key: evento.pix_key || '',
      telefone_pagamento: evento.telefone_pagamento || '',
      data_programado: formatDateForInput(evento.data_programado),
      calendar_event_id: evento.calendar_event_id || '',
      tema_mes: evento.tema_mes || '',
      observacoes: evento.observacoes || ''
    });
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (evento) => {
    setSelectedEvento(evento);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Auto-fill supplier fields if selecting a supplier
    if (name === 'fornecedor_id') {
      const selectedSupp = fornecedores.find(f => String(f.id || f._id) === String(value));
      setFormData(prev => ({
        ...prev,
        fornecedor_id: value,
        artista_nome: prev.artista_nome || selectedSupp?.nome || '',
        recebedor: prev.recebedor || selectedSupp?.recebedor || '',
        pix_key: prev.pix_key || selectedSupp?.pix || '',
        telefone_pagamento: prev.telefone_pagamento || selectedSupp?.telefone || ''
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo.trim()) {
      showToast('O título do evento é obrigatório.', 'warning');
      return;
    }

    setSubmitting(true);
    const payload = {
      ...formData,
      valor: formData.valor === '' ? 0 : Number(formData.valor)
    };

    try {
      if (selectedEvento) {
        await updateEvento(selectedEvento.id || selectedEvento._id, payload);
        showToast('Evento atualizado com sucesso!', 'success');
      } else {
        await createEvento(payload);
        showToast('Evento criado com sucesso!', 'success');
      }
      setIsFormModalOpen(false);
      fetchEventos();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      showToast('Erro ao salvar evento. Tente novamente.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvento) return;
    setSubmitting(true);
    try {
      await deleteEvento(selectedEvento.id || selectedEvento._id);
      showToast('Evento excluído com sucesso!', 'success');
      setIsDeleteModalOpen(false);
      fetchEventos();
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      showToast('Erro ao excluir evento.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === '') return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(val));
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '-';
    try {
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateString;
    } catch (e) {
      return dateString;
    }
  };

  const getFornecedorName = (id) => {
    if (!id) return '-';
    const found = fornecedores.find(f => String(f.id || f._id) === String(id));
    return found ? found.nome : '-';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'success' })} 
      />

      {/* Top Bar: Title / Search / Status Filter / New Event Button */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar evento, artista ou local..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 appearance-none text-slate-700 cursor-pointer"
            >
              <option value="">Todos os Status</option>
              <option value="pendente">Pendente</option>
              <option value="confirmado">Confirmado</option>
              <option value="realizado">Realizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Evento</span>
          </button>
        )}
      </div>

      {/* Eventos Table Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
            <p className="font-medium text-sm">Carregando agenda de eventos...</p>
          </div>
        ) : eventos.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold text-base">Nenhum evento encontrado</p>
            <p className="text-slate-400 text-xs mt-1">
              {search || statusFilter ? 'Tente ajustar os filtros da busca.' : 'Clique em "Novo Evento" para agendar uma atração.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Título do Evento</th>
                  <th scope="col" className="px-6 py-3.5">Data / Horário</th>
                  <th scope="col" className="px-6 py-3.5">Artista / Banda</th>
                  <th scope="col" className="px-6 py-3.5">Local</th>
                  <th scope="col" className="px-6 py-3.5">Valor</th>
                  <th scope="col" className="px-6 py-3.5">Status</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eventos.map((item) => (
                  <tr key={item.id || item._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{item.titulo}</div>
                      {item.tema_mes && (
                        <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1 border border-emerald-100">
                          {item.tema_mes}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{formatDateDisplay(item.data)}</div>
                      {item.horario && (
                        <span className="text-xs text-slate-400 block">{item.horario}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{item.artista_nome || '-'}</div>
                      {item.fornecedor_id && (
                        <span className="text-xs text-slate-400 block">
                          Fornecedor: {getFornecedorName(item.fornecedor_id)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {item.local || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                      {formatCurrency(item.valor)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {isAdmin ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(item)}
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal (Create / Edit) */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedEvento ? 'Editar Evento' : 'Novo Evento'}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Titulo */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Título do Evento *
              </label>
              <input
                type="text"
                name="titulo"
                required
                value={formData.titulo}
                onChange={handleInputChange}
                placeholder="Ex: Show Sertanejo na Piscina"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-medium"
              >
                <option value="pendente">Pendente</option>
                <option value="confirmado">Confirmado</option>
                <option value="realizado">Realizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Data */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Data do Evento
              </label>
              <input
                type="date"
                name="data"
                value={formData.data}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Horario */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Horário
              </label>
              <input
                type="text"
                name="horario"
                value={formData.horario}
                onChange={handleInputChange}
                placeholder="Ex: 20:00 - 23:00"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Local */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Local
              </label>
              <input
                type="text"
                name="local"
                value={formData.local}
                onChange={handleInputChange}
                placeholder="Ex: Palco Principal / Bar da Piscina"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Fornecedor Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Fornecedor / Parceiro
              </label>
              <select
                name="fornecedor_id"
                value={formData.fornecedor_id}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              >
                <option value="">Selecione o Fornecedor...</option>
                {fornecedores.map((f) => (
                  <option key={f.id || f._id} value={f.id || f._id}>
                    {f.nome} {f.tipo ? `(${f.tipo})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Artista Nome */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nome do Artista / Atração
              </label>
              <input
                type="text"
                name="artista_nome"
                value={formData.artista_nome}
                onChange={handleInputChange}
                placeholder="Ex: Dupla Zé & Tiago"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Valor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Valor Acertado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="valor"
                value={formData.valor}
                onChange={handleInputChange}
                placeholder="0.00"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Perfil */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Perfil do Público
              </label>
              <input
                type="text"
                name="perfil"
                value={formData.perfil}
                onChange={handleInputChange}
                placeholder="Ex: Família, Jovens, Geral"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Periodo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Período
              </label>
              <select
                name="periodo"
                value={formData.periodo}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              >
                <option value="">Selecione o período...</option>
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
                <option value="Madrugada">Madrugada</option>
              </select>
            </div>

            {/* Tema do Mês */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tema do Mês
              </label>
              <input
                type="text"
                name="tema_mes"
                value={formData.tema_mes}
                onChange={handleInputChange}
                placeholder="Ex: Festival de Verão"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Financeiro / Dados de Pagamento */}
            <div className="md:col-span-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3">
                Informações Financeiras e Faturamento
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Recebedor */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Recebedor
                  </label>
                  <input
                    type="text"
                    name="recebedor"
                    value={formData.recebedor}
                    onChange={handleInputChange}
                    placeholder="Nome na conta bancária"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* Pix Key */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    name="pix_key"
                    value={formData.pix_key}
                    onChange={handleInputChange}
                    placeholder="Chave Pix para pagamento"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* Telefone Pagamento */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Telefone Pagamento
                  </label>
                  <input
                    type="text"
                    name="telefone_pagamento"
                    value={formData.telefone_pagamento}
                    onChange={handleInputChange}
                    placeholder="(18) 99999-9999"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* Data Programado */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Data Programada
                  </label>
                  <input
                    type="date"
                    name="data_programado"
                    value={formData.data_programado}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* NF Numero */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Número da NF
                  </label>
                  <input
                    type="text"
                    name="nf_numero"
                    value={formData.nf_numero}
                    onChange={handleInputChange}
                    placeholder="Ex: 000123"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* Calendar Event ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    ID Calendário
                  </label>
                  <input
                    type="text"
                    name="calendar_event_id"
                    value={formData.calendar_event_id}
                    onChange={handleInputChange}
                    placeholder="Ref. evento externo"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* NF Entregue Checkbox */}
                <div className="md:col-span-3 flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="nf_entregue"
                    name="nf_entregue"
                    checked={formData.nf_entregue}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="nf_entregue" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Nota Fiscal Entregue
                  </label>
                </div>
              </div>
            </div>

            {/* Observacoes */}
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Observações
              </label>
              <textarea
                name="observacoes"
                rows="3"
                value={formData.observacoes}
                onChange={handleInputChange}
                placeholder="Observações ou necessidades técnicas..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 rounded-xl transition-colors shadow-xs"
            >
              {submitting ? 'Salvando...' : 'Salvar Evento'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3.5 rounded-xl border border-amber-200">
            <AlertTriangle className="h-6 w-6 flex-shrink-0" />
            <p className="text-xs font-medium text-amber-900">
              Esta ação removerá permanentemente o evento e não poderá ser desfeita.
            </p>
          </div>
          <p className="text-sm text-slate-600">
            Deseja realmente excluir o evento <strong className="text-slate-900">{selectedEvento?.titulo}</strong>?
          </p>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 rounded-xl transition-colors shadow-xs"
            >
              {submitting ? 'Excluindo...' : 'Excluir Evento'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
