import React, { useState, useMemo } from 'react';
import { ContractAmendment, Contract, UserProfile } from '../types';
import { Scale, FileText, Calendar, Clock, AlertCircle, CheckCircle2, XCircle, AlertTriangle, Search, Filter, Trash2, RotateCcw } from 'lucide-react';

interface PGMDispatchListProps {
    amendments: ContractAmendment[];
    contracts: Contract[];
    userProfile: UserProfile | null;
    onEditAmendment: (amendment: ContractAmendment) => void;
    onRemoveFromAnalysis?: (amendment: ContractAmendment) => void;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'with_reservation';
type Tab = 'pending' | 'history';

export const PGMDispatchList: React.FC<PGMDispatchListProps> = ({
    amendments,
    contracts,
    userProfile,
    onEditAmendment,
    onRemoveFromAnalysis
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [activeTab, setActiveTab] = useState<Tab>('pending');

    // Filtra apenas aditivos que foram enviados para PGM (step3 = true) OU já possuem decisão (step4 definido)
    const pgmAmendments = useMemo(() => {
        return amendments.filter(a => a.checklist?.step3 === true || !!a.checklist?.step4);
    }, [amendments]);

    // Separa os itens pendentes dos históricos
    const { pendingItems, historyItems } = useMemo(() => {
        // Pendente: Tem step3 e NÃO tem step4
        const pending = pgmAmendments.filter(a => a.checklist?.step3 === true && !a.checklist?.step4);

        // Histórico: Tem step4 (decisão tomada)
        const history = pgmAmendments.filter(a => !!a.checklist?.step4);

        return { pendingItems: pending, historyItems: history };
    }, [pgmAmendments]);

    // Aplica filtros de busca e status na lista atual (baseada na aba)
    const filteredAmendments = useMemo(() => {
        let sourceList = activeTab === 'pending' ? pendingItems : historyItems;
        let filtered = [...sourceList];

        // Filtro por status (apenas na aba de histórico, já que pendentes são sempre pendentes)
        if (activeTab === 'history' && filterStatus !== 'all') {
            filtered = filtered.filter(a => {
                if (filterStatus === 'approved') return a.checklist?.step4 === 'approved';
                if (filterStatus === 'rejected') return a.pgmDecision === 'rejected'; // Fallback logic
                if (filterStatus === 'with_reservation') return a.checklist?.step4 === 'approved_with_reservation';
                return true;
            });
        }

        // Filtro por busca
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(a => {
                const contract = contracts.find(c => String(c.id) === String(a.contractId));
                return (
                    a.eventName?.toLowerCase().includes(term) ||
                    a.contractIdentifier?.toLowerCase().includes(term) ||
                    contract?.object?.toLowerCase().includes(term) ||
                    contract?.supplier?.toLowerCase().includes(term)
                );
            });
        }

        // Ordena por data de entrada (mais recentes primeiro)
        filtered.sort((a, b) => {
            const dateA = a.entryDate ? new Date(a.entryDate.split('/').reverse().join('-')).getTime() : 0;
            const dateB = b.entryDate ? new Date(b.entryDate.split('/').reverse().join('-')).getTime() : 0;
            return dateB - dateA;
        });

        return filtered;
    }, [pendingItems, historyItems, filterStatus, searchTerm, contracts, activeTab]);

    const getStatusInfo = (amendment: ContractAmendment) => {
        if (amendment.pgmDecision === 'rejected') {
            return { label: 'REPROVADO', color: 'bg-red-100 text-red-700', icon: <XCircle size={16} /> };
        }
        if (amendment.checklist?.step4 === 'approved') {
            return { label: 'APROVADO', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={16} /> };
        }
        if (amendment.checklist?.step4 === 'approved_with_reservation') {
            return { label: 'APROVADO COM RESSALVA', color: 'bg-orange-100 text-orange-700', icon: <AlertTriangle size={16} /> };
        }
        return { label: 'PENDENTE ANÁLISE', color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={16} /> };
    };

    const stats = useMemo(() => {
        // Estatísticas globais (independente da aba)
        const pending = pgmAmendments.filter(a => !a.checklist?.step4 && a.pgmDecision !== 'rejected').length;
        const approved = pgmAmendments.filter(a => a.checklist?.step4 === 'approved').length;
        const rejected = pgmAmendments.filter(a => a.pgmDecision === 'rejected').length;
        const withReservation = pgmAmendments.filter(a => a.checklist?.step4 === 'approved_with_reservation').length;
        return { pending, approved, rejected, withReservation, total: pgmAmendments.length };
    }, [pgmAmendments]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Scale size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Despachos PGM</h2>
                        <p className="text-purple-100 text-sm">Análise de Aditivos Contratuais</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-xs text-purple-100 uppercase">Total</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-xs text-yellow-100 uppercase">Pendentes</p>
                        <p className="text-2xl font-bold">{stats.pending}</p>
                    </div>
                    <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-xs text-green-100 uppercase">Aprovados</p>
                        <p className="text-2xl font-bold">{stats.approved}</p>
                    </div>
                    <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-xs text-orange-100 uppercase">Com Ressalva</p>
                        <p className="text-2xl font-bold">{stats.withReservation}</p>
                    </div>
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-xs text-red-100 uppercase">Reprovados</p>
                        <p className="text-2xl font-bold">{stats.rejected}</p>
                    </div>
                </div>
            </div>

            {/* Abas e Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex flex-col space-y-4">
                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-100 rounded-lg self-start">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'pending'
                                ? 'bg-white text-purple-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Clock size={16} />
                            A Analisar
                            {pendingItems.length > 0 && (
                                <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                                    {pendingItems.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'history'
                                ? 'bg-white text-purple-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <CheckCircle2 size={16} />
                            Histórico / Analisados
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 border-t border-slate-100 pt-4">
                        {/* Busca */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por contrato, evento, objeto..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filtro de Status (apenas para histórico) */}
                        {activeTab === 'history' && (
                            <div className="flex items-center gap-2">
                                <Filter className="text-slate-400" size={18} />
                                <select
                                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value as FilterStatus)}
                                >
                                    <option value="all">Todos os Status</option>
                                    <option value="approved">Aprovados</option>
                                    <option value="with_reservation">Com Ressalva</option>
                                    <option value="rejected">Reprovados</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lista de Aditivos */}
            <div className="space-y-3">
                {filteredAmendments.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                        <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-500 font-medium">
                            {searchTerm
                                ? 'Nenhum aditivo encontrado com os filtros aplicados'
                                : activeTab === 'pending'
                                    ? 'Nenhuma análise pendente no momento'
                                    : 'Nenhum histórico de análise encontrado'}
                        </p>
                    </div>
                ) : (
                    filteredAmendments.map(amendment => {
                        const contract = contracts.find(c => String(c.id) === String(amendment.contractId));
                        const statusInfo = getStatusInfo(amendment);

                        return (
                            <div
                                key={amendment.id}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all cursor-pointer group"
                                onClick={() => onEditAmendment(amendment)}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1 space-y-3">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FileText className="text-blue-500" size={18} />
                                                    <span className="font-bold text-slate-800 text-sm">
                                                        {amendment.contractIdentifier || contract?.contractId}
                                                    </span>
                                                    <span className="text-slate-400">•</span>
                                                    <span className="text-xs font-bold text-purple-600 uppercase">
                                                        {amendment.eventName}
                                                    </span>
                                                </div>
                                                <h3 className="text-slate-600 text-sm font-medium line-clamp-1">
                                                    {contract?.supplier} - {contract?.object}
                                                </h3>
                                            </div>
                                            <span className={`${statusInfo.color} px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap`}>
                                                {statusInfo.icon}
                                                {statusInfo.label}
                                            </span>
                                        </div>

                                        {/* Detalhes */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Calendar size={14} className="text-slate-400" />
                                                <span>Entrada: <strong>{amendment.entryDate}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <FileText size={14} className="text-slate-400" />
                                                <span>Tipo: <strong className="uppercase">{amendment.type}</strong></span>
                                            </div>
                                            {amendment.type === 'prazo' && (
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Clock size={14} className="text-slate-400" />
                                                    <span>Prazo: <strong>{amendment.duration} {amendment.durationUnit}(s)</strong></span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Notas do Setor de Contratos */}
                                        {amendment.contractsSectorNotes && (
                                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                                <p className="text-xs font-bold text-blue-700 mb-1 uppercase">Nota para PGM:</p>
                                                <p className="text-sm text-slate-700">{amendment.contractsSectorNotes}</p>
                                            </div>
                                        )}

                                        {/* Notas PGM */}
                                        {amendment.pgmNotes && (
                                            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                                                <p className="text-xs font-bold text-purple-700 mb-1 uppercase">Notas da Análise (Resposta):</p>
                                                <p className="text-sm text-slate-700">{amendment.pgmNotes}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Ação */}
                                    <div className="flex flex-row md:flex-col gap-2 shrink-0 md:w-32">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditAmendment(amendment);
                                            }}
                                            className="flex-1 md:w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium text-sm group-hover:shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <Scale size={16} />
                                            {activeTab === 'pending' ? 'Analisar' : 'Visualizar'}
                                        </button>

                                        {/* Botão de Remover da Análise (Apenas para Pendentes) */}
                                        {activeTab === 'pending' && onRemoveFromAnalysis && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm("Tem certeza que deseja remover este item da análise da PGM?")) {
                                                        onRemoveFromAnalysis(amendment);
                                                    }
                                                }}
                                                className="flex-1 md:w-full px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-all font-medium text-sm flex items-center justify-center gap-2"
                                                title="Remover da lista de análise"
                                            >
                                                <Trash2 size={16} />
                                                Excluir
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

