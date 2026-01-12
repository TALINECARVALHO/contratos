import React, { useState, useEffect } from 'react';
import { Commitment, Contract } from '../types';
import { X, Save } from 'lucide-react';

interface CommitmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    commitment: Commitment | null;
    contracts: Contract[];
    onSave: (commitment: Commitment | Omit<Commitment, 'id'>) => Promise<void>;
    isReadOnly: boolean;
}

export const CommitmentModal: React.FC<CommitmentModalProps> = ({
    isOpen,
    onClose,
    commitment,
    contracts,
    onSave,
    isReadOnly
}) => {
    const [formData, setFormData] = useState<Partial<Commitment>>({
        contractId: '',
        number: '',
        issueDate: new Date().toISOString().split('T')[0],
        value: 0,
        description: '',
        status: 'pending',
        notes: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (commitment) {
            setFormData(commitment);
        } else {
            setFormData({
                contractId: '',
                number: '',
                issueDate: new Date().toISOString().split('T')[0],
                value: 0,
                description: '',
                status: 'pending',
                notes: ''
            });
        }
    }, [commitment, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'value' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;
        setIsSaving(true);
        try {
            await onSave(formData as Commitment);
            onClose();
        } catch (error) {
            console.error('Failed to save commitment', error);
            alert('Erro ao salvar empenho.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800">
                        {commitment ? 'Editar Empenho' : 'Novo Empenho'}
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contrato Vinculado</label>
                            <select
                                name="contractId"
                                required
                                value={formData.contractId}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Selecione um contrato...</option>
                                {contracts.map(c => (
                                    <option key={c.id} value={c.id}>{c.contractId} - {c.supplier}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Número do Empenho</label>
                            <input
                                type="text"
                                name="number"
                                required
                                value={formData.number}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                placeholder="ex: 2024/001"
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data de Emissão</label>
                            <input
                                type="date"
                                name="issueDate"
                                required
                                value={formData.issueDate?.split('T')[0]}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                            <input
                                type="number"
                                name="value"
                                step="0.01"
                                required
                                value={formData.value}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição / Objeto</label>
                        <textarea
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="pending">Pendente</option>
                                <option value="paid">Pago</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                        <textarea
                            name="notes"
                            rows={2}
                            value={formData.notes}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg mr-2"
                        >
                            Cancelar
                        </button>
                        {!isReadOnly && (
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                {isSaving ? 'Salvando...' : <><Save size={20} /> Salvar</>}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
