import React, { useState, useEffect } from 'react';
import { FiscalizationReport } from '../types';
import { fetchReportsForDocument } from '../services/fiscalizationService';
import { Loader2, CheckCircle, Clock, ShieldCheck } from 'lucide-react';

interface FiscalizationHistoryProps {
  documentId: string;
}

export const FiscalizationHistory: React.FC<FiscalizationHistoryProps> = ({ documentId }) => {
  const [history, setHistory] = useState<FiscalizationReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (documentId) {
      setIsLoading(true);
      fetchReportsForDocument(documentId)
        .then(data => {
          setHistory(data);
        })
        .catch(err => {
          console.error("Error fetching fiscalization history:", err);
          setHistory([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [documentId]);

  const getStatusIcon = (signedAt: string | null, fiscalName: string | null) => {
    if (signedAt) {
      return (
        <div className="flex flex-col items-center text-green-600" title={`Assinado em ${new Date(signedAt).toLocaleDateString('pt-BR')}`}>
          <CheckCircle size={16} />
          <span className="text-[10px]">{new Date(signedAt).toLocaleDateString('pt-BR')}</span>
        </div>
      );
    }
    // Se não tiver nome de fiscal atribuído (ex: Fiscal ADM vazio), mostra traço/NA
    if (!fiscalName) {
        return <span className="text-slate-300 text-xs font-bold">N/A</span>;
    }
    return <span title="Pendente"><Clock size={16} className="text-slate-400" /></span>;
  };

  const getOverallStatus = (status: string) => {
    switch (status) {
        case 'pending_tech': return <span className="text-xs font-bold text-yellow-600">Pendente Téc.</span>;
        case 'pending_adm': return <span className="text-xs font-bold text-orange-600">Pendente ADM</span>;
        case 'pending_manager': return <span className="text-xs font-bold text-red-600">Pendente Gestor</span>;
        case 'completed': return <span className="text-xs font-bold text-green-600">Concluído</span>;
        default: return <span className="text-xs text-slate-500">N/D</span>;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
        <ShieldCheck size={16} /> Histórico de Fiscalização
      </h3>
      {isLoading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="animate-spin text-blue-500" />
        </div>
      ) : history.length > 0 ? (
        <div className="overflow-x-auto border rounded-lg max-h-60 custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 font-semibold text-slate-600">Mês Ref.</th>
                <th className="px-3 py-2 font-semibold text-slate-600">Status</th>
                <th className="px-3 py-2 font-semibold text-slate-600 text-center">Fiscal Téc.</th>
                <th className="px-3 py-2 font-semibold text-slate-600 text-center">Fiscal ADM</th>
                <th className="px-3 py-2 font-semibold text-slate-600 text-center">Gestor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map(report => (
                <tr key={report.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono">{report.reference_month.split('-').reverse().join('/')}</td>
                  <td className="px-3 py-2">{getOverallStatus(report.status)}</td>
                  <td className="px-3 py-2 text-center">{getStatusIcon(report.tech_fiscal_signed_at, report.tech_fiscal_name)}</td>
                  <td className="px-3 py-2 text-center">{getStatusIcon(report.adm_fiscal_signed_at, report.adm_fiscal_name)}</td>
                  <td className="px-3 py-2 text-center">{getStatusIcon(report.manager_signed_at, report.manager_name)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-4 bg-slate-50 rounded-lg text-sm text-slate-500">
          Nenhum relatório de fiscalização encontrado para este documento.
        </div>
      )}
    </div>
  );
};