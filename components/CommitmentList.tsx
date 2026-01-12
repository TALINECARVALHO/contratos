import React, { useState } from 'react';
import { Commitment, Contract, UserProfile } from '../types';
import { Plus, Edit2, Trash2, Search, FileText } from 'lucide-react';

interface CommitmentListProps {
    commitments: Commitment[];
    contracts: Contract[];
    userProfile: UserProfile | null;
    onNewCommitment: () => void;
    onEditCommitment: (commitment: Commitment) => void;
    onDeleteCommitment: (id: string) => void;
}

export const CommitmentList: React.FC<CommitmentListProps> = ({
    commitments,
    contracts,
    userProfile,
    onNewCommitment,
    onEditCommitment,
    onDeleteCommitment
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const getContractInfo = (contractId: string) => {
        const contract = contracts.find(c => c.id === contractId);
        return contract ? `${contract.contractId} - ${contract.supplier}` : 'Contrato Desconhecido';
    };

    const filteredCommitments = commitments.filter(c =>
        c.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getContractInfo(c.contractId).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">Pago</span>;
            case 'cancelled': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-semibold">Cancelado</span>;
            default: return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">Pendente</span>;
        }
    };

    const canEdit = userProfile?.role !== 'user';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar empenhos..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {canEdit && (
                    <button
                        onClick={onNewCommitment}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus size={20} /> Novo Empenho
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Número</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Contrato</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Descrição</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Valor</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Data Emissão</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                                {canEdit && <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCommitments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                                <FileText className="text-slate-400" size={24} />
                                            </div>
                                            <p>Nenhum empenho encontrado</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCommitments.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-800">{item.number}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{getContractInfo(item.contractId)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={item.description}>{item.description}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{formatCurrency(item.value)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(item.issueDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                                        {canEdit && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => onEditCommitment(item)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteCommitment(item.id)}
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
