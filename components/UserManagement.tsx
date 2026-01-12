
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { UserProfile, UserRole } from '../types';
import { getAllProfiles, updateUserProfile, createUser, deleteUser, getCurrentUserProfile } from '../services/userService';
import { fetchDepartments, DynamicSetting } from '../services/settingsService';
import { Save, Loader2, Plus, X, Trash2, Settings, Search, User, AlertCircle, RefreshCw, Filter, Users, Building, Shield } from 'lucide-react';
import { ToastContainer } from './ToastContainer';

const normalizeText = (text: string) => {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

interface ToastMessage { id: number; message: string; type: 'success' | 'error'; }

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [dynamicDepts, setDynamicDepts] = useState<DynamicSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');

  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'user' as UserRole, department: '' });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdCounter = useRef(0);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = toastIdCounter.current++;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [uData, profile, deptsData] = await Promise.all([
        getAllProfiles(),
        getCurrentUserProfile(),
        fetchDepartments().catch(() => [])
      ]);
      setUsers(uData);
      setCurrentUserProfile(profile);
      setDynamicDepts(deptsData);

      if (deptsData.length > 0 && !newUserForm.department) {
        setNewUserForm(prev => ({ ...prev, department: deptsData[0].name }));
      }
    } catch (error) {
      addToast("Falha ao carregar dados.", 'error');
    } finally { setIsLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  // Estatísticas de usuários por secretaria
  const statsByDept = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(u => {
      const dept = u.department || 'NÃO DEFINIDO';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [users]);

  const filteredUsers = useMemo(() => {
    const term = normalizeText(searchTerm);
    return users.filter(u => {
      const matchesSearch = !term ||
        normalizeText(u.email).includes(term) ||
        normalizeText(u.department).includes(term) ||
        (u.name && normalizeText(u.name).includes(term));

      const matchesDept = filterDept === 'all' || u.department === filterDept;
      const matchesRole = filterRole === 'all' || u.role === filterRole;

      return matchesSearch && matchesDept && matchesRole;
    });
  }, [users, searchTerm, filterDept, filterRole]);

  const handleEdit = (user: UserProfile) => {
    setEditingId(user.id);
    setEditForm({ role: user.role, department: user.department, name: user.name, permissions: user.permissions });
  };

  const handleSave = async (id: string) => {
    try {
      await updateUserProfile(id, editForm);
      setEditingId(null);
      addToast("Usuário atualizado!", 'success');
      loadData();
    } catch (error) { addToast("Erro ao atualizar.", 'error'); }
  };

  const handleDelete = async (id: string, email: string) => {
    if (currentUserProfile?.id === id) { addToast("Você não pode se excluir.", 'error'); return; }
    if (window.confirm(`Excluir permanentemente ${email}?`)) {
      try {
        await deleteUser(id);
        addToast("Usuário excluído.", 'success');
        loadData();
      } catch (error) { addToast("Erro ao excluir.", 'error'); }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError(null);
    try {
      await createUser(newUserForm);
      addToast("Usuário criado!", 'success');
      setIsCreateModalOpen(false);
      setNewUserForm({ name: '', email: '', password: '', role: 'user', department: dynamicDepts[0]?.name || '' });
      loadData();
    } catch (error: any) { setCreateError(error.message || "Erro na criação"); } finally { setIsCreating(false); }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterDept('all');
    setFilterRole('all');
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(t => t.filter(x => x.id !== id))} />
      <div className="space-y-6 animate-fade-in pb-10">

        {/* Resumo por Secretaria */}


        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Usuários do Sistema</h2>
              <p className="text-sm text-slate-500">Gerencie permissões e acesso por secretaria.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={loadData} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} /></button>
              <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm shadow-sm hover:bg-blue-700 transition-colors"><Plus size={16} /> Novo Usuário</button>
            </div>
          </div>

          {/* Barra de Filtros */}
          <div className="flex flex-col md:flex-row gap-3 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Building size={16} className="text-slate-400" />
                <select
                  value={filterDept}
                  onChange={e => setFilterDept(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
                >
                  <option value="all">Todas Secretarias</option>
                  {dynamicDepts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-slate-400" />
                <select
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
                >
                  <option value="all">Todas Funções</option>
                  <option value="user">Usuário</option>
                  <option value="pgm">PGM</option>
                  <option value="admin">Gestor</option>
                  <option value="super_admin">Gestor Supremo</option>
                </select>
              </div>
              {(searchTerm || filterDept !== 'all' || filterRole !== 'all') && (
                <button onClick={handleClearFilters} className="text-xs text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg font-bold uppercase transition-colors">Limpar</button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Nome / E-mail</th>
                  <th className="px-4 py-3">Secretaria</th>
                  <th className="px-4 py-3">Função</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && users.length === 0 ? (
                  <tr><td colSpan={4} className="py-10 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto" /></td></tr>
                ) : filteredUsers.length > 0 ? filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        {editingId === user.id ? (
                          <input type="text" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="px-2 py-1 border rounded text-sm mb-1" placeholder="Nome completo" />
                        ) : (
                          <span className="font-bold text-slate-900">{user.name || 'SEM NOME'}</span>
                        )}
                        <span className="text-xs text-slate-500 font-medium">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {editingId === user.id ? (
                        <select value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} className="w-full px-2 py-1 border rounded text-sm">
                          {dynamicDepts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-medium"><Building size={14} className="text-slate-400" /> {user.department}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === user.id ? (
                        <div className="flex flex-col gap-3 min-w-[300px]">
                          <select
                            value={editForm.role}
                            onChange={e => setEditForm({ ...editForm, role: e.target.value as any })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="user">USUÁRIO</option>
                            <option value="super_admin">SUPER ADMIN</option>
                          </select>

                          {editForm.role === 'user' && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wide">Permissões de Acesso</p>
                              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {[
                                  { key: 'daily_allowance', label: 'Diárias' },
                                  { key: 'purchase_request', label: 'Empenhos/Compras' },
                                  { key: 'contracts', label: 'Contratos' },
                                  { key: 'biddings', label: 'Licitações' },
                                  { key: 'minutes', label: 'Atas' },
                                  { key: 'utility_bills', label: 'Água/Luz' },
                                  { key: 'supplementation', label: 'Suplementação' },
                                  { key: 'fiscalization', label: 'Fiscalização' },
                                  { key: 'pgm_dispatch', label: 'Despachos PGM' },
                                  { key: 'users', label: 'Gestão de Usuários' }
                                ].map((module) => (
                                  <div key={module.key} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-100">
                                    <span className="font-medium text-slate-700">{module.label}</span>
                                    <div className="flex gap-3">
                                      <label className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
                                        <input
                                          type="checkbox"
                                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                          checked={editForm.permissions?.[module.key as keyof typeof editForm.permissions]?.view || false}
                                          onChange={e => setEditForm(prev => ({
                                            ...prev,
                                            permissions: {
                                              ...prev.permissions,
                                              [module.key]: {
                                                view: e.target.checked,
                                                manage: e.target.checked ? (prev.permissions?.[module.key as keyof typeof editForm.permissions]?.manage || false) : false // Auto-disable manage if view is off
                                              }
                                            }
                                          }))}
                                        />
                                        Ver
                                      </label>
                                      <label className="flex items-center gap-1 cursor-pointer hover:text-green-600 transition-colors">
                                        <input
                                          type="checkbox"
                                          className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                                          checked={editForm.permissions?.[module.key as keyof typeof editForm.permissions]?.manage || false}
                                          onChange={e => setEditForm(prev => ({
                                            ...prev,
                                            permissions: {
                                              ...prev.permissions,
                                              [module.key]: {
                                                view: true, // Auto-enable view if manage is on
                                                manage: e.target.checked
                                              }
                                            }
                                          }))}
                                        />
                                        Gerir
                                      </label>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase w-fit ${user.role === 'super_admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                            {user.role === 'super_admin' ? 'SUPER ADMIN' : 'USUÁRIO'}
                          </span>

                          {/* Permission Summary Chips */}
                          {user.role !== 'super_admin' && user.permissions && (
                            <div className="flex flex-wrap gap-1 mt-1 max-w-[250px]">
                              {[
                                { key: 'daily_allowance', label: 'Diárias', color: 'bg-green-50 text-green-700 border-green-100' },
                                { key: 'purchase_request', label: 'Empenhos', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                                { key: 'contracts', label: 'Contratos', color: 'bg-purple-50 text-purple-700 border-purple-100' },
                                { key: 'biddings', label: 'Licitações', color: 'bg-amber-50 text-amber-700 border-amber-100' },
                                { key: 'pgm_dispatch', label: 'PGM', color: 'bg-rose-50 text-rose-700 border-rose-100' }
                              ].map(m => {
                                const perm = user.permissions?.[m.key as keyof typeof user.permissions];
                                if (perm?.manage) return <span key={m.key} className={`text-[9px] border px-1 rounded uppercase font-bold ${m.color}`} title={`Gerencia ${m.label}`}>{m.label}</span>;
                                return null;
                              })}
                              {Object.values(user.permissions || {}).every(p => !p?.manage) && <span className="text-[9px] text-slate-400 uppercase italic">Apenas Visualização</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingId === user.id ? (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleSave(user.id)} className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Salvar"><Save size={16} /></button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors" title="Cancelar"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleEdit(user)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Settings size={16} /></button>
                          <button onClick={() => handleDelete(user.id, user.email)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="py-12 text-center text-slate-400 font-medium italic">Nenhum usuário encontrado com os filtros aplicados.</td></tr>
                )
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Criar Usuário (Igual ao anterior, apenas garantindo consistência) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden border border-slate-200">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tighter"><User size={18} className="text-blue-600" /> Novo Usuário do Sistema</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-red-500"><X /></button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {createError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-100 flex gap-2 font-medium"><AlertCircle size={14} /> {createError}</div>}
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Nome Completo</label><input type="text" value={newUserForm.name} onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })} className="w-full border border-slate-200 p-2 rounded-md mt-1 focus:ring-2 focus:ring-blue-500 outline-none uppercase" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">E-mail Corporativo *</label><input type="email" required value={newUserForm.email} onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} className="w-full border border-slate-200 p-2 rounded-md mt-1 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="exemplo@prefeitura.com" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase">Senha Temporária *</label><input type="password" required minLength={6} value={newUserForm.password} onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} className="w-full border border-slate-200 p-2 rounded-md mt-1 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Secretaria Designada *</label>
                <select value={newUserForm.department} onChange={e => setNewUserForm({ ...newUserForm, department: e.target.value })} className="w-full border border-slate-200 p-2 rounded-md mt-1 bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                  {dynamicDepts.length > 0 ?
                    dynamicDepts.map(d => <option key={d.id} value={d.name}>{d.name}</option>) :
                    <option value="">Carregando...</option>
                  }
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Perfil de Acesso *</label>
                <select value={newUserForm.role} onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as any })} className="w-full border border-slate-200 p-2 rounded-md mt-1 bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold">
                  <option value="user">USUÁRIO</option>
                  <option value="super_admin">SUPER ADMIN</option>
                </select>

                {newUserForm.role === 'user' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wide">Permissões de Acesso</p>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {[
                        { key: 'daily_allowance', label: 'Diárias' },
                        { key: 'purchase_request', label: 'Empenhos/Compras' },
                        { key: 'contracts', label: 'Contratos' },
                        { key: 'biddings', label: 'Licitações' },
                        { key: 'minutes', label: 'Atas' },
                        { key: 'utility_bills', label: 'Água/Luz' },
                        { key: 'supplementation', label: 'Suplementação' },
                        { key: 'fiscalization', label: 'Fiscalização' },
                        { key: 'pgm_dispatch', label: 'Despachos PGM' },
                        { key: 'users', label: 'Gestão de Usuários' }
                      ].map((module) => (
                        <div key={module.key} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-100">
                          <span className="font-medium text-slate-700">{module.label}</span>
                          <div className="flex gap-3">
                            <label className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
                              <input
                                type="checkbox"
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                checked={(newUserForm as any).permissions?.[module.key]?.view || false}
                                onChange={e => setNewUserForm(prev => ({
                                  ...prev,
                                  permissions: {
                                    ...(prev as any).permissions,
                                    [module.key]: {
                                      view: e.target.checked,
                                      manage: e.target.checked ? ((prev as any).permissions?.[module.key]?.manage || false) : false
                                    }
                                  }
                                }))}
                              />
                              Ver
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer hover:text-green-600 transition-colors">
                              <input
                                type="checkbox"
                                className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                                checked={(newUserForm as any).permissions?.[module.key]?.manage || false}
                                onChange={e => setNewUserForm(prev => ({
                                  ...prev,
                                  permissions: {
                                    ...(prev as any).permissions,
                                    [module.key]: {
                                      view: true,
                                      manage: e.target.checked
                                    }
                                  }
                                }))}
                              />
                              Gerir
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button type="submit" disabled={isCreating || dynamicDepts.length === 0} className="w-full bg-blue-600 text-white py-3 rounded-lg flex justify-center items-center gap-2 font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 disabled:opacity-50 mt-4 uppercase text-xs">
                {isCreating ? <Loader2 className="animate-spin" /> : "Finalizar Cadastro de Usuário"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
