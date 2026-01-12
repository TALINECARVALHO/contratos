import React, { useState, useEffect, useMemo } from 'react';
import { SupplementationRequest, SupplementationItem } from '../types';
import { fetchDepartments, DynamicSetting } from '../services/settingsService';
import { createSupplementation, updateSupplementation } from '../services/supplementationService';
import { Plus, Trash2, Send, Save, ArrowLeft, Loader2, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface SupplementationFormProps {
    onCancel: () => void;
    userProfile: any;
    initialData?: SupplementationRequest;
}

export const SupplementationForm: React.FC<SupplementationFormProps> = ({ onCancel, userProfile, initialData }) => {
    const [departments, setDepartments] = useState<DynamicSetting[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Header Data
    const [selectedDept, setSelectedDept] = useState(initialData?.department || userProfile?.department || '');
    const [responsible, setResponsible] = useState(initialData?.responsible_name || userProfile?.name || '');
    const [isExcessRevenue, setIsExcessRevenue] = useState(initialData?.is_excess_revenue || false);
    const [isSurplus, setIsSurplus] = useState(initialData?.is_surplus || false);

    // Items
    const [additions, setAdditions] = useState<SupplementationItem[]>(
        initialData?.items?.filter(i => i.type === 'addition') ||
        [{ type: 'addition', dotation: '', rubric: '', value: 0, resource: '', justification: '' }]
    );

    const [reductions, setReductions] = useState<SupplementationItem[]>(
        initialData?.items?.filter(i => i.type === 'reduction') || []
    );

    const RUBRIC_OPTIONS = [
        { code: '3.1.90.11', label: 'VENCIMENTOS E VANTAGENS FIXAS - PESSOAL CIVIL' },
        { code: '3.1.90.13', label: 'OBRIGACOES PATRONAIS' },
        { code: '3.1.90.16', label: 'OUTRAS DESPESAS VARIAVEIS - PESSOAL CIVIL' },
        { code: '3.1.90.94', label: 'INDENIZACOES TRABALHISTAS' },
        { code: '3.1.91.13', label: 'CONTRIBUIÇÕES PATRONAIS' },
        { code: '3.3.90.08', label: 'OUTROS BENEFÍCIOS ASSISTENCIAIS DO SERVIDOR E DO MILITAR' },
        { code: '3.3.90.14', label: 'DIARIAS - PESSOAL CIVIL' },
        { code: '3.3.90.30', label: 'MATERIAL DE CONSUMO' },
        { code: '3.3.90.32', label: 'MATERIAL DE DISTRIBUICAO GRATUITA' },
        { code: '3.3.90.33', label: 'PASSAGENS E DESPESAS COM LOCOMOCAO' },
        { code: '3.3.90.35', label: 'SERVICOS DE CONSULTORIA' },
        { code: '3.3.90.36', label: 'OUTROS SERVICOS DE TERCEIROS - PESSOA FISICA' },
        { code: '3.3.90.39', label: 'OUTROS SERVICOS DE TERCEIROS-PESSOA JURIDICA' },
        { code: '3.3.90.40', label: 'SERVIÇOS DE TECNOLOGIA DA INFORMAÇÃO E COMUNICAÇÃO - PJ' },
        { code: '3.3.90.46', label: 'AUXILIO-ALIMENTACAO' },
        { code: '3.3.90.48', label: 'OUTROS AUXILIOS FINANCEIROS A PESSOA FISICA' },
        { code: '3.3.90.92', label: 'DESPESAS DE EXERCÍCIOS ANTERIORES' },
        { code: '3.3.90.93', label: 'INDENIZACOES E RESTITUICOES' },
        { code: '4.4.30.93', label: 'INDENIZACOES E RESTITUICOES' },
        { code: '4.4.90.51', label: 'OBRAS E INSTALACOES' },
        { code: '4.4.90.52', label: 'EQUIPAMENTOS E MATERIAL PERMANENTE' },
        { code: '4.4.90.61', label: 'AQUISIÇÃO DE IMÓVEIS' }
    ].sort((a, b) => a.code.localeCompare(b.code));

    useEffect(() => {
        fetchDepartments().then(setDepartments).catch(console.error);
    }, []);

    useEffect(() => {
        if (!selectedDept && userProfile?.department) {
            setSelectedDept(userProfile.department);
        }
    }, [userProfile, selectedDept]);

    // Helper to format currency
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Calculations
    const totalAddition = useMemo(() => additions.reduce((acc, item) => acc + (Number(item.value) || 0), 0), [additions]);
    const totalReduction = useMemo(() => reductions.reduce((acc, item) => acc + (Number(item.value) || 0), 0), [reductions]);
    const difference = totalAddition - totalReduction;
    const rubricsCount = useMemo(() => {
        const unique = new Set([...additions.map(a => a.rubric), ...reductions.map(r => r.rubric)]);
        return unique.size; // Simple count of unique rubrics, or just total items as per screenshot "Rubricas (contagem)" might imply separate entries
    }, [additions, reductions]);

    const handleAddItem = (type: 'addition' | 'reduction') => {
        const newItem: SupplementationItem = {
            type,
            dotation: '',
            rubric: '',
            value: 0,
            resource: '',
            justification: type === 'addition' ? '' : undefined
        };
        if (type === 'addition') setAdditions([...additions, newItem]);
        else setReductions([...reductions, newItem]);
    };

    const handleRemoveItem = (type: 'addition' | 'reduction', index: number) => {
        if (type === 'addition') {
            if (additions.length === 1) return; // Prevent removing the last mandatory addition
            setAdditions(additions.filter((_, i) => i !== index));
        } else {
            setReductions(reductions.filter((_, i) => i !== index));
        }
    };

    const updateItem = (type: 'addition' | 'reduction', index: number, field: keyof SupplementationItem, value: any) => {
        const target = type === 'addition' ? [...additions] : [...reductions];
        target[index] = { ...target[index], [field]: value };
        if (type === 'addition') setAdditions(target);
        else setReductions(target);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (initialData?.id) {
                // UPDATE MODE
                await updateSupplementation({
                    id: initialData.id,
                    department: selectedDept,
                    responsible_name: responsible,
                    is_excess_revenue: isExcessRevenue,
                    is_surplus: isSurplus,
                    total_addition: totalAddition,
                    total_reduction: totalReduction,
                    status: 'pending', // Reset to pending on edit
                    items: [...additions, ...reductions]
                } as SupplementationRequest);
                alert("Solicitação atualizada com sucesso!\n\nO processo foi reencaminhado para análise.");
            } else {
                // CREATE MODE
                const { data: request, error: reqError } = await supabase
                    .from('supplementation_requests')
                    .insert([{
                        department: selectedDept,
                        responsible_name: responsible,
                        is_excess_revenue: isExcessRevenue,
                        is_surplus: isSurplus,
                        total_addition: totalAddition,
                        total_reduction: totalReduction,
                        status: 'pending',
                        user_id: userProfile?.id
                    }])
                    .select()
                    .single();

                if (reqError) throw reqError;

                // Create Items
                const allItems = [
                    ...additions.map(i => ({ ...i, request_id: request.id })),
                    ...reductions.map(i => ({ ...i, request_id: request.id }))
                ];

                const { error: itemsError } = await supabase
                    .from('supplementation_items')
                    .insert(allItems.map(item => ({
                        request_id: item.request_id,
                        type: item.type,
                        dotation: item.dotation,
                        rubric: item.rubric,
                        value: item.value,
                        resource: item.resource,
                        justification: item.justification
                    })));

                if (itemsError) throw itemsError;
                setShowSuccess(true);
            }
        } catch (error: any) {
            alert("Erro ao enviar: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center animate-in zoom-in-95 duration-500 min-h-[400px]">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 animate-bounce">
                    <Check size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Solicitação enviada!</h2>
                <p className="text-slate-500 max-w-sm mb-8">
                    {initialData
                        ? "As alterações foram registradas e o processo foi reencaminhado para análise."
                        : "Sua solicitação foi registrada com sucesso e encaminhada para a equipe de análise."}
                </p>
                <button
                    onClick={onCancel}
                    className="bg-slate-800 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-900 transition-all active:scale-95"
                >
                    Entendido
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 animate-fade-in p-4 lg:p-0">
            {/* Form Area */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
                <div>
                    <button onClick={onCancel} className="mb-4 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm"><ArrowLeft size={16} /> Voltar</button>
                    <h2 className="text-2xl font-bold text-slate-800">{initialData ? 'Editar Solicitação' : 'Solicitar Suplementação'}</h2>
                    <p className="text-slate-500 text-sm mt-1">Adição é obrigatória (pode ter várias). Cada <strong>Adição</strong> exige uma <strong>justificativa</strong>.</p>
                </div>

                {initialData?.rejection_reason && initialData.status === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="font-bold text-red-800">Solicitação Reprovada</p>
                            <p className="text-red-700 text-sm mt-1">{initialData.rejection_reason}</p>
                            <p className="text-red-600 text-xs mt-2 italic">Faça as correções necessárias abaixo e reenvie.</p>
                        </div>
                    </div>
                )}



                {/* Additions */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">Dados de Adição</h3>
                    {additions.map((item, idx) => (
                        <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
                            <h4 className="font-bold text-slate-700 text-sm">Adição #{idx + 1}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dotação *</label>
                                    <input type="text" className="w-full p-2 border border-slate-300 rounded-lg bg-white" value={item.dotation} onChange={e => updateItem('addition', idx, 'dotation', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rubrica *</label>
                                    <select className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={item.rubric} onChange={e => updateItem('addition', idx, 'rubric', e.target.value)}>
                                        <option value="">Selecione a rubrica...</option>
                                        {RUBRIC_OPTIONS.map(opt => (
                                            <option key={opt.code} value={`${opt.code} - ${opt.label}`}>
                                                {opt.code} - {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">R$</span>
                                        <input
                                            type="number"
                                            className="w-full pl-10 p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="0,00"
                                            value={item.value || ''}
                                            onChange={e => updateItem('addition', idx, 'value', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recurso *</label>
                                    <input type="text" className="w-full p-2 border border-slate-300 rounded-lg bg-white" value={item.resource} onChange={e => updateItem('addition', idx, 'resource', e.target.value)} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Justificativa desta adição *</label>
                                    <textarea rows={2} className="w-full p-2 border border-slate-300 rounded-lg bg-white resize-none" value={item.justification} onChange={e => updateItem('addition', idx, 'justification', e.target.value)}></textarea>
                                </div>
                            </div>
                            {additions.length > 1 && (
                                <button onClick={() => handleRemoveItem('addition', idx)} className="text-red-500 text-xs font-bold border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                                    Remover esta Adição
                                </button>
                            )}
                        </div>
                    ))}
                    <button onClick={() => handleAddItem('addition')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                        <Plus size={16} /> Adicionar Adição
                    </button>
                </div>

                {/* Resource Source */}
                <div className="space-y-4">
                    <div className="flex flex-col gap-2 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                        <p className="text-xs font-bold text-slate-600 uppercase mb-1">Origem dos Recursos (Fonte de custeio)</p>
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer font-medium hover:bg-white p-2 rounded transition-colors">
                                <input type="checkbox" checked={isExcessRevenue} onChange={e => setIsExcessRevenue(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-5 h-5" />
                                Excesso de arrecadação
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer font-medium hover:bg-white p-2 rounded transition-colors">
                                <input type="checkbox" checked={isSurplus} onChange={e => setIsSurplus(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-5 h-5" />
                                Superávit Financeiro
                            </label>
                        </div>
                        <p className="text-xs text-slate-500">Selecione uma opção acima OU adicione <strong>Reduções</strong> compensatórias abaixo.</p>
                    </div>
                </div>

                {/* Reductions */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">Dados de Redução (opcional)</h3>
                    {reductions.map((item, idx) => (
                        <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
                            <h4 className="font-bold text-slate-700 text-sm">Redução #{idx + 1}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dotação</label>
                                    <input type="text" className="w-full p-2 border border-slate-300 rounded-lg bg-white" value={item.dotation} onChange={e => updateItem('reduction', idx, 'dotation', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rubrica</label>
                                    <select className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={item.rubric} onChange={e => updateItem('reduction', idx, 'rubric', e.target.value)}>
                                        <option value="">Selecione a rubrica...</option>
                                        {RUBRIC_OPTIONS.map(opt => (
                                            <option key={opt.code} value={`${opt.code} - ${opt.label}`}>
                                                {opt.code} - {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">R$</span>
                                        <input
                                            type="number"
                                            className="w-full pl-10 p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="0,00"
                                            value={item.value || ''}
                                            onChange={e => updateItem('reduction', idx, 'value', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recurso</label>
                                    <input type="text" className="w-full p-2 border border-slate-300 rounded-lg bg-white" value={item.resource} onChange={e => updateItem('reduction', idx, 'resource', e.target.value)} />
                                </div>
                            </div>
                            <button onClick={() => handleRemoveItem('reduction', idx)} className="text-red-500 text-xs font-bold border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                                Remover esta Redução
                            </button>
                        </div>
                    ))}
                    <button onClick={() => handleAddItem('reduction')} className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-50 transition-colors">
                        <Plus size={16} /> Adicionar Redução
                    </button>
                </div>

            </div>

            {/* Sidebar Summary */}
            <div className="w-full lg:w-80">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
                    <h3 className="font-bold text-slate-800 mb-4">Resumo</h3>

                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Secretaria</p>
                            <p className="font-bold text-slate-800">{selectedDept || '—'}</p>
                        </div>
                        <div className="border-t pt-4">
                            <p className="text-xs text-slate-500 uppercase">Total Adições</p>
                            <p className="font-bold text-slate-800 text-lg text-green-600">{formatCurrency(totalAddition)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Total Reduções</p>
                            <p className="font-bold text-slate-800 text-lg text-red-600">{formatCurrency(totalReduction)}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase">Diferença (Adição - Redução)</p>
                            <p className={`font-bold text-lg ${difference >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatCurrency(difference)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Rubricas (contagem)</p>
                            <p className="font-bold text-slate-800">{additions.length + reductions.length} itens</p>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !selectedDept || totalAddition === 0 || ((!isExcessRevenue && !isSurplus) && Math.abs(difference) > 0.01)}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Enviar solicitação'}
                            </button>
                            {((!isExcessRevenue && !isSurplus) && Math.abs(difference) > 0.01) && (
                                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-2 rounded text-xs">
                                    <AlertCircle size={14} />
                                    <span>Para anulação, os valores devem ser iguais (Diferença deve ser R$ 0,00).</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
