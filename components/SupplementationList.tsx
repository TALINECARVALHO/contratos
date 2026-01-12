import React, { useState } from 'react';
import { SupplementationRequest, UserProfile } from '../types';
import { Plus, Edit2, Trash2, Search, TrendingUp, FileText } from 'lucide-react';
import { SupplementationDetailsModal } from './SupplementationDetailsModal';
import { getUserPermissions } from '../utils/permissions';

interface SupplementationListProps {
    supplementations: SupplementationRequest[];
    userProfile: UserProfile | null;
    onNew: () => void;
    onEdit: (data: SupplementationRequest) => void;
    onDelete: (id: string) => void;
    onUpdate?: () => void;
}

export const SupplementationList: React.FC<SupplementationListProps> = ({
    supplementations,
    userProfile,
    onNew,
    onEdit,
    onDelete,
    onUpdate
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<SupplementationRequest | null>(null);

    const perms = getUserPermissions(userProfile);
    const canManage = perms.supplementation?.manage;
    const canCreate = perms.supplementation?.view;

    const normalizeText = (text: string) => {
        return text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
    };

    const filteredItems = supplementations.filter(item => {
        const matchesSearch = item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.responsible_name.toLowerCase().includes(searchTerm.toLowerCase());

        // Improved Department Filter with Normalization
        const userDeptNormalized = normalizeText(userProfile?.department || '');
        const itemDeptNormalized = normalizeText(item.department || '');

        const matchesDept = canManage ? true : (userDeptNormalized ? itemDeptNormalized === userDeptNormalized : true);

        return matchesSearch && matchesDept;
    });

    const formatCurrency = (val: number | undefined) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">Aprovado</span>;
            case 'published': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">Decreto Finalizado</span>;
            case 'rejected': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-semibold">Rejeitado</span>;
            default: return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">Pendente</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar solicitações..."
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
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Secretaria</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Responsável</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Adição (R$)</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Redução (R$)</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Decreto</th>
                                {canManage && <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={canManage ? 8 : 7} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                                <TrendingUp className="text-slate-400" size={24} />
                                            </div>
                                            <p>Nenhuma solicitação encontrada</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800 max-w-xs truncate" title={item.department}>{item.department}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{item.responsible_name}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-green-600">{formatCurrency(item.total_addition)}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-red-600">{formatCurrency(item.total_reduction)}</td>
                                        <td className="px-6 py-4 text-left">{getStatusBadge(item.status)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-semibold">{item.decree_number || '-'}</td>
                                        {canManage && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedRequest(item)}
                                                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title={canManage ? "Gerenciar" : "Visualizar"}
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

            {selectedRequest && (
                <SupplementationDetailsModal
                    request={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    onUpdate={() => {
                        setSelectedRequest(null);
                        onUpdate && onUpdate();
                    }}
                    canManage={canManage || false}
                    onEdit={canManage ? onEdit : undefined}
                />
            )}
        </div>
    );
};
