import React, { useState, useEffect } from 'react';
import { triggerNotifications, getPendingNotificationsForToday, PendingNotification } from '../services/notificationService';
import { X, Loader2, Mail, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; version?: string } | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);
  const [pendingDocs, setPendingDocs] = useState<PendingNotification[]>([]);

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setIsConfirmed(false);
      setIsPreviewLoading(true);
      setPendingDocs([]);

      const fetchPending = async () => {
        try {
          const docs = await getPendingNotificationsForToday();
          setPendingDocs(docs);
        } catch (error) {
          console.error("Failed to fetch pending notifications", error);
          setPendingDocs([]);
        } finally {
          setIsPreviewLoading(false);
        }
      };
      
      fetchPending();
    }
  }, [isOpen]);

  const handleManualTrigger = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await triggerNotifications(false);
      setResult(response);
    } catch (error: any) {
      setResult({ success: false, message: error.message || "Erro desconhecido ao executar disparo." });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Mail size={20} className="text-orange-500" />
            Disparo Manual de Notificações
          </h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600">
                Esta ferramenta executa a rotina de verificação diária manualmente. Ela só enviará notificações para documentos que estão dentro dos prazos e que <strong className="text-slate-800">ainda não foram notificados hoje</strong>.
            </p>

            <div className="border rounded-lg bg-slate-50">
              <h4 className="font-bold text-sm text-slate-700 p-3 border-b bg-slate-100 flex items-center gap-2">
                  <FileText size={16} /> Documentos a Notificar Hoje ({isPreviewLoading ? '...' : pendingDocs.length})
              </h4>
              <div className="max-h-60 overflow-y-auto custom-scrollbar p-3">
                {isPreviewLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                  </div>
                ) : pendingDocs.length === 0 ? (
                  <div className="text-center text-sm text-slate-500 py-4">
                    <CheckCircle size={20} className="mx-auto mb-2 text-green-500" />
                    Nenhum alerta pendente para hoje.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {pendingDocs.map(doc => (
                      <li key={doc.identifier} className="text-xs border-b pb-2 last:border-b-0">
                        <p className="font-bold text-slate-800">{doc.identifier}</p>
                        <p className="text-slate-600 truncate" title={doc.object}>{doc.object}</p>
                        <p className="text-orange-600 font-medium">{doc.alertReason}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            {!result && (
              <>
                {!isPreviewLoading && pendingDocs.length > 0 && (
                   <div className="flex items-start gap-3 p-3 bg-slate-100 rounded-lg border border-slate-200">
                    <input
                      id="confirm-trigger"
                      type="checkbox"
                      checked={isConfirmed}
                      onChange={(e) => setIsConfirmed(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="confirm-trigger" className="text-sm text-slate-700">
                      Estou ciente de que esta ação enviará <strong>{pendingDocs.length}</strong> notificações por e-mail e no sistema.
                    </label>
                  </div>
                )}
               
                <div className="pt-2 flex justify-center">
                    <button
                        onClick={handleManualTrigger}
                        disabled={isLoading || isPreviewLoading || pendingDocs.length === 0 || !isConfirmed}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            `Disparar ${pendingDocs.length > 0 ? `(${pendingDocs.length})` : ''} Alertas`
                        )}
                    </button>
                </div>
              </>
            )}
            
            {result && (
                <div className={`p-4 rounded-lg mt-4 border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start gap-3">
                        {result.success ? 
                            <CheckCircle className="text-green-500 mt-1" size={20}/> : 
                            <AlertTriangle className="text-red-500 mt-1" size={20}/>
                        }
                        <div>
                            <h4 className={`font-bold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                                Disparo {result.success ? 'Concluído' : 'Falhou'}
                            </h4>
                             <span className="text-xs font-mono bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                Função: {result.version || 'N/A'}
                            </span>
                            <pre className="text-xs mt-2 whitespace-pre-wrap font-mono bg-white p-2 rounded border border-slate-200 max-h-40 overflow-auto">
                                {result.message}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 bg-slate-50 border-t flex justify-end">
            <button
                onClick={handleClose}
                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
            >
                Fechar
            </button>
        </div>
      </div>
    </div>
  );
};