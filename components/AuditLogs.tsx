import React, { useEffect, useState } from 'react';
import { AuditLog } from '../types';
import { fetchAuditLogs } from '../services/logService';
import { Activity, Search, Filter, Loader2, Calendar, User, FileText, Database, Shield, AlertTriangle } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogs();
      setLogs(data);
      setFilteredLogs(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao carregar logs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    let result = logs;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(log => 
        log.user_email.toLowerCase().includes(lower) ||
        log.details.toLowerCase().includes(lower) ||
        log.resource_id.toLowerCase().includes(lower)
      );
    }

    if (filterAction !== 'all') {
      result = result.filter(log => log.action === filterAction);
    }

    setFilteredLogs(result);
  }, [searchTerm, filterAction, logs]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-700';
      case 'UPDATE': return 'bg-blue-100 text-blue-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      case 'LOGIN': return 'bg-slate-100 text-slate-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'CONTRACT': return <FileText size={14} />;
      case 'MINUTE': return <Database size={14} />;
      case 'USER': return <User size={14} />;
      case 'SYSTEM': return <Shield size={14} />;
      default: return <Activity size={14} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <AlertTriangle size={40} className="text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Acesso Negado ou Erro de Configuração</h3>
        <p className="text-slate-500 max-w-lg mb-6">
          Não foi possível carregar os logs. Isso geralmente acontece quando as <strong>Políticas de Segurança (RLS)</strong> não foram criadas no Supabase.
        </p>
        <div className="bg-slate-900 text-slate-300 p-4 rounded-lg text-left text-xs font-mono max-w-2xl w-full overflow-x-auto mb-6">
          <p className="text-slate-500 mb-2">// Rode este SQL no Supabase para corrigir:</p>
          <p className="mb-1"><span className="text-purple-400">create policy</span> "Enable insert for authenticated users"</p>
          <p className="mb-1"><span className="text-purple-400">on</span> public.audit_logs <span className="text-purple-400">for insert</span></p>
          <p className="mb-4"><span className="text-purple-400">with check</span> (auth.role() = 'authenticated');</p>
          
          <p className="mb-1"><span className="text-purple-400">create policy</span> "Enable read for admins only"</p>
          <p className="mb-1"><span className="text-purple-400">on</span> public.audit_logs <span className="text-purple-400">for select</span></p>
          <p><span className="text-purple-400">using</span> (auth.uid() <span className="text-purple-400">in</span> (<span className="text-purple-400">select</span> id <span className="text-purple-400">from</span> public.profiles <span className="text-purple-400">where</span> role = 'admin'));</p>
        </div>
        <button 
          onClick={loadLogs}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Activity size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Logs de Auditoria</h2>
              <p className="text-sm text-slate-500">Histórico de acessos e alterações no sistema</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por usuário, detalhes ou ID..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500" />
            <select
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
              <option value="all">Todas as Ações</option>
              <option value="LOGIN">Acessos (Login)</option>
              <option value="CREATE">Criações</option>
              <option value="UPDATE">Edições</option>
              <option value="DELETE">Exclusões</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3 text-center">Ação</th>
                <th className="px-4 py-3">Recurso</th>
                <th className="px-4 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500 flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {log.user_email}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-slate-600">
                      {getResourceIcon(log.resource_type)}
                      {log.resource_type} {log.resource_id !== 'N/A' && <span className="text-xs bg-slate-100 px-1 rounded ml-1">#{log.resource_id}</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-md truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};