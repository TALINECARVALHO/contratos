
import React, { useState, useEffect, useRef } from 'react';
import { Contract, UserProfile } from '../types';
import { calculateDays } from '../services/contractService';
import { FISCALIZATION_PERIODS } from '../constants';
import { X, Save, Calendar, Building, FileText, User, Briefcase, Users, FileCheck, Loader2, Lock, Clock, Siren, CalendarPlus, ArrowRight, CheckSquare, Square, AlertTriangle, RefreshCw, Plus, Trash2, Info } from 'lucide-react';
import { FiscalizationHistory } from './FiscalizationHistory';
import { addDurationToDate, calculateDaysRemaining } from '../services/dateUtils';
import { fetchDepartments, fetchDocumentTypes, DynamicSetting } from '../services/settingsService';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contract: Partial<Contract>) => Promise<void> | void;
  contract?: Contract | null;
  userProfile: UserProfile | null;
  onNewAmendment?: () => void;
  onEditAmendment?: (amendment: any) => void;
  onDeleteAmendment?: (id: string) => Promise<void>;
  amendments?: any[];
  isReadOnly?: boolean;
}

import { getUserPermissions } from '../utils/permissions';

export const ContractModal: React.FC<ContractModalProps> = ({ isOpen, onClose, onSave, contract, userProfile, onNewAmendment, onEditAmendment, onDeleteAmendment, amendments = [], isReadOnly: propIsReadOnly = false }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Permission Logic
  const permissions = getUserPermissions(userProfile);
  const canManage = permissions.contracts?.manage || false;

  // Force ReadOnly if user cannot manage this module and it's an existing contract
  // (Viewers can only View)
  const isReadOnly = propIsReadOnly || (!!contract && !canManage);
  const [dynamicDepts, setDynamicDepts] = useState<DynamicSetting[]>([]);
  const [dynamicDocTypes, setDynamicDocTypes] = useState<DynamicSetting[]>([]);
  const [paramError, setParamError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Contract>>({
    id: '',
    contractId: '',
    department: '',
    object: '',
    supplier: '',
    startDate: '',
    endDate: '',
    number: 0,
    year: new Date().getFullYear(),
    type: '',
    fiscalizationPeriod: 'monthly',
    renewalInfo: '',
    processNumber: '',
    serviceOrderNumber: '',
    manager: '',
    technicalFiscal: '',
    administrativeFiscal: '',
    hasAdministrativeFiscal: true,
    notes: '',
    manualStatus: 'automatic',
    isEmergency: false,
  });

  const [durationValue, setDurationValue] = useState<number | ''>('');
  const [durationUnit, setDurationUnit] = useState<'days' | 'months' | 'years'>('months');
  const [durationError, setDurationError] = useState<string | null>(null);

  const canEditDepartment = canManage;

  // Máscara de Data DD/MM/AAAA
  const applyDateMask = (value: string) => {
    let v = value.replace(/\D/g, "").slice(0, 8);
    if (v.length >= 5) v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4, 8)}`;
    else if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    return v;
  };

  // Cálculo preciso de meses transcorridos
  const calculateMonthsUsed = (startStr: string, endStr: string) => {
    try {
      const [d1, m1, y1] = startStr.split('/').map(Number);
      const [d2, m2, y2] = endStr.split('/').map(Number);
      const date1 = new Date(y1, m1 - 1, d1);
      const date2 = new Date(y2, m2 - 1, d2);

      if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 0;

      let months = (date2.getFullYear() - date1.getFullYear()) * 12;
      months += date2.getMonth() - date1.getMonth();

      // Se o dia do vencimento for menor que o dia do início, subtrai um mês incompleto
      if (date2.getDate() < date1.getDate()) {
        months--;
      }

      return Math.max(0, months);
    } catch (e) { return 0; }
  };

  useEffect(() => {
    if (isOpen) {
      setShowSuccess(false);
      const loadParams = async () => {
        setParamError(null);
        try {
          const [d, dt] = await Promise.all([fetchDepartments(), fetchDocumentTypes()]);
          setDynamicDepts(d);
          setDynamicDocTypes(dt);

        } catch (e: any) {
          setParamError(e.message || "Erro ao carregar parâmetros.");
        }
      };
      loadParams();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (contract) {
        setFormData({
          ...contract,
          type: contract.type || '',
          hasAdministrativeFiscal: contract.hasAdministrativeFiscal !== false
        });
      } else {
        setFormData({
          id: '',
          contractId: '',
          department: (userProfile?.department && !canEditDepartment) ? userProfile.department : '',
          object: '',
          supplier: '',
          startDate: '',
          endDate: '',
          number: 0,
          year: new Date().getFullYear(),
          type: '',
          fiscalizationPeriod: 'monthly',
          renewalInfo: '',
          processNumber: '',
          serviceOrderNumber: '',
          manager: '',
          technicalFiscal: '',
          administrativeFiscal: '',
          hasAdministrativeFiscal: true,
          notes: '',
          manualStatus: 'automatic',
          isEmergency: false,
        });
        setDurationValue('');
        setDurationUnit('months');
      }
      setDurationError(null);
    }
  }, [contract, isOpen, userProfile, canEditDepartment]);

  // Auto-calculate End Date based on Start Date + Duration
  useEffect(() => {
    if (!isReadOnly && formData.startDate && formData.startDate.length === 10 && durationValue && durationValue > 0) {
      const newEndDate = addDurationToDate(formData.startDate, durationValue, durationUnit);
      if (newEndDate && newEndDate !== formData.endDate) {
        setFormData(prev => ({ ...prev, endDate: newEndDate }));
      }
    }
  }, [formData.startDate, durationValue, durationUnit, isReadOnly]);

  /* Logic for Preview End Date (Including Pending Amendments) */
  const previewEndDate = React.useMemo(() => {
    if (!formData.endDate) return "";
    const allTimeAmendments = amendments.filter(a =>
      String(a.contractId) === String(contract?.id) &&
      a.type === 'prazo'
      // No filter for checklist step8, includes everything
    );
    let date = formData.endDate;
    allTimeAmendments.forEach(a => {
      date = addDurationToDate(date, a.duration, a.durationUnit);
    });
    return date;
  }, [formData.endDate, amendments, contract?.id]);

  /* Logic for Confirmed End Date (Only Concluded) */
  const effectiveEndDate = React.useMemo(() => {
    if (!formData.endDate) return "";
    const concludedAmendments = amendments.filter(a =>
      String(a.contractId) === String(contract?.id) &&
      a.type === 'prazo' &&
      a.checklist?.step8 === true
    );
    let date = formData.endDate;
    concludedAmendments.forEach(a => {
      date = addDurationToDate(date, a.duration, a.durationUnit);
    });
    return date;
  }, [formData.endDate, amendments, contract?.id]);

  useEffect(() => {
    // Use Preview for calculations if available and different, otherwise effective
    const targetDate = previewEndDate || effectiveEndDate;

    if (formData.startDate && targetDate && formData.startDate.length === 10 && targetDate.length === 10) {
      const monthsUsed = calculateMonthsUsed(formData.startDate, targetDate);
      let limit = 60;
      if (formData.isEmergency) {
        limit = 12;
      } else {
        limit = monthsUsed < 60 ? 60 : 120;
      }

      const monthsLeft = limit - monthsUsed;

      let info = "";
      if (monthsLeft > 0) {
        info = `JÁ SE PASSARAM ${monthsUsed} MESES. AINDA PODE RENOVAR POR MAIS ${monthsLeft} MESES (LIMITE DE ${limit} MESES).`;
      } else if (monthsLeft === 0) {
        info = `LIMITE DE ${limit} MESES ATINGIDO.`;
      } else {
        info = `VIGÊNCIA ATUAL (${monthsUsed} MESES) EXCEDE O LIMITE PADRÃO DE ${limit} MESES.`;
      }

      setFormData(prev => prev.renewalInfo !== info ? { ...prev, renewalInfo: info } : prev);
    } else {
      if (formData.renewalInfo !== '') {
        setFormData(prev => ({ ...prev, renewalInfo: '' }));
      }
    }
  }, [formData.startDate, formData.endDate, effectiveEndDate, previewEndDate, durationValue, durationUnit, isReadOnly]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || durationError) return;
    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        contractId: `${formData.number}/${formData.year}`,
      });
      setShowSuccess(true);
    } catch (error: any) {
      alert(error.message || "Erro desconhecido ao salvar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  const isObra = formData.type === 'OBRAS';

  const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase placeholder:normal-case font-medium";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 sticky top-0 z-10 rounded-t-xl">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><FileText size={24} /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 uppercase">{isReadOnly ? 'Detalhes' : (contract ? `Editar ${contract.contractId}` : 'Novo Contrato')}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5 uppercase font-bold tracking-widest">Gestão Documental Direta</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} disabled={isSubmitting} className="p-2 text-slate-400 hover:text-red-600 rounded-full transition-colors"><X size={24} /></button>
          </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1">
          {paramError && (
            <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 text-sm">
              <AlertTriangle className="shrink-0 mt-0.5" size={18} />
              <span>{paramError}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">1. Identificação</h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Número *</label>
                  <input type="number" required disabled={isReadOnly} className={inputClass} value={formData.number} onChange={e => setFormData({ ...formData, number: parseInt(e.target.value) })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ano *</label>
                  <input type="number" required disabled={isReadOnly} className={inputClass} value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2"><Building size={14} className="text-slate-400" /> Secretaria *</label>
                  <select required disabled={!canEditDepartment || isReadOnly} className={`${inputClass} bg-white`} value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                    <option value="">SELECIONE...</option>
                    {dynamicDepts.map(dept => (<option key={dept.id} value={dept.name}>{dept.name}</option>))}
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Objeto *</label>
                  <select required disabled={isReadOnly} className={`${inputClass} bg-white`} value={formData.type || ''} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option value="">SELECIONE...</option>
                    {dynamicDocTypes.map(type => (<option key={type.id} value={type.name}>{type.name}</option>))}
                  </select>
                </div>
                {contract && amendments.length > 0 && (
                  <div className="md:col-span-12 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw size={14} className="text-blue-500" />
                      <span className="text-xs font-bold text-blue-700 uppercase">Status do Aditivo Atual:</span>
                    </div>
                    {(() => {
                      const contractAmendments = amendments.filter(a => String(a.contractId) === String(contract.id));
                      if (contractAmendments.length === 0) return <span className="text-xs text-slate-400 italic">SEM ADITIVOS</span>;
                      const latest = contractAmendments[contractAmendments.length - 1];
                      return (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase bg-white ${latest.status.includes('ASSINATURA') || latest.status.includes('PUBLICAÇÃO') ? 'text-green-700 border-green-200' :
                          latest.status.includes('PGM') ? 'text-orange-700 border-orange-200' :
                            'text-blue-700 border-blue-200'
                          }`}>
                          {latest.eventName}: {latest.status}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">2. Detalhes</h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-9">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fornecedor *</label>
                  <input type="text" required disabled={isReadOnly} className={inputClass} value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} placeholder="NOME DA EMPRESA OU PRESTADOR" />
                </div>
                <div className="md:col-span-3 flex items-end pb-1">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border w-full ${formData.isEmergency ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                    <input type="checkbox" id="isEmergency" disabled={isReadOnly} className="h-5 w-5 rounded border-slate-300 text-red-600" checked={!!formData.isEmergency} onChange={e => setFormData({ ...formData, isEmergency: e.target.checked })} />
                    <label htmlFor="isEmergency" className={`text-xs font-bold flex items-center gap-1 cursor-pointer uppercase ${formData.isEmergency ? 'text-red-700' : 'text-slate-600'}`}><Siren size={16} />Emergencial?</label>
                  </div>
                </div>

                <div className="md:col-span-9">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Objeto do Contrato *</label>
                  <input type="text" required disabled={isReadOnly} className={inputClass} value={formData.object} onChange={e => setFormData({ ...formData, object: e.target.value })} placeholder="DESCREVA O OBJETO DO CONTRATO DE FORMA RESUMIDA..." />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">N° Identificação/Ordem</label>
                  <input type="text" disabled={isReadOnly} className={inputClass} value={formData.processNumber} onChange={e => setFormData({ ...formData, processNumber: e.target.value })} placeholder="P/O OU PORTARIA" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2">
                <span>3. Vigência e Prazos</span>
              </h3>


              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Início</label>
                  <input type="text" disabled={isReadOnly} placeholder="DD/MM/AAAA" className={inputClass} value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: applyDateMask(e.target.value) })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duração</label>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    className={inputClass}
                    value={durationValue}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setDurationValue(isNaN(val) ? '' : val);
                    }}
                    placeholder="0"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unidade</label>
                  <select
                    disabled={isReadOnly}
                    className={`${inputClass} bg-white`}
                    value={durationUnit}
                    onChange={e => setDurationUnit(e.target.value as any)}
                  >
                    <option value="days">DIAS</option>
                    <option value="months">MESES</option>
                    <option value="years">ANOS</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vencimento Original *</label>
                  <input type="text" disabled={isReadOnly} placeholder="DD/MM/AAAA" required className={inputClass} value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: applyDateMask(e.target.value) })} />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    {previewEndDate !== effectiveEndDate ? 'Previsão (Aditivos)' : 'Vigência Atual'}
                  </label>
                  <div className={`relative flex items-center w-full px-3 py-2 border rounded-lg ${previewEndDate !== effectiveEndDate ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                    <Calendar size={16} className="mr-2 opacity-50" />
                    <span className="font-bold">{previewEndDate || formData.endDate || '-'}</span>
                    {previewEndDate !== effectiveEndDate && (
                      <span className="absolute -top-2 right-2 px-1.5 py-0.5 bg-amber-100 text-[9px] text-amber-700 font-bold rounded border border-amber-200 uppercase">
                        Em Análise
                      </span>
                    )}
                  </div>
                </div>

                {contract && (
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                    <select disabled={isReadOnly} className={`${inputClass} bg-white font-bold`} value={formData.manualStatus || 'automatic'} onChange={e => setFormData({ ...formData, manualStatus: e.target.value as any })}>
                      <option value="automatic">AUTOMÁTICO</option>
                      <option value="executed">EXECUTADO</option>
                      <option value="rescinded">RESCINDIDO</option>
                    </select>
                  </div>
                )}
                <div className="md:col-span-12">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                      <FileCheck size={14} className="text-slate-400" /> Previsão de Renovação (Automático)
                    </label>
                    <div className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 min-h-[38px] flex items-center">
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-tight">
                        {formData.renewalInfo || "PREENCHA AS DATAS PARA CALCULAR..."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">4. Responsáveis</h3>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hasAdministrativeFiscal: !formData.hasAdministrativeFiscal })}
                  className={`text-[10px] px-3 py-1 rounded-full font-bold flex items-center gap-1 transition-colors uppercase ${formData.hasAdministrativeFiscal ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}
                >
                  {formData.hasAdministrativeFiscal ? <CheckSquare size={12} /> : <Square size={12} />}
                  Exige Fiscal ADM?
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-4"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gestor do Contrato</label><input type="text" disabled={isReadOnly} className={inputClass} value={formData.manager} onChange={e => setFormData({ ...formData, manager: e.target.value })} placeholder="NOME DO GESTOR" /></div>
                <div className="md:col-span-4"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fiscal Técnico</label><input type="text" disabled={isReadOnly} className={inputClass} value={formData.technicalFiscal} onChange={e => setFormData({ ...formData, technicalFiscal: e.target.value })} placeholder="NOME DO FISCAL TÉCNICO" /></div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fiscal Administrativo</label>
                  <input
                    type="text"
                    disabled={isReadOnly || !formData.hasAdministrativeFiscal}
                    className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-400`}
                    value={formData.administrativeFiscal || ''}
                    onChange={e => setFormData({ ...formData, administrativeFiscal: e.target.value })}
                    placeholder={!formData.hasAdministrativeFiscal ? "NÃO EXIGIDO" : "NOME DO FISCAL"}
                  />
                </div>
              </div>
            </div>


            {/* {contract && contract.id && <FiscalizationHistory documentId={contract.id} />} */}

            {contract && (
              <div id="amendment-history" className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <RefreshCw size={16} className="text-blue-500" />
                    Histórico de Aditivos
                  </h3>
                  {onNewAmendment && !isReadOnly && (
                    <button
                      type="button"
                      onClick={onNewAmendment}
                      className="text-[10px] bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold flex items-center gap-1 hover:bg-blue-100 transition-colors uppercase"
                    >
                      <Plus size={12} /> Novo Aditivo
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {(() => {
                    let contractAmendments = amendments
                      .filter(a => String(a.contractId) === String(contract.id))
                      .sort((a, b) => {
                        // Sort by Entry Date (DD/MM/YYYY)
                        if (!a.entryDate || !b.entryDate) return 0;
                        const dateA = a.entryDate.split('/').reverse().join('-');
                        const dateB = b.entryDate.split('/').reverse().join('-');
                        return dateA.localeCompare(dateB);
                      });

                    if (contractAmendments.length === 0) {
                      return (
                        <div className="py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
                          <AlertTriangle size={24} className="mb-2 opacity-20" />
                          <p className="text-[10px] font-medium uppercase">Nenhum aditivo registrado.</p>
                        </div>
                      );
                    }

                    // Calculate cumulative dates
                    let runningDate = formData.endDate || "";

                    const amendmentsWithDates = contractAmendments.map(a => {
                      let newDate = "";
                      if (a.type === 'prazo' && runningDate) {
                        newDate = addDurationToDate(runningDate, a.duration, a.durationUnit);
                        runningDate = newDate; // Update running date for next amendment
                      }
                      return { ...a, calculatedEndDate: newDate };
                    });


                    return amendmentsWithDates.map((a: any) => (
                      <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-4 transition-all group hover:border-blue-300 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${a.type === 'prazo' ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'}`}>
                              {a.type}
                            </span>
                            <h5 className="font-bold text-slate-800 uppercase text-xs">{a.eventName}</h5>
                          </div>
                          <div className="flex gap-4 text-[10px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {a.entryDate}</span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {a.type === 'prazo' ? `${a.duration} ${a.durationUnit}(s)` : `R$ ${a.duration.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </span>

                            {a.type === 'prazo' && a.calculatedEndDate && (
                              <span className="flex items-center gap-1 text-teal-600 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                                <ArrowRight size={10} /> {a.calculatedEndDate}
                              </span>
                            )}

                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold ${a.status.includes('ASSINATURA') || a.status.includes('PUBLICAÇÃO') ? 'bg-green-50 text-green-700 border-green-100' :
                              a.status.includes('PGM') ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                'bg-blue-50 text-blue-700 border-blue-100'
                              }`}>
                              {a.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 transition-opacity">
                          {onEditAmendment && (
                            <button type="button" onClick={() => onEditAmendment(a)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar"><FileText size={16} /></button>
                          )}
                          {!isReadOnly && onDeleteAmendment && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  await onDeleteAmendment(a.id);
                                } catch (error: any) {
                                  alert("Erro ao excluir: " + error.message);
                                }
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="EXCLUIR ADITIVO (sem confirmação!)"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium uppercase text-xs">Cancelar</button>
              {!isReadOnly && <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-bold flex items-center gap-2 shadow-lg uppercase text-xs">{isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}Salvar Contrato</button>}
            </div>
          </form>
        </div>
      </div>

      {showSuccess && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-[60] text-center animate-in fade-in zoom-in-95 duration-300 rounded-xl">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6 animate-bounce">
            <CheckSquare size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Contrato Salvo!</h2>
          <p className="text-slate-500 max-w-sm mb-8 px-6">
            As informações do contrato foram atualizadas com sucesso no banco de dados.
          </p>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100 uppercase text-sm tracking-wide"
          >
            Voltar para a Lista
          </button>
        </div>
      )}
    </div>
  );
};
