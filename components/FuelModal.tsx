import React, { useState, useEffect } from 'react';
import { FuelRecord, FuelRecordDetail, FuelCommitment, UserProfile, DynamicSetting } from '../types';
import { X, Save, Plus, Trash2, Loader2, Droplet } from 'lucide-react';

interface FuelModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: FuelRecord | null;
    commitments: FuelCommitment[];
    userProfile: UserProfile | null;
    departments: DynamicSetting[];
    onSave: (data: FuelRecord | Omit<FuelRecord, 'id'>) => Promise<void>;
}

export const FuelModal: React.FC<FuelModalProps> = ({
    isOpen,
    onClose,
    record,
    commitments,
    userProfile,
    departments,
    onSave
}) => {
    const [formData, setFormData] = useState<Partial<FuelRecord>>({
        department: userProfile?.department || '',
        reference_month: new Date().toISOString().slice(0, 7).replace('-', '/'),
        total_liters: 0,
        total_value: 0,
        commitment_id: '',
        details: [],
        status: 'pending',
        notes: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (record) {
            setFormData(record);
        } else {
            setFormData({
                department: userProfile?.department || '',
                reference_month: new Date().toISOString().slice(0, 7).replace('-', '/'),
                total_liters: 0,
                total_value: 0,
                commitment_id: '',
                details: [],
                status: 'pending',
                notes: ''
            });
        }
    }, [record, isOpen, userProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const addDetail = () => {
        setFormData(prev => ({
            ...prev,
            details: [
                ...(prev.details || []),
                {
                    vehicle_plate: '',
                    liters: 0,
                    price_per_liter: 0,
                    total_value: 0,
                    fuel_type: 'gasoline'
                }
            ]
        }));
    };

    const removeDetail = (index: number) => {
        setFormData(prev => ({
            ...prev,
            details: (prev.details || []).filter((_, i) => i !== index)
        }));
    };

    const updateDetail = (index: number, field: keyof FuelRecordDetail, value: any) => {
        setFormData(prev => {
            const newDetails = [...(prev.details || [])];
            newDetails[index] = {
                ...newDetails[index],
                [field]: value
            };

            // Recalcular total do item
            if (field === 'liters' || field === 'price_per_liter') {
                newDetails[index].total_value = newDetails[index].liters * newDetails[index].price_per_liter;
            }

            // Recalcular totais gerais
            const total_liters = newDetails.reduce((acc, d) => acc + d.liters, 0);
            const total_value = newDetails.reduce((acc, d) => acc + d.total_value, 0);

            return {
                ...prev,
                details: newDetails,
                total_liters,
                total_value
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.details || formData.details.length === 0) {
            alert('Adicione pelo menos um veículo ao lançamento.');
            return;
        }

        setIsSaving(true);
        try {
            await onSave(formData as FuelRecord);
            onClose();
        } catch (error: any) {
            console.error('Failed to save record', error);
            alert(error.message || 'Erro ao salvar lançamento.');
        } finally {
            setIsSaving(false);
        }
    };

    const selectedCommitment = commitments.find(c => c.id === formData.commitment_id);
    const availableCommitments = commitments.filter(c =>
        c.department === formData.department && c.balance > 0
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60] overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl animate-in fade-in zoom-in-95 duration-200 my-8">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Droplet className="text-blue-600" />
                        {record ? 'Editar Lançamento' : 'Novo Lançamento de Combustível'}
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Secretaria *</label>
                            <select
                                name="department"
                                required
                                value={formData.department}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Selecione...</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mês de Referência *</label>
                            <input
                                type="text"
                                name="reference_month"
                                required
                                value={formData.reference_month}
                                onChange={handleChange}
                                placeholder="MM/AAAA"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Empenho *</label>
                            <select
                                name="commitment_id"
                                required
                                value={formData.commitment_id}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Selecione...</option>
                                {availableCommitments.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.number} - Saldo: {c.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedCommitment && formData.total_value > selectedCommitment.balance && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            <strong>Atenção:</strong> O valor total ({formData.total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                            excede o saldo disponível ({selectedCommitment.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                        </div>
                    )}

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-medium text-slate-700">Veículos *</label>
                            <button
                                type="button"
                                onClick={addDetail}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
                            >
                                <Plus size={16} />
                                Adicionar Veículo
                            </button>
                        </div>

                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Placa</th>
                                        <th className="px-3 py-2 text-right">Litros</th>
                                        <th className="px-3 py-2 text-right">R$/L</th>
                                        <th className="px-3 py-2 text-left">Tipo</th>
                                        <th className="px-3 py-2 text-right">Total</th>
                                        <th className="px-3 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(!formData.details || formData.details.length === 0) ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-6 text-center text-slate-500 text-sm">
                                                Nenhum veículo adicionado
                                            </td>
                                        </tr>
                                    ) : (
                                        formData.details.map((detail, index) => (
                                            <tr key={index}>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={detail.vehicle_plate}
                                                        onChange={(e) => updateDetail(index, 'vehicle_plate', e.target.value)}
                                                        placeholder="ABC-1234"
                                                        className="w-full p-1.5 border border-slate-300 rounded text-sm uppercase"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={detail.liters}
                                                        onChange={(e) => updateDetail(index, 'liters', parseFloat(e.target.value) || 0)}
                                                        className="w-full p-1.5 border border-slate-300 rounded text-sm text-right"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={detail.price_per_liter}
                                                        onChange={(e) => updateDetail(index, 'price_per_liter', parseFloat(e.target.value) || 0)}
                                                        className="w-full p-1.5 border border-slate-300 rounded text-sm text-right"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <select
                                                        value={detail.fuel_type}
                                                        onChange={(e) => updateDetail(index, 'fuel_type', e.target.value)}
                                                        className="w-full p-1.5 border border-slate-300 rounded text-sm"
                                                    >
                                                        <option value="gasoline">Gasolina</option>
                                                        <option value="ethanol">Etanol</option>
                                                        <option value="diesel">Diesel</option>
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2 text-right font-semibold text-sm">
                                                    {detail.total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeDetail(index)}
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
                                        <td className="px-3 py-2 text-right" colSpan={1}>TOTAL:</td>
                                        <td className="px-3 py-2 text-right">{formData.total_liters?.toFixed(2) || '0.00'}L</td>
                                        <td colSpan={2}></td>
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                        <textarea
                            name="notes"
                            rows={2}
                            value={formData.notes}
                            onChange={handleChange}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                        />
                    </div>
                </form>

                <div className="flex justify-end p-6 border-t border-slate-200 gap-2 bg-slate-50 rounded-b-lg">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg font-medium transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all disabled:opacity-70"
                    >
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        {isSaving ? 'Salvando...' : (record ? 'Atualizar' : 'Salvar Lançamento')}
                    </button>
                </div>
            </div>
        </div>
    );
};
