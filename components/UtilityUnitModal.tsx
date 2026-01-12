import React, { useState, useEffect } from 'react';
import { UtilityUnit, UtilityCommitment, DynamicSetting } from '../types';
import { X, Save, Home, Loader2 } from 'lucide-react';

interface UtilityUnitModalProps {
    isOpen: boolean;
    onClose: () => void;
    unit: UtilityUnit | null;
    commitments: UtilityCommitment[];
    departments: DynamicSetting[];
    onSave: (data: UtilityUnit | Omit<UtilityUnit, 'id'>) => Promise<void>;
}

export const UtilityUnitModal: React.FC<UtilityUnitModalProps> = ({
    isOpen,
    onClose,
    unit,
    commitments,
    departments,
    onSave
}) => {
    const [formData, setFormData] = useState<Partial<UtilityUnit>>({
        consumerUnit: '',
        localName: '',
        type: 'light',
        company: 'RGE',
        department: '',
        default_commitment_id: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (unit) {
            setFormData(unit);
        } else {
            setFormData({
                consumerUnit: '',
                localName: '',
                type: 'light',
                company: 'RGE',
                department: '',
                default_commitment_id: ''
            });
        }
    }, [unit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Adjust company based on type if it's a new unit
        if (name === 'type' && !unit) {
            let company = 'RGE';
            if (value === 'water') company = 'Corsan';
            if (value === 'phone') company = 'Oi';
            setFormData(prev => ({ ...prev, company }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData as UtilityUnit);
            onClose();
        } catch (error: any) {
            console.error('Failed to save unit', error);
            alert(`Erro ao salvar unidade: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    // Filter commitments by type for the dropdown
    const filteredCommitments = commitments.filter(c => c.type === formData.type);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[65] overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Home className="text-blue-600" />
                        {unit ? 'Editar Código do Imóvel' : 'Novo Código do Imóvel'}
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Código do Imóvel (Matrícula)</label>
                            <input
                                type="text"
                                name="consumerUnit"
                                required
                                value={formData.consumerUnit}
                                onChange={handleChange}
                                placeholder="Ex: 5547413"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Local / Unidade</label>
                            <input
                                type="text"
                                name="localName"
                                required
                                value={formData.localName}
                                onChange={handleChange}
                                placeholder="Ex: Escola Municipal João Silva"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Serviço</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="light">Luz</option>
                                <option value="water">Água</option>
                                <option value="phone">Telefone</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
                            <input
                                type="text"
                                name="company"
                                required
                                value={formData.company}
                                onChange={handleChange}
                                placeholder="Ex: RGE, Certel, Corsan"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Dia de Vencimento Fixo (1-31)</label>
                            <input
                                type="number"
                                name="due_day"
                                min="1"
                                max="31"
                                value={formData.due_day || ''}
                                onChange={handleChange}
                                placeholder="Ex: 10 (para vencer todo dia 10)"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Dia fixo do mês em que as contas deste imóvel vencem. Deixe em branco se não houver dia fixo.</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Secretaria Responsável</label>
                        <select
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Selecione uma secretaria</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.name}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Empenho Global Padrão</label>
                        <select
                            name="default_commitment_id"
                            value={formData.default_commitment_id}
                            onChange={handleChange}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Nenhum vínculo inicial</option>
                            {filteredCommitments.map(c => (
                                <option key={c.id} value={c.id}>Empenho Nº {c.number} ({formatCurrency(c.balance)})</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">Isso ajuda a debitar automaticamente do empenho correto ao lançar valores na planilha.</p>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg mr-2 font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all disabled:opacity-70"
                        >
                            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            {isSaving ? 'Salvar Unidade' : 'Salvar Unidade'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};
