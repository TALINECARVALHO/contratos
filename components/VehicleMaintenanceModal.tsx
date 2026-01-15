import React, { useState, useEffect } from 'react';
import { VehicleMaintenance, MaintenanceItem, Vehicle, UserProfile } from '../types';
import { X, Save, Wrench, Loader2, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface VehicleMaintenanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    maintenance: VehicleMaintenance | null;
    vehicles: Vehicle[];
    userProfile: UserProfile | null;
    onSave: (data: VehicleMaintenance | Omit<VehicleMaintenance, 'id'>) => Promise<void>;
}

export const VehicleMaintenanceModal: React.FC<VehicleMaintenanceModalProps> = ({
    isOpen,
    onClose,
    maintenance,
    vehicles,
    userProfile,
    onSave
}) => {
    const isFrotas = userProfile?.department === 'FROTAS' || userProfile?.role === 'super_admin' || userProfile?.role === 'admin';
    const isEditing = !!maintenance;
    const canEdit = !isEditing || maintenance.status === 'requested' || isFrotas;

    const [formData, setFormData] = useState<Partial<VehicleMaintenance>>({
        vehicle_id: '',
        vehicle_plate: '',
        requesting_department: userProfile?.department || '',
        type: 'corrective',
        request_date: new Date().toISOString().split('T')[0],
        description: '',
        priority: 'medium',
        status: 'requested'
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (maintenance) {
            setFormData(maintenance);
        } else {
            setFormData({
                vehicle_id: '',
                vehicle_plate: '',
                requesting_department: userProfile?.department || '',
                type: 'corrective',
                request_date: new Date().toISOString().split('T')[0],
                description: '',
                priority: 'medium',
                status: 'requested'
            });
        }
    }, [maintenance, isOpen, userProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const vehicleId = e.target.value;
        const vehicle = vehicles.find(v => v.id === vehicleId);
        setFormData(prev => ({
            ...prev,
            vehicle_id: vehicleId,
            vehicle_plate: vehicle?.plate || ''
        }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...(prev.items || []),
                { description: '', quantity: 1, unit_price: 0, total: 0 }
            ]
        }));
    };

    const removeItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: (prev.items || []).filter((_, i) => i !== index)
        }));
    };

    const updateItem = (index: number, field: keyof MaintenanceItem, value: any) => {
        setFormData(prev => {
            const newItems = [...(prev.items || [])];
            newItems[index] = {
                ...newItems[index],
                [field]: value
            };

            if (field === 'quantity' || field === 'unit_price') {
                newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
            }

            const total_value = newItems.reduce((acc, item) => acc + item.total, 0);

            return {
                ...prev,
                items: newItems,
                total_value
            };
        });
    };

    const handleApprove = () => {
        setFormData(prev => ({ ...prev, status: 'approved' }));
    };

    const handleReject = () => {
        const reason = prompt('Motivo da rejeição:');
        if (reason) {
            setFormData(prev => ({ ...prev, status: 'rejected', rejection_reason: reason }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData as VehicleMaintenance);
            onClose();
        } catch (error) {
            console.error('Failed to save maintenance', error);
            alert('Erro ao salvar manutenção.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60] overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl animate-in fade-in zoom-in-95 duration-200 my-8">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Wrench className="text-blue-600" />
                        {isEditing ? 'Detalhes da Manutenção' : 'Nova Solicitação de Manutenção'}
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Solicitação */}
                    <div>
                        <h3 className="font-bold text-slate-700 mb-3">Dados da Solicitação</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Veículo *</label>
                                <select
                                    value={formData.vehicle_id}
                                    onChange={handleVehicleChange}
                                    disabled={!canEdit || isEditing}
                                    required
                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100"
                                >
                                    <option value="">Selecione...</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>
                                            {v.plate} - {v.brand} {v.model}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Data *</label>
                                <input
                                    type="date"
                                    name="request_date"
                                    value={formData.request_date}
                                    onChange={handleChange}
                                    disabled={!canEdit}
                                    required
                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    disabled={!canEdit}
                                    required
                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100"
                                >
                                    <option value="preventive">Preventiva</option>
                                    <option value="corrective">Corretiva</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade *</label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    disabled={!canEdit}
                                    required
                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100"
                                >
                                    <option value="low">Baixa</option>
                                    <option value="medium">Média</option>
                                    <option value="high">Alta</option>
                                    <option value="urgent">Urgente</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Problema *</label>
                            <textarea
                                name="description"
                                rows={3}
                                value={formData.description}
                                onChange={handleChange}
                                disabled={!canEdit}
                                required
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none disabled:bg-slate-100"
                            />
                        </div>
                    </div>

                    {/* Execução (apenas Frotas) */}
                    {isFrotas && isEditing && formData.status !== 'requested' && (
                        <div className="border-t pt-6">
                            <h3 className="font-bold text-slate-700 mb-3">Execução da Manutenção</h3>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Data de Execução</label>
                                    <input
                                        type="date"
                                        name="execution_date"
                                        value={formData.execution_date || ''}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Odômetro</label>
                                    <input
                                        type="number"
                                        name="odometer"
                                        value={formData.odometer || ''}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Prestador de Serviço</label>
                                    <input
                                        type="text"
                                        name="service_provider"
                                        value={formData.service_provider || ''}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-slate-700">Itens da Manutenção</label>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
                                    >
                                        <Plus size={16} />
                                        Adicionar Item
                                    </button>
                                </div>

                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Descrição</th>
                                                <th className="px-3 py-2 text-right">Qtd</th>
                                                <th className="px-3 py-2 text-right">Valor Unit.</th>
                                                <th className="px-3 py-2 text-right">Total</th>
                                                <th className="px-3 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(!formData.items || formData.items.length === 0) ? (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500 text-sm">
                                                        Nenhum item adicionado
                                                    </td>
                                                </tr>
                                            ) : (
                                                formData.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={item.description}
                                                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                                className="w-full p-1.5 border border-slate-300 rounded text-sm"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                                className="w-full p-1.5 border border-slate-300 rounded text-sm text-right"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.unit_price}
                                                                onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                                className="w-full p-1.5 border border-slate-300 rounded text-sm text-right"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-semibold text-sm">
                                                            {item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItem(index)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                        <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                                            <tr>
                                                <td className="px-3 py-2 text-right" colSpan={3}>TOTAL:</td>
                                                <td className="px-3 py-2 text-right text-blue-600">
                                                    {(formData.total_value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Número do Empenho</label>
                                <input
                                    type="text"
                                    name="commitment_number"
                                    value={formData.commitment_number || ''}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                        <textarea
                            name="notes"
                            rows={2}
                            value={formData.notes || ''}
                            onChange={handleChange}
                            disabled={!canEdit && !isFrotas}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm disabled:bg-slate-100"
                        />
                    </div>
                </form>

                <div className="flex justify-between p-6 border-t border-slate-200 gap-2 bg-slate-50 rounded-b-lg">
                    <div className="flex gap-2">
                        {isFrotas && isEditing && formData.status === 'requested' && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleApprove}
                                    className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium"
                                >
                                    <CheckCircle size={20} />
                                    Aprovar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReject}
                                    className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 font-medium"
                                >
                                    <XCircle size={20} />
                                    Rejeitar
                                </button>
                            </>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg font-medium transition-all"
                        >
                            Cancelar
                        </button>
                        {canEdit && (
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all disabled:opacity-70"
                            >
                                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                {isSaving ? 'Salvando...' : 'Salvar'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
