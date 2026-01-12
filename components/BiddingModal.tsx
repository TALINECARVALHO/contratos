import React, { useState, useEffect } from 'react';
import { Bidding, BiddingModality, BiddingStatus, UserProfile, BiddingEvent } from '../types';
import { createBidding, updateBidding, getStatusLabel } from '../services/biddingService';
import { DEPARTMENTS } from '../constants';
import { X, Check, Calendar, Plus, Save, Trash2, Clock, AlertCircle, FileText, ArrowRight, Activity, Scale, CheckCircle2, AlertTriangle, XCircle, Layout, History } from 'lucide-react';
// date-fns import removed

interface BiddingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    bidding?: Bidding | null;
    userProfile: UserProfile | null;
    isReadOnly?: boolean;
}

type Tab = 'cadastro' | 'cronograma' | 'fluxo';

export const BiddingModal: React.FC<BiddingModalProps> = ({
    isOpen,
    onClose,
    onSave,
    bidding,
    userProfile,
    isReadOnly: propIsReadOnly = false
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('cadastro');
    const [formData, setFormData] = useState<{
        biddingId: string;
        number?: number;
        year?: number;
        modality: BiddingModality;
        object: string;
        department: string;
        status: BiddingStatus;
        processNumber: string;
        entryDate?: string;
        currentResponsible?: string;
        deadline?: string;
        progress?: string;
        submissionStatus?: string;
        events: BiddingEvent[];
        pgmSentDate?: string;
        pgmReturnDate?: string;
        pgmDecision?: 'approved' | 'approved_with_reservation' | 'rejected';
        pgmNotes?: string;
        updated_at?: string;
        winner?: string;
        notes?: string;
        openingDate?: string;
        id?: string;
    }>({
        biddingId: '',
        number: undefined,
        year: new Date().getFullYear(),
        modality: 'dispensa',
        object: '',
        department: '',
        status: 'nao_iniciado',
        processNumber: '',
        entryDate: '',
        currentResponsible: '',
        deadline: '',
        progress: '',
        submissionStatus: '',
        events: [],
        pgmSentDate: '',
        pgmReturnDate: '',
        pgmDecision: undefined,
        pgmNotes: ''
    });
    const [newEvent, setNewEvent] = useState<{ description: string; date: string }>({ description: '', date: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const isReadOnly = propIsReadOnly;

    useEffect(() => {
        if (isOpen) {
            if (bidding) {
                setFormData({
                    ...bidding,
                    // Ensure arrays/objects are initialized if missing
                    events: bidding.events || []
                });
            } else {
                setFormData({
                    biddingId: '',
                    number: undefined,
                    year: new Date().getFullYear(),
                    modality: 'dispensa',
                    object: '',
                    department: (userProfile?.department && userProfile.department !== 'TI') ? userProfile.department : '',
                    status: 'nao_iniciado',
                    processNumber: '',
                    entryDate: new Date().toLocaleDateString('pt-BR'),
                    currentResponsible: '',
                    deadline: '',
                    progress: '',
                    submissionStatus: '',
                    events: [],
                    pgmSentDate: '',
                    pgmReturnDate: '',
                    pgmDecision: undefined,
                    pgmNotes: ''
                });
            }
            setActiveTab('cadastro');
            setNewEvent({ description: '', date: '' });
            setShowSuccess(false);
        }
    }, [isOpen, bidding, userProfile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;
        setIsSaving(true);
        try {
            if (bidding?.id) {
                await updateBidding(bidding.id, formData);
            } else {
                await createBidding(formData as Omit<Bidding, 'id'>);
            }
            onSave();
            setShowSuccess(true);
        } catch (error) {
            console.error('Error saving bidding:', error);
            alert('Erro ao salvar licitação. Verifique os campos e tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddEvent = () => {
        if (!newEvent.description || !newEvent.date) return;
        const event: BiddingEvent = {
            id: crypto.randomUUID(),
            description: newEvent.description,
            date: newEvent.date,
            created_at: new Date().toISOString()
        };

        const updatedEvents = [...(formData.events || []), event];

        const isOpening = event.description.toLowerCase().includes('sessão') || event.description.toLowerCase().includes('abertura');

        setFormData(prev => ({
            ...prev,
            events: updatedEvents,
            openingDate: isOpening ? event.date : prev.openingDate
        }));

        setNewEvent({ description: '', date: '' });
    };

    const handleRemoveEvent = (eventId: string) => {
        setFormData(prev => ({
            ...prev,
            events: prev.events?.filter(e => e.id !== eventId)
        }));
    };

    if (!isOpen) return null;

    const TabButton = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 font-medium transition-colors ${activeTab === id
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in relative">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 sticky top-0 z-10 rounded-t-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 uppercase">
                                {isReadOnly ? 'Detalhes' : (bidding ? `Editar ${bidding.biddingId || 'Licitação'}` : 'Nova Licitação')}
                            </h2>
                            <p className="text-[10px] text-slate-500 mt-0.5 uppercase font-bold tracking-widest">
                                Módulo de Licitações
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-600 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 sticky top-[88px] z-10 bg-white">
                    <TabButton id="cadastro" label="Cadastro" icon={Layout} />
                    <TabButton id="cronograma" label="Cronograma e Histórico" icon={History} />
                    <TabButton id="fluxo" label="Fluxo de Despacho (PGM)" icon={Scale} />
                </div>

                {/* Content */}
                <div className="overflow-y-auto custom-scrollbar flex-1 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* TAB: CADASTRO */}
                        {activeTab === 'cadastro' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                        1. Identificação
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Data de Entrada do Processo
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="DD/MM/AAAA"
                                                value={formData.entryDate || ''}
                                                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                                                disabled={isReadOnly}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Modalidade <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                required
                                                value={formData.modality}
                                                onChange={(e) => setFormData({ ...formData, modality: e.target.value as BiddingModality })}
                                                disabled={isReadOnly}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
                                            >
                                                <option value="dispensa">Dispensa</option>
                                                <option value="inexigibilidade">Inexigibilidade</option>
                                                <option value="pregao_eletronico">Pregão Eletrônico</option>
                                                <option value="concorrencia_eletronica">Concorrência Eletrônica</option>
                                                <option value="credenciamento">Credenciamento</option>
                                                <option value="chamamento_publico">Chamamento Público</option>
                                                <option value="pregao_presencial">Pregão Presencial</option>
                                                <option value="tomada_precos">Tomada de Preços</option>
                                                <option value="convite">Convite</option>
                                                <option value="concorrencia">Concorrência</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Objeto <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                required
                                                value={formData.object || ''}
                                                onChange={(e) => setFormData({ ...formData, object: e.target.value })}
                                                disabled={isReadOnly}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Secretaria Responsável <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                required
                                                value={formData.department || ''}
                                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                disabled={isReadOnly}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
                                            >
                                                <option value="">Selecione...</option>
                                                {DEPARTMENTS.map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                                <option value="CENTRAL DE LICITAÇÕES">CENTRAL DE LICITAÇÕES</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Posição Atual (Status) <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                required
                                                value={formData.status || 'nao_iniciado'}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as BiddingStatus })}
                                                disabled={isReadOnly}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 font-medium"
                                            >
                                                <option value="nao_iniciado">NÃO INICIADO</option>
                                                <option value="elaborando_edital">ELABORANDO EDITAL</option>
                                                <option value="ajustes_necessarios">AJUSTES NECESSÁRIOS</option>
                                                <option value="parecer_juridico">PARECER JURÍDICO</option>
                                                <option value="aguardando_sessao">AGUARDANDO SESSÃO</option>
                                                <option value="habilitacao_recursos">HABILITAÇÃO / RECURSOS</option>
                                                <option value="adjudicacao_homologacao">ADJUDICAÇÃO / HOMOLOGAÇÃO</option>
                                                <option value="deserta">DESERTA</option>
                                                <option value="fracassada">FRACASSADA</option>
                                                <option value="bem_sucedida">BEM SUCEDIDA</option>
                                                <option value="assinatura_prefeito">ASSINATURA PREFEITO</option>
                                                <option value="amostra">AMOSTRA</option>
                                                <option value="contratacao">CONTRATAÇÃO</option>
                                                <option value="suspensa">SUSPENSA</option>
                                                <option value="proposta">PROPOSTA</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                        2. Detalhes Adicionais
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Número (Opcional)
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={formData.number || ''}
                                                    onChange={(e) => setFormData({ ...formData, number: e.target.value ? parseInt(e.target.value) : undefined })}
                                                    disabled={isReadOnly}
                                                    className="w-2/3 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
                                                    placeholder="Nº"
                                                />
                                                <input
                                                    type="number"
                                                    value={formData.year || new Date().getFullYear()}
                                                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                                    disabled={isReadOnly}
                                                    className="w-1/3 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
                                                    placeholder="Ano"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                ID da Licitação (Visível)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.biddingId || ''}
                                                onChange={(e) => setFormData({ ...formData, biddingId: e.target.value })}
                                                disabled={isReadOnly}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 uppercase"
                                                placeholder="Ex: 001/2026"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Prazo Limite (Previsão)
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.deadline || ''}
                                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                                disabled={isReadOnly}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
                                            />
                                        </div>

                                    </div>
                                </div>


                                {/* Step 6: Assinatura Prefeito */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                        6. Assinatura Prefeito
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Data da Assinatura
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.signatureDate || ''}
                                                onChange={(e) => setFormData({ ...formData, signatureDate: e.target.value })}
                                                disabled={isReadOnly}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Step 7: Lançamentos Administrativos */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                        7. Lançamentos Administrativos
                                    </h3>
                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {[
                                                { key: 'checklist_grp', label: 'GRP' },
                                                { key: 'checklist_anexos', label: 'Anexos' },
                                                { key: 'checklist_licitacon', label: 'LicitaCon' },
                                                { key: 'checklist_ordem_compra', label: 'Ordem Compra' }
                                            ].map((item) => (
                                                <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all ${
                                                        // @ts-ignore
                                                        formData[item.key]
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'bg-white border-slate-300 group-hover:border-blue-400'
                                                        }`}>
                                                        {
                                                            // @ts-ignore
                                                            formData[item.key] && <Check size={20} strokeWidth={3} />
                                                        }
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        // @ts-ignore
                                                        checked={formData[item.key] || false}
                                                        disabled={isReadOnly}
                                                        onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                                                    />
                                                    <span className={`font-medium text-slate-700 group-hover:text-blue-700 transition-colors ${
                                                        // @ts-ignore
                                                        formData[item.key] ? 'font-bold' : ''
                                                        }`}>
                                                        {item.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: CRONOGRAMA */}
                        {activeTab === 'cronograma' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
                                        <History size={16} /> Adicionar Evento / Marco
                                    </h3>
                                    {!isReadOnly && (
                                        <div className="flex gap-2 items-end">
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição do Evento</label>
                                                <input
                                                    type="text"
                                                    value={newEvent.description}
                                                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="Ex: Sessão, Homologação, Impugnação..."
                                                />
                                            </div>
                                            <div className="w-40">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                                                <input
                                                    type="date"
                                                    value={newEvent.date}
                                                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAddEvent}
                                                disabled={!newEvent.description || !newEvent.date}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold uppercase text-xs flex items-center gap-1 h-[42px]"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 pt-4">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Linha do Tempo (Histórico)</h3>
                                    <div className="relative pl-6 border-l-2 border-slate-200 space-y-8">
                                        {(!formData.events || formData.events.length === 0) ? (
                                            <div className="text-slate-400 text-sm italic pl-2">Nenhum evento registrado.</div>
                                        ) : (
                                            formData.events
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                .map((event, index) => (
                                                    <div key={event.id || index} className="relative group">
                                                        <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-4 border-blue-500 group-hover:border-blue-600 transition-colors shadow-sm"></div>

                                                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm group-hover:shadow-md transition-shadow">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                                                                        <Calendar size={12} /> {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                                    </span>
                                                                    <h4 className="font-bold text-slate-800 text-sm md:text-base">{event.description}</h4>
                                                                </div>
                                                                {!isReadOnly && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveEvent(event.id)}
                                                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                                        title="Remover Evento"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: FLUXO PGM */}
                        {activeTab === 'fluxo' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
                                            <Scale size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-purple-900">Despacho para PGM</h3>
                                            <p className="text-sm text-purple-700 opacity-80">Controle de envio para análise jurídica</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-purple-800 uppercase mb-1">
                                                Data de Envio
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.pgmSentDate || ''}
                                                onChange={(e) => setFormData({ ...formData, pgmSentDate: e.target.value })}
                                                disabled={isReadOnly}
                                                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-purple-900"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-purple-800 uppercase mb-1">
                                                Data de Retorno
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.pgmReturnDate || ''}
                                                onChange={(e) => setFormData({ ...formData, pgmReturnDate: e.target.value })}
                                                disabled={isReadOnly}
                                                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-purple-900"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-purple-800 uppercase mb-1">
                                                Decisão / Parecer
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <button
                                                    type="button"
                                                    disabled={isReadOnly}
                                                    onClick={() => setFormData({ ...formData, pgmDecision: 'approved' })}
                                                    className={`px-4 py-3 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.pgmDecision === 'approved'
                                                        ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-green-200 hover:bg-green-50/50'
                                                        }`}
                                                >
                                                    <CheckCircle2 size={24} className={formData.pgmDecision === 'approved' ? 'text-green-600' : 'opacity-50'} />
                                                    <span className="text-xs font-bold uppercase">Aprovado</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={isReadOnly}
                                                    onClick={() => setFormData({ ...formData, pgmDecision: 'approved_with_reservation' })}
                                                    className={`px-4 py-3 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.pgmDecision === 'approved_with_reservation'
                                                        ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-amber-200 hover:bg-amber-50/50'
                                                        }`}
                                                >
                                                    <AlertTriangle size={24} className={formData.pgmDecision === 'approved_with_reservation' ? 'text-amber-600' : 'opacity-50'} />
                                                    <span className="text-xs font-bold uppercase">Ressalvas</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={isReadOnly}
                                                    onClick={() => setFormData({ ...formData, pgmDecision: 'rejected' })}
                                                    className={`px-4 py-3 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.pgmDecision === 'rejected'
                                                        ? 'bg-red-50 border-red-500 text-red-700 shadow-sm'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50/50'
                                                        }`}
                                                >
                                                    <XCircle size={24} className={formData.pgmDecision === 'rejected' ? 'text-red-600' : 'opacity-50'} />
                                                    <span className="text-xs font-bold uppercase">Reprovado</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-purple-800 uppercase mb-1">
                                                Observações da Análise
                                            </label>
                                            <textarea
                                                value={formData.pgmNotes || ''}
                                                onChange={(e) => setFormData({ ...formData, pgmNotes: e.target.value })}
                                                disabled={isReadOnly}
                                                rows={4}
                                                placeholder="Detalhes sobre o parecer, correções solicitadas, etc."
                                                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-purple-900 placeholder:text-purple-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer Controls */}
                        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            {!isReadOnly && (
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    {isSaving ? 'Salvando...' : 'Salvar Licitação'}
                                </button>
                            )}
                        </div>
                    </form>
                </div >

                {showSuccess && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-[60] text-center animate-in fade-in zoom-in-95 duration-300 rounded-xl">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6 animate-bounce">
                            <Check size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Licitação Salva!</h2>
                        <p className="text-slate-500 max-w-sm mb-8 px-6">
                            Os dados da licitação foram registrados com sucesso no sistema.
                        </p>
                        <button
                            onClick={onClose}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100 text-sm tracking-wide"
                        >
                            Voltar para a Lista
                        </button>
                    </div>
                )}
            </div >
        </div >
    );
};
