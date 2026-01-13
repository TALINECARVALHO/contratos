import React, { useState, useMemo } from 'react';
import { Contract, ContractAmendment, UserProfile } from '../types';
import { RefreshCw, Calendar, ArrowRight, FileText, Search, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { addDurationToDate } from '../services/dateUtils';

interface AmendmentListProps {
    contracts: Contract[];
    amendments: ContractAmendment[];
    onEditContract: (contract: Contract) => void;
    userProfile: UserProfile | null;
}

export const AmendmentList: React.FC<AmendmentListProps> = ({ contracts, amendments, onEditContract, userProfile }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');

    // 1. Process valid amendments (ignoring concluded/cancelled and ensuring contract exists)
    const validAmendments = useMemo(() => {
        return amendments.filter(a => {
            const s = (a.status || '').toUpperCase();
            return s !== 'CONCLUÍDO' && s !== 'CANCELADO';
        })
            .map(a => {
                const contract = contracts.find(c => String(c.id) === String(a.contractId));
                return { ...a, contract: contract };
            });
    }, [amendments, contracts]);

    // 2. Compute counts for tabs
    const counts = useMemo(() => {
        return validAmendments.reduce((acc, curr) => {
            const s = (curr.status || '').toUpperCase();

            acc.ALL++;

            if (s.includes('ELABORANDO')) acc.DRAFT++;
            else if (s.includes('PGM') || s.includes('AJUSTES')) acc.PGM++;
            else if (s.includes('FORNECEDOR') || s.includes('ENVIAR PARA ASSINATURA')) acc.SUPPLIER++;
            else if (s.includes('PREFEITO') || s.includes('PUBLICAÇÃO')) acc.FINAL++;
            else acc.OTHERS++; // Fallback

            return acc;
        }, { ALL: 0, DRAFT: 0, PGM: 0, SUPPLIER: 0, FINAL: 0, OTHERS: 0 });
    }, [validAmendments]);

    // 3. Filter by Tab AND Search
    const filteredAmendments = useMemo(() => {
        return validAmendments.filter(item => {
            // Tab Filter logic
            const s = (item.status || '').toUpperCase();
            let matchesTab = false;

            if (activeTab === 'ALL') matchesTab = true;
            else if (activeTab === 'DRAFT') matchesTab = s.includes('ELABORANDO');
            else if (activeTab === 'PGM') matchesTab = s.includes('PGM') || s.includes('AJUSTES');
            else if (activeTab === 'SUPPLIER') matchesTab = s.includes('FORNECEDOR') || s.includes('ENVIAR PARA ASSINATURA');
            else if (activeTab === 'FINAL') matchesTab = s.includes('PREFEITO') || s.includes('PUBLICAÇÃO');

            if (!matchesTab) return false;

            // Search Filter logic
            if (!searchTerm) return true;
            const search = searchTerm.toLowerCase();
            const eventName = item.eventName || '';
            const contractId = item.contract?.contractId || '';
            const supplier = item.contract?.supplier || '';
            const status = item.status || '';
            const dept = item.contract?.department || '';

            return (
                eventName.toLowerCase().includes(search) ||
                contractId.toLowerCase().includes(search) ||
                supplier.toLowerCase().includes(search) ||
                status.toLowerCase().includes(search) ||
                dept.toLowerCase().includes(search)
            );
        }).sort((a, b) => b.created_at?.localeCompare(a.created_at || '') || 0);
    }, [validAmendments, activeTab, searchTerm]);

    const getStatusColor = (status: string) => {
        if (status.includes('ASSINADO PELO FORNECEDOR')) return 'bg-green-100 text-green-800 border-green-200';
        if (status.includes('ENVIADO PARA FORNECEDOR')) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (status.includes('PGM')) return 'bg-purple-100 text-purple-800 border-purple-200';
        if (status.includes('PUBLICAÇÃO')) return 'bg-amber-100 text-amber-800 border-amber-200';
        if (status.includes('PREFEITO')) return 'bg-cyan-100 text-cyan-800 border-cyan-200';
        return 'bg-slate-100 text-slate-800 border-slate-200';
    };

    const tabs = [
        { id: 'ALL', label: 'Todos', count: counts.ALL },
        { id: 'DRAFT', label: 'Elaboração', count: counts.DRAFT },
        { id: 'PGM', label: 'Análise PGM', count: counts.PGM },
        { id: 'SUPPLIER', label: 'Assinatura Fornecedor', count: counts.SUPPLIER },
        { id: 'FINAL', label: 'Fase Final', count: counts.FINAL },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="bg-white border-b border-slate-100 flex flex-col">
                {/* Header & Search */}
                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <RefreshCw size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 uppercase">Aditivos em Andamento</h2>
                            <p className="text-xs text-slate-500 font-medium">Monitoramento de processos de alteração contratual</p>
                        </div>
                    </div>

                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por contrato, fornecedor..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tabs - Segmented Control Style */}
                <div className="px-4 pb-4">
                    <div className="bg-slate-100 p-1 rounded-lg inline-flex flex-wrap gap-1">
                        {tabs.map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${isActive
                                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                        }`}
                                >
                                    {tab.label}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="overflow-auto flex-1 custom-scrollbar p-4">
                {filteredAmendments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <CheckCircle2 size={48} className="mb-3 opacity-20" />
                        <p className="font-medium">Nenhum aditivo encontrado nesta etapa.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAmendments.map((amendment) => (
                            <div key={amendment.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow relative group">
                                <div className="absolute top-4 right-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase ${getStatusColor(amendment.status)}`}>
                                        {amendment.status}
                                    </span>
                                </div>

                                <div className="mb-4 pr-24">
                                    <h3 className="font-bold text-slate-800 text-sm">{amendment.contract?.contractId || 'Contrato Desconhecido'}</h3>
                                    <p className="text-xs text-slate-500 font-medium truncate">{amendment.contract?.supplier}</p>
                                    <p className="text-[10px] text-slate-400 uppercase mt-1">{amendment.contract?.department}</p>
                                </div>

                                <div className="space-y-3 pt-3 border-t border-slate-100">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                                            <span className={`w-1.5 h-1.5 rounded-full ${amendment.type === 'prazo' ? 'bg-teal-500' : 'bg-amber-500'}`} />
                                            {amendment.eventName} ({amendment.type === 'prazo' ? 'Prazo' : 'Valor'})
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-500">
                                            <Calendar size={12} /> {amendment.entryDate}
                                        </div>
                                    </div>

                                    {amendment.type === 'prazo' && (
                                        <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 mb-1">
                                                <span>Vigência Anterior</span>
                                                <span>Nova Vigência</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs font-bold">
                                                <span className="text-slate-700">{amendment.contract?.endDate}</span>
                                                <ArrowRight size={12} className="text-slate-400" />
                                                <span className="text-teal-600">
                                                    {amendment.contract?.endDate && addDurationToDate(amendment.contract.endDate, amendment.duration, amendment.durationUnit)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {amendment.type === 'valor' && (
                                        <div className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center gap-2 text-xs font-bold text-amber-700">
                                            <span>+ R$ {amendment.duration.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}

                                </div>

                                <button
                                    onClick={() => amendment.contract && onEditContract(amendment.contract)}
                                    className="w-full mt-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 text-xs font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <FileText size={14} /> Gerenciar Aditivo
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
