import React, { useState } from 'react';
import { PurchaseRequest, UserProfile } from '../types';
import { Plus, Edit2, Trash2, Search, Filter, Briefcase, AlertTriangle, X } from 'lucide-react';
import { getUserPermissions } from '../utils/permissions';

interface PurchaseRequestListProps {
    requests: PurchaseRequest[];
    userProfile: UserProfile | null;
    onNew: () => void;

    onEdit: (data: PurchaseRequest) => void;
    onManage: (data: PurchaseRequest) => void;
    onDelete: (id: string) => void;
}

export const PurchaseRequestList: React.FC<PurchaseRequestListProps> = ({
    requests,
    userProfile,
    onNew,

    onEdit,
    onManage,
    onDelete
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; number: string } | null>(null);

    const perms = getUserPermissions(userProfile);
    const isManager = userProfile?.role === 'admin' || userProfile?.role === 'super_admin' || userProfile?.role === 'manager';
    const canManage = isManager || perms.purchase_request?.manage;
    const canCreate = perms.purchase_request?.view;

    // Helper for robust comparison
    const normalizeText = (text: string) => {
        return text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
    };

    // Enforce department filter if not a manager
    const effectiveFilterDepartment = canManage ? filterDepartment : (userProfile?.department || '');

    const filteredItems = requests.filter(item => {
        const matchesSearch =
            item.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.orderNumber && item.orderNumber.includes(searchTerm)) ||
            (item.commitmentNumber && item.commitmentNumber.includes(searchTerm));

        // Improved Department Filter with Normalization
        const userDeptNormalized = normalizeText(userProfile?.department || '');
        const itemDeptNormalized = normalizeText(item.department || '');
        const filterDeptNormalized = normalizeText(filterDepartment);

        let matchesDept = true;

        if (canManage) {
            // Manager: If filter selected, match it. Else show all.
            if (filterDepartment) {
                matchesDept = itemDeptNormalized === filterDeptNormalized;
            }
        } else {
            // Regular User: Match own department
            matchesDept = userDeptNormalized ? itemDeptNormalized === userDeptNormalized : true;
        }

        return matchesSearch && matchesDept;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'committed': return 'bg-green-100 text-green-800 border-green-200';
            case 'ordered': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const departments = Array.from(new Set(requests.map(r => r.department)));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-1 gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por Nº Pedido, Ordem, Empenho..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Optional Department Filter - Show only if manager */}
                    {canManage && (
                        <select
                            className="hidden md:block w-64 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                        >
                            <option value="">Todas as Secretarias</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    )}
                </div>

                {/* Mobile only filter */}
                <select
                    className="md:hidden w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                >
                    <option value="">Todas as Secretarias</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                {canCreate && (
                    <button
                        onClick={onNew}
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
                    >
                        <Plus size={20} /> Nova Solicitação
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                                <th className="px-4 py-3">Data de Solicitação</th>
                                <th className="px-4 py-3">Secretaria</th>
                                <th className="px-4 py-3">Nº Pedido</th>
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3">Objeto</th>
                                <th className="px-4 py-3 bg-blue-50 text-blue-800">Ordem de Compra</th>
                                <th className="px-4 py-3 bg-green-50 text-green-800">Empenho</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={canManage ? 7 : 6} className="px-6 py-12 text-center text-slate-500">
                                        Nenhuma solicitação encontrada.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => {
                                    const isOwner = userProfile?.id === item.requester_id;
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-slate-600">
                                                {new Date(item.date).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{item.department}</td>
                                            <td className="px-4 py-3 text-slate-700">{item.number}</td>
                                            <td className="px-4 py-3 text-slate-600">{item.type}</td>
                                            <td className="px-4 py-3 text-slate-600 truncate max-w-xs" title={item.object}>{item.object || '-'}</td>

                                            <td className="px-4 py-3 bg-blue-50/50 font-mono text-blue-700 font-medium">
                                                {(() => {
                                                    const orders = item.orders || [];
                                                    if (item.status === 'rejected') return <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-bold">Reprovado</span>;
                                                    if (orders.length > 1) return <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Vários</span>;
                                                    if (orders.length === 1) return orders[0].number;
                                                    return '-';
                                                })()}
                                            </td>
                                            <td className="px-4 py-3 bg-green-50/50 font-mono text-green-700 font-medium">
                                                {(() => {
                                                    const orders = item.orders || [];
                                                    const hasRejection = orders.some(o => o.commitmentRejectionReason);
                                                    const validCommitments = orders.filter(o => o.commitmentNumber);

                                                    if (hasRejection) return <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-bold">Reprovado</span>;
                                                    if (validCommitments.length > 1) return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Vários</span>;
                                                    if (validCommitments.length === 1) return validCommitments[0].commitmentNumber;
                                                    return '-';
                                                })()}
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {(!canManage || isOwner) && (
                                                        <button
                                                            onClick={() => onEdit(item)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                            title="Editar/Progredir"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    )}
                                                    {/* Botão de Gestão (Manager Only) */}
                                                    {canManage && (
                                                        <button
                                                            onClick={() => onManage(item)}
                                                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                            title="Gerir (Ordens/Empenhos)"
                                                        >
                                                            <Briefcase size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setDeleteConfirmation({ id: item.id, number: item.number })}
                                                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}

                        </tbody >
                    </table >
                </div >
            </div >
            {/* Modal de Confirmação de Exclusão */}
            {deleteConfirmation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <AlertTriangle className="text-red-500" />
                                Confirmar Exclusão
                            </h3>
                            <button
                                onClick={() => setDeleteConfirmation(null)}
                                className="text-slate-500 hover:text-slate-700"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <p className="text-slate-600 mb-6">
                            Tem certeza que deseja excluir a solicitação <strong>{deleteConfirmation.number}</strong>?<br />
                            Esta ação não pode ser desfeita.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirmation(null)}
                                className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    onDelete(deleteConfirmation.id);
                                    setDeleteConfirmation(null);
                                }}
                                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
                            >
                                Excluir Solicitação
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};
