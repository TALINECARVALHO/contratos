import React, { useState, useMemo } from 'react';
import { Bidding, UserProfile, BiddingModality, BiddingStatus } from '../types';
import { getModalityLabel, getStatusLabel, BiddingModalityLabels, BiddingStatusLabels } from '../services/biddingService';
import { Calendar, Filter, Plus, Edit2, Trash2, FileText, ClipboardList, Search, X } from 'lucide-react';
import { getUserPermissions } from '../utils/permissions';

interface BiddingListProps {
    biddings: Bidding[];
    userProfile: UserProfile | null;
    onNewBidding: () => void;
    onEditBidding: (bidding: Bidding) => void;
    onDeleteBidding: (id: string) => Promise<void>;
    onViewCalendar: () => void;
}

export const BiddingList: React.FC<BiddingListProps> = ({
    biddings,
    userProfile,
    onNewBidding,
    onEditBidding,
    onDeleteBidding,
    onViewCalendar
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<BiddingStatus | 'all'>('all');
    const [filterModality, setFilterModality] = useState<BiddingModality | 'all'>('all');
    const [filterDepartment, setFilterDepartment] = useState<string>('all');
    const [filterYear, setFilterYear] = useState<number | 'all'>('all');

    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin' || userProfile?.role === 'manager';
    const permissions = getUserPermissions(userProfile);
    const canManage = isAdmin || permissions.biddings?.manage === true;

    // Extrair anos únicos
    const uniqueYears = useMemo(() => {
        const years = [...new Set(biddings.map(b => b.year))];
        return years.sort((a, b) => Number(b) - Number(a));
    }, [biddings]);

    // Extrair departamentos únicos
    const uniqueDepartments = useMemo(() => {
        const depts = [...new Set(biddings.map(b => b.department))];
        return depts.sort();
    }, [biddings]);

    // Filter upcoming biddings
    const upcomingBiddings = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return biddings
            .filter(b => {
                if (!b.openingDate) return false;
                const date = new Date(b.openingDate);
                // Adjust for timezone if necessary, but simple comparison works for approx
                return date >= today;
            })
            .sort((a, b) => {
                return new Date(a.openingDate!).getTime() - new Date(b.openingDate!).getTime();
            });
    }, [biddings]);

    const filteredBiddings = useMemo(() => {
        return biddings.filter(bidding => {
            const matchesSearch =
                bidding.biddingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bidding.object.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bidding.processNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bidding.winner?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = filterStatus === 'all' || bidding.status === filterStatus;
            const matchesModality = filterModality === 'all' || bidding.modality === filterModality;
            const matchesDepartment = filterDepartment === 'all' || bidding.department === filterDepartment;
            const matchesYear = filterYear === 'all' || bidding.year === filterYear;

            return matchesSearch && matchesStatus && matchesModality && matchesDepartment && matchesYear;
        });
    }, [biddings, searchTerm, filterStatus, filterModality, filterDepartment, filterYear]);

    const getStatusColor = (status: string): string => {
        const colors: Record<string, string> = {
            em_preparacao: 'bg-gray-100 text-gray-700',
            publicada: 'bg-blue-100 text-blue-700',
            aberta: 'bg-cyan-100 text-cyan-700',
            em_analise: 'bg-yellow-100 text-yellow-700',
            homologada: 'bg-green-100 text-green-700',
            adjudicada: 'bg-emerald-100 text-emerald-700',
            contrato_assinado: 'bg-purple-100 text-purple-700',
            ata_assinada: 'bg-indigo-100 text-indigo-700',
            deserta: 'bg-orange-100 text-orange-700',
            fracassada: 'bg-red-100 text-red-700',
            revogada: 'bg-slate-100 text-slate-700',
            anulada: 'bg-rose-100 text-rose-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const formatCurrency = (value?: number): string => {
        if (!value) return '-';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (date?: string): string => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterStatus('all');
        setFilterModality('all');
        setFilterDepartment('all');
        setFilterYear('all');
    };

    const hasActiveFilters = searchTerm || filterStatus !== 'all' || filterModality !== 'all' || filterDepartment !== 'all' || filterYear !== 'all';

    return (
        <div className="space-y-6">


            {upcomingBiddings.length > 0 && (
                <div className="rounded-t-lg overflow-hidden bg-white shadow-sm mb-6 border border-slate-200">
                    <div className="bg-[#5C6BC0] px-6 py-4 text-white font-bold text-center uppercase tracking-wider text-sm">
                        PRÓXIMAS LICITAÇÕES
                    </div>

                    <div className="p-4 overflow-x-auto">
                        <div className="flex gap-3 min-w-min">
                            {upcomingBiddings.map((bidding) => (
                                <div key={bidding.id} className="flex-none w-64 bg-white rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center">
                                    <div className="p-4 w-full flex-1 flex items-center justify-center">
                                        <p className="text-slate-700 font-bold text-center text-xs uppercase leading-snug line-clamp-3">
                                            {bidding.object}
                                        </p>
                                    </div>

                                    <div className="w-full border-t border-slate-50 py-3 flex flex-col items-center gap-0.5 rounded-b-lg">
                                        <div className="flex items-center gap-2 text-[#5C6BC0] font-bold text-sm">
                                            <Calendar size={14} />
                                            <span>{formatDate(bidding.openingDate)}</span>
                                        </div>
                                        <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">
                                            DATA PREVISTA
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3 text-slate-700">
                    <Filter size={18} />
                    <h3 className="font-semibold">Filtros</h3>

                    {/* Header Controls moved inline */}
                    <div className="ml-auto flex items-center gap-3">
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                <X size={14} />
                                Limpar filtros
                            </button>
                        )}
                        {canManage && (
                            <button
                                onClick={onNewBidding}
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors uppercase shadow-sm"
                            >
                                <Plus size={16} />
                                NOVA LICITAÇÃO
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-3">
                    <div className="flex-1 relative min-w-[300px]">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por número, objeto, processo..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 lg:w-auto">
                        <select
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-w-[140px]"
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value === '' ? 'all' : parseInt(e.target.value))}
                        >
                            <option value="">Todos os anos</option>
                            <option value="2026">2026</option>
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                            {uniqueYears.filter(year => ![2026, 2025, 2024, 2023].includes(year)).map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>

                        <select
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-w-[160px]"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as BiddingStatus | 'all')}
                        >
                            <option value="">Todos os status</option>
                            {Object.entries(BiddingStatusLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>

                        <select
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-w-[180px]"
                            value={filterModality}
                            onChange={(e) => setFilterModality(e.target.value as BiddingModality | 'all')}
                        >
                            <option value="">Todas as modalidades</option>
                            {Object.entries(BiddingModalityLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-3">
                    <select
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                    >
                        <option value="all">Todas as secretarias</option>
                        {uniqueDepartments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Mod.</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Licitação</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Objeto</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Secretaria</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Posição Atual</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Responsável</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Prazo</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Data Sessão</th>
                                {isAdmin && <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase whitespace-nowrap sticky right-0 bg-slate-50">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredBiddings.length === 0 ? (
                                <tr key="empty-row">
                                    <td colSpan={isAdmin ? 9 : 8} className="px-4 py-8 text-center text-slate-500">
                                        {hasActiveFilters ? 'Nenhuma licitação encontrada com os filtros aplicados' : 'Nenhuma licitação cadastrada'}
                                    </td>
                                </tr>
                            ) : (
                                filteredBiddings.map(bidding => {
                                    const daysElapsed = bidding.entryDate ? Math.floor((new Date().getTime() - new Date(bidding.entryDate).getTime()) / (1000 * 60 * 60 * 24)) : '-';

                                    return (
                                        <tr key={bidding.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                                {getModalityLabel(bidding.modality)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap font-medium">
                                                {bidding.biddingId}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700 min-w-[200px]">
                                                <p className="line-clamp-2" title={bidding.object}>{bidding.object}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                                {bidding.department}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bidding.status)}`}>
                                                    {getStatusLabel(bidding.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                                {bidding.currentResponsible || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                                {formatDate(bidding.deadline)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                                {formatDate(bidding.openingDate)}
                                            </td>
                                            {isAdmin && (
                                                <td className="px-4 py-3 whitespace-nowrap sticky right-0 bg-white/50 backdrop-blur-sm border-l border-slate-100">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => onEditBidding(bidding)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        {userProfile?.role === 'super_admin' && (
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm(`Tem certeza que deseja excluir a licitação ${bidding.biddingId}?`)) {
                                                                        onDeleteBidding(bidding.id);
                                                                    }
                                                                }}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                title="Excluir"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};
