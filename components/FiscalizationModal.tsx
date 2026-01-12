
import React, { useState, useEffect } from 'react';
import { Contract, Minute, UserProfile, FiscalizationReport, FiscalizationStatus } from '../types';
import { getReportForDocument, createOrUpdateReport, signReport, generateTemplate } from '../services/fiscalizationService';
import { exportSingleFiscalizationReportToPDF } from '../services/exportService';
import { X, Save, FileSignature, CheckCircle, ShieldCheck, Lock, Loader2, UserCheck, Clock, User, Printer } from 'lucide-react';

interface FiscalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Contract | Minute;
  docType: 'contract' | 'minute';
  userProfile: UserProfile | null;
}

export const FiscalizationModal: React.FC<FiscalizationModalProps> = ({ isOpen, onClose, document, docType, userProfile }) => {
  const [report, setReport] = useState<FiscalizationReport | null>(null);
  const [content, setContent] = useState<any | null>(null);
  const [month, setMonth] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [signingRole, setSigningRole] = useState<'manager' | 'technical' | 'administrative' | null>(null);
  const [password, setPassword] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    if (isOpen && document) {
      const now = new Date();
      // Mês anterior como padrão
      now.setDate(1); 
      now.setMonth(now.getMonth() -1);
      const lastMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setMonth(lastMonth);
      loadReport(lastMonth);
    }
  }, [isOpen, document]);

  const loadReport = async (selectedMonth: string) => {
    setIsLoading(true);
    setContent(null);
    setReport(null);
    try {
      const docId = document.id;
      const existing = await getReportForDocument(docId, selectedMonth);
      
      if (existing) {
        setReport(existing);
        setContent(existing.content);
      } else {
        setReport(null);
        const supplier = docType === 'contract' ? (document as Contract).supplier : 'N/A';
        const number = docType === 'contract' ? (document as Contract).contractId : (document as Minute).minuteId;
        const type = document.type || 'Outro';
        setContent(generateTemplate(docType, { number, supplier, object: document.object, type }));
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleFieldChange = (sectionIndex: number, fieldIndex: number, value: any) => {
    setContent((prevContent: any) => {
      const newSections = [...prevContent.sections];
      newSections[sectionIndex].fields[fieldIndex].value = value;
      return { ...prevContent, sections: newSections };
    });
  };

  const handleSaveContent = async () => {
    setIsSaving(true);
    try {
      const newReport = await createOrUpdateReport({
        document_id: document.id,
        document_type: docType,
        reference_month: month,
        content: content
      }, document);
      setReport(newReport as FiscalizationReport);
      alert("Relatório salvo com sucesso!");
    } catch (e) {
      alert("Erro ao salvar relatório.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignClick = (role: 'manager' | 'technical' | 'administrative') => {
    if (!report) {
      alert("Você precisa salvar o relatório pelo menos uma vez antes de assinar."); return;
    }
    setSigningRole(role);
    setPassword('');
  };

  const confirmSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signingRole || !report || !userProfile) return;
    setIsSigning(true);
    try {
      const updatedReport = await signReport(report, signingRole, password, userProfile);
      setReport(updatedReport as FiscalizationReport);
      setSigningRole(null);
      alert("Assinado com sucesso!");
    } catch (e: any) {
      alert(e.message || "Erro na assinatura.");
    } finally { setIsSigning(false); }
  };
  
  const handleExportPDF = () => {
    if (!report || !content || !document || !userProfile) {
        alert("É necessário carregar um relatório para exportar.");
        return;
    }
    exportSingleFiscalizationReportToPDF(report, content, document, docType, userProfile);
  };

  if (!isOpen) return null;

  const userEmail = userProfile?.email?.toLowerCase();
  const isTechFiscal = userEmail === document.technicalFiscal?.toLowerCase();
  const isAdmFiscal = userEmail === document.administrativeFiscal?.toLowerCase();
  const isManager = userEmail === document.manager?.toLowerCase();

  const status = report?.status || 'pending_tech';
  const canEditContent = status === 'pending_tech' && isTechFiscal;

  const canSignTech = status === 'pending_tech' && isTechFiscal;
  const canSignAdm = status === 'pending_adm' && isAdmFiscal;
  const canSignManager = status === 'pending_manager' && isManager;

  // CORREÇÃO: Utiliza a propriedade 'hasAdministrativeFiscal'
  const hasAdmFiscal = document.hasAdministrativeFiscal;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col animate-fade-in">
        <div className="p-6 border-b flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Fiscalização de Documento</h2>
              <p className="text-sm text-slate-500">
                {docType === 'contract' ? (document as Contract).contractId : (document as Minute).minuteId} - {document.object}
              </p>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={handleExportPDF} 
                    disabled={!report}
                    className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Exportar Relatório para PDF"
                >
                    <Printer size={20} />
                </button>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors">
                    <X className="text-slate-400"/>
                </button>
            </div>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Coluna Principal - Formulário */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <label className="font-medium">Mês de Referência:</label>
                <input type="month" value={month} onChange={(e) => { setMonth(e.target.value); loadReport(e.target.value); }} className="border rounded px-3 py-1.5 text-sm"/>
                {isLoading && <Loader2 className="animate-spin text-blue-500" />}
            </div>
            {isLoading ? (
                <div className="text-center p-10">Carregando modelo...</div>
            ) : content ? (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <h3 className="font-bold text-slate-800">{content.title}</h3>
                        <p className="text-xs text-slate-600 whitespace-pre-wrap">{content.header}</p>
                    </div>

                    {content.sections.map((section: any, sIdx: number) => (
                        <div key={sIdx} className="space-y-4">
                            <h4 className="font-bold text-slate-700 border-b pb-2">{section.title}</h4>
                            {section.fields.map((field: any, fIdx: number) => (
                                <div key={field.id} className="space-y-1">
                                    <label className="text-sm font-medium text-slate-600">{field.label}</label>
                                    {field.type === 'checkbox' && (
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id={field.id} checked={field.value} onChange={e => handleFieldChange(sIdx, fIdx, e.target.checked)} disabled={!canEditContent} className="h-4 w-4 rounded"/>
                                            <span className="text-sm">{field.value ? 'Sim' : 'Não'}</span>
                                        </div>
                                    )}
                                    {field.type === 'textarea' && (
                                        <textarea value={field.value} onChange={e => handleFieldChange(sIdx, fIdx, e.target.value)} disabled={!canEditContent} rows={3} className="w-full border rounded-lg p-2 text-sm disabled:bg-slate-50"/>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                    {canEditContent && (
                        <div className="flex justify-end pt-4 border-t">
                            <button onClick={handleSaveContent} disabled={isSaving} className="bg-blue-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 font-medium shadow-md shadow-blue-100">
                                {isSaving ? <Loader2 className="animate-spin" /> : <Save />} Salvar Alterações
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center p-10 text-slate-500">Não foi possível carregar o relatório.</div>
            )}
          </div>
          {/* Coluna Lateral - Workflow */}
          <div className="w-96 border-l bg-slate-50 p-6 flex flex-col overflow-y-auto">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-800"><FileSignature/> Fluxo de Assinatura</h3>
            <div className="space-y-4">
              <Step status={status} step="pending_tech" title="Fiscal Técnico" name={report?.tech_fiscal_name || document.technicalFiscal} signedAt={report?.tech_fiscal_signed_at} onSign={() => handleSignClick('technical')} canSign={canSignTech} />
              
              {hasAdmFiscal && (
                <Step status={status} step="pending_adm" title="Fiscal Administrativo" name={report?.adm_fiscal_name || document.administrativeFiscal} signedAt={report?.adm_fiscal_signed_at} onSign={() => handleSignClick('administrative')} canSign={canSignAdm} />
              )}
              
              <Step status={status} step="pending_manager" title="Gestor do Contrato" name={report?.manager_name || document.manager} signedAt={report?.manager_signed_at} onSign={() => handleSignClick('manager')} canSign={canSignManager} />
            </div>
            {status === 'completed' && <div className="mt-6 text-center bg-green-100 p-4 rounded-lg border border-green-200"><h4 className="font-bold text-green-800">Relatório Concluído!</h4><p className="text-xs text-green-700">Todas as assinaturas foram coletadas.</p></div>}
          </div>
        </div>

        {signingRole && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl shadow-xl w-80 border-2 border-blue-500 animate-fade-in">
              <h4 className="font-bold mb-4 flex gap-2"><Lock/> Confirmar Identidade</h4>
              <p className="text-xs text-slate-500 mb-4">Para validar sua assinatura, por favor, digite sua senha de acesso ao sistema.</p>
              <form onSubmit={confirmSign}>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded mb-4 focus:ring-2 focus:ring-blue-500 outline-none" autoFocus />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSigningRole(null)} className="flex-1 bg-slate-100 py-2 rounded font-medium hover:bg-slate-200">Cancelar</button>
                  <button type="submit" disabled={!password || isSigning} className="flex-1 bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50">
                    {isSigning ? <Loader2 className="animate-spin mx-auto"/> : "Assinar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Step = ({ status, step, title, name, signedAt, onSign, canSign }: { status: FiscalizationStatus, step: FiscalizationStatus, title: string, name: string, signedAt: string | null, onSign: () => void, canSign: boolean }) => {
    const isCompleted = !!signedAt;
    const isActive = status === step && !isCompleted;
    const isPending = !isActive && !isCompleted;
    
    let stateClass = 'border-slate-300 bg-slate-100 opacity-60';
    if (isActive) stateClass = 'border-blue-500 bg-blue-50 shadow-md';
    if (isCompleted) stateClass = 'border-green-500 bg-green-50';

    return (
        <div className={`p-4 rounded-lg border-l-4 transition-all ${stateClass}`}>
            <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">{title}</span>
                {isCompleted && <CheckCircle className="text-green-600" size={18}/>}
                {isActive && <Clock className="text-blue-600 animate-pulse" size={18}/>}
            </div>
            <p className="font-medium text-slate-800 truncate" title={name}>{name || 'Não definido'}</p>
            {isCompleted && <p className="text-xs text-slate-500 mt-1">Assinado em: {new Date(signedAt!).toLocaleString('pt-BR')}</p>}
            {isActive && canSign && (
                <button onClick={onSign} className="w-full mt-2 bg-white border border-blue-300 text-blue-600 text-xs font-bold py-1.5 rounded-lg hover:bg-blue-100 shadow-sm">
                    Assinar Agora
                </button>
            )}
        </div>
    );
};
