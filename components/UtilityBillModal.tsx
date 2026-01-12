import React, { useState, useEffect, useMemo } from 'react';
import { UtilityBill, UtilityCommitment, DynamicSetting, UtilityUnit } from '../types';
import { X, Save, Droplets, Zap, FileText, AlertCircle, Loader2, Phone, Globe, Calendar, Plus, Home, TrendingUp } from 'lucide-react';

interface UtilityBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: UtilityBill | null;
    onSave: (data: UtilityBill | Omit<UtilityBill, 'id'>) => Promise<void>;
    isReadOnly: boolean;
    departments: DynamicSetting[];
    units: UtilityUnit[];
    commitments: UtilityCommitment[];
    bills: UtilityBill[];
}

const MONTHS = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
];

const YEARS = ['2024', '2025', '2026'];

export const UtilityBillModal: React.FC<UtilityBillModalProps> = ({
    isOpen,
    onClose,
    bill,
    onSave,
    isReadOnly,
    departments,
    units,
    commitments,
    bills
}) => {
    const [formData, setFormData] = useState<Partial<UtilityBill>>({
        type: 'light',
        company: '',
        consumerUnit: '',
        localName: '',
        referenceMonth: '',
        dueDate: new Date().toISOString().split('T')[0],
        value: 0,
        barcode: '',
        status: 'pending',
        paymentDate: '',
        commitment_id: '',
        notes: ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1 <= 9 ? `0${new Date().getMonth() + 1}` : `${new Date().getMonth() + 1}`);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    useEffect(() => {
        if (bill) {
            setFormData(bill);
            const [m, y] = bill.referenceMonth.split('/');
            setSelectedMonth(m);
            setSelectedYear(y);
        } else {
            setFormData({
                type: 'light',
                company: '',
                consumerUnit: '',
                localName: '',
                referenceMonth: `${selectedMonth}/${selectedYear}`,
                dueDate: new Date().toISOString().split('T')[0],
                value: 0,
                barcode: '',
                status: 'pending',
                paymentDate: '',
                commitment_id: '',
                notes: ''
            });
        }
    }, [bill, isOpen]);

    useEffect(() => {
        const normalizedMonth = selectedMonth.padStart(2, '0');
        setFormData(prev => ({
            ...prev,
            referenceMonth: `${normalizedMonth}/${selectedYear}`
        }));
    }, [selectedMonth, selectedYear]);

    const filteredCommitments = useMemo(() => {
        const unit = units.find(u => u.consumerUnit === formData.consumerUnit);
        const unitType = unit ? unit.type : formData.type;

        return commitments
            .filter(c => {
                const matchesType = c.type === unitType;
                const matchesUnit = !c.consumerUnit || (c.consumerUnit || '').trim() === (formData.consumerUnit || '').trim();
                const hasBalance = c.balance > 0;
                const isCurrent = bill && c.id === bill.commitment_id;
                return matchesType && matchesUnit && (hasBalance || isCurrent);
            })
            .sort((a, b) => {
                if (a.consumerUnit === formData.consumerUnit && b.consumerUnit !== formData.consumerUnit) return -1;
                if (a.consumerUnit !== formData.consumerUnit && b.consumerUnit === formData.consumerUnit) return 1;
                return 0;
            });
    }, [commitments, formData.consumerUnit, formData.type, bill, units]);

    const handleUnitChange = (unitId: string) => {
        const unit = units.find(u => (u.consumerUnit || '').trim() === (unitId || '').trim());
        if (unit) {
            setFormData(prev => ({
                ...prev,
                consumerUnit: unit.consumerUnit,
                type: unit.type,
                company: unit.company,
                localName: unit.localName,
                commitment_id: unit.default_commitment_id || prev.commitment_id
            }));
        } else {
            setFormData(prev => ({ ...prev, consumerUnit: unitId }));
        }
    };

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
            await onSave(formData as UtilityBill);
            onClose();
        } catch (error) {
            console.error('Failed to save bill', error);
            alert('Erro ao salvar conta.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const selectedCommitment = commitments.find(c => c.id === formData.commitment_id);

    // Recent history for this unit
    const unitHistory = bills
        .filter(b => (b.consumerUnit || '').trim() === (formData.consumerUnit || '').trim())
        .sort((a, b) => {
            const [mA, yA] = a.referenceMonth.split('/');
            const [mB, yB] = b.referenceMonth.split('/');
            return (parseInt(yB) * 12 + parseInt(mB)) - (parseInt(yA) * 12 + parseInt(mA));
        })
        .slice(0, 5);

    const projectedBalance = selectedCommitment ? selectedCommitment.balance - (formData.value || 0) : 0;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl animate-in fade-in zoom-in-95 duration-200 my-8">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <Plus className="text-blue-600" size={28} strokeWidth={2.5} />
                            {bill ? 'Editar Fatura' : 'Lançar Nova Fatura'}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Unidade Consumidora */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-600 ml-1">Unidade Consumidora</label>
                                <select
                                    value={formData.consumerUnit}
                                    onChange={(e) => handleUnitChange(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="">Selecione a Unidade</option>
                                    {units.sort((a, b) => a.localName.localeCompare(b.localName)).map(u => (
                                        <option key={u.id} value={u.consumerUnit}>
                                            {u.localName} ({u.consumerUnit})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Empenho */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-600 ml-1">Empenho</label>
                                <select
                                    name="commitment_id"
                                    value={formData.commitment_id}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="">Selecione o Empenho</option>
                                    {filteredCommitments.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.number} {c.consumerUnit ? `[${c.consumerUnit}]` : ''} - {c.notes || (c.type === 'water' ? 'Água' : 'Luz')} ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.balance)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Valor */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-600 ml-1">Valor (R$)</label>
                                <input
                                    type="number"
                                    name="value"
                                    step="0.01"
                                    value={formData.value === 0 ? '' : formData.value}
                                    placeholder="0.00"
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-700 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                            {/* Competência */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-600 ml-1">Mês de Competência</label>
                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all h-[54px]">
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="bg-transparent py-1.5 text-slate-700 font-medium outline-none cursor-pointer"
                                    >
                                        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                    <span className="mx-2 text-slate-400 font-medium">de</span>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="bg-transparent py-1.5 text-slate-700 font-medium outline-none cursor-pointer"
                                    >
                                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <Calendar className="ml-auto text-slate-400" size={18} />
                                </div>
                            </div>

                            {/* Vencimento */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-600 ml-1">Vencimento</label>
                                <div className="relative h-[54px]">
                                    <input
                                        type="date"
                                        name="dueDate"
                                        value={formData.dueDate?.split('T')[0]}
                                        onChange={handleChange}
                                        className="w-full h-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                        required
                                    />
                                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                </div>
                            </div>

                            {/* Registrar Fatura Button */}
                            <div className="h-[54px]">
                                <button
                                    type="submit"
                                    disabled={isSaving || !formData.commitment_id || !formData.consumerUnit}
                                    className="w-full h-full bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : null}
                                    {isSaving ? 'Gravando...' : bill ? 'Atualizar Fatura' : 'Registrar Fatura'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                            {/* Summary & Projection */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Status do Empenho</h3>
                                {selectedCommitment ? (
                                    <div className={`p-5 rounded-2xl border-2 flex flex-col gap-4 shadow-sm transition-all ${projectedBalance < 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${projectedBalance < 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-500 uppercase">Empenho {selectedCommitment.number}</p>
                                                    <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{selectedCommitment.notes || 'Sem observações'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Empresa</p>
                                                <p className="text-xs font-bold text-slate-600 uppercase tracking-tight">{formData.company}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-white/50 p-4 rounded-xl border border-black/5">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Saldo Atual</p>
                                                <p className="text-lg font-black text-slate-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedCommitment.balance)}</p>
                                            </div>
                                            <div className={`p-4 rounded-xl border ${projectedBalance < 0 ? 'bg-red-100 border-red-200' : 'bg-white/50 border-black/5'}`}>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Novo Saldo (Projetado)</p>
                                                <p className={`text-lg font-black ${projectedBalance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(projectedBalance)}
                                                </p>
                                            </div>
                                        </div>

                                        {projectedBalance < 0 && (
                                            <div className="flex items-center gap-2 text-red-700 bg-red-100/50 p-3 rounded-xl animate-pulse">
                                                <AlertCircle size={18} />
                                                <p className="text-xs font-black uppercase tracking-tight">Saldo insuficiente após este lançamento!</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-8 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-center gap-2">
                                        <FileText size={40} className="opacity-20" />
                                        <p className="text-xs font-bold">Selecione um empenho para ver a projeção do saldo.</p>
                                    </div>
                                )}
                            </div>

                            {/* Spending History */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Histórico Recente (Últimos Gastos)</h3>
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                                    {unitHistory.length > 0 ? (
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-200 bg-slate-100/50">
                                                    <th className="px-4 py-3 font-bold text-slate-500">Mês Ref.</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500">Empenho</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 text-right">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {unitHistory.map((h, i) => (
                                                    <tr key={i} className="hover:bg-white transition-colors">
                                                        <td className="px-4 py-3 font-medium text-slate-600">{h.referenceMonth}</td>
                                                        <td className="px-4 py-3 text-slate-400 font-mono">#{commitments.find(c => c.id === h.commitment_id)?.number || 'N/A'}</td>
                                                        <td className="px-4 py-3 font-bold text-slate-700 text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(h.value)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-12 text-center text-slate-400 space-y-2">
                                            <TrendingUp size={32} className="mx-auto opacity-20" />
                                            <p className="text-xs font-medium">Nenhum gasto anterior registrado para este imóvel.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
