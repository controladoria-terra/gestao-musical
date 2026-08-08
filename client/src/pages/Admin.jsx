import React, { useState, useEffect } from 'react';
import { getEventos, getFornecedores, getUsers, createUser, updateUser, deleteUser } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Settings, Server, Database, GitBranch, Cloud, Info, Shield, CheckCircle2, Users, Plus, Trash2, Pencil, UserCircle, Lock } from 'lucide-react';

export default function Admin() {
  const { user: currentUser } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    Promise.all([getEventos(), getFornecedores(), getUsers()])
      .then(([e, f, u]) => { setEventos(e); setFornecedores(f); setUsers(u.users); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        const data = { name: form.name, role: form.role };
        if (form.password) data.password = form.password;
        await updateUser(editUser.id, data);
        showToast('Usuário atualizado!');
      } else {
        await createUser(form);
        showToast('Usuário criado!');
      }
      setModalOpen(false); setEditUser(null); setForm({ name: '', email: '', password: '', role: 'viewer' });
      getUsers().then(u => setUsers(u.users));
    } catch (err) { showToast(err.response?.data?.error || 'Erro', 'error'); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
    try {
      await deleteUser(id);
      showToast('Usuário removido');
      getUsers().then(u => setUsers(u.users));
    } catch (err) { showToast(err.response?.data?.error || 'Erro', 'error'); }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando...</div>;

  return (
    <div className="space-y-4 md:space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>{toast.msg}</div>
      )}

      {/* User Management */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users className="h-5 w-5 text-emerald-600" /> Usuários do Sistema</h3>
          <button onClick={() => { setEditUser(null); setForm({ name: '', email: '', password: '', role: 'viewer' }); setModalOpen(true); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Novo Usuário</span>
          </button>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {users.map(u => (
            <div key={u.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
                <span className={`mt-1 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {u.role === 'admin' ? 'Admin' : 'Visualizador'}
                </span>
              </div>
              {u.id !== currentUser.id && (
                <div className="flex gap-1">
                  <button onClick={() => { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setModalOpen(true); }} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 rounded-lg bg-rose-50 text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
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
                <th className="px-3 py-2">Papel</th>
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
                    <span className={`inline-flex items-center gap-1 text-xs ${u.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className={`h-2 w-2 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                      {u.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {u.id !== currentUser.id && (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setModalOpen(true); }} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"><Pencil className="h-4 w-4" /></button>
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
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2"><Settings className="h-5 w-5 text-emerald-600" /> Sistema</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Aplicação', value: 'Gestão Musical Terra Parque' },
            { label: 'Versão', value: '1.2.0' },
            { label: 'Stack', value: 'React + Express + MongoDB' },
            { label: 'URL', value: 'musical.controladoria.tech' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-500">{item.label}</span>
              <span className="text-sm font-medium text-slate-800">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Database + Integrations */}
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
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Cloud className="h-5 w-5 text-emerald-600" /> Integrações</h3>
          <div className="space-y-2 text-sm">
            {[
              { name: 'Google Sheets', status: 'Conectado' },
              { name: 'Google Calendar', status: 'Conectado' },
              { name: 'GitHub', status: 'controladoria-terra/gestao-musical' },
              { name: 'VPS Hostinger', status: '191.215.36.170' },
              { name: 'SSL/TLS', status: 'Let\'s Encrypt via Traefik' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">{item.name}</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span><span className="text-emerald-600 font-medium">{item.status}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditUser(null); }} title={editUser ? 'Editar Usuário' : 'Novo Usuário'}>
        <form onSubmit={handleUserSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">Nome *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required disabled={!!editUser} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none disabled:bg-slate-100" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">{editUser ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required={!editUser} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-500 outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Papel</label>
            <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm">
              <option value="viewer">Visualizador (apenas leitura)</option>
              <option value="admin">Administrador (acesso total)</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => { setModalOpen(false); setEditUser(null); }} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">{editUser ? 'Salvar' : 'Criar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
