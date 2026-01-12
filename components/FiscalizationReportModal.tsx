import React, { useState, useEffect, useMemo } from 'react';
import { Contract, Minute, UserProfile, FiscalizationReport, EnrichedFiscalizationReport } from '../types';
import { fetchAllReportsInRange } from '../services/fiscalizationService';
import { exportFiscalizationReportToPDF } from '../services/exportService';
import { X, Loader2, FileText, Calendar, Filter, AlertTriangle } from 'lucide-react';

interface FiscalizationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: Contract[];
  minutes: Minute[];
  userProfile: UserProfile | null;
}

const getCurrentAndPreviousMonth = () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    now.setMonth(now.getMonth() - 1);
    const previousMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return { start: previousMonth, end: currentMonth };
};


export const FiscalizationReportModal: React.FC<FiscalizationReportModalProps> = ({ isOpen, onClose, contracts, minutes, userProfile }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState<FiscalizationReport[]>([]);
  
  const [dateRange, setDateRange] = useState(getCurrentAndPreviousMonth());
  const [statusFilter, setStatusFilter] = useState<'all' | 'signed' | 'pending'>('all');

  const allDocuments = useMemo(() => {
    const docMap = new Map<string, { identifier: string; object: string; department: string }>();
    contracts.forEach(c => docMap.set(c.id, { identifier: c.contractId, object: c.object, department: c.department }));
    minutes.forEach(m => docMap.set(m.id, { identifier: m.minuteId, object: m.object, department: m.department }));
    return docMap;
  }, [contracts, minutes]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllReportsInRange(dateRange.start, dateRange.end);
      setReports(data);
    } catch (e) {
      console.error("Erro ao carregar relatórios", e);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      loadReports();
    }
  }, [isOpen, dateRange]);


  const enrichedAndFilteredReports = useMemo((): EnrichedFiscalizationReport[] => {
    return reports
      .map(report => {
        const docInfo = allDocuments.get(report.document_id);
        if (!docInfo) return null; // Document might have been deleted

        return {
          ...report,
          documentIdentifier: docInfo.identifier,
          documentObject: docInfo.object,
          documentDepartment: docInfo.department,
        };
      })
      .filter((report): report is EnrichedFiscalizationReport => {
        if (!report) return false;

        if (statusFilter === 'all') return true;

        const isSigned = !!(report.manager_signed_at && report.tech_fiscal_signed_at && report.adm_fiscal_signed_at);
        
        return statusFilter === 'signed' ? isSigned : !isSigned;
      });
  }, [reports, allDocuments, statusFilter]);

  const handleGeneratePDF = () => {
    if (!userProfile) return;
    exportFiscalizationReportToPDF(enrichedAndFilteredReports, dateRange, userProfile.email || 'N/A');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="text-slate-600" />
              Relatório de Fiscalização
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Gere um PDF com os relatórios de um período.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1"><Calendar size={12}/> Mês Inicial</label>
                <input 
                    type="month"
                    value={dateRange.start}
                    onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))}
                    className="w-full border border-slate-200 rounded p-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1"><Calendar size={12}/> Mês Final</label>
                <input 
                    type="month"
                    value={dateRange.end}
                    onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))}
                    className="w-full border border-slate-200 rounded p-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1"><Filter size={12}/> Status</label>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="w-full border border-slate-200 rounded p-2 text-sm bg-white"
                >
                    <option value="all">Todos</option>
                    <option value="signed">Assinados</option>
                    <option value="pending">Pendentes</option>
                </select>
              </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-blue-500" size={32}/>
            </div>
          ) : enrichedAndFilteredReports.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-3 py-2">Mês</th>
                            <th className="px-3 py-2">Documento</th>
                            <th className="px-3 py-2">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {enrichedAndFilteredReports.slice(0, 10).map(r => ( // Preview
                            <tr key={r.id}>
                                <td className="px-3 py-2">{r.reference_month.split('-').reverse().join('/')}</td>
                                <td className="px-3 py-2 font-medium">{r.documentIdentifier}</td>
                                <td className="px-3 py-2">
                                    {r.manager_signed_at && r.tech_fiscal_signed_at && r.adm_fiscal_signed_at ? 
                                    <span className="text-xs font-bold text-green-600">Assinado</span> :
                                    <span className="text-xs font-bold text-yellow-600">Pendente</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {enrichedAndFilteredReports.length > 10 && <p className="text-xs text-center p-2 bg-slate-50">... e mais {enrichedAndFilteredReports.length - 10} registros.</p>}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <AlertTriangle size={24} className="mb-2"/>
                <p className="text-sm">Nenhum relatório encontrado para o período.</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t flex justify-end">
            <button
                onClick={handleGeneratePDF}
                disabled={isLoading || enrichedAndFilteredReports.length === 0}
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
            >
                <FileText size={16} />
                Gerar PDF ({enrichedAndFilteredReports.length})
            </button>
        </div>
      </div>
    </div>
  );
};