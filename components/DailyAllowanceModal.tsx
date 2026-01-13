import React, { useState, useEffect } from 'react';
import { DailyAllowance, UserProfile } from '../types';
import { uploadDailyAllowanceAttachment } from '../services/dailyAllowanceService';
import { X, Save, Check, FileText, AlertCircle, Loader2, Briefcase, CheckCircle2 } from 'lucide-react';
import { getUserPermissions } from '../utils/permissions';

interface DailyAllowanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    dailyAllowance: DailyAllowance | null;
    onSave: (data: DailyAllowance | Omit<DailyAllowance, 'id'>) => Promise<void>;
    isReadOnly: boolean;
    userProfile: UserProfile | null;
    initialTab?: 'solicitation' | 'payment' | 'accountability';
}

export const DailyAllowanceModal: React.FC<DailyAllowanceModalProps> = ({
    isOpen,
    onClose,
    dailyAllowance,
    onSave,
    isReadOnly: propIsReadOnly,
    userProfile,
    initialTab = 'solicitation'
}) => {
    const [formData, setFormData] = useState<Partial<DailyAllowance>>({
        beneficiaryName: '',
        beneficiaryRole: '',
        department: '',
        destination: '',
        missionDescription: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        totalValue: 0,
        status: 'requested',
        type: 'antecipated',
        notes: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<'solicitation' | 'payment' | 'accountability'>(initialTab);
    const [previewUrls, setPreviewUrls] = useState<{ solicitation?: string, accountability?: string }>({});
    const [showRejectionReason, setShowRejectionReason] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showTypeSelection, setShowTypeSelection] = useState(false);

    const handleFileUpload = async (file: File, type: 'solicitation' | 'accountability') => {
        setIsUploading(true);
        try {
            const folder = type === 'solicitation' ? 'solicitations' : 'accountability';
            const publicUrl = await uploadDailyAllowanceAttachment(file, folder);

            if (type === 'solicitation') {
                setFormData(prev => ({ ...prev, solicitationFileUrl: publicUrl }));
                setPreviewUrls(prev => ({ ...prev, solicitation: publicUrl }));
            } else {
                setFormData(prev => ({ ...prev, accountabilityFileUrl: publicUrl }));
                setPreviewUrls(prev => ({ ...prev, accountability: publicUrl }));

                // Auto-change status logic preserved
                const currentStatus = formData.status;
                let newStatus = currentStatus;
                if (['paid', 'accountability_rejected'].includes(currentStatus || '')) {
                    newStatus = 'accountability_analysis';
                }
                if (newStatus !== currentStatus) {
                    setFormData(prev => ({ ...prev, status: newStatus }));
                }
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao fazer upload do arquivo.');
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            // Reset previews when modal opens
            setPreviewUrls({});
            setShowSuccess(false);
            if (!dailyAllowance && initialTab === 'solicitation') {
                setShowTypeSelection(true);
            } else {
                setShowTypeSelection(false);
            }
        }
    }, [initialTab, isOpen, dailyAllowance]);

    useEffect(() => {
        if (dailyAllowance) {
            setFormData(dailyAllowance);
        } else {
            setFormData({
                beneficiaryName: '',
                beneficiaryRole: '',
                department: userProfile?.department || '',
                destination: '',
                missionDescription: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                totalValue: 0,
                status: 'requested',
                type: 'antecipated',
                notes: ''
            });
        }
    }, [dailyAllowance, isOpen]);

    const handleTypeSelect = (type: 'antecipated' | 'posteriori') => {
        setFormData(prev => ({ ...prev, type }));
        setShowTypeSelection(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'totalValue' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Auto-transition logic for Re-submission or First Submission of Accountability
            let finalData = { ...formData };
            if (!canManage) {
                if (finalData.status === 'rejected') {
                    finalData.status = 'requested'; // Resubmit solicitation
                    finalData.rejectionReason = ''; // Clear reason
                } else if (finalData.status === 'accountability_rejected') {
                    finalData.status = 'accountability_analysis'; // Resubmit accountability
                    finalData.feedback = ''; // Clear feedback
                } else if (finalData.accountabilityFileUrl) {
                    // Check if valid state for submission
                    if (finalData.type === 'antecipated' && finalData.status === 'paid') {
                        finalData.status = 'accountability_analysis';
                    } else if (finalData.type === 'posteriori' && finalData.status === 'requested') {
                        finalData.status = 'accountability_analysis';
                    }
                }
            }

            await onSave(finalData as DailyAllowance);
            setShowSuccess(true);
        } catch (error) {
            console.error('Failed to save daily allowance', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            alert(`Erro ao salvar diária: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Permission Logic - Standardized via Utility
    const permissions = getUserPermissions(userProfile);
    const canManage = permissions.daily_allowance?.manage || false;

    // Solicitation Data: Editable ONLY if creating new OR if it's a Manager acting on it OR if it was Rejected (for correction)
    const canEditSolicitation = !dailyAllowance || (canManage && dailyAllowance.status === 'requested') || (formData.status === 'rejected');

    // Status/Validation: Editable ONLY by Module Managers
    const canEditStatus = canManage;

    // Accountability: Restricted for Upfront (Antecipada) until Paid. ALWAYS open for Posteriori.
    const isAccountabilityBlocked = formData.type !== 'posteriori' && (formData.type === 'antecipated' && !['paid', 'accountability_approved', 'accountability_rejected'].includes(formData.status || ''));

    // Payment: Blocked for Posteriori until Accountability has files (Step 3 filled)
    const isPaymentBlocked = formData.type === 'posteriori' && !formData.accountabilityFileUrl;

    // User can edit accountability if:
    // 1. They are manager
    // 2. OR it's not approved/finalized AND not blocked
    // 3. AND (it's their turn: status is null, paid, or accountability_rejected)
    // Note: If accountability_rejected, user CAN edit to resubmit.
    const canEditAccountability = (canManage || (!['accountability_approved', 'accountability_analysis'].includes(dailyAllowance?.status || '') || formData.status === 'accountability_rejected')) && !isAccountabilityBlocked;

    useEffect(() => {
        if (!canManage && formData.status === 'rejected') {
            // UI logic handled in render
        }
    }, [formData.status, canManage]);

    if (!isOpen) return null;

    // Dynamic Steps based on Type
    const getSteps = () => {
        if (formData.type === 'posteriori') {
            return [
                { id: 1, key: 'solicitation', label: 'Solicitação' },
                { id: 2, key: 'accountability', label: 'Prestação' },
                { id: 3, key: 'payment', label: 'Pagamento' }
            ];
        }
        return [
            { id: 1, key: 'solicitation', label: 'Solicitação' },
            { id: 2, key: 'payment', label: 'Pagamento' },
            { id: 3, key: 'accountability', label: 'Prestação' }
        ];
    };

    const steps = getSteps();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className={`bg-white rounded-lg shadow-xl w-full max-w-3xl transition-all duration-300`}>
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800">
                        {dailyAllowance ? 'Gerenciar Diária & Prestação de Contas' : 'Nova Solicitação de Diária'}
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <X size={24} />
                    </button>
                </div>

                {showTypeSelection && !dailyAllowance ? (
                    <div className="p-10 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Qual o tipo da diária?</h3>
                            <p className="text-slate-500">Selecione para configurar o fluxo correto.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                            <button
                                onClick={() => handleTypeSelect('antecipated')}
                                className="group relative p-6 rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center text-center space-y-4"
                            >
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                    <FileText size={32} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-700">Antecipada</h4>
                                    <p className="text-sm text-slate-500 mt-1">Solicita → Recebe → Viaja → Presta Contas</p>
                                </div>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CheckCircle2 className="text-blue-500" />
                                </div>
                            </button>

                            <button
                                onClick={() => handleTypeSelect('posteriori')}
                                className="group relative p-6 rounded-2xl border-2 border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-all flex flex-col items-center text-center space-y-4"
                            >
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                    <Briefcase size={32} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800 group-hover:text-purple-700">Posterior</h4>
                                    <p className="text-sm text-slate-500 mt-1">Solicita → Presta Contas → Recebe + Aprova</p>
                                </div>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CheckCircle2 className="text-purple-500" />
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Interactive Stepper */}
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 hidden md:block">
                            <div className="flex items-center justify-between max-w-xl mx-auto">
                                {steps.map((step, idx, arr) => {
                                    const isActive = activeTab === step.key;

                                    // Block logic
                                    let isStepBlocked = false;
                                    if (step.key === 'accountability') isStepBlocked = isAccountabilityBlocked;
                                    if (step.key === 'payment') isStepBlocked = isPaymentBlocked;

                                    return (
                                        <React.Fragment key={step.id}>
                                            <button
                                                type="button"
                                                disabled={isStepBlocked}
                                                onClick={() => setActiveTab(step.key as any)}
                                                className={`flex flex-col items-center relative z-10 group focus:outline-none ${isStepBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${isActive ? 'bg-blue-600 text-white scale-110 shadow-md ring-4 ring-blue-100' : 'bg-white border-2 border-slate-200 text-slate-400 group-hover:border-blue-300 group-hover:text-blue-400'
                                                    }`}>
                                                    {step.id}
                                                </div>
                                                <span className={`text-xs font-semibold mt-2 transition-colors ${isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-blue-500'
                                                    }`}>
                                                    {step.label}
                                                </span>
                                            </button>
                                            {idx < arr.length - 1 && (
                                                <div className="flex-1 h-0.5 mx-4 bg-slate-200" />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="min-h-[400px]">

                                {/* STEP 1: Solicitation Data */}
                                {activeTab === 'solicitation' && (
                                    <div className="animate-in fade-in slide-in-from-left-4 duration-300 max-w-2xl mx-auto space-y-6">
                                        {formData.status === 'rejected' && formData.rejectionReason && (
                                            <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex items-start gap-3">
                                                <AlertCircle className="text-red-600 mt-1" size={20} />
                                                <div>
                                                    <h4 className="text-sm font-bold text-red-800">Solicitação Indeferida</h4>
                                                    <p className="text-sm text-red-700 mt-1">{formData.rejectionReason}</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 space-y-4">
                                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                Dados da Solicitação
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700 mb-1">Tipo</label>
                                                    <select
                                                        name="type"
                                                        value={formData.type || 'antecipated'}
                                                        onChange={handleChange}
                                                        disabled={!canEditSolicitation}
                                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                                                    >
                                                        <option value="antecipated">Antecipada</option>
                                                        <option value="posteriori">Posterior</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700 mb-1">Beneficiário</label>
                                                    <input
                                                        type="text"
                                                        name="beneficiaryName"
                                                        required
                                                        value={formData.beneficiaryName}
                                                        onChange={handleChange}
                                                        disabled={!canEditSolicitation}
                                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Destino</label>
                                                <input
                                                    type="text"
                                                    name="destination"
                                                    value={formData.destination}
                                                    onChange={handleChange}
                                                    disabled={!canEditSolicitation}
                                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                                                />
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="col-span-1">
                                                    <label className="block text-xs font-medium text-slate-700 mb-1">Banco</label>
                                                    <input
                                                        type="text"
                                                        name="bankName"
                                                        placeholder="Ex: BB"
                                                        value={formData.bankName || ''}
                                                        onChange={handleChange}
                                                        disabled={!canEditSolicitation}
                                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className="block text-xs font-medium text-slate-700 mb-1">Agência</label>
                                                    <input
                                                        type="text"
                                                        name="agency"
                                                        value={formData.agency || ''}
                                                        onChange={handleChange}
                                                        disabled={!canEditSolicitation}
                                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className="block text-xs font-medium text-slate-700 mb-1">Conta</label>
                                                    <input
                                                        type="text"
                                                        name="accountNumber"
                                                        value={formData.accountNumber || ''}
                                                        onChange={handleChange}
                                                        disabled={!canEditSolicitation}
                                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Arquivo da Solicitação</label>
                                                <div className="flex gap-2 items-center">
                                                    <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 ${!canEditSolicitation ? 'opacity-50' : ''}`}>
                                                        <span className="text-xs text-slate-600 truncate">
                                                            {isUploading ? 'Enviando...' : formData.solicitationFileUrl ? 'Alterar arquivo...' : 'Escolher arquivo...'}
                                                        </span>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    handleFileUpload(file, 'solicitation');
                                                                }
                                                            }}
                                                            disabled={!canEditSolicitation || isUploading}
                                                        />
                                                    </label>
                                                    {(previewUrls.solicitation || formData.solicitationFileUrl) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => window.open(previewUrls.solicitation || formData.solicitationFileUrl, '_blank')}
                                                            className="text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors whitespace-nowrap"
                                                        >
                                                            Visualizar
                                                        </button>
                                                    )}
                                                </div>
                                                {formData.solicitationFileUrl && !isUploading && <a href={formData.solicitationFileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline mt-1 block truncate">📎 Visualizar Arquivo</a>}
                                            </div>

                                            {/* Posteriori Guidance */}
                                            {formData.type === 'posteriori' && (
                                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                                                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-blue-800 text-sm">Diária Posterior</h4>
                                                        <p className="text-sm text-blue-700 mt-1">
                                                            Neste tipo de solicitação, você deve preencher também a aba <strong>3. Prestação</strong> com os comprovantes antes de salvar.
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveTab('accountability')}
                                                            className="mt-3 text-xs bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 font-bold shadow-sm transition-colors"
                                                        >
                                                            Ir para Prestação de Contas →
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* APPROVAL AREA (Manager Only) */}
                                        {canManage && dailyAllowance && (formData.status === 'requested' || formData.status === 'rejected') && (
                                            <div className={`mt-6 p-6 rounded-xl border transition-all duration-300 ${formData.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'}`}>

                                                {formData.status === 'rejected' ? (
                                                    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
                                                        <div className="flex items-center gap-2 text-red-800 font-bold">
                                                            <AlertCircle size={20} />
                                                            <h4>Motivo da Rejeição</h4>
                                                        </div>
                                                        <textarea
                                                            name="rejectionReason"
                                                            value={formData.rejectionReason || ''}
                                                            onChange={handleChange}
                                                            placeholder="Descreva o motivo da rejeição da solicitação..."
                                                            className="w-full p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm bg-white"
                                                            rows={3}
                                                            autoFocus
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData(prev => ({ ...prev, status: 'requested', rejectionReason: '' }))}
                                                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div>
                                                            <h4 className="font-bold text-blue-900">Aprovação da Solicitação</h4>
                                                            <p className="text-sm text-blue-700">Aprovar para prosseguir para a fase de Empenho e Pagamento.</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData(prev => ({ ...prev, status: 'rejected' }))}
                                                                className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-bold transition-colors"
                                                            >
                                                                Rejeitar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData(prev => ({ ...prev, status: 'approved', rejectionReason: '' }))}
                                                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm transition-colors flex items-center gap-2"
                                                            >
                                                                <Check size={18} /> Aprovar
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STEP 2: Management Area (Payment Flow) */}
                                {activeTab === 'payment' && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                        {['requested', 'rejected'].includes(formData.status || '') ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 opacity-60">
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                    <FileText size={32} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-700">Aguardando Aprovação</h3>
                                                    <p className="text-slate-500 max-w-xs mx-auto">
                                                        Esta solicitação precisa ser aprovada na etapa anterior para liberar o fluxo de pagamento.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
                                                <h3 className="text-lg font-bold text-slate-800 opacity-75 flex items-center gap-2 border-b border-slate-200 pb-4">
                                                    <FileText size={20} className="text-slate-400" /> Fluxo Financeiro
                                                </h3>

                                                {/* 1. Commitment (Empenho) */}
                                                <div className={`p-4 rounded-lg border transition-all ${(formData.status === 'approved' || formData.status === 'accountability_approved' || formData.status === 'committed' || formData.status === 'payment_ordered' || formData.status === 'paid')
                                                    ? 'bg-white border-slate-200 shadow-sm'
                                                    : 'bg-slate-100 border-transparent opacity-50'
                                                    }`}>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                                1. Empenho
                                                                {['committed', 'payment_ordered', 'paid'].includes(formData.status || '') && <Check size={16} className="text-green-500" />}
                                                            </h4>
                                                            <p className="text-xs text-slate-500">Registre o número do empenho para reservar o saldo.</p>
                                                        </div>
                                                        {(formData.status === 'approved' || formData.status === 'accountability_approved') && canManage && (
                                                            <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold uppercase">Atual</div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Nº Empenho"
                                                            className="flex-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={formData.commitmentNumber || ''}
                                                            onChange={e => setFormData({ ...formData, commitmentNumber: e.target.value })}
                                                            disabled={!canManage || (formData.status !== 'approved' && formData.status !== 'accountability_approved')}
                                                        />
                                                        {(formData.status === 'approved' || formData.status === 'accountability_approved') && canManage && (
                                                            <button
                                                                type="button"
                                                                disabled={!formData.commitmentNumber}
                                                                onClick={() => setFormData(prev => ({ ...prev, status: 'committed' }))}
                                                                className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
                                                            >
                                                                Lançar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 2. Payment Order (Ordem de Pagamento) */}
                                                <div className={`p-4 rounded-lg border transition-all ${(formData.status === 'committed' || formData.status === 'payment_ordered' || formData.status === 'paid')
                                                    ? 'bg-white border-slate-200 shadow-sm'
                                                    : 'bg-slate-100 border-transparent opacity-50'
                                                    }`}>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                                2. Ordem de Pagamento
                                                                {['payment_ordered', 'paid'].includes(formData.status || '') && <Check size={16} className="text-green-500" />}
                                                            </h4>
                                                            <p className="text-xs text-slate-500">Gere a ordem de pagamento para o financeiro.</p>
                                                        </div>
                                                        {formData.status === 'committed' && canManage && (
                                                            <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold uppercase">Atual</div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Nº Ordem Pagamento"
                                                            className="flex-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={formData.paymentOrderNumber || ''}
                                                            onChange={e => setFormData({ ...formData, paymentOrderNumber: e.target.value })}
                                                            disabled={!canManage || formData.status !== 'committed'}
                                                        />
                                                        {formData.status === 'committed' && canManage && (
                                                            <button
                                                                type="button"
                                                                disabled={!formData.paymentOrderNumber}
                                                                onClick={() => setFormData(prev => ({ ...prev, status: 'payment_ordered' }))}
                                                                className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
                                                            >
                                                                Lançar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 3. Payment Confirmation (Pagamento) */}
                                                <div className={`p-4 rounded-lg border transition-all ${(formData.status === 'payment_ordered' || formData.status === 'paid')
                                                    ? 'bg-green-50 border-green-200 shadow-sm'
                                                    : 'bg-slate-100 border-transparent opacity-50'
                                                    }`}>
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <h4 className="font-bold text-green-800 flex items-center gap-2">
                                                                3. Efetivação do Pagamento
                                                                {formData.status === 'paid' && <Check size={16} className="text-green-600" />}
                                                            </h4>
                                                            <p className="text-xs text-green-700">Confirmar que a transferência foi realizada.</p>
                                                        </div>
                                                        {formData.status === 'payment_ordered' && canManage && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData(prev => ({ ...prev, status: 'paid' }))}
                                                                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 shadow-sm flex items-center gap-2"
                                                            >
                                                                <Check size={18} /> Confirmar Pagamento
                                                            </button>
                                                        )}
                                                        {formData.status === 'paid' && (
                                                            <div className="bg-white px-4 py-2 rounded-lg border border-green-200 font-bold text-green-700 flex items-center gap-2">
                                                                <Check size={18} /> PAGO
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STEP 3: Accountability & Validation */}
                                {activeTab === 'accountability' && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                                        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                                            <h3 className="text-sm font-bold text-yellow-800 mb-4 flex items-center gap-2 border-b border-yellow-200 pb-2">
                                                <span className="w-2 h-2 rounded-full bg-yellow-600"></span>
                                                Prestação de Contas
                                            </h3>

                                            {isAccountabilityBlocked ? (
                                                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 opacity-60">
                                                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                                                        <AlertCircle size={32} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-yellow-800">Aguardando Pagamento</h3>
                                                        <p className="text-yellow-700 max-w-xs mx-auto">
                                                            A prestação de contas será liberada somente após a confirmação do pagamento.
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">Data Saída</label>
                                                            <input
                                                                type="date"
                                                                name="startDate"
                                                                value={formData.startDate?.split('T')[0]}
                                                                onChange={handleChange}
                                                                disabled={!canEditAccountability}
                                                                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">Data Retorno</label>
                                                            <input
                                                                type="date"
                                                                name="endDate"
                                                                value={formData.endDate?.split('T')[0]}
                                                                onChange={handleChange}
                                                                disabled={!canEditAccountability}
                                                                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-700 mb-1">Comprovantes da Viagem</label>
                                                        <div className="flex gap-2 items-center">
                                                            <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 ${!canEditAccountability ? 'opacity-50' : ''}`}>
                                                                <span className="text-xs text-slate-600 truncate">
                                                                    {isUploading ? 'Enviando...' : formData.accountabilityFileUrl ? 'Alterar comprovantes...' : 'Anexar comprovantes...'}
                                                                </span>
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            handleFileUpload(file, 'accountability');
                                                                        }
                                                                    }}
                                                                    disabled={!canEditAccountability || isUploading}
                                                                />
                                                            </label>
                                                            {(previewUrls.accountability || formData.accountabilityFileUrl) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => window.open(previewUrls.accountability || formData.accountabilityFileUrl, '_blank')}
                                                                    className="text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors whitespace-nowrap"
                                                                >
                                                                    Visualizar
                                                                </button>
                                                            )}
                                                        </div>


                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">Observações</label>
                                                            <textarea
                                                                name="notes"
                                                                rows={3}
                                                                value={formData.notes}
                                                                onChange={handleChange}
                                                                disabled={!canEditAccountability}
                                                                className="w-full p-2 border border-slate-300 rounded-lg text-sm resize-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>


                                        {/* Validation Area */}
                                        {((canManage && formData.accountabilityFileUrl) || formData.status === 'accountability_rejected' || formData.status === 'accountability_approved') && (
                                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                                                <h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-100 pb-2">
                                                    Situação da Prestação
                                                </h3>

                                                {/* 1. Rejection Feedback Display - ALWAYS VISIBLE if rejected */}
                                                {formData.status === 'accountability_rejected' && (
                                                    <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-start gap-3">
                                                        <AlertCircle className="text-red-600 mt-1" />
                                                        <div>
                                                            <h3 className="text-sm font-bold text-red-800">Prestação Rejeitada</h3>
                                                            <p className="text-sm text-red-700">{formData.feedback}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 2. Success Display */}
                                                {formData.status === 'accountability_approved' && (
                                                    <div className="bg-teal-50 p-4 rounded-lg border border-teal-200 flex items-center gap-3">
                                                        <Check className="text-teal-600" />
                                                        <h3 className="text-sm font-bold text-teal-800">Prestação de Contas APROVADA</h3>
                                                    </div>
                                                )}

                                                {/* 3. Validation Controls */}
                                                {canManage && canEditStatus && !['accountability_approved', 'committed', 'payment_ordered', 'paid'].includes(formData.status || '') && (
                                                    <>
                                                        {!showRejectionReason ? (
                                                            // Default View: Buttons only
                                                            <div className="flex gap-3 pt-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setFormData(prev => ({ ...prev, status: 'accountability_approved' }));
                                                                    }}
                                                                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2"
                                                                >
                                                                    <Check size={18} /> Aprovar
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowRejectionReason(true)}
                                                                    className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-lg font-bold flex items-center justify-center gap-2"
                                                                >
                                                                    <AlertCircle size={18} /> Rejeitar
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            // Rejection View: Input + Confirm
                                                            <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-3 bg-red-50 p-4 rounded-xl border border-red-100">
                                                                <div>
                                                                    <label className="block text-xs font-bold text-red-800 uppercase mb-2">Motivo da Rejeição (Obrigatório)</label>
                                                                    <textarea
                                                                        name="feedback"
                                                                        rows={3}
                                                                        placeholder="Descreva o motivo da rejeição para correção..."
                                                                        value={formData.feedback || ''}
                                                                        onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
                                                                        className="w-full p-2.5 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none bg-white"
                                                                        autoFocus
                                                                    />
                                                                </div>
                                                                <div className="flex gap-3">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowRejectionReason(false)}
                                                                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium text-sm hover:bg-slate-50"
                                                                    >
                                                                        Cancelar
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (!formData.feedback?.trim()) {
                                                                                alert('Por favor, informe o motivo da rejeição.');
                                                                                return;
                                                                            }
                                                                            setFormData(prev => ({ ...prev, status: 'accountability_rejected' }));
                                                                            setShowRejectionReason(false);
                                                                        }}
                                                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 text-sm"
                                                                    >
                                                                        <AlertCircle size={16} /> Confirmar Rejeição
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-200 mt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium shadow-sm transition-all disabled:opacity-70"
                                >
                                    {isSaving ? 'Salvando...' : <><Save size={16} /> Salvar Tudo</>}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>

            {showSuccess && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-[60] text-center animate-in fade-in zoom-in-95 duration-300 rounded-lg">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 animate-bounce">
                        <Check size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Processo Atualizado!</h2>
                    <p className="text-slate-500 max-w-sm mb-8 px-6">
                        As informações da diária e prestação de contas foram salvas com sucesso no sistema.
                    </p>
                    <button
                        onClick={onClose}
                        className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition-all active:scale-95 shadow-lg shadow-green-100"
                    >
                        Voltar para a Lista
                    </button>
                </div>
            )}
        </div>
    );
};
