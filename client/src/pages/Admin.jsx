import React, { useState, useEffect } from 'react';
import { getEventos, getFornecedores, getUsers, inviteUser, updateUser, deleteUser } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Settings, Database, Cloud, CheckCircle2, Users, Plus, Trash2, Pencil, UserCircle, Mail, Shield, Lock, Eye, EyeOff } from 'lucide-react';

export default function Admin() {
  const { user: currentUser, isAdmin } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [inviteResult, setInviteResult] = useState(null);

  // Invite form
  const [form, setForm] = useState({
    name: '', email: '', role: 'viewer',
    permissions: { viewFornecedores: true, viewFinanceiro: false, viewRelatorios: false, viewSincronizacao: false }
  });

  // Edit form
  const [editForm, setEditForm] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    Promise.all([getEventos(), getFornecedores(), getUsers()])
      .then(([e, f, u]) => { setEventos(e); setFornecedores(f); setUsers(u.users); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const refreshUsers = () => getUsers().then(u => setUsers(u.users));

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const result = await inviteUser(form);
      setInviteResult(result);
      showToast('Usuário convidado com sucesso!');
      refreshUsers();
      setModalOpen(false);
      setForm({ name: '', email: '', role: 'viewer', permissions: { viewFornecedores: true, viewFinanceiro: false, viewRelatorios: false, viewSincronizacao: false } });
    } catch (err) { showToast(err.response?.data?.error || 'Erro', 'error'); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser(editUser.id, editForm);
      showToast('Usuário atualizado!');
      setEditUser(null); setEditForm(null);
      refreshUsers();
    } catch (err) { showToast(err.response?.data?.error || 'Erro', 'error'); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
    try { await deleteUser(id); showToast('Usuário removido'); refreshUsers(); }
    catch (err) { showToast(err.response?.data?.error || 'Erro', 'error'); }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({
      name: u.name,
      role: u.role,
      active: u.active,
      password: '',
      permissions: u.permissions || { viewFornecedores: true, viewFinanceiro: false, viewRelatorios: false, viewSincronizacao: false }
    });
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando...</div>;

  const permLabels = {
    viewFornecedores: 'Ver Fornecedores',
    viewFinanceiro: 'Ver Dados Financeiros',
    viewRelatorios: 'Ver Relatórios',
    viewSincronizacao: 'Ver Sincronização',
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>{toast.msg}</div>
      )}

      {/* Invite Result */}
      {inviteResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-emerald-800 flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Usuário convidado!</p>
            <p className="text-sm text-emerald-700 mt-1">Compartilhe os dados de acesso:</p>
            <div className="mt-2 bg-white rounded-lg p-3 border border-emerald-100">
              <p className="text-sm text-slate-700">📧 <strong>Login:</strong> {inviteResult.user.email}</p>
              <p className="text-sm text-slate-700">🔑 <strong>Senha:</strong> {inviteResult.defaultPassword}</p>
              <p className="text-sm text-slate-700">👤 <strong>Acesso:</strong> {inviteResult.user.role === 'admin' ? 'Administrador' : 'Visualizador'}</p>
            </div>
          </div>
          <button onClick={() => setInviteResult(null)} className="text-emerald-400 hover:text-emerald-600"><Trash2 className="h-4 w-4" /></button>
        </div>
      )}

      {/* User Management */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users className="h-5 w-5 text-emerald-600" /> Usuários do Sistema</h3>
          <button onClick={() => { setModalOpen(true); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
            <Mail className="h-4 w-4" /> <span className="hidden sm:inline">Convidar</span>
          </button>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {users.map(u => (
            <div key={u.id} className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {u.role === 'admin' ? 'Admin' : 'Visualizador'}
                </span>
              </div>
              {u.role !== 'admin' && u.permissions && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {u.permissions.viewFinanceiro && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">Financeiro</span>}
                  {u.permissions.viewRelatorios && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">Relatórios</span>}
                  {u.permissions.viewFornecedores && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-500">Fornecedores</span>}
                  {u.permissions.viewSincronizacao && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">Sincronização</span>}
                </div>
              )}
              {u.id !== currentUser.id && (
                <div className="flex gap-1 pt-2 border-t border-slate-100">
                  <button onClick={() => openEdit(u)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs"><Pencil className="h-3 w-3" /> Editar</button>
                  <button onClick={() => handleDeleteUser(u.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs ml-auto"><Trash2 className="h-3 w-3" /> Excluir</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500 uppercase">
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Acesso</th>
                <th className="px-3 py-2">Permissões</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-3 font-medium text-slate-800">{u.name} {u.id === currentUser.id && <span className="text-xs text-emerald-600">(você)</span>}</td>
                  <td className="px-3 py-3 text-slate-600">{u.email}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {u.role === 'admin' ? 'Administrador' : 'Visualizador'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {u.role === 'admin' ? (
                      <span className="text-xs text-emerald-600">Acesso total</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.permissions?.viewFinanceiro && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">💰 Financeiro</span>}
                        {u.permissions?.viewRelatorios && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">📊 Relatórios</span>}
                        {u.permissions?.viewFornecedores && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200">👥 Fornecedores</span>}
                        {u.permissions?.viewSincronizacao && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-200">🔄 Sync</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs ${u.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className={`h-2 w-2 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                      {u.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {u.id !== currentUser.id && (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Database className="h-5 w-5 text-emerald-600" /> Banco de Dados</h3>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">MongoDB operacional</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Fornecedores</p><p className="text-xl font-bold text-slate-800">{fornecedores.length}</p></div>
            <div className="p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Eventos</p><p className="text-xl font-bold text-slate-800">{eventos.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Cloud className="h-5 w-5 text-emerald-600" /> Sistema</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-slate-50 rounded-lg"><span className="text-slate-500">Versão</span><span className="font-medium text-slate-700">1.3.0</span></div>
            <div className="flex justify-between p-2 bg-slate-50 rounded-lg"><span className="text-slate-500">URL</span><span className="font-medium text-slate-700">musical.controladoria.tech</span></div>
            <div className="flex justify-between p-2 bg-slate-50 rounded-lg"><span className="text-slate-500">SSL</span><span className="text-emerald-600 font-medium">Let's Encrypt</span></div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Convidar Usuário">
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600">Nome *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none" placeholder="Nome do convidado" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none" placeholder="email@terraparque.com.br" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Tipo de Acesso</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setForm({...form, role: 'viewer'})} className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${form.role === 'viewer' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                <Eye className="h-4 w-4 inline mr-1" /> Visualizador
              </button>
              <button type="button" onClick={() => setForm({...form, role: 'admin'})} className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${form.role === 'admin' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                <Shield className="h-4 w-4 inline mr-1" /> Admin
              </button>
            </div>
          </div>

          {form.role === 'viewer' && (
            <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1"><Lock className="h-3 w-3" /> Permissões do Visualizador</p>
              <p className="text-[11px] text-slate-400">Por padrão, vê apenas programação e calendário. Marque para liberar acesso adicional:</p>
              {Object.entries(permLabels).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.permissions[key] || false} onChange={(e) => setForm({...form, permissions: {...form.permissions, [key]: e.target.checked}})} className="rounded text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-sm text-slate-600">{label}</span>
                </label>
              ))}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700">📧 A senha padrão será <strong className="font-mono">123mudar</strong>. O convidado poderá alterá-la após o login.</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">Convidar</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editForm && (
        <Modal isOpen={!!editUser} onClose={() => { setEditUser(null); setEditForm(null); }} title="Editar Usuário">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">Nome</label>
              <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} required className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Tipo de Acesso</label>
              <select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm">
                <option value="viewer">Visualizador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Nova Senha (deixe vazio para manter)</label>
              <input type="password" value={editForm.password} onChange={(e) => setEditForm({...editForm, password: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none" placeholder="••••••" />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editForm.active} onChange={(e) => setEditForm({...editForm, active: e.target.checked})} className="rounded text-emerald-600" />
                <span className="text-sm text-slate-600">Usuário ativo</span>
              </label>
            </div>

            {editForm.role === 'viewer' && (
              <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-semibold text-slate-600 flex items-center gap-1"><Lock className="h-3 w-3" /> Permissões</p>
                {Object.entries(permLabels).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editForm.permissions[key] || false} onChange={(e) => setEditForm({...editForm, permissions: {...editForm.permissions, [key]: e.target.checked}})} className="rounded text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm text-slate-600">{label}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => { setEditUser(null); setEditForm(null); }} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">Salvar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
