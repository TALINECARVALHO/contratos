import React, { useState } from 'react';
import { SupplementationRequest } from '../types';
import { approveSupplementation, rejectSupplementation, addDecreeToSupplementation, toggleItemVerification } from '../services/supplementationService';
import { X, Check, XCircle, FileText, AlertCircle, Loader2, Edit2 } from 'lucide-react';

interface SupplementationDetailsModalProps {
    request: SupplementationRequest;
    onClose: () => void;
    onUpdate: () => void;
    canManage: boolean;
    onEdit?: (request: SupplementationRequest) => void;
}

export const SupplementationDetailsModal: React.FC<SupplementationDetailsModalProps> = ({ request, onClose, onUpdate, canManage, onEdit }) => {
    const [action, setAction] = useState<'approve' | 'reject' | 'decree' | null>(null);
    const [decreeNumber, setDecreeNumber] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    // Initialize checks from DB
    React.useEffect(() => {
        const initialChecks: Record<string, boolean> = {};
        request.items.forEach((item, idx) => {
            if (item.verified) {
                const key = item.id || `${item.type === 'addition' ? 'add' : 'red'}-${idx}`;
                initialChecks[key] = true;
            }
        });
        setCheckedItems(initialChecks);
    }, [request.items]);

    const toggleCheck = async (id: string | undefined, idx: number, type: 'add' | 'red') => {
        const key = id || `${type}-${idx}`;
        const newState = !checkedItems[key];

        // Optimistic update
        setCheckedItems(prev => ({ ...prev, [key]: newState }));

        if (id) {
            try {
                await toggleItemVerification(id, newState);
            } catch (err) {
                console.error(err);
                setCheckedItems(prev => ({ ...prev, [key]: !newState })); // Revert on error
            }
        }
    };

    const formatCurrency = (val: number | undefined) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    const handleAction = async (explicitAction?: 'approve' | 'reject' | 'decree') => {
        const currentAction = explicitAction || action;

        setIsSubmitting(true);
        try {
            if (currentAction === 'approve') {
                // First step: Approve Merit (Deferir)
                await approveSupplementation(request.id);
            } else if (currentAction === 'decree') {
                // Second step: Add Decree
                if (!decreeNumber) {
                    alert('Por favor, informe o número do decreto.');
                    setIsSubmitting(false);
                    return;
                }
                await addDecreeToSupplementation(request.id, decreeNumber);
            } else if (currentAction === 'reject') {
                if (!rejectionReason.trim()) {
                    alert("Por favor, informe o motivo da reprovação.");
                    setIsSubmitting(false);
                    return;
                }
                await rejectSupplementation(request.id, rejectionReason);
            }
            onUpdate();
            onClose();
        } catch (error: any) {
            console.error(error);
            alert('Erro ao processar a ação: ' + (error.message || error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const additions = request.items.filter(i => i.type === 'addition');
    const reductions = request.items.filter(i => i.type === 'reduction');

    // Stepper Logic
    const steps = [
        { label: 'Solicitado', completed: true, active: false },
        { label: 'Deferido', completed: request.status === 'approved' || request.status === 'published', active: request.status === 'pending' },
        { label: 'Decreto', completed: request.status === 'published' || (request.status === 'approved' && !!request.decree_number), active: request.status === 'approved' && !request.decree_number }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-20">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Detalhes da Solicitação</h2>
                        <p className="text-sm text-slate-500">Solicitado em {request.created_at ? new Date(request.created_at).toLocaleDateString() : '-'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Stepper */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 hidden md:block">
                    <div className="flex items-center justify-between max-w-2xl mx-auto">
                        {steps.map((step, idx) => (
                            <React.Fragment key={idx}>
                                <div className="flex flex-col items-center relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step.completed ? 'bg-green-600 text-white' :
                                        step.active ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-200 text-slate-400'
                                        }`}>
                                        {step.completed ? <Check size={16} /> : idx + 1}
                                    </div>
                                    <span className={`text-xs font-semibold mt-2 ${step.completed ? 'text-green-700' : step.active ? 'text-blue-700' : 'text-slate-400'}`}>
                                        {step.label}
                                    </span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-2 -mt-4 transition-colors ${step.completed ? 'bg-green-300' : 'bg-slate-200'
                                        }`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Rejection Alert */}
                    {request.status === 'rejected' && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
                            <XCircle className="text-red-600 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-bold text-red-800">Solicitação Reprovada</p>
                                <p className="text-sm text-red-600 mt-1">{request.rejection_reason || "Esta solicitação não foi aceita."}</p>
                                {onEdit && (
                                    <button
                                        onClick={() => {
                                            onEdit(request);
                                            onClose();
                                        }}
                                        className="mt-3 bg-white border border-red-200 text-red-700 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                                    >
                                        <Edit2 size={16} /> Corrigir Solicitação
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Secretaria</p>
                            <p className="font-semibold text-slate-800">{request.department}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Responsável</p>
                            <p className="font-semibold text-slate-800">{request.responsible_name}</p>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="flex gap-4">
                        {(request.is_excess_revenue || request.is_surplus) && (
                            <div className="flex-1 bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center gap-3">
                                <AlertCircle className="text-blue-600" />
                                <div>
                                    <p className="text-sm font-bold text-blue-800">Fonte de Recursos</p>
                                    <p className="text-xs text-blue-600">
                                        {request.is_excess_revenue ? 'Excesso de Arrecadação' : ''}
                                        {request.is_excess_revenue && request.is_surplus ? ' e ' : ''}
                                        {request.is_surplus ? 'Superávit Financeiro' : ''}
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="flex-1 bg-green-50 border border-green-100 p-4 rounded-lg text-right">
                            <p className="text-xs font-bold text-green-700 uppercase">Total Adição</p>
                            <p className="text-xl font-bold text-green-700">{formatCurrency(request.total_addition)}</p>
                        </div>
                        <div className="flex-1 bg-red-50 border border-red-100 p-4 rounded-lg text-right">
                            <p className="text-xs font-bold text-red-700 uppercase">Total Redução</p>
                            <p className="text-xl font-bold text-red-700">{formatCurrency(request.total_reduction)}</p>
                        </div>
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase border-b pb-2 mb-4">Adições Solicitadas</h3>
                            <div className="space-y-4">
                                {additions.map((item, idx) => {
                                    const key = item.id || `add-${idx}`;
                                    const isChecked = checkedItems[key];
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => toggleCheck(item.id, idx, 'add')}
                                            className={`p-3 border rounded-lg text-sm space-y-2 cursor-pointer transition-all select-none ${isChecked
                                                ? 'bg-slate-50 border-slate-200 opacity-60'
                                                : 'bg-green-50/30 border-green-200 hover:border-green-300 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className="flex justify-between font-semibold items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300'
                                                        }`}>
                                                        {isChecked && <Check size={12} strokeWidth={3} />}
                                                    </div>
                                                    <span className={`text-green-800 ${isChecked ? 'line-through text-slate-500' : ''}`}>{formatCurrency(item.value)}</span>
                                                </div>
                                                <span className="text-slate-500">Dotação: {item.dotation}</span>
                                            </div>
                                            <div className={`pl-8 ${isChecked ? 'opacity-50' : ''}`}>
                                                <p className="text-slate-700"><strong>Rubrica:</strong> {item.rubric}</p>
                                                <p className="text-slate-700"><strong>Recurso:</strong> {item.resource}</p>
                                                <div className="bg-white p-2 rounded border border-green-100 mt-2">
                                                    <p className="text-xs text-slate-500 uppercase">Justificativa</p>
                                                    <p className="text-slate-800 italic">{item.justification}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase border-b pb-2 mb-4">Reduções Propostas</h3>
                            <div className="space-y-4">
                                {reductions.length === 0 ? (
                                    <p className="text-slate-400 text-sm italic">Nenhuma redução (Fonte externa ou Superávit)</p>
                                ) : (
                                    reductions.map((item, idx) => {
                                        const key = item.id || `red-${idx}`;
                                        const isChecked = checkedItems[key];
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => toggleCheck(item.id, idx, 'red')}
                                                className={`p-3 border rounded-lg text-sm space-y-2 cursor-pointer transition-all select-none ${isChecked
                                                    ? 'bg-slate-50 border-slate-200 opacity-60'
                                                    : 'bg-red-50/30 border-red-200 hover:border-red-300 hover:shadow-sm'
                                                    }`}
                                            >
                                                <div className="flex justify-between font-semibold items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-slate-300'
                                                            }`}>
                                                            {isChecked && <Check size={12} strokeWidth={3} />}
                                                        </div>
                                                        <span className={`text-red-800 ${isChecked ? 'line-through text-slate-500' : ''}`}>{formatCurrency(item.value)}</span>
                                                    </div>
                                                    <span className="text-slate-500">Dotação: {item.dotation}</span>
                                                </div>
                                                <div className={`pl-8 ${isChecked ? 'opacity-50' : ''}`}>
                                                    <p className="text-slate-700"><strong>Rubrica:</strong> {item.rubric}</p>
                                                    <p className="text-slate-700"><strong>Recurso:</strong> {item.resource}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Management Area - Actions depend on Status */}
                    {canManage && request.status !== 'rejected' && (
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mt-8">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 opacity-75">Área de Gerenciamento</h3>

                            {/* State 1: Pending -> Deferir Details */}
                            {request.status === 'pending' && !action && (
                                <div className="flex gap-4">
                                    <button onClick={() => setAction('approve')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                                        <Check size={20} /> Deferir Solicitação (Aprovar Mérito)
                                    </button>
                                    <button onClick={() => setAction('reject')} className="flex-1 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
                                        <XCircle size={20} /> Reprovar
                                    </button>
                                </div>
                            )}

                            {/* Rejection Form */}
                            {action === 'reject' && (
                                <div className="bg-red-50 border border-red-200 p-4 rounded-lg animate-in fade-in slide-in-from-top-4">
                                    <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2"><XCircle size={20} /> Motivo da Reprovação</h4>
                                    <textarea
                                        className="w-full p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-3 text-sm"
                                        rows={3}
                                        placeholder="Descreva o motivo da reprovação para que a secretaria possa corrigir..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setAction(null)} className="px-4 py-2 text-slate-600 hover:bg-white rounded-lg font-medium transition-colors">Cancelar</button>
                                        <button
                                            onClick={handleAction}
                                            disabled={isSubmitting}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Confirmar Reprovação'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* State 2: Approved but No Decree -> Lançar Decreto (Inline) */}
                            {request.status === 'approved' && !request.decree_number && !action && (
                                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                    <div className="mb-4">
                                        <p className="font-bold text-yellow-800">Solicitação Deferida</p>
                                        <p className="text-sm text-yellow-700">Informe o número do decreto para finalizar o processo.</p>
                                    </div>

                                    <div className="flex items-end gap-3">
                                        <div className="flex-1 max-w-xs">
                                            <label className="block text-xs font-bold text-yellow-800 uppercase mb-1">Número do Decreto *</label>
                                            <input
                                                type="text"
                                                className="w-full p-2.5 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white text-slate-800"
                                                placeholder="Ex: 1234/2024"
                                                value={decreeNumber}
                                                onChange={e => setDecreeNumber(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                setAction('decree'); // Set action to trigger submit logic if needed, or call handleAction directly with type
                                                // Since handleAction relies on 'action' state, we might need to adjust logic or set action then submit.
                                                // Actually, let's adjust handleAction or wrap it.
                                                // Ideally, we just call the submit function directly if we refactor, but to keep it simple:
                                                // We will set a specific sub-state or just call a new handler.
                                                // Let's reuse handleAction but we need 'action' state to be 'decree' for it to work?
                                                // Looking at handleAction: if (action === 'decree')...
                                                // So we can setAction('decree') then immediately call logic? No, state update is async.
                                                // Better approach: Create a dedicated 'handleSubmitDecree' function or pass arg to handleAction.
                                                handleAction('decree');
                                            }}
                                            disabled={isSubmitting || !decreeNumber}
                                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><FileText size={18} /> Lançar</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* State 3: Published/Finished -> View Only */}
                            {(request.status === 'published' || (request.status === 'approved' && request.decree_number)) && (
                                <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center gap-4">
                                    <div className="bg-white p-2 rounded-full shadow-sm text-green-600">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-green-800 font-bold uppercase">Solicitação Finalizada</p>
                                        <p className="text-green-700">Decreto nº <strong>{request.decree_number}</strong></p>
                                    </div>
                                </div>
                            )}

                            {/* Action Forms */}
                            {action === 'approve' && (
                                <div className="bg-white p-4 rounded-lg border border-blue-200 animate-fade-in text-center space-y-4">
                                    <p className="text-slate-600 font-medium">Confirma o deferimento desta solicitação? Ela passará para a fase de Decreto.</p>
                                    <div className="flex justify-center gap-4">
                                        <button onClick={() => setAction(null)} className="text-slate-500 hover:text-slate-700 px-4 py-2 font-semibold">Cancelar</button>
                                        <button
                                            onClick={() => handleAction('approve')}
                                            disabled={isSubmitting}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Confirmar Deferimento'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
