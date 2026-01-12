import React, { useState, useEffect } from 'react';
import { Supplementation } from '../types';
import { X, Save } from 'lucide-react';

interface SupplementationModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplementation: Supplementation | null;
    onSave: (data: Supplementation | Omit<Supplementation, 'id'>) => Promise<void>;
    isReadOnly: boolean;
}

export const SupplementationModal: React.FC<SupplementationModalProps> = ({
    isOpen,
    onClose,
    supplementation,
    onSave,
    isReadOnly
}) => {
    const [formData, setFormData] = useState<Partial<Supplementation>>({
        decreeNumber: '',
        date: new Date().toISOString().split('T')[0],
        value: 0,
        type: 'credit_supplementary',
        source: '',
        justification: '',
        status: 'draft'
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (supplementation) {
            setFormData(supplementation);
        } else {
            setFormData({
                decreeNumber: '',
                date: new Date().toISOString().split('T')[0],
                value: 0,
                type: 'credit_supplementary',
                source: '',
                justification: '',
                status: 'draft'
            });
        }
    }, [supplementation, isOpen]);

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
            await onSave(formData as Supplementation);
            onClose();
        } catch (error) {
            console.error('Failed to save supplementation', error);
            alert('Erro ao salvar suplementação.');
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
                        {supplementation ? 'Editar Suplementação' : 'Nova Suplementação'}
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Criação / Decreto Nº</label>
                            <input
                                type="text"
                                name="decreeNumber"
                                required
                                value={formData.decreeNumber}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data Publicação</label>
                            <input
                                type="date"
                                name="date"
                                required
                                value={formData.date?.split('T')[0]}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Crédito</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="credit_supplementary">Crédito Suplementar</option>
                                <option value="special_credit">Crédito Especial</option>
                                <option value="extraordinary_credit">Crédito Extraordinário</option>
                                <option value="transposition">Transposição</option>
                                <option value="transfer">Remanejamento</option>
                            </select>
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fonte de Recurso</label>
                        <input
                            type="text"
                            name="source"
                            required
                            value={formData.source}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            placeholder="ex: Superávit Financeiro, Anulação de Dotação..."
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Justificativa</label>
                        <textarea
                            name="justification"
                            rows={3}
                            required
                            value={formData.justification}
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
                                <option value="draft">Rascunho</option>
                                <option value="published">Publicado</option>
                            </select>
                        </div>
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
