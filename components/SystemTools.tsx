
import React, { useState, useRef, useEffect } from 'react';
import { Settings, Bell, Clock, Database, Mail, Copy, Activity, Zap, Terminal, AlertTriangle, CheckCircle, Loader2, FileCode, Code, X, Command, Download, ListTree, Plus, Trash2, Edit2, Save, Building, FileText, RefreshCw, ClipboardList } from 'lucide-react';
import { NotificationSettingsModal } from './NotificationSettingsModal';
import { SimulationModal } from './SimulationModal';
import { DbConfigModal } from './DbConfigModal';
import { ToastContainer } from './ToastContainer';
import { supabase, supabaseUrl } from '../services/supabaseClient';
import { AuditLogs } from './AuditLogs';
import { fetchDepartments, fetchDocumentTypes, fetchMinuteTypes, createDepartment, createDocumentType, createMinuteType, updateDepartment, updateDocumentType, updateMinuteType, deleteDepartment, deleteDocumentType, deleteMinuteType, DynamicSetting } from '../services/settingsService';

interface ToastMessage { id: number; message: string; type: 'success' | 'error'; }

export const SystemTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'logs' | 'functions' | 'params'>('general');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isCronModalOpen, setIsCronModalOpen] = useState(false);
  const [isDbConfigModalOpen, setIsDbConfigModalOpen] = useState(false);
  const [isTestingFunc, setIsTestingFunc] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdCounter = useRef(0);

  // Parâmetros State
  const [depts, setDepts] = useState<DynamicSetting[]>([]);
  const [docTypes, setDocTypes] = useState<DynamicSetting[]>([]);
  const [minTypes, setMinTypes] = useState<DynamicSetting[]>([]);
  const [isParamsLoading, setIsParamsLoading] = useState(false);
  const [editingParam, setEditingParam] = useState<{ id: string, name: string, type: 'dept' | 'dtype' | 'mtype' } | null>(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [newMinName, setNewMinName] = useState('');

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = toastIdCounter.current++;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const loadParams = async () => {
      setIsParamsLoading(true);
      try {
          const [d, dt, mt] = await Promise.all([
            fetchDepartments(), 
            fetchDocumentTypes(),
            fetchMinuteTypes()
          ]);
          setDepts(d.sort((a, b) => a.name.localeCompare(b.name)));
          setDocTypes(dt.sort((a, b) => a.name.localeCompare(b.name)));
          setMinTypes(mt.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (e: any) {
          addToast(e.message || "Erro ao carregar parâmetros dinâmicos.", 'error');
      } finally {
          setIsParamsLoading(false);
      }
  };

  useEffect(() => {
    if (activeTab === 'params') loadParams();
  }, [activeTab]);

  const handleAddParam = async (type: 'dept' | 'dtype' | 'mtype') => {
      const name = type === 'dept' ? newDeptName : type === 'dtype' ? newTypeName : newMinName;
      if (!name.trim()) return;
      
      try {
          if (type === 'dept') { await createDepartment(name.toUpperCase()); setNewDeptName(''); }
          else if (type === 'dtype') { await createDocumentType(name.toUpperCase()); setNewTypeName(''); }
          else { await createMinuteType(name.toUpperCase()); setNewMinName(''); }
          addToast("Adicionado com sucesso!", 'success');
          loadParams();
      } catch (e: any) { addToast(e.message || "Erro ao adicionar.", 'error'); }
  };

  const handleUpdateParam = async () => {
      if (!editingParam || !editingParam.name.trim()) return;
      try {
          const name = editingParam.name.toUpperCase();
          if (editingParam.type === 'dept') await updateDepartment(editingParam.id, name);
          else if (editingParam.type === 'dtype') await updateDocumentType(editingParam.id, name);
          else await updateMinuteType(editingParam.id, name);
          addToast("Atualizado com sucesso!", 'success');
          setEditingParam(null);
          loadParams();
      } catch (e: any) { addToast(e.message || "Erro ao atualizar.", 'error'); }
  };

  const handleDeleteParam = async (id: string, type: 'dept' | 'dtype' | 'mtype') => {
      if (!window.confirm("Deseja realmente excluir este item?")) return;
      try {
          if (type === 'dept') await deleteDepartment(id);
          else if (type === 'dtype') await deleteDocumentType(id);
          else await deleteMinuteType(id);
          addToast("Excluído com sucesso!", 'success');
          loadParams();
      } catch (e: any) { addToast("Erro ao excluir. O item pode estar em uso.", 'error'); }
  };

  const testFunction = async (name: string) => {
      setIsTestingFunc(name);
      setTestResult(null);
      try {
          const { data, error } = await supabase.functions.invoke(name, { body: { test: true } });
          if (error) setTestResult({ status: 'error', message: error.message, name });
          else setTestResult({ status: 'success', data, name });
      } catch (e: any) { setTestResult({ status: 'error', message: e.message, name }); }
      finally { setIsTestingFunc(null); }
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(t => t.filter(x => x.id !== id))} />
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200 overflow-x-auto custom-scrollbar">
                <button onClick={() => setActiveTab('general')} className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative whitespace-nowrap ${activeTab === 'general' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <Settings size={18} /> Geral
                    {activeTab === 'general' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                </button>
                <button onClick={() => setActiveTab('params')} className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative whitespace-nowrap ${activeTab === 'params' ? 'text-green-600 bg-green-50/50' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <ListTree size={18} /> Parâmetros
                    {activeTab === 'params' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />}
                </button>
                <button onClick={() => setActiveTab('functions')} className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative whitespace-nowrap ${activeTab === 'functions' ? 'text-orange-600 bg-orange-50/50' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <Zap size={18} /> Status Funções
                    {activeTab === 'functions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600" />}
                </button>
                <button onClick={() => setActiveTab('logs')} className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative whitespace-nowrap ${activeTab === 'logs' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <Activity size={18} /> Auditoria
                    {activeTab === 'logs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                </button>
            </div>
        </div>

        {activeTab === 'general' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <ToolCard title="Notificações" desc="Prazos de alerta e e-mails." icon={<Bell size={20}/>} color="blue" btnText="Ajustar" onClick={() => setIsSettingsOpen(true)} />
                 <ToolCard title="Banco de Dados" desc="Scripts SQL de manutenção." icon={<Database size={20}/>} color="green" btnText="Configurar" onClick={() => setIsDbConfigModalOpen(true)} />
                 <ToolCard title="Disparo Manual" desc="Forçar verificação agora." icon={<Mail size={20}/>} color="orange" btnText="Disparar" onClick={() => setIsSimulationOpen(true)} />
            </div>
        )}

        {activeTab === 'params' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
                <div className="mb-8 flex justify-between items-start">
                    <div><h2 className="text-xl font-bold text-slate-800">Parâmetros Dinâmicos</h2><p className="text-sm text-slate-500">Organize secretarias e tipos de objeto.</p></div>
                    <button onClick={loadParams} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><RefreshCw size={20} className={isParamsLoading ? 'animate-spin' : ''}/></button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <ParamColumn 
                        title="Secretarias" 
                        icon={<Building size={18} className="text-blue-500" />}
                        data={depts}
                        newValue={newDeptName}
                        setNewValue={setNewDeptName}
                        onAdd={() => handleAddParam('dept')}
                        onDelete={(id) => handleDeleteParam(id, 'dept')}
                        editingParam={editingParam}
                        setEditingParam={setEditingParam}
                        onSave={handleUpdateParam}
                        isLoading={isParamsLoading}
                        type="dept"
                    />

                    <ParamColumn 
                        title="Tipos de Contrato" 
                        icon={<FileText size={18} className="text-purple-500" />}
                        data={docTypes}
                        newValue={newTypeName}
                        setNewValue={setNewTypeName}
                        onAdd={() => handleAddParam('dtype')}
                        onDelete={(id) => handleDeleteParam(id, 'dtype')}
                        editingParam={editingParam}
                        setEditingParam={setEditingParam}
                        onSave={handleUpdateParam}
                        isLoading={isParamsLoading}
                        type="dtype"
                    />

                    <ParamColumn 
                        title="Tipos de Ata" 
                        icon={<ClipboardList size={18} className="text-orange-500" />}
                        data={minTypes}
                        newValue={newMinName}
                        setNewValue={setNewMinName}
                        onAdd={() => handleAddParam('mtype')}
                        onDelete={(id) => handleDeleteParam(id, 'mtype')}
                        editingParam={editingParam}
                        setEditingParam={setEditingParam}
                        onSave={handleUpdateParam}
                        isLoading={isParamsLoading}
                        type="mtype"
                    />
                </div>
            </div>
        )}

        {activeTab === 'functions' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <FunctionRow name="create-user" desc="Criação de usuários administrativos." onTest={() => testFunction('create-user')} isTesting={isTestingFunc === 'create-user'} />
                <FunctionRow name="check-contracts" desc="Alerta de vencimentos." onTest={() => testFunction('check-contracts')} isTesting={isTestingFunc === 'check-contracts'} />
            </div>
        )}

        {activeTab === 'logs' && <AuditLogs />}
      </div>

      <NotificationSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <SimulationModal isOpen={isSimulationOpen} onClose={() => setIsSimulationOpen(false)} />
      <DbConfigModal isOpen={isDbConfigModalOpen} onClose={() => setIsDbConfigModalOpen(false)} />
    </>
  );
};

const ToolCard = ({ title, desc, icon, color, btnText, onClick }: any) => {
    const colors: any = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', orange: 'bg-orange-100 text-orange-600' };
    return (
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col">
            <div className="flex items-center gap-3 mb-3"><div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div><h4 className="font-bold text-slate-700">{title}</h4></div>
            <p className="text-xs text-slate-500 mb-4 flex-1">{desc}</p>
            <button onClick={onClick} className="w-full bg-white border text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">{btnText}</button>
        </div>
    );
};

const ParamColumn = ({ title, icon, data, newValue, setNewValue, onAdd, onDelete, editingParam, setEditingParam, onSave, isLoading, type }: any) => (
    <div className="flex flex-col h-full space-y-4">
        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border">
            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">{icon} {title}</h3>
            <div className="flex gap-1">
                <input type="text" placeholder="Adicionar..." className="px-2 py-1 border rounded text-[10px] uppercase w-24 outline-none focus:ring-1 focus:ring-blue-500" value={newValue} onChange={e => setNewValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && onAdd()} />
                <button onClick={onAdd} className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"><Plus size={14} /></button>
            </div>
        </div>
        <div className="border rounded-lg overflow-y-auto max-h-[400px] custom-scrollbar bg-white">
            <table className="w-full text-xs">
                <tbody className="divide-y">
                    {isLoading ? <tr><td className="p-4 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={16}/></td></tr> : data.length === 0 ? <tr><td className="p-4 text-center text-slate-400">Nenhum item cadastrado.</td></tr> : data.map((d: any) => (
                        <tr key={d.id} className="hover:bg-slate-50 group">
                            <td className="p-2.5 font-medium text-slate-700">
                                {editingParam?.id === d.id ? <input className="w-full border rounded px-1 py-0.5 uppercase" value={editingParam.name} onChange={e => setEditingParam({...editingParam, name: e.target.value})} autoFocus /> : d.name}
                            </td>
                            <td className="p-2 text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {editingParam?.id === d.id ? <button onClick={onSave} className="text-green-600 p-1"><Save size={14}/></button> : <button onClick={() => setEditingParam({id: d.id, name: d.name, type})} className="text-slate-400 hover:text-blue-600 p-1"><Edit2 size={14}/></button>}
                                    <button onClick={() => onDelete(d.id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={14}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const FunctionRow = ({ name, desc, onTest, isTesting }: any) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border group">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded border text-slate-400 group-hover:text-orange-500 transition-colors"><Terminal size={18} /></div>
            <div><p className="font-bold text-slate-700 font-mono text-sm">{name}</p><p className="text-[10px] text-slate-500">{desc}</p></div>
        </div>
        <button onClick={onTest} disabled={isTesting} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-2">
            {isTesting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} Testar
        </button>
    </div>
);
