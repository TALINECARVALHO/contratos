import React, { useState, useEffect } from 'react';
import { FuelCommitment, DynamicSetting, FuelRecord } from '../types';
import { X, Save, FileText, Loader2, List } from 'lucide-react';

interface FuelCommitmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    commitment: FuelCommitment | null;
    departments: DynamicSetting[];
    onSave: (data: FuelCommitment | Omit<FuelCommitment, 'id' | 'balance'>) => Promise<void>;
    records: FuelRecord[];
}

export const FuelCommitmentModal: React.FC<FuelCommitmentModalProps> = ({
    isOpen,
    onClose,
    commitment,
    departments,
    onSave,
    records
}) => {
    const [formData, setFormData] = useState<Partial<FuelCommitment>>({
        number: '',
        department: '',
        dotation: '',
        totalValue: 0,
        notes: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (commitment) {
            setFormData(commitment);
        } else {
            setFormData({
                number: '',
                department: '',
                dotation: '',
                totalValue: 0,
                notes: ''
            });
        }
    }, [commitment, isOpen]);

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
            await onSave(formData as FuelCommitment);
            onClose();
        } catch (error) {
            console.error('Failed to save commitment', error);
            alert('Erro ao salvar empenho.');
        } finally {
            setIsSaving(false);
        }
    };

    const commitmentRecords = commitment
        ? (records || []).filter(r => r.commitment_id === commitment.id).sort((a, b) => b.reference_month.localeCompare(a.reference_month))
        : [];

    const totalUsed = commitmentRecords.reduce((acc, r) => acc + r.total_value, 0);
    const balance = (formData.totalValue || 0) - totalUsed;
    const usagePercentage = formData.totalValue ? (totalUsed / formData.totalValue) * 100 : 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60] overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-blue-600" />
                        {commitment ? 'Detalhes do Empenho' : 'Novo Empenho de Combustível'}
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Form Section */}
                        <div className="flex-1 space-y-4">
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <FileText size={18} /> Dados do Empenho
                            </h3>
                            <form id="commitment-form" onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Número do Empenho</label>
                                        <input
                                            type="text"
                                            name="number"
                                            required
                                            value={formData.number}
                                            onChange={handleChange}
                                            placeholder="Ex: 123/2024"
                                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Secretaria</label>
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
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Valor Total</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">R$</span>
                                            <input
                                                type="number"
                                                name="totalValue"
                                                step="0.01"
                                                required
                                                value={formData.totalValue}
                                                onChange={handleChange}
                                                className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Dotação</label>
                                    <input
                                        type="text"
                                        name="dotation"
                                        value={formData.dotation}
                                        onChange={handleChange}
                                        placeholder="Ex: 1148"
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                                    <textarea
                                        name="notes"
                                        rows={3}
                                        value={formData.notes}
                                        onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                                    />
                                </div>
                            </form>
                        </div>

                        {/* History Section - Only visible when editing */}
                        {commitment && (
                            <div className="flex-1 border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-8 flex flex-col h-full overflow-hidden">
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <List size={18} /> Histórico de Lançamentos
                                </h3>

                                <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-semibold text-slate-500">CONSUMO DO EMPENHO</span>
                                        <span className="text-sm font-bold text-slate-700">
                                            {usagePercentage.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2 overflow-hidden">
                                        <div
                                            className={`h-2.5 rounded-full ${usagePercentage > 90 ? 'bg-red-500' : 'bg-blue-600'}`}
                                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600">
                                            Utilizado: <b>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalUsed)}</b>
                                        </span>
                                        <span className={balance < 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                                            Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 sticky top-0 z-10 text-xs font-semibold text-slate-500 uppercase">
                                            <tr>
                                                <th className="px-3 py-2 border-b border-slate-200">Mês</th>
                                                <th className="px-3 py-2 border-b border-slate-200 text-right">Litros</th>
                                                <th className="px-3 py-2 border-b border-slate-200 text-right">Valor</th>
                                                <th className="px-3 py-2 border-b border-slate-200 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {commitmentRecords.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-xs">
                                                        Nenhum lançamento vinculado a este empenho.
                                                    </td>
                                                </tr>
                                            ) : (
                                                commitmentRecords.map(record => (
                                                    <tr key={record.id} className="hover:bg-slate-50 group transition-colors">
                                                        <td className="px-3 py-2 text-slate-700">{record.reference_month}</td>
                                                        <td className="px-3 py-2 text-slate-600 text-right">
                                                            {record.total_liters.toFixed(2)}L
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-800 font-medium text-right">
                                                            {record.total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            {record.status === 'paid' ? (
                                                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Pago"></span>
                                                            ) : (
                                                                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" title="Pendente"></span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-xs sticky bottom-0">
                                            <tr>
                                                <td colSpan={2} className="px-3 py-2 text-slate-600 text-right">TOTAL</td>
                                                <td className="px-3 py-2 text-slate-800 text-right">
                                                    {totalUsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end p-6 border-t border-slate-200 shrink-0 gap-2 bg-slate-50 rounded-b-lg">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg font-medium transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="commitment-form"
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all disabled:opacity-70"
                    >
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        {isSaving ? 'Salvando...' : (commitment ? 'Atualizar Empenho' : 'Criar Empenho')}
                    </button>
                </div>
            </div>
        </div>
    );
};
