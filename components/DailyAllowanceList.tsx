import React, { useState } from 'react';
import { DailyAllowance, UserProfile } from '../types';
import { Plus, Edit2, Trash2, Search, Briefcase, FileText } from 'lucide-react';
import { getUserPermissions } from '../utils/permissions';

interface DailyAllowanceListProps {
    dailyAllowances: DailyAllowance[];
    userProfile: UserProfile | null;
    onNew: () => void;
    onEdit: (data: DailyAllowance) => void;
    onDelete: (id: string) => void;
    onAccountability: (data: DailyAllowance) => void;
}

export const DailyAllowanceList: React.FC<DailyAllowanceListProps> = ({
    dailyAllowances,
    userProfile,
    onNew,
    onEdit,
    onDelete,
    onAccountability
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const perms = getUserPermissions(userProfile);
    const canManage = perms.daily_allowance?.manage;
    const canCreate = perms.daily_allowance?.view;

    const normalizeText = (text: string) => {
        return text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
    };

    const filteredItems = dailyAllowances.filter(item => {
        const matchesSearch =
            item.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.department.toLowerCase().includes(searchTerm.toLowerCase());

        // Improved Department Filter with Normalization
        const userDeptNormalized = normalizeText(userProfile?.department || '');
        const itemDeptNormalized = normalizeText(item.department || '');

        // If has View permission (canCreate) but NOT Manage, restrict to own department
        // If IS Manager, show all (unless filtered by UI tab/filter if checking that later, but here checks standard permission)
        // Adjusting logic: 'canManage' usually sees all. 'canCreate' (View) only sees own.
        const matchesDept = canManage ? true : (userDeptNormalized ? itemDeptNormalized === userDeptNormalized : true);

        return matchesSearch && matchesDept;
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">Pago</span>;
            case 'committed': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">Empenhado</span>;
            case 'payment_ordered': return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-semibold">Ordem de Pgto</span>;
            case 'accountability_analysis': return <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-semibold">Análise Prestação</span>;
            case 'accountability_approved': return <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full font-semibold">PC Aprovada</span>;
            case 'accountability_rejected': return <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full font-semibold">PC Rejeitada</span>;
            case 'rejected': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-semibold">Rejeitado</span>;
            case 'approved': return <span className="bg-cyan-100 text-cyan-800 text-xs px-2 py-1 rounded-full font-semibold">Aprovado</span>;
            default: return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">Solicitado</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar diárias..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {canCreate && (
                    <button
                        onClick={onNew}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus size={20} /> Nova Solicitação
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Solicitado em</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Beneficiário</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Tipo</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Destino</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Data Saída</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Data Retorno</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Prestação de Contas</th>
                                {canManage && <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={canManage ? 9 : 8} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                                <Briefcase className="text-slate-400" size={24} />
                                            </div>
                                            <p>Nenhuma diária encontrada</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800">{item.beneficiaryName}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {item.type === 'posteriori' ? 'Posterior' : 'Antecipada'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {item.destination || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {item.startDate ? new Date(item.startDate).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {item.endDate ? new Date(item.endDate).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const isEnabled = item.type === 'posteriori' || ['paid', 'accountability_approved', 'accountability_rejected'].includes(item.status);

                                                if (item.status === 'accountability_approved') {
                                                    return (
                                                        <button onClick={() => isEnabled && onAccountability(item)} className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full font-semibold hover:bg-teal-200 transition-colors">
                                                            PC Aprovada
                                                        </button>
                                                    );
                                                }
                                                if (item.status === 'accountability_rejected') {
                                                    return (
                                                        <button onClick={() => isEnabled && onAccountability(item)} className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full font-semibold hover:bg-pink-200 transition-colors">
                                                            PC Rejeitada
                                                        </button>
                                                    );
                                                }
                                                if (item.accountabilityFileUrl) {
                                                    return (
                                                        <button onClick={() => isEnabled && onAccountability(item)} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold hover:bg-blue-200 transition-colors">
                                                            PC Enviada
                                                        </button>
                                                    );
                                                }

                                                if (!isEnabled) {
                                                    return (
                                                        <span className="bg-slate-50 text-slate-400 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 w-fit cursor-not-allowed">
                                                            <Briefcase size={12} /> Aguardando Pago
                                                        </span>
                                                    );
                                                }

                                                return (
                                                    <button onClick={() => onAccountability(item)} className="bg-slate-100 text-slate-800 text-xs px-2 py-1 rounded-full font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1">
                                                        <Briefcase size={12} /> Pendente
                                                    </button>
                                                );
                                            })()}
                                        </td>
                                        {canManage && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => onAccountability(item)}
                                                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="Gerenciar"
                                                    >
                                                        <FileText size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => onEdit(item)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(item.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
