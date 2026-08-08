import React, { useState, useEffect, useRef } from 'react';
import { getFornecedores, createFornecedor, updateFornecedor, deleteFornecedor, uploadNF, deleteNF, updatePagamento } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Search, Plus, Pencil, Trash2, Users, Phone, Mail, DollarSign, FileText, Upload, Download, Eye, X, CheckCircle2, Clock, AlertCircle, Paperclip } from 'lucide-react';

const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const pagamentoConfig = {
  nao_enviado: { label: 'Não enviado', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  enviado: { label: 'Enviado', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  pago: { label: 'Pago', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
};

function PagamentoBadge({ status }) {
  const cfg = pagamentoConfig[status] || pagamentoConfig.nao_enviado;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`}></span>
      {cfg.label}
    </span>
  );
}

const emptyForm = { nome: '', tipo: '', responsavel: '', recebedor: '', pix: '', cachet: 0, telefone: '', email: '', documento: '', notas_fiscais: '', enviado_financeiro: false, status_pagamento: 'nao_enviado', observacoes: '' };

export default function Fornecedores() {
  const { isAdmin } = useAuth();
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetchFornecedores();
  }, []);

  const fetchFornecedores = async () => {
    setLoading(true);
    try {
      const data = await getFornecedores(search ? { search } : {});
      setFornecedores(data);
    } catch (err) { showToast('Erro ao carregar fornecedores', 'error'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateFornecedor(editingId, form);
        showToast('Fornecedor atualizado!');
      } else {
        await createFornecedor(form);
        showToast('Fornecedor criado!');
      }
      setModalOpen(false); setEditingId(null); setForm(emptyForm);
      fetchFornecedores();
    } catch (err) { showToast(err.response?.data?.error || 'Erro ao salvar', 'error'); }
  };

  const handleEdit = (f) => { setEditingId(f._id); setForm({ ...emptyForm, ...f }); setModalOpen(true); };

  const handleDelete = async () => {
    try {
      await deleteFornecedor(deleteTarget._id);
      showToast('Fornecedor removido');
      setDeleteTarget(null);
      fetchFornecedores();
    } catch (err) { showToast('Erro ao remover', 'error'); }
  };

  const handleFileUpload = async (id, file) => {
    setUploadingId(id);
    try {
      await uploadNF(id, file);
      showToast('Nota fiscal anexada!');
      fetchFornecedores();
    } catch (err) { showToast(err.response?.data?.error || 'Erro ao enviar NF', 'error'); }
    setUploadingId(null);
  };

  const handleNFAction = (f, action) => {
    if (action === 'view' || action === 'download') {
      window.open(`/api/fornecedores/${f._id}/nf`, '_blank');
    } else if (action === 'remove') {
      deleteNF(f._id).then(() => { showToast('NF removida'); fetchFornecedores(); }).catch(() => showToast('Erro', 'error'));
    }
  };

  const handlePagamentoChange = async (id, status) => {
    try {
      await updatePagamento(id, { status_pagamento: status });
      showToast('Status de pagamento atualizado!');
      fetchFornecedores();
    } catch { showToast('Erro ao atualizar', 'error'); }
  };

  return (
    <div className="space-y-4">
      {/* Search + Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchFornecedores()} placeholder="Buscar fornecedor..." className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none" />
        </div>
        {isAdmin && (
          <button onClick={() => { setForm(emptyForm); setEditingId(null); setModalOpen(true); }} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Novo</span>
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>{toast.msg}</div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-8 text-slate-400">Carregando fornecedores...</div>
      ) : fornecedores.length === 0 ? (
        <div className="text-center py-8 text-slate-400">Nenhum fornecedor encontrado.</div>
      ) : (
        /* Mobile cards */
        <div className="md:hidden space-y-3">
          {fornecedores.map((f) => (
            <div key={f._id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{f.nome}</h3>
                  {f.tipo && <span className="text-xs text-slate-500">{f.tipo}</span>}
                </div>
                <PagamentoBadge status={f.status_pagamento} />
              </div>
              <div className="space-y-1 text-xs text-slate-500">
                {f.responsavel && <p>Resp: {f.responsavel}</p>}
                {f.cachet > 0 && <p className="font-semibold text-slate-700">Cachet: {formatCurrency(f.cachet)}</p>}
                {f.telefone && <p>📞 {f.telefone}</p>}
              </div>
              {/* NF actions */}
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                {f.nf_arquivo_nome ? (
                  <>
                    <button onClick={() => handleNFAction(f, 'view')} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium"><Eye className="h-3 w-3" /> Ver NF</button>
                    {isAdmin && <button onClick={() => handleNFAction(f, 'remove')} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-medium"><X className="h-3 w-3" /> Remover</button>}
                  </>
                ) : (
                  isAdmin && (
                    <label className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 text-slate-500 text-xs font-medium cursor-pointer hover:bg-slate-100">
                      <Upload className="h-3 w-3" /> Anexar NF
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => e.target.files[0] && handleFileUpload(f._id, e.target.files[0])} disabled={uploadingId === f._id} />
                    </label>
                  )
                )}
                {isAdmin && (
                  <>
                    <select value={f.status_pagamento || 'nao_enviado'} onChange={(e) => handlePagamentoChange(f._id, e.target.value)} className="ml-auto px-2 py-1 rounded-lg border border-slate-200 text-xs">
                      <option value="nao_enviado">Não enviado</option>
                      <option value="enviado">Enviado</option>
                      <option value="pago">Pago</option>
                    </select>
                    <button onClick={() => handleEdit(f)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteTarget(f)} className="p-1.5 rounded-lg bg-rose-50 text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop table */}
      {!loading && fornecedores.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <th className="px-4 py-3">Nome / Tipo</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Cachet</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3">Nota Fiscal</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {fornecedores.map((f) => (
                <tr key={f._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{f.nome}</p>
                    {f.tipo && <span className="text-xs text-slate-400">{f.tipo}</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{f.responsavel || '-'}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{formatCurrency(f.cachet)}</td>
                  <td className="px-4 py-3">
                    {f.telefone && <div className="flex items-center gap-1 text-xs text-slate-500"><Phone className="h-3 w-3" />{f.telefone}</div>}
                    {f.email && <div className="flex items-center gap-1 text-xs text-slate-500"><Mail className="h-3 w-3" />{f.email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <select value={f.status_pagamento || 'nao_enviado'} onChange={(e) => handlePagamentoChange(f._id, e.target.value)} className="px-2 py-1 rounded-lg border border-slate-200 text-xs">
                        <option value="nao_enviado">Não enviado</option>
                        <option value="enviado">Enviado</option>
                        <option value="pago">Pago</option>
                      </select>
                    ) : (
                      <PagamentoBadge status={f.status_pagamento} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {f.nf_arquivo_nome ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleNFAction(f, 'view')} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors">
                          <Eye className="h-3 w-3" /> {f.nf_arquivo_nome.length > 20 ? f.nf_arquivo_nome.substring(0, 17) + '...' : f.nf_arquivo_nome}
                        </button>
                        {isAdmin && <button onClick={() => handleNFAction(f, 'remove')} className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"><X className="h-3 w-3" /></button>}
                      </div>
                    ) : (
                      isAdmin && (
                        <label className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 text-slate-400 text-xs cursor-pointer hover:bg-slate-100 border border-dashed border-slate-300">
                          <Upload className="h-3 w-3" /> Anexar
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => e.target.files[0] && handleFileUpload(f._id, e.target.files[0])} disabled={uploadingId === f._id} />
                        </label>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin && (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(f)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteTarget(f)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Hidden file input for NF upload */}
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" />

      {/* Edit/Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }} title={editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Nome *</label>
              <input type="text" value={form.nome} onChange={(e) => setForm({...form, nome: e.target.value})} required className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Tipo</label>
              <input type="text" value={form.tipo} onChange={(e) => setForm({...form, tipo: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Responsável</label>
              <input type="text" value={form.responsavel} onChange={(e) => setForm({...form, responsavel: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Recebedor</label>
              <input type="text" value={form.recebedor} onChange={(e) => setForm({...form, recebedor: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">PIX</label>
              <input type="text" value={form.pix} onChange={(e) => setForm({...form, pix: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Cachet (R$)</label>
              <input type="number" step="0.01" value={form.cachet} onChange={(e) => setForm({...form, cachet: parseFloat(e.target.value) || 0})} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Telefone</label>
              <input type="text" value={form.telefone} onChange={(e) => setForm({...form, telefone: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Documento (CPF/CNPJ)</label>
              <input type="text" value={form.documento} onChange={(e) => setForm({...form, documento: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Status de Pagamento</label>
              <select value={form.status_pagamento} onChange={(e) => setForm({...form, status_pagamento: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm">
                <option value="nao_enviado">Não enviado</option>
                <option value="enviado">Enviado</option>
                <option value="pago">Pago</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Observações</label>
            <textarea value={form.observacoes} onChange={(e) => setForm({...form, observacoes: e.target.value})} rows={2} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => { setModalOpen(false); setEditingId(null); }} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">{editingId ? 'Salvar' : 'Criar'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmar exclusão">
        <p className="text-sm text-slate-600 mb-4">Tem certeza que deseja remover <strong>{deleteTarget?.nome}</strong>? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-2">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600">Excluir</button>
        </div>
      </Modal>
    </div>
  );
}
