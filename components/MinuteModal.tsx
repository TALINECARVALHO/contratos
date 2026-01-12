
import React, { useState, useEffect, useRef } from 'react';
import { Minute, UserProfile } from '../types';
import { calculateDays } from '../services/contractService';
import { FISCALIZATION_PERIODS } from '../constants';
import { X, Save, Calendar, Building, FileText, Briefcase, Users, Loader2, Lock, FileCheck, Clock, CalendarPlus, ArrowRight, ShieldCheck, CheckSquare, Square, Tag, AlertTriangle } from 'lucide-react';
import { FiscalizationHistory } from './FiscalizationHistory';
import { fetchDepartments, fetchMinuteTypes, DynamicSetting } from '../services/settingsService';

interface MinuteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (minute: Partial<Minute>) => Promise<void> | void;
  minute?: Minute | null;
  userProfile: UserProfile | null;
  isReadOnly?: boolean;
}

import { getUserPermissions } from '../utils/permissions';

export const MinuteModal: React.FC<MinuteModalProps> = ({ isOpen, onClose, onSave, minute, userProfile, isReadOnly: propIsReadOnly = false }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permission Logic
  const permissions = getUserPermissions(userProfile);
  const canManage = permissions.minutes?.manage || false;

  // Force ReadOnly
  const isReadOnly = propIsReadOnly || (!!minute && !canManage);

  const [dynamicDepts, setDynamicDepts] = useState<DynamicSetting[]>([]);
  const [dynamicTypes, setDynamicTypes] = useState<DynamicSetting[]>([]);
  const [paramError, setParamError] = useState<string | null>(null);

  const hasInitialized = useRef(false);

  const [formData, setFormData] = useState<Partial<Minute>>({
    id: '',
    minuteId: '',
    department: '',
    object: '',
    startDate: '',
    endDate: '',
    number: 0,
    year: new Date().getFullYear(),
    type: '',
    fiscalizationPeriod: 'monthly',
    processNumber: '',
    manager: '',
    technicalFiscal: '',
    administrativeFiscal: '',
    hasAdministrativeFiscal: true,
    renewalInfo: '',
    notes: '',
    manualStatus: 'automatic',
  });

  const [durationValue, setDurationValue] = useState<number | ''>('');
  const [durationUnit, setDurationUnit] = useState<'days' | 'months' | 'years'>('months');
  const [showRenewalTool, setShowRenewalTool] = useState(false);
  const [renewalDuration, setRenewalDuration] = useState<number | ''>(12);
  const [renewalUnit, setRenewalUnit] = useState<'days' | 'months' | 'years'>('months');

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
      if (date2.getDate() < date1.getDate()) months--;
      return Math.max(0, months);
    } catch (e) { return 0; }
  };

  useEffect(() => {
    if (isOpen) {
      const loadParams = async () => {
        setParamError(null);
        try {
          const [d, t] = await Promise.all([fetchDepartments(), fetchMinuteTypes()]);
          setDynamicDepts(d);
          setDynamicTypes(t);


        } catch (e: any) {
          setParamError(e.message || "Erro ao carregar parâmetros.");
        }
      };
      loadParams();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (minute) {
        setFormData({
          ...minute,
          type: minute.type || '',
          hasAdministrativeFiscal: minute.hasAdministrativeFiscal !== false
        });
      } else {
        setFormData({
          id: '',
          minuteId: '',
          department: (userProfile?.department && !canEditDepartment) ? userProfile.department : '',
          object: '',
          startDate: '',
          endDate: '',
          number: 0,
          year: new Date().getFullYear(),
          type: '',
          fiscalizationPeriod: 'monthly',
          processNumber: '',
          manager: '',
          technicalFiscal: '',
          administrativeFiscal: '',
          hasAdministrativeFiscal: true,
          renewalInfo: '',
          notes: '',
          manualStatus: 'automatic',
        });
      }
      setDurationValue('');
      setDurationUnit('months');
      setShowRenewalTool(false);
      hasInitialized.current = true;
    } else {
      hasInitialized.current = false;
    }
  }, [minute, isOpen, userProfile, canEditDepartment]);

  useEffect(() => {
    if (isReadOnly) return;

    if (formData.startDate && durationValue && durationValue > 0 && !showRenewalTool) {
      try {
        const parts = formData.startDate.split('/');
        if (parts.length === 3) {
          const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          const originalDay = date.getDate();
          if (durationUnit === 'days') date.setDate(date.getDate() + (durationValue as number));
          else if (durationUnit === 'months') {
            date.setMonth(date.getMonth() + (durationValue as number));
            if (date.getDate() !== originalDay) date.setDate(0);
          } else if (durationUnit === 'years') {
            date.setFullYear(date.getFullYear() + (durationValue as number));
            if (date.getDate() !== originalDay) date.setDate(0);
          }
          date.setDate(date.getDate() - 1);
          const newEndDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
          setFormData(prev => prev.endDate !== newEndDate ? { ...prev, endDate: newEndDate } : prev);
        }
      } catch (e) { }
    }

    // Lógica de Renovação Corrigida (Meses transcorridos)
    if (formData.startDate && formData.endDate && formData.startDate.length === 10 && formData.endDate.length === 10) {
      const monthsUsed = calculateMonthsUsed(formData.startDate, formData.endDate);
      const limit = 24;
      const monthsLeft = limit - monthsUsed;

      let info = "";
      if (monthsLeft > 0) {
        info = `JÁ SE PASSARAM ${monthsUsed} MESES. AINDA PODE RENOVAR POR MAIS ${monthsLeft} MESES (LIMITE DE ${limit} MESES).`;
      } else if (monthsLeft === 0) {
        info = `LIMITE DE ${limit} MESES ATINGIDO.`;
      } else {
        info = `PRAZO ATUAL (${monthsUsed} MESES) EXCEDE O LIMITE DE ${limit} MESES.`;
      }

      setFormData(prev => prev.renewalInfo !== info ? { ...prev, renewalInfo: info } : prev);
    }
  }, [formData.startDate, formData.endDate, durationValue, durationUnit, isReadOnly, showRenewalTool]);

  const handleApplyRenewal = () => {
    if (!formData.endDate || !renewalDuration || renewalDuration <= 0) return;
    try {
      const parts = formData.endDate.split('/');
      if (parts.length !== 3) return;
      const currentDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      const originalDay = currentDate.getDate();
      if (renewalUnit === 'days') currentDate.setDate(currentDate.getDate() + (renewalDuration as number));
      else if (renewalUnit === 'months') {
        currentDate.setMonth(currentDate.getMonth() + (renewalDuration as number));
        if (currentDate.getDate() !== originalDay) currentDate.setDate(0);
      } else if (renewalUnit === 'years') {
        currentDate.setFullYear(currentDate.getFullYear() + (renewalDuration as number));
        if (currentDate.getDate() !== originalDay) currentDate.setDate(0);
      }
      const newEndDate = `${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;
      const today = new Date().toLocaleDateString('pt-BR');
      const renewalNote = `\n[${today}] PRORROGAÇÃO: +${renewalDuration} ${renewalUnit.toUpperCase()}. NOVO VENCIMENTO: ${newEndDate}.`;
      setFormData(prev => ({ ...prev, endDate: newEndDate, notes: (prev.notes || '') + renewalNote }));
      setShowRenewalTool(false);
    } catch (e) { alert("Erro no cálculo."); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        minuteId: `${formData.number}/${formData.year}`,
      });
      onClose();
    } catch (error: any) {
      alert(error.message || "Erro desconhecido ao salvar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none uppercase placeholder:normal-case font-medium";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 sticky top-0 z-10 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 uppercase">
              <FileText className="text-purple-600" />
              {isReadOnly ? 'Detalhes' : (minute ? `Editar Ata ${minute.minuteId}` : 'Nova Ata')}
            </h2>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-2 text-slate-400 hover:text-red-600 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <div className="overflow-y-auto custom-scrollbar">
          {paramError && (
            <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 text-sm">
              <AlertTriangle className="shrink-0 mt-0.5" size={18} />
              <span>{paramError}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">1. Identificação</h3>
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
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2"><Tag size={14} className="text-slate-400" /> Tipo (Atas) *</label>
                  <select required disabled={isReadOnly} className={`${inputClass} bg-white`} value={formData.type || ''} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option value="">SELECIONE...</option>
                    {dynamicTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">2. Detalhes</h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-9">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Objeto *</label>
                  <input type="text" required disabled={isReadOnly} className={inputClass} value={formData.object} onChange={e => setFormData({ ...formData, object: e.target.value })} placeholder="DESCREVA O OBJETO DA ATA DE FORMA RESUMIDA..." />
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
                {!isReadOnly && minute && (
                  <button type="button" onClick={() => setShowRenewalTool(!showRenewalTool)} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold flex items-center gap-1 hover:bg-purple-200 transition-colors uppercase"><CalendarPlus size={12} /> {showRenewalTool ? 'Fechar' : 'Prorrogar'}</button>
                )}
              </h3>

              {showRenewalTool && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 animate-fade-in mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-3"><label className="block text-xs font-bold text-purple-700 uppercase mb-1">Adicionar Prazo</label><input type="number" className={`${inputClass} border-purple-200`} value={renewalDuration} onChange={e => setRenewalDuration(parseInt(e.target.value))} /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-purple-700 uppercase mb-1">Unidade</label><select className={`${inputClass} border-purple-200 bg-white`} value={renewalUnit} onChange={e => setRenewalUnit(e.target.value as any)}><option value="months">MESES</option><option value="days">DIAS</option></select></div>
                    <div className="md:col-span-4"><button type="button" onClick={handleApplyRenewal} className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold uppercase">Aplicar Renovação</button></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Início</label>
                  <input type="text" disabled={isReadOnly} placeholder="DD/MM/AAAA" className={inputClass} value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: applyDateMask(e.target.value) })} />
                </div>
                {!isReadOnly && !showRenewalTool && (
                  <>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Clock size={12} /> Duração</label><input type="number" placeholder="EX: 12" className={inputClass} value={durationValue} onChange={(e) => setDurationValue(e.target.value === '' ? '' : parseInt(e.target.value))} /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">&nbsp;</label><select className={`${inputClass} bg-slate-50`} value={durationUnit} onChange={(e) => setDurationUnit(e.target.value as any)}><option value="months">MESES</option><option value="days">DIAS</option></select></div>
                  </>
                )}
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Validade *</label>
                  <input type="text" disabled={isReadOnly} placeholder="DD/MM/AAAA" required className={`${inputClass} font-bold ${isReadOnly ? 'bg-slate-50 text-slate-500' : 'border-purple-300 bg-purple-50 text-purple-800'}`} value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: applyDateMask(e.target.value) })} />
                </div>
                {minute && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                    <select disabled={isReadOnly} className={`${inputClass} bg-white font-bold`} value={formData.manualStatus || 'automatic'} onChange={e => setFormData({ ...formData, manualStatus: e.target.value as any })}>
                      <option value="automatic">AUTOMÁTICO</option>
                      <option value="executed">EXECUTADA</option>
                      <option value="rescinded">RESCINDIDA</option>
                    </select>
                  </div>
                )}
                <div className="md:col-span-12">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    <FileCheck size={14} className="text-slate-400" /> Previsão de Renovação (Automático)
                  </label>
                  <div className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 min-h-[38px] flex items-center">
                    <span className="text-xs font-bold text-purple-800 uppercase tracking-tight">
                      {formData.renewalInfo || "PREENCHA AS DATAS PARA CALCULAR..."}
                    </span>
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
                  className={`text-[10px] px-3 py-1 rounded-full font-bold flex items-center gap-1 transition-colors uppercase ${formData.hasAdministrativeFiscal ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                >
                  {formData.hasAdministrativeFiscal ? <CheckSquare size={12} /> : <Square size={12} />}
                  Exige Fiscal ADM?
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gestor Responsável</label>
                  <input type="text" disabled={isReadOnly} className={inputClass} value={formData.manager} onChange={e => setFormData({ ...formData, manager: e.target.value })} placeholder="NOME DO GESTOR" />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fiscal Técnico</label>
                  <input type="text" disabled={isReadOnly} className={inputClass} value={formData.technicalFiscal} onChange={e => setFormData({ ...formData, technicalFiscal: e.target.value })} placeholder="NOME DO FISCAL TÉCNICO" />
                </div>
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


            {minute && minute.id && <FiscalizationHistory documentId={minute.id} />}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium uppercase text-xs">Cancelar</button>
              {!isReadOnly && <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-bold flex items-center gap-2 shadow-lg uppercase text-xs">{isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}Salvar Ata</button>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
