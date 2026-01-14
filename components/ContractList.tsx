
import React, { useState, useMemo, useEffect } from 'react';
import { Contract, UserProfile, FiscalizationReport } from '../types';
import { Search, Filter, AlertTriangle, ChevronLeft, ChevronRight, Clock, Plus, ChevronsLeft, ChevronsRight, FileText, Upload, Siren, Trash2, ShieldCheck, X, Building, Tag, RefreshCw } from 'lucide-react';
import { ImportModal } from './ImportModal';
import { exportToPDF } from '../services/exportService';

interface ContractListProps {
  contracts: Contract[];
  reports: FiscalizationReport[];
  onNewContract: () => void;
  onEditContract: (contract: Contract) => void;
  onDeleteContract: (id: string) => void;
  userProfile: UserProfile | null;
}

const ITEMS_PER_PAGE = 10;

import { getUserPermissions } from '../utils/permissions';

const normalizeText = (text: string) => {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

export const ContractList: React.FC<ContractListProps> = ({ contracts, reports, onNewContract, onEditContract, onDeleteContract, userProfile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('active_group');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterObjType, setFilterObjType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const isInternalControl = userProfile?.email === 'controleinterno.sfp@gmail.com';
  const isPGM = userProfile?.role === 'pgm';
  // Permissions Logic Redesign:
  // 'manager' role = Department Manager (Can manage, but ONLY their department).
  // 'admin'/'super_admin' = Global Manager (Can manage ALL).
  const isGlobalAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
  const isDeptManager = userProfile?.role === 'manager'; // Role 'manager' is now dept-scoped

  const permissions = getUserPermissions(userProfile);

  // Adjusted: Users with explicit 'manage' permission on contracts can also manage (department scope unless admin)
  const hasContractPermission = permissions.contracts?.manage === true;
  const hasMinutePermission = permissions.minutes?.manage === true;

  // CRITICAL: Only Global Admins, PGM, Internal Control OR users with explicit MANAGE permission can see ALL departments.
  // Dept Managers (role 'manager') are restricted to their own department unless they have the explicit permission.
  const canSeeAll = isGlobalAdmin || isInternalControl || isPGM || hasContractPermission || hasMinutePermission;

  // Manage access: Admins, Dept Managers, or explicit permission
  const canManage = isGlobalAdmin || isDeptManager || hasContractPermission || hasMinutePermission;

  const isSuperAdmin = userProfile?.role === 'super_admin';
  const userDeptNormalized = useMemo(() => normalizeText(userProfile?.department || ''), [userProfile?.department]);

  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    contracts.forEach(c => { if (c.department) depts.add(c.department); });
    return Array.from(depts).sort((a, b) => a.localeCompare(b));
  }, [contracts]);

  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    contracts.forEach(c => { if (c.type) types.add(c.type); });
    return Array.from(types).sort((a, b) => a.localeCompare(b));
  }, [contracts]);

  const isSearching = searchTerm !== debouncedTerm;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedTerm, filterStatus, filterDept, filterObjType]);

  const getFiscalizationStatus = (doc: Contract) => {
    if (!doc.fiscalizationPeriod) return { label: 'N/A', color: 'bg-slate-100 text-slate-500', title: 'Não aplicável' };
    if (doc.fiscalizationPeriod === 'monthly') {
      const lastMonth = new Date();
      lastMonth.setDate(1); lastMonth.setMonth(lastMonth.getMonth() - 1);
      const refMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
      const report = reports.find(r => r.document_id === doc.id && r.reference_month === refMonth);
      if (report) {
        return report.status === 'completed'
          ? { label: 'Em Dia', color: 'bg-green-100 text-green-700', title: `Relatório de ${refMonth} concluído.` }
          : { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', title: `Relatório de ${refMonth} em andamento.` };
      }
      return { label: 'Pendente', color: 'bg-red-100 text-red-700', title: `Relatório de ${refMonth} não iniciado.` };
    }
    return { label: 'N/A', color: 'bg-slate-100 text-slate-500', title: 'Não aplicável' };
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      if (!canSeeAll) {
        if (normalizeText(c.department || '') !== userDeptNormalized) return false;
      }
      if (canSeeAll && filterDept !== 'all' && c.department !== filterDept) return false;
      if (filterObjType !== 'all' && c.type !== filterObjType) return false;

      const term = debouncedTerm.toLowerCase();
      const matchesSearch = !term ||
        c.object.toLowerCase().includes(term) ||
        c.supplier.toLowerCase().includes(term) ||
        c.contractId.includes(term);

      if (!matchesSearch) return false;

      if (filterStatus === 'all') return true;
      if (filterStatus === 'active_group') return c.status === 'active' || c.status === 'warning' || (c.activeAmendmentStatus && c.activeAmendmentStatus !== '');
      if (filterStatus === 'today') return c.daysRemaining === 0;
      return c.status === filterStatus;
    }).sort((a, b) => {
      // Prioritize active contracts over inactive ones, then sort by days remaining
      const isA_Inactive = a.status === 'executed' || a.status === 'rescinded';
      const isB_Inactive = b.status === 'executed' || b.status === 'rescinded';
      if (isA_Inactive && !isB_Inactive) return 1;
      if (!isA_Inactive && isB_Inactive) return -1;
      return a.daysRemaining - b.daysRemaining;
    });
  }, [contracts, debouncedTerm, filterStatus, filterDept, filterObjType, canSeeAll, userDeptNormalized]);

  const totalPages = Math.ceil(filteredContracts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedContracts = filteredContracts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('active_group');
    setFilterDept('all');
    setFilterObjType('all');
  };

  const handleExport = () => {
    const deptName = canSeeAll ? (filterDept === 'all' ? 'Relatório Geral' : filterDept) : userProfile?.department;
    exportToPDF(filteredContracts, deptName || 'Relatório', userProfile?.email || 'Usuário');
  };

  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'active_group' || filterDept !== 'all' || filterObjType !== 'all';

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'active': return 'VIGENTE';
      case 'warning': return 'A VENCER';
      case 'expired': return 'VENCIDO';
      case 'executed': return 'EXECUTADO';
      case 'rescinded': return 'RESCINDIDO';
      default: return status.toUpperCase();
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-4 bg-white">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isSearching ? 'text-blue-500' : 'text-slate-400'}`} size={18} />
              <input type="text" placeholder="Buscar por objeto, fornecedor ou nº..." className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              {canManage && (<button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm"><Upload size={16} /> Importar</button>)}
              <button onClick={handleExport} className="flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm"><FileText size={16} className="text-red-500" /> Exportar</button>
              {canManage && (<button onClick={onNewContract} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"><Plus size={16} /> Novo</button>)}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t pt-3">
            <div className="flex items-center gap-2"><Filter size={14} className="text-slate-400" /><select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-xs border rounded-lg px-2 py-1.5 bg-slate-50 outline-none focus:ring-1 focus:ring-blue-500"><option value="active_group">Situação: Vigentes</option><option value="active">Vigentes (Sem Alerta)</option><option value="warning">A Vencer (≤ 30 dias)</option><option value="expired">Vencidos</option><option value="executed">Executados</option><option value="all">Todas Situações</option></select></div>
            {canSeeAll && (<div className="flex items-center gap-2"><Building size={14} className="text-slate-400" /><select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="text-xs border rounded-lg px-2 py-1.5 bg-slate-50 outline-none focus:ring-1 focus:ring-blue-500 max-w-[150px]"><option value="all">Todas Secretarias</option>{uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>)}
            <div className="flex items-center gap-2"><Tag size={14} className="text-slate-400" /><select value={filterObjType} onChange={(e) => setFilterObjType(e.target.value)} className="text-xs border rounded-lg px-2 py-1.5 bg-slate-50 outline-none focus:ring-1 focus:ring-blue-500 max-w-[150px]"><option value="all">Todos os Tipos</option>{uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            {hasActiveFilters && (<button onClick={handleClearFilters} className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded flex items-center gap-1"><X size={14} /> Limpar</button>)}
          </div>
        </div>

        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10 shadow-sm">
              <tr><th className="px-4 py-3">Contrato</th><th className="px-4 py-3">Objeto</th><th className="px-4 py-3 hidden md:table-cell">Fornecedor</th><th className="px-4 py-3 text-center">Vencimento</th><th className="px-4 py-3 text-center">Situação</th><th className="px-4 py-3 text-center">Status Aditivo</th>{isSuperAdmin && <th className="px-4 py-3 text-center">Fiscalização</th>}{isSuperAdmin && <th className="px-4 py-3 text-center w-16">Excluir</th>}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedContracts.map((contract) => {
                const isInactive = contract.status === 'executed' || contract.status === 'rescinded';
                const fStatus = getFiscalizationStatus(contract);

                let rowBgClass = 'bg-white';
                // Destaque para quem vence HOJE (Fundo vermelho mais forte)
                if (contract.daysRemaining === 0 && !isInactive) {
                  rowBgClass = 'bg-red-200';
                } else if (contract.status === 'expired') {
                  rowBgClass = 'bg-red-50/70';
                } else if (contract.status === 'warning') {
                  rowBgClass = 'bg-amber-50/70';
                } else if (isInactive) {
                  rowBgClass = 'bg-slate-50/50';
                } else if (contract.isEmergency) {
                  rowBgClass = 'bg-red-50/30';
                }

                return (
                  <tr key={contract.id} className={`transition-colors cursor-pointer hover:brightness-95 ${rowBgClass}`} onClick={() => onEditContract(contract)}>
                    <td className="px-4 py-3"><div className="font-medium text-slate-900 flex items-center gap-1.5">{contract.isEmergency && <Siren size={14} className="text-red-500" />}{contract.contractId}</div><div className="text-[10px] text-slate-500 uppercase font-bold">{contract.department}</div></td>
                    <td className="px-4 py-3 max-w-[200px]" title={contract.object}>
                      <div className={`text-sm whitespace-normal break-words ${isInactive ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                        {contract.object}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-500 text-xs max-w-[150px] truncate" title={contract.supplier}>{contract.supplier}</td>
                    <td className="px-4 py-3 text-center font-medium">{contract.endDate}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${contract.status === 'expired' ? 'text-red-700 bg-red-100 border-red-200' : contract.status === 'warning' ? 'text-yellow-700 bg-yellow-100 border-yellow-200' : contract.status === 'active' ? 'text-green-700 bg-green-100 border-green-200' : 'text-slate-600 bg-slate-200 border-slate-300'}`}>
                          {contract.status === 'expired' && <AlertTriangle size={10} />}
                          {contract.status === 'warning' && <Clock size={10} />}
                          {getStatusDisplay(contract.status)}
                        </span>
                        {!isInactive && (
                          <span className={`text-[10px] font-bold ${contract.daysRemaining < 0 ? 'text-red-600' : contract.daysRemaining === 0 ? 'text-red-700' : contract.daysRemaining <= 30 ? 'text-orange-600' : 'text-slate-500'}`}>
                            {contract.daysRemaining < 0 ? 'Expirou' : contract.daysRemaining === 0 ? 'Vence HOJE' : `${contract.daysRemaining} dias`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {contract.activeAmendmentStatus ? (
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded border uppercase ${contract.activeAmendmentStatus?.includes('Aprovado') ? 'bg-green-100 text-green-700 border-green-200' :
                          contract.activeAmendmentStatus?.includes('Reprovado') ? 'bg-red-100 text-red-700 border-red-200' :
                            contract.activeAmendmentStatus?.includes('Ressalva') ? 'bg-orange-100 text-orange-700 border-orange-200' :
                              contract.activeAmendmentStatus?.includes('Comentário') ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                contract.activeAmendmentStatus?.includes('Análise') ? 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse' :
                                  'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                          <RefreshCw size={10} /> {contract.activeAmendmentStatus}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[10px]">-</span>
                      )}
                    </td>
                    {isSuperAdmin && (<td className="px-4 py-3 text-center"><span title={fStatus.title} className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${fStatus.color}`}><ShieldCheck size={12} /> {fStatus.label}</span></td>)}
                    {isSuperAdmin && (<td className="px-4 py-3 text-center"><button onClick={(e) => { e.stopPropagation(); if (confirm("Excluir?")) onDeleteContract(contract.id); }} className="text-slate-300 hover:text-red-600 p-2"><Trash2 size={16} /></button></td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
          <span>{filteredContracts.length} registros encontrados</span>
          {totalPages > 1 && (<div className="flex items-center gap-1"><button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1 disabled:opacity-30"><ChevronsLeft size={16} /></button><button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-1 disabled:opacity-30"><ChevronLeft size={16} /></button><span className="px-2">Pág. {currentPage} / {totalPages}</span><button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="p-1 disabled:opacity-30"><ChevronRight size={16} /></button><button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1 disabled:opacity-30"><ChevronsRight size={16} /></button></div>)}
        </div>
      </div>
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={() => window.location.reload()} type="contracts" />
    </>
  );
};
