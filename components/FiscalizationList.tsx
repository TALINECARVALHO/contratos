import React, { useState, useEffect } from 'react';
import { Contract, Minute, UserProfile, FiscalizationReport, FiscalizationStatus } from '../types';
import { Search, ShieldCheck, FileText, ClipboardList, Filter, Loader2, Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { FiscalizationModal } from './FiscalizationModal';
import { FiscalizationReportModal } from './FiscalizationReportModal';
import { FISCALIZATION_PERIODS } from '../constants';
import { fetchAllFiscalizationReports } from '../services/fiscalizationService';

interface FiscalizationListProps {
  contracts: Contract[];
  minutes: Minute[];
  userProfile: UserProfile | null;
}

const ITEMS_PER_PAGE = 10;

export const FiscalizationList: React.FC<FiscalizationListProps> = ({ contracts, minutes, userProfile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Contract | Minute | null>(null);
  const [selectedType, setSelectedType] = useState<'contract' | 'minute'>('contract');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'contract' | 'minute'>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reports, setReports] = useState<FiscalizationReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadReports = async () => {
      setIsLoadingReports(true);
      try {
        const allReports = await fetchAllFiscalizationReports();
        setReports(allReports);
      } catch (error) {
        console.error("Erro ao carregar relatórios", error);
      } finally {
        setIsLoadingReports(false);
      }
    }
    loadReports();
  }, []);

  // Mapeia o último relatório para cada documento para performance
  const latestReportMap = React.useMemo(() => {
    const map = new Map<string, FiscalizationReport>();
    reports.forEach(r => {
      const existing = map.get(r.document_id);
      if (!existing || new Date(r.created_at) > new Date(existing.created_at)) {
        map.set(r.document_id, r);
      }
    });
    return map;
  }, [reports]);

  const normalize = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const getFrequencyLabel = (key: string | null) => {
    if (!key) return 'N/D';
    return FISCALIZATION_PERIODS.find(p => p.key === key)?.label || 'N/D';
  };

  const getStatusLabelAndColor = (status: FiscalizationStatus | undefined) => {
    switch (status) {
      case 'pending_tech': return { label: 'Pendente Téc.', color: 'bg-yellow-100 text-yellow-800' };
      case 'pending_adm': return { label: 'Pendente ADM', color: 'bg-orange-100 text-orange-800' };
      case 'pending_manager': return { label: 'Pendente Gestor', color: 'bg-red-100 text-red-800' };
      case 'completed': return { label: 'Concluído', color: 'bg-green-100 text-green-800' };
      default: return { label: 'Não Iniciado', color: 'bg-slate-100 text-slate-800' };
    }
  };
  
  const isManager = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  const filteredItems = [...contracts.map(c => ({ ...c, docType: 'contract' as const })), ...minutes.map(m => ({ ...m, docType: 'minute' as const }))]
    .filter(item => {
      // Se não for gestor, filtra pelo departamento do usuário
      if (!isManager) {
         const userDept = normalize(userProfile?.department || '');
         const itemDept = normalize(item.department || '');
         if (itemDept !== userDept) return false;
      }
      const term = normalize(searchTerm);
      const matchesSearch = 
         normalize(item.object).includes(term) || 
         (item.docType === 'contract' ? (item as Contract).contractId : (item as Minute).minuteId).includes(term);
      const matchesType = filterType === 'all' || item.docType === filterType;
      const isActive = item.status !== 'expired' && item.status !== 'rescinded' && item.status !== 'executed';
      return matchesSearch && matchesType && isActive;
    });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleOpen = (doc: Contract | Minute, type: 'contract' | 'minute') => {
    setSelectedDoc(doc);
    setSelectedType(type);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Recarrega relatórios para refletir mudanças
    const loadReports = async () => {
      const allReports = await fetchAllFiscalizationReports();
      setReports(allReports);
    }
    loadReports();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-end items-center mb-6 gap-4">
          <div className="flex gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             <select className="border rounded-lg px-3 py-2 text-sm bg-slate-50" value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
                <option value="all">Todos</option>
                <option value="contract">Contratos</option>
                <option value="minute">Atas</option>
             </select>
             <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-2 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
                <FileText size={16} /> Relatório
              </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoadingReports ? <div className="text-center p-8"><Loader2 className="animate-spin text-blue-500" /></div> : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Nº do Contrato/Ata</th>
                  <th className="px-4 py-3">Objeto</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Frequência</th>
                  <th className="px-4 py-3">Fiscais</th>
                  <th className="px-4 py-3">Status Relatório</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map((item) => {
                  const latestReport = latestReportMap.get(item.id);
                  const statusInfo = getStatusLabelAndColor(latestReport?.status);
                  const fiscals = [item.technicalFiscal, item.administrativeFiscal, item.manager].filter(Boolean).map(f => f.split(' ')[0]).join(', ');

                  return (
                    <tr key={`${item.docType}-${item.id}`} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                         {item.docType === 'contract' ? (item as Contract).contractId : (item as Minute).minuteId}
                      </td>
                      <td className="px-4 py-3 max-w-sm truncate" title={item.object}>{item.object}</td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-600 whitespace-nowrap">{item.type}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{getFrequencyLabel(item.fiscalizationPeriod)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate" title={fiscals}>
                        <Users size={14} className="inline-block mr-1" />
                        {fiscals}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                         <button onClick={() => handleOpen(item, item.docType)} className="bg-white border text-slate-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                           Fiscalizar
                         </button>
                      </td>
                    </tr>
                  )
                })}
                {filteredItems.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-400">Nenhum documento ativo encontrado.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination Footer */}
        <div className="p-3 border-t border-slate-100 bg-white text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span>
                Mostrando {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredItems.length)} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} de {filteredItems.length} registros
            </span>
            {totalPages > 1 && (
                <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 rounded disabled:opacity-50"><ChevronsLeft size={16} /></button>
                    <button onClick={() => setCurrentPage(c => c - 1)} disabled={currentPage === 1} className="p-1.5 rounded disabled:opacity-50"><ChevronLeft size={16} /></button>
                    <span className="font-bold px-2">Pág. {currentPage} de {totalPages}</span>
                    <button onClick={() => setCurrentPage(c => c + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded disabled:opacity-50"><ChevronRight size={16} /></button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 rounded disabled:opacity-50"><ChevronsRight size={16} /></button>
                </div>
            )}
        </div>
      </div>

      {isModalOpen && selectedDoc && (
        <FiscalizationModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal}
          document={selectedDoc}
          docType={selectedType}
          userProfile={userProfile}
        />
      )}

      {isReportModalOpen && (
        <FiscalizationReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          contracts={contracts}
          minutes={minutes}
          userProfile={userProfile}
        />
      )}
    </div>
  );
};