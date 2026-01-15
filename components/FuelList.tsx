import React, { useState } from 'react';
import { FuelRecord, FuelCommitment, UserProfile, DynamicSetting } from '../types';
import { Plus, FileText, TrendingUp, BarChart3 } from 'lucide-react';

interface FuelListProps {
    records: FuelRecord[];
    commitments: FuelCommitment[];
    userProfile: UserProfile | null;
    departments: DynamicSetting[];
    onNewRecord: () => void;
    onEditRecord: (record: FuelRecord) => void;
    onDeleteRecord: (id: string) => void;
    onNewCommitment: () => void;
    onEditCommitment: (commitment: FuelCommitment) => void;
    onDeleteCommitment: (id: string) => void;
}

export const FuelList: React.FC<FuelListProps> = ({
    records,
    commitments,
    userProfile,
    departments,
    onNewRecord,
    onEditRecord,
    onDeleteRecord,
    onNewCommitment,
    onEditCommitment,
    onDeleteCommitment
}) => {
    const [activeTab, setActiveTab] = useState<'records' | 'commitments' | 'reports'>('records');
    const [filterDepartment, setFilterDepartment] = useState('');

    const filteredRecords = records.filter(r =>
        !filterDepartment || r.department === filterDepartment
    );

    const filteredCommitments = commitments.filter(c =>
        !filterDepartment || c.department === filterDepartment
    );

    const totalBalance = commitments.reduce((acc, c) => acc + c.balance, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Gestão de Combustível</h2>
                    <p className="text-slate-600 text-sm">Controle de empenhos e lançamentos mensais</p>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'records' && (
                        <button
                            onClick={onNewRecord}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                        >
                            <Plus size={20} />
                            Novo Lançamento
                        </button>
                    )}
                    {activeTab === 'commitments' && (
                        <button
                            onClick={onNewCommitment}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium"
                        >
                            <Plus size={20} />
                            Novo Empenho
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <FileText className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Total de Lançamentos</p>
                            <p className="text-2xl font-bold text-slate-800">{records.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 rounded-lg">
                            <TrendingUp className="text-emerald-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Saldo Total Disponível</p>
                            <p className="text-2xl font-bold text-emerald-600">
                                {totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <BarChart3 className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Empenhos Ativos</p>
                            <p className="text-2xl font-bold text-slate-800">{commitments.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-slate-200">
                <div className="border-b border-slate-200">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('records')}
                            className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'records'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            Lançamentos Mensais
                        </button>
                        <button
                            onClick={() => setActiveTab('commitments')}
                            className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'commitments'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            Empenhos
                        </button>
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'reports'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            Relatórios
                        </button>
                    </div>
                </div>

                {/* Filter */}
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">Todas as Secretarias</option>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.name}>{dept.name}</option>
                        ))}
                    </select>
                </div>

                {/* Content */}
                <div className="p-4">
                    {activeTab === 'records' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Mês</th>
                                        <th className="px-4 py-3 text-left">Secretaria</th>
                                        <th className="px-4 py-3 text-right">Litros</th>
                                        <th className="px-4 py-3 text-right">Valor</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                                Nenhum lançamento encontrado
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRecords.map(record => (
                                            <tr key={record.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium">{record.reference_month}</td>
                                                <td className="px-4 py-3 text-slate-600">{record.department}</td>
                                                <td className="px-4 py-3 text-right">{record.total_liters.toFixed(2)}L</td>
                                                <td className="px-4 py-3 text-right font-semibold">
                                                    {record.total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'paid'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {record.status === 'paid' ? 'Pago' : 'Pendente'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => onEditRecord(record)}
                                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                    >
                                                        Ver Detalhes
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'commitments' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Número</th>
                                        <th className="px-4 py-3 text-left">Secretaria</th>
                                        <th className="px-4 py-3 text-right">Valor Total</th>
                                        <th className="px-4 py-3 text-right">Saldo</th>
                                        <th className="px-4 py-3 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredCommitments.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                                Nenhum empenho encontrado
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCommitments.map(commitment => (
                                            <tr key={commitment.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium">{commitment.number}</td>
                                                <td className="px-4 py-3 text-slate-600">{commitment.department}</td>
                                                <td className="px-4 py-3 text-right font-semibold">
                                                    {commitment.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={commitment.balance < 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-semibold'}>
                                                        {commitment.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => onEditCommitment(commitment)}
                                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                    >
                                                        Ver Detalhes
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="text-center py-12 text-slate-500">
                            <BarChart3 size={48} className="mx-auto mb-4 text-slate-300" />
                            <p>Relatórios em desenvolvimento</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
