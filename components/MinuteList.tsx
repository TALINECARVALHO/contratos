
import React, { useState, useMemo, useEffect } from 'react';
import { Minute, UserProfile, FiscalizationReport } from '../types';
import { Search, Filter, AlertTriangle, ChevronLeft, ChevronRight, Clock, Plus, ChevronsLeft, ChevronsRight, FileText, Upload, Trash2, X, Building, Tag } from 'lucide-react';
import { ImportModal } from './ImportModal';
import { exportMinutesToPDF } from '../services/exportService';
import { fetchMinuteTypes, DynamicSetting } from '../services/settingsService';

interface MinuteListProps {
  minutes: Minute[];
  reports: FiscalizationReport[];
  onNewMinute: () => void;
  onEditMinute: (minute: Minute) => void;
  onDeleteMinute: (id: string) => void;
  userProfile: UserProfile | null;
}

const ITEMS_PER_PAGE = 10;

import { getUserPermissions } from '../utils/permissions';

interface MinuteListProps {
  minutes: Minute[];
  reports: FiscalizationReport[];
  onNewMinute: () => void;
  onEditMinute: (minute: Minute) => void;
  onDeleteMinute: (id: string) => void;
  userProfile: UserProfile | null;
}

const normalizeText = (text: string) => {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

export const MinuteList: React.FC<MinuteListProps> = ({ minutes, reports, onNewMinute, onEditMinute, onDeleteMinute, userProfile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterObjType, setFilterObjType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [dynamicTypes, setDynamicTypes] = useState<DynamicSetting[]>([]);

  const isInternalControl = userProfile?.email === 'controleinterno.sfp@gmail.com';
  const isManager = userProfile?.role === 'admin' || userProfile?.role === 'super_admin' || userProfile?.role === 'manager';

  // ... checks ...
  // TODOS podem ver Atas, mas apenas gestores podem gerenciar (criar/importar)
  const canSeeAll = true;

  const permissions = getUserPermissions(userProfile);
  const hasMinutePermission = permissions.minutes?.manage === true;
  const canManage = isManager || hasMinutePermission;


  const isSuperAdmin = userProfile?.role === 'super_admin';

  useEffect(() => {
    fetchMinuteTypes()
      .then(types => {
        setDynamicTypes(types.sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(err => {
        console.warn("Aviso: Tabela minute_types ainda não instalada no banco.");
        setDynamicTypes([]);
      });
  }, []);

  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    minutes.forEach(m => { if (m.department) depts.add(m.department); });
    return Array.from(depts).sort((a, b) => a.localeCompare(b));
  }, [minutes]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedTerm, filterStatus, filterDept, filterObjType]);

  const filteredMinutes = useMemo(() => {
    return minutes.filter(m => {
      // Regra Ajustada: Sem restrição por departamento do usuário para Atas
      if (filterDept !== 'all' && m.department !== filterDept) return false;

      if (filterObjType !== 'all') {
        const typeNormalized = normalizeText(m.type || '');
        const filterNormalized = normalizeText(filterObjType);
        if (typeNormalized !== filterNormalized) return false;
      }

      const term = debouncedTerm.toLowerCase();
      const matchesSearch = !term ||
        m.object.toLowerCase().includes(term) ||
        m.minuteId.includes(term);

      if (!matchesSearch) return false;

      if (filterStatus === 'all') return true;
      if (filterStatus === 'active_group') return m.status === 'active' || m.status === 'warning';
      if (filterStatus === 'today') return m.daysRemaining === 0;
      return m.status === filterStatus;
    }).sort((a, b) => {
      const isA_Inactive = a.status === 'executed' || a.status === 'rescinded' || a.status === 'expired';
      const isB_Inactive = b.status === 'executed' || b.status === 'rescinded' || b.status === 'expired';
      if (isA_Inactive && !isB_Inactive) return 1;
      if (!isA_Inactive && isB_Inactive) return -1;
      return a.daysRemaining - b.daysRemaining;
    });
  }, [minutes, debouncedTerm, filterStatus, filterDept, filterObjType]);

  const totalPages = Math.ceil(filteredMinutes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMinutes = filteredMinutes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterDept('all');
    setFilterObjType('all');
  };

  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'all' || filterDept !== 'all' || filterObjType !== 'all';

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'active': return 'VIGENTE';
      case 'warning': return 'A VENCER';
      case 'expired': return 'VENCIDA';
      case 'executed': return 'EXECUTADA';
      case 'rescinded': return 'RESCINDIDA';
      default: return status.toUpperCase();
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-4 bg-white">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Buscar por objeto ou nº..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              {canManage && (<button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm"><Upload size={16} /> Importar</button>)}
              <button onClick={() => exportMinutesToPDF(filteredMinutes, filterDept, userProfile?.email || 'Usuário')} className="flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm"><FileText size={16} className="text-red-500" /> Exportar</button>
              {canManage && (<button onClick={onNewMinute} className="flex items-center gap-1 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 shadow-sm"><Plus size={16} /> Nova Ata</button>)}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t pt-3">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-xs border rounded-lg px-2 py-1.5 bg-slate-50 outline-none focus:ring-1 focus:ring-purple-500">
                <option value="all">Todas as Situações</option>
                <option value="active_group">Apenas Vigentes</option>
                <option value="warning">A Vencer (≤ 30 dias)</option>
                <option value="expired">Vencidas</option>
              </select>
            </div>
            {/* Todos podem filtrar por secretaria em Atas */}
            <div className="flex items-center gap-2">
              <Building size={14} className="text-slate-400" />
              <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="text-xs border rounded-lg px-2 py-1.5 bg-slate-50 outline-none focus:ring-1 focus:ring-purple-500 max-w-[150px]">
                <option value="all">Todas Secretarias</option>
                {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-slate-400" />
              <select value={filterObjType} onChange={(e) => setFilterObjType(e.target.value)} className="text-xs border rounded-lg px-2 py-1.5 bg-slate-50 outline-none focus:ring-1 focus:ring-purple-500 max-w-[150px]">
                <option value="all">Todos os Tipos</option>
                {dynamicTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            {hasActiveFilters && (<button onClick={handleClearFilters} className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded flex items-center gap-1"><X size={14} /> Limpar Filtros</button>)}
          </div>
        </div>

        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3">Nº / Ano</th>
                <th className="px-4 py-3">Objeto</th>
                <th className="px-4 py-3 text-center">Vencimento</th>
                <th className="px-4 py-3 text-center">Situação</th>
                {isSuperAdmin && <th className="px-4 py-3 text-center w-16">Excluir</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMinutes.length > 0 ? (
                paginatedMinutes.map((minute) => {
                  const isInactive = minute.status === 'executed' || minute.status === 'rescinded' || minute.status === 'expired';

                  let rowBgClass = 'bg-white';
                  if (minute.daysRemaining === 0 && !isInactive) {
                    rowBgClass = 'bg-red-200';
                  } else if (minute.status === 'expired') {
                    rowBgClass = 'bg-red-50/70';
                  } else if (minute.status === 'warning') {
                    rowBgClass = 'bg-amber-50/70';
                  } else if (isInactive) {
                    rowBgClass = 'bg-slate-50/50';
                  }

                  return (
                    <tr key={minute.id} className={`transition-colors cursor-pointer hover:brightness-95 ${rowBgClass}`} onClick={() => onEditMinute(minute)}>
                      <td className="px-4 py-3"><div className="font-medium text-slate-900">{minute.minuteId}</div><div className="text-[10px] text-slate-500 uppercase font-bold">{minute.department}</div></td>
                      <td className={`px-4 py-3 max-w-xs truncate ${isInactive ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`} title={minute.object}>{minute.object}</td>
                      <td className="px-4 py-3 text-center font-medium">{minute.endDate}</td>
                      <td className="px-4 py-3 text-center"><div className="flex flex-col items-center gap-0.5"><span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${minute.status === 'expired' ? 'text-red-700 bg-red-100 border-red-200' : minute.status === 'warning' ? 'text-yellow-700 bg-yellow-100 border-yellow-200' : 'text-green-700 bg-green-100 border-green-200'}`}>{minute.status === 'warning' && <Clock size={10} />}{getStatusDisplay(minute.status)}</span>{!isInactive && (<span className={`text-[10px] font-bold ${minute.daysRemaining < 0 ? 'text-red-600' : minute.daysRemaining === 0 ? 'text-red-700' : minute.daysRemaining <= 30 ? 'text-orange-600' : 'text-slate-500'}`}>{minute.daysRemaining < 0 ? 'Expirou' : minute.daysRemaining === 0 ? 'Vence HOJE' : `${minute.daysRemaining} dias`}</span>)}</div></td>
                      {isSuperAdmin && (<td className="px-4 py-3 text-center"><button onClick={(e) => { e.stopPropagation(); if (confirm("Excluir permanentemente esta ata?")) onDeleteMinute(minute.id); }} className="text-slate-300 hover:text-red-600 p-2"><Trash2 size={16} /></button></td>)}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isSuperAdmin ? 5 : 4} className="px-4 py-12 text-center text-slate-400">
                    Nenhuma ata encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
          <span>{filteredMinutes.length} registros encontrados</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1 disabled:opacity-30 hover:text-blue-600 transition-colors"><ChevronsLeft size={16} /></button>
              <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-1 disabled:opacity-30 hover:text-blue-600 transition-colors"><ChevronLeft size={16} /></button>
              <span className="px-2 font-medium">Pág. {currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="p-1 disabled:opacity-30 hover:text-blue-600 transition-colors"><ChevronRight size={16} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1 disabled:opacity-30 hover:text-blue-600 transition-colors"><ChevronsRight size={16} /></button>
            </div>
          )}
        </div>
      </div>
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={() => window.location.reload()} type="minutes" />
    </>
  );
};
