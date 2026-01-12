import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Edit2, Trash2, Search, Droplets, Zap, Lightbulb, FileText,
    AlertTriangle, Phone, LayoutGrid, List, Home, Settings2, BarChart2
} from 'lucide-react';
import { UtilityBill, UserProfile, UtilityCommitment, UtilityUnit, DynamicSetting } from '../types';
import { getUtilityStats } from '../services/utilityBillService';
import { getUserPermissions } from '../utils/permissions';

interface UtilityBillListProps {
    bills: UtilityBill[];
    userProfile: UserProfile | null;
    onNew: () => void;
    onEdit: (data: UtilityBill) => void;
    onDelete: (id: string) => void;
    onManageUnit: (unit: UtilityUnit | null) => void;
    onManageCommitment: (commitment: UtilityCommitment | null) => void;
    onRefresh: () => void;
    commitments: UtilityCommitment[];
    units: UtilityUnit[];
    departments: DynamicSetting[];
    onDeleteCommitment: (id: string) => void;
    onDeleteUnit: (id: string) => void;
}

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const MatrixCell: React.FC<{ value: number }> = ({ value }) => {
    return (
        <td className={`px-1 py-3 text-xs text-center border-r border-slate-50 min-w-[70px] ${value > 0 ? 'font-bold text-slate-900' : 'text-slate-300'}`}>
            {value > 0 ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'}
        </td>
    );
};

const UtilityBillList: React.FC<UtilityBillListProps> = ({
    bills,
    userProfile,
    onNew,
    onEdit,
    onDelete,
    onManageUnit,
    onManageCommitment,
    onRefresh,
    commitments,
    units,
    departments,
    onDeleteCommitment,
    onDeleteUnit
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [serviceFilter, setServiceFilter] = useState<'all' | 'certel' | 'rge' | 'corsan' | 'oi'>('all');
    const [departmentFilter, setDepartmentFilter] = useState('all');

    const perms = getUserPermissions(userProfile);
    const isManager = userProfile?.role === 'admin' || userProfile?.role === 'super_admin' || userProfile?.role === 'manager';
    const canManage = isManager || perms.utility_bills?.manage;
    const canView = perms.utility_bills?.view;

    // Enforce department filter if not a manager
    const effectiveFilterDepartment = canManage ? departmentFilter : (userProfile?.department || 'all');

    const currentYearMonths = useMemo(() => {
        const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
        const months = [];
        const year = new Date().getFullYear();
        for (let i = 1; i <= 12; i++) {
            const m = i.toString().padStart(2, '0');
            months.push({
                label: monthNames[i - 1],
                ref: `${m}/${year}`
            });
        }
        return months;
    }, []);

    const normalizeRef = (ref: string) => {
        if (!ref) return '';
        const trimmedRef = ref.trim();
        const parts = trimmedRef.split('/');
        if (parts.length !== 2) return trimmedRef;
        const month = parts[0].trim().padStart(2, '0');
        const yearSegment = parts[1].trim();
        const year = yearSegment.length === 2 ? `20${yearSegment}` : yearSegment;
        return `${month}/${year}`;
    };

    const stats = getUtilityStats(bills, commitments);

    const filteredBills = (bills || []).filter(item => {
        const matchesSearch = ((item.localName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.consumerUnit || '').toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesService = serviceFilter === 'all' || item.company.toLowerCase().includes(serviceFilter);

        // Find unit to get department
        const unit = units.find(u => (u.consumerUnit || '').trim() === (item.consumerUnit || '').trim());
        const matchesDept = effectiveFilterDepartment === 'all' || unit?.department === effectiveFilterDepartment;

        return matchesSearch && matchesService && matchesDept;
    }).sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return dateB - dateA;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">Pago</span>;
            default: return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">Pendente</span>;
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'water': return <Droplets className="text-blue-500" size={20} />;
            case 'phone': return <Phone className="text-emerald-500" size={20} />;
            default: return <Zap className="text-yellow-500" size={20} />;
        }
    };

    const [activeTab, setActiveTab] = useState<'recent' | 'commitments' | 'control'>('recent');
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; id: string | null; type: 'commitment' | 'unit' }>({ isOpen: false, id: null, type: 'commitment' });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar imóvel..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                        <select
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value as any)}
                            className="flex-1 md:w-40 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 h-[38px] shadow-sm"
                        >
                            <option value="all">Todas Empresas</option>
                            <option value="certel">Certel</option>
                            <option value="rge">RGE</option>
                            <option value="corsan">Corsan</option>
                            <option value="oi">Oi</option>
                        </select>
                        {canManage && (
                            <select
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                                className="flex-1 md:w-52 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 h-[38px] shadow-sm"
                            >
                                <option value="all">Todas as Secretarias</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                                ))}
                            </select>
                        )}
                        <div className="flex gap-2">
                            {canView && (
                                <button
                                    onClick={onNew}
                                    className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors h-[38px] flex items-center gap-2 text-xs font-bold shadow-sm"
                                >
                                    <Plus size={16} /> NOVA FATURA
                                </button>
                            )}
                            {canManage && (
                                <>
                                    <button
                                        onClick={() => onManageUnit(null)}
                                        className="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors h-[38px] flex items-center gap-2 text-xs font-bold shadow-sm"
                                    >
                                        <Home size={16} /> NOVO IMÓVEL
                                    </button>
                                    <button
                                        onClick={() => onManageCommitment(null)}
                                        className="bg-violet-600 text-white px-3 py-2 rounded-lg hover:bg-violet-700 transition-colors h-[38px] flex items-center gap-2 text-xs font-bold shadow-sm"
                                    >
                                        <FileText size={16} /> NOVO EMPENHO
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto border-b border-slate-200 gap-6 px-2">
                    <button
                        onClick={() => setActiveTab('commitments')}
                        className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'commitments' ? 'text-violet-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <FileText size={18} />
                            Empenhos
                        </div>
                        {activeTab === 'commitments' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('recent')}
                        className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'recent' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <List size={18} />
                            Lançamentos Recentes
                        </div>
                        {activeTab === 'recent' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('control')}
                        className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'control' ? 'text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <BarChart2 size={18} />
                            Controle Mensal
                        </div>
                        {activeTab === 'control' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 rounded-t-full"></div>}
                    </button>
                </div>
            </div>

            {/* Tab Content: Controle Mensal (Checklist + Matrix) */}
            {activeTab === 'control' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Operational Checklist - Bills Tracking - HIDDEN PER USER REQUEST
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-slate-200">
                           ...
                        </div>
                        <div className="p-6">
                           ...
                        </div>
                    </div>
                    */}

                    {/* Matrix Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <BarChart2 className="text-blue-600" size={20} />
                                Planilha Mestre de Consumo ({new Date().getFullYear()})
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase w-96 sticky left-0 bg-slate-50 z-10">Local</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase w-32 border-r border-slate-100">Código do Imóvel</th>
                                        {currentYearMonths.map(m => (
                                            <th key={m.ref} className="px-1 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">{m.label}</th>
                                        ))}
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right w-32">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(() => {
                                        // Create a Map of all units from the registry
                                        const registryMap = new Map((units || []).map(u => [u.consumerUnit.trim(), u]));

                                        // Find units that only exist in bills
                                        const billUnits = (bills || []).reduce((acc: UtilityUnit[], b) => {
                                            const cUnit = (b.consumerUnit || '').trim();
                                            if (cUnit && !registryMap.has(cUnit) && !acc.find(u => u.consumerUnit === cUnit)) {
                                                acc.push({
                                                    id: `temp-${cUnit}`,
                                                    consumerUnit: cUnit,
                                                    localName: b.localName || 'Sem Local Georreferenciado',
                                                    type: b.type,
                                                    company: b.company,
                                                    department: 'all'
                                                } as UtilityUnit);
                                            }
                                            return acc;
                                        }, []);

                                        // Unified list
                                        const allUnits = [...(units || []), ...billUnits];

                                        return allUnits.filter(u => {
                                            const matchesSearch = (u.localName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                (u.consumerUnit || '').toLowerCase().includes(searchTerm.toLowerCase());
                                            const matchesService = serviceFilter === 'all' || u.company.toLowerCase().includes(serviceFilter);
                                            const matchesDept = departmentFilter === 'all' || u.department === departmentFilter;
                                            return matchesSearch && matchesService && matchesDept;
                                        }).map(unit => {
                                            const unitBills = (bills || []).filter(b => (b.consumerUnit || '').trim() === (unit.consumerUnit || '').trim());
                                            let totalPeriod = 0;

                                            return (
                                                <tr key={unit.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-4 py-3 text-sm font-semibold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                                        <div className="flex items-center justify-between gap-2 overflow-hidden">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className="shrink-0">{getIcon(unit.type)}</div>
                                                                <span className={`truncate ${unit.id.startsWith('temp-') ? 'text-orange-600 italic' : ''}`} title={unit.localName}>
                                                                    {unit.localName}
                                                                </span>
                                                            </div>
                                                            {canManage && (
                                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                                    <button onClick={() => onManageUnit(unit.id.startsWith('temp-') ? null : unit)} className="p-1 text-slate-400 hover:text-blue-600 transition-colors" title="Editar Imóvel"><Settings2 size={14} /></button>
                                                                    {!unit.id.startsWith('temp-') && (
                                                                        <button
                                                                            onClick={() => setDeleteConfirmation({ isOpen: true, id: unit.id, type: 'unit' })}
                                                                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                                                            title="Excluir Imóvel"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-500 font-mono border-r border-slate-100">{unit.consumerUnit}</td>
                                                    {currentYearMonths.map(m => {
                                                        const monthBills = unitBills.filter(b => normalizeRef(b.referenceMonth) === m.ref);
                                                        const val = monthBills.reduce((acc, b) => acc + (b.value || 0), 0);
                                                        totalPeriod += val;
                                                        return (
                                                            <MatrixCell
                                                                key={m.ref}
                                                                value={val}
                                                            />
                                                        );
                                                    })}
                                                    <td className="px-4 py-3 text-sm font-bold text-blue-600 text-right bg-slate-50/30">{formatCurrency(totalPeriod)}</td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Content: Empenhos */}
            {activeTab === 'commitments' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <FileText className="text-violet-600" size={20} />
                            Empenhos Globais
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Empenho</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Tipo</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Secretaria / Dotação</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Valor Total</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Saldo</th>
                                    {canManage && <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(() => {
                                    const filteredCommitments = (commitments || []).filter(c =>
                                        (departmentFilter === 'all' || c.department === departmentFilter) &&
                                        (serviceFilter === 'all' || getIcon(c.type)) // Rough check
                                    );

                                    if (filteredCommitments.length === 0) {
                                        return <tr><td colSpan={canManage ? 6 : 5} className="px-6 py-8 text-center text-slate-500 text-sm">Nenhum empenho encontrado.</td></tr>;
                                    }

                                    return filteredCommitments.map(commitment => {
                                        const commitmentBills = (bills || []).filter(b => b.commitment_id === commitment.id);
                                        const used = commitmentBills.reduce((acc, b) => acc + (b.value || 0), 0);
                                        const balance = commitment.totalValue - used;
                                        const percentageUsed = (used / commitment.totalValue) * 100;

                                        return (
                                            <tr key={commitment.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-3">
                                                    <div className="font-bold text-slate-800">{commitment.number}</div>
                                                    <div className="text-[10px] text-slate-400">ID: {commitment.id.slice(0, 8)}</div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {getIcon(commitment.type)}
                                                        <span className="text-sm text-slate-600 capitalize">{commitment.type === 'light' ? 'Luz' : commitment.type === 'water' ? 'Água' : 'Telefone'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="text-sm font-medium text-slate-700">{commitment.department}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{commitment.dotation || 'Sem dotação'}</div>
                                                </td>
                                                <td className="px-6 py-3 text-right text-sm font-bold text-slate-800">
                                                    {formatCurrency(commitment.totalValue)}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className={`text-sm font-bold ${balance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                            {formatCurrency(balance)}
                                                        </span>
                                                        <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                                                            <div
                                                                className={`h-full rounded-full ${percentageUsed > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                {canManage && (
                                                    <td className="px-6 py-3 text-right">
                                                        <button
                                                            onClick={() => onManageCommitment(commitment)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                            title="Ver Detalhes e Histórico"
                                                        >
                                                            <FileText size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirmation({ isOpen: true, id: commitment.id, type: 'commitment' })}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                            title="Excluir Empenho"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab Content: Recentes */}
            {activeTab === 'recent' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <List size={20} className="text-blue-600" />
                            Lançamentos Recentes
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Tipo</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Local</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Referência</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Vencimento</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Valor</th>
                                    {canManage && <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Ações</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredBills.length === 0 ? (
                                    <tr><td colSpan={canManage ? 6 : 5} className="px-6 py-12 text-center text-slate-500">Nenhum lançamento encontrado</td></tr>
                                ) : (
                                    filteredBills.slice(0, 15).map((item) => {
                                        const unit = (units || []).find(u => (u.consumerUnit || '').trim() === (item.consumerUnit || '').trim());
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">{getIcon(item.type)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-slate-800">{unit?.localName || item.localName}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">{item.consumerUnit}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{item.referenceMonth}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{new Date(item.dueDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(item.value)}</td>
                                                {canManage && (
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => onEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                                                            <button onClick={() => onDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
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
            )}
            {/* Delete Confirmation Modal */}
            {deleteConfirmation.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70] backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                        <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                {deleteConfirmation.type === 'commitment' ? 'Excluir Empenho' : 'Excluir Imóvel'}
                            </h3>
                            <p className="text-slate-600">
                                {deleteConfirmation.type === 'commitment'
                                    ? 'Tem certeza que deseja excluir este empenho global? Esta ação não pode ser desfeita.'
                                    : 'Tem certeza que deseja excluir este imóvel? O histórico de consumo será mantido apenas como registro.'}
                            </p>
                        </div>
                        <div className="p-4 bg-white flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirmation({ isOpen: false, id: null, type: 'commitment' })}
                                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (deleteConfirmation.id) {
                                        if (deleteConfirmation.type === 'commitment') {
                                            onDeleteCommitment(deleteConfirmation.id);
                                        } else {
                                            onDeleteUnit(deleteConfirmation.id);
                                        }
                                        setDeleteConfirmation({ isOpen: false, id: null, type: 'commitment' });
                                    }
                                }}
                                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-bold shadow-lg shadow-red-100 transition-all flex items-center gap-2"
                            >
                                <Trash2 size={18} />
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export { UtilityBillList };
