import React, { useState, useEffect } from 'react';
import { X, Save, ClipboardList, CheckCircle2, RotateCcw, FileText, UserCheck, Send, Settings, Calendar, Scale } from 'lucide-react';
import { ContractAmendment, AmendmentChecklist, Contract, PGMAnalysis } from '../types';
import { addDurationToDate } from '../services/dateUtils';

interface AmendmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amendment: ContractAmendment | null;
    contracts: Contract[];
    onSave: (amendment: Partial<ContractAmendment>) => Promise<void>;
    fixedContractId?: string;
    isReadOnly?: boolean;
    userProfile?: { role: string } | null;
}

const DEFAULT_CHECKLIST: AmendmentChecklist = {
    step1: false,
    step2: false,
    step3: false,
    step4: null,
    step5: false,
    step6: false,
    step7: {
        grp: false,
        attachments: false,
        licitacon: false,
        purchaseOrder: false
    },
    step8: false
};

type Tab = 'details' | 'legal';

export const AmendmentModal: React.FC<AmendmentModalProps> = ({
    isOpen,
    onClose,
    amendment,
    contracts,
    onSave,
    fixedContractId,
    isReadOnly,
    userProfile
}) => {
    const [formData, setFormData] = useState<Partial<ContractAmendment>>({
        contractId: '',
        type: 'prazo',
        duration: 0,
        durationUnit: 'dia',
        eventName: '',
        entryDate: '',
        status: 'ELABORANDO',
        checklist: { ...DEFAULT_CHECKLIST }
    });
    const [isSaving, setIsSaving] = useState(false);
    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
    const isPGM = userProfile?.role === 'pgm';
    const isManager = userProfile?.role === 'manager';

    useEffect(() => {
        if (amendment) {
            setFormData({
                ...amendment,
                checklist: { ...DEFAULT_CHECKLIST, ...amendment.checklist },
                folderLink: amendment.folderLink || '',
                contractsSectorNotes: amendment.contractsSectorNotes || '',
                pgmNotes: amendment.pgmNotes || '',
                pgmDecision: amendment.pgmDecision || null
            });
        } else {
            setFormData({
                contractId: fixedContractId || '',
                type: 'prazo',
                duration: 0,
                durationUnit: 'dia',
                eventName: '',
                entryDate: new Date().toLocaleDateString('pt-BR'),
                status: 'ELABORANDO',
                checklist: { ...DEFAULT_CHECKLIST, step1: true },
                folderLink: '',
                contractsSectorNotes: '',
                pgmNotes: '',
                pgmDecision: null
            });
        }
    }, [amendment, isOpen, fixedContractId]);

    const calculateNewEndDate = (baseDate: string, duration: number, unit: string): string => {
        return addDurationToDate(baseDate, duration, unit);
    };

    const calculateStatus = (checklist: AmendmentChecklist): string => {
        if (checklist.step8) return 'CONCLUÍDO';

        const step7Complete = checklist.step7.grp && checklist.step7.attachments &&
            checklist.step7.licitacon && checklist.step7.purchaseOrder;

        if (step7Complete) return 'PUBLICAÇÃO';
        if (checklist.step6) return 'ASSINATURA DO PREFEITO';

        if (checklist.step5) return 'ENVIADO PARA FORNECEDOR ASSINAR';

        if (checklist.step4 === 'approved') return 'À ENVIAR PARA ASSINATURA';
        if (checklist.step4 === 'approved_with_reservation') return 'AJUSTES NECESSÁRIOS';
        if (checklist.step4 === 'rejected') return 'REPROVADO PGM';

        if (checklist.step3) return 'ANÁLISE PGM';

        return 'ELABORANDO';
    };

    const updateChecklist = (updates: Partial<AmendmentChecklist> | { step7: Partial<AmendmentChecklist['step7']> }) => {
        if (isReadOnly) return;

        const newChecklist = { ...formData.checklist } as AmendmentChecklist;

        if ('step7' in updates) {
            newChecklist.step7 = { ...newChecklist.step7, ...updates.step7 };
        } else {
            Object.assign(newChecklist, updates);
        }

        const newStatus = calculateStatus(newChecklist);
        setFormData(prev => ({ ...prev, checklist: newChecklist, status: newStatus }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.contractId) {
            alert("Selecione um contrato.");
            return;
        }
        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error: any) {
            alert("Erro ao salvar aditivo: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in border border-slate-200">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${amendment ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-slate-800">
                                {amendment ? 'Editar Aditivo de Contrato' : 'Novo Aditivo de Contrato'}
                            </h3>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                                Status Atual: <span className="text-blue-600 font-black">{formData.status}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="text-slate-400" />
                    </button>
                </div>

                {/* Main Content - Unified Scrollable Area */}
                <form onSubmit={handleSave} className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                            <div className="md:col-span-4 min-w-0">
                                {!fixedContractId && !amendment?.contractId ? (
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Contrato Base</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                            value={formData.contractId}
                                            onChange={e => setFormData({ ...formData, contractId: e.target.value })}
                                            disabled={isReadOnly || !!amendment}
                                            required
                                        >
                                            <option value="">Selecione um contrato</option>
                                            {contracts.map(c => (
                                                <option key={c.id} value={c.id}>[{c.contractId}] {c.supplier} - {c.object.substring(0, 40)}...</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Contrato Vinculado</label>
                                        <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-600 font-bold uppercase text-[10px] flex items-center gap-2 h-11">
                                            <FileText size={14} className="text-blue-500" />
                                            <span className="truncate">
                                                {(() => {
                                                    const c = contracts.find(ct => String(ct.id) === String(fixedContractId || amendment?.contractId));
                                                    return c ? `${c.contractId} - ${c.supplier}` : 'Carregando...';
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-2 min-w-0">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Evento</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 5º ADITIVO"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium uppercase"
                                        value={formData.eventName}
                                        onChange={e => setFormData({ ...formData, eventName: e.target.value.toUpperCase() })}
                                        disabled={isReadOnly}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 min-w-0">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Data de Entrada</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="DD/MM/AAAA"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                            value={formData.entryDate}
                                            onChange={e => setFormData({ ...formData, entryDate: e.target.value })}
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 min-w-0">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tipo do Aditivo</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as 'prazo' | 'valor' })}
                                        disabled={isReadOnly || !!amendment}
                                    >
                                        <option value="prazo">PRAZO</option>
                                        <option value="valor">VALOR</option>
                                    </select>
                                </div>
                            </div>

                            <div className="md:col-span-2 min-w-0">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Alteração ({formData.type === 'prazo' ? 'Tempo' : 'Valor'})</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium min-w-0"
                                            value={formData.duration}
                                            onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
                                            disabled={isReadOnly}
                                        />
                                        {formData.type === 'prazo' && (
                                            <select
                                                className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
                                                value={formData.durationUnit}
                                                onChange={e => setFormData({ ...formData, durationUnit: e.target.value as any })}
                                                disabled={isReadOnly}
                                            >
                                                <option value="dia">Dias</option>
                                                <option value="mes">Meses</option>
                                                <option value="ano">Anos</option>
                                            </select>
                                        )}
                                    </div>

                                    {/* Calculated Date Display */}
                                    {formData.type === 'prazo' && formData.duration > 0 && (() => {
                                        const selectedContract = contracts.find(c => String(c.id) === String(fixedContractId || formData.contractId));
                                        if (selectedContract?.endDate) {
                                            const newDate = calculateNewEndDate(selectedContract.endDate, formData.duration, formData.durationUnit);
                                            return (
                                                <div className="mt-2 text-xs font-bold text-slate-500 flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                                                    <span>NOVA VIGÊNCIA:</span>
                                                    <span className="text-blue-700 text-sm">{newDate}</span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>

                            </div>


                        </div>


                        {/* Checklist Section - Hidden for PGM */}
                        {!isPGM && (
                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    Fluxo e Check List Administrativo
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                    <CheckItem
                                        label="1. Criação do Processo"
                                        checked={formData.checklist?.step1 || false}
                                        onChange={v => updateChecklist({ step1: v })}
                                        disabled={isReadOnly || userProfile?.role === 'pgm'}
                                    />
                                    <CheckItem
                                        label="2. Elaboração / Minuta"
                                        checked={formData.checklist?.step2 || false}
                                        onChange={v => updateChecklist({ step2: v })}
                                        disabled={isReadOnly || userProfile?.role === 'pgm'}
                                    />
                                    <CheckItem
                                        label="3. Enviado para PGM (Análise)"
                                        checked={formData.checklist?.step3 || false}
                                        onChange={v => updateChecklist({ step3: v })}
                                        disabled={isReadOnly || userProfile?.role === 'pgm'}
                                        icon={<Send size={14} />}
                                    />

                                    {/* Step 4: Visualização Informativa com Opção de Reenvio */}
                                    <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200/50">
                                        <div className="flex items-center gap-2">
                                            <Scale size={14} className="text-slate-400" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">4. Retorno PGM</span>
                                            {formData.checklist?.step4 && <CheckCircle2 size={14} className="text-green-500 ml-auto" />}
                                        </div>
                                        <div className={`text-[10px] font-bold uppercase italic ${formData.checklist?.step4 === 'approved' ? 'text-green-600' :
                                            formData.checklist?.step4 === 'rejected' ? 'text-red-600' :
                                                formData.checklist?.step4 === 'approved_with_reservation' ? 'text-orange-600' :
                                                    'text-blue-600'
                                            }`}>
                                            {formData.checklist?.step4 === 'approved' && '✓ APROVADO'}
                                            {formData.checklist?.step4 === 'rejected' && '✕ REPROVADO'}
                                            {formData.checklist?.step4 === 'approved_with_reservation' && '⚠ COM RESSALVA'}
                                            {!formData.checklist?.step4 && 'AGUARDANDO ANÁLISE'}
                                        </div>

                                        {/* Botão de Reenvio para Processos Reprovados */}
                                        {formData.checklist?.step4 === 'rejected' && !isReadOnly && userProfile?.role !== 'pgm' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const historyEntry: PGMAnalysis = {
                                                        date: new Date().toLocaleDateString('pt-BR'),
                                                        notes: formData.pgmNotes || '',
                                                        decision: formData.pgmDecision as any
                                                    };

                                                    const newChecklist = { ...formData.checklist, step4: null } as AmendmentChecklist;
                                                    const newStatus = calculateStatus(newChecklist);

                                                    setFormData({
                                                        ...formData,
                                                        checklist: newChecklist,
                                                        status: newStatus,
                                                        pgmDecision: null,
                                                        pgmNotes: '',
                                                        pgmHistory: [...(formData.pgmHistory || []), historyEntry]
                                                    });
                                                }}
                                                className="mt-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-all shadow-sm"
                                            >
                                                <RotateCcw size={14} />
                                                Resetar e Reenviar para PGM
                                            </button>
                                        )}
                                    </div>

                                    <CheckItem
                                        label="5. Assinatura do Fornecedor"
                                        checked={formData.checklist?.step5 || false}
                                        onChange={v => updateChecklist({ step5: v })}
                                        disabled={isReadOnly || userProfile?.role === 'pgm'}
                                        icon={<UserCheck size={14} />}
                                    />

                                    <CheckItem
                                        label="6. Assinatura do Prefeito"
                                        checked={formData.checklist?.step6 || false}
                                        onChange={v => updateChecklist({ step6: v })}
                                        disabled={isReadOnly || userProfile?.role === 'pgm'}
                                        icon={<Settings size={14} />}
                                    />

                                    <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                                            7. Lançamentos Administrativos
                                            {formData.checklist?.step7?.grp && formData.checklist?.step7?.attachments && formData.checklist?.step7?.licitacon && formData.checklist?.step7?.purchaseOrder && <CheckCircle2 size={16} className="text-green-500" />}
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <CheckItem dense label="GRP" checked={formData.checklist?.step7?.grp || false} onChange={v => updateChecklist({ step7: { grp: v } })} disabled={isReadOnly || userProfile?.role === 'pgm'} />
                                            <CheckItem dense label="Anexos" checked={formData.checklist?.step7?.attachments || false} onChange={v => updateChecklist({ step7: { attachments: v } })} disabled={isReadOnly || userProfile?.role === 'pgm'} />
                                            <CheckItem dense label="LicitaCon" checked={formData.checklist?.step7?.licitacon || false} onChange={v => updateChecklist({ step7: { licitacon: v } })} disabled={isReadOnly || userProfile?.role === 'pgm'} />
                                            <CheckItem dense label="Ordem Compra" checked={formData.checklist?.step7?.purchaseOrder || false} onChange={v => updateChecklist({ step7: { purchaseOrder: v } })} disabled={isReadOnly || userProfile?.role === 'pgm'} />
                                        </div>
                                    </div>
                                    <CheckItem
                                        label="8. Assinatura das Testemunhas"
                                        checked={formData.checklist?.step8 || false}
                                        onChange={v => updateChecklist({ step8: v })}
                                        disabled={isReadOnly || userProfile?.role === 'pgm'}
                                    />
                                </div>
                            </div>
                        )}


                        {/* Seção de Comunicação com PGM */}
                        <div className="space-y-6 pt-6 border-t-2 border-purple-200">
                            {/* Folder Link and PGM Info moved here */}
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Link da Pasta</label>
                                    <input
                                        type="url"
                                        placeholder="https://cloud.com/..."
                                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
                                        value={formData.folderLink || ''}
                                        onChange={e => setFormData({ ...formData, folderLink: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <Send size={14} className="text-blue-500" />
                                        Informações para Procuradoria (PGM)
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Descreva o que deve ser analisado pela PGM..."
                                        className="w-full bg-blue-50/50 border border-blue-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm resize-none"
                                        value={formData.contractsSectorNotes || ''}
                                        onChange={e => setFormData({ ...formData, contractsSectorNotes: e.target.value })}
                                        disabled={isReadOnly || userProfile?.role === 'pgm'}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-4 mt-6">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Scale size={20} className="text-purple-600" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                    Tramitação Jurídica (PGM)
                                </h3>
                            </div>


                            {/* Activity/Comments Feed */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                    <h4 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                                        <Scale size={16} className="text-purple-600" />
                                        Comentários e atividade
                                    </h4>
                                    <button
                                        type="button"
                                        className="text-xs font-medium text-slate-500 hover:text-slate-700"
                                        disabled
                                    >
                                        Mostrar Detalhes
                                    </button>
                                </div>

                                {/* History List */}
                                <div className="max-h-[300px] overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar">
                                    {(!formData.pgmHistory || formData.pgmHistory.length === 0) && (
                                        <p className="text-center text-slate-400 text-xs py-4">Nenhuma atividade registrada.</p>
                                    )}
                                    {formData.pgmHistory?.map((entry, idx) => (
                                        <div key={idx} className="flex gap-3">
                                            <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${entry.analyst ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {entry.analyst ? entry.analyst.substring(0, 2).toUpperCase() : 'CT'}
                                            </div>
                                            <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div>
                                                        <span className="font-bold text-sm text-slate-700 mr-2">{entry.analyst || 'Contratos'}</span>
                                                        <span className="text-xs text-slate-400">{entry.date}</span>
                                                    </div>
                                                    {entry.decision && entry.decision !== 'comment' && (
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${entry.decision === 'approved' ? 'bg-green-100 text-green-700' :
                                                            entry.decision === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                'bg-orange-100 text-orange-700'
                                                            }`}>
                                                            {entry.decision === 'approved' ? 'APROVADO' :
                                                                entry.decision === 'rejected' ? 'REPROVADO' : 'RESSALVA'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-slate-600 text-sm whitespace-pre-wrap">{entry.notes}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Comment Input */}
                                <div className="p-4 bg-white border-t border-slate-100">
                                    <div className="flex gap-3">
                                        <textarea
                                            rows={1}
                                            placeholder="Escrever um comentário..."
                                            className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium text-sm resize-none"
                                            value={formData.pgmNotes || ''}
                                            onChange={e => setFormData({ ...formData, pgmNotes: e.target.value })}
                                            disabled={isReadOnly && userProfile?.role !== 'pgm' && userProfile?.role !== 'manager'}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    // Add comment logic here if needed, but we have a button below
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <div className="flex gap-2">
                                            {/* Manager Buttons ??? */}
                                        </div>
                                        <div className="flex gap-2">
                                            {/* Post Comment Only Button */}
                                            {formData.pgmNotes && (
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        const historyEntry: PGMAnalysis = {
                                                            date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                                            notes: formData.pgmNotes || '',
                                                            decision: 'comment',
                                                            analyst: userProfile?.name || 'Usuário'
                                                        };

                                                        const updatedFormData = {
                                                            ...formData,
                                                            pgmNotes: '',
                                                            pgmHistory: [...(formData.pgmHistory || []), historyEntry]
                                                        };

                                                        setFormData(updatedFormData);

                                                        // Quick Save (sem fechar modal)
                                                        try {
                                                            await onSave(updatedFormData);
                                                        } catch (err) {
                                                            console.error("Erro ao salvar comentário:", err);
                                                            alert("Erro ao enviar comentário.");
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors"
                                                >
                                                    COMENTAR
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons (PGM Only) */}
                                    {(userProfile?.role === 'pgm' || isAdmin) && (
                                        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const historyEntry: PGMAnalysis = {
                                                        date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                                        notes: formData.pgmNotes || '',
                                                        decision: 'approved',
                                                        analyst: userProfile?.name || 'PGM'
                                                    };

                                                    const newChecklist = { ...formData.checklist } as AmendmentChecklist;
                                                    newChecklist.step4 = 'approved';
                                                    newChecklist.step3 = false; // Sai da lista de análise

                                                    const updatedFormData = {
                                                        ...formData,
                                                        pgmDecision: 'approved' as const,
                                                        pgmNotes: '',
                                                        checklist: newChecklist,
                                                        pgmHistory: [...(formData.pgmHistory || []), historyEntry]
                                                    };

                                                    const newStatus = calculateStatus(updatedFormData.checklist);
                                                    updatedFormData.status = newStatus;

                                                    setFormData(updatedFormData);

                                                    // Quick Save
                                                    try {
                                                        await onSave(updatedFormData);
                                                    } catch (err) {
                                                        console.error("Erro ao aprovar:", err);
                                                        alert("Erro ao salvar aprovação.");
                                                    }
                                                }}
                                                className={`text-xs py-2 rounded-lg border transition-all font-bold ${formData.pgmDecision === 'approved' ? 'bg-green-600 text-white border-green-600 shadow-sm' : 'bg-white text-green-700 border-green-200 hover:bg-green-50'}`}
                                            >
                                                APROVAR
                                            </button>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const historyEntry: PGMAnalysis = {
                                                        date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                                        notes: formData.pgmNotes || 'Reprovado',
                                                        decision: 'rejected',
                                                        analyst: userProfile?.name || 'PGM'
                                                    };

                                                    const newChecklist = { ...formData.checklist } as AmendmentChecklist;
                                                    newChecklist.step4 = 'rejected';
                                                    newChecklist.step3 = false;

                                                    const updatedFormData = {
                                                        ...formData,
                                                        pgmDecision: 'rejected' as const,
                                                        pgmNotes: '',
                                                        checklist: newChecklist,
                                                        pgmHistory: [...(formData.pgmHistory || []), historyEntry]
                                                    };

                                                    const newStatus = calculateStatus(updatedFormData.checklist);
                                                    updatedFormData.status = newStatus;

                                                    setFormData(updatedFormData);

                                                    try {
                                                        await onSave(updatedFormData);
                                                    } catch (err) {
                                                        console.error("Erro ao reprovar:", err);
                                                        alert("Erro ao salvar reprovação.");
                                                    }
                                                }}
                                                className={`text-xs py-2 rounded-lg border transition-all font-bold ${formData.pgmDecision === 'rejected' ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-white text-red-700 border-red-200 hover:bg-red-50'}`}
                                            >
                                                REPROVAR
                                            </button>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const historyEntry: PGMAnalysis = {
                                                        date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                                        notes: formData.pgmNotes || '',
                                                        decision: 'approved_with_reservation',
                                                        analyst: userProfile?.name || 'PGM'
                                                    };

                                                    const newChecklist = { ...formData.checklist } as AmendmentChecklist;
                                                    newChecklist.step4 = 'approved_with_reservation';
                                                    newChecklist.step3 = false;

                                                    const updatedFormData = {
                                                        ...formData,
                                                        pgmDecision: 'approved_with_reservation' as const,
                                                        pgmNotes: '',
                                                        checklist: newChecklist,
                                                        pgmHistory: [...(formData.pgmHistory || []), historyEntry]
                                                    };

                                                    const newStatus = calculateStatus(updatedFormData.checklist);
                                                    updatedFormData.status = newStatus;

                                                    setFormData(updatedFormData);

                                                    try {
                                                        await onSave(updatedFormData);
                                                    } catch (err) {
                                                        console.error("Erro ao salvar ressalva:", err);
                                                        alert("Erro ao salvar ressalva.");
                                                    }
                                                }}
                                                className={`text-xs py-2 rounded-lg border transition-all font-bold ${formData.pgmDecision === 'approved_with_reservation' ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-white text-orange-700 border-orange-200 hover:bg-orange-50'}`}
                                            >
                                                COM RESSALVA
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Footer Actions */}
                    <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 font-bold transition-all"
                        >
                            CANCELAR
                        </button>
                        {!isReadOnly && (
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                                {isSaving ? <RotateCcw size={18} className="animate-spin" /> : <Save size={18} />}
                                {amendment ? 'ATUALIZAR ADITIVO' : 'CRIAR ADITIVO'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

const CheckItem = ({ label, checked, onChange, disabled, icon, dense }: { label: string, checked: boolean, onChange: (v: boolean) => void, disabled?: boolean, icon?: React.ReactNode, dense?: boolean }) => (
    <label className={`flex items-center gap-3 cursor-pointer group transition-all ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${dense ? 'py-1' : 'py-2'}`}>
        <div className="relative">
            <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={e => !disabled && onChange(e.target.checked)}
                disabled={disabled}
            />
            <div className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center ${checked ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                {checked && <CheckCircle2 size={16} className="text-white" />}
            </div>
        </div>
        <span className={`${dense ? 'text-xs' : 'text-sm'} font-medium text-slate-700 group-hover:text-blue-600 transition-colors flex items-center gap-2`}>
            {icon} {label}
        </span>
    </label>
);

const PGMHistoryView = ({ history }: { history: PGMAnalysis[] }) => {
    if (!history || history.length === 0) return null;
    return (
        <div className="mb-6 space-y-3 border-b border-purple-200 pb-6">
            <h4 className="text-xs font-bold text-purple-700/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Scale size={14} />
                Histórico de Análises
            </h4>
            {history.map((entry, idx) => (
                <div key={idx} className="bg-white border border-purple-100 rounded-lg p-4 text-sm shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-500 text-xs">{entry.date}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${entry.decision === 'approved' ? 'bg-green-100 text-green-700' :
                            entry.decision === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-orange-100 text-orange-700'
                            }`}>
                            {entry.decision === 'approved' ? 'APROVADO' :
                                entry.decision === 'rejected' ? 'REPROVADO' : 'COM RESSALVA'}
                        </span>
                    </div>
                    <p className="text-slate-600 whitespace-pre-wrap text-xs italic">"{entry.notes}"</p>
                </div>
            ))}
        </div>
    );
};
