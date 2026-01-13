import React, { useState, useEffect } from 'react';
import { PurchaseRequest, UserProfile, PurchaseOrder } from '../types';
import { X, Save, FileText, ShoppingCart, Banknote, Plus, Trash2, Check, AlertTriangle } from 'lucide-react';
import { getUserPermissions } from '../utils/permissions';
import { createPurchaseOrder, deletePurchaseOrder } from '../services/purchaseService';

interface PurchaseRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: PurchaseRequest | null;
    onSave: (data: PurchaseRequest | Omit<PurchaseRequest, 'id'>) => Promise<void>;
    userProfile: UserProfile | null;
    mode: 'create' | 'edit' | 'manage';
}

export const PurchaseRequestModal: React.FC<PurchaseRequestModalProps> = ({
    isOpen,
    onClose,
    request,
    onSave,
    userProfile,
    mode
}) => {
    const [formData, setFormData] = useState<Partial<PurchaseRequest>>({
        number: '',
        date: new Date().toISOString(),
        department: '',
        type: 'Contratos',
        contractNumber: '',
        object: '',
        status: 'requested'
    });

    // Local state for orders if we are in "Create" mode or just visual management
    const [ordersList, setOrdersList] = useState<PurchaseOrder[]>([]);
    const [newOrderNumber, setNewOrderNumber] = useState('');
    const [newOrderDate, setNewOrderDate] = useState(new Date().toISOString().split('T')[0]);

    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    useEffect(() => {
        if (request) {
            setFormData(request);
            setOrdersList(request.orders || []);
        } else {
            setFormData({
                number: '',
                date: new Date().toISOString(),
                department: userProfile?.department || '',
                type: 'Contratos',
                contractNumber: '',
                object: '',
                status: 'requested',
                requester_id: userProfile?.id,
            });
            setOrdersList([]);
        }
        // Reset new order inputs
        setNewOrderNumber('');
        setNewOrderDate(new Date().toISOString().split('T')[0]);
        setShowSuccess(false);
        setIsRejecting(false);
    }, [request, isOpen, userProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddOrder = async () => {
        if (!newOrderNumber || !newOrderDate) return;

        // If the request exists, we can save the order directly to DB
        // If not, we can't save the order yet because we need the Request ID.
        // For simplicity: We will require saving the Request first OR we handle it after save?
        // Let's adopt this: If creating new Request, we can't add orders yet? Or we stash them?
        // Stashing them is better UX but requires complex save logic.
        // To stick to simplicity: User saves Request first, then opens to add Orders?
        // Or: We allow stashing and save them sequentially on submit. Let's try stashing.

        const tempOrder: PurchaseOrder = {
            id: request ? 'temp_id' : 'temp_' + Date.now(), // Placeholder
            requestId: request?.id || '',
            number: newOrderNumber,
            date: newOrderDate
        };

        if (request) {
            // Live add
            try {
                const added = await createPurchaseOrder({
                    requestId: request.id,
                    number: newOrderNumber,
                    date: new Date(newOrderDate).toISOString()
                });
                if (added) {
                    setOrdersList([...ordersList, added]);
                    setNewOrderNumber('');
                    setNewOrderDate(new Date().toISOString().split('T')[0]);
                }
            } catch (e) {
                alert('Erro ao adicionar ordem.');
            }
        } else {
            // Just local state for visual (NOT IMPLEMENTED fully for deep save yet to avoid complexity)
            // User requested: "permitir adicionar varias ordens...".
            alert('Por favor, salve a solicitação primeiro antes de adicionar ordens de compra.');
        }
    };

    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

    const handleDeleteOrder = async (orderId: string) => {
        // Confirmation is now handled inline in the UI
        try {
            await deletePurchaseOrder(orderId);
            setOrdersList(ordersList.filter(o => o.id !== orderId));
            setOrderToDelete(null);
        } catch (e) {
            alert('Erro ao remover ordem.');
        }
    };

    const handleReject = async () => {
        setIsSaving(true);
        try {
            await onSave({ ...formData, status: 'rejected' } as PurchaseRequest);
            setShowSuccess(true);
            // setIsRejecting(false); // Success modal covers it
        } catch (error) {
            console.error('Failed to reject', error);
            alert('Erro ao reprovar a solicitação.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResubmit = async () => {
        setIsSaving(true);
        try {
            // Resubmit: Clear rejection info and set status back to requested
            await onSave({ ...formData, status: 'requested', rejectionReason: null } as PurchaseRequest);
            setShowSuccess(true);
        } catch (error) {
            console.error('Failed to resubmit', error);
            alert('Erro ao reenviar a solicitação.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Auto-update status logic
        let newStatus = formData.status;
        if (formData.commitmentNumber) newStatus = 'committed';
        else if (ordersList.length > 0) newStatus = 'ordered';

        try {
            await onSave({ ...formData, status: newStatus } as PurchaseRequest);
            setShowSuccess(true);
        } catch (error) {
            console.error('Failed to save request', error);
            alert('Erro ao salvar solicitação.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    // Standardized Permissions
    // import { getUserPermissions } from '../utils/permissions'; -> I will add this import separately
    const permissions = getUserPermissions(userProfile);
    const canManage = permissions.purchase_request?.manage || false;

    // UI Logic derived from Standard Permissions
    // Edit Request (Basic Info): Allowed if creating, OR if doing normal edit (and status allows), OR if manager
    const canEditBasicInfo = mode === 'create' || mode === 'edit';

    const canManageOrders = mode === 'manage'; // Only in manage mode we show/edit orders

    const isPurchasingOrFinance = canManage;
    const isFinance = canManage; // Using generic Manager permission as requested (Simplification)

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <ShoppingCart className="text-blue-600" />
                        {request ? 'Editar Empenho/Solicitação' : 'Nova Solicitação'}
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">

                    {/* SEÇÃO 1: SECRETARIA SOLICITANTE */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
                            <FileText size={16} /> Dados da Solicitação
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Solicitado por</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={request?.requester?.name || userProfile?.name || 'Usuário Atual'}
                                    disabled
                                    className="w-full p-2 border border-slate-200 bg-slate-100 rounded-lg text-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nº do Pedido</label>
                                <input
                                    type="text"
                                    name="number"
                                    required
                                    value={formData.number}
                                    onChange={handleChange}
                                    disabled={!canEditBasicInfo}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Secretaria</label>
                                <input
                                    type="text"
                                    name="department"
                                    required
                                    value={formData.department}
                                    onChange={handleChange}
                                    disabled={
                                        // Lock department if not creating (usually)
                                        mode !== 'create' ||
                                        // OR if user is not a manager, they are locked to their profile department
                                        (!canManage && !!userProfile?.department)
                                    }
                                    className={`w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${(!canManage && !!userProfile?.department) ? 'bg-slate-100 text-slate-500' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    disabled={!canEditBasicInfo}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="Ata de Registro de Preço">Ata de Registro de Preço</option>
                                    <option value="Contratos">Contratos</option>
                                    <option value="Inexigibilidade">Inexigibilidade</option>
                                    <option value="Dispensa DFD">Dispensa DFD</option>
                                    <option value="Dispensa Simples">Dispensa Simples</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>
                        </div>

                        {/* ROW 2: Contrato (Conditional) + Objeto */}
                        <div className="mt-4 flex flex-col md:flex-row gap-4">
                            {formData.type === 'Contratos' && (
                                <div className="w-full md:w-1/3">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nº do Contrato</label>
                                    <input
                                        type="text"
                                        name="contractNumber"
                                        value={formData.contractNumber || ''}
                                        onChange={handleChange}
                                        disabled={!canEditBasicInfo}
                                        placeholder="Ex: 123/2024"
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            )}
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Objeto / Assunto</label>
                                <textarea
                                    name="object"
                                    value={formData.object || ''}
                                    onChange={handleChange}
                                    disabled={!canEditBasicInfo}
                                    rows={1}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Descreva o objeto ou assunto da solicitação..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO 2: GESTÃO DE ORDENS E EMPENHOS (TABELA UNIFICADA) - APENAS VISÍVEL SE JÁ EXISTE SOLICITAÇÃO (EDIÇÃO) */}
                    {(canManageOrders) && (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h3 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center gap-2">
                                <ShoppingCart size={16} /> Ordens e Empenhos
                            </h3>

                            {/* Tabela de Ordens */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left mb-4">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-100">
                                        <tr>
                                            <th className="px-3 py-2 w-[10%]">Nº Ordem</th>
                                            <th className="px-3 py-2 w-[15%]">Data Ordem</th>
                                            <th className="px-3 py-2 w-[20%]">Nº Empenho</th>
                                            <th className="px-3 py-2 w-[15%]">Data Empenho</th>
                                            <th className="px-3 py-2 w-[40%]">Recusa (Fazenda)</th>
                                            <th className="px-3 py-2 w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white border border-slate-200">
                                        {ordersList.map((order, idx) => (
                                            <React.Fragment key={order.id || idx}>
                                                <tr>
                                                    {/* Colunas de Ordem (Edição Compras) */}
                                                    <td className="px-3 py-2 align-top">
                                                        <div className="font-medium text-blue-900">{order.number}</div>
                                                    </td>
                                                    <td className="px-3 py-2 align-top">
                                                        <div className="text-slate-600">{new Date(order.date).toLocaleDateString()}</div>
                                                    </td>

                                                    {/* Colunas de Empenho (Edição Fazenda) */}
                                                    <td className="px-3 py-2 align-top">
                                                        <input
                                                            type="text"
                                                            placeholder="Nº Empenho"
                                                            value={order.commitmentNumber || ''}
                                                            disabled={!isFinance}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                let newDate = order.commitmentDate;

                                                                // Auto-fill date with current date if user starts typing and date is empty
                                                                if (val && !newDate) {
                                                                    newDate = new Date().toISOString();
                                                                }

                                                                const updated = {
                                                                    ...order,
                                                                    commitmentNumber: val,
                                                                    commitmentDate: newDate
                                                                };

                                                                // Atualiza lista local
                                                                const newList = [...ordersList];
                                                                newList[idx] = updated;
                                                                setOrdersList(newList);
                                                            }}
                                                            onBlur={async () => {
                                                                if (order.id && !order.id.startsWith('temp_')) {
                                                                    const { updatePurchaseOrder } = await import('../services/purchaseService');
                                                                    try {
                                                                        await updatePurchaseOrder(ordersList[idx]);
                                                                    } catch (e) { console.error("Erro ao salvar empenho", e); }
                                                                }
                                                            }}
                                                            className={`w-full p-1 border rounded ${!isFinance ? 'bg-slate-100 border-transparent' : 'border-green-300 focus:border-green-500'}`}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 align-top">
                                                        <input
                                                            type="date"
                                                            value={order.commitmentDate ? order.commitmentDate.split('T')[0] : ''}
                                                            disabled={!isFinance}
                                                            onChange={(e) => {
                                                                const updated = { ...order, commitmentDate: e.target.value };
                                                                const newList = [...ordersList];
                                                                newList[idx] = updated;
                                                                setOrdersList(newList);
                                                            }}
                                                            onBlur={async () => {
                                                                if (order.id && !order.id.startsWith('temp_')) {
                                                                    const { updatePurchaseOrder } = await import('../services/purchaseService');
                                                                    try {
                                                                        await updatePurchaseOrder(ordersList[idx]);
                                                                    } catch (e) { console.error("Erro ao salvar data empenho", e); }
                                                                }
                                                            }}
                                                            className={`w-full p-1 border rounded text-xs ${!isFinance ? 'bg-slate-100 border-transparent' : 'border-green-300 focus:border-green-500'}`}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 align-top">
                                                        <textarea
                                                            rows={1}
                                                            placeholder={isFinance ? "Motivo recusa..." : ""}
                                                            value={order.commitmentRejectionReason || ''}
                                                            disabled={!isFinance}
                                                            onChange={(e) => {
                                                                const updated = { ...order, commitmentRejectionReason: e.target.value };
                                                                const newList = [...ordersList];
                                                                newList[idx] = updated;
                                                                setOrdersList(newList);
                                                            }}
                                                            onBlur={async () => {
                                                                if (order.id && !order.id.startsWith('temp_')) {
                                                                    const { updatePurchaseOrder } = await import('../services/purchaseService');
                                                                    try {
                                                                        await updatePurchaseOrder(ordersList[idx]);
                                                                    } catch (e) { console.error("Erro ao salvar recusa empenho", e); }
                                                                }
                                                            }}
                                                            className={`w-full p-1 border rounded text-xs placeholder:text-red-300 text-red-700 resize-y min-h-[30px] ${!isFinance ? 'bg-slate-50 border-transparent' : 'border-amber-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-200'}`}
                                                        />
                                                    </td>

                                                    <td className="px-3 py-2 text-right w-24 align-top">
                                                        {canManageOrders && (
                                                            orderToDelete === order.id ? (
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <span className="text-xs text-red-600 font-bold">Excluir?</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteOrder(order.id)}
                                                                        className="text-red-600 hover:text-red-800 font-bold text-xs border border-red-200 bg-red-50 px-2 py-1 rounded"
                                                                    >
                                                                        Sim
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setOrderToDelete(null)}
                                                                        className="text-slate-500 hover:text-slate-700 text-xs px-2 py-1"
                                                                    >
                                                                        Não
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setOrderToDelete(order.id)}
                                                                    className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                                                    title="Excluir Ordem"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )
                                                        )}
                                                    </td>
                                                </tr>
                                                {/* Rejection / Validation Reasons Row - REMOVED per user request
                                                <tr className="bg-slate-50/50">
                                                     ...
                                                </tr> 
                                                */}
                                            </React.Fragment>
                                        ))}
                                        {ordersList.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-4 text-center text-slate-400 text-sm italic">
                                                    Nenhuma ordem lançada.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Adicionar Nova Ordem (Apenas Compras) */}
                            {canManageOrders && request && (
                                <div className="flex gap-2 items-end pt-3 border-t border-slate-200 bg-blue-50/50 p-2 rounded">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-blue-700 mb-1">Nova Ordem</label>
                                        <input
                                            type="text"
                                            placeholder="Nº Ordem"
                                            className="w-full p-2 border border-blue-300 rounded text-sm bg-white"
                                            value={newOrderNumber}
                                            onChange={e => setNewOrderNumber(e.target.value)}
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-xs font-bold text-blue-700 mb-1">Data</label>
                                        <input
                                            type="date"
                                            className="w-full p-2 border border-blue-300 rounded text-sm bg-white"
                                            value={newOrderDate}
                                            onChange={e => setNewOrderDate(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddOrder}
                                        disabled={!newOrderNumber}
                                        className="h-[38px] px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 shadow-sm"
                                    >
                                        <Plus size={16} /> Adicionar
                                    </button>
                                </div>
                            )}
                            {canManageOrders && !request && <p className="text-xs text-blue-600 mt-2 text-center bg-blue-50 p-2 rounded">* Salve a solicitação para adicionar ordens.</p>}
                        </div>
                    )}

                    {/* Rejection Alert - Visible if status is rejected */}
                    {formData.status === 'rejected' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2">
                                <AlertTriangle size={20} /> Solicitação Reprovada
                            </h3>
                            <p className="text-red-700 text-sm">
                                <strong>Motivo:</strong> {formData.rejectionReason || 'Nenhum motivo informado.'}
                            </p>
                        </div>
                    )}

                    {/* Rejection Input Area - Visible when "Reprovar" is clicked */}
                    {isRejecting && (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200 animate-in slide-in-from-bottom-2 fade-in">
                            <label className="block text-sm font-bold text-red-800 mb-2">Motivo da Reprovação</label>
                            <textarea
                                value={formData.rejectionReason || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                                className="w-full p-2 border border-red-300 rounded bg-white text-slate-700 min-h-[80px]"
                                placeholder="Descreva o motivo da reprovação desta solicitação..."
                                autoFocus
                            />
                            <div className="flex justify-end gap-3 mt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRejecting(false)}
                                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReject}
                                    disabled={!formData.rejectionReason}
                                    className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-bold disabled:opacity-50"
                                >
                                    Confirmar Reprovação
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between pt-4 border-t border-slate-200">
                        <div>
                            {/* Delete Button (Keep existance logic if needed, or just standard actions) */}
                        </div>

                        <div className="flex gap-2">
                            {/* Show "Reprovar" button ONLY if Manager, not already rejected, and not currently rejecting */}
                            {canManage && formData.status !== 'rejected' && !isRejecting && request && (
                                <button
                                    type="button"
                                    onClick={() => setIsRejecting(true)}
                                    className="px-4 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg mr-2 font-medium"
                                >
                                    Reprovar Solicitação
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                            >
                                Fechar
                            </button>

                            {!isRejecting && (
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                >
                                    {isSaving ? 'Salvando...' : <><Save size={20} /> Salvar Alterações</>}
                                </button>
                            )}

                            {/* Resubmit Button - Visible ONLY if Rejected and User Can Edit (Owner/Manager) */}
                            {!isRejecting && formData.status === 'rejected' && (canEditBasicInfo || canManage) && (
                                <button
                                    type="button"
                                    onClick={handleResubmit}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2 ml-2"
                                    disabled={isSaving}
                                >
                                    <FileText size={20} /> Reenviar p/ Análise
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {showSuccess && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-[60] text-center animate-in fade-in zoom-in-95 duration-300 rounded-lg">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6 animate-bounce">
                        <Check size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Processo Atualizado!</h2>
                    <p className="text-slate-500 max-w-sm mb-8 px-6">
                        As informações da solicitação de compra foram salvas com sucesso.
                    </p>
                    <button
                        onClick={onClose}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
                    >
                        Voltar para a Lista
                    </button>
                </div>
            )}
        </div>
    );
};
