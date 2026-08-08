import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Phone, Mail, FileText, CheckCircle, 
  XCircle, AlertTriangle, RefreshCw, UserCheck, DollarSign
} from 'lucide-react';
import { 
  getFornecedores, createFornecedor, updateFornecedor, deleteFornecedor 
} from '../api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const initialFormState = {
  nome: '',
  tipo: '',
  responsavel: '',
  recebedor: '',
  pix: '',
  cachet: '',
  telefone: '',
  email: '',
  documento: '',
  notas_fiscais: '',
  enviado_financeiro: false,
  observacoes: ''
};

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Selection / Editing state
  const [selectedFornecedor, setSelectedFornecedor] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  // Toast state
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchFornecedores = async () => {
    setLoading(true);
    try {
      const data = await getFornecedores({ search: search.trim() || undefined });
      const list = Array.isArray(data) ? data : (data?.data || []);
      setFornecedores(list);
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      showToast('Erro ao carregar lista de fornecedores', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFornecedores();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenCreateModal = () => {
    setSelectedFornecedor(null);
    setFormData(initialFormState);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (fornecedor) => {
    setSelectedFornecedor(fornecedor);
    setFormData({
      nome: fornecedor.nome || '',
      tipo: fornecedor.tipo || '',
      responsavel: fornecedor.responsavel || '',
      recebedor: fornecedor.recebedor || '',
      pix: fornecedor.pix || '',
      cachet: fornecedor.cachet !== undefined && fornecedor.cachet !== null ? fornecedor.cachet : '',
      telefone: fornecedor.telefone || '',
      email: fornecedor.email || '',
      documento: fornecedor.documento || '',
      notas_fiscais: fornecedor.notas_fiscais || '',
      enviado_financeiro: Boolean(fornecedor.enviado_financeiro),
      observacoes: fornecedor.observacoes || ''
    });
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (fornecedor) => {
    setSelectedFornecedor(fornecedor);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      showToast('O nome do fornecedor é obrigatório.', 'warning');
      return;
    }

    setSubmitting(true);
    const payload = {
      ...formData,
      cachet: formData.cachet === '' ? 0 : Number(formData.cachet)
    };

    try {
      if (selectedFornecedor) {
        await updateFornecedor(selectedFornecedor.id || selectedFornecedor._id, payload);
        showToast('Fornecedor atualizado com sucesso!', 'success');
      } else {
        await createFornecedor(payload);
        showToast('Fornecedor cadastrado com sucesso!', 'success');
      }
      setIsFormModalOpen(false);
      fetchFornecedores();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      showToast('Erro ao salvar fornecedor. Tente novamente.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFornecedor) return;
    setSubmitting(true);
    try {
      await deleteFornecedor(selectedFornecedor.id || selectedFornecedor._id);
      showToast('Fornecedor excluído com sucesso!', 'success');
      setIsDeleteModalOpen(false);
      fetchFornecedores();
    } catch (error) {
      console.error('Erro ao deletar fornecedor:', error);
      showToast('Erro ao excluir fornecedor.', 'error');
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

  return (
    <div className="space-y-6 animate-fade-in">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'success' })} 
      />

      {/* Top Bar: Title / Search / New Supplier Button */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, responsável ou tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Fornecedor</span>
        </button>
      </div>

      {/* Fornecedores Table Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
            <p className="font-medium text-sm">Carregando fornecedores...</p>
          </div>
        ) : fornecedores.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold text-base">Nenhum fornecedor encontrado</p>
            <p className="text-slate-400 text-xs mt-1">
              {search ? 'Tente mudar os termos da busca.' : 'Clique em "Novo Fornecedor" para cadastrar.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Nome / Empresa</th>
                  <th scope="col" className="px-6 py-3.5">Tipo</th>
                  <th scope="col" className="px-6 py-3.5">Cachet Padrao</th>
                  <th scope="col" className="px-6 py-3.5">Contato</th>
                  <th scope="col" className="px-6 py-3.5">Envio Fin.</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fornecedores.map((item) => (
                  <tr key={item.id || item._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{item.nome}</div>
                      {item.responsavel && (
                        <span className="text-xs text-slate-500 block mt-0.5">
                          Resp: {item.responsavel}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                        {item.tipo || 'Geral'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                      {formatCurrency(item.cachet)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs">
                        {item.telefone && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{item.telefone}</span>
                          </div>
                        )}
                        {item.email && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate max-w-[180px]">{item.email}</span>
                          </div>
                        )}
                        {!item.telefone && !item.email && (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.enviado_financeiro ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Enviado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="h-3.5 w-3.5 text-slate-400" /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
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
        title={selectedFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nome do Fornecedor / Razão Social *
              </label>
              <input
                type="text"
                name="nome"
                required
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Ex: Banda Show Acústico"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tipo
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              >
                <option value="">Selecione o tipo...</option>
                <option value="Banda">Banda</option>
                <option value="DJ">DJ</option>
                <option value="Musico Solo">Músico Solo</option>
                <option value="Som e Iluminacao">Som e Iluminação</option>
                <option value="Infraestrutura">Infraestrutura</option>
                <option value="Teatral">Teatral / Recreação</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            {/* Responsavel */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Responsável
              </label>
              <input
                type="text"
                name="responsavel"
                value={formData.responsavel}
                onChange={handleInputChange}
                placeholder="Ex: João da Silva"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Cachet */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Cachet Padrão (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="cachet"
                value={formData.cachet}
                onChange={handleInputChange}
                placeholder="0.00"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Documento */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Documento (CPF/CNPJ)
              </label>
              <input
                type="text"
                name="documento"
                value={formData.documento}
                onChange={handleInputChange}
                placeholder="000.000.000-00"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                placeholder="(18) 99999-9999"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                E-mail
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="contato@fornecedor.com"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Recebedor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nome do Recebedor
              </label>
              <input
                type="text"
                name="recebedor"
                value={formData.recebedor}
                onChange={handleInputChange}
                placeholder="Nome da conta bancária"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Chave Pix */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Chave PIX
              </label>
              <input
                type="text"
                name="pix"
                value={formData.pix}
                onChange={handleInputChange}
                placeholder="CPF, CNPJ, E-mail ou Aleatória"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Notas Fiscais */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Informações de Notas Fiscais
              </label>
              <input
                type="text"
                name="notas_fiscais"
                value={formData.notas_fiscais}
                onChange={handleInputChange}
                placeholder="Observações sobre emissão de NF"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Enviado Financeiro Checkbox */}
            <div className="md:col-span-2 flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="enviado_financeiro"
                name="enviado_financeiro"
                checked={formData.enviado_financeiro}
                onChange={handleInputChange}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="enviado_financeiro" className="text-sm font-medium text-slate-700 cursor-pointer">
                Enviado ao departamento financeiro
              </label>
            </div>

            {/* Observacoes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Observações
              </label>
              <textarea
                name="observacoes"
                rows="3"
                value={formData.observacoes}
                onChange={handleInputChange}
                placeholder="Detalhes adicionais..."
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
              {submitting ? 'Salvando...' : 'Salvar Fornecedor'}
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
              Esta ação removerá permanentemente o fornecedor e não poderá ser desfeita.
            </p>
          </div>
          <p className="text-sm text-slate-600">
            Deseja realmente excluir o fornecedor <strong className="text-slate-900">{selectedFornecedor?.nome}</strong>?
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
              {submitting ? 'Excluindo...' : 'Excluir Fornecedor'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
