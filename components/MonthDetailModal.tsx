
import React from 'react';
import { X, FileText, ClipboardList, Gavel, Lightbulb, Briefcase, ShoppingCart, TrendingUp } from 'lucide-react';

interface UnifiedDocument {
  id: string;
  docKind: 'contract' | 'minute' | 'bidding' | 'allowance' | 'bill' | 'purchase' | 'supplementation';
  identifier: string;
  department: string;
  object: string;
  status: string;
  date: string;
  daysRemaining: number;
}

interface MonthDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: string;
  documents: UnifiedDocument[];
}

export const MonthDetailModal: React.FC<MonthDetailModalProps> = ({ isOpen, onClose, month, documents }) => {
  if (!isOpen) return null;

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const monthAbbr = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const fullMonthName = monthNames[monthAbbr.indexOf(month)] || month;

  const getTypeLabel = (kind: string) => {
    switch (kind) {
      case 'contract': return { label: 'CTR', icon: <FileText size={10} />, color: 'blue' };
      case 'minute': return { label: 'ATA', icon: <ClipboardList size={10} />, color: 'purple' };
      case 'bidding': return { label: 'LIC', icon: <Gavel size={10} />, color: 'orange' };
      case 'bill': return { label: 'CON', icon: <Lightbulb size={10} />, color: 'yellow' };
      case 'allowance': return { label: 'DIA', icon: <Briefcase size={10} />, color: 'green' };
      case 'purchase': return { label: 'EMP', icon: <ShoppingCart size={10} />, color: 'teal' };
      case 'supplementation': return { label: 'SUP', icon: <TrendingUp size={10} />, color: 'indigo' };
      default: return { label: 'DOC', icon: <FileText size={10} />, color: 'slate' };
    }
  };

  const getColorClasses = (color: string) => {
    const map: any = {
      blue: 'text-blue-700 bg-blue-100',
      purple: 'text-purple-700 bg-purple-100',
      orange: 'text-orange-700 bg-orange-100',
      yellow: 'text-yellow-700 bg-yellow-100',
      green: 'text-green-700 bg-green-100',
      teal: 'text-teal-700 bg-teal-100',
      indigo: 'text-indigo-700 bg-indigo-100',
      slate: 'text-slate-700 bg-slate-100',
    };
    return map[color] || map.slate;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Vencimentos em {fullMonthName}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Lista detalhada de todos os documentos que vencem neste mês.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar p-6">
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Identificador</th>
                  <th className="px-4 py-3">Objeto/Descrição</th>
                  <th className="px-4 py-3 text-center">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc, idx) => {
                  const info = getTypeLabel(doc.docKind);
                  return (
                    <tr key={`${doc.id}-${idx}`} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${getColorClasses(info.color)}`}>
                          {info.icon} {info.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {doc.identifier}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-md truncate" title={doc.object}>
                        {doc.object}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        {doc.date}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
